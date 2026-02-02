# EdgeDev Indicators & Execution Gold Standard
**Complete Framework for Indicators, Position Sizing, and Execution Strategies**

**Version**: 1.0
**Date**: 2026-01-29
**Status**: COMPLETE - Ready for Implementation

---

## Table of Contents

1. [Package Requirements](#package-requirements)
2. [Indicator Library](#indicator-library)
3. [Building Custom Indicators](#building-custom-indicators)
4. [Position Sizing Methods](#position-sizing-methods)
5. [Pyramiding Strategies](#pyramiding-strategies)
6. [Capital Recycling](#capital-recycling)
7. [Execution Strategies](#execution-strategies)
8. [Stop Management](#stop-management)
9. [Target Management](#target-management)
10. [Complete Execution Framework](#complete-execution-framework)

---

## Package Requirements

### Core Data Packages

```python
# requirements.txt for EdgeDev Gold Standard

# === CORE DATA ===
pandas>=2.0.0              # Data manipulation
numpy>=1.24.0              # Numerical computing
requests>=2.31.0           # HTTP requests (Polygon API)

# === MARKET CALENDAR ===
pandas-market-calendars>=4.3.0  # Trading days, holidays
pytz>=2023.3               # Timezone handling

# === TECHNICAL ANALYSIS ===
# NOTE: We implement indicators ourselves (see below)
# No external TA libraries required - gives full control

# === PARALLEL PROCESSING ===
concurrent.futures         # Built-in (no install needed)

# === BACKTESTING ===
# We use custom backtest engines (see backtest_gold_standard.md)

# === VISUALIZATION (Optional) ===
matplotlib>=3.7.0          # Plotting (optional)
plotly>=5.18.0             # Interactive charts (optional)
```

### Why No TA-Lib?

```python
# WE IMPLEMENT OUR OWN INDICATORS
#
# Why:
# 1. Full control over calculations
# 2. No external dependencies
# 3. Can optimize for our specific needs
# 4. Transparent logic (no black boxes)
# 5. Easy to modify/extend
#
# TA-Lib disadvantages:
# - Binary installation issues (especially on Mac M1/M2)
# - Limited customization
# - Black box calculations
# - Outdated maintenance
#
# All indicators below are pure pandas/numpy implementations
```

---

## Indicator Library

### Core Indicators (Must Have)

#### 1. Moving Averages

```python
def sma(series: pd.Series, period: int) -> pd.Series:
    """Simple Moving Average"""
    return series.rolling(window=period, min_periods=period).mean()

def ema(series: pd.Series, period: int) -> pd.Series:
    """Exponential Moving Average (Wilder's smoothing)"""
    return series.ewm(span=period, adjust=False).mean()

def vwap(df: pd.DataFrame) -> pd.Series:
    """Volume-Weighted Average Price"""
    typical_price = (df['high'] + df['low'] + df['close']) / 3
    vwap_value = (typical_price * df['volume']).cumsum() / df['volume'].cumsum()
    return vwap_value

# Usage example:
df['ema_9'] = ema(df['close'], 9)
df['ema_30'] = ema(df['close'], 30)
df['sma_50'] = sma(df['close'], 50)
df['vwap'] = vwap(df)
```

#### 2. Volatility Indicators

```python
def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """
    Average True Range (Wilder's smoothing)

    Measures market volatility. Used for:
    - Position sizing
    - Stop loss placement
    - Target calculation
    """
    high = df['high']
    low = df['low']
    close = df['close']

    # True Range calculation
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))

    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)

    # Wilder's smoothing (EMA-style)
    atr_series = tr.ewm(alpha=1/period, adjust=False).mean()

    return atr_series

def bollinger_bands(series: pd.Series, period: int = 20, std_dev: float = 2.0) -> pd.DataFrame:
    """Bollinger Bands"""
    middle = sma(series, period)
    std = series.rolling(window=period).std()

    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)

    bandwidth = (upper - lower) / middle
    percent_b = (series - lower) / (upper - lower)

    return pd.DataFrame({
        'bb_middle': middle,
        'bb_upper': upper,
        'bb_lower': lower,
        'bb_bandwidth': bandwidth,
        'bb_percent_b': percent_b
    })

def keltner_channels(df: pd.DataFrame, ema_period: int = 20,
                     atr_period: int = 10, atr_mult: float = 2.0) -> pd.DataFrame:
    """Keltner Channels"""
    middle = ema(df['close'], ema_period)
    atr_value = atr(df, atr_period)

    upper = middle + (atr_value * atr_mult)
    lower = middle - (atr_value * atr_mult)

    return pd.DataFrame({
        'kc_middle': middle,
        'kc_upper': upper,
        'kc_lower': lower,
        'kc_atr': atr_value
    })

# Usage example:
df['atr'] = atr(df, 14)
df['atr_30'] = atr(df, 30)
bb = bollinger_bands(df['close'], 20, 2.0)
df = pd.concat([df, bb], axis=1)
kc = keltner_channels(df, 20, 10, 2.0)
df = pd.concat([df, kc], axis=1)
```

#### 3. Momentum Indicators

```python
def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """
    Relative Strength Index

    0-100 scale:
    - >70 = Overbought
    - <30 = Oversold
    """
    delta = series.diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()

    rs = avg_gain / avg_loss
    rsi_value = 100 - (100 / (1 + rs))

    return rsi_value

def macd(series: pd.Series, fast: int = 12, slow: int = 26,
         signal: int = 9) -> pd.DataFrame:
    """MACD (Moving Average Convergence Divergence)"""
    ema_fast = ema(series, fast)
    ema_slow = ema(series, slow)

    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line

    return pd.DataFrame({
        'macd': macd_line,
        'macd_signal': signal_line,
        'macd_histogram': histogram
    })

def stoch_oscillator(df: pd.DataFrame, k_period: int = 14,
                     d_period: int = 3) -> pd.DataFrame:
    """Stochastic Oscillator"""
    low_min = df['low'].rolling(window=k_period).min()
    high_max = df['high'].rolling(window=k_period).max()

    k_percent = 100 * ((df['close'] - low_min) / (high_max - low_min))
    d_percent = k_percent.rolling(window=d_period).mean()

    return pd.DataFrame({
        'stoch_k': k_percent,
        'stoch_d': d_percent
    })

# Usage example:
df['rsi'] = rsi(df['close'], 14)
macd_df = macd(df['close'], 12, 26, 9)
df = pd.concat([df, macd_df], axis=1)
stoch_df = stoch_oscillator(df, 14, 3)
df = pd.concat([df, stoch_df], axis=1)
```

#### 4. Volume Indicators

```python
def adv(df: pd.DataFrame, period: int = 20) -> pd.Series:
    """Average Daily Volume (dollar volume)"""
    dollar_volume = df['close'] * df['volume']
    return dollar_volume.rolling(window=period, min_periods=1).mean()

def volume_profile_tier(df: pd.DataFrame, n_tiers: int = 3) -> pd.Series:
    """
    Volume Profile Tier

    Classifies each bar's volume into tiers:
    - Tier 1: Highest volume (top 33%)
    - Tier 2: Medium volume (middle 33%)
    - Tier 3: Low volume (bottom 33%)
    """
    volume_percentiles = df['volume'].rank(pct=True)

    tiers = pd.cut(
        volume_percentiles,
        bins=[0, 1/n_tiers, 2/n_tiers, 1.0],
        labels=[f'Tier {i+1}' for i in range(n_tiers)],
        include_lowest=True
    )

    return tiers

def obv(df: pd.DataFrame) -> pd.Series:
    """On-Balance Volume"""
    obv_value = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
    return obv_value

# Usage example:
df['adv20'] = adv(df, 20)
df['volume_tier'] = volume_profile_tier(df, 3)
df['obv'] = obv(df)
```

#### 5. Price Derivatives

```python
def rate_of_change(series: pd.Series, period: int = 10) -> pd.Series:
    """Rate of Change (ROC) - % change over period"""
    return ((series - series.shift(period)) / series.shift(period)) * 100

def momentum(series: pd.Series, period: int = 10) -> pd.Series:
    """Momentum - absolute price change over period"""
    return series - series.shift(period)

def williams_r(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Williams %R"""
    high_max = df['high'].rolling(window=period).max()
    low_min = df['low'].rolling(window=period).min()

    wr = -100 * ((high_max - df['close']) / (high_max - low_min))

    return wr

# Usage example:
df['roc_10'] = rate_of_change(df['close'], 10)
df['momentum_5'] = momentum(df['close'], 5)
df['williams_r'] = williams_r(df, 14)
```

### Extension Indicators (For Mean Reversion)

#### Extension Metrics

```python
def ema_distance(df: pd.DataFrame, ema_period: int = 9) -> pd.Series:
    """
    Distance from EMA as multiple of ATR

    Used to measure how extended price is from mean.
    Positive = above EMA, Negative = below EMA
    """
    ema_value = ema(df['close'], ema_period)
    atr_value = atr(df, 14)

    distance = (df['close'] - ema_value) / atr_value

    return distance

def extension_score(df: pd.DataFrame, short_ema: int = 9,
                    long_ema: int = 30, lookback: int = 14) -> pd.Series:
    """
    Extension Score (0-100)

    Combines multiple extension metrics:
    - EMA distance (short and long)
    - Slope (rate of change)
    - Position in recent range
    """
    # EMA distances
    dist_short = ema_distance(df, short_ema)
    dist_long = ema_distance(df, long_ema)

    # Normalize to 0-100 based on lookback
    dist_short_norm = (dist_short - dist_short.rolling(lookback).min()) / \
                      (dist_short.rolling(lookback).max() - dist_short.rolling(lookback).min()) * 100

    # Slope (ROC over recent period)
    slope = rate_of_change(df['close'], lookback)

    # Position in range
    range_high = df['high'].rolling(lookback).max()
    range_low = df['low'].rolling(lookback).min()
    position_pct = ((df['close'] - range_low) / (range_high - range_low)) * 100

    # Combine (weighted average)
    score = (dist_short_norm * 0.4 + position_pct * 0.4 + slope * 0.2)

    return score

# Usage example:
df['ema9_distance'] = ema_distance(df, 9)
df['ema30_distance'] = ema_distance(df, 30)
df['extension_score'] = extension_score(df, 9, 30, 14)
```

#### Parabolic Detection

```python
def parabolic_score(df: pd.DataFrame, ema_period: int = 9,
                    slope_periods: list = [3, 7, 14]) -> pd.Series:
    """
    Parabolic Score (0-100)

    Detects accelerating upward moves:
    - High EMA distance
    - Increasing slope (acceleration)
    - Multiple expanding gaps
    """
    # EMA distance
    dist = ema_distance(df, ema_period)

    # Slopes at multiple timeframes
    slopes = [rate_of_change(df['close'], p) for p in slope_periods]

    # Slope acceleration (short slope > long slope)
    acceleration = slopes[0] - slopes[-1]  # 3-period - 14-period

    # Count recent gaps
    gap_pct = (df['open'] / df['close'].shift(1) - 1) * 100
    recent_gaps = (gap_pct.rolling(5).sum() > 0).astype(int)

    # Combine signals
    dist_norm = ((dist - dist.rolling(50).min()) /
                 (dist.rolling(50).max() - dist.rolling(50).min())) * 100

    score = (dist_norm * 0.4 +
             (acceleration * 10) * 0.3 +
             recent_gaps * 20 * 0.3)

    return score.clip(0, 100)

# Usage example:
df['parabolic_score'] = parabolic_score(df, 9, [3, 7, 14])
# Parabolic condition: score > 70
```

---

## Building Custom Indicators

### Template for Custom Indicators

```python
def custom_indicator(df: pd.DataFrame, **params) -> pd.Series:
    """
    Template for custom indicator

    Steps:
    1. Validate inputs
    2. Calculate intermediate values
    3. Apply indicator logic
    4. Return result
    """

    # 1. Validate inputs
    required_columns = ['open', 'high', 'low', 'close', 'volume']
    if not all(col in df.columns for col in required_columns):
        raise ValueError(f"DataFrame must have: {required_columns}")

    # 2. Extract parameters with defaults
    period = params.get('period', 14)
    multiplier = params.get('multiplier', 2.0)

    # 3. Calculate indicator
    # ... your logic here ...

    # 4. Return result
    return df['result_column']
```

### Example: Gap Fade Indicator

```python
def gap_fade_strength(df: pd.DataFrame, lookback: int = 20) -> pd.DataFrame:
    """
    Measures strength of gap fade signal

    Combines:
    - Gap size
    - Volume confirmation
    - Pre-market hold
    - Intraday fade progress
    """
    # Gap metrics
    df['gap_pct'] = (df['open'] / df['close'].shift(1) - 1) * 100
    df['gap_vs_range'] = (df['open'] - df['close'].shift(1)) / df['high'].shift(1) - df['low'].shift(1)

    # Volume confirmation
    df['volume_ratio'] = df['volume'] / df['volume'].rolling(30).mean()

    # Hold strength (how well gap held)
    df['hold_range'] = (df['high'] - df['open']) / df['open'] * 100

    # Fade progress
    df['fade_progress'] = (df['open'] - df['close']) / (df['high'] - df['low']) * 100

    # Combine into strength score
    df['gap_fade_score'] = (
        (df['gap_pct'] > 2.0).astype(int) * 25 +
        (df['volume_ratio'] > 1.5).astype(int) * 25 +
        (df['hold_range'] < 0.5).astype(int) * 25 +
        (df['fade_progress'] > 50).astype(int) * 25
    )

    return df[['gap_pct', 'gap_vs_range', 'volume_ratio',
               'hold_range', 'fade_progress', 'gap_fade_score']]
```

### Example: Multi-Timeframe Confirmation

```python
def mtf_confirmation(df_daily: pd.DataFrame, df_hourly: pd.DataFrame,
                    indicator: str = 'ema') -> pd.Series:
    """
    Multi-Timeframe Confirmation

    Checks if signal is confirmed across timeframes
    """
    # Resample hourly to daily
    hourly_daily = df_hourly.resample('D').agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    })

    # Calculate indicator on both timeframes
    if indicator == 'ema':
        daily_signal = df_daily['close'] > ema(df_daily['close'], 9)
        hourly_signal = hourly_daily['close'] > ema(hourly_daily['close'], 9)

    # Confirm if both agree
    confirmation = daily_signal & hourly_signal

    return confirmation
```

---

## Position Sizing Methods

### Method 1: Fixed Dollar Risk

**Simple**: Risk same dollar amount per trade

```python
def fixed_dollar_risk_sizing(entry_price: float, stop_price: float,
                             risk_dollars: float = 1000) -> dict:
    """
    Fixed dollar risk per trade

    Example: Risk $1000 per trade regardless of account size
    """
    risk_per_share = abs(entry_price - stop_price)
    shares = int(risk_dollars / risk_per_share)

    position_size = shares * entry_price

    return {
        'shares': shares,
        'position_size': position_size,
        'risk_dollars': risk_dollars,
        'risk_r': risk_dollars / risk_dollars  # Always 1R
    }
```

### Method 2: Fixed Percentage Risk

**Proportional**: Risk same % of account per trade

```python
def fixed_pct_risk_sizing(entry_price: float, stop_price: float,
                          account_value: float, risk_pct: float = 0.01) -> dict:
    """
    Fixed percentage risk per trade

    Example: Risk 1% of account per trade
    """
    risk_dollars = account_value * risk_pct
    risk_per_share = abs(entry_price - stop_price)
    shares = int(risk_dollars / risk_per_share)

    position_size = shares * entry_price

    return {
        'shares': shares,
        'position_size': position_size,
        'risk_dollars': risk_dollars,
        'risk_r': 1.0,  # By definition
        'risk_pct_of_account': risk_pct * 100
    }
```

### Method 3: ATR-Based Sizing (Volatility Adjusted)

**Adaptive**: Size positions based on market volatility

```python
def atr_based_sizing(entry_price: float, atr: float,
                     account_value: float, risk_pct: float = 0.01,
                     atr_multiplier: float = 0.8) -> dict:
    """
    ATR-based position sizing

    Stop = atr_multiplier * ATR away from entry
    Position sized to risk risk_pct of account
    """
    # Calculate stop distance
    stop_distance = atr * atr_multiplier

    # Calculate risk amount
    risk_dollars = account_value * risk_pct

    # Calculate shares
    shares = int(risk_dollars / stop_distance)

    position_size = shares * entry_price
    stop_price = entry_price - stop_distance  # For long

    return {
        'shares': shares,
        'position_size': position_size,
        'stop_price': stop_price,
        'risk_dollars': risk_dollars,
        'atr': atr,
        'risk_r': 1.0
    }
```

### Method 4: Kelly Criterion (Optimal Growth)

**Mathematical**: Calculate optimal position size for growth

```python
def kelly_sizing(entry_price: float, stop_price: float, target_price: float,
                win_rate: float, account_value: float,
                kelly_fraction: float = 0.25) -> dict:
    """
    Kelly Criterion position sizing

    WARNING: Use fraction of Kelly (quarter-Kelly is common)
    Full Kelly is too aggressive for most traders
    """
    # Calculate win/loss amounts
    win_amount = abs(target_price - entry_price)
    loss_amount = abs(entry_price - stop_price)

    # Win/loss ratio
    win_loss_ratio = win_amount / loss_amount

    # Kelly %
    kelly_pct = win_rate - ((1 - win_rate) / win_loss_ratio)

    # Use fraction of Kelly
    adjusted_kelly_pct = kelly_pct * kelly_fraction

    # Calculate position
    risk_dollars = account_value * adjusted_kelly_pct
    shares = int(risk_dollars / loss_amount)

    position_size = shares * entry_price

    return {
        'shares': shares,
        'position_size': position_size,
        'kelly_pct': kelly_pct * 100,
        'adjusted_kelly_pct': adjusted_kelly_pct * 100,
        'risk_dollars': risk_dollars,
        'kelly_fraction': kelly_fraction
    }
```

### Position Sizing Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Fixed Dollar** | Simple, predictable | Doesn't scale with account | Small accounts, beginners |
| **Fixed %** | Scales with account | Risk varies with volatility | General trading |
| **ATR-Based** | Adjusts for volatility | Requires ATR calculation | Most trading strategies |
| **Kelly** | Optimal growth | Too aggressive, requires good data | Advanced traders (use fraction) |

---

## Pyramiding Strategies

### What Is Pyramiding?

Adding to winning positions as they move in your favor.

### Pyramiding Method 1: Fixed Add-Ons

```python
def pyramid_fixed_addons(initial_entry: float, stop_price: float,
                        target_price: float, initial_shares: int,
                        num_addons: int = 2, addon_pct: float = 0.5) -> dict:
    """
    Fixed add-on pyramiding

    Add fixed % of initial position at predetermined levels
    """
    add_levels = []
    total_shares = initial_shares
    total_cost = initial_entry * initial_shares

    for i in range(1, num_addons + 1):
        # Calculate add level (spread between entry and target)
        level_progress = i / (num_addons + 1)
        add_price = initial_entry + (target_price - initial_entry) * level_progress

        # Calculate add-on shares
        addon_shares = int(initial_shares * addon_pct)

        add_levels.append({
            'level': i,
            'price': add_price,
            'shares': addon_shares,
            'cost': addon_shares * add_price
        })

        total_shares += addon_shares
        total_cost += addon_shares * add_price

    avg_price = total_cost / total_shares
    total_potential_profit = (target_price - avg_price) * total_shares

    return {
        'initial_shares': initial_shares,
        'add_levels': add_levels,
        'total_shares': total_shares,
        'avg_price': avg_price,
        'total_cost': total_cost,
        'total_potential_profit': total_potential_profit
    }
```

### Pyramiding Method 2: Volatility-Adjusted

```python
def pyramid_volatility_adjusted(initial_entry: float, atr: float,
                                initial_shares: int, num_addons: int = 2,
                                atr_spacing: float = 1.5) -> dict:
    """
    Volatility-adjusted pyramiding

    Add positions at ATR-based intervals
    """
    add_levels = []
    total_shares = initial_shares
    total_cost = initial_entry * initial_shares

    for i in range(1, num_addons + 1):
        # Add level is ATR-spaced above previous level
        if i == 1:
            add_price = initial_entry + (atr * atr_spacing)
        else:
            add_price = add_levels[-1]['price'] + (atr * atr_spacing)

        # Add-on shares (could reduce size as price increases)
        addon_shares = int(initial_shares * 0.5)  # Half size

        add_levels.append({
            'level': i,
            'price': add_price,
            'shares': addon_shares,
            'cost': addon_shares * add_price,
            'atr_from_entry': (add_price - initial_entry) / atr
        })

        total_shares += addon_shares
        total_cost += addon_shares * add_price

    avg_price = total_cost / total_shares

    return {
        'initial_shares': initial_shares,
        'add_levels': add_levels,
        'total_shares': total_shares,
        'avg_price': avg_price,
        'total_cost': total_cost
    }
```

### Pyramiding Risk Management

```python
def pyramid_stop_management(initial_entry: float, initial_stop: float,
                           add_levels: list, trailing_stop_atr: float = 1.0,
                           atr: float = None) -> dict:
    """
    Manage stops when pyramiding

    Strategy: Move stop to breakeven after first add-on,
              then trail by ATR
    """
    stops = []

    # Initial stop
    stops.append({
        'position': 'Initial',
        'stop_price': initial_stop,
        'action': 'Initial stop placement'
    })

    # After first add-on: Move to breakeven
    if len(add_levels) > 0:
        stops.append({
            'position': 'After Add 1',
            'stop_price': initial_entry,  # Breakeven
            'action': 'Moved to breakeven'
        })

        # After subsequent add-ons: Trail by ATR
        for i, level in enumerate(add_levels[1:], start=2):
            if atr:
                trail_stop = level['price'] - (atr * trailing_stop_atr)
                stops.append({
                    'position': f'After Add {i}',
                    'stop_price': trail_stop,
                    'action': f'Trailing stop ({trailing_stop_atr}x ATR)'
                })

    return stops
```

### Pyramiding Rules

1. **Only pyramid winners**: Never add to losing positions
2. **Reduced size**: Each add-on should be smaller than initial
3. **Predefined levels**: Know your add levels before entering
4. **Stop management**: Move stop to breakeven after first add
5. **Maximum pyramids**: Usually 2-3 add-ons max

---

## Capital Recycling

### What Is Capital Recycling?

Reusing capital + profits from closed trades for new trades.

### Simple Recycling (100% Reinvestment)

```python
def simple_recycling(account_value: float, win_rate: float,
                    avg_win_r: float, avg_loss_r: float,
                    num_trades: int) -> dict:
    """
    Simple 100% recycling simulation

    Reinvest all capital + profits on each trade
    """
    equity = account_value
    equity_curve = [equity]

    for i in range(num_trades):
        # Determine win/loss based on win_rate
        is_win = np.random.random() < win_rate

        if is_win:
            result_r = avg_win_r
        else:
            result_r = avg_loss_r

        # Calculate P&L
        risk_pct = 0.01  # 1% risk per trade
        risk_dollars = equity * risk_pct
        pnl_dollars = risk_dollars * result_r

        # Update equity
        equity += pnl_dollars
        equity_curve.append(equity)

    total_return = (equity - account_value) / account_value

    return {
        'initial_equity': account_value,
        'final_equity': equity,
        'total_return_pct': total_return * 100,
        'equity_curve': equity_curve
    }
```

### Fractional Recycling (Conservative)

```python
def fractional_recycling(account_value: float, win_rate: float,
                        avg_win_r: float, avg_loss_r: float,
                        num_trades: int, reinvest_pct: float = 0.5) -> dict:
    """
    Fractional recycling

    Only reinvest portion of profits, withdraw rest
    """
    base_equity = account_value
    equity = account_value
    equity_curve = [equity]
    withdrawn = []

    for i in range(num_trades):
        # Determine win/loss
        is_win = np.random.random() < win_rate

        if is_win:
            result_r = avg_win_r
        else:
            result_r = avg_loss_r

        # Calculate P&L
        risk_pct = 0.01
        risk_dollars = equity * risk_pct
        pnl_dollars = risk_dollars * result_r

        # Update equity
        equity += pnl_dollars

        # Withdraw portion of profits
        if pnl_dollars > 0:
            withdrawal = pnl_dollars * (1 - reinvest_pct)
            equity -= withdrawal
            withdrawn.append(withdrawal)
        else:
            withdrawn.append(0)

        equity_curve.append(equity)

    total_withdrawn = sum(withdrawn)
    total_return = (equity - base_equity) / base_equity

    return {
        'initial_equity': account_value,
        'final_equity': equity,
        'total_withdrawn': total_withdrawn,
        'total_return_pct': total_return * 100,
        'equity_curve': equity_curve,
        'withdrawals': withdrawn
    }
```

### Kelly Recycling (Optimal Growth)

```python
def kelly_recycling(account_value: float, win_rate: float,
                   avg_win_r: float, avg_loss_r: float,
                   num_trades: int, kelly_fraction: float = 0.25) -> dict:
    """
    Kelly-based recycling

    Position size adjusts based on Kelly criterion
    """
    equity = account_value
    equity_curve = [equity]
    position_sizes = []

    # Calculate Kelly %
    win_loss_ratio = abs(avg_win_r / avg_loss_r)
    kelly_pct = win_rate - ((1 - win_rate) / win_loss_ratio)
    adjusted_kelly_pct = kelly_pct * kelly_fraction

    for i in range(num_trades):
        # Determine win/loss
        is_win = np.random.random() < win_rate

        if is_win:
            result_r = avg_win_r
        else:
            result_r = avg_loss_r

        # Calculate position size (based on Kelly)
        risk_dollars = equity * adjusted_kelly_pct

        # Calculate P&L
        pnl_dollars = risk_dollars * result_r

        # Track position size
        position_sizes.append({
            'trade': i + 1,
            'equity_before': equity,
            'position_size_pct': adjusted_kelly_pct * 100,
            'position_size_dollars': risk_dollars
        })

        # Update equity
        equity += pnl_dollars
        equity_curve.append(equity)

    total_return = (equity - account_value) / account_value

    return {
        'initial_equity': account_value,
        'final_equity': equity,
        'kelly_pct': kelly_pct * 100,
        'adjusted_kelly_pct': adjusted_kelly_pct * 100,
        'total_return_pct': total_return * 100,
        'equity_curve': equity_curve,
        'position_sizes': position_sizes
    }
```

### Recycling Comparison

| Method | Growth | Risk | Best For |
|--------|--------|------|----------|
| **Simple 100%** | Max | High | Aggressive growth, high win rate |
| **Fractional** | Medium | Medium | Balanced growth + income |
| **Kelly** | Optimal | Variable | Professional traders (use fraction) |

---

## Execution Strategies

### Strategy 1: Immediate Entry

```python
def immediate_entry(signal: dict, current_price: float,
                   position_sizing_fn, **sizing_params) -> dict:
    """
    Enter immediately on signal

    No waiting for confirmation
    """
    # Calculate position size
    sizing = position_sizing_fn(
        entry_price=current_price,
        stop_price=signal['stop_price'],
        **sizing_params
    )

    return {
        'entry_price': current_price,
        'entry_time': datetime.now(),
        'shares': sizing['shares'],
        'position_size': sizing['position_size'],
        'stop_price': sizing.get('stop_price', signal['stop_price']),
        'target_price': signal.get('target_price'),
        'entry_reason': 'Immediate entry on signal'
    }
```

### Strategy 2: Confirmation Entry

```python
def confirmation_entry(signal: dict, bars: list,
                      position_sizing_fn, confirmation_bars: int = 1,
                      **sizing_params) -> dict:
    """
    Wait for confirmation before entering

    Examples:
    - For gap fade: Wait for first red bar after gap
    - For breakout: Wait for close above breakout level
    """
    # Check for confirmation
    confirmed = False
    entry_price = None
    entry_bar_idx = None

    for i in range(confirmation_bars, len(bars)):
        bar = bars[i]

        # Confirmation logic (example: weak close)
        if bar['close'] < bar['open']:
            confirmed = True
            entry_price = bar['close']
            entry_bar_idx = i
            break

    if not confirmed:
        return {'error': 'Confirmation not triggered'}

    # Calculate position size
    sizing = position_sizing_fn(
        entry_price=entry_price,
        stop_price=signal['stop_price'],
        **sizing_params
    )

    return {
        'entry_price': entry_price,
        'entry_time': bar['datetime'],
        'shares': sizing['shares'],
        'position_size': sizing['position_size'],
        'stop_price': sizing.get('stop_price', signal['stop_price']),
        'target_price': signal.get('target_price'),
        'entry_bar_index': entry_bar_idx,
        'entry_reason': f'Confirmation after {confirmation_bars} bars'
    }
```

### Strategy 3: Limit Order Entry

```python
def limit_order_entry(signal: dict, current_price: float,
                     limit_discount: float = 0.001,
                     position_sizing_fn, **sizing_params) -> dict:
    """
    Place limit order at discount to current price

    Good for:
    - Getting better fill
    - Avoiding chasing
    - Reducing slippage
    """
    # Calculate limit price
    if signal['direction'] == 'LONG':
        limit_price = current_price * (1 - limit_discount)
    else:  # SHORT
        limit_price = current_price * (1 + limit_discount)

    # Calculate position size
    sizing = position_sizing_fn(
        entry_price=limit_price,
        stop_price=signal['stop_price'],
        **sizing_params
    )

    return {
        'entry_type': 'LIMIT',
        'limit_price': limit_price,
        'current_price': current_price,
        'discount_pct': limit_discount * 100,
        'shares': sizing['shares'],
        'position_size': sizing['position_size'],
        'stop_price': sizing.get('stop_price', signal['stop_price']),
        'target_price': signal.get('target_price'),
        'entry_reason': f'Limit order at {limit_discount*100:.1f}% discount'
    }
```

---

## Stop Management

### Stop Types

#### 1. Fixed Stop (Price-Based)

```python
def fixed_stop(entry_price: float, direction: str,
               stop_distance: float) -> float:
    """
    Fixed dollar or percentage stop

    Example: Stop $2 below entry, or 2% below entry
    """
    if direction == 'LONG':
        stop_price = entry_price - stop_distance
    else:  # SHORT
        stop_price = entry_price + stop_distance

    return stop_price
```

#### 2. ATR Stop (Volatility-Based)

```python
def atr_stop(entry_price: float, direction: str,
             atr: float, atr_multiplier: float = 1.5) -> float:
    """
    ATR-based stop

    Stop distance = ATR * multiplier
    Adjusts automatically to market volatility
    """
    stop_distance = atr * atr_multiplier

    if direction == 'LONG':
        stop_price = entry_price - stop_distance
    else:  # SHORT
        stop_price = entry_price + stop_distance

    return stop_price
```

#### 3. Trailing Stop (Breakeven + Trail)

```python
class TrailingStop:
    """Trailing stop management"""

    def __init__(self, entry_price: float, direction: str,
                 initial_stop: float, trail_atr: float,
                 atr: float, breakeven_after_r: float = 1.0):
        self.entry_price = entry_price
        self.direction = direction
        self.initial_stop = initial_stop
        self.trail_atr = trail_atr
        self.atr = atr
        self.breakeven_after_r = breakeven_after_r

        self.highest_price = entry_price  # For longs
        self.lowest_price = entry_price   # For shorts
        self.current_stop = initial_stop

    def update(self, high: float, low: float) -> dict:
        """Update stop based on new price data"""
        stop_action = None

        if self.direction == 'LONG':
            # Update highest price
            if high > self.highest_price:
                self.highest_price = high

                # Check if breakeven should be triggered
                unrealized_r = (self.highest_price - self.entry_price) / \
                               (self.entry_price - self.initial_stop)

                if unrealized_r >= self.breakeven_after_r:
                    # Move to breakeven
                    new_stop = self.entry_price
                    if new_stop > self.current_stop:
                        self.current_stop = new_stop
                        stop_action = 'Moved to breakeven'

                # Trail stop
                trail_stop = self.highest_price - (self.trail_atr * self.atr)
                if trail_stop > self.current_stop:
                    self.current_stop = trail_stop
                    stop_action = 'Trailing stop raised'

        else:  # SHORT
            # Update lowest price
            if low < self.lowest_price:
                self.lowest_price = low

                # Check if breakeven should be triggered
                unrealized_r = (self.entry_price - self.lowest_price) / \
                               (self.initial_stop - self.entry_price)

                if unrealized_r >= self.breakeven_after_r:
                    # Move to breakeven
                    new_stop = self.entry_price
                    if new_stop < self.current_stop:
                        self.current_stop = new_stop
                        stop_action = 'Moved to breakeven'

                # Trail stop
                trail_stop = self.lowest_price + (self.trail_atr * self.atr)
                if trail_stop < self.current_stop:
                    self.current_stop = trail_stop
                    stop_action = 'Trailing stop lowered'

        return {
            'current_stop': self.current_stop,
            'highest_price': self.highest_price if self.direction == 'LONG' else None,
            'lowest_price': self.lowest_price if self.direction == 'SHORT' else None,
            'action': stop_action
        }
```

---

## Target Management

### Target Types

#### 1. Fixed Target (R-Multiple)

```python
def fixed_r_target(entry_price: float, direction: str,
                   stop_distance: float, target_r: float = 2.0) -> float:
    """
    Fixed R-multiple target

    Example: Target at 2R (2x the risk)
    """
    target_distance = stop_distance * target_r

    if direction == 'LONG':
        target_price = entry_price + target_distance
    else:  # SHORT
        target_price = entry_price - target_distance

    return target_price
```

#### 2. ATR Target (Volatility-Based)

```python
def atr_target(entry_price: float, direction: str,
               atr: float, atr_multiplier: float = 2.0) -> float:
    """
    ATR-based target

    Target = ATR * multiplier away from entry
    """
    target_distance = atr * atr_multiplier

    if direction == 'LONG':
        target_price = entry_price + target_distance
    else:  # SHORT
        target_price = entry_price - target_distance

    return target_price
```

#### 3. Partial Targets (Scale Out)

```python
def partial_targets(entry_price: float, direction: str,
                   stop_distance: float, target_levels: list) -> list:
    """
    Partial targets at multiple levels

    Example: Exit 50% at 1R, 30% at 2R, 20% at 3R
    """
    targets = []

    for level in target_levels:
        r_multiple = level['r']
        exit_pct = level['exit_pct']

        target_distance = stop_distance * r_multiple

        if direction == 'LONG':
            target_price = entry_price + target_distance
        else:  # SHORT
            target_price = entry_price - target_distance

        targets.append({
            'level': len(targets) + 1,
            'r_multiple': r_multiple,
            'target_price': target_price,
            'exit_pct': exit_pct
        })

    return targets

# Example usage:
target_levels = [
    {'r': 1.5, 'exit_pct': 0.5},   # Exit 50% at 1.5R
    {'r': 2.5, 'exit_pct': 0.3},   # Exit 30% at 2.5R
    {'r': 4.0, 'exit_pct': 0.2},   # Exit 20% at 4R
]
```

---

## Complete Execution Framework

### Full Trade Simulator

```python
class CompleteTradeSimulator:
    """
    Complete execution simulation with:
    - Entry logic
    - Position sizing
    - Stop management
    - Target management
    - Exit logic
    - Pyramiding
    """

    def __init__(self, account_value: float, config: dict = None):
        self.account_value = account_value
        self.config = config or {}

        # Execution settings
        self.entry_method = self.config.get('entry_method', 'confirmation')
        self.position_sizing_method = self.config.get('sizing_method', 'atr_based')
        self.stop_method = self.config.get('stop_method', 'trailing_atr')
        self.target_method = self.config.get('target_method', 'partial_r')

        # Parameters
        self.risk_pct = self.config.get('risk_pct', 0.01)
        self.atr_period = self.config.get('atr_period', 14)
        self.stop_atr_mult = self.config.get('stop_atr_mult', 0.8)
        self.target_atr_mult = self.config.get('target_atr_mult', 2.0)
        self.trailing_atr_mult = self.config.get('trailing_atr_mult', 0.5)
        self.breakeven_after_r = self.config.get('breakeven_after_r', 1.0)

        # Pyramiding
        self.pyramid_enabled = self.config.get('pyramid_enabled', False)
        self.num_pyramids = self.config.get('num_pyramids', 2)

    def simulate_trade(self, signal: dict, intraday_data: list) -> dict:
        """
        Simulate complete trade from entry to exit
        """
        # Step 1: Calculate entry
        entry = self._calculate_entry(signal, intraday_data)

        if 'error' in entry:
            return entry

        # Step 2: Calculate position size
        sizing = self._calculate_position_size(entry, signal)

        # Step 3: Initialize stop management
        stop_manager = self._initialize_stop_manager(entry, signal)

        # Step 4: Initialize targets
        targets = self._calculate_targets(entry, signal)

        # Step 5: Simulate through bars
        trade_result = self._simulate_execution(
            entry, sizing, stop_manager, targets, intraday_data
        )

        return trade_result

    def _calculate_entry(self, signal: dict, bars: list) -> dict:
        """Calculate entry price and time"""
        if self.entry_method == 'immediate':
            return {
                'entry_price': bars[0]['open'],
                'entry_time': bars[0]['datetime'],
                'entry_bar_index': 0
            }
        elif self.entry_method == 'confirmation':
            # Wait for confirmation (example: weak close)
            for i, bar in enumerate(bars):
                if bar['close'] < bar['open']:
                    return {
                        'entry_price': bar['close'],
                        'entry_time': bar['datetime'],
                        'entry_bar_index': i,
                        'entry_reason': 'Confirmation: weak close'
                    }
            return {'error': 'No confirmation triggered'}

    def _calculate_position_size(self, entry: dict, signal: dict) -> dict:
        """Calculate position size"""
        if self.position_sizing_method == 'fixed_pct':
            return fixed_pct_risk_sizing(
                entry_price=entry['entry_price'],
                stop_price=signal['stop_price'],
                account_value=self.account_value,
                risk_pct=self.risk_pct
            )
        elif self.position_sizing_method == 'atr_based':
            return atr_based_sizing(
                entry_price=entry['entry_price'],
                atr=signal['atr'],
                account_value=self.account_value,
                risk_pct=self.risk_pct,
                atr_multiplier=self.stop_atr_mult
            )
        else:
            raise ValueError(f"Unknown sizing method: {self.position_sizing_method}")

    def _initialize_stop_manager(self, entry: dict, signal: dict) -> TrailingStop:
        """Initialize stop manager"""
        direction = signal.get('direction', 'LONG')

        if self.stop_method == 'trailing_atr':
            return TrailingStop(
                entry_price=entry['entry_price'],
                direction=direction,
                initial_stop=signal['stop_price'],
                trail_atr=self.trailing_atr_mult,
                atr=signal['atr'],
                breakeven_after_r=self.breakeven_after_r
            )
        else:
            raise ValueError(f"Unknown stop method: {self.stop_method}")

    def _calculate_targets(self, entry: dict, signal: dict) -> list:
        """Calculate profit targets"""
        if self.target_method == 'partial_r':
            return partial_targets(
                entry_price=entry['entry_price'],
                direction=signal.get('direction', 'LONG'),
                stop_distance=abs(entry['entry_price'] - signal['stop_price']),
                target_levels=[
                    {'r': 1.5, 'exit_pct': 0.5},
                    {'r': 2.5, 'exit_pct': 0.3},
                    {'r': 4.0, 'exit_pct': 0.2}
                ]
            )
        else:
            raise ValueError(f"Unknown target method: {self.target_method}")

    def _simulate_execution(self, entry: dict, sizing: dict,
                           stop_manager: TrailingStop, targets: list,
                           bars: list) -> dict:
        """Simulate trade execution through bars"""
        entry_bar = entry['entry_bar_index']
        entry_price = entry['entry_price']
        direction = 'LONG'  # or from signal

        # Track position state
        total_shares = sizing['shares']
        remaining_shares = total_shares
        realized_pnl = 0
        trades = []

        for i in range(entry_bar + 1, len(bars)):
            bar = bars[i]

            # Update trailing stop
            stop_update = stop_manager.update(bar['high'], bar['low'])
            current_stop = stop_update['current_stop']

            # Check for partial target exits
            for target in targets:
                if target['remaining_shares'] > 0:
                    if direction == 'LONG' and bar['high'] >= target['target_price']:
                        # Exit portion at target
                        exit_shares = int(remaining_shares * target['exit_pct'])
                        exit_pnl = (target['target_price'] - entry_price) * exit_shares
                        realized_pnl += exit_pnl
                        remaining_shares -= exit_shares

                        trades.append({
                            'exit_type': 'target',
                            'level': target['level'],
                            'price': target['target_price'],
                            'shares': exit_shares,
                            'pnl': exit_pnl,
                            'time': bar['datetime']
                        })

            # Check stop loss
            if direction == 'LONG' and bar['low'] <= current_stop:
                # Exit remaining at stop
                exit_pnl = (current_stop - entry_price) * remaining_shares
                realized_pnl += exit_pnl

                trades.append({
                    'exit_type': 'stop',
                    'price': current_stop,
                    'shares': remaining_shares,
                    'pnl': exit_pnl,
                    'time': bar['datetime'],
                    'reason': stop_update['action']
                })

                remaining_shares = 0
                break

            # Check EOD exit
            if i == len(bars) - 1 and remaining_shares > 0:
                exit_pnl = (bar['close'] - entry_price) * remaining_shares
                realized_pnl += exit_pnl

                trades.append({
                    'exit_type': 'eod',
                    'price': bar['close'],
                    'shares': remaining_shares,
                    'pnl': exit_pnl,
                    'time': bar['datetime']
                })

                remaining_shares = 0
                break

        # Calculate final metrics
        r_multiple = realized_pnl / (sizing['risk_dollars'] or 1)

        return {
            'entry_price': entry_price,
            'entry_time': entry['entry_time'],
            'total_shares': total_shares,
            'realized_pnl': realized_pnl,
            'r_multiple': r_multiple,
            'trades': trades,
            'final_stop': stop_manager.current_stop
        }
```

---

## Summary: Gold Standard Checklist

### Packages
- [ ] pandas >= 2.0.0
- [ ] numpy >= 1.24.0
- [ ] requests >= 2.31.0
- [ ] pandas-market-calendars >= 4.3.0
- [ ] No TA-Lib (use custom implementations)

### Indicators (Core)
- [ ] SMA, EMA, VWAP
- [ ] ATR, Bollinger Bands, Keltner Channels
- [ ] RSI, MACD, Stochastic
- [ ] ADV, Volume Profile, OBV
- [ ] Rate of Change, Momentum, Williams %R

### Indicators (Extension)
- [ ] EMA Distance, Extension Score
- [ ] Parabolic Score

### Position Sizing
- [ ] Fixed dollar risk
- [ ] Fixed percentage risk
- [ ] ATR-based sizing (default)
- [ ] Kelly criterion (optional)

### Execution
- [ ] Immediate entry
- [ ] Confirmation entry (default)
- [ ] Limit order entry

### Stop Management
- [ ] Fixed stop
- [ ] ATR stop (default)
- [ ] Trailing stop with breakeven

### Target Management
- [ ] Fixed R target
- [ ] ATR target
- [ ] Partial targets (scale out)

### Advanced
- [ ] Pyramiding (add to winners)
- [ ] Capital recycling
- [ ] Kelly-based sizing

---

**Document Status**: COMPLETE
**Version**: 1.0
**Last Updated**: 2026-01-29
