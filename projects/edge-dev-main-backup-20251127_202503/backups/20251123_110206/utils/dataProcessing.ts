/**
 * Data Processing Utilities for Edge.dev
 *
 * 1-minute base data architecture with resampling and fake print detection
 * All timeframes (5min, 15min, hour) derived from 1-minute candles for accuracy
 */

export interface OneMinuteCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FakePrintThresholds {
  spikeMultiplier: number;    // Price spike threshold (e.g., 15x average range)
  volumeMultiplier: number;   // Volume spike threshold (e.g., 100x average volume)
  minVolume: number;          // Minimum volume to be considered valid
}

export const DEFAULT_FAKE_PRINT_THRESHOLDS: FakePrintThresholds = {
  spikeMultiplier: 15,
  volumeMultiplier: 100,
  minVolume: 1000
};

/**
 * Enhanced fake print detection on 1-minute data
 * More accurate than detecting on resampled timeframes
 */
export function detectFakePrints(
  candles: OneMinuteCandle[],
  thresholds = DEFAULT_FAKE_PRINT_THRESHOLDS
): OneMinuteCandle[] {
  if (candles.length < 10) return candles; // Need minimum data for analysis

  const cleanCandles: OneMinuteCandle[] = [];

  // Calculate rolling averages for comparison
  const windowSize = 20; // 20-minute rolling window for context

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    let isValid = true;

    // Skip zero volume candles
    if (candle.volume < thresholds.minVolume) {
      isValid = false;
    }

    // Price spike detection (if we have enough history)
    if (isValid && i >= windowSize) {
      const recentCandles = candles.slice(i - windowSize, i);
      const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / windowSize;
      const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / windowSize;

      const currentRange = candle.high - candle.low;
      const priceSpike = currentRange > (avgRange * thresholds.spikeMultiplier);
      const volumeSpike = candle.volume > (avgVolume * thresholds.volumeMultiplier);

      // Flag as fake print if both price and volume are extreme
      if (priceSpike && volumeSpike) {
        isValid = false;
      }
    }

    // OHLC validation - ensure logical price relationships
    if (isValid) {
      if (candle.high < candle.low ||
          candle.open < candle.low || candle.open > candle.high ||
          candle.close < candle.low || candle.close > candle.high) {
        isValid = false;
      }
    }

    if (isValid) {
      cleanCandles.push(candle);
    } else {
      // For invalid candles, we could either skip them entirely or interpolate
      // For now, we'll skip to maintain data integrity
      console.warn(`Fake print detected and removed: ${candle.timestamp}`);
    }
  }

  return cleanCandles;
}

/**
 * Resample 1-minute data to larger timeframes
 */
export function resampleCandles(
  oneMinuteCandles: OneMinuteCandle[],
  timeframe: '5min' | '15min' | 'hour'
): OneMinuteCandle[] {
  if (oneMinuteCandles.length === 0) return [];

  const intervalMinutes = {
    '5min': 5,
    '15min': 15,
    'hour': 60
  }[timeframe];

  const resampledCandles: OneMinuteCandle[] = [];

  // Group candles by time intervals
  let currentGroup: OneMinuteCandle[] = [];
  let groupStartTime: Date | null = null;

  for (const candle of oneMinuteCandles) {
    const candleTime = new Date(candle.timestamp);

    // Align to interval boundaries (e.g., 5-min intervals start at :00, :05, :10, etc.)
    const alignedMinutes = Math.floor(candleTime.getMinutes() / intervalMinutes) * intervalMinutes;
    const intervalStart = new Date(candleTime);
    intervalStart.setMinutes(alignedMinutes, 0, 0); // Reset seconds and milliseconds

    // Check if we need to start a new group
    if (!groupStartTime || intervalStart.getTime() !== groupStartTime.getTime()) {
      // Process previous group if it exists
      if (currentGroup.length > 0) {
        resampledCandles.push(aggregateCandles(currentGroup, groupStartTime!));
      }

      // Start new group
      currentGroup = [candle];
      groupStartTime = intervalStart;
    } else {
      // Add to current group
      currentGroup.push(candle);
    }
  }

  // Process final group
  if (currentGroup.length > 0 && groupStartTime) {
    resampledCandles.push(aggregateCandles(currentGroup, groupStartTime));
  }

  return resampledCandles;
}

/**
 * Aggregate multiple 1-minute candles into a single OHLCV candle
 */
function aggregateCandles(candles: OneMinuteCandle[], intervalStart: Date): OneMinuteCandle {
  const open = candles[0].open;
  const close = candles[candles.length - 1].close;
  const high = Math.max(...candles.map(c => c.high));
  const low = Math.min(...candles.map(c => c.low));
  const volume = candles.reduce((sum, c) => sum + c.volume, 0);

  return {
    timestamp: intervalStart.toISOString(),
    open,
    high,
    low,
    close,
    volume
  };
}

/**
 * Generate extended hours data request parameters
 * Ensures we get continuous 4am-8pm data coverage
 */
export function getExtendedHoursParams(
  symbol: string,
  timeframe: 'day' | 'hour' | '15min' | '5min',
  days: number
) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // For intraday charts, ensure we request from 4am to 8pm
  const extendedHours = timeframe !== 'day';

  return {
    symbol,
    timeframe: '1min', // Always request 1-minute base data
    start: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
    end: endDate.toISOString().split('T')[0],
    extendedHours, // Include pre/post market data
    premarket: true, // Specifically request 4am-9:30am data
    afterhours: true, // Specifically request 4pm-8pm data
    // Note: API integration point - these params should be passed to Polygon.io or your data provider
  };
}

/**
 * Process raw API data into clean, extended-hours 1-minute candles
 */
export function processRawMarketData(
  rawData: any[], // Raw API response
  requestedTimeframe: 'day' | 'hour' | '15min' | '5min'
): OneMinuteCandle[] {
  // Convert raw API data to 1-minute candles
  const oneMinuteCandles: OneMinuteCandle[] = rawData.map(item => ({
    timestamp: new Date(item.t || item.timestamp).toISOString(),
    open: item.o || item.open,
    high: item.h || item.high,
    low: item.l || item.low,
    close: item.c || item.close,
    volume: item.v || item.volume
  }));

  // Apply fake print detection on 1-minute data
  const cleanOneMinuteCandles = detectFakePrints(oneMinuteCandles);

  // For daily charts, return as-is (or aggregate to daily if needed)
  if (requestedTimeframe === 'day') {
    return cleanOneMinuteCandles; // Could aggregate to daily here if needed
  }

  // For intraday charts, resample from 1-minute to requested timeframe
  return resampleCandles(cleanOneMinuteCandles, requestedTimeframe as '5min' | '15min' | 'hour');
}

/**
 * Data quality metrics for monitoring
 */
export function getDataQualityMetrics(candles: OneMinuteCandle[]) {
  const totalCandles = candles.length;
  const expectedCandles = calculateExpectedCandles(candles);
  const completeness = totalCandles / expectedCandles;

  const volumeStats = {
    avgVolume: candles.reduce((sum, c) => sum + c.volume, 0) / totalCandles,
    zeroVolumeCandles: candles.filter(c => c.volume === 0).length
  };

  return {
    totalCandles,
    expectedCandles,
    completeness: Math.min(completeness, 1), // Cap at 100%
    dataQuality: completeness > 0.95 ? 'excellent' : completeness > 0.85 ? 'good' : 'poor',
    volumeStats
  };
}

function calculateExpectedCandles(candles: OneMinuteCandle[]): number {
  if (candles.length === 0) return 0;

  const start = new Date(candles[0].timestamp);
  const end = new Date(candles[candles.length - 1].timestamp);
  const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  // Account for market hours (16 hours per day: 4am-8pm = 960 minutes)
  // vs full 24 hours (1440 minutes)
  return Math.floor(totalMinutes * (960 / 1440)); // Approximate for market hours
}