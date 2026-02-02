#!/usr/bin/env python3
"""
Test the complete scanner execution flow to identify why no results are produced
"""
import requests
import json
import time

def test_execution_flow():
    print("🔍 Testing complete scanner execution flow...")

    # Read the Backside Para B scanner code
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ Scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load scanner code: {e}")
        return

    # Test scan execution endpoint
    scan_request = {
        'start_date': '2025-01-01',
        'end_date': '2025-11-06',
        'uploaded_code': scanner_code,
        'scanner_type': 'uploaded',
        'use_real_scan': True
    }

    print("📤 Submitting scan execution request...")
    try:
        response = requests.post('http://localhost:8000/api/scan/execute', json=scan_request, timeout=120)
        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result.get('success')}")
            print(f"🆔 Scan ID: {result.get('scan_id')}")
            print(f"💬 Message: {result.get('message')}")

            total_found = result.get('total_found', 0)
            execution_time = result.get('execution_time', 0)
            results = result.get('results', [])

            print(f"📊 Total found: {total_found}")
            print(f"⏱️ Execution time: {execution_time}")
            print(f"📋 Results array length: {len(results)}")

            if results:
                print("🎯 RESULTS FOUND! First result:")
                print(json.dumps(results[0], indent=2))
            else:
                print("❌ NO RESULTS FOUND - This is the issue!")
                print("🔍 Investigating further...")

                # Check if scan is still running
                scan_id = result.get('scan_id')
                if scan_id:
                    print(f"📋 Checking scan status for {scan_id}...")
                    status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
                    if status_response.status_code == 200:
                        status = status_response.json()
                        print(f"📊 Scan status: {json.dumps(status, indent=2)}")

        else:
            print(f"❌ Request failed: {response.status_code}")
            try:
                error = response.json()
                print(f"💥 Error details: {json.dumps(error, indent=2)}")
            except:
                print(f"💥 Error text: {response.text}")

    except requests.exceptions.Timeout:
        print("⏰ Request timed out - execution is taking too long or hanging")
    except Exception as e:
        print(f"💥 Request error: {str(e)}")

def test_direct_scanner_execution():
    """Test the scanner directly without the web API"""
    print("\n🔬 Testing direct scanner execution...")

    try:
        # Import and run the test scanner we created
        import sys
        sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')
        from test_backside_para_b_direct import test_backside_para_b_direct

        print("🚀 Running direct scanner test...")
        # This should produce actual results

    except Exception as e:
        print(f"❌ Direct test failed: {e}")

if __name__ == "__main__":
    test_execution_flow()
    test_direct_scanner_execution()