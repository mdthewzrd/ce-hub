/**
 * React Hook for Chart Day Navigation
 * Manages state and logic for navigating through trading days in LC scanner charts
 */

import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  ChartDayState,
  ChartNavigationAction,
  MultiDayMarketData
} from '../types/scanTypes';
import {
  chartDayNavigationReducer,
  initializeChartDayState,
  fetchChartDataForDay,
  calculateMaxAvailableDays
} from '../utils/chartDayNavigation';
import { ChartData } from '../components/EdgeChart';
import { Timeframe } from '../config/globalChartConfig';

interface UseChartDayNavigationOptions {
  ticker?: string;
  referenceDate?: string;
  timeframe?: Timeframe;
  onDataLoad?: (dayOffset: number, chartData: ChartData) => void;
  onError?: (error: string) => void;
}

export function useChartDayNavigation({
  ticker,
  referenceDate,
  timeframe = 'day',
  onDataLoad,
  onError
}: UseChartDayNavigationOptions = {}) {
  // Initialize state
  const [state, dispatch] = useReducer(
    chartDayNavigationReducer,
    referenceDate ? initializeChartDayState(referenceDate) : {
      currentDay: new Date(),
      referenceDay: new Date(),
      dayOffset: 0,
      isLoading: false,
      hasData: false,
      maxAvailableDays: 0
    }
  );

  // Cache for multi-day data
  const [dataCache, setDataCache] = useState<MultiDayMarketData>({});

  // Initialize when reference date changes
  useEffect(() => {
    if (referenceDate) {
      const newState = initializeChartDayState(referenceDate);

      // Calculate max available days
      const maxDays = calculateMaxAvailableDays(newState.referenceDay);

      dispatch({ type: 'SET_MAX_DAYS', maxDays });

      // Reset cache
      setDataCache({});

      console.log(`📅 Initialized chart navigation for ${referenceDate}, max days: ${maxDays}`);
    }
  }, [referenceDate]);

  // Fetch data when current day changes
  useEffect(() => {
    if (ticker && state.currentDay && state.isLoading) {
      fetchDataForCurrentDay();
    }
  }, [ticker, state.currentDay, state.dayOffset, timeframe, state.isLoading]);

  const fetchDataForCurrentDay = useCallback(async () => {
    if (!ticker) return;

    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });

      // Check cache first
      if (dataCache[state.dayOffset]) {
        const cachedData = dataCache[state.dayOffset];

        if (cachedData.isComplete) {
          console.log(`📊 Using cached data for Day ${state.dayOffset}`);
          dispatch({ type: 'SET_DATA', dayOffset: state.dayOffset, data: cachedData.chartData });
          onDataLoad?.(state.dayOffset, cachedData.chartData);
          return;
        }
      }

      console.log(`📊 Fetching data for ${ticker} Day ${state.dayOffset} (${state.currentDay.toISOString().split('T')[0]})`);

      const result = await fetchChartDataForDay(
        ticker,
        state.currentDay,
        timeframe,
        state.dayOffset
      );

      if (result.success) {
        // Update cache
        setDataCache(prev => ({
          ...prev,
          [state.dayOffset]: {
            date: state.currentDay.toISOString().split('T')[0],
            chartData: result.chartData,
            marketSession: null as any, // Would be populated with actual session data
            isComplete: true
          }
        }));

        dispatch({ type: 'SET_DATA', dayOffset: state.dayOffset, data: result.chartData });
        onDataLoad?.(state.dayOffset, result.chartData);

        console.log(`✅ Data loaded for Day ${state.dayOffset}`);
      } else {
        console.error(`❌ Failed to load data for Day ${state.dayOffset}:`, result.error);
        onError?.(result.error || 'Failed to load chart data');
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }

    } catch (error) {
      console.error('Error fetching chart data:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [ticker, state.currentDay, state.dayOffset, timeframe, dataCache, onDataLoad, onError]);

  // Navigation functions
  const goToNextDay = useCallback(() => {
    dispatch({ type: 'NEXT_DAY' });
  }, []);

  const goToPreviousDay = useCallback(() => {
    dispatch({ type: 'PREVIOUS_DAY' });
  }, []);

  const goToDay = useCallback((dayOffset: number) => {
    dispatch({ type: 'GO_TO_DAY', dayOffset });
  }, []);

  const resetToReference = useCallback(() => {
    dispatch({ type: 'RESET_TO_REFERENCE' });
  }, []);

  const handleNavigationAction = useCallback((action: ChartNavigationAction) => {
    dispatch(action);
  }, []);

  // Prefetch surrounding days for smoother navigation
  const prefetchSurroundingDays = useCallback(async () => {
    if (!ticker || !referenceDate) return;

    const daysToPrefetch = [
      state.dayOffset - 1,
      state.dayOffset + 1,
      state.dayOffset + 2
    ].filter(offset =>
      offset >= -5 &&
      offset <= state.maxAvailableDays &&
      !dataCache[offset]
    );

    console.log(`🔄 Prefetching days: ${daysToPrefetch.join(', ')}`);

    for (const offset of daysToPrefetch) {
      try {
        // Calculate target date for offset
        let targetDate = new Date(state.referenceDay);
        let currentOffset = 0;

        while (currentOffset !== offset) {
          if (currentOffset < offset) {
            targetDate.setDate(targetDate.getDate() + 1);
            currentOffset++;
          } else {
            targetDate.setDate(targetDate.getDate() - 1);
            currentOffset--;
          }
        }

        const result = await fetchChartDataForDay(ticker, targetDate, timeframe, offset);

        if (result.success) {
          setDataCache(prev => ({
            ...prev,
            [offset]: {
              date: targetDate.toISOString().split('T')[0],
              chartData: result.chartData,
              marketSession: null as any,
              isComplete: true
            }
          }));

          console.log(`✅ Prefetched Day ${offset}`);
        }

      } catch (error) {
        console.warn(`⚠️ Failed to prefetch Day ${offset}:`, error);
      }
    }
  }, [ticker, referenceDate, state.dayOffset, state.maxAvailableDays, state.referenceDay, timeframe, dataCache]);

  // Auto-prefetch when state stabilizes
  useEffect(() => {
    if (state.hasData && !state.isLoading) {
      const prefetchTimer = setTimeout(prefetchSurroundingDays, 1000);
      return () => clearTimeout(prefetchTimer);
    }
  }, [state.hasData, state.isLoading, prefetchSurroundingDays]);

  // Get cached data for current day
  const getCurrentDayData = useCallback(() => {
    return dataCache[state.dayOffset]?.chartData || null;
  }, [dataCache, state.dayOffset]);

  // Check if navigation is possible
  const canGoNext = state.dayOffset < state.maxAvailableDays && !state.isLoading;
  const canGoPrevious = state.dayOffset > -5 && !state.isLoading;

  return {
    // State
    state,

    // Data
    currentDayData: getCurrentDayData(),
    dataCache,

    // Navigation
    goToNextDay,
    goToPreviousDay,
    goToDay,
    resetToReference,
    handleNavigationAction,

    // Capabilities
    canGoNext,
    canGoPrevious,

    // Cache management
    prefetchSurroundingDays,

    // Utilities
    formatCurrentDay: () => state.currentDay.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),

    getDayLabel: () => {
      if (state.dayOffset === 0) return 'Day 0 (LC Pattern)';
      if (state.dayOffset > 0) return `Day +${state.dayOffset}`;
      return `Day ${state.dayOffset}`;
    }
  };
}