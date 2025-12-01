#!/usr/bin/env python3
"""
🔍 A+ Scanner Execution Test
Test specifically the A+ scanner that user reported hangs during execution
"""
import requests
import json
import time

def test_a_plus_scanner_execution():
    """Test A+ scanner execution to identify hanging issue"""
    print("🔍 A+ SCANNER EXECUTION TEST")
    print("Testing the specific A+ scanner that hangs during execution")
    print("=" * 70)

    # Test with the Half A+ scanner that user mentioned
    scanner_path = "/Users/michaeldurante/Downloads/half A+ scan copy.py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded A+ scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ A+ scanner not found: {scanner_path}")
        return False

    # Test with date range that should have ~8 results according to user
    start_date = "2024-01-01"
    end_date = "2025-11-07"  # Current date to cover full range

    print(f"\n🚀 Testing A+ scanner execution: {start_date} to {end_date}")
    print(f"   Expected results: ~8 (according to user feedback)")

    api_url = "http://localhost:8000/api/scan/execute"
    payload = {
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code,
        "start_date": start_date,
        "end_date": end_date,
        "use_real_scan": True
    }

    try:
        print("\n📡 Sending execution request...")
        response = requests.post(api_url, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ Execution failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        result = response.json()
        scan_id = result.get('scan_id')

        if not scan_id:
            print("❌ No scan ID returned")
            return False

        print(f"✅ A+ scan initiated: {scan_id}")

        # Monitor for hanging - check every 15 seconds for 5 minutes max
        status_url = f"http://localhost:8000/api/scan/status/{scan_id}"

        start_time = time.time()
        last_progress = -1
        stuck_count = 0
        max_stuck_checks = 4  # If progress doesn't change for 4 checks (1 minute), consider stuck

        print(f"\n📊 Monitoring A+ scanner execution...")
        print(f"   Looking for hanging behavior or infinite loops...")

        for i in range(20):  # 5 minutes max (20 checks * 15 seconds)
            time.sleep(15)

            try:
                status_response = requests.get(status_url, timeout=10)
                if status_response.status_code != 200:
                    print(f"⚠️ Status check {i+1}: Failed ({status_response.status_code})")
                    continue

                status_data = status_response.json()
                status = status_data.get('status', 'unknown')
                progress = status_data.get('progress_percent', 0)
                message = status_data.get('message', '')

                # Check for hanging/stuck behavior
                if progress == last_progress:
                    stuck_count += 1
                else:
                    stuck_count = 0

                last_progress = progress

                elapsed_time = time.time() - start_time
                print(f"⏱️  Check {i+1:2d} ({elapsed_time:5.0f}s): {progress}% - {status} - {message}")

                if stuck_count >= max_stuck_checks:
                    print(f"🚨 HANGING DETECTED!")
                    print(f"   Progress stuck at {progress}% for {stuck_count * 15} seconds")
                    print(f"   Message: '{message}'")
                    print(f"   Status: {status}")
                    return False

                if status == 'completed':
                    print(f"\n✅ A+ scan completed successfully!")

                    # Get results
                    results_url = f"http://localhost:8000/api/scan/results/{scan_id}"
                    results_response = requests.get(results_url, timeout=10)

                    if results_response.status_code != 200:
                        print(f"❌ Failed to get results: {results_response.status_code}")
                        return False

                    results = results_response.json()
                    scan_results = results.get('results', [])
                    total_results = len(scan_results)

                    print(f"📈 A+ Scanner Results:")
                    print(f"   Total found: {total_results}")
                    print(f"   Expected: ~8")

                    if total_results > 0:
                        print(f"✅ SUCCESS: A+ scanner found {total_results} results!")
                        if total_results >= 7 and total_results <= 10:
                            print(f"🎯 PERFECT: Result count matches user expectation!")

                        # Show sample results
                        print(f"\n📊 Sample A+ Results:")
                        for i, result in enumerate(scan_results[:3]):
                            if isinstance(result, dict):
                                symbol = result.get('symbol', 'Unknown')
                                date = result.get('date', 'Unknown')
                                print(f"   {i+1}. {symbol} on {date}")
                            else:
                                print(f"   {i+1}. {result}")

                        return True
                    else:
                        print(f"⚠️ ISSUE: Zero results when ~8 expected")
                        return False

                elif status == 'failed':
                    print(f"❌ A+ scan failed: {message}")
                    return False

            except Exception as e:
                print(f"⚠️ Status check error: {e}")
                continue

        print(f"\n⏰ TIMEOUT: A+ scanner did not complete in 5 minutes")
        print(f"   Last progress: {last_progress}%")
        print(f"   This confirms the hanging issue reported by user")
        return False

    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def main():
    """Test A+ scanner execution for hanging issues"""
    print("🔍 A+ SCANNER EXECUTION ANALYSIS")
    print("Testing for hanging issues during A+ scanner execution")

    success = test_a_plus_scanner_execution()

    print(f"\n{'='*70}")
    print("🎯 A+ EXECUTION ANALYSIS RESULTS")
    print('='*70)

    if success:
        print("🎉 A+ scanner executed successfully!")
        print("✅ No hanging issues detected")
        print("✅ Results match user expectations")
    else:
        print("💥 A+ SCANNER EXECUTION ISSUES CONFIRMED")
        print("❌ Scanner hangs during execution or produces wrong results")
        print("🔧 Further investigation needed in execution engine")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)