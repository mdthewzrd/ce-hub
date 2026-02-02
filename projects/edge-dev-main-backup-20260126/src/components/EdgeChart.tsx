'use client'

/**
 * Edge.dev Global Chart Component - Unified Template System
 * Uses global configuration to ensure IDENTICAL behavior across ALL charts
 * Fixes SMCI 2/18/25 5-minute chart duplication through standardized templating
 */

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

// Import GLOBAL chart configuration system
import {
  Timeframe,
  GLOBAL_CHART_TEMPLATES,
  GLOBAL_PLOTLY_CONFIG,
  generateGlobalLayout,
  generateGlobalRangebreaks,
  calculateGlobalDataBounds,
  generateGlobalTraces,
  generateGlobalMarketSessionShapes
} from '../config/globalChartConfig';

// Helper function to adjust date from day-1 to day 0 for display
// Matches the backend date adjustment logic (adds 1 trading day)
function adjustDateToDay0(dateString: string): string {
  if (!dateString) return dateString;

  try {
    const date = new Date(dateString);
    const adjusted = new Date(date);
    adjusted.setDate(date.getDate() + 1); // Add 1 day

    // Skip weekends
    const dayOfWeek = adjusted.getDay();
    if (dayOfWeek === 6) { // Saturday
      adjusted.setDate(adjusted.getDate() + 2); // Skip to Monday
    } else if (dayOfWeek === 0) { // Sunday
      adjusted.setDate(adjusted.getDate() + 1); // Skip to Monday
    }

    return adjusted.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
}

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-black rounded-lg border border-gray-800">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <div className="text-sm text-gray-400">Loading chart...</div>
      </div>
    </div>
  )
});

// GLOBAL chart data interface - IDENTICAL FOR ALL CHARTS
export interface ChartData {
  x: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

// TradingView-style fixed legend component
interface ChartLegendProps {
  symbol: string;
  data: ChartData;
  timeframe: Timeframe;
  dayNavigation?: any;
}

const ChartLegend: React.FC<ChartLegendProps> = ({ symbol, data, timeframe, dayNavigation }) => {
  // Internal hover state management
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Effect to handle custom chart events
  useEffect(() => {
    // Handle custom hover events from EdgeChart
    const handleChartHover = (event: CustomEvent) => {
      const pointIndex = event.detail.pointIndex;
      if (pointIndex !== undefined && pointIndex >= 0 && pointIndex < data.x.length) {
        setHoveredIndex(pointIndex);
      }
    };

    const handleChartUnhover = () => {
      setHoveredIndex(null);
    };

    const handleChartCrosshair = (event: CustomEvent) => {
      const pointIndex = event.detail.pointIndex;
      if (pointIndex !== undefined && pointIndex >= 0 && pointIndex < data.x.length) {
        setHoveredIndex(pointIndex);
      }
    };

    // Attach event listeners
    window.addEventListener('chartHover', handleChartHover as EventListener);
    window.addEventListener('chartUnhover', handleChartUnhover as EventListener);
    window.addEventListener('chartCrosshair', handleChartCrosshair as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('chartHover', handleChartHover as EventListener);
      window.removeEventListener('chartUnhover', handleChartUnhover as EventListener);
      window.removeEventListener('chartCrosshair', handleChartCrosshair as EventListener);
    };
  }, [data.x.length]);

  // Calculate correct default index when crosshair is idle
  const getDefaultDisplayIndex = () => {
    // For daily timeframe with dayNavigation, use the calculated position
    if (timeframe === 'day' && dayNavigation) {
      // For D0 (dayOffset === 0), use the last index (which should be D0 after filtering)
      if (dayNavigation.dayOffset === 0) {
        const d0Index = Math.max(0, data.x.length - 1);
        return d0Index;
      }

      // For other days, calculate from the end
      if (dayNavigation.dayOffset > 0) {
        const targetIndex = Math.max(0, data.x.length - 1 - dayNavigation.dayOffset);
        return targetIndex;
      }
    }

    // Fallback: use last index for idle state
    const fallbackIndex = Math.max(0, data.x.length - 1);
    return fallbackIndex;
  };

  // Show hovered bar if available, otherwise show calculated default bar
  const displayIndex = hoveredIndex ?? getDefaultDisplayIndex();

  // Show empty legend if no data - BULLETPROOF VISIBILITY
  if (!data.x.length || displayIndex < 0 || displayIndex >= data.x.length) {
    return (
      <div className="absolute top-16 left-4 pointer-events-none" style={{
        zIndex: 999999,
        position: 'absolute',
        top: '64px',
        left: '16px'
      }}>
        <div className="rounded px-3 py-2 shadow-xl" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="flex items-center font-mono whitespace-nowrap" style={{ fontSize: '14px' }}>
            <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>  {symbol}</span>
            <span style={{ color: '#D4AF37', marginLeft: '8px' }}>Loading data... ({data.x.length} bars)</span>
          </div>
        </div>
      </div>
    );
  }

  const barData = {
    open: data.open[displayIndex]?.toFixed(2) || '--',
    high: data.high[displayIndex]?.toFixed(2) || '--',
    low: data.low[displayIndex]?.toFixed(2) || '--',
    close: data.close[displayIndex]?.toFixed(2) || '--',
    volume: data.volume[displayIndex] ? new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(data.volume[displayIndex]) : '--',
    date: data.x[displayIndex] || ''  // Show actual candle date (not adjusted)
  };

  // Format date and time based on timeframe
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);

      // Always use Eastern Time for market data display
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };

      if (timeframe === 'day') {
        return date.toLocaleDateString('en-US', options);
      } else {
        return {
          date: date.toLocaleDateString('en-US', options),
          time: date.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      }
    } catch {
      return timeframe === 'day' ? dateStr : { date: dateStr, time: '' };
    }
  };

  const dateTime = formatDateTime(barData.date);
  const isIntraday = timeframe !== 'day';

  // Determine price color based on close vs open
  const priceChange = parseFloat(barData.close) - parseFloat(barData.open);
  const priceColor = priceChange >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="absolute top-16 left-4 pointer-events-none" style={{
      zIndex: 999999,
      position: 'absolute',
      top: '64px',
      left: '16px'
    }}>
      <div className="rounded px-3 py-2 shadow-xl" style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)'
      }}>
        {/* Single Row TradingView Style Legend */}
        <div className="flex items-center font-mono whitespace-nowrap" style={{ fontSize: '14px' }}>
          {/* Symbol */}
          <span style={{ color: '#D4AF37', fontWeight: 'bold', marginRight: '16px' }}>
            {symbol}
          </span>

          {/* Date/Time */}
          <span style={{ color: '#D4AF37', marginRight: '16px' }}>
            {isIntraday ? (
              <>
                {(dateTime as any).date} {(dateTime as any).time}
              </>
            ) : (
              dateTime as string
            )}
          </span>

          {/* OHLCV Values in single row with explicit spacing */}
          <span style={{ color: '#D4AF37', marginRight: '12px' }}>O:<span className="text-white" style={{ marginLeft: '4px' }}>{barData.open}</span></span>

          <span style={{ color: '#D4AF37', marginRight: '12px' }}>H:<span className="text-green-400" style={{ marginLeft: '4px' }}>{barData.high}</span></span>

          <span style={{ color: '#D4AF37', marginRight: '12px' }}>L:<span className="text-red-400" style={{ marginLeft: '4px' }}>{barData.low}</span></span>

          <span style={{ color: '#D4AF37', marginRight: '12px' }}>C:<span className={priceColor} style={{ marginLeft: '4px' }}>{barData.close}</span></span>

          <span style={{ color: '#D4AF37', marginRight: '16px' }}>V:<span className="text-blue-400" style={{ marginLeft: '4px' }}>{barData.volume}</span></span>

          {/* Price Change */}
          {priceChange !== 0 && (
            <>
              <span style={{ color: '#D4AF37', marginLeft: '8px', marginRight: '8px' }}>|</span>
              <span style={{ color: '#D4AF37', fontSize: '14px' }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({((priceChange / parseFloat(barData.open)) * 100).toFixed(2)}%)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface EdgeChartProps {
  symbol: string;
  timeframe: Timeframe;
  data: ChartData;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  className?: string;
  // Day navigation props for LC pattern analysis
  dayNavigation?: {
    currentDay: Date;
    dayOffset: number;
    isHistorical?: boolean;      // True if this is historical backtest data
    historicalLabel?: string;     // Label to show for historical data (e.g., "Backtest: Strategy Name")
    canGoPrevious: boolean;
    canGoNext: boolean;
    onPreviousDay: () => void;
    onNextDay: () => void;
    onResetDay: () => void;
    onQuickJump: (jumpDays: number) => void;
  };
  // Execution wedges for backtest visualization
  executionWedges?: Array<{
    type: 'buy' | 'sell';  // buy = green wedge up, sell = red wedge down
    date: string;           // ISO date string
    price: number;          // Price level for wedge
    size?: number;          // Optional size of the trade
  }>;
}

export const EdgeChart: React.FC<EdgeChartProps> = ({
  symbol,
  timeframe,
  data,
  onTimeframeChange,
  className = "",
  dayNavigation,
  executionWedges = []
}) => {
  // CRITICAL: Use GLOBAL template system exclusively
  const template = GLOBAL_CHART_TEMPLATES[timeframe];

  // Hover state management for custom legend - managed in ChartLegend component
  // These handlers dispatch custom events that ChartLegend listens to

  // Plotly event handlers for custom legend
  const handleHover = (eventData: any) => {
    // This handler is mainly for the native Plotly events below
    // The React-plotly wrapper doesn't reliably provide pointIndex
    // So we rely on the native Plotly events in onInitialized
  };

  const handleUnhover = () => {
    // This handler is mainly for the native Plotly events below
    // The React-plotly wrapper doesn't reliably trigger unhover
    // So we rely on the native Plotly events in onInitialized
  };

  // CRITICAL: Generate ALL chart elements using GLOBAL functions
  const rangebreaks = generateGlobalRangebreaks(timeframe, data);
  const { xRange, yRange, volumeRange } = calculateGlobalDataBounds(data, timeframe, dayNavigation);
  const traces = generateGlobalTraces(symbol, data);
  const marketSessionShapes = generateGlobalMarketSessionShapes(timeframe, data);

  // Generate execution wedge shapes for backtest visualization
  const executionWedgeShapes = executionWedges.map((wedge) => {
    // Match wedge date to chart data index
    const wedgeDateOnly = wedge.date.split('T')[0];
    const wedgeIndex = data.x.findIndex(x => x.startsWith(wedgeDateOnly));

    if (wedgeIndex === -1) {
      console.log(`❌ Wedge not found: ${wedge.type} @ ${wedge.date} (looking for ${wedgeDateOnly})`);
      console.log(`   Available chart dates: ${data.x.slice(0, 5).join(', ')}...`);
      return null;
    }

    console.log(`✅ Adding wedge: ${wedge.type} @ ${wedge.price} on ${wedge.date} (index ${wedgeIndex})`);
    console.log(`   Chart date at that index: ${data.x[wedgeIndex]}`);

    // Use actual date string for x-coordinate
    const xDate = data.x[wedgeIndex];
    const yPrice = wedge.price;

    // Use Plotly's built-in triangle markers
    return {
      type: 'scatter',
      mode: 'markers',
      x: [xDate],
      y: [yPrice],
      marker: {
        symbol: wedge.type === 'buy' ? 'triangle-up' : 'triangle-down',
        size: 20,
        color: wedge.type === 'buy' ? 'rgba(74, 222, 128, 1)' : 'rgba(248, 113, 113, 1)',
        line: {
          color: wedge.type === 'buy' ? '#22c55e' : '#ef4444',
          width: 2
        }
      },
      name: `${wedge.type.toUpperCase()} @ $${yPrice.toFixed(2)}`,
      text: [`${wedge.type.toUpperCase()} @ $${yPrice.toFixed(2)}`],
      hovertemplate: '<b>%{text}</b><br>%{x}<extra></extra>',
      showlegend: false
    };
  }).filter(Boolean);

  // Merge market session shapes (execution wedges are traces, not shapes)
  const allShapes = [...marketSessionShapes];

  // Add execution wedge traces to the main traces
  const allTraces = [...traces, ...executionWedgeShapes];

  const layout = generateGlobalLayout(
    symbol,
    timeframe,
    xRange,
    yRange,
    volumeRange,
    rangebreaks,
    allShapes,  // Pass merged shapes instead of just marketSessionShapes
    data
  );

  return (
    <div className={`w-full ${className}`}>

      {/* GLOBAL timeframe selector with day navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-6">
          {/* GLOBAL timeframe buttons with Traderra professional styling */}
          <div className="flex space-x-3">
            {Object.keys(GLOBAL_CHART_TEMPLATES).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange?.(tf as Timeframe)}
                style={{
                  backgroundColor: timeframe === tf ? '#D4AF37' : 'rgba(17, 17, 17, 0.8)',
                  color: timeframe === tf ? '#000000' : '#D4AF37',
                  border: timeframe === tf ? '2px solid #D4AF37' : '2px solid rgba(212, 175, 55, 0.3)',
                  fontWeight: '600',
                  padding: '8px 16px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: timeframe === tf
                    ? '0 4px 12px rgba(212, 175, 55, 0.4)'
                    : '0 2px 6px rgba(0, 0, 0, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  if (timeframe !== tf) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                    e.currentTarget.style.borderColor = '#D4AF37';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (timeframe !== tf) {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 17, 17, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                    e.currentTarget.style.color = '#D4AF37';
                  }
                }}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Day navigation arrows (only when LC pattern analysis is active) */}
          {dayNavigation && (
            <div
              className="flex items-center space-x-3 pl-6"
              style={{
                borderLeft: '2px solid rgba(212, 175, 55, 0.3)',
                paddingLeft: '24px'
              }}
            >
              <button
                onClick={dayNavigation.onPreviousDay}
                disabled={!dayNavigation.canGoPrevious}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  backgroundColor: !dayNavigation.canGoPrevious
                    ? 'rgba(17, 17, 17, 0.5)'
                    : 'rgba(17, 17, 17, 0.8)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: !dayNavigation.canGoPrevious ? '#666' : '#D4AF37',
                  cursor: !dayNavigation.canGoPrevious ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: !dayNavigation.canGoPrevious ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (dayNavigation.canGoPrevious) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                    e.currentTarget.style.borderColor = '#D4AF37';
                  }
                }}
                onMouseLeave={(e) => {
                  if (dayNavigation.canGoPrevious) {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 17, 17, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  }
                }}
                title="Previous Trading Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div
                className="text-center min-w-[90px] px-3 py-2 rounded"
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  fontFamily: 'monospace'
                }}
              >
                {dayNavigation.isHistorical && (
                  <div style={{
                    color: '#FF6B6B',
                    fontWeight: 'bold',
                    fontSize: '9px',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                    padding: '2px 6px',
                    backgroundColor: 'rgba(255, 107, 107, 0.15)',
                    borderRadius: '3px',
                    border: '1px solid rgba(255, 107, 107, 0.3)'
                  }}>
                    HISTORICAL
                  </div>
                )}
                <div style={{
                  color: '#D4AF37',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  letterSpacing: '0.5px'
                }}>
                  {dayNavigation.dayOffset === 0 ? 'Day 0' : dayNavigation.dayOffset > 0 ? `Day +${dayNavigation.dayOffset}` : `Day ${dayNavigation.dayOffset}`}
                </div>
                <div style={{
                  color: '#ffffff',
                  fontSize: '10px',
                  marginTop: '2px'
                }}>
                  {dayNavigation.currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {dayNavigation.isHistorical && dayNavigation.historicalLabel && (
                  <div style={{
                    color: '#AAAAAA',
                    fontSize: '8px',
                    marginTop: '2px',
                    fontStyle: 'italic'
                  }}>
                    {dayNavigation.historicalLabel}
                  </div>
                )}
              </div>

              <button
                onClick={dayNavigation.onNextDay}
                disabled={!dayNavigation.canGoNext}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  backgroundColor: !dayNavigation.canGoNext
                    ? 'rgba(17, 17, 17, 0.5)'
                    : 'rgba(17, 17, 17, 0.8)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: !dayNavigation.canGoNext ? '#666' : '#D4AF37',
                  cursor: !dayNavigation.canGoNext ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: !dayNavigation.canGoNext ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (dayNavigation.canGoNext) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                    e.currentTarget.style.borderColor = '#D4AF37';
                  }
                }}
                onMouseLeave={(e) => {
                  if (dayNavigation.canGoNext) {
                    e.currentTarget.style.backgroundColor = 'rgba(17, 17, 17, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  }
                }}
                title="Next Trading Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={dayNavigation.onResetDay}
                disabled={dayNavigation.dayOffset === 0}
                style={{
                  padding: '6px 8px',
                  marginLeft: '8px',
                  borderRadius: '4px',
                  backgroundColor: dayNavigation.dayOffset === 0
                    ? 'rgba(17, 17, 17, 0.5)'
                    : 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.6)',
                  color: dayNavigation.dayOffset === 0 ? '#666' : '#D4AF37',
                  cursor: dayNavigation.dayOffset === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: dayNavigation.dayOffset === 0 ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (dayNavigation.dayOffset !== 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.25)';
                    e.currentTarget.style.borderColor = '#D4AF37';
                  }
                }}
                onMouseLeave={(e) => {
                  if (dayNavigation.dayOffset !== 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
                  }
                }}
                title="Reset to LC Pattern Day (Day 0)"
              >
                <RotateCcw className="h-3 w-3" />
              </button>

              {/* Quick jump buttons */}
              <div
                className="flex items-center space-x-3 pl-6 ml-4"
                style={{
                  borderLeft: '2px solid rgba(212, 175, 55, 0.3)',
                  paddingLeft: '24px'
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    color: '#D4AF37',
                    fontWeight: '500',
                    letterSpacing: '0.5px',
                    marginRight: '8px'
                  }}
                >
                  JUMP:
                </span>
                {[0, 1, 3, 7, 14, 21].map((days) => {
                  // CRITICAL FIX: Force D0 to be active when dayOffset is 0
                  const isActiveDay = dayNavigation.dayOffset === 0 ? days === 0 : days === dayNavigation.dayOffset;
                  const isPlus14D = days === 14;

                  return (
                    <button
                      key={days}
                      onClick={() => dayNavigation.onQuickJump?.(days - dayNavigation.dayOffset)}
                      disabled={days > 21}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        backgroundColor: days > 21
                          ? 'rgba(17, 17, 17, 0.5)'
                          : isActiveDay
                            ? 'rgba(212, 175, 55, 0.8)' // Gold for all active days
                            : 'rgba(17, 17, 17, 0.8)', // Dark background for all inactive days
                        border: isActiveDay
                          ? '2px solid rgba(212, 175, 55, 0.8)' // Gold border for all active days
                          : '1px solid rgba(212, 175, 55, 0.4)', // Gold border for all inactive days
                        color: days > 21
                          ? '#666'
                          : isActiveDay
                            ? '#ffffff' // White text for active day
                            : '#D4AF37', // Gold text for all inactive days
                        cursor: days > 21 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: isActiveDay ? 'bold' : 'normal',
                        opacity: days > 21 ? 0.4 : 1,
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => {
                        if (days <= 21 && !isActiveDay) {
                          e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                          e.currentTarget.style.borderColor = '#D4AF37';
                          e.currentTarget.style.color = '#ffffff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (days <= 21 && !isActiveDay) {
                          e.currentTarget.style.backgroundColor = 'rgba(17, 17, 17, 0.8)';
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                          e.currentTarget.style.color = '#D4AF37';
                        }
                      }}
                      title={
                        days === 0 ? 'Go to LC Pattern Day (Day 0)' :
                        days === 1 ? 'Go to Day +1' :
                        days === 14 ? 'Go to Day +14 (2 weeks)' :
                        `Go to Day +${days}`
                      }
                    >
                      {days === 0 ? 'D0' : `+${days}D`}
                    </button>
                  );
                })}

                </div>
            </div>
          )}
        </div>

      </div>

      {/* CRITICAL: Chart with GLOBAL configuration only - Responsive height */}
      <div className="relative w-full h-full">
        <Plot
            data={allTraces}
            layout={layout}
            config={GLOBAL_PLOTLY_CONFIG}
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
            useResizeHandler={false}  // CRITICAL: Disabled to prevent duplication
            onHover={handleHover}
            onUnhover={handleUnhover}
            revision={0}
          onInitialized={(figure: any, graphDiv: any) => {
            // CRITICAL: Add native Plotly.js event listeners for crosshair legend
            if (graphDiv && graphDiv.on) {
              // Native plotly_hover event - CONNECT TO REACT STATE
              graphDiv.on('plotly_hover', (eventData: any) => {
                // Extract point index from native Plotly event
                if (eventData.points && eventData.points.length > 0) {
                  const point = eventData.points[0];
                  let pointIndex = null;

                  if (point?.pointIndex !== undefined) {
                    pointIndex = point.pointIndex;
                  } else if (point?.pointNumber !== undefined) {
                    pointIndex = point.pointNumber;
                  }

                  // Update legend by dispatching custom event
                  if (pointIndex !== null && pointIndex >= 0 && pointIndex < data.x.length) {
                    // Dispatch custom event for legend to handle
                    window.dispatchEvent(new CustomEvent('chartHover', { detail: { pointIndex } }));
                  }
                }
              });

              // Native plotly_unhover event - REVERT TO MOST RECENT CANDLE
              graphDiv.on('plotly_unhover', (eventData: any) => {
                // Dispatch custom event for legend to handle
                window.dispatchEvent(new CustomEvent('chartUnhover', { detail: {} }));
              });

              // Enhanced mousemove event for crosshair legend updating
              graphDiv.addEventListener('mousemove', (e: any) => {
                // Get the chart area bounds
                const rect = graphDiv.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Get plot area dimensions (excluding margins/padding)
                const plotArea = graphDiv._fullLayout;
                if (!plotArea) return;

                const plotLeft = plotArea.margin.l || 80;
                const plotRight = rect.width - (plotArea.margin.r || 80);
                const plotTop = plotArea.margin.t || 80;
                const plotBottom = rect.height - (plotArea.margin.b || 80);

                // Check if mouse is within the plot area
                if (mouseX >= plotLeft && mouseX <= plotRight && mouseY >= plotTop && mouseY <= plotBottom) {
                  // Calculate relative position within plot area (0 to 1)
                  const relativeX = (mouseX - plotLeft) / (plotRight - plotLeft);

                  // Map relative position to array index (more accurate for candlestick charts)
                  // Each candlestick is evenly spaced in the plot area
                  // The first candlestick is at position 1/(2*N) to 3/(2*N)
                  // The last candlestick is at position (2N-1)/(2N) to (2N+1)/(2N)
                  // where N = data.x.length

                  const N = data.x.length;
                  // Map relativeX [0, 1] to index [0, N-1]
                  // Using floor instead of round to match the visual candlestick position
                  let dataIndex = Math.floor(relativeX * N);

                  // Clamp to valid range
                  dataIndex = Math.max(0, Math.min(dataIndex, N - 1));

                  // Dispatch crosshair update event with the correct index
                  window.dispatchEvent(new CustomEvent('chartCrosshair', { detail: { pointIndex: dataIndex } }));
                } else {
                  // Mouse outside plot area - revert to most recent candle
                  window.dispatchEvent(new CustomEvent('chartUnhover', { detail: {} }));
                }
              });
            }
          // CRITICAL: Allow dynamic width and use container height
          if (figure && figure.layout) {
            figure.layout.autosize = true;   // Enable responsive sizing
            figure.layout.width = undefined; // Let container control width
            figure.layout.height = 1000;     // Match backtest page container height
          }
        }}
      />

        {/* Custom TradingView-style fixed legend - positioned over the chart */}
        <ChartLegend
          symbol={symbol}
          data={data}
          timeframe={timeframe}
          dayNavigation={dayNavigation}
        />
      </div>
    </div>
  );
};

// Re-export chart templates and types for page.tsx compatibility
export type { Timeframe } from '../config/globalChartConfig';
export { GLOBAL_CHART_TEMPLATES as CHART_TEMPLATES } from '../config/globalChartConfig';

export default EdgeChart;