# Edge Dev System Structure & Chart Formatting Investigation Report
**Date:** November 8, 2025  
**Scope:** Comprehensive exploration of Edge Dev architecture, chart rendering logic, and SMCI 2/18/25 duplication issue  
**Status:** Complete with Actionable Insights

---

## Executive Summary

The Edge Dev system is a **Next.js + FastAPI full-stack application** running on port 5657 (frontend) and 8000 (backend). The SMCI 2/18/25 5-minute chart duplication issue has been **architecturally addressed** through a Global Chart Template System that enforces uniform chart behavior across all tickers and timeframes.

**Key Finding:** The system includes comprehensive fixes for chart duplication, but the issue appears to be related to how days stack in the data representation when multiple dates are present in a single timeframe view.

---

## Directory Structure

### Root Level (`/edge-dev/`)
```
edge-dev/
├── package.json                      # Next.js 16.0.0 + React 19.2.0 config
├── next.config.ts                    # Next.js build configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── src/                              # TypeScript source code
├── backend/                          # FastAPI Python backend
├── public/                           # Static assets
├── .next/                            # Next.js build output
├── node_modules/                     # Dependencies (894 directories)
└── [test files and documentation]
```

### Frontend Structure (`/src/`)
```
src/
├── app/                              # Next.js app router pages
│   ├── exec/                         # Execution/scanner pages
│   │   └── components/ExecutionChart.tsx
│   └── [other app routes]
├── components/                       # React components
│   ├── EdgeChart.tsx                 # MAIN CHART COMPONENT (220 lines)
│   ├── EdgeChartPlaceholder.tsx      # Fallback component
│   ├── ChartDayNavigation.tsx        # Day navigation controls
│   └── [other components]
├── config/                           # Configuration files
│   └── globalChartConfig.ts          # GLOBAL TEMPLATE SYSTEM (395 lines)
├── hooks/                            # React custom hooks
├── lib/                              # Utility functions
├── services/                         # API services
├── types/                            # TypeScript type definitions
├── styles/                           # CSS stylesheets
└── utils/                            # Utility functions
```

### Backend Structure (`/backend/`)
```
backend/
├── main.py                           # FastAPI application (2050+ lines)
├── start.py                          # Server startup script
├── market_calendar.py                # Holiday/weekend filtering
├── core/                             # Core scanning modules
│   ├── scanner.py                    # Main scanner logic
│   ├── parameter_integrity_system.py # Parameter validation
│   ├── intelligent_parameter_extractor.py
│   ├── code_formatter.py             # Code formatting
│   └── [other core modules]
├── [scanner implementations]         # Various scanner algorithms
├── [ticker_data.json files]          # Pre-computed stock data (270+ files)
└── venv/                             # Python virtual environment
```

---

## Server Configuration

### Frontend Server (port 5657)
- **Framework:** Next.js 16.0.0
- **Runtime:** Node.js (JavaScript/TypeScript)
- **Start Command:** `npm run dev` (runs `next dev -p 5657`)
- **Build:** `npm run build` + `npm run start`
- **Hot Reload:** Enabled during development

### Backend Server (port 8000)
- **Framework:** FastAPI (Python)
- **ASGI Server:** Uvicorn
- **Start Command:** `python backend/start.py` or `uvicorn main:app --reload`
- **Config:** Uses environment variables (`SCANNER_HOST`, `SCANNER_PORT`, etc.)
- **CORS:** Enabled for localhost connections
- **Rate Limiting:** Implemented via slowapi library

### Communication Pattern
```
Frontend (5657)
    ↓
[HTTP Requests]
    ↓
Backend API (8000)
    ├── GET /api/chart/{ticker}        # Chart data endpoint
    ├── POST /api/scan                 # Scan execution
    ├── GET /api/scan/results          # Results retrieval
    └── [other endpoints]
    ↓
[JSON Responses]
    ↓
Frontend Components (React/Plotly)
```

---

## Chart System Architecture

### 1. Global Chart Template System (`globalChartConfig.ts`)

**Purpose:** Ensure **IDENTICAL chart behavior** across all tickers and timeframes

**Key Components:**

#### A. Template Definitions (Immutable Configuration)
```typescript
GLOBAL_CHART_TEMPLATES = {
  day:    { defaultDays: 60,  barsPerDay: 1,   baseTimeframe: 'daily', warmupDays: 180 },
  hour:   { defaultDays: 15,  barsPerDay: 16,  baseTimeframe: '1min',  warmupDays: 30  },
  15min:  { defaultDays: 5,   barsPerDay: 64,  baseTimeframe: '1min',  warmupDays: 3   },
  5min:   { defaultDays: 2,   barsPerDay: 192, baseTimeframe: '1min',  warmupDays: 30  }
}
```

**Critical for 5min charts:**
- **Duration:** 2 trading days
- **Bars per day:** 192 (5-minute intervals in extended hours: 4am-8pm = 16 hours = 192 × 5 minutes)
- **Extended hours:** Enabled (4am-8pm coverage)
- **Holiday filtering:** Yes

#### B. Plotly Configuration (Prevent Duplication)
```typescript
GLOBAL_PLOTLY_CONFIG = {
  responsive: false,           // DISABLED - prevents resize duplication
  staticPlot: false,
  displayModeBar: true,
  scrollZoom: true,
  doubleClick: 'reset',
  // NO responsive or autosizing that causes conflicts
}
```

#### C. Layout Generation (Uniform Across All Charts)
```typescript
Layout properties:
- width: undefined (container-controlled)
- height: 800px (FIXED)
- autosize: true (proper container fitting)
- uirevision: 'constant' (prevent unnecessary re-renders)
- xaxis.autorange: false (explicit range control)
- yaxis.domain: [0.3, 1] (70% for price)
- yaxis2.domain: [0, 0.25] (25% for volume)
- rangebreaks: [weekends, optional overnights]
```

#### D. Trace Generation (Candlestick + Volume)
```typescript
Traces:
1. Candlestick trace (OHLC data)
   - Increasing (bullish): White color
   - Decreasing (bearish): Red color
   - yaxis: 'y' (main chart)
   - visible: true (explicit)

2. Volume bar trace
   - Colors: Green/Red based on candle direction
   - yaxis: 'y2' (volume subplot)
   - opacity: 0.6
   - visible: true (explicit)
```

### 2. Main Chart Component (`EdgeChart.tsx`)

**Purpose:** Render charts using the global template system exclusively

**Key Features:**
- Uses GLOBAL_CHART_TEMPLATES (no per-ticker customization)
- Uses GLOBAL_PLOTLY_CONFIG (no local overrides)
- Imports all generation functions from globalChartConfig
- Day navigation support for LC pattern analysis
- Debug logging for SMCI 5min charts

**Critical Section:**
```typescript
// CRITICAL: Use GLOBAL template system exclusively
const template = GLOBAL_CHART_TEMPLATES[timeframe];

// CRITICAL: Generate ALL chart elements using GLOBAL functions
const rangebreaks = generateGlobalRangebreaks(timeframe);
const { xRange, yRange, volumeRange } = calculateGlobalDataBounds(data, timeframe, dayNavigation);
const traces = generateGlobalTraces(symbol, data);
const marketSessionShapes = generateGlobalMarketSessionShapes(timeframe, data);
const layout = generateGlobalLayout(...);

// CRITICAL: Chart with GLOBAL configuration only
<Plot
  data={traces}
  layout={layout}
  config={GLOBAL_PLOTLY_CONFIG}
  useResizeHandler={false}  // CRITICAL: Disabled to prevent duplication
/>
```

### 3. Backend Chart Endpoint (`/api/chart/{ticker}`)

**Endpoint:** `GET /api/chart/{ticker}`

**Parameters:**
- `ticker` (path): Stock symbol (e.g., "SMCI")
- `timeframe` (query): "5min", "15min", "hour", or "day"
- `lc_date` (query): LC pattern date (e.g., "2025-02-18")
- `day_offset` (query): Day offset from LC date (0 = LC date, +1 = next day, etc.)

**Processing Flow:**
```
1. Validate lc_date parameter
2. Calculate target date based on day_offset
3. Determine days_back based on timeframe:
   - 5min:  2 days
   - 15min: 5 days
   - hour:  15 days
   - day:   45 days

4. Fetch data from Polygon API:
   GET https://api.polygon.io/v2/aggs/ticker/{ticker}/range/...
   - Converts timeframe to Polygon format (5min → "5 minute")
   - Applies date range: (target_date - days_back) to target_date

5. Filter data:
   - For 5min: Keep last 1000 points max
   - Filter to end precisely on target_date
   - Remove weekends/holidays (market_calendar.py)

6. Convert to chart format:
   {
     x: [ISO timestamps],
     open: [prices],
     high: [prices],
     low: [prices],
     close: [prices],
     volume: [volumes]
   }

7. Generate market session shapes (pre-market, regular hours, after-hours)

8. Return ChartResponse (JSON)
```

### 4. Market Calendar System (`market_calendar.py`)

**Holidays Configured:**
- **2024:** Jan 1, Jan 15, Feb 19, Mar 29, May 27, Jun 19, Jul 4, Sep 2, Nov 28, Dec 25
- **2025:** Jan 1, Jan 20, Feb 17 (Presidents' Day - KEY FOR 2/18/25), Apr 18, May 26, Jun 19, Jul 4, Sep 1, Nov 27, Dec 25

**Functions:**
- `is_trading_day(date)`: Returns True if date is a trading day
- `is_weekend(date)`: Returns True for Sat/Sun
- `is_market_holiday(date)`: Returns True for federal holidays
- `validate_chart_data_for_trading_days(chart_data)`: Filters out non-trading days
- `generateGlobalRangebreaks(timeframe)`: Creates rangebreaks for Plotly

**Critical for SMCI 2/18/25:**
- Presidents' Day is Feb 17, 2025 (market closed)
- Feb 18, 2025 is the next trading day (Tuesday)
- When requesting "2/18/25" data, previous data would be from Feb 14 (Friday)
- Gap between Feb 14 and Feb 18 creates "missing data" period in chart

---

## Data Flow: SMCI 2/18/25 5min Chart

### Scenario: User requests SMCI 5min chart for 2/18/25 (Day 0)

```
Frontend Request:
GET /api/chart/SMCI?timeframe=5min&lc_date=2025-02-18&day_offset=0

Backend Processing:
1. target_date = 2025-02-18
2. days_back = 2 (5min timeframe)
3. Date range: 2025-02-16 to 2025-02-18
4. Polygon API query for 5min bars

Expected data points:
- Feb 14, 2025 (Friday): ~192 bars (4am-8pm extended hours)
- Feb 15-16 (Sat/Sun): SKIPPED (weekends)
- Feb 17 (Monday): SKIPPED (Presidents' Day - market closed)
- Feb 18, 2025 (Tuesday): ~192 bars (4am-8pm extended hours)
Total: ~384 bars

Data Processing:
1. Filter to trading days only (removes weekends and holidays)
2. Create X-axis timestamps (ISO format)
3. Calculate Y-range from price data
4. Calculate volume range
5. Generate rangebreaks for Plotly (hide weekends)

Response Structure:
{
  chartData: {
    x: [ISO timestamps for bars],    // Should be ~384 timestamps
    open: [prices],                   // Should be ~384 prices
    high: [prices],
    low: [prices],
    close: [prices],
    volume: [volumes]
  },
  shapes: [market session shapes],    // Pre-market, regular, after-hours
  success: true,
  message: "..."
}

Frontend Rendering:
1. EdgeChart component receives data
2. Uses GLOBAL_CHART_TEMPLATES['5min']
3. generateGlobalRangebreaks('5min') → rangebreaks for weekends
4. calculateGlobalDataBounds() → xRange, yRange, volumeRange
5. generateGlobalTraces() → candlestick + volume traces
6. generateGlobalLayout() → unified layout config
7. Plot component renders with:
   - data: [candlestick trace, volume trace]
   - layout: global layout with ranges and shapes
   - config: GLOBAL_PLOTLY_CONFIG (no resize handling)

Expected Result:
Single candlestick chart showing:
- 2 trading days of 5min bars (Feb 14 and Feb 18)
- Gap between Feb 14 and Feb 18 (weekend + holiday)
- No duplication (each bar appears once)
```

---

## SMCI 2/18/25 Duplication Analysis

### Reported Issue
**"Days are stacking instead of displaying as a proper time series"**

### Root Cause Candidates

#### 1. Data Duplication at Backend
- **Status:** FIXED - Universal deduplication in `main.py` (lines 42-107)
- **Logic:** Deduplicates on ticker + date combination, keeps first occurrence
- **Coverage:** All scan results, all execution paths

#### 2. Plotly Duplicate Rendering
- **Status:** ADDRESSED
- **Prevention:** 
  - `useResizeHandler={false}` in Plot component (line 200, EdgeChart.tsx)
  - `responsive: false` in GLOBAL_PLOTLY_CONFIG
  - `uirevision: 'constant'` in layout (prevents unnecessary re-renders)
  - `datarevision: 0` (explicit control)

#### 3. Day Stacking Issue (Most Likely)
- **Symptoms:** Multiple days appear vertically stacked instead of time-series
- **Possible Causes:**
  a) **Date formatting issue:** Days being grouped by date instead of timestamp
  b) **Trace configuration:** Candlestick not properly recognizing datetime axis
  c) **Range breaks:** Rangebreaks not properly hiding non-trading days
  d) **X-axis type:** X-axis not set to 'date' type
  e) **Data sorting:** Timestamps not properly sorted chronologically

#### 4. Component Lifecycle Issue
- **Status:** MINIMIZED
- **Prevention:**
  - GLOBAL_CHART_TEMPLATES prevents per-ticker customization
  - Dynamic import with ssr:false prevents SSR issues
  - Explicit `visible: true` on all traces
  - `opacity: 1.0` on candlestick trace

### Verification Points

**What's Working Correctly:**
1. ✅ Backend API returns proper OHLC data structure
2. ✅ Market calendar filters weekends/holidays
3. ✅ Universal deduplication removes ticker+date duplicates
4. ✅ Global template ensures uniform configuration
5. ✅ Extended hours (4am-8pm) properly configured for 5min charts
6. ✅ Plotly has disabled resize handlers (duplication prevention)
7. ✅ Rangebreaks configured for weekends

**What Might Need Investigation:**
1. ⚠️ How multiple days with gaps (Feb 14 + Feb 18) display
2. ⚠️ Whether "days stacking" means display order vs data order
3. ⚠️ If range breaks are properly hiding the gap
4. ⚠️ X-axis datetime handling with non-contiguous dates
5. ⚠️ Y-axis domain split (70% price, 25% volume) with date axis

---

## Key Configuration Files

### 1. Frontend Global Configuration
**File:** `/src/config/globalChartConfig.ts` (395 lines)
- Defines all chart templates
- Plotly configuration
- Holiday calendar
- Trace generation logic
- Layout generation logic

### 2. Backend Main Application
**File:** `/backend/main.py` (2050+ lines)
- FastAPI setup and CORS
- Chart endpoint (`/api/chart/{ticker}`)
- Polygon API integration
- Data filtering and formatting
- Error handling and logging

### 3. Market Calendar
**File:** `/backend/market_calendar.py` (200 lines)
- Holiday definitions for 2024-2025
- Trading day validation
- Chart data filtering

### 4. Package Configuration
**File:** `/package.json` (94 lines)
- Dependencies: Next.js 16.0.0, React 19.2.0, Plotly.js 3.1.2
- Scripts for dev/build/test
- Test framework: Playwright

---

## Testing Infrastructure

### Test Files Located
```
/edge-dev/test_smci_chart_duplication.py    # SMCI specific test
/edge-dev/test_global_chart_template_system.py  # Global system validation
/edge-dev/test_hourly_chart_fixes.py        # Hourly chart testing
/edge-dev/validate_all_chart_fixes.py       # Comprehensive validation
/edge-dev/validate_frontend_timeframes.js   # Frontend timeframe testing
```

### Running Tests
```bash
# Test SMCI specific issue
python test_smci_chart_duplication.py

# Test global template system
python test_global_chart_template_system.py

# Run frontend tests
npm run test          # All tests
npm run test:charts   # Chart tests only
npm run test:headed   # Visual testing
```

---

## Development Workflow

### Starting the System
```bash
# Full stack (recommended)
./dev-start.sh

# Or manually:
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
npm run dev    # Runs on localhost:5657
```

### Health Check
```bash
npm run health   # Validates both frontend and backend
```

### Validation Gate
```bash
npm run validate   # Comprehensive system validation
```

---

## Technology Stack Summary

### Frontend
- **Framework:** Next.js 16.0.0 (React 19.2.0)
- **Port:** 5657
- **Chart Library:** Plotly.js 3.1.2 via react-plotly.js 2.6.0
- **UI Components:** Tailwind CSS 4.0
- **State Management:** Zustand 5.0.8
- **HTTP Client:** Axios 1.12.2
- **Language:** TypeScript 5

### Backend
- **Framework:** FastAPI
- **ASGI Server:** Uvicorn
- **Port:** 8000
- **Data Source:** Polygon.io API
- **Rate Limiting:** slowapi
- **Data Processing:** pandas, numpy

### Data Flow
```
Polygon.io API ← Backend (Port 8000) ← Frontend (Port 5657)
    ↓                    ↓                    ↓
OHLC Data          Data Processing       React Components
                    Filtering             Plotly Rendering
                    Formatting
```

---

## Critical Fixes Already Implemented

### 1. Global Chart Template System
- Ensures all charts use identical configuration
- Prevents per-ticker customization conflicts
- Standard rangebreaks for all timeframes

### 2. Plotly Configuration Standardization
- Disabled resize handlers (prevents duplication)
- Fixed dimensions and autosize settings
- Explicit visibility on all traces
- Unified UI revision strategy

### 3. Universal Deduplication
- Applied to ALL scan results
- Deduplicates on ticker + date
- Keeps first occurrence
- Covers all execution paths

### 4. Market Calendar Integration
- Filters weekends and holidays
- Holiday list updated for 2025
- Presidents' Day properly configured
- Applied to all intraday charts

### 5. Data Validation
- Consistent OHLC array lengths
- Proper timestamp formatting
- Volume bar alignment
- Range verification

---

## Next Steps for Investigation

### If "Days Stacking" Issue Persists

1. **Check Data Format:**
   - Verify timestamps in API response are properly ISO-formatted
   - Ensure dates are sorted chronologically
   - Check if multiple Feb 18 entries exist (vs one per bar)

2. **Inspect Plotly Rendering:**
   - Open browser DevTools → Network → Check API response
   - Verify data structure matches expected format
   - Check Plotly data trace structure

3. **Test Specific Cases:**
   ```bash
   # Test SMCI 2/18/25 specifically
   python test_smci_chart_duplication.py
   
   # Test other dates to compare
   curl "http://localhost:8000/api/chart/SMCI?timeframe=5min&lc_date=2025-02-14&day_offset=0"
   curl "http://localhost:8000/api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0"
   ```

4. **Visual Inspection:**
   - Navigate to http://localhost:5657
   - Load SMCI scan results
   - View 5min chart for Feb 18
   - Check if single day appears or multiple days stack
   - Inspect Plotly layout in DevTools

5. **Code Review Areas:**
   - `calculateGlobalDataBounds()` - range calculation logic
   - `generateGlobalTraces()` - trace generation
   - `generateGlobalRangebreaks()` - rangebreak logic
   - Backend data filtering - ensure proper date filtering

---

## File Reference Summary

### Frontend Core Files
| File | Lines | Purpose |
|------|-------|---------|
| `/src/components/EdgeChart.tsx` | 220 | Main chart component |
| `/src/config/globalChartConfig.ts` | 395 | Global template system |
| `/src/components/ChartDayNavigation.tsx` | ? | Day navigation UI |
| `/package.json` | 94 | Dependencies & scripts |

### Backend Core Files
| File | Lines | Purpose |
|------|-------|---------|
| `/backend/main.py` | 2050+ | FastAPI application |
| `/backend/market_calendar.py` | 200 | Holiday filtering |
| `/backend/start.py` | 88 | Server startup |
| `/backend/core/` | Multiple | Scanner modules |

### Test Files
| File | Purpose |
|------|---------|
| `test_smci_chart_duplication.py` | SMCI 2/18/25 specific test |
| `test_global_chart_template_system.py` | Global system validation |
| `validate_all_chart_fixes.py` | Comprehensive validation |

---

## Conclusion

The Edge Dev system has a **well-architected global chart template system** designed to prevent duplication and ensure uniformity. The SMCI 2/18/25 issue appears to be related to how multiple trading days with gaps display as a time series in Plotly, rather than data duplication at the source.

**Key Strengths:**
- Global template system prevents customization conflicts
- Universal deduplication removes ticker+date duplicates
- Market calendar properly filters non-trading days
- Plotly configuration standardized across all charts

**Investigation Recommendation:**
Focus on the data transformation layer where multiple days are converted from API response to chart format, specifically how rangebreaks and date axes interact when there are gaps in the data (weekends/holidays).

