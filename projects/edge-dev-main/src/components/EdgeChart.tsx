'use client'

/**
 * Edge.dev Global Chart Component - Unified Template System
 * Uses global configuration to ensure IDENTICAL behavior across ALL charts
 * Fixes SMCI 2/18/25 5-minute chart duplication through standardized templating
 */

import React, { useState } from 'react';
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
  hoveredIndex: number | null;
  timeframe: Timeframe;
}

const ChartLegend: React.FC<ChartLegendProps> = ({ symbol, data, hoveredIndex, timeframe }) => {
  // Debug logging
  console.log('🏷️ ChartLegend render:', { symbol, dataLength: data.x.length, hoveredIndex, timeframe });

  // Show hovered bar if available, otherwise show most recent bar
  const displayIndex = hoveredIndex ?? data.x.length - 1;

  // Show empty legend if no data - BULLETPROOF VISIBILITY
  if (!data.x.length || displayIndex < 0 || displayIndex >= data.x.length) {
    console.log('🏷️ Showing loading legend');
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
    date: data.x[displayIndex] || ''
  };

  // Format date and time based on timeframe
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (timeframe === 'day') {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        return {
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          time: date.toLocaleTimeString('en-US', {
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

  console.log('🏷️ Showing data legend:', { displayIndex, barData });

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
    canGoPrevious: boolean;
    canGoNext: boolean;
    onPreviousDay: () => void;
    onNextDay: () => void;
    onResetDay: () => void;
    onQuickJump: (jumpDays: number) => void;
  };
}

export const EdgeChart: React.FC<EdgeChartProps> = ({
  symbol,
  timeframe,
  data,
  onTimeframeChange,
  className = "",
  dayNavigation
}) => {
  // CRITICAL: Use GLOBAL template system exclusively
  const template = GLOBAL_CHART_TEMPLATES[timeframe];

  // Hover state management for custom legend
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Plotly event handlers for custom legend
  const handleHover = (eventData: any) => {
    console.log('    REACT onHover EVENT FIRED!    ');
    console.log('🔧 React-plotly.js wrapper successfully passed event to React!');
    console.log('  Event points:', eventData?.points || 'No points data');

    // Try multiple ways to get the point index for better reliability
    let pointIndex = null;

    if (eventData.points && eventData.points.length > 0) {
      const point = eventData.points[0];
      console.log('  First point data:', { pointIndex: point?.pointIndex, pointNumber: point?.pointNumber, x: point?.x, y: point?.y });

      // Try the first point's pointIndex (most common)
      if (point?.pointIndex !== undefined) {
        pointIndex = point.pointIndex;
        console.log('  Got pointIndex directly:', pointIndex);
      }
      // Try getting it from x-value if pointIndex is missing
      else if (point?.x !== undefined) {
        const hoveredX = point.x;
        pointIndex = data.x.findIndex(x => x === hoveredX);
        console.log('  Found pointIndex by x-value match:', pointIndex, 'for x:', hoveredX);
      }
    }

    if (pointIndex !== null && pointIndex >= 0 && pointIndex < data.x.length) {
      console.log(`  Legend updating to bar ${pointIndex}: ${data.x[pointIndex]} (Close: ${data.close[pointIndex]})`);
      setHoveredIndex(pointIndex);
    } else {
      console.log('❌ No valid point index found in hover event');
    }
  };

  const handleUnhover = () => {
    console.log('  Unhover event - reverting to most recent candle');
    setHoveredIndex(null); // Reverts to showing most recent candle
  };

  // CRITICAL: Generate ALL chart elements using GLOBAL functions
  const rangebreaks = generateGlobalRangebreaks(timeframe, data);
  const { xRange, yRange, volumeRange } = calculateGlobalDataBounds(data, timeframe, dayNavigation);
  const traces = generateGlobalTraces(symbol, data);
  const marketSessionShapes = generateGlobalMarketSessionShapes(timeframe, data);
  const layout = generateGlobalLayout(
    symbol,
    timeframe,
    xRange,
    yRange,
    volumeRange,
    rangebreaks,
    marketSessionShapes,
    data
  );

  // GLOBAL debug logging for ALL timeframes
  console.log(`  ${symbol} ${timeframe} Dynamic Chart Analysis:`);
  console.log(`  Crosshair spikeline config:`, {
    xaxis_showspikes: layout.xaxis.showspikes,
    xaxis_spikemode: layout.xaxis.spikemode,
    yaxis_showspikes: layout.yaxis.showspikes,
    yaxis_spikemode: layout.yaxis.spikemode,
    hovermode: layout.hovermode
  });
  console.log(`   Data points: ${data.x.length}`);
  console.log(`   Date range: ${data.x[0]} → ${data.x[data.x.length - 1]}`);
  console.log(`   X Range: ${xRange?.[0]} to ${xRange?.[1]}`);
  console.log(`   ${timeframe === 'day' ? 'Daily padding' : 'Dynamic rangebreaks'}: ${rangebreaks.length} ${timeframe === 'day' ? 'days padding' : 'gaps detected'}`);
  console.log(`   Traces: ${traces.length}`);
  console.log(`   Market session shapes: ${marketSessionShapes.length}`);
  console.log(`   Template: ${template.description}`);
  console.log(`     UNIFIED Global Template:  `);

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
                  {dayNavigation.currentDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
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
                {[3, 7, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => dayNavigation.onQuickJump(days)}
                    disabled={dayNavigation.dayOffset + days > 14}
                    style={{
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      backgroundColor: (dayNavigation.dayOffset + days > 14)
                        ? 'rgba(17, 17, 17, 0.5)'
                        : 'rgba(17, 17, 17, 0.8)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      color: (dayNavigation.dayOffset + days > 14) ? '#666' : '#D4AF37',
                      cursor: (dayNavigation.dayOffset + days > 14) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: (dayNavigation.dayOffset + days > 14) ? 0.4 : 1,
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      if (dayNavigation.dayOffset + days <= 14) {
                        e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';
                        e.currentTarget.style.borderColor = '#D4AF37';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (dayNavigation.dayOffset + days <= 14) {
                        e.currentTarget.style.backgroundColor = 'rgba(17, 17, 17, 0.8)';
                        e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                        e.currentTarget.style.color = '#D4AF37';
                      }
                    }}
                    title={`Jump forward ${days} trading days`}
                  >
                    +{days}
                  </button>
                ))}

                {/* D0 button for quick return to day zero */}
                <button
                  onClick={dayNavigation.onResetDay}
                  disabled={dayNavigation.dayOffset === 0}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    backgroundColor: dayNavigation.dayOffset === 0
                      ? 'rgba(17, 17, 17, 0.5)'
                      : '#D4AF37',
                    border: dayNavigation.dayOffset === 0
                      ? '1px solid rgba(212, 175, 55, 0.3)'
                      : '2px solid #D4AF37',
                    color: dayNavigation.dayOffset === 0 ? '#666' : '#000000',
                    cursor: dayNavigation.dayOffset === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: dayNavigation.dayOffset === 0 ? 0.4 : 1,
                    letterSpacing: '0.5px',
                    boxShadow: dayNavigation.dayOffset === 0
                      ? 'none'
                      : '0 4px 12px rgba(212, 175, 55, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    if (dayNavigation.dayOffset !== 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.9)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (dayNavigation.dayOffset !== 0) {
                      e.currentTarget.style.backgroundColor = '#D4AF37';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.4)';
                    }
                  }}
                  title="Jump back to Day 0 (LC Pattern Day)"
                >
                  D0
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CRITICAL: Chart with GLOBAL configuration only - Responsive height */}
      <div className="relative w-full h-full">
        <Plot
            data={traces}
            layout={layout}
            config={GLOBAL_PLOTLY_CONFIG}
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
            useResizeHandler={false}  // CRITICAL: Disabled to prevent duplication
            onHover={handleHover}
            onUnhover={handleUnhover}
            revision={0}
          onInitialized={(figure: any, graphDiv: any) => {
            // CRITICAL: Add native Plotly.js event listeners for debugging
            if (graphDiv && graphDiv.on) {
              console.log(`🔧 Adding native Plotly.js hover debugging for ${symbol} ${timeframe}`);

              // Native plotly_hover event - CONNECT TO REACT STATE
              graphDiv.on('plotly_hover', (eventData: any) => {
                console.log('🟢 NATIVE plotly_hover event detected!', eventData);
                console.log('  Native event points:', eventData.points);

                // Extract point index from native Plotly event
                if (eventData.points && eventData.points.length > 0) {
                  const point = eventData.points[0];
                  let pointIndex = null;

                  if (point?.pointIndex !== undefined) {
                    pointIndex = point.pointIndex;
                    console.log('  Native event pointIndex:', pointIndex);
                  } else if (point?.pointNumber !== undefined) {
                    pointIndex = point.pointNumber;
                    console.log('  Native event pointNumber:', pointIndex);
                  }

                  // Update React state for legend
                  if (pointIndex !== null && pointIndex >= 0 && pointIndex < data.x.length) {
                    console.log(`  NATIVE EVENT updating legend to bar ${pointIndex}: ${data.x[pointIndex]} (Close: ${data.close[pointIndex]})`);
                    setHoveredIndex(pointIndex);
                  }
                }
              });

              // Native plotly_unhover event - REVERT TO MOST RECENT CANDLE
              graphDiv.on('plotly_unhover', (eventData: any) => {
                console.log('🔴 NATIVE plotly_unhover event detected!', eventData);
                console.log('  NATIVE EVENT reverting legend to most recent candle');
                setHoveredIndex(null); // Reverts to showing most recent candle
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

                  // Convert to data index
                  const dataIndex = Math.round(relativeX * (data.x.length - 1));

                  // Clamp to valid range
                  const clampedIndex = Math.max(0, Math.min(dataIndex, data.x.length - 1));

                  // Only update if index changed to prevent excessive re-renders
                  if (clampedIndex !== hoveredIndex) {
                    console.log(`  Crosshair: mouseX=${mouseX.toFixed(0)}, relativeX=${relativeX.toFixed(3)}, dataIndex=${clampedIndex}, date=${data.x[clampedIndex]}`);
                    setHoveredIndex(clampedIndex);
                  }
                } else {
                  // Mouse outside plot area - revert to most recent candle
                  if (hoveredIndex !== null) {
                    console.log('  Mouse outside plot area - reverting to most recent candle');
                    setHoveredIndex(null);
                  }
                }
              });

              console.log('  Native Plotly.js event listeners attached');
            } else {
              console.log('❌ graphDiv or graphDiv.on not available for native events');
            }
          // CRITICAL: Allow dynamic width but preserve fixed height
          if (figure && figure.layout) {
            figure.layout.autosize = true;   // Enable responsive width
            figure.layout.width = undefined; // Let container control width
            figure.layout.height = 700;      // Ensure fixed height
          }

          // GLOBAL debug logging for initialization
          console.log(`  ${symbol} ${timeframe} Chart Initialized:`, {
            tracesCount: figure?.data?.length || 0,
            layoutDefined: !!figure?.layout,
            globalTemplateApplied: true,
            timeframeConfig: template.description
          });
        }}
      />

        {/* Custom TradingView-style fixed legend - positioned over the chart */}
        <ChartLegend
          symbol={symbol}
          data={data}
          hoveredIndex={hoveredIndex}
          timeframe={timeframe}
        />
      </div>
    </div>
  );
};

// Re-export chart templates and types for page.tsx compatibility
export { Timeframe, GLOBAL_CHART_TEMPLATES as CHART_TEMPLATES } from '../config/globalChartConfig';

export default EdgeChart;