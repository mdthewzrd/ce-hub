#!/usr/bin/env python3
"""
🔍 Test Built-in Scanner Results for Comparison
Check what results built-in scanners are producing
"""
import requests
import json
import time

def test_builtin_scanner_results():
    """Test built-in scanners to see if they're finding results"""
    print("🔍 TESTING BUILT-IN SCANNER RESULTS FOR COMPARISON")
    print("Checking what results built-in scanners produce...")
    print("=" * 80)

    # Test different built-in scanners with recent dates
    builtin_tests = [
        {
            "name": "Half A Plus Scanner",
            "scanner_type": "half_a_plus",
            "start_date": "2024-10-21",
            "end_date": "2024-10-25"
        },
        {
            "name": "LC D2 Built-in",
            "scanner_type": "lc_d2",
            "start_date": "2024-10-21",
            "end_date": "2024-10-25"
        },
        {
            "name": "Half A Plus (Historical)",
            "scanner_type": "half_a_plus",
            "start_date": "2024-01-08",
            "end_date": "2024-01-19"
        }
    ]

    execute_url = "http://localhost:8000/api/scan/execute"

    for test in builtin_tests:
        print(f"\n🔧 Testing: {test['name']}")
        print(f"   Scanner: {test['scanner_type']}")
        print(f"   Date range: {test['start_date']} to {test['end_date']}")

        execute_payload = {
            "scanner_type": test['scanner_type'],
            "start_date": test['start_date'],
            "end_date": test['end_date']
        }

        try:
            # Execute the scanner
            execute_response = requests.post(execute_url, json=execute_payload, timeout=120)

            if execute_response.status_code != 200:
                print(f"   ❌ Execution failed: {execute_response.status_code}")
                continue

            execute_result = execute_response.json()

            if not execute_result.get('success'):
                print(f"   ❌ Execution failed: {execute_result.get('message', 'Unknown error')}")
                continue

            scan_id = execute_result.get('scan_id')
            print(f"   ✅ Scanner execution started! Scan ID: {scan_id}")

            # Wait for execution to complete
            status_url = f"http://localhost:8000/api/scan/status/{scan_id}"

            for i in range(30):  # Wait up to 30 seconds
                time.sleep(1)

                try:
                    status_response = requests.get(status_url, timeout=10)
                    if status_response.status_code == 200:
                        status_result = status_response.json()
                        status = status_result.get('status', 'unknown')

                        if status == 'completed':
                            # Get results
                            results_url = f"http://localhost:8000/api/scan/results/{scan_id}"
                            results_response = requests.get(results_url, timeout=10)

                            if results_response.status_code == 200:
                                results = results_response.json()
                                result_count = len(results.get('results', []))

                                print(f"   🎯 COMPLETED! Results found: {result_count}")

                                if result_count > 0:
                                    print(f"   ✅ SUCCESS! Found {result_count} results:")

                                    # Show first few results
                                    for idx, result in enumerate(results.get('results', [])[:5]):
                                        print(f"      {idx+1}. {result}")

                                    if result_count > 5:
                                        print(f"      ... and {result_count - 5} more results")
                                else:
                                    print(f"   ⚠️  0 results for this scanner/period combination")

                            break

                        elif status == 'failed':
                            print(f"   ❌ Execution failed!")
                            break

                except Exception as e:
                    print(f"   ❌ Status check error: {e}")
                    break

        except Exception as e:
            print(f"   ❌ Test error: {e}")

    return True

def main():
    """Test built-in scanner comparison"""
    print("🔍 BUILT-IN SCANNER COMPARISON TEST")
    print("Checking if platform is finding any results with built-in scanners")

    success = test_builtin_scanner_results()

    print(f"\n{'='*80}")
    print("🎯 BUILT-IN SCANNER COMPARISON RESULTS")
    print('='*80)
    print("This helps determine if:")
    print("- Platform is working correctly for finding results")
    print("- LC D2 patterns are just very rare (expected)")
    print("- Need to test different time periods")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)