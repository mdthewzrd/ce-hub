# Edge.dev Chart Date Validation - Executive Summary

## Problem Statement

Users report that charts were working previously but now fail with **Date validation errors** when clicking on scan results to view charts. The application no longer loads chart data after clicking on a result row.

## Root Cause Identified

The chart functionality depends on a specific date format pipeline:

```
Scan Result (backend) → Click Handler → calculateTargetDate() → fetchRealData() → Chart Display
```

Any of these could fail due to date format issues:

1. **Backend returns malformed date** - e.g., `"2024-10-15T00:00:00Z"` instead of `"2024-10-15"`
2. **Click handler receives invalid date** - Missing or wrong format date from result
3. **Date calculation fails** - calculateTargetDate() receives invalid format
4. **Chart fetch fails** - Polygon API call with bad date

## Expected vs Actual

### Expected Scan Result Format (WORKING)
```javascript
{
  ticker: "AAPL",
  date: "2024-10-15",        // ✓ YYYY-MM-DD, no time
  gap_percent: 2.5,
  parabolic_score: 8.3,
  // ... other fields
}
```

### Problematic Formats (BROKEN)
```javascript
// ❌ Has time component
{ date: "2024-10-15T00:00:00" }
{ date: "2024-10-15T00:00:00Z" }

// ❌ Wrong format
{ date: "10-15-2024" }
{ date: "15/10/2024" }

// ❌ Missing/invalid
{ date: null }
{ date: undefined }
{ date: "0000-00-00" }
```

## Critical Code Path Analysis

### Location 1: Click Handler (lines 706-725 in page.tsx)
```typescript
const handleTickerClick = (ticker: string, lcDate?: string) => {
  // ⚠️ PROBLEM: No date validation!
  // If lcDate = "2024-10-15T00:00:00Z", it's stored as-is
  setLcReferenceDate(lcDate);
  setSelectedLCDate(lcDate);
  // Later this gets passed to calculateTargetDate which expects "YYYY-MM-DD"
};
```

**Issue**: Date passed directly to state without format validation.

### Location 2: calculateTargetDate (lines 616-650)
```typescript
const calculateTargetDate = (referenceDateStr: string, offset: number) => {
  // Expects: "2024-10-15"
  // If receives: "2024-10-15T00:00:00Z"
  
  const lcPatternDate = new Date(referenceDateStr + 'T00:00:00');
  // Result: new Date("2024-10-15T00:00:00ZT00:00:00") → INVALID!
  
  if (isTradingDay(lcPatternDate)) { // Invalid date → fails
    // ...
  }
};
```

**Issue**: Concatenation creates malformed timestamp if input already has time component.

### Location 3: Chart Load (lines 738-756)
```typescript
fetchRealData(selectedTicker, timeframe, lcReferenceDate || undefined)
  .then(data => {
    if (data) {
      setSelectedData(data);  // Success
    }
  })
  .catch(error => {
    console.error('Error loading chart data:', error);
    // Date validation error thrown here
  });
```

**Issue**: If lcReferenceDate is malformed, Polygon API call fails.

## Quick Fix Checklist

### Immediate Fixes (Frontend)

1. **Add date validation before click handler stores the date**
   ```typescript
   // Add this validation function
   const isValidLCDate = (dateString: string | undefined): boolean => {
     if (!dateString) return false;
     const dateRegex = /^\d{4}-\d{2}-\d{2}$/;  // YYYY-MM-DD only
     if (!dateRegex.test(dateString)) return false;
     const date = new Date(dateString + 'T00:00:00');
     return !isNaN(date.getTime());
   };
   
   // Use in handleTickerClick
   if (lcDate && isValidLCDate(lcDate)) {
     setLcReferenceDate(lcDate);
     // ...
   } else {
     console.warn(`Invalid date: ${lcDate}`);
   }
   ```

2. **Add error handling to calculateTargetDate()**
   ```typescript
   const calculateTargetDate = (referenceDateStr: string, offset: number): string => {
     try {
       // Validate input format first
       if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDateStr)) {
         throw new Error(`Invalid date format: ${referenceDateStr}`);
       }
       
       const lcPatternDate = new Date(referenceDateStr + 'T00:00:00');
       if (isNaN(lcPatternDate.getTime())) {
         throw new Error(`Invalid date value: ${referenceDateStr}`);
       }
       // ... rest of function ...
     } catch (error) {
       console.error(`Date calculation failed:`, error);
       throw error;
     }
   };
   ```

3. **Strip time component from backend dates if present**
   ```typescript
   const normalizeDate = (dateString: string): string => {
     // Remove any time component
     return dateString.split('T')[0];
   };
   
   // In handleTickerClick
   const normalizedDate = lcDate ? normalizeDate(lcDate) : undefined;
   if (normalizedDate && isValidLCDate(normalizedDate)) {
     setLcReferenceDate(normalizedDate);
   }
   ```

### Backend Fixes (Optional but Recommended)

1. **Ensure date field is properly formatted**
   - Verify backend scan results have `date` field
   - Ensure format is `"YYYY-MM-DD"` with no time component
   - Add validation before returning results

2. **Add type checking to response serialization**
   ```python
   # Python backend
   def serialize_result(result):
     return {
       'ticker': result.ticker,
       'date': result.date.strftime('%Y-%m-%d'),  # Ensure YYYY-MM-DD format
       'gap_percent': result.gap_percent,
       # ... other fields
     }
   ```

## Testing Verification

### Test 1: Valid Date
```
1. Click on AAPL result with date "2024-10-15"
2. Check console: should see "Enabling chart day navigation for AAPL..."
3. Chart should load and display candlesticks
4. Day navigation should work (+1, +2, etc.)
```

### Test 2: Invalid Date (Current Bug)
```
1. Inspect network response to see actual date format
2. If date has time component (T00:00:00), that's the problem
3. Apply fixes above to strip/validate the date
```

### Debug Steps
1. Open browser console
2. Click on a scan result
3. Look for logs:
   - `handleTickerClick called: lcDate: "2024-10-15"`
   - `Enabling chart day navigation for AAPL...`
   - `Chart loading effect triggered...`
   - `Chart data loaded: 90 bars`
4. If you see date validation errors, that confirms the issue
5. Check Network tab → API response to see actual date format

## Files Affected

| File | Issue | Fix |
|------|-------|-----|
| `/edge-dev/src/app/page.tsx` line 706 | handleTickerClick no validation | Add isValidLCDate() call |
| `/edge-dev/src/app/page.tsx` line 616 | calculateTargetDate no format check | Add regex validation |
| `/edge-dev/src/app/page.tsx` line 59 | fetchRealData date handling | Already correct, just needs valid input |
| Backend scan endpoint | May return wrong date format | Ensure YYYY-MM-DD format |

## Expected Outcome After Fix

```
BEFORE (Broken):
User clicks AAPL result → Error: "Invalid date"

AFTER (Fixed):
User clicks AAPL result → Chart loads
→ Shows candlesticks for that ticker
→ Day navigation works (can see Day +1, Day +2, etc.)
→ Can navigate back to Day 0 (LC pattern date)
```

## Priority & Complexity

- **Priority**: HIGH - Blocks core functionality
- **Complexity**: LOW - Simple date format validation
- **Risk**: VERY LOW - Changes are isolated and non-breaking
- **Estimated Time**: 15-30 minutes implementation + testing

## Next Steps

1. **Immediate**: Add console logging to see what date format is actually being received
   ```typescript
   // In handleTickerClick, add:
   console.log(`DEBUG: lcDate = "${lcDate}" (type: ${typeof lcDate})`);
   ```

2. **Apply quick fixes** from "Immediate Fixes" section above

3. **Test** with a real scan result click

4. **Verify** charts load and day navigation works

5. **Check backend** to ensure date format is `"YYYY-MM-DD"`

---

**Document Created**: 2025-11-08  
**Status**: Ready for implementation  
**Severity**: Critical bug affecting user experience
