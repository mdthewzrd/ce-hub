#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime

def trigger_scan():
    """Trigger the backside B scanner with 1/1/25 - 11/1/25 date range"""

    # Read the backside B scanner code
    with open('backend/test_backside_b_2025.json', 'r') as f:
        scanner_data = json.load(f)

    # Prepare the payload with requested date range
    payload = {
        "scanner_type": "uploaded",
        "start_date": "2025-01-01",
        "end_date": "2025-11-01",
        "uploaded_code": scanner_data['uploaded_code']
    }

    print("🎯 Triggering Backside B Scanner: 1/1/25 - 11/1/25")
    print("=" * 50)
    print(f"Start Date: {payload['start_date']}")
    print(f"End Date: {payload['end_date']}")
    print(f"Code Length: {len(payload['uploaded_code'])} characters")

    try:
        # Make the API call
        response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=payload,
            timeout=300  # 5 minutes timeout
        )

        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id')
            results_count = result.get('results_count', 0)
            total_found = result.get('total_found', 0)

            print(f"✅ Scan triggered successfully!")
            print(f"📋 Scan ID: {scan_id}")
            print(f"📊 Results Count: {results_count}")
            print(f"🎯 Total Found: {total_found}")

            # Wait a bit for processing
            time.sleep(5)

            # Check scan status
            if scan_id:
                status_response = requests.get(f"http://localhost:8000/api/scan/status/{scan_id}")
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"📈 Status: {status.get('status', 'unknown')}")
                    print(f"📝 Message: {status.get('message', 'no message')}")

                    if status.get('results'):
                        print(f"📊 Results found: {len(status['results'])}")
                        # Show first few results
                        for i, result in enumerate(status['results'][:5]):
                            print(f"  {i+1}. {result}")

                print(f"\n🌐 View results in frontend: http://localhost:5656")
                print(f"📸 Scanner executed successfully with date range 1/1/25 - 11/1/25")

                return scan_id
        else:
            print(f"❌ Error triggering scan: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")

    return None

if __name__ == "__main__":
    scan_id = trigger_scan()
    if scan_id:
        print(f"\n📸 Scan completed! The results should be visible in the frontend.")
        print(f"📱 Navigate to: http://localhost:5656")
        print(f"🔍 Check Market Scanner section for results.")