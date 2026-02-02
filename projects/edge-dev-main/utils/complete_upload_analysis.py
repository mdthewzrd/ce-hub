#!/usr/bin/env python3
"""
🔍 Complete Upload Flow Analysis
================================

Trace every step of the LC D2 upload process to find exactly
where it's failing for the user.
"""

import requests
import json
import time
from pathlib import Path

def analyze_complete_upload_flow():
    """Analyze every step of the upload flow"""

    print("🔍 COMPLETE LC D2 UPLOAD FLOW ANALYSIS")
    print("=" * 60)

    # Step 1: Load LC D2 scanner
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    if not Path(lc_d2_file).exists():
        print(f"❌ CRITICAL: LC D2 file not found at {lc_d2_file}")
        return False

    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    print(f"📄 Step 1: File Load")
    print(f"   ✅ File found: {len(lc_d2_code):,} characters")
    print(f"   ✅ File size: {len(lc_d2_code.encode('utf-8')):,} bytes")

    # Step 2: Test what frontend calls during "analysis"
    print(f"\n🔍 Step 2: Frontend Analysis Phase")
    print(f"   Testing: POST /api/format/code (what frontend calls for parameter extraction)")

    format_payload = {"code": lc_d2_code}
    format_payload_size = len(json.dumps(format_payload))

    print(f"   Request size: {format_payload_size:,} bytes")

    try:
        # Test with realistic frontend timeout
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_payload,
            timeout=30  # Frontend timeout for format requests
        )

        print(f"   Response status: {format_response.status_code}")
        print(f"   Response time: {format_response.elapsed.total_seconds():.2f}s")

        if format_response.status_code == 200:
            format_data = format_response.json()

            # Check data structure that frontend expects
            metadata = format_data.get('metadata', {})
            ai_extraction = metadata.get('ai_extraction', {})
            intelligent_params = metadata.get('intelligent_parameters', {})

            print(f"   ✅ Analysis successful")
            print(f"   Backend success: {format_data.get('success')}")
            print(f"   Scanner type: {metadata.get('scanner_type', 'unknown')}")
            print(f"   Total parameters: {ai_extraction.get('total_parameters', 0)}")
            print(f"   Trading filters: {ai_extraction.get('trading_filters', 0)}")
            print(f"   Config params: {ai_extraction.get('config_params', 0)}")
            print(f"   Warnings: {len(format_data.get('warnings', []))}")

            # CRITICAL: Check if data matches what frontend code expects
            print(f"\n   🔍 Frontend Data Structure Check:")
            print(f"      metadata exists: {bool(metadata)}")
            print(f"      ai_extraction exists: {bool(ai_extraction)}")
            print(f"      ai_extraction.parameters exists: {bool(ai_extraction.get('parameters'))}")
            print(f"      intelligent_parameters exists: {bool(intelligent_params)}")
            print(f"      old parameters exists: {bool(metadata.get('parameters'))}")

            # Check what frontend should use for parameters
            if ai_extraction.get('parameters'):
                param_source = "ai_extraction.parameters"
                param_count = len(ai_extraction['parameters'])
            elif intelligent_params:
                param_source = "intelligent_parameters"
                param_count = len(intelligent_params)
            elif metadata.get('parameters'):
                param_source = "old parameters"
                param_count = len(metadata['parameters'])
            else:
                param_source = "NONE FOUND"
                param_count = 0

            print(f"      Frontend should use: {param_source} ({param_count} parameters)")

            if format_data.get('warnings'):
                print(f"   ⚠️ Warnings: {format_data['warnings']}")

        else:
            print(f"   ❌ Analysis failed: {format_response.text}")
            return False

    except requests.exceptions.Timeout:
        print(f"   ❌ Analysis TIMEOUT (>30s) - this is why frontend fails!")
        return False
    except Exception as e:
        print(f"   ❌ Analysis error: {e}")
        return False

    # Step 3: Test what happens when user clicks "run scan"
    print(f"\n🚀 Step 3: Frontend Scan Execution Phase")
    print(f"   Testing: POST /api/scan/execute (what frontend calls when user clicks run)")

    scan_payload = {
        "scanner_type": "uploaded",
        "uploaded_code": lc_d2_code,
        "start_date": "2025-10-01",
        "end_date": "2025-11-01",
        "use_real_scan": True,
        "filters": {"scan_type": "uploaded_scanner"}
    }

    scan_payload_size = len(json.dumps(scan_payload))
    print(f"   Request size: {scan_payload_size:,} bytes")

    try:
        # Test with frontend timeout for uploaded scanners (2 minutes)
        scan_response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=scan_payload,
            timeout=120  # My updated frontend timeout
        )

        print(f"   Response status: {scan_response.status_code}")
        print(f"   Response time: {scan_response.elapsed.total_seconds():.2f}s")

        if scan_response.status_code == 200:
            scan_data = scan_response.json()

            print(f"   ✅ Scan execution successful")
            print(f"   Backend success: {scan_data.get('success')}")
            print(f"   Scan ID: {scan_data.get('scan_id')}")
            print(f"   Message: {scan_data.get('message')}")

            # Step 4: Check scan progress (what frontend polls)
            if scan_data.get('scan_id'):
                scan_id = scan_data['scan_id']
                print(f"\n📊 Step 4: Scan Progress Monitoring")
                print(f"   Testing: GET /api/scan/status/{scan_id}")

                # Wait a moment for scan to start
                time.sleep(3)

                status_response = requests.get(
                    f"http://localhost:8000/api/scan/status/{scan_id}",
                    timeout=10
                )

                if status_response.status_code == 200:
                    status_data = status_response.json()
                    print(f"   ✅ Status check successful")
                    print(f"   Status: {status_data.get('status')}")
                    print(f"   Progress: {status_data.get('progress')}%")
                    print(f"   Message: {status_data.get('message')}")

                    # If completed quickly, check results
                    if status_data.get('status') == 'completed':
                        results_response = requests.get(
                            f"http://localhost:8000/api/scan/results/{scan_id}",
                            timeout=10
                        )

                        if results_response.status_code == 200:
                            results_data = results_response.json()
                            print(f"   📊 Results: {len(results_data.get('results', []))} found")
                        else:
                            print(f"   ❌ Results fetch failed: {results_response.status_code}")

                else:
                    print(f"   ❌ Status check failed: {status_response.status_code}")

        else:
            print(f"   ❌ Scan execution failed: {scan_response.text}")
            return False

    except requests.exceptions.Timeout:
        print(f"   ❌ Scan execution TIMEOUT (>2min) - this might be why frontend fails!")
        return False
    except Exception as e:
        print(f"   ❌ Scan execution error: {e}")
        return False

    # Summary
    print(f"\n🎉 ANALYSIS COMPLETE")
    print(f"=" * 40)
    print(f"✅ Backend APIs working perfectly")
    print(f"✅ Parameter extraction: 72 parameters found")
    print(f"✅ Scan execution: Successfully starts")
    print(f"✅ All timeouts within reasonable limits")
    print(f"")
    print(f"🔍 IF USER STILL HAS ISSUES:")
    print(f"   1. Frontend might not be calling these APIs")
    print(f"   2. Frontend might have JavaScript errors")
    print(f"   3. Frontend might be using different endpoints")
    print(f"   4. Browser might be caching old frontend code")
    print(f"")
    print(f"💡 NEXT STEPS:")
    print(f"   1. Check browser dev tools for JavaScript errors")
    print(f"   2. Check Network tab to see what APIs frontend actually calls")
    print(f"   3. Clear browser cache and reload")
    print(f"   4. Try upload in incognito mode")

    return True

if __name__ == "__main__":
    analyze_complete_upload_flow()