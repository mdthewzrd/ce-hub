# SC DMR Multi-Scanner Transformation

## Overview
**Scanner Type:** SC DMR Multi-Scanner (10 Pattern Variations)
**Source:** `/Users/michaeldurante/.anaconda/SC Stuff/SC DMR SCAN.py` (600 lines)
**Formatted:** `UltraFastRenataSCDMRMultiScanner` (850+ lines)
**Date:** 2025-12-26

---

## Edge.dev Standardizations Applied

### ✅ 1. Type-Specific Class Naming
- **Before:** Script-based (no class structure)
- **After:** `UltraFastRenataSCDMRMultiScanner` (multi-scanner type)

### ✅ 2. 3-Stage Architecture
Stage 1: Market Universe Optimization (Polygon grouped endpoint - ALL stocks)
Stage 2: Multi-Scanner Pattern Detection (10 patterns checked simultaneously)
Stage 3: Results Analysis and Display

### ✅ 3. Ultra-Optimized Threading
- Stage 1: Up to 128 workers (fetching trading days in parallel)
- Stage 2: Vectorized pattern detection (pandas apply for speed)
- Batch size: 200 (not applicable for grouped endpoint)

### ✅ 4. Session Pooling with HTTPAdapter
- Connection pooling with 100 max connections
- Reduced latency and automatic retry logic

### ✅ 5. Multi-Scanner Architecture
**Original Code Structure:**
- 10 separate boolean columns (d2_pm_setup, d2_pmh_break, etc.)
- Binary output (0 or 1 for each scanner)
- Exported separate CSVs per scanner + combined

**Formatted Structure:**
- 10 scanner patterns with individual + mass parameter control
- Single Scanner_Label column output
- Combined output: Ticker, Date, Scanner_Label (3 columns)

### ✅ 6. Mass Parameter Control System
**Applied to ALL 10 scanner patterns:**
```python
mass_params = {
    "prev_close_min": 0.75,           # Minimum close price
    "prev_volume_min": 10000000,      # Minimum volume (10M)
    "prev_close_bullish": True,       # Close >= Open
    "valid_trig_high_enabled": True,  # 10-period high validation
}
```

**Renata AI Commands:**
- "Increase min price from $0.75 to $5 across all scanners"
- "Increase min volume from 10M to 20M across all scanners"
- "Disable bullish close requirement globally"

### ✅ 7. Individual Scanner Parameter System
**Each scanner has unique parameters:**
- D2_PM_Setup: prev_high_gain_min, pmh_gap_range_mult, etc.
- D2_PMH_Break: prev_gap_min, opening_range_min, etc.
- D3: prev_gap_2_min for 2-day consecutive gaps
- D4: prev_high_3_gain_min for 3-day pattern

**Renata AI Commands:**
- "Change D2_PMH_Break gap threshold from 0.2 to 0.3"
- "Disable D2_No_PMH_Break scanner"
- "Adjust D3 gap range multiplier from 0.3 to 0.5"

### ✅ 8. Output Format Transformation
**Before (Binary Columns):**
```csv
ticker, date, d2_pm_setup, d2_pmh_break, d3, d4, ...
AAPL, 2024-12-20, 1, 1, 0, 0, ...
MSFT, 2024-12-20, 0, 1, 1, 0, ...
```

**After (Scanner_Label Column):**
```csv
Ticker, Date, Scanner_Label
AAPL, 2024-12-20, D2_PM_Setup
AAPL, 2024-12-20, D2_PMH_Break
MSFT, 2024-12-20, D2_PMH_Break
MSFT, 2024-12-20, D3
```

### ✅ 9. D0 Date Range: 2024-2025
- Signal range: 2024-01-01 to 2025-10-24
- Historical range: 2023-10-01 (10+ day buffer for prev_high_10 calculations)

### ✅ 10. 10 Scanner Patterns Preserved
All original patterns with exact logic:
1. **D2_PM_Setup** - 4 variants combined with OR logic
2. **D2_PM_Setup_2** - Stricter variant (100% gain requirement)
3. **D2_PMH_Break** - PMH break with gap >= 0.2
4. **D2_PMH_Break_1** - PMH break with gap < 0.2
5. **D2_No_PMH_Break** - High < PMH
6. **D2_Extreme_Gap** - Gap >= 1x range
7. **D2_Extreme_Intraday_Run** - Intraday run >= 1x range
8. **D3** - 2-day consecutive gaps
9. **D3_Alt** - 2-day consecutive highs
10. **D4** - 3-day consecutive pattern

---

## Key Features

**Multi-Scanner Architecture** - 10 patterns in single execution
**Mass Parameter Control** - Apply changes to all scanners at once
**Individual Parameters** - Fine-tune each scanner independently
**Polygon Grouped Endpoint** - Fetches ALL stocks (no ticker list needed)
**Vectorized Pattern Detection** - Pandas apply for speed
**Scanner_Label Output** - Clean 3-column format (Ticker, Date, Scanner_Label)

---

## Pattern Descriptions

### D2_PM_Setup (4 Variants)
**Variant 1:** Extreme gain (100%) + PMH gap
**Variant 2:** 20% gain + 2-day gap + range expansion
**Variant 3:** 2-day consecutive highs + range expansion
**Variant 4:** 3-day consecutive pattern + multi-day volume

### D2_PMH_Break vs D2_PMH_Break_1
- **Break:** Gap >= 20% (strong gap)
- **Break_1:** Gap < 20% (moderate gap)

### D2 Extreme Patterns
- **Extreme_Gap:** Gap >= 1x previous range
- **Extreme_Intraday_Run:** Intraday run >= 1x range

### D3 vs D3_Alt
- **D3:** 2-day consecutive gaps (20% each)
- **D3_Alt:** 2-day consecutive highs with 50% larger gap

### D4
3-day consecutive progressive pattern:
- Consecutive highs (3 days)
- Consecutive bullish closes (3 days)
- Consecutive higher highs
- Multi-day volume (3 days)

---

## Validation Checklist

- [x] Class name is type-specific (UltraFastRenataSCDMRMultiScanner)
- [x] Has execute_stage1_ultra_fast method
- [x] Has execute_stage2_ultra_fast method
- [x] Has execute_stage3_results_ultra_fast method
- [x] Mass parameter system (shared across all scanners)
- [x] Individual scanner parameters (unique per pattern)
- [x] Scanner_Label output (not binary columns)
- [x] 3-column output format (Ticker, Date, Scanner_Label)
- [x] All 10 patterns preserved with exact logic
- [x] Polygon grouped endpoint integration
- [x] Ultra-optimized threading
- [x] Session pooling with HTTPAdapter

---

## Files Created

1. **formatted.py** - Main formatted multi-scanner (850+ lines)
2. **params.json** - All parameters documented (mass + individual)
3. **transformation.md** - This file
4. **source.py** - Original code copy (to be added)

---

## Scanner Location

```
/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/sc_dmr/formatted.py
```

---

## Renata AI Integration Examples

### Mass Parameter Commands:
```
User: "Increase min price from $0.75 to $5 across all scanners"
Action: Update mass_params['prev_close_min'] = 5.0

User: "Increase min volume from 10M to 20M"
Action: Update mass_params['prev_volume_min'] = 20000000

User: "Disable bullish close requirement"
Action: Update mass_params['prev_close_bullish'] = False
```

### Individual Parameter Commands:
```
User: "Change D2_PMH_Break gap threshold from 0.2 to 0.3"
Action: Update scanner_params['D2_PMH_Break']['prev_gap_min'] = 0.3

User: "Disable D2_No_PMH_Break scanner"
Action: Update scanner_params['D2_No_PMH_Break']['enabled'] = False

User: "Adjust D3 gap range multiplier from 0.3 to 0.5"
Action: Update scanner_params['D3']['gap_range_mult'] = 0.5
```

---

## Output Example

**Input:** SC DMR SCAN.py (binary columns)
**Output:** sc_dmr_results.csv (Scanner_Label format)

```csv
Ticker, Date, Scanner_Label
AAPL, 2024-12-20, D2_PMH_Break
AAPL, 2024-12-20, D3
MSFT, 2024-12-20, D2_PM_Setup
TSLA, 2024-12-19, D2_Extreme_Gap
NVDA, 2024-12-19, D2_Extreme_Intraday_Run
GOOGL, 2024-12-19, D4
AMZN, 2024-12-18, D3_Alt
META, 2024-12-18, D2_PM_Setup_2
```

---

**Transformation Status:** ✅ COMPLETE
**Multi-Scanner Format:** Ticker, Date, Scanner_Label (3 columns)
**Mass Parameter Control:** ✅ Implemented
**Individual Parameter Control:** ✅ Implemented
**Renata AI Ready:** ✅ Yes
**Ready for:** Template library inclusion, AI learning, multi-scanner execution
