# Hard Reset Test Scanner
import pandas as pd
import numpy as np

# Test parameters
P = {
    "test_param": 1.5,
    "vol_threshold": 1000000,
    "price_min": 10.0
}

def scan_symbols(symbols, start_date, end_date):
    """Test scan function"""
    results = []
    for symbol in symbols:
        if meets_criteria(symbol):
            results.append({
                'symbol': symbol,
                'date': start_date,
                'signal': 'BULLISH',
                'confidence': 0.9
            })
    return results

def meets_criteria(symbol):
    """Test criteria"""
    return len(symbol) > 1 and symbol.isalpha()

if __name__ == "__main__":
    print("Hard reset test scanner ready")