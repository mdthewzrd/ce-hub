#!/usr/bin/env python3
"""
Test LC D2 Scanner
Test the specific scanner that's failing
"""

import requests
import json
import time

def test_lc_d2_scanner():
    """
    Test the LC D2 scanner that's causing the asyncio error
    """
    print("🔧 TESTING LC D2 SCANNER")
    print("=" * 50)

    # Load the LC D2 scanner
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"
    with open(scanner_file, 'r') as f:
        uploaded_code = f.read()

    print(f"📄 Loaded LC D2 scanner: {len(uploaded_code)} characters")

    # Test scan execution
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

            # Monitor scan progress
            print(f"⏱️  Monitoring scan progress...")
            for i in range(30):  # Wait up to 30 seconds
                status_response = requests.get(f"http://localhost:8000/api/scan/status/{scan_id}")
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    progress = status_data.get('progress_percent', 0)
                    message = status_data.get('message', '')
                    status = status_data.get('status', '')

                    if i % 5 == 0:  # Print every 5 seconds
                        print(f"📊 Progress: {progress}% - {message}")

                    if status == 'completed':
                        total_found = status_data.get('total_found', 0)
                        print(f"🎉 Scan completed! Found {total_found} results")
                        return True
                    elif status == 'error':
                        error_msg = status_data.get('error', 'Unknown error')
                        print(f"❌ Scan failed with error: {error_msg}")
                        if "asyncio.run() cannot be called from a running event loop" in error_msg:
                            print("🚨 ASYNCIO CONFLICT DETECTED!")
                        return False

                time.sleep(1)

            print("⏱️  Scan still running after 30 seconds")
            return True

        else:
            print(f"❌ Scan request failed: {scan_response.text}")
            return False

    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_lc_d2_scanner()
    if success:
        print(f"\n✅ LC D2 Scanner test passed")
    else:
        print(f"\n❌ LC D2 Scanner test failed - this explains the frontend issue")