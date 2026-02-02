#!/usr/bin/env python3
"""
Test the new bypass system with actual backside para scanner
This verifies that A+ scanners are properly detected and routed to direct execution
"""
import requests
import json
import time

def test_bypass_system():
    """Test that the bypass system works with the actual backside para scanner"""
    print("🧪 Testing Bypass System with Backside Para Scanner")
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

    try:
        # Step 1: Test scanner type detection through the new bypass logic
        print(f"\n🔧 Step 1: Testing scanner type detection with bypass system...")

        # Import the bypass functions to test locally
        import sys
        sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')
        from uploaded_scanner_bypass import detect_scanner_type_simple, should_use_direct_execution

        detected_type = detect_scanner_type_simple(backside_code)
        should_bypass = should_use_direct_execution(backside_code)

        print(f"🔍 Detected Scanner Type: {detected_type}")
        print(f"🔧 Should Use Direct Execution: {should_bypass}")

        if detected_type == 'a_plus_backside' and should_bypass:
            print("✅ Bypass detection logic working correctly!")
        else:
            print(f"❌ Bypass detection failed: type='{detected_type}', bypass={should_bypass}")
            return False

        # Step 2: Test the actual API upload and execution
        print(f"\n🚀 Step 2: Testing actual upload and execution through API...")

        # Execute scan with uploaded backside para code
        scan_request = {
            "scanner_type": "uploaded",
            "start_date": "2025-10-01",
            "end_date": "2025-11-02",
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

        # Step 3: Monitor execution and check for bypass messages
        print(f"\n⏱️ Step 3: Monitoring execution for bypass system activation...")
        bypass_detected = False

        for i in range(60):  # Wait up to 5 minutes
            status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
            if status_response.status_code == 200:
                status = status_response.json()
                message = status.get('message', '')

                # Check for bypass system activation
                if 'direct execution' in message.lower() or 'bypass' in message.lower():
                    print(f"🔧 BYPASS SYSTEM ACTIVATED: {message}")
                    bypass_detected = True

                if status.get('status') == 'completed':
                    print(f"✅ Scan completed successfully")
                    break
                elif status.get('status') == 'failed':
                    print(f"❌ Scan failed: {status.get('message', 'Unknown error')}")
                    return False
                else:
                    print(f"⏳ Progress: {status.get('progress_percent', 0)}% - {message}")
            time.sleep(5)
        else:
            print(f"❌ Scan timed out")
            return False

        # Step 4: Analyze results
        print(f"\n📊 Step 4: Analyzing results...")
        results_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')

        if results_response.status_code != 200:
            print(f"❌ Failed to get results: {results_response.status_code}")
            return False

        results_data = results_response.json()
        results = results_data.get('results', [])

        print(f"📈 Total Results: {len(results)}")

        # Check for expected tickers from the user's screenshots
        expected_tickers = ['AQMS', 'GWH', 'TMQ']  # From user's original screenshots
        found_tickers = set(r.get('ticker', '') for r in results)

        print(f"🎯 Found Tickers: {sorted(list(found_tickers))}")

        # Check if we have more results than the problematic 17
        if len(results) > 17:
            print(f"✅ SUCCESS: Found {len(results)} results (more than the problematic 17)")
        else:
            print(f"⚠️  Warning: Only found {len(results)} results (same as before)")

        # Check for specific expected tickers
        expected_found = sum(1 for ticker in expected_tickers if ticker in found_tickers)
        print(f"📋 Expected tickers found: {expected_found}/{len(expected_tickers)}")

        # Final assessment
        success = bypass_detected and (len(results) > 17 or expected_found > 0)

        if success:
            print(f"\n🎉 BYPASS SYSTEM TEST PASSED!")
            print(f"   - ✅ Scanner type correctly detected as A+ backside para")
            print(f"   - ✅ Direct execution bypass activated")
            print(f"   - ✅ Results show improvement over previous runs")
        else:
            print(f"\n❌ BYPASS SYSTEM TEST FAILED")
            if not bypass_detected:
                print(f"   - ❌ Bypass system not activated (still using formatting)")
            if len(results) <= 17:
                print(f"   - ❌ Results count still problematic ({len(results)} results)")

        return success

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_bypass_system()
    exit(0 if success else 1)