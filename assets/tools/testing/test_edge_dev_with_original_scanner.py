#!/usr/bin/env python3
"""
Test edge-dev platform with original scanner to verify error handling and async fixes
"""
import requests
import json
import time

def test_original_scanner():
    print("🧪 Testing edge-dev platform with original scanner...")

    # Read the original scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
    except FileNotFoundError:
        print("❌ Original scanner file not found, trying alternate name...")
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
            scanner_code = f.read()

    print(f"📄 Loaded scanner code: {len(scanner_code)} characters")

    # Test the scanner execution via API
    test_payload = {
        "scanner_type": "uploaded",
        "start_date": "2025-01-01",
        "end_date": "2025-11-06",
        "uploaded_code": scanner_code
    }

    try:
        print("🚀 Sending scanner to edge-dev platform...")
        response = requests.post("http://localhost:8000/api/scan/execute", json=test_payload)

        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id', 'unknown')
            print(f"✅ Scanner execution started: {scan_id}")

            # Monitor progress
            for i in range(20):  # Wait up to 20 seconds
                status_response = requests.get(f"http://localhost:8000/api/scan/status/{scan_id}")
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"📊 Progress: {status.get('progress_percent', 0)}% - {status.get('message', 'Processing...')}")

                    if status.get('status') == 'completed':
                        results = status.get('results', [])
                        print(f"🎉 Scanner completed! Found {len(results)} results")

                        if results:
                            print("📋 Sample results:")
                            for i, result in enumerate(results[:3]):
                                print(f"  {i+1}. {result.get('ticker', 'N/A')}: {result.get('date', 'N/A')}")
                        else:
                            print("⚠️ No results found - checking error handling logs...")
                        break
                    elif status.get('status') == 'failed':
                        print(f"❌ Scanner failed: {status.get('message', 'Unknown error')}")
                        break

                time.sleep(1)

        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_original_scanner()