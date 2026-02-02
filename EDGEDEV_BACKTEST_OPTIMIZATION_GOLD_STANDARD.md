# EdgeDev Backtesting & Optimization Gold Standard
**Complete Framework for Strategy Validation**

**Version**: 1.0
**Date**: 2026-01-29
**Status**: COMPLETE - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Backtest Types](#backtest-types)
3. [Parameter Optimization](#parameter-optimization)
4. [Walk-Forward Testing](#walk-forward-testing)
5. [Forward Testing & Paper Trading](#forward-testing--paper-trading)
6. [Overfitting Prevention](#overfitting-prevention)
7. [Out-of-Sample Testing](#out-of-sample-testing)
8. [Regime Analysis](#regime-analysis)
9. [Monte Carlo Simulation](#monte-carlo-simulation)
10. [Performance Metrics](#performance-metrics)
11. [Validation Workflow](#validation-workflow)

---

## Overview

### The Validation Pyramid

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VALIDATION PYRAMID                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    ▲▲▲                                                   │
│                   ▲ PRODUCTION                                         │
│                  ▲ Forward Testing (Paper Trading)                     │
│                 ▲                                                      │
│                ▲ Walk-Forward Testing                                   │
│               ▼                                                        │
│              ▼ Out-of-Sample Testing                                    │
│             ▼                                                           │
│            ▼ In-Sample Backtesting                                     │
│           ▼                                                             │
│          ▼▼▼                                                           │
│                                                                         │
│  Each level validates the strategy is robust before moving up.         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **No Single Metric**: Never rely on one metric (e.g., just win rate or total return)
2. **Out-of-Sample Validation**: Always test on unseen data
3. **Regime Awareness**: Understand performance in different market conditions
4. **Overfitting Detection**: Watch for too many parameters, curve fitting
5. **Realistic Assumptions**: Slippage, commissions, partial fills

---

## Backtest Types

### Type 1: Simple P&L Simulation (Quick Validation)

**Purpose**: Fast validation of setup quality
**Execution Time**: 1-5 seconds
**Data Required**: Daily OHLCV only

**When to Use**:
- Initial pattern validation
- Quick parameter checks
- A+ example verification

**Code Structure**:
```python
class SimpleBacktest:
    """Fast daily-bar backtest for initial validation"""

    def __init__(self, config):
        self.risk_per_trade_r = 1.0  # 1R risk
        self.commission_per_share = 0.005
        self.start_capital = 100000

    def run_backtest(self, scan_results):
        """
        Simple P&L calculation using daily bars only.

        Entry: Close on signal day (D0)
        Exit: Next day open (D+1)
        """
        trades = []

        for signal in scan_results:
            entry_price = signal['close']  # Enter at D0 close
            exit_price = signal['next_open']  # Exit at D+1 open

            # Calculate P&L
            if signal['direction'] == 'SHORT':
                pnl = (entry_price - exit_price) / entry_price
            else:
                pnl = (exit_price - entry_price) / entry_price

            r_multiple = pnl / self.risk_per_trade_r

            trades.append({
                'ticker': signal['ticker'],
                'date': signal['date'],
                'entry': entry_price,
                'exit': exit_price,
                'pnl_pct': pnl * 100,
                'r_multiple': r_multiple
            })

        return self._calculate_metrics(trades)

    def _calculate_metrics(self, trades):
        """Calculate standard backtest metrics"""
        df = pd.DataFrame(trades)

        winners = df[df['r_multiple'] > 0]
        losers = df[df['r_multiple'] <= 0]

        return {
            'total_trades': len(df),
            'win_rate': len(winners) / len(df) if df else 0,
            'avg_win': winners['r_multiple'].mean() if len(winners) > 0 else 0,
            'avg_loss': losers['r_multiple'].mean() if len(losers) > 0 else 0,
            'total_r': df['r_multiple'].sum(),
            'expectancy': df['r_multiple'].mean(),
            'max_drawdown_r': self._calculate_max_dd(df['r_multiple']),
        }
```

**Limitations**:
- No intraday exit logic
- No stops/targets
- Unrealistic execution (close/open)
- **NOT for production decisions**

---

### Type 2: Enhanced Intraday Backtest (Production Quality)

**Purpose**: Realistic simulation with intraday exits
**Execution Time**: 30-120 seconds (depends on API calls)
**Data Required**: Daily OHLCV + Intraday minute bars

**When to Use**:
- Production validation
- Parameter optimization
- Strategy comparison

**Code Structure**:
```python
class EnhancedBacktest:
    """Production backtest with realistic intraday execution"""

    def __init__(self, config):
        self.api_key = config['polygon_api_key']
        self.risk_per_trade_dollars = 1000
        self.commission_per_share = 0.005

        # Exit strategy parameters
        self.profit_target_atr = 2.0
        self.stop_loss_atr = 0.8
        self.trailing_stop_atr = 0.5
        self.time_exit_minutes = 240
        self.volume_exit_threshold = 0.3

    def run_backtest(self, scan_results):
        """
        Realistic backtest using intraday data.

        For each signal:
        1. Fetch intraday minute bars
        2. Calculate entry price (first 30 min logic)
        3. Simulate exits (stop, target, trailing, time, volume)
        4. Calculate realistic P&L with commissions
        """
        all_trades = []

        for signal in scan_results:
            # Fetch intraday data
            intraday_data = self._fetch_intraday(
                signal['ticker'],
                signal['date']
            )

            if not intraday_data:
                continue

            # Simulate trade
            trade_result = self._simulate_trade(
                signal=signal,
                intraday_data=intraday_data
            )

            if trade_result:
                all_trades.append(trade_result)

        return self._calculate_comprehensive_metrics(all_trades)

    def _simulate_trade(self, signal, intraday_data):
        """Simulate single trade with realistic exits"""
        # Entry logic (first 30 minutes)
        entry = self._calculate_entry(signal, intraday_data)

        # Position sizing
        atr = signal['atr']
        risk_amount = atr * self.stop_loss_atr
        shares = int(self.risk_per_trade_dollars / risk_amount)

        # Calculate exit levels
        profit_target = entry['price'] + (atr * self.profit_target_atr)
        stop_loss = entry['price'] - (atr * self.stop_loss_atr)
        trailing_stop = entry['price'] - (atr * self.trailing_stop_atr)

        # Simulate through the day
        highest_price = entry['price']

        for bar in intraday_data[entry['bar_index']+1:]:
            # Update trailing stop
            if bar['high'] > highest_price:
                highest_price = bar['high']
                trailing_stop = highest_price - (atr * self.trailing_stop_atr)

            # Check exits (in priority order)
            if bar['low'] <= stop_loss:
                exit_price = stop_loss
                exit_reason = 'Stop Loss'
                break
            elif bar['high'] >= profit_target:
                exit_price = profit_target
                exit_reason = 'Profit Target'
                break
            elif bar['low'] <= trailing_stop:
                exit_price = trailing_stop
                exit_reason = 'Trailing Stop'
                break
            elif self._time_exit_triggered(entry, bar):
                exit_price = bar['close']
                exit_reason = 'Time Exit'
                break
            elif self._volume_exit_triggered(entry, bar):
                exit_price = bar['close']
                exit_reason = 'Volume Exit'
                break
        else:
            # EOD exit
            exit_price = intraday_data[-1]['close']
            exit_reason = 'End of Day'

        # Calculate P&L
        gross_pnl = (exit_price - entry['price']) * shares
        commission = shares * self.commission_per_share * 2  # Round trip
        net_pnl = gross_pnl - commission

        r_multiple = net_pnl / self.risk_per_trade_dollars

        return {
            'ticker': signal['ticker'],
            'date': signal['date'],
            'entry_price': entry['price'],
            'entry_time': entry['time'],
            'exit_price': exit_price,
            'exit_time': bar['datetime'],
            'exit_reason': exit_reason,
            'shares': shares,
            'gross_pnl': gross_pnl,
            'commission': commission,
            'net_pnl': net_pnl,
            'r_multiple': r_multiple,
            'holding_minutes': (bar['datetime'] - entry['time']).total_seconds() / 60,
            'highest_price': highest_price,
            'atr': atr
        }
```

**Key Features**:
- Realistic entry logic (first 30 min)
- Multiple exit strategies
- Position sizing based on volatility
- Commission calculations
- Partial fills (optional)
- Slippage modeling (optional)

---

## Parameter Optimization

### Goal

Find parameters that maximize edge while minimizing overfitting.

### Optimization Methods

#### Method 1: Grid Search (Exhaustive)

**Best for**: Small parameter spaces (2-4 parameters)

```python
class GridSearchOptimizer:
    """Exhaustive grid search over parameter space"""

    def __init__(self, scanner, backtest):
        self.scanner = scanner
        self.backtest = backtest

    def optimize(self, param_grid, train_start, train_end, validation_start, validation_end):
        """
        Grid search over all parameter combinations.

        param_grid example:
        {
            'min_gap': [0.02, 0.025, 0.03, 0.035, 0.04],
            'max_hold_range': [0.0025, 0.003, 0.0035, 0.004],
            'min_volume_ratio': [1.5, 2.0, 2.5]
        }
        """
        # Generate all combinations
        import itertools
        param_names = list(param_grid.keys())
        param_values = list(param_grid.values())
        all_combinations = list(itertools.product(*param_values))

        results = []

        for i, combination in enumerate(all_combinations):
            # Create param dict
            params = dict(zip(param_names, combination))

            print(f"Testing {i+1}/{len(all_combinations)}: {params}")

            # Update scanner params
            self.scanner.params.update(params)

            # Run scan on training data
            train_signals = self.scanner.run_scan(train_start, train_end)

            if len(train_signals) < 10:
                # Too few signals, skip
                continue

            # Run backtest
            train_results = self.backtest.run_backtest(train_signals)

            # Run validation
            val_signals = self.scanner.run_scan(validation_start, validation_end)
            val_results = self.backtest.run_backtest(val_signals)

            results.append({
                'params': params,
                'train_metrics': train_results,
                'val_metrics': val_results,
                'overfit_score': self._calculate_overfit_score(train_results, val_results)
            })

        # Sort by validation performance
        results.sort(key=lambda x: x['val_metrics']['expectancy'], reverse=True)

        return results
```

#### Method 2: Random Search (Efficient)

**Best for**: Larger parameter spaces (5+ parameters)

```python
class RandomSearchOptimizer:
    """Random search over parameter space"""

    def optimize(self, param_bounds, n_iterations=50, train_start, train_end):
        """
        Randomly sample parameter space.

        param_bounds example:
        {
            'min_gap': (0.02, 0.05),  # (min, max)
            'max_hold_range': (0.002, 0.005),
            'min_volume_ratio': (1.0, 3.0)
        }
        """
        results = []

        for i in range(n_iterations):
            # Random sample
            params = {
                k: np.random.uniform(v[0], v[1])
                for k, v in param_bounds.items()
            }

            # Test parameters
            # ... (same as grid search)

            results.append({
                'params': params,
                'metrics': metrics
            })

        return sorted(results, key=lambda x: x['metrics']['expectancy'], reverse=True)
```

#### Method 3: Bayesian Optimization (Smart)

**Best for**: Expensive-to-evaluate functions

```python
class BayesianOptimizer:
    """Bayesian optimization using Gaussian Process"""

    def optimize(self, param_bounds, n_iterations=30):
        """
        Use previous results to guide next parameter choice.
        More efficient than random/grid search.
        """
        # Requires scikit-optimize or similar library
        from skopt import gp_minimize

        # Define objective function
        def objective(params_list):
            params = dict(zip(param_bounds.keys(), params_list))

            # Run backtest
            metrics = self._test_params(params)

            # Minimize negative expectancy
            return -metrics['expectancy']

        # Run optimization
        result = gp_minimize(
            objective,
            dimensions=[list(v) for v in param_bounds.values()],
            n_calls=n_iterations,
            random_state=42
        )

        return {
            'best_params': dict(zip(param_bounds.keys(), result.x)),
            'best_expectancy': -result.fun
        }
```

### Optimization Best Practices

1. **Train/Validation Split**:
   - Train: 70% of data (for optimization)
   - Validation: 30% of data (for selection)

2. **Parameter Ranges**:
   - Use realistic ranges based on A+ examples
   - Don't search too wide (waste of time)
   - Don't search too narrow (miss optimal)

3. **Minimum Signals**:
   - Require at least 30-50 signals in training
   - Too few = unreliable statistics

4. **Multiple Metrics**:
   - Optimize for expectancy (primary)
   - Consider win rate, max DD, Sharpe (secondary)

5. **Overfitting Detection**:
   - Compare train vs validation performance
   - Large gap = overfitting

---

## Walk-Forward Testing

### What Is Walk-Forward?

Rolling window validation that simulates real-time trading:
- Train on period 1
- Test on period 2
- Roll forward and repeat

### Why Walk-Forward?

- **Realistic**: Simulates actual trading process
- **Adaptive**: Parameters adapt over time
- **Robust**: Tests stability across periods

### Walk-Forward Implementation

```python
class WalkForwardValidator:
    """Rolling window validation for strategy robustness"""

    def __init__(self, scanner, backtest, optimizer):
        self.scanner = scanner
        self.backtest = backtest
        self.optimizer = optimizer

    def run_walk_forward(
        self,
        full_start,
        full_end,
        train_period_months=12,
        test_period_months=3,
        step_months=3
    ):
        """
        Walk-forward validation.

        Example:
        - Train: Jan 2022 - Dec 2022 (12 months)
        - Test: Jan 2023 - Mar 2023 (3 months)
        - Step forward 3 months
        - Repeat

        This simulates:
        1. Optimize on past 12 months
        2. Trade next 3 months with those params
        3. Re-optimize on most recent 12 months
        4. Trade next 3 months
        """
        results = []

        current_date = pd.to_datetime(full_start)

        while True:
            # Define train period
            train_start = current_date
            train_end = current_date + pd.DateOffset(months=train_period_months)

            # Define test period
            test_start = train_end
            test_end = test_start + pd.DateOffset(months=test_period_months)

            # Check if we've gone past full_end
            if test_end > pd.to_datetime(full_end):
                break

            print(f"\n{'='*60}")
            print(f"Train: {train_start.date()} to {train_end.date()}")
            print(f"Test:  {test_start.date()} to {test_end.date()}")
            print(f"{'='*60}\n")

            # Optimize on training period
            print("Optimizing parameters...")
            best_params = self.optimizer.optimize(
                train_start=train_start.strftime('%Y-%m-%d'),
                train_end=train_end.strftime('%Y-%m-%d'),
                validation_start=test_start.strftime('%Y-%m-%d'),
                validation_end=test_end.strftime('%Y-%m-%d')
            )[0]['params']

            print(f"Best params: {best_params}")

            # Apply to test period
            self.scanner.params.update(best_params)
            test_signals = self.scanner.run_scan(
                test_start.strftime('%Y-%m-%d'),
                test_end.strftime('%Y-%m-%d')
            )

            # Backtest test period
            test_results = self.backtest.run_backtest(test_signals)

            results.append({
                'train_start': train_start,
                'train_end': train_end,
                'test_start': test_start,
                'test_end': test_end,
                'params': best_params,
                'test_signals': len(test_signals),
                'test_metrics': test_results
            })

            # Step forward
            current_date = current_date + pd.DateOffset(months=step_months)

        # Analyze walk-forward results
        return self._analyze_walk_forward(results)

    def _analyze_walk_forward(self, results):
        """Analyze walk-forward performance"""

        # Aggregate metrics
        total_trades = sum(r['test_signals'] for r in results)
        avg_expectancy = np.mean([r['test_metrics']['expectancy'] for r in results])
        expectancy_std = np.std([r['test_metrics']['expectancy'] for r in results])

        # Consistency check
        profitable_periods = sum(
            1 for r in results
            if r['test_metrics']['expectancy'] > 0
        )
        consistency_pct = profitable_periods / len(results) * 100

        # Parameter stability
        param_stability = self._check_param_stability(results)

        return {
            'total_periods': len(results),
            'total_trades': total_trades,
            'avg_trades_per_period': total_trades / len(results),
            'avg_expectancy': avg_expectancy,
            'expectancy_std': expectancy_std,
            'expectancy_std_pct': (expectancy_std / abs(avg_expectancy) * 100) if avg_expectancy != 0 else float('inf'),
            'profitable_periods': profitable_periods,
            'consistency_pct': consistency_pct,
            'param_stability': param_stability,
            'period_results': results
        }
```

### Walk-Forward Success Criteria

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| **Consistency** | >70% periods profitable | 50-70% | <50% |
| **Expectancy Std** | <50% of mean | 50-100% | >100% |
| **Parameter Stability** | Stable across periods | Some drift | Highly variable |
| **Signals/Period** | 20-100 | 10-20 or 100-200 | <10 or >200 |

---

## Forward Testing & Paper Trading

### What Is Forward Testing?

Testing the final strategy on NEW data (after all optimization is done).

### Forward Testing Workflow

```python
class ForwardTester:
    """Paper trading on new, unseen data"""

    def __init__(self, scanner, backtest, final_params):
        self.scanner = scanner
        self.backtest = backtest
        self.final_params = final_params

    def run_forward_test(self, start_date, min_trades=30):
        """
        Run on new data starting from start_date.

        CRITICAL: This data must NOT have been used in:
        - Scanner development
        - Parameter optimization
        - Walk-forward testing

        It must be truly new, forward data.
        """
        # Apply final parameters
        self.scanner.params.update(self.final_params)

        # Run scan on forward period
        signals = self.scanner.run_scan(start_date, datetime.now().strftime('%Y-%m-%d'))

        if len(signals) < min_trades:
            print(f"⚠️  Warning: Only {len(signals)} signals in forward test")
            print(f"Recommend waiting for at least {min_trades} signals")

        # Run backtest
        results = self.backtest.run_backtest(signals)

        # Compare to in-sample expectations
        comparison = self._compare_to_in_sample(results)

        return {
            'forward_results': results,
            'comparison_to_expected': comparison,
            'passed': comparison['is_acceptable'],
            'recommendation': self._generate_recommendation(comparison)
        }

    def _compare_to_in_sample(self, forward_results):
        """Compare forward results to in-sample expectations"""

        # These would be stored from optimization/walk-forward
        expected_expectancy = 0.15  # Example
        expected_win_rate = 0.60    # Example

        # Calculate acceptable ranges (±20%)
        expectancy_range = (expected_expectancy * 0.8, expected_expectancy * 1.2)
        win_rate_range = (expected_win_rate * 0.8, expected_win_rate * 1.2)

        forward_expectancy = forward_results['expectancy']
        forward_win_rate = forward_results['win_rate']

        # Check if within range
        expectancy_ok = expectancy_range[0] <= forward_expectancy <= expectancy_range[1]
        win_rate_ok = win_rate_range[0] <= forward_win_rate <= win_rate_range[1]

        return {
            'expected_expectancy': expected_expectancy,
            'forward_expectancy': forward_expectancy,
            'expectancy_diff_pct': ((forward_expectancy - expected_expectancy) / expected_expectancy * 100),
            'expectancy_ok': expectancy_ok,
            'expected_win_rate': expected_win_rate,
            'forward_win_rate': forward_win_rate,
            'win_rate_diff_pct': ((forward_win_rate - expected_win_rate) / expected_win_rate * 100),
            'win_rate_ok': win_rate_ok,
            'is_acceptable': expectancy_ok and win_rate_ok
        }
```

### Forward Testing Success Criteria

1. **Performance within 20% of expected** (expectancy, win rate)
2. **At least 30 trades** (statistical significance)
3. **No regime change detected** (market structure similar)

### Paper Trading (Live Simulation)

Before real money, do paper trading:

```python
class PaperTrader:
    """Simulated live trading without real money"""

    def __init__(self, scanner, final_params, execution_platform):
        self.scanner = scanner
        self.final_params = final_params
        self.execution = execution_platform  # Simulated execution
        self.positions = {}

    def run_paper_trading(self, duration_days=30):
        """
        Run paper trading for specified duration.

        This is the final test before real money.
        Simulates:
        - Daily signal generation
        - Order placement (simulated)
        - Position management
        - P&L tracking
        """
        start_date = datetime.now()
        end_date = start_date + timedelta(days=duration_days)

        while datetime.now() < end_date:
            # Run daily scan
            signals = self.scanner.run_scan(
                datetime.now().strftime('%Y-%m-%d'),
                datetime.now().strftime('%Y-%m-%d')
            )

            # Execute signals (simulated)
            for signal in signals:
                self._execute_signal(signal)

            # Manage existing positions
            self._manage_positions()

            # Wait until next trading day
            self._wait_until_next_trading_day()

        # Calculate paper trading results
        return self._calculate_paper_results()
```

---

## Overfitting Prevention

### What Is Overfitting?

When a strategy performs well on historical data but fails in live trading because it's too closely fitted to past data patterns.

### Overfitting Detection Methods

#### Method 1: Train/Validation Gap

```python
def detect_overfitting_gap(train_metrics, val_metrics):
    """Check if validation performance is much worse than training"""

    train_expectancy = train_metrics['expectancy']
    val_expectancy = val_metrics['expectancy']

    # Calculate gap
    gap_pct = ((train_expectancy - val_expectancy) / train_expectancy) * 100

    if gap_pct > 50:
        return {
            'overfit_detected': True,
            'severity': 'HIGH',
            'gap_pct': gap_pct,
            'message': f'Validation expectancy {gap_pct:.1f}% worse than training'
        }
    elif gap_pct > 25:
        return {
            'overfit_detected': True,
            'severity': 'MEDIUM',
            'gap_pct': gap_pct,
            'message': f'Validation expectancy {gap_pct:.1f}% worse than training'
        }
    else:
        return {
            'overfit_detected': False,
            'severity': 'NONE',
            'gap_pct': gap_pct
        }
```

#### Method 2: Parameter Count vs Signal Count

```python
def detect_overfitting_params(n_params, n_signals):
    """Check if too many parameters for too few signals"""

    # Rule of thumb: At least 10 signals per parameter
    min_signals = n_params * 10

    if n_signals < min_signals:
        return {
            'overfit_detected': True,
            'reason': f'Too few signals ({n_signals}) for {n_params} parameters',
            'recommendation': f'Need at least {min_signals} signals'
        }
    else:
        return {
            'overfit_detected': False
        }
```

#### Method 3: Holdout Test

```python
def detect_overfitting_holdout(scanner, backtest, params):
    """Test on completely unseen holdout period"""

    # Train on 2019-2022
    train_results = backtest.run_backtest(
        scanner.run_scan('2019-01-01', '2022-12-31', params)
    )

    # Holdout: 2023-2024 (completely unseen)
    holdout_results = backtest.run_backtest(
        scanner.run_scan('2023-01-01', '2024-12-31', params)
    )

    # Compare
    train_expectancy = train_results['expectancy']
    holdout_expectancy = holdout_results['expectancy']
    degradation = ((train_expectancy - holdout_expectancy) / train_expectancy) * 100

    if degradation > 40:
        return {
            'overfit_detected': True,
            'degradation_pct': degradation,
            'message': f'Expectancy degraded by {degradation:.1f}% on holdout'
        }
    else:
        return {
            'overfit_detected': False
        }
```

### Overfitting Prevention Rules

1. **Limit Parameters**: Start with 3-5 parameters maximum
2. **Minimum Signals**: 50+ signals in training, 30+ in validation
3. **Train/Validation Split**: Always use separate datasets
4. **Walk-Forward**: Test across multiple time periods
5. **Simpler is Better**: Prefer simple models over complex ones

---

## Out-of-Sample Testing

### Data Split Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA SPLIT STRATEGY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Total Data: 2019-2024 (6 years)                                        │
│                                                                         │
│  ┌────────────────┬────────────────┬─────────────────┐                 │
│  │   TRAINING     │   VALIDATION   │   FORWARD TEST  │                 │
│  │   (In-Sample)  │   (Out-Sample) │   (Out-Sample)  │                 │
│  ├────────────────┼────────────────┼─────────────────┤                 │
│  │ 2019-2021 (3y) │ 2022 (1 year)  │ 2023-2024 (2y)  │                 │
│  │   60%          │     20%        │      20%        │                 │
│  └────────────────┴────────────────┴─────────────────┘                 │
│                                                                         │
│  Training:   Optimize parameters                                        │
│  Validation: Select best parameters (unseen during training)            │
│  Forward:    Final test (unseen during training AND validation)        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Out-of-Sample Implementation

```python
class OutOfSampleValidator:
    """Proper train/validation/forward split"""

    def __init__(self, scanner, backtest, full_start, full_end):
        self.scanner = scanner
        self.backtest = backtest

        # Calculate splits
        total_days = (pd.to_datetime(full_end) - pd.to_datetime(full_start)).days
        train_days = int(total_days * 0.6)
        val_days = int(total_days * 0.2)

        self.train_start = full_start
        self.train_end = (pd.to_datetime(full_start) + timedelta(days=train_days)).strftime('%Y-%m-%d')
        self.val_start = self.train_end
        self.val_end = (pd.to_datetime(self.val_start) + timedelta(days=val_days)).strftime('%Y-%m-%d')
        self.forward_start = self.val_end
        self.forward_end = full_end

    def run_validation(self, param_grid):
        """Full out-of-sample validation"""

        print(f"Training period:   {self.train_start} to {self.train_end}")
        print(f"Validation period: {self.val_start} to {self.val_end}")
        print(f"Forward period:   {self.forward_start} to {self.forward_end}")

        # Phase 1: Optimize on training data
        print("\n=== PHASE 1: OPTIMIZATION (Training) ===")
        optimizer = GridSearchOptimizer(self.scanner, self.backtest)
        optimization_results = optimizer.optimize(
            param_grid,
            self.train_start, self.train_end,
            self.val_start, self.val_end
        )

        # Phase 2: Select best params on validation
        print("\n=== PHASE 2: SELECTION (Validation) ===")
        best_params = optimization_results[0]['params']
        val_metrics = optimization_results[0]['val_metrics']

        print(f"Best params: {best_params}")
        print(f"Validation expectancy: {val_metrics['expectancy']:.3f}")

        # Phase 3: Forward test
        print("\n=== PHASE 3: FORWARD TEST (Out-of-Sample) ===")
        self.scanner.params.update(best_params)
        forward_signals = self.scanner.run_scan(self.forward_start, self.forward_end)
        forward_results = self.backtest.run_backtest(forward_signals)

        print(f"Forward expectancy: {forward_results['expectancy']:.3f}")

        # Compare
        train_expectancy = optimization_results[0]['train_metrics']['expectancy']
        val_expectancy = val_metrics['expectancy']
        forward_expectancy = forward_results['expectancy']

        # Check degradation
        train_to_val = ((train_expectancy - val_expectancy) / train_expectancy) * 100
        val_to_forward = ((val_expectancy - forward_expectancy) / val_expectancy) * 100

        return {
            'best_params': best_params,
            'train_expectancy': train_expectancy,
            'val_expectancy': val_expectancy,
            'forward_expectancy': forward_expectancy,
            'train_to_val_degradation': train_to_val,
            'val_to_forward_degradation': val_to_forward,
            'passed': abs(val_to_forward) < 30,  # Less than 30% degradation
            'recommendation': self._generate_recommendation(val_to_forward)
        }
```

---

## Regime Analysis

### What Are Market Regimes?

Distinct market conditions that affect strategy performance:
- **Bull**: Rising markets (SPY +10%+ over 3 months)
- **Bear**: Falling markets (SPY -10%+ over 3 months)
- **Choppy**: Range-bound (SPY ±5% over 3 months)
- **High Volatility**: VIX > 25
- **Low Volatility**: VIX < 15

### Regime Detection

```python
class RegimeDetector:
    """Detect market regime for given date"""

    def __init__(self, market_data):
        """
        market_data: DataFrame with SPY and VIX data
        """
        self.market_data = market_data

    def get_regime(self, date):
        """Determine market regime on given date"""

        # Get SPY performance over last 3 months
        spy_3mo_change = self._get_spy_change(date, months=3)

        # Get VIX level
        vix = self._get_vix(date)

        # Classify regime
        if spy_3mo_change > 0.10:
            trend = 'BULL'
        elif spy_3mo_change < -0.10:
            trend = 'BEAR'
        else:
            trend = 'CHOPPY'

        if vix > 25:
            volatility = 'HIGH_VOL'
        elif vix < 15:
            volatility = 'LOW_VOL'
        else:
            volatility = 'NORMAL_VOL'

        return f"{trend}_{volatility}"

    def analyze_strategy_by_regime(self, trades):
        """Analyze strategy performance across regimes"""

        trades_df = pd.DataFrame(trades)

        # Add regime to each trade
        trades_df['regime'] = trades_df['date'].apply(self.get_regime)

        # Group by regime
        regime_stats = trades_df.groupby('regime').agg({
            'r_multiple': ['count', 'mean', 'sum'],
            'ticker': 'count'
        }).round(3)

        return regime_stats
```

### Regime-Based Strategy Adjustment

```python
class RegimeAwareStrategy:
    """Adjust strategy based on market regime"""

    def __init__(self, base_params):
        self.base_params = base_params

        # Regime-specific adjustments
        self.regime_adjustments = {
            'BULL_NORMAL_VOL': {
                'position_sizing_multiplier': 0.8,  # Reduce size in bull markets
                'expectancy_reduction': 0.2         # Expect lower expectancy
            },
            'BEAR_NORMAL_VOL': {
                'position_sizing_multiplier': 1.2,  # Increase size in bear markets
                'expectancy_reduction': 0           # Normal expectancy
            },
            'BEAR_HIGH_VOL': {
                'position_sizing_multiplier': 1.5,  # Max size in bear+high vol
                'expectancy_reduction': -0.1        # Expect higher expectancy
            },
            'CHOPPY_NORMAL_VOL': {
                'position_sizing_multiplier': 0.5,  # Reduce size in choppy
                'expectancy_reduction': 0.3         # Expect much lower expectancy
            }
        }

    def get_params_for_regime(self, current_regime):
        """Get parameters adjusted for current regime"""

        if current_regime in self.regime_adjustments:
            adjustment = self.regime_adjustments[current_regime]
            return {
                **self.base_params,
                'position_sizing': self.base_params['position_sizing'] * adjustment['position_sizing_multiplier']
            }
        else:
            return self.base_params
```

---

## Monte Carlo Simulation

### What Is Monte Carlo?

Randomly resampling trades to test strategy robustness and estimate confidence intervals.

### Monte Carlo Implementation

```python
class MonteCarloSimulator:
    """Monte Carlo simulation for strategy validation"""

    def __init__(self, backtest_results, n_simulations=1000):
        self.results = backtest_results
        self.n_simulations = n_simulations
        self.trades = backtest_results['trades']

    def run_simulation(self):
        """Run Monte Carlo simulation"""

        simulation_results = []

        for i in range(self.n_simulations):
            # Resample trades with replacement
            resampled = self.trades.sample(n=len(self.trades), replace=True)

            # Calculate cumulative equity curve
            equity = resampled['r_multiple'].cumsum()

            simulation_results.append({
                'final_equity_r': equity.iloc[-1],
                'max_drawdown_r': self._calculate_max_dd(equity),
                'sharpe_ratio': self._calculate_sharpe(equity)
            })

        # Analyze simulation results
        df_sim = pd.DataFrame(simulation_results)

        return {
            'mean_final_equity': df_sim['final_equity_r'].mean(),
            'std_final_equity': df_sim['final_equity_r'].std(),
            'percentile_5': df_sim['final_equity_r'].quantile(0.05),
            'percentile_95': df_sim['final_equity_r'].quantile(0.95),
            'mean_max_dd': df_sim['max_drawdown_r'].mean(),
            'worst_case_dd': df_sim['max_drawdown_r'].min(),
            'probability_profit': (df_sim['final_equity_r'] > 0).sum() / self.n_simulations
        }

    def _calculate_max_dd(self, equity_curve):
        """Calculate max drawdown from equity curve"""
        cummax = equity_curve.cummax()
        drawdown = equity_curve - cummax
        return drawdown.min()
```

### Monte Carlo Interpretation

| Metric | Good | Acceptable | Bad |
|--------|------|------------|-----|
| **Probability of Profit** | >95% | 90-95% | <90% |
| **5th Percentile** | >0 | -5R to 0 | <-5R |
| **Worst Case DD** | <20R | 20-30R | >30R |

---

## Performance Metrics

### Required Metrics (Minimum)

```python
REQUIRED_METRICS = {
    # Trade count
    'total_trades': 'Total number of trades',
    'avg_trades_per_month': 'Frequency of signals',

    # Win/Loss stats
    'win_rate': 'Percentage of winning trades',
    'avg_win_r': 'Average win in R-multiples',
    'avg_loss_r': 'Average loss in R-multiples',
    'win_loss_ratio': 'Avg win / Avg loss (absolute)',

    # Profitability
    'total_return_r': 'Total profit in R-multiples',
    'expectancy': 'Average R per trade',
    'profit_factor': 'Sum wins / Sum losses (absolute)',

    # Risk
    'max_drawdown_r': 'Maximum peak-to-trough decline',
    'max_consecutive_losses': 'Worst losing streak',

    # Efficiency
    'avg_holding_time': 'Average trade duration',
    'sharpe_ratio': 'Return / Volatility ratio',
}
```

### Advanced Metrics (Optional)

```python
ADVANCED_METRICS = {
    # Statistics
    'kelly_criterion': 'Optimal position sizing %',
    'sortino_ratio': 'Return / Downside volatility',
    'calmar_ratio': 'Return / Max drawdown',

    # Stability
    'monthly_win_rate': 'Win rate consistency by month',
    'expectancy_std': 'Std dev of expectancy',
    'regime_performance': 'Performance by market regime',

    # Reliability
    'monte_carlo_p5': '5th percentile equity (worst case)',
    'monte_carlo_p95': '95th percentile equity (best case)',
    'probability_of_profit': '% simulations profitable',
}
```

---

## Validation Workflow

### Complete Workflow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VALIDATION WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: INITIAL VALIDATION (Quick Check)                             │
│  ─────────────────────────────────────────                             │
│  • Run simple backtest on recent 6 months                              │
│  • Check: 20+ signals, expectancy > 0                                  │
│  • If fail: Pattern doesn't work, stop                                 │
│  • If pass: Continue to Phase 2                                        │
│                                                                         │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  PHASE 2: PARAMETER OPTIMIZATION (Train/Val Split)                    │
│  ─────────────────────────────────────────────────                     │
│  • Split data: 60% train, 20% validation, 20% forward                 │
│  • Grid search on training data                                        │
│  • Select best params on validation data                               │
│  • Check: Train/val gap < 25%                                          │
│  • If fail: Overfitting detected, simplify params                     │
│  • If pass: Continue to Phase 3                                        │
│                                                                         │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  PHASE 3: WALK-FORWARD TESTING (Stability Check)                       │
│  ─────────────────────────────────────────────────                     │
│  • 12-month train, 3-month test, roll forward                          │
│  • Check: >70% periods profitable, expectancy std < 50%                │
│  • If fail: Strategy not stable, revise pattern                        │
│  • If pass: Continue to Phase 4                                        │
│                                                                         │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  PHASE 4: FORWARD TESTING (Final Check)                                │
│  ─────────────────────────────────────────                             │
│  • Test on completely new data (forward period)                        │
│  • Check: Performance within 20% of expected                           │
│  • If fail: Regime change or overfitting                              │
│  • If pass: Ready for paper trading                                    │
│                                                                         │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  PHASE 5: PAPER TRADING (Live Simulation)                              │
│  ─────────────────────────────────────────────                         │
│  • Run for 30 days with real-time signals                              │
│  • Check: Performance matches expectations                              │
│  • If fail: Execution issue or regime change                           │
│  • If pass: Ready for live trading (optional)                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Decision Tree

```
                    Simple Backtest
                           │
                  ┌────────┴────────┐
                  │ Expectancy > 0? │
                  └────────┬────────┘
                    NO            YES
                    │             │
              STOP              Optimize
                                 │
                    ┌────────────┴────────────┐
                    │ Train/Val Gap < 25%?    │
                    └────────────┬────────────┘
                      NO            YES
                      │             │
                 Simplify      Walk-Forward
                                 │
                    ┌────────────┴────────────┐
                    │ >70% Periods Profitable?│
                    └────────────┬────────────┘
                      NO            YES
                      │             │
                 Revise      Forward Test
                                 │
                    ┌────────────┴────────────┐
                    │ Within 20% Expected?    │
                    └────────────┬────────────┘
                      NO            YES
                      │             │
                  Investigate   Paper Trading
                                   │
                          ┌────────┴────────┐
                          │ 30 Days Pass?   │
                          └────────┬────────┘
                            NO        YES
                            │         │
                        Debug    Live Trading
```

---

## Summary: Gold Standard Checklist

### Scanner Development
- [ ] Uses V31 architecture (5-stage pipeline)
- [ ] Market calendar integration
- [ ] Per-ticker operations
- [ ] Historical/D0 separation
- [ ] Smart filtering
- [ ] Parallel processing

### Backtesting
- [ ] Simple backtest for quick validation
- [ ] Enhanced backtest with intraday data
- [ ] Realistic execution assumptions
- [ ] Position sizing based on volatility
- [ ] Commission calculations

### Optimization
- [ ] Train/validation/forward split
- [ ] Grid/random search for parameters
- [ ] Overfitting detection
- [ ] Minimum 50 signals in training

### Validation
- [ ] Walk-forward testing (>70% periods profitable)
- [ ] Forward test (within 20% of expected)
- [ ] Monte Carlo simulation (>95% prob of profit)
- [ ] Regime analysis (performance by market type)

### Metrics (Minimum)
- [ ] Total trades, win rate, expectancy
- [ ] Max drawdown, profit factor
- [ ] Avg win/loss, win/loss ratio
- [ ] Sharpe ratio

---

**Document Status**: COMPLETE
**Version**: 1.0
**Last Updated**: 2026-01-29
