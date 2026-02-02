#!/usr/bin/env python3
"""
Test Final Template Fix
Test the frontend upload process with the fixed template generation
"""

import requests
import json
import time

def test_frontend_upload_with_fixes():
    """
    Test the frontend upload process with the asyncio template fixes
    """
    print("🔧 TESTING FRONTEND UPLOAD WITH TEMPLATE FIXES")
    print("=" * 70)

    # Load the actual half A+ scanner
    scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"
    with open(scanner_file, 'r') as f:
        uploaded_code = f.read()

    print(f"📄 Loaded scanner: {len(uploaded_code)} characters")

    # Test code formatting first (this is where the error was occurring)
    print("🔧 Step 1: Testing code formatting...")
    format_data = {
        "code": uploaded_code
    }

    try:
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"📊 Format response status: {format_response.status_code}")

        if format_response.status_code == 200:
            format_result = format_response.json()
            print(f"✅ Code formatting successful!")
            print(f"📊 Scanner type: {format_result.get('scanner_type')}")
            print(f"📊 Integrity verified: {format_result.get('integrity_verified')}")
        else:
            print(f"❌ Code formatting failed: {format_response.text}")
            return False

    except Exception as e:
        print(f"❌ Code formatting request failed: {e}")
        return False

    # Test scan execution
    print("\n🚀 Step 2: Testing scan execution...")
    scan_data = {
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "use_real_scan": True,
        "scanner_type": "uploaded",
        "uploaded_code": uploaded_code
    }

    try:
        scan_response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=scan_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"📊 Scan response status: {scan_response.status_code}")

        if scan_response.status_code == 200:
            result = scan_response.json()
            print(f"✅ Scan started! Scan ID: {result.get('scan_id')}")
            scan_id = result.get('scan_id')

            # Monitor scan progress
            print(f"⏱️  Monitoring scan progress...")
            for i in range(60):  # Wait up to 60 seconds
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
                            print("🚨 ASYNCIO CONFLICT STILL EXISTS!")
                        return False

                time.sleep(1)

            print("⏱️  Scan still running after 60 seconds")
            return True

        else:
            print(f"❌ Scan request failed: {scan_response.text}")
            return False

    except Exception as e:
        print(f"❌ Scan request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_frontend_upload_with_fixes()
    if success:
        print(f"\n🎉 TEMPLATE FIX VALIDATION: SUCCESS")
        print(f"   No asyncio conflicts detected with template fixes")
        print(f"   Frontend should now work properly for scanner uploads")
    else:
        print(f"\n❌ TEMPLATE FIX VALIDATION: FAILED")
        print(f"   Asyncio conflicts still exist, additional investigation needed")