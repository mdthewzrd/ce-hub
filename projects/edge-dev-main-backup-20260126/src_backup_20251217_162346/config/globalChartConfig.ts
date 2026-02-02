/**
 * Global Chart Configuration System for Edge.dev
 * Standardizes ALL chart behavior across the platform to ensure uniformity
 * Fixes SMCI 2/18/25 duplicate candlestick pattern issue through global templating
 */

export type Timeframe = '5min' | '15min' | 'hour' | 'day';

// Global chart template configurations - IMMUTABLE ACROSS ALL CHARTS
export const GLOBAL_CHART_TEMPLATES = {
  day: {
    defaultDays: 60,
    barsPerDay: 1,
    baseTimeframe: 'daily' as const,
    extendedHours: false,
    warmupDays: 180,
    description: "Daily candlestick chart (60 days) - Direct OHLC"
  },
  hour: {
    defaultDays: 14,
    barsPerDay: 16,
    baseTimeframe: '1min' as const,
    extendedHours: true,
    warmupDays: 30,
    description: "Hourly candlestick chart (14 days) - 1min base data, 4am-8pm coverage"
  },
  "15min": {
    defaultDays: 7,
    barsPerDay: 64,
    baseTimeframe: '1min' as const,
    extendedHours: true,
    warmupDays: 7,
    description: "15-minute candlestick chart (7 days) - 1min base data, 4am-8pm coverage"
  },
  "5min": {
    defaultDays: 2,
    barsPerDay: 192,
    baseTimeframe: '1min' as const,
    extendedHours: true,
    warmupDays: 30,
    description: "5-minute candlestick chart (2 days) - 1min base data, 4am-8pm coverage"
  }
} as const;

// Global Plotly configuration - IDENTICAL FOR ALL CHARTS
export const GLOBAL_PLOTLY_CONFIG = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  // CRITICAL: No responsive or autosizing conflicts that cause duplication
  // responsive: false,  // EXPLICITLY DISABLED to prevent duplication
  toImageButtonOptions: {
    format: 'png' as const,
    filename: 'edge_chart',
    height: 800,
    width: 1200,
    scale: 1
  },
  // CRITICAL: Disable all automatic resize handlers to prevent duplication
  doubleClick: 'reset' as const,
  scrollZoom: true,
  showTips: false,
  staticPlot: false
};

// Global market holidays - SYNCHRONIZED ACROSS ALL TIMEFRAMES
export const GLOBAL_MARKET_HOLIDAYS = [
  // 2024 holidays
  "2024-01-01", "2024-01-15", "2024-02-19", "2024-03-29", "2024-05-27",
  "2024-06-19", "2024-07-04", "2024-09-02", "2024-11-28", "2024-12-25",
  // 2025 holidays (including Presidents' Day fix)
  "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18", "2025-05-26",
  "2025-06-19", "2025-07-04", "2025-09-01", "2025-11-27", "2025-12-25"
];

// Global candlestick trace configuration - IDENTICAL FOR ALL CHARTS
export const GLOBAL_CANDLESTICK_CONFIG = {
  type: 'candlestick' as const,
  increasing: {
    line: { color: '#FFFFFF' },  // White bullish candles
    fillcolor: '#FFFFFF'
  },
  decreasing: {
    line: { color: '#FF0000' },  // Red bearish candles
    fillcolor: '#FF0000'
  },
  showlegend: false,
  yaxis: 'y' as const,
  // CRITICAL: Prevent any trace-level duplication
  visible: true,
  opacity: 1.0
};

// Global volume bar configuration - IDENTICAL FOR ALL CHARTS
export const GLOBAL_VOLUME_CONFIG = {
  type: 'bar' as const,
  opacity: 0.6,
  showlegend: false,
  yaxis: 'y2' as const,
  xaxis: 'x' as const,
  // CRITICAL: Prevent any trace-level duplication
  visible: true
};

// Global layout configuration generator - RETURNS IDENTICAL LAYOUTS
export const generateGlobalLayout = (
  symbol: string,
  timeframe: Timeframe,
  xRange: [string, string] | undefined,
  yRange: [number, number] | undefined,
  volumeRange: [number, number] | undefined,
  rangebreaks: any[],
  marketSessionShapes: any[],
  data: { x: string[] }
) => {
  const layout = {
    // CRITICAL: Fixed dimensions to prevent resize-based duplication
    width: undefined,  // Let container control width
    height: 800,       // Fixed height
    autosize: true,    // MUST be true for proper container fitting

    title: {
      text: `${symbol} - ${timeframe.toUpperCase()} Chart`,
      x: 0.5,
      xanchor: 'center' as const,
      font: { color: '#FFFFFF', size: 20 }
    },

    // CRITICAL: Consistent template and colors
    template: "plotly_dark",
    paper_bgcolor: "#000000",
    plot_bgcolor: "#000000",

    // CRITICAL: Identical X-axis configuration for all charts
    xaxis: {
      rangeslider: { visible: false },  // ALWAYS disabled
      gridcolor: "#333333",
      zeroline: false,
      tickfont: { color: "#FFFFFF" },
      showspikes: true,
      spikesnap: "cursor",
      spikemode: "across",
      spikecolor: "#EAB308",               // Brand gold color
      spikedash: "dash",                   // Dashed line with clear gaps
      spikethickness: timeframe === 'day' ? 1 : 0.25,  // Slightly thicker for daily charts
      rangebreaks: rangebreaks,  // Market calendar filtering
      autorange: false,          // ALWAYS use explicit range
      type: 'date' as const,     // ALWAYS date type
      range: xRange,             // Explicit data bounds
      fixedrange: false,         // Allow user interaction
      // CRITICAL: Clean time/date labels optimized per timeframe
      tickformat: timeframe === 'day' ? '%b %d<br>%Y' :    // Clean date format for daily
                  '%H:%M<br>%b %d',                        // Time + date for intraday
      dtick: timeframe === '5min' ? 2 * 60 * 60 * 1000 :   // 2 hours for 5min charts
             timeframe === '15min' ? 4 * 60 * 60 * 1000 :  // 4 hours for 15min charts
             timeframe === 'hour' ? 6 * 60 * 60 * 1000 :    // 6 hours for hourly charts
             7 * 24 * 60 * 60 * 1000,                       // 1 week for daily charts (much cleaner)
      tick0: data.x?.[0],        // Start ticks from first data point
      // CRITICAL: Reduce grid density for daily charts
      showgrid: timeframe === 'day' ? false : true,         // No vertical gridlines on daily
      gridwidth: timeframe === 'day' ? 0 : 1
    },

    // CRITICAL: Identical Y-axis configuration for main chart
    yaxis: {
      domain: [0.3, 1],          // ALWAYS 70% for main chart
      gridcolor: "#333333",
      showgrid: true,
      zeroline: false,
      tickfont: { color: "#FFFFFF" },
      showspikes: true,
      spikesnap: "cursor",
      spikemode: "across",
      spikecolor: "#EAB308",               // Brand gold color
      spikedash: "dash",                   // Dashed line with clear gaps
      spikethickness: timeframe === 'day' ? 1 : 0.25,  // Slightly thicker for daily charts
      autorange: false,          // ALWAYS use explicit range
      range: yRange,             // Explicit price bounds
      fixedrange: false          // Allow user interaction
    },

    // CRITICAL: Identical Y-axis configuration for volume
    yaxis2: {
      domain: [0, 0.25],         // ALWAYS 25% for volume
      gridcolor: "#333333",
      showgrid: true,
      zeroline: false,
      tickfont: { color: "#FFFFFF" },
      showspikes: true,
      spikesnap: "cursor",
      spikemode: "across",
      spikecolor: "#EAB308",               // Brand gold color
      spikedash: "dash",                   // Dashed line with clear gaps
      spikethickness: 0.25,                // Ultra-thin gold crosshair as requested
      autorange: false,          // ALWAYS use explicit range
      range: volumeRange,        // Explicit volume bounds
      fixedrange: false          // Allow user interaction
    },

    // CRITICAL: Consistent interaction settings - keep hover events but hide tooltips
    showlegend: false,
    hovermode: 'closest' as const,  // Enable hover events for custom legend
    dragmode: 'pan' as const,
    margin: { l: 50, r: 20, t: 60, b: 30 },

    // Market session shapes
    shapes: marketSessionShapes,

    // CRITICAL: Prevent any layout-level duplication or auto-resizing conflicts
    uirevision: 'constant',  // Prevent unnecessary re-renders
    datarevision: 0          // Explicit data revision control
  };

  // DEBUG: Log the symbol and timeframe for debugging
  console.log(`🎯 Layout generated for ${symbol} ${timeframe}`);

  return layout;
};

// Global rangebreaks generator - DYNAMIC DATA-DRIVEN FOR UNIFORM CHARTS
export const generateGlobalRangebreaks = (timeframe: Timeframe, data?: any) => {
  const rangebreaks = [];

  // DYNAMIC: Only hide gaps that actually exist in the data
  // This creates TradingView-style uniform behavior for ALL symbols

  if (timeframe !== "day" && data?.x?.length > 0) {
    // Find actual gaps in the data and hide only those
    const timestamps = data.x;
    const gaps = [];

    for (let i = 1; i < timestamps.length; i++) {
      const prev = new Date(timestamps[i - 1]);
      const curr = new Date(timestamps[i]);
      const hoursDiff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60);

      // If gap is more than 5 hours, it's a non-trading period
      if (hoursDiff > 5) {
        gaps.push({
          bounds: [timestamps[i - 1], timestamps[i]]
        });
      }
    }

    rangebreaks.push(...gaps);
  }

  // Always hide weekends regardless
  rangebreaks.push({ bounds: ["sat", "mon"] });

  console.log(`🎯 ${timeframe} dynamic rangebreaks: ${rangebreaks.length} gaps hidden (data-driven)`);
  return rangebreaks;
};

// Global data bounds calculator - IDENTICAL LOGIC FOR ALL CHARTS
export const calculateGlobalDataBounds = (
  data: {
    x: string[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  },
  timeframe: Timeframe,
  dayNavigation?: any
) => {
  if (!data.x || data.x.length === 0) {
    return { xRange: undefined, yRange: undefined, volumeRange: undefined };
  }

  // GLOBAL: X-axis range with proper framing for all timeframes
  let xRange: [string, string];

  if (timeframe === 'day') {
    // Daily charts: Day 0 should be the rightmost candle by default
    const dayOffset = dayNavigation?.dayOffset || 0;

    // RE-ENABLED Day 0 logic for proper D0 data handling
    if (dayOffset === 0 && dayNavigation?.referenceDay) {
      // For Day 0, ensure the reference day is the rightmost candle
      const referenceDayStr = dayNavigation.referenceDay.toISOString().split('T')[0];
      const dayEnd = new Date(referenceDayStr + 'T16:00:00.000Z'); // Market close
      xRange = [data.x[0], dayEnd.toISOString()];
    } else {
      // For other days, use the last timestamp with proper day end
      const lastTimestamp = new Date(data.x[data.x.length - 1]);
      const dayEnd = new Date(lastTimestamp.getFullYear(), lastTimestamp.getMonth(), lastTimestamp.getDate(), 23, 59, 59);
      xRange = [data.x[0], dayEnd.toISOString().split('T')[0]];
    }
  } else {
    // Intraday charts: Use exact data bounds (gaps handled by dynamic rangebreaks)
    xRange = [data.x[0], data.x[data.x.length - 1]];
  }

  // Y-axis: min/max of all OHLC values with 1% padding
  const allPrices = [...data.open, ...data.high, ...data.low, ...data.close].filter(p => p != null);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.01; // 1% padding
  const yRange: [number, number] = [minPrice - padding, maxPrice + padding];

  // Volume: 0 to max volume with minimal padding
  const maxVolume = Math.max(...data.volume.filter(v => v != null));
  const volumeRange: [number, number] = [0, maxVolume * 1.05]; // 5% padding on top

  return { xRange, yRange, volumeRange };
};

// Global trace generator - CREATES IDENTICAL TRACES FOR ALL CHARTS
export const generateGlobalTraces = (
  symbol: string,
  data: {
    x: string[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  }
) => {
  const traces = [];

  // CRITICAL: Candlestick trace with IDENTICAL configuration
  traces.push({
    ...GLOBAL_CANDLESTICK_CONFIG,
    x: data.x,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
    name: symbol,
    hoverinfo: 'none',  // Hide tooltips but keep hover events active
    hovertemplate: ''   // Completely suppress hover template
  });

  // CRITICAL: Volume trace with IDENTICAL configuration
  const volumeColors = data.close.map((close, index) => {
    const open = data.open[index];
    return close >= open ? '#FFFFFF' : '#FF0000';  // White/Red volume
  });

  traces.push({
    ...GLOBAL_VOLUME_CONFIG,
    x: data.x,
    y: data.volume,
    marker: { color: volumeColors },
    name: 'Volume',
    hoverinfo: 'none',  // Hide tooltips but keep hover events active
    hovertemplate: ''   // Completely suppress hover template
  });

  return traces;
};

// Global market session shapes generator - IDENTICAL FOR ALL CHARTS
export const generateGlobalMarketSessionShapes = (
  timeframe: Timeframe,
  data: { x: string[] }
) => {
  if (timeframe === "day" || !data.x || data.x.length === 0) {
    return []; // No session shading for daily charts
  }

  try {
    const startDate = data.x[0].split('T')[0];
    const endDate = data.x[data.x.length - 1].split('T')[0];
    const shapes: any[] = [];
    const currentDate = new Date(startDate + 'T00:00:00');
    const endDateTime = new Date(endDate + 'T00:00:00');
    const tradingDays: string[] = [];
    const tempDate = new Date(currentDate);

    while (tempDate <= endDateTime) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const dayOfWeek = tempDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = GLOBAL_MARKET_HOLIDAYS.includes(dateStr);

      if (!isWeekend && !isHoliday) {
        tradingDays.push(dateStr);
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    tradingDays.forEach((dateStr, index) => {
      // Eastern Time market session times
      const preMarketStart = `${dateStr}T04:00:00`;
      const marketOpen = `${dateStr}T09:30:00`;
      const marketClose = `${dateStr}T16:00:00`;

      // Pre-market shading: 4:00 AM - 9:30 AM ET
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: preMarketStart,
        x1: marketOpen,
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(128, 128, 128, 0.25)',
        line: { color: 'rgba(0,0,0,0)', width: 0 },
        layer: 'below'
      });

      // After-hours: market close to next market open
      if (index < tradingDays.length - 1) {
        const nextTradingDateStr = tradingDays[index + 1];
        const nextMarketOpen = `${nextTradingDateStr}T09:30:00`;

        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: marketClose,
          x1: nextMarketOpen,
          y0: 0,
          y1: 1,
          fillcolor: 'rgba(128, 128, 128, 0.25)',
          line: { color: 'rgba(0,0,0,0)', width: 0 },
          layer: 'below'
        });
      }
    });

    console.log(`🎨 Market session shapes: ${shapes.length} created (${tradingDays.length} trading days)`);
    return shapes;
  } catch (error) {
    console.error(`Market session shapes error for ${timeframe}:`, error);
    return [];
  }
};

export default {
  GLOBAL_CHART_TEMPLATES,
  GLOBAL_PLOTLY_CONFIG,
  GLOBAL_MARKET_HOLIDAYS,
  GLOBAL_CANDLESTICK_CONFIG,
  GLOBAL_VOLUME_CONFIG,
  generateGlobalLayout,
  generateGlobalRangebreaks,
  calculateGlobalDataBounds,
  generateGlobalTraces,
  generateGlobalMarketSessionShapes
};