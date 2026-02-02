#!/usr/bin/env python3
"""
🔍 Final Syntax Check
Test the actual API execution to see if syntax errors are fixed
"""
import requests
import json
import time

def final_syntax_check():
    """Test API execution with clean scanner to check for syntax errors"""
    print("🔍 FINAL SYNTAX CHECK")
    print("Testing actual API execution after f-string fix...")
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

    # Execute through API with a simple date range
    execute_url = "http://localhost:8000/api/scan/execute"
    execute_payload = {
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code,
        "start_date": "2024-11-01",
        "end_date": "2024-11-02"  # Just 2 days to minimize execution time
    }

    print(f"\n🔧 Testing API execution...")
    print(f"   Date range: {execute_payload['start_date']} to {execute_payload['end_date']}")

    try:
        # Execute the scanner
        execute_response = requests.post(execute_url, json=execute_payload, timeout=30)

        if execute_response.status_code != 200:
            print(f"❌ Execution failed: {execute_response.status_code}")
            return False

        execute_result = execute_response.json()

        if not execute_result.get('success'):
            print(f"❌ Execution failed: {execute_result.get('message', 'Unknown error')}")
            return False

        scan_id = execute_result.get('scan_id')
        print(f"✅ Scanner execution started: {scan_id}")

        # Wait for execution to complete
        status_url = f"http://localhost:8000/api/scan/status/{scan_id}"

        for i in range(10):  # Wait up to 10 seconds
            time.sleep(1)

            try:
                status_response = requests.get(status_url, timeout=10)
                if status_response.status_code == 200:
                    status_result = status_response.json()
                    status = status_result.get('status', 'unknown')

                    print(f"   Status check {i+1}: {status}")

                    if status == 'completed':
                        execution_time = status_result.get('execution_time', 0)
                        print(f"\n🎯 EXECUTION COMPLETED!")
                        print(f"   Execution time: {execution_time:.2f}s")

                        if execution_time > 0.1:  # More than 100ms means it actually ran
                            print(f"✅ SUCCESS! Scanner ran for {execution_time:.2f}s - syntax errors are FIXED!")
                            print(f"   (Execution time > 0.1s means it actually processed, not failed immediately)")
                        else:
                            print(f"⚠️  Quick completion ({execution_time:.2f}s) suggests immediate error")
                            print(f"   Check backend logs for syntax errors")

                        return execution_time > 0.1

                    elif status == 'failed':
                        print(f"❌ Execution failed!")
                        return False

            except Exception as e:
                print(f"   ❌ Status check error: {e}")
                break

        print(f"⚠️  Timeout waiting for completion")
        return False

    except Exception as e:
        print(f"❌ API execution error: {e}")
        return False

def main():
    """Final syntax check"""
    print("🔍 FINAL SYNTAX CHECK")
    print("Testing if f-string fix resolved all syntax errors")

    success = final_syntax_check()

    print(f"\n{'='*80}")
    print("🎯 FINAL SYNTAX CHECK RESULTS")
    print('='*80)

    if success:
        print("🎉 SUCCESS! Syntax errors are FIXED!")
        print("   LC D2 scanner can now execute properly")
    else:
        print("❌ Syntax errors still present")
        print("   Need to investigate additional issues")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)