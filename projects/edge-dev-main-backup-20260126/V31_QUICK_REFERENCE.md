# 🎯 V31 QUICK REFERENCE CARD
## For Sub-Agents Creating/Transforming Scanners

**Print this. Keep it handy. Use it EVERY time.**

---

## ⚡ 7 CRITICAL RULES (NON-NEGOTIABLE)

### 1. 📅 USE MARKET CALENDAR
```python
import pandas_market_calendars as mcal
nyse = mcal.get_calendar('NYSE')
trading_dates = nyse.schedule(start_date, end_date).index.strftime('%Y-%m-%d').tolist()
```
**NOT**: `while current_dt <= end_dt: if weekday < 5:`

### 2. 📊 CALCULATE HISTORICAL BUFFER
```python
lookback_buffer = params['abs_lookback_days'] + 50  # e.g., 1000 + 50
scan_start_dt = pd.to_datetime(d0_start) - pd.Timedelta(days=lookback_buffer)
scan_start = scan_start_dt.strftime('%Y-%m-%d')
```
**WHY**: ABS window needs 1000+ days of history

### 3. 🔄 PER-TICKER OPERATIONS
```python
# ✅ CORRECT
df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)

# ❌ WRONG
df['adv20'] = (df['close'] * df['volume']).rolling(20).mean()
```

### 4. 🏛️ SEPARATE HISTORICAL FROM D0
```python
# Split
df_historical = df[~df['date'].between(d0_start, d0_end)].copy()
df_output_range = df[df['date'].between(d0_start, d0_end)].copy()

# Filter ONLY D0
df_output_filtered = df_output_range[
    (df_output_range['prev_close'] >= price_min)
]

# COMBINE back together
df_combined = pd.concat([df_historical, df_output_filtered])
```
**WHY**: Historical data needed for ABS window

### 5. ⚡ PARALLEL PROCESSING
```python
from concurrent.futures import ThreadPoolExecutor, as_completed

# Stage 1: Parallel dates
with ThreadPoolExecutor(max_workers=5) as executor:
    future_to_date = {
        executor.submit(self._fetch_grouped_day, date_str): date_str
        for date_str in trading_dates
    }

# Stage 3: Parallel tickers (pre-sliced!)
ticker_data_list = [(t, df.copy(), d0_start, d0_end) for t, df in df.groupby('ticker')]
with ThreadPoolExecutor(max_workers=10) as executor:
    future_to_ticker = {
        executor.submit(self._process_ticker, td): td[0]
        for td in ticker_data_list
    }
```

### 6. 🎯 TWO-PASS FEATURES
```python
# Stage 2a: Simple (cheap)
def compute_simple_features(df):
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['adv20_usd'] = df['close'] * df['volume']).groupby(df['ticker']).transform(...)
    return df

# Stage 3a: Full (expensive)
def compute_full_features(df):
    for ticker, group in df.groupby('ticker'):
        group['ema_9'] = group['close'].ewm(span=9).mean()
        group['atr'] = ...
        # ... all technical indicators
```

### 7. 🔍 EARLY D0 FILTERING
```python
# In detection loop
for i in range(2, len(ticker_df)):
    d0 = ticker_df.iloc[i]['date']

    # ✅ EARLY EXIT
    if d0 < d0_start_dt or d0 > d0_end_dt:
        continue

    # ... expensive calculations only if D0 matches
```

---

## 📋 CLASS STRUCTURE TEMPLATE

```python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional

class MyPatternScanner:
    """Single-pattern scanner using v31 architecture"""

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # ✅ Historical buffer
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end
        lookback = self.params['abs_lookback_days'] + 50
        self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)).strftime('%Y-%m-%d')

        # API & workers
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()
        self.stage1_workers = 5
        self.stage3_workers = 10

        # Parameters
        self.params = {...}

    def run_scan(self):
        """Main execution - 5 stages"""
        stage1 = self.fetch_grouped_data()
        stage2a = self.compute_simple_features(stage1)
        stage2b = self.apply_smart_filters(stage2a)
        stage3a = self.compute_full_features(stage2b)
        stage3b = self.detect_patterns(stage3a)
        return stage3b

    def fetch_grouped_data(self):
        """Stage 1: Parallel date fetching"""

    def compute_simple_features(self, df):
        """Stage 2a: Cheap features for filtering"""

    def apply_smart_filters(self, df):
        """Stage 2b: Separate historical, filter D0, combine"""

    def compute_full_features(self, df):
        """Stage 3a: All technical indicators"""

    def detect_patterns(self, df):
        """Stage 3b: Pattern detection"""

    def _fetch_grouped_day(self, date_str):
        """Helper: Fetch one day"""

    def _process_ticker_optimized_pre_sliced(self, ticker_data):
        """Helper: Process one ticker"""
```

---

## 🔍 VALIDATION CHECKLIST

Before claiming "scanner works", verify:

- [ ] `import pandas_market_calendars as mcal` at top
- [ ] `self.scan_start` calculated from `d0_start - lookback`
- [ ] `fetch_grouped_data()` uses `nyse.schedule()` and `ThreadPoolExecutor`
- [ ] `compute_simple_features()` exists (separate from full_features)
- [ ] `apply_smart_filters()` splits historical/D0 and recombines
- [ ] All `.groupby().transform()` or `.groupby()...` operations
- [ ] `detect_patterns()` pre-slices ticker data
- [ ] Detection loop has `if d0 < d0_start_dt or d0 > d0_end_dt: continue`
- [ ] Returns `List[Dict]` from detect_patterns

---

## 🚨 COMMON MISTAKES TO AVOID

| ❌ MISTAKE | ✅ CORRECT |
|-----------|------------|
| `weekday() < 5` | `mcal.get_calendar('NYSE')` |
| `scan_start = d0_start` | `scan_start = d0_start - lookback` |
| `df['adv20'].rolling(20)` | `df.groupby('ticker').transform(lambda x: x.rolling(20))` |
| `df_filtered = df[condition]` | Split historical/D0, filter D0, combine |
| One `compute_features()` | Two: `compute_simple_features()` + `compute_full_features()` |
| Sequential processing | Parallel with `ThreadPoolExecutor` |
| Filter after features | Two-pass: simple → filter → full |
| Scan entire df each ticker | Pre-slice before parallel |

---

## 📊 COLUMN NAMING

| Stage | Columns | Case |
|-------|---------|------|
| Stage 1-3 | `ticker`, `date`, `open`, `high`, `low`, `close`, `volume` | lowercase |
| DataFrame access | `df['close']`, `df['volume']` | lowercase |
| Series access (in loop) | `r1['Close']`, `r0['atr']` | Capitalized |

---

## 🔧 PARAMETER STRUCTURE

```python
self.params = {
    # Mass (shared)
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # Pattern-specific
    "abs_lookback_days": 1000,
    "gap_div_atr_min": 0.75,
    # ... etc
}
```

---

**Print this. Use it. No exceptions.**

---

**Made from V31_GOLD_STANDARD_SPECIFICATION.md**
