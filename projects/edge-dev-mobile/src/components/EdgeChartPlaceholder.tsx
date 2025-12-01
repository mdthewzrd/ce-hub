'use client'

import React from 'react';

export type Timeframe = 'day' | 'hour' | '15min' | '5min';

export interface ChartData {
  x: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface IndicatorData {
  vwap?: number[];
  ema9?: number[];
  ema20?: number[];
}

export const CHART_TEMPLATES = {
  day: { defaultDays: 90, barsPerDay: 1 },
  hour: { defaultDays: 30, barsPerDay: 13.5 },
  '15min': { defaultDays: 10, barsPerDay: 26 },
  '5min': { defaultDays: 2, barsPerDay: 78 }
};

interface EdgeChartProps {
  symbol: string;
  timeframe: Timeframe;
  data: ChartData;
  indicators: IndicatorData;
  onTimeframeChange: (timeframe: Timeframe) => void;
  className?: string;
}

export default function EdgeChart({
  symbol,
  timeframe,
  data,
  indicators,
  onTimeframeChange,
  className = ''
}: EdgeChartProps) {
  return (
    <div className={`chart-container ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {symbol} • {timeframe.toUpperCase()} Chart
        </h3>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(Object.keys(CHART_TEMPLATES) as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tf === 'day' ? 'D' : tf === 'hour' ? 'H' : tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area (Placeholder) */}
      <div className="h-96 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📈</div>
          <div className="text-lg font-medium text-gray-300">
            {symbol} Chart ({timeframe})
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {data.x.length} data points • {Object.keys(indicators).length} indicators
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Chart implementation placeholder
          </div>
        </div>
      </div>
    </div>
  );
}