#!/usr/bin/env python3
"""
🔧 FastAPI Context Fix Test
Test the asyncio fix in the actual FastAPI execution context
"""

import asyncio
import sys
import os
sys.path.append('backend')

async def simulate_fastapi_scan_endpoint():
    """
    Simulate the exact FastAPI scan endpoint execution flow
    """
    print("🚀 SIMULATING FASTAPI SCAN ENDPOINT")
    print("=" * 70)

    try:
        # Import the main.py modules that would be loaded in FastAPI
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        # Read the user's actual scanner
        scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
        with open(scanner_file, 'r') as f:
            uploaded_code = f.read()

        print(f"📄 Loaded uploaded scanner: {len(uploaded_code)} characters")

        # Simulate the exact API call parameters
        start_date = "2024-01-01"
        end_date = "2024-12-31"
        pure_execution_mode = True

        print(f"📅 Date range: {start_date} to {end_date}")
        print(f"🎯 Pure execution mode: {pure_execution_mode}")

        # Progress callback simulation
        async def progress_callback(percent, message):
            print(f"📊 Progress: {percent}% - {message}")

        print("\n🚀 Executing scanner via FastAPI simulation...")

        # This is the exact call that FastAPI would make
        results = await execute_uploaded_scanner_direct(
            uploaded_code,
            start_date,
            end_date,
            progress_callback,
            pure_execution_mode=pure_execution_mode
        )

        print(f"\n✅ FastAPI simulation successful!")
        print(f"📊 Results returned: {len(results)}")

        if results:
            print(f"📈 Sample results:")
            for i, result in enumerate(results[:3]):
                print(f"   {i+1}. {result.get('ticker')} on {result.get('date')}")

        return True, len(results)

    except Exception as e:
        print(f"\n❌ FastAPI simulation failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ CRITICAL: Asyncio event loop conflict detected!")
            print("   The fix did not resolve the issue completely.")
        return False, 0

def main():
    """
    Run FastAPI context test
    """
    print("🔍 FASTAPI CONTEXT ASYNCIO FIX TEST")
    print("=" * 80)
    print("Testing the actual execution flow that FastAPI uses")

    try:
        # Run within an event loop to simulate FastAPI's async context
        success, results_count = asyncio.run(simulate_fastapi_scan_endpoint())

        print("\n📋 FASTAPI CONTEXT TEST RESULTS:")
        print("=" * 80)

        if success:
            print(f"✅ SUCCESS: FastAPI context test PASSED")
            print(f"📊 Scanner executed successfully with {results_count} results")
            print(f"🎉 Asyncio event loop conflict has been RESOLVED!")
            print("\nThe frontend should now work without asyncio errors.")
        else:
            print(f"❌ FAILURE: FastAPI context test FAILED")
            print(f"❌ The asyncio conflict still exists in the execution chain")

        return success

    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        print(f"\n🎉 ASYNCIO EVENT LOOP CONFLICT FIX: COMPLETE")
        print(f"   The uploaded scanner system is now compatible with FastAPI")
    else:
        print(f"\n❌ ASYNCIO EVENT LOOP CONFLICT FIX: INCOMPLETE")
        print(f"   Additional investigation required")

    sys.exit(0 if success else 1)