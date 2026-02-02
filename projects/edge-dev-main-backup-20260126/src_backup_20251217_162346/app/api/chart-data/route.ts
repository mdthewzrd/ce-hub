import { NextRequest, NextResponse } from 'next/server';

const POLYGON_API_KEY = 'Fm7brz4s23eSocDErnL68cE7wspz2K1I';

// Timeframe mappings to Polygon API parameters
const TIMEFRAME_CONFIG = {
  '5min': { multiplier: 5, timespan: 'minute', days: 2 },
  '15min': { multiplier: 15, timespan: 'minute', days: 5 },
  'hour': { multiplier: 1, timespan: 'hour', days: 15 },
  'day': { multiplier: 1, timespan: 'day', days: 60 }
} as const;

type Timeframe = keyof typeof TIMEFRAME_CONFIG;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker') || 'SPY';
    const timeframe = (searchParams.get('timeframe') || 'day') as Timeframe;
    const dayOffset = parseInt(searchParams.get('dayOffset') || '0');
    const baseDateStr = searchParams.get('baseDate');

    const config = TIMEFRAME_CONFIG[timeframe];

    // 🔧 CRITICAL FIX: Use scan result date from frontend instead of hardcoded date
    // If baseDate is provided, use it; otherwise use current date as fallback
    let BASE_DATE: Date;
    if (baseDateStr) {
      BASE_DATE = new Date(baseDateStr);
      console.log(`📅 Using scan result date as base: ${baseDateStr}`);
    } else {
      // Fallback to current date if no baseDate provided
      BASE_DATE = new Date();
      console.log(`📅 No baseDate provided, using current date as fallback: ${BASE_DATE.toISOString().split('T')[0]}`);
    }

    // Calculate date range based on timeframe and dayOffset from base date
    const endDate = new Date(BASE_DATE);
    endDate.setDate(endDate.getDate() + dayOffset);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - config.days);

    // Format dates for Polygon API (YYYY-MM-DD)
    const from = startDate.toISOString().split('T')[0];
    let to = endDate.toISOString().split('T')[0];

    // 🔧 CRITICAL FIX: For Day 0, don't fetch future data beyond current time
    if (dayOffset === 0 && timeframe !== 'day') {
      const now = new Date();
      const marketClose = new Date(now);
      marketClose.setHours(16, 0, 0, 0); // 4pm market close in local time

      // If current time is after market close on Day 0, cap at market close
      if (now > marketClose) {
        to = marketClose.toISOString().split('T')[0];
      } else {
        // If current time is before market close, cap at current time
        to = now.toISOString().split('T')[0];
      }
      console.log(`🎯 Day 0 fix: Capped to ${to} to prevent d+1 data`);
    }

    // Build Polygon API URL with extended hours for intraday timeframes
    const includeExtendedHours = timeframe !== 'day';
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${config.multiplier}/${config.timespan}/${from}/${to}?adjusted=true&sort=asc${includeExtendedHours ? '&includeOTC=false' : ''}&apiKey=${POLYGON_API_KEY}`;

    console.log(`📊 Fetching chart data: ${ticker} ${timeframe} from ${from} to ${to}${includeExtendedHours ? ' (extended hours)' : ''}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        error: 'No data available',
        ticker,
        timeframe,
        from,
        to
      }, { status: 404 });
    }

    // 🔧 CRITICAL FIX: Enhanced Day 0 filtering using market calendar utilities
    let filteredResults = data.results;
    if (dayOffset === 0) {
      // Import market calendar utilities for proper ET handling
      const { isTradingDay, getMarketSession } = await import('../../../utils/marketCalendar');

      const baseDateET = new Date(BASE_DATE);
      const targetDateStr = baseDateET.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      const todayStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });

      // Get proper market session for the base date
      const marketSession = getMarketSession(baseDateET);
      const marketCloseTime = marketSession.market_close.getTime();

      console.log(`🔍 Enhanced Day 0 filtering: target=${targetDateStr}, today=${todayStr}, marketCloseET=${marketSession.market_close.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
      console.log(`📅 Market session: ${JSON.stringify({ is_trading_day: marketSession.is_trading_day, session_type: marketSession.session_type })}`);

      const originalLength = filteredResults.length;

      // 🎯 ENHANCED FIX: Use market calendar for precise Day 0 filtering
      filteredResults = data.results.filter((bar: any) => {
        const barTimestamp = bar.t;
        const barDate = new Date(barTimestamp);

        if (timeframe === 'day') {
          // For daily charts, ensure we only include trading days up to the target date
          const barDateET = barDate.toLocaleDateString('en-US', { timeZone: 'America/New_York' });

          // Check if the bar date is on or before the target date
          if (barDateET > targetDateStr) {
            return false; // Filter out future trading days
          }

          // Ensure we only include actual trading days (not weekends/holidays)
          return isTradingDay(barDate);
        } else {
          // For intraday charts, filter by precise market close time
          // Only include data points up to market close on the target date
          return barTimestamp <= marketCloseTime;
        }
      });

      console.log(`🎯 Enhanced Day 0 filtering: ${originalLength} → ${filteredResults.length} bars (removed ${originalLength - filteredResults.length} future/non-trading-day bars)`);

      // Additional verification: ensure we have the correct target date in results
      if (filteredResults.length > 0 && timeframe === 'day') {
        const lastBarDate = new Date(filteredResults[filteredResults.length - 1].t).toLocaleDateString('en-US', { timeZone: 'America/New_York' });
        console.log(`✅ Final verification: Last bar date = ${lastBarDate}, Target = ${targetDateStr}`);

        if (lastBarDate !== targetDateStr) {
          console.warn(`⚠️ WARNING: Last filtered bar (${lastBarDate}) doesn't match target date (${targetDateStr})`);
        }
      }
    }

    // 🔧 CRITICAL FIX: Transform Polygon data with proper ET timezone handling
    // Use direct UTC timestamp with proper ET offset to avoid browser timezone parsing issues
    const chartData = {
      x: filteredResults.map((bar: any) => {
        // Get UTC timestamp from Polygon
        const utcTimestamp = bar.t;
        const utcDate = new Date(utcTimestamp);

        // For daily charts, we want the date at market close (4pm ET)
        // For intraday charts, we keep the exact timestamp
        if (timeframe === 'day') {
          // For daily bars, set to 4pm ET on the trading day
          // This ensures consistent date display regardless of when the bar was generated
          const tradingDate = new Date(utcTimestamp);

          // Extract the trading date in ET
          const etDateString = tradingDate.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });

          // Parse the ET date components and create a consistent ISO string
          const etDateMatch = etDateString.match(/(\d+)\/(\d+)\/(\d+)/);
          if (etDateMatch) {
            const [, month, day, year] = etDateMatch;
            // Create ISO string at 4pm ET (20:00 or 21:00 UTC depending on DST)
            // This prevents browser timezone re-interpretation
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T20:00:00.000Z`;
          }

          // Fallback: use UTC date at market close time
          return utcDate.toISOString().split('T')[0] + 'T20:00:00.000Z';
        } else {
          // For intraday charts, convert UTC timestamp to proper ET-based ISO string
          // This maintains the correct time while preventing browser timezone shifts
          const etDateString = utcDate.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });

          // Convert ET string back to consistent ISO format
          const etDateTimeMatch = etDateString.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/);
          if (etDateTimeMatch) {
            const [, month, day, year, hour, minute, second] = etDateTimeMatch;
            // Convert ET time to UTC by adding appropriate offset
            // This ensures the timestamp represents the correct moment in ET
            const etDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
            return etDate.toISOString();
          }

          // Fallback: use original UTC timestamp
          return utcDate.toISOString();
        }
      }),
      open: filteredResults.map((bar: any) => bar.o),
      high: filteredResults.map((bar: any) => bar.h),
      low: filteredResults.map((bar: any) => bar.l),
      close: filteredResults.map((bar: any) => bar.c),
      volume: filteredResults.map((bar: any) => bar.v)
    };

    console.log(`  Chart data fetched: ${chartData.x.length} bars`);

    return NextResponse.json({
      success: true,
      ticker,
      timeframe,
      from,
      to,
      bars: chartData.x.length,
      data: chartData
    });

  } catch (error) {
    console.error('Chart data API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch chart data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
