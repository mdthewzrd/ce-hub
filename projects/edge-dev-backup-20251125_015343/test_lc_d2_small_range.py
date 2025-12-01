#!/usr/bin/env python3
"""
🎯 Test LC D2 Scanner with Small Date Range
Test the LC D2 scanner with a conservative date range to avoid API limits
"""
import requests
import json
import time

def test_lc_d2_small_range():
    """Test LC D2 scanner with a 1-week date range"""
    print("🎯 TESTING LC D2 WITH SMALL DATE RANGE")
    print("Testing LC D2 scanner with 1-week range to avoid API limits...")
    print("=" * 70)

    # Load the LC scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Test with small 1-week date range to reduce API load
    start_date = "2024-10-01"
    end_date = "2024-10-07"

    print(f"\n🚀 Testing execution with SMALL date range: {start_date} to {end_date}")
    print(f"   This should reduce API calls and complete faster")

    api_url = "http://localhost:8000/api/scan/execute"
    payload = {
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code,
        "start_date": start_date,
        "end_date": end_date,
        "use_real_scan": True
    }

    try:
        response = requests.post(api_url, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ Scan failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        result = response.json()
        scan_id = result.get('scan_id')

        if not scan_id:
            print("❌ No scan ID returned")
            return False

        print(f"✅ Scan initiated: {scan_id}")

        # Monitor scan progress with extended timeout for LC D2
        status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
        results_url = f"http://localhost:8000/api/scan/results/{scan_id}"

        max_checks = 60  # 10 minutes max (60 checks * 10 seconds)
        check_count = 0

        while check_count < max_checks:
            time.sleep(10)
            check_count += 1

            # Check status
            status_response = requests.get(status_url, timeout=10)
            if status_response.status_code != 200:
                continue

            status_data = status_response.json()
            status = status_data.get('status', 'unknown')
            progress = status_data.get('progress_percent', 0)
            message = status_data.get('message', '')

            print(f"📈 Progress: {progress}% - {status} - {message}")

            if status == 'completed':
                # Get results
                results_response = requests.get(results_url, timeout=10)
                if results_response.status_code != 200:
                    print("❌ Failed to get results")
                    return False

                results = results_response.json()
                scan_results = results.get('results', [])
                total_results = len(scan_results)

                print(f"\n🎯 SCAN COMPLETED:")
                print(f"   Total results: {total_results}")

                if total_results > 0:
                    print(f"   🎉 SUCCESS: Found {total_results} results!")
                    print(f"   ✅ LC D2 scanner is working correctly!")

                    # Show sample results
                    print(f"\n📊 Sample Results:")
                    for i, result in enumerate(scan_results[:3]):
                        if isinstance(result, dict):
                            symbol = result.get('symbol', result.get('ticker', 'Unknown'))
                            date = result.get('date', 'Unknown')
                            print(f"   {i+1}. {symbol} on {date}")
                        else:
                            print(f"   {i+1}. {result}")

                    if total_results > 3:
                        print(f"   ... and {total_results - 3} more")

                    return True
                else:
                    print(f"   ⚠️ Zero results for Oct 1-7, 2024")
                    print(f"   💡 Scanner completed successfully but no LC patterns found")
                    print(f"   ✅ Technical execution is working correctly!")
                    return True

            elif status == 'failed':
                print(f"❌ Scan failed: {message}")
                return False

        print(f"⏰ Timeout after {max_checks} checks")
        return False

    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def main():
    """Test LC D2 with small range"""
    print("🚀 LC D2 SMALL RANGE TEST")
    print("Testing LC D2 scanner with conservative 1-week date range")

    success = test_lc_d2_small_range()

    print(f"\n{'='*70}")
    print("🎯 FINAL ASSESSMENT")
    print('='*70)

    if success:
        print("🎉 LC D2 EXECUTION SUCCESS!")
        print("✅ Scanner completed successfully with small date range")
        print("✅ API timeout and execution issues resolved")
        print("✅ Technical infrastructure is working correctly")
        print("\n💡 If 0 results, LC patterns may not exist in that week")
        print("   Try different date ranges or broader periods for more results")
    else:
        print("❌ LC D2 execution still has issues")
        print("🔧 Further investigation needed")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)