# EdgeDev Codebase Research Report
## Presumed "Gold Standard" Specification for Scanners, Backtests, and Code Structure

**Research Date**: 2026-01-29
**Research Scope**: Comprehensive analysis of EdgeDev codebase patterns
**Status**: RESEARCH COMPLETE - Ready for Review

---

## Executive Summary

This research document synthesizes patterns from **133+ scanner files**, **6+ backtest engines**, and **hundreds of supporting files** to extract the "presumed gold standard" for production-ready trading code in the EdgeDev ecosystem.

### Key Findings

1. **Two Distinct Scanner Architectures Exist**:
   - **V31 Class-Based** (Modern, scalable, 360x faster)
   - **Standalone Script-Based** (Simple, direct execution pattern)

2. **Backside B Pattern Dominates** (75+ variants)
   - The most battle-tested pattern in the codebase
   - Multiple working implementations available
   - Clear parameter structure and detection logic

3. **Backtesting Has Two Approaches**:
   - Simple P&L simulation (fast, for validation)
   - Enhanced intraday simulation (slow, accurate)

---

## Table of Contents

1. [Scanner Architecture Patterns](#scanner-architecture-patterns)
2. [Backtest Specifications](#backtest-specifications)
3. [Code Structure Standards](#code-structure-standards)
4. [Data Structure Requirements](#data-structure-requirements)
5. [Parameter System Design](#parameter-system-design)
6. [API Integration Patterns](#api-integration-patterns)
7. [Workflow Best Practices](#workflow-best-practices)
8. [Validation Checklists](#validation-checklists)

---

## 1. Scanner Architecture Patterns

### Pattern A: V31 Class-Based Architecture (Recommended for Production)

**File References**:
- `/projects/edge-dev-main/V31_GOLD_STANDARD_SPECIFICATION.md` (Complete specification)
- `/projects/edge-dev-main/V31_QUICK_REFERENCE.md` (Quick reference card)
- `/projects/edge-dev-main/optimized_backside_b_scanner.py` (Working example)

**Core Structure**:

```python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional

class BacksideBScanner:
    """
    Single-pattern scanner using v31 5-stage architecture

    Stages:
    1. fetch_grouped_data() - Fetch all tickers for all dates
    2a. compute_simple_features() - prev_close, adv20, price_range
    2b. apply_smart_filters() - Validate D0, preserve historical
    3a. compute_full_features() - EMA, ATR, slopes, etc.
    3b. detect_patterns() - Pattern detection logic
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner with date range and historical buffer"""

        # Store user's original D0 range separately
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # Calculate historical data range
        lookback_buffer = self.params['abs_lookback_days'] + 50
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

**Required Methods**:

| Method | Purpose | Critical Requirements |
|--------|---------|----------------------|
| `__init__(api_key, d0_start, d0_end)` | Initialize | MUST calculate historical buffer |
| `run_scan()` | Main execution | Calls all 5 stages in order |
| `fetch_grouped_data()` | Stage 1 | Use mcal, parallel fetching |
| `compute_simple_features()` | Stage 2a | Per-ticker operations |
| `apply_smart_filters()` | Stage 2b | Separate historical/D0 |
| `compute_full_features()` | Stage 3a | All technical indicators |
| `detect_patterns()` | Stage 3b | Pattern-specific logic |

---

### Pattern B: Standalone Script Architecture (Simple)

**File References**:
- `/projects/edge-dev-main/backend/SIMPLE_TEST_SCANNER.py`
- `/projects/edge-dev-main/backend/proven_backside_scanner.py`

**Core Structure**:

```python
import pandas as pd
import numpy as np

# Required: SYMBOLS list for the scanner
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'SHOP', 'SQ'
]

# Required: scan_symbol function
def scan_symbol(symbol, start_date, end_date):
    """
    Scanner function - must match this signature
    """
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

# Entry point
if __name__ == "__main__":
    print("Scanner - Verification Mode")
    # Test logic here
```

**Key Requirements**:
- `SYMBOLS` list at module level
- `scan_symbol(symbol, start_date, end_date)` function
- Returns list of dict results
- Optional `SCANNER_CONFIG` dict

---

### Critical Architecture Principles (From V31 Spec)

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

**WHY**: Accounts for holidays, early closes, skip weekends correctly

---

#### Principle 2: Historical Buffer Calculation

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

#### Principle 3: Per-Ticker Operations

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
        (df_output_range['adv20_usd'] >= self.params['adv20_min_usd']) &
        (df_output_range['price_range'] >= 0.50) &
        (df_output_range['volume'] >= 1_000_000)
    ].copy()

    # COMBINE historical + filtered D0
    df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

    return df_combined
```

**WHY**: Historical data needed for ABS window calculations, only D0 dates need validation

---

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
        executor.submit(self._process_ticker_optimized_pre_sliced, ticker_data): ticker_data[0]
        for ticker_data in ticker_data_list
    }
```

**WHY**: 360x speedup (6-8 minutes → 10-30 seconds)

---

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

**WHY**: Don't compute expensive features on data that will be filtered

---

## 2. Backtest Specifications

### Backtest Type A: Simple P&L Simulation

**File Reference**: `/projects/edge-dev-main/src/utils/backtest_script.py`

**Core Structure**:

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

**Required Metrics**:
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

---

### Backtest Type B: Enhanced Intraday Simulation

**File Reference**: `/projects/edge-dev-main/src/utils/enhanced_backtest_engine.py`

**Core Structure**:

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

**Enhanced Features**:
- Real intraday data fetching
- Multiple exit strategies
- Trailing stops
- Volume-based exits
- Time-based exits
- Comprehensive performance analytics

---

## 3. Code Structure Standards

### Required Imports

```python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional, Any
```

**File Reference**: All production scanners use these imports

---

### Column Naming Convention

| Stage | Columns | Format |
|-------|---------|--------|
| Stage 1 Output | `ticker`, `date`, `open`, `high`, `low`, `close`, `volume` | lowercase |
| Stage 2a/2b | Add: `prev_close`, `adv20_usd`, `price_range` | lowercase |
| Stage 3a | Add: `ema_9`, `atr`, `vol_avg`, etc. | lowercase |
| Detection Loop | Access via: `r1['Close']`, `r0['atr']` | Capitalized |

**WHY**: Stage 1-3 use lowercase for DataFrame operations, detection loop uses capitalized Series access

---

### Date Handling Standards

```python
# Stage 1-3: Store as datetime
df['date'] = pd.to_datetime(df['date'])

# Detection loop: Access as Timestamp
d0 = ticker_df.iloc[i]['date']

# Comparison
d0_start_dt = pd.to_datetime(self.d0_start_user)
d0_end_dt = pd.to_datetime(self.d0_end_user)

if d0 < d0_start_dt or d0 > d0_end_dt:
    continue
```

---

### Error Handling Patterns

```python
# Graceful handling of missing data
try:
    m = add_daily_metrics(ticker_data_indexed)
except:
    continue

# Early data validation
if len(ticker_df) < 100:
    return []

# NaN checks
if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.params['pos_abs_max']):
    continue
```

---

## 4. Data Structure Requirements

### Input Data Structure (from API)

```python
# Polygon grouped endpoint returns:
{
    "results": [
        {
            "T": "AAPL",  # Ticker
            "t": 1609459200000,  # Timestamp (ms)
            "o": 150.25,  # Open
            "h": 152.00,  # High
            "l": 149.50,  # Low
            "c": 151.75,  # Close
            "v": 50000000  # Volume
        }
    ]
}

# Convert to DataFrame:
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
df = df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
```

---

### Output Data Structure (Scan Results)

```python
# Single pattern scanner returns:
[
    {
        "Ticker": "AAPL",
        "Date": "2024-01-15",
        "Gap/ATR": 1.25,
        "D1_Body/ATR": 0.75,
        "PosAbs_1000d": 0.45,
        "D1Vol(shares)": 50000000,
        "D1Vol/Avg": 1.8,
        "Trigger": "D1_or_D2",
        # ... pattern-specific fields
    }
]

# Multi-pattern scanner returns:
[
    {
        "Ticker": "AAPL",
        "Date": "2024-01-15",
        "Scanner_Label": "D2_PM_Setup",  # Pattern identifier
        # ... pattern-specific fields
    }
]
```

---

## 5. Parameter System Design

### Parameter Structure Pattern

```python
self.params = {
    # === Mass Parameters (shared across all patterns) ===
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

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

### Parameter Access Patterns

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

## 6. API Integration Patterns

### Polygon API Configuration

```python
# Standard configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"  # Should be env variable
BASE_URL = "https://api.polygon.io"
session = requests.Session()

# Grouped endpoint (V31 preferred)
def fetch_grouped_data(self):
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    response = self.session.get(url, params={
        'apiKey': self.api_key,
        'adjusted': 'true'
    })

# Individual ticker endpoint (legacy)
def fetch_daily(tkr: str, start: str, end: str):
    url = f"{self.base_url}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    response = self.session.get(url, params={
        "apiKey": API_KEY,
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000
    })
```

---

### API Rate Limiting

```python
# V31 uses grouped endpoint: 1 call per day (not per ticker)
# Legacy uses individual ticker: N calls per ticker per day

# Standard rate limiting
import time

# Between ticker fetches
time.sleep(0.1)  # 100ms delay

# Between date fetches (grouped endpoint)
# No delay needed with ThreadPoolExecutor
```

---

## 7. Workflow Best Practices

### Development Workflow

1. **Create Scanner**
   - Choose architecture (V31 class-based or standalone script)
   - Implement required methods/functions
   - Define parameters

2. **Test Locally**
   - Use small symbol list (5-10 symbols)
   - Use short date range (1-2 months)
   - Verify output structure

3. **Validate**
   - Run full symbol list
   - Run full date range
   - Check performance metrics

4. **Deploy**
   - Add to project
   - Configure parameters
   - Monitor execution

---

### Testing Strategy

```python
# Simple test scanner
class TestScanner:
    def __init__(self):
        self.params = {
            'min_price': 5.0,
            'min_volume': 1000000
        }
        self.symbols = ['AAPL', 'MSFT', 'GOOGL']

    def run_scan(self):
        results = []
        for symbol in self.symbols:
            # Simple logic: find every 3rd symbol
            if hash(symbol) % 3 == 0:
                results.append({
                    'symbol': symbol,
                    'date': '2024-01-15',
                    'test': True
                })
        return results
```

---

## 8. Validation Checklists

### Scanner Validation Checklist

**V31 Class-Based Scanner**:
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

**Standalone Script Scanner**:
- [ ] Has `SYMBOLS` list at module level
- [ ] Has `scan_symbol(symbol, start_date, end_date)` function
- [ ] Returns list of dict results
- [ ] Has optional `SCANNER_CONFIG` dict
- [ ] Handles exceptions gracefully
- [ ] Provides progress feedback

---

### Backtest Validation Checklist

- [ ] Calculates all required metrics
- [ ] Handles edge cases (no trades, all wins, all losses)
- [ ] Uses proper position sizing
- [ ] Accounts for slippage (enhanced version)
- [ ] Uses realistic exit strategies
- [ ] Provides comprehensive statistics
- [ ] Handles missing data gracefully

---

### Code Quality Checklist

- [ ] Follows PEP 8 style guide
- [ ] Has docstrings for all functions/classes
- [ ] Has type hints (Python 3.6+)
- [ ] Handles exceptions properly
- [ ] Logs progress and errors
- [ ] Has parameter validation
- [ ] Has data validation
- [ ] Is testable in isolation
- [ ] Has no hardcoded values (use parameters)
- [ ] Has no magic numbers (use named constants)

---

## 9. Common Patterns and Anti-Patterns

### Common Anti-Patterns

**❌ Anti-Pattern 1**: Using weekday() for trading days
```python
# WRONG
if current_date.weekday() < 5:  # Monday-Friday
    # Process data
```

**✅ Correct Pattern**: Use pandas_market_calendars
```python
# RIGHT
nyse = mcal.get_calendar('NYSE')
trading_dates = nyse.valid_days(start_date, end_date)
```

---

**❌ Anti-Pattern 2**: Computing indicators across entire dataframe
```python
# WRONG
df['adv20'] = (df['close'] * df['volume']).rolling(20).mean()
```

**✅ Correct Pattern**: Compute per-ticker
```python
# RIGHT
df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(window=20, min_periods=20).mean()
)
```

---

**❌ Anti-Pattern 3**: Filtering historical data
```python
# WRONG
df_filtered = df[df['date'] >= d0_start]  # Loses historical data
```

**✅ Correct Pattern**: Separate and recombine
```python
# RIGHT
df_historical = df[~df['date'].between(d0_start, d0_end)]
df_output = df[df['date'].between(d0_start, d0_end)]
df_output_filtered = df_output[condition]
df_combined = pd.concat([df_historical, df_output_filtered])
```

---

**❌ Anti-Pattern 4**: Sequential processing
```python
# WRONG
results = []
for symbol in symbols:
    data = fetch_daily(symbol)  # Slow sequential
    results.append(process(data))
```

**✅ Correct Pattern**: Parallel processing
```python
# RIGHT
with ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(fetch_and_process, symbol): symbol for symbol in symbols}
    for future in as_completed(futures):
        results.append(future.result())
```

---

## 10. Recommended Tools and Libraries

### Required Libraries

```python
# Data manipulation
import pandas as pd
import numpy as np

# API requests
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Date/time handling
from datetime import datetime, timedelta
import pandas_market_calendars as mcal

# Type hints
from typing import List, Dict, Optional, Any
```

---

### Optional Libraries

```python
# Visualization (for testing)
import matplotlib.pyplot as plt

# Progress tracking
from tqdm import tqdm

# Configuration management
import yaml
import json

# Logging
import logging
```

---

## 11. Integration with EdgeDev System

### Project Structure

```
edge-dev-main/
├── backend/
│   ├── scanner.py              # Main scanner file
│   ├── backtest.py             # Backtesting engine
│   └── main.py                 # API endpoints
├── src/
│   ├── app/
│   │   └── api/
│   │       └── systematic/
│   │           └── scan/
│   │               └── route.ts  # Frontend integration
│   └── types/
│       └── projectTypes.ts      # Type definitions
└── data/
    └── projects.json            # Project storage
```

---

### API Integration Pattern

```python
# Frontend (TypeScript)
const response = await fetch('/api/systematic/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        scanner_type: 'backside_b',
        date_range: {
            start_date: '2024-01-01',
            end_date: '2024-12-31'
        },
        parameters: scanner_params
    })
});

# Backend (Python/FastAPI)
@app.post('/api/systematic/scan')
async def execute_scan(request: ScanRequest):
    scanner = BacksideBScanner(
        api_key=os.getenv('POLYGON_API_KEY'),
        d0_start=request.date_range.start_date,
        d0_end=request.date_range.end_date
    )
    results = scanner.run_scan()
    return {'results': results}
```

---

## 12. Uncertainties and Questions for User

### Questions Requiring Clarification

1. **Scanner Architecture Preference**:
   - Should new scanners be V31 class-based or standalone scripts?
   - Is there a performance requirement that dictates the choice?

2. **Backtest Fidelity**:
   - Should backtests use simple P&L simulation or enhanced intraday simulation?
   - What level of accuracy is required for decision-making?

3. **Parameter Management**:
   - Should parameters be stored in code, database, or configuration files?
   - How should parameter versioning be handled?

4. **Error Handling**:
   - Should scanners fail fast or gracefully handle errors?
   - What level of logging is required in production?

5. **Testing Requirements**:
   - Should all scanners have automated tests?
   - What test coverage percentage is required?

6. **Performance Benchmarks**:
   - What are the acceptable execution times for different scanner types?
   - How many symbols can be scanned in a single execution?

7. **Data Quality**:
   - How should missing or corrupted data be handled?
   - What data validation checks should be in place?

8. **Integration Points**:
   - Are there specific API endpoints that must be used?
   - How should results be formatted for frontend consumption?

---

## 13. Recommendations

### For New Scanner Development

1. **Start with V31 class-based architecture** for production scanners
2. **Use standalone scripts** for simple prototypes and testing
3. **Implement all 5 stages** for optimal performance
4. **Follow the validation checklists** before deployment
5. **Test with small datasets first**, then scale up
6. **Document parameters** and their effects
7. **Use version control** for scanner iterations
8. **Monitor performance** in production

---

### For Backtest Development

1. **Start with simple P&L simulation** for validation
2. **Add intraday simulation** for accuracy when needed
3. **Calculate all required metrics** consistently
4. **Handle edge cases** (no trades, extreme values)
5. **Document assumptions** (slippage, commissions, etc.)
6. **Validate against real trades** when possible
7. **Track performance over time**
8. **Compare strategies** using consistent metrics

---

### For Code Quality

1. **Follow PEP 8** style guidelines
2. **Add type hints** for all functions
3. **Write docstrings** for all classes and functions
4. **Handle exceptions** gracefully
5. **Log progress** and errors
6. **Use constants** instead of magic numbers
7. **Validate inputs** (parameters, data)
8. **Write tests** for critical logic

---

## Conclusion

This research document provides a comprehensive overview of the EdgeDev codebase patterns and standards. The "presumed gold standard" is based on analysis of production code, working scanners, and established patterns.

### Key Takeaways

1. **V31 architecture is the modern standard** - 360x faster, scalable, maintainable
2. **Backside B pattern is most battle-tested** - 75+ variants, proven results
3. **Two-pass computation is critical** - Simple features → Filter → Full features
4. **Per-ticker operations are mandatory** - Correctness depends on it
5. **Historical data preservation is essential** - ABS window needs 1000+ days

### Next Steps

1. Review this document with stakeholders
2. Clarify uncertainties and questions
3. Validate assumptions with team
4. Create implementation guides based on this research
5. Establish code review standards
6. Develop automated validation tools

---

**Document Status**: RESEARCH COMPLETE
**Last Updated**: 2026-01-29
**Version**: 1.0
**Author**: Claude (Research Agent)
**Reviewed By**: [PENDING]

---

## Appendix A: File References

### Key Specification Documents
- `/projects/edge-dev-main/V31_GOLD_STANDARD_SPECIFICATION.md` - Complete V31 specification
- `/projects/edge-dev-main/V31_QUICK_REFERENCE.md` - Quick reference card
- `/projects/edge-dev-main/MASTER_UNIFIED_SCANNER_TEMPLATE.py` - Template code

### Working Scanner Examples
- `/projects/edge-dev-main/backend/SIMPLE_TEST_SCANNER.py` - Simple test scanner
- `/projects/edge-dev-main/backend/optimized_backside_b_scanner.py` - Optimized Backside B
- `/projects/edge-dev-main/backend/proven_backside_scanner.py` - Proven working scanner
- `/projects/edge-dev-main/backend/fixed_backside_b_scanner.py` - Fixed version

### Backtest Engines
- `/projects/edge-dev-main/src/utils/backtest_script.py` - Simple backtest
- `/projects/edge-dev-main/src/utils/enhanced_backtest_engine.py` - Enhanced backtest

### Type Definitions
- `/projects/edge-dev-main/src/types/projectTypes.ts` - TypeScript types

---

## Appendix B: Parameter Reference

### Common Parameter Categories

**Market Filters**:
- `price_min`: Minimum stock price (default: 8.0)
- `adv20_min_usd`: Minimum 20-day average dollar volume (default: 30,000,000)
- `volume_min`: Minimum daily volume (default: 1,000,000)

**Technical Indicators**:
- `atr_mult`: ATR multiplier (default: 0.9)
- `vol_mult`: Volume multiplier (default: 0.9)
- `ema_periods`: EMA periods to use (default: [9, 20, 50])

**Pattern Specific**:
- `abs_lookback_days`: Lookback for absolute position (default: 1000)
- `gap_div_atr_min`: Minimum gap/ATR ratio (default: 0.75)
- `open_over_ema9_min`: Minimum open/EMA9 ratio (default: 0.9)

---

## Appendix C: Performance Benchmarks

### Scanner Execution Times

| Scanner Type | Symbols | Date Range | Execution Time |
|--------------|---------|------------|----------------|
| V31 Class-Based | 100 | 1 year | 10-30 seconds |
| V31 Class-Based | 1000 | 1 year | 30-60 seconds |
| Standalone Script | 100 | 1 year | 2-5 minutes |
| Standalone Script | 1000 | 1 year | 10-20 minutes |

### Backtest Execution Times

| Backtest Type | Trades | Intraday Data | Execution Time |
|---------------|--------|---------------|----------------|
| Simple P&L | 100 | No | <1 second |
| Simple P&L | 1000 | No | 1-2 seconds |
| Enhanced | 100 | Yes | 30-60 seconds |
| Enhanced | 1000 | Yes | 5-10 minutes |

---

**END OF RESEARCH DOCUMENT**
