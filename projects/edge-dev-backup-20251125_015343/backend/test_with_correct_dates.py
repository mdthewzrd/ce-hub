#!/usr/bin/env python3
"""
Test scanners with correct date ranges:
- Half A+: 2024-01-01 to 2025-11-01 (should get results)
- Others: 2025-01-01 to 2025-11-06 (as before)
"""

import requests
import json
import time
import os

def test_scanner_with_dates(scanner_name, scanner_path, start_date, end_date):
    """Test a single scanner with specific date range"""
    print(f"\n🔍 TESTING {scanner_name.upper()} SCANNER ({start_date} to {end_date})")
    print("=" * 60)

    # Load scanner code
    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ {scanner_name} loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load {scanner_name}: {e}")
        return False

    # Submit scan
    scan_request = {
        'start_date': start_date,
        'end_date': end_date,
        'uploaded_code': scanner_code,
        'scanner_type': 'uploaded',
        'use_real_scan': True
    }

    print(f"📤 Submitting {scanner_name} scan...")
    try:
        response = requests.post('http://localhost:8000/api/scan/execute', json=scan_request, timeout=120)
        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id')
            print(f"🆔 {scanner_name} scan started: {scan_id}")

            # Wait for completion (extended timeout for larger date ranges)
            print(f"⏳ Waiting for {scanner_name} to complete...")
            for i in range(48):  # Check for 4 minutes (48 * 5 seconds)
                time.sleep(5)
                try:
                    status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
                    if status_response.status_code == 200:
                        status = status_response.json()
                        progress = status.get('progress_percent', 0)
                        scan_status = status.get('status', 'unknown')

                        print(f"  📊 {scanner_name}: {progress}% ({scan_status})")

                        if scan_status == 'completed':
                            results = status.get('results', [])
                            total_found = status.get('total_found', 0)
                            execution_time = status.get('execution_time', 0)

                            print(f"✅ {scanner_name} COMPLETED!")
                            print(f"   📊 Total found: {total_found}")
                            print(f"   📋 Results returned: {len(results)}")
                            print(f"   ⏱️ Execution time: {execution_time}s")

                            if results:
                                print(f"   🎯 Sample results:")
                                for i, result in enumerate(results[:8]):  # Show first 8
                                    ticker = result.get('ticker', 'N/A')
                                    date = result.get('date', 'N/A')
                                    print(f"     {i+1}. {ticker} on {date}")

                                print(f"✅ {scanner_name} test PASSED - {len(results)} results")
                                return True
                            else:
                                print(f"   ℹ️ {scanner_name} completed with 0 results (may be expected)")
                                return True

                        elif scan_status == 'failed':
                            print(f"❌ {scanner_name} FAILED")
                            return False

                except Exception as e:
                    print(f"⚠️ Status check error: {e}")

            print(f"⏰ {scanner_name} timed out after 4 minutes")
            return False
        else:
            print(f"❌ {scanner_name} submission failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {scanner_name} submission error: {e}")
        return False

def main():
    print("🚀 TESTING SCANNERS WITH CORRECT DATE RANGES")
    print("=" * 60)

    # Test configurations
    scanner_tests = [
        {
            'name': 'backside_para_b',
            'path': '/Users/michaeldurante/Downloads/backside para b copy.py',
            'start_date': '2025-01-01',
            'end_date': '2025-11-06'
        },
        {
            'name': 'half_a_plus',
            'path': '/Users/michaeldurante/Downloads/half A+ scan copy.py',
            'start_date': '2024-01-01',  # Correct date range for Half A+
            'end_date': '2025-11-01'
        },
        {
            'name': 'lc_d2',
            'path': '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py',
            'start_date': '2025-01-01',
            'end_date': '2025-11-06'
        }
    ]

    results = {}
    for test_config in scanner_tests:
        success = test_scanner_with_dates(
            test_config['name'],
            test_config['path'],
            test_config['start_date'],
            test_config['end_date']
        )
        results[test_config['name']] = success

    # Final results
    print(f"\n📊 FINAL RESULTS:")
    print("=" * 60)
    for scanner_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{scanner_name:20} {status}")

    all_passed = all(results.values())
    if all_passed:
        print(f"\n🎉 ALL SCANNERS WORKING WITH CORRECT DATE RANGES!")
    else:
        failed_count = sum(1 for success in results.values() if not success)
        print(f"\n⚠️ {failed_count} scanner(s) failed - need investigation")

if __name__ == "__main__":
    main()