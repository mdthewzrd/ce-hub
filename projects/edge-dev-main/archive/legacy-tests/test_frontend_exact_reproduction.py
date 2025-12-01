#!/usr/bin/env python3
"""
🔧 Frontend Exact Reproduction Test
Test the exact execution path that the frontend uses through the FastAPI scan endpoint
"""

import asyncio
import sys
import os
sys.path.append('backend')

async def test_frontend_exact_path():
    """
    Test the exact code path that the frontend uses
    """
    print("🔧 TESTING FRONTEND EXACT EXECUTION PATH")
    print("=" * 70)

    try:
        # Import main.py modules (this is what FastAPI loads)
        from main import run_scan_task  # This is the actual endpoint function

        # Read the user's scanner
        scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
        with open(scanner_file, 'r') as f:
            uploaded_code = f.read()

        print(f"📄 Loaded uploaded scanner: {len(uploaded_code)} characters")

        # Create scan info exactly like the frontend does
        scan_info = {
            "scan_id": "test_frontend_scan",
            "scanner_type": "uploaded",  # This should trigger uploaded scanner path
            "uploaded_code": uploaded_code,
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "status": "running",
            "progress_percent": 0,
            "message": "Starting scan..."
        }

        print(f"📋 Scan info created:")
        print(f"   - scanner_type: {scan_info['scanner_type']}")
        print(f"   - uploaded_code length: {len(scan_info['uploaded_code'])}")
        print(f"   - date range: {scan_info['start_date']} to {scan_info['end_date']}")

        # Progress callback simulation
        async def progress_callback(percent, message):
            print(f"📊 Progress: {percent}% - {message}")

        print("\n🚀 Executing via main.py run_scan_task (exact frontend path)...")

        # This is the EXACT call that FastAPI makes
        await run_scan_task(
            scan_info["scan_id"],
            scan_info,
            progress_callback
        )

        print(f"\n✅ Frontend exact path successful!")
        print(f"📊 Scan status: {scan_info['status']}")
        print(f"📊 Results: {scan_info.get('total_found', 0)}")

        if scan_info.get('results'):
            print(f"📈 Sample results:")
            for i, result in enumerate(scan_info['results'][:3]):
                print(f"   {i+1}. {result.get('ticker')} on {result.get('date')}")

        return True, scan_info.get('total_found', 0)

    except Exception as e:
        print(f"\n❌ Frontend exact path failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ CRITICAL: Asyncio event loop conflict in main.py execution path!")
            print("   The issue is in the main.py routing logic, not uploaded_scanner_bypass.py")
        return False, 0

def main():
    """
    Run exact frontend reproduction test
    """
    print("🔍 FRONTEND EXACT REPRODUCTION TEST")
    print("=" * 80)
    print("Testing the exact execution path that causes the frontend error")

    try:
        # Run within an event loop to simulate FastAPI's async context
        success, results_count = asyncio.run(test_frontend_exact_path())

        print("\n📋 FRONTEND EXACT REPRODUCTION RESULTS:")
        print("=" * 80)

        if success:
            print(f"✅ SUCCESS: Frontend exact path test PASSED")
            print(f"📊 Scanner executed successfully with {results_count} results")
            print(f"🎉 Issue has been resolved in the main execution path!")
        else:
            print(f"❌ FAILURE: Frontend exact path test FAILED")
            print(f"❌ The asyncio conflict exists in the main.py execution chain")
            print(f"🔍 Need to investigate the main.py routing logic")

        return success

    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        if "asyncio.run() cannot be called from a running event loop" in str(e):
            print("❌ CONFIRMED: The asyncio conflict is in the main execution path")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)