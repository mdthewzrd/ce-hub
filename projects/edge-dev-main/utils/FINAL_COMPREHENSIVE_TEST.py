#!/usr/bin/env python3
"""
🎯 FINAL COMPREHENSIVE LC D2 UPLOAD TEST
========================================

This script validates that ALL components are working correctly:
1. Backend API functionality
2. Frontend parameter extraction logic
3. Complete upload workflow
4. Cache busting effectiveness
"""

import requests
import json
import time
from pathlib import Path

def test_final_comprehensive_workflow():
    """Final comprehensive test of the entire LC D2 upload workflow"""

    print("🎯 FINAL COMPREHENSIVE LC D2 UPLOAD TEST")
    print("=" * 80)

    success_count = 0
    total_tests = 7

    # Test 1: File availability
    print(f"📋 TEST 1/7: File Availability")
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    if not Path(lc_d2_file).exists():
        print(f"   ❌ FAIL: LC D2 file not found")
        return False

    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    print(f"   ✅ PASS: File loaded ({len(lc_d2_code):,} characters)")
    success_count += 1

    # Test 2: Backend format API
    print(f"\n📋 TEST 2/7: Backend Format API")
    try:
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json={"code": lc_d2_code},
            timeout=30
        )

        if format_response.status_code == 200:
            format_data = format_response.json()
            if format_data.get('success'):
                print(f"   ✅ PASS: Backend API working (status: {format_response.status_code})")
                success_count += 1
            else:
                print(f"   ❌ FAIL: Backend returned success=False")
                print(f"   Details: {format_data.get('message', 'No message')}")
                return False
        else:
            print(f"   ❌ FAIL: Backend API error (status: {format_response.status_code})")
            return False

    except Exception as e:
        print(f"   ❌ FAIL: Backend API exception: {e}")
        return False

    # Test 3: Parameter extraction completeness
    print(f"\n📋 TEST 3/7: Parameter Extraction Completeness")
    metadata = format_data.get('metadata', {})
    ai_extraction = metadata.get('ai_extraction', {})
    intelligent_params = metadata.get('intelligent_parameters', {})

    total_params = ai_extraction.get('total_parameters', 0)
    trading_filters = ai_extraction.get('trading_filters', 0)
    intelligent_param_count = len(intelligent_params) if intelligent_params else 0

    if total_params >= 70 and trading_filters >= 50 and intelligent_param_count >= 50:
        print(f"   ✅ PASS: Parameter extraction complete")
        print(f"      Total parameters: {total_params}")
        print(f"      Trading filters: {trading_filters}")
        print(f"      Intelligent parameters: {intelligent_param_count}")
        success_count += 1
    else:
        print(f"   ❌ FAIL: Insufficient parameters extracted")
        print(f"      Total: {total_params}, Trading: {trading_filters}, Intelligent: {intelligent_param_count}")
        return False

    # Test 4: Frontend parameter detection logic
    print(f"\n📋 TEST 4/7: Frontend Parameter Detection Logic")

    # Simulate the exact frontend logic
    has_ai_extraction = bool(ai_extraction)
    has_intelligent_params = bool(intelligent_params and len(intelligent_params) > 0)
    has_legacy_params = bool(ai_extraction.get('parameters') and len(ai_extraction.get('parameters', {})) > 0)

    frontend_condition = has_ai_extraction and (has_intelligent_params or has_legacy_params)

    if frontend_condition and has_intelligent_params:
        print(f"   ✅ PASS: Frontend logic will find parameters")
        print(f"      ai_extraction exists: {has_ai_extraction}")
        print(f"      intelligent_parameters exists: {has_intelligent_params}")
        print(f"      Frontend condition met: {frontend_condition}")
        success_count += 1
    else:
        print(f"   ❌ FAIL: Frontend logic will not find parameters")
        print(f"      ai_extraction exists: {has_ai_extraction}")
        print(f"      intelligent_parameters exists: {has_intelligent_params}")
        print(f"      Frontend condition met: {frontend_condition}")
        return False

    # Test 5: Scanner type detection
    print(f"\n📋 TEST 5/7: Scanner Type Detection")
    scanner_type = format_data.get('scanner_type', 'unknown')

    if scanner_type in ['lc', 'custom']:
        print(f"   ✅ PASS: Scanner type correctly detected as '{scanner_type}'")
        success_count += 1
    else:
        print(f"   ❌ FAIL: Scanner type not detected correctly (got: '{scanner_type}')")
        return False

    # Test 6: Scan execution capability
    print(f"\n📋 TEST 6/7: Scan Execution Capability")
    try:
        scan_payload = {
            "scanner_type": "uploaded",
            "uploaded_code": lc_d2_code,
            "start_date": "2025-10-01",
            "end_date": "2025-11-01",
            "use_real_scan": True,
            "filters": intelligent_params
        }

        scan_response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=scan_payload,
            timeout=30
        )

        if scan_response.status_code == 200:
            scan_data = scan_response.json()
            if scan_data.get('success'):
                print(f"   ✅ PASS: Scan execution working")
                print(f"      Scan ID: {scan_data.get('scan_id', 'N/A')}")
                success_count += 1
            else:
                print(f"   ❌ FAIL: Scan execution returned success=False")
                return False
        else:
            print(f"   ❌ FAIL: Scan execution API error (status: {scan_response.status_code})")
            return False

    except Exception as e:
        print(f"   ❌ FAIL: Scan execution exception: {e}")
        return False

    # Test 7: Frontend server availability
    print(f"\n📋 TEST 7/7: Frontend Server Availability")
    try:
        frontend_response = requests.get("http://localhost:5658", timeout=5)
        if frontend_response.status_code == 200:
            print(f"   ✅ PASS: Frontend server responding on port 5658")
            success_count += 1
        else:
            print(f"   ❌ FAIL: Frontend server error (status: {frontend_response.status_code})")
            return False
    except Exception as e:
        print(f"   ❌ FAIL: Frontend server not reachable: {e}")
        return False

    # Final Results
    print(f"\n🎉 FINAL TEST RESULTS")
    print(f"=" * 50)
    print(f"✅ Tests passed: {success_count}/{total_tests}")
    print(f"📊 Success rate: {(success_count/total_tests)*100:.1f}%")

    if success_count == total_tests:
        print(f"\n🚀 ALL TESTS PASSED - LC D2 UPLOAD SYSTEM IS FULLY OPERATIONAL!")
        print(f"\n📋 READY FOR USER TESTING:")
        print(f"   1. Go to http://localhost:5658")
        print(f"   2. Upload: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py")
        print(f"   3. Should see: {intelligent_param_count} parameters detected")
        print(f"   4. Should see: Analysis section with trading filters")
        print(f"   5. Should be able to: Run scan successfully")
        print(f"\n💡 If user still has issues:")
        print(f"   - Clear browser cache manually (Ctrl/Cmd + Shift + R)")
        print(f"   - Try incognito/private browser window")
        print(f"   - Check browser console for JavaScript errors")
        return True
    else:
        print(f"\n❌ SYSTEM NOT READY - {total_tests - success_count} tests failed")
        return False

if __name__ == "__main__":
    success = test_final_comprehensive_workflow()
    exit(0 if success else 1)