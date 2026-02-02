'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  generateGlobalLayout,
  generateGlobalRangebreaks,
  calculateGlobalDataBounds,
  generateGlobalMarketSessionShapes,
  GLOBAL_PLOTLY_CONFIG
} from '@/config/globalChartConfig';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

type Timeframe = '5min' | '15min' | 'hour' | 'day';

interface ChartWithControlsProps {
  ticker: string;
  scanResults?: any[];
}

// Timeframe day ranges matching Traderra specifications
const TIMEFRAME_DAYS = {
  'day': 60,
  'hour': 15,
  '15min': 5,
  '5min': 2
} as const;

interface ChartData {
  x: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

/**
 * Chart Component with Integrated Controls
 * - Timeframe buttons (5m, 15m, Hour, Daily)
 * - Date navigation (Previous/Next arrows)
 * - Quick skip buttons (+3, +7, +14 days)
 * - Traderra styling: Red/White candles, black background
 * - Real-time data from Polygon API
 */
export const ChartWithControls: React.FC<ChartWithControlsProps> = ({
  ticker,
  scanResults = []
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [dayOffset, setDayOffset] = useState(0);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverData, setHoverData] = useState<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  // Fetch chart data from Polygon API
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/chart-data?ticker=${ticker}&timeframe=${timeframe}&dayOffset=${dayOffset}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }

        const result = await response.json();

        if (result.success && result.data) {
          setChartData(result.data);
          console.log(`📊 Chart data loaded: ${result.bars} bars for ${ticker} ${timeframe}`);
        } else {
          throw new Error(result.error || 'No data available');
        }
      } catch (err) {
        console.error('Chart data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [ticker, timeframe, dayOffset]);

  // Base date: November 1st, 2025 (Day 0)
  const BASE_DATE = new Date('2025-11-01T00:00:00');

  const handlePreviousDay = () => setDayOffset(prev => prev - 1);
  const handleNextDay = () => setDayOffset(prev => prev + 1);
  const handleSkipDays = (days: number) => setDayOffset(prev => prev + days);
  const handleReset = () => setDayOffset(0);

  const getCurrentDate = () => {
    const date = new Date(BASE_DATE);
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full bg-black border border-[#1a1a1a] rounded-lg flex flex-col">
      {/* Chart Controls Header - Responsive */}
      <div className="p-2 sm:p-3 lg:p-4 border-b border-[#1a1a1a] bg-[#0a0a0a] space-y-2 sm:space-y-3">
        {/* Timeframe Selector - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold studio-text">{ticker}</span>
            <span className="text-xs studio-muted">•</span>
            <div className="flex gap-1">
              {(['5min', '15min', 'hour', 'day'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-[#D4AF37] text-white'
                      : 'bg-[#1a1a1a] studio-text hover:bg-[#161616]'
                  }`}
                >
                  {tf === '5min' ? '5m' : tf === '15min' ? '15m' : tf === 'hour' ? 'Hour' : 'Daily'}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={dayOffset === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-[#161616] studio-text disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-center"
            title="Reset to today"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Date Navigation - Responsive Layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Previous/Next Day Buttons - Mobile: Side by side, Desktop: Edges */}
          <div className="flex justify-between md:contents">
            <button
              onClick={handlePreviousDay}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#111111] hover:bg-[#161616] border studio-border rounded transition-colors text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <button
              onClick={handleNextDay}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#111111] hover:bg-[#161616] border studio-border rounded transition-colors text-xs sm:text-sm md:order-last"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Current Date + Quick Skip - Centered */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 order-first md:order-none">
            {/* Quick Skip Buttons - Horizontal scroll on mobile */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={handleReset}
                disabled={dayOffset === 0}
                className="px-1.5 sm:px-2 py-1 text-xs rounded bg-[#D4AF37] hover:bg-[#B8941F] text-black border border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                title="Reset to Day 0 (Today)"
              >
                D0
              </button>
              <button
                onClick={() => handleSkipDays(3)}
                className="px-1.5 sm:px-2 py-1 text-xs rounded bg-[#1a1a1a] hover:bg-[#161616] studio-text border studio-border whitespace-nowrap"
                title="Skip forward 3 days"
              >
                +3
              </button>
              <button
                onClick={() => handleSkipDays(7)}
                className="px-1.5 sm:px-2 py-1 text-xs rounded bg-[#1a1a1a] hover:bg-[#161616] studio-text border studio-border whitespace-nowrap"
                title="Skip forward 7 days"
              >
                +7
              </button>
              <button
                onClick={() => handleSkipDays(14)}
                className="px-1.5 sm:px-2 py-1 text-xs rounded bg-[#1a1a1a] hover:bg-[#161616] studio-text border studio-border whitespace-nowrap"
                title="Skip forward 14 days"
              >
                +14
              </button>
            </div>

            {/* Current Date Display with Navigation Arrows - Responsive */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousDay}
                className="p-1 rounded hover:bg-[#333333] text-[#e5e5e5] hover:text-white transition-colors md:hidden"
                title="Previous day"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>

              <div className="text-center min-w-[100px] sm:min-w-[120px]">
                <div className="text-xs sm:text-sm font-semibold studio-text">
                  {dayOffset !== 0 && `Day ${dayOffset > 0 ? '+' : ''}${dayOffset}`}
                  {dayOffset === 0 && 'Today'}
                </div>
                <div className="text-xs studio-muted">{getCurrentDate()}</div>
              </div>

              <button
                onClick={handleNextDay}
                className="p-1 rounded hover:bg-[#333333] text-[#e5e5e5] hover:text-white transition-colors md:hidden"
                title="Next day"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area - Responsive padding */}
      <div className="flex-1 p-2 sm:p-3 lg:p-4 relative">

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm studio-text mb-2">Loading chart data...</div>
              <div className="text-xs studio-muted">Fetching {TIMEFRAME_DAYS[timeframe]} days of {ticker} data</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm text-[#ef4444] mb-2">Error loading chart</div>
              <div className="text-xs studio-muted">{error}</div>
            </div>
          </div>
        ) : chartData ? (
          (() => {
            // Calculate data bounds for proper chart scaling
            const { xRange, yRange, volumeRange } = calculateGlobalDataBounds(
              chartData,
              timeframe,
              { dayOffset }
            );

            // Generate rangebreaks to hide weekends and market holidays
            const rangebreaks = generateGlobalRangebreaks(timeframe, chartData);

            // Generate market session shapes (gray backgrounds for pre-market/after-hours)
            const marketSessionShapes = generateGlobalMarketSessionShapes(timeframe, chartData);

            // Generate layout using global configuration
            const layout = generateGlobalLayout(
              ticker,
              timeframe,
              xRange,
              yRange,
              volumeRange,
              rangebreaks,
              marketSessionShapes,
              chartData
            );

            // Add gold crosshair cursor
            layout.xaxis = {
              ...layout.xaxis,
              showspikes: true,
              spikesnap: 'cursor',
              spikemode: 'across',
              spikecolor: '#D4AF37',
              spikedash: 'solid',
              spikethickness: 1
            };

            layout.yaxis = {
              ...layout.yaxis,
              showspikes: true,
              spikesnap: 'cursor',
              spikemode: 'across',
              spikecolor: '#D4AF37',
              spikedash: 'solid',
              spikethickness: 1
            };

            layout.hovermode = 'x';
            layout.hoverdistance = 100;
            layout.spikedistance = 100;

            // Volume bar colors matching candle colors
            const volumeColors = chartData.close.map((close, idx) =>
              close >= chartData.open[idx] ? '#FFFFFF' : '#FF0000'
            );

            return (
              <>
                {/* Always-visible Gold Legend - Responsive and contained */}
                <div
                  className="absolute top-2 left-2 z-[1000] pointer-events-none"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 'clamp(9px, 1.5vw, 11px)',  // Even smaller for better fit
                    color: '#D4AF37',
                    lineHeight: '1.2',
                    maxWidth: 'calc(100% - 16px)',  // More conservative margin
                    wordWrap: 'break-word',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'  // Prevent line wrapping on small screens
                  }}
                >
                  {(() => {
                    // Show hovered data if available, otherwise show most recent candle
                    const displayData = hoverData || {
                      date: chartData.x[chartData.x.length - 1],
                      open: chartData.open[chartData.open.length - 1],
                      high: chartData.high[chartData.high.length - 1],
                      low: chartData.low[chartData.low.length - 1],
                      close: chartData.close[chartData.close.length - 1],
                      volume: chartData.volume[chartData.volume.length - 1]
                    };

                    const formattedDate = new Date(displayData.date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    });

                    const formattedVolume = new Intl.NumberFormat().format(displayData.volume);

                    // Compact single-line format for all screen sizes to prevent overflow
                    return (
                      <div style={{
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {formattedDate} O:{displayData.open?.toFixed(2)} H:{displayData.high?.toFixed(2)} L:{displayData.low?.toFixed(2)} C:{displayData.close?.toFixed(2)} V:{(displayData.volume/1000000).toFixed(1)}M
                      </div>
                    );
                  })()}
                </div>

                {/* Hide all Plotly tooltips completely */}
                <style jsx>{`
                  :global(.hoverlayer) {
                    display: none !important;
                  }
                `}</style>
              <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[700px]">
                <Plot
                  data={[
                    // Candlestick trace with Traderra red/white colors
                    {
                      x: chartData.x,
                      open: chartData.open,
                      high: chartData.high,
                      low: chartData.low,
                      close: chartData.close,
                      customdata: chartData.volume, // Add volume as custom data
                      type: 'candlestick',
                      name: ticker,
                      increasing: {
                        line: { color: '#FFFFFF' },
                        fillcolor: '#FFFFFF'
                      },
                      decreasing: {
                        line: { color: '#FF0000' },
                        fillcolor: '#FF0000'
                      },
                      showlegend: false,
                      yaxis: 'y',
                      hovertemplate: '%{x|%b %d, %Y}<br>' +
                        'O: %{open:.2f} H: %{high:.2f} L: %{low:.2f} C: %{close:.2f}<br>' +
                        'V: %{customdata:,.0f}' +
                        '<extra></extra>'
                    },
                    // Volume bars matching candle colors
                    {
                      x: chartData.x,
                      y: chartData.volume,
                      type: 'bar',
                      name: 'Volume',
                      marker: { color: volumeColors },
                      opacity: 0.6,
                      yaxis: 'y2',
                      showlegend: false,
                      hoverinfo: 'skip'
                    }
                  ]}
                  layout={layout}
                  config={GLOBAL_PLOTLY_CONFIG}
                  className="w-full h-full"
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                onHover={(event: any) => {
                  console.log('🎯 HOVER EVENT TRIGGERED!', event);
                  if (event.points && event.points.length > 0) {
                    const point = event.points[0];
                    console.log('📍 Full point data:', point);

                    // Try to get data from multiple sources
                    let idx = point.pointIndex ?? point.pointNumber;

                    // Create formatted hover data for our custom legend
                    if (idx !== undefined && idx >= 0 && idx < chartData.x.length) {
                      const newHoverData = {
                        date: new Date(chartData.x[idx]).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }),
                        open: chartData.open[idx] || 0,
                        high: chartData.high[idx] || 0,
                        low: chartData.low[idx] || 0,
                        close: chartData.close[idx] || 0,
                        volume: chartData.volume[idx] || 0
                      };
                      setHoverData(newHoverData);
                    } else if (point.x && point.open !== undefined) {
                      // Fallback to direct point data
                      const newHoverData = {
                        date: point.x,
                        open: point.open,
                        high: point.high,
                        low: point.low,
                        close: point.close,
                        volume: point.volume || 0
                      };
                      console.log('📊 Using point OHLC data:', newHoverData);
                      setHoverData(newHoverData);
                    }
                    // Fallback to array index lookup
                    else if (idx !== undefined && chartData) {
                      const newHoverData = {
                        date: chartData.x[idx],
                        open: chartData.open[idx],
                        high: chartData.high[idx],
                        low: chartData.low[idx],
                        close: chartData.close[idx],
                        volume: chartData.volume[idx]
                      };
                      console.log('📊 Using array index data:', newHoverData);
                      setHoverData(newHoverData);
                    }
                  }
                }}
                onUnhover={() => {
                  console.log('🔴 UNHOVER - clearing legend');
                  setHoverData(null);
                }}
                />
              </div>
              </>
            );
          })()

        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm studio-muted mb-2">No chart data</div>
              <div className="text-xs studio-muted">Select a ticker from results</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartWithControls;
