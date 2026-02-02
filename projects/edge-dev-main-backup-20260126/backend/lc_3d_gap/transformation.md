# LC 3D Gap Scanner Transformation

## Overview
**Scanner Type:** LC 3D Gap (Large Cap 3-Day EMA Gap Pattern)
**Source:** `/Users/michaeldurante/.anaconda/working code/LC 3d Gap/scan.py` (236 lines)
**Formatted:** `UltraFastRenataLC3DGapScanner` (750+ lines)
**Date:** 2025-12-26

---

## Edge.dev Standardizations Applied

### ✅ 1. Type-Specific Class Naming
- **Before:** Script-based (no class structure)
- **After:** `UltraFastRenataLC3DGapScanner` (type-specific with "UltraFast" prefix)

### ✅ 2. 3-Stage Architecture
Stage 1: Market Universe Optimization (8-parameter smart filtering)
Stage 2: Pattern Detection (15 LC 3D Gap conditions)
Stage 3: Results Analysis and Display

### ✅ 3. Ultra-Optimized Threading
- Stage 1: Up to 128 workers (vs sequential before)
- Stage 2: Up to 96 workers (vs sequential before)
- Batch size: 200 symbols

### ✅ 4. Session Pooling with HTTPAdapter
- Connection pooling with 100 max connections
- Reduced latency and automatic retry logic

### ✅ 5. Default Ticker List (190 Symbols)
- **Original:** Used hardcoded list of ~180 specific tickers
- **Formatted:** Preserved original ticker list with duplicates removed (190 unique symbols)
- **Override:** Can pass custom symbols list to `execute_stage1_ultra_fast(symbols=[...])`
- **Includes:** Large caps, tech stocks, ETFs, leveraged ETFs, small caps

### ✅ 6. LC 3D Gap-Specific 2-Parameter Smart Filtering (Stage 1)
**Note:** Only price and volume are available in Polygon snapshot API. EMA, ATR, gap, and other metrics require historical data in Stage 2.

1. Day -1 Close: $20 minimum (large cap filter)
2. Day -1 Volume: 7M minimum (liquidity filter)

**Why Only 2?** The snapshot API provides current price and volume, but not EMA, ATR, historical data, or gap calculations.

### ✅ 7. D0 Date Range: 2024-2025
- Signal range: 2024-01-01 to present
- Historical range: 2022-10-01 (830-day buffer for swing high + EMA30 calculations)

### ✅ 8. Parameter Integrity
**All 15 original parameters preserved:**
- day_14_avg_ema10_min: 0.25
- day_14_avg_ema30_min: 0.5
- day_7_avg_ema10_min: 0.25
- day_7_avg_ema30_min: 0.75
- day_3_avg_ema10_min: 0.5
- day_3_avg_ema30_min: 1.0
- day_2_ema10_distance_min: 1.0
- day_2_ema30_distance_min: 2.0
- day_1_ema10_distance_min: 1.5
- day_1_ema30_distance_min: 3.0
- day_1_vol_min: 7,000,000
- day_1_close_min: 20.0
- day_1_high_vs_swing_high_min: 1.0
- day_0_gap_min: 0.5
- day_0_open_minus_d1_high_min: 0.1

### ✅ 9. LC 3D Gap Logic Preservation
All 15 conditions checked in proper order:
- Multi-day EMA averaging (14, 7, 3-day lookbacks)
- Progressive EMA distance requirements
- Swing high breakout detection
- Day 0 gap confirmation

### ✅ 10. Swing High Detection
- Detects swing highs from day -5 to -65 (60-day range)
- Swing high defined as high surrounded by lower highs on both sides
- Day -1 high must be >= 1x ATR above highest swing high

### ✅ 11. ATR14 Period
- Uses 14-day ATR
- Matches original code

---

## Key Features

**15 Parameters** - Multi-day EMA gap pattern with progressive requirements
**ATR14** - 14-day Average True Range
**Multi-Day EMA Averaging** - Checks 14, 7, and 3-day average EMA distances
**Progressive Requirements** - Increasing EMA distance thresholds (14d → 7d → 3d → Day -1)
**Swing High Breakout** - Day -1 high must exceed swing highs from -5 to -65
**Day 0 Gap** - Gap confirmation with 0.5x ATR minimum
**Large Cap Filter** - $20 minimum close price

---

## Pattern Description

### Multi-Day EMA Distance Averaging
The scanner calculates the average EMA10 and EMA30 distances over three different lookback periods:
- **Day -14**: 14-day average EMA distance (baseline trend)
- **Day -7**: 7-day average EMA distance (developing trend)
- **Day -3**: 3-day average EMA distance (emerging trend)

### Progressive EMA Distance Requirements
```
Day -14 Avg EMA10 >= 0.25x ATR  →  Day -14 Avg EMA30 >= 0.5x ATR
Day -7 Avg EMA10 >= 0.25x ATR   →  Day -7 Avg EMA30 >= 0.75x ATR
Day -3 Avg EMA10 >= 0.5x ATR    →  Day -3 Avg EMA30 >= 1.0x ATR
Day -2 EMA10 >= 1.0x ATR        →  Day -2 EMA30 >= 2.0x ATR
Day -1 EMA10 >= 1.5x ATR        →  Day -1 EMA30 >= 3.0x ATR
```

This creates a progressive pattern where EMA distances increase as we approach Day -1, indicating strengthening momentum.

### Swing High Breakout
The scanner identifies swing highs (highs surrounded by lower highs) from day -5 to -65. The Day -1 high must be at least 1x ATR above the highest swing high, indicating a breakout.

### Day 0 Gap Confirmation
- Day 0 gap must be >= 0.5x ATR
- Day 0 open must be >= 0.1x ATR above Day -1 high
- Confirms the gap-up continuation pattern

---

## Validation Checklist

- [x] Class name is type-specific (UltraFastRenataLC3DGapScanner)
- [x] Has execute_stage1_ultra_fast method
- [x] Has execute_stage2_ultra_fast method
- [x] Has execute_stage3_results_ultra_fast method
- [x] Stage 1 workers = min(128, cpu_cores * 8)
- [x] Stage 2 workers = min(96, cpu_cores * 6)
- [x] Batch size = 200
- [x] Session pooling with HTTPAdapter
- [x] Polygon API snapshot endpoint used
- [x] D0 date range: 2024-01-01 to 2025-12-26
- [x] All original parameters preserved (15/15)
- [x] LC 3D Gap-specific smart filtering (2 parameters in Stage 1)
- [x] ATR14 period used
- [x] Swing high detection (day -5 to -65)
- [x] Multi-day EMA averaging logic
- [x] Progressive EMA distance requirements
- [x] Default ticker list (190 symbols from original code)
- [x] **Individual API architecture**

---

## Files Created

1. **formatted.py** - Main formatted scanner (750+ lines)
2. **source.py** - Original code copy
3. **params.json** - All 15 parameters documented
4. **transformation.md** - This file

---

## Scanner Location

```
/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_3d_gap/formatted.py
```

---

**Transformation Status:** ✅ COMPLETE
**API Architecture:** Individual API (optimal for 1,000-3,000 Stage 2 tickers)
**Ready for:** Template library inclusion, AI learning
