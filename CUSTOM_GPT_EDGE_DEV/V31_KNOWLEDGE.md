# V31 Knowledge for Edge-Dev Scanner Expert

## The 7 Critical Rules

### Rule 1: Use Market Calendar (Not weekday checks)
```python
import pandas_market_calendars as mcal
nyse = mcal.get_calendar('NYSE')
trading_dates = nyse.schedule(start_date, end_date).index.strftime('%Y-%m-%d').tolist()
```

### Rule 2: Calculate Historical Buffer
```python
lookback = self.params.get('abs_lookback_days', 100) + 50
self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)).strftime('%Y-%m-%d')
```

### Rule 3: Per-Ticker Operations
```python
# ✅ CORRECT
df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)

# ❌ WRONG
df['adv20'] = (df['close'] * df['volume']).rolling(20).mean()
```

### Rule 4: Separate Historical from D0
```python
df_historical = df[~df['date'].between(d0_start, d0_end)].copy()
df_output_range = df[df['date'].between(d0_start, d0_end)].copy()
df_output_filtered = df_output_range[filters].copy()
df_combined = pd.concat([df_historical, df_output_filtered])
```

### Rule 5: Parallel Processing
```python
from concurrent.futures import ThreadPoolExecutor, as_completed

# Stage 1: Parallel dates
with ThreadPoolExecutor(max_workers=5) as executor:
    future_to_date = {
        executor.submit(self._fetch_grouped_day, date_str): date_str
        for date_str in trading_dates
    }

# Stage 3: Parallel tickers (pre-sliced)
ticker_data_list = [(t, df.copy(), d0_start, d0_end) for t, df in df.groupby('ticker')]
with ThreadPoolExecutor(max_workers=10) as executor:
    future_to_ticker = {
        executor.submit(self._process_ticker, td): td[0]
        for td in ticker_data_list
    }
```

### Rule 6: Two-Pass Features
```python
# Stage 2a: Simple (cheap features for filtering)
def compute_simple_features(self, df):
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
        lambda x: x.rolling(window=20, min_periods=20).mean()
    return df

# Stage 3a: Full features (after filtering)
def compute_full_features(self, df):
    for ticker, group in df.groupby('ticker):
        group['ema_9'] = group['close'].ewm(span=9).mean()
        # ... all indicators
```

### Rule 7: Early D0 Filtering
```python
for i in range(min_data_days, len(ticker_df)):
    d0 = ticker_df.iloc[i]['date']
    if d0 < d0_start_dt or d0 > d0_end_dt:
        continue
    # ... expensive calculations only for D0 dates
```

## Mandatory Class Structure

Every scanner must have these methods:
- `__init__(self, api_key, d0_start, d0_end)` - Initialize with parameters and buffer
- `run_scan(self)` - Main execution, calls all 5 stages in order
- `fetch_grouped_data(self)` - Stage 1: Parallel date fetching with grouped endpoint
- `compute_simple_features(self, df)` - Stage 2a: Simple features only
- `apply_smart_filters(self, df)` - Stage 2b: Smart filters preserving historical data
- `compute_full_features(self, df)` - Stage 3a: All technical indicators
- `detect_patterns(self, df)` - Stage 3b: Pattern detection, returns List[Dict]
- `_fetch_grouped_day(self, date_str)` - Helper: Fetch one day
- `_process_ticker(self, ticker_data)` - Helper: Process one ticker

## Common Patterns

### Gap Scanner Parameters
```
params = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    "gap_percent_min": 0.05,
    "volume_ratio_min": 1.5,
    "close_range_min": 0.7,
}
```

### Momentum Scanner Parameters
```
params = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    "ema_9_slope_5d_min": 10,
    "high_over_ema9_atr_min": 1.5,
    "atr_multiple_min": 1.0,
    "close_range_min": 0.7,
}
```

## Output Format

Always provide:
1. Complete Python code (full class, all methods)
2. All parameters in self.params dict
3. Validation checklist (all 7 rules)
4. Usage example
5. Key design decisions

## What Never To Do

- Never use weekday() checks (use pandas_market_calendars instead)
- Never apply rolling across entire dataframe (use groupby().transform())
- Never filter historical data (only filter D0 dates)
- Never skip parallel processing
- Never return DataFrame from detect_patterns (must return List[Dict])
- Never use individual ticker API calls (use grouped endpoint)

## Column Naming Convention

- DataFrame columns (stages 1-3): lowercase (`df['close']`, `df['ticker']`)
- Series access in detection loop: Capitalized (`r0['Close']`, `r0['Atr']`)
