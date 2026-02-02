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
    console.log(`🎯 fetchChartDataForDay INPUT:`);
    console.log(`    - ticker: ${ticker}`);
    console.log(`    - targetDate: ${targetDate.toString()}`);
    console.log(`    - targetDate ISO: ${targetDate.toISOString()}`);
    console.log(`    - targetDate date: ${targetDate.toISOString().split('T')[0]}`);
    console.log(`    - dayOffset: ${dayOffset}`);
    console.log(`    - day of week: ${targetDate.toLocaleDateString('en-US', { weekday: 'long' })}`);
    console.log(`    - isTradingDay: ${isTradingDay(targetDate)}`);

    // NOTE: Removed trading day validation
    // Users should be able to view charts for any date, including non-trading days
    // The chart will show available data or empty chart if no data exists
    if (!isTradingDay(targetDate)) {
      console.warn(`⚠️ TARGET DATE IS NOT A TRADING DAY: ${targetDate.toISOString().split('T')[0]} - Loading available chart data anyway`);
    }

    console.log(`📊 Fetching ${ticker} data for Day ${dayOffset >= 0 ? '+' : ''}${dayOffset} (${targetDate.toISOString().split('T')[0]})`);

    // For day timeframe, we need daily data centered on the target date
    // For intraday timeframes, we need minute data for the specific trading day

    if (timeframe === 'day') {
      // For daily charts, fetch exactly 45 trading days ENDING on the target date
      // This ensures D0 (target date) is the rightmost candle
      const targetDateStr = targetDate.toISOString().split('T')[0];

      console.log(`📊 Loading daily chart ENDING on target date: ${targetDateStr}`);
      console.log(`  Fetching 45 days of daily data ENDING on ${targetDateStr}`);

      // Determine if this is D0 for after-hours extension (daily charts don't have intraday data)
      const isD0 = dayOffset === 0;

      // CRITICAL: Use target date as the lcEndDate to ensure it's the rightmost point
      const bars = await fetchPolygonData(ticker, timeframe, 45, targetDateStr, isD0);

      if (!bars || bars.length === 0) {
        return {
          chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
          success: false,
          error: `No daily data available for ${ticker}`
        };
      }

      console.log(`  ✓ Fetched ${bars.length} daily bars for ${ticker} ending on target date ${targetDateStr}`);

      // Convert to chart format
      const chartData: ChartData = {
        x: bars.map(bar => {
          // For daily charts, use the trading day date instead of exact close timestamp
          // This prevents legend idle from showing D+1 due to timezone conversion
          const barDate = new Date(bar.t);
          const tradingDayET = new Date(barDate.toLocaleDateString('en-US', {
            timeZone: 'America/New_York'
          }));
          tradingDayET.setHours(0, 0, 0, 0);
          return tradingDayET.toISOString();
        }),
        open: bars.map(bar => bar.o),
        high: bars.map(bar => bar.h),
        low: bars.map(bar => bar.l),
        close: bars.map(bar => bar.c),
        volume: bars.map(bar => bar.v)
      };

      return { chartData, success: true };

    } else {
      // For intraday charts: TARGET DATE should be the END DATE (rightmost)
      // Chart shows days ENDING on the target date
      // CRITICAL: For D0 (dayOffset === 0), extend data to include after-hours until 8pm ET
      console.log(`📊 Loading intraday chart ENDING on target date: ${targetDate.toISOString()}`);

      const daysBack = timeframe === '5min' ? 1 : timeframe === '15min' ? 4 : 14;
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Determine if this is D0 for after-hours extension
      const isD0 = dayOffset === 0;

      // Fetch the standard number of days, with targetDate as the lcEndDate to ensure filtering
      const fetchDays = daysBack;

      console.log(`  Fetching ${fetchDays} days of ${timeframe} data ENDING on ${targetDateStr} (${isD0 ? 'D0 with 8pm ET' : 'standard 4pm close'})`);
      // CRITICAL: Pass targetDateStr as lcEndDate to ensure strict date filtering
      const bars = await fetchPolygonData(ticker, timeframe, fetchDays, targetDateStr, isD0);

      if (!bars || bars.length === 0) {
        return {
          chartData: { x: [], open: [], high: [], low: [], close: [], volume: [] },
          success: false,
          error: `No ${timeframe} data available for ${ticker} ending on ${targetDateStr}`
        };
      }

      console.log(`  Fetched ${bars.length} bars for ${ticker} ${timeframe} chart`);

      // CRITICAL: Double-filter to ensure NO data beyond targetDate is included
      // This is a safety check in case fetchPolygonData filtering didn't work
      const endDateObj = new Date(targetDateStr + 'T23:59:59.999Z');

      console.log(`🔍 DOUBLE-FILTER DEBUG:`);
      console.log(`   targetDateStr: ${targetDateStr}`);
      console.log(`   endDateObj: ${endDateObj.toISOString()}`);
      console.log(`   endDateObj.getTime(): ${endDateObj.getTime()}`);

      // Show last few bars BEFORE filtering
      console.log(`   Last 5 bars BEFORE filtering:`);
      bars.slice(-5).forEach((bar, i) => {
        const barDate = new Date(bar.t);
        console.log(`     ${i}: date=${barDate.toISOString().split('T')[0]}, timestamp=${barDate.getTime()}, isAfter=${barDate.getTime() > endDateObj.getTime()}`);
      });

      const filteredBars = bars.filter(bar => {
        const barDate = new Date(bar.t);
        const isAfterEndDate = barDate.getTime() > endDateObj.getTime();
        if (isAfterEndDate) {
          console.log(`   ❌ FILTERING: ${barDate.toISOString().split('T')[0]} (timestamp: ${barDate.getTime()} > ${endDateObj.getTime()})`);
        }
        return barDate.getTime() <= endDateObj.getTime();
      });

      console.log(`   After double-filtering: ${filteredBars.length} bars (removed ${bars.length - filteredBars.length} bars beyond ${targetDateStr})`);

      // Show last few bars AFTER filtering
      console.log(`   Last 5 bars AFTER filtering:`);
      filteredBars.slice(-5).forEach((bar, i) => {
        const barDate = new Date(bar.t);
        console.log(`     ${i}: date=${barDate.toISOString().split('T')[0]}, timestamp=${barDate.getTime()}`);
      });

      // Convert to chart format
      const chartData: ChartData = {
        x: filteredBars.map(bar => new Date(bar.t).toISOString()),
        open: filteredBars.map(bar => bar.o),
        high: filteredBars.map(bar => bar.h),
        low: filteredBars.map(bar => bar.l),
        close: filteredBars.map(bar => bar.c),
        volume: filteredBars.map(bar => bar.v)
      };

      // Debug logging to verify the date range
      if (filteredBars.length > 0) {
        const firstBar = new Date(filteredBars[0].t).toISOString();
        const lastBar = new Date(filteredBars[filteredBars.length - 1].t).toISOString();
        const lastBarDate = new Date(filteredBars[filteredBars.length - 1].t).toISOString().split('T')[0];
        console.log(`📅 Chart data range: ${firstBar} to ${lastBar}`);
        console.log(`   RIGHTMOST candle date: ${lastBarDate} (expected: ${targetDateStr})`);
        console.log(`   ${lastBarDate === targetDateStr ? '✅ PERFECT MATCH' : '❌ DATE MISMATCH'}`);
      }

      // CRITICAL: Log what we're actually returning
      console.log(`✅ RETURNING CHART DATA with ${chartData.x.length} candles`);
      console.log(`   First candle: ${chartData.x[0]}`);
      console.log(`   Last candle: ${chartData.x[chartData.x.length - 1]}`);
      console.log(`   Last candle date: ${chartData.x[chartData.x.length - 1].split('T')[0]}`);

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
  maxDesiredDays: number = 30  // Increased to ensure +14D always works
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