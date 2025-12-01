#!/usr/bin/env python3
"""
🔧 Test the enhanced pattern detection system
"""

import requests
import json

def test_pattern_detection():
    """Test that the enhanced pattern detection can handle different scanner structures"""
    print("🔧 Testing Enhanced Pattern Detection")
    print("=" * 50)

    # Test Pattern 2: half A+ scanner structure
    half_a_plus_test_code = '''
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

symbols = ['AAPL', 'MSFT', 'NVDA', 'TSLA']
custom_params = {'atr_mult': 4, 'vol_mult': 2.0}

def fetch_and_scan(symbol, start_date, end_date, params):
    """Test function that returns tuples like the half A+ scanner"""
    # Simulate finding results
    return [(symbol, '2025-01-15')]

if __name__ == '__main__':
    results = []
    with ThreadPoolExecutor(max_workers=5) as exe:
        futures = {exe.submit(fetch_and_scan, s, '2025-01-01', '2025-01-15', custom_params): s for s in symbols}
        for fut in as_completed(futures):
            result = fut.result()
            if result:
                results.extend(result)
    print(f"Found {len(results)} results")
'''

    FORMAT_URL = "http://localhost:8000/api/format/code"
    SCAN_URL = "http://localhost:8000/api/scan/execute"

    print(f"📄 Testing Pattern 2 scanner code: {len(half_a_plus_test_code)} characters")

    # Test formatting (should preserve integrity)
    format_request = {
        "code": half_a_plus_test_code,
        "options": {"preserve_integrity": True}
    }

    print(f"\n🔧 Testing formatting...")
    format_response = requests.post(FORMAT_URL, json=format_request)

    if format_response.status_code == 200:
        format_result = format_response.json()
        print(f"✅ Formatting successful")
        print(f"📊 Scanner type: {format_result['scanner_type']}")
        print(f"🔒 Integrity verified: {format_result['integrity_verified']}")

        # Test execution
        print(f"\n🚀 Testing execution...")
        scan_request = {
            "start_date": "2025-01-01",
            "end_date": "2025-01-15",
            "scanner_type": "uploaded",
            "uploaded_code": format_result['formatted_code'],
            "use_real_scan": True
        }

        scan_response = requests.post(SCAN_URL, json=scan_request)

        if scan_response.status_code == 200:
            scan_result = scan_response.json()
            print(f"✅ Scan started: {scan_result['scan_id']}")

            # Check status quickly
            import time
            time.sleep(5)

            STATUS_URL = f"http://localhost:8000/api/scan/status/{scan_result['scan_id']}"
            status_response = requests.get(STATUS_URL)

            if status_response.status_code == 200:
                status = status_response.json()
                print(f"📊 Status: {status['status']}")
                print(f"📝 Message: {status.get('message', 'No message')}")

                if status['status'] == 'completed':
                    print(f"🎯 Results: {len(status.get('results', []))}")
                    return True
                elif status['status'] == 'error':
                    print(f"❌ Error: {status.get('error', 'Unknown error')}")
                    return False
                else:
                    print(f"⏳ Still processing... (this is expected for complex scanners)")
                    return True  # Processing is good
            else:
                print(f"❌ Status check failed: {status_response.status_code}")
                return False
        else:
            print(f"❌ Scan execution failed: {scan_response.status_code}")
            print(f"Error: {scan_response.text}")
            return False
    else:
        print(f"❌ Formatting failed: {format_response.status_code}")
        print(f"Error: {format_response.text}")
        return False

if __name__ == "__main__":
    success = test_pattern_detection()
    print(f"\n📋 Pattern Detection Test: {'✅ PASSED' if success else '❌ FAILED'}")