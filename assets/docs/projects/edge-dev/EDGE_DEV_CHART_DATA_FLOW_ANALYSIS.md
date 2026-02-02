# Edge.dev Chart Functionality Analysis
## Date Processing & Chart Data Flow Investigation

### Executive Summary

The Edge.dev application's chart functionality was working previously but currently fails with date validation errors when clicking on scan results. This analysis identifies the critical data flow paths, date format requirements, and root causes for the failures.

---

## 1. CHART DATA FLOW - How It All Works

### 1.1 Scan Result Structure (Backend Format)

Scan results come from FastAPI with the following structure:

```typescript
export interface ScanResult {
  symbol: string;           // e.g., "AAPL"
  ticker: string;           // Ticker symbol  
  date: string;             // LC PATTERN DATE - Critical field!
  scanner_type: string;     // e.g., "lc_frontside_d2"
  gap_percent: number;
  volume_ratio: number | null;
  signal_strength: 'Strong' | 'Moderate';
  entry_price: number;
  target_price: number;
  
  // Legacy fields for backward compatibility
  gapPercent?: number;
  volume?: number;
  score?: number;
}

export interface EnhancedScanResult extends ScanResult {
  id?: string;
  parabolic_score?: number;
  confidence_score?: number;
  close?: number;
  // ... many more optional fields
}
```

**CRITICAL**: The `date` field is the LC PATTERN DATE - the date when the chart pattern was identified.

### 1.2 Click Handler Flow

When user clicks on a scan result row:

```
User clicks row (e.g., AAPL on 2024-10-15)
       ↓
handleTickerClick("AAPL", "2024-10-15") called
       ↓
setSelectedTicker("AAPL")
setLcReferenceDate("2024-10-15")     // Store the LC pattern date
setDayOffset(0)                        // Reset to Day 0
       ↓
useEffect triggers (depends on: selectedTicker, timeframe, lcReferenceDate)
       ↓
fetchRealData("AAPL", timeframe, "2024-10-15") called
       ↓
fetchPolygonData processes the date
```

### 1.3 Date Format Requirements

**Frontend Date Format**: `"YYYY-MM-DD"` (no time component)
- Example: `"2024-10-15"`
- Used as: `lcDate` parameter passed to click handlers
- Format from scan results: Should be ISO date strings

**Timestamp Format in Chart**: ISO 8601 full timestamps
- Example: `"2024-10-15T14:30:00Z"`
- Used in chart.x arrays for candlestick data
- Must be parseable by `new Date()`

### 1.4 Date Processing in calculateTargetDate

```typescript
const calculateTargetDate = (referenceDateStr: string, offset: number): string => {
  // Input: "2024-10-15" (date string without time)
  const lcPatternDate = new Date(referenceDateStr + 'T00:00:00');
  // Creates: Date object for 2024-10-15 at 00:00:00 UTC
  
  // Find the actual trading day
  let day0TradingDate: Date;
  if (isTradingDay(lcPatternDate)) {
    day0TradingDate = new Date(lcPatternDate);
  } else {
    // If not a trading day, use previous trading day
    day0TradingDate = getPreviousTradingDay(lcPatternDate);
  }
  
  // Navigate by trading days from Day 0
  let targetDate = new Date(day0TradingDate);
  
  // ... apply offset ...
  
  // Return: "YYYY-MM-DD" format
  return targetDate.toISOString().split('T')[0];
};
```

---

## 2. KEY FUNCTIONS & THEIR ROLES

### 2.1 fetchRealData() - Chart Data Loader

**Location**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/page.tsx` lines 38-95

**Purpose**: Fetch market data from Polygon API and format it for chart display

**Parameters**:
- `symbol`: Ticker symbol (e.g., "AAPL")
- `timeframe`: Chart timeframe (e.g., "day", "hour", "15min", "5min")
- `lcEndDate?: string`: Optional LC pattern date in "YYYY-MM-DD" format

**Process Flow**:
1. Calls `fetchPolygonData()` to get bars from API
2. Converts bars to chart format:
   ```typescript
   const dates = bars.map(bar => new Date(bar.t).toISOString());
   // Result: ["2024-10-15T14:30:00Z", "2024-10-15T14:31:00Z", ...]
   ```
3. Returns ChartData object with arrays:
   ```typescript
   {
     x: [...],          // Timestamps
     open: [...],       // OHLC data
     high: [...],
     low: [...],
     close: [...],
     volume: [...]
   }
   ```

**Critical Date Handling**:
- Uses `new Date(bar.t).toISOString()` to convert Polygon timestamps
- Preserves UTC timezone information
- No hardcoded timezone offsets

### 2.2 calculateTargetDate() - Day Navigation Handler

**Location**: Lines 616-650

**Purpose**: Calculate the actual date for a given day offset in trading days

**Key Logic**:
- Takes LC reference date and day offset
- Accounts for weekends and holidays (non-trading days)
- Returns "YYYY-MM-DD" string

**Date Format**:
- **Input**: `"2024-10-15"` (plain string)
- **Internal**: Converts to Date object with `new Date(referenceDateStr + 'T00:00:00')`
- **Output**: `"2024-10-15"` (extracted via `.split('T')[0]`)

### 2.3 getCurrentDayDate() - Get Current Navigation Date

**Location**: Lines 700-703

**Purpose**: Return the Date object for the current day navigation

```typescript
const getCurrentDayDate = () => {
  if (!lcReferenceDate) return new Date();
  return new Date(calculateTargetDate(lcReferenceDate, dayOffset) + 'T00:00:00');
};
```

**Problem Area**: This function concatenates a plain date string with 'T00:00:00'
- Assumes input is in "YYYY-MM-DD" format
- If `calculateTargetDate()` returns invalid format → Date parsing fails
- Could throw "Invalid Date" if the string is malformed

### 2.4 handleTickerClick() - Result Selection Handler

**Location**: Lines 706-725

**Purpose**: Handle clicking on a scan result in the table

```typescript
const handleTickerClick = (ticker: string, lcDate?: string) => {
  setSelectedTicker(ticker);
  
  if (lcDate) {
    setLcReferenceDate(lcDate);    // Store the LC date
    setSelectedLCDate(lcDate);
    setDayOffset(0);
    console.log(`📅 Enabling chart day navigation for ${ticker}...`);
  } else {
    setLcReferenceDate(null);
    setSelectedLCDate(null);
    setDayOffset(0);
  }
  
  setIsLoadingData(true);          // Trigger chart load
};
```

**Critical**: 
- Expects `lcDate` to be in "YYYY-MM-DD" format
- Directly stores it without validation
- If malformed date comes from backend → validation error occurs later

---

## 3. DATE VALIDATION ERROR ROOT CAUSES

### 3.1 Potential Issues in Scan Result Data

The `date` field in scan results might be:

1. **Missing entirely**
   - Backend returns object without `date` property
   - `result.date === undefined`
   - Click handler receives `undefined` instead of date string

2. **Wrong format**
   - Example: `"10-15-2024"` (MM-DD-YYYY format)
   - Example: `"2024-10-15T00:00:00"` (with time component)
   - Example: `"2024/10/15"` (with slashes)
   - calculateTargetDate expects "YYYY-MM-DD"

3. **Invalid value**
   - Example: `"0000-00-00"` (null/sentinel date)
   - Example: `"2024-13-01"` (invalid month)
   - Example: `"not_a_date"`

4. **Timezone-aware ISO strings**
   - Example: `"2024-10-15T00:00:00Z"` (with timezone)
   - When passed to `calculateTargetDate`, concatenation creates:
     - `"2024-10-15T00:00:00ZT00:00:00"` (MALFORMED)
   - Results in: `new Date("2024-10-15T00:00:00ZT00:00:00")` → Invalid Date

### 3.2 Where Validation Fails

**Step 1: calculateTargetDate() receives malformed date**
```typescript
const lcPatternDate = new Date(referenceDateStr + 'T00:00:00');
// If referenceDateStr = "2024-10-15T00:00:00Z"
// Result: new Date("2024-10-15T00:00:00ZT00:00:00") → Invalid!
```

**Step 2: isTradingDay() fails silently**
```typescript
if (isTradingDay(lcPatternDate)) {  // lcPatternDate is Invalid Date
  // Function may return false or throw
  // getPreviousTradingDay() then receives Invalid Date
}
```

**Step 3: Date calculations produce NaN**
```typescript
targetDate.toISOString().split('T')[0]
// If targetDate is Invalid Date:
// → "Invalid Date".split() → ["Invalid", "Date"]
// → Returns "Invalid" instead of "2024-10-15"
```

**Step 4: Chart load fails**
```typescript
const getCurrentDayDate = () => {
  return new Date(calculateTargetDate(lcReferenceDate, dayOffset) + 'T00:00:00');
  // If calculateTargetDate returns "Invalid"
  // → new Date("InvalidT00:00:00") → Invalid Date
  // → fetchRealData fails with date validation error
};
```

---

## 4. DATA FORMAT VALIDATION CHECKLIST

### 4.1 Expected Scan Result Date Format

The scan results should have:

```javascript
{
  ticker: "AAPL",
  date: "2024-10-15",     // ✓ YYYY-MM-DD format, NO time component
  gap_percent: 2.5,
  // ... other fields
}
```

### 4.2 Invalid Formats That Will Break

```javascript
// ❌ WRONG - Has time component
{ date: "2024-10-15T00:00:00" }

// ❌ WRONG - Has timezone indicator
{ date: "2024-10-15T00:00:00Z" }

// ❌ WRONG - Wrong date format
{ date: "10-15-2024" }  // MM-DD-YYYY
{ date: "15/10/2024" }  // DD/MM/YYYY

// ❌ WRONG - Missing date entirely
{ ticker: "AAPL" }

// ❌ WRONG - Invalid date value
{ date: "0000-00-00" }
{ date: "2024-13-01" }

// ❌ WRONG - Null/undefined
{ date: null }
{ date: undefined }
```

---

## 5. HISTORICAL CONTEXT & WORKING EXAMPLE

### 5.1 How It Works When Everything Is Correct

**Working Flow**:
```
Backend returns scan result:
{
  ticker: "AAPL",
  date: "2024-10-15",
  gap_percent: 2.5,
  // ...
}
       ↓
User clicks result row
       ↓
handleTickerClick("AAPL", "2024-10-15")
       ↓
lcReferenceDate = "2024-10-15"  // Stored correctly
       ↓
useEffect triggers
       ↓
fetchRealData("AAPL", timeframe, "2024-10-15")
       ↓
fetchPolygonData receives: "2024-10-15"
       ↓
Returns chart data with x-axis timestamps:
["2024-10-14T14:30:00Z", "2024-10-14T14:31:00Z", ..., "2024-10-15T16:00:00Z"]
       ↓
Chart renders successfully
       ↓
User can navigate with Day +1, Day +2, etc.
```

### 5.2 Chart Timing Fix Reference

See `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_CHART_TIMING_FIX.md` for how timestamp mismatches were fixed in Traderra:

**The issue**: Chart data timestamps didn't match trade execution times because of artificial 5-hour timezone offset.

**The fix**: 
- Use UTC timestamps consistently
- Don't artificially modify timestamps
- Let date/time libraries handle timezone display

**Relevant code change**:
```typescript
// BEFORE (problematic):
const easternTime = new Date(barTime.getTime() - (5 * 60 * 60 * 1000))
x.push(easternTime.toISOString())

// AFTER (fixed):
x.push(barTime.toISOString())  // Use UTC directly
```

---

## 6. SCAN RESULT STRUCTURE ANALYSIS

### 6.1 Where Dates Come From

**Backend (`fastApiScanService`)**:
- Location: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts`
- Endpoints:
  - `/api/scan/execute` - Start scan
  - `/api/scan/status/{scanId}` - Check progress
  - `/api/scan/results/{scanId}` - Get results

**Expected Response Format** (lines 17-26):
```typescript
export interface ScanResult {
  ticker: string;
  date: string;           // This is the critical field
  gap_pct: number;
  parabolic_score: number;
  lc_frontside_d2_extended: number;
  volume: number;
  close: number;
  confidence_score: number;
}
```

### 6.2 Date Deduplication Logic

Location: Lines 19-35 of `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/page.tsx`

```typescript
function deduplicateResults(results: any[]): any[] {
  const seen = new Set<string>();
  const deduplicated = [];

  for (const result of results) {
    // Uses result.ticker and result.date to create unique key
    const key = `${result.ticker}_${result.date}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(result);
    }
  }

  return deduplicated;
}
```

**Note**: This function assumes `result.date` is always present and is a string.
If `date` is undefined → key becomes `"AAPL_undefined"` → no deduplication

### 6.3 Result Display in Table

Location: Lines 2689 of page.tsx (in JSX):
```tsx
<tr
  key={`${result.ticker}-${result.date}`}
  onClick={() => handleTickerClick(result.ticker, result.date)}
  className="cursor-pointer hover:bg-gray-700 transition-colors"
>
  {/* Table cells display: result.ticker, result.date, result.gap_percent, etc. */}
</tr>
```

**Critical**: The `onClick` handler passes `result.date` directly - no validation!

---

## 7. MARKET CALENDAR INTEGRATION

Location: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/utils/marketCalendar.ts`

### 7.1 Trading Day Functions

```typescript
export function isTradingDay(date: Date): boolean {
  // Checks if date is a weekday and not a holiday
}

export function getNextTradingDay(date: Date): Date {
  // Returns next trading day (skips weekends/holidays)
}

export function getPreviousTradingDay(date: Date): Date {
  // Returns previous trading day (skips weekends/holidays)
}
```

**Usage in calculateTargetDate**:
- These functions receive Date objects
- Expect valid date inputs
- Return Date objects

**Problem**: If `new Date(referenceDateStr + 'T00:00:00')` creates Invalid Date:
- `isTradingDay(invalidDate)` will fail
- `getNextTradingDay(invalidDate)` will return undefined or Invalid Date
- Entire calculation chain breaks

---

## 8. CHECKLIST FOR FIXING DATE VALIDATION ERRORS

### 8.1 Data Validation on Backend

- [ ] Ensure all scan results have a `date` field
- [ ] Verify date format is `"YYYY-MM-DD"` (no time component)
- [ ] Validate date is a valid calendar date
- [ ] Reject results with null/undefined dates
- [ ] Ensure date is not in the future
- [ ] Add type checking in response serialization

### 8.2 Frontend Input Validation

Add validation before using dates:

```typescript
const isValidLCDate = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    console.error(`Invalid date format: ${dateString}`);
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) {
    console.error(`Invalid date value: ${dateString}`);
    return false;
  }
  
  return true;
};
```

### 8.3 Defensive Date Handling

```typescript
const handleTickerClick = (ticker: string, lcDate?: string) => {
  setSelectedTicker(ticker);
  
  // Validate date format before using
  if (lcDate && isValidLCDate(lcDate)) {
    setLcReferenceDate(lcDate);
    setSelectedLCDate(lcDate);
    setDayOffset(0);
  } else {
    console.warn(`⚠️ Invalid LC date provided: ${lcDate}`);
    setLcReferenceDate(null);
    setSelectedLCDate(null);
    setDayOffset(0);
  }
  
  setIsLoadingData(true);
};
```

### 8.4 Error Handling in calculateTargetDate

```typescript
const calculateTargetDate = (referenceDateStr: string, offset: number): string => {
  try {
    if (!referenceDateStr || typeof referenceDateStr !== 'string') {
      throw new Error(`Invalid reference date: ${referenceDateStr}`);
    }
    
    const lcPatternDate = new Date(referenceDateStr + 'T00:00:00');
    
    if (isNaN(lcPatternDate.getTime())) {
      throw new Error(`Date parsing failed for: ${referenceDateStr}`);
    }
    
    // ... rest of logic ...
    
    const result = targetDate.toISOString().split('T')[0];
    
    if (!result || result === 'Invalid') {
      throw new Error(`Date calculation resulted in invalid date`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error in calculateTargetDate:`, error);
    console.error(`   Input: referenceDateStr="${referenceDateStr}", offset=${offset}`);
    throw error;
  }
};
```

---

## 9. DEBUG LOGGING ADDITIONS

Add comprehensive logging to track date flow:

```typescript
const handleTickerClick = (ticker: string, lcDate?: string) => {
  console.log(`🔍 handleTickerClick called:`);
  console.log(`   ticker: ${ticker}`);
  console.log(`   lcDate: ${lcDate} (type: ${typeof lcDate})`);
  
  setSelectedTicker(ticker);
  
  if (lcDate) {
    console.log(`   Setting LC reference date: ${lcDate}`);
    setLcReferenceDate(lcDate);
    setSelectedLCDate(lcDate);
    setDayOffset(0);
  }
  
  setIsLoadingData(true);
};

// In the useEffect that loads chart data:
useEffect(() => {
  if (selectedTicker) {
    console.log(`📊 Chart loading effect triggered:`);
    console.log(`   selectedTicker: ${selectedTicker}`);
    console.log(`   lcReferenceDate: ${lcReferenceDate}`);
    console.log(`   timeframe: ${timeframe}`);
    
    fetchRealData(selectedTicker, timeframe, lcReferenceDate || undefined)
      .then(data => {
        if (data) {
          console.log(`✅ Chart data loaded: ${data.chartData.x.length} bars`);
        }
      })
      .catch(error => {
        console.error(`❌ Chart load error:`, error);
        console.error(`   Input values - ticker: ${selectedTicker}, lcDate: ${lcReferenceDate}`);
      });
  }
}, [selectedTicker, timeframe, lcReferenceDate]);
```

---

## 10. CRITICAL FILES SUMMARY

| File | Location | Purpose | Date-Critical Code |
|------|----------|---------|-------------------|
| page.tsx | `/edge-dev/src/app/page.tsx` | Main page with chart loading & date navigation | calculateTargetDate, handleTickerClick, getCurrentDayDate |
| scanTypes.ts | `/edge-dev/src/types/scanTypes.ts` | Type definitions for scan results | ScanResult interface - `date` field |
| EdgeChart.tsx | `/edge-dev/src/components/EdgeChart.tsx` | Chart rendering component | Date format: ISO strings in x array |
| fastApiScanService.ts | `/edge-dev/src/services/fastApiScanService.ts` | Backend API client | Returns ScanResult with `date` field |
| marketCalendar.ts | `/edge-dev/src/utils/marketCalendar.ts` | Trading day calculations | isTradingDay, getNextTradingDay functions |
| polygonData.ts | `/edge-dev/src/utils/polygonData.ts` | Polygon API data fetching | Converts bar.t to ISO strings |

---

## 11. VALIDATION & TESTING APPROACH

### 11.1 Test Cases for Date Validation

**Test 1: Valid Date**
```javascript
Input: { ticker: "AAPL", date: "2024-10-15" }
Expected: Chart loads, day navigation works
```

**Test 2: Missing Date**
```javascript
Input: { ticker: "AAPL" }
Expected: Graceful degradation, no chart error
```

**Test 3: Invalid Format**
```javascript
Input: { ticker: "AAPL", date: "2024-10-15T00:00:00Z" }
Expected: Date validation fails, error message shown
```

**Test 4: Invalid Date Value**
```javascript
Input: { ticker: "AAPL", date: "2024-13-01" }
Expected: Date validation fails, error message shown
```

### 11.2 Debug Verification

1. Click on a scan result row
2. Check browser console for:
   - `handleTickerClick` log showing `lcDate` value and type
   - `calculateTargetDate` execution logs
   - Any Date parsing errors
3. Verify in Network tab that API response includes `date` field
4. Check that returned date matches result row display

---

## Summary

The chart functionality depends critically on proper date format handling throughout the pipeline:

1. **Scan results must provide**: `date` field in `"YYYY-MM-DD"` format
2. **Click handler receives**: Date string passed directly without validation
3. **calculateTargetDate expects**: Plain date string, no time component
4. **Chart data needs**: ISO full timestamps with timezone info
5. **Day navigation requires**: Valid trading day calculations based on reference date

Any break in this chain - malformed date format, missing date field, or invalid date value - will cause the "Date validation error" when clicking on scan results.

---

**Last Updated**: 2025-11-08
**Analysis Type**: Code flow & data format investigation
**Status**: Complete - Ready for implementation
