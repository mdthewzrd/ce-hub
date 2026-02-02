# Renata Standardization Framework - Complete Analysis

**Document Purpose**: Define the exact EdgeDev code standardization rules that Renata MUST follow.

**Created**: 2025-12-29
**Status**: DRAFT - Pending User Approval

---

## 🎯 Executive Summary

**What is Renata?**
Renata is an AI code standardization system that transforms ANY trading scanner code into fully-standardized EdgeDev code.

**What Renata Does:**
1. **Formats** messy/incomplete code → standardized EdgeDev code
2. **Enhances** working code → adds missing EdgeDev standardizations
3. **Creates** new code from scratch (descriptions, images, annotations)

**How Renata Works:**
- **UNDERSTANDS** user's unique scanner logic and parameters
- **LEARNS** from templates (structure, patterns, optimizations)
- **APPLIES** EdgeDev standardizations to user's UNIQUE code
- **VALIDATES** all output (syntax, structure, execution)

**Key Principle**: Templates teach STRUCTURE, not for copy-pasting. Renata handles ANY scanner type, not just known patterns.

**Two Structure Types**:
1. **Single-Scan**: One pattern type per scanner (Backside B, A Plus, LC D2, etc.)
2. **Multi-Scan**: Multiple pattern types per scanner (Backside B + A Plus + LC D2, etc.)

**Mandatory Standardizations**:
- ✅ Grouped endpoint (full market scanning)
- ✅ Thread pooling (parallel processing)
- ✅ Polygon API integration
- ✅ Smart filtering (parameter-based, D0 date range only)
- ✅ Vectorized operations (no slow loops)
- ✅ Connection pooling (requests.Session)
- ✅ Date range configuration
- ✅ Validation (syntax, structure, execution)

**What Gets Preserved**:
- ✅ Original scanner logic (pattern detection rules)
- ✅ Original parameters (names, values, structure)
- ✅ Original class name (unless generic)
- ✅ Unique methods (custom analysis, pattern checks)

**What Gets Standardized**:
- ✅ File structure (header, imports, organization)
- ✅ 3-stage architecture (grouped fetch → smart filters → full features)
- ✅ Column naming (EMA_9, ATR, Prev_High, etc.)
- ✅ Code patterns (vectorized, parallel, connection pooling)
- ✅ Optimizations (add missing standardizations)
- ✅ Documentation (docstrings, comments, progress reporting)

**Critical Rule**: Same input MUST produce same output (deterministic).

---
1. [Core Philosophy](#core-philosophy)
2. [Mandatory Structure](#mandatory-structure)
3. [Naming Conventions](#naming-conventions)
4. [Code Patterns](#code-patterns)
5. [Single-Scan vs Multi-Scan](#single-scan-vs-multi-scan)
6. [Deterministic Formatting Rules](#deterministic-formatting-rules)
7. [What Gets Preserved](#what-gets-preserved)
8. [What Gets Standardized](#what-gets-standardized)
9. [Validation Checklist](#validation-checklist)

---

## Core Philosophy

**Renata's Purpose**:
1. Transform messy/incomplete code → standardized EdgeDev code
2. Transform working code → standardized EdgeDev code (add missing standardizations)
3. Write NEW code from scratch (from descriptions, images, annotations, etc.)

### Key Principles
1. **Deterministic**: Same input → Same output (always)
2. **Structure-Understanding**: Templates teach STRUCTURE, not for copy-pasting
3. **Logic-Preserving**: Keep original scanner's unique patterns and parameters
4. **Enhancement-Adding**: Add ALL EdgeDev standardizations if missing
5. **Validation-Required**: All output must be validated (syntax, execution, standards)

### CRITICAL: Template Understanding vs Copy-Paste
- ❌ WRONG: Renata copies templates and replaces user code
- ✅ CORRECT: Renata UNDERSTANDS structure from templates and APPLIES it to user's code

Templates provide:
- Single-scan structure pattern
- Multi-scan structure pattern
- Standardization patterns (grouped endpoint, smart filtering, etc.)

Renata then:
- Analyzes user's code
- Detects scanner type (single vs multi, pattern type)
- UNDERSTANDS what the code does
- APPLIES EdgeDev structure to user's UNIQUE code
- Adds missing standardizations
- Validates output

---

## Mandatory Structure

### File Header
```python
"""
🚀 GROUPED ENDPOINT [SCANNER_NAME] - OPTIMIZED ARCHITECTURE
===========================================================

[SCANNER_DESCRIPTION]

Key Improvements:
1. Stage 1: Fetch grouped data (1 API call per trading day, not per ticker)
2. Stage 2: Apply smart filters (reduce dataset by 99%)
3. Stage 3: Compute full parameters + scan patterns (only on filtered data)

Performance: ~[TIME] for full scan vs [OLD_TIME] per-ticker approach
Accuracy: 100% - no false negatives
API Calls: [NUM] calls (one per day) vs [OLD_NUM] calls (one per ticker)
"""
```

### Class Structure
```python
class [ScannerName]Scanner:
    """
    [Scanner Name] Scanner Using Grouped Endpoint Architecture
    ============================================================

    [PATTERN_DESCRIPTION]
    ---------------------------
    [Pattern details with bullet points]

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
        - Uses Polygon grouped endpoint
        - 1 API call per trading day (not per ticker)
        - Returns all tickers that traded each day

    Stage 2: Apply smart filters (simple checks)
        - [List of filters]
        - Reduces dataset by ~99%

    Stage 3: Compute full parameters + scan patterns
        - [List of computations]
        - Pattern detection
    """

    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        # Date configuration section
        # Core configuration section
        # Worker configuration section
        # Parameters dictionary section

    # Stage 1 methods
    def get_trading_dates(...) -> List[str]
    def fetch_all_grouped_data(...) -> pd.DataFrame
    def _fetch_grouped_day(...) -> Optional[pd.DataFrame]

    # Stage 2 methods
    def compute_simple_features(...) -> pd.DataFrame
    def apply_smart_filters(...) -> pd.DataFrame

    # Stage 3 methods
    def compute_full_features(...) -> pd.DataFrame
    def [pattern_check_method](...) -> bool
    def [unique_analysis_methods](...)
    def process_ticker_3(...) -> list
    def detect_patterns(...) -> pd.DataFrame

    # Main execution
    def execute(...) -> pd.DataFrame
    def run_and_save(...) -> pd.DataFrame
```

---

## Naming Conventions

### Class Names
- **Pattern**: `[PatternName]Scanner`
- **Examples**:
  - `GroupedEndpointBacksideBScanner`
  - `GroupedEndpointAPlusParaScanner`
  - `GroupedEndpointLC_D2Scanner`
  - `GroupedEndpointD1_GapScanner`

### Column Names (CRITICAL - Must Match Exactly)
```python
# Basic OHLCV
'ticker', 'date', 'open', 'high', 'low', 'close', 'volume'

# Previous day values (use Prev_ prefix)
'Prev_Close', 'Prev_Open', 'Prev_High', 'Prev_Low', 'Prev_Volume'
'Prev2_High', 'Prev2_Close', 'Prev2_Low'

# Indicators (use CAPS with underscores)
'EMA_9', 'EMA_20', 'ATR', 'ATR_raw', 'TR', 'VOL_AVG'
'ADV20_$', 'Slope_9_5d', 'Slope_9_3d', 'Slope_9_15d'

# Computed metrics (use descriptive names)
'High_over_EMA9_div_ATR', 'High_over_EMA20_div_ATR'
'Gap_abs', 'Gap_over_ATR', 'Open_over_EMA9', 'Open_over_EMA20'
'Body_over_ATR', 'pct2d_div_atr', 'pct3d_div_atr'

# Special metrics
'price_range', 'dollar_volume'
```

### Method Names
```python
# Stage 1
'get_trading_dates', 'fetch_all_grouped_data', '_fetch_grouped_day'

# Stage 2
'compute_simple_features', 'apply_smart_filters'

# Stage 3
'compute_full_features', 'detect_patterns'
'[unique_pattern_check]', '[unique_analysis]'
'process_ticker_3', 'mold_check', 'abs_window_analysis'

# Execution
'execute', 'run_and_save'
```

---

## Code Patterns

### 1. Grouped Endpoint (MANDATORY)
```python
def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
    """Stage 1: Fetch ALL data for ALL tickers using grouped endpoint"""
    all_data = []

    with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
        future_to_date = {
            executor.submit(self._fetch_grouped_day, date_str): date_str
            for date_str in trading_dates
        }

        for future in as_completed(future_to_date):
            date_str = future_to_date[future]
            try:
                data = future.result()
                if data is not None and not data.empty:
                    all_data.append(data)
            except Exception as e:
                pass

    return pd.concat(all_data, ignore_index=True)

def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
    """Fetch ALL tickers that traded on a specific date"""
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    params = {"adjusted": "true", "apiKey": self.api_key}

    response = self.session.get(url, params=params, timeout=30)

    if response.status_code != 200:
        return None

    data = response.json()
    if 'results' not in data or not data['results']:
        return None

    df = pd.DataFrame(data['results'])
    df['date'] = pd.to_datetime(date_str)
    df = df.rename(columns={
        'T': 'ticker',
        'o': 'open',
        'h': 'high',
        'l': 'low',
        'c': 'close',
        'v': 'volume'
    })

    return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
```

### 2. Vectorized Operations (MANDATORY)
```python
# CORRECT: Using groupby().transform() for vectorized operations
df['EMA_9'] = df.groupby('ticker')['close'].transform(
    lambda x: x.ewm(span=9, adjust=False).mean()
)

df['ATR_raw'] = df.groupby('ticker')['TR'].transform(
    lambda x: x.rolling(window=14, min_periods=14).mean()
)

df['VOL_AVG'] = df.groupby('ticker')['volume'].transform(
    lambda x: x.rolling(window=14, min_periods=14).mean().shift(1)
)

# CORRECT: Vectorized ABS window filtering
cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
win = ticker_df.loc[mask]

# INCORRECT: Function call in loop
# def abs_top_window(self, ticker_df, d0_date, lookback_days, exclude_days):
#     for date in ticker_df['date']:  # ❌ SLOW
#         if date > wstart and date <= cutoff:  # ❌ SLOW
```

### 3. Smart Filters (MANDATORY)

**CRITICAL RULES**:
1. Smart filters MUST be based on the scanner's OWN parameters
2. Smart filters ONLY apply to D0 date range
3. Smart filters validate WHICH tickers are potentially valid on WHICH days
4. Smart filters MUST NOT filter out tickers that are actually valid
5. Smart filters reduce dataset by ~99% (but preserve ALL potentially valid signals)

```python
def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
    """
    Stage 2: Smart filters to reduce dataset by ~99%

    CRITICAL: Smart filters identify WHICH D0 DATES to check
    - Keep ALL historical data for calculations
    - Use filters to identify D0 dates worth checking
    - Filters MUST be based on scanner's OWN parameters
    - MUST NOT filter out tickers that are actually valid

    Smart Filter Design:
    -------------------
    1. Use scanner's parameters to define filters
    2. Apply filters ONLY to D0 date range
    3. Identify tickers with potential signals on specific days
    4. Keep all historical data for those tickers
    5. Return filtered dataset for Stage 3 processing
    """
    # Separate data
    df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
    df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

    # Apply smart filters ONLY to signal output range
    # IMPORTANT: Use scanner's OWN parameters here!
    df_output_filtered = df_output_range[
        (df_output_range['prev_close'] >= self.params['price_min']) &
        (df_output_range['ADV20_$'] >= self.params['adv20_min_usd']) &
        (df_output_range['volume'] >= 1_000_000)
    ].copy()

    # Get tickers with valid D0 dates
    tickers_with_valid_d0 = df_output_filtered['ticker'].unique()

    # Return all data for those tickers (including historical)
    return df[df['ticker'].isin(tickers_with_valid_d0)]
```

**Example: Different Scanners Use Different Filters**

```python
# Backside B uses:
filters = [
    'prev_close >= price_min',
    'ADV20_$ >= adv20_min_usd',
    'volume >= 1_000_000',
]

# A Plus uses:
filters = [
    'prev_close >= prev_close_min',
    'TR/ATR >= atr_mult',
    'ATR >= atr_abs_min',  # Exclude small caps
]

# LC D2 uses:
filters = [
    'prev_close >= price_min',
    'volume >= vol_mult * VOL_AVG',
    'close >= ema_9',  # Uptrend filter
]
```

**KEY POINT**: Smart filters are SCANNER-SPECIFIC, not generic!

### 4. Parallel Processing (MANDATORY)
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Stage 3: Pattern detection with PARALLEL PROCESSING"""
    signals_list = []

    # Prepare ticker data
    ticker_data_list = []
    for ticker in df['ticker'].unique():
        ticker_df = df[df['ticker'] == ticker].copy()
        ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

    # Process in parallel
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        futures = [executor.submit(self.process_ticker_3, data) for data in ticker_data_list]

        for future in as_completed(futures):
            try:
                signals = future.result()
                signals_list.extend(signals)
            except Exception as e:
                pass

    return pd.DataFrame(signals_list)
```

### 5. Session with Connection Pooling (MANDATORY)
```python
def __init__(self, ...):
    # Setup session with connection pooling
    self.session = requests.Session()
    self.session.mount('https://', requests.adapters.HTTPAdapter(
        pool_connections=100,
        pool_maxsize=100,
        max_retries=2,
        pool_block=False
    ))
```

---

## Single-Scan vs Multi-Scan

### The Two Structure Types

**All EdgeDev scanners MUST follow one of two structures**:

#### Type 1: Single-Scan Structure
```python
class GroupedEndpoint[PatternName]Scanner:
    """
    [Pattern Name] Scanner Using Grouped Endpoint Architecture

    Detects ONE specific pattern type:
    - Backside B parabolic breakdown
    - A Plus parabolic breakout
    - LC D2 frontside extension
    - D1 Gap setup
    - etc.
    """

    def __init__(self, ...):
        # Single set of pattern parameters
        self.params = {
            # Pattern-specific parameters
        }

    def detect_patterns(self, df):
        """
        Detect ONE pattern type

        Returns: DataFrame with columns:
        - Ticker
        - Date
        - Close
        - Volume
        - [Pattern-specific metrics]
        """
        signals = []
        for ticker in tickers:
            if self._check_[pattern]_condition(ticker_data):
                signals.append(...)
        return pd.DataFrame(signals)
```

#### Type 2: Multi-Scan Structure
```python
class GroupedEndpointMultiScanner:
    """
    Multi-Pattern Scanner Using Grouped Endpoint Architecture

    Detects MULTIPLE pattern types in one scan:
    - Backside B + A Plus + LC D2
    - Or any combination of patterns
    """

    def __init__(self, ...):
        # Multiple pattern parameters
        self.params = {
            'backside_b': {...},
            'a_plus': {...},
            'lc_d2': {...},
        }

    def detect_patterns(self, df):
        """
        Detect MULTIPLE pattern types

        Returns: Dictionary of DataFrames:
        {
            'backside_b': DataFrame(...),
            'a_plus': DataFrame(...),
            'lc_d2': DataFrame(...),
        }
        """
        signals = {
            'backside_b': [],
            'a_plus': [],
            'lc_d2': [],
        }

        for ticker in tickers:
            # Check each pattern type
            if self._check_backside_b(ticker_data):
                signals['backside_b'].append(...)
            if self._check_a_plus(ticker_data):
                signals['a_plus'].append(...)
            if self._check_lc_d2(ticker_data):
                signals['lc_d2'].append(...)

        return {k: pd.DataFrame(v) for k, v in signals.items()}
```

### How Renata Determines Structure Type

```python
def determine_structure_type(user_code: str) -> str:
    """
    Determine if user code is single-scan or multi-scan

    Indicators of MULTI-SCAN:
    - Multiple parameter sets
    - Multiple pattern detection methods
    - Returns dictionary or list of signals
    - Class name contains 'Multi' or 'Combined'

    Indicators of SINGLE-SCAN:
    - Single parameter set
    - Single pattern detection logic
    - Returns DataFrame
    - Specific pattern in class name
    """
    has_multiple_params = len(re.findall(r'self\.(\w+_params)', user_code)) > 1
    has_multiple_patterns = len(re.findall(r'def.*check.*pattern', user_code)) > 2
    returns_dict = 'return {' in user_code and 'signals' in user_code

    if has_multiple_params or has_multiple_patterns or returns_dict:
        return 'multi-scan'
    else:
        return 'single-scan'
```

### CRITICAL: Freedom to Handle ANY Scanner Type

**Renata is NOT limited to known scanner types!**

```python
# ✅ CORRECT: Handle new scanner types
def categorize_scanner(user_code: str) -> dict:
    """
    Categorize scanner into single-scan or multi-scan
    Extract unique logic and parameters
    Apply EdgeDev structure to UNCODE patterns
    """
    # Step 1: Determine structure type
    structure_type = determine_structure_type(user_code)

    # Step 2: Extract unique logic
    pattern_logic = extract_pattern_logic(user_code)

    # Step 3: Extract parameters
    parameters = extract_parameters(user_code)

    # Step 4: Apply appropriate structure template
    if structure_type == 'single-scan':
        return apply_single_scan_structure(pattern_logic, parameters)
    else:
        return apply_multi_scan_structure(pattern_logic, parameters)

# ❌ WRONG: Only handle known types
def categorize_scanner_wrong(user_code: str) -> str:
    """
    This would LIMIT Renata to existing scanner types
    """
    known_types = ['backside_b', 'a_plus', 'lc_d2', 'd1_gap']

    for scanner_type in known_types:
        if scanner_type in user_code.lower():
            return scanner_type

    return 'unknown'  # ❌ Fails for new scanner types!
```

### Example: Handling a Completely New Scanner Type

```python
# User submits code for "Golden Cross Death Cross" scanner
# (Not in existing templates)

class GoldenCrossScanner:
    def __init__(self):
        # User's unique parameters
        self.fast_period = 50
        self.slow_period = 200
        self.confirmation_days = 3

    def detect_crossings(self, df):
        # User's unique logic
        signals = []
        for ticker in tickers:
            if self._golden_cross_formed(ticker):
                signals.append(...)
        return signals

# Renata analyzes and standardizes:

class GroupedEndpointGoldenCrossScanner:
    """
    Golden Cross Scanner Using Grouped Endpoint Architecture

    [Renata LEARNED the pattern from user's code]
    [Renata APPLIED EdgeDev structure to user's UNIQUE logic]
    """

    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        # PRESERVED: User's unique parameters
        self.params = {
            'fast_period': 50,
            'slow_period': 200,
            'confirmation_days': 3,
        }

        # ADDED: EdgeDev standardizations
        self.session = requests.Session()  # Connection pooling
        self.stage1_workers = 5  # Thread pooling
        self.stage3_workers = 10

    def fetch_all_grouped_data(self, trading_dates):
        # ADDED: Grouped endpoint (wasn't in original)
        # User's code didn't have this!
        ...

    def apply_smart_filters(self, df):
        # ADDED: Smart filters based on user's parameters
        # Uses fast_period and slow_period to filter
        ...

    def detect_patterns(self, df):
        # PRESERVED: User's unique crossing detection logic
        # STANDARDIZED: Now uses vectorized operations
        # STANDARDIZED: Now uses parallel processing
        ...

# Result: User's UNIQUE scanner with EdgeDev STANDARDIZATIONS!
```

---

## Deterministic Formatting Rules

### Rule 1: Scanner Type Detection
```python
# Determine scanner type from:
# 1. Class name keywords
# 2. Parameter patterns
# 3. Method names
# 4. Pattern logic

SCANNER_TYPES = {
    'backside_b': {
        'keywords': ['backside', 'parabolic', 'breakdown'],
        'params': ['pos_abs_max', 'abs_lookback_days', 'd1_green_atr_min'],
        'unique_methods': ['abs_window_analysis', 'mold_check']
    },
    'a_plus': {
        'keywords': ['a_plus', 'a plus', 'parabolic'],
        'params': ['slope3d_min', 'slope15d_min', 'high_ema20_mult'],
        'unique_methods': ['atr_expansion_check']
    },
    'lc_d2': {
        'keywords': ['lc', 'frontside', 'd2', 'extended'],
        'params': ['lc_lookback', 'd2_extended'],
        'unique_methods': ['lc_pattern_check', 'd2_extension_check']
    }
}
```

### Rule 2: Parameter Preservation
```python
# MUST PRESERVE:
# - Original parameter names
# - Original parameter values
# - Original parameter structure

# MUST STANDARDIZE:
# - Parameter dictionary structure (self.params = {...})
# - Parameter types (explicit type hints)
# - Parameter organization (group related params)
```

### Rule 3: Method Preservation
```python
# MUST PRESERVE:
# - Unique pattern detection methods
# - Custom analysis methods
# - Original logic flow

# MUST STANDARDIZE:
# - Method signatures (type hints, parameter order)
# - Method documentation (docstrings)
# - Method organization (Stage 1/2/3 structure)
```

### Rule 4: Class Name Handling
```python
# PRESERVE ORIGINAL CLASS NAME:
# - Keep user's class name (e.g., "MyCustomBacksideScanner")
# - Don't force rename to "GroupedEndpointBacksideBScanner"

# EXCEPTION: If class name is generic/uninformative:
# - "Scanner" → "BacksideBScanner" (if pattern detected)
# - "MyScanner" → "APlusScanner" (if pattern detected)
```

---

## What Gets Preserved

1. **Original scanner logic** (pattern detection rules)
2. **Original parameters** (names, values, structure)
3. **Original class name** (unless generic)
4. **Unique methods** (custom analysis, pattern checks)
5. **Target market/date range** (user's intended scan range)

---

## What Gets Standardized

1. **File structure** (header, imports, class organization)
2. **3-stage architecture** (grouped fetch → smart filters → full features)
3. **Column naming** (EMA_9, ATR, Prev_High, etc.)
4. **Code patterns** (vectorized operations, parallel processing)
5. **Optimizations** (add missing grouped endpoints, thread pooling, connection pooling)
6. **Documentation** (docstrings, comments, progress reporting)

---

## Mandatory EdgeDev Standardizations Checklist

**Renata MUST ensure ALL of these are present in formatted code**:

### 1. Grouped Endpoint (Full Market Scanning)
```python
# ✅ REQUIRED: Fetch all tickers for all dates
url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"

# ❌ FORBIDDEN: Per-ticker fetching (too slow, too many API calls)
# url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
```

### 2. Thread Pooling (Parallel Processing)
```python
# ✅ REQUIRED: Parallel data fetching
with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
    futures = [executor.submit(self._fetch_grouped_day, date) for date in dates]

# ✅ REQUIRED: Parallel pattern detection
with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
    futures = [executor.submit(self.process_ticker_3, data) for data in ticker_data]
```

### 3. Polygon API Integration
```python
# ✅ REQUIRED: Use user's Polygon API key
self.api_key = api_key  # Parameter in __init__
self.base_url = "https://api.polygon.io"

# ✅ REQUIRED: Include in all API calls
params = {"apiKey": self.api_key, "adjusted": "true"}
```

### 4. Smart Filtering (Parameter-Based)
```python
# ✅ REQUIRED: Filter based on scanner's parameters
df_output_filtered = df_output_range[
    (df_output_range['prev_close'] >= self.params['price_min']) &
    (df_output_range['ADV20_$'] >= self.params['adv20_min_usd'])
]

# ❌ FORBIDDEN: Generic filters that don't match scanner parameters
# df = df[df['close'] > 10]  # Arbitrary value not from scanner params
```

### 5. Vectorized Operations
```python
# ✅ REQUIRED: Vectorized DataFrame operations
df['EMA_9'] = df.groupby('ticker')['close'].transform(
    lambda x: x.ewm(span=9, adjust=False).mean()
)

# ❌ FORBIDDEN: Row-by-row loops
# for idx, row in df.iterrows():  # ❌ SLOW
#     row['EMA_9'] = calculate_ema(...)  # ❌ SLOW
```

### 6. Connection Pooling
```python
# ✅ REQUIRED: Session with connection pooling
self.session = requests.Session()
self.session.mount('https://', requests.adapters.HTTPAdapter(
    pool_connections=100,
    pool_maxsize=100,
    max_retries=2,
    pool_block=False
))
```

### 7. Date Range Configuration
```python
# ✅ REQUIRED: Configurable date range (via __init__ parameters)
def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
    self.d0_start = d0_start or self.DEFAULT_D0_START
    self.d0_end = d0_end or self.DEFAULT_D0_END

    # Calculate historical data range
    lookback_buffer = self.params.get('abs_lookback_days', 1000) + 50
    scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
    self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
```

---

## Validation Requirements

**Renata MUST validate all output code for**:

### 1. Syntax Validation
```python
# ✅ Must check for:
# - Unmatched brackets/parentheses
# - Missing colons
# - Indentation errors
# - Undefined variables
# - Import errors

def validate_syntax(code: str) -> bool:
    """Check if code has valid Python syntax"""
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError as e:
        return False
```

### 2. Structure Validation
```python
# ✅ Must check for:
# - Has 3-stage architecture
# - Has grouped endpoint
# - Has smart filters
# - Has parallel processing
# - Has all required methods

def validate_structure(code: str) -> dict:
    """Check if code follows EdgeDev structure"""
    checks = {
        'has_grouped_endpoint': 'fetch_all_grouped_data' in code,
        'has_smart_filters': 'apply_smart_filters' in code,
        'has_parallel_processing': 'ThreadPoolExecutor' in code,
        'has_stage1': 'compute_simple_features' in code or 'fetch_all_grouped_data' in code,
        'has_stage2': 'apply_smart_filters' in code,
        'has_stage3': 'detect_patterns' in code or 'compute_full_features' in code,
    }
    return checks
```

### 3. Standardization Validation
```python
# ✅ Must check for:
# - Vectorized operations (no iterrows loops)
# - Connection pooling (requests.Session)
# - Column naming (EMA_9, ATR, Prev_High, etc.)
# - Parameter preservation (original params kept)

def validate_standardizations(code: str) -> dict:
    """Check if code has all EdgeDev standardizations"""
    checks = {
        'has_connection_pooling': 'requests.Session()' in code,
        'uses_vectorized': 'groupby' in code and 'transform' in code,
        'no_slow_loops': ".iterrows()" not in code,
        'column_naming': all(col in code for col in ['EMA_9', 'ATR', 'Prev_High']),
        'params_preserved': 'self.params' in code,
    }
    return checks
```

### 4. Execution Validation (Optional, if environment allows)
```python
# ✅ Should check for:
# - Code runs without errors
# - No runtime exceptions
# - Returns expected output format
# - Completes in reasonable time

def validate_execution(code: str) -> dict:
    """Test if code actually runs"""
    try:
        # Execute in sandboxed environment
        result = execute_code_safely(code)
        return {'runs': True, 'output': result}
    except Exception as e:
        return {'runs': False, 'error': str(e)}
```

---

## Date Range Configuration

**Requirements**:
1. Scanner MUST accept `d0_start` and `d0_end` as parameters
2. Scanner MUST calculate historical data range automatically
3. Date range MUST be configurable via dashboard

```python
def __init__(
    self,
    api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
    d0_start: str = None,
    d0_end: str = None
):
    # Default date range (can be overridden)
    self.DEFAULT_D0_START = "2025-01-01"
    self.DEFAULT_D0_END = "2025-12-31"

    # Use command-line args if provided, else defaults
    self.d0_start = d0_start or self.DEFAULT_D0_START
    self.d0_end = d0_end or self.DEFAULT_D0_END

    # Calculate historical data range (based on scanner's needs)
    lookback_buffer = self.params.get('abs_lookback_days', 1000) + 50
    scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
    self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
    self.scan_end = self.d0_end

    # Print range info
    print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
    print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")
```

**Note**: Dashboard integration (changing date range via UI) is separate from Renata formatting, but code MUST be structured to support it.

---

## Reference Templates

**Accurate EdgeDev template files** (confirmed by user):

### Single-Scan Templates
1. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/backside_b/fixed_formatted.py`
2. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/a_plus_para/fixed_formatted.py`
3. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/d1_gap/fixed_formatted.py`
4. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/extended_gap/fixed_formatted.py`
5. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_3d_gap/fixed_formatted.py`
6. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_d2/fixed_formatted lc d2.py`
7. `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/sc_dmr/fixed_formatted sc dmr.py`

### Multi-Scan Templates
(TBD - need to identify which templates are multi-scan examples)

**How Templates Are Used**:
- ✅ Teach structure (single-scan vs multi-scan)
- ✅ Show standardization patterns (grouped endpoint, smart filters, etc.)
- ✅ Provide reference for code quality and organization
- ❌ NOT for copy-pasting into user code
- ❌ NOT for restricting to known scanner types

---

## Validation Checklist

### Structural Validation
- [ ] Has proper file header with description
- [ ] Uses 3-stage architecture (Stage 1/2/3 comments)
- [ ] Stage 1: Uses grouped endpoint
- [ ] Stage 2: Has smart filters
- [ ] Stage 3: Has parallel processing
- [ ] Has proper main entry point

### Code Quality Validation
- [ ] Uses vectorized operations (no loops in feature computation)
- [ ] Uses ThreadPoolExecutor for parallel processing
- [ ] Uses connection pooling (requests.Session)
- [ ] Has proper error handling
- [ ] Has progress reporting

### Naming Validation
- [ ] Column names match EdgeDev standards (EMA_9, ATR, Prev_High, etc.)
- [ ] Method names follow conventions (compute_simple_features, etc.)
- [ ] Class name preserved from original (unless generic)

### Logic Validation
- [ ] Original pattern logic preserved
- [ ] Original parameters preserved (names, values)
- [ ] Original scanner type detected correctly
- [ ] No false negatives (finds same signals as original)

### Performance Validation
- [ ] Uses grouped endpoint (not per-ticker)
- [ ] Has smart filters (reduces dataset by ~99%)
- [ ] Parallel processing configured (stage1_workers, stage3_workers)
- [ ] Vectorized ABS window calculation (no function calls in loop)

---

## Next Steps

Once this framework is approved:

1. **Build deterministic scanner type detector**
2. **Build template matcher** (finds closest template for each scanner type)
3. **Build formatter** (applies standardization while preserving logic)
4. **Build validator** (ensures output meets all standards)
5. **Build test suite** (validates deterministic output)

---

**Status**: Awaiting user approval before implementation.

**Questions for User**:
1. Is this framework complete and accurate?
2. Any missing rules or patterns?
3. Any incorrect assumptions?
4. Ready to proceed with implementation?
