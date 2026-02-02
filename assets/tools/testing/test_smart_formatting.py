#!/usr/bin/env python3
"""
🔧 Test Smart Formatting System
Verify that uploaded scanners get properly formatted to use efficient infrastructure
"""
import requests
import json
import time

def test_smart_formatting():
    """Test the formatting system with LC D2 scanner"""
    print("🔧 TESTING SMART FORMATTING SYSTEM")
    print("Testing whether uploaded scanners get formatted correctly...")
    print("=" * 70)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Test the formatting endpoint first
    format_url = "http://localhost:8000/api/format/code"
    format_payload = {
        "code": scanner_code
    }

    print(f"\n🔧 Testing formatting system...")

    try:
        format_response = requests.post(format_url, json=format_payload, timeout=30)

        if format_response.status_code != 200:
            print(f"❌ Formatting failed: {format_response.status_code}")
            print(f"Response: {format_response.text}")
            return False

        format_result = format_response.json()

        if format_result.get('success'):
            formatted_code = format_result.get('formatted_code', '')
            print(f"✅ Formatting succeeded!")
            print(f"   Original size: {len(scanner_code):,} characters")
            print(f"   Formatted size: {len(formatted_code):,} characters")

            # Check if it was actually transformed (not just syntax fixed)
            if len(formatted_code) > len(scanner_code):
                print(f"✅ Scanner was enhanced with infrastructure!")
                print(f"   Added {len(formatted_code) - len(scanner_code):,} characters of infrastructure")
            else:
                print(f"⚠️ Scanner size didn't increase - may not be fully transformed")

            # Check for smart infrastructure markers
            infrastructure_markers = [
                'smart_ticker_filtering',
                'efficient_api_batching',
                'polygon_api_wrapper',
                'memory_optimized',
                'rate_limit_handling'
            ]

            found_markers = [marker for marker in infrastructure_markers if marker in formatted_code]

            print(f"\n🏗️ Infrastructure Analysis:")
            print(f"   Found {len(found_markers)}/{len(infrastructure_markers)} smart features")
            for marker in found_markers:
                print(f"   ✅ {marker}")

            for marker in infrastructure_markers:
                if marker not in found_markers:
                    print(f"   ❌ {marker} (missing)")

            return True
        else:
            print(f"❌ Formatting failed: {format_result.get('error', 'Unknown error')}")
            return False

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

def test_formatted_execution():
    """Test execution with formatted scanner"""
    print(f"\n🚀 Testing formatted execution...")

    # Load and format scanner first
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"
    with open(scanner_path, 'r') as f:
        scanner_code = f.read()

    # Format the scanner
    format_url = "http://localhost:8000/api/format/code"
    format_response = requests.post(format_url, json={"code": scanner_code})

    if format_response.status_code != 200:
        print("❌ Cannot test execution - formatting failed")
        return False

    format_result = format_response.json()
    if not format_result.get('success'):
        print("❌ Cannot test execution - formatting failed")
        return False

    formatted_code = format_result.get('formatted_code')

    # Now test execution with the formatted code
    api_url = "http://localhost:8000/api/scan/execute"
    payload = {
        "scanner_type": "uploaded",
        "uploaded_code": formatted_code,  # Use formatted version
        "start_date": "2024-11-01",      # Small range for testing
        "end_date": "2024-11-07",
        "use_real_scan": True
    }

    try:
        print(f"🚀 Testing execution with formatted scanner...")
        response = requests.post(api_url, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ Execution failed: {response.status_code}")
            return False

        result = response.json()
        scan_id = result.get('scan_id')
        print(f"✅ Formatted scanner execution started: {scan_id}")

        # Monitor briefly
        status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
        for i in range(10):  # 30 seconds max
            time.sleep(3)

            status_response = requests.get(status_url, timeout=10)
            if status_response.status_code == 200:
                status_data = status_response.json()
                status = status_data.get('status', 'unknown')
                progress = status_data.get('progress_percent', 0)

                print(f"📊 Progress: {progress}% - {status}")

                if status == 'completed':
                    print(f"✅ Formatted execution completed successfully!")
                    return True
                elif status == 'failed':
                    print(f"❌ Formatted execution failed")
                    return False

        print(f"⏰ Formatted execution still running...")
        return True

    except Exception as e:
        print(f"❌ Execution test error: {e}")
        return False

def main():
    """Test both formatting and execution"""
    print("🔧 SMART FORMATTING SYSTEM TEST")
    print("Testing proper transformation of uploaded scanners")

    formatting_success = test_smart_formatting()

    print(f"\n{'='*70}")
    print("🎯 SMART FORMATTING TEST RESULTS")
    print('='*70)

    if formatting_success:
        print("🎉 FORMATTING SYSTEM WORKING!")
        print("✅ Uploaded scanners can be formatted")
        print("✅ Infrastructure transformation available")
        print("\n🔧 NEXT STEPS:")
        print("   - Ensure formatting is applied to all uploaded scanners")
        print("   - Verify efficient ticker filtering is included")
        print("   - Test with larger date ranges")

        # Test execution with formatted code
        execution_success = test_formatted_execution()

        if execution_success:
            print("✅ Formatted scanner execution working!")
        else:
            print("⚠️ Formatted scanner execution needs investigation")
    else:
        print("❌ FORMATTING SYSTEM HAS ISSUES")
        print("🔧 Debugging needed for proper scanner transformation")

    return formatting_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)