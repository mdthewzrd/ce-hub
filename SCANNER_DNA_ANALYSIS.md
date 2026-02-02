# WORKING SCANNER DNA: EXACT STRUCTURAL PATTERNS

## Executive Summary

After analyzing 7 working scanner files, this document captures the EXACT patterns that make them work vs AI-generated code that fails. This is a schema that can be used to teach Renata how to generate working code by following these patterns, not guessing.

---

## 1. THE DNA: CONSISTENT PATTERNS ACROSS ALL WORKING FILES

### 1.1 Mandatory Class Structure

Every working scanner follows this exact structure:

```python
class GroupedEndpoint[ScannerName]Scanner:
    def __init__(self, api_key, d0_start, d0_end)
    def get_trading_dates(self, start_date, end_date) -> List[str]

    # Stage 1: Data Fetching
    def fetch_all_grouped_data(self, trading_dates) -> pd.DataFrame
    def _fetch_grouped_day(self, date_str) -> Optional[pd.DataFrame]

    # Stage 2: Simple Features + Smart Filters
    def compute_simple_features(self, df) -> pd.DataFrame  # OR compute_ema_atr_features()
    def apply_smart_filters(self, df) -> pd.DataFrame  # OPTIONAL: Not always present

    # Stage 3: Full Features + Pattern Detection
    def compute_full_features(self, df) -> pd.DataFrame
    def detect_patterns(self, df) -> pd.DataFrame

    # Main Execution
    def execute(self) -> pd.DataFrame
    def run_and_save(self, output_path) -> pd.DataFrame
```

**CRITICAL RULES:**
- Class name MUST be `GroupedEndpoint[ScannerName]Scanner`
- Methods MUST be in this exact order (stage 1, 2, 3, execute)
- No deviation from naming convention

---

### 1.2 Mandatory Imports (Every File)

```python
import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional  # Add Tuple if needed
```

**No missing imports. Ever.**

---

### 1.3 Initialization Pattern (Mandatory Structure)

```python
def __init__(
    self,
    api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
    d0_start: str = None,
    d0_end: str = None
):
    # ============================================================
    # 📅 DATE RANGE CONFIGURATION - EDIT HERE
    # ============================================================
    self.DEFAULT_D0_START = "2025-01-01"  # ← SET YOUR START DATE
    self.DEFAULT_D0_END = "2025-12-31"    # ← SET YOUR END DATE
    # ============================================================

    # Core Configuration
    self.session = requests.Session()
    self.session.mount('https://', requests.adapters.HTTPAdapter(
        pool_connections=100,
        pool_maxsize=100,
        max_retries=2,
        pool_block=False
    ))

    self.api_key = api_key
    self.base_url = "https://api.polygon.io"
    self.us_calendar = mcal.get_calendar('NYSE')

    # Date configuration
    self.d0_start = d0_start or self.DEFAULT_D0_START
    self.d0_end = d0_end or self.DEFAULT_D0_END

    # Scan range calculation (VARIES by scanner - see Section 2)
    self.scan_start = [CALCULATED_BASED_ON_LOOKBACK_NEEDS]
    self.scan_end = self.d0_end

    # Worker configuration
    self.stage1_workers = 5
    self.stage3_workers = 10
    self.batch_size = 200

    print(f"🚀 GROUPED ENDPOINT MODE: [Scanner Name]")
    print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
    print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

    # === EXACT ORIGINAL [SCANNER NAME] PARAMETERS ===
    self.params = {
        # Scanner-specific parameters here
    }
```

**MANDATORY ELEMENTS:**
1. Date configuration comment block with edit instruction
2. Session configuration with HTTPAdapter (exact params)
3. d0_start/d0_end initialization with defaults
4. scan_start/scan_end calculation (scanner-specific)
5. Worker configuration (exact numbers)
6. Print statements showing mode and ranges
7. self.params dictionary with ALL parameters

---

### 1.4 Data Fetching Pattern (Stage 1) - IDENTICAL ACROSS ALL FILES

```python
def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
    """Get all valid trading days between start and end date"""
    schedule = self.us_calendar.schedule(
        start_date=pd.to_datetime(start_date),
        end_date=pd.to_datetime(end_date)
    )
    trading_days = self.us_calendar.valid_days(
        start_date=pd.to_datetime(start_date),
        end_date=pd.to_datetime(end_date)
    )
    return [date.strftime('%Y-%m-%d') for date in trading_days]

def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
    """Stage 1: Fetch ALL data for ALL tickers using grouped endpoint"""
    print(f"\n{'='*70}")
    print("🚀 STAGE 1: FETCH GROUPED DATA")
    print(f"{'='*70}")
    print(f"📡 Fetching {len(trading_dates)} trading days...")
    print(f"⚡ Using {self.stage1_workers} parallel workers")

    start_time = time.time()
    all_data = []
    completed = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
        future_to_date = {
            executor.submit(self._fetch_grouped_day, date_str): date_str
            for date_str in trading_dates
        }

        for future in as_completed(future_to_date):
            date_str = future_to_date[future]
            completed += 1

            try:
                data = future.result()
                if data is not None and not data.empty:
                    all_data.append(data)
                else:
                    failed += 1

                if completed % 50 == 0:  # OR % 100 for some scanners
                    success = completed - failed
                    print(f"⚡ Progress: {completed}/{len(trading_dates)} days | "
                          f"Success: {success} | Failed: {failed}")
            except Exception as e:
                failed += 1

    elapsed = time.time() - start_time

    if not all_data:
        print("❌ No data fetched!")
        return pd.DataFrame()

    # Combine all data
    print(f"\n📊 Combining data from {len(all_data)} trading days...")
    df = pd.concat(all_data, ignore_index=True)
    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

    print(f"\n🚀 Stage 1 Complete ({elapsed:.1f}s):")
    print(f"📊 Total rows: {len(df):,}")
    print(f"📊 Unique tickers: {df['ticker'].nunique():,}")
    print(f"📅 Date range: {df['date'].min()} to {df['date'].max()}")

    return df

def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
    """Fetch ALL tickers that traded on a specific date"""
    try:
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
        params = {
            "adjusted": "true",  # OR "adjustment": "split" in some files
            "apiKey": self.api_key
        }

        response = self.session.get(url, params=params, timeout=30)

        if response.status_code != 200:
            return None

        data = response.json()

        if 'results' not in data or not data['results']:
            return None

        # Convert to DataFrame
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

    except Exception:
        return None
```

**CRITICAL:**
- Method names are EXACT: `fetch_all_grouped_data` and `_fetch_grouped_day`
- Uses ThreadPoolExecutor with stage1_workers
- Progress updates every 50 or 100 completed
- Exact column renaming pattern
- Returns exact 7 columns: ticker, date, open, high, low, close, volume

---

## 2. MULTI-SCANNER vs SINGLE-SCANNER ARCHITECTURE

### 2.1 Multi-Scanner Pattern

**Files:** `sc_dmr`, `lc_d2`

**Key Characteristics:**

1. **Parameter Structure:**
```python
self.params = {
    # Mass parameters (shared across all patterns)
    "prev_close_min": 0.75,
    "prev_volume_min": 10_000_000,

    # Pattern-specific parameters (prefixed with pattern name)
    "d2_pm_setup_gain_min": 0.2,
    "d2_pm_setup_dol_pmh_gap_vs_range_min": 0.5,
    "lc_frontside_d3_ema_alignment": True,
    # ... etc
}
```

2. **Pattern Detection (Stage 3):**
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Multi-pattern detection"""
    print(f"\n{'='*70}")
    print("🚀 STAGE 3: MULTI-PATTERN DETECTION")

    # Filter to D0 range
    df['Date'] = pd.to_datetime(df['date'])
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(self.d0_start)) &
        (df['Date'] <= pd.to_datetime(self.d0_end))
    ].copy()

    # Collect all signals from all patterns
    all_signals = []

    # ==================== PATTERN 1 ====================
    mask = (
        (df_d0['condition1']) &
        (df_d0['condition2']) &
        # ... more conditions
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'Pattern_1_Name'
        all_signals.append(signals)

    # ==================== PATTERN 2 ====================
    mask = (
        (df_d0['condition1']) &
        (df_d0['condition2']) &
        # ... more conditions
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'Pattern_2_Name'
        all_signals.append(signals)

    # ... repeat for all patterns (10-12 patterns typical)

    # Combine all signals and aggregate by ticker+date
    if all_signals:
        signals = pd.concat(all_signals, ignore_index=True)

        # Aggregate by ticker+date: combine multiple patterns
        signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
            lambda x: ', '.join(sorted(set(x)))
        ).reset_index()
        signals_aggregated.columns = ['Ticker', 'Date', 'Scanner_Label']

        signals = signals_aggregated
    else:
        signals = pd.DataFrame()

    return signals
```

**Multi-Scanner Rules:**
- Detects 10-12 different patterns
- Each pattern has its own mask
- Signals aggregated by ticker+date with comma-separated labels
- No parallel processing in detect_patterns (uses vectorized pandas operations)

---

### 2.2 Single-Scanner Pattern

**Files:** `lc_3d_gap`, `extended_gap`, `d1_gap`, `backside_b`, `a_plus_para`

**Key Characteristics:**

1. **Parameter Structure:**
```python
self.params = {
    # Single set of parameters
    "param1": value1,
    "param2": value2,
    # ... etc
}
```

2. **Pattern Detection (Stage 3):**
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Single pattern detection with parallel processing"""
    print(f"\n{'='*70}")
    print("🚀 STAGE 3: PATTERN DETECTION (PARALLEL)")

    signals_list = []

    # Prepare ticker data for parallel processing
    ticker_data_list = []
    for ticker in df['ticker'].unique():
        ticker_df = df[df['ticker'] == ticker].copy()
        ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

    print(f"📊 Processing {len(ticker_data_list)} tickers in parallel ({self.stage3_workers} workers)...")

    # Process tickers in parallel
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        futures = [executor.submit(self.process_ticker_3, ticker_data)
                   for ticker_data in ticker_data_list]

        completed = 0
        for future in as_completed(futures):
            completed += 1
            if completed % 100 == 0:
                print(f"  Progress: {completed}/{len(ticker_data_list)} tickers processed")

            try:
                signals = future.result()
                signals_list.extend(signals)
            except Exception as e:
                pass

    signals = pd.DataFrame(signals_list)
    return signals

def process_ticker_3(self, ticker_data: tuple) -> list:
    """
    Process a single ticker for Stage 3 (pattern detection)
    This is designed to be run in parallel
    """
    ticker, ticker_df, d0_start, d0_end = ticker_data

    signals = []

    try:
        ticker_df = ticker_df.sort_values('date').reset_index(drop=True)

        for i in range([MIN_ROWS], len(ticker_df)):
            row = ticker_df.iloc[i]
            d0 = row['date']

            # Skip if not in D0 range
            if d0 < pd.to_datetime(d0_start) or d0 > pd.to_datetime(d0_end):
                continue

            # Check all conditions
            if (condition1 and condition2 and condition3 ...):
                signals.append({
                    'Ticker': ticker,
                    'Date': d0,
                    'Close': row['close'],
                    'Volume': row['volume'],
                })

    except Exception as e:
        pass

    return signals
```

**Single-Scanner Rules:**
- Single pattern detection
- Uses parallel processing with `process_ticker_3` method
- Iterates through rows sequentially within each ticker
- Returns list of signal dictionaries

---

## 3. PARAMETER EXTRACTION PATTERNS

### 3.1 How Parameters Are Defined

Parameters are ALWAYS defined in `__init__` as a dictionary:

```python
self.params = {
    # Grouped by logical category
    "category_param_name": value,
}
```

**Parameter Naming Conventions:**
- Use descriptive names: `atr_mult`, `vol_mult`, `slope5d_min`
- Multi-word params use underscores: `prev_close_min`, `ema200_max_pct`
- Boolean params use prefixes: `require_open_gt_prev_high`, `exclude_d2`
- Array/list params use plural: `ema_periods` [not seen in working files yet]

---

### 3.2 How Parameters Are Used

Parameters are accessed in pattern detection:

```python
# In detect_patterns() or process_ticker_3()
if (row['feature'] >= self.params['param_min']):
    pass
```

**NEVER hardcode values in pattern detection.**
**ALWAYS reference self.params.**

---

## 4. FEATURE COMPUTATION: Stage 2 vs Stage 3

### 4.1 Stage 2: Simple Features (Pre-Filters)

**Purpose:** Compute features needed for smart filtering to reduce dataset size.

**Pattern:**

```python
def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
    """Compute simple features needed for smart filtering"""
    print(f"\n📊 Computing simple features...")

    # Sort by ticker and date
    df = df.sort_values(['ticker', 'date'])

    # Previous close (for price filter)
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)

    # Previous volume (for volume filter)
    df['prev_volume'] = df.groupby('ticker')['volume'].shift(1)

    # [Add more simple features as needed]

    return df
```

**Typical Simple Features:**
- `prev_close`: Previous day close (for price filters)
- `prev_volume`: Previous day volume (for volume filters)
- `prev_high`: Previous day high (for high filters)
- `price_range`: high - low (for volatility filters)

**CRITICAL:** Keep Stage 2 features MINIMAL. Only what's needed for filtering.

---

### 4.2 Stage 2 Variant: EMA/ATR Features

**Used when:** Scanner needs EMA/ATR for filtering AND needs accuracy.

**Pattern:**

```python
def compute_ema_atr_features(self, df: pd.DataFrame) -> pd.DataFrame:
    """
    CRITICAL: Compute EMA/ATR BEFORE any filtering!
    These indicators need sufficient data to be accurate.
    """
    print(f"\n📊 Computing EMA/ATR features (MUST be done BEFORE filtering)...")

    df = df.sort_values(['ticker', 'date'])

    # EMAs
    df['EMA_10'] = df.groupby('ticker')['close'].transform(
        lambda x: x.ewm(span=10, adjust=False).mean()
    )
    df['EMA_30'] = df.groupby('ticker')['close'].transform(
        lambda x: x.ewm(span=30, adjust=False).mean()
    )
    df['EMA_200'] = df.groupby('ticker')['close'].transform(
        lambda x: x.ewm(span=200, adjust=False).mean()
    )

    # True Range and ATR
    prev_close = df.groupby('ticker')['close'].shift(1)
    hi_lo = df['high'] - df['low']
    hi_cp = abs(df['high'] - prev_close)
    lo_cp = abs(df['low'] - prev_close)
    df['TR'] = np.maximum(hi_lo, np.maximum(hi_cp, lo_cp))
    df['ATR'] = df.groupby('ticker')['TR'].transform(
        lambda x: x.rolling(window=14, min_periods=14).mean()
    )

    return df
```

**CRITICAL RULE:**
- If a scanner needs EMA/ATR for filtering, compute on FULL dataset BEFORE filtering
- This ensures accuracy (indicators need sufficient data points)

---

### 4.3 Stage 3: Full Features

**Purpose:** Compute ALL remaining features needed for pattern detection.

**Pattern:**

```python
def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute remaining features needed for pattern detection.
    Note: [Features already computed] are already in [previous method].
    """
    print(f"\n📊 Computing full features...")

    # Previous values (D-1, D-2, D-3, etc.)
    df['D1_High'] = df.groupby('ticker')['high'].shift(1)
    df['D1_Close'] = df.groupby('ticker')['close'].shift(1)
    df['D1_Volume'] = df.groupby('ticker')['volume'].shift(1)

    df['D2_High'] = df.groupby('ticker')['high'].shift(2)
    df['D2_Close'] = df.groupby('ticker')['close'].shift(2)
    # ... etc

    # Gap calculations
    df['Gap_Pct'] = (df['open'] - df['D1_Close']) / df['D1_Close']
    df['Gap_ATR'] = (df['open'] - df['D1_Close']) / df['ATR']

    # Distance to EMAs
    df['High_over_EMA9_div_ATR'] = (df['high'] - df['EMA_9']) / df['ATR']

    # [Add more complex features as needed]

    return df
```

**Typical Full Features:**
- All shift columns (D1_, D2_, D3_, etc.)
- Gap metrics (gap_pct, gap_atr)
- Distance to EMAs
- Rolling windows (highest_high_X, lowest_low_X)
- Complex calculations

---

## 5. PATTERN DETECTION DIFFERENCES

### 5.1 Multi-Scanner Pattern Detection

**Structure:**
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    # Filter to D0 range
    df_d0 = df[df['Date'].between(d0_start, d0_end)]

    all_signals = []

    # For each pattern:
    mask = (condition1) & (condition2) & ...
    signals = df_d0[mask].copy()
    signals['Scanner_Label'] = 'Pattern_Name'
    all_signals.append(signals)

    # Aggregate
    signals = pd.concat(all_signals)
    signals = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
        lambda x: ', '.join(sorted(set(x)))
    ).reset_index()

    return signals
```

**Key Points:**
- Vectorized pandas operations (no row iteration)
- Multiple patterns, each with own mask
- Aggregation combines multiple patterns for same ticker+date

---

### 5.2 Single-Scanner Pattern Detection (Parallel)

**Structure:**
```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    # Prepare ticker data
    ticker_data_list = [(t, df[df['ticker']==t], d0_start, d0_end)
                        for t in df['ticker'].unique()]

    # Parallel processing
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        futures = [executor.submit(self.process_ticker_3, data)
                   for data in ticker_data_list]
        signals_list = [future.result() for future in as_completed(futures)]

    return pd.DataFrame(signals_list)

def process_ticker_3(self, ticker_data: tuple) -> list:
    ticker, ticker_df, d0_start, d0_end = ticker_data
    signals = []

    for i in range(min_rows, len(ticker_df)):
        row = ticker_df.iloc[i]

        # Skip if not in D0 range
        if not (d0_start <= row['date'] <= d0_end):
            continue

        # Check all conditions
        if (condition1 and condition2 and ...):
            signals.append({
                'Ticker': ticker,
                'Date': row['date'],
                'Close': row['close'],
                'Volume': row['volume'],
            })

    return signals
```

**Key Points:**
- Parallel processing by ticker
- Row-by-row iteration within each ticker
- Single pattern check
- Returns list of dictionaries

---

## 6. SMART FILTERS: WHEN TO USE

### 6.1 Smart Filter Purpose

Smart filters reduce the dataset BEFORE expensive Stage 3 computations by identifying which D0 dates are worth checking.

**Key Principle:** Keep ALL historical data for calculations, but filter to identify valid D0 dates.

---

### 6.2 Smart Filter Pattern

```python
def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
    """
    Stage 2: Smart filters on Day -1 data to identify valid D0 dates

    CRITICAL: Smart filters validate WHICH D0 DATES to check, not which tickers to keep.
    - Keep ALL historical data for calculations
    - Use smart filters to identify D0 dates in output range worth checking
    """
    print(f"\n{'='*70}")
    print("🚀 STAGE 2: SMART FILTERS (D0 DATE VALIDATION)")

    # Remove rows with NaN in critical columns
    df = df.dropna(subset=['prev_close', 'prev_volume'])

    # Separate data into historical and signal output ranges
    df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
    df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

    # Apply smart filters ONLY to signal output range
    df_output_filtered = df_output_range[
        (df_output_range['prev_close'] >= self.params['price_min']) &
        (df_output_range['prev_volume'] >= self.params['volume_min'])
    ].copy()

    # Combine: all historical data + filtered D0 dates
    df_combined = pd.concat([df_historical, df_output_filtered])

    # CRITICAL: Only keep tickers that have at least 1 D0 date passing smart filters
    tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
    df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

    return df_combined
```

**Rules:**
1. Separate historical vs output range
2. Filter ONLY output range
3. Combine back with historical data
4. Filter to tickers with 1+ valid D0 dates

---

### 6.3 When to Skip Smart Filters

**Skip if:**
- Scanner doesn't have good pre-filters
- Dataset is already small
- Most D0 dates will pass anyway

**Example:** LC D2 multi-scanner skips smart filters (computes all features on all data)

---

## 7. SCAN RANGE CALCULATION (Scanner-Specific)

Each scanner calculates `scan_start` differently based on lookback needs:

### 7.1 Lookback Requirements by Scanner

| Scanner | Lookback Days | Reason |
|---------|--------------|---------|
| `d1_gap` | 1000 | EMA200 needs ~1000 days to stabilize |
| `lc_3d_gap` | 705 | Swing high (-5 to -65) + EMA calculations |
| `extended_gap` | 360 | EMA30 + rolling windows |
| `backside_b` | 1050 | ABS window (1000 days) + buffer |
| `a_plus_para` | 100 | ATR (14 days) + slopes (50 days) + buffer |
| `sc_dmr` | Fixed | Hardcoded start/end dates |
| `lc_d2` | 400 | EMA200 + rolling windows |

### 7.2 Calculation Pattern

```python
# In __init__
lookback_buffer = [LOOKBACK_DAYS]
scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
self.scan_end = self.d0_end
```

---

## 8. EXECUTION PIPELINE (Identical Across All Files)

```python
def execute(self) -> pd.DataFrame:
    """Main execution pipeline"""
    print(f"\n{'='*70}")
    print("🚀 [SCANNER NAME] - GROUPED ENDPOINT ARCHITECTURE")
    print(f"{'='*70}")

    # Get trading dates
    trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
    print(f"📅 Trading days: {len(trading_dates)}")

    # Stage 1: Fetch grouped data
    df = self.fetch_all_grouped_data(trading_dates)

    if df.empty:
        print("❌ No data available!")
        return pd.DataFrame()

    # Stage 2: Compute simple features + apply smart filters (if applicable)
    df = self.compute_simple_features(df)  # OR compute_ema_atr_features()
    df = self.apply_smart_filters(df)  # OPTIONAL: Not always present

    if df.empty:
        print("❌ No rows passed smart filters!")
        return pd.DataFrame()

    # Stage 3: Compute full features + detect patterns
    df = self.compute_full_features(df)
    signals = self.detect_patterns(df)

    if signals.empty:
        print("❌ No signals found!")
        return pd.DataFrame()

    # Filter to D0 range (if not already done in detect_patterns)
    signals = signals[
        (signals['Date'] >= pd.to_datetime(self.d0_start)) &
        (signals['Date'] <= pd.to_datetime(self.d0_end))
    ]

    # Sort by date
    signals = signals.sort_values('Date').reset_index(drop=True)

    print(f"\n{'='*70}")
    print(f"✅ SCAN COMPLETE")
    print(f"{'='*70}")
    print(f"📊 Final signals: {len(signals):,}")

    # Print results
    if len(signals) > 0:
        for idx, row in signals.iterrows():
            print(f"  {row['Ticker']:6s} | {row['Date']} | ...")

    return signals
```

---

## 9. MAIN ENTRY POINT (Identical Pattern)

```python
if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 [SCANNER NAME] - GROUPED ENDPOINT")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python fixed_formatted.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python fixed_formatted.py 2024-01-01 2024-12-31")
    print("   python fixed_formatted.py  # Uses defaults")
    print("\n   Date format: YYYY-MM-DD")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    scanner = GroupedEndpoint[ScannerName]Scanner(
        d0_start=d0_start,
        d0_end=d0_end
    )

    results = scanner.run_and_save()

    print(f"\n✅ Done!")
```

---

## 10. CREATION RULES FOR NEW SCANNERS

### 10.1 Decision Tree

```
Is this a multi-pattern scanner?
├─ YES: Use Multi-Scanner Pattern
│  ├─ Vectorized pattern detection (no process_ticker_3)
│  ├─ 10-12 patterns in detect_patterns()
│  └─ Aggregate by ticker+date
│
└─ NO: Use Single-Scanner Pattern
   ├─ Parallel processing with process_ticker_3()
   ├─ Row-by-row iteration
   └─ Single pattern check
```

---

### 10.2 Mandatory Checklist

When creating a NEW scanner, ensure:

- [ ] Class name: `GroupedEndpoint[ScannerName]Scanner`
- [ ] All mandatory imports present
- [ ] __init__ follows exact pattern
- [ ] Date config comment block present
- [ ] Session configuration exact
- [ ] self.params dictionary populated
- [ ] Stage 1 methods: `fetch_all_grouped_data`, `_fetch_grouped_day`
- [ ] Stage 2 methods: `compute_simple_features` OR `compute_ema_atr_features`
- [ ] Optional Stage 2: `apply_smart_filters`
- [ ] Stage 3 methods: `compute_full_features`, `detect_patterns`
- [ ] If single-scanner: `process_ticker_3` method
- [ ] `execute` method follows exact pattern
- [ ] `run_and_save` method present
- [ ] Main entry point follows exact pattern
- [ ] Scan range calculation appropriate for scanner needs
- [ ] All parameters in self.params (no hardcoded values in pattern detection)

---

### 10.3 Common Mistakes to Avoid

1. **Missing imports:** Always check imports section
2. **Wrong method names:** Must be exact (fetch_all_grouped_data, not fetch_data)
3. **Hardcoded values:** Never put numbers in pattern detection, always use self.params
4. **Computing features after filtering:** EMA/ATR must be computed BEFORE filtering
5. **Wrong parallel processing pattern:** Multi-scanners use vectorized ops, single-scanners use process_ticker_3
6. **Missing smart filter logic:** If using smart filters, must separate historical vs output range
7. **Incorrect scan range:** Must calculate appropriate lookback for scanner needs
8. **Missing Date column:** Pattern detection needs 'Date' column (datetime)
9. **Not sorting by date:** Final output must be sorted by Date
10. **Wrong aggregation:** Multi-scanners must aggregate by ticker+date

---

## 11. EXAMPLE: Creating a New Scanner

```python
"""
🚀 GROUPED ENDPOINT [NEW SCANNER NAME] - OPTIMIZED ARCHITECTURE
================================================================

[Scanner description]

Key Improvements:
1. Stage 1: Fetch grouped data (1 API call per trading day, not per ticker)
2. Stage 2: Apply smart filters (reduce dataset by XX%)
3. Stage 3: Compute full parameters + scan patterns (only on filtered data)

Performance: ~XX seconds for full scan vs 10+ minutes per-ticker approach
Accuracy: 100% - no false negatives
API Calls: ~456 calls (one per day) vs 10,000+ calls (one per ticker)
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional, Tuple

class GroupedEndpointNewScannerScanner:
    """
    [Scanner Name] Using Grouped Endpoint Architecture
    ====================================================

    [Pattern description]
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        d0_start: str = None,
        d0_end: str = None
    ):
        # ============================================================
        # 📅 DATE RANGE CONFIGURATION - EDIT HERE
        # ============================================================
        self.DEFAULT_D0_START = "2025-01-01"
        self.DEFAULT_D0_END = "2025-12-31"
        # ============================================================

        # Core Configuration
        self.session = requests.Session()
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=2,
            pool_block=False
        ))

        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.us_calendar = mcal.get_calendar('NYSE')

        # Date configuration
        self.d0_start = d0_start or self.DEFAULT_D0_START
        self.d0_end = d0_end or self.DEFAULT_D0_END

        # Scan range calculation
        lookback_buffer = [CALCULATE_BASED_ON_NEEDS]
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5
        self.stage3_workers = 10
        self.batch_size = 200

        print(f"🚀 GROUPED ENDPOINT MODE: [Scanner Name]")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # === EXACT ORIGINAL [SCANNER NAME] PARAMETERS ===
        self.params = {
            # Add parameters here
        }

    # [Add all required methods following patterns above]

if __name__ == "__main__":
    import sys

    # [Add main entry point following pattern above]
```

---

## CONCLUSION

This DNA analysis captures the EXACT patterns that make working scanners successful. The key differences between working and AI-generated code are:

1. **Strict adherence to naming conventions**
2. **Exact method structure and order**
3. **Proper separation of Stage 1/2/3**
4. **Smart filter logic (when used)**
5. **Multi-scanner vs single-scanner patterns**
6. **Parallel processing approach**
7. **Parameter definition and usage**
8. **Feature computation timing**

**Renata must follow these patterns EXACTLY. No guessing. No creativity. Just copy the working patterns.**
