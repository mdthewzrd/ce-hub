#!/usr/bin/env python3
"""
🔄 Complete System Restart and Test
====================================

Restart the backend to ensure all changes are active,
then test the exact upload flow the user is experiencing.
"""

import os
import subprocess
import time
import requests
import json

def restart_backend():
    """Restart the backend server to pick up changes"""

    print("🔄 Restarting Backend Server...")
    print("=" * 50)

    # Kill any existing backend processes
    try:
        result = subprocess.run(['pkill', '-f', 'uvicorn.*main:app'],
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Killed existing backend process")
        time.sleep(2)
    except:
        pass

    # Start new backend process
    backend_dir = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend"

    print(f"📂 Starting backend from: {backend_dir}")

    # Start backend in background
    process = subprocess.Popen(
        ['python', '-m', 'uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    print(f"🚀 Backend starting with PID: {process.pid}")

    # Wait for backend to be ready
    print("⏳ Waiting for backend to be ready...")
    for i in range(30):  # Wait up to 30 seconds
        try:
            response = requests.get("http://localhost:8000/", timeout=2)
            if response.status_code == 200:
                print(f"✅ Backend ready after {i+1} seconds")
                return True
        except:
            pass
        time.sleep(1)

    print("❌ Backend failed to start properly")
    return False

def test_upload_flow():
    """Test the actual upload flow step by step"""

    print("\n🧪 Testing Upload Flow Step by Step")
    print("=" * 50)

    # Load LC D2 scanner
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(lc_d2_file, 'r') as f:
            lc_d2_code = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(lc_d2_code)} characters")

        # Step 1: Test parameter extraction (what frontend calls for analysis)
        print(f"\n🔍 Step 1: Testing Parameter Extraction API")
        format_url = "http://localhost:8000/api/format/code"

        format_payload = {
            "code": lc_d2_code
        }

        format_response = requests.post(format_url, json=format_payload, timeout=60)
        print(f"   Status: {format_response.status_code}")

        if format_response.status_code == 200:
            format_data = format_response.json()
            print(f"   ✅ Parameter extraction successful")
            print(f"   Success: {format_data.get('success')}")
            print(f"   Parameters found: {format_data.get('metadata', {}).get('ai_extraction', {}).get('total_parameters', 0)}")
            print(f"   Trading filters: {format_data.get('metadata', {}).get('ai_extraction', {}).get('trading_filters', 0)}")
            print(f"   Warnings: {len(format_data.get('warnings', []))}")

            if format_data.get('warnings'):
                print(f"   Warning details: {format_data['warnings']}")
        else:
            print(f"   ❌ Parameter extraction failed: {format_response.text}")
            return False

        # Step 2: Test scan execution (what happens when user clicks run)
        print(f"\n🚀 Step 2: Testing Scan Execution API")
        scan_url = "http://localhost:8000/api/scan/execute"

        scan_payload = {
            "scanner_type": "uploaded",
            "uploaded_code": lc_d2_code,
            "start_date": "2025-10-01",
            "end_date": "2025-11-01",
            "use_real_scan": True,
            "filters": {"scan_type": "uploaded_scanner"}
        }

        scan_response = requests.post(scan_url, json=scan_payload, timeout=120)
        print(f"   Status: {scan_response.status_code}")

        if scan_response.status_code == 200:
            scan_data = scan_response.json()
            print(f"   ✅ Scan execution successful")
            print(f"   Success: {scan_data.get('success')}")
            print(f"   Scan ID: {scan_data.get('scan_id')}")
            print(f"   Message: {scan_data.get('message')}")

            # Check scan status
            if scan_data.get('scan_id'):
                scan_id = scan_data['scan_id']
                status_url = f"http://localhost:8000/api/scan/status/{scan_id}"

                print(f"\n📊 Step 3: Checking Scan Status")
                time.sleep(2)

                status_response = requests.get(status_url, timeout=10)
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    print(f"   Status: {status_data.get('status')}")
                    print(f"   Progress: {status_data.get('progress')}%")
                    print(f"   Message: {status_data.get('message')}")
                else:
                    print(f"   ❌ Status check failed: {status_response.text}")
        else:
            print(f"   ❌ Scan execution failed: {scan_response.text}")
            return False

        print(f"\n🎉 All API tests passed!")
        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Complete System Restart and Test")
    print("=" * 60)

    # Step 1: Restart backend
    if restart_backend():
        # Step 2: Test upload flow
        test_upload_flow()
    else:
        print("❌ Cannot proceed - backend failed to start")