# AI Formatting Bugs Found vs Reference Template

## Critical Bugs in AI-Generated Code

### 1. **Initialization Order Bug** ✅ FIXED
**Location**: `__init__` method
**Issue**: `self.params` referenced before being defined
```python
# Line 33: Using self.params before definition
lookback_buffer = self.params['abs_lookback_days'] + 50  # ERROR!

# Line 55: Definition comes later
self.params = {...}
```
**Fix**: Move params definition before use
**Status**: Fixed in V2

---

### 2. **Missing Critical Column** ✅ FIXED
**Location**: `compute_full_features()` method
**Issue**: `High_over_EMA9_div_ATR` column never computed but referenced in `_check_trigger()`
```python
# Missing from compute_full_features():
df['High_over_EMA9_div_ATR'] = (df['high'] - df['EMA_9']) / df['ATR']

# But used in _check_trigger() line 395:
rx['High_over_EMA9_div_ATR'] >= self.params['high_ema9_mult']
```
**Impact**: Trigger check ALWAYS fails → 0 signals found
**Fix**: Added missing column computation
**Status**: Fixed in V2

---

### 3. **Missing Prev_Volume Column** ✅ FIXED
**Location**: `compute_full_features()` method
**Issue**: `Prev_Volume` referenced but never computed
```python
# Used in _check_trigger() line 390:
vol_sig = max(rx['volume'] / vol_avg, rx.get('Prev_Volume', 0) / vol_avg)

# But never computed in compute_full_features()
```
**Fix**: Added `df['Prev_Volume'] = df.groupby('ticker')['volume'].shift(1)`
**Status**: Fixed in V2

---

### 4. **Performance Killer: Non-vectorized ABS Window** ✅ IDENTIFIED
**Location**: `_abs_top_window()` method + `_process_ticker()` loop
**Issue**: Converts to datetime EVERY iteration for EVERY ticker
```python
# AI code - SLOW:
def _abs_top_window(self, df, d0, lookback_days, exclude_days):
    win = df[(pd.to_datetime(df['date']) > wstart) & (pd.to_datetime(df['date']) < cutoff)]
    # ^ Converts date to datetime for EVERY row!

# Reference template - FAST:
def process_ticker_3(self, ticker_data):
    ticker_df['date'] = pd.to_datetime(ticker_df['date'])  # Convert ONCE
    mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)  # Vectorized!
    win = ticker_df.loc[mask]
```
**Impact**: 9.5 minutes for 1 week vs reference 5.35 minutes
**Fix**: Use vectorized filtering like reference template
**Status**: Identified, needs fix in prompts

---

### 5. **Incorrect Date Comparison** ✅ IDENTIFIED
**Location**: `_process_ticker()` line 278
**Issue**: String comparison instead of datetime
```python
# AI code:
if not (self.d0_start <= d0['date'] <= self.d0_end):  # String compare!

# Reference template:
if d0 < pd.to_datetime(d0_start) or d0 > pd.to_datetime(d0_end):  # Datetime compare
```
**Fix**: Convert dates to datetime before comparison
**Status**: Identified, needs fix in prompts

---

### 6. **Wrong Column References** ✅ IDENTIFIED
**Location**: `_process_ticker()` line 322, 326, 350, 352
**Issue**: Uses wrong columns for D-1 > D-2 enforcement
```python
# AI code:
if not (pd.notna(r1['high']) and pd.notna(r2['high']) and r1['high'] > r2['high']):
if self.params['require_open_gt_prev_high'] and not (r0['open'] > r1['high']):
"Open>PrevHigh": bool(r0['open'] > r1['high'])
"D1>H(D-2)": bool(r1['high'] > r2['high'])

# Reference template:
if not (pd.notna(r1['Prev_High']) and pd.notna(r2['Prev_High']) and
        r1['Prev_High'] > r2['Prev_High']):
if self.params['require_open_gt_prev_high'] and not (r0['open'] > r1['high']):
"Open>PrevHigh": bool(r0['open'] > r1['high'])
"D1>H(D-2)": bool(r1['Prev_High'] > r2['Prev_High'])
```
**Fix**: Use `Prev_High` instead of `high` for D-1 > D-2 comparisons
**Status**: Identified, needs fix in prompts

---

### 7. **Incorrect Date Format in Results** ✅ IDENTIFIED
**Location**: `_process_ticker()` line 342
**Issue**: Returns datetime object instead of string
```python
# AI code:
"Date": d0['date']  # datetime object

# Reference template:
d0.strftime('%Y-%m-%d')  # string format
```
**Fix**: Format date as string in results
**Status**: Identified, needs fix in prompts

---

## Performance Comparison

| Test | AI-Generated V2 | Reference Template |
|------|----------------|-------------------|
| 1 Week (Jan 1-7) | 572 seconds (9.5 min) | 321 seconds (5.35 min) |
| Signals Found | 0 | 0 (correct - no signals that week) |
| Full Year 2025 | Not tested (would take 60+ min) | ~600 seconds (10 min) expected |

## Root Cause Analysis

The AI-generated code has these issues because the prompt doesn't emphasize:

1. **Vectorized operations** over function calls in loops
2. **Proper datetime handling** throughout the code
3. **Column dependency tracking** - ensuring all referenced columns are computed
4. **Using the correct shifted columns** (`Prev_High`, `Prev_Close`) vs current columns

## Recommended Prompt Improvements

1. **Emphasize vectorized operations**: "Use vectorized DataFrame operations, avoid repeated function calls in loops"
2. **Mandatory datetime conversion**: "Convert all date columns to datetime ONCE at the start of processing"
3. **Column computation checklist**: "Ensure ALL columns referenced in checks/comparisons are computed in feature methods"
4. **Reference template patterns**: Explicitly show the vectorized filtering pattern from reference template
5. **Performance requirements**: "Target: <10 minutes for full year scan, ~5 minutes for 1 month"

## Next Steps

1. Wait for reference template full year test to complete → confirm ~60 signals
2. Update `aiFormattingPrompts.ts` with these critical fixes
3. Regenerate AI-formatted code
4. Validate regenerated code matches reference template output
5. Create final validation report

---

**Generated**: 2025-12-29
**Status**: In Progress - Waiting for reference template validation
