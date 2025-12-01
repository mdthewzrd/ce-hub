/**
 * Polygon API Data Fetching for Edge.dev Charts
 * Matches wzrd-algo implementation exactly with market calendar integration
 */

import { filterTradingDaysOnly, validateMarketTimestamp } from './marketCalendar';
import { isWithinExtendedHours, utcToMarketTime } from './properMarketCalendar';

const POLYGON_API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"; // Same key as wzrd-algo

export interface PolygonBar {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface PolygonResponse {
  results?: PolygonBar[];
  status: string;
}

/**
 * Get appropriate date range based on timeframe
 */
function getTimeframeDateRange(timeframe: string): number {
  switch (timeframe) {
    case "day": return 60;    // Daily: 60 days
    case "hour": return 15;   // Hourly: 15 days
    case "15min": return 5;   // 15min: 5 days
    case "5min": return 2;    // 5min: 2 days
    case "1min": return 2;    // 1min: 2 days (same as 5min)
    default: return 60;       // Default to daily range
  }
}

export async function fetchPolygonData(
  symbol: string = "SPY",
  timeframe: string = "day",
  daysBack?: number,  // Optional - will auto-calculate based on timeframe if not provided
  lcEndDate?: string  // Optional LC pattern date for dynamic chart loading
): Promise<PolygonBar[] | null> {
  try {
    // Auto-calculate appropriate date range based on timeframe if not explicitly provided
    const effectiveDaysBack = daysBack ?? getTimeframeDateRange(timeframe);

    // For intraday charts, always fetch 1-minute data first for extended hours coverage
    // Then resample to the requested timeframe
    const shouldUseOneMinute = timeframe !== "day";

    // When LC navigation is active, fetch a wider range to ensure consistent data across all navigation days
    let scanDate: Date;
    let endDate: string;
    let startDate: string;

    if (lcEndDate) {
      // For LC navigation: fetch data with LC date as the anchor point
      const lcDate = new Date(lcEndDate + 'T00:00:00');

      // Validate the LC date before proceeding
      if (isNaN(lcDate.getTime())) {
        console.error(`Invalid LC date: ${lcEndDate}. Falling back to standard date range.`);
        // Fallback to standard date handling
        scanDate = new Date('2024-10-25');
        endDate = scanDate.toISOString().split('T')[0];
        startDate = new Date(scanDate.getTime() - (effectiveDaysBack * 24 * 60 * 60 * 1000))
          .toISOString().split('T')[0];
      } else {
        // FIXED: For day navigation, target date IS the end date (rightmost point)
        // This ensures Day 0 ends exactly on the scan date, Day +3 ends 3 days later, etc.
        endDate = lcDate.toISOString().split('T')[0];
        startDate = new Date(lcDate.getTime() - (effectiveDaysBack * 24 * 60 * 60 * 1000))
          .toISOString().split('T')[0];

        console.log(`  DAY NAVIGATION: Target date ${lcEndDate} is END DATE. Range: ${startDate} to ${endDate}`);

        // Additional validation for computed dates
        if (isNaN(new Date(endDate + 'T00:00:00').getTime()) || isNaN(new Date(startDate + 'T00:00:00').getTime())) {
          console.error(`Date calculation error for LC date: ${lcEndDate}. Using fallback dates.`);
          scanDate = new Date('2024-10-25');
          endDate = scanDate.toISOString().split('T')[0];
          startDate = new Date(scanDate.getTime() - (effectiveDaysBack * 24 * 60 * 60 * 1000))
            .toISOString().split('T')[0];
        }
      }

      console.log(`📊 Fetching ${symbol} LC navigation data: ${startDate} to ${endDate} (LC anchor: ${lcEndDate})`);
    } else {
      // Regular fetching without LC navigation
      scanDate = new Date('2024-10-25');
      endDate = scanDate.toISOString().split('T')[0];
      startDate = new Date(scanDate.getTime() - (effectiveDaysBack * 24 * 60 * 60 * 1000))
        .toISOString().split('T')[0];

      console.log(`📊 Fetching ${symbol} standard data: ${startDate} to ${endDate}`);
    }

    if (shouldUseOneMinute) {
      // Fetch 1-minute data with extended hours for maximum coverage
      const oneMinuteData = await fetchExtendedHoursOneMinute(symbol, startDate, endDate);
      if (!oneMinuteData) return null;

      // Resample to requested timeframe
      return resampleToTimeframe(oneMinuteData, timeframe);
    } else {
      // For daily data, use direct daily API call
      return await fetchDailyData(symbol, startDate, endDate);
    }

  } catch (error) {
    console.error(`Error fetching Polygon data:`, error);
    return null;
  }
}

/**
 * Fetch 1-minute data with full extended hours coverage (4am-8pm)
 */
async function fetchExtendedHoursOneMinute(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<PolygonBar[] | null> {
  // Use 1-minute data which includes ALL trading sessions
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/minute/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&include_otc=true&apikey=${POLYGON_API_KEY}`;

  console.log(`Fetching extended hours 1-minute data (include_otc=true): ${symbol} from ${startDate} to ${endDate}`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Polygon API error: ${response.status} - ${response.statusText}`);
    return null;
  }

  const data: PolygonResponse = await response.json();
  if (!data.results || data.results.length === 0) {
    console.warn(`No 1-minute data found for ${symbol}`);
    return null;
  }

  console.log(`Received ${data.results.length} 1-minute bars (extended hours included)`);

  // Clean fake prints on 1-minute level for maximum accuracy
  const cleanedResults = cleanFakePrints(data.results);
  console.log(`Cleaned 1-minute data: ${cleanedResults.length} bars`);

  // Filter for extended hours trading sessions (4am-8pm) on trading days only
  const extendedHoursResults = cleanedResults.filter(bar => {
    return isWithinExtendedHours(bar.t); // Use proper market calendar for accurate extended hours validation
  });
  console.log(`Extended hours 1-minute data ready: ${extendedHoursResults.length} bars (4am-8pm coverage)`);

  return extendedHoursResults;
}

/**
 * Fetch daily data directly
 */
async function fetchDailyData(
  symbol: string,
  startDate: string,
  endDate: string
): Promise<PolygonBar[] | null> {
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&limit=50000&include_otc=true&apikey=${POLYGON_API_KEY}`;

  console.log(`Fetching daily data: ${symbol} from ${startDate} to ${endDate}`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Polygon API error: ${response.status} - ${response.statusText}`);
    return null;
  }

  const data: PolygonResponse = await response.json();
  if (!data.results || data.results.length === 0) {
    console.warn(`No daily data found for ${symbol}`);
    return null;
  }

  console.log(`Received ${data.results.length} daily bars`);

  // Clean and filter daily data
  const cleanedResults = cleanFakePrints(data.results);
  const tradingDayResults = filterTradingDaysOnly(cleanedResults);

  return tradingDayResults;
}

/**
 * Resample 1-minute data to the requested timeframe
 */
function resampleToTimeframe(oneMinuteBars: PolygonBar[], targetTimeframe: string): PolygonBar[] {
  if (targetTimeframe === "1min") return oneMinuteBars;

  const intervalMinutes = {
    "5min": 5,
    "15min": 15,
    "hour": 60
  }[targetTimeframe] || 5;

  const resampled: PolygonBar[] = [];
  const groups = new Map<string, PolygonBar[]>();

  // Group bars by time intervals using proper market time boundaries
  oneMinuteBars.forEach(bar => {
    try {
      // Convert UTC timestamp to market time for proper interval alignment
      const { marketTime } = utcToMarketTime(bar.t);

      // For hourly intervals, align to market hour boundaries (4am, 5am, 6am, etc.)
      if (targetTimeframe === "hour") {
        // Align to the hour boundary in market time
        const alignedHour = marketTime.getHours();
        const intervalStart = new Date(marketTime);
        intervalStart.setHours(alignedHour, 0, 0, 0);

        // Create key using original UTC timestamp aligned to hour boundaries
        // This prevents timezone conversion issues from grouping everything together
        const utcDate = new Date(bar.t);
        const utcHour = utcDate.getUTCHours();
        const alignedUTCHour = Math.floor(utcHour); // Align to hour boundary

        const keyDate = new Date(utcDate);
        keyDate.setUTCHours(alignedUTCHour, 0, 0, 0);
        const key = keyDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(bar);
      } else {
        // For sub-hourly intervals, use minute-based alignment with UTC timestamps
        const utcDate = new Date(bar.t);
        const alignedMinutes = Math.floor(utcDate.getUTCMinutes() / intervalMinutes) * intervalMinutes;

        const keyDate = new Date(utcDate);
        keyDate.setUTCMinutes(alignedMinutes, 0, 0);
        const key = keyDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(bar);
      }
    } catch (error) {
      console.warn(`Error processing bar timestamp ${bar.t}:`, error);
      // Fallback to UTC-based grouping if market time conversion fails
      const utcDate = new Date(bar.t);
      const alignedHour = Math.floor(utcDate.getUTCHours());
      const keyDate = new Date(utcDate);
      keyDate.setUTCHours(alignedHour, 0, 0, 0);
      const key = keyDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(bar);
    }
  });

  // Aggregate each group into OHLCV bars
  for (const [timeKey, bars] of groups) {
    if (bars.length === 0) continue;

    const aggregated: PolygonBar = {
      t: new Date(timeKey).getTime(),
      o: bars[0].o,  // First bar's open
      h: Math.max(...bars.map(b => b.h)),  // Highest high
      l: Math.min(...bars.map(b => b.l)),   // Lowest low
      c: bars[bars.length - 1].c,  // Last bar's close
      v: bars.reduce((sum, b) => sum + b.v, 0)  // Sum of volumes
    };

    resampled.push(aggregated);
  }

  // Sort by timestamp
  resampled.sort((a, b) => a.t - b.t);

  console.log(`Resampled ${oneMinuteBars.length} 1-minute bars to ${resampled.length} ${targetTimeframe} bars`);
  return resampled;
}

/**
 * Calculate VWAP (exact wzrd-algo session-anchored implementation)
 */
export function calculateVWAP(bars: PolygonBar[]): number[] {
  const vwapValues: number[] = [];

  // Convert timestamps to dates for session grouping
  const sessions = new Map<string, { bars: PolygonBar[], startIndex: number }>();

  bars.forEach((bar, index) => {
    const date = new Date(bar.t);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!sessions.has(dateStr)) {
      sessions.set(dateStr, { bars: [], startIndex: index });
    }
    sessions.get(dateStr)!.bars.push(bar);
  });

  // Calculate session-anchored VWAP (resets each trading day)
  let currentIndex = 0;
  for (const [dateStr, session] of sessions) {
    let sessionCumulativePV = 0;
    let sessionCumulativeVolume = 0;

    for (const bar of session.bars) {
      const typicalPrice = (bar.h + bar.l + bar.c) / 3;
      sessionCumulativePV += typicalPrice * bar.v;
      sessionCumulativeVolume += bar.v;

      const vwap = sessionCumulativeVolume > 0 ? sessionCumulativePV / sessionCumulativeVolume : bar.c;
      vwapValues.push(vwap);
      currentIndex++;
    }
  }

  return vwapValues;
}

/**
 * Calculate EMA (exact wzrd-algo implementation)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA is just the first price
  ema[0] = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i-1]) * multiplier + ema[i-1];
  }

  return ema;
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(bars: PolygonBar[], period: number): number[] {
  const trueRanges: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      // First bar: just high - low
      trueRanges.push(bars[i].h - bars[i].l);
    } else {
      const highLow = bars[i].h - bars[i].l;
      const highClose = Math.abs(bars[i].h - bars[i-1].c);
      const lowClose = Math.abs(bars[i].l - bars[i-1].c);

      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }
  }

  // Calculate ATR as SMA of true ranges
  const atr: number[] = [];
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atr.push(trueRanges[i]); // Not enough data for full period
    } else {
      const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      atr.push(sum / period);
    }
  }

  return atr;
}

/**
 * Clean fake prints and anomalous data from Polygon feed
 * Professional trading data cleaning to remove spikes and bad prints
 */
export function cleanFakePrints(bars: PolygonBar[]): PolygonBar[] {
  if (bars.length < 3) return bars;

  const cleaned: PolygonBar[] = [];
  const cleanBars = [...bars];

  for (let i = 0; i < cleanBars.length; i++) {
    const current = cleanBars[i];
    const prev = i > 0 ? cleanBars[i - 1] : null;
    const next = i < cleanBars.length - 1 ? cleanBars[i + 1] : null;

    // Basic sanity checks
    if (current.h < current.l || current.o > current.h || current.o < current.l ||
        current.c > current.h || current.c < current.l || current.v < 0) {
      console.warn(`Removing malformed bar at index ${i}: OHLC=${current.o},${current.h},${current.l},${current.c}`);
      continue;
    }

    // Check for extreme price spikes (more than 10x typical movement)
    if (prev && next) {
      const prevClose = prev.c;
      const nextOpen = next.o;
      const typicalRange = Math.abs(prevClose - nextOpen);
      const currentRange = Math.max(
        Math.abs(current.h - prevClose),
        Math.abs(current.l - prevClose),
        Math.abs(current.o - prevClose),
        Math.abs(current.c - prevClose)
      );

      // Remove obvious spikes that are 15x larger than surrounding movement
      if (typicalRange > 0 && currentRange > typicalRange * 15) {
        console.warn(`Removing spike at index ${i}: price=${current.c}, prev=${prevClose}, typical_range=${typicalRange}`);
        continue;
      }
    }

    // Volume sanity check - remove bars with extremely high volume (likely errors)
    if (prev && next) {
      const avgVolume = (prev.v + next.v) / 2;
      if (avgVolume > 0 && current.v > avgVolume * 100) {
        console.warn(`Removing high volume anomaly at index ${i}: vol=${current.v}, avg=${avgVolume}`);
        continue;
      }
    }

    // Check for zero volume bars (except for daily data where it might be valid)
    if (current.v === 0) {
      console.warn(`Removing zero volume bar at index ${i}`);
      continue;
    }

    cleaned.push(current);
  }

  return cleaned;
}