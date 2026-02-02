#!/usr/bin/env python3
"""
Test a single scanner to verify the full workflow
"""
import requests
import json
import time
import os

def test_backside_scanner():
    print("🔍 Testing Backside Para B scanner through web interface...")

    # Load scanner code
    scanner_path = '/Users/michaeldurante/Downloads/backside para b copy.py'
    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Scanner loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load scanner: {e}")
        return

    # Submit scan (with longer timeout)
    scan_request = {
        'start_date': '2025-01-01',
        'end_date': '2025-11-06',
        'uploaded_code': scanner_code,
        'scanner_type': 'uploaded',
        'use_real_scan': True
    }

    print("📤 Submitting scan (with long timeout)...")
    try:
        response = requests.post('http://localhost:8000/api/scan/execute', json=scan_request, timeout=180)
        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id')
            print(f"🆔 Scan started: {scan_id}")
            print(f"💬 Message: {result.get('message')}")

            # Wait for completion
            print("⏳ Waiting for scan to complete...")
            for i in range(24):  # Check for 2 minutes (24 * 5 seconds)
                time.sleep(5)
                try:
                    status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
                    if status_response.status_code == 200:
                        status = status_response.json()
                        progress = status.get('progress_percent', 0)
                        scan_status = status.get('status', 'unknown')

                        print(f"  📊 Progress: {progress}% ({scan_status})")

                        if scan_status == 'completed':
                            results = status.get('results', [])
                            total_found = status.get('total_found', 0)
                            execution_time = status.get('execution_time', 0)

                            print(f"\n✅ SCAN COMPLETED!")
                            print(f"   📊 Total found: {total_found}")
                            print(f"   📋 Results returned: {len(results)}")
                            print(f"   ⏱️ Execution time: {execution_time}s")

                            if results:
                                print(f"\n🎯 RESULTS:")
                                for i, result in enumerate(results[:8]):
                                    ticker = result.get('ticker', 'N/A')
                                    date = result.get('date', 'N/A')
                                    scan_type = result.get('scan_type', 'N/A')
                                    print(f"     {i+1}. {ticker} on {date} ({scan_type})")

                                print(f"\n🎉 SUCCESS! Scanner is working through web interface!")
                            else:
                                print(f"\n❌ No results returned - need to investigate filtering")

                            return

                        elif scan_status == 'failed':
                            print(f"❌ Scan failed")
                            return

                except Exception as e:
                    print(f"⚠️ Status check error: {e}")

            print("⏰ Scan timed out after 2 minutes")

        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Request error: {e}")

if __name__ == "__main__":
    test_backside_scanner()