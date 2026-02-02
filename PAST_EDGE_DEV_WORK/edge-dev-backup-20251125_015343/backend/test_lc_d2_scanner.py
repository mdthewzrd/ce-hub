#!/usr/bin/env python3
"""
Test the LC D2 scanner to ensure it works with the DataFrame fix
"""

import asyncio
from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_lc_d2_scanner():
    print("🔍 Testing LC D2 scanner with DataFrame fix...")

    # Read the LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    print("\n🚀 Testing LC D2 scanner execution...")

    # Execute the scanner
    results = await execute_uploaded_scanner_direct(
        code=scanner_code,
        start_date='2025-01-01',
        end_date='2025-11-07',
        progress_callback=None,
        pure_execution_mode=True
    )

    print(f"\n📊 LC D2 Results:")
    print(f"   Total results: {len(results)}")
    print(f"   Results type: {type(results)}")

    if results:
        print(f"\n🎯 First few results:")
        for i, result in enumerate(results[:3]):
            if isinstance(result, dict):
                print(f"   Result {i}: {result.get('ticker', 'N/A')} {result.get('date', 'N/A')}")
            else:
                print(f"   Result {i}: {type(result)} - {result}")

        # Check for 2025 results specifically
        results_2025 = [r for r in results if isinstance(r, dict) and '2025' in str(r.get('date', ''))]
        print(f"\n✅ Results in 2025: {len(results_2025)}")

        if results_2025:
            print("🎯 2025 results sample:")
            for result in results_2025[:3]:
                print(f"   - {result.get('ticker', 'N/A')} on {result.get('date', 'N/A')}")
        else:
            print("❌ No 2025 results found - may be expected if scanner finds results in other years")
    else:
        print("❌ No results returned from LC D2 scanner")

if __name__ == "__main__":
    asyncio.run(test_lc_d2_scanner())