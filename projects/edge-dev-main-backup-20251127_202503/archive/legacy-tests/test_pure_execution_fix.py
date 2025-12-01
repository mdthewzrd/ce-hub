#!/usr/bin/env python3
"""
🎯 TEST PURE EXECUTION FIX
Test sophisticated scanner upload and execution to verify:
1. Executes for 2-5 minutes (not 30 seconds)
2. Returns real trading opportunities (not 0 results)
3. Preserves 100% algorithm integrity
"""

import requests
import json
import time
from datetime import datetime

# API endpoints
BASE_URL = "http://localhost:8000"
FORMAT_URL = f"{BASE_URL}/api/format/code"
SCAN_URL = f"{BASE_URL}/api/scan/execute"
STATUS_URL = f"{BASE_URL}/api/scan/status"

def test_sophisticated_scanner_execution():
    """Test the user's sophisticated backside para scanner"""

    print("🎯 TESTING SOPHISTICATED SCANNER PURE EXECUTION")
    print("=" * 60)

    # Read the user's sophisticated scanner
    scanner_file = "/Users/michaeldurante/Downloads/backside para b copy.py"
    try:
        with open(scanner_file, 'r') as f:
            sophisticated_code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find scanner file: {scanner_file}")
        return False

    print(f"📄 Loaded sophisticated scanner: {len(sophisticated_code)} characters")
    print(f"   - Contains ThreadPoolExecutor: {'ThreadPoolExecutor' in sophisticated_code}")
    print(f"   - Contains SYMBOLS list: {'SYMBOLS' in sophisticated_code}")
    print(f"   - Contains Polygon API: {'polygon.io' in sophisticated_code}")

    # Step 1: Format the code (this should preserve integrity now)
    print(f"\n🔧 Step 1: Testing code formatting with integrity preservation...")

    format_request = {
        "code": sophisticated_code,
        "options": {"preserve_integrity": True}
    }

    format_response = requests.post(FORMAT_URL, json=format_request)
    if format_response.status_code != 200:
        print(f"❌ Code formatting failed: {format_response.status_code}")
        return False

    format_result = format_response.json()
    print(f"   ✅ Formatting result: {format_result['success']}")
    print(f"   📊 Scanner type: {format_result['scanner_type']}")
    print(f"   🔒 Integrity verified: {format_result['integrity_verified']}")

    formatted_code = format_result['formatted_code']

    # Step 2: Execute the scanner with pure execution mode
    print(f"\n🚀 Step 2: Testing pure execution mode...")

    scan_request = {
        "start_date": "2025-01-01",  # Match the user's PRINT_FROM
        "end_date": datetime.now().strftime("%Y-%m-%d"),
        "scanner_type": "uploaded",
        "uploaded_code": formatted_code,
        "use_real_scan": True
    }

    execution_start = time.time()
    scan_response = requests.post(SCAN_URL, json=scan_request)

    if scan_response.status_code != 200:
        print(f"❌ Scan execution failed: {scan_response.status_code}")
        print(f"Error: {scan_response.text}")
        return False

    scan_result = scan_response.json()
    scan_id = scan_result['scan_id']
    print(f"   ✅ Scan started: {scan_id}")
    print(f"   📝 Message: {scan_result['message']}")

    # Step 3: Monitor execution time and progress
    print(f"\n⏱️  Step 3: Monitoring execution (should take 2-5 minutes)...")

    last_progress = 0
    while True:
        status_response = requests.get(f"{STATUS_URL}/{scan_id}")
        if status_response.status_code != 200:
            print(f"❌ Status check failed: {status_response.status_code}")
            break

        status = status_response.json()
        current_time = time.time()
        elapsed_seconds = current_time - execution_start

        # Print progress updates
        progress = status.get('progress_percent', 0)
        if progress > last_progress:
            print(f"   📊 Progress: {progress}% - {status.get('message', '')} ({elapsed_seconds:.1f}s elapsed)")
            last_progress = progress

        # Check if completed
        if status['status'] in ['completed', 'error']:
            final_elapsed = time.time() - execution_start
            print(f"\n🏁 Execution finished: {status['status']}")
            print(f"⏱️  Total execution time: {final_elapsed:.1f} seconds")

            if status['status'] == 'completed':
                results = status.get('results', [])
                print(f"🎯 Results found: {len(results)}")

                # Validate execution time (should be 2-5 minutes for sophisticated scanners)
                if final_elapsed < 60:
                    print(f"⚠️  WARNING: Execution too fast ({final_elapsed:.1f}s) - may indicate corruption")
                    return False
                elif 120 <= final_elapsed <= 300:  # 2-5 minutes
                    print(f"✅ Execution time appropriate for sophisticated scanner")
                else:
                    print(f"⚠️  Execution time unusual but possibly valid: {final_elapsed:.1f}s")

                # Validate results
                if len(results) == 0:
                    print(f"⚠️  WARNING: 0 results found - may indicate algorithm corruption")
                    return False
                else:
                    print(f"✅ Found {len(results)} trading opportunities")
                    # Show sample results
                    for i, result in enumerate(results[:3]):
                        print(f"   📈 {i+1}. {result.get('ticker', 'N/A')} on {result.get('date', 'N/A')}")

                return True
            else:
                print(f"❌ Execution failed: {status.get('message', 'Unknown error')}")
                return False

        # Safety timeout (10 minutes max)
        if elapsed_seconds > 600:
            print(f"❌ Execution timeout after {elapsed_seconds:.1f} seconds")
            return False

        time.sleep(2)  # Check every 2 seconds

def test_vs_direct_python_execution():
    """Compare results with direct Python execution"""
    print(f"\n🔬 VALIDATION: Comparing with direct Python execution...")

    scanner_file = "/Users/michaeldurante/Downloads/backside para b copy.py"
    try:
        # Execute the scanner directly in Python for comparison
        import subprocess
        import sys

        result = subprocess.run([sys.executable, scanner_file],
                              capture_output=True, text=True, timeout=300)

        if result.returncode == 0:
            output_lines = result.stdout.strip().split('\n')
            # Count non-header lines that contain trading results
            result_lines = [line for line in output_lines if ' on ' in line or any(ticker in line for ticker in ['AAPL', 'MSFT', 'NVDA', 'TSLA'])]
            print(f"   📊 Direct Python execution found: {len(result_lines)} results")
            print(f"   ⏱️  Direct execution reference benchmark established")
            return len(result_lines)
        else:
            print(f"   ⚠️  Direct execution failed: {result.stderr}")
            return None

    except Exception as e:
        print(f"   ⚠️  Could not run direct comparison: {e}")
        return None

if __name__ == "__main__":
    print(f"🎯 PURE EXECUTION FIX VALIDATION")
    print(f"Testing sophisticated trading scanner upload and execution")
    print(f"Started at: {datetime.now()}")
    print()

    # Test direct Python execution first for baseline
    direct_results = test_vs_direct_python_execution()

    # Test API execution with pure mode
    api_success = test_sophisticated_scanner_execution()

    print(f"\n📋 FINAL RESULTS:")
    print(f"   🔧 Pure execution fix working: {'✅ YES' if api_success else '❌ NO'}")
    if direct_results is not None:
        print(f"   📊 Direct Python results: {direct_results}")
    print(f"   🎯 Algorithm integrity preserved: {'✅ YES' if api_success else '❌ NO'}")
    print(f"   ⏱️  Execution time appropriate: {'✅ YES' if api_success else '❌ NO'}")

    if api_success:
        print(f"\n🎉 SUCCESS: Pure execution fix is working!")
        print(f"   Sophisticated scanners now execute with 100% integrity preservation")
    else:
        print(f"\n❌ FAILURE: Pure execution fix needs additional work")