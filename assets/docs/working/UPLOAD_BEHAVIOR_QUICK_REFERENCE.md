# Upload Behavior Quick Reference - Fast Lookup

## TL;DR (The 30-Second Version)

| Aspect | LC D2 | Backside Para B |
|--------|-------|-----------------|
| **Upload Speed** | Instant (1-2s) | Slow (5-30s) |
| **Why?** | Just file storage | Full code analysis |
| **Execution Result** | 0 results ❌ | Actual results ✅ |
| **Why?** | No matching pattern | Has scan_symbol() pattern |
| **Fix** | Add fetch_daily pattern | None needed |

---

## Critical File Locations

### Upload Handling (Fast)
- **Frontend**: `/Users/michaeldurante/ai dev/ce-hub/planner-chat/web/app.js`
  - Line 753-1012: File upload methods
  - Line 989-1012: `uploadFileToServer()` - just sends file

- **Backend**: `/Users/michaeldurante/ai dev/ce-hub/planner-chat/server/main.js`
  - Line 503-533: `POST /api/upload` - just stores file

### Code Analysis (Slow - Triggers on Upload)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
  - Line 760-834: `@app.post("/api/format/code")` - Full analysis
  - Line 808: `from core.code_formatter import format_user_code`

### Execution Routing (Critical)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
  - Line 507-537: `run_real_scan_background()` - Routing decision
  - Line 517: `if uploaded_code or scanner_type == "uploaded":` ← KEY DECISION
  - Line 522: `await execute_uploaded_scanner_direct()` - Uploaded code path
  - Line 525-537: Built-in scanner paths

### Pattern Matching (Critical Bug Location)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/uploaded_scanner_bypass.py`
  - Line 114-400+: `execute_uploaded_scanner_direct()` - Main execution function
  - Line 222-267: Pattern detection (4 patterns, **need Pattern 5**)
    - Line 222-226: Pattern 1 - `scan_symbol + SYMBOLS`
    - Line 229-241: Pattern 2 - `fetch_and_scan + symbols`
    - Line 244-255: Pattern 3 - `ThreadPoolExecutor main block`
    - Line 258-266: Pattern 4 - `SYMBOLS_auto` (fails for LC D2)
  - **MISSING**: Pattern 5 - `fetch_daily_data + adjust_daily + SYMBOLS` ← ADD HERE

---

## The Two Execution Paths

### Path 1: LC D2 (Instant Upload, 0 Results)

```
User uploads file
    ↓
Frontend: POST /api/upload
    ↓
Backend stores file in /uploads/
    ↓
Response: "File uploaded" (INSTANT - 1-2 seconds)
    ↓
(Later) User clicks "Run Scan"
    ↓
Main.py line 517: Check "Is there uploaded_code?"
    ↓
YES → execute_uploaded_scanner_direct()
    ↓
uploaded_scanner_bypass.py line 222-266: Pattern matching
    ↓
Pattern 1: scan_symbol() exists? NO ❌
Pattern 2: fetch_and_scan() exists? NO ❌
Pattern 3: ThreadPoolExecutor? NO ❌
Pattern 4: SYMBOLS exists? YES ✅ but...
    ↓
Look for: ['scan_daily_para', 'scan_symbol', 'execute_scan', 'main_scan']
    ↓
ALL NOT FOUND ❌
    ↓
Result: scanner_pattern="SYMBOLS_auto", scan_function=None
    ↓
Cannot execute → Returns [ ] (0 results)
```

### Path 2: Backside Para B (Slow Upload, Actual Results)

```
User uploads file
    ↓
Frontend: POST /api/upload
    ↓
Backend stores file in /uploads/
    ↓
(Automatic trigger - not in upload endpoint!)
Backend: POST /api/format/code
    ↓
Full analysis:
- AST parsing
- Parameter extraction
- Code preservation
- Integrity verification
    ↓
Response: "Code formatted" (DELAYED - 5-30 seconds)
    ↓
User clicks "Run Scan"
    ↓
Main.py line 517: Check "Is there uploaded_code?"
    ↓
YES → execute_uploaded_scanner_direct()
    ↓
uploaded_scanner_bypass.py line 222-226: Pattern matching
    ↓
Pattern 1: scan_symbol() exists? YES ✅
          + SYMBOLS exists? YES ✅
    ↓
MATCH! → scanner_pattern="scan_symbol_SYMBOLS"
    ↓
Execution:
for symbol in SYMBOLS:
    result = scan_symbol(symbol, start_date, end_date)
    results.append(result)
    ↓
Returns actual results ✅
```

---

## Why Different Upload Speeds?

### Speed Difference Mystery Solved

**LC D2 (Instant)**:
```
/api/upload endpoint:
  1. Receive file
  2. Store in /uploads/
  3. Return response (instant!)
  4. NO code analysis happens here
```

**Backside Para B (Slow)**:
```
/api/upload endpoint:
  1. Receive file
  2. Store in /uploads/
  3. Return response (instant)
  
BUT SEPARATELY (triggered somewhere):
  /api/format/code endpoint:
  1. Read uploaded file
  2. Full AST parsing
  3. Parameter extraction (10+ patterns)
  4. Code preservation engine
  5. Integrity verification
  6. Return response (5-30 seconds)
```

**Key insight**: The upload speeds don't affect execution. **Code structure determines execution success**.

---

## Pattern Matching Details

### What LC D2 Has

```python
# fetch_daily_data() function
def fetch_daily_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch daily market data from Polygon API"""
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
    response = session.get(url, params=params)
    data = response.json().get("results", [])
    df = pd.DataFrame(data)
    # ... processing
    return df

# adjust_daily() function  
def adjust_daily(df: pd.DataFrame) -> pd.DataFrame:
    """Apply all technical indicators and calculations"""
    if df.empty:
        return df
    
    df = df.copy()
    df['pdc'] = df['c'].shift(1)
    df['high_low'] = df['h'] - df['l']
    # ... 50+ calculations
    return df

# SYMBOLS list
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    # ... 88 total
]

# NO scan_symbol() function ❌
# NO main block ❌
# NO ThreadPoolExecutor ❌
```

**Pattern match attempt**:
- Pattern 1: needs `scan_symbol()` - NOT FOUND
- Pattern 2: needs `fetch_and_scan()` - NOT FOUND
- Pattern 3: needs ThreadPoolExecutor - NOT FOUND
- Pattern 4: finds SYMBOLS ✅ but then looks for scan function - NOT FOUND ❌

### What Backside Para B Has

```python
# scan_symbol() function (CRITICAL!)
def scan_symbol(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Scan daily para for single symbol"""
    # Fetch data
    # Apply calculations
    # Return results
    return results_df

# SYMBOLS list
SYMBOLS = [
    'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
    # ... 47 total
]

# Parameters dictionary
P = {
    "price_min"        : 8.0,
    "adv20_min_usd"    : 30_000_000,
    "abs_lookback_days": 1000,
    # ... 12 parameters
}
```

**Pattern match result**:
- Pattern 1: `scan_symbol()` found ✅ + `SYMBOLS` found ✅ = MATCH!

---

## How to Fix LC D2

### Option A: Add Pattern 5 (Recommended)

**File**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/uploaded_scanner_bypass.py`
**Location**: After line 266 (after Pattern 4), before `if scanner_pattern and symbols:`

```python
# Pattern 5: fetch_daily_data + adjust_daily (LC D2 style)
elif (
    hasattr(uploaded_module, 'fetch_daily_data') and 
    hasattr(uploaded_module, 'adjust_daily') and
    hasattr(uploaded_module, 'SYMBOLS')
):
    scanner_pattern = "fetch_daily_adjust_daily"
    symbols = uploaded_module.SYMBOLS
    fetch_function = uploaded_module.fetch_daily_data
    adjust_function = uploaded_module.adjust_daily
    
    print(f"🎯 Detected Pattern 5: fetch_daily_data + adjust_daily + SYMBOLS ({len(symbols)} symbols)")
```

Then add execution logic (around line 357+):

```python
elif scanner_pattern == "fetch_daily_adjust_daily":
    # Pattern 5: fetch_daily_data + adjust_daily
    print(f"🎯 Pattern 5: LC D2 style scan...")
    
    for i, symbol in enumerate(symbols):
        try:
            # Fetch historical data
            result_df = uploaded_module.fetch_daily_data(symbol, fetch_start, fetch_end)
            if result_df is not None and not result_df.empty:
                # Apply adjustments
                adjusted_df = uploaded_module.adjust_daily(result_df)
                if adjusted_df is not None and not adjusted_df.empty:
                    all_results.append(adjusted_df)
            
            if progress_callback and i % 10 == 0:
                progress = 65 + (i / len(symbols)) * 20
                await progress_callback(progress, f"🎯 Processed {i}/{len(symbols)} symbols...")
        
        except Exception as e:
            print(f"Error scanning {symbol}: {e}")
            continue
```

**Time to implement**: 10-15 minutes
**Risk**: Low - adds pattern, doesn't modify existing patterns

### Option B: Require Wrapper Function

Modify LC D2 to have `scan_symbol()`:

```python
def scan_symbol(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Scan symbol - required by execution system"""
    df = fetch_daily_data(symbol, start_date, end_date)
    if df.empty:
        return df
    return adjust_daily(df)
```

**Time to implement**: 2-3 minutes
**Risk**: Very low - just adds wrapper function
**Downside**: Requires user code modification

### Option C: Generic Main Block Execution

Detect `if __name__ == '__main__':` and execute directly (broader fix for all scanners)

**Time to implement**: 30-45 minutes
**Risk**: Medium - affects all execution paths
**Benefit**: Handles any scanner structure

---

## Key Code Snippets for Debugging

### Check Pattern Detection

In `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/uploaded_scanner_bypass.py`:

```python
# Line 222-267: Add debug after pattern matching

if scanner_pattern:
    print(f"✅ Pattern matched: {scanner_pattern}")
    if hasattr(uploaded_module, 'SYMBOLS'):
        print(f"   SYMBOLS found: {len(uploaded_module.SYMBOLS)} symbols")
    if scan_function:
        print(f"   Scan function: {scan_function.__name__}")
    else:
        print(f"   ⚠️ Scan function: None (may fail!)")
else:
    print(f"❌ No pattern matched!")
    print(f"   Module attributes: {dir(uploaded_module)}")
```

### Check Routing Decision

In `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`:

```python
# Line 510-515: Routing debug (already present)
logger.info(f"🔍 ROUTING DEBUG for {scan_id}:")
logger.info(f"   scanner_type: {repr(scanner_type)}")
logger.info(f"   uploaded_code: {'Present' if uploaded_code else 'None/Empty'}")
logger.info(f"   Condition (uploaded_code or scanner_type == 'uploaded'): {uploaded_code or scanner_type == 'uploaded'}")
logger.info(f"   scan_info keys: {list(scan_info.keys())}")
```

---

## Testing the Fix

### Test Case 1: LC D2 Before Fix

```
1. Upload: lc d2 scan - oct 25 new ideas.py
2. Run scan
3. Expected: 0 results (pattern not found)
```

### Test Case 1: LC D2 After Fix

```
1. Upload: lc d2 scan - oct 25 new ideas.py
2. Run scan
3. Expected: Actual LC D2 results (non-zero)
4. Check logs: "Detected Pattern 5: fetch_daily_data + adjust_daily"
```

### Test Case 2: Backside Para B (Should Continue Working)

```
1. Upload: backside para b copy.py
2. Run scan
3. Expected: Actual Backside Para B results (non-zero)
4. Check logs: "Detected Pattern 1: scan_symbol + SYMBOLS"
```

---

## Summary Checklist

- [x] Upload speed difference understood (Path difference, not file issue)
- [x] LC D2 instant upload explained (no analysis)
- [x] Backside Para B slow upload explained (auto analysis)
- [x] Execution failure root cause identified (missing pattern)
- [x] Pattern matching logic explained
- [x] Fix option provided (add Pattern 5)
- [x] Implementation time estimated
- [x] Testing strategy provided

---

## One-Line Summary

**LC D2 uploads instantly but fails because it's missing the "fetch_daily_data + adjust_daily" execution pattern that Backside Para B has.**
