# Edge.dev Chart Functionality - File Reference Guide

## Critical File Locations

### 1. Main Application Page (Primary Location)
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/page.tsx`

#### Key Functions by Line Number

| Line Range | Function | Purpose |
|-----------|----------|---------|
| 38-95 | `fetchRealData()` | Load market chart data from Polygon API |
| 616-650 | `calculateTargetDate()` | Calculate date based on day offset (CRITICAL) |
| 700-703 | `getCurrentDayDate()` | Get Date object for current navigation day |
| 706-725 | `handleTickerClick()` | Handle scan result row click (CRITICAL) |
| 2689 | JSX onClick | Result table click handler |

#### dateReferenceDate & Related State
| Line | State Variable | Purpose |
|------|---------------|---------|
| 392 | `scanResults` | Array of scan results |
| 408-409 | `scanStartDate`, `scanEndDate` | Scan date range |
| 515 | `selectedLCDate` | Selected LC pattern date |
| 517 | `dayOffset` | Current day navigation offset |
| 518 | `lcReferenceDate` | Reference date for Day 0 navigation |

### 2. Type Definitions
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/types/scanTypes.ts`

#### Critical Interfaces
```typescript
// Lines 7-24
interface ScanResult {
  symbol: string;
  ticker: string;
  date: string;           // ← THIS IS THE CRITICAL FIELD
  scanner_type: string;
  gap_percent: number;
  volume_ratio: number | null;
  signal_strength: 'Strong' | 'Moderate';
  entry_price: number;
  target_price: number;
}

// Lines 27-57
interface EnhancedScanResult extends ScanResult {
  id?: string;
  parabolic_score?: number;
  confidence_score?: number;
  close?: number;
  // ... more optional fields
}
```

### 3. Backend API Service
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts`

#### Key Interfaces
```typescript
// Lines 17-26 - Expected response format from backend
interface ScanResult {
  ticker: string;
  date: string;           // Backend should provide YYYY-MM-DD format
  gap_pct: number;
  parabolic_score: number;
  lc_frontside_d2_extended: number;
  volume: number;
  close: number;
  confidence_score: number;
}

// Lines 357-400 - Scan completion polling
async waitForScanCompletion(scanId: string, onProgress?: ...): Promise<ScanResponse>
```

### 4. Chart Component
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/EdgeChart.tsx`

#### Chart Data Structure
```typescript
// Lines 73-80
interface ChartData {
  x: string[];          // ISO timestamp strings: "2024-10-15T14:30:00Z"
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}
```

#### Date Handling
- Line 229: x-axis data mapped from chart bars
- Line 368: Date type specified for x-axis
- Lines 276-326: Data bounds calculation using dates

### 5. Market Calendar Utilities
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/utils/marketCalendar.ts`

#### Trading Day Functions
```typescript
export function isTradingDay(date: Date): boolean
export function getNextTradingDay(date: Date): Date
export function getPreviousTradingDay(date: Date): Date
```

**Usage in page.tsx**:
- Line 621: `isTradingDay(lcPatternDate)`
- Line 626: `getPreviousTradingDay(lcPatternDate)`
- Line 640: `getNextTradingDay(targetDate)`

### 6. Polygon Data Fetcher
**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/utils/polygonData.ts`

#### Date Processing
- Receives `lcEndDate?: string` parameter
- Converts bar timestamps: `new Date(bar.t).toISOString()`
- Returns chart data with ISO timestamp strings

---

## Date Format Specifications

### Expected Formats by Stage

| Stage | Format | Example | Notes |
|-------|--------|---------|-------|
| Backend API Response | YYYY-MM-DD | "2024-10-15" | Plain date string, NO time |
| handleTickerClick() input | YYYY-MM-DD | "2024-10-15" | Direct from result.date |
| lcReferenceDate state | YYYY-MM-DD | "2024-10-15" | Stored in React state |
| calculateTargetDate() input | YYYY-MM-DD | "2024-10-15" | Expected by function |
| calculateTargetDate() output | YYYY-MM-DD | "2024-10-15" | Returns via .split('T')[0] |
| Chart x-axis data | ISO 8601 | "2024-10-15T14:30:00Z" | Full timestamp with timezone |

### Common Format Errors

| Format | Location | Issue |
|--------|----------|-------|
| "2024-10-15T00:00:00" | Backend response | Has time, causes `calculateTargetDate()` to fail |
| "2024-10-15T00:00:00Z" | Backend response | Has timezone, causes concatenation to create invalid timestamp |
| "10-15-2024" | Backend response | Wrong order, regex validation fails |
| null/undefined | Missing field | No date provided, click handler fails silently |

---

## Code Flow Diagram

```
Scan Results Displayed in Table (page.tsx line ~2689)
    ↓
User clicks result row
    ↓
JSX onClick handler calls: handleTickerClick(result.ticker, result.date)
    ↓ (page.tsx line 706)
handleTickerClick() receives: ticker="AAPL", lcDate="2024-10-15"
    ↓
Check lcDate format (MISSING VALIDATION HERE!)
    ↓
Store in state:
  - setSelectedTicker("AAPL")
  - setLcReferenceDate("2024-10-15")
  - setDayOffset(0)
    ↓
useEffect triggers (line 729, depends on: selectedTicker, timeframe, lcReferenceDate)
    ↓
Call: fetchRealData("AAPL", "day", "2024-10-15")
    ↓ (page.tsx line 38)
fetchRealData():
  - Calls fetchPolygonData(symbol, timeframe, days, lcEndDate)
  - Receives bars array from API
  - Converts to ChartData format
    - dates: bars.map(bar => new Date(bar.t).toISOString())
    - Returns ChartData with x: [...timestamps...]
    ↓
setSelectedData(chartData)
    ↓
Chart renders with Plotly using dates from ChartData.x
    ↓ (EdgeChart.tsx)
User sees candlestick chart and can navigate days
    ↓
User clicks Day +1 button
    ↓
handleNextDay() called (page.tsx line 662)
    ↓
Call: calculateTargetDate(lcReferenceDate, dayOffset+1)
    ↓ (page.tsx line 616)
calculateTargetDate():
  - Expects input: "2024-10-15"
  - Concatenates: new Date("2024-10-15" + "T00:00:00")
  - If input is wrong → new Date("2024-10-15T00:00:00ZT00:00:00") → FAILS!
    ↓
Returns targetDate.toISOString().split('T')[0]
    ↓
setSelectedLCDate(calculatedDate)
    ↓
useEffect re-triggers with new lcReferenceDate
    ↓
Chart updates for new day
```

---

## Validation Points

### Point 1: Backend API Response
**File**: fastApiScanService.ts  
**Method**: `getScanResults()` line ~286

Check that returned results have `date` field in `"YYYY-MM-DD"` format:
```javascript
// Log in browser console
response.results.forEach(r => console.log(`${r.ticker}: ${r.date}`))
// Should output: "AAPL: 2024-10-15"
// NOT: "AAPL: 2024-10-15T00:00:00" or undefined
```

### Point 2: Click Handler Receives Date
**File**: page.tsx  
**Function**: `handleTickerClick()` line ~706

Add debug logging:
```typescript
const handleTickerClick = (ticker: string, lcDate?: string) => {
  console.log(`DEBUG handleTickerClick: ticker="${ticker}", lcDate="${lcDate}"`);
  // ... rest of function
```

Check console output when clicking result:
```
✓ Expected: DEBUG handleTickerClick: ticker="AAPL", lcDate="2024-10-15"
✗ Problem: DEBUG handleTickerClick: ticker="AAPL", lcDate="2024-10-15T00:00:00"
✗ Problem: DEBUG handleTickerClick: ticker="AAPL", lcDate=undefined
```

### Point 3: calculateTargetDate Receives Date
**File**: page.tsx  
**Function**: `calculateTargetDate()` line ~616

Add validation:
```typescript
const calculateTargetDate = (referenceDateStr: string, offset: number) => {
  console.log(`calculateTargetDate called: referenceDateStr="${referenceDateStr}"`);
  
  // Validate format immediately
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDateStr)) {
    console.error(`Invalid date format: ${referenceDateStr}`);
    return undefined;
  }
  
  // ... rest of function
```

### Point 4: Chart Data Loads
**File**: page.tsx  
**Function**: `useEffect` hook around line ~738

Check console for successful load:
```
✓ Expected: "Chart data loaded: 90 bars"
✗ Problem: "Error loading chart data: Invalid date"
```

---

## Test Checklist

- [ ] Backend API returns `date` in `"YYYY-MM-DD"` format
- [ ] Click handler receives correct date string
- [ ] handleTickerClick() validation passes
- [ ] calculateTargetDate() processes date without errors
- [ ] fetchRealData() receives valid date parameter
- [ ] Chart loads and displays candlesticks
- [ ] Day navigation (+1, +2, etc.) works
- [ ] Reset to Day 0 returns to LC pattern date

---

## Related Documentation

- `/Users/michaeldurante/ai dev/ce-hub/EDGE_DEV_CHART_DATA_FLOW_ANALYSIS.md` - Full technical analysis
- `/Users/michaeldurante/ai dev/ce-hub/EDGE_DEV_CHART_DATE_VALIDATION_FIX.md` - Quick fix guide
- `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_CHART_TIMING_FIX.md` - Similar date/timezone fix in Traderra

---

**Last Updated**: 2025-11-08  
**Purpose**: Quick reference for developers  
**Status**: Complete
