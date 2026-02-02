# EdgeDev Execution System Gold Standard
**Complete Strategy Definition, Execution & Backtesting Framework**

**Version**: 2.0
**Date**: 2026-01-29
**Status**: COMPLETE - Archon-Enabled

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Strategy Definition Framework](#strategy-definition-framework)
3. [Entry Logic](#entry-logic)
4. [Position Management](#position-management)
5. [Exit Logic](#exit-logic)
6. [Pyramiding & Scaling](#pyramiding--scaling)
7. [Capital Management](#capital-management)
8. [Risk Management](#risk-management)
9. [Retry & Re-entry Rules](#retry--re-entry-rules)
10. [Data Input Modes](#data-input-modes)
11. [Execution Engine](#execution-engine)
12. [Performance Metrics](#performance-metrics)
13. [Validation Framework](#validation-framework)
14. [Archon Integration](#archon-integration)

---

## System Overview

### What This System Does

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE STRATEGY EXECUTION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUT: Any trading approach you can describe                          │
│  ├── Scanner-based strategies                                          │
│  ├── Custom signal strategies                                          │
│  ├── Hybrid approaches                                                 │
│  └── Multi-stage execution                                            │
│                                                                         │
│  PROCESS: Define it → Agent generates code → Backtest validates       │
│                                                                         │
│  OUTPUT: Production-ready execution system                             │
│  ├── Scanner code (if needed)                                          │
│  ├── Execution logic                                                   │
│  ├── Backtest results                                                  │
│  ├── Performance metrics                                               │
│  └── Edge validation                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARCHON-POWERED WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. USER DESCRIBES STRATEGY                                            │
│     "I want to fade gap ups with pyramiding and trailing stops"        │
│                                                                         │
│  2. AGENT QUERIES ARCHON                                                │
│     ├── Retrieve: Gap fade patterns                                     │
│     ├── Retrieve: Pyramiding best practices                            │
│     ├── Retrieve: Trailing stop methods                                │
│     ├── Retrieve: Past similar projects                                │
│     └── Retrieve: What worked/what didn't                             │
│                                                                         │
│  3. AGENT GENERATES STRATEGY DEFINITION                                │
│     ├── Entry logic (from Archon patterns)                             │
│     ├── Execution rules (from Archon knowledge)                        │
│     ├── Parameter suggestions (from past results)                      │
│     └── Code structure (from V31 Gold Standard)                        │
│                                                                         │
│  4. AGENT GENERATES CODE                                                │
│     ├── Scanner (if needed)                                             │
│     ├── Execution engine                                                │
│     ├── Backtest simulator                                              │
│     └── Validation code                                                 │
│                                                                         │
│  5. SYSTEM VALIDATES                                                    │
│     ├── Run backtest                                                   │
│     ├── Check A+ examples                                              │
│     ├── Validate edge                                                  │
│     └── Store results in Archon                                        │
│                                                                         │
│  6. USER REVIEWS & ITERATES                                            │
│     └── Cycle continues, agent learns more                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Strategy Definition Framework

### Complete Strategy Specification

Every strategy can be fully defined with these components:

```python
strategy = {
    # === IDENTITY ===
    'name': 'Gap Fade with Pyramiding',
    'description': 'Fade gap ups, add to winners, trail stops',
    'author': 'User',
    'created': '2025-01-29',

    # === ENTRY LOGIC ===
    'entry': {
        'type': 'scanner_based',  # OR 'custom_signal' OR 'hybrid'
        'scanner': 'GapFadeScanner',
        'custom_condition': None,
        'signal_filter': None,  # Additional filtering
        'initial_position_pct': 0.5,  # Start with 50% of full position
    },

    # === POSITION MANAGEMENT ===
    'position': {
        'sizing_method': 'atr_based',  # OR 'fixed_pct' OR 'kelly'
        'risk_per_trade_pct': 0.01,  # 1% of account
        'max_positions': 5,
        'correlation_limit': 0.7,  # Max correlation between positions
    },

    # === PYRAMIDING (Adding to Winners) ===
    'pyramid': {
        'enabled': True,
        'num_adds': 2,  # Maximum 2 additions
        'trigger': 'unrealized_r >= 1.0',  # Add when up 1R
        'add_size_pct': 0.25,  # Add 25% of initial each time
        'spacing': 'atr_based',  # OR 'fixed_r' OR 'fixed_price'
        'atr_spacing': 1.5,
    },

    # === STOPS ===
    'stops': {
        'initial': {
            'type': 'atr_based',  # OR 'fixed_price' OR 'fixed_pct'
            'atr_multiplier': 0.8,
        },
        'breakeven': {
            'enabled': True,
            'trigger_r': 1.0,  # Move to breakeven after 1R
        },
        'trailing': {
            'enabled': True,
            'trigger_r': 2.0,  # Start trailing after 2R
            'type': 'atr_based',  # OR 'fixed_r' OR 'percent'
            'atr_multiplier': 0.5,
        },
        'time_stop': {
            'enabled': False,
            'max_holding_minutes': 240,
        },
    },

    # === TARGETS ===
    'targets': [
        {'r': 1.5, 'exit_pct': 0.5, 'type': 'profit_target'},
        {'r': 3.0, 'exit_pct': 0.3, 'type': 'profit_target'},
        {'r': 5.0, 'exit_pct': 0.2, 'type': 'profit_target'},
    ],
    # Remaining exited by other conditions (stop, time, etc.)

    # === RETRY RULES (Re-entry) ===
    'retry': {
        'enabled': True,
        'condition': 'signal_reoccurs AND volume >= 2x_initial',
        'cooldown_bars': 5,  # Wait 5 bars before re-entry
        'max_retries_per_setup': 2,
        'reset_after_stop': True,  # Reset retry count after stopped
    },

    # === CAPITAL MANAGEMENT ===
    'capital': {
        'recycling_pct': 0.5,  # Reinvest 50% of profits
        'withdraw_pct': 0.5,  # Withdraw 50% of profits
        'compounding': True,  # Compound profits
        'base_rebalance': 'daily',  # How often to reset to base capital
    },

    # === RISK MANAGEMENT ===
    'risk': {
        'max_risk_per_trade': 0.02,  # 2% of account per trade
        'max_portfolio_risk': 0.10,  # Stop trading if 10% drawdown
        'max_correlation_exposure': 0.15,  # Max exposure to correlated positions
        'daily_loss_limit': 0.03,  # Stop trading if 3% loss in day
    },

    # === DATA SOURCE ===
    'data': {
        'mode': 'scanner_results',  # OR 'single_ticker' OR 'multi_ticker' OR 'custom'
        'tickers': None,  # For single/multi mode
        'scanner_config': None,  # For scanner mode
        'custom_data_source': None,  # For custom mode
    },

    # === VALIDATION ===
    'validation': {
        'min_trades': 30,
        'min_win_rate': 0.55,
        'min_expectancy': 0.10,  # 0.10R per trade
        'max_drawdown': 0.15,
        'regime_check': True,  # Must work in multiple regimes
    },
}
```

---

## Entry Logic

### Entry Types

#### Type 1: Scanner-Based Entry

```python
# Entry triggered by scanner signal
entry = {
    'type': 'scanner_based',
    'scanner': 'GapFadeScanner',  # References scanner in Archon
    'signal_filter': {
        'min_gap': 0.03,  # Minimum 3% gap
        'min_volume_ratio': 1.5,
        'max_hold_range': 0.005,  # Hold tight
    },
    'initial_position_pct': 0.5,  # Start with 50% position
}

# Agent retrieves from Archon:
# - Scanner code (V31-compliant)
# - Best parameter values (from past optimizations)
# - Typical signal characteristics
```

#### Type 2: Custom Signal Entry

```python
# Entry based on custom logic (no scanner)
entry = {
    'type': 'custom_signal',
    'condition': 'close < open AND volume > 2x_avg AND close < low_5_bars_ago',
    'lookback_bars': 20,  # Need 20 bars history
    'signal_strength': 'min_score_70',  # If signal has strength metric
    'initial_position_pct': 1.0,  # Full position immediately
}

# Agent generates from Archon knowledge:
# - Condition parsing
# - Feature calculation (indicators)
# - Signal strength scoring
```

#### Type 3: Hybrid Entry

```python
# Entry combines scanner + custom confirmation
entry = {
    'type': 'hybrid',
    'primary': 'scanner_signal',  # Scanner provides initial signal
    'confirmation': 'custom_condition',  # Custom confirms entry
    'scanner': 'GapFadeScanner',
    'confirmation_logic': 'close < open AND volume_expanding',
    'initial_position_pct': 0.75,  # Larger position when confirmed
}
```

### Entry Timing

```python
entry_timing = {
    'type': 'immediate',  # OR 'confirmation' OR 'limit'

    # Immediate: Enter at signal
    'immediate': {
        'price': 'close',  # OR 'open' OR 'next_open'
    },

    # Confirmation: Wait for confirmation pattern
    'confirmation': {
        'pattern': 'weak_close',  # OR 'volume_spike' OR 'breakout'
        'max_wait_bars': 3,  # Don't wait forever
        'entry_price': 'close_of_confirm_bar',
    },

    # Limit: Place limit order
    'limit': {
        'discount_from_signal': 0.001,  # 0.1% discount
        'max_wait_bars': 5,
        'if_not_filled': 'skip' OR 'market_order',
    },
}
```

---

## Position Management

### Position Sizing

```python
# Sizing methods (stored in Archon, retrieved by agent)
position_sizing = {
    'method': 'atr_based',  # Most common for trading

    'atr_based': {
        'risk_per_trade_pct': 0.01,  # 1% of account
        'atr_multiplier': 0.8,  # Stop at 0.8x ATR
        'shares': 'risk_amount / (atr * atr_multiplier)',
    },

    'fixed_pct': {
        'risk_per_trade_pct': 0.01,
        'shares': '(account * risk_pct) / (entry - stop)',
    },

    'kelly': {
        'win_rate': 0.60,  # From backtest
        'avg_win_r': 2.0,
        'avg_loss_r': 1.0,
        'kelly_fraction': 0.25,  # Use quarter-Kelly
        'shares': '(account * kelly_pct) / loss_amount',
    },

    'volatility_adjusted': {
        'base_risk_pct': 0.01,
        'vol_adjustment': 'atr / 20d_avg_atr',
        'final_risk_pct': 'base_risk * vol_adjustment',
    },
}
```

### Multi-Position Management

```python
# Managing multiple simultaneous positions
position_management = {
    'max_positions': 5,  # Maximum concurrent positions

    'position_limits': {
        'max_per_sector': 2,  # Max 2 positions per sector
        'max_correlated': 2,  # Max 2 correlated positions
        'correlation_threshold': 0.7,
    },

    'sizing_with_multiple': {
        'method': 'equal_risk',  # Equal risk per position
        # OR 'equal_weight',  # Equal dollar amount
        # OR 'volatility_paridad',  # More volatile = smaller position
    },

    'entry_priority': {
        'rank_by': 'signal_strength',  # OR 'gap_size' OR 'volume'
        'max_entries_per_day': 3,
    },
}
```

---

## Exit Logic

### Exit Types

```python
exit_logic = {
    # 1. Profit Target (R-based)
    'profit_target': {
        'enabled': True,
        'type': 'r_multiple',  # OR 'atr_based' OR 'price'
        'targets': [
            {'r': 1.5, 'exit_pct': 0.50},  # Exit 50% at 1.5R
            {'r': 3.0, 'exit_pct': 0.30},  # Exit 30% at 3.0R
            {'r': 5.0, 'exit_pct': 0.20},  # Exit 20% at 5.0R
        ],
        # Remaining 100% exited by other conditions
    },

    # 2. Stop Loss
    'stop_loss': {
        'initial': {
            'type': 'atr_based',
            'atr_multiplier': 0.8,
            'buffer': 0.001,  # Small buffer to avoid noise
        },
        'breakeven': {
            'enabled': True,
            'trigger_r': 1.0,  # Move to breakeven after 1R
        },
        'trailing': {
            'enabled': True,
            'trigger_r': 2.0,  # Start trailing after 2R
            'type': 'atr_based',
            'atr_multiplier': 0.5,
            # Trail stops as price moves in favor
        },
    },

    # 3. Time-Based Exit
    'time_exit': {
        'enabled': True,
        'max_holding_minutes': 240,  # 4 hours
        'end_of_day': True,  # Exit at market close
        'exit_time': '15:55:00',  # Exit at 3:55 PM ET
    },

    # 4. Condition-Based Exit
    'condition_exit': {
        'enabled': False,
        'conditions': [
            'volume_dries_up',  # Volume drops below threshold
            'momentum_slows',  # Rate of change decreases
            'pattern_invalidated',  # Setup fails
        ],
    },

    # 5. Target Exit Priority
    'exit_priority': [
        'stop_loss',      # Check first (protect capital)
        'profit_target',  # Check second (lock in gains)
        'time_exit',      # Check third (don't overhold)
        'condition_exit', # Check fourth
    ],
}
```

### Stop Management Implementation

```python
class StopManager:
    """
    Manages all stop types for a position

    Retrieved from Archon:
    - Stop patterns that work
    - ATR multiplier preferences
    - Breakeven triggers
    - Trailing configurations
    """

    def __init__(self, position, strategy_config):
        self.position = position
        self.config = strategy_config['stops']

        # Initialize stops
        self.initial_stop = self._calculate_initial_stop()
        self.current_stop = self.initial_stop
        self.highest_price = position.entry_price  # For longs
        self.lowest_price = position.entry_price   # For shorts

    def update(self, bar):
        """Update stops based on new bar"""
        unrealized_r = self._calculate_unrealized_r(bar)

        # Check breakeven
        if self.config['breakeven']['enabled']:
            if unrealized_r >= self.config['breakeven']['trigger_r']:
                self.current_stop = self.position.entry_price

        # Check trailing
        if self.config['trailing']['enabled']:
            if unrealized_r >= self.config['trailing']['trigger_r']:
                self._update_trailing_stop(bar)

        # Check time stop
        if self.config['time_stop']['enabled']:
            if self._check_time_stop(bar):
                return {'action': 'exit', 'reason': 'time_stop'}

        # Check if stop hit
        if self._check_stop_hit(bar):
            return {'action': 'exit', 'reason': 'stop_loss',
                    'price': self.current_stop}

        return {'action': 'hold', 'current_stop': self.current_stop}

    def _calculate_initial_stop(self):
        """Calculate initial stop based on config"""
        if self.config['initial']['type'] == 'atr_based':
            stop_distance = self.position.atr * self.config['initial']['atr_multiplier']

            if self.position.direction == 'LONG':
                return self.position.entry_price - stop_distance
            else:
                return self.position.entry_price + stop_distance

    def _update_trailing_stop(self, bar):
        """Update trailing stop"""
        if self.position.direction == 'LONG':
            # Update highest price
            if bar['high'] > self.highest_price:
                self.highest_price = bar['high']

            # Calculate new trailing stop
            trail_distance = self.position.atr * self.config['trailing']['atr_multiplier']
            new_stop = self.highest_price - trail_distance

            # Only move stop up, never down
            if new_stop > self.current_stop:
                self.current_stop = new_stop
```

---

## Pyramiding & Scaling

### Pyramiding (Adding to Winners)

```python
pyramid_config = {
    'enabled': True,

    # When to add
    'trigger': {
        'type': 'r_based',  # OR 'price_based' OR 'time_based'
        'r_threshold': 1.0,  # Add when up 1R
        # OR
        'price_threshold': 'entry + (2 * atr)',
        # OR
        'time_threshold': '30_minutes_after_entry',
    },

    # How much to add
    'add_size': {
        'type': 'pct_of_initial',  # OR 'fixed_risk' OR 'volatility_adjusted'
        'pct_of_initial': 0.25,  # Add 25% of initial position each time
        # OR
        'fixed_risk': 500,  # Add $500 risk worth
        # OR
        'volatility_adjusted': 'initial * (entry_atr / current_atr)',
    },

    # How many times
    'max_adds': 2,  # Maximum 2 additions

    # Where to add
    'add_levels': {
        'type': 'automatic',  # Add at trigger
        # OR 'predefined': Add at specific price levels
        'levels': [
            {'price': 'entry + (1.5 * atr)', 'size_pct': 0.25},
            {'price': 'entry + (3.0 * atr)', 'size_pct': 0.25},
        ],
    },

    # Stop management with pyramiding
    'stops': {
        'move_to_breakeven': 'after_first_add',  # After first add-on
        'trail_all_adds': True,  # Trail all positions together
    },
}
```

### Scaling (Position Sizing Over Time)

```python
scaling_config = {
    'enabled': False,

    # Scale in (build position over time)
    'scale_in': {
        'initial_entry': 0.33,  # Start with 33%
        'second_entry': 0.33,   # Add 33% at confirmation
        'third_entry': 0.34,    # Add 34% on continuation
        'conditions': [
            'initial_entry': 'immediate',
            'second_entry': 'close_below_open',
            'third_entry': 'continues_lower',
        ],
    },

    # Scale out (exit in pieces)
    'scale_out': {
        'first_exit': {'r': 1.5, 'pct': 0.50},
        'second_exit': {'r': 3.0, 'pct': 0.30},
        'final_exit': {'r': 5.0, 'pct': 0.20},
    },
}
```

---

## Capital Management

### Recycling Strategies

```python
capital_management = {
    # Base capital configuration
    'base_capital': 100000,
    'rebalance_frequency': 'daily',  # Reset to base daily

    # Profit recycling
    'recycling': {
        'enabled': True,
        'recycle_pct': 0.50,  # Reinvest 50% of profits
        'withdraw_pct': 0.50,  # Withdraw 50% of profits
        'recycle_delay': 'immediate',  # OR 'after_confirmation'
    },

    # Compounding
    'compounding': {
        'enabled': True,
        'method': 'full',  # OR 'partial' OR 'kelly_based'
        'max_growth': 2.0,  # Stop compounding at 2x capital
    },

    # Drawdown management
    'drawdown_control': {
        'max_drawdown_pct': 0.10,  # Stop trading at 10% DD
        'reduce_size_at': 0.05,  # Reduce position size at 5% DD
        'reduction_factor': 0.5,  # Reduce by 50%
        'reset_after_drawdown': True,
    },
}
```

### Implementation

```python
class CapitalManager:
    """
    Manages account capital and position sizing

    Retrieved from Archon:
    - Recycling strategies that worked
    - Risk management rules
    - Account growth patterns
    """

    def __init__(self, initial_capital, config):
        self.base_capital = initial_capital
        self.current_capital = initial_capital
        self.config = config

    def update_after_trade(self, trade_result):
        """Update capital after trade closes"""
        pnl = trade_result['pnl']

        # Apply recycling rules
        if self.config['recycling']['enabled']:
            if pnl > 0:  # Profit
                recycle_amount = pnl * self.config['recycling']['recycle_pct']
                self.current_capital += recycle_amount
                # Remaining withdrawn
            else:  # Loss
                self.current_capital += pnl  # Full loss applied

        # Check for rebalance
        if self._should_rebalance():
            self._rebalance_to_base()

    def get_position_size(self, risk_per_trade, stop_distance):
        """Calculate position size based on current capital and risk"""
        risk_amount = self.current_capital * risk_per_trade
        shares = int(risk_amount / stop_distance)
        return shares

    def _should_rebalance(self):
        """Check if should reset to base capital"""
        # Rebalance daily (or per config)
        return True  # Simplified
```

---

## Risk Management

### Portfolio-Level Risk

```python
risk_management = {
    # Per-trade risk
    'per_trade': {
        'max_risk_pct': 0.01,  # 1% of account per trade
        'max_position_pct': 0.20,  # Max 20% of account in one position
    },

    # Portfolio risk
    'portfolio': {
        'max_open_risk': 0.05,  # Max 5% total risk at once
        'max_drawdown_limit': 0.10,  # Stop trading at 10% DD
        'max_daily_loss': 0.03,  # Stop trading for day at 3% loss
    },

    # Correlation risk
    'correlation': {
        'max_correlated_positions': 2,
        'correlation_threshold': 0.7,
        'sector_concentration_limit': 0.30,  # Max 30% in one sector
    },

    # Volatility risk
    'volatility': {
        'reduce_size_when_vix_high': True,
        'vix_threshold': 25,
        'size_reduction_factor': 0.5,
    },
}
```

### Implementation

```python
class RiskManager:
    """
    Manages portfolio-level risk

    Retrieved from Archon:
    - Risk rules that protect capital
    - Drawdown patterns to avoid
    - Correlation management
    """

    def __init__(self, account_value, config):
        self.account_value = account_value
        self.config = config
        self.current_risk = 0
        self.positions = {}

    def can_enter_position(self, proposed_position):
        """Check if new position within risk limits"""
        # Check per-trade risk
        position_risk = proposed_position['risk_amount']
        if position_risk > self.account_value * self.config['per_trade']['max_risk_pct']:
            return False, "Position risk exceeds limit"

        # Check portfolio risk
        total_risk = self.current_risk + position_risk
        if total_risk > self.account_value * self.config['portfolio']['max_open_risk']:
            return False, "Portfolio risk exceeds limit"

        # Check correlation
        if not self._check_correlation(proposed_position):
            return False, "Too correlated to existing positions"

        return True, "Position approved"

    def update_daily_limits(self, daily_pnl):
        """Update daily loss limits"""
        if daily_pnl < 0:
            daily_loss_pct = abs(daily_pnl) / self.account_value

            if daily_loss_pct >= self.config['portfolio']['max_daily_loss']:
                return 'STOP_TRADING_FOR_DAY'

        return 'CONTINUE'
```

---

## Retry & Re-entry Rules

### Re-entry After Stop

```python
retry_config = {
    'enabled': True,

    # When to retry
    'conditions': [
        'signal_reoccurs',  # Same setup appears again
        'volume_confirms',  # Higher volume on re-signal
        'trend_continues',  # Original trend still intact
    ],

    # When NOT to retry
    'exclusions': [
        'stop_was_far',  # If stopped far from entry (setup failed)
        'market_regime_changed',  # Market conditions changed
        'max_retries_reached',  # Already retried max times
    ],

    # Retry parameters
    'max_retries': 2,
    'cooldown_bars': 5,  # Wait 5 bars before retry
    'cooldown_minutes': 30,  # OR wait 30 minutes
    'reset_after_new_signal': True,  # Reset retry count on new signal

    # Position sizing on retry
    'retry_sizing': {
        'same_size': False,  # Use same size
        'reduce_size': True,  # Reduce size on retries
        'reduction_factor': 0.5,  # 50% size on first retry
        'min_size': 0.25,  # Min 25% of original
    },
}
```

### Implementation

```python
class RetryManager:
    """
    Manages re-entry after stops

    Retrieved from Archon:
    - Retry patterns that work
    - When to retry vs when to skip
    - Sizing adjustments for retries
    """

    def __init__(self, config):
        self.config = config
        self.retry_history = {}  # Track retries per setup

    def can_retry(self, original_signal, current_signal, stop_result):
        """Check if retry is allowed"""
        setup_id = self._get_setup_id(original_signal)

        # Check exclusions
        if self._should_exclude(original_signal, stop_result):
            return False, "Retry excluded"

        # Check max retries
        if setup_id in self.retry_history:
            if self.retry_history[setup_id]['count'] >= self.config['max_retries']:
                return False, "Max retries reached"

        # Check conditions
        if not self._check_conditions(original_signal, current_signal):
            return False, "Retry conditions not met"

        return True, "Retry allowed"

    def calculate_retry_size(self, original_size, retry_number):
        """Calculate position size for retry"""
        if self.config['retry_sizing']['reduce_size']:
            reduction = self.config['retry_sizing']['reduction_factor']
            adjusted_size = original_size * (reduction ** retry_number)

            min_size = original_size * self.config['retry_sizing']['min_size']
            return max(adjusted_size, min_size)

        return original_size
```

---

## Data Input Modes

### Mode 1: Single Ticker

```python
# Test strategy on one ticker
data_config = {
    'mode': 'single_ticker',
    'ticker': 'SPY',
    'start_date': '2020-01-01',
    'end_date': '2024-12-31',
    'data_source': 'polygon',  # OR 'alphavantage' OR 'local'
    'bar_size': 'minute',  # OR 'daily' OR '5minute'
}

# Use case: Test execution logic without scanner complexity
# Example: "Test if my pyramiding rules work on SPY"
```

### Mode 2: Multi-Ticker

```python
# Test strategy on specific group of tickers
data_config = {
    'mode': 'multi_ticker',
    'tickers': ['SPY', 'QQQ', 'IWM', 'DIA'],
    'start_date': '2020-01-01',
    'end_date': '2024-12-31',
    'data_source': 'polygon',
    'bar_size': 'daily',
}

# Use case: Test on liquid ETFs
# Example: "Test gap fade on major indices"
```

### Mode 3: Scanner Results

```python
# Use scanner to find signals, then backtest
data_config = {
    'mode': 'scanner_results',
    'scanner': 'GapFadeScanner',
    'scanner_params': {...},  # Scanner parameters
    'scanner_date_range': {
        'start': '2020-01-01',
        'end': '2024-12-31',
    },
    'backtest_data': {
        'bar_size': 'minute',  # Need minute bars for execution
        'lookback_days': 5,  # Get 5 days around each signal
    },
}

# Use case: Full workflow (scan → backtest)
# Example: "Find all gap fades → Test execution rules"
```

### Mode 4: Custom Signal

```python
# Generate signals from custom logic, then backtest
data_config = {
    'mode': 'custom_signal',
    'tickers': ['SPY'],  # OR multi-ticker
    'signal_generator': {
        'type': 'python_function',  # OR 'indicator_based' OR 'pattern_based'
        'logic': 'close < open AND volume > 2x_avg',
        'lookback': 20,
    },
    'backtest_data': {
        'bar_size': 'minute',
        'date_range': {...},
    },
}

# Use case: Test custom idea without building scanner
# Example: "Test if weak close + high volume works"
```

---

## Execution Engine

### Complete Backtest Simulator

```python
class CompleteExecutionEngine:
    """
    Simulates complete strategy execution

    Retrieved from Archon:
    - Execution patterns (what works)
    - Performance baselines
    - Common pitfalls to avoid
    """

    def __init__(self, strategy_def, data_config):
        self.strategy = strategy_def
        self.data_config = data_config

        # Initialize components
        self.data_loader = self._initialize_data_loader()
        self.signal_generator = self._initialize_signal_generator()
        self.position_manager = PositionManager(strategy_def)
        self.stop_manager = StopManager(strategy_def)
        self.capital_manager = CapitalManager(strategy_def)
        self.risk_manager = RiskManager(strategy_def)
        self.retry_manager = RetryManager(strategy_def)

    def run_backtest(self):
        """Run complete backtest"""
        # Load data based on mode
        data = self.data_loader.load(self.data_config)

        # Generate signals
        signals = self.signal_generator.generate(data, self.strategy)

        # Process each signal
        trades = []
        equity_curve = []
        account_value = self.strategy['capital']['base_capital']

        for date, bars in data:
            # Check existing positions
            for position in list(self.position_manager.positions):
                # Update stops
                stop_action = self.stop_manager.update(position, bars)

                # Check pyramiding
                if self.strategy['pyramid']['enabled']:
                    if self._check_pyramid_trigger(position):
                        self._add_to_position(position)

                # Check exits
                if stop_action['action'] == 'exit':
                    closed_trade = self.position_manager.close_position(
                        position,
                        exit_price=stop_action['price'],
                        exit_reason=stop_action['reason']
                    )

                    trades.append(closed_trade)
                    account_value += closed_trade['pnl']

                    # Check retry
                    if self.strategy['retry']['enabled']:
                        if self.retry_manager.can_retry(closed_trade):
                            # Re-enter logic
                            pass

            # Check new signals
            new_signals = [s for s in signals if s['date'] == date]

            for signal in new_signals:
                # Check risk limits
                can_enter, reason = self.risk_manager.can_enter_position(signal)

                if can_enter:
                    # Enter position
                    position = self.position_manager.open_position(
                        signal,
                        account_value,
                        self.strategy
                    )

            # Update equity curve
            equity_curve.append({
                'date': date,
                'account_value': account_value,
                'positions': len(self.position_manager.positions),
            })

            # Update capital
            self.capital_manager.update_after_day(equity_curve[-1])

        # Calculate metrics
        results = self._calculate_metrics(trades, equity_curve)

        # Validate
        validation = self._validate_strategy(results, self.strategy)

        return {
            'trades': trades,
            'equity_curve': equity_curve,
            'metrics': results,
            'validation': validation,
        }
```

---

## Performance Metrics

### Trade-Level Metrics

```python
trade_metrics = {
    # Basic stats
    'total_trades': 'Total number of trades',
    'avg_trades_per_month': 'Trading frequency',

    # Win/Loss stats
    'win_rate': 'Percentage of winning trades',
    'avg_win_r': 'Average win in R-multiples',
    'avg_loss_r': 'Average loss in R-multiples',
    'win_loss_ratio': 'Avg win / Avg loss (absolute)',
    'largest_win_r': 'Best trade',
    'largest_loss_r': 'Worst trade',

    # Profitability
    'total_return_r': 'Total profit in R-multiples',
    'total_return_pct': 'Total percent return on account',
    'expectancy': 'Average R per trade',
    'profit_factor': 'Sum wins / Sum losses (absolute)',
    'sharpe_ratio': 'Return / Volatility ratio',
    'sortino_ratio': 'Return / Downside volatility',

    # Risk
    'max_drawdown_r': 'Maximum peak-to-trough decline in R',
    'max_drawdown_pct': 'Maximum peak-to-trough decline in %',
    'max_consecutive_losses': 'Worst losing streak',
    'avg_drawdown': 'Average drawdown',

    # Efficiency
    'avg_holding_time': 'Average trade duration',
    'time_in_market_pct': '% time invested',
}
```

### Component Analysis

```python
# What's adding value?
component_analysis = {
    # Entry effectiveness
    'entry_analysis': {
        'enter_at_signal': 'How well initial entry performs',
        'confirmation_entry': 'Does confirmation help?',
        'limit_entry': 'Does limit order improve?',
        'skip_without_confirmation': 'Cost of skipping',
    },

    # Pyramiding effectiveness
    'pyramid_analysis': {
        'pyramid_contrib_r': 'R added from pyramiding',
        'pyramid_win_rate': 'Win rate with pyramid vs without',
        'optimal_num_adds': 'Best number of additions',
        'when_pyramid_hurts': 'When adding hurts performance',
    },

    # Exit effectiveness
    'exit_analysis': {
        'stop_efficiency': 'Are stops saving capital?',
        'target_hit_rate': 'How often targets hit',
        'trailing_contrib': 'R added from trailing',
        'time_exit_contrib': 'R added from time stops',
    },

    # Retry effectiveness
    'retry_analysis': {
        'retry_win_rate': 'Win rate on retries vs initial',
        'retry_contrib_r': 'R added from retries',
        'when_retry_hurts': 'When retries hurt performance',
    },

    # Capital impact
    'capital_analysis': {
        'recycling_contrib_r': 'R added from recycling',
        'compounding_effect': 'Impact of compounding',
        'optimal_recycle_pct': 'Best % to recycle',
    },
}
```

---

## Validation Framework

### Validation Steps

```python
validation_steps = {
    # Step 1: Basic validation
    'basic': {
        'min_trades': 30,
        'min_win_rate': 0.55,
        'min_expectancy': 0.10,
    },

    # Step 2: Statistical validation
    'statistical': {
        't_test_significance': 'p_value < 0.05',
        'sharpe_threshold': '> 1.0',
        'max_drawdown_limit': '< 0.15',
    },

    # Step 3: Regime validation
    'regime': {
        'bull_market_performance': 'Must be profitable',
        'bear_market_performance': 'Must be profitable OR flat',
        'choppy_performance': 'Must be profitable OR flat',
        'consistency': '>70% of regimes profitable',
    },

    # Step 4: Walk-forward validation
    'walk_forward': {
        'enabled': True,
        'train_period': '12 months',
        'test_period': '3 months',
        'min_consistency': '>70% periods profitable',
    },

    # Step 5: Forward validation
    'forward': {
        'enabled': True,
        'forward_period': '6 months minimum',
        'degradation_limit': '<30% from in-sample',
    },
}
```

### Edge Assessment

```python
edge_assessment = {
    # Edge quality
    'quality_metrics': {
        'expectancy': '> 0.15R is excellent',
        'sharpe': '> 2.0 is excellent',
        'consistency': '<30% std dev is excellent',
    },

    # Edge durability
    'durability_metrics': {
        'walk_forward_pass': '>70% periods pass',
        'forward_test_pass': '<30% degradation',
        'regime_stability': 'Works in 2+ regimes',
    },

    # Edge uniqueness
    'uniqueness_metrics': {
        'not_market_return': 'Exceeds buy & hold',
        'not_random': 'Better than random entries',
        'pattern_specific': 'Edge from pattern, not beta',
    },

    # Overall assessment
    'overall_edge': {
        'strong_edge': 'Exceeds all thresholds',
        'moderate_edge': 'Meets most thresholds',
        'weak_edge': 'Barely passes',
        'no_edge': 'Fails validation',
    },
}
```

---

## Archon Integration

### Knowledge Structure in Archon

```
ARCHON KNOWLEDGE BASE
├── SCANNER PATTERNS
│   ├── V31 Architecture (7 principles)
│   ├── Pattern Types (DMR, FBO, Extension, etc.)
│   ├── Code Structure Guide
│   └── Scanner Examples
│
├── EXECUTION PATTERNS
│   ├── Entry Types (scanner, custom, hybrid)
│   ├── Position Sizing (4 methods)
│   ├── Stop Management (initial, breakeven, trailing)
│   ├── Target Management (R-based, partial)
│   ├── Pyramiding Rules
│   ├── Capital Recycling
│   └── Retry Rules
│
├── BACKTESTING PATTERNS
│   ├── Data Input Modes (4 types)
│   ├── Execution Engine Patterns
│   ├── Performance Metrics
│   ├── Validation Framework
│   └── Common Pitfalls
│
├── TRADING KNOWLEDGE
│   ├── Mean Reversion Principles
│   ├── Market Regimes
│   ├── Edge Assessment
│   ├── Risk Management
│   └── Position Management
│
├── PAST PROJECTS
│   ├── Scanners Built (with results)
│   ├── Backtests Run (with metrics)
│   ├── What Worked (patterns, parameters)
│   └── What Didn't (failures, lessons)
│
└── CONVERSATIONS
    ├── Chat History
    ├── User Preferences
    ├── Strategy Iterations
    └── Decisions Made
```

### Agent Workflow with Archon

```python
# Agent retrieves relevant knowledge before generating code

# Step 1: User describes strategy
user_input = "I want to fade gap ups with pyramiding and trailing stops"

# Step 2: Agent queries Archon for relevant knowledge
archon_query = {
    'scanner_patterns': ['gap_fade', 'mean_reversion'],
    'execution_patterns': ['pyramiding', 'trailing_stops'],
    'past_projects': 'gap_fade strategies with results',
    'trading_knowledge': ['mean_reversion', 'edge_validation'],
}

retrieved_knowledge = archon_client.search(archon_query)

# Step 3: Agent generates strategy based on retrieved knowledge
strategy_def = agent.generate_strategy(user_input, retrieved_knowledge)

# Step 4: Agent generates code based on patterns in knowledge
code = agent.generate_code(strategy_def, retrieved_knowledge)

# Step 5: Results stored back in Archon
archon_client.store_project({
    'strategy': strategy_def,
    'code': code,
    'backtest_results': results,
    'conversation_id': current_chat,
})

# Step 6: Agent learns from results
archon_client.store_learning({
    'what_worked': 'Pyramiding added 0.3R expectancy',
    'what_didnt': 'Trailing stops reduced win rate',
    'user_feedback': user_feedback,
})
```

### Growing Knowledge Base

```
AGENT IMPROVES OVER TIME

Day 1:
├── Limited knowledge
├── Generates decent code
└── Stores results in Archon

Day 30:
├── 30 projects stored
├── Knows what patterns work
├── Knows what parameters work
└── Generates better code

Day 90:
├── 90 projects stored
├── Knows user preferences
├── Knows market conditions
├── Has proven patterns
└── Generates excellent code

The agent doesn't just follow templates.
It learns from experience stored in Archon.
```

---

## Summary: What Makes This Different

### Traditional Approach
```
User → Templates → Code → Test
│      └────────────┘
│
Pre-built patterns, rigid, no learning
```

### Our Approach (Archon-Powered)
```
User → Archon Agent → Code → Test
│         ↓                    ↓
│    All Knowledge         Store
│    + Past Projects       Results
│    + Conversations       Back
│    + What Works          Into
│    + What Doesn't       Archon
│                         (Learning)
```

### Key Difference

**Traditional**: Agent follows rules
**Ours**: Agent learns from experience

---

## Complete Checklist

### Strategy Definition
- [ ] Entry logic (scanner, custom, or hybrid)
- [ ] Position sizing (choose method)
- [ ] Pyramiding rules (if enabled)
- [ ] Stop management (all types)
- [ ] Target management (all types)
- [ ] Retry rules (if enabled)
- [ ] Capital management (recycling)
- [ ] Risk management (portfolio level)
- [ ] Data input mode (4 options)

### Execution Engine
- [ ] Data loader (all 4 modes)
- [ ] Signal generator
- [ ] Position manager
- [ ] Stop manager
- [ ] Pyramid manager
- [ ] Capital manager
- [ ] Risk manager
- [ ] Retry manager

### Performance Analysis
- [ ] Trade-level metrics (all)
- [ ] Component analysis (what adds value)
- [ ] Regime analysis
- [ ] Edge validation

### Archon Integration
- [ ] Knowledge retrieval
- [ ] Pattern matching
- [ ] Past project reference
- [ ] Result storage
- [ ] Learning loop

---

**Document Status**: COMPLETE
**Version**: 2.0
**Last Updated**: 2026-01-29
**Key Feature**: Archon-Powered with Learning & Memory
