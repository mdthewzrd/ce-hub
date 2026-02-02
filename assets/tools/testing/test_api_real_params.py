#!/usr/bin/env python3
"""
Test the API to see exactly what parameters are returned
"""
import requests
import json

def test_api_real_params():
    print("🔧 Testing API to see exact parameters returned")
    print("=" * 60)

    # Read the real LC D2 scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print("❌ LC D2 scanner file not found")
        return

    try:
        print("\n🚀 Testing API endpoint on port 8002...")
        response = requests.post("http://localhost:8002/api/format/analyze-only",
                               json={"code": scanner_code, "filename": "lc_d2_real.py"},
                               timeout=30)

        if response.status_code == 200:
            result = response.json()
            print(f"✅ API call successful!")
            print(f"📊 Parameters extracted: {result.get('parameters_extracted', 0)}")

            # Check intelligent parameters
            intelligent_params = result.get('metadata', {}).get('intelligent_parameters', {})
            print(f"\n🔍 All Intelligent Parameters Found ({len(intelligent_params)}):")

            for i, (param_name, param_value) in enumerate(intelligent_params.items()):
                print(f"   {i+1:2d}. {param_name}: {param_value}")

            # Look for scan filter patterns
            scan_filters = []
            for param_name, param_value in intelligent_params.items():
                if any(keyword in param_name for keyword in ['volume_min', 'gap_percent', 'atr_move', 'dollar_volume']):
                    scan_filters.append((param_name, param_value))

            print(f"\n🎯 Scan Filter Parameters Found ({len(scan_filters)}):")
            for param_name, param_value in scan_filters:
                print(f"   ✅ {param_name}: {param_value}")

            if len(scan_filters) > 0:
                print(f"\n🎉 SUCCESS: Found {len(scan_filters)} real scan filter parameters!")
                return True
            else:
                print(f"\n⚠️ No scan filter parameters found in API response")
                return False

        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_api_real_params()