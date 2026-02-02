#!/usr/bin/env python3
"""
🔧 Test half A+ scanner with targeted date range matching VS Code results
"""

import requests
import json
import time

def test_targeted_execution():
    """Test with specific date ranges that should have results"""
    print("🔧 Testing Half A+ Scanner with Targeted Date Ranges")
    print("=" * 60)

    # Read the half A+ scanner
    scanner_file = "/Users/michaeldurante/Downloads/half A+ scan copy.py"
    try:
        with open(scanner_file, 'r') as f:
            half_a_plus_code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find scanner file: {scanner_file}")
        return False

    print(f"📄 Half A+ scanner: {len(half_a_plus_code)} characters")

    FORMAT_URL = "http://localhost:8000/api/format/code"
    SCAN_URL = "http://localhost:8000/api/scan/execute"

    # Format the code
    format_request = {
        "code": half_a_plus_code,
        "options": {"preserve_integrity": True}
    }

    format_response = requests.post(FORMAT_URL, json=format_request)
    if format_response.status_code != 200:
        print(f"❌ Formatting failed: {format_response.status_code}")
        return False

    format_result = format_response.json()
    print(f"✅ Formatting successful, integrity: {format_result['integrity_verified']}")

    # Test different date ranges based on VS Code results
    test_ranges = [
        # VS Code showed MSFT 2024-11-21, so test November 2024
        {"name": "November 2024", "start": "2024-11-01", "end": "2024-11-30"},
        # VS Code showed MSFT 2024-02-16, so test February 2024
        {"name": "February 2024", "start": "2024-02-01", "end": "2024-02-29"},
        # Test broader 2024 range
        {"name": "Full 2024", "start": "2024-01-01", "end": "2024-12-31"},
    ]

    for test_range in test_ranges:
        print(f"\n🚀 Testing {test_range['name']} ({test_range['start']} to {test_range['end']})...")

        scan_request = {
            "start_date": test_range['start'],
            "end_date": test_range['end'],
            "scanner_type": "uploaded",
            "uploaded_code": format_result['formatted_code'],
            "use_real_scan": True
        }

        execution_start = time.time()
        scan_response = requests.post(SCAN_URL, json=scan_request)

        if scan_response.status_code == 200:
            scan_result = scan_response.json()
            print(f"   ✅ Scan started: {scan_result['scan_id']}")

            # Monitor execution
            STATUS_URL = f"http://localhost:8000/api/scan/status/{scan_result['scan_id']}"

            for check in range(10):  # Check for 50 seconds max
                time.sleep(5)

                try:
                    status_response = requests.get(STATUS_URL)
                    if status_response.status_code == 200:
                        status = status_response.json()
                        elapsed = time.time() - execution_start

                        print(f"   📊 Check {check+1}: {status['status']} ({status.get('progress_percent', 0)}%) - {elapsed:.1f}s")

                        if status['status'] == 'completed':
                            results = status.get('results', [])
                            print(f"   🎯 COMPLETED: {len(results)} results in {elapsed:.1f}s")

                            if len(results) > 0:
                                print(f"   🎉 SUCCESS! Found results:")
                                for i, result in enumerate(results[:5]):
                                    print(f"      {i+1}. {result.get('ticker', 'N/A')} on {result.get('date', 'N/A')}")
                                return True
                            else:
                                print(f"   ⚠️  No results in this date range")
                            break

                        elif status['status'] == 'error':
                            print(f"   ❌ Error: {status.get('error', 'Unknown error')}")
                            break

                except Exception as e:
                    print(f"   ❌ Status check error: {e}")
                    break

            if elapsed < 10:
                print(f"   ⚠️  Execution too fast ({elapsed:.1f}s) - may indicate pattern issues")

        else:
            print(f"   ❌ Scan failed: {scan_response.status_code}")

    return False

if __name__ == "__main__":
    success = test_targeted_execution()
    print(f"\n📋 Targeted Date Range Test: {'✅ SUCCESS' if success else '❌ NO RESULTS FOUND'}")

    if not success:
        print(f"\n🔧 Next Steps:")
        print(f"   1. Check if Pattern 2 is being detected correctly")
        print(f"   2. Verify main block variable extraction")
        print(f"   3. Compare with VS Code execution parameters")
        print(f"   4. Check if custom_params are being applied correctly")