# LC D2 Multi-Scanner Transformation

## Overview
**Scanner Type:** LC D2 Multi-Scanner (12 Pattern Variations)
**Source:** `/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py` (1300+ lines)
**Formatted:** `UltraFastRenataLCD2MultiScanner` (850+ lines)
**Date:** 2025-12-26

---

## Edge.dev Standardizations Applied

### ✅ 1. Type-Specific Class Naming
- **Before:** Script-based (no class structure)
- **After:** `UltraFastRenataLCD2MultiScanner` (multi-scanner type)

### ✅ 2. 3-Stage Architecture
Stage 1: Market Universe Optimization (Polygon snapshot endpoint + smart filtering)
Stage 2: Multi-Scanner Pattern Detection (12 patterns checked simultaneously)
Stage 3: Results Analysis and Display

### ✅ 3. Ultra-Optimized Threading
- Stage 1: Up to 128 workers (fetching snapshot data in parallel)
- Stage 2: Up to 96 workers (scanning symbols in parallel)
- Batch size: 200

### ✅ 4. Session Pooling with HTTPAdapter
- Connection pooling with 100 max connections
- Reduced latency and automatic retry logic

### ✅ 5. Multi-Scanner Architecture
**Original Code Structure:**
- 12 separate boolean columns (lc_frontside_d3_extended_1, lc_backside_d3_extended_1, etc.)
- Binary output (0 or 1 for each scanner)
- Exported separate CSVs per scanner + combined

**Formatted Structure:**
- 12 scanner patterns with individual + mass parameter control
- Single Scanner_Label column output
- Combined output: Ticker, Date, Scanner_Label (3 columns)

### ✅ 6. Mass Parameter Control System
**Applied to ALL 12 scanner patterns:**
```python
mass_params = {
    "min_close_price": 5.0,              # Minimum close price (LC uses higher prices)
    "min_volume": 10000000,               # Minimum volume (10M)
    "min_dollar_volume": 500000000,       # Minimum dollar volume (500M)
    "bullish_close": True,                # Close >= Open (current)
    "prev_bullish_close": True,           # Close >= Open (previous)
    "ema_trend_aligned": True,            # EMA9 >= EMA20 >= EMA50
}
```

**Renata AI Commands:**
- "Increase min price from $5 to $10 across all scanners"
- "Increase min dollar volume from 500M to 1B across all scanners"
- "Disable bullish close requirement globally"
- "Disable EMA trend alignment filter globally"

### ✅ 7. Individual Scanner Parameter System
**Each scanner has unique parameters:**
- LC_Frontside_D3_Extended_1: high_chg_atr_min, dist_h_9ema_atr_min, etc.
- LC_Backside_D3_Extended_1: Same structure but different logic
- LC_FBO: Specialized parameters (close_range_min, min_close_ua for large caps)
- LC_Frontside_D2_Uptrend: Lower ATR threshold (0.75 vs 1.5)

**Renata AI Commands:**
- "Change LC_Frontside_D2 high_chg_atr_min from 1.5 to 2.0"
- "Disable LC_Backside_D2 scanner pattern"
- "Adjust LC_FBO min_close_ua from 2B to 5B"
- "Increase LC_Frontside_D3_Extended_1 dist_h_9ema_atr_min from 1.5 to 2.0"

### ✅ 8. Output Format Transformation
**Before (Binary Columns):**
```csv
ticker, date, lc_frontside_d3_extended_1, lc_backside_d3_extended_1, lc_fbo, ...
AAPL, 2024-12-20, 1, 0, 0, ...
MSFT, 2024-12-20, 0, 1, 0, ...
```

**After (Scanner_Label Column):**
```csv
Ticker, Date, Scanner_Label
AAPL, 2024-12-20, LC_Frontside_D3_Extended_1
AAPL, 2024-12-20, LC_Backside_D3
MSFT, 2024-12-20, LC_Backside_D3_Extended_1
MSFT, 2024-12-20, LC_Frontside_D2
```

### ✅ 9. D0 Date Range: 2024-2025
- Signal range: 2024-01-01 to 2025-10-24
- Historical range: 2023-05-15 (220-day buffer for EMA200 calculations)

### ✅ 10. 12 Scanner Patterns Preserved
All original patterns with exact logic:
1. **LC_Frontside_D3_Extended_1** - D3 frontside with consecutive highs/lows
2. **LC_Backside_D3_Extended_1** - D3 backside extended pattern
3. **LC_Frontside_D3_Extended_2** - D3 frontside variant 2
4. **LC_Backside_D3_Extended_2** - D3 backside variant 2
5. **LC_Frontside_D4_Para** - D4 frontside parabolic pattern
6. **LC_Backside_D4_Para** - D4 backside parabolic pattern
7. **LC_Frontside_D3_Uptrend** - D3 frontside uptrend pattern
8. **LC_Backside_D3** - D3 backside standard pattern
9. **LC_Frontside_D2_Uptrend** - D2 frontside uptrend (lower ATR)
10. **LC_Frontside_D2** - D2 frontside standard
11. **LC_Backside_D2** - D2 backside standard
12. **LC_FBO** - First Breakout (large cap focused)

---

## Key Features

**Multi-Scanner Architecture** - 12 patterns in single execution
**Mass Parameter Control** - Apply changes to all scanners at once
**Individual Parameters** - Fine-tune each scanner independently
**Polygon Snapshot Endpoint** - Fetches current tickers with smart filtering
**Individual Symbol Fetching** - Per-symbol historical data in Stage 2
**ATR-Based Calculations** - 14-period ATR for normalized measurements
**EMA Distance Features** - 9/20/50/200 EMA distance tracking
**Scanner_Label Output** - Clean 3-column format (Ticker, Date, Scanner_Label)

---

## Pattern Descriptions

### D3 Patterns (Frontside/Backside)
**Frontside:** Consecutive highs (h >= h1 >= h2) + consecutive lows
**Backside:** Similar logic with backside-specific criteria
**Extended:** Higher ATR thresholds (1.0 current, 0.7 previous)
**Uptrend:** Requires strong EMA alignment

### D4 Parabolic Patterns
3-day consecutive pattern with parabolic scoring:
- Consecutive highs (3 days)
- EMA trend alignment
- ATR-based distance thresholds

### D2 Patterns
**Frontside:** Standard high change ATR (1.5)
**Uptrend:** Lower ATR threshold (0.75) for uptrending stocks
**Backside:** Similar to frontside with backside logic

### LC_FBO (First Breakout)
Large cap breakout pattern:
- Minimum close: 2B+ (filters for large caps only)
- Close range >= 0.3 (strong close in upper candle)
- Distance to lowest low: 4 ATR (20-period) or 2 ATR (5-period)
- Near highest high 50 (within 1 ATR)
- Previous 3 highs below highest high 50

---

## Technical Feature Engineering

### ATR (Average True Range)
- 14-period rolling window
- Used for normalized distance measurements
- Calculated from: max(high-low, high-pdc, low-pdc)

### EMA Distances
**EMAs:** 9, 20, 50, 200 period
**Distance Calculation:** (high - EMA) / ATR
**Purpose:** Normalized measurement of price extension

### Gap Features
- gap_atr: (open - pdc) / ATR
- gap_atr1: Previous gap (in ATR)
- gap_pdh_atr: Gap from previous day high

### High Change Features
- high_chg_atr: (high - open) / ATR
- high_chg_atr1: Previous high change (in ATR)
- high_chg_from_pdc_atr: (high - previous close) / ATR

### Highest/Lowest Features
- Periods: 5, 20, 50, 100
- Distance calculations (in ATR and percentage)
- Used for breakout and consolidation detection

---

## Validation Checklist

- [x] Class name is type-specific (UltraFastRenataLCD2MultiScanner)
- [x] Has execute_stage1_ultra_fast method
- [x] Has execute_stage2_ultra_fast method
- [x] Has execute_stage3_results_ultra_fast method
- [x] Mass parameter system (shared across all scanners)
- [x] Individual scanner parameters (unique per pattern)
- [x] Scanner_Label output (not binary columns)
- [x] 3-column output format (Ticker, Date, Scanner_Label)
- [x] All 12 patterns preserved with exact logic
- [x] Polygon snapshot endpoint integration
- [x] Individual symbol historical fetching
- [x] Ultra-optimized threading
- [x] Session pooling with HTTPAdapter
- [x] ATR-based calculations
- [x] EMA distance features

---

## Files Created

1. **formatted.py** - Main formatted multi-scanner (850+ lines)
2. **params.json** - All parameters documented (mass + individual)
3. **transformation.md** - This file
4. **source.py** - Original code copy

---

## Scanner Location

```
/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_d2/formatted.py
```

---

## Renata AI Integration Examples

### Mass Parameter Commands:
```
User: "Increase min price from $5 to $10 across all scanners"
Action: Update mass_params['min_close_price'] = 10.0

User: "Increase min dollar volume from 500M to 1B"
Action: Update mass_params['min_dollar_volume'] = 1000000000

User: "Disable bullish close requirement"
Action: Update mass_params['bullish_close'] = False

User: "Disable EMA trend alignment filter globally"
Action: Update mass_params['ema_trend_aligned'] = False
```

### Individual Parameter Commands:
```
User: "Change LC_Frontside_D2 high_chg_atr_min from 1.5 to 2.0"
Action: Update scanner_params['LC_Frontside_D2']['high_chg_atr_min'] = 2.0

User: "Disable LC_Backside_D2 scanner pattern"
Action: Update scanner_params['LC_Backside_D2']['enabled'] = False

User: "Adjust LC_FBO min_close_ua from 2B to 5B"
Action: Update scanner_params['LC_FBO']['min_close_ua'] = 5000000000

User: "Increase LC_Frontside_D3_Extended_1 dist_h_9ema_atr_min from 1.5 to 2.0"
Action: Update scanner_params['LC_Frontside_D3_Extended_1']['dist_h_9ema_atr_min'] = 2.0
```

---

## Output Example

**Input:** LC D2 scan - oct 25 new ideas.py (binary columns)
**Output:** lc_d2_results.csv (Scanner_Label format)

```csv
Ticker, Date, Scanner_Label
AAPL, 2024-12-20, LC_Frontside_D3_Extended_1
AAPL, 2024-12-20, LC_Backside_D3
MSFT, 2024-12-20, LC_Frontside_D2
TSLA, 2024-12-19, LC_Frontside_D2_Uptrend
NVDA, 2024-12-19, LC_FBO
GOOGL, 2024-12-19, LC_Frontside_D4_Para
AMZN, 2024-12-18, LC_Backside_D3_Extended_2
META, 2024-12-18, LC_Frontside_D3_Uptrend
```

---

## Key Differences from SC DMR

| Feature | SC DMR | LC D2 |
|---------|--------|------|
| Min Price | $0.75 | $5.00 |
| Min Dollar Volume | $500M | $500M |
| Number of Patterns | 10 | 12 |
| ATR Period | Not used | 14-period |
| EMA Features | Basic | 9/20/50/200 with distances |
| Special Pattern | None | LC_FBO (large cap breakout) |
| Buffer Days | 20 | 220 (for EMA200) |

---

**Transformation Status:** ✅ COMPLETE
**Multi-Scanner Format:** Ticker, Date, Scanner_Label (3 columns)
**Mass Parameter Control:** ✅ Implemented
**Individual Parameter Control:** ✅ Implemented
**Renata AI Ready:** ✅ Yes
**Ready for:** Template library inclusion, AI learning, multi-scanner execution
