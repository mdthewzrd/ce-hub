# Two-Tier Template System - Complete

## Executive Summary

Created a **two-tier template system** that separates **structure** from **pattern logic**. This enables full creative mode while maintaining standardized architecture.

---

## The Problem

Previously, Renata had:
- ❌ Pattern-specific templates (backside_b, lc_d2, etc.) that mixed structure with logic
- ❌ No clear separation between architecture and pattern detection
- ❌ Limited creative freedom - couldn't easily mix and match patterns

## The Solution

### Two-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: STRUCTURE                        │
│              (Standardized Architecture)                   │
├─────────────────────────────────────────────────────────────┤
│  SINGLE-SCAN STRUCTURE   │   MULTI-SCAN STRUCTURE           │
│  - process_ticker_3()    │   - Vectorized masks            │
│  - Per-ticker processing  │   - No per-ticker loops         │
│  - Parallel ticker exec   │   - DataFrame-wide filtering    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  TIER 2: PATTERN LOGIC                      │
│              (Plugs into Structure)                        │
├─────────────────────────────────────────────────────────────┤
│  backside_b               │  lc_d2                         │
│  a_plus_para              │  sc_dmr                        │
│  lc_3d_gap                │  [custom patterns]              │
│  d1_gap                   │                                │
│  extended_gap             │                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Tier 1: Structural Templates

### SINGLE-SCAN STRUCTURE

**File:** `edgeDevPatternLibrary.ts` → `STRUCTURAL_TEMPLATES.singleScanStructure`

**Used by:** backside_b, a_plus_para, d1_gap, extended_gap, lc_3d_gap

**Key Characteristics:**
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    # Prepare ticker data for parallel processing
    ticker_data_list = []
    for ticker in df['ticker'].unique():
        ticker_df = df[df['ticker'] == ticker].copy()
        ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

    # Process tickers in parallel
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        futures = [executor.submit(self.process_ticker_3, ticker_data) for ticker_data in ticker_data_list]
        # Collect signals...

def process_ticker_3(self, ticker_data: tuple) -> list:
    """
    THIS IS WHERE PATTERN-SPECIFIC LOGIC GOES
    """
    ticker, ticker_df, d0_start, d0_end = ticker_data
    # Your pattern detection logic here
```

**When to use:**
- Single pattern detection
- Complex per-ticker logic
- Individual ticker analysis required
- Examples: Parabolic breakdown, gap patterns, EMA patterns

---

### MULTI-SCAN STRUCTURE

**File:** `edgeDevPatternLibrary.ts` → `STRUCTURAL_TEMPLATES.multiScanStructure`

**Used by:** lc_d2, sc_dmr

**Key Characteristics:**
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    # Filter to D0 range
    df_d0 = df[df['Date'].between(d0_start, d0_end)].copy()

    # Collect all signals from all patterns
    all_signals = []

    # ==================== PATTERN 1 ====================
    mask = (df_d0['condition_1']) & (df_d0['condition_2'])
    signals = df_d0[mask].copy()
    signals['Scanner_Label'] = 'Pattern_1'
    all_signals.append(signals)

    # ==================== PATTERN 2 ====================
    mask = (df_d0['condition_A']) & (df_d0['condition_B'])
    signals = df_d0[mask].copy()
    signals['Scanner_Label'] = 'Pattern_2'
    all_signals.append(signals)

    # Combine and aggregate by ticker+date
    signals = pd.concat(all_signals, ignore_index=True)
    signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
        lambda x: ', '.join(sorted(set(x)))
    ).reset_index()
```

**When to use:**
- Multiple pattern detection (2+ patterns)
- Vectorized boolean mask logic
- Pattern aggregation needed
- Examples: D2/D3/D4 patterns, multi-pattern scanners

---

## Tier 2: Pattern-Specific Logic

### Pattern Logic Templates

**File:** `edgeDevPatternLibrary.ts` → `PATTERN_TEMPLATES`

**Available Patterns:**

| Pattern | Structure | Key Logic |
|---------|-----------|-----------|
| backside_b | SINGLE | `mold_check()` with parabolic breakdown |
| a_plus_para | SINGLE | Extended momentum with slope calculations |
| lc_3d_gap | SINGLE | Progressive EMA distance averaging |
| d1_gap | SINGLE | Hybrid daily + pre-market minute data |
| extended_gap | SINGLE | Range expansion ratios |
| lc_d2 | MULTI | 12 D2/D3/D4 pattern vectorized masks |
| sc_dmr | MULTI | 10 small cap pattern vectorized masks |

**How to use:**

1. **Copy structure** from `STRUCTURAL_TEMPLATES.{single|multi}ScanStructure`
2. **Insert pattern logic** into `process_ticker_3()` (SINGLE) or mask section (MULTI)
3. **Use parameters** from `PARAMETER_TEMPLATES.{pattern_name}`

---

## Full Creative Mode Example

### Example 1: Custom Single-Scan Pattern

**Request:** "Create a scanner that detects stocks with 3-day consecutive gains >5%"

**Renata generates:**

```python
class CustomThreeDayGainScanner:
    """
    Custom 3-Day Consecutive Gain Scanner
    Structure: SINGLE-SCAN (from STRUCTURAL_TEMPLATES.singleScanStructure)
    """

    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        # Standard setup (from structure)
        self.session = requests.Session()
        self.api_key = api_key
        # ...

        self.params = {
            "gain_min": 0.05,  # 5% minimum
            "price_min": 5.0,
            "volume_min": 1_000_000
        }

    # Standard Stages 1-2 (from structure)...

    # ==================== STAGE 3: PATTERN DETECTION ====================

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        # From SINGLE-SCAN structure template
        ticker_data_list = []
        for ticker in df['ticker'].unique():
            ticker_df = df[df['ticker'] == ticker].copy()
            ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

        signals_list = []
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            futures = [executor.submit(self.process_ticker_3, ticker_data) for ticker_data in ticker_data_list]
            for future in as_completed(futures):
                signals = future.result()
                if signals:
                    signals_list.extend(signals)

        return pd.DataFrame(signals_list)

    def process_ticker_3(self, ticker_data: tuple) -> list:
        """
        CUSTOM PATTERN LOGIC HERE
        Detects 3-day consecutive gains >5%
        """
        ticker, ticker_df, d0_start, d0_end = ticker_data

        df_d0 = ticker_df[ticker_df['date'].between(d0_start, d0_end)].copy()

        if df_d0.empty:
            return []

        signals = []

        # Compute 3-day gains
        df_d0['gain_1d'] = (df_d0['close'] / df_d0['prev_close']) - 1
        df_d0['gain_2d'] = (df_d0['prev_close'] / df_d0['prev_close_2']) - 1
        df_d0['gain_3d'] = (df_d0['prev_close_2'] / df_d0['prev_close_3']) - 1

        # Pattern detection
        for idx, row in df_d0.iterrows():
            if (row['gain_1d'] >= self.params['gain_min'] and
                row['gain_2d'] >= self.params['gain_min'] and
                row['gain_3d'] >= self.params['gain_min']):

                signals.append({
                    'Ticker': ticker,
                    'Date': row['date'],
                    'Trigger': '3Day_Gain_Surge',
                    'Gain_1D': row['gain_1d'],
                    'Gain_2D': row['gain_2d'],
                    'Gain_3D': row['gain_3d'],
                    'Close': row['close']
                })

        return signals
```

**Result:**
- ✅ Standardized 3-stage architecture
- ✅ Rule #5 compliant
- ✅ Custom pattern logic
- ✅ Production-ready code

---

### Example 2: Custom Multi-Scan Pattern

**Request:** "Create a multi-scanner that detects gap patterns, momentum patterns, and volume patterns"

**Renata generates:**

```python
class CustomMultiPatternScanner:
    """
    Custom Multi-Pattern Scanner
    Structure: MULTI-SCAN (from STRUCTURAL_TEMPLATES.multiScanStructure)
    """

    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        # Standard setup (from structure)
        # ...

        self.params = {
            "gap_min": 0.5,  # 0.5% gap
            "momentum_gain_min": 0.3,  # 30% gain
            "volume_surge_mult": 2.0  # 2x average volume
        }

    # Standard Stages 1-2 (from structure)...

    # ==================== STAGE 3: PATTERN DETECTION ====================

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Vectorized multi-pattern detection
        From MULTI-SCAN structure template
        """
        df['Date'] = pd.to_datetime(df['date'])
        df = df.dropna(subset=['prev_close', 'volume', 'gap'])

        df_d0 = df[df['Date'].between(pd.to_datetime(self.d0_start), pd.to_datetime(self.d0_end))].copy()

        all_signals = []

        # ==================== PATTERN 1: GAP UP ====================
        mask = (
            (df_d0['gap'] >= self.params['gap_min'] / 100) &
            (df_d0['volume'] >= df_d0['VOL_AVG'] * 1.5)
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'Gap_Up'
            all_signals.append(signals)

        # ==================== PATTERN 2: MOMENTUM SURGE ====================
        df_d0['momentum'] = (df_d0['close'] / df_d0['prev_close_5']) - 1
        mask = (
            (df_d0['momentum'] >= self.params['momentum_gain_min']) &
            (df_d0['volume'] >= df_d0['VOL_AVG'] * self.params['volume_surge_mult'])
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'Momentum_Surge'
            all_signals.append(signals)

        # ==================== PATTERN 3: VOLUME BREAKOUT ====================
        mask = (
            (df_d0['volume'] >= df_d0['VOL_AVG'] * self.params['volume_surge_mult']) &
            (df_d0['high'] >= df_d0['prev_high'] * 1.02)
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'Volume_Breakout'
            all_signals.append(signals)

        # Aggregate by ticker+date
        if all_signals:
            signals = pd.concat(all_signals, ignore_index=True)
            signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
                lambda x: ', '.join(sorted(set(x)))
            ).reset_index()
            return signals_aggregated

        return pd.DataFrame()
```

**Result:**
- ✅ Vectorized multi-pattern detection
- ✅ Standardized aggregation
- ✅ Custom pattern combinations
- ✅ Production-ready code

---

## Files Modified

### 1. `edgeDevPatternLibrary.ts` (ENHANCED)

**Added:**
- `STRUCTURAL_TEMPLATES.singleScanStructure` - Single-scan architecture
- `STRUCTURAL_TEMPLATES.multiScanStructure` - Multi-scan architecture

**Key sections:**
```typescript
export const STRUCTURAL_TEMPLATES = {
  singleScanStructure: `...`,  // process_ticker_3() based
  multiScanStructure: `...`    // Vectorized masks based
};
```

### 2. `renataAIAgentService.ts` (ENHANCED)

**Updated:**
- Import `STRUCTURAL_TEMPLATES`
- Enhanced system prompt with two-tier explanation
- Updated `detectKnownPattern()` to include structure type
- Added sc_dmr pattern detection
- Enhanced `buildUserPrompt()` to show structure type

**Key changes:**
```typescript
// System prompt now shows:
🏗️ TIER 1: STRUCTURAL TEMPLATES (The Foundation)
  - SINGLE-SCAN STRUCTURE
  - MULTI-SCAN STRUCTURE

📚 TIER 2: PATTERN-SPECIFIC LOGIC (Plugs into Structure)
  - backside_b, a_plus_para, lc_3d_gap, d1_gap, extended_gap
  - lc_d2, sc_dmr

// Pattern detection now returns structure type:
{ name: 'Backside B', key: 'backside_b', structure: 'single' }
{ name: 'SC DMR Multi-Scanner', key: 'sc_dmr', structure: 'multi' }
```

---

## How This Enables Full Creative Mode

### Before Two-Tier System:
- ❌ 7 pattern-specific templates
- ❌ Structure mixed with pattern logic
- ❌ Hard to create new patterns
- ❌ Limited creative freedom

### After Two-Tier System:
- ✅ **2 structural templates** (single/multi)
- ✅ **7+ pattern logic templates** that plug into structures
- ✅ **Clear separation** of architecture and logic
- ✅ **Easy to create** new patterns:
  1. Choose structure (SINGLE or MULTI)
  2. Insert pattern logic into structure
  3. Customize parameters
- ✅ **Mix and match** capabilities:
  - Use backside_b logic in multi-scan structure? Yes!
  - Combine lc_d2 patterns with custom filters? Yes!
  - Create entirely new pattern with standard structure? Yes!

---

## Creative Mode Examples

### 1. Mix Existing Pattern Logic

**Request:** "Create a multi-scanner using backside_b mold check and lc_3d_gap EMA distance logic"

**Renata can:**
- Use MULTI-SCAN structure
- Add Pattern 1: Backside B mold check (vectorized)
- Add Pattern 2: LC 3D Gap EMA distance (vectorized)
- Aggregate results by ticker+date

### 2. Create Entirely New Patterns

**Request:** "Create a scanner for stocks with RSI divergence"

**Renata can:**
- Use SINGLE-SCAN structure (if per-ticker analysis needed)
- Add RSI calculation in `process_ticker_3()`
- Detect divergence pattern
- Return signals

### 3. Combine Multiple Approaches

**Request:** "Create a scanner with 5 custom patterns: gap, momentum, volume, reversal, breakout"

**Renata can:**
- Use MULTI-SCAN structure
- Add 5 vectorized pattern masks
- Aggregate all results
- Return combined signals

---

## Testing the Integration

### Test 1: Single-Scan Pattern

**Request:**
```
"Create a Backside B scanner"
```

**Renata receives:**
```
🎯 PATTERN TEMPLATE DETECTED: Backside B
🏗️  STRUCTURE: SINGLE-SCAN (STRUCTURAL_TEMPLATES.singleScanStructure)
📚 Use EXACT detection logic from PATTERN_TEMPLATES.backside_b
✅ Follow SINGLE-SCAN structure exactly
✅ Use PARAMETER_TEMPLATES.backside_b for parameters
✅ Ensure Rule #5 compliance (features before dropna)
```

### Test 2: Multi-Scan Pattern

**Request:**
```
"Create an SC DMR multi-scanner"
```

**Renata receives:**
```
🎯 PATTERN TEMPLATE DETECTED: SC DMR Multi-Scanner
🏗️  STRUCTURE: MULTI-SCAN (STRUCTURAL_TEMPLATES.multiScanStructure)
📚 Use EXACT detection logic from PATTERN_TEMPLATES.sc_dmr
✅ Follow MULTI-SCAN structure exactly
✅ Use PARAMETER_TEMPLATES.sc_dmr for parameters
✅ Ensure Rule #5 compliance (features before dropna)
```

### Test 3: Custom Creative Mode

**Request:**
```
"Create a scanner that detects stocks with 5-day consecutive gains and volume surge"
```

**Renata receives:**
```
No specific template detected
Use SINGLE-SCAN or MULTI-SCAN structure based on requirements
Follow EDGEDEV_ARCHITECTURE principles
Ensure Rule #5 compliance
```

---

## Summary

**What Changed:**
- Created 2 structural templates (single/multi scan)
- Separated structure from pattern logic
- Enabled full creative mode while maintaining standards

**What This Enables:**
- ✅ Clear structure/pattern separation
- ✅ Mix and match pattern logic
- ✅ Create entirely new patterns
- ✅ Combine multiple approaches
- ✅ Standardized architecture always maintained

**Result:**
Renata now has a **two-tier template system** that provides:
1. **Standardized structure** (always consistent)
2. **Flexible pattern logic** (creative freedom)
3. **Full creative mode** (within architectural constraints)

---

**Status:** ✅ COMPLETE

**Files Created:** 1 documentation file
**Files Modified:** 2 (edgeDevPatternLibrary.ts, renataAIAgentService.ts)
**Structural Templates:** 2 (single-scan, multi-scan)
**Pattern Templates:** 7 (backside_b, a_plus_para, lc_3d_gap, d1_gap, extended_gap, lc_d2, sc_dmr)
**Creative Mode:** ✅ ENABLED
