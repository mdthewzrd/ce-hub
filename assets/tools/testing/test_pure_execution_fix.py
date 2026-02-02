#!/usr/bin/env python3
"""
🎯 Test Pure Execution Fix - Verify No Classification System
===========================================================

This test verifies that uploaded scanners:
1. Bypass ALL classification systems
2. Go through pure execution path only
3. Produce accurate results (8 results from January 2025 for backside para)
"""
import requests
import json
import time

def test_pure_execution_fix():
    """Test that uploaded scanners now bypass classification completely"""
    print("🎯 TESTING PURE EXECUTION FIX")
    print("=" * 70)

    # Read the backside para scanner code
    backside_para_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
    try:
        with open(backside_para_path, 'r') as f:
            backside_code = f.read()
        print(f"✅ Loaded backside para scanner: {len(backside_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load backside para scanner: {e}")
        return False

    # Test 1: Verify format preview returns "uploaded" scanner type (no classification)
    print(f"\n🔧 TEST 1: Verifying format preview bypasses classification...")
    try:
        format_request = {
            "code": backside_code
        }

        format_response = requests.post(
            'http://localhost:8000/api/format/code',
            json=format_request,
            timeout=30
        )

        if format_response.status_code != 200:
            print(f"❌ Format preview failed: {format_response.status_code}")
            return False

        format_result = format_response.json()
        detected_type = format_result.get('scanner_type', 'unknown')

        print(f"📊 Scanner type returned: {detected_type}")

        if detected_type != "uploaded":
            print(f"❌ Classification still happening! Expected 'uploaded', got '{detected_type}'")
            return False
        else:
            print(f"✅ Classification bypassed - returns 'uploaded' correctly")

    except Exception as e:
        print(f"❌ Format preview test failed: {e}")
        return False

    # Test 2: Verify execution uses pure execution path
    print(f"\n🚀 TEST 2: Verifying pure execution path with accurate results...")
    try:
        scan_request = {
            "scanner_type": "uploaded",  # This should trigger pure execution
            "start_date": "2025-01-01",  # Looking for 8 results from January 2025
            "end_date": "2025-11-03",
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
        print(f"✅ Pure execution scan started: {scan_id}")

        # Monitor for pure execution messages
        pure_execution_detected = False
        classification_detected = False

        for i in range(180):  # Wait up to 3 minutes
            status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
            if status_response.status_code == 200:
                status = status_response.json()
                message = status.get('message', '')

                # Check for pure execution indicators
                if 'pure execution' in message.lower() or 'uploaded user scanner' in message.lower():
                    if not pure_execution_detected:
                        print(f"🎯 PURE EXECUTION DETECTED: {message}")
                        pure_execution_detected = True

                # Check for classification contamination
                if 'lc scanner' in message.lower() or 'a+ scanner' in message.lower():
                    if not classification_detected:
                        print(f"❌ CLASSIFICATION CONTAMINATION: {message}")
                        classification_detected = True

                if status.get('status') == 'completed':
                    print(f"✅ Pure execution scan completed")
                    break
                elif status.get('status') == 'failed':
                    print(f"❌ Scan failed: {status.get('message', 'Unknown error')}")
                    return False
                else:
                    progress = status.get('progress_percent', 0)
                    if progress % 20 == 0 or progress > 90:  # Log key progress points
                        print(f"⏳ Progress: {progress}% - {message}")
            time.sleep(5)
        else:
            print(f"❌ Scan timed out")
            return False

        # Verify execution path
        if not pure_execution_detected:
            print(f"❌ Pure execution path not detected!")
            return False
        if classification_detected:
            print(f"❌ Classification contamination detected!")
            return False
        print(f"✅ Pure execution path confirmed - no classification contamination")

        # Test 3: Verify accurate results
        print(f"\n📊 TEST 3: Analyzing results accuracy...")
        results_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')

        if results_response.status_code != 200:
            print(f"❌ Failed to get results: {results_response.status_code}")
            return False

        results_data = results_response.json()
        results = results_data.get('results', [])

        print(f"📈 Total Results Found: {len(results)}")

        # Expected accurate results from VS Code
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

        if results:
            print(f"\n🎯 Pure Execution Results:")
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

            print(f"\n📋 Accuracy Analysis:")
            print(f"   ✅ Perfect matches: {len(matching)}/8")
            for match in sorted(matching):
                print(f"      ✓ {match}")

            if missing:
                print(f"   ⚠️  Missing results: {len(missing)}")
                for miss in sorted(missing):
                    print(f"      ✗ {miss}")

            if extra:
                print(f"   ➕ Additional results: {len(extra)}")
                for ext in sorted(extra):
                    print(f"      + {ext}")

            # Success criteria
            success_criteria = [
                pure_execution_detected,           # Pure execution confirmed
                not classification_detected,       # No classification contamination
                len(results) >= 6,                # Reasonable result count
                len(matching) >= 6,               # Most results match VS Code
                'SOXL - 2025-10-02' in found_set, # Recent critical result
                'BABA - 2025-01-29' in found_set  # January critical result
            ]

            if all(success_criteria):
                print(f"\n🎉 PURE EXECUTION FIX: SUCCESS!")
                print(f"   ✅ Classification system completely bypassed")
                print(f"   ✅ Pure execution path confirmed")
                print(f"   ✅ Accurate results produced: {len(matching)}/8 matches")
                print(f"   ✅ No more wrong LC/A+ scanner routing")
                return True
            else:
                print(f"\n❌ Fix verification failed - some criteria not met")
                print(f"   Pure execution: {pure_execution_detected}")
                print(f"   No classification: {not classification_detected}")
                print(f"   Result count: {len(results)} (need 6+)")
                print(f"   Accuracy: {len(matching)}/8 (need 6+)")
                return False

        else:
            print(f"❌ No results found")
            return False

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_pure_execution_fix()
    exit(0 if success else 1)