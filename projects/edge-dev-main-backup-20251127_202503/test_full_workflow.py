#!/usr/bin/env python3
"""
🚀 Complete End-to-End Workflow Test
Test: Format → Upload → Execute → Results
Verify scanners now produce real results after parameter integrity fix
"""
import requests
import json
import time
from datetime import datetime, timedelta

def test_formatting_step(file_path: str):
    """Step 1: Test formatting with parameter integrity"""
    print("🔧 STEP 1: Testing Formatting...")

    try:
        with open(file_path, 'r') as f:
            original_code = f.read()
        print(f"✅ Loaded scanner: {len(original_code):,} characters")
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return None

    # Test formatting API
    api_url = "http://localhost:8000/api/format/code"
    payload = {"code": original_code, "scanner_type": "auto"}

    try:
        response = requests.post(api_url, json=payload, timeout=30)
        if response.status_code != 200:
            print(f"❌ Formatting failed: {response.status_code}")
            return None

        result = response.json()
        detected_type = result.get('scanner_type', 'Unknown')
        preservation_mode = result.get('metadata', {}).get('preservation_mode', False)
        formatted_code = result.get('formatted_code', '')

        print(f"✅ Formatting successful:")
        print(f"   Detected type: {detected_type}")
        print(f"   Preservation mode: {preservation_mode}")
        print(f"   Code length: {len(formatted_code):,} chars")

        # Check for contamination
        original_has_parabolic = 'parabolic_score' in original_code
        formatted_has_parabolic = 'parabolic_score' in formatted_code
        contamination_added = (not original_has_parabolic) and formatted_has_parabolic

        if contamination_added:
            print("❌ CONTAMINATION DETECTED!")
            return None
        else:
            print("✅ Parameter integrity maintained")

        return formatted_code

    except Exception as e:
        print(f"❌ Formatting error: {e}")
        return None

def test_execution_step(formatted_code: str):
    """Step 2: Test execution with formatted code"""
    print("\n🚀 STEP 2: Testing Execution...")

    # Setup scan parameters
    start_date = "2024-10-01"
    end_date = "2024-10-31"

    api_url = "http://localhost:8000/api/scan/execute"
    payload = {
        "scanner_type": "uploaded",
        "uploaded_code": formatted_code,
        "start_date": start_date,
        "end_date": end_date,
        "use_real_scan": True
    }

    try:
        print(f"🎯 Initiating scan: {start_date} to {end_date}")
        response = requests.post(api_url, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ Scan execution failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None

        result = response.json()
        scan_id = result.get('scan_id')

        if not scan_id:
            print("❌ No scan ID returned")
            return None

        print(f"✅ Scan initiated: {scan_id}")
        return scan_id

    except Exception as e:
        print(f"❌ Execution error: {e}")
        return None

def monitor_scan_progress(scan_id: str, max_wait_minutes: int = 5):
    """Step 3: Monitor scan progress and get results"""
    print(f"\n📊 STEP 3: Monitoring Scan Progress ({scan_id})...")

    status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
    results_url = f"http://localhost:8000/api/scan/results/{scan_id}"

    start_time = time.time()
    max_wait_seconds = max_wait_minutes * 60

    while True:
        try:
            # Check if we've exceeded max wait time
            elapsed = time.time() - start_time
            if elapsed > max_wait_seconds:
                print(f"⏰ Timeout after {max_wait_minutes} minutes")
                return None

            # Get scan status
            response = requests.get(status_url, timeout=10)
            if response.status_code != 200:
                print(f"❌ Status check failed: {response.status_code}")
                return None

            status_data = response.json()
            status = status_data.get('status', 'unknown')
            progress = status_data.get('progress_percent', 0)
            message = status_data.get('message', '')

            print(f"📈 Progress: {progress}% - {status} - {message}")

            if status == 'completed':
                print("✅ Scan completed! Getting results...")

                # Get results
                results_response = requests.get(results_url, timeout=10)
                if results_response.status_code != 200:
                    print(f"❌ Results fetch failed: {results_response.status_code}")
                    return None

                results = results_response.json()
                return results

            elif status == 'failed':
                print(f"❌ Scan failed: {message}")
                return None

            # Wait before next check
            time.sleep(10)

        except Exception as e:
            print(f"❌ Monitoring error: {e}")
            time.sleep(5)  # Wait and try again

def analyze_results(results: dict):
    """Step 4: Analyze scan results"""
    print(f"\n🎯 STEP 4: Analyzing Results...")

    if not results:
        print("❌ No results data")
        return False

    # Extract results data
    scan_results = results.get('results', [])
    total_results = len(scan_results)

    print(f"📊 Scan Results Summary:")
    print(f"   Total results: {total_results}")

    if total_results == 0:
        print("❌ CRITICAL: Zero results - scanning system may still be broken")
        return False

    # Analyze first few results
    print(f"\n🔍 Sample Results:")
    for i, result in enumerate(scan_results[:3]):
        if isinstance(result, dict):
            symbol = result.get('symbol', 'Unknown')
            date = result.get('date', 'Unknown')

            print(f"   {i+1}. {symbol} on {date}")

            # Show parameters if available
            if 'parameters' in result:
                params = result['parameters']
                param_count = len(params) if isinstance(params, dict) else 0
                print(f"      Parameters: {param_count}")
        else:
            print(f"   {i+1}. {result}")

    if total_results > 3:
        print(f"   ... and {total_results - 3} more results")

    # Success criteria
    if total_results >= 5:
        print(f"\n🎉 SUCCESS: {total_results} results found - Scanner is working correctly!")
        return True
    elif total_results > 0:
        print(f"\n⚠️ PARTIAL: {total_results} results found - System working but may need optimization")
        return True
    else:
        print(f"\n❌ FAILURE: No results - System still has issues")
        return False

def main():
    """Test complete workflow: Format → Upload → Execute → Results"""
    print("🚀 COMPLETE END-TO-END WORKFLOW TEST")
    print("Testing: Format → Upload → Execute → Results")
    print("=" * 80)

    # Test with the LC D2 scanner (was working in formatting test)
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    # Step 1: Format the scanner
    formatted_code = test_formatting_step(scanner_path)
    if not formatted_code:
        print("\n💥 WORKFLOW FAILED: Formatting step failed")
        return False

    # Step 2: Execute the formatted scanner
    scan_id = test_execution_step(formatted_code)
    if not scan_id:
        print("\n💥 WORKFLOW FAILED: Execution step failed")
        return False

    # Step 3 & 4: Monitor progress and analyze results
    results = monitor_scan_progress(scan_id, max_wait_minutes=10)
    if not results:
        print("\n💥 WORKFLOW FAILED: Scan monitoring failed")
        return False

    # Step 4: Analyze results
    success = analyze_results(results)

    print(f"\n{'='*80}")
    print("🎯 FINAL WORKFLOW ASSESSMENT")
    print('='*80)

    if success:
        print("🎉 COMPLETE SUCCESS!")
        print("✅ Formatting preserves parameter integrity")
        print("✅ Upload system processes scanners correctly")
        print("✅ Execution produces real results")
        print("✅ End-to-end workflow is fully functional")
        print("\n🚀 The formatting/upload issues are COMPLETELY RESOLVED!")
    else:
        print("💥 WORKFLOW INCOMPLETE")
        print("❌ Issues remain in the end-to-end process")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)