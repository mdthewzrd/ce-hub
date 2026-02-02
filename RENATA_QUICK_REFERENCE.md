# Backside B Scanner - Quick Reference for Renata

## Critical Code Patterns

### 1. require_open_gt_prev_high CHECK (MOST IMPORTANT!)
```python
# ✅ CORRECT:
if self.params['require_open_gt_prev_high'] and not (r0['open'] > r1['prev_high']):
    continue

# ❌ WRONG:
if self.params['require_open_gt_prev_high'] and not (r0['open'] > r1['high']):
    continue
```

### 2. PERFORMANCE - Pre-slicing with groupby
```python
# ✅ CORRECT (O(n)):
for ticker, ticker_df in df.groupby('ticker'):
    ticker_data_list.append((ticker, ticker_df.copy(), d0_start_dt, d0_end_dt))

# ❌ WRONG (O(n×m)):
for ticker in unique_tickers:
    ticker_df = df[df['ticker'] == ticker].copy()
```

### 3. adv20_usd in Stage 2a (Simple Features)
```python
# ✅ CORRECT (NO shift):
df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)

# ❌ WRONG (with shift):
df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean().shift(1)
)
```

### 4. adv20_$ in Stage 3a (Full Features)
```python
# ✅ CORRECT (WITH shift):
df['adv20_$'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean().shift(1)
)
```

### 5. Smart Filter Strategy
```python
# ✅ CORRECT - Separate historical from D0 range:
df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

# Apply filters ONLY to D0 dates
df_output_filtered = df_output_range[
    (df_output_range['prev_close'] >= self.params['price_min']) &
    (df_output_range['adv20_usd'] >= self.params['adv20_min_usd']) &
    (df_output_range['price_range'] >= 0.50) &
    (df_output_range['volume'] >= 1_000_000)
].copy()

# Combine ALL historical + filtered D0
df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)
```

## Parameters - Use These EXACT Values

```python
self.params = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,  # NOT 0.50!
    "trigger_mode": "D1_or_D2",
    "atr_mult": 0.9,
    "vol_mult": 0.9,
    "d1_vol_mult_min": None,
    "d1_volume_min": 15_000_000,
    "slope5d_min": 3.0,
    "high_ema9_mult": 1.05,
    "gap_div_atr_min": 0.75,  # NOT 0.50!
    "open_over_ema9_min": 0.9,  # NOT 0.97!
    "d1_green_atr_min": 0.30,
    "require_open_gt_prev_high": True,
    "enforce_d1_above_d2": True,
}
```

## Mold Check - 4 Criteria (NOT doji/red candles)

```python
def _mold_on_row(self, rx: pd.Series) -> bool:
    checks = [
        (rx['tr'] / rx['atr']) >= self.params['atr_mult'],  # TR/ATR >= 0.9
        max(rx['volume']/rx['vol_avg'], rx['prev_volume']/rx['vol_avg']) >= self.params['vol_mult'],  # Vol spike
        rx['slope_9_5d'] >= self.params['slope5d_min'],  # Slope >= 3.0
        rx['high_over_ema9_div_atr'] >= self.params['high_ema9_mult'],  # High/EMA9/ATR >= 1.05
    ]
    return all(bool(x) and np.isfinite(x) for x in checks)
```

## Column Definitions

- `high` = Current row's high
- `prev_high` = Previous day's high (from `.shift(1)`)
- For D-1 row: `high` = D-1's high, `prev_high` = D-2's high
- `require_open_gt_prev_high` checks D0 open > D-2's high (via D-1's prev_high)

## Validation Checklist

After generating code, verify:
- [ ] Line ~536: Uses `r1['prev_high']` not `r1['high']`
- [ ] Line ~403: Uses `df.groupby('ticker')` not `df[df['ticker'] == ticker]`
- [ ] Line ~253: `adv20_usd` has NO `.shift(1)`
- [ ] Line ~349: `adv20_$` HAS `.shift(1)`
- [ ] Parameters: pos_abs_max=0.75, gap_div_atr_min=0.75, open_over_ema9_min=0.9
- [ ] DJT 2025-01-14 is detected

## Test Case: DJT 2025-01-14

Should PASS all checks:
- D0 open ($39.34) > D-2 high ($35.83) via D-1's prev_high ✅
- Gap/ATR: 1.52 >= 0.75 ✅
- Open/EMA9: 1.06 >= 0.9 ✅
- ABS position: 0.46 <= 0.75 ✅
- All 4 mold checks pass ✅
