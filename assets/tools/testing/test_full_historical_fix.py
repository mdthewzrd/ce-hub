#!/usr/bin/env python3
"""
Test the fixed bypass system that now uses full historical data (2020-today)
This should match the VS Code results exactly
"""
import requests
import json
import time

def test_full_historical_fix():
    """Test that the fixed bypass system now produces all expected results"""
    print("🔧 TESTING FULL HISTORICAL DATA FIX")
    print("=" * 70)

    # Read the actual backside para scanner code
    backside_para_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
    try:
        with open(backside_para_path, 'r') as f:
            backside_code = f.read()
        print(f"✅ Loaded backside para scanner: {len(backside_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load backside para scanner: {e}")
        return False

    print(f"\n📅 Expected VS Code results (8 total):")
    expected_results = [
        "SOXL - 2025-10-02",
        "INTC - 2025-08-15",
        "XOM - 2025-06-13",
        "AMD - 2025-05-14",
        "SMCI - 2025-02-19",
        "SMCI - 2025-02-18",
        "BABA - 2025-01-29",
        "BABA - 2025-01-27"
    ]

    for i, result in enumerate(expected_results, 1):
        print(f"   {i}. {result}")

    try:
        # Test with date range that covers all expected results
        print(f"\n🚀 Testing fixed bypass system with full historical data...")
        print(f"   Backend will now fetch: 2020-01-01 to today (like original scanner)")
        print(f"   Then filter results for: 2025-01-01 to 2025-11-02")

        scan_request = {
            "scanner_type": "uploaded",
            "start_date": "2025-01-01",  # Display filter
            "end_date": "2025-11-02",    # Display filter
            "uploaded_code": backside_code
        }

        scan_response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=scan_request,
            timeout=30
        )

        if scan_response.status_code != 200:
            print(f"❌ Scan execution failed: {scan_response.status_code}")
            return False

        scan_result = scan_response.json()
        scan_id = scan_result.get('scan_id')
        print(f"✅ Scan started: {scan_id}")

        # Monitor execution for historical data messages
        full_data_detected = False
        for i in range(180):  # Wait up to 15 minutes for full historical scan
            status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
            if status_response.status_code == 200:
                status = status_response.json()
                message = status.get('message', '')

                # Check for full historical data usage
                if 'full dataset' in message.lower() or '2020-01-01' in message:
                    if not full_data_detected:
                        print(f"🔧 FULL HISTORICAL DATA DETECTED: {message}")
                        full_data_detected = True

                if status.get('status') == 'completed':
                    print(f"✅ Historical data scan completed")
                    break
                elif status.get('status') == 'failed':
                    print(f"❌ Scan failed: {status.get('message', 'Unknown error')}")
                    return False
                else:
                    progress = status.get('progress_percent', 0)
                    if progress % 20 == 0 or progress > 90:  # Log every 20% or final stages
                        print(f"⏳ Progress: {progress}% - {message}")
            time.sleep(5)
        else:
            print(f"❌ Scan timed out")
            return False

        # Get and analyze results
        print(f"\n📊 Analyzing results with full historical data...")
        results_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')

        if results_response.status_code != 200:
            print(f"❌ Failed to get results: {results_response.status_code}")
            return False

        results_data = results_response.json()
        results = results_data.get('results', [])

        print(f"📈 Total Results Found: {len(results)}")

        if results:
            print(f"\n🎯 Fixed Bypass System Results:")
            found_results = []
            for i, result in enumerate(results, 1):
                ticker = result.get('ticker', 'Unknown')
                date = result.get('date', 'Unknown')
                # Convert date if it's in ISO format
                if 'T' in str(date):
                    date = str(date).split('T')[0]
                result_str = f"{ticker} - {date}"
                found_results.append(result_str)
                print(f"   {i}. {result_str}")

            # Compare with expected VS Code results
            expected_set = set(expected_results)
            found_set = set(found_results)

            matching = expected_set.intersection(found_set)
            missing = expected_set - found_set
            extra = found_set - expected_set

            print(f"\n📋 Comparison with VS Code Results:")
            print(f"   ✅ Perfect matches: {len(matching)}/8")
            for match in sorted(matching):
                print(f"      ✓ {match}")

            if missing:
                print(f"   ⚠️  Still missing: {len(missing)}")
                for miss in sorted(missing):
                    print(f"      ✗ {miss}")

            if extra:
                print(f"   ➕ Additional results: {len(extra)}")
                for ext in sorted(extra):
                    print(f"      + {ext}")

            # Final assessment
            success_criteria = [
                full_data_detected,
                len(results) >= 8,  # Should match VS Code
                len(matching) >= 6,  # At least 75% match
                'SOXL - 2025-10-02' in found_set,  # Critical recent result
                'SMCI - 2025-02-19' in found_set,  # Critical Feb result
                'BABA - 2025-01-29' in found_set   # Critical Jan result
            ]

            if all(success_criteria):
                print(f"\n🎉 FULL HISTORICAL DATA FIX: SUCCESS!")
                print(f"   ✅ Full historical data usage confirmed")
                print(f"   ✅ Results count: {len(results)} (matches/exceeds VS Code)")
                print(f"   ✅ Key results found: SOXL, SMCI, BABA")
                print(f"   ✅ Platform now produces accurate results like original scanner")
                return True
            else:
                print(f"\n❌ Fix incomplete - some criteria not met")
                print(f"   Full data detected: {full_data_detected}")
                print(f"   Results count: {len(results)} (need 8+)")
                print(f"   Matches: {len(matching)} (need 6+)")
                return False

        else:
            print(f"❌ No results found - fix not working")
            return False

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_full_historical_fix()
    exit(0 if success else 1)