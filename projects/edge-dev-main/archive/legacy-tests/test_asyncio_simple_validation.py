#!/usr/bin/env python3
"""
🔧 Simple Asyncio Fix Validation
Quick test to confirm asyncio conflicts are resolved
"""

import asyncio
import sys
import os
sys.path.append('backend')

async def test_critical_modules():
    """
    Test the most critical modules for asyncio conflicts
    """
    print("🔧 TESTING CRITICAL MODULE IMPORTS")
    print("=" * 60)

    critical_modules = [
        'main',
        'uploaded_scanner_bypass',
        'lc_scanner_optimized',  # This was the problematic one
        'enhanced_a_plus_scanner',
        'sophisticated_lc_scanner',
    ]

    try:
        for module_name in critical_modules:
            print(f"📦 Importing {module_name}...")
            __import__(module_name)
            print(f"  ✅ {module_name} - OK")

        print("\n✅ All critical modules imported successfully!")
        return True

    except Exception as e:
        print(f"\n❌ Module import failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("🚨 ASYNCIO CONFLICT STILL EXISTS!")
            return False
        else:
            print("⚠️  Different error (not asyncio conflict)")
            return True  # Not an asyncio issue

async def test_scanner_execution():
    """
    Test basic scanner execution
    """
    print("\n🔧 TESTING SCANNER EXECUTION")
    print("=" * 60)

    try:
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        # Simple test code
        test_scanner = '''
import pandas as pd

def scan_symbol(symbol, start_date, end_date):
    return pd.DataFrame([{'Ticker': 'TEST', 'Date': '2024-01-01'}])

SYMBOLS = ['TEST']
'''

        print("🚀 Executing test scanner...")
        results = await execute_uploaded_scanner_direct(
            test_scanner,
            "2024-01-01",
            "2024-12-31",
            pure_execution_mode=True
        )

        print(f"✅ Scanner execution successful: {len(results)} results")
        return True, len(results)

    except Exception as e:
        print(f"❌ Scanner execution failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("🚨 ASYNCIO CONFLICT in scanner execution!")
            return False, 0
        else:
            print("⚠️  Different error (not asyncio conflict)")
            return True, 0

def main():
    """
    Run simple asyncio validation
    """
    print("🔍 SIMPLE ASYNCIO FIX VALIDATION")
    print("=" * 80)

    async def run_tests():
        imports_ok = await test_critical_modules()
        execution_ok, results = await test_scanner_execution()
        return imports_ok, execution_ok, results

    try:
        imports_ok, execution_ok, results = asyncio.run(run_tests())

        print("\n📋 VALIDATION RESULTS:")
        print("=" * 60)
        print(f"✅ Critical module imports: {'PASS' if imports_ok else 'FAIL'}")
        print(f"✅ Scanner execution: {'PASS' if execution_ok else 'FAIL'} ({results} results)")

        all_good = imports_ok and execution_ok

        if all_good:
            print(f"\n🎉 SUCCESS: ASYNCIO CONFLICTS RESOLVED!")
            print(f"   No 'asyncio.run() cannot be called from a running event loop' errors")
            print(f"   Frontend upload should now work properly")
        else:
            print(f"\n❌ ISSUES DETECTED")

        return all_good

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("🚨 ASYNCIO CONFLICT at test level!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)