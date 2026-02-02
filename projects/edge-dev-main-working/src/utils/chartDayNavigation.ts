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
  try {
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
      // For daily charts, fetch a window around the target date
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 30); // 30 days before

      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 10); // 10 days after for context

      const bars = await fetchPolygonData(ticker, timeframe, 45);

      if (!bars || bars.length === 0) {
        return {
          chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
          success: false,
          error: `No daily data available for ${ticker}`
        };
      }

      // Convert to chart format
      const chartData: ChartData = {
        x: bars.map(bar => new Date(bar.t).toISOString()),
        open: bars.map(bar => bar.o),
        high: bars.map(bar => bar.h),
        low: bars.map(bar => bar.l),
        close: bars.map(bar => bar.c),
        volume: bars.map(bar => bar.v)
      };

      return { chartData, success: true };

    } else {
      // For intraday charts: TARGET DATE should be the END DATE (rightmost)
      // Chart shows 15 trading days ENDING on the target date
      console.log(`📊 Loading intraday chart ENDING on target date: ${targetDate.toISOString()}`);

      const daysBack = timeframe === '5min' ? 3 : timeframe === '15min' ? 5 : 15;
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // CRITICAL: Use target date as the lcEndDate to ensure it's the rightmost point
      console.log(`  Fetching ${daysBack} days of ${timeframe} data ENDING on ${targetDateStr}`);
      const bars = await fetchPolygonData(ticker, timeframe, daysBack, targetDateStr);

      if (!bars || bars.length === 0) {
        return {
          chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
          success: false,
          error: `No ${timeframe} data available for ${ticker} ending on ${targetDateStr}`
        };
      }

      console.log(`  Fetched ${bars.length} bars for ${ticker} ${timeframe} chart ending on target date`);

      // DO NOT filter - use all bars as they should end on the target date
      // The fetchPolygonData with lcEndDate should return the correct range
      const chartData: ChartData = {
        x: bars.map(bar => new Date(bar.t).toISOString()),
        open: bars.map(bar => bar.o),
        high: bars.map(bar => bar.h),
        low: bars.map(bar => bar.l),
        close: bars.map(bar => bar.c),
        volume: bars.map(bar => bar.v)
      };

      // Debug logging to verify the date range
      if (bars.length > 0) {
        const firstBar = new Date(bars[0].t).toISOString().split('T')[0];
        const lastBar = new Date(bars[bars.length - 1].t).toISOString().split('T')[0];
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