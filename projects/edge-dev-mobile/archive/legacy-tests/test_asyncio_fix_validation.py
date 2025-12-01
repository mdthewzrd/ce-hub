#!/usr/bin/env python3
"""
🔧 Asyncio Fix Validation Test
Test the conditional import fix for asyncio event loop conflicts
"""

import asyncio
import sys
import os
sys.path.append('backend')

async def test_pure_execution_mode():
    """
    Test pure execution mode with conditional imports
    """
    print("🔧 Testing Pure Execution Mode with Conditional Imports")
    print("=" * 70)

    try:
        # Import the fixed module
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        # Read the half A+ scanner
        scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
        with open(scanner_file, 'r') as f:
            half_a_plus_code = f.read()

        print(f"📄 Loaded scanner: {len(half_a_plus_code)} characters")
        print("🎯 Testing pure execution mode (should avoid intelligent_enhancement imports)...")

        # Execute in pure mode (should not trigger intelligent_enhancement imports)
        results = await execute_uploaded_scanner_direct(
            half_a_plus_code,
            "2024-01-01",
            "2024-12-31",
            pure_execution_mode=True
        )

        print(f"✅ Pure execution successful: {len(results)} results")
        return True, len(results)

    except Exception as e:
        print(f"❌ Pure execution failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ ASYNCIO CONFLICT STILL EXISTS!")
            return False, 0
        else:
            print("❌ Different error occurred")
            return False, 0

async def test_enhanced_execution_mode():
    """
    Test enhanced execution mode with intelligent enhancement
    """
    print("\n🔧 Testing Enhanced Execution Mode")
    print("=" * 70)

    try:
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        # Simple test code for enhanced mode
        test_code = '''
import pandas as pd
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL']

def scan_symbol(symbol, start_date, end_date):
    return pd.DataFrame([{'Ticker': symbol, 'Date': '2024-01-01'}])
'''

        print("🔧 Testing enhanced execution mode (should import intelligent_enhancement)...")

        # Execute in enhanced mode (should trigger intelligent_enhancement imports)
        results = await execute_uploaded_scanner_direct(
            test_code,
            "2024-01-01",
            "2024-12-31",
            pure_execution_mode=False
        )

        print(f"✅ Enhanced execution successful: {len(results)} results")
        return True, len(results)

    except Exception as e:
        print(f"❌ Enhanced execution failed: {e}")
        return False, 0

async def test_in_event_loop():
    """
    Test both modes within an existing event loop (simulates FastAPI)
    """
    print("\n🔧 Testing Within Existing Event Loop (FastAPI simulation)")
    print("=" * 70)

    try:
        # Test pure mode
        pure_success, pure_results = await test_pure_execution_mode()

        # Test enhanced mode (only if pure mode works)
        if pure_success:
            enhanced_success, enhanced_results = await test_enhanced_execution_mode()
        else:
            enhanced_success, enhanced_results = False, 0

        return pure_success, enhanced_success, pure_results, enhanced_results

    except Exception as e:
        print(f"❌ Event loop test failed: {e}")
        return False, False, 0, 0

def main():
    """
    Run comprehensive asyncio fix validation
    """
    print("🔍 ASYNCIO FIX VALIDATION TEST")
    print("=" * 80)
    print("Testing conditional import fix for asyncio event loop conflicts")

    try:
        # Run the test in an event loop (simulates FastAPI context)
        pure_success, enhanced_success, pure_results, enhanced_results = asyncio.run(test_in_event_loop())

        print("\n📋 FIX VALIDATION RESULTS:")
        print("=" * 80)
        print(f"✅ Pure execution mode: {'FIXED' if pure_success else 'STILL BROKEN'} ({pure_results} results)")
        print(f"✅ Enhanced execution mode: {'WORKING' if enhanced_success else 'FAILED'} ({enhanced_results} results)")

        if pure_success:
            print("\n🎉 SUCCESS: Asyncio event loop conflict has been FIXED!")
            print("   Pure execution mode now works within FastAPI event loop context")
        else:
            print("\n❌ FAILURE: Asyncio event loop conflict still exists")
            print("   Need to investigate further...")

        return pure_success

    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)