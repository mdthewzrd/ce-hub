#!/usr/bin/env python3
"""
Enhanced Backtesting Engine for Edge.dev
- Real intraday data integration for accurate exit strategies
- Advanced position sizing and risk management
- Multiple exit strategy types
- Comprehensive performance analytics
"""

import sys
import json
import pandas as pd
import numpy as np
import time
import concurrent.futures
import warnings
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
warnings.filterwarnings('ignore')

class EnhancedBacktestEngine:
    def __init__(self, config: Dict = None):
        """Initialize enhanced backtesting engine with configuration"""
        self.config = config or {}

        # Risk management parameters
        self.d_risk = self.config.get('risk_per_trade_dollars', 1000)
        self.p_risk = self.config.get('risk_percentage', 0.01)
        self.start_capital = self.config.get('start_capital', 100000)

        # API configuration for intraday data
        self.polygon_api_key = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
        self.base_url = 'https://api.polygon.io'

        # Exit strategy configuration
        self.exit_strategies = {
            'lc_momentum': {
                'profit_target_atr': 2.0,  # Take profit at 2x ATR
                'stop_loss_atr': 0.8,      # Stop loss at 0.8x ATR
                'trailing_stop_atr': 0.5,   # Trailing stop at 0.5x ATR
                'time_exit_minutes': 240,   # Exit after 4 hours if no target hit
                'volume_exit_threshold': 0.3  # Exit if volume drops below 30% of entry volume
            },
            'parabolic': {
                'profit_target_atr': 3.0,  # Higher target for parabolic moves
                'stop_loss_atr': 1.0,
                'trailing_stop_atr': 0.8,
                'time_exit_minutes': 180,
                'momentum_exit_threshold': 0.5  # Exit if momentum slows
            }
        }

    def run_enhanced_backtest(self, scan_results: List[Dict]) -> Dict:
        """Run enhanced backtest with real intraday data"""
        print(f"🚀 Starting enhanced backtest on {len(scan_results)} trades...")

        all_trades = []
        successful_trades = 0
        failed_trades = 0

        for i, scan_result in enumerate(scan_results):
            try:
                print(f"\n📊 Processing trade {i+1}/{len(scan_results)}: {scan_result['ticker']} on {scan_result['date']}")

                trade_result = self.simulate_trade_with_intraday_data(scan_result)

                if trade_result:
                    all_trades.append(trade_result)
                    successful_trades += 1
                    print(f"✅ Trade completed: {trade_result['pnl_pct']:.2%} return, {trade_result['r_multiple']:.2f}R")
                else:
                    failed_trades += 1
                    print(f"❌ Trade simulation failed - insufficient data")

                # Rate limiting for API
                if i < len(scan_results) - 1:
                    time.sleep(0.1)

            except Exception as e:
                print(f"❌ Error processing {scan_result['ticker']}: {e}")
                failed_trades += 1
                continue

        # Calculate comprehensive performance metrics
        performance_metrics = self.calculate_enhanced_metrics(all_trades)

        return {
            'success': True,
            'trades': all_trades,
            'summary': performance_metrics,
            'metadata': {
                'total_processed': len(scan_results),
                'successful_trades': successful_trades,
                'failed_trades': failed_trades,
                'success_rate': successful_trades / len(scan_results) if scan_results else 0,
                'engine_version': 'enhanced_v2.0',
                'backtest_timestamp': datetime.now().isoformat()
            }
        }

    def simulate_trade_with_intraday_data(self, scan_result: Dict) -> Optional[Dict]:
        """Simulate a single trade using real intraday data"""
        ticker = scan_result['ticker']
        trade_date = scan_result['date']
        atr = scan_result.get('atr', 1.0)

        # Fetch intraday data for the trade date
        intraday_data = self.fetch_intraday_data(ticker, trade_date)

        if not intraday_data:
            return None

        # Determine entry conditions and price
        entry_info = self.calculate_entry_price(scan_result, intraday_data)
        if not entry_info:
            return None

        # Determine strategy type based on scan signals
        strategy_type = self.determine_strategy_type(scan_result)

        # Simulate trade execution with real data
        trade_result = self.execute_trade_simulation(
            ticker=ticker,
            trade_date=trade_date,
            entry_info=entry_info,
            intraday_data=intraday_data,
            strategy_type=strategy_type,
            atr=atr,
            scan_signals=scan_result
        )

        return trade_result

    def fetch_intraday_data(self, ticker: str, trade_date: str, timespan: str = 'minute') -> List[Dict]:
        """Fetch real intraday data from Polygon API"""
        try:
            # Parse trade date
            date_obj = datetime.strptime(trade_date, '%Y-%m-%d')
            date_str = date_obj.strftime('%Y-%m-%d')

            url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/{timespan}/{date_str}/{date_str}"
            params = {
                'adjusted': 'true',
                'sort': 'asc',
                'apikey': self.polygon_api_key
            }

            response = requests.get(url, params=params, timeout=10)
            data = response.json()

            if 'results' not in data or not data['results']:
                print(f"⚠️  No intraday data available for {ticker} on {trade_date}")
                return []

            # Convert to standard format
            bars = []
            for bar in data['results']:
                bars.append({
                    'timestamp': bar['t'],
                    'datetime': datetime.fromtimestamp(bar['t'] / 1000),
                    'open': bar['o'],
                    'high': bar['h'],
                    'low': bar['l'],
                    'close': bar['c'],
                    'volume': bar['v']
                })

            print(f"📈 Fetched {len(bars)} minute bars for {ticker}")
            return bars

        except Exception as e:
            print(f"❌ Error fetching intraday data for {ticker}: {e}")
            return []

    def calculate_entry_price(self, scan_result: Dict, intraday_data: List[Dict]) -> Optional[Dict]:
        """Calculate entry price based on scan signals and market conditions"""
        if not intraday_data:
            return None

        # Filter data to market hours (9:30 AM - 4:00 PM ET)
        market_hours_data = [
            bar for bar in intraday_data
            if 9.5 <= bar['datetime'].hour + bar['datetime'].minute/60 <= 16
        ]

        if not market_hours_data:
            return None

        # Entry strategies based on scan type
        gap = scan_result.get('gap', 0)
        prev_close = scan_result.get('prev_close', 0)

        # Look for entry in first 30 minutes based on gap and volume
        first_30_min = market_hours_data[:30]  # First 30 bars (minutes)

        for i, bar in enumerate(first_30_min):
            # Entry conditions:
            # 1. Price confirms gap direction
            # 2. Volume is sufficient
            # 3. Price action shows momentum

            if gap > 0.02:  # Gap up situation
                # Enter if price holds above gap level with volume
                gap_price = prev_close * (1 + gap)
                if bar['low'] >= gap_price * 0.98 and bar['volume'] > 100000:
                    entry_price = max(bar['open'], gap_price)
                    return {
                        'entry_price': entry_price,
                        'entry_time': bar['datetime'],
                        'entry_bar_index': i,
                        'entry_volume': bar['volume'],
                        'gap_price': gap_price,
                        'entry_reason': f'Gap hold entry at ${entry_price:.2f}'
                    }

        # Fallback: Enter at market open if no specific entry found
        first_bar = market_hours_data[0]
        return {
            'entry_price': first_bar['open'],
            'entry_time': first_bar['datetime'],
            'entry_bar_index': 0,
            'entry_volume': first_bar['volume'],
            'gap_price': prev_close * (1 + gap),
            'entry_reason': f'Market open entry at ${first_bar["open"]:.2f}'
        }

    def determine_strategy_type(self, scan_result: Dict) -> str:
        """Determine strategy type based on scan signals"""
        parabolic_score = scan_result.get('parabolic_score', 0)

        if parabolic_score > 70:
            return 'parabolic'
        else:
            return 'lc_momentum'

    def execute_trade_simulation(self, ticker: str, trade_date: str, entry_info: Dict,
                                intraday_data: List[Dict], strategy_type: str,
                                atr: float, scan_signals: Dict) -> Dict:
        """Execute complete trade simulation with realistic exit logic"""

        entry_price = entry_info['entry_price']
        entry_time = entry_info['entry_time']
        entry_bar_index = entry_info['entry_bar_index']

        # Position sizing
        position_size = self.d_risk / (atr * 0.8)  # Size based on ATR stop
        shares = int(position_size)
        if shares <= 0:
            shares = int(self.d_risk / entry_price)  # Fallback sizing

        # Get strategy parameters
        strategy_params = self.exit_strategies[strategy_type]

        # Calculate exit levels
        profit_target = entry_price + (atr * strategy_params['profit_target_atr'])
        stop_loss = entry_price - (atr * strategy_params['stop_loss_atr'])
        trailing_stop = entry_price - (atr * strategy_params['trailing_stop_atr'])

        # Track highest price for trailing stop
        highest_price = entry_price
        current_trailing_stop = trailing_stop

        # Simulate trade execution through the day
        exit_price = None
        exit_time = None
        exit_reason = None

        # Process bars after entry
        for i in range(entry_bar_index + 1, len(intraday_data)):
            bar = intraday_data[i]

            # Update highest price for trailing stop
            if bar['high'] > highest_price:
                highest_price = bar['high']
                current_trailing_stop = highest_price - (atr * strategy_params['trailing_stop_atr'])

            # Check exit conditions in order of priority

            # 1. Stop loss hit
            if bar['low'] <= stop_loss:
                exit_price = stop_loss
                exit_time = bar['datetime']
                exit_reason = 'Stop Loss'
                break

            # 2. Profit target hit
            if bar['high'] >= profit_target:
                exit_price = profit_target
                exit_time = bar['datetime']
                exit_reason = 'Profit Target'
                break

            # 3. Trailing stop hit
            if bar['low'] <= current_trailing_stop:
                exit_price = current_trailing_stop
                exit_time = bar['datetime']
                exit_reason = 'Trailing Stop'
                break

            # 4. Time-based exit
            minutes_elapsed = (bar['datetime'] - entry_time).total_seconds() / 60
            if minutes_elapsed >= strategy_params['time_exit_minutes']:
                exit_price = bar['close']
                exit_time = bar['datetime']
                exit_reason = 'Time Exit'
                break

            # 5. Volume-based exit (if volume drops significantly)
            if bar['volume'] < entry_info['entry_volume'] * strategy_params.get('volume_exit_threshold', 0.3):
                if i > entry_bar_index + 10:  # Only after 10+ minutes
                    exit_price = bar['close']
                    exit_time = bar['datetime']
                    exit_reason = 'Volume Exit'
                    break

        # Default end-of-day exit if no other exit triggered
        if exit_price is None:
            last_bar = intraday_data[-1]
            exit_price = last_bar['close']
            exit_time = last_bar['datetime']
            exit_reason = 'End of Day'

        # Calculate trade results
        gross_pnl = (exit_price - entry_price) * shares
        commission = shares * 0.005 * 2  # $0.005 per share round trip
        net_pnl = gross_pnl - commission

        # Calculate percentage returns and R-multiple
        pnl_pct = (exit_price - entry_price) / entry_price
        r_multiple = net_pnl / self.d_risk

        # Calculate holding time
        holding_time_minutes = (exit_time - entry_time).total_seconds() / 60

        return {
            'ticker': ticker,
            'date': trade_date,
            'entry_price': entry_price,
            'exit_price': exit_price,
            'entry_time': entry_time.isoformat(),
            'exit_time': exit_time.isoformat(),
            'shares': shares,
            'gross_pnl': gross_pnl,
            'commission': commission,
            'net_pnl': net_pnl,
            'pnl_pct': pnl_pct,
            'r_multiple': r_multiple,
            'holding_time_minutes': holding_time_minutes,
            'entry_reason': entry_info['entry_reason'],
            'exit_reason': exit_reason,
            'strategy_type': strategy_type,
            'profit_target': profit_target,
            'stop_loss': stop_loss,
            'highest_price': highest_price,
            'atr': atr,
            'scan_signals': scan_signals
        }

    def calculate_enhanced_metrics(self, trades: List[Dict]) -> Dict:
        """Calculate comprehensive performance metrics"""
        if not trades:
            return {}

        df = pd.DataFrame(trades)

        # Basic metrics
        total_trades = len(trades)
        winners = df[df['r_multiple'] > 0]
        losers = df[df['r_multiple'] <= 0]

        win_rate = len(winners) / total_trades if total_trades > 0 else 0
        avg_winner = winners['r_multiple'].mean() if len(winners) > 0 else 0
        avg_loser = losers['r_multiple'].mean() if len(losers) > 0 else 0

        # Risk metrics
        profit_factor = abs(winners['r_multiple'].sum() / losers['r_multiple'].sum()) if len(losers) > 0 and losers['r_multiple'].sum() != 0 else float('inf')

        # Expectancy and Kelly Criterion
        expectancy = win_rate * avg_winner + (1 - win_rate) * avg_loser
        kelly_f = win_rate - ((1 - win_rate) / (avg_winner / abs(avg_loser))) if avg_loser != 0 else 0

        # Performance metrics
        total_return = df['r_multiple'].sum()
        total_return_pct = df['pnl_pct'].sum() * 100

        # Sharpe ratio approximation (using daily returns)
        if len(df) > 1:
            returns_std = df['r_multiple'].std()
            sharpe_ratio = expectancy / returns_std if returns_std > 0 else 0
        else:
            sharpe_ratio = 0

        # Drawdown analysis
        cumulative_returns = df['r_multiple'].cumsum()
        running_max = cumulative_returns.expanding().max()
        drawdown = cumulative_returns - running_max
        max_drawdown = drawdown.min()

        # Strategy breakdown
        strategy_stats = df.groupby('strategy_type').agg({
            'r_multiple': ['count', 'mean', 'sum'],
            'pnl_pct': 'mean'
        }).round(3)

        # Exit reason analysis
        exit_reasons = df['exit_reason'].value_counts().to_dict()

        return {
            'total_trades': total_trades,
            'winners': len(winners),
            'losers': len(losers),
            'win_rate': round(win_rate * 100, 2),
            'avg_winner_r': round(avg_winner, 3),
            'avg_loser_r': round(avg_loser, 3),
            'profit_factor': round(profit_factor, 3),
            'expectancy': round(expectancy, 3),
            'kelly_criterion': round(kelly_f, 3),
            'total_return_r': round(total_return, 2),
            'total_return_pct': round(total_return_pct, 2),
            'sharpe_ratio': round(sharpe_ratio, 3),
            'max_drawdown': round(max_drawdown, 3),
            'avg_holding_time_hours': round(df['holding_time_minutes'].mean() / 60, 2),
            'strategy_breakdown': strategy_stats.to_dict() if not strategy_stats.empty else {},
            'exit_reasons': exit_reasons,
            'largest_winner': round(df['r_multiple'].max(), 3),
            'largest_loser': round(df['r_multiple'].min(), 3)
        }


def main():
    """Main function for command line usage"""
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python enhanced_backtest_engine.py <json_data_file>',
            'results': {}
        }))
        sys.exit(1)

    try:
        # Load scan results from JSON file
        with open(sys.argv[1], 'r') as f:
            data = json.load(f)

        scan_results = data.get('scan_results', [])
        config = data.get('config', {})

        # Initialize and run enhanced backtest
        engine = EnhancedBacktestEngine(config)
        results = engine.run_enhanced_backtest(scan_results)

        print(json.dumps(results, indent=2, default=str))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Enhanced backtest failed: {str(e)}',
            'results': {}
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()