/**
 * Edge.dev Chart Templates - React/TypeScript Version
 * Converted from /Users/michaeldurante/wzrd-algo/wzrd-algo-mini-files/utils/chart_templates.py
 * For React/Plotly.js integration with Edge.dev dashboard
 */

import React from 'react';
import Plot from 'react-plotly.js';

// Chart template configurations (converted from Python)
export const CHART_TEMPLATES = {
  day: {
    defaultDays: 60,
    barsPerDay: 1,
    warmupDays: 180, // ~120 trading days for EMA 89
    indicators: {
      vwap: false,
      prevClose: false,
      bands920: true,
      cloud920: true,
      bands7289: false,
      cloud7289: false,
    },
    zoomToCandles: true,
    useRangebreaks: false,
    description: "Daily chart with 9/20 EMA cloud and deviation bands"
  },

  hour: {
    defaultDays: 5,
    barsPerDay: 13.5, // 6.5 hours regular + 4 hours pre-market + 3 hours after-hours
    warmupDays: 30, // ~22 trading days × 13.5 hours = ~300 bars
    indicators: {
      vwap: true,
      prevClose: true,
      bands920: true,
      cloud920: true,
      bands7289: true,
      cloud7289: true,
    },
    zoomToCandles: false,
    useRangebreaks: true,
    rangebreaks: {
      weekends: { bounds: ["sat", "mon"] },
      nonTradingHours: { bounds: [20, 4], pattern: "hour" } // 8pm-4am
    },
    description: "Hourly chart with all indicators (VWAP, prev close, 9/20, 72/89)"
  },

  "15min": {
    defaultDays: 2,
    barsPerDay: 54, // 4 bars/hour × 13.5 hours
    warmupDays: 3, // Minimal warmup for speed
    indicators: {
      vwap: true,
      prevClose: true,
      bands920: true,
      cloud920: true,
      bands7289: false, // Disable for speed
      cloud7289: false, // Disable for speed
    },
    zoomToCandles: false,
    useRangebreaks: true,
    rangebreaks: {
      weekends: { bounds: ["sat", "mon"] },
      nonTradingHours: { bounds: [20, 4], pattern: "hour" }
    },
    description: "15-minute chart with all indicators"
  },

  "5min": {
    defaultDays: 1,
    barsPerDay: 192, // 12 bars/hour × 16 hours (4am-8pm)
    warmupDays: 30, // ~22 trading days × 192 bars = ~4224 bars
    indicators: {
      vwap: true,
      prevClose: true,
      bands920: true,
      cloud920: true,
      bands7289: true,
      cloud7289: true,
    },
    zoomToCandles: false,
    useRangebreaks: true,
    rangebreaks: {
      weekends: { bounds: ["sat", "mon"] },
      nonTradingHours: { bounds: [20, 4], pattern: "hour" }
    },
    description: "5-minute chart showing 4am-8pm with all indicators"
  }
} as const;

// Chart styling configuration (converted from Python)
export const CHART_STYLE = {
  theme: "plotly_dark",
  paperBgcolor: "#000000",
  plotBgcolor: "#000000",
  candleColors: {
    increasing: "#FFFFFF", // White bullish candles
    decreasing: "#FF0000"  // Red bearish candles
  },
  indicatorColors: {
    vwap: "#FFD700",           // Gold
    prevClose: "#808080",      // Gray dashed line
    ema9: "#00FF00",           // Green
    ema20: "#32CD32",          // Lime green
    ema72: "#00FF00",          // Green
    ema89: "#32CD32",          // Lime green
    cloudBullish: "#00FF00",   // Green (with opacity)
    cloudBearish: "#FF0000",   // Red (with opacity)
    bandsAbove: "#8B0000",     // Dark red
    bandsBelow: "#006400",     // Dark green
  },
  layout: {
    height: 800,
    margin: { l: 0, r: 0, t: 50, b: 10 },
    showlegend: false,
    hovermode: "x",
    dragmode: "pan"
  },
  grid: {
    color: "#333333"
  }
} as const;

// Slider configuration for each timeframe
export const SLIDER_CONFIG = {
  day: {
    min: 30,
    max: 365,
    help: "Number of days of daily data to display"
  },
  hour: {
    min: 1,
    max: 30,
    help: "Number of days of hourly data to display"
  },
  "15min": {
    min: 3,
    max: 30,
    help: "Number of days of 15-minute data to display (paid Polygon plan fetches additional warm-up data automatically)"
  },
  "5min": {
    min: 1,
    max: 10,
    help: "Number of days of 5-minute data to display (paid Polygon plan fetches additional warm-up data automatically)"
  }
} as const;

// Type definitions for TypeScript safety
export type Timeframe = keyof typeof CHART_TEMPLATES;

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
  prevClose?: number;
  ema9?: number[];
  ema20?: number[];
  ema72?: number[];
  ema89?: number[];
  bandsUpper?: number[];
  bandsLower?: number[];
}

// Helper functions (converted from Python)
export const getTemplate = (timeframe: Timeframe) => {
  return CHART_TEMPLATES[timeframe] || CHART_TEMPLATES.day;
};

export const getSliderConfig = (timeframe: Timeframe) => {
  return SLIDER_CONFIG[timeframe] || SLIDER_CONFIG.day;
};

export const getIndicatorDefaults = (timeframe: Timeframe) => {
  const template = getTemplate(timeframe);
  return template.indicators;
};

// Main Edge.dev Chart Component
interface EdgeChartProps {
  symbol: string;
  timeframe: Timeframe;
  data: ChartData;
  indicators?: IndicatorData;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  className?: string;
}

export const EdgeChart: React.FC<EdgeChartProps> = ({
  symbol,
  timeframe,
  data,
  indicators = {},
  onTimeframeChange,
  className = ""
}) => {
  const template = getTemplate(timeframe);
  const style = CHART_STYLE;

  // Build Plotly traces based on template configuration
  const traces: any[] = [
    // Candlestick trace
    {
      type: 'candlestick',
      x: data.x,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      increasing: { line: { color: style.candleColors.increasing } },
      decreasing: { line: { color: style.candleColors.decreasing } },
      name: symbol,
      yaxis: 'y'
    }
  ];

  // Add indicators based on template configuration
  if (template.indicators.vwap && indicators.vwap) {
    traces.push({
      type: 'scatter',
      x: data.x,
      y: indicators.vwap,
      mode: 'lines',
      line: { color: style.indicatorColors.vwap, width: 1 },
      name: 'VWAP',
      yaxis: 'y'
    });
  }

  if (template.indicators.prevClose && indicators.prevClose) {
    traces.push({
      type: 'scatter',
      x: data.x,
      y: Array(data.x.length).fill(indicators.prevClose),
      mode: 'lines',
      line: { color: style.indicatorColors.prevClose, dash: 'dash', width: 1 },
      name: 'Prev Close',
      yaxis: 'y'
    });
  }

  // EMA 9/20 with cloud
  if (template.indicators.bands920 && indicators.ema9 && indicators.ema20) {
    traces.push(
      {
        type: 'scatter',
        x: data.x,
        y: indicators.ema9,
        mode: 'lines',
        line: { color: style.indicatorColors.ema9, width: 1 },
        name: 'EMA 9',
        yaxis: 'y'
      },
      {
        type: 'scatter',
        x: data.x,
        y: indicators.ema20,
        mode: 'lines',
        line: { color: style.indicatorColors.ema20, width: 1 },
        name: 'EMA 20',
        yaxis: 'y'
      }
    );

    // Add cloud fill if enabled
    if (template.indicators.cloud920) {
      traces.push({
        type: 'scatter',
        x: [...data.x, ...data.x.slice().reverse()],
        y: [...indicators.ema9, ...indicators.ema20.slice().reverse()],
        fill: 'toself',
        fillcolor: `rgba(0, 255, 0, 0.1)`, // Green cloud with transparency
        line: { color: 'transparent' },
        name: '9/20 Cloud',
        yaxis: 'y',
        showlegend: false
      });
    }
  }

  // EMA 72/89 with cloud (similar pattern)
  if (template.indicators.bands7289 && indicators.ema72 && indicators.ema89) {
    traces.push(
      {
        type: 'scatter',
        x: data.x,
        y: indicators.ema72,
        mode: 'lines',
        line: { color: style.indicatorColors.ema72, width: 1 },
        name: 'EMA 72',
        yaxis: 'y'
      },
      {
        type: 'scatter',
        x: data.x,
        y: indicators.ema89,
        mode: 'lines',
        line: { color: style.indicatorColors.ema89, width: 1 },
        name: 'EMA 89',
        yaxis: 'y'
      }
    );

    if (template.indicators.cloud7289) {
      traces.push({
        type: 'scatter',
        x: [...data.x, ...data.x.slice().reverse()],
        y: [...indicators.ema72, ...indicators.ema89.slice().reverse()],
        fill: 'toself',
        fillcolor: `rgba(0, 255, 0, 0.05)`, // Lighter green cloud
        line: { color: 'transparent' },
        name: '72/89 Cloud',
        yaxis: 'y',
        showlegend: false
      });
    }
  }

  // Volume trace (separate y-axis)
  traces.push({
    type: 'bar',
    x: data.x,
    y: data.volume,
    name: 'Volume',
    yaxis: 'y2',
    marker: { color: 'rgba(100, 100, 100, 0.3)' }
  });

  const layout = {
    ...style.layout,
    paper_bgcolor: style.paperBgcolor,
    plot_bgcolor: style.plotBgcolor,
    title: {
      text: `${symbol} - ${template.description}`,
      font: { color: '#FFFFFF', size: 16 }
    },
    xaxis: {
      type: 'date',
      gridcolor: style.grid.color,
      tickfont: { color: '#FFFFFF' },
      rangebreaks: template.useRangebreaks ? [
        { bounds: ["sat", "mon"] }, // Hide weekends
        { bounds: [20, 4], pattern: "hour" } // Hide non-trading hours
      ] : undefined
    },
    yaxis: {
      title: 'Price',
      gridcolor: style.grid.color,
      tickfont: { color: '#FFFFFF' },
      domain: [0.3, 1] // Price takes top 70%
    },
    yaxis2: {
      title: 'Volume',
      gridcolor: style.grid.color,
      tickfont: { color: '#FFFFFF' },
      domain: [0, 0.25], // Volume takes bottom 25%
      overlaying: 'y',
      side: 'right'
    }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false
  };

  return (
    <div className={`edge-chart ${className}`}>
      {/* Timeframe selector */}
      <div className="flex gap-2 mb-4">
        {Object.keys(CHART_TEMPLATES).map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange?.(tf as Timeframe)}
            className={`px-3 py-1 rounded text-sm ${
              timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <Plot
        data={traces}
        layout={layout}
        config={config}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// Export for easy integration with Edge.dev dashboard
export default EdgeChart;