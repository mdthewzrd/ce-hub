#!/usr/bin/env python3
"""
🎯 Clean Pure Execution Test
===========================
Forces module reload and tests pure execution mode
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

# Simple test scanner with known behavior
TEST_SCANNER_CODE = '''
import pandas as pd
import requests
from datetime import datetime

# Original SYMBOLS list - should be preserved in pure mode
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'  # Only 5 symbols to test preservation
]

def get_stock_data(symbol, start_date, end_date):
    """Simple mock data for testing"""
    return pd.DataFrame({
        'Date': [datetime(2025, 1, 15)],
        'Open': [100.0],
        'High': [110.0],
        'Low': [95.0],
        'Close': [105.0],
        'Volume': [1000000]
    })

def scan_symbol(symbol, start_date, end_date):
    """Simple test scanner that always returns one result per symbol"""
    df = get_stock_data(symbol, start_date, end_date)

    if not df.empty:
        return pd.DataFrame([{
            'Ticker': symbol,
            'Date': '2025-01-15',
            'Close': 105.0,
            'Test_Signal': 'detected'
        }])

    return pd.DataFrame()

if __name__ == "__main__":
    print("Test Scanner with 5 symbols")
'''

async def test_pure_execution_clean():
    """Clean test of pure execution mode"""
    print("🎯 CLEAN PURE EXECUTION TEST")
    print("=" * 50)

    try:
        # Test pure execution mode
        print("\n1. Testing Pure Execution Mode")
        print("-" * 30)

        results_pure = await execute_uploaded_scanner_direct(
            code=TEST_SCANNER_CODE,
            start_date="2025-01-01",
            end_date="2025-01-31",
            pure_execution_mode=True
        )

        print(f"✅ Pure mode: {len(results_pure)} results")

        # Should have 5 results (one per symbol in original SYMBOLS list)
        expected_symbols = {'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'}
        found_symbols = {r.get('ticker') for r in results_pure}

        print(f"Expected symbols: {expected_symbols}")
        print(f"Found symbols: {found_symbols}")

        if found_symbols == expected_symbols:
            print("✅ Symbol preservation: PASS")
        else:
            print("❌ Symbol preservation: FAIL")

        # Test enhanced execution mode
        print("\n2. Testing Enhanced Execution Mode")
        print("-" * 30)

        results_enhanced = await execute_uploaded_scanner_direct(
            code=TEST_SCANNER_CODE,
            start_date="2025-01-01",
            end_date="2025-01-31",
            pure_execution_mode=False
        )

        print(f"✅ Enhanced mode: {len(results_enhanced)} results")
        found_symbols_enhanced = {r.get('ticker') for r in results_enhanced}
        print(f"Enhanced symbols: {len(found_symbols_enhanced)} unique symbols")

        # Validation
        print("\n🎯 VALIDATION RESULTS")
        print("=" * 50)

        tests = {
            "Pure mode executed": len(results_pure) > 0,
            "Enhanced mode executed": len(results_enhanced) > 0,
            "Pure mode preserves symbols": found_symbols == expected_symbols,
            "Enhanced mode expands symbols": len(found_symbols_enhanced) > len(expected_symbols),
            "Pure mode count correct": len(results_pure) == 5,
        }

        all_passed = True
        for test_name, passed in tests.items():
            status = "✅" if passed else "❌"
            print(f"{status} {test_name}")
            if not passed:
                all_passed = False

        if all_passed:
            print(f"\n🎉 PURE EXECUTION MODE: SUCCESS!")
            print(f"   - Symbol preservation works correctly")
            print(f"   - Enhanced mode expands as expected")
        else:
            print(f"\n❌ Some tests failed")

        return all_passed

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_pure_execution_clean())
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")