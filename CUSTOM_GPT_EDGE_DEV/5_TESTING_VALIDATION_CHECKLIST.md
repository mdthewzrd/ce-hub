# ✅ TESTING & VALIDATION CHECKLIST
## Complete Validation Protocol for V31 Scanners

**Version**: 1.0
**Purpose**: Ensure generated scanner code is production-ready and V31 compliant

---

## 🎯 VALIDATION OVERVIEW

### Why Validation Matters

- **Incorrect scanners = Bad trades**: A bug in the scanner can lead to false signals
- **Performance issues**: Poor architecture = slow scans = missed opportunities
- **Data integrity**: Wrong calculations = wrong backtest results
- **Maintainability**: Non-compliant code = hard to modify later

### Validation Levels

1. **Syntax Check**: Code runs without errors
2. **Architecture Check**: Follows V31 structure
3. **Logic Check**: Pattern detection works correctly
4. **Performance Check**: Runs efficiently
5. **Output Check**: Returns correct format

---

## 📋 LEVEL 1: SYNTAX VALIDATION

### 1.1 Import Validation
```python
# Check these imports are present
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional
```

**Validation Command:**
```bash
python -m py_compile scanner_file.py
```

### 1.2 Class Structure Validation
```python
# Check class has all required components
class ScannerName:
    def __init__(self, api_key: str, d0_start: str, d0_end: str): ...
    def run_scan(self): ...
    def fetch_grouped_data(self): ...
    def compute_simple_features(self, df): ...
    def apply_smart_filters(self, df): ...
    def compute_full_features(self, df): ...
    def detect_patterns(self, df): ...
```

**Manual Check:**
- [ ] All 7 methods present
- [ ] Correct signatures
- [ ] No syntax errors

---

## 📋 LEVEL 2: ARCHITECTURE VALIDATION

### 2.1 Historical Buffer Calculation
```python
# In __init__, check:
self.d0_start_user = d0_start
lookback = self.params.get('abs_lookback_days', 1000) + 50
self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)).strftime('%Y-%m-%d')
```

**Test:**
```python
scanner = ScannerClass("key", "2024-01-01", "2024-01-31")
assert scanner.scan_start < "2023-10-01"  # Should be ~1000+50 days before
assert scanner.d0_start_user == "2024-01-01"
```

### 2.2 Market Calendar Usage
```python
# In fetch_grouped_data(), check:
import pandas_market_calendars as mcal

nyse = mcal.get_calendar('NYSE')
trading_dates = nyse.schedule(start_date, end_date).index.strftime('%Y-%m-%d').tolist()
```

**Test:**
```python
# Should NOT use weekday()
assert "weekday()" not in open('scanner_file.py').read()
```

### 2.3 Per-Ticker Operations
```python
# Check all rolling operations use groupby().transform()
df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)
```

**Test:**
```bash
# Search for rolling operations
grep -n "\.rolling(" scanner_file.py
# Should all be inside groupby().transform()
```

### 2.4 Smart Filters (Historical/D0 Separation)
```python
# In apply_smart_filters(), check:
df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

df_output_filtered = df_output_range[filters].copy()
df_combined = pd.concat([df_historical, df_output_filtered])
```

**Test:**
```python
# Verify no data is lost
original_len = len(df)
filtered_len = len(df_combined)
# Historical + filtered D0 should preserve data
```

### 2.5 Two-Pass Features
```python
# Check separate methods exist:
def compute_simple_features(self, df): ...  # For filtering
def compute_full_features(self, df): ...     # For detection
```

**Test:**
- [ ] compute_simple_features exists
- [ ] compute_full_features exists
- [ ] Simple features don't include expensive calculations (EMA, ATR)
- [ ] Full features include all technical indicators

### 2.6 Parallel Processing
```python
# Stage 1: Parallel date fetching
with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
    future_to_date = {
        executor.submit(self._fetch_grouped_day, date_str): date_str
        for date_str in trading_dates
    }

# Stage 3: Parallel ticker processing
with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
    future_to_ticker = {
        executor.submit(self._process_ticker, td): td[0]
        for td in ticker_data_list
    }
```

**Test:**
```python
# Should have ThreadPoolExecutor
assert "ThreadPoolExecutor" in open('scanner_file.py').read()
```

### 2.7 Early D0 Filtering
```python
# In detection loop, check:
for i in range(2, len(ticker_df)):
    d0 = ticker_df.iloc[i]['date']

    # Early exit
    if d0 < d0_start_dt or d0 > d0_end_dt:
        continue
```

**Test:**
```bash
# Check for early exit in detection
grep -A5 "for i in range" scanner_file.py | grep "continue"
```

---

## 📋 LEVEL 3: LOGIC VALIDATION

### 3.1 Parameter Access
```python
# All parameters accessed via self.params
if r0['close'] >= self.params['price_min']:
    ...

# Not:
if r0['close'] >= price_min:  # ❌ Wrong
```

**Test:**
```python
# Check params dict exists
scanner = ScannerClass("key", "2024-01-01", "2024-01-31")
assert hasattr(scanner, 'params')
assert isinstance(scanner.params, dict)
```

### 3.2 Column Naming
```python
# Stage 1-3: lowercase
df['close'], df['volume'], df['ticker']

# Detection loop: Capitalized (Series access)
r0['Close'], r0['Volume'], r0['Atr']
```

**Test:**
```bash
# Check consistent naming
grep -n "df\['" scanner_file.py | grep -E "[A-Z]"  # Should be lowercase
grep -n "r0\['" scanner_file.py | grep -E "[a-z]"   # Should be Capitalized
```

### 3.3 Return Format
```python
# detect_patterns() must return List[Dict]
return all_results  # Where all_results is List[Dict]

# Not:
return pd.DataFrame(results)  # ❌ Wrong
```

**Test:**
```python
results = scanner.detect_patterns(test_df)
assert isinstance(results, list)
if results:
    assert isinstance(results[0], dict)
```

### 3.4 Date Handling
```python
# Dates stored as datetime in DataFrame
df['date'] = pd.to_datetime(df['date'])

# Comparison with datetime objects
d0_start_dt = pd.to_datetime(self.d0_start_user)
if d0 < d0_start_dt or d0 > d0_end_dt:
    continue
```

**Test:**
```python
# Verify date comparisons work
scanner = ScannerClass("key", "2024-01-01", "2024-01-31")
assert pd.to_datetime(scanner.d0_start_user) == pd.to_datetime("2024-01-01")
```

---

## 📋 LEVEL 4: PERFORMANCE VALIDATION

### 4.1 Speed Test
```python
import time

start = time.time()
scanner = ScannerClass(api_key, "2024-01-01", "2024-01-31")
results = scanner.run_scan()
elapsed = time.time() - start

print(f"Scan completed in {elapsed:.2f} seconds")
# Should be < 60 seconds for 1 month of data
```

**Benchmark:**
- 1 month: < 30 seconds
- 3 months: < 60 seconds
- 1 year: < 120 seconds

### 4.2 Memory Efficiency
```python
# Check for data copies vs views
# Bad: Excessive .copy() calls
# Good: Pre-sliced data passed to workers
```

### 4.3 API Call Efficiency
```python
# Should use grouped endpoint (1 call per day)
# Not individual ticker calls (1 call per ticker per day)
```

**Test:**
```bash
# Count API calls in code
grep -c "polygon.io/aggs/grouped" scanner_file.py  # Should be > 0
grep -c "polygon.io/ticker/" scanner_file.py        # Should be 0
```

---

## 📋 LEVEL 5: OUTPUT VALIDATION

### 5.1 Output Structure
```python
# Each signal should be a dict with:
{
    'ticker': str,
    'date': str (YYYY-MM-DD),
    # ... pattern-specific fields
}
```

**Test:**
```python
results = scanner.run_scan()
if results:
    signal = results[0]
    assert 'ticker' in signal
    assert 'date' in signal
    assert isinstance(signal['ticker'], str)
    assert isinstance(signal['date'], str)
```

### 5.2 Date Range Validation
```python
# All signals should be within D0 range
results = scanner.run_scan()
for signal in results:
    assert scanner.d0_start_user <= signal['date'] <= scanner.d0_end_user
```

### 5.3 Data Quality
```python
# No NaN values in critical fields
for signal in results:
    assert not pd.isna(signal.get('entry_price', 0))
    assert not pd.isna(signal.get('target_price', 0))
```

---

## 🧪 INTEGRATION TEST SCRIPT

### Complete Validation Script

```python
#!/usr/bin/env python3
"""
Complete validation script for V31 scanners
Run this after generating or transforming scanner code
"""

import pandas as pd
import sys
from typing import List, Dict

def validate_scanner(scanner_class, api_key: str) -> bool:
    """Run complete validation on scanner class"""

    print("=" * 60)
    print("V31 SCANNER VALIDATION")
    print("=" * 60)

    all_passed = True

    # Test 1: Instantiation
    print("\n[1/7] Testing instantiation...")
    try:
        scanner = scanner_class(api_key, "2024-01-01", "2024-01-31")
        print("✅ Scanner instantiated successfully")
    except Exception as e:
        print(f"❌ Instantiation failed: {e}")
        return False

    # Test 2: Historical buffer
    print("\n[2/7] Testing historical buffer calculation...")
    if hasattr(scanner, 'scan_start') and hasattr(scanner, 'params'):
        lookback = scanner.params.get('abs_lookback_days', 1000) + 50
        expected_start = (pd.to_datetime("2024-01-01") - pd.Timedelta(days=lookback)).strftime('%Y-%m-%d')
        if scanner.scan_start == expected_start:
            print(f"✅ Historical buffer correct: {scanner.scan_start}")
        else:
            print(f"❌ Historical buffer incorrect")
            print(f"   Expected: {expected_start}")
            print(f"   Got: {scanner.scan_start}")
            all_passed = False
    else:
        print("❌ Missing scan_start or params")
        all_passed = False

    # Test 3: Method existence
    print("\n[3/7] Testing method existence...")
    required_methods = [
        'run_scan',
        'fetch_grouped_data',
        'compute_simple_features',
        'apply_smart_filters',
        'compute_full_features',
        'detect_patterns'
    ]
    for method in required_methods:
        if hasattr(scanner, method):
            print(f"✅ Method exists: {method}")
        else:
            print(f"❌ Missing method: {method}")
            all_passed = False

    # Test 4: Market calendar
    print("\n[4/7] Testing market calendar usage...")
    import inspect
    source = inspect.getsource(scanner.fetch_grouped_data)
    if 'pandas_market_calendars' in source or 'mcal' in source:
        print("✅ Uses pandas_market_calendars")
    else:
        print("❌ Does not use pandas_market_calendars")
        all_passed = False

    # Test 5: Small date range test
    print("\n[5/7] Testing small date range...")
    try:
        scanner_test = scanner_class(api_key, "2024-12-01", "2024-12-31")
        results = scanner_test.run_scan()
        print(f"✅ Test scan completed: {len(results)} results")
    except Exception as e:
        print(f"❌ Test scan failed: {e}")
        all_passed = False

    # Test 6: Output format
    print("\n[6/7] Testing output format...")
    if results:
        if isinstance(results, list):
            print("✅ Returns list")
        else:
            print(f"❌ Wrong return type: {type(results)}")
            all_passed = False

        if results and isinstance(results[0], dict):
            print("✅ Returns list of dicts")
        else:
            print("❌ Wrong element type")
            all_passed = False

        # Check required fields
        required_fields = ['ticker', 'date']
        signal = results[0]
        for field in required_fields:
            if field in signal:
                print(f"✅ Has field: {field}")
            else:
                print(f"❌ Missing field: {field}")
                all_passed = False
    else:
        print("⚠️  No results to validate format")

    # Test 7: Performance
    print("\n[7/7] Testing performance...")
    import time
    start = time.time()
    scanner_perf = scanner_class(api_key, "2024-12-01", "2024-12-15")
    results_perf = scanner_perf.run_scan()
    elapsed = time.time() - start

    if elapsed < 30:
        print(f"✅ Performance good: {elapsed:.2f} seconds")
    else:
        print(f"⚠️  Performance slow: {elapsed:.2f} seconds")

    # Final result
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL VALIDATIONS PASSED")
        print("Scanner is V31 compliant and production-ready")
    else:
        print("❌ SOME VALIDATIONS FAILED")
        print("Please review and fix issues before production use")
    print("=" * 60)

    return all_passed


# Usage
if __name__ == "__main__":
    # Import your scanner class
    from your_scanner_file import YourScannerClass

    # API key (use environment variable in production)
    API_KEY = "your_polygon_api_key"

    # Run validation
    validate_scanner(YourScannerClass, API_KEY)
```

---

## 📋 QUICK VALIDATION CHECKLIST

### Pre-Flight Check (Before Running)

- [ ] File saved with .py extension
- [ ] All imports present
- [ ] API key configured
- [ ] Polygon.io credits available (>100)

### Post-Generation Check (After Custom GPT)

- [ ] Code looks familiar (V31 structure)
- [ ] No obvious copy-paste errors
- [ ] Parameter values make sense
- [ ] Detection logic matches requirements

### Pre-Production Check (Before Live Trading)

- [ ] Validated with test date range
- [ ] Performance acceptable (< 60 seconds)
- [ ] Output format correct
- [ ] No NaN values in results
- [ ] Date boundaries respected

---

## 🚨 COMMON VALIDATION FAILURES

### Failure 1: "No trading days found"
**Cause**: Market calendar not used correctly
**Fix**: Verify `pandas_market_calendars` import and usage

### Failure 2: "Empty results"
**Cause**: Filters too strict or date range too small
**Fix**: Relax parameters or increase date range

### Failure 3: "Performance too slow"
**Cause**: Not using parallel processing or grouped endpoint
**Fix**: Verify ThreadPoolExecutor and grouped endpoint usage

### Failure 4: "Results outside D0 range"
**Cause**: Missing early D0 filtering
**Fix**: Add `if d0 < d0_start_dt or d0 > d0_end_dt: continue`

### Failure 5: "Wrong calculations"
**Cause**: Not using per-ticker operations
**Fix**: Add `.groupby('ticker').transform(lambda x: ...)` wrapper

---

**END OF VALIDATION CHECKLIST**
