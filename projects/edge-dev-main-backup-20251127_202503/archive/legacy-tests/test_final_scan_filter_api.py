#!/usr/bin/env python3
"""
🔗 Final Test: Scan Filter API Response
Verify the API now returns scan filters in the correct format for frontend
"""

import requests
import json

def test_final_scan_filter_api():
    """
    Quick test to verify API returns scan filters instead of rolling windows
    """
    print("🔗 FINAL TEST: Scan Filter API Response")
    print("=" * 50)

    # Test with Half A+ scanner code snippet
    test_code = '''
# Half A+ Scanner Parameters
custom_params = {
    'atr_mult': 4,
    'vol_mult': 2.0,
    'slope3d_min': 10,
    'slope5d_min': 20,
    'slope15d_min': 50,
    'high_ema9_mult': 4,
    'high_ema20_mult': 5,
    'pct7d_low_div_atr_min': 0.5,
    'pct14d_low_div_atr_min': 1.5,
    'gap_div_atr_min': 0.5,
    'open_over_ema9_min': 1.0,
    'atr_pct_change_min': 5,
    'prev_close_min': 10.0,
    'prev_gain_pct_min': 0.25,
    'pct2d_div_atr_min': 2,
    'pct3d_div_atr_min': 3,
}

API_KEY = 'test_key'
BASE_URL = 'https://api.polygon.io'

def scan_function(df):
    return df[(df['atr'] >= custom_params['atr_mult']) &
              (df['vol'] >= custom_params['vol_mult'])]
'''

    try:
        response = requests.post(
            "http://localhost:8000/api/format/code",
            json={"code": test_code},
            headers={"Content-Type": "application/json"},
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            parameters = result.get('metadata', {}).get('parameters', {})

            print(f"✅ API Response: {response.status_code}")
            print(f"📊 Scanner Type: {result.get('scanner_type')}")
            print(f"📊 Total Parameters: {len(parameters)}")

            # Check for scan filters
            scan_filters = [p for p in parameters.values() if ">=" in str(p) or ">" in str(p)]
            rolling_windows = [k for k in parameters.keys() if "rolling_window" in k]

            print(f"\n🎯 SCAN FILTERS ({len(scan_filters)}):")
            for filter_str in scan_filters[:5]:
                print(f"   ✅ {filter_str}")

            print(f"\n❌ ROLLING WINDOWS ({len(rolling_windows)}):")
            for rw in rolling_windows:
                print(f"   ❌ {rw}: {parameters[rw]}")

            success = len(scan_filters) > 0 and len(rolling_windows) == 0

            print(f"\n{'🎉 SUCCESS' if success else '❌ FAILED'}: Frontend Ready")
            if success:
                print("Frontend on port 5657 will now show scan filters like 'atr_mult >= 4'")
            else:
                print("Frontend may still show rolling_window parameters")

            return success

        else:
            print(f"❌ API Error: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_final_scan_filter_api()

    if success:
        print(f"\n🚀 READY: Upload your scanners on http://localhost:5657")
        print("You should now see actual scan filters instead of rolling_window parameters!")
    else:
        print(f"\n⚠️ Issue detected - may need backend restart")