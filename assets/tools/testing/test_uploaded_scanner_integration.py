#!/usr/bin/env python3
"""
🎯 Test End-to-End Uploaded Scanner Integration
======================================================================
Tests the complete integration from frontend request format to backend execution
to verify that uploaded scanners now execute correctly through the platform.
"""

import requests
import json
import time

def test_uploaded_scanner_api():
    """Test the /api/scan/execute endpoint with uploaded scanner"""
    print("🎯 TESTING UPLOADED SCANNER API INTEGRATION")
    print("=" * 70)

    # Load the original scanner code
    scanner_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
    with open(scanner_path, 'r') as f:
        scanner_code = f.read()

    print(f"✅ Loaded backside para scanner: {len(scanner_code)} characters")

    # Test the new request format that the frontend now sends
    request_data = {
        "start_date": "2025-01-01",
        "end_date": "2025-11-03",
        "use_real_scan": True,
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code
    }

    print("\n🚀 Sending request to /api/scan/execute...")
    print(f"   - scanner_type: {request_data['scanner_type']}")
    print(f"   - date range: {request_data['start_date']} to {request_data['end_date']}")
    print(f"   - code length: {len(scanner_code)} chars")

    try:
        # Send request to backend
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=request_data,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Request successful!")
            print(f"   - scan_id: {data.get('scan_id')}")
            print(f"   - message: {data.get('message')}")

            if data.get('scan_id'):
                # Poll for completion
                scan_id = data['scan_id']
                print(f"\n⏳ Polling for scan completion...")

                max_attempts = 60
                for attempt in range(max_attempts):
                    time.sleep(2)

                    status_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')
                    if status_response.status_code == 200:
                        results_data = status_response.json()
                        results = results_data.get('results', [])

                        print(f"\n🎉 SCAN COMPLETED!")
                        print(f"   - Total results: {len(results)}")
                        print(f"   - Execution time: {results_data.get('execution_time', 0):.2f}s")

                        if len(results) > 0:
                            print(f"\n📊 First 10 results:")
                            for i, result in enumerate(results[:10]):
                                ticker = result.get('ticker', 'UNKNOWN')
                                date = result.get('date', 'UNKNOWN')
                                scan_type = result.get('scan_type', 'UNKNOWN')
                                print(f"      {i+1}. {ticker} on {date} (type: {scan_type})")

                            if len(results) > 10:
                                print(f"      ... and {len(results) - 10} more")

                        # Validate expected results
                        expected_signals = [
                            ('SMCI', '2025-02-18'),
                            ('SMCI', '2025-02-19'),
                            ('BABA', '2025-01-27'),
                            ('BABA', '2025-01-29'),
                            ('SOXL', '2025-10-02'),
                            ('AMD', '2025-05-14'),
                            ('INTC', '2025-08-15'),
                            ('XOM', '2025-06-13')
                        ]

                        found_signals = []
                        for result in results:
                            ticker = result.get('ticker', '')
                            date = result.get('date', '')
                            if (ticker, date) in expected_signals:
                                found_signals.append((ticker, date))

                        print(f"\n🎯 ACCURACY VALIDATION:")
                        print(f"   - Expected signals: {len(expected_signals)}")
                        print(f"   - Found signals: {len(found_signals)}")
                        print(f"   - Accuracy: {(len(found_signals) / len(expected_signals)) * 100:.1f}%")

                        if found_signals:
                            print(f"   ✅ Found expected signals:")
                            for ticker, date in found_signals:
                                print(f"      - {ticker} on {date}")

                        missing_signals = [s for s in expected_signals if s not in found_signals]
                        if missing_signals:
                            print(f"   ⚠️ Missing signals:")
                            for ticker, date in missing_signals:
                                print(f"      - {ticker} on {date}")

                        # Final assessment
                        if len(found_signals) == len(expected_signals):
                            print(f"\n✅ PERFECT: All expected signals found!")
                        elif len(found_signals) >= len(expected_signals) * 0.75:
                            print(f"\n✅ GOOD: {(len(found_signals) / len(expected_signals)) * 100:.1f}% of expected signals found")
                        else:
                            print(f"\n⚠️ ISSUE: Only {(len(found_signals) / len(expected_signals)) * 100:.1f}% of expected signals found")

                        return results

                    elif status_response.status_code == 202:
                        # Still in progress
                        print(f"   ⏳ Attempt {attempt + 1}/{max_attempts} - Still processing...")
                        continue
                    else:
                        print(f"   ❌ Status check failed: {status_response.status_code}")
                        break

                print(f"   ❌ Scan timed out after {max_attempts} attempts")

        else:
            print(f"\n❌ Request failed: {response.status_code}")
            print(f"   Response: {response.text}")

    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return None

def main():
    print("🎯 UPLOADED SCANNER INTEGRATION TEST")
    print("=" * 50)
    print("Testing end-to-end integration after frontend fixes")
    print()

    results = test_uploaded_scanner_api()

    if results:
        print(f"\n🎉 Integration test completed - found {len(results)} results")
    else:
        print(f"\n❌ Integration test failed")

if __name__ == "__main__":
    main()