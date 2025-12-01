# Parameter Detection Discrepancy Investigation Report

## Problem Summary

Critical discrepancy between split → format workflow parameter detection:
- **Splitter**: Claims "59 parameters found"
- **Formatter**: Shows "0 configurable parameters"
- **Expected**: 20+ configurable trading parameters (threshold values, multipliers, etc.)

## Root Cause Analysis

### 1. **Parameter Type Confusion**

The issue stems from different parameter detection logic between the **parameter detection phase** and the **configurable parameter filtering phase**.

#### Detection Phase (Lines 3390-3414 in main.py)
- **Finds 59 parameters** using broad pattern matching:
  ```python
  # Finds ANY numeric assignments
  condition_values = re.findall(r'(\w+)\s*[><=]+\s*(\d+\.?\d*)', code)
  assignments = re.findall(r'(\w+)\s*=\s*(\d+\.?\d*)', code)
  ```
- **Includes infrastructure values**: line numbers, array indices, API constants
- **No trading logic filtering**: treats all numeric values equally

#### Filtering Phase (Lines 3393-3414)
- **Applies strict keyword filtering**:
  ```python
  if any(keyword in var_lower for keyword in ['gap', 'volume', 'price', 'atr', 'pct', 'min', 'max', 'threshold']):
  ```
- **Rejects 59/59 parameters**: most detected values don't match trading keywords
- **Results in 0 configurable parameters**

### 2. **Missing Trading Logic Context**

#### What's Being Detected (59 parameters):
- Date strings: `'2025-01-01'`, `'2025-01-31'`
- Window sizes: `14`, `20`, `50`, `250` (for rolling calculations)
- Array indices: `1`, `2`, `3` (for `h1`, `h2`, `h3`)
- API constants: `600000` (timeout), port numbers
- Infrastructure values: `min_periods=1`, `span=9`

#### What Should Be Detected (20+ trading parameters):
From the scanner examples:
- **LC D2 Scanner**:
  - `high_pct_chg1 >= .5` → `0.5` threshold
  - `gap_pct >= .15` → `0.15` threshold
  - `v_ua1 >= 10000000` → `10000000` volume filter
  - `dol_v1 >= 500000000` → `500000000` dollar volume
  - `close_range1 >= .6` → `0.6` range filter
  - `high_chg_atr1 >= 2` → `2.0` ATR multiplier

- **A+ Scanner**:
  - `atr_mult: 4` → ATR multiplier
  - `vol_mult: 2.0` → Volume multiplier
  - `slope3d_min: 10` → Slope threshold
  - `high_ema9_mult: 4` → EMA multiplier
  - `prev_close_min: 10.0` → Price filter

### 3. **Trading Logic Recognition Failure**

#### Problem: Regex Pattern Mismatch
Current patterns don't match actual trading code structure:

```python
# Current pattern (misses trading logic)
r'(\w+)\s*[><=]+\s*(\d+\.?\d*)'

# Actual LC D2 trading code
((df['high_pct_chg1'] >= .5) & (df['c_ua1'] >= 5) & (df['c_ua1'] < 15))
```

#### Missing Pattern Recognition:
- **DataFrame column conditions**: `df['column'] >= value`
- **Multi-condition filters**: complex boolean logic
- **Function parameter defaults**: `custom_params = {'atr_mult': 4}`
- **Nested trading conditions**: parenthesized logic groups

### 4. **Scanner Type Detection Issues**

#### False Scanner Detection:
The algorithm incorrectly identifies **infrastructure functions** as scanners:
- `adjust_daily()` → Data preprocessing (not a scanner)
- `compute_indicators1()` → Technical indicator calculation (not a scanner)
- `fetch_intraday_data()` → Data fetching (not a scanner)

#### Real Scanner Functions Missed:
- `check_high_lvl_filter_lc()` → **Actual LC trading scanner**
- `scan_daily_para()` → **Actual A+ trading scanner**

## Specific Code Examples

### LC D2 Scanner - Real Trading Parameters
```python
df['lc_frontside_d3_extended_1'] = ((df['h'] >= df['h1']) &
                    (df['h1'] >= df['h2']) &
                    (df['high_chg_atr1'] >= 0.7) &  # ← TRADING PARAMETER
                    (df['c1'] >= df['o1']) &
                    (df['dist_h_9ema_atr1'] >= 1.5) &  # ← TRADING PARAMETER
                    (df['dist_h_20ema_atr1'] >= 2) &   # ← TRADING PARAMETER
                    (df['v_ua'] >= 10000000) &         # ← TRADING PARAMETER
                    (df['dol_v'] >= 500000000) &       # ← TRADING PARAMETER
                    (df['c_ua'] >= 5))                 # ← TRADING PARAMETER
```

### A+ Scanner - Real Trading Parameters
```python
custom_params = {
    'atr_mult': 4,                    # ← TRADING PARAMETER
    'vol_mult': 2.0,                  # ← TRADING PARAMETER
    'slope3d_min': 10,                # ← TRADING PARAMETER
    'slope5d_min': 20,                # ← TRADING PARAMETER
    'high_ema9_mult': 4,              # ← TRADING PARAMETER
    'gap_div_atr_min': 0.5,           # ← TRADING PARAMETER
    'prev_close_min': 10.0,           # ← TRADING PARAMETER
}
```

## Required Fix Implementation

### 1. Enhanced Pattern Recognition
```python
# Add DataFrame column condition patterns
df_condition_patterns = [
    r"df\[['\"]([\w_]+)['\"]]\s*[><=]+\s*(\d+\.?\d*)",
    r"(\w+)\s*>=\s*(\d+\.?\d*)",  # Direct comparisons
]

# Add parameter dictionary patterns
param_dict_patterns = [
    r"['\"](\w+)['\"]\s*:\s*(\d+\.?\d*)",  # Dictionary parameters
]
```

### 2. Trading Logic Context Analysis
```python
def is_trading_parameter(var_name: str, context: str) -> bool:
    """Determine if a parameter is actually used in trading logic"""
    trading_keywords = [
        'atr', 'ema', 'gap', 'volume', 'vol', 'price', 'close', 'high', 'low',
        'mult', 'min', 'max', 'threshold', 'pct', 'chg', 'range', 'slope'
    ]

    # Check if variable name contains trading terms
    var_lower = var_name.lower()
    for keyword in trading_keywords:
        if keyword in var_lower:
            return True

    # Check context (nearby code)
    if any(term in context.lower() for term in ['filter', 'condition', 'scan', 'threshold']):
        return True

    return False
```

### 3. Scanner Function Identification
```python
def identify_real_scanners(code: str) -> List[str]:
    """Find actual trading scanner functions (not infrastructure)"""
    scanner_patterns = [
        r'def\s+(\w*scan\w*)\(',      # Functions with 'scan' in name
        r'def\s+(\w*filter\w*)\(',    # Functions with 'filter' in name
        r'def\s+(\w*check\w*)\(',     # Functions with 'check' in name
    ]

    # Exclude infrastructure functions
    exclude_patterns = [
        'fetch', 'adjust', 'compute', 'calculate', 'process', 'format'
    ]

    scanner_functions = []
    for pattern in scanner_patterns:
        matches = re.findall(pattern, code, re.IGNORECASE)
        for match in matches:
            if not any(exclude in match.lower() for exclude in exclude_patterns):
                scanner_functions.append(match)

    return scanner_functions
```

## Expected Resolution

After implementing the fix:

### Before Fix:
- **Detection**: 59 parameters found (mostly infrastructure)
- **Configurable**: 0 parameters (all filtered out)
- **User Experience**: Broken workflow, no customization

### After Fix:
- **Detection**: 20-30 trading parameters found
- **Configurable**: 15-25 real trading parameters
- **User Experience**: Working parameter customization

### Trading Parameters Should Include:
1. **Threshold Values**: gap percentages, volume minimums, price filters
2. **Multipliers**: ATR multipliers, volume ratios, slope minimums
3. **Range Filters**: close range requirements, percentage change limits
4. **Technical Indicators**: EMA distances, slope thresholds

## Verification Steps

1. **Test with LC D2 Scanner**: Should find 15-20 configurable parameters
2. **Test with A+ Scanner**: Should find 10-15 configurable parameters
3. **Verify Parameter Types**: Ensure all detected parameters are trading-relevant
4. **Check Scanner Detection**: Confirm real scanner functions are identified

## Impact Assessment

**Critical Priority**: This bug completely breaks the split → format workflow, making parameter customization impossible. Users cannot modify scanner behavior, defeating the core purpose of the uploaded scanner system.

**Business Impact**: Major feature non-functional, poor user experience, development workflow blocked.

**Technical Debt**: Core parameter extraction logic needs enhancement to handle real-world trading scanner patterns.