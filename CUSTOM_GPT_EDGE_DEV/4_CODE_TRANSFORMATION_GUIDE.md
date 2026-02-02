# 🔄 CODE TRANSFORMATION GUIDE
## Transforming Existing Scanner Code to V31 Standard

**Version**: 1.0
**Purpose**: Step-by-step guide for converting legacy scanner code to V31 architecture

---

## 🎯 TRANSFORMATION OVERVIEW

### What V31 Fixes

| Legacy Pattern | V31 Solution | Why It Matters |
|----------------|--------------|----------------|
| Symbol loops + individual API calls | Grouped endpoint (1 call per day) | 360x faster |
| `weekday() < 5` | `pandas_market_calendars` | Handles holidays correctly |
| Rolling across entire DF | Per-ticker groupby/transform | Correct calculations |
| Filtering everything | Smart filters (D0 only) | Preserves historical data |
| Sequential processing | Parallel (ThreadPoolExecutor) | Performance boost |
| Single compute_features() | Two-pass (simple → full) | Efficiency |

---

## 📋 STEP 1: ANALYZE LEGACY CODE

### Identify Current Architecture

**Type A: Standalone Symbol Scanner**
```python
# Legacy pattern
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', ...]
API_KEY = "..."

def fetch_daily(tkr, start, end):
    # Individual API calls
    url = f"https://api.polygon.io/ticker/{tkr}/range/1/day/{start}/{end}"
    ...

def scan_symbol(sym, start, end):
    df = fetch_daily(sym, start, end)
    m = add_metrics(df)
    # Detection logic
    ...

for sym in SYMBOLS:
    results = scan_symbol(sym, "2024-01-01", "2024-12-31")
```

**Type B: Multi-Day Scanner**
```python
# Legacy pattern
def run_backtest(start_date, end_date):
    current_dt = start_date
    while current_dt <= end_date:
        if current_dt.weekday() < 5:  # Weekday check
            # Process day
            ...
        current_dt += timedelta(days=1)
```

**Type C: Parameters Dict**
```python
# Legacy pattern
P = {
    "price_min": 8.0,
    "adv20_min": 30_000_000,
    "lookback": 1000,
    ...
}
```

---

## 📋 STEP 2: MAP TO V31 STRUCTURE

### Transformation Mapping

| Legacy Component | V31 Component | Notes |
|------------------|---------------|-------|
| `SYMBOLS = [...]` | Remove (use grouped endpoint) | Grouped gets all tickers |
| `fetch_daily(tkr, ...)` | `_fetch_grouped_day(date)` | One call per day |
| `while weekday() < 5` | `nyse.schedule()` from mcal | Proper trading days |
| `P = {...}` | `self.params = {...}` | Move to `__init__` |
| `scan_symbol()` | `_process_ticker_optimized_pre_sliced()` | Parallel processing |
| `add_metrics()` | Split into 2 stages | Simple + Full features |
| `if __name__ == "__main__"` | `run_scan()` method | Main execution |

---

## 📋 STEP 3: TRANSFORM CODE (DETAILED)

### Part 3a: Create Class Structure

**Before (Legacy):**
```python
# Config
API_KEY = "..."
SYMBOLS = ['AAPL', 'MSFT', ...]
P = {...}

# Functions
def fetch_daily(tkr, start, end): ...
def add_metrics(df): ...
def scan_symbol(sym, start, end): ...

# Main
if __name__ == "__main__":
    results = []
    for sym in SYMBOLS:
        df = scan_symbol(sym, "2024-01-01", "2024-12-31")
        if not df.empty:
            results.append(df)
    print(pd.concat(results))
```

**After (V31):**
```python
class PatternScanner:
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # Extract params from P
        self.params = {
            "price_min": P.get("price_min", 8.0),
            "adv20_min_usd": P.get("adv20_min", 30_000_000),
            # ... extract all params
        }

        # Calculate historical buffer
        lookback = self.params.get('abs_lookback_days', 1000) + 50
        self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)).strftime('%Y-%m-%d')
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # API config
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()
        self.stage1_workers = 5
        self.stage3_workers = 10

    def run_scan(self):
        # 5 stages
        ...

    # Stage methods
    def fetch_grouped_data(self): ...
    def compute_simple_features(self, df): ...
    def apply_smart_filters(self, df): ...
    def compute_full_features(self, df): ...
    def detect_patterns(self, df): ...
```

### Part 3b: Transform Data Fetching

**Before (Legacy):**
```python
def fetch_daily(tkr, start, end):
    url = f"https://api.polygon.io/ticker/{tkr}/range/1/day/{start}/{end}"
    params = {'apiKey': API_KEY, 'adjust': 'true'}
    response = requests.get(url, params=params)

    data = response.json().get('results', [])
    df = pd.DataFrame(data)
    # ... column renaming ...
    return df

# Usage: Multiple API calls
for sym in SYMBOLS:
    df = fetch_daily(sym, start, end)
```

**After (V31):**
```python
def fetch_grouped_data(self):
    """Fetch all tickers for all trading days"""
    nyse = mcal.get_calendar('NYSE')
    trading_dates = nyse.schedule(
        start_date=self.scan_start,
        end_date=self.d0_end_user
    ).index.strftime('%Y-%m-%d').tolist()

    all_data = []

    # Parallel date fetching
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
        'T': 'ticker', 'v': 'volume',
        'o': 'open', 'c': 'close',
        'h': 'high', 'l': 'low',
        't': 'timestamp',
    })
    df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.strftime('%Y-%m-%d')
    df = df.dropna(subset=['close', 'volume'])

    return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
```

### Part 3c: Transform Feature Computation

**Before (Legacy - Single Pass):**
```python
def add_metrics(df):
    # All features computed at once
    df['prev_close'] = df['Close'].shift(1)

    # ❌ WRONG: Across entire dataframe
    df['adv20'] = (df['Close'] * df['Volume']).rolling(20).mean()

    # Expensive features
    df['ema_9'] = df['Close'].ewm(span=9).mean()
    df['atr'] = calculate_atr(df)

    return df
```

**After (V31 - Two Pass):**
```python
# Stage 2a: Simple features (for filtering)
def compute_simple_features(self, df):
    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
    df['date'] = pd.to_datetime(df['date'])

    df['prev_close'] = df.groupby('ticker')['close'].shift(1)

    # ✅ CORRECT: Per-ticker operations
    df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
        lambda x: x.rolling(window=20, min_periods=20).mean()
    )

    df['price_range'] = df['high'] - df['low']
    return df

# Stage 3a: Full features (after filtering)
def compute_full_features(self, df):
    result_dfs = []

    for ticker, group in df.groupby('ticker'):
        if len(group) < 20:
            continue

        # Expensive features
        group['ema_9'] = group['close'].ewm(span=9, adjust=False).mean()
        group['ema_20'] = group['close'].ewm(span=20, adjust=False).mean()

        # ATR
        hi_lo = group['high'] - group['low']
        hi_prev = (group['high'] - group['close'].shift(1)).abs()
        lo_prev = (group['low'] - group['close'].shift(1)).abs()
        group['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
        group['atr'] = group['tr'].rolling(14, min_periods=14).mean().shift(1)

        result_dfs.append(group)

    return pd.concat(result_dfs, ignore_index=True)
```

### Part 3d: Add Smart Filters

**Before (Legacy):**
```python
# Usually no smart filtering
# Or filters applied to everything
df = df[df['prev_close'] >= price_min]
```

**After (V31):**
```python
def apply_smart_filters(self, df):
    """Smart filters validate D0 dates, NOT filter entire ticker history"""
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

### Part 3e: Transform Detection Logic

**Before (Legacy):**
```python
def scan_symbol(sym, start, end):
    df = fetch_daily(sym, start, end)
    m = add_metrics(df)

    rows = []
    for i in range(2, len(m)):
        # Detection logic
        if condition_met:
            rows.append({
                'Symbol': sym,
                'Date': m.iloc[i]['Date'],
                ...
            })

    return pd.DataFrame(rows)
```

**After (V31):**
```python
def detect_patterns(self, df):
    """Apply pattern detection logic"""
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

def _process_ticker_optimized_pre_sliced(self, ticker_data):
    """Process pre-sliced ticker data"""
    ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data

    if len(ticker_df) < 100:
        return []

    P = self.params
    results = []

    for i in range(2, len(ticker_df)):
        d0 = ticker_df.iloc[i]['date']

        # ✅ EARLY FILTER - Skip if not in D0 range
        if d0 < d0_start_dt or d0 > d0_end_dt:
            continue

        r0 = ticker_df.iloc[i]
        r1 = ticker_df.iloc[i-1]
        r2 = ticker_df.iloc[i-2]

        # ... detection logic (same as legacy) ...

        if signal_detected:
            results.append({
                "ticker": ticker,
                "date": d0.strftime("%Y-%m-%d"),
                # ... signal details ...
            })

    return results
```

---

## 📋 STEP 4: VALIDATION CHECKLIST

After transformation, verify:

### Structure
- [ ] Class-based structure with `__init__` and `run_scan`
- [ ] All 5 stages implemented
- [ ] Parameters in `self.params`
- [ ] Historical buffer calculated in `__init__`

### Stage 1: Data Fetching
- [ ] Uses `pandas_market_calendars`
- [ ] Uses grouped endpoint (`/v2/aggs/grouped/...`)
- [ ] Parallel fetching with ThreadPoolExecutor
- [ ] Lowercase column names

### Stage 2a: Simple Features
- [ ] Separate method from full_features
- [ ] Per-ticker groupby/transform
- [ ] Only cheap features computed

### Stage 2b: Smart Filters
- [ ] Separates historical from D0
- [ ] Filters ONLY D0 dates
- [ ] Combines historical + filtered D0
- [ ] Preserves historical data

### Stage 3a: Full Features
- [ ] All technical indicators
- [ ] Per-ticker groupby loop
- [ ] Proper shift for lagged values

### Stage 3b: Detection
- [ ] Pre-slices ticker data
- [ ] Early D0 filtering in loop
- [ ] Parallel processing
- [ ] Returns List[Dict]

---

## 🎯 COMPLETE EXAMPLE

### Legacy Code (Before)
```python
import pandas as pd
import requests

API_KEY = "your_key"
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']

P = {
    "price_min": 8.0,
    "adv20_min": 30_000_000,
    "gap_percent": 0.05,
}

def fetch_daily(tkr, start, end):
    url = f"https://api.polygon.io/ticker/{tkr}/range/1/day/{start}/{end}"
    params = {'apiKey': API_KEY, 'adjust': 'true'}
    response = requests.get(url, params=params)
    data = response.json().get('results', [])
    df = pd.DataFrame(data)
    df['Date'] = pd.to_datetime(df['t'], unit='ms')
    df.rename(columns={'c': 'Close', 'v': 'Volume'}, inplace=True)
    return df

def scan_symbol(sym, start, end):
    df = fetch_daily(sym, start, end)

    # ❌ Wrong: Across entire DF
    df['adv20'] = (df['Close'] * df['Volume']).rolling(20).mean()

    df['gap'] = (df['Close'] / df['Close'].shift(1)) - 1

    # ❌ Wrong: Filter everything
    df = df[df['adv20'] >= P['adv20_min']]

    rows = []
    for i in range(1, len(df)):
        if df.iloc[i]['gap'] >= P['gap_percent']:
            rows.append({
                'Symbol': sym,
                'Date': df.iloc[i]['Date'],
                'Gap': df.iloc[i]['gap']
            })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    results = []
    for sym in SYMBOLS:
        df = scan_symbol(sym, "2024-01-01", "2024-12-31")
        if not df.empty:
            results.append(df)

    print(pd.concat(results))
```

### V31 Code (After)
```python
import pandas as pd
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict

class GapScannerV31:
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            "gap_percent_min": 0.05,
        }

        # Historical buffer
        self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=50)).strftime('%Y-%m-%d')
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()
        self.stage1_workers = 5
        self.stage3_workers = 10

    def run_scan(self):
        stage1 = self.fetch_grouped_data()
        stage2a = self.compute_simple_features(stage1)
        stage2b = self.apply_smart_filters(stage2a)
        stage3a = self.compute_full_features(stage2b)
        stage3b = self.detect_patterns(stage3a)
        return stage3b

    def fetch_grouped_data(self):
        nyse = mcal.get_calendar('NYSE')
        trading_dates = nyse.schedule(
            start_date=self.scan_start,
            end_date=self.d0_end_user
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

        return pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()

    def _fetch_grouped_day(self, date_str: str):
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
        response = self.session.get(url, params={'apiKey': self.api_key, 'adjust': 'true'})
        if response.status_code != 200:
            return None

        data = response.json()
        if 'results' not in data or not data['results']:
            return None

        df = pd.DataFrame(data['results'])
        df = df.rename(columns={'T': 'ticker', 'v': 'volume', 'o': 'open',
                                  'c': 'close', 'h': 'high', 'l': 'low'})
        df['date'] = pd.to_datetime(df['t'], unit='ms').dt.strftime('%Y-%m-%d')
        return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]

    def compute_simple_features(self, df):
        if df.empty:
            return df
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
        df['date'] = pd.to_datetime(df['date'])
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # ✅ Per-ticker
        df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )
        return df

    def apply_smart_filters(self, df):
        if df.empty:
            return df
        df = df.dropna(subset=['prev_close', 'adv20_usd'])

        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        df_output_filtered = df_output_range[
            (df_output_filtered['prev_close'] >= self.params['price_min']) &
            (df_output_filtered['adv20_usd'] >= self.params['adv20_min_usd'])
        ].copy()

        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_historical = df_historical[df_historical['ticker'].isin(tickers_with_valid_d0)]

        return pd.concat([df_historical, df_output_filtered], ignore_index=True)

    def compute_full_features(self, df):
        if df.empty:
            return df
        result_dfs = []
        for ticker, group in df.groupby('ticker'):
            if len(group) < 2:
                continue
            group['gap_percent'] = (group['close'] / group['prev_close']) - 1
            result_dfs.append(group)
        return pd.concat(result_dfs, ignore_index=True) if result_dfs else pd.DataFrame()

    def detect_patterns(self, df):
        if df.empty:
            return []
        d0_start_dt = pd.to_datetime(self.d0_start_user)
        d0_end_dt = pd.to_datetime(self.d0_end_user)

        ticker_data_list = [(t, df.copy(), d0_start_dt, d0_end_dt)
                           for t, df in df.groupby('ticker')]

        all_results = []
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            future_to_ticker = {
                executor.submit(self._process_ticker, td): td[0]
                for td in ticker_data_list
            }
            for future in as_completed(future_to_ticker):
                results = future.result()
                if results:
                    all_results.extend(results)
        return all_results

    def _process_ticker(self, ticker_data):
        ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data
        if len(ticker_df) < 2:
            return []

        P = self.params
        results = []

        for i in range(1, len(ticker_df)):
            d0 = ticker_df.iloc[i]['date']
            if d0 < d0_start_dt or d0 > d0_end_dt:
                continue

            r0 = ticker_df.iloc[i]
            if r0['gap_percent'] >= P['gap_percent_min']:
                results.append({
                    'ticker': ticker,
                    'date': d0.strftime('%Y-%m-%d'),
                    'gap_percent': round(r0['gap_percent'] * 100, 2)
                })
        return results


# Usage
scanner = GapScannerV31("your_key", "2024-01-01", "2024-12-31")
results = scanner.run_scan()
print(f"Found {len(results)} signals")
```

---

**END OF TRANSFORMATION GUIDE**
