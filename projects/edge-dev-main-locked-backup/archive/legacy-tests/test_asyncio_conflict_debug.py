#!/usr/bin/env python3
"""
🔧 Asyncio Event Loop Conflict Debug
Test to reproduce the exact error pattern from frontend
"""

import asyncio
import sys
import os
sys.path.append('backend')

async def test_frontend_api_call():
    """
    Simulate the exact API call that's causing the asyncio conflict
    """
    print("🔧 Testing Frontend API Call Pattern")
    print("=" * 60)

    # Import the exact modules that the frontend API uses
    try:
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        # Read the half A+ scanner (same as frontend)
        scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
        with open(scanner_file, 'r') as f:
            half_a_plus_code = f.read()

        print(f"📄 Loaded scanner: {len(half_a_plus_code)} characters")

        # Execute the exact same call that frontend makes
        print("🚀 Calling execute_uploaded_scanner_direct...")

        results = await execute_uploaded_scanner_direct(
            half_a_plus_code,
            "2024-01-01",
            "2024-12-31",
            pure_execution_mode=True
        )

        print(f"✅ SUCCESS: {len(results)} results returned")
        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("🔍 CONFIRMED: This is the asyncio event loop conflict!")
        return False

def test_sync_wrapper():
    """
    Test if the issue is in sync wrapper pattern
    """
    print("\n🔧 Testing Sync Wrapper Pattern")
    print("=" * 60)

    try:
        # This should fail with the same error if there's an asyncio.run() call
        result = asyncio.run(test_frontend_api_call())
        print(f"✅ Sync wrapper test: {'PASSED' if result else 'FAILED'}")
        return result
    except Exception as e:
        print(f"❌ Sync wrapper failed: {e}")
        return False

async def test_in_existing_loop():
    """
    Test running in an existing event loop (like FastAPI)
    """
    print("\n🔧 Testing In Existing Event Loop")
    print("=" * 60)

    try:
        # This simulates the FastAPI context
        result = await test_frontend_api_call()
        print(f"✅ Existing loop test: {'PASSED' if result else 'FAILED'}")
        return result
    except Exception as e:
        print(f"❌ Existing loop failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("🎯 FOUND THE ISSUE: asyncio.run() called within existing loop!")
        return False

def main():
    """
    Run comprehensive asyncio conflict testing
    """
    print("🔍 ASYNCIO EVENT LOOP CONFLICT DEBUGGING")
    print("=" * 80)

    # Test 1: Sync wrapper (should work)
    sync_result = test_sync_wrapper()

    # Test 2: Existing loop (should reproduce the error)
    async def run_existing_loop_test():
        return await test_in_existing_loop()

    try:
        existing_loop_result = asyncio.run(run_existing_loop_test())
    except Exception as e:
        print(f"❌ Failed to run existing loop test: {e}")
        existing_loop_result = False

    print("\n📋 RESULTS SUMMARY:")
    print("=" * 60)
    print(f"✅ Sync wrapper test: {'PASSED' if sync_result else 'FAILED'}")
    print(f"✅ Existing loop test: {'PASSED' if existing_loop_result else 'FAILED'}")

    if not existing_loop_result:
        print("\n🎯 DIAGNOSIS: asyncio.run() conflict confirmed in existing event loop context")
        print("   This matches the FastAPI execution environment where the error occurs.")

if __name__ == "__main__":
    main()