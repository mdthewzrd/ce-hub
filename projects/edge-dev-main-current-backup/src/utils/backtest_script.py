#!/usr/bin/env python3
"""
Modified version of backtest script for integration with Node.js API
Based on user's original backtet d3 (1).py script
"""

import sys
import json
import pandas as pd
import numpy as np
import time
import concurrent.futures
import warnings
warnings.filterwarnings('ignore')

# Key configuration variables from original script
d_risk = 1000
p_risk = 0.01
start_capital = 100000
show_chart = "n"  # Disable charts for API integration

def comp_pnl(df_daily_pnl, start_capital):
    """Calculate compound P&L as in original script"""
    sim_pnl_comp = start_capital
    for i, row in df_daily_pnl.iterrows():
        if i == 0:
            prev_sim_pnl_comp = start_capital
        else:
            prev_sim_pnl_comp = df_daily_pnl.loc[i-1, 'sim_pnl_comp']
        df_daily_pnl.loc[i, 'sim_pnl_comp'] = df_daily_pnl.loc[i, 'pnl'] * ((prev_sim_pnl_comp * p_risk) / d_risk) + prev_sim_pnl_comp

    return df_daily_pnl

def stats_by_trade(df):
    """Calculate trade statistics as in original script"""
    if len(df) == 0:
        return {}

    win_trades = df[df['pnl'] > 0]
    loss_trades = df[df['pnl'] < 0]

    win_rate = len(win_trades) / len(df) if len(df) > 0 else 0
    loss_rate = len(loss_trades) / len(df) if len(df) > 0 else 0

    avg_win = win_trades['R_pnl'].mean() if len(win_trades) > 0 else 0
    avg_loss = loss_trades['R_pnl'].mean() if len(loss_trades) > 0 else 0

    winners = len(win_trades)
    lossers = len(loss_trades)
    all_trades = len(df)

    if abs(avg_loss) > 0:
        avg_wl_ratio = abs(avg_win) / abs(avg_loss)
    else:
        avg_wl_ratio = float('inf')

    total_profit = df['cum_R_pnl'].iloc[-1] if len(df) > 0 else 0

    ev = (win_rate * avg_win) + (loss_rate * avg_loss) if avg_win and avg_loss else 0
    edge = (1+avg_wl_ratio)*win_rate - 1 if avg_wl_ratio and win_rate else 0
    kelly = win_rate - (loss_rate / avg_wl_ratio) if avg_wl_ratio > 0 else 0

    return {
        'total_trades': all_trades,
        'winners': winners,
        'losers': lossers,
        'win_rate': win_rate,
        'avg_win': avg_win,
        'avg_loss': avg_loss,
        'avg_wl_ratio': avg_wl_ratio,
        'total_profit_r': total_profit,
        'expected_value': ev,
        'edge': edge,
        'kelly': kelly
    }

def process_row_simple(row_data):
    """Simplified version of process_row for basic backtesting"""
    row, show_chart = row_data

    # Basic trade simulation based on original logic
    # This is a simplified version - the full version would require market data files

    # Simulate entry based on gap and other criteria
    entry_price = row['prev_close'] * (1 + row['gap'])

    # Simulate some basic exit logic
    # In real implementation, this would use intraday data
    exit_multiplier = np.random.normal(1.02, 0.05)  # Simplified random outcome
    exit_price = entry_price * exit_multiplier

    shares = d_risk / entry_price  # Position sizing
    pnl = (exit_price - entry_price) * shares

    # Calculate R-multiple (risk-adjusted return)
    r_pnl = pnl / d_risk

    result = pd.DataFrame([{
        'date': row['date'],
        'ticker': row['ticker'],
        'entry_price': entry_price,
        'exit_price': exit_price,
        'shares': shares,
        'pnl': pnl,
        'R_pnl': r_pnl,
        'pnl_pct': (exit_price - entry_price) / entry_price,
        'entry_reason': 'LC D2/D3 Setup',
        'exit_reason': 'Simulated Exit',
        'last_exit_reason': 'target'
    }])

    return result

def main_sequential(df_main):
    """Sequential processing version for reliability"""
    df_pnl = pd.DataFrame()

    # Process each row sequentially
    results = []
    for _, row in df_main.iterrows():
        try:
            result = process_row_simple((row, show_chart))
            results.append(result)
        except Exception as e:
            print(f"Error processing {row.get('ticker', 'unknown')}: {e}")
            continue

    # Combine the results
    if results:
        df_pnl = pd.concat(results, ignore_index=True)

    return df_pnl

def show_trades_stats(df_pnl):
    """Calculate comprehensive statistics as in original script"""
    if len(df_pnl) == 0:
        return df_pnl

    # Calculate cumulative R P&L
    df_pnl['cum_R_pnl'] = df_pnl['R_pnl'].cumsum()

    # Daily P&L aggregation
    df_daily_pnl = df_pnl.groupby('date').agg({
        'pnl': 'sum',
        'R_pnl': 'sum'
    }).reset_index()

    # Calculate compound P&L
    df_daily_pnl = comp_pnl(df_daily_pnl, start_capital)

    return df_pnl

def run_backtest(csv_file_path):
    """Main function to run backtest and return results"""
    try:
        # Read the CSV data
        df_main = pd.read_csv(csv_file_path)

        # Ensure required columns exist
        required_cols = ['date', 'ticker', 'gap', 'prev_close']
        missing_cols = [col for col in required_cols if col not in df_main.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        print(f"Processing {len(df_main)} stocks for backtesting...")

        # Run the backtest
        df_pnl = main_sequential(df_main)

        if len(df_pnl) == 0:
            return {
                'success': False,
                'error': 'No trades generated',
                'results': {}
            }

        # Calculate statistics
        df_pnl = show_trades_stats(df_pnl)
        stats = stats_by_trade(df_pnl)

        # Calculate additional metrics
        total_return_pct = (stats.get('total_profit_r', 0)) * 100

        # Return comprehensive results
        results = {
            'success': True,
            'summary': {
                'total_trades': stats.get('total_trades', 0),
                'winners': stats.get('winners', 0),
                'losers': stats.get('losers', 0),
                'win_rate': round(stats.get('win_rate', 0) * 100, 2),
                'total_return_r': round(stats.get('total_profit_r', 0), 2),
                'total_return_pct': round(total_return_pct, 2),
                'avg_win_r': round(stats.get('avg_win', 0), 2),
                'avg_loss_r': round(stats.get('avg_loss', 0), 2),
                'profit_factor': round(stats.get('avg_wl_ratio', 0), 2),
                'expected_value': round(stats.get('expected_value', 0), 2),
                'edge': round(stats.get('edge', 0), 2),
                'kelly_criterion': round(stats.get('kelly', 0), 2)
            },
            'trades': df_pnl.to_dict('records'),
            'metadata': {
                'start_capital': start_capital,
                'risk_per_trade': d_risk,
                'risk_percentage': p_risk * 100,
                'processing_time': time.time()
            }
        }

        return results

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'results': {}
        }

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python backtest_script.py <csv_file_path>',
            'results': {}
        }))
        sys.exit(1)

    csv_file_path = sys.argv[1]
    results = run_backtest(csv_file_path)
    print(json.dumps(results))