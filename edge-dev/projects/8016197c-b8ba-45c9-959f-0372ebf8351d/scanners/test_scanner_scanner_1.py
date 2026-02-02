# Test Scanner for Frontend Integration
import pandas as pd
import numpy as np

# Scanner parameters
P = {
    "atr_mult": 1.5,
    "vol_mult": 1.2,
    "slope5d_min": 0.02,
    "high_ema9_mult": 0.8,
    "d1_green_atr_min": 0.5,
    "d1_volume_min": 1000000,
    "price_min": 10.0,
    "adv20_min_usd": 5000000,
    "trigger_mode": "D1_or_D2"
}

def scan_symbols(symbols, start_date, end_date):
    """Main scan function"""
    results = []

    for symbol in symbols:
        # Simple scan logic for testing
        if meets_criteria(symbol):
            results.append({
                'symbol': symbol,
                'date': start_date,
                'signal': 'BULLISH',
                'confidence': 0.85
            })

    return results

def meets_criteria(symbol):
    """Check if symbol meets criteria"""
    # Simple mock logic for testing
    return len(symbol) > 1 and symbol.isalpha()

# Test execution
if __name__ == "__main__":
    test_symbols = ["AAPL", "MSFT", "GOOGL"]
    results = scan_symbols(test_symbols, "2025-01-01", "2025-01-31")
    print(f"Found {len(results)} signals")