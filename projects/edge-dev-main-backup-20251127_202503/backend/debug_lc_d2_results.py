#!/usr/bin/env python3
"""
Debug LC D2 results to see the actual data structure and fix date filtering
"""

import asyncio
from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def debug_lc_d2_results():
    print("🔍 Debugging LC D2 results structure...")

    # Read the LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    # Execute the scanner with wide date range
    results = await execute_uploaded_scanner_direct(
        code=scanner_code,
        start_date='2020-01-01',  # Wide range to capture everything
        end_date='2025-12-31',
        progress_callback=None,
        pure_execution_mode=True
    )

    print(f"\n📊 LC D2 Debug Results:")
    print(f"   Total results: {len(results)}")
    print(f"   Results type: {type(results)}")

    if results:
        print(f"\n🔍 First 3 results structure:")
        for i, result in enumerate(results[:3]):
            print(f"\nResult {i+1}:")
            print(f"   Type: {type(result)}")
            if isinstance(result, dict):
                print(f"   Keys: {list(result.keys())}")
                for key, value in result.items():
                    print(f"   {key}: {repr(value)} ({type(value).__name__})")
            else:
                print(f"   Value: {result}")

        # Check for different date field formats
        date_fields_found = set()
        for result in results[:10]:  # Check first 10
            if isinstance(result, dict):
                for key in result.keys():
                    if any(date_word in key.lower() for date_word in ['date', 'time', 'day']):
                        date_fields_found.add(key)

        print(f"\n📅 Date-related fields found: {list(date_fields_found)}")

        # Show sample values for date fields
        if date_fields_found:
            sample_result = results[0] if isinstance(results[0], dict) else None
            if sample_result:
                for field in date_fields_found:
                    if field in sample_result:
                        print(f"   {field} sample: {repr(sample_result[field])}")
    else:
        print("❌ No results returned from LC D2 scanner")

if __name__ == "__main__":
    asyncio.run(debug_lc_d2_results())