#!/usr/bin/env python3
"""
Debug script to understand the exact format of scanner results and date filtering
"""

import asyncio
import json
from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def debug_date_filtering():
    print("🔍 Debugging date filtering issue...")

    # Read the actual Backside Para B scanner code
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ Scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load scanner code: {e}")
        return

    print("\n🚀 Testing scanner execution with debug output...")

    # Execute the scanner
    results = await execute_uploaded_scanner_direct(
        code=scanner_code,
        start_date='2025-01-01',
        end_date='2025-11-07',
        progress_callback=None,
        pure_execution_mode=True
    )

    print(f"\n📊 Raw results length: {len(results)}")
    print(f"📊 Results type: {type(results)}")

    if results:
        print(f"\n🔍 First result analysis:")
        first_result = results[0]
        print(f"   Type: {type(first_result)}")
        print(f"   Content: {first_result}")

        if isinstance(first_result, dict):
            print(f"   Keys: {list(first_result.keys())}")
            for key, value in first_result.items():
                print(f"     {key}: {value} (type: {type(value)})")

        print(f"\n🔍 All results preview:")
        for i, result in enumerate(results[:3]):  # First 3 results
            print(f"   Result {i}: {result}")
    else:
        print("❌ No results returned")

if __name__ == "__main__":
    asyncio.run(debug_date_filtering())