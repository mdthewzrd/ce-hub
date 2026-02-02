'use client'

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, Clock } from 'lucide-react';
import { ChartDayNavigationProps } from '../types/scanTypes';

/**
 * Chart Day Navigation Component
 * Allows users to navigate through trading days to see how LC patterns played out
 * Features:
 * - Previous/Next day buttons (trading days only)
 * - Current day indicator with offset from Day 0
 * - Reset to reference day (Day 0)
 * - Date display with market calendar awareness
 */
export const ChartDayNavigation: React.FC<ChartDayNavigationProps> = ({
  currentState,
  onNavigate,
  ticker,
  disabled = false
}) => {
  const { currentDay, referenceDay, dayOffset, isLoading, hasData, maxAvailableDays } = currentState;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatReferenceDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDayLabel = (offset: number) => {
    if (offset === 0) return 'Day 0 (LC Pattern)';
    if (offset > 0) return `Day +${offset}`;
    return `Day ${offset}`;
  };

  const getProgressPercentage = () => {
    if (maxAvailableDays <= 0) return 0;
    return Math.min(100, ((dayOffset + 1) / (maxAvailableDays + 1)) * 100);
  };

  const handlePreviousDay = () => {
    if (!disabled && !isLoading) {
      onNavigate({ type: 'PREVIOUS_DAY' });
    }
  };

  const handleNextDay = () => {
    if (!disabled && !isLoading && dayOffset < maxAvailableDays) {
      onNavigate({ type: 'NEXT_DAY' });
    }
  };

  const handleResetToReference = () => {
    if (!disabled && !isLoading && dayOffset !== 0) {
      onNavigate({ type: 'RESET_TO_REFERENCE' });
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 sm:p-3 lg:p-4 mb-4">
      {/* Header Row - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
          <span className="text-xs sm:text-sm font-medium text-gray-300">
            <span className="hidden sm:inline">Chart Day Navigation</span>
            <span className="sm:hidden">Day Nav</span>
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">
            {ticker}
          </span>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleResetToReference}
          disabled={disabled || isLoading || dayOffset === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 text-gray-400 hover:text-gray-200 self-start sm:self-center"
          title="Reset to LC Pattern Day (Day 0)"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Navigation Controls - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3">
        {/* Navigation Buttons - Side by side on mobile, edges on desktop */}
        <div className="flex justify-between sm:contents">
          {/* Previous Day Button */}
          <button
            onClick={handlePreviousDay}
            disabled={disabled || isLoading || dayOffset <= -5} // Limit backward navigation
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm"
            title="Previous Trading Day"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline font-medium">Previous</span>
            <span className="sm:hidden font-medium">Prev</span>
          </button>

          {/* Next Day Button */}
          <button
            onClick={handleNextDay}
            disabled={disabled || isLoading || dayOffset >= maxAvailableDays}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm sm:order-last"
            title="Next Trading Day"
          >
            <span className="hidden sm:inline font-medium">Next</span>
            <span className="sm:hidden font-medium">Next</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Current Day Info - Centered */}
        <div className="flex-1 text-center order-first sm:order-none">
          <div className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1">
            {getDayLabel(dayOffset)}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">
            {formatDate(currentDay)}
          </div>
          {dayOffset !== 0 && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="hidden sm:inline">Reference: </span>
              <span className="sm:hidden">Ref: </span>
              {formatReferenceDate(referenceDay)}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {maxAvailableDays > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Day 0</span>
            <span>Day +{maxAvailableDays}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="flex items-center gap-1 text-yellow-500">
              <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading data...</span>
            </div>
          )}

          {!hasData && !isLoading && (
            <div className="flex items-center gap-1 text-red-400">
              <span>⚠️</span>
              <span>No data available</span>
            </div>
          )}

          {hasData && !isLoading && (
            <div className="flex items-center gap-1 text-green-400">
              <span>✓</span>
              <span>Data loaded</span>
            </div>
          )}
        </div>

        {/* Market Calendar Info */}
        <div className="flex items-center gap-1 text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Trading days only</span>
        </div>
      </div>

      {/* LC Pattern Context (Day 0 only) */}
      {dayOffset === 0 && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
          <div className="flex items-center gap-1 text-yellow-400 font-medium mb-1">
            <span>🎯</span>
            <span>LC Pattern Reference Day</span>
          </div>
          <div className="text-yellow-300/80">
            This is the day the LC pattern was detected. Use navigation to see how the pattern played out on subsequent trading days.
          </div>
        </div>
      )}

      {/* Future Day Context */}
      {dayOffset > 0 && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
          <div className="flex items-center gap-1 text-blue-400 font-medium mb-1">
            <span>📈</span>
            <span>LC Pattern Follow-Through</span>
          </div>
          <div className="text-blue-300/80">
            Showing price action {dayOffset} trading day{dayOffset > 1 ? 's' : ''} after the LC pattern was detected.
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartDayNavigation;