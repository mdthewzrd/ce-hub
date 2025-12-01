# Simple Test Scanner - Always finds results for testing
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
    Simple Test Scanner - Always finds results for testing

    This scanner intentionally finds results for every 3rd symbol to test the system
    """
    try:
        # Simple logic: find results for every 3rd symbol (deterministic for testing)
        symbol_hash = hash(symbol) % 3

        if symbol_hash == 0:  # Every 3rd symbol gets a result
            # Generate a simple test result
            gap_percent = round(np.random.uniform(2.5, 6.0), 2)
            volume_ratio = round(np.random.uniform(1.8, 3.5), 2)

            result = {
                'symbol': symbol,
                'ticker': symbol,
                'date': end_date,
                'gap_percent': gap_percent,
                'volume_ratio': volume_ratio,
                'signal_strength': 'Strong' if gap_percent > 4.0 else 'Moderate',
                'entry_price': round(np.random.uniform(50, 300), 2),
                'target_price': round(np.random.uniform(55, 320), 2),
                'test_scanner': 'simple_test'
            }
            return [result]

        return []  # No results for other symbols

    except Exception as e:
        print(f"Error scanning {symbol}: {str(e)}")
        return []

# Optional: Scanner configuration
SCANNER_CONFIG = {
    'name': 'Simple Test Scanner',
    'description': 'Test scanner that always finds results for every 3rd symbol',
    'timeframe': 'Daily',
    'test_mode': True
}

# Scanner entry point
if __name__ == "__main__":
    print("Simple Test Scanner - Verification Mode")
    print(f"Configured to scan {len(SYMBOLS)} symbols")

    # Test the scanner with a few symbols
    test_symbols = ['AAPL', 'MSFT', 'GOOGL']
    for symbol in test_symbols:
        results = scan_symbol(symbol, '2024-10-01', '2024-10-31')
        print(f"{symbol}: {len(results)} results found")
        if results:
            print(f"  Result: {results[0]}")