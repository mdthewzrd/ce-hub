/**
 * Chart Day Navigation Utilities
 * Handles trading day calculations and multi-day data fetching for LC pattern follow-through
 */

import {
  getNextTradingDay,
  getPreviousTradingDay,
  isTradingDay,
  getTradingDaysBetween
} from './marketCalendar';
import { fetchPolygonData } from './polygonData';
import { ChartDayState, MultiDayMarketData, ChartNavigationAction } from '../types/scanTypes';
import { ChartData } from '../components/EdgeChart';
import { Timeframe } from '../config/globalChartConfig';

/**
 * Chart day navigation state reducer
 */
export function chartDayNavigationReducer(
  state: ChartDayState,
  action: ChartNavigationAction
): ChartDayState {
  switch (action.type) {
    case 'NEXT_DAY':
      if (state.dayOffset >= state.maxAvailableDays) return state;

      const nextDay = getNextTradingDay(state.currentDay);
      return {
        ...state,
        currentDay: nextDay,
        dayOffset: state.dayOffset + 1,
        hasData: false,
        isLoading: true
      };

    case 'PREVIOUS_DAY':
      if (state.dayOffset <= -5) return state; // Limit backward navigation

      const prevDay = getPreviousTradingDay(state.currentDay);
      return {
        ...state,
        currentDay: prevDay,
        dayOffset: state.dayOffset - 1,
        hasData: false,
        isLoading: true
      };

    case 'GO_TO_DAY':
      if (action.dayOffset < -5 || action.dayOffset > state.maxAvailableDays) return state;

      let targetDay = new Date(state.referenceDay);
      let currentOffset = 0;

      // Navigate to the target day offset
      while (currentOffset !== action.dayOffset) {
        if (currentOffset < action.dayOffset) {
          targetDay = getNextTradingDay(targetDay);
          currentOffset++;
        } else {
          targetDay = getPreviousTradingDay(targetDay);
          currentOffset--;
        }
      }

      return {
        ...state,
        currentDay: targetDay,
        dayOffset: action.dayOffset,
        hasData: false,
        isLoading: true
      };

    case 'RESET_TO_REFERENCE':
      return {
        ...state,
        currentDay: new Date(state.referenceDay),
        dayOffset: 0,
        hasData: false,
        isLoading: true
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      };

    case 'SET_DATA':
      return {
        ...state,
        hasData: true,
        isLoading: false
      };

    case 'SET_MAX_DAYS':
      return {
        ...state,
        maxAvailableDays: action.maxDays
      };

    default:
      return state;
  }
}

/**
 * Initialize chart day navigation state from a reference date (LC pattern date)
 */
export function initializeChartDayState(referenceDateString: string): ChartDayState {
  const referenceDay = new Date(referenceDateString);

  // Ensure reference day is a trading day
  if (!isTradingDay(referenceDay)) {
    // Find the previous trading day if reference is not a trading day
    const adjustedReferenceDay = getPreviousTradingDay(referenceDay);
    console.warn(`Reference date ${referenceDateString} is not a trading day, using ${adjustedReferenceDay.toISOString().split('T')[0]}`);

    return {
      currentDay: adjustedReferenceDay,
      referenceDay: adjustedReferenceDay,
      dayOffset: 0,
      isLoading: false,
      hasData: false,
      maxAvailableDays: 10 // Default max - will be calculated based on data availability
    };
  }

  return {
    currentDay: new Date(referenceDay),
    referenceDay: new Date(referenceDay),
    dayOffset: 0,
    isLoading: false,
    hasData: false,
    maxAvailableDays: 10 // Default max - will be calculated based on data availability
  };
}

/**
 * Fetch chart data for a specific day relative to the LC pattern
 */
export async function fetchChartDataForDay(
  ticker: string,
  targetDate: Date,
  timeframe: Timeframe,
  dayOffset: number
): Promise<{ chartData: ChartData; success: boolean; error?: string }> {
  console.log(`🚀 fetchChartDataForDay CALLED: ${ticker}, Day ${dayOffset}, Target: ${targetDate.toISOString().split('T')[0]}, Timeframe: ${timeframe}`);

  try {
    // 🔧 CRITICAL FIX: Prevent using future dates for Day 0
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (dayOffset === 0 && targetDate > today) {
      console.warn(`⚠️ Future date detected for Day 0: ${targetDate.toISOString().split('T')[0]}. Using today instead.`);
      targetDate = new Date();
      targetDate.setHours(16, 0, 0, 0); // Use today at 4pm market close
    }

    // Validate that target date is a trading day
    if (!isTradingDay(targetDate)) {
      return {
        chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
        success: false,
        error: `${targetDate.toISOString().split('T')[0]} is not a trading day`
      };
    }

    console.log(`📊 Fetching ${ticker} data for Day ${dayOffset >= 0 ? '+' : ''}${dayOffset} (${targetDate.toISOString().split('T')[0]})`);

    // For day timeframe, we need daily data centered on the target date
    // For intraday timeframes, we need minute data for the specific trading day

    if (timeframe === 'day') {
      // For daily charts, calculate 45 trading days before the target date
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - (45 * 7/5)); // Approximate 45 trading days (45 * 7/5 to account for weekends)

      // For Day 0, only go up to the reference date, not beyond
      const endDate = new Date(targetDate);
      if (dayOffset === 0) {
        // For Day 0, end exactly at the reference date (no future data)
        // Don't add extra days to avoid showing partial d+1 candle
      } else {
        // For future days (d+1, d+2, etc.), add some future context
        endDate.setDate(endDate.getDate() + 10);
      }

      // Fetch daily data with proper end date constraint
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const bars = await fetchPolygonData(ticker, timeframe, 90, targetDateStr); // Fetch 90 calendar days to ensure we get ~60 trading days

      if (!bars || bars.length === 0) {
        return {
          chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
          success: false,
          error: `No daily data available for ${ticker}`
        };
      }

      // For Day 0, filter out any data beyond the target date to eliminate overhang
      let filteredBars = bars;
      console.log(`🔍 DAY 0 FILTERING CHECK: dayOffset=${dayOffset}, bars.length=${bars.length}`);

      if (dayOffset === 0) {
        console.log(`✅ DAY 0 FILTERING TRIGGERED - Target date: ${targetDateStr}`);
        // Daily candles complete at 4pm Eastern Time, so convert to proper timezone
        // 4pm ET = 20:00 or 21:00 UTC depending on DST
        const marketCloseET = new Date(targetDateStr + 'T16:00:00.000');
        const targetDateTime = marketCloseET.getTime();

        // Log original data range for debugging
        if (bars.length > 0) {
          const firstBarDate = new Date(bars[0].t).toISOString().split('T')[0];
          const lastBarDate = new Date(bars[bars.length - 1].t).toISOString().split('T')[0];
          console.log(`📊 Original data range: ${firstBarDate} to ${lastBarDate}`);
          console.log(`🎯 Target cutoff time (4pm market close): ${new Date(targetDateTime).toISOString()}`);
        }

        filteredBars = bars.filter(bar => {
          const barDate = new Date(bar.t).toISOString().split('T')[0];
          const isBeforeOrOnTarget = bar.t <= targetDateTime;

          if (!isBeforeOrOnTarget) {
            console.log(`🚫 Filtering out future bar: ${barDate} (${new Date(bar.t).toISOString()})`);
          }

          return isBeforeOrOnTarget;
        });

        console.log(`🎯 Day 0 filtering: ${bars.length} → ${filteredBars.length} bars (removed ${bars.length - filteredBars.length} future bars)`);

        // Additional verification
        if (filteredBars.length > 0) {
          const lastFilteredBarDate = new Date(filteredBars[filteredBars.length - 1].t).toISOString().split('T')[0];
          console.log(`✅ Final filtered data range: ${new Date(filteredBars[0].t).toISOString().split('T')[0]} to ${lastFilteredBarDate}`);

          if (lastFilteredBarDate !== targetDateStr) {
            console.warn(`⚠️ WARNING: Last filtered bar date (${lastFilteredBarDate}) still doesn't match target date (${targetDateStr})`);
          }
        }
      }

      // Convert to chart format with proper timezone handling
      // Polygon data comes as UTC timestamps, we need to preserve them properly
      const chartData: ChartData = {
        x: filteredBars.map(bar => {
          // Create proper UTC timestamp that maintains Eastern Time date boundaries
          const date = new Date(bar.t);

          // Get Eastern Time date components to ensure correct trading day display
          const etDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
          const year = etDate.getFullYear();
          const month = String(etDate.getMonth() + 1).padStart(2, '0');
          const day = String(etDate.getDate()).padStart(2, '0');

          // Create ISO string that represents the correct ET trading day (ends at 4pm ET = 20:00/21:00 UTC)
          return `${year}-${month}-${day}T20:00:00.000Z`;
        }),
        open: filteredBars.map(bar => bar.o),
        high: filteredBars.map(bar => bar.h),
        low: filteredBars.map(bar => bar.l),
        close: filteredBars.map(bar => bar.c),
        volume: filteredBars.map(bar => bar.v)
      };

      return { chartData, success: true };

    } else {
      // For intraday charts: TARGET DATE should be the END DATE (rightmost)
      // Chart shows trading days ENDING on the target date
      console.log(`📊 Loading intraday chart ENDING on target date: ${targetDate.toISOString()}`);

      const daysBack = timeframe === '5min' ? 3 : timeframe === '15min' ? 5 : 15;
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // For Day 0, use the target date as the exact end date
      // For future days, allow some future context but still end on or near the target date
      const lcEndDate = dayOffset === 0 ? targetDateStr : targetDateStr;

      // CRITICAL: Use target date as the lcEndDate to ensure it's the rightmost point
      console.log(`  Fetching ${daysBack} days of ${timeframe} data ENDING on ${lcEndDate} (Day ${dayOffset})`);
      const bars = await fetchPolygonData(ticker, timeframe, daysBack, lcEndDate);

      if (!bars || bars.length === 0) {
        return {
          chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
          success: false,
          error: `No ${timeframe} data available for ${ticker} ending on ${targetDateStr}`
        };
      }

      console.log(`  Fetched ${bars.length} bars for ${ticker} ${timeframe} chart ending on target date`);

      // For Day 0, add additional safety filter to ensure no data beyond target date
      let filteredBars = bars;
      if (dayOffset === 0) {
        // Daily candles complete at 4pm Eastern Time, so use proper timezone
        const marketCloseET = new Date(targetDateStr + 'T16:00:00.000');
        const targetDateTime = marketCloseET.getTime();

        // Log original data range for debugging
        if (bars.length > 0) {
          const firstBarDate = new Date(bars[0].t).toISOString().split('T')[0];
          const lastBarDate = new Date(bars[bars.length - 1].t).toISOString().split('T')[0];
          console.log(`📊 Intraday original data range: ${firstBarDate} to ${lastBarDate}`);
          console.log(`🎯 Intraday target cutoff time (4pm market close): ${new Date(targetDateTime).toISOString()}`);
        }

        filteredBars = bars.filter(bar => {
          const barDate = new Date(bar.t).toISOString().split('T')[0];
          const isBeforeOrOnTarget = bar.t <= targetDateTime;

          if (!isBeforeOrOnTarget) {
            console.log(`🚫 Filtering out future intraday bar: ${barDate} (${new Date(bar.t).toISOString()})`);
          }

          return isBeforeOrOnTarget;
        });

        console.log(`🎯 Day 0 intraday filtering: ${bars.length} → ${filteredBars.length} bars (removed ${bars.length - filteredBars.length} future bars)`);

        // Additional verification
        if (filteredBars.length > 0) {
          const lastFilteredBarDate = new Date(filteredBars[filteredBars.length - 1].t).toISOString().split('T')[0];
          console.log(`✅ Final intraday filtered data range: ${new Date(filteredBars[0].t).toISOString().split('T')[0]} to ${lastFilteredBarDate}`);

          if (lastFilteredBarDate !== targetDateStr) {
            console.warn(`⚠️ WARNING: Last filtered intraday bar date (${lastFilteredBarDate}) still doesn't match target date (${targetDateStr})`);
          }
        }
      }

      // Convert to chart format with proper timezone handling
      // Apply the same timezone fix as daily charts to maintain consistency
      const chartData: ChartData = {
        x: filteredBars.map(bar => {
          // Create proper UTC timestamp that maintains Eastern Time date boundaries
          const date = new Date(bar.t);

          // Get Eastern Time date components to ensure correct trading day display
          const etDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
          const year = etDate.getFullYear();
          const month = String(etDate.getMonth() + 1).padStart(2, '0');
          const day = String(etDate.getDate()).padStart(2, '0');
          const hours = String(etDate.getHours()).padStart(2, '0');
          const minutes = String(etDate.getMinutes()).padStart(2, '0');

          // Create ISO string that preserves the exact ET trading time
          return `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
        }),
        open: filteredBars.map(bar => bar.o),
        high: filteredBars.map(bar => bar.h),
        low: filteredBars.map(bar => bar.l),
        close: filteredBars.map(bar => bar.c),
        volume: filteredBars.map(bar => bar.v)
      };

      // Debug logging to verify the date range
      if (filteredBars.length > 0) {
        const firstBar = new Date(filteredBars[0].t).toISOString().split('T')[0];
        const lastBar = new Date(filteredBars[filteredBars.length - 1].t).toISOString().split('T')[0];
        console.log(`📅 Chart data range: ${firstBar} to ${lastBar} (should end on ${targetDateStr})`);
      }

      return { chartData, success: true };
    }

  } catch (error) {
    console.error(`❌ Error fetching chart data for ${ticker} Day ${dayOffset}:`, error);
    return {
      chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Pre-fetch data for multiple days to enable smooth navigation
 */
export async function prefetchMultiDayData(
  ticker: string,
  referenceDate: Date,
  timeframe: Timeframe,
  maxDays: number = 10
): Promise<MultiDayMarketData> {
  const multiDayData: MultiDayMarketData = {};

  console.log(`  Pre-fetching ${maxDays + 1} days of data for ${ticker} from ${referenceDate.toISOString().split('T')[0]}`);

  // Calculate available trading days
  const endDate = new Date(referenceDate);
  endDate.setDate(endDate.getDate() + maxDays * 2); // Buffer for weekends/holidays

  const tradingDays = getTradingDaysBetween(referenceDate, endDate);
  const availableDays = Math.min(tradingDays.length, maxDays + 1);

  // Fetch data for each day
  for (let i = 0; i < availableDays; i++) {
    const targetDate = tradingDays[i].market_open;
    const dayOffset = i;

    try {
      const result = await fetchChartDataForDay(ticker, targetDate, timeframe, dayOffset);

      multiDayData[dayOffset] = {
        date: targetDate.toISOString().split('T')[0],
        chartData: result.chartData,
        marketSession: tradingDays[i],
        isComplete: result.success
      };

      console.log(`  Day ${dayOffset} data fetched: ${result.success ? 'Success' : 'Failed'}`);

    } catch (error) {
      console.error(`❌ Failed to fetch Day ${dayOffset} data:`, error);

      multiDayData[dayOffset] = {
        date: targetDate.toISOString().split('T')[0],
        chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
        marketSession: tradingDays[i],
        isComplete: false
      };
    }
  }

  console.log(`🏁 Pre-fetch complete: ${Object.keys(multiDayData).length} days loaded`);
  return multiDayData;
}

/**
 * Calculate maximum available days based on data availability and market calendar
 */
export function calculateMaxAvailableDays(
  referenceDate: Date,
  maxDesiredDays: number = 20
): number {
  const today = new Date();

  // Don't go beyond today
  if (referenceDate >= today) {
    return 0;
  }

  // Calculate trading days between reference and today
  const tradingDays = getTradingDaysBetween(referenceDate, today);

  // Return the minimum of desired days and actual available days
  return Math.min(maxDesiredDays, tradingDays.length - 1);
}

/**
 * Format day offset for display
 */
export function formatDayOffset(offset: number): string {
  if (offset === 0) return 'Day 0';
  if (offset > 0) return `Day +${offset}`;
  return `Day ${offset}`;
}

/**
 * Get contextual information for a day offset
 */
export function getDayContext(offset: number): {
  label: string;
  description: string;
  colorClass: string;
  icon: string;
} {
  if (offset === 0) {
    return {
      label: 'LC Pattern Day',
      description: 'Original day the LC pattern was detected',
      colorClass: 'text-yellow-500',
      icon: ' '
    };
  }

  if (offset > 0) {
    return {
      label: 'Follow-Through',
      description: `${offset} trading day${offset > 1 ? 's' : ''} after LC pattern`,
      colorClass: 'text-blue-500',
      icon: '📈'
    };
  }

  return {
    label: 'Pre-Pattern',
    description: `${Math.abs(offset)} trading day${Math.abs(offset) > 1 ? 's' : ''} before LC pattern`,
    colorClass: 'text-gray-500',
    icon: '📊'
  };
}