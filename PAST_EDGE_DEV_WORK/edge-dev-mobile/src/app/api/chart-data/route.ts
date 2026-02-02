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

    const config = TIMEFRAME_CONFIG[timeframe];

    // Base date: November 1st, 2025 (Day 0 for testing)
    // In production, this will be replaced with the scan result date
    const BASE_DATE = new Date('2025-11-01T00:00:00');

    // Calculate date range based on timeframe and dayOffset from base date
    const endDate = new Date(BASE_DATE);
    endDate.setDate(endDate.getDate() + dayOffset);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - config.days);

    // Format dates for Polygon API (YYYY-MM-DD)
    const from = startDate.toISOString().split('T')[0];
    const to = endDate.toISOString().split('T')[0];

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

    // Transform Polygon data to our chart format
    // Convert timestamps to Eastern Time for proper market session alignment
    const chartData = {
      x: data.results.map((bar: any) => {
        const date = new Date(bar.t);
        // Convert to ET by subtracting 5 hours (EST) or 4 hours (EDT)
        // For simplicity, we'll use toLocaleString with ET timezone
        return date.toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6');
      }),
      open: data.results.map((bar: any) => bar.o),
      high: data.results.map((bar: any) => bar.h),
      low: data.results.map((bar: any) => bar.l),
      close: data.results.map((bar: any) => bar.c),
      volume: data.results.map((bar: any) => bar.v)
    };

    console.log(`✅ Chart data fetched: ${chartData.x.length} bars`);

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
