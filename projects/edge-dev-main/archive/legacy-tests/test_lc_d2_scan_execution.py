#!/usr/bin/env python3
"""
🔍 Test LC D2 Scan Execution Failure
====================================

Test the actual scan execution API call to see why LC D2 fails
but other scanners work.
"""

import requests
import json
import time

def test_scan_execution():
    """Test scan execution API for both scanners"""

    print("🔍 Testing LC D2 Scan Execution vs Working Scanner")
    print("=" * 60)

    # Load both scanners
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"
    working_file = "/Users/michaeldurante/Downloads/backside para b copy.py"

    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    with open(working_file, 'r') as f:
        working_code = f.read()

    # Test scan execution endpoint
    scan_url = "http://localhost:8000/api/scan/execute"

    # Test 1: Working scanner
    print(f"\n✅ Testing Working Scanner Execution:")

    working_scan_request = {
        "scanner_type": "uploaded",
        "uploaded_code": working_code,
        "start_date": "2025-10-01",
        "end_date": "2025-11-01",
        "use_real_scan": True,
        "filters": {"scan_type": "uploaded_scanner"}
    }

    try:
        print(f"   Sending scan request...")
        working_response = requests.post(scan_url, json=working_scan_request, timeout=30)
        print(f"   Status: {working_response.status_code}")

        if working_response.status_code == 200:
            working_data = working_response.json()
            print(f"   Success: {working_data.get('success', 'Unknown')}")
            print(f"   Scan ID: {working_data.get('scan_id', 'None')}")
            print(f"   Message: {working_data.get('message', 'No message')}")
        else:
            print(f"   Failed: {working_response.text}")

    except Exception as e:
        print(f"   Error: {e}")

    # Test 2: LC D2 scanner
    print(f"\n❌ Testing LC D2 Scanner Execution:")

    lc_d2_scan_request = {
        "scanner_type": "uploaded",
        "uploaded_code": lc_d2_code,
        "start_date": "2025-10-01",
        "end_date": "2025-11-01",
        "use_real_scan": True,
        "filters": {"scan_type": "uploaded_scanner"}
    }

    try:
        print(f"   Sending scan request...")
        lc_d2_response = requests.post(scan_url, json=lc_d2_scan_request, timeout=120)
        print(f"   Status: {lc_d2_response.status_code}")

        if lc_d2_response.status_code == 200:
            lc_d2_data = lc_d2_response.json()
            print(f"   Success: {lc_d2_data.get('success', 'Unknown')}")
            print(f"   Scan ID: {lc_d2_data.get('scan_id', 'None')}")
            print(f"   Message: {lc_d2_data.get('message', 'No message')}")

            # If successful, try to get status
            if lc_d2_data.get('success') and lc_d2_data.get('scan_id'):
                scan_id = lc_d2_data['scan_id']
                print(f"   Checking scan status...")

                time.sleep(2)  # Wait a moment
                status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
                status_response = requests.get(status_url, timeout=5)

                if status_response.status_code == 200:
                    status_data = status_response.json()
                    print(f"   Scan status: {status_data.get('status', 'Unknown')}")
                    print(f"   Progress: {status_data.get('progress', 'Unknown')}%")
                    print(f"   Message: {status_data.get('message', 'No message')}")
                else:
                    print(f"   Status check failed: {status_response.text}")

        else:
            print(f"   Failed: {lc_d2_response.text}")

    except Exception as e:
        print(f"   Error: {e}")

    # Test 3: Check if it's a payload size issue
    print(f"\n📏 Payload Size Comparison:")
    working_size = len(json.dumps(working_scan_request))
    lc_d2_size = len(json.dumps(lc_d2_scan_request))

    print(f"   Working scanner payload: {working_size:,} bytes")
    print(f"   LC D2 scanner payload: {lc_d2_size:,} bytes")
    print(f"   Size difference: {lc_d2_size - working_size:,} bytes")

    if lc_d2_size > 1024 * 1024:  # 1MB
        print(f"   ⚠️ LC D2 payload is very large: {lc_d2_size / (1024*1024):.1f}MB")

if __name__ == "__main__":
    test_scan_execution()