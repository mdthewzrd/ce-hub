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
    // CRITICAL: Force specific dimensions for better chart visibility
    width: undefined,  // Let container control width dynamically
    height: 700,       // Set fixed height for better square proportions
    autosize: true,    // Enable autosize for responsive width, fixed height

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
      gridcolor: "#333333",              // Faint grey grid lines for all charts
      zeroline: false,
      tickfont: { color: "#FFFFFF", size: 11 },
      showspikes: true,
      spikesnap: "cursor",
      spikemode: "across",
      spikecolor: "#EAB308",               // Brand gold color
      spikedash: "dash",                   // Dashed line with clear gaps
      spikethickness: timeframe === 'day' ? 2 : 1,  // Thicker gold crosshair for visibility
      rangebreaks: rangebreaks,  // Market calendar filtering
      autorange: false,          // ALWAYS use explicit range
      type: 'date' as const,     // ALWAYS date type
      range: xRange,             // Explicit data bounds
      fixedrange: false,         // Allow user interaction
      // CRITICAL: Smart dynamic labeling for intraday only - daily keeps original format
      tickmode: timeframe === 'day' ? 'auto' : 'array',
      tickvals: timeframe === 'day' ? undefined : generateSmartTickValues(data.x, timeframe),
      ticktext: timeframe === 'day' ? undefined : generateSmartTickLabels(data.x, timeframe),
      tickformat: timeframe === 'day' ? '%b %d<br>%Y' : undefined,  // Clean daily format unchanged
      dtick: timeframe === 'day' ? 7 * 24 * 60 * 60 * 1000 : undefined,  // Weekly for daily charts
      // CRITICAL: Reduce grid density - no vertical grid for hourly to reduce clutter with shading
      showgrid: timeframe === 'day' || timeframe === 'hour' ? false : true,  // No vertical gridlines on daily and hourly
      gridwidth: timeframe === 'day' || timeframe === 'hour' ? 0 : 1,
      showticklabels: true,
      tickangle: timeframe === 'day' ? 0 : -30,  // Reduced angle to prevent overlap with shaded areas
      linecolor: 'transparent',   // Remove x-axis line background
      mirror: false
    },

    // CRITICAL: Identical Y-axis configuration for main chart
    yaxis: {
      domain: [0.3, 1],          // ALWAYS 70% for main chart
      gridcolor: "#333333",              // Faint grey grid lines for all charts
      showgrid: true,
      zeroline: false,
      tickfont: { color: "#FFFFFF" },
      showspikes: true,
      spikesnap: "cursor",
      spikemode: "across",
      spikecolor: "#EAB308",               // Brand gold color
      spikedash: "dash",                   // Dashed line with clear gaps
      spikethickness: timeframe === 'day' ? 2 : 1,  // Thicker gold crosshair for visibility
      autorange: false,          // ALWAYS use explicit range
      range: yRange,             // Explicit price bounds
      fixedrange: false          // Allow user interaction
    },

    // CRITICAL: Identical Y-axis configuration for volume
    yaxis2: {
      domain: [0, 0.25],         // ALWAYS 25% for volume
      gridcolor: "#333333",              // Faint grey grid lines for all charts
      showgrid: true,
      zeroline: false,
      tickfont: { color: "#FFFFFF", size: 10 },
      showspikes: true,
      spikesnap: "cursor",
      spikemode: "across",
      spikecolor: "#EAB308",               // Brand gold color
      spikedash: "dash",                   // Dashed line with clear gaps
      spikethickness: timeframe === 'day' ? 2 : 1,  // Match main chart thickness
      autorange: false,          // ALWAYS use explicit range
      range: volumeRange,        // Explicit volume bounds
      fixedrange: false,         // Allow user interaction
      // Clear separation between chart and volume
      linecolor: "#333333",      // Subtle line to separate sections
      linewidth: 1,
      showline: true             // Show separator line at domain boundary
    },

    // CRITICAL: Consistent interaction settings - keep hover events but hide tooltips
    showlegend: false,
    hovermode: 'x' as const,           // Enable x-axis crosshair across chart areas
    dragmode: 'pan' as const,
    margin: { l: 50, r: 20, t: 60, b: 30 },

    // CRITICAL: Force gold crosshair cursor across all chart areas
    hoverdistance: -1,     // Enable crosshair everywhere
    spikedistance: -1,     // Enable spikes everywhere

    // Market session shapes + chart/volume separator
    shapes: [
      ...marketSessionShapes,
      // Clean separator between chart and volume sections
      {
        type: 'rect',
        xref: 'paper',
        yref: 'paper',
        x0: 0,
        x1: 1,
        y0: 0.25,  // Between volume (0-0.25) and chart (0.3-1)
        y1: 0.3,
        fillcolor: '#000000',  // Black background separator
        line: { color: 'rgba(0,0,0,0)', width: 0 },
        layer: 'below'
      }
    ],

    // CRITICAL: Prevent any layout-level duplication or auto-resizing conflicts
    uirevision: 'constant',  // Prevent unnecessary re-renders
    datarevision: 0          // Explicit data revision control
  };

  // DEBUG: Log the symbol and timeframe for debugging
  console.log(`  Layout generated for ${symbol} ${timeframe}`);

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

  console.log(`  ${timeframe} dynamic rangebreaks: ${rangebreaks.length} gaps hidden (data-driven)`);
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

    // RE-ENABLED Day 0 logic - ensures proper chart positioning for LC patterns
    if (dayOffset === 0) {
      // Day 0: Use the reference day as the rightmost boundary
      const referenceDay = dayNavigation?.currentDay || new Date();
      const dayEnd = new Date(referenceDay.getFullYear(), referenceDay.getMonth(), referenceDay.getDate(), 23, 59, 59);
      xRange = [data.x[0], dayEnd.toISOString().split('T')[0]];
    } else {
      // Other days: Use simple approach
      const lastTimestamp = new Date(data.x[data.x.length - 1]);
      const dayEnd = new Date(lastTimestamp.getFullYear(), lastTimestamp.getMonth(), lastTimestamp.getDate(), 23, 59, 59);
      xRange = [data.x[0], dayEnd.toISOString().split('T')[0]];
    }
  } else {
    // Intraday charts: Use exact data bounds (gaps handled by dynamic rangebreaks)
    xRange = [data.x[0], data.x[data.x.length - 1]];
  }

  // Y-axis: min/max of all OHLC values with 8% padding for legend clearance
  const allPrices = [...data.open, ...data.high, ...data.low, ...data.close].filter(p => p != null);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.08; // 8% padding for legend clearance
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
    hoverinfo: 'none',       // Hide tooltips but keep hover events
    hovertemplate: '',       // Empty template to suppress tooltips
    showlegend: false        // Ensure no legend interference
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
    hoverinfo: 'none',       // Hide tooltips but keep hover events active
    hovertemplate: ''        // Completely suppress hover template
  });

  // Add invisible overlay trace to ensure crosshair works across entire chart
  traces.push({
    type: 'scatter',
    mode: 'markers',
    x: data.x,
    y: data.high, // Use high values to cover the top of chart
    marker: {
      size: 1,
      opacity: 0, // Completely transparent
      color: 'rgba(0,0,0,0)'
    },
    hoverinfo: 'none',
    hovertemplate: '',
    showlegend: false,
    yaxis: 'y',
    name: 'CrosshairOverlay'
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
      // Convert Eastern Time to UTC for chart data compatibility
      // Eastern Time: Pre-market 4:00 AM = UTC 9:00 AM, Market Open 9:30 AM = UTC 14:30
      // Eastern Time: Market Close 4:00 PM = UTC 21:00, Post-market End 8:00 PM = UTC 01:00+1
      const preMarketStart = `${dateStr}T09:00:00`;  // 4:00 AM ET = 9:00 AM UTC
      const marketOpen = `${dateStr}T14:30:00`;      // 9:30 AM ET = 2:30 PM UTC
      const marketClose = `${dateStr}T21:00:00`;     // 4:00 PM ET = 9:00 PM UTC

      // Calculate next day for post-market end (8:00 PM ET = 1:00 AM UTC next day)
      const nextDay = new Date(dateStr + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      const postMarketEnd = `${nextDayStr}T01:00:00`;   // 8:00 PM ET = 1:00 AM UTC (next day)

      // Pre-market shading: 4:00 AM - 9:30 AM ET (GRAY)
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: preMarketStart,
        x1: marketOpen,
        y0: 0.3,  // Only shade the main chart area, not volume
        y1: 1,
        fillcolor: 'rgba(128, 128, 128, 0.25)',  // Light gray for pre-market
        line: { color: 'rgba(0,0,0,0)', width: 0 },
        layer: 'below',
        excludefromlegend: true
      });

      // Regular market hours: 9:30 AM - 4:00 PM ET (NO SHADING - clear)
      // No shape needed - this is the normal chart background

      // After-hours shading: 4:00 PM - 8:00 PM ET (GRAY)
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: marketClose,
        x1: postMarketEnd,
        y0: 0.3,  // Only shade the main chart area, not volume
        y1: 1,
        fillcolor: 'rgba(128, 128, 128, 0.25)',  // Light gray for after-hours
        line: { color: 'rgba(0,0,0,0)', width: 0 },
        layer: 'below',
        excludefromlegend: true
      });

      // Add day separator lines for hourly charts - subtle vertical lines at market open
      if (timeframe === 'hour') {
        shapes.push({
          type: 'line',
          xref: 'x',
          yref: 'paper',
          x0: marketOpen,
          x1: marketOpen,
          y0: 0.3,  // Only in the main chart area, not volume
          y1: 1,
          line: {
            color: 'rgba(128, 128, 128, 0.4)',  // Subtle gray line
            width: 1,
            dash: 'dot'  // Dotted line for day separation
          },
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

// Smart tick generation for clean intraday labeling
export const generateSmartTickValues = (timestamps: string[], timeframe: Timeframe): string[] => {
  if (!timestamps || timestamps.length === 0) return [];

  const tickValues: string[] = [];
  let lastDate = '';

  // Define intervals based on timeframe for optimal spacing
  const intervalHours = timeframe === '5min' ? 2 :    // Every 2 hours for 5min charts
                        timeframe === '15min' ? 3 :   // Every 3 hours for 15min charts
                        4;                            // Every 4 hours for hourly charts

  const intervalMs = intervalHours * 60 * 60 * 1000;

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const date = new Date(timestamp);
    const dateString = date.toDateString();

    // Always include first timestamp of each new day
    if (dateString !== lastDate) {
      tickValues.push(timestamp);
      lastDate = dateString;
      continue;
    }

    // Add time-based ticks at regular intervals (market hours only)
    const hour = date.getHours();
    const minute = date.getMinutes();

    // Only show ticks during market hours (9:30 AM - 4:00 PM ET)
    if (hour >= 9 && hour < 16) {
      // For 5min: show every 2 hours (10:00, 12:00, 14:00)
      // For 15min: show every 3 hours (12:00)
      // For hour: show every 4 hours (13:00)
      if ((hour === 10 && minute === 0) ||
          (hour === 12 && minute === 0) ||
          (hour === 13 && minute === 0) ||
          (hour === 14 && minute === 0)) {

        // Only add if it fits the timeframe interval
        if ((timeframe === '5min' && (hour === 10 || hour === 12 || hour === 14)) ||
            (timeframe === '15min' && hour === 12) ||
            (timeframe === 'hour' && hour === 13)) {
          tickValues.push(timestamp);
        }
      }
    }
  }

  return tickValues;
};

export const generateSmartTickLabels = (timestamps: string[], timeframe: Timeframe): string[] => {
  if (!timestamps || timestamps.length === 0) return [];

  const tickValues = generateSmartTickValues(timestamps, timeframe);
  const tickLabels: string[] = [];
  let lastDate = '';

  tickValues.forEach(timestamp => {
    const date = new Date(timestamp);
    const dateString = date.toDateString();

    // First occurrence of each day gets full date + time
    if (dateString !== lastDate) {
      const dayLabel = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      });
      const timeLabel = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      });
      tickLabels.push(`${dayLabel}<br>${timeLabel}`);
      lastDate = dateString;
    } else {
      // Subsequent ticks on same day show only time
      const timeLabel = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      });
      tickLabels.push(timeLabel);
    }
  });

  return tickLabels;
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
  generateGlobalMarketSessionShapes,
  generateSmartTickValues,
  generateSmartTickLabels
};