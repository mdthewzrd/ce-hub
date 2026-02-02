#!/usr/bin/env python3
"""Debug the syntax error in the test code"""

import ast

# Test LC D2 scanner code that's causing the syntax error
TEST_LC_D2_SCANNER = '''
import asyncio
import pandas as pd
from datetime import datetime, timedelta
import numpy as np

# Mock symbols for testing
SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META']

# Mock dates for testing
DATES = pd.date_range('2025-01-01', '2025-11-06', freq='D')

async def main():
    """
    LC D2 scanner with potential missing column dependencies
    """
    print("🔧 LC D2 Scanner starting...")

    results = []

    for symbol in SYMBOLS:
        # Simulate data with some missing columns that caused KeyErrors
        mock_data = pd.DataFrame({
            'date': DATES,
            'close': np.random.uniform(100, 200, len(DATES)),
            'volume': np.random.uniform(1000000, 10000000, len(DATES)),
            'high': np.random.uniform(105, 205, len(DATES)),
            'low': np.random.uniform(95, 195, len(DATES))
        })

        # Try to access columns that might not exist (this used to cause KeyError)
        try:
            # These columns often don't exist and caused the original failures
            lc_frontside = mock_data.get('lc_frontside_d2_extended_1', pd.Series(0, index=mock_data.index))
            lc_backside = mock_data.get('lc_backside_d3_extended_1', pd.Series(0, index=mock_data.index))

            # Simulate pattern detection logic
            pattern_detected = (lc_frontside == 1) & (lc_backside == 1) & (mock_data['volume'] > 2000000)

            if pattern_detected.any():
                qualifying_dates = mock_data[pattern_detected]['date'].tolist()
                for qual_date in qualifying_dates[:2]:  # Limit results
                    results.append({
                        'ticker': symbol,
                        'date': qual_date.strftime('%Y-%m-%d'),
                        'close': mock_data[mock_data['date'] == qual_date]['close'].iloc[0],
                        'volume': mock_data[mock_data['date'] == qual_date]['volume'].iloc[0]
                    })
        except KeyError as e:
            print(f"⚠️ KeyError accessing columns for {symbol}: {e}")
            continue
        except Exception as e:
            print(f"⚠️ Error processing {symbol}: {e}")
            continue

    print(f"🎉 LC D2 Scanner completed: {len(results)} results")

    # Store results in global variables (multiple possible names for testing)
    global df_lc, results_list, final_results
    df_lc = pd.DataFrame(results)
    results_list = results
    final_results = results

    return results

# This used to cause asyncio.run() conflicts with FastAPI
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
'''

# Check for syntax errors
try:
    ast.parse(TEST_LC_D2_SCANNER)
    print("✅ Original test code syntax is valid")
except SyntaxError as e:
    print(f"❌ Original test code has syntax error: {e}")
    print(f"Line {e.lineno}: {e.text}")

# Now test with the async preprocessing
lines = TEST_LC_D2_SCANNER.split('\n')
for i, line in enumerate(lines, 1):
    print(f"{i:2d}: {line}")
    if i == 69:
        print(f"    ^^ Line 69: '{line.strip()}'")