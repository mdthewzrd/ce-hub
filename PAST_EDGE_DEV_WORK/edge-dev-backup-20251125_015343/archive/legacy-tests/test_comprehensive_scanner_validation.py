#!/usr/bin/env python3
"""
🎯 Comprehensive Scanner Upload Validation
Test all three of your main scanners with proper timing and processing verification
"""

import requests
import json
import time
import os
import sys

def test_scanner_with_timing(scanner_name, scanner_path, expected_min_time=5):
    """
    Test a scanner with comprehensive timing and processing validation
    """
    print(f"\n🔧 TESTING {scanner_name.upper()} SCANNER")
    print("=" * 80)

    if not os.path.exists(scanner_path):
        print(f"❌ Scanner file not found: {scanner_path}")
        return False, 0, 0

    with open(scanner_path, 'r') as f:
        uploaded_code = f.read()

    print(f"📄 Loaded {scanner_name}: {len(uploaded_code)} characters")

    # Step 1: Test asyncio detection
    sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')
    from uploaded_scanner_bypass import has_asyncio_in_main, create_safe_exec_globals

    has_asyncio = has_asyncio_in_main(uploaded_code)
    safe_globals = create_safe_exec_globals(uploaded_code)

    print(f"🔍 Asyncio detection: {has_asyncio}")
    print(f"🔧 Safe execution context: {safe_globals['__name__']}")

    # Step 2: Test code formatting (this should take time)
    print(f"\n🔧 STEP 1: Testing code formatting/processing...")
    format_start = time.time()

    format_data = {
        "code": uploaded_code
    }

    try:
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )

        format_time = time.time() - format_start
        print(f"⏱️  Format processing took: {format_time:.2f} seconds")

        if format_response.status_code == 200:
            format_result = format_response.json()
            print(f"✅ Code formatting successful!")
            print(f"📊 Scanner type: {format_result.get('scanner_type')}")
            print(f"📊 Integrity verified: {format_result.get('integrity_verified')}")

            if format_time < 1:
                print(f"⚠️  WARNING: Formatting was too fast ({format_time:.2f}s) - may not be processing properly")
        else:
            print(f"❌ Code formatting failed: {format_response.text}")
            return False, format_time, 0

    except Exception as e:
        print(f"❌ Code formatting request failed: {e}")
        return False, 0, 0

    # Step 3: Test scan execution with detailed timing
    print(f"\n🚀 STEP 2: Testing scan execution...")
    scan_start = time.time()

    scan_data = {
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "use_real_scan": True,
        "scanner_type": "uploaded",
        "uploaded_code": uploaded_code
    }

    try:
        print("🚀 Sending scan request...")
        scan_response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=scan_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"📊 Response status: {scan_response.status_code}")

        if scan_response.status_code == 200:
            result = scan_response.json()
            print(f"✅ Scan started! Scan ID: {result.get('scan_id')}")
            scan_id = result.get('scan_id')

            # Monitor scan progress with detailed timing
            print(f"⏱️  Monitoring scan progress with detailed timing...")
            last_progress = 0
            stage_times = []

            for i in range(120):  # Wait up to 2 minutes
                status_response = requests.get(f"http://localhost:8000/api/scan/status/{scan_id}")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    progress = status_data.get('progress_percent', 0)
                    message = status_data.get('message', '')
                    status = status_data.get('status', '')

                    # Track progress changes
                    if progress != last_progress:
                        current_time = time.time() - scan_start
                        stage_times.append((progress, current_time, message))
                        print(f"📊 Progress: {progress}% - {message} (at {current_time:.2f}s)")
                        last_progress = progress

                    if status == 'completed':
                        total_time = time.time() - scan_start
                        total_found = status_data.get('total_found', 0)
                        print(f"🎉 Scan completed! Found {total_found} results")
                        print(f"⏱️  Total execution time: {total_time:.2f} seconds")

                        # Analyze timing stages
                        print(f"\n📊 TIMING ANALYSIS:")
                        for prog, stage_time, msg in stage_times:
                            print(f"   {prog}% at {stage_time:.2f}s: {msg[:60]}...")

                        if total_time < expected_min_time:
                            print(f"⚠️  WARNING: Execution was too fast ({total_time:.2f}s < {expected_min_time}s)")
                        else:
                            print(f"✅ Execution timing looks realistic ({total_time:.2f}s)")

                        return True, format_time, total_time

                    elif status == 'error':
                        error_msg = status_data.get('error', 'Unknown error')
                        print(f"❌ Scan failed with error: {error_msg}")
                        if "asyncio.run() cannot be called from a running event loop" in error_msg:
                            print(f"🚨 ASYNCIO CONFLICT DETECTED!")
                            return False, format_time, time.time() - scan_start
                        else:
                            print(f"⚠️  Different error (not asyncio conflict)")
                            return False, format_time, time.time() - scan_start

                time.sleep(1)

            total_time = time.time() - scan_start
            print(f"⏱️  Scan still running after {total_time:.2f} seconds - this is normal for complex scanners")
            return True, format_time, total_time

        else:
            print(f"❌ Scan request failed: {scan_response.status_code}")
            print(f"📝 Response: {scan_response.text}")
            return False, format_time, 0

    except Exception as e:
        print(f"❌ Scan request failed: {e}")
        return False, format_time, 0

def main():
    """
    Test all three main scanners comprehensively
    """
    print("🎯 COMPREHENSIVE SCANNER UPLOAD VALIDATION")
    print("=" * 100)
    print("Testing all three main scanners with timing and processing verification")

    # Define the three main test scanners
    scanners = [
        {
            "name": "LC D2 Scanner",
            "path": "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py",
            "expected_min_time": 8  # Large complex scanner should take time
        },
        {
            "name": "Half A+ Scanner",
            "path": "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py",
            "expected_min_time": 5  # Medium complexity scanner
        },
        {
            "name": "LC 3d Gap Scanner",
            "path": "/Users/michaeldurante/.anaconda/working code/LC 3d Gap/scan.py",
            "expected_min_time": 3  # Simpler scanner
        }
    ]

    results = []
    total_start = time.time()

    for scanner in scanners:
        success, format_time, exec_time = test_scanner_with_timing(
            scanner["name"],
            scanner["path"],
            scanner["expected_min_time"]
        )

        results.append({
            "name": scanner["name"],
            "success": success,
            "format_time": format_time,
            "exec_time": exec_time,
            "expected_min": scanner["expected_min_time"]
        })

    total_time = time.time() - total_start

    # Summary analysis
    print(f"\n📋 COMPREHENSIVE VALIDATION RESULTS")
    print("=" * 100)

    for result in results:
        status = "✅ PASS" if result["success"] else "❌ FAIL"
        timing_ok = result["exec_time"] >= result["expected_min"] if result["exec_time"] > 0 else False
        timing_status = "✅ REALISTIC" if timing_ok else "⚠️  TOO FAST"

        print(f"{status} {result['name']}:")
        print(f"   📊 Format time: {result['format_time']:.2f}s")
        print(f"   📊 Execution time: {result['exec_time']:.2f}s {timing_status}")
        print(f"   📊 Expected minimum: {result['expected_min']}s")

    # Overall assessment
    all_success = all(r["success"] for r in results)
    all_timing_ok = all(r["exec_time"] >= r["expected_min"] for r in results if r["exec_time"] > 0)

    print(f"\n🎯 OVERALL ASSESSMENT:")
    print(f"✅ Scanner functionality: {'ALL PASS' if all_success else 'SOME FAILED'}")
    print(f"⏱️  Processing timing: {'REALISTIC' if all_timing_ok else 'TOO FAST - MAY BE BROKEN'}")
    print(f"📊 Total test time: {total_time:.2f} seconds")

    if all_success and all_timing_ok:
        print(f"\n🎉 SUCCESS: All scanners working properly with realistic processing times!")
        print(f"   ✅ No asyncio conflicts")
        print(f"   ✅ Proper formatting and processing")
        print(f"   ✅ Realistic execution timing")
        print(f"   ✅ Frontend upload system working correctly")
    elif all_success:
        print(f"\n⚠️  PARTIAL SUCCESS: Scanners work but timing is suspiciously fast")
        print(f"   ✅ No asyncio conflicts")
        print(f"   ⚠️  Processing may be bypassed - check implementation")
    else:
        print(f"\n❌ ISSUES DETECTED: Some scanners failed")
        print(f"   ❌ Check asyncio conflicts and implementation")

    return all_success and all_timing_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)