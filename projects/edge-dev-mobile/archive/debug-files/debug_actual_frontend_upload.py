#!/usr/bin/env python3
"""
🔍 Debug Actual Frontend Upload Issue
Analyze exactly what parameters are being returned to the frontend and why rolling_window is still showing
"""

import requests
import json
from collections import defaultdict

def analyze_frontend_upload_issue():
    """
    Debug the exact API response the frontend receives
    """
    print("🔍 DEBUGGING ACTUAL FRONTEND UPLOAD ISSUE")
    print("=" * 80)

    # Load the actual LC D2 scanner file (same one user is uploading)
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code_content = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(code_content)} characters")
        print(f"📄 File: lc d2 scan - oct 25 new ideas.py")

        # Make the exact same API call the frontend makes
        print(f"\n🔧 CALLING /api/format/code (exactly like frontend)...")
        print("-" * 60)

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

            print(f"✅ API Response Status: {response.status_code}")
            print(f"📊 Response Size: {len(response.text)} characters")

            # Extract all data the frontend sees
            scanner_type = result.get('scanner_type')
            metadata = result.get('metadata', {})
            parameters = metadata.get('parameters', {})

            print(f"\n📊 FRONTEND RECEIVES:")
            print("=" * 60)
            print(f"🎯 Scanner Type: {scanner_type}")
            print(f"📊 Total Parameters: {len(parameters)}")
            print(f"📊 Metadata Keys: {list(metadata.keys())}")

            # Categorize parameters exactly as they appear
            print(f"\n📋 PARAMETER BREAKDOWN:")
            print("-" * 60)

            # Group parameters by type/pattern
            param_groups = defaultdict(list)

            for key, value in parameters.items():
                if 'rolling_window' in key:
                    param_groups['Rolling Window'].append((key, value))
                elif 'ema_span' in key:
                    param_groups['EMA Span'].append((key, value))
                elif any(x in key for x in ['atr_mult', 'ema_dev', 'rvol', 'gap']):
                    param_groups['Trading Thresholds'].append((key, value))
                elif any(x in key for x in ['api_key', 'base_url', 'date']):
                    param_groups['API Constants'].append((key, value))
                elif 'threshold' in key:
                    param_groups['Other Thresholds'].append((key, value))
                else:
                    param_groups['Other'].append((key, value))

            # Show what frontend actually displays (first few of each type)
            for group_name, items in param_groups.items():
                print(f"\n🔍 {group_name} ({len(items)}):")
                for key, value in sorted(items)[:5]:  # Show first 5
                    print(f"   📋 {key}: {value}")
                if len(items) > 5:
                    print(f"   📋 ... and {len(items) - 5} more")

            # Specific analysis of the issue
            print(f"\n🚨 ISSUE ANALYSIS:")
            print("=" * 60)

            rolling_window_count = len(param_groups['Rolling Window'])
            trading_threshold_count = len(param_groups['Trading Thresholds'])

            print(f"❌ Rolling Window Parameters: {rolling_window_count}")
            print(f"✅ Trading Threshold Parameters: {trading_threshold_count}")

            if rolling_window_count > 0:
                print(f"\n❌ PROBLEM: Frontend still shows rolling_window parameters:")
                for key, value in param_groups['Rolling Window']:
                    print(f"   📊 {key}: {value}")

            # Check if trading parameters are being detected but not showing in UI
            if trading_threshold_count > 0:
                print(f"\n✅ GOOD: Trading parameters ARE being detected:")
                for key, value in list(param_groups['Trading Thresholds'])[:3]:
                    print(f"   📈 {key}: {value}")

            # Frontend UI ordering issue?
            print(f"\n🔍 FRONTEND DISPLAY ORDER ANALYSIS:")
            print("-" * 60)
            print("The frontend might be showing parameters in the order they appear in the response.")
            print("Rolling window parameters might be appearing first, making them most visible.")

            # Show the first 10 parameters as they would appear in frontend
            print(f"\nFirst 10 parameters (as frontend sees them):")
            for i, (key, value) in enumerate(list(parameters.items())[:10], 1):
                param_type = "🔴 Rolling" if 'rolling_window' in key else "🟢 Trading" if any(x in key for x in ['atr_mult', 'ema_dev', 'rvol']) else "🔵 Other"
                print(f"   {i:2d}. {param_type} {key}: {value}")

            return parameters, param_groups

        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return {}, {}

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        return {}, {}
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return {}, {}

if __name__ == "__main__":
    params, groups = analyze_frontend_upload_issue()

    if params:
        print(f"\n🎯 ROOT CAUSE SUMMARY:")
        print("=" * 60)

        rolling_count = len(groups.get('Rolling Window', []))
        trading_count = len(groups.get('Trading Thresholds', []))

        if rolling_count > trading_count:
            print(f"❌ ISSUE: More rolling_window ({rolling_count}) than trading ({trading_count}) parameters")
            print("🔧 SOLUTION: Need to prioritize trading parameters or reduce rolling window detection")
        elif rolling_count > 0:
            print(f"⚠️  ISSUE: Rolling window parameters ({rolling_count}) still present alongside trading ({trading_count})")
            print("🔧 SOLUTION: Need to suppress rolling window when trading parameters are detected")
        else:
            print(f"✅ SUCCESS: Only trading parameters ({trading_count}) detected, no rolling windows")

        print(f"\n📊 Total parameters: {len(params)} (user reported 80+ in frontend)")