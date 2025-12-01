#!/usr/bin/env python3
"""
🔧 Test the stdout capture fix for half A+ scanner
"""

import asyncio
import sys
sys.path.append('backend')

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_stdout_capture():
    print("🔧 Testing stdout capture fix for half A+ scanner")
    print("=" * 60)

    # Read the half A+ scanner
    scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
    try:
        with open(scanner_file, 'r') as f:
            half_a_plus_code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find scanner file: {scanner_file}")
        return False

    print(f"📄 Loaded half A+ scanner: {len(half_a_plus_code)} characters")

    try:
        # Test with the backend function that should now capture stdout
        results = await execute_uploaded_scanner_direct(
            half_a_plus_code,
            "2024-01-01",
            "2024-12-31",
            pure_execution_mode=True
        )

        print(f"\n✅ Backend execution completed!")
        print(f"📊 Results found: {len(results)}")

        if results:
            print(f"📈 Sample results:")
            for i, result in enumerate(results[:5]):
                print(f"   {i+1}. {result}")
            return True
        else:
            print(f"⚠️  No results captured - fix may need refinement")
            return False

    except Exception as e:
        print(f"❌ Backend execution failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_stdout_capture())
    print(f"\n📋 Stdout Capture Fix Test: {'✅ SUCCESS' if success else '❌ FAILED'}")