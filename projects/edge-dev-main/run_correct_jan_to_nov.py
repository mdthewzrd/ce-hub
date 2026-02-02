#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime

def run_correct_scan():
    """Run the corrected backside B scanner with 1/1/25 - 11/1/25 date range"""

    # Read the corrected scanner configuration
    with open('correct_jan_to_nov_scan.json', 'r') as f:
        scanner_data = json.load(f)

    print("🎯 Running CORRECTED Backside B Scanner: 1/1/25 - 11/1/25")
    print("=" * 60)
    print(f"Start Date: {scanner_data['start_date']}")
    print(f"End Date: {scanner_data['end_date']}")
    print(f"Code Length: {len(scanner_data['uploaded_code'])} characters")
    print(f"Expected Results: 8 patterns")

    try:
        # Make the API call with the corrected scanner
        response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=scanner_data,
            timeout=600  # 10 minutes timeout
        )

        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id')
            results_count = result.get('results_count', 0)
            total_found = result.get('total_found', 0)

            print(f"✅ Scan triggered successfully!")
            print(f"📋 Scan ID: {scan_id}")
            print(f"📊 Initial Results Count: {results_count}")
            print(f"🎯 Total Found: {total_found}")

            # Wait for processing and monitor progress
            print("⏳ Waiting for scan completion...")

            max_wait = 180  # 3 minutes max wait
            for i in range(max_wait):
                time.sleep(1)

                if scan_id:
                    status_response = requests.get(f"http://localhost:8000/api/scan/status/{scan_id}")
                    if status_response.status_code == 200:
                        status = status_response.json()
                        scan_status = status.get('status', 'unknown')
                        message = status.get('message', 'no message')

                        if i % 15 == 0:  # Progress every 15 seconds
                            print(f"   Status: {scan_status} - {message}")

                        if scan_status == 'completed':
                            final_results = status.get('results', [])
                            print(f"\n✅ SCAN COMPLETED!")
                            print(f"📊 Final Results Count: {len(final_results)}")

                            if len(final_results) > 0:
                                print(f"\n🎯 FOUND {len(final_results)} TRADING PATTERNS:")
                                for i, result in enumerate(final_results[:10]):  # Show first 10
                                    symbol = result.get('symbol', result.get('ticker', 'Unknown'))
                                    date = result.get('date', 'Unknown')
                                    gap_percent = result.get('gap_percent', 0)
                                    print(f"  {i+1}. {symbol} - {date} - Gap: {gap_percent}%")
                            else:
                                print("⚠️  No patterns found in this date range")

                            break

            print(f"\n🌐 View results in frontend: http://localhost:5656")
            print(f"🔍 Navigate to Market Scanner section")

            return scan_id, len(final_results) if 'final_results' in locals() else 0

        else:
            print(f"❌ Error triggering scan: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")

    return None, 0

if __name__ == "__main__":
    scan_id, results_count = run_correct_scan()

    if scan_id:
        print(f"\n🎯 **EXECUTION SUMMARY:**")
        print(f"✅ Scanner: Backside B (1/1/25 - 11/1/25)")
        print(f"📊 Results Found: {results_count} patterns")
        print(f"📋 Scan ID: {scan_id}")
        print(f"📱 Frontend: http://localhost:5656")

        if results_count == 8:
            print(f"🎉 SUCCESS: Found expected 8 patterns!")
        else:
            print(f"📊 Found {results_count} patterns (expected 8)")