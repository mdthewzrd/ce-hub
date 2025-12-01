#!/usr/bin/env python3
"""
🔍 Debug Actual User Upload
Test the exact same scanner the user is uploading to see what's really happening
"""

import requests
import json

def debug_actual_user_upload():
    """
    Upload the exact LC D2 scanner the user has been trying to upload
    """
    print("🔍 DEBUGGING ACTUAL USER UPLOAD")
    print("=" * 60)

    # Load the exact scanner file the user is uploading
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code_content = f.read()

        print(f"📄 Loading user's exact scanner: {len(code_content)} characters")
        print(f"📄 File: lc d2 scan - oct 25 new ideas.py")

        # Make the exact API call the frontend makes
        print(f"\n🔧 CALLING /api/format/code (same as frontend)...")
        print("-" * 50)

        format_data = {
            "code": code_content
        }

        response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()

            print(f"✅ API Response: {response.status_code}")
            print(f"📊 Scanner Type: {result.get('scanner_type')}")

            metadata = result.get('metadata', {})
            parameters = metadata.get('parameters', {})

            print(f"📊 Total Parameters: {len(parameters)}")

            # Show exactly what the frontend receives
            print(f"\n📋 WHAT FRONTEND RECEIVES (first 10 parameters):")
            print("-" * 50)

            for i, (key, value) in enumerate(list(parameters.items())[:10], 1):
                param_type = ""
                if 'rolling_window' in key:
                    param_type = "❌ ROLLING"
                elif any(x in key for x in ['atr_mult', 'vol_mult', 'slope', 'ema_dev', 'rvol', 'gap', 'high_ema', 'pct']):
                    param_type = "✅ SCAN"
                elif any(x in key for x in ['api_key', 'base_url', 'date']):
                    param_type = "🔑 API"
                else:
                    param_type = "🔍 OTHER"

                print(f"   {i:2d}. {param_type} {key}: {value}")

            # Count parameter types
            rolling_count = len([k for k in parameters.keys() if 'rolling_window' in k])
            scan_count = len([k for k in parameters.keys() if any(x in k for x in ['atr_mult', 'vol_mult', 'slope', 'ema_dev', 'rvol', 'gap', 'high_ema', 'pct'])])

            print(f"\n📊 PARAMETER BREAKDOWN:")
            print(f"   ❌ Rolling Window Parameters: {rolling_count}")
            print(f"   ✅ Scan Filter Parameters: {scan_count}")

            if rolling_count > 0:
                print(f"\n❌ PROBLEM: Rolling windows are still being detected!")
                print("Rolling window parameters found:")
                for key, value in parameters.items():
                    if 'rolling_window' in key:
                        print(f"   📊 {key}: {value}")

            if scan_count > 0:
                print(f"\n✅ GOOD: Scan filters are being detected:")
                scan_filters = [(k, v) for k, v in parameters.items() if any(x in k for x in ['atr_mult', 'vol_mult', 'slope', 'high_ema', 'gap_div', 'pct'])]
                for key, value in scan_filters[:5]:
                    print(f"   🎯 {key}: {value}")

            # Check if the scan filter detection logic worked
            if rolling_count > 0 and scan_count > 0:
                print(f"\n🚨 ROOT CAUSE: Both rolling windows AND scan filters detected!")
                print("The suppression logic isn't working properly.")
            elif rolling_count > 0 and scan_count == 0:
                print(f"\n🚨 ROOT CAUSE: Only rolling windows detected, no scan filters found!")
                print("The scan filter detection isn't working for this file.")
            elif rolling_count == 0 and scan_count > 0:
                print(f"\n✅ SUCCESS: Only scan filters detected, rolling windows suppressed!")
                print("This should be working in the frontend.")

            return parameters, rolling_count, scan_count

        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return {}, 0, 0

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        return {}, 0, 0
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()
        return {}, 0, 0

if __name__ == "__main__":
    params, rolling_count, scan_count = debug_actual_user_upload()

    print(f"\n🎯 DIAGNOSIS:")
    print("=" * 40)

    if rolling_count > 0:
        print(f"❌ ISSUE: Frontend still shows rolling windows because API returns them")
        print(f"🔧 SOLUTION: Need to fix backend scan filter detection or suppression logic")
    else:
        print(f"✅ API correctly suppresses rolling windows")
        print(f"🔍 ISSUE: Might be frontend caching or different endpoint")

    print(f"\n📊 Summary: {rolling_count} rolling windows, {scan_count} scan filters")