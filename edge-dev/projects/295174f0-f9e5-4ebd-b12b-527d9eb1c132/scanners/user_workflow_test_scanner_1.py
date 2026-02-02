# User Workflow Test Scanner
import pandas as pd
import numpy as np

# Scanner configuration
P = {
    "atr_multiplier": 2.0,
    "volume_threshold": 1000000,
    "rsi_oversold": 30,
    "price_min": 15.0
}

def scan_momentum_signals(symbols, start_date, end_date):
    """Main scan function for momentum signals"""
    results = []
    for symbol in symbols:
        if check_momentum_criteria(symbol):
            results.append({
                'ticker': symbol,
                'date': start_date,
                'signal': 'MOMENTUM_BUY',
                'confidence': 0.85,
                'atr_breakout': True
            })
    return results

def check_momentum_criteria(symbol):
    """Check if symbol meets momentum criteria"""
    # Simple mock implementation
    return len(symbol) >= 3 and symbol.isalpha() and symbol not in ['TEST']

if __name__ == "__main__":
    test_symbols = ["AAPL", "MSFT", "NVDA", "TSLA"]
    results = scan_momentum_signals(test_symbols, "2025-01-01", "2025-01-31")
    print(f"Found {len(results)} momentum signals")