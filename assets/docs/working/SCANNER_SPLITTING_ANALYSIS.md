# Scanner Splitting Analysis & Implementation Plan

## Overview
After analyzing the actual scanner files, I now understand the real structure and what needs to be properly split versus what infrastructure must be preserved.

---

## 🔍 **Scanner Structure Analysis**

### **File 1: `lc d2 scan - oct 25 new ideas (3).py`**

**Active Scanners Found:**
```python
df['lc_frontside_d3_extended_1'] = ((complex conditions)).astype(int)
df['lc_frontside_d2_extended'] = ((complex conditions)).astype(int)
df['lc_frontside_d2_extended_1'] = ((complex conditions)).astype(int)
```

**Pattern:** `df['scanner_name'] = (boolean_conditions).astype(int)`

**Commented Scanners:** ~5 additional scanners in comment blocks

### **File 2: `SC DMR SCAN copy.py`**

**Active Scanners Found:**
```python
df['d2_pm_setup_2'] = ((conditions)).astype(int)
df['d2_pmh_break'] = ((conditions)).astype(int)
df['d2_pmh_break_1'] = ((conditions)).astype(int)
df['d2_no_pmh_break'] = ((conditions)).astype(int)
df['d2_extreme_gap'] = ((conditions)).astype(int)
df['d2_extreme_intraday_run'] = ((conditions)).astype(int)
df['d3'] = ((conditions)).astype(int)
df['d3_alt'] = ((conditions)).astype(int)
df['d4'] = ((conditions)).astype(int)
```

---

## 🏗️ **Critical Infrastructure Components**

All split scanners **MUST INCLUDE** these components to function:

### **1. Imports & Setup**
```python
import pandas as pd
import requests
import numpy as np
import pandas_market_calendars as mcal
import aiohttp
import asyncio
# + all other imports
```

### **2. Configuration**
```python
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"
DATE = "2025-01-17"
```

### **3. Core Functions**
- `adjust_daily(df)` - Creates 100+ calculated columns (ATR, EMAs, gaps, etc.)
- `fetch_intraday_data()` - Gets minute-level data
- `get_min_price_lc()` - Calculates min prices for gap calculations
- `filter_lc_rows()` - **THIS CHANGES** - each split needs its own filter
- Data fetching functions
- Volume & liquidity validation functions

### **4. Main Execution Flow**
- Stock universe gathering
- Daily data processing
- Indicator calculations
- Scanner logic execution
- Results formatting and display

---

## 🎯 **What Actually Gets Split**

### **ONLY the Scanner Logic:**
```python
# FROM THIS (multi-scanner):
df['lc_frontside_d3_extended_1'] = ((conditions_1)).astype(int)
df['lc_frontside_d2_extended'] = ((conditions_2)).astype(int)
df['lc_frontside_d2_extended_1'] = ((conditions_3)).astype(int)

# TO THESE (individual scanners):
# File 1: lc_frontside_d3_extended_1.py
df['lc_frontside_d3_extended_1'] = ((conditions_1)).astype(int)

# File 2: lc_frontside_d2_extended.py
df['lc_frontside_d2_extended'] = ((conditions_2)).astype(int)

# File 3: lc_frontside_d2_extended_1.py
df['lc_frontside_d2_extended_1'] = ((conditions_3)).astype(int)
```

### **PLUS the filter function gets updated:**
```python
# FROM:
def filter_lc_rows(df):
    return df[(df['lc_frontside_d3_extended_1'] == 1) | (df['lc_frontside_d2_extended'] == 1) | (df['lc_frontside_d2_extended_1'] == 1)]

# TO (for each split):
def filter_lc_rows(df):
    return df[df['lc_frontside_d3_extended_1'] == 1]  # Only this scanner's condition
```

### **PLUS min price calculations:**
```python
# Each scanner needs its corresponding min price calculation:
df['lc_frontside_d3_extended_1_min_price'] = round((df['c'] + df['d1_range']*.3), 2)
```

---

## 📊 **Parameter Extraction Strategy**

### **From Scanner Logic:**
```python
df['lc_frontside_d3_extended_1'] = ((df['h'] >= df['h1']) &
                    (df['h1'] >= df['h2']) &
                    (df['l'] >= df['l1']) &
                    (df['l1'] >= df['l2']) &

                    (((df['high_pct_chg1'] >= .3) & (df['c_ua'] >= 5) & (df['c_ua'] < 15) & (df['h_dist_to_lowest_low_20_pct']>=2.5)) |
                    ((df['high_pct_chg1'] >= .2) & (df['c_ua'] >= 15) & (df['c_ua'] < 25) & (df['h_dist_to_lowest_low_20_pct']>=2)) |
                    ((df['high_pct_chg1'] >= .1) & (df['c_ua'] >= 25) & (df['c_ua'] < 50) & (df['h_dist_to_lowest_low_20_pct']>=1.5)) |
                    ((df['high_pct_chg1'] >= .07) & (df['c_ua'] >= 50) & (df['c_ua'] < 90) & (df['h_dist_to_lowest_low_20_pct']>=1)) |
                    ((df['high_pct_chg1'] >= .05) & (df['c_ua'] >= 90) & (df['h_dist_to_lowest_low_20_pct']>=0.75)))  &

                    (df['high_chg_atr1'] >= 0.7) &
                    (df['dist_h_9ema_atr1'] >= 1.5) &
                    (df['dist_h_20ema_atr1'] >= 2) &
                    (df['high_chg_atr'] >= 1) &
                    (df['dist_h_9ema_atr'] >= 1.5) &
                    (df['dist_h_20ema_atr'] >= 2) &
                    (df['v_ua'] >= 10000000) &
                    (df['dol_v'] >= 500000000) &
                    (df['v_ua1'] >= 10000000) &
                    (df['dol_v1'] >= 100000000) &
                    (df['c_ua'] >= 5) &
                    (df['h_dist_to_highest_high_20_2_atr']>=2.5) &
                    (df['h'] >= df['highest_high_20']) &
                    (df['ema9'] >= df['ema20']) &
                    (df['ema20'] >= df['ema50'])
                    ).astype(int)
```

**Extractable Parameters:**
- `.3`, `.2`, `.1`, `.07`, `.05` (high_pct_chg1 thresholds)
- `5`, `15`, `25`, `50`, `90` (c_ua price ranges)
- `2.5`, `2`, `1.5`, `1`, `0.75` (distance thresholds)
- `0.7`, `1.5`, `2`, `1` (ATR-based thresholds)
- `10000000`, `500000000`, `100000000`, `5` (volume/dollar thresholds)

---

## 🛠️ **Implementation Plan**

### **Phase 1: Pattern Recognition**
```python
# Improved regex to find scanner assignments:
pattern = r"df\['([^']+)'\]\s*=\s*\((.*?)\)\.astype\(int\)"

# This captures:
# - Scanner name: 'lc_frontside_d3_extended_1'
# - Logic: the entire boolean expression
```

### **Phase 2: Parameter Extraction**
```python
# Extract numeric parameters from scanner logic:
numeric_patterns = [
    r'>=\s*(\d+\.?\d*)',     # >= 0.5, >= 10000000
    r'<\s*(\d+\.?\d*)',      # < 15, < 90
    r'>\s*(\d+\.?\d*)',      # > 0.75
    r'<=\s*(\d+\.?\d*)',     # <= 2.5
    r'\*\s*(\d+\.?\d*)',     # * 0.3, * 1.5
    r'/\s*(\d+\.?\d*)',      # / 2.0
]

# Parameter categorization:
categories = {
    'high_pct_chg': 'momentum',
    'c_ua': 'price_range',
    'atr': 'volatility',
    'dist_': 'technical',
    'v_ua': 'volume',
    'dol_v': 'liquidity'
}
```

### **Phase 3: Code Generation**
```python
def generate_individual_scanner(scanner_name, scanner_logic, parameters, full_infrastructure):
    """
    Generate a complete, runnable scanner file

    Returns:
    - Full Python file with all infrastructure
    - Only the target scanner logic
    - Updated filter function
    - Corresponding min price calculation
    """

    template = f"""
{all_imports}

{configuration}

{adjust_daily_function}
{other_infrastructure_functions}

def check_high_lvl_filter_lc(df):
    # SINGLE SCANNER LOGIC ONLY
    {scanner_logic}

def filter_lc_rows(df):
    # UPDATED FOR SINGLE SCANNER
    return df[df['{scanner_name}'] == 1]

def get_min_price_lc(df):
    # SCANNER-SPECIFIC MIN PRICE
    df['{scanner_name}_min_price'] = round((df['c'] + df['d1_range']*{min_price_multiplier}), 2)

{main_execution_flow}
"""
```

### **Phase 4: Quality Validation**
- Verify each split scanner runs independently
- Confirm all parameters are correctly extracted
- Test with sample data to ensure identical results to original
- Validate file size calculations are accurate

---

## ✅ **Expected Results After Fix**

### **Scanner 1: lc_frontside_d3_extended_1**
- **Parameters:** ~20 parameters (price thresholds, ATR values, volume requirements)
- **File Size:** ~30KB (full infrastructure + single scanner logic)
- **Code:** Complete runnable Python file

### **Scanner 2: lc_frontside_d2_extended**
- **Parameters:** ~15 parameters
- **File Size:** ~25KB
- **Code:** Complete runnable Python file

### **Scanner 3: lc_frontside_d2_extended_1**
- **Parameters:** ~18 parameters
- **File Size:** ~28KB
- **Code:** Complete runnable Python file

---

## 🚨 **Key Differences from Previous Approach**

### **❌ WRONG (What I was doing):**
- Looking for `def function_name():` patterns
- Creating template/fake code
- Generating generic parameters
- Missing the infrastructure components

### **✅ RIGHT (What needs to happen):**
- Extract `df['scanner_name'] = (logic).astype(int)` patterns
- Include ALL infrastructure code in each split
- Extract real parameters from actual boolean conditions
- Update filter functions for single scanner
- Preserve full execution capability

---

## 🔧 **Implementation Priority**

1. **Fix pattern recognition** to find `df['name'] = (logic).astype(int)`
2. **Extract real parameters** from boolean expressions
3. **Generate complete runnable files** with full infrastructure
4. **Test with actual scanner files** to verify functionality
5. **Validate parameter extraction accuracy**

This approach will create truly functional individual scanners instead of template fragments.