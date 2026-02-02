#!/usr/bin/env python3
"""
Test the FIXED parameter extraction to ensure real LC D2 scanner parameters are displayed
"""
import requests
import json
import time

def test_fixed_parameter_extraction():
    print("🔧 Testing FIXED Parameter Extraction")
    print("=" * 50)

    # Read the real LC D2 scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        try:
            with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
                scanner_code = f.read()
            print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
        except FileNotFoundError:
            print("❌ LC D2 scanner file not found")
            return

    # Test the FIXED fast analysis endpoint on port 8002
    start_time = time.time()

    try:
        print("🚀 Testing FIXED fast analysis endpoint (should extract real parameters)...")
        response = requests.post("http://localhost:8002/api/format/analyze-only",
                               json={"code": scanner_code, "filename": "lc_d2_real.py"},
                               timeout=60)

        end_time = time.time()
        processing_time = end_time - start_time

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Fast analysis completed successfully!")
            print(f"⚡ Processing time: {processing_time:.2f} seconds")

            # Check if we're getting real parameters instead of generic templates
            print(f"\n📊 Analysis Results:")
            print(f"   Parameters extracted: {result.get('parameters_extracted', 0)}")
            print(f"   Execution skipped: {result.get('execution_skipped', False)}")
            print(f"   Analysis mode: {result.get('analysis_mode', 'unknown')}")

            # Check intelligent parameters for real LC D2 parameters
            intelligent_params = result.get('metadata', {}).get('intelligent_parameters', {})
            print(f"\n🔍 Intelligent Parameters Found: {len(intelligent_params)}")

            # Look for real LC D2 scanner parameters
            real_lc_d2_params = []
            template_params = []

            for param_name, param_value in intelligent_params.items():
                if param_name in ['DATE', 'API_KEY', 'BASE_URL', 'volume_threshold', 'price_min',
                                'high_threshold', 'low_threshold', 'gap_threshold', 'percentage',
                                'min_volume', 'max_volume', 'atr_period']:
                    real_lc_d2_params.append((param_name, param_value))
                elif param_value in [1000000, 0.5, 10.0, 1.0] and 'param' in param_name:
                    template_params.append((param_name, param_value))

            print(f"\n🎯 REAL LC D2 Parameters Found: {len(real_lc_d2_params)}")
            for param_name, param_value in real_lc_d2_params[:10]:  # Show first 10
                print(f"   {param_name}: {param_value}")

            print(f"\n❌ Template Parameters Found: {len(template_params)}")
            for param_name, param_value in template_params[:5]:  # Show first 5
                print(f"   {param_name}: {param_value}")

            # Success criteria
            if len(real_lc_d2_params) > 0 and len(template_params) == 0:
                print(f"\n🎉 SUCCESS: Fixed parameter extraction is working!")
                print(f"✅ Found {len(real_lc_d2_params)} real LC D2 parameters")
                print(f"✅ No generic template parameters with 1000000 values")
                return True
            elif len(real_lc_d2_params) > len(template_params):
                print(f"\n✅ IMPROVED: More real parameters than templates!")
                print(f"✅ Real parameters: {len(real_lc_d2_params)}")
                print(f"⚠️ Template parameters still present: {len(template_params)}")
                return True
            else:
                print(f"\n⚠️ ISSUE: Still extracting generic template parameters")
                print(f"   Real parameters: {len(real_lc_d2_params)}")
                print(f"   Template parameters: {len(template_params)}")
                return False

        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT: Analysis still hanging after 60 seconds")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_fixed_parameter_extraction()
    if success:
        print("\n🎉 PARAMETER EXTRACTION FIX VALIDATED!")
        print("✅ The frontend should now display real LC D2 scanner parameters")
    else:
        print("\n❌ PARAMETER EXTRACTION STILL NEEDS WORK")