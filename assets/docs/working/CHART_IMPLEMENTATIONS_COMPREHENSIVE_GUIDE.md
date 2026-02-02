# CE-Hub Chart Implementations - Comprehensive Analysis

## Overview
This document provides a complete map of all chart implementations in the CE-Hub codebase, with emphasis on working hourly chart patterns and data fetching logic.

## Primary Chart Implementation

### 1. EdgeChart Component (Main Production Chart)
**Location:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/EdgeChart.tsx`

#### Key Features:
- **Based on:** Direct WZRD-algo implementation
- **Charting Library:** Plotly (react-plotly.js with SSR disabled)
- **Supported Timeframes:**
  - `day`: 60 days, 1 bar/day, direct OHLC data
  - `hour`: 15 days, 16 bars/day, 1-minute base resampled to hourly
  - `15min`: 5 days, 64 bars/day, 1-minute base resampled to 15-minute
  - `5min`: 2 days, 192 bars/day, 1-minute base resampled to 5-minute

#### Chart Template Configuration:
```typescript
CHART_TEMPLATES = {
  day: {
    defaultDays: 60,
    barsPerDay: 1,
    baseTimeframe: 'daily',
    extendedHours: false,
    warmupDays: 180,
  },
  hour: {
    defaultDays: 15,      // KEY: 15 days back from target
    barsPerDay: 16,       // 4am-8pm coverage with 16 hourly candles
    baseTimeframe: '1min', // Resampled from 1-minute data
    extendedHours: true,
    warmupDays: 30,
  }
}
```
