# EdgeDev Trading Platform - Comprehensive Gold Standard

**Foundation for AI Agent That Helps Build Trading Scanners and Backtests**

**Document Version:** 1.0
**Last Updated:** 2026-01-29
**Status:** COMPLETE - Ready for Production Use

---

## Executive Summary

This Gold Standard document is the definitive guide for building trading scanners and backtests in the EdgeDev ecosystem. It is based on comprehensive research of:

- **133+ scanner files** analyzed
- **6+ backtest engines** studied
- **75+ Backside B pattern variants** reviewed
- **Multiple Half A+ implementations** examined
- **Production code patterns** extracted

### Who This Is For

**Primary User:** A trader who:
- Describes setups in plain English
- Needs AI to write Python scanner/backtest code
- Validates results VISUALLY (charts with markers at localhost:5665/scan)
- Uses "A+ anchoring" method (extract params from example trades)
- Trades discretionary but wants systematic signals
- Scans 12k symbols (ETFs, NASDAQ, NYSE)
- Uses Polygon API for market data

**AI Agent Purpose:** Convert natural language descriptions into production-ready Python code that follows this gold standard.

---

## Table of Contents

1. [Scanner Standards](#1-scanner-standards)
2. [Backtest Standards](#2-backtest-standards)
3. [A+ Anchoring Method](#3-a-anchoring-method)
4. [Visual Validation Framework](#4-visual-validation-framework)
5. [Execution Strategies](#5-execution-strategies)
6. [Indicator Reference](#6-indicator-reference)
7. [Library Best Practices](#7-library-best-practices)
8. [Metrics Bible](#8-metrics-bible)
9. [Data Handling](#9-data-handling)
10. [Validation Framework](#10-validation-framework)
11. [Code Pattern Library](#11-code-pattern-library)

---

## 1. Scanner Standards

### 1.1 V31 Architecture (GOLD STANDARD - RECOMMENDED)

**What It Is:** Modern, scalable class-based scanner architecture

**Performance:** 360x faster than legacy (10-30 seconds vs 6-8 minutes)

**File Reference:** `/projects/edge-dev-main/MASTER_UNIFIED_SCANNER_TEMPLATE.py`

#### Core Structure

```python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional

class TradingScanner:
    """
    V31 Scanner Architecture - 5-Stage Pipeline

    Stages:
    1. fetch_grouped_data() - Fetch ALL tickers for ALL dates
    2a. compute_simple_features() - prev_close, adv20, price_range
    2b. apply_smart_filters() - Validate D0, preserve historical
    3a. compute_full_features() - EMA, ATR, slopes, etc.
    3b. detect_patterns() - Pattern detection logic
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner with date range"""
        # CRITICAL: Store user's original D0 range separately
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # Calculate historical data range (lookback buffer)
        lookback_buffer = self.params.get('abs_lookback_days', 1000) + 50
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')

        # API Configuration
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()

        # Workers for parallel processing
        self.stage1_workers = 5
        self.stage3_workers = 10

        # Parameters (flat structure)
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            # ... pattern-specific params
        }

    def run_scan(self):
        """Main execution: 5-stage pipeline"""
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

#### Required Methods

| Method | Purpose | Critical Requirements |
|--------|---------|----------------------|
| `__init__(api_key, d0_start, d0_end)` | Initialize | MUST calculate historical buffer |
| `run_scan()` | Main execution | Calls all 5 stages in order |
| `fetch_grouped_data()` | Stage 1 | Use mcal, parallel fetching |
| `compute_simple_features()` | Stage 2a | Per-ticker operations |
| `apply_smart_filters()` | Stage 2b | Separate historical/D0 |
| `compute_full_features()` | Stage 3a | All technical indicators |
| `detect_patterns()` | Stage 3b | Pattern-specific logic |

### 1.2 Seven Core Principles (MANDATORY)

#### Principle 1: Market Calendar Integration

```python
import pandas_market_calendars as mcal

def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
    """Get all valid trading days between start and end date"""
    nyse = mcal.get_calendar('NYSE')
    trading_days = nyse.valid_days(
        start_date=pd.to_datetime(start_date),
        end_date=pd.to_datetime(end_date)
    )
    return [date.strftime('%Y-%m-%d') for date in trading_days]
```

**WHY:** Accounts for holidays, early closes, skips weekends correctly

**ANTI-PATTERN to AVOID:**
```python
# ❌ WRONG - Does not account for holidays
if current_date.weekday() < 5:  # Monday-Friday
    # Process data
```

#### Principle 2: Historical Buffer Calculation

```python
def __init__(self, api_key: str, d0_start: str, d0_end: str):
    self.d0_start_user = d0_start
    self.d0_end_user = d0_end

    # CRITICAL: Calculate historical buffer
    lookback_buffer = self.params.get('abs_lookback_days', 1000) + 50
    scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
    self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
```

**WHY:** Indicators like ABS window need 1000+ days of history

#### Principle 3: Per-Ticker Operations

```python
# ✅ CORRECT: adv20 computed per ticker
df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)

# ❌ WRONG: adv20 computed across entire dataframe
df['adv20_usd'] = (df['close'] * df['volume']).rolling(20).mean()
```

**WHY:** Each ticker has different price/volume scales

#### Principle 4: Historical/D0 Separation

```python
def apply_smart_filters(self, df: pd.DataFrame):
    """CRITICAL: Separate historical from D0 output range"""

    # Separate historical from output range
    df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
    df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

    # Apply filters ONLY to D0 dates
    df_output_filtered = df_output_range[
        (df_output_range['prev_close'] >= self.params['price_min']) &
        (df_output_range['adv20_usd'] >= self.params['adv20_min_usd'])
    ].copy()

    # CRITICAL: COMBINE historical + filtered D0
    df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

    return df_combined
```

**WHY:** Historical data needed for ABS window calculations, only D0 dates need validation

#### Principle 5: Parallel Processing

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
        executor.submit(self._process_ticker, ticker_data): ticker_data[0]
        for ticker_data in ticker_data_list
    }
```

**WHY:** 360x speedup (6-8 minutes → 10-30 seconds)

#### Principle 6: Two-Pass Feature Computation

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
        group['atr'] = compute_atr(group)
        # ... more features
```

**WHY:** Don't compute expensive features on data that will be filtered

#### Principle 7: Pre-Sliced Parallel Processing

```python
def detect_patterns(self, df: pd.DataFrame):
    """Pre-slice data BEFORE parallel processing"""

    # Pre-slice ticker data
    ticker_data_list = [
        (ticker, ticker_df.copy(), d0_start_dt, d0_end_dt)
        for ticker, ticker_df in df.groupby('ticker')
    ]

    # Process in parallel with pre-sliced data
    with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
        futures = {
            executor.submit(self._process_ticker, ticker_data): ticker_data[0]
            for ticker_data in ticker_data_list
        }
```

**WHY:** Avoids data copying in parallel workers, 10-20% additional speedup

### 1.3 Standalone Script Architecture (Simple)

**When to Use:** Quick prototypes, testing, simple strategies

**File Reference:** `/projects/edge-dev-main/backend/SIMPLE_TEST_SCANNER.py`

```python
import pandas as pd
import numpy as np

# Required: SYMBOLS list
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'SHOP', 'SQ'
]

# Required: scan_symbol function
def scan_symbol(symbol, start_date, end_date):
    """Scanner function - must match this signature"""
    try:
        # Detection logic here

        if signal_detected:
            result = {
                'symbol': symbol,
                'date': end_date,
                'gap_percent': gap_percent,
                'volume_ratio': volume_ratio,
                # ... other fields
            }
            return [result]

        return []

    except Exception as e:
        print(f"Error scanning {symbol}: {str(e)}")
        return []

# Optional: Scanner configuration
SCANNER_CONFIG = {
    'name': 'Simple Scanner',
    'description': 'Simple standalone scanner',
    'timeframe': 'Daily'
}
```

**Key Requirements:**
- `SYMBOLS` list at module level
- `scan_symbol(symbol, start_date, end_date)` function
- Returns list of dict results
- Optional `SCANNER_CONFIG` dict

### 1.4 Parameter System Design

```python
self.params = {
    # === Mass Parameters (shared across all patterns) ===
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # === Pattern-Specific Parameters ===
    # Example: Backside B
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,

    "trigger_mode": "D1_or_D2",
    "atr_mult": 0.9,
    "vol_mult": 0.9,

    "gap_div_atr_min": 0.75,
    "open_over_ema9_min": 0.9,
    "d1_green_atr_min": 0.30,
}
```

**Parameter Access Patterns:**
```python
# In __init__: Store as dict
self.params = {"price_min": 8.0, ...}

# In methods: Access via self.params
if r1['Close'] >= self.params['price_min']:
    ...

# In detection loop: Use local copy (faster)
P_local = self.params
if P_local["price_min"]:
    ...
```

### 1.5 Column Naming Convention

| Stage | Columns | Format |
|-------|---------|--------|
| Stage 1 Output | `ticker`, `date`, `open`, `high`, `low`, `close`, `volume` | lowercase |
| Stage 2a/2b | Add: `prev_close`, `adv20_usd`, `price_range` | lowercase |
| Stage 3a | Add: `ema_9`, `atr`, `vol_avg`, etc. | lowercase |
| Detection Loop | Access via: `r1['Close']`, `r0['atr']` | Capitalized |

**WHY:** Stage 1-3 use lowercase for DataFrame operations, detection loop uses capitalized Series access

---

## 2. Backtest Standards

### 2.1 Simple P&L Simulation (Fast Validation)

**File Reference:** `/projects/edge-dev-main/src/utils/backtest_script.py`

**When to Use:** Quick validation, strategy comparison, initial testing

```python
import pandas as pd
import numpy as np

# Key configuration variables
d_risk = 1000  # Risk per trade in dollars
p_risk = 0.01  # Risk percentage (1%)
start_capital = 100000

def comp_pnl(df_daily_pnl, start_capital):
    """Calculate compound P&L"""
    sim_pnl_comp = start_capital
    for i, row in df_daily_pnl.iterrows():
        if i == 0:
            prev_sim_pnl_comp = start_capital
        else:
            prev_sim_pnl_comp = df_daily_pnl.loc[i-1, 'sim_pnl_comp']
        df_daily_pnl.loc[i, 'sim_pnl_comp'] = (
            df_daily_pnl.loc[i, 'pnl'] * ((prev_sim_pnl_comp * p_risk) / d_risk) +
            prev_sim_pnl_comp
        )
    return df_daily_pnl

def stats_by_trade(df):
    """Calculate trade statistics"""
    if len(df) == 0:
        return {}

    win_trades = df[df['pnl'] > 0]
    loss_trades = df[df['pnl'] < 0]

    win_rate = len(win_trades) / len(df) if len(df) > 0 else 0
    avg_win = win_trades['R_pnl'].mean() if len(win_trades) > 0 else 0
    avg_loss = loss_trades['R_pnl'].mean() if len(loss_trades) > 0 else 0

    if abs(avg_loss) > 0:
        avg_wl_ratio = abs(avg_win) / abs(avg_loss)
    else:
        avg_wl_ratio = float('inf')

    total_profit = df['cum_R_pnl'].iloc[-1] if len(df) > 0 else 0
    ev = (win_rate * avg_win) + ((1 - win_rate) * avg_loss)
    kelly = win_rate - ((1 - win_rate) / avg_wl_ratio) if avg_wl_ratio > 0 else 0

    return {
        'total_trades': len(df),
        'winners': len(win_trades),
        'losers': len(loss_trades),
        'win_rate': win_rate,
        'avg_win': avg_win,
        'avg_loss': avg_loss,
        'avg_wl_ratio': avg_wl_ratio,
        'total_profit_r': total_profit,
        'expected_value': ev,
        'kelly': kelly
    }
```

**Required Metrics:**
- `total_trades`: Total number of trades
- `winners`: Winning trades count
- `losers`: Losing trades count
- `win_rate`: Percentage of winning trades
- `avg_win`: Average win amount (R-multiple)
- `avg_loss`: Average loss amount (R-multiple)
- `avg_wl_ratio`: Win/loss ratio
- `total_profit_r`: Total profit in R-multiples
- `expected_value`: Expected value per trade
- `kelly`: Kelly criterion

### 2.2 Enhanced Intraday Simulation (Accurate)

**File Reference:** `/projects/edge-dev-main/src/utils/enhanced_backtest_engine.py`

**When to Use:** Final validation, realistic testing, production deployment

```python
class EnhancedBacktestEngine:
    def __init__(self, config: Dict = None):
        self.config = config or {}

        # Risk management
        self.d_risk = self.config.get('risk_per_trade_dollars', 1000)
        self.p_risk = self.config.get('risk_percentage', 0.01)
        self.start_capital = self.config.get('start_capital', 100000)

        # Exit strategies
        self.exit_strategies = {
            'lc_momentum': {
                'profit_target_atr': 2.0,
                'stop_loss_atr': 0.8,
                'trailing_stop_atr': 0.5,
                'time_exit_minutes': 240,
                'volume_exit_threshold': 0.3
            },
            'parabolic': {
                'profit_target_atr': 3.0,
                'stop_loss_atr': 1.0,
                'trailing_stop_atr': 0.8,
                'time_exit_minutes': 180,
                'momentum_exit_threshold': 0.5
            }
        }

    def run_enhanced_backtest(self, scan_results: List[Dict]) -> Dict:
        """Run enhanced backtest with real intraday data"""
        all_trades = []

        for scan_result in scan_results:
            trade_result = self.simulate_trade_with_intraday_data(scan_result)
            if trade_result:
                all_trades.append(trade_result)

        performance_metrics = self.calculate_enhanced_metrics(all_trades)

        return {
            'success': True,
            'trades': all_trades,
            'summary': performance_metrics
        }
```

**Enhanced Features:**
- Real intraday data fetching from Polygon API
- Multiple exit strategies (momentum, parabolic)
- Trailing stops
- Volume-based exits
- Time-based exits
- Comprehensive performance analytics

---

## 3. A+ Anchoring Method

### 3.1 What Is A+ Anchoring?

**Definition:** Extracting precise scanner parameters from actual example trades

**Purpose:** Convert "I like this setup on AAPL" into exact parameter values

**Workflow:**
1. User provides example trade (ticker, date, chart)
2. AI extracts parameters that made that trade work
3. Scanner uses those exact parameters
4. Scanner finds similar setups across 12k symbols

### 3.2 Parameter Extraction Process

**Example:**

**User says:** "I like this AAPL trade from January 15th. It gapped up, had high volume, and the EMA slopes were strong."

**AI does:**

```python
# Step 1: Fetch data for AAPL on 2024-01-15
df = fetch_market_data('AAPL', '2024-01-01', '2024-01-15')

# Step 2: Calculate all indicators
df = compute_all_metrics(df)

# Step 3: Extract parameters from that specific date
target_row = df[df['date'] == '2024-01-15'].iloc[0]

# Step 4: Extract exact values
params = {
    'gap_percent': target_row['gap_over_atr'],           # e.g., 0.85
    'volume_ratio': target_row['vol_over_avg'],          # e.g., 1.8
    'slope_3d': target_row['slope_9_3d'],                # e.g., 12.5
    'slope_5d': target_row['slope_9_5d'],                # e.g., 22.3
    'slope_15d': target_row['slope_9_15d'],              # e.g., 45.0
    'high_ema9_atr': target_row['high_over_ema9_div_atr'], # e.g., 4.2
    'high_ema20_atr': target_row['high_over_ema20_div_atr'], # e.g., 5.1
    'pct7d_low_div_atr': target_row['pct_7d_low_div_atr'],   # e.g., 0.8
    'pct14d_low_div_atr': target_row['pct_14d_low_div_atr'],  # e.g., 2.1
    'atr_pct_change': target_row['atr_pct_change'],      # e.g., 6.5
    'prev_close': target_row['prev_close'],              # e.g., 175.50
    'prev_gain_pct': target_row['prev_gain_pct'],        # e.g., 0.35
    'move2d_div_atr': target_row['move2d_div_atr'],      # e.g., 2.5
    'move3d_div_atr': target_row['move3d_div_atr'],      # e.g., 3.8
}

# Step 5: Create scanner with anchored parameters
class AnchoredScanner:
    def __init__(self):
        self.params = params

    def detect_pattern(self, row):
        # Use exact values from A+ example
        return (
            row['gap_over_atr'] >= self.params['gap_percent'] * 0.9 and  # Allow 10% tolerance
            row['vol_over_avg'] >= self.params['volume_ratio'] * 0.9 and
            row['slope_9_3d'] >= self.params['slope_3d'] * 0.9 and
            # ... all other parameters
        )
```

### 3.3 Tolerance Settings

**Default Tolerance:** ±10% from anchored value

**Rationale:**
- Too tight (±5%): Too few signals, miss good setups
- Too loose (±20%): Too many signals, low quality
- ±10%: Sweet spot for finding similar setups

```python
# Example tolerance application
ANCHORED_VALUE = 0.85  # From A+ example
TOLERANCE = 0.10      # 10%

# Scanner logic
if row['gap_over_atr'] >= ANCHORED_VALUE * (1 - TOLERANCE):
    # Signal detected
```

### 3.4 Multi-Example Anchoring

**When user provides multiple examples:**

```python
# User provides 3 example trades
examples = [
    {'ticker': 'AAPL', 'date': '2024-01-15'},
    {'ticker': 'TSLA', 'date': '2024-01-22'},
    {'ticker': 'NVDA', 'date': '2024-02-01'}
]

# Extract parameters from each
all_params = []
for example in examples:
    params = extract_params_from_example(example)
    all_params.append(params)

# Calculate average parameters
import numpy as np

avg_params = {
    'gap_percent': np.mean([p['gap_percent'] for p in all_params]),
    'volume_ratio': np.mean([p['volume_ratio'] for p in all_params]),
    'slope_3d': np.mean([p['slope_3d'] for p in all_params]),
    # ... etc
}

# Use average as scanner parameters
class MultiAnchoredScanner:
    def __init__(self):
        self.params = avg_params
```

---

## 4. Visual Validation Framework

### 4.1 Chart Standards at localhost:5665/scan

**Visual Reference:** User's existing Plotly charts

**Required Elements:**

1. **Candlestick Chart:** OHLC price data
2. **Volume Bars:** At bottom of chart
3. **EMA Lines:** EMA 9, EMA 20 (optional)
4. **Signal Markers:** Entry/Exit/Stop/Target wedges
5. **Day Navigation:** D-5, D-4, ..., D0, D+1, ..., D+14

### 4.2 Marker Styles

**Entry Marker (Green Wedge):**
```python
fig.add_shape(
    type=' wedge',
    x0=[entry_date], x1=[entry_date],
    y0=[entry_price - 0.5], y1=[entry_price + 0.5],
    marker=dict(color='green', size=15)
)
```

**Exit Marker (Red Wedge):**
```python
fig.add_shape(
    type='wedge',
    x0=[exit_date], x1=[exit_date],
    y0=[exit_price - 0.5], y1=[exit_price + 0.5],
    marker=dict(color='red', size=15)
)
```

**Stop Loss (Horizontal Line):**
```python
fig.add_hline(
    y=stop_price,
    line_dash="dash",
    line_color="red",
    annotation_text="Stop"
)
```

**Target (Horizontal Line):**
```python
fig.add_hline(
    y=target_price,
    line_dash="dash",
    line_color="green",
    annotation_text="Target"
)
```

### 4.3 Validation Checklist

**For Each Signal:**
- [ ] Chart displays D0 as rightmost candle (or in navigation)
- [ ] Entry marker appears at correct price level
- [ ] Volume bars show high volume on D0 or D-1
- [ ] EMA lines show trend alignment
- [ ] Stop loss line visible below entry (long) or above (short)
- [ ] Target line visible above entry (long) or below (short)
- [ ] All markers align with trade logic

**Spot Check Process:**
1. Randomly select 5-10 signals
2. View chart for each
3. Verify markers appear correctly
4. Confirm pattern visually matches description
5. If any fail, investigate scanner logic

---

## 5. Execution Strategies

### 5.1 Pyramiding (Adding to Winners)

**What:** Adding more shares to a winning position

**When to Add:**
- After 1R profit achieved
- After confirmation (new high, breakout, etc.)
- At predetermined levels (e.g., every 2R)

**How Much to Add:**
- Same size as initial (most common)
- Smaller size (conservative)
- Progressive (50% larger each time - aggressive)

**Maximum Entries:**
- Typically 2-3 entries total
- Risk management: Each entry is independent 1R risk

```python
def execute_pyramid(position, current_price, atr):
    """Execute pyramid entry"""
    # Check if eligible to pyramid
    if position.unrealized_r_multiple < 1.0:
        return None  # Only pyramid after 1R profit

    # Check max entries
    if position.total_entries >= position.max_entries:
        return None

    # Calculate pyramid size
    pyramid_size = position.initial_size  # Same size

    # Calculate new stop (breakeven for entire position)
    new_stop = position.entry_price  # Breakeven

    # Execute pyramid entry
    return {
        'action': 'add',
        'size': pyramid_size,
        'stop': new_stop,
        'reason': 'pyramid_after_1R'
    }
```

**Risk Management:**
- Initial stop: 1R below entry
- After 1R profit: Move stop to breakeven
- After pyramid: Stop at breakeven for entire position
- Trail stop after each pyramid

### 5.2 Recycling (Re-entry)

**What:** Entering same setup again after exit

**Same Setup Re-entry:**
- After stop hit: Wait for new setup
- After target hit: Wait for pullback to support
- Cooldown: 3-5 days minimum

**Different Setup Re-entry:**
- If new setup forms: OK to enter
- If same ticker: OK if different pattern
- Max attempts: 2-3 per ticker per month

```python
def check_reentry_eligibility(ticker, last_exit_date, current_date):
    """Check if re-entry is allowed"""
    # Time since last exit
    days_since_exit = (current_date - last_exit_date).days

    # Minimum cooldown period
    if days_since_exit < 3:
        return False, "Cooldown period"

    # Max attempts per month
    monthly_entries = get_monthly_entry_count(ticker, current_date)
    if monthly_entries >= 3:
        return False, "Max monthly attempts reached"

    return True, "Eligible for re-entry"
```

### 5.3 Trailing Stops

**ATR-Based Trailing:**
```python
def calculate_atr_trailing_stop(position, current_price, atr, bars=14):
    """Calculate ATR-based trailing stop"""
    # Trail distance: 2x ATR (common)
    trail_distance = atr * 2.0

    # Update frequency: Every bar
    stop = current_price - trail_distance  # For long

    # Stop can only move up, never down
    if stop > position.current_stop:
        return stop
    else:
        return position.current_stop
```

**Percentage Trailing:**
```python
def calculate_percentage_trail(position, current_price, percent=0.05):
    """Calculate percentage trailing stop"""
    trail_distance = current_price * percent
    stop = current_price - trail_distance

    # Stop can only move up
    if stop > position.current_stop:
        return stop
    else:
        return position.current_stop
```

**Swing High/Low Trailing:**
```python
def calculate_swing_low_trail(position, df, lookback=5):
    """Calculate swing low trailing stop"""
    # Find lowest low in last N bars
    recent_lows = df['low'].tail(lookback)
    swing_low = recent_lows.min()

    # Trail stop just below swing low
    stop = swing_low * 0.99  # 1% below swing low

    # Stop can only move up
    if stop > position.current_stop:
        return stop
    else:
        return position.current_stop
```

**Break-Even Stops:**
```python
def move_to_breakeven(position, current_price, threshold_r=1.0):
    """Move stop to breakeven after threshold profit"""
    if position.unrealized_r_multiple >= threshold_r:
        return position.entry_price  # Breakeven
    else:
        return position.current_stop
```

**Stop Addition (Tightening as Profit Grows):**
```python
def tighten_stop_with_profit(position, current_price, atr):
    """Tighten stop as profit grows"""
    unrealized_r = (current_price - position.entry_price) / position.initial_risk

    if unrealized_r < 1.0:
        trail_multiple = 2.0  # 2x ATR
    elif unrealized_r < 2.0:
        trail_multiple = 1.5  # 1.5x ATR
    elif unrealized_r < 3.0:
        trail_multiple = 1.0  # 1x ATR
    else:
        trail_multiple = 0.5  # 0.5x ATR

    stop = current_price - (atr * trail_multiple)

    # Stop can only move up
    if stop > position.current_stop:
        return stop
    else:
        return position.current_stop
```

### 5.4 Market Structure Following

**Trend Detection (HH/HL, LH/LL):**
```python
def detect_trend(df, lookback=20):
    """Detect trend based on higher highs and higher lows"""
    recent_highs = df['high'].tail(lookback)
    recent_lows = df['low'].tail(lookback)

    # Check for higher highs
    hh = (recent_highs.iloc[-1] > recent_highs.iloc[-5])

    # Check for higher lows
    hl = (recent_lows.iloc[-1] > recent_lows.iloc[-5])

    if hh and hl:
        return 'uptrend'
    elif not hh and not hl:
        return 'downtrend'
    else:
        return 'ranging'
```

**Break of Structure:**
```python
def check_break_of_structure(df, trend='up'):
    """Check if structure has broken"""
    if trend == 'up':
        # Bullish structure broken: lower low
        recent_lows = df['low'].tail(10)
        if recent_lows.iloc[-1] < recent_lows.iloc[-5]:
            return True  # Structure broken
    elif trend == 'down':
        # Bearish structure broken: higher high
        recent_highs = df['high'].tail(10)
        if recent_highs.iloc[-1] > recent_highs.iloc[-5]:
            return True  # Structure broken

    return False
```

**Trend Lines:**
```python
def calculate_trendline(df, lookback=20):
    """Calculate trend line"""
    recent = df.tail(lookback)

    # Simple linear regression
    x = np.arange(len(recent))
    y = recent['close'].values

    slope, intercept = np.polyfit(x, y, 1)

    return {
        'slope': slope,
        'intercept': intercept,
        'current_value': slope * len(recent) + intercept
    }
```

**Support/Resistance Levels:**
```python
def find_support_resistance(df, lookback=50):
    """Find support and resistance levels"""
    recent = df.tail(lookback)

    # Support: Local minima
    local_mins = recent['low'][
        (recent['low'].shift(1) > recent['low']) &
        (recent['low'].shift(-1) > recent['low'])
    ]

    # Resistance: Local maxima
    local_maxs = recent['high'][
        (recent['high'].shift(1) < recent['high']) &
        (recent['high'].shift(-1) < recent['high'])
    ]

    return {
        'support': local_mins.values,
        'resistance': local_maxs.values
    }
```

### 5.5 R-Based Risking

**Fixed R (Always risk 1R):**
```python
def calculate_position_size_fixed_r(entry_price, stop_price, account_value, risk_per_trade=0.01):
    """Calculate position size for fixed 1R risk"""
    risk_amount = account_value * risk_per_trade  # 1% of account
    risk_per_share = abs(entry_price - stop_price)

    shares = risk_amount / risk_per_share

    return {
        'shares': int(shares),
        'risk_amount': risk_amount,
        'risk_per_share': risk_per_share
    }
```

**Volatility-Adjusted R (Risk based on ATR/IV):**
```python
def calculate_position_size_vol_adjusted(entry_price, stop_price, account_value, atr):
    """Calculate position size adjusted for volatility"""
    # Base risk: 1% of account
    base_risk = account_value * 0.01

    # Adjust for ATR: Higher ATR = smaller position
    avg_atr = get_average_atr(entry_price)  # 20-day average
    vol_multiplier = avg_atr / atr

    adjusted_risk = base_risk * vol_multiplier

    risk_per_share = abs(entry_price - stop_price)
    shares = adjusted_risk / risk_per_share

    return int(shares)
```

**Kelly Criterion (Use with caution):**
```python
def calculate_kelly_position_size(win_rate, avg_win, avg_loss, account_value):
    """
    Calculate position size using Kelly Criterion

    WARNING: Use half-Kelly or quarter-Kelly for safety
    Only use when you have 100+ trades with consistent stats
    """
    if avg_loss == 0:
        return 0

    # Kelly formula
    kelly_f = win_rate - ((1 - win_rate) / (avg_win / abs(avg_loss)))

    # SAFETY: Use quarter-Kelly
    kelly_f = kelly_f * 0.25

    # Cap at 25% of account (even with quarter-Kelly)
    kelly_f = min(kelly_f, 0.25)

    position_size = account_value * kelly_f

    return {
        'kelly_fraction': kelly_f,
        'position_size': position_size
    }
```

**WHEN NOT TO USE Kelly:**
- Less than 100 trades in sample
- Inconsistent win rates
- Changing market conditions
- High volatility periods
- Uncertain parameter stability

### 5.6 Stop Management

**Initial Stop Placement:**
```python
def place_initial_stop(entry_price, atr, strategy='atr'):
    """Place initial stop based on strategy"""
    if strategy == 'atr':
        # ATR-based stop: 1x ATR below entry
        stop = entry_price - (atr * 1.0)

    elif strategy == 'percentage':
        # Percentage stop: 3% below entry
        stop = entry_price * 0.97

    elif strategy == 'support':
        # Support-based stop: Below recent support
        support = find_recent_support(entry_price)
        stop = support * 0.99  # 1% below support

    elif strategy == 'swing_low':
        # Swing low stop: Below recent swing low
        swing_low = find_swing_low()
        stop = swing_low * 0.99

    return stop
```

**Stop Movement Rules:**
```python
def update_stop(position, current_price, atr, current_bar):
    """Update stop based on rules"""

    # Rule 1: Move to breakeven after 1R profit
    if position.unrealized_r >= 1.0 and position.stop < position.entry_price:
        position.stop = position.entry_price
        position.stop_reason = 'breakeven'

    # Rule 2: Trail stop after 2R profit
    elif position.unrealized_r >= 2.0:
        trail_distance = atr * 1.5
        new_stop = current_price - trail_distance
        if new_stop > position.stop:
            position.stop = new_stop
            position.stop_reason = 'trailing'

    # Rule 3: Tighten stop after 3R profit
    elif position.unrealized_r >= 3.0:
        trail_distance = atr * 1.0
        new_stop = current_price - trail_distance
        if new_stop > position.stop:
            position.stop = new_stop
            position.stop_reason = 'tight_trailing'

    return position.stop
```

**Multiple Stop Tiers:**
```python
class TieredStopManager:
    """Manage multiple stop tiers"""

    def __init__(self, position_size):
        self.tiers = [
            {
                'size': position_size * 0.33,
                'stop': None,
                'trail_atr': 1.0
            },
            {
                'size': position_size * 0.33,
                'stop': None,
                'trail_atr': 1.5
            },
            {
                'size': position_size * 0.34,
                'stop': None,
                'trail_atr': 2.0
            }
        ]

    def update_tiers(self, current_price, atr):
        """Update each tier independently"""
        for tier in self.tiers:
            trail_distance = atr * tier['trail_atr']
            new_stop = current_price - trail_distance

            if new_stop > tier['stop']:
                tier['stop'] = new_stop
```

**Time Stops:**
```python
def check_time_stop(entry_date, current_date, max_hold_days=10):
    """Check if max holding period exceeded"""
    hold_days = (current_date - entry_date).days

    if hold_days >= max_hold_days:
        return True, "Max holding period reached"

    return False, None
```

---

## 6. Indicator Reference

### 6.1 ATR (Average True Range)

**Formula:**
```
True Range = max(high - low, |high - prev_close|, |low - prev_close|)
ATR = SMA(True Range, 14)
```

**Python Implementation:**
```python
def calculate_atr(df, period=14):
    """Calculate ATR (Wilder's smoothing)"""
    hi_lo = df['high'] - df['low']
    hi_prev = (df['high'] - df['close'].shift(1)).abs()
    lo_prev = (df['low'] - df['close'].shift(1)).abs()

    df['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    df['atr'] = df['tr'].rolling(window=period, min_periods=period).mean().shift(1)

    return df
```

**Common Parameters:**
- Period: 14 (most common)
- Period: 21 (for longer-term signals)

**Common Pitfalls:**
- Forward-looking bias: MUST shift(1) after calculation
- Missing data: Use min_periods parameter
- Zero ATR: Handle division by zero

**Validation:**
```python
def validate_atr(df):
    """Validate ATR calculation"""
    # Compare to TradingView
    tv_atr = get_tradingview_atr('AAPL', '2024-01-15')
    calc_atr = df[df['date'] == '2024-01-15']['atr'].iloc[0]

    # Should be within 1%
    assert abs(tv_atr - calc_atr) / tv_atr < 0.01
```

### 6.2 EMA (Exponential Moving Average)

**Formula:**
```
Alpha = 2 / (span + 1)
EMA = Alpha * price + (1 - Alpha) * prev_EMA
```

**Python Implementation:**
```python
def calculate_ema(df, span=9):
    """Calculate EMA"""
    df[f'ema_{span}'] = df['close'].ewm(span=span, adjust=False).mean()
    return df
```

**Common Parameters:**
- EMA 9: Short-term trend
- EMA 20: Medium-term trend
- EMA 50: Long-term trend

**Common Pitfalls:**
- Using adjust=True (gives different results)
- Not shifting for alignment
- Confusing EMA span with SMA period

**Validation:**
```python
def validate_ema(df, span=9):
    """Validate EMA calculation"""
    # First value: SMA
    first_ema = df[f'ema_{span}'].iloc[span - 1]
    first_sma = df['close'].iloc[:span].mean()

    assert abs(first_ema - first_sma) < 0.01
```

### 6.3 SMA (Simple Moving Average)

**Formula:**
```
SMA = sum(prices) / n
```

**Python Implementation:**
```python
def calculate_sma(df, period=50):
    """Calculate SMA"""
    df[f'sma_{period}'] = df['close'].rolling(window=period, min_periods=period).mean().shift(1)
    return df
```

**Common Parameters:**
- SMA 50: Medium-term trend
- SMA 200: Long-term trend

**Use Case:** Golden cross (SMA 50 crosses above SMA 200)

### 6.4 Volume Indicators

**ADV (Average Daily Volume):**
```python
def calculate_adv(df, period=20):
    """Calculate average daily volume"""
    df['vol_avg'] = df['volume'].rolling(window=period, min_periods=period).mean().shift(1)
    return df
```

**ADV in Dollars:**
```python
def calculate_adv_usd(df, period=20):
    """Calculate average daily dollar volume"""
    df['adv20_usd'] = (df['close'] * df['volume']).rolling(window=period, min_periods=period).mean().shift(1)
    return df
```

**Volume Ratio:**
```python
def calculate_volume_ratio(df):
    """Calculate volume ratio (current / average)"""
    df['vol_ratio'] = df['volume'] / df['vol_avg']
    return df
```

**Common Pitfalls:**
- Not using per-ticker calculations
- Not shifting after calculation
- Division by zero (handle NaN values)

### 6.5 Gap Calculations

**Gap Using Adjusted Prices:**
```python
def calculate_gap(df):
    """Calculate gap using adjusted close"""
    df['gap'] = (df['open'] - df['close'].shift(1)).abs()
    df['gap_pct'] = (df['gap'] / df['close'].shift(1)) * 100
    return df
```

**Gap/ATR Ratio:**
```python
def calculate_gap_atr_ratio(df):
    """Calculate gap as ratio of ATR"""
    df['gap_over_atr'] = df['gap'] / df['atr']
    return df
```

**Common Pitfalls:**
- Using unadjusted prices (gaps from dividends/splits)
- Not using absolute value for gap
- Division by zero in gap/ATR

### 6.6 RSI (Relative Strength Index)

**Formula:**
```
RS = Average Gain / Average Loss
RSI = 100 - (100 / (1 + RS))
```

**Python Implementation:**
```python
def calculate_rsi(df, period=14):
    """Calculate RSI"""
    delta = df['close'].diff()

    gain = (delta.where(delta > 0, 0)).rolling(window=period, min_periods=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period, min_periods=period).mean()

    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    return df
```

**Common Parameters:**
- Period: 14 (standard)

**Interpretation:**
- RSI > 70: Overbought
- RSI < 30: Oversold

### 6.7 MACD (Moving Average Convergence Divergence)

**Formula:**
```
MACD Line = EMA(12) - EMA(26)
Signal Line = EMA(9, MACD Line)
Histogram = MACD Line - Signal Line
```

**Python Implementation:**
```python
def calculate_macd(df, fast=12, slow=26, signal=9):
    """Calculate MACD"""
    df['ema_fast'] = df['close'].ewm(span=fast, adjust=False).mean()
    df['ema_slow'] = df['close'].ewm(span=slow, adjust=False).mean()

    df['macd'] = df['ema_fast'] - df['ema_slow']
    df['macd_signal'] = df['macd'].ewm(span=signal, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    return df
```

**Signal:** MACD crosses above signal line (bullish)

---

## 7. Library Best Practices

### 7.1 Pandas

**Performance Patterns for 12k Symbols:**

**Vectorized Operations (AVOID LOOPS):**
```python
# ❌ WRONG: Slow loop
for i in range(len(df)):
    df.loc[i, 'atr'] = calculate_atr_single(df, i)

# ✅ CORRECT: Vectorized
df['atr'] = df['tr'].rolling(14).mean()
```

**GroupBy/Transform Patterns:**
```python
# Per-ticker rolling calculations
df['adv20'] = df.groupby('ticker')['volume'].transform(
    lambda x: x.rolling(20, min_periods=20).mean()
)

# Per-ticker shift
df['prev_close'] = df.groupby('ticker')['close'].shift(1)
```

**Memory Management:**
```python
# Use efficient dtypes
df['ticker'] = df['ticker'].astype('category')  # Saves memory
df['date'] = pd.to_datetime(df['date'])  # Faster than string

# Chunking for large datasets
def process_in_chunks(df, chunk_size=1000):
    results = []
    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size]
        result = process_chunk(chunk)
        results.append(result)
    return pd.concat(results)
```

**Time Series Best Practices:**
```python
# Always sort by ticker and date first
df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

# Use groupby correctly
for ticker, group in df.groupby('ticker'):
    # Process each ticker
    pass
```

**Common Anti-Patterns to AVOID:**
```python
# ❌ WRONG: Chained assignment (SettingWithCopyWarning)
df_filtered = df[df['price'] > 100]
df_filtered['new_col'] = 1  # Warning!

# ✅ CORRECT: Use .copy()
df_filtered = df[df['price'] > 100].copy()
df_filtered['new_col'] = 1  # OK

# ❌ WRONG: Iterrows (very slow)
for index, row in df.iterrows():
    # Something slow

# ✅ CORRECT: Vectorized or apply
df['new_col'] = df['col1'] + df['col2']
```

### 7.2 Numpy

**Efficient Calculations:**
```python
# Use numpy for element-wise operations
import numpy as np

# Fast array operations
high = df['high'].values
low = df['low'].values
close = df['close'].values

# True Range calculation (vectorized)
tr = np.maximum(
    high - low,
    np.maximum(
        np.abs(high - np.concatenate([[np.nan], close[:-1]])),
        np.abs(low - np.concatenate([[np.nan], close[:-1]]))
    )
)
```

**Broadcasting:**
```python
# Broadcasting for ratio calculations
close = np.array([150, 155, 160])
ema = np.array([145, 150, 155])

# Element-wise division
ratio = close / ema  # [1.034, 1.033, 1.032]
```

### 7.3 Plotly

**User's Chart Style at localhost:5665/scan:**

**Basic Candlestick Chart:**
```python
import plotly.graph_objects as go

def create_chart(df, signals=None):
    """Create candlestick chart with markers"""
    fig = go.Figure()

    # Candlestick
    fig.add_trace(go.Candlestick(
        x=df['date'],
        open=df['open'],
        high=df['high'],
        low=df['low'],
        close=df['close'],
        name='OHLC'
    ))

    # Volume bars
    fig.add_trace(go.Bar(
        x=df['date'],
        y=df['volume'],
        name='Volume',
        yaxis='y2'
    ))

    # Layout
    fig.update_layout(
        title='Chart with Signals',
        yaxis_title='Price',
        yaxis2_title='Volume',
        yaxis2=dict(
            overlaying='y',
            side='right'
        ),
        xaxis_rangeslider_visible=False
    )

    return fig
```

**Add Signal Markers:**
```python
def add_entry_marker(fig, signal):
    """Add entry marker (green wedge)"""
    fig.add_shape(
        type='wedge',
        x0=signal['date'], x1=signal['date'],
        y0=signal['entry_price'] - 0.5,
        y1=signal['entry_price'] + 0.5,
        marker=dict(
            color='green',
            size=15,
            symbol='triangle-up'
        ),
        name='Entry'
    )
    return fig

def add_exit_marker(fig, signal):
    """Add exit marker (red wedge)"""
    fig.add_shape(
        type='wedge',
        x0=signal['exit_date'], x1=signal['exit_date'],
        y0=signal['exit_price'] - 0.5,
        y1=signal['exit_price'] + 0.5,
        marker=dict(
            color='red',
            size=15,
            symbol='triangle-down'
        ),
        name='Exit'
    )
    return fig

def add_stop_line(fig, signal):
    """Add stop loss line"""
    fig.add_hline(
        y=signal['stop_price'],
        line_dash="dash",
        line_color="red",
        annotation_text=f"Stop: ${signal['stop_price']:.2f}",
        annotation_position="right"
    )
    return fig

def add_target_line(fig, signal):
    """Add target line"""
    fig.add_hline(
        y=signal['target_price'],
        line_dash="dash",
        line_color="green",
        annotation_text=f"Target: ${signal['target_price']:.2f}",
        annotation_position="right"
    )
    return fig
```

**Performance for Large Datasets:**
```python
# For large datasets, use WebGL rendering
fig.update_traces(selector=dict(type='scattergl'))

# Or limit data points
max_points = 1000
if len(df) > max_points:
    df_display = df.tail(max_points)
else:
    df_display = df
```

---

## 8. Metrics Bible

### 8.1 Core Metrics (ALL REQUIRED)

**Win Rate:**
```python
win_rate = winners / total_trades
```

**Average Win:**
```python
avg_win = winning_trades['pnl'].mean()
```

**Average Loss:**
```python
avg_loss = losing_trades['pnl'].mean()
```

**Win/Loss Ratio:**
```python
win_loss_ratio = abs(avg_win / avg_loss)
```

**Profit Factor:**
```python
profit_factor = abs(gross_profit / gross_loss)
```

**Total Return:**
```python
total_return = final_capital - initial_capital
```

**Max Drawdown:**
```python
cumulative_returns = trades['pnl'].cumsum()
running_max = cumulative_returns.expanding().max()
drawdown = cumulative_returns - running_max
max_drawdown = drawdown.min()
```

**Average Drawdown:**
```python
avg_drawdown = drawdown[drawdown < 0].mean()
```

**Sharpe Ratio:**
```python
# Annualized Sharpe ratio
excess_returns = trades['pnl'] - risk_free_rate
sharpe_ratio = (excess_returns.mean() / excess_returns.std()) * np.sqrt(252)
```

**Sortino Ratio:**
```python
# Downside deviation only
downside_returns = excess_returns[excess_returns < 0]
sortino_ratio = (excess_returns.mean() / downside_returns.std()) * np.sqrt(252)
```

**Expectancy:**
```python
expectancy = (win_rate * avg_win) + ((1 - win_rate) * avg_loss)
```

**Number of Trades:**
```python
total_trades = len(trades)
```

### 8.2 Advanced Metrics (WHEN NEEDED)

**Calmar Ratio:**
```python
calmar_ratio = annual_return / abs(max_drawdown)
```

**Information Ratio:**
```python
information_ratio = (portfolio_return - benchmark_return) / tracking_error
```

**Tail Ratio:**
```python
# Ratio of 95th percentile to 5th percentile
tail_ratio = np.percentile(returns, 95) / abs(np.percentile(returns, 5))
```

**Worst Trade:**
```python
worst_trade = trades['pnl'].min()
```

**Best Trade:**
```python
best_trade = trades['pnl'].max()
```

**Average Holding Time:**
```python
avg_holding_time = trades['holding_period'].mean()
```

**Trade Frequency:**
```python
trade_frequency = total_trades / trading_days
```

**Percentage Winning Months:**
```python
monthly_returns = trades.set_index('date')['pnl'].resample('M').sum()
winning_months = (monthly_returns > 0).sum() / len(monthly_returns)
```

**Streaks:**
```python
# Max win streak
win_streak = 0
max_win_streak = 0
for pnl in trades['pnl']:
    if pnl > 0:
        win_streak += 1
        max_win_streak = max(max_win_streak, win_streak)
    else:
        win_streak = 0

# Max loss streak
loss_streak = 0
max_loss_streak = 0
for pnl in trades['pnl']:
    if pnl < 0:
        loss_streak += 1
        max_loss_streak = max(max_loss_streak, loss_streak)
    else:
        loss_streak = 0
```

### 8.3 Metrics Visualization

**Equity Curve:**
```python
def plot_equity_curve(trades):
    """Plot equity curve"""
    cumulative_returns = trades['pnl'].cumsum()

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=trades['date'],
        y=cumulative_returns,
        mode='lines',
        name='Equity'
    ))

    fig.update_layout(
        title='Equity Curve',
        xaxis_title='Date',
        yaxis_title='Cumulative Returns ($)'
    )

    return fig
```

**Drawdown Chart:**
```python
def plot_drawdown(trades):
    """Plot drawdown chart"""
    cumulative_returns = trades['pnl'].cumsum()
    running_max = cumulative_returns.expanding().max()
    drawdown = cumulative_returns - running_max

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=trades['date'],
        y=drawdown,
        fill='tozeroy',
        mode='lines',
        name='Drawdown'
    ))

    fig.update_layout(
        title='Drawdown Chart',
        xaxis_title='Date',
        yaxis_title='Drawdown ($)'
    )

    return fig
```

**Trade Distribution:**
```python
def plot_trade_distribution(trades):
    """Plot trade distribution"""
    fig = go.Figure()
    fig.add_trace(go.Histogram(
        x=trades['pnl'],
        nbinsx=50,
        name='Trade Distribution'
    ))

    fig.update_layout(
        title='Trade Distribution',
        xaxis_title='Profit/Loss ($)',
        yaxis_title='Frequency'
    )

    return fig
```

**Monthly Returns:**
```python
def plot_monthly_returns(trades):
    """Plot monthly returns"""
    monthly_returns = trades.set_index('date')['pnl'].resample('M').sum()

    fig = go.Figure()
    colors = ['green' if x > 0 else 'red' for x in monthly_returns]

    fig.add_trace(go.Bar(
        x=monthly_returns.index,
        y=monthly_returns,
        marker_color=colors,
        name='Monthly Returns'
    ))

    fig.update_layout(
        title='Monthly Returns',
        xaxis_title='Month',
        yaxis_title='Return ($)'
    )

    return fig
```

---

## 9. Data Handling

### 9.1 Data Sources

**Polygon API (User's Primary Source):**

**Grouped Daily Endpoint (V31 Preferred):**
```python
def fetch_grouped_daily(date_str):
    """Fetch all stocks for a specific date"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    params = {
        "adjusted": "true",
        "apiKey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    return pd.DataFrame(data['results'])
```

**Individual Ticker Endpoint:**
```python
def fetch_ticker_daily(ticker, start_date, end_date):
    """Fetch daily data for specific ticker"""
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000,
        "apiKey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    return pd.DataFrame(data['results'])
```

**Rate Limiting:**
```python
# Polygon free tier: 5 requests/minute
# Standard tier: 300 requests/minute

import time

def fetch_with_rate_limit():
    """Fetch with rate limiting"""
    time.sleep(12 / 300)  # For standard tier
    # Fetch data
```

### 9.2 Data Quality

**Splits and Dividends:**

**ALWAYS use adjusted prices:**
```python
# ✅ CORRECT: Use adjusted
params = {"adjusted": "true", ...}

# ❌ WRONG: Use unadjusted
params = {"adjusted": "false", ...}
```

**Why:**
- Unadjusted prices have gaps from splits
- Unadjusted prices drop from dividends
- Adjusted prices provide continuity

**Missing Data Handling:**
```python
def handle_missing_data(df):
    """Handle missing data"""
    # Forward fill (for indicators)
    df = df.fillna(method='ffill')

    # Or drop rows with missing critical data
    df = df.dropna(subset=['close', 'volume'])

    return df
```

**Outlier Detection:**
```python
def detect_outliers(df, column='close', threshold=3):
    """Detect outliers using z-score"""
    mean = df[column].mean()
    std = df[column].std()

    z_scores = (df[column] - mean) / std
    outliers = df[abs(z_scores) > threshold]

    return outliers
```

**Bad Data Detection:**
```python
def detect_bad_data(df):
    """Detect obviously bad data"""
    # Zero prices
    zero_prices = df[df['close'] == 0]

    # Negative prices
    negative_prices = df[df['close'] < 0]

    # Extreme gaps (>50%)
    extreme_gaps = df[(df['close'].pct_change().abs() > 0.5)]

    return {
        'zero_prices': zero_prices,
        'negative_prices': negative_prices,
        'extreme_gaps': extreme_gaps
    }
```

### 9.3 Corporate Actions

**How to Handle:**

**Best Approach:** Use adjusted prices (Polygon default)

**Alternative:** Manually adjust for splits
```python
def adjust_for_split(df, split_date, split_ratio):
    """Adjust prices for stock split"""
    df.loc[df['date'] < split_date, ['open', 'high', 'low', 'close']] /= split_ratio
    df.loc[df['date'] < split_date, 'volume'] *= split_ratio

    return df
```

**Impact on Backtests:**
- Unadjusted: Bad fills, false signals
- Adjusted: Realistic fills, accurate signals

### 9.4 Survivorship Bias

**What It Is:** Only including current stocks in backtest (ignoring delisted/bankrupt)

**Why It Matters:** Inflates returns (ignores failures)

**How to Avoid:**

**Option 1: Include delisted stocks**
```python
# Use full market scan (includes delisted)
# Polygon grouped endpoint includes all traded stocks
```

**Option 2: Adjust returns downward**
```python
# Assume 5% annual attrition
attrition_rate = 0.05
adjusted_return = raw_return * (1 - attrition_rate)
```

**Option 3: Use surviving-universe index**
```python
# Benchmark against S&P 500 (survivorship bias in both)
excess_return = strategy_return - benchmark_return
```

---

## 10. Validation Framework

### 10.1 Scanner Validation Checklist

**Pre-Execution Validation:**
- [ ] Uses `pandas_market_calendars` for trading days
- [ ] Calculates historical buffer in `__init__`
- [ ] Has 5-stage pipeline (or simple script structure)
- [ ] Stage 1 uses parallel fetching
- [ ] Stage 2b separates historical from D0
- [ ] Stage 2b combines historical + filtered D0
- [ ] All operations use per-ticker groupby/transform
- [ ] Stage 3a computes features per-ticker
- [ ] Stage 3b uses pre-sliced data (V31)
- [ ] Detection loop filters by D0 range (early exit)
- [ ] Parameters stored in `self.params` dict
- [ ] Returns list of signal dicts

**Post-Execution Validation:**
- [ ] A+ examples found in results
- [ ] Parameters accurate (within ±10%)
- [ ] No forward-looking bias (all indicators shifted)
- [ ] Full market coverage (12k symbols scanned)
- [ ] Visual spot-checks pass (5-10 random signals)

### 10.2 Backtest Validation Checklist

**Pre-Execution Validation:**
- [ ] Calculates all required metrics
- [ ] Handles edge cases (no trades, all wins, all losses)
- [ ] Uses proper position sizing
- [ ] Accounts for slippage (enhanced version)
- [ ] Uses realistic exit strategies

**Post-Execution Validation:**
- [ ] Executions where expected
- [ ] Stops/targets working correctly
- [ ] P&L accurate (manual calculation check)
- [ ] No unrealistic fills
- [ ] Visual validation passes (check chart)

### 10.3 Common Pitfalls Validation

**Forward-Looking Bias:**
```python
# ❌ WRONG: Uses current bar's close
df['signal'] = df['close'] > df['ema']

# ✅ CORRECT: Uses previous bar's close
df['signal'] = df['close'].shift(1) > df['ema'].shift(1)
```

**Data Leakage:**
```python
# ❌ WRONG: Computes on full dataset before split
train['feature'] = compute_feature(pd.concat([train, test]))

# ✅ CORRECT: Computes separately
train['feature'] = compute_feature(train)
test['feature'] = compute_feature(test)
```

**Look-Ahead Bias:**
```python
# ❌ WRONG: Uses future data
df['return'] = df['close'].pct_change().shift(-1)  # Future return!

# ✅ CORRECT: Uses past data
df['return'] = df['close'].pct_change()  # Past return
```

---

## 11. Code Pattern Library

### 11.1 Scanner Patterns

**A+ Anchoring Pattern:**
```python
def extract_params_from_example(ticker, date):
    """Extract parameters from example trade"""
    # Fetch data
    df = fetch_market_data(ticker, date - timedelta(days=100), date)

    # Calculate indicators
    df = compute_all_metrics(df)

    # Extract parameters
    example_row = df[df['date'] == date].iloc[0]

    params = {
        'gap_atr': example_row['gap_over_atr'],
        'vol_ratio': example_row['vol_over_avg'],
        # ... etc
    }

    return params
```

**Debug Mode (Check Specific Date):**
```python
def debug_symbol(ticker, target_date):
    """Debug mode: Check params on specific date"""
    df = fetch_market_data(ticker, '2024-01-01', target_date)
    df = compute_all_metrics(df)

    target_row = df[df['date'] == target_date]

    print(f"Parameters for {ticker} on {target_date}:")
    print(f"Gap/ATR: {target_row['gap_over_atr'].iloc[0]}")
    print(f"Vol Ratio: {target_row['vol_over_avg'].iloc[0]}")
    # ... etc

    return target_row
```

**Multi-Symbol Scanning:**
```python
def scan_multiple_symbols(symbols, start_date, end_date):
    """Scan multiple symbols in parallel"""
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(scan_symbol, symbol, start_date, end_date): symbol
            for symbol in symbols
        }

        results = []
        for future in as_completed(futures):
            symbol = futures[future]
            try:
                signals = future.result()
                results.extend(signals)
                print(f"✅ {symbol}: {len(signals)} signals")
            except Exception as e:
                print(f"❌ {symbol}: {e}")

    return results
```

**Performance Optimization:**
```python
# Early exit in detection loop
for i in range(len(ticker_df)):
    d0 = ticker_df.iloc[i]['date']

    # Skip if not in D0 range (early exit)
    if d0 < d0_start_dt or d0 > d0_end_dt:
        continue

    # Check cheap filters first
    if ticker_df.iloc[i]['close'] < price_min:
        continue

    # Then check expensive filters
    if not check_pattern(ticker_df.iloc[i]):
        continue
```

### 11.2 Backtest Patterns

**Entry/Exit Handling:**
```python
def simulate_trade(entry_signal, df):
    """Simulate trade from entry to exit"""
    entry_price = entry_signal['entry_price']
    entry_date = entry_signal['date']
    stop_price = entry_signal['stop']
    target_price = entry_signal['target']

    # Find exit
    for i, row in df.iterrows():
        if row['date'] <= entry_date:
            continue

        # Check stop
        if row['low'] <= stop_price:
            return {
                'entry_price': entry_price,
                'exit_price': stop_price,
                'exit_reason': 'stop',
                'exit_date': row['date']
            }

        # Check target
        if row['high'] >= target_price:
            return {
                'entry_price': entry_price,
                'exit_price': target_price,
                'exit_reason': 'target',
                'exit_date': row['date']
            }

    # End of data
    return {
        'entry_price': entry_price,
        'exit_price': df.iloc[-1]['close'],
        'exit_reason': 'end_of_data',
        'exit_date': df.iloc[-1]['date']
    }
```

**Position Tracking:**
```python
class Position:
    def __init__(self, entry_signal):
        self.ticker = entry_signal['ticker']
        self.entry_price = entry_signal['entry_price']
        self.entry_date = entry_signal['date']
        self.shares = entry_signal['shares']
        self.stop_price = entry_signal['stop']
        self.target_price = entry_signal['target']

        self.current_price = self.entry_price
        self.unrealized_pnl = 0.0
        self.realized_pnl = 0.0
        self.status = 'open'

    def update(self, current_bar):
        """Update position with current bar"""
        self.current_price = current_bar['close']
        self.unrealized_pnl = (self.current_price - self.entry_price) * self.shares

        # Check stop
        if current_bar['low'] <= self.stop_price:
            self.close(current_bar['date'], self.stop_price, 'stop')

        # Check target
        elif current_bar['high'] >= self.target_price:
            self.close(current_bar['date'], self.target_price, 'target')

    def close(self, exit_date, exit_price, reason):
        """Close position"""
        self.exit_date = exit_date
        self.exit_price = exit_price
        self.exit_reason = reason
        self.realized_pnl = (self.exit_price - self.entry_price) * self.shares
        self.status = 'closed'
```

**Trade Management Logic:**
```python
def manage_trades(positions, current_bars):
    """Manage all open positions"""
    closed_positions = []

    for position in positions:
        if position.status == 'open':
            current_bar = current_bars[position.ticker]
            position.update(current_bar)

            if position.status == 'closed':
                closed_positions.append(position)

    return closed_positions
```

**P&L Calculation:**
```python
def calculate_pnl(trade):
    """Calculate trade P&L"""
    gross_pnl = (trade['exit_price'] - trade['entry_price']) * trade['shares']
    commission = trade['shares'] * 0.005 * 2  # $0.005 per share round trip
    net_pnl = gross_pnl - commission

    return {
        'gross_pnl': gross_pnl,
        'commission': commission,
        'net_pnl': net_pnl,
        'pnl_pct': (trade['exit_price'] - trade['entry_price']) / trade['entry_price']
    }
```

### 11.3 Visual Validation Patterns

**Plotly Chart Template:**
```python
def create_validation_chart(ticker, entry_date, df, signal):
    """Create chart for visual validation"""
    fig = go.Figure()

    # Candlestick
    fig.add_trace(go.Candlestick(
        x=df['date'],
        open=df['open'],
        high=df['high'],
        low=df['low'],
        close=df['close'],
        name='OHLC'
    ))

    # Add markers
    fig = add_entry_marker(fig, signal)
    fig = add_stop_line(fig, signal)
    fig = add_target_line(fig, signal)

    # Add day annotation
    fig.add_vline(
        x=entry_date,
        line_dash="dash",
        line_color="blue",
        annotation_text="D0"
    )

    fig.update_layout(
        title=f'{ticker} - {entry_date}',
        xaxis_rangeslider_visible=False
    )

    return fig
```

**Marker Styles (Entry/Exit/Stop/Target):**
```python
def add_entry_marker(fig, signal):
    """Add entry marker (green triangle)"""
    fig.add_trace(go.Scatter(
        x=[signal['date']],
        y=[signal['entry_price']],
        mode='markers',
        marker=dict(
            symbol='triangle-up',
            size=15,
            color='green'
        ),
        name='Entry'
    ))
    return fig

def add_exit_marker(fig, signal):
    """Add exit marker (red triangle)"""
    fig.add_trace(go.Scatter(
        x=[signal['exit_date']],
        y=[signal['exit_price']],
        mode='markers',
        marker=dict(
            symbol='triangle-down',
            size=15,
            color='red'
        ),
        name='Exit'
    ))
    return fig
```

**Single Ticker Quick Testing:**
```python
def quick_test_ticker(ticker, start_date, end_date, scanner):
    """Quick test: Scan single ticker"""
    print(f"Testing {ticker} from {start_date} to {end_date}")

    # Fetch data
    df = fetch_market_data(ticker, start_date, end_date)

    # Run scanner
    signals = scanner.scan_symbol(ticker, start_date, end_date)

    # Display results
    if signals:
        print(f"✅ Found {len(signals)} signals:")
        for signal in signals:
            print(f"  {signal['date']}: Entry ${signal['entry_price']:.2f}")

        # Show chart for first signal
        first_signal = signals[0]
        fig = create_validation_chart(ticker, first_signal['date'], df, first_signal)
        fig.show()
    else:
        print("❌ No signals found")

    return signals
```

---

## Conclusion

This Gold Standard document provides the complete foundation for building trading scanners and backtests in the EdgeDev ecosystem. It is based on extensive research of production code and established patterns.

### Key Takeaways

1. **V31 Architecture is the Modern Standard** - 360x faster, scalable, maintainable
2. **A+ Anchoring is the Primary Method** - Extract parameters from example trades
3. **Visual Validation is Mandatory** - All signals must be visually validated at localhost:5665/scan
4. **Two-Pass Computation is Critical** - Simple features → Filter → Full features
5. **Per-Ticker Operations are Mandatory** - Correctness depends on it
6. **Historical Data Preservation is Essential** - Indicators need full history

### Next Steps for AI Agent

When the user describes a trading setup:

1. **Understand the Setup** - Ask clarifying questions if needed
2. **Extract Parameters** - If user provides examples, use A+ anchoring
3. **Choose Architecture** - V31 class-based for production, standalone for testing
4. **Generate Code** - Follow patterns in this document exactly
5. **Create Validation Plan** - Define validation checklists
6. **Execute and Validate** - Run scanner, validate results visually

### Quality Standards

**All generated code MUST:**
- Follow V31 architecture principles (or standalone script pattern)
- Use per-ticker operations for all calculations
- Preserve historical data in smart filters
- Include comprehensive error handling
- Provide progress feedback
- Return results in standardized format
- Be visually validated before production use

---

**Document Status:** COMPLETE
**Last Updated:** 2026-01-29
**Version:** 1.0
**Ready for:** AI Agent Implementation

---

**END OF EDGEDEV GOLD STANDARD**
