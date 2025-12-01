'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ExecutionTrade {
  id: string;
  symbol: string;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  shares: number;
  pnl?: number;
  entryReason: string;
  exitReason?: string;
  status: 'open' | 'closed';
}

interface ExecutionChartProps {
  symbol: string;
  chartData: ChartData[];
  trades: ExecutionTrade[];
  isRunning: boolean;
}

// Custom legend component for OHLC data
const ChartLegend: React.FC<{ chartData: ChartData[]; hoveredIndex: number | null }> = ({ chartData, hoveredIndex }) => {
  if (!chartData || chartData.length === 0) return null;

  const displayIndex = hoveredIndex ?? chartData.length - 1;
  const data = chartData[displayIndex];

  if (!data) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  };

  return (
    <div className="absolute top-2 left-2 z-[100] pointer-events-none">
      <div className="bg-black border border-gray-500 rounded px-2 py-1 text-xs font-mono text-white shadow-lg">
        <div className="text-gray-300 mb-1">
          {formatDate(data.time)}
        </div>
        <div className="text-white">
          O {data.open.toFixed(2)} H {data.high.toFixed(2)} L {data.low.toFixed(2)} C {data.close.toFixed(2)}
        </div>
        <div className="text-white mt-1">
          V {formatVolume(data.volume)}
        </div>
      </div>
    </div>
  );
};

const ExecutionChart: React.FC<ExecutionChartProps> = ({
  symbol,
  chartData,
  trades,
  isRunning
}) => {
  const plotRef = useRef<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Process chart data for Plotly
  const { candlestickData, entryMarkers, exitMarkers, layout } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        candlestickData: {},
        entryMarkers: {},
        exitMarkers: {},
        layout: {}
      };
    }

    // Prepare candlestick data
    const candlestickData = {
      x: chartData.map(d => d.time),
      open: chartData.map(d => d.open),
      high: chartData.map(d => d.high),
      low: chartData.map(d => d.low),
      close: chartData.map(d => d.close),
      type: 'candlestick' as const,
      name: symbol,
      increasing: { line: { color: 'var(--trading-profit)' } },
      decreasing: { line: { color: 'var(--trading-loss)' } },
      xaxis: 'x',
      yaxis: 'y',
      hoverinfo: 'none',  // Disable default tooltips
      hovertemplate: ''   // Completely suppress hover template
    };

    // Prepare entry markers (buy signals)
    const entryTimes: string[] = [];
    const entryPrices: number[] = [];
    const entryTexts: string[] = [];
    const entryColors: string[] = [];

    trades.forEach(trade => {
      entryTimes.push(trade.entryTime);
      entryPrices.push(trade.entryPrice);
      entryTexts.push(`${trade.entryReason}<br>Entry: $${trade.entryPrice.toFixed(2)}<br>Shares: ${trade.shares}`);
      entryColors.push(trade.status === 'open' ? 'var(--primary)' : 'var(--trading-profit)'); // Gold for open, green for closed
    });

    const entryMarkers = {
      x: entryTimes,
      y: entryPrices,
      mode: 'markers' as const,
      type: 'scatter' as const,
      name: 'Entry Points',
      marker: {
        symbol: 'triangle-up',
        size: 12,
        color: entryColors,
        line: { color: '#000', width: 1 }
      },
      text: entryTexts,
      hovertemplate: '',
      xaxis: 'x',
      yaxis: 'y'
    };

    // Prepare exit markers (sell signals)
    const exitTimes: string[] = [];
    const exitPrices: number[] = [];
    const exitTexts: string[] = [];
    const exitColors: string[] = [];

    trades
      .filter(trade => trade.status === 'closed' && trade.exitTime && trade.exitPrice)
      .forEach(trade => {
        exitTimes.push(trade.exitTime!);
        exitPrices.push(trade.exitPrice!);
        const pnl = trade.pnl || 0;
        const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        exitTexts.push(`${trade.exitReason}<br>Exit: $${trade.exitPrice!.toFixed(2)}<br>P&L: ${pnlText}`);
        exitColors.push(pnl >= 0 ? 'var(--trading-profit)' : 'var(--trading-loss)'); // Green for profit, red for loss
      });

    const exitMarkers = {
      x: exitTimes,
      y: exitPrices,
      mode: 'markers' as const,
      type: 'scatter' as const,
      name: 'Exit Points',
      marker: {
        symbol: 'triangle-down',
        size: 12,
        color: exitColors,
        line: { color: '#000', width: 1 }
      },
      text: exitTexts,
      hovertemplate: '',
      xaxis: 'x',
      yaxis: 'y'
    };

    // Calculate price range for layout
    const allPrices = chartData.flatMap(d => [d.high, d.low]);
    const priceRange = Math.max(...allPrices) - Math.min(...allPrices);
    const padding = priceRange * 0.1;

    const layout = {
      title: {
        text: `${symbol} - Execution Dashboard ${isRunning ? '(LIVE)' : '(STOPPED)'}`,
        font: { color: 'var(--primary)', size: 16 },
        x: 0.5
      },
      xaxis: {
        title: 'Time',
        type: 'date' as const,
        gridcolor: 'var(--studio-border)',
        color: 'var(--studio-muted)',
        rangeslider: { visible: false }
      },
      yaxis: {
        title: 'Price ($)',
        gridcolor: 'var(--studio-border)',
        color: 'var(--studio-muted)',
        range: [
          Math.min(...allPrices) - padding,
          Math.max(...allPrices) + padding
        ]
      },
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { color: 'var(--studio-text)' },
      margin: { t: 40, r: 20, b: 40, l: 60 },
      height: 500,
      showlegend: false,
      hovermode: false,
      legend: {
        x: 0,
        y: 1,
        bgcolor: 'var(--studio-surface)',
        bordercolor: 'var(--studio-border)',
        borderwidth: 1,
        font: { color: 'var(--studio-text)', size: 10 }
      },
      annotations: [
        ...(isRunning ? [{
          text: 'LIVE',
          x: 1,
          y: 1,
          xref: 'paper' as const,
          yref: 'paper' as const,
          showarrow: false,
          font: { color: '#00FF00', size: 12, family: 'Arial Black' },
          bgcolor: 'rgba(0,255,0,0.1)',
          bordercolor: '#00FF00',
          borderwidth: 1
        }] : [])
      ]
    };

    return {
      candlestickData,
      entryMarkers,
      exitMarkers,
      layout
    };
  }, [chartData, trades, symbol, isRunning]);

  // Calculate volume data for subplot
  const volumeData = useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    return {
      x: chartData.map(d => d.time),
      y: chartData.map(d => d.volume),
      type: 'bar' as const,
      name: 'Volume',
      marker: { color: '#444' },
      xaxis: 'x',
      yaxis: 'y2'
    };
  }, [chartData]);

  // Update layout to include volume subplot
  const finalLayout = useMemo(() => {
    if (!layout || Object.keys(layout).length === 0) return {};

    return {
      ...layout,
      yaxis2: {
        title: 'Volume',
        side: 'right' as const,
        overlaying: 'y',
        gridcolor: '#333',
        color: '#888',
        showgrid: false
      },
      height: 600
    };
  }, [layout]);

  // Auto-scroll to latest data when new data arrives
  useEffect(() => {
    if (plotRef.current && chartData.length > 0 && isRunning) {
      const latestTime = chartData[chartData.length - 1].time;
      const earliestTime = chartData[Math.max(0, chartData.length - 100)].time; // Show last 100 bars

      if (plotRef.current.plotly) {
        plotRef.current.plotly.relayout('xaxis.range', [earliestTime, latestTime]);
      }
    }
  }, [chartData, isRunning]);

  // Prepare all traces
  const plotData = useMemo(() => {
    const traces = [];

    // Add candlestick data if available
    if (candlestickData && Object.keys(candlestickData).length > 0) {
      traces.push(candlestickData);
    }

    // Add volume data if available
    if (volumeData && Object.keys(volumeData).length > 0) {
      traces.push(volumeData);
    }

    // Add entry markers if available
    if (entryMarkers && Object.keys(entryMarkers).length > 0 && 'x' in entryMarkers && entryMarkers.x.length > 0) {
      traces.push(entryMarkers);
    }

    // Add exit markers if available
    if (exitMarkers && Object.keys(exitMarkers).length > 0 && 'x' in exitMarkers && exitMarkers.x.length > 0) {
      traces.push(exitMarkers);
    }

    return traces;
  }, [candlestickData, volumeData, entryMarkers, exitMarkers]);

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true,
    displaylogo: false,
    modeBarButtonsToAdd: [
      {
        name: 'Auto-scroll',
        icon: {
          width: 24,
          height: 24,
          path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        },
        click: () => {
          if (chartData.length > 0) {
            const latestTime = chartData[chartData.length - 1].time;
            const earliestTime = chartData[Math.max(0, chartData.length - 50)].time;

            if (plotRef.current && plotRef.current.plotly) {
              plotRef.current.plotly.relayout('xaxis.range', [earliestTime, latestTime]);
            }
          }
        }
      }
    ]
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] border studio-border rounded-lg studio-surface">
        <div className="text-center">
          <div className="studio-muted text-lg mb-2">No Chart Data Available</div>
          <div className="studio-muted text-sm">
            {isRunning ? 'Waiting for market data...' : 'Start execution to see live data'}
          </div>
        </div>
      </div>
    );
  }

  // Hover handlers for custom legend
  const handleHover = (eventData: any) => {
    if (eventData.points && eventData.points.length > 0) {
      const point = eventData.points[0];
      if (point?.pointIndex !== undefined) {
        setHoveredIndex(point.pointIndex);
      }
    }
  };

  const handleUnhover = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="w-full h-full relative">
      {/* CSS to completely hide all Plotly tooltips */}
      <style jsx>{`
        :global(.hoverlayer .hovertext) {
          display: none !important;
        }
        :global(.hoverlayer) {
          pointer-events: none !important;
        }
        :global(.plotly .modebar) {
          display: none !important;
        }
      `}</style>
      <Plot
        ref={plotRef}
        data={plotData}
        layout={finalLayout}
        config={config}
        className="w-full h-full"
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        onHover={handleHover}
        onUnhover={handleUnhover}
      />

      {/* Custom OHLC Legend */}
      <ChartLegend chartData={chartData} hoveredIndex={hoveredIndex} />

      {/* Trade Summary Overlay */}
      <div className="absolute top-4 right-4 studio-surface backdrop-blur-sm border studio-border rounded-lg p-3 text-xs">
        <div className="text-primary font-medium mb-2">Trade Summary</div>
        <div className="space-y-1 studio-muted">
          <div>Total Trades: <span className="studio-text number-font">{trades.length}</span></div>
          <div>Open Positions: <span className="text-primary number-font">{trades.filter(t => t.status === 'open').length}</span></div>
          <div>Closed Trades: <span className="studio-muted number-font">{trades.filter(t => t.status === 'closed').length}</span></div>
          <div>Total P&L:
            <span className={`ml-1 number-font ${
              trades.reduce((sum, t) => sum + (t.pnl || 0), 0) >= 0 ? 'profit-text' : 'loss-text'
            }`}>
              ${trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {isRunning && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-[var(--trading-profit)]/20 border border-[var(--trading-profit)] rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-[var(--trading-profit)] rounded-full animate-pulse"></div>
          <span className="text-[var(--trading-profit)] text-xs font-medium">LIVE EXECUTION</span>
        </div>
      )}
    </div>
  );
};

export default ExecutionChart;