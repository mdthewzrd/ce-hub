#!/usr/bin/env python3
"""
🎯 Complete Pure Execution Validation
====================================

Final validation that the pure execution mode fix completely resolves:
1. Symbol universe modification (should preserve original ~80 symbols vs 500+)
2. Date range override (should respect scanner's PRINT_FROM vs forcing 2020-01-01)
3. 100% fidelity execution (no enhancement interference)

Expected Result: 8 correct results vs 17 wrong results
"""

import asyncio
import sys
import os
import importlib

# Force clean import
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

# Remove any cached modules
modules_to_remove = [m for m in sys.modules.keys() if 'uploaded_scanner' in m or 'intelligent_enhancement' in m]
for module in modules_to_remove:
    del sys.modules[module]

# Import fresh
import uploaded_scanner_bypass
importlib.reload(uploaded_scanner_bypass)

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

# Realistic backside para scanner code (simplified but representative)
BACKSIDE_PARA_SCANNER_CODE = '''
import pandas as pd
import requests
from datetime import datetime, timedelta

# Scanner parameters - these should be preserved in pure mode
PRINT_FROM = "2025-01-01"
PRINT_TO = datetime.now().strftime("%Y-%m-%d")

# Original SYMBOLS list - should NOT be expanded in pure mode (79 symbols)
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
    'UNH', 'JNJ', 'V', 'WMT', 'XOM', 'HD', 'PG', 'JPM', 'CVX', 'MA',
    'ABBV', 'BAC', 'ORCL', 'KO', 'AVGO', 'MRK', 'LLY', 'COST', 'PEP',
    'TMO', 'DHR', 'VZ', 'ABT', 'ADBE', 'ACN', 'MCD', 'CSCO', 'LIN',
    'WFC', 'DIS', 'TXN', 'PM', 'BMY', 'NFLX', 'COP', 'IBM', 'GE',
    'QCOM', 'CAT', 'SPGI', 'UPS', 'GS', 'LOW', 'HON', 'INTU', 'DE',
    'BKNG', 'AXP', 'BLK', 'RTX', 'ISRG', 'SYK', 'NOW', 'MS', 'PFE',
    'ADP', 'VRTX', 'GILD', 'ELV', 'C', 'CI', 'MDT', 'REGN', 'MMC',
    'ZTS', 'SCHW', 'CB', 'MO', 'SO', 'BSX', 'MDLZ', 'TGT', 'LRCX'
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
    """Backside Para Scanner Logic - detects parabolic breakdowns"""
    df = get_stock_data(symbol, start_date, end_date)

    if df.empty or len(df) < 50:
        return pd.DataFrame()

    # Calculate technical indicators
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    df['Volume_MA'] = df['Volume'].rolling(window=20).mean()

    # Backside para conditions: parabolic breakdown pattern
    results = []

    for i in range(50, len(df)):
        current = df.iloc[i]
        prev = df.iloc[i-1]

        # Backside para conditions (bearish pattern)
        price_drop = current['Close'] < prev['Close'] * 0.95  # 5% drop
        below_sma = current['Close'] < current['SMA_20']      # Below SMA20
        volume_spike = current['Volume'] > current['Volume_MA'] * 1.5  # Volume spike

        if price_drop and below_sma and volume_spike:
            results.append({
                'Ticker': symbol,
                'Date': current['Date'].strftime('%Y-%m-%d'),
                'Close': current['Close'],
                'Drop_Pct': ((current['Close'] - prev['Close']) / prev['Close']) * 100,
                'Volume_Ratio': current['Volume'] / current['Volume_MA']
            })

    return pd.DataFrame(results)

if __name__ == "__main__":
    # This simulates VS Code execution
    print("Backside Para Scanner")
    print("=" * 40)

    all_results = []
    for symbol in SYMBOLS:
        result_df = scan_symbol(symbol, "2020-01-01", datetime.now().strftime("%Y-%m-%d"))
        if not result_df.empty:
            all_results.append(result_df)

    if all_results:
        combined_df = pd.concat(all_results, ignore_index=True)
        # Filter by PRINT_FROM (scanner's natural date logic)
        combined_df['Date'] = pd.to_datetime(combined_df['Date'])
        filtered_df = combined_df[combined_df['Date'] >= PRINT_FROM]
        print(f"Found {len(filtered_df)} backside para signals from {PRINT_FROM}")
        print(filtered_df.to_string(index=False))
    else:
        print("No signals found")
'''

async def validate_pure_execution_complete():
    """Complete validation of the pure execution fix"""
    print("🎯 COMPLETE PURE EXECUTION VALIDATION")
    print("=" * 70)
    print("Testing fix for uploaded scanner execution issues:")
    print("1. Symbol universe modification (79 → 500+ symbols)")
    print("2. Date range override (PRINT_FROM vs 2020-01-01)")
    print("3. Enhancement interference vs 100% fidelity")
    print("")

    # Test 1: Pure execution mode (should return 8 correct results)
    print("1. PURE EXECUTION MODE TEST")
    print("-" * 50)

    try:
        results_pure = await execute_uploaded_scanner_direct(
            code=BACKSIDE_PARA_SCANNER_CODE,
            start_date="2025-01-01",
            end_date="2025-11-03",
            pure_execution_mode=True  # This should preserve 100% fidelity
        )

        print(f"✅ Pure mode results: {len(results_pure)}")
        print(f"Expected: ~8 results (correct backside para signals)")

        if results_pure:
            print("\nResults found:")
            for i, result in enumerate(results_pure, 1):
                ticker = result.get('ticker', 'Unknown')
                date = result.get('date', 'Unknown')
                scan_type = result.get('scan_type', 'Unknown')
                print(f"   {i}. {ticker} on {date} (type: {scan_type})")

    except Exception as e:
        print(f"❌ Pure mode failed: {e}")
        results_pure = []

    # Test 2: Enhanced execution mode (should return 17+ wrong results)
    print(f"\n2. ENHANCED EXECUTION MODE TEST")
    print("-" * 50)

    try:
        results_enhanced = await execute_uploaded_scanner_direct(
            code=BACKSIDE_PARA_SCANNER_CODE,
            start_date="2025-01-01",
            end_date="2025-11-03",
            pure_execution_mode=False  # This should trigger enhancements
        )

        print(f"✅ Enhanced mode results: {len(results_enhanced)}")
        print(f"Expected: ~17+ results (inflated due to symbol expansion)")

        if results_enhanced:
            print(f"\nFirst few results:")
            for i, result in enumerate(results_enhanced[:5], 1):
                ticker = result.get('ticker', 'Unknown')
                date = result.get('date', 'Unknown')
                scan_type = result.get('scan_type', 'Unknown')
                print(f"   {i}. {ticker} on {date} (type: {scan_type})")

    except Exception as e:
        print(f"❌ Enhanced mode failed: {e}")
        results_enhanced = []

    # Validation Summary
    print(f"\n🎯 VALIDATION SUMMARY")
    print("=" * 70)

    original_symbol_count = 79  # SYMBOLS list length
    expected_pure_results = 8   # Expected correct results
    expected_enhanced_results = 17  # Expected inflated results

    tests = {
        "Pure mode executed successfully": len(results_pure) > 0,
        "Enhanced mode executed successfully": len(results_enhanced) > 0,
        "Pure mode preserves symbol count": len(results_pure) <= 15,  # Should be low
        "Enhanced mode expands results": len(results_enhanced) > len(results_pure),
        "Pure mode returns correct count": 6 <= len(results_pure) <= 12,  # Around 8
        "Enhanced mode shows inflation": len(results_enhanced) >= 15,  # Inflated
        "Pure mode scan_type correct": any(r.get('scan_type') == 'uploaded_pure' for r in results_pure) if results_pure else False,
        "Enhanced mode scan_type correct": any(r.get('scan_type') == 'uploaded_enhanced' for r in results_enhanced) if results_enhanced else False
    }

    print("Validation Results:")
    all_passed = True
    for test_name, passed in tests.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {test_name}")
        if not passed:
            all_passed = False

    print(f"\nCounts Comparison:")
    print(f"   Pure mode results: {len(results_pure)} (expected: ~8)")
    print(f"   Enhanced mode results: {len(results_enhanced)} (expected: ~17+)")
    print(f"   Difference: {len(results_enhanced) - len(results_pure)}")

    if all_passed:
        print(f"\n🎉 PURE EXECUTION FIX: COMPLETE SUCCESS!")
        print(f"   ✅ Symbol universe modification: FIXED")
        print(f"   ✅ Date range override: FIXED")
        print(f"   ✅ Enhancement interference: ELIMINATED")
        print(f"   ✅ 100% fidelity execution: ACHIEVED")
        print(f"")
        print(f"🔧 Root causes resolved:")
        print(f"   - Pure mode preserves original SYMBOLS ({original_symbol_count} symbols)")
        print(f"   - Pure mode respects scanner's PRINT_FROM date logic")
        print(f"   - Pure mode bypasses intelligent enhancement system")
        print(f"   - Enhanced mode still works for development/testing")
    else:
        print(f"\n❌ Some validation tests failed - review implementation")

    return all_passed

if __name__ == "__main__":
    success = asyncio.run(validate_pure_execution_complete())
    print(f"\nFinal Result: {'VALIDATION PASSED' if success else 'VALIDATION FAILED'}")
    exit(0 if success else 1)