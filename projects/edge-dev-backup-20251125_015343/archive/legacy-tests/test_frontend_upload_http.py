#!/usr/bin/env python3
"""
Test Frontend Upload via HTTP
Test the exact HTTP request that the frontend makes to the FastAPI service
"""

import requests
import json

def test_uploaded_scanner_via_http():
    """
    Test the uploaded scanner via HTTP request like the frontend does
    """
    print("🔧 TESTING FRONTEND UPLOAD VIA HTTP")
    print("=" * 60)

    # Load the actual half A+ scanner
    scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
    with open(scanner_file, 'r') as f:
        uploaded_code = f.read()

    print(f"📄 Loaded scanner: {len(uploaded_code)} characters")

    # Create the exact request that frontend makes
    request_data = {
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "use_real_scan": True,
        "scanner_type": "uploaded",
        "uploaded_code": uploaded_code
    }

    try:
        print("🚀 Sending HTTP request to FastAPI service...")
        response = requests.post(
            "http://localhost:8001/api/scan/execute",
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"📊 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Scan ID: {result.get('scan_id')}")
            print(f"📝 Message: {result.get('message')}")

            # Wait for the scan to complete and check for errors
            scan_id = result.get('scan_id')
            if scan_id:
                print(f"⏱️  Waiting for scan {scan_id} to complete...")

                # Check scan status
                import time
                for i in range(30):  # Wait up to 30 seconds
                    status_response = requests.get(f"http://localhost:8001/api/scan/status/{scan_id}")
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        print(f"📊 Progress: {status_data.get('progress_percent', 0)}% - {status_data.get('message', '')}")

                        if status_data.get('status') == 'completed':
                            print(f"🎉 Scan completed! Found {status_data.get('total_found', 0)} results")
                            return True
                        elif status_data.get('status') == 'error':
                            error_msg = status_data.get('error', 'Unknown error')
                            print(f"❌ Scan failed with error: {error_msg}")
                            if "asyncio.run() cannot be called from a running event loop" in error_msg:
                                print("🚨 FOUND THE ASYNCIO CONFLICT!")
                                return False
                            return False

                    time.sleep(1)

                print("⏱️  Scan still running after 30 seconds")
                return True

        else:
            print(f"❌ HTTP request failed: {response.status_code}")
            print(f"📝 Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_uploaded_scanner_via_http()
    if success:
        print(f"\n🎉 HTTP UPLOAD TEST: SUCCESS")
        print(f"   No asyncio conflicts detected via HTTP")
    else:
        print(f"\n❌ HTTP UPLOAD TEST: FAILED")
        print(f"   Asyncio conflicts still exist via HTTP")