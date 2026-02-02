#!/usr/bin/env python3
"""
🎯 Direct Pure Execution Test
============================

Tests the pure execution mode directly without going through the API server.
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

# Simple test scanner with known results
TEST_SCANNER_CODE = '''
import pandas as pd
import requests
from datetime import datetime

# Scanner parameters - should be preserved in pure mode
PRINT_FROM = "2025-01-01"
PRINT_TO = datetime.now().strftime("%Y-%m-%d")

# Original SYMBOLS list - should NOT be expanded in pure mode
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B'
]

def get_stock_data(symbol, start_date, end_date):
    """Fetch stock data from Polygon API"""
    api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

    try:
        url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/{start_date}/{end_date}"
        params = {"apikey": api_key}
        response = requests.get(url, params=params)

        if response.status_code == 200:
            data = response.json()
            if "results" in data and data["results"]:
                df = pd.DataFrame(data["results"])
                df["Date"] = pd.to_datetime(df["t"], unit="ms")
                df = df.rename(columns={"o": "Open", "h": "High", "l": "Low", "c": "Close", "v": "Volume"})
                df = df[["Date", "Open", "High", "Low", "Close", "Volume"]]
                return df.sort_values("Date")
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")

    return pd.DataFrame()

def scan_symbol(symbol, start_date, end_date):
    """Simple test scanner - returns any recent data point for testing"""
    df = get_stock_data(symbol, start_date, end_date)

    if df.empty:
        return pd.DataFrame()

    # Simple test logic - return last few data points from 2025
    df_2025 = df[df['Date'] >= '2025-01-01']

    if not df_2025.empty:
        # Return one result per symbol for testing
        last_row = df_2025.iloc[-1]
        result = {
            'Ticker': symbol,
            'Date': last_row['Date'].strftime('%Y-%m-%d'),
            'Close': last_row['Close'],
            'Test_Signal': 'detected'
        }
        return pd.DataFrame([result])

    return pd.DataFrame()

if __name__ == "__main__":
    print("Test Scanner")
    print("=" * 40)

    all_results = []
    for symbol in SYMBOLS:
        result_df = scan_symbol(symbol, "2020-01-01", datetime.now().strftime("%Y-%m-%d"))
        if not result_df.empty:
            all_results.append(result_df)

    if all_results:
        combined_df = pd.concat(all_results, ignore_index=True)
        # Filter by PRINT_FROM
        combined_df['Date'] = pd.to_datetime(combined_df['Date'])
        filtered_df = combined_df[combined_df['Date'] >= PRINT_FROM]
        print(f"Found {len(filtered_df)} test signals from {PRINT_FROM}")
    else:
        print("No signals found")
'''

async def test_pure_vs_enhanced():
    """Test pure execution mode vs enhanced mode"""
    print("🎯 TESTING PURE EXECUTION vs ENHANCED MODE")
    print("=" * 60)

    # Test 1: Pure execution mode (should preserve original SYMBOLS)
    print("\n1. Testing PURE EXECUTION MODE")
    print("-" * 40)

    try:
        results_pure = await execute_uploaded_scanner_direct(
            code=TEST_SCANNER_CODE,
            start_date="2025-01-01",
            end_date="2025-11-03",
            pure_execution_mode=True
        )

        print(f"✅ Pure mode completed: {len(results_pure)} results")
        if results_pure:
            print("   Results:")
            for result in results_pure:
                print(f"     {result.get('ticker')} on {result.get('date')} (scan_type: {result.get('scan_type')})")

        expected_pure_count = 8  # Should match original SYMBOLS count
        if len(results_pure) == expected_pure_count:
            print(f"✅ Pure mode symbol count correct: {len(results_pure)}/{expected_pure_count}")
        else:
            print(f"❌ Pure mode symbol count wrong: {len(results_pure)}/{expected_pure_count}")

    except Exception as e:
        print(f"❌ Pure mode failed: {e}")
        results_pure = []

    # Test 2: Enhanced execution mode (should expand SYMBOLS)
    print("\n2. Testing ENHANCED EXECUTION MODE")
    print("-" * 40)

    try:
        results_enhanced = await execute_uploaded_scanner_direct(
            code=TEST_SCANNER_CODE,
            start_date="2025-01-01",
            end_date="2025-11-03",
            pure_execution_mode=False
        )

        print(f"✅ Enhanced mode completed: {len(results_enhanced)} results")
        if results_enhanced:
            print("   First few results:")
            for result in results_enhanced[:5]:
                print(f"     {result.get('ticker')} on {result.get('date')} (scan_type: {result.get('scan_type')})")

        if len(results_enhanced) > len(results_pure):
            print(f"✅ Enhanced mode has more results due to symbol expansion: {len(results_enhanced)} vs {len(results_pure)}")
        else:
            print(f"❌ Enhanced mode should have more results: {len(results_enhanced)} vs {len(results_pure)}")

    except Exception as e:
        print(f"❌ Enhanced mode failed: {e}")
        results_enhanced = []

    # Validation summary
    print("\n🎯 VALIDATION SUMMARY")
    print("=" * 60)

    validation_results = {
        "Pure mode executed": len(results_pure) > 0,
        "Enhanced mode executed": len(results_enhanced) > 0,
        "Pure mode preserves symbol count": len(results_pure) == 8,
        "Enhanced mode expands symbols": len(results_enhanced) > len(results_pure),
        "Pure mode has pure scan_type": any(r.get('scan_type') == 'uploaded_pure' for r in results_pure) if results_pure else False,
        "Enhanced mode has enhanced scan_type": any(r.get('scan_type') == 'uploaded_enhanced' for r in results_enhanced) if results_enhanced else False
    }

    print("Results:")
    all_passed = True
    for test, passed in validation_results.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {test}")
        if not passed:
            all_passed = False

    if all_passed:
        print(f"\n🎉 ALL TESTS PASSED - Pure execution mode working correctly!")
        print(f"   - Pure mode preserves original code (8 symbols)")
        print(f"   - Enhanced mode expands symbols as intended")
        print(f"   - Both modes work independently")
    else:
        print(f"\n❌ Some tests failed - review implementation")

    return all_passed

if __name__ == "__main__":
    success = asyncio.run(test_pure_vs_enhanced())
    print(f"\nTest {'PASSED' if success else 'FAILED'}")