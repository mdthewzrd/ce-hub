# 🔄 V31 TRANSFORMATION MAPPING GUIDE
## Exact Rules for Converting Standalone Scanners to V31 Architecture

**Use this to understand HOW to transform standalone code to V31**

---

## 📋 TRANSFORMATION MAPPING TABLE

| Standalone Component | V31 Equivalent | Transformation Rule |
|---------------------|-----------------|---------------------|
| **Global Config** | **Class `__init__`** | Move globals to instance variables |
| `SYMBOLS = [...]` | Remove | Grouped endpoint gets ALL tickers |
| `API_KEY = "..."` | `self.api_key = api_key` | Pass as parameter |
| `P = {...}` | `self.params = {...}` | Extract to `__init__` |
| **Fetch Function** | **Stage 1** | Replace with grouped endpoint |
| `def fetch_daily(sym, ...)` | `def _fetch_grouped_day(date_str)` | One call per day (not per ticker) |
| `requests.get(url)` | `self.session.get(url)` | Use session pooling |
| **Metrics Function** | **Stages 2a + 3a** | Split into simple + full |
| `def add_daily_metrics(df)` | `def compute_simple_features(df)` | Only cheap features |
| | `def compute_full_features(df)` | All technical indicators |
| **Main Scan Function** | **Stage 3b** | Convert to parallel ticker processor |
| `def scan_symbol(sym, ...)` | `def _process_ticker_optimized_pre_sliced(...)` | Process pre-sliced ticker data |
| **Main Block** | **`run_scan()`** | Orchestrate 5 stages |
| `if __name__ == "__main__":` | `def run_scan(self):` | Remove main block |

---

## 🔍 DETAILED TRANSFORMATION RULES

### **Rule 1: Global Variables → Class Instance**

**Before (Standalone):**
```python
# Config
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 6

# Date range
PRINT_FROM = "2025-01-01"
PRINT_TO = None

# Parameters
P = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    ...
}

# Universe
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', ...]
```

**After (V31):**
```python
class BacksideBScanner:
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # ✅ API config
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"

        # ✅ Date range
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # ✅ Calculate historical buffer
        lookback_buffer = 1000 + 50
        scan_start_dt = pd.to_datetime(d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_end = d0_end

        # ✅ Workers
        self.stage1_workers = 5
        self.stage3_workers = 10

        # ✅ Parameters
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            ...
        }

        # ✅ Session pooling
        self.session = requests.Session()
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100
        ))
```

---

### **Rule 2: Fetch Function → Stage 1**

**Before (Standalone):**
```python
def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Fetch data for ONE ticker"""
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    r = session.get(url, params={"apiKey": API_KEY, ...})
    # ... process and return
```

**After (V31):**
```python
def fetch_grouped_data(self):
    """Stage 1: Fetch ALL tickers for ALL dates using grouped endpoint"""
    # ✅ Use market calendar
    nyse = mcal.get_calendar('NYSE')
    trading_dates = nyse.schedule(
        start_date=self.scan_start,
        end_date=self.d0_end
    ).index.strftime('%Y-%m-%d').tolist()

    all_data = []

    # ✅ Parallel fetching
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
    """Fetch ALL tickers for ONE day"""
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    response = self.session.get(url, params={'apiKey': self.api_key, 'adjust': 'true'})

    # ... process and return all tickers for that day
```

**Key Changes:**
- ✅ From per-ticker to per-day
- ✅ From sequential to parallel
- ✅ From ticker endpoint to grouped endpoint
- ✅ Returns ALL tickers (not one)

---

### **Rule 3: Metrics Function → Stages 2a + 3a**

**Before (Standalone):**
```python
def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Add ALL technical indicators"""
    # ... 50+ lines of feature computation
    m["EMA_9"] = m["Close"].ewm(span=9).mean()
    m["ATR"] = ...
    m["VOL_AVG"] = ...
    # ... all features computed at once
```

**After (V31):**
```python
# ✅ Stage 2a: Simple features (cheap)
def compute_simple_features(self, df: pd.DataFrame):
    """Compute SIMPLE features for efficient filtering"""
    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
    df['date'] = pd.to_datetime(df['date'])

    # Only features needed for filtering
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)

    # ✅ Per-ticker operation
    df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
        lambda x: x.rolling(window=20, min_periods=20).mean()
    )

    df['price_range'] = df['high'] - df['low']

    return df

# ✅ Stage 3a: Full features (expensive)
def compute_full_features(self, df: pd.DataFrame):
    """Compute FULL features for pattern detection"""
    result_dfs = []

    for ticker, group in df.groupby('ticker'):
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

        # ... all other features

        result_dfs.append(group)

    return pd.concat(result_dfs, ignore_index=True)
```

**Key Changes:**
- ✅ Split into two stages (simple → filter → full)
- ✅ Add per-ticker groupby operations
- ✅ Compute expensive features only on filtered data

---

### **Rule 4: Scan Function → Parallel Ticker Processor**

**Before (Standalone):**
```python
def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan ONE ticker"""
    df = fetch_daily(sym, start, end)
    if df.empty:
        return pd.DataFrame()

    m = add_daily_metrics(df)

    rows = []
    for i in range(2, len(m)):
        # ... detection logic
        rows.append({...})

    return pd.DataFrame(rows)

# Main block
results = []
for s in SYMBOLS:
    df = scan_symbol(s, "2024-01-01", "2024-12-31")
    if not df.empty:
        results.append(df)
```

**After (V31):**
```python
def detect_patterns(self, df: pd.DataFrame):
    """Stage 3b: Pattern detection with parallel processing"""
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

        # ... detection logic from original scan_symbol ...

        if signal_detected:
            results.append({
                "Ticker": ticker,
                "Date": d0.strftime("%Y-%m-%d"),
                ...
            })

    return results
```

**Key Changes:**
- ✅ Scan becomes `_process_ticker_optimized_pre_sliced()`
- ✅ Accepts pre-sliced ticker data (no filtering needed)
- ✅ Early D0 range filtering
- ✅ Parallel execution with ThreadPoolExecutor

---

### **Rule 5: Helper Functions**

**Before (Standalone):**
```python
def abs_top_window(df, d0, lookback_days, exclude_days):
    # ... helper logic

def pos_between(val, lo, hi):
    # ... helper logic

def _mold_on_row(rx):
    # ... helper logic
```

**After (V31):**
```python
# ✅ Keep as module-level functions (outside class)
def abs_top_window(df, d0, lookback_days, exclude_days):
    # ... same logic

def pos_between(val, lo, hi):
    # ... same logic

def _mold_on_row(rx):
    # ... same logic

# ✅ Or make them class methods if they need self.params
class BacksideBScanner:
    def _abs_top_window_optimized(self, df, d0, lookback_days, exclude_days):
        # ... use self.params
```

**Key Changes:**
- ✅ Pure helpers stay as module functions
- ✅ Helpers needing params become class methods

---

## 📐 STEP-BY-STEP TRANSFORMATION PROCESS

### **Step 1: Extract Class Configuration**

```python
# From standalone:
API_KEY = "..."
BASE_URL = "..."
P = {...}
SYMBOLS = [...]

# To V31 __init__:
def __init__(self, api_key: str, d0_start: str, d0_end: str):
    self.api_key = api_key
    self.base_url = "https://api.polygon.io"
    self.params = P.copy()  # Extract from original

    # Calculate historical buffer
    lookback = self.params['abs_lookback_days'] + 50
    self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)).strftime('%Y-%m-%d')
    self.d0_start_user = d0_start
    self.d0_end_user = d0_end
```

### **Step 2: Transform fetch_daily to fetch_grouped_data**

```python
# Remove: def fetch_daily(tkr, start, end)
# Add:
def fetch_grouped_data(self):
    nyse = mcal.get_calendar('NYSE')
    trading_dates = nyse.schedule(...).index.strftime('%Y-%m-%d').tolist()

    with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
        # ... parallel fetch

def _fetch_grouped_day(self, date_str):
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    # ... fetch all tickers for that day
```

### **Step 3: Split add_daily_metrics into two stages**

```python
# Remove: def add_daily_metrics(df)
# Add:

def compute_simple_features(self, df):
    # Only: prev_close, adv20_usd, price_range
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(...)
    df['price_range'] = df['high'] - df['low']
    return df

def compute_full_features(self, df):
    # All technical indicators: EMA, ATR, etc.
    for ticker, group in df.groupby('ticker'):
        group['ema_9'] = ...
        group['atr'] = ...
        # ... all features
    return df
```

### **Step 4: Transform scan_symbol to parallel processor**

```python
# Remove: def scan_symbol(sym, start, end)
# Add:

def detect_patterns(self, df):
    # Pre-slice ticker data
    ticker_data_list = [(t, df.copy(), ...) for t, df in df.groupby('ticker')]

    # Parallel processing
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        future_to_ticker = {
            executor.submit(self._process_ticker_optimized_pre_sliced, td): td[0]
            for td in ticker_data_list
        }

    # Collect results
    all_results = []
    for future in as_completed(future_to_ticker):
        all_results.extend(future.result())

    return all_results

def _process_ticker_optimized_pre_sliced(self, ticker_data):
    ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data

    # Detection logic from original scan_symbol
    # But with early D0 filtering
    for i in range(2, len(ticker_df)):
        d0 = ticker_df.iloc[i]['date']
        if d0 < d0_start_dt or d0 > d0_end_dt:
            continue
        # ... rest of detection logic
```

### **Step 5: Remove main block, add run_scan**

```python
# Remove:
if __name__ == "__main__":
    results = []
    for s in SYMBOLS:
        df = scan_symbol(s, ...)
        results.append(df)
    print(pd.concat(results))

# Add:
def run_scan(self):
    """Main execution method"""
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

## 🎯 TRANSFORMATION CHECKLIST

Use this checklist when transforming standalone code to V31:

**Configuration:**
- [ ] Extract `P` dict to `self.params` in `__init__`
- [ ] Extract `API_KEY` to parameter
- [ ] Calculate `scan_start` with historical buffer
- [ ] Remove `SYMBOLS` list (grouped endpoint)

**Fetching:**
- [ ] Replace `fetch_daily()` with `_fetch_grouped_day()`
- [ ] Change from ticker endpoint to grouped endpoint
- [ ] Add `pandas_market_calendars` for trading days
- [ ] Add `ThreadPoolExecutor` for parallel fetching

**Features:**
- [ ] Split `add_daily_metrics()` into `compute_simple_features()` + `compute_full_features()`
- [ ] Add per-ticker operations using `.groupby().transform()`
- [ ] Move expensive features to Stage 3a

**Detection:**
- [ ] Transform `scan_symbol()` to `_process_ticker_optimized_pre_sliced()`
- [ ] Add pre-slicing before parallel processing
- [ ] Add early D0 range filtering
- [ ] Add `ThreadPoolExecutor` for parallel ticker processing

**Structure:**
- [ ] Remove `if __name__ == "__main__":` block
- [ ] Add `run_scan()` method
- [ ] Create class with proper `__init__()`

---

## ⚠️ COMMON TRANSFORMATION ERRORS

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| Keep `fetch_daily(sym, ...)` | Replace with `_fetch_grouped_day(date_str)` |
| Sequential processing | Parallel with `ThreadPoolExecutor` |
| `weekday() < 5` | `mcal.get_calendar('NYSE')` |
| `df['adv20'].rolling(20)` | `df.groupby('ticker').transform(lambda x: x.rolling(20))` |
| Compute all features at once | Two-pass: simple → filter → full |
| Process all data in detect | Pre-slice + early D0 filter |
| Filter before combining historical | Separate historical/D0, filter D0, combine |

---

**Made from V31_GOLD_STANDARD_SPECIFICATION.md**
