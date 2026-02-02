# Trading Chart Template - CE-Hub Standard

## Overview

This document defines the standard trading chart template for the CE-Hub ecosystem, based on TradingView concepts and user specifications. All charts should follow this template for consistency across the platform.

## Core Specifications

### Visual Design
- **Background**: Dark mode with black base (`#0a0a0a`)
- **Session Backgrounds**:
  - Pre-market (4 AM - 9:30 AM ET): Dark gray (`rgba(64, 64, 64, 0.3)`)
  - Regular hours (9:30 AM - 4 PM ET): Black background (no overlay)
  - After-hours (4 PM - 8 PM ET): Dark gray (`rgba(64, 64, 64, 0.3)`)
- **No Gaps**: Continuous data display with no overnight or weekend gaps
- **Auto-scaling**: Vertical range auto-adjusts with 0.5% padding above/below visible data

### Trading Sessions
- **Extended Hours**: 4 AM - 8 PM ET (16 hours total)
- **Session Breakdown**:
  - Pre-market: 4:00 AM - 9:29 AM ET (5.5 hours)
  - Regular Trading Hours (RTH): 9:30 AM - 4:00 PM ET (6.5 hours)
  - After-hours: 4:00 PM - 8:00 PM ET (4 hours)
- **Continuous Flow**: Friday 8 PM connects directly to Monday 4 AM with no gap
- **Timezone Handling**: Automatic EST/EDT detection and conversion

### Timeframe Support

#### Available Timeframes
| Timeframe | Days Before Trade | Days After Trade | Use Case |
|-----------|------------------|------------------|----------|
| 2m        | 1                | 0                | Scalping, same-day precision |
| 5m        | 2                | 1                | Intraday analysis |
| 15m       | 5                | 3                | Default swing trading |
| 1h        | 14               | 5                | Position analysis |
| 1d        | 60               | 14               | Long-term context |

#### Default Behavior
- **With Trade Data**: Shows context around trade based on timeframe
- **Without Trade Data**: Shows recent history based on timeframe
- **Initial Zoom**: Focuses on trade day extended hours when trade present

### Execution Markers

#### Design Specifications
- **Shape**: Directional triangles with black outlines (`1px`)
- **Size**: 8px triangle size for optimal visibility
- **Colors**:
  - Long entries: Green (`#10b981`)
  - Short entries: Darker red (`#dc2626`)
  - Long exits: Darker red (`#dc2626`)
  - Short exits: Green (`#10b981`)

#### Directional Logic
- **Long Entry**: Triangle pointing right/forward (→)
- **Long Exit**: Triangle pointing left/backward (←)
- **Short Entry**: Triangle pointing left/down (↙)
- **Short Exit**: Triangle pointing right/up (↗)

#### Positioning
- **Point Location**: Triangle point positioned exactly at fill price
- **Visibility**: Always rendered above candlestick data
- **Hover Info**: Shows side, price, and P&L status

## Technical Implementation

### Data Processing
```typescript
// Continuous indexing removes gaps
let continuousIndex = 0
rawBars.forEach((bar) => {
  const etHour = convertToET(bar.timestamp).getHours()
  if (!isWeekend && etHour >= 4 && etHour < 20) {
    x.push(continuousIndex.toString())
    continuousIndex++
  }
})
```

### Session Background Algorithm
```typescript
const totalDailyBars = {
  '2m': 480,   // (16 hours * 60 minutes) / 2
  '5m': 192,   // (16 hours * 60 minutes) / 5
  '15m': 64,   // (16 hours * 60 minutes) / 15
  '1h': 16,    // 16 hours
  '1d': 1      // 1 day
}

const preMarketBars = Math.floor(totalDailyBars * (5.5 / 16))
const regularHoursBars = Math.floor(totalDailyBars * (6.5 / 16))
const afterHoursBars = Math.floor(totalDailyBars * (4 / 16))
```

### Auto-scaling Configuration
```typescript
yaxis: {
  autorange: true,
  range: [
    Math.min(...candlestickData.low) * 0.995,  // 0.5% padding below
    Math.max(...candlestickData.high) * 1.005  // 0.5% padding above
  ]
}
```

## Usage Examples

### Basic Chart
```typescript
<TradingChart
  symbol="AAPL"
  timeframe="15m"
  height={400}
/>
```

### Chart with Trade Data
```typescript
<TradingChart
  symbol="AAPL"
  timeframe="15m"
  trade={{
    entryTime: "2024-01-15T10:30:00",
    exitTime: "2024-01-15T14:45:00",
    entryPrice: 185.50,
    exitPrice: 187.25,
    side: "Long"
  }}
  height={400}
/>
```

### Timeframe Variations
```typescript
// Scalping view
<TradingChart symbol="AAPL" timeframe="2m" trade={trade} />

// Swing trading view
<TradingChart symbol="AAPL" timeframe="15m" trade={trade} />

// Position analysis
<TradingChart symbol="AAPL" timeframe="1h" trade={trade} />

// Long-term context
<TradingChart symbol="AAPL" timeframe="1d" trade={trade} />
```

## Design Principles

### TradingView Inspiration
- **Continuous Data**: No artificial gaps in price action
- **Professional Appearance**: Clean, dark theme optimized for trading
- **Context Awareness**: Automatic timeframe-appropriate data ranges
- **Session Clarity**: Clear visual distinction between trading sessions
- **Execution Focus**: Prominent, directional trade markers

### User Experience
- **Immediate Context**: Chart opens focused on relevant timeframe
- **Zoom Freedom**: Users can zoom out to see broader context
- **Visual Hierarchy**: Session backgrounds, data, then execution markers
- **Performance**: Optimized rendering with continuous indexing
- **Responsive**: Auto-scaling adapts to viewport and data changes

## Integration Notes

### Required Dependencies
```typescript
// Core dependencies
import dynamic from 'next/dynamic'
import { format, isWeekend, subDays } from 'date-fns'

// Plotly for chart rendering
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false })
```

### API Configuration
```typescript
// Polygon.io configuration
const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apikey=${API_KEY}`
```

### Color Scheme
```typescript
const colors = {
  background: '#0a0a0a',
  surface: '#1a1a1a',
  text: '#e5e5e5',
  muted: '#666666',
  sessionBackground: 'rgba(64, 64, 64, 0.3)',
  longEntry: '#10b981',
  shortEntry: '#dc2626',
  outline: '#000000'
}
```

## Validation Checklist

- [ ] Dark mode background applied
- [ ] Session backgrounds cover all visible days
- [ ] No gaps between Friday 8 PM and Monday 4 AM
- [ ] No gaps between daily 8 PM and next day 4 AM
- [ ] Auto-scaling with appropriate padding
- [ ] Directional triangles pointing correctly
- [ ] Black outlines on execution markers
- [ ] Timeframe label displays correctly
- [ ] Hover information shows properly
- [ ] Responsive behavior maintained

## Future Enhancements

### Planned Features
- [ ] Volume profile integration
- [ ] Support/resistance level overlays
- [ ] Multiple symbol comparison
- [ ] Custom session time configuration
- [ ] Advanced order type visualizations

### Performance Optimizations
- [ ] Data streaming for real-time updates
- [ ] Virtual scrolling for large datasets
- [ ] Canvas rendering for ultra-high frequency data
- [ ] Memory management for long-running sessions

---

**Last Updated**: 2024-10-14
**Version**: 1.0.0
**Maintainer**: CE-Hub Development Team