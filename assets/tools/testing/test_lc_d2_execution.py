#!/usr/bin/env python3
"""
🔍 Test LC D2 Scanner Execution After Syntax Fix
Test the complete execution path to see if the syntax error is fixed and scanner produces results
"""
import requests
import json
import time

def test_lc_d2_execution():
    """Test LC D2 scanner execution through the API"""
    print("🔍 TESTING LC D2 SCANNER EXECUTION AFTER SYNTAX FIX")
    print("Testing complete execution path through the API...")
    print("=" * 80)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Step 1: Test execution through the API
    execute_url = "http://localhost:8000/api/scan/execute"
    execute_payload = {
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code,
        "start_date": "2025-01-01",
        "end_date": "2025-11-08"
    }

    print(f"\n🔧 Testing LC D2 scanner execution...")
    print(f"   Date range: {execute_payload['start_date']} to {execute_payload['end_date']}")

    try:
        # Execute the scanner
        execute_response = requests.post(execute_url, json=execute_payload, timeout=120)

        if execute_response.status_code != 200:
            print(f"❌ Execution failed: {execute_response.status_code}")
            print(f"Response: {execute_response.text}")
            return False

        execute_result = execute_response.json()

        if not execute_result.get('success'):
            print(f"❌ Execution failed: {execute_result.get('message', 'Unknown error')}")
            return False

        scan_id = execute_result.get('scan_id')
        print(f"✅ Scanner execution started successfully!")
        print(f"   Scan ID: {scan_id}")

        # Step 2: Wait for execution to complete and check results
        status_url = f"http://localhost:8000/api/scan/status/{scan_id}"

        print(f"\n🔍 Monitoring execution status...")

        # Wait for execution to complete (up to 60 seconds)
        for i in range(60):
            time.sleep(1)

            try:
                status_response = requests.get(status_url, timeout=10)
                if status_response.status_code == 200:
                    status_result = status_response.json()
                    status = status_result.get('status', 'unknown')

                    print(f"   Status check {i+1}: {status}")

                    if status == 'completed':
                        # Get results
                        results_url = f"http://localhost:8000/api/scan/results/{scan_id}"
                        results_response = requests.get(results_url, timeout=10)

                        if results_response.status_code == 200:
                            results = results_response.json()
                            result_count = len(results.get('results', []))

                            print(f"\n🎯 EXECUTION COMPLETED!")
                            print(f"   Results found: {result_count}")

                            if result_count > 0:
                                print(f"✅ SUCCESS! LC D2 scanner produced {result_count} results")

                                # Show first few results
                                for idx, result in enumerate(results.get('results', [])[:3]):
                                    print(f"   {idx+1}. {result}")

                                if result_count > 3:
                                    print(f"   ... and {result_count - 3} more results")

                                return True
                            else:
                                print(f"⚠️  Scanner executed successfully but found 0 results")
                                print(f"   This could mean:")
                                print(f"   - No stocks met the scan criteria for this date range")
                                print(f"   - The scan criteria are too restrictive")
                                print(f"   - There might be a data or logic issue")
                                return True  # Syntax is fixed, just no results
                        else:
                            print(f"❌ Failed to get results: {results_response.status_code}")
                            return False

                    elif status == 'failed':
                        print(f"❌ Execution failed!")
                        return False

            except Exception as e:
                print(f"   Status check error: {e}")

        print(f"⚠️  Execution timeout after 60 seconds")
        return False

    except Exception as e:
        print(f"❌ Execution test error: {e}")
        return False

def main():
    """Test LC D2 scanner execution after syntax fix"""
    print("🔍 LC D2 SCANNER EXECUTION TEST")
    print("Testing if syntax error fix allows scanner to run and produce results")

    success = test_lc_d2_execution()

    print(f"\n{'='*80}")
    print("🎯 LC D2 EXECUTION TEST RESULTS")
    print('='*80)

    if success:
        print("✅ LC D2 scanner execution test PASSED!")
        print("   The syntax error has been fixed and scanner can execute")
    else:
        print("❌ LC D2 scanner execution test FAILED")
        print("   Either syntax error persists or there are other issues")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)