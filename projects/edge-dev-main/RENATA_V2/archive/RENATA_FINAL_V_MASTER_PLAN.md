# RENATA FINAL V - MASTER PLAN

## 🎯 VISION

Build a production-grade AI agent that **just works** for trading scanner development:
- 95%+ success rate
- Never leave the platform to fix code
- Self-correcting when errors occur
- Knowledge-driven (Archon RAG), not context-stuffed
- Built for scale

---

## 📚 PHASE 1: KNOWLEDGE BASE (Archon Documents)

### Document 1: Single-Scan v31 Structure
**Source**: `Backside_B_scanner (31).py`
**Purpose**: Gold standard for all single-sanner scanners

**Key Patterns**:
```python
class BacksideBScanner:
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # ✅ CRITICAL: Store user's D0 range separately
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # ✅ Calculate historical data range (lookback for ABS windows)
        lookback_buffer = 1000 + 50  # abs_lookback_days + buffer
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_end = self.d0_end_user

    def run_scan(self):
        """Main entry point - REQUIRED"""
        stage1_data = self.fetch_grouped_data()
        stage2a_data = self.compute_simple_features(stage1_data)
        stage2b_data = self.apply_smart_filters(stage2a_data)
        stage3a_data = self.compute_full_features(stage2b_data)
        return self.detect_patterns(stage3a_data)

    def fetch_grouped_data(self):
        """Stage 1: Polygon grouped endpoint"""
        nyse = mcal.get_calendar('NYSE')
        trading_dates = nyse.schedule(start_date=self.scan_start, end_date=self.d0_end)
        # URL: /v2/aggs/grouped/locale/us/market/stocks/{date}
        # Returns: ALL tickers that traded each day

    def compute_simple_features(self, df):
        """Stage 2a: ONLY prev_close, adv20_usd, price_range"""
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )
        df['price_range'] = df['high'] - df['low']
        return df

    def apply_smart_filters(self, df):
        """Stage 2b: Smart filters on D0 range only"""
        # ✅ SEPARATE historical from output range
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # ✅ Apply filters ONLY to output range
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['adv20_usd'] >= self.params['adv20_min_usd']) &
            ...
        ].copy()

        # ✅ COMBINE: all historical + filtered output
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # ✅ Only keep tickers with 1+ passing D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        return df_combined

    def compute_full_features(self, df):
        """Stage 3a: EMA, ATR, slopes, all indicators"""
        # Compute all technical features
        return df

    def detect_patterns(self, df):
        """Stage 3b: Pattern detection with groupby"""
        ticker_data_list = []
        for ticker, ticker_df in df.groupby('ticker'):
            ticker_data_list.append((ticker, ticker_df.copy(), self.d0_start_user, self.d0_end_user))

        signals = []
        for ticker_data in ticker_data_list:
            signals.extend(self.process_ticker_3(ticker_data))
        return signals
```

---

### Document 2: Multi-Scan v31 Structure
**Source**: SC-DMR, LC-D2 (after v31 update)
**Purpose**: Multi-pattern detection scanners

**Key Differences from Single-Scan**:
- **Vectorized boolean masks** instead of groupby loops
- Multiple patterns detected in **single pass**
- Results aggregated by ticker+date
- NO `process_ticker()` methods
- NO iteration over tickers

```python
class MultiScanScanner:
    def detect_patterns(self, df):
        """Stage 3b: Vectorized pattern detection"""
        # Filter to output range
        df_output = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # ✅ Vectorized masks for each pattern
        mask_pattern1 = (
            (df_output['gap'] >= self.params['gap_min']) &
            (df_output['volume_ratio'] >= self.params['vol_mult']) &
            ...
        )

        mask_pattern2 = (
            (df_output['consecutive_gains'] >= 2) &
            ...
        )

        # ✅ Apply all masks in one pass
        signals = []
        for pattern_name, mask in [('pattern1', mask_pattern1), ('pattern2', mask_pattern2)]:
            pattern_signals = df_output[mask].copy()
            pattern_signals['pattern'] = pattern_name
            signals.append(pattern_signals)

        return pd.concat(signals, ignore_index=True)
```

---

### Document 3: EdgeDev Scanner Architecture & Rules

#### 3.1 STAGE ARCHITECTURE OVERVIEW

**Why 3 Stages?**
- **Stage 1**: Fetch all data efficiently (grouped endpoint, not per-ticker)
- **Stage 2**: Smart filtering reduces 99%+ of data before expensive computations
- **Stage 3**: Heavy computations only on filtered data

**Performance**:
- Old way: 12,000+ API calls (one per ticker per day)
- New way: 456 API calls (one per trading day) = **26x fewer**
- Smart filters: Reduce from millions of rows to thousands before Stage 3

---

#### 3.2 DATE SYSTEM - CRITICAL UNDERSTANDING

**Three Date Ranges:**

1. **`d0_start_user` / `d0_end_user`** (User's Signal Output Range)
   - **What**: Dates you want results for
   - **Example**: "2024-01-01" to "2024-12-31"
   - **Usage**: Pattern detection only reports signals in this range
   - **Storage**: `self.d0_start_user`, `self.d0_end_user`

2. **`scan_start`** (Historical Data Start)
   - **What**: Earliest date needed for calculations
   - **Formula**: `d0_start_user - lookback_buffer`
   - **Example**: If d0_start_user="2024-01-01" and lookback=1050 days
     - scan_start ≈ "2021-02-15"
   - **Purpose**: Fetch enough historical data for:
     - Rolling windows (EMA, ATR)
     - ABS windows (1000-day lookback)
     - Slope calculations
     - Previous day references (D-1, D-2)

3. **`scan_end`** (Data Fetch End)
   - **What**: Last date to fetch data for
   - **Value**: Same as `d0_end_user`
   - **Reason**: Need D-1 data for D0 pattern detection

**Example Timeline**:
```
scan_start (2021-02-15) ----> d0_start_user (2024-01-01) ----> d0_end_user (2024-12-31) == scan_end
|<---- 1050 days historical ---->|<-------------- output range --------------->|
```

---

#### 3.3 DAY INDEXING - D-2, D-1, D0

**Pattern Detection Context**:
- **D0**: Trade day (signal day, execution day)
- **D-1**: Previous trading day
- **D-2**: Two trading days before D0

**Example**:
```
D-2: 2024-01-10 (Wednesday)
D-1: 2024-01-11 (Thursday)  <- Trigger mold evaluated here
D0: 2024-01-12 (Friday)     <- Signal day, gap & trade entry
```

**Code Pattern**:
```python
for i in range(2, len(df)):  # Start at index 2 (have D-2 and D-1 available)
    r0 = df.iloc[i]      # D0 (trade day)
    r1 = df.iloc[i-1]    # D-1 (previous day)
    r2 = df.iloc[i-2]    # D-2 (two days back)

    # D-1 checks (trigger mold)
    if r1['volume'] < r1['volume_avg']:
        continue

    # D0 checks (trade day)
    if r0['gap'] < 0.75:
        continue
```

**Critical Rule**: **ALWAYS check D0 exists** before checking D-1/D-2
```python
# ✅ CORRECT: Loop starts at index 2
for idx in df_output.index:
    if idx < 2:  # Need D-1 and D-2
        continue

# ❌ WRONG: Doesn't check if previous rows exist
for idx in df_output.index:
    r1 = df.iloc[idx-1]  # Could fail on first row!
```

---

#### 3.4 SMART FILTERING - Stage 2b Deep Dive

**Purpose**:
- Identify which D0 dates have potential signals
- Reduce computation by 99%+ before expensive Stage 3
- **Keep ALL historical data** for rolling calculations

**Key Concept**: Validate D0 dates, NOT filter out historical data

**Wrong Approach** (loses historical data):
```python
# ❌ WRONG: Filters entire dataframe
df = df[df['date'].between(d0_start, d0_end)]  # Loses historical!
df = df[
    (df['prev_close'] >= 8) &
    (df['adv20_usd'] >= 30_000_000)
]
# Now we only have D0 data, can't compute rolling windows!
```

**Correct Approach** (preserves history):
```python
# ✅ CORRECT: Separate, filter, combine
# Step 1: Separate
df_historical = df[~df['date'].between(d0_start_user, d0_end_user)].copy()
df_output_range = df[df['date'].between(d0_start_user, d0_end_user)].copy()

# Step 2: Apply filters ONLY to output range
df_output_filtered = df_output_range[
    (df_output_range['prev_close'] >= 8) &
    (df_output_range['adv20_usd'] >= 30_000_000) &
    (df_output_range['volume'] >= 1_000_000)
].copy()

# Step 3: Combine (all historical + filtered output)
df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

# Step 4: Only keep tickers with 1+ passing D0 dates
tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]
```

**Why This Works**:
1. Historical data preserved for rolling calculations
2. Only tickers with valid D0 signals kept
3. Stage 3 computes features on full history
4. Stage 3b detects patterns only on D0 range

**Common Smart Filters**:
```python
filters = {
    'liquidity': {
        'price_min': 8.0,                    # Minimum price
        'adv20_min_usd': 30_000_000,         # 20-day average dollar value
        'volume_min': 1_000_000,             # Minimum shares
        'price_range_min': 0.50              # Minimum volatility
    },
    'data_quality': {
        'min_periods': 20,                   # Need 20 days of data
        'no_nan_cols': ['prev_close', 'adv20_usd', 'price_range']
    }
}
```

---

#### 3.5 PARAMETER BUILDING & VALIDATION

**Parameter Categories**:

1. **Liquidity Parameters** (Filter universe)
   ```python
   "price_min": 8.0,              # float: Minimum stock price
   "adv20_min_usd": 30_000_000,   # int: 20-day avg dollar volume
   "volume_min": 1_000_000,       # int: Minimum daily shares
   "price_range_min": 0.50        # float: Min daily range
   ```

2. **Lookback Parameters** (Historical data needs)
   ```python
   "abs_lookback_days": 1000,     # int: ABS window size
   "abs_exclude_days": 10,        # int: Days to exclude from ABS
   "ema_period": 9,               # int: EMA span
   "atr_period": 14,              # int: ATR window
   "slope_days": 5                # int: Slope calculation period
   ```

3. **Threshold Parameters** (Pattern detection)
   ```python
   "gap_div_atr_min": 0.75,       # float: Gap size (ATR multiples)
   "slope5d_min": 3.0,            # float: 5-day slope (%)
   "high_ema9_mult": 1.05,        # float: High vs EMA ratio
   "atr_mult": 0.9,               # float: TR vs ATR ratio
   "vol_mult": 0.9                # float: Volume vs avg ratio
   ```

4. **Boolean Switches** (Enable/disable features)
   ```python
   "require_open_gt_prev_high": True,   # bool: D0 open > D-1 high
   "enforce_d1_above_d2": True,         # bool: D-1 > D-2 validation
   "trigger_mode": "D1_or_D2"           # str: "D1_only" or "D1_or_D2"
   ```

5. **Advanced Parameters** (Pattern-specific)
   ```python
   "d1_volume_min": 15_000_000,          # int: Absolute D-1 volume floor
   "d1_vol_mult_min": 1.25,             # float: D-1 vol/avg minimum
   "d1_green_atr_min": 0.30,            # float: D-1 candle size
   "pos_abs_max": 0.75                  # float: Max position in ABS window
   ```

**Parameter Type Rules**:
```python
TYPE_MAPPING = {
    # Prices, ratios, percentages → float
    'price': float,
    'ratio': float,
    'percentage': float,
    'mult': float,

    # Shares, volume, dollars, days → int
    'shares': int,
    'volume': int,
    'usd': int,
    'days': int,

    # Switches → bool
    'require': bool,
    'enforce': bool,
    'enable': bool,

    # Options → str
    'mode': str,
    'type': str
}

def validate_param_type(name: str, value) -> (type, any):
    """Infer and convert parameter type"""
    for keyword, param_type in TYPE_MAPPING.items():
        if keyword in name.lower():
            return param_type, param_type(value)

    # Default: Try int first, then float
    try:
        return int, int(value)
    except ValueError:
        return float, float(value)
```

**Parameter Validation Rules**:
```python
VALIDATION_RULES = {
    'price_min': {
        'type': float,
        'range': (0.01, 1000000),  # Min to max
        'default': 8.0
    },
    'adv20_min_usd': {
        'type': int,
        'range': (100_000, 1_000_000_000),  # $100k to $1B
        'default': 30_000_000
    },
    'volume_min': {
        'type': int,
        'range': (10_000, 10_000_000_000),  # 10k to 10B shares
        'default': 1_000_000
    },
    'gap_div_atr_min': {
        'type': float,
        'range': (0.0, 10.0),  # 0 to 10 ATR
        'default': 0.75
    },
    'slope5d_min': {
        'type': float,
        'range': (-100.0, 1000.0),  # -100% to +1000%
        'default': 3.0
    }
}

def validate_param(name: str, value: any) -> bool:
    """Validate parameter value"""
    if name not in VALIDATION_RULES:
        return True  # Unknown parameter, allow it

    rules = VALIDATION_RULES[name]

    # Check type
    if not isinstance(value, rules['type']):
        try:
            value = rules['type'](value)
        except (ValueError, TypeError):
            return False

    # Check range
    min_val, max_val = rules['range']
    if not (min_val <= value <= max_val):
        return False

    return True
```

**Parameter Extraction from Description**:
```python
# Example: "Find stocks that gap up at least 0.75 ATR with 20% slope"

EXTRACTION_PATTERNS = {
    'gap': {
        'keywords': ['gap', 'open gap', 'gap up'],
        'param': 'gap_div_atr_min',
        'unit': 'ATR',
        'default': 0.75
    },
    'slope': {
        'keywords': ['slope', 'trend', 'momentum'],
        'param': 'slope5d_min',
        'unit': '%',
        'default': 3.0
    },
    'volume': {
        'keywords': ['volume', 'shares', 'liquidity'],
        'param': 'volume_min',
        'unit': 'shares',
        'default': 1_000_000
    },
    'price': {
        'keywords': ['price', 'stock price', 'share price'],
        'param': 'price_min',
        'unit': 'USD',
        'default': 8.0
    }
}

def extract_params(description: str) -> dict:
    """Extract parameters from natural language"""
    import re

    params = {}

    # Extract numbers with context
    for pattern_name, pattern_info in EXTRACTION_PATTERNS.items():
        # Look for keywords in description
        if any(keyword in description.lower() for keyword in pattern_info['keywords']):
            # Extract number near keyword
            matches = re.findall(r'(\d+\.?\d*)\s*(' + '|'.join(pattern_info['keywords']) + r')', description, re.IGNORECASE)
            if matches:
                value = float(matches[0][0])
                params[pattern_info['param']] = value
            else:
                # Use default if number not found
                params[pattern_info['param']] = pattern_info['default']

    # Fill in defaults for missing params
    for pattern_info in EXTRACTION_PATTERNS.values():
        param = pattern_info['param']
        if param not in params:
            params[param] = pattern_info['default']

    return params
```

---

#### 3.6 FETCHING vs D0 DATES - Critical Rules

**Rule 1: Fetch More Than You Display**
```python
# ✅ CORRECT
fetch_range = (d0_start_user - 1050 days) to d0_end_user
signal_range = d0_start_user to d0_end_user

# ❌ WRONG
fetch_range = signal_range  # Can't compute historical features!
```

**Rule 2: Always Have Buffer for Rolling Windows**
```python
# Need: 20-day ADV20, 14-day ATR, 5-day slope
# Minimum buffer: max(20, 14, 5) + safety = 50 days

# For ABS windows: 1000-day lookback
# Total buffer: 1000 + 50 = 1050 days

lookback_buffer = max(
    max(rolling_windows),  # EMA, ATR, etc.
    abs_lookback_days,     # Absolute window
    slope_days             # Slope calculations
) + 50  # Safety buffer
```

**Rule 3: Smart Filters Create Output Window**
```python
# Before Stage 2b: All dates from scan_start to scan_end
# After Stage 2b: Only tickers with 1+ passing D0 dates, but ALL historical dates preserved

# This means:
# - Fewer tickers (99% reduction)
# - Same date range (scan_start to scan_end)
# - Stage 3 computes features on full history
# - Stage 3b detects patterns only in D0 range
```

---

#### 3.7 NO-LOOKAHEAD BIAS RULES

**Golden Rule**: **Never use current data to make decisions about past data**

**Violations to Avoid**:
```python
# ❌ WRONG: Using current close to filter previous rows
df = df[df['close'] > df['close'].mean()]  # Leakage!

# ❌ WRONG: Shifting after filtering
df_filtered = df[df['volume'] > 1_000_000]
df_filtered['prev_close'] = df_filtered['close'].shift(1)  # Wrong index!

# ❌ WRONG: Using future data in past calculations
df['signal'] = df['close'].shift(-1) > df['close']  # Future leak!
```

**Correct Patterns**:
```python
# ✅ CORRECT: Compute features first, then filter
df['prev_close'] = df.groupby('ticker')['close'].shift(1)
df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(20, min_periods=20).mean().shift(1)  # Note: .shift(1)
)

# Now filter (features don't leak)
df_filtered = df[df['adv20_usd'] >= 30_000_000]

# ✅ CORRECT: Use min_periods in rolling windows
df['atr'] = df['tr'].rolling(14, min_periods=14).mean().shift(1)
# ^ Don't use ATR until we have 14 days of data

# ✅ CORRECT: Pattern detection uses shifted data
for i in range(2, len(df)):  # Start at 2 (need D-1 and D-2)
    r0 = df.iloc[i]   # D0 (current)
    r1 = df.iloc[i-1] # D-1 (previous, already computed)
    r2 = df.iloc[i-2] # D-2 (two days back)

    # r1['adv20_usd'] already computed from 20 days BEFORE r1
    # No lookahead bias
```

**Common No-Bias Mistakes**:
1. **Forgetting .shift(1)** after rolling calculations
2. **Filtering before computing features**
3. **Using .mean() on entire column instead of rolling mean**
4. **Normalizing using global statistics**
5. **Using future data (shift(-1))**

**Always Do**:
```python
# 1. Compute features with proper shifting
df['feature'] = df.groupby('ticker')['value'].transform(
    lambda x: x.rolling(window, min_periods=window).mean().shift(1)
)

# 2. Filter AFTER features computed
df = df[df['feature'] >= threshold]

# 3. Use groupby to avoid cross-ticker leakage
df['feature'] = df.groupby('ticker')['value'].transform(...)  # Per-ticker only
```

---

### Document 4: Indicator Library

```python
INDICATORS = {
    'EMA': {
        'formula': 'df.groupby("ticker")["close"].transform(lambda x: x.ewm(span=period, adjust=False).mean())',
        'params': {'period': 9},
        'shift': False,  # Already computed from past data
        'notes': 'Exponential moving average, more weight to recent data'
    },

    'ATR': {
        'formula': '''
        hi_lo = df['high'] - df['low']
        hi_pc = (df['high'] - df['close'].shift(1)).abs()
        lo_pc = (df['low'] - df['close'].shift(1)).abs()
        df['tr'] = pd.concat([hi_lo, hi_pc, lo_pc], axis=1).max(axis=1)
        df['atr'] = df.groupby('ticker')['tr'].transform(lambda x: x.rolling(14, min_periods=14).mean().shift(1))
        ''',
        'params': {'period': 14},
        'shift': True,  # Must shift to avoid lookahead
        'notes': 'Average True Range, volatility measure'
    },

    'ADV20': {
        'formula': 'df.groupby("ticker").apply(lambda x: (x["close"] * x["volume"]).rolling(20, min_periods=20).mean().shift(1))',
        'params': {'period': 20},
        'shift': True,
        'notes': '20-day average daily dollar value, liquidity filter'
    },

    'Slope': {
        'formula': '(df["ema"] - df["ema"].shift(days)) / df["ema"].shift(days) * 100',
        'params': {'days': 5},
        'shift': False,
        'notes': 'Percentage change over N days, momentum indicator'
    },

    'Gap': {
        'formula': '(df["open"] - df["close"].shift(1)) / df["atr"]',
        'params': {},
        'shift': True,
        'notes': 'Opening gap relative to ATR, breakout measure'
    }
}
```

---

## 📋 PHASE 2: UPDATE TEMPLATES TO v31

### Task 2.1: Update SC-DMR to v31
**File**: `src/python/renata_rebuild/templates/sc_dmr.py`

**Changes Required**:
1. ✅ Add `d0_start_user`/`d0_end_user` (currently uses `d0_start`/`d0_end`)
2. ✅ Add `run_scan()` method
3. ✅ Rename `fetch_all_grouped_data()` → `fetch_grouped_data()`
4. ✅ Add `apply_smart_filters()` method (currently missing)
5. ✅ Add `compute_simple_features()` stage (currently missing)
6. ✅ Ensure vectorized pattern detection (already has this)

### Task 2.2: Update LC-D2 to v31
**File**: `src/python/renata_rebuild/templates/lc_d2.py`

**Changes Required**: Same as SC-DMR

---

## 📋 PHASE 3: SIMPLIFIED AI AGENT

### System Prompt (~150 lines)

See separate file: `RENATA_AI_SYSTEM_PROMPT.md`

---

## 📋 PHASE 4: VALIDATION & SELF-CORRECTION

### Validation Rules

```python
VALIDATION_RULES = {
    'syntax': 'Code parses without SyntaxError',
    'structure': {
        'required_methods': [
            'run_scan',
            'fetch_grouped_data',
            'compute_simple_features',
            'apply_smart_filters',
            'compute_full_features',
            'detect_patterns'
        ]
    },
    'naming': {
        'forbidden': ['ADV20_$', 'd0_start', 'd0_end', 'fetch_all'],
        'required': ['d0_start_user', 'd0_end_user', 'adv20_usd']
    },
    'no_bias': {
        'check_shift': 'All rolling calculations use .shift(1)',
        'check_order': 'Features computed before filtering',
        'check_groupby': 'Per-ticker calculations use groupby'
    },
    'api': {
        'endpoint': 'Uses Polygon grouped endpoint',
        'calendar': 'Uses mcal.get_calendar'
    }
}
```

---

## 📋 PHASE 5: KNOWLEDGE BASE CAPTURE

### Conversation Learning

**Auto-Capture Rules**:
1. Every solution → Archon document
2. Every bug fix → Validation rule
3. Every pattern → Template library
4. Every param → Parameter catalog

**Implementation**:
```typescript
async function captureLearning(conversation: Conversation) {
  const insights = extractInsights(conversation);

  for (const insight of insights) {
    await archon.createDocument({
      type: 'renata_learning',
      category: insight.category,
      content: insight.content,
      tags: insight.tags,
      related_docs: findRelated(insight)
    });
  }
}
```

---

## 📊 IMPLEMENTATION ROADMAP

**Week 1**: Foundation
- ✅ Update SC-DMR to v31
- ✅ Update LC-D2 to v31
- ✅ Create Archon documents
- ✅ Build parameter builder

**Week 2**: AI Integration
- ✅ Implement simplified system prompt
- ✅ Build Archon RAG integration
- ✅ Create validation system
- ✅ Implement self-correction

**Week 3**: Testing & Polish
- ✅ Test conversions (20 cases)
- ✅ Measure success rate
- ✅ Iterate to 95%+

---

**STATUS**: 🚀 IN PROGRESS - Starting with SC-DMR v31 Update
