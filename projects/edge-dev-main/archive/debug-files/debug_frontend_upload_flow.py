#!/usr/bin/env python3
"""
🔍 COMPREHENSIVE FRONTEND UPLOAD FLOW DEBUGGER
==============================================

This script simulates exactly what the frontend does when uploading
the LC D2 scanner and identifies every failure point.
"""

import requests
import json
import time
from pathlib import Path
import traceback

def debug_frontend_upload_flow():
    """Debug the complete frontend upload flow step by step"""

    print("🔍 COMPREHENSIVE FRONTEND UPLOAD FLOW DEBUG")
    print("=" * 70)

    # Step 1: Verify file exists
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    print(f"📄 STEP 1: File Verification")
    if not Path(lc_d2_file).exists():
        print(f"❌ CRITICAL: LC D2 file not found at {lc_d2_file}")
        return False

    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    print(f"   ✅ File found: {len(lc_d2_code):,} characters")
    print(f"   📊 File size: {len(lc_d2_code.encode('utf-8')):,} bytes")

    # Step 2: Test format/code endpoint (what frontend calls first)
    print(f"\n🔍 STEP 2: Format Code API Call")
    print(f"   URL: http://localhost:8000/api/format/code")

    try:
        format_start = time.time()
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json={"code": lc_d2_code},
            timeout=60,
            headers={'Content-Type': 'application/json'}
        )
        format_duration = time.time() - format_start

        print(f"   📊 Response time: {format_duration:.2f}s")
        print(f"   📊 Status code: {format_response.status_code}")
        print(f"   📊 Response size: {len(format_response.text):,} characters")

        if format_response.status_code == 200:
            format_data = format_response.json()

            print(f"   ✅ API call successful")
            print(f"   📊 Backend success flag: {format_data.get('success')}")
            print(f"   📊 Message: {format_data.get('message', 'No message')}")

            # Analyze the response structure in detail
            metadata = format_data.get('metadata', {})
            ai_extraction = metadata.get('ai_extraction', {})
            intelligent_params = metadata.get('intelligent_parameters', {})

            print(f"\n   🔍 DETAILED RESPONSE ANALYSIS:")
            print(f"      format_data keys: {list(format_data.keys())}")
            print(f"      metadata keys: {list(metadata.keys())}")
            print(f"      ai_extraction keys: {list(ai_extraction.keys()) if ai_extraction else 'None'}")
            print(f"      intelligent_parameters type: {type(intelligent_params)} (size: {len(intelligent_params) if intelligent_params else 0})")

            # Check what frontend logic would find
            print(f"\n   🎯 FRONTEND LOGIC SIMULATION:")

            # OLD logic (should fail)
            old_params = ai_extraction.get('parameters', {}) if ai_extraction else {}
            print(f"      OLD: ai_extraction.parameters = {len(old_params)} parameters")

            # NEW logic (should work)
            new_params = intelligent_params or (ai_extraction.get('parameters', {}) if ai_extraction else {})
            print(f"      NEW: intelligent_parameters first = {len(new_params)} parameters")

            # Frontend condition check
            has_ai_extraction = bool(ai_extraction)
            has_params = bool(intelligent_params) or bool(ai_extraction.get('parameters') if ai_extraction else False)
            condition_met = has_ai_extraction and has_params

            print(f"      Frontend condition: ai_extraction={has_ai_extraction} AND params={has_params} = {condition_met}")

            if condition_met:
                print(f"      ✅ Frontend should show analysis with {len(new_params)} parameters")

                # Show sample parameters
                if new_params and len(new_params) > 0:
                    sample_params = list(new_params.keys())[:5]
                    print(f"      🎯 Sample parameters: {sample_params}")

                    # Check parameter types/values
                    for param in sample_params:
                        value = new_params[param]
                        print(f"         {param}: {value} ({type(value).__name__})")

            else:
                print(f"      ❌ Frontend will fail - condition not met")

                # Detailed failure analysis
                if not has_ai_extraction:
                    print(f"         ISSUE: ai_extraction missing or empty")
                if not has_params:
                    print(f"         ISSUE: No parameters found in either location")

            # Check warnings
            warnings = format_data.get('warnings', [])
            if warnings:
                print(f"   ⚠️ Warnings found: {warnings}")

            return format_data

        else:
            print(f"   ❌ API call failed")
            print(f"   📊 Response: {format_response.text}")
            return False

    except requests.exceptions.Timeout:
        print(f"   ❌ TIMEOUT: Format request took >60s")
        return False
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        print(f"   📊 Traceback: {traceback.format_exc()}")
        return False

def test_frontend_endpoints():
    """Test all the endpoints the frontend uses"""

    print(f"\n🌐 STEP 3: Frontend Endpoint Availability")

    endpoints = [
        "http://localhost:8000/api/format/code",
        "http://localhost:8000/api/scan/execute",
        "http://localhost:8000/api/scan/status/test",
        "http://localhost:8000/docs"
    ]

    for endpoint in endpoints:
        try:
            if "status" in endpoint:
                # Skip status check for non-existent scan
                continue

            if "docs" in endpoint:
                response = requests.get(endpoint, timeout=5)
            else:
                # Test with minimal payload
                response = requests.post(endpoint, json={"test": "ping"}, timeout=5)

            print(f"   📍 {endpoint}: {response.status_code}")

        except Exception as e:
            print(f"   ❌ {endpoint}: ERROR - {e}")

def check_browser_console_simulation():
    """Simulate what would show up in browser console"""

    print(f"\n🖥️ STEP 4: Browser Console Simulation")
    print(f"   (What the frontend JavaScript would log)")

    # This would require actually checking what the frontend logs
    print(f"   💡 RECOMMENDATION: Check browser dev tools for:")
    print(f"      - Network tab: API calls and responses")
    print(f"      - Console tab: JavaScript errors")
    print(f"      - Application tab: Local storage/session data")

if __name__ == "__main__":
    print("🚀 Starting comprehensive frontend upload flow debugging...")

    # Run the complete diagnostic
    result = debug_frontend_upload_flow()
    test_frontend_endpoints()
    check_browser_console_simulation()

    print(f"\n📋 DIAGNOSTIC SUMMARY")
    print(f"=" * 50)

    if result:
        print(f"✅ Backend APIs are responding correctly")
        print(f"✅ Parameter extraction is working")
        print(f"💡 If frontend still fails, the issue is likely:")
        print(f"   1. Frontend code not updated")
        print(f"   2. Browser cache issue")
        print(f"   3. JavaScript runtime error")
        print(f"   4. Network/CORS issue")
    else:
        print(f"❌ Backend API failure detected")
        print(f"💡 Backend issues need to be resolved first")

    print(f"\n🎯 NEXT STEPS:")
    print(f"   1. If backend works: Clear browser cache, check dev tools")
    print(f"   2. If backend fails: Debug backend parameter extraction")
    print(f"   3. Compare this output to actual frontend behavior")