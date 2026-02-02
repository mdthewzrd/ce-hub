#!/usr/bin/env python3
"""
🔧 Complete Asyncio Event Loop Fix Test
Test that all asyncio.run() conflicts have been resolved
"""

import asyncio
import sys
import os
sys.path.append('backend')

async def test_main_py_imports():
    """
    Test that main.py can be imported without asyncio conflicts
    """
    print("🔧 TESTING MAIN.PY IMPORTS")
    print("=" * 70)

    try:
        # This simulates what FastAPI does when it starts up
        print("📦 Importing main.py modules (simulating FastAPI startup)...")

        # Import main.py - this will trigger all module-level imports
        import main

        print("✅ main.py imported successfully!")
        print(f"📊 SOPHISTICATED_MODE: {main.SOPHISTICATED_MODE}")
        print(f"📊 A_PLUS_MODE: {main.A_PLUS_MODE}")

        return True

    except Exception as e:
        print(f"❌ main.py import failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ CRITICAL: Asyncio event loop conflict still exists in imports!")
        return False

async def test_uploaded_scanner_execution():
    """
    Test uploaded scanner execution within event loop
    """
    print("\n🔧 TESTING UPLOADED SCANNER EXECUTION")
    print("=" * 70)

    try:
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        # Read the user's scanner
        scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
        with open(scanner_file, 'r') as f:
            uploaded_code = f.read()

        print(f"📄 Loaded scanner: {len(uploaded_code)} characters")
        print("🚀 Testing uploaded scanner execution...")

        # Progress callback
        async def progress_callback(percent, message):
            if percent % 20 == 0:  # Only show every 20%
                print(f"📊 Progress: {percent}% - {message}")

        # Execute the scanner
        results = await execute_uploaded_scanner_direct(
            uploaded_code,
            "2024-01-01",
            "2024-12-31",
            progress_callback,
            pure_execution_mode=True
        )

        print(f"✅ Uploaded scanner execution successful: {len(results)} results")
        return True, len(results)

    except Exception as e:
        print(f"❌ Uploaded scanner execution failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ CRITICAL: Asyncio conflict in uploaded scanner execution!")
        return False, 0

async def test_full_fastapi_simulation():
    """
    Test the complete FastAPI execution flow
    """
    print("\n🔧 TESTING FULL FASTAPI SIMULATION")
    print("=" * 70)

    try:
        # Import main modules (this is what FastAPI does)
        import main

        print("📋 Creating scan request (simulating frontend)...")

        # Create scan info like the frontend does
        scan_info = {
            "scan_id": "test_complete_fix",
            "scanner_type": "uploaded",
            "uploaded_code": open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py").read(),
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "status": "running",
            "progress_percent": 0,
            "message": "Starting scan..."
        }

        # Add to active scans (simulate FastAPI request)
        main.active_scans[scan_info["scan_id"]] = scan_info

        # Progress callback
        async def progress_callback(percent, message):
            if percent % 25 == 0:  # Show key milestones
                print(f"📊 FastAPI Progress: {percent}% - {message}")

        print("🚀 Executing via main.py run_real_scan_background...")

        # This is the exact function FastAPI calls
        await main.run_real_scan_background(
            scan_info["scan_id"],
            scan_info["start_date"],
            scan_info["end_date"]
        )

        print(f"✅ Full FastAPI simulation successful!")
        print(f"📊 Scan status: {scan_info['status']}")
        print(f"📊 Results: {scan_info.get('total_found', 0)}")

        return True, scan_info.get('total_found', 0)

    except Exception as e:
        print(f"❌ Full FastAPI simulation failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ CRITICAL: Asyncio conflict in full FastAPI flow!")
        return False, 0

def main():
    """
    Run complete asyncio fix validation
    """
    print("🔍 COMPLETE ASYNCIO EVENT LOOP FIX VALIDATION")
    print("=" * 80)
    print("Testing all fixes for asyncio.run() conflicts in FastAPI context")

    async def run_all_tests():
        # Test 1: Module imports
        imports_ok = await test_main_py_imports()

        # Test 2: Uploaded scanner execution
        scanner_ok, scanner_results = await test_uploaded_scanner_execution()

        # Test 3: Full FastAPI simulation
        fastapi_ok, fastapi_results = await test_full_fastapi_simulation()

        return imports_ok, scanner_ok, fastapi_ok, scanner_results, fastapi_results

    try:
        imports_ok, scanner_ok, fastapi_ok, scanner_results, fastapi_results = asyncio.run(run_all_tests())

        print("\n📋 COMPLETE FIX VALIDATION RESULTS:")
        print("=" * 80)
        print(f"✅ Module imports: {'FIXED' if imports_ok else 'BROKEN'}")
        print(f"✅ Scanner execution: {'FIXED' if scanner_ok else 'BROKEN'} ({scanner_results} results)")
        print(f"✅ FastAPI simulation: {'FIXED' if fastapi_ok else 'BROKEN'} ({fastapi_results} results)")

        all_fixed = imports_ok and scanner_ok and fastapi_ok

        if all_fixed:
            print(f"\n🎉 SUCCESS: ALL ASYNCIO EVENT LOOP CONFLICTS RESOLVED!")
            print(f"   The frontend should now work without any asyncio errors")
            print(f"   Uploaded scanners will execute properly in FastAPI context")
        else:
            print(f"\n❌ FAILURE: Some asyncio conflicts still exist")
            print(f"   Additional investigation required")

        return all_fixed

    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)