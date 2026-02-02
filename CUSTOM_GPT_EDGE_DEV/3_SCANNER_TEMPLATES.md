# 📚 SCANNER TEMPLATES COLLECTION
## Common Pattern Implementations (Reference for Custom GPT)

**Version**: 1.0
**Purpose**: Pre-built scanner templates for common trading patterns

---

## 🎯 TEMPLATE 1: GAP UP SCANNER

### Pattern Description
Detects stocks that gap up at open with volume confirmation. Gap is measured as percentage move from previous close, and volume should be above average.

### When to Use
- Pre-market gap analysis
- Momentum breakout strategies
- Earnings plays
- News-driven moves

### Complete Template

```python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict

class GapUpScanner:
    """Gap Up scanner - V31 compliant

    Pattern: Stock opens X% above previous close with Yx volume confirmation
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner with parameters"""

        # User's D0 range
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # Parameters
        self.params = {
            # Mass (liquidity) parameters
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            "volume_min": 1_000_000,

            # Gap parameters
            "gap_percent_min": 0.05,      # 5% gap minimum
            "gap_percent_max": 0.30,      # 30% gap maximum
            "volume_ratio_min": 1.5,      # 1.5x average volume

            # Confirmation
            "close_range_min": 0.6,       # Close in top 40% of day's range
            "atr_multiple_min": 0.5,      # Gap at least 0.5 ATR
        }

        # Calculate historical buffer (no need for lookback here, 50 days enough)
        self.scan_start = (pd.to_datetime(d0_start) - pd.Timedelta(days=50)).strftime('%Y-%m-%d')

        # API Configuration
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()
        self.stage1_workers = 5
        self.stage3_workers = 10

    def run_scan(self) -> List[Dict]:
        """Main execution - 5 stage pipeline"""
        stage1 = self.fetch_grouped_data()
        stage2a = self.compute_simple_features(stage1)
        stage2b = self.apply_smart_filters(stage2a)
        stage3a = self.compute_full_features(stage2b)
        stage3b = self.detect_patterns(stage3a)
        return stage3b

    def fetch_grouped_data(self) -> pd.DataFrame:
        """Stage 1: Parallel date fetching with grouped endpoint"""
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

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def _fetch_grouped_day(self, date_str: str) -> pd.DataFrame:
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

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2a: Simple features for filtering"""
        if df.empty:
            return df

        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
        df['date'] = pd.to_datetime(df['date'])

        # Previous close (needed for gap calculation)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # ADV20 for liquidity filter
        df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )

        # Price range
        df['price_range'] = df['high'] - df['low']

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2b: Smart filters - validate D0 only, preserve historical"""
        if df.empty:
            return df

        df = df.dropna(subset=['prev_close', 'adv20_usd', 'price_range'])

        # Separate historical from D0 output range
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # Apply filters ONLY to D0 dates
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['adv20_usd'] >= self.params['adv20_min_usd']) &
            (df_output_range['price_range'] >= 0.50) &
            (df_output_range['volume'] >= self.params['volume_min'])
        ].copy()

        # Get tickers with valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_historical = df_historical[df_historical['ticker'].isin(tickers_with_valid_d0)]

        # Combine historical + filtered D0
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        return df_combined

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3a: Full features for pattern detection"""
        if df.empty:
            return df

        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

        result_dfs = []

        for ticker, group in df.groupby('ticker'):
            if len(group) < 20:
                continue

            # Gap calculation
            group['gap_percent'] = (group['open'] / group['prev_close']) - 1

            # Volume ratio
            group['vol_avg'] = group['volume'].rolling(14, min_periods=14).mean().shift(1)
            group['volume_ratio'] = group['volume'] / group['vol_avg']

            # ATR
            hi_lo = group['high'] - group['low']
            hi_prev = (group['high'] - group['close'].shift(1)).abs()
            lo_prev = (group['low'] - group['close'].shift(1)).abs()
            group['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
            group['atr'] = group['tr'].rolling(14, min_periods=14).mean().shift(1)

            # Gap vs ATR
            group['gap_abs'] = group['open'] - group['prev_close']
            group['gap_atr'] = group['gap_abs'] / group['atr']

            # Close position in range
            group['close_range'] = (group['close'] - group['low']) / (group['high'] - group['low'])

            result_dfs.append(group)

        if not result_dfs:
            return pd.DataFrame()

        return pd.concat(result_dfs, ignore_index=True)

    def detect_patterns(self, df: pd.DataFrame) -> List[Dict]:
        """Stage 3b: Pattern detection with parallel processing"""
        if df.empty:
            return []

        d0_start_dt = pd.to_datetime(self.d0_start_user)
        d0_end_dt = pd.to_datetime(self.d0_end_user)

        # Pre-slice ticker data
        ticker_data_list = []
        for ticker, ticker_df in df.groupby('ticker'):
            ticker_data_list.append((ticker, ticker_df.copy(), d0_start_dt, d0_end_dt))

        all_results = []

        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            future_to_ticker = {
                executor.submit(self._process_ticker, ticker_data): ticker_data[0]
                for ticker_data in ticker_data_list
            }

            for future in as_completed(future_to_ticker):
                results = future.result()
                if results:
                    all_results.extend(results)

        return all_results

    def _process_ticker(self, ticker_data: tuple) -> List[Dict]:
        """Process single ticker for gap patterns"""
        ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data

        # Minimum data required: 20 days for ATR(14) + volume(14) calculations
        min_data_days = 20
        if len(ticker_df) < min_data_days:
            return []

        P = self.params
        results = []

        for i in range(min_data_days, len(ticker_df)):
            d0 = ticker_df.iloc[i]['date']

            # Early exit - skip if not in D0 range
            if d0 < d0_start_dt or d0 > d0_end_dt:
                continue

            r0 = ticker_df.iloc[i]
            r1 = ticker_df.iloc[i-1]

            # Check gap criteria
            if not (P['gap_percent_min'] <= r0['gap_percent'] <= P['gap_percent_max']):
                continue

            # Check volume confirmation
            if r0['volume_ratio'] < P['volume_ratio_min']:
                continue

            # Check gap vs ATR
            if r0['gap_atr'] < P['atr_multiple_min']:
                continue

            # Check close strength
            if r0['close_range'] < P['close_range_min']:
                continue

            # Signal found
            results.append({
                'ticker': ticker,
                'date': d0.strftime('%Y-%m-%d'),
                'gap_percent': round(r0['gap_percent'] * 100, 2),
                'volume_ratio': round(r0['volume_ratio'], 2),
                'gap_atr': round(r0['gap_atr'], 2),
                'close_range': round(r0['close_range'], 2),
                'open_price': round(r0['open'], 2),
                'prev_close': round(r0['prev_close'], 2),
                'volume': int(r0['volume']),
                'adv20_usd': int(r1.get('adv20_usd', 0)),
            })

        return results


# Usage example
if __name__ == "__main__":
    API_KEY = "your_polygon_api_key"
    scanner = GapUpScanner(API_KEY, "2024-01-01", "2024-12-31")
    results = scanner.run_scan()

    print(f"Found {len(results)} gap signals")
    for r in results[:5]:
        print(f"{r['ticker']} | {r['date']} | Gap: {r['gap_percent']}% | Vol: {r['volume_ratio']}x")
```

---

## 🎯 TEMPLATE 2: MOMENTUM BREAKOUT SCANNER

### Pattern Description
Detects stocks breaking out with momentum confirmation. Uses EMA alignment, ATR expansion, and volume surge.

### When to Use
- Trend continuation strategies
- Breakout pullback entries
- Momentum swing trading

### Key Parameters
```python
self.params = {
    # Mass
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # Trend alignment
    "ema_9_slope_5d_min": 10,       # 10% 5-day slope
    "ema_9_slope_15d_min": 20,      # 20% 15-day slope

    # Breakout confirmation
    "high_over_ema9_atr_min": 1.5,  # High 1.5 ATR above EMA9
    "atr_multiple_min": 1.0,        # Range expansion
    "volume_ratio_min": 1.5,

    # Entry quality
    "close_range_min": 0.7,         # Strong close
    "open_above_ema9": True,
}
```

### Detection Logic
```python
def _process_ticker(self, ticker_data: tuple) -> List[Dict]:
    """Process single ticker for momentum breakout"""
    # ... setup ...

    for i in range(50, len(ticker_df)):
        d0 = ticker_df.iloc[i]['date']
        if d0 < d0_start_dt or d0 > d0_end_dt:
            continue

        r0 = ticker_df.iloc[i]

        # Trend alignment
        if r0['slope_9_5d'] < P['ema_9_slope_5d_min']:
            continue
        if r0['slope_9_15d'] < P['ema_9_slope_15d_min']:
            continue

        # Breakout confirmation
        if r0['high_over_ema9_atr'] < P['high_over_ema9_atr_min']:
            continue
        if r0['range_over_atr'] < P['atr_multiple_min']:
            continue

        # Volume confirmation
        if r0['volume_ratio'] < P['volume_ratio_min']:
            continue

        # Entry quality
        if r0['close_range'] < P['close_range_min']:
            continue

        # Signal found
        results.append({...})
```

---

## 🎯 TEMPLATE 3: PULLBACK ENTRY SCANNER

### Pattern Description
Detects pullbacks to support in uptrending stocks. Uses EMA proximity, volume dry-up, and reversal candles.

### When to Use
- Trend continuation entries
- Support level bounces
- Dip buying in strong trends

### Key Parameters
```python
self.params = {
    # Mass
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # Trend context
    "ema_9_slope_5d_min": 5,        # Positive slope required
    "price_over_ema20_max": 0.02,   # Within 2% of EMA20

    # Pullback criteria
    "low_over_ema20_atr_max": 0.5,  # Low within 0.5 ATR of EMA20
    "volume_ratio_max": 0.8,        # Volume dry-up

    # Reversal confirmation
    "close_above_open": True,        # Green candle
    "close_range_min": 0.6,         # Strong close
    "body_atr_min": 0.3,            # Meaningful body
}
```

---

## 🎯 TEMPLATE 4: VOLUME SURGE SCANNER

### Pattern Description
Detects unusual volume activity that may precede moves. Uses volume ratio, volume patterns, and price confirmation.

### When to Use
- Pre-breakout detection
- Institutional activity spotting
- Unusual flow alerts

### Key Parameters
```python
self.params = {
    # Mass
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # Volume surge
    "volume_ratio_min": 2.0,        # 2x average
    "volume_ratio_max": 10.0,       # Cap extreme values

    # Price confirmation
    "price_change_min": -0.02,      # At least -2% (dip)
    "price_change_max": 0.10,       # At most +10% (not extended)

    # Follow-through potential
    "close_range_min": 0.5,
    "atr_multiple_min": 0.8,
}
```

---

## 📋 TEMPLATE USAGE GUIDE

### How to Use These Templates

1. **Copy the template** that matches your pattern type
2. **Modify parameters** to match your specific criteria
3. **Adjust detection logic** in `_process_ticker` method
4. **Test with small date range** first
5. **Validate with checklist** before production use

### Customization Tips

**Adding New Filters:**
```python
# In params
self.params = {
    ...
    "custom_filter_min": 0.5,
}

# In _process_ticker
if r0['custom_metric'] < P['custom_filter_min']:
    continue
```

**Changing Output Format:**
```python
# Modify results.append() dict
results.append({
    'ticker': ticker,
    'date': d0.strftime('%Y-%m-%d'),
    # Add your custom fields
    'custom_field': round(r0['custom_metric'], 2),
})
```

---

**END OF TEMPLATES**
