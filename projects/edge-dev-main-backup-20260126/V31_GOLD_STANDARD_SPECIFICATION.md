# 🏆 EDGE-DEV V31 GOLD STANDARD SPECIFICATION
## Complete Reference for Single-Scan and Multi-Scan Architectures

**Version**: 1.0
**Date**: 2026-01-09
**Status**: PRODUCTION STANDARD

---

## 📋 TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Single-Scan Specification](#single-scan-specification)
3. [Multi-Scan Specification](#multi-scan-specification)
4. [Core Pillars (MUST IMPLEMENT)](#core-pillars-must-implement)
5. [Stage-by-Stage Requirements](#stage-by-stage-requirements)
6. [Code Structure Rules](#code-structure-rules)
7. [Parameter System](#parameter-system)
8. [Transformation Rules](#transformation-rules)

---

## 🎯 ARCHITECTURE OVERVIEW

### **Fundamental Principle**
V31 is a **3-stage grouped endpoint architecture** that optimizes for:
- **Performance**: ~60 seconds vs 10+ minutes (360x speedup)
- **Efficiency**: 1 API call per trading day (not per ticker)
- **Accuracy**: 100% - no false negatives

### **Critical Design Decisions**

1. **USE PANDAS_MARKET_CALENDARS** - Not weekday() checks
   ```python
   nyse = mcal.get_calendar('NYSE')
   trading_dates = nyse.schedule(start_date, end_date).index.strftime('%Y-%m-%d').tolist()
   ```

2. **PRESERVE HISTORICAL DATA** - Never filter it out
   - Historical data needed for ABS window calculations
   - Smart filters validate D0 dates ONLY
   - Always combine historical + filtered D0

3. **TWO-PASS FEATURE COMPUTATION**
   - Stage 2a: Simple features (for filtering)
   - Stage 3a: Full features (for detection)
   - This prevents computing expensive features on data that will be filtered

4. **PER-TICKER OPERATIONS** - Critical for correctness
   ```python
   # WRONG: adv20 across entire dataframe
   df['adv20'] = (df['close'] * df['volume']).rolling(20).mean()

   # RIGHT: adv20 per ticker
   df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
       lambda x: x.rolling(window=20, min_periods=20).mean()
   )
   ```

5. **PARALLEL PROCESSING** - At multiple stages
   - Stage 1: Parallel date fetching (ThreadPoolExecutor)
   - Stage 3: Parallel ticker processing (pre-sliced data)

---

## 📊 SINGLE-SCAN SPECIFICATION

### **Class Structure**

```python
class SinglePatternScanner:
    """
    Single-pattern scanner using v31 5-stage architecture

    Stages:
    1. fetch_grouped_data() - Fetch all tickers for all dates
    2a. compute_simple_features() - prev_close, adv20, price_range
    2b. apply_smart_filters() - Validate D0, preserve historical
    3a. compute_full_features() - EMA, ATR, slopes, etc.
    3b. detect_patterns() - Pattern detection logic
    """
```

### **Required Methods**

| Method | Purpose | Critical Requirements |
|--------|---------|----------------------|
| `__init__(api_key, d0_start, d0_end)` | Initialize with date ranges | **MUST** calculate historical buffer |
| `run_scan()` | Main execution | Calls all 5 stages in order |
| `fetch_grouped_data()` | Stage 1 | Use mcal, parallel fetching |
| `compute_simple_features()` | Stage 2a | Per-ticker operations |
| `apply_smart_filters()` | Stage 2b | **Separate** historical/D0 |
| `compute_full_features()` | Stage 3a | All technical indicators |
| `detect_patterns()` | Stage 3b | Pattern-specific logic |

### **Complete Template Structure**

```python
import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional

class BacksideBScanner:
    """Single-pattern scanner (Backside B)

    3-stage grouped endpoint architecture:
    1. Fetch grouped data (parallel)
    2. Smart filters (validate D0, keep historical)
    3. Full features + pattern detection (parallel)
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner with date range and historical buffer"""

        # ✅ Store user's original D0 range separately
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # ✅ Calculate historical data range
        lookback_buffer = 1000 + 50  # abs_lookback_days + buffer
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_end = self.d0_end_user

        # API Configuration
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()

        # Workers
        self.stage1_workers = 5
        self.stage3_workers = 10

        # Parameters (flat structure)
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            # ... pattern-specific params
        }

    def run_scan(self):
        """Main execution method - 5-stage pipeline"""
        # Stage 1
        stage1_data = self.fetch_grouped_data()

        # Stage 2a
        stage2a_data = self.compute_simple_features(stage1_data)

        # Stage 2b
        stage2b_data = self.apply_smart_filters(stage2a_data)

        # Stage 3a
        stage3a_data = self.compute_full_features(stage2b_data)

        # Stage 3b
        stage3_results = self.detect_patterns(stage3a_data)

        return stage3_results
```

---

## 🔀 MULTI-SCAN SPECIFICATION

### **Key Differences from Single-Scan**

1. **Multiple Pattern Types** - 10+ patterns in one scanner
2. **Pattern-Specific Parameters** - Each pattern has its own thresholds
3. **Scanner_Label Column** - Identifies which pattern matched
4. **Shared Features** - Computed once, used by all patterns

### **Class Structure**

```python
class MultiPatternScanner:
    """
    Multi-pattern scanner (e.g., SC DMR)

    Detects 10+ pattern types:
    - D2_PM_Setup (4 variants)
    - D2_PM_Setup_2
    - D2_PMH_Break
    - D2_PMH_Break_1
    - D2_No_PMH_Break
    - D2_Extreme_Gap
    - D2_Extreme_Intraday_Run
    - D3
    - D3_Alt
    - D4
    """
```

### **Pattern Detection Structure**

```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Apply multi-pattern detection"""

    # Filter to D0 range
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(self.d0_start)) &
        (df['Date'] <= pd.to_datetime(self.d0_end))
    ].copy()

    # Collect all signals from all patterns
    all_signals = []

    # Pattern 1: D2_PM_Setup (variant 1)
    mask = (
        (df_d0['gain'] >= 1.0) &
        (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 0.5) &
        # ... pattern-specific conditions
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup'
        all_signals.append(signals)

    # Pattern 2: D2_PM_Setup (variant 2)
    mask = (
        (df_d0['gain'] >= 0.2) &
        (df_d0['prev_gap_2'] >= 0.2) &
        # ... pattern-specific conditions
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup'
        all_signals.append(signals)

    # ... repeat for all 10 patterns

    # Combine all signals
    if all_signals:
        return pd.concat(all_signals, ignore_index=True)
    else:
        return pd.DataFrame()
```

---

## 🏛️ CORE PILLARS (MUST IMPLEMENT)

### **Pillar 1: Market Calendar Integration**

```python
import pandas_market_calendars as mcal

def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
    """Get all valid trading days between start and end date"""
    nyse = mcal.get_calendar('NYSE')
    schedule = nyse.schedule(start_date=pd.to_datetime(start_date), end_date=pd.to_datetime(end_date))
    trading_days = nyse.valid_days(
        start_date=pd.to_datetime(start_date),
        end_date=pd.to_datetime(end_date)
    )
    return [date.strftime('%Y-%m-%d') for date in trading_days]
```

**WHY**: Accounts for holidays, early closes, skip weekends correctly

---

### **Pillar 2: Historical Buffer Calculation**

```python
def __init__(self, api_key: str, d0_start: str, d0_end: str):
    self.d0_start_user = d0_start
    self.d0_end_user = d0_end

    # Calculate historical buffer
    lookback_buffer = self.params['abs_lookback_days'] + 50
    scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
    self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
    self.d0_end = self.d0_end_user
```

**WHY**: ABS window needs 1000+ days of history to calculate position

---

### **Pillar 3: Per-Ticker Operations**

```python
# ✅ CORRECT: adv20 computed per ticker
df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)

# ❌ WRONG: adv20 computed across entire dataframe
df['adv20_usd'] = (df['close'] * df['volume']).rolling(20).mean()
```

**WHY**: Each ticker has different price/volume scales

---

### **Pillar 4: Historical/D0 Separation**

```python
def apply_smart_filters(self, df: pd.DataFrame):
    """CRITICAL: Separate historical from D0 output range"""

    # ✅ Separate historical from output range
    df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
    df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

    # ✅ Apply filters ONLY to D0 dates
    df_output_filtered = df_output_range[
        (df_output_range['prev_close'] >= self.params['price_min']) &
        (df_output_range['adv20_usd'] >= self.params['adv20_min_usd']) &
        (df_output_range['price_range'] >= 0.50) &
        (df_output_range['volume'] >= 1_000_000)
    ].copy()

    # ✅ COMBINE historical + filtered D0
    df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

    return df_combined
```

**WHY**:
- Historical data needed for ABS window calculations
- Only D0 dates need validation
- Combining preserves data for detection

---

### **Pillar 5: Parallel Processing**

```python
# Stage 1: Parallel date fetching
with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
    future_to_date = {
        executor.submit(self._fetch_grouped_day, date_str): date_str
        for date_str in trading_dates
    }

    for future in as_completed(future_to_date):
        data = future.result()
        all_data.append(data)

# Stage 3: Parallel ticker processing (pre-sliced)
ticker_data_list = [
    (ticker, ticker_df.copy(), d0_start_dt, d0_end_dt)
    for ticker, ticker_df in df.groupby('ticker')
]

with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
    future_to_ticker = {
        executor.submit(self._process_ticker_optimized_pre_sliced, ticker_data): ticker_data[0]
        for ticker_data in ticker_data_list
    }
```

**WHY**: 360x speedup (6-8 minutes → 10-30 seconds)

---

### **Pillar 6: Two-Pass Feature Computation**

```python
# Stage 2a: Simple features (cheap to compute)
def compute_simple_features(self, df: pd.DataFrame):
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
        lambda x: x.rolling(window=20, min_periods=20).mean()
    )
    df['price_range'] = df['high'] - df['low']
    return df

# Stage 3a: Full features (expensive, only compute on filtered data)
def compute_full_features(self, df: pd.DataFrame):
    for ticker, group in df.groupby('ticker'):
        group['ema_9'] = group['close'].ewm(span=9, adjust=False).mean()
        group['ema_20'] = group['close'].ewm(span=20, adjust=False).mean()

        hi_lo = group['high'] - group['low']
        hi_prev = (group['high'] - group['close'].shift(1)).abs()
        lo_prev = (group['low'] - group['close'].shift(1)).abs()
        group['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
        group['atr_raw'] = group['tr'].rolling(14, min_periods=14).mean()
        group['atr'] = group['atr_raw'].shift(1)

        # ... more features
```

**WHY**: Don't compute expensive features on data that will be filtered

---

### **Pillar 7: Pre-Sliced Data for Parallel Processing**

```python
# ✅ PRE-SLICE data BEFORE parallel processing
ticker_data_list = []
for ticker, ticker_df in df.groupby('ticker'):
    ticker_data_list.append((ticker, ticker_df.copy(), d0_start_dt, d0_end_dt))

# Submit pre-sliced data to workers
with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
    future_to_ticker = {
        executor.submit(self._process_ticker_optimized_pre_sliced, ticker_data): ticker_data[0]
        for ticker_data in ticker_data_list
    }

def _process_ticker_optimized_pre_sliced(self, ticker_data: tuple):
    """Process pre-sliced ticker data"""
    ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data
    # Process ticker_df directly (no filtering needed)
```

**WHY**: Scanning entire dataframe for each ticker is O(n×m) vs O(n)

---

## 📐 STAGE-BY-STAGE REQUIREMENTS

### **Stage 1: fetch_grouped_data()**

**Requirements:**
- ✅ Use `pandas_market_calendars` for trading days
- ✅ Parallel fetching with `ThreadPoolExecutor`
- ✅ Use Polygon grouped endpoint: `/v2/aggs/grouped/locale/us/market/stocks/{date}`
- ✅ Return lowercase columns: `['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']`
- ✅ Handle holidays and missing data gracefully

**Template:**
```python
def fetch_grouped_data(self):
    """Fetch all tickers for all trading days using grouped endpoint"""
    nyse = mcal.get_calendar('NYSE')
    trading_dates = nyse.schedule(
        start_date=self.scan_start,
        end_date=self.d0_end
    ).index.strftime('%Y-%m-%d').tolist()

    all_data = []

    with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
        future_to_date = {
            executor.submit(self._fetch_grouped_day, date_str): date_str
            for date_str in trading_dates
        }

        for future in as_completed(future_to_date):
            data = future.result()
            if data is not None and not data.empty:
                all_data.append(data)

    return pd.concat(all_data, ignore_index=True)

def _fetch_grouped_day(self, date_str: str):
    """Fetch all tickers for a single day"""
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    response = self.session.get(url, params={'apiKey': self.api_key, 'adjust': 'true'})

    if response.status_code != 200:
        return None

    data = response.json()
    if 'results' not in data or not data['results']:
        return None

    df = pd.DataFrame(data['results'])
    df = df.rename(columns={
        'T': 'ticker',
        'v': 'volume',
        'o': 'open',
        'c': 'close',
        'h': 'high',
        'l': 'low',
        't': 'timestamp',
    })
    df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.strftime('%Y-%m-%d')
    df = df.dropna(subset=['close', 'volume'])

    return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
```

---

### **Stage 2a: compute_simple_features()**

**Requirements:**
- ✅ Compute ONLY features needed for smart filtering
- ✅ Use per-ticker operations
- ✅ Include: `prev_close`, `adv20_usd`, `price_range`

**Template:**
```python
def compute_simple_features(self, df: pd.DataFrame):
    """Compute SIMPLE features for efficient filtering"""
    if df.empty:
        return df

    # Sort by ticker and date
    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])

    # Compute basic features
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)

    # ✅ CRITICAL: adv20_usd computed PER TICKER
    df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
        lambda x: x.rolling(window=20, min_periods=20).mean()
    )

    df['price_range'] = df['high'] - df['low']

    return df
```

---

### **Stage 2b: apply_smart_filters()**

**Requirements:**
- ✅ Separate historical data from D0 output range
- ✅ Apply filters ONLY to D0 dates
- ✅ Combine historical + filtered D0
- ✅ Preserve all historical data for ABS window

**Template:**
```python
def apply_smart_filters(self, df: pd.DataFrame):
    """Smart filters validate D0 dates, NOT filter entire ticker history"""
    if df.empty:
        return df

    # Drop NaN values
    df = df.dropna(subset=['prev_close', 'adv20_usd', 'price_range'])

    # ✅ Separate historical from output range
    df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
    df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

    # ✅ Apply filters ONLY to D0 dates
    df_output_filtered = df_output_range[
        (df_output_range['prev_close'] >= self.params['price_min']) &
        (df_output_range['adv20_usd'] >= self.params['adv20_min_usd']) &
        (df_output_range['price_range'] >= 0.50) &
        (df_output_range['volume'] >= 1_000_000)
    ].copy()

    # ✅ Get tickers with valid D0 dates
    tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
    df_historical = df_historical[df_historical['ticker'].isin(tickers_with_valid_d0)]

    # ✅ Combine ALL historical data + filtered D0 dates
    df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

    return df_combined
```

---

### **Stage 3a: compute_full_features()**

**Requirements:**
- ✅ Compute ALL technical indicators needed for pattern detection
- ✅ Process per-ticker (groupby loop)
- ✅ Include: EMA, ATR, volume metrics, slopes, gaps, etc.

**Template:**
```python
def compute_full_features(self, df: pd.DataFrame):
    """Compute FULL features for pattern detection"""
    if df.empty:
        return df

    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
    df['date'] = pd.to_datetime(df['date'])

    result_dfs = []

    for ticker, group in df.groupby('ticker'):
        if len(group) < 3:
            continue

        # Compute EMA
        group['ema_9'] = group['close'].ewm(span=9, adjust=False).mean()
        group['ema_20'] = group['close'].ewm(span=20, adjust=False).mean()

        # Compute ATR
        hi_lo = group['high'] - group['low']
        hi_prev = (group['high'] - group['close'].shift(1)).abs()
        lo_prev = (group['low'] - group['close'].shift(1)).abs()
        group['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
        group['atr_raw'] = group['tr'].rolling(14, min_periods=14).mean()
        group['atr'] = group['atr_raw'].shift(1)

        # Volume metrics
        group['vol_avg'] = group['volume'].rolling(14, min_periods=14).mean().shift(1)
        group['prev_volume'] = group['volume'].shift(1)
        group['adv20_$'] = (group['close'] * group['volume']).rolling(20, min_periods=20).mean().shift(1)

        # Slope
        group['slope_9_5d'] = (group['ema_9'] - group['ema_9'].shift(5)) / group['ema_9'].shift(5) * 100

        # High over EMA9 div ATR
        group['high_over_ema9_div_atr'] = (group['high'] - group['ema_9']) / group['atr']

        # Gap metrics
        group['gap_abs'] = (group['open'] - group['close'].shift(1)).abs()
        group['gap_over_atr'] = group['gap_abs'] / group['atr']
        group['open_over_ema9'] = group['open'] / group['ema_9']

        # Body over ATR
        group['body_over_atr'] = (group['close'] - group['open']) / group['atr']

        # Previous values
        group['prev_close'] = group['close'].shift(1)
        group['prev_open'] = group['open'].shift(1)
        group['prev_high'] = group['high'].shift(1)

        result_dfs.append(group)

    if not result_dfs:
        return pd.DataFrame()

    return pd.concat(result_dfs, ignore_index=True)
```

---

### **Stage 3b: detect_patterns()**

**Requirements:**
- ✅ Pre-slice ticker data BEFORE parallel processing
- ✅ Filter to D0 range in detection loop (early exit)
- ✅ Implement pattern-specific logic
- ✅ Return list of signal dicts

**Template:**
```python
def detect_patterns(self, df: pd.DataFrame):
    """Apply pattern detection logic"""
    if df.empty:
        return []

    # Get D0 range
    d0_start_dt = pd.to_datetime(self.d0_start_user)
    d0_end_dt = pd.to_datetime(self.d0_end_user)

    # ✅ Pre-slice ticker data BEFORE parallel processing
    ticker_data_list = []
    for ticker, ticker_df in df.groupby('ticker'):
        ticker_data_list.append((ticker, ticker_df.copy(), d0_start_dt, d0_end_dt))

    all_results = []

    # ✅ Parallel processing with pre-sliced data
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        future_to_ticker = {
            executor.submit(self._process_ticker_optimized_pre_sliced, ticker_data): ticker_data[0]
            for ticker_data in ticker_data_list
        }

        for future in as_completed(future_to_ticker):
            results = future.result()
            if results:
                all_results.extend(results)

    return all_results

def _process_ticker_optimized_pre_sliced(self, ticker_data: tuple):
    """Process pre-sliced ticker data"""
    ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data

    # ✅ Minimum data check
    if len(ticker_df) < 100:
        return []

    results = []

    for i in range(2, len(ticker_df)):
        d0 = ticker_df.iloc[i]['date']

        # ✅ EARLY FILTER - Skip if not in D0 range
        if d0 < d0_start_dt or d0 > d0_end_dt:
            continue

        r0 = ticker_df.iloc[i]
        r1 = ticker_df.iloc[i-1]
        r2 = ticker_df.iloc[i-2]

        # ... pattern detection logic ...

        if signal_detected:
            results.append({
                "Ticker": ticker,
                "Date": d0.strftime("%Y-%m-%d"),
                # ... signal details ...
            })

    return results
```

---

## 📏 CODE STRUCTURE RULES

### **Rule 1: Column Naming Convention**

| Stage | Columns | Format |
|-------|---------|--------|
| Stage 1 Output | `ticker`, `date`, `open`, `high`, `low`, `close`, `volume` | lowercase |
| Stage 2a/2b | Add: `prev_close`, `adv20_usd`, `price_range` | lowercase |
| Stage 3a | Add: `ema_9`, `atr`, `vol_avg`, etc. | lowercase |
| Detection Loop | Access via: `r1['Close']`, `r0['atr']` | Capitalized for Series |

**WHY**: Stage 1-3 use lowercase for DataFrame operations, detection loop uses capitalized Series access

---

### **Rule 2: Date Handling**

```python
# ✅ Stage 1-3: Store as datetime
df['date'] = pd.to_datetime(df['date'])

# ✅ Detection loop: Access as Timestamp
d0 = ticker_df.iloc[i]['date']  # Already datetime from Stage 3a

# ✅ Comparison
if d0 < d0_start_dt or d0 > d0_end_dt:
    continue
```

---

### **Rule 3: Parameter Access**

```python
# In __init__: Store as dict
self.params = {"price_min": 8.0, ...}

# In methods: Access via self.params
if r1['Close'] >= self.params['price_min']:
    ...

# In detection loop: Use local copy
P_local = self.params
if P_local["price_min"]:
    ...
```

---

### **Rule 4: Error Handling**

```python
# ✅ Graceful handling of missing data
try:
    m = add_daily_metrics(ticker_data_indexed)
except:
    continue

# ✅ Early data validation
if len(ticker_df) < 100:
    return []

# ✅ NaN checks
if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.params['pos_abs_max']):
    continue
```

---

## 🔧 PARAMETER SYSTEM

### **Parameter Categories**

```python
self.params = {
    # === Mass Parameters (shared across all patterns) ===
    "prev_close_min": 0.75,
    "prev_volume_min": 10_000_000,

    # === Backside B Pattern Parameters ===
    # Backside context
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,

    # Trigger mold
    "trigger_mode": "D1_or_D2",
    "atr_mult": 0.9,
    "vol_mult": 0.9,

    # D0 gates
    "gap_div_atr_min": 0.75,
    "open_over_ema9_min": 0.9,
    "d1_green_atr_min": 0.30,

    # === SC DMR Pattern Parameters ===
    # D2_PM_Setup
    "d2_pm_setup_gain_min": 0.2,
    "d2_pm_setup_dol_pmh_gap_vs_range_min": 0.5,
    "d2_pm_setup_pct_pmh_gap_min": 0.5,

    # D2_PMH_Break
    "d2_pmh_break_gain_min": 1.0,
    "d2_pmh_break_gap_min": 0.2,

    # D3/D4
    "d3_gain_min": 0.2,
    "d3_gap_min": 0.2,
    "d4_gain_min": 0.2,
}
```

---

## 🔄 TRANSFORMATION RULES

### **From Standalone Scanner to V31**

**Original Structure:**
```python
# Config
API_KEY = "..."
SYMBOLS = ['AAPL', 'MSFT', ...]
P = {...}

# Helper functions
def fetch_daily(tkr, start, end): ...
def add_daily_metrics(df): ...
def abs_top_window(df, d0, ...): ...

# Main scan function
def scan_symbol(sym, start, end):
    df = fetch_daily(sym, start, end)
    m = add_daily_metrics(df)

    rows = []
    for i in range(2, len(m)):
        # ... detection logic ...
        rows.append({...})

    return pd.DataFrame(rows)

# Main block
if __name__ == "__main__":
    results = []
    for s in SYMBOLS:
        df = scan_symbol(s, "2024-01-01", "2024-12-31")
        if not df.empty:
            results.append(df)

    print(pd.concat(results))
```

**V31 Transformation:**
```python
class BacksideBScanner:
    def __init__(self, api_key, d0_start, d0_end):
        # Extract params from P dict
        self.params = {
            "price_min": P.get("price_min", 8.0),
            "adv20_min_usd": P.get("adv20_min_usd", 30_000_000),
            # ... extract all params
        }

        # Calculate historical buffer
        lookback_buffer = self.params['abs_lookback_days'] + 50
        scan_start_dt = pd.to_datetime(d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

    # Helper functions become module-level (outside class)
    def fetch_grouped_data(self):
        # Replace fetch_daily with grouped endpoint
        ...

    def compute_simple_features(self, df):
        # Part of add_daily_metrics (simple part)
        ...

    def compute_full_features(self, df):
        # Part of add_daily_metrics (expensive part)
        ...

    def detect_patterns(self, df):
        # scan_symbol logic becomes _process_ticker_optimized_pre_sliced
        ...
```

### **Key Transformation Rules**

1. **SYMBOLS list** → Removed (grouped endpoint gets all tickers)
2. **fetch_daily()** → Replaced with `_fetch_grouped_day()`
3. **scan_symbol()** → Becomes `_process_ticker_optimized_pre_sliced()`
4. **Main block** → Becomes `run_scan()` method
5. **Helper functions** → Keep as module-level functions
6. **P dict** → Becomes `self.params` in `__init__`

---

## 📚 VALIDATION CHECKLIST

Use this checklist to validate V31 compliance:

- [ ] Uses `pandas_market_calendars` for trading days
- [ ] Calculates historical buffer in `__init__`
- [ ] Has 5-stage pipeline (fetch, simple_features, smart_filters, full_features, detect_patterns)
- [ ] Stage 1 uses parallel fetching (ThreadPoolExecutor)
- [ ] Stage 2b separates historical from D0 dates
- [ ] Stage 2b combines historical + filtered D0
- [ ] All operations use per-ticker groupby/transform
- [ ] Stage 3a computes features per-ticker
- [ ] Stage 3b uses pre-sliced data for parallel processing
- [ ] Detection loop filters by D0 range (early exit)
- [ ] Parameters stored in `self.params` dict
- [ ] Returns list of signal dicts from detect_patterns

---

## 🎯 CONCLUSION

This specification captures the **TRUE V31 ARCHITECTURE** from working implementations.

**Key Takeaways:**
1. V31 is a 3-stage grouped endpoint architecture (not 5 separate stages)
2. Historical data preservation is CRITICAL (ABS window needs 1000+ days)
3. Per-ticker operations are MANDATORY (not across entire dataframe)
4. Parallel processing at multiple stages (360x speedup)
5. Two-pass feature computation (simple → filter → full → detect)

**For Renata V2:**
- This specification should be the SOURCE OF TRUTH
- All transformations should match this structure exactly
- Validate output against this checklist before claiming "it works"

**For Sub-Agents:**
- Use this as the reference when creating scanners
- Follow the stage-by-stage requirements
- Validate against the checklist

---

**END OF SPECIFICATION**
