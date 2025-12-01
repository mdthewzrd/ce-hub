#!/usr/bin/env python3
"""
🧪 Test Enhanced Parameter Detection
Verify that the new Pattern 10 correctly extracts meaningful trading parameters
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.core.parameter_integrity_system import ParameterIntegrityVerifier

def test_lc_d2_parameter_detection():
    """
    Test the enhanced parameter detection on the actual LC D2 scanner
    """
    print("🧪 TESTING ENHANCED PARAMETER DETECTION")
    print("=" * 80)

    # Load the LC D2 scanner file
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(code)} characters")

        # Initialize the parameter integrity verifier
        verifier = ParameterIntegrityVerifier()

        print(f"\n🔍 EXTRACTING PARAMETERS WITH ENHANCED DETECTION...")
        print("-" * 60)

        # Extract parameters using the enhanced system
        signature = verifier.extract_original_signature(code)

        print(f"\n📊 EXTRACTION RESULTS:")
        print("=" * 60)
        print(f"📋 Scanner Type: {signature.scanner_type}")
        print(f"📋 Total Parameters: {len(signature.parameter_values)}")
        print(f"🔑 Parameter Hash: {signature.parameter_hash[:8]}...")

        print(f"\n📊 DETECTED PARAMETERS:")
        print("-" * 60)

        # Categorize parameters for better analysis
        trading_params = {}
        api_params = {}
        technical_params = {}
        generic_params = {}

        for key, value in signature.parameter_values.items():
            if any(keyword in key for keyword in ['atr_mult', 'ema_dev', 'rvol', 'gap', 'parabolic_score',
                                                 'close_range', 'high_pct_chg', 'c_ua', 'v_ua', 'dol_v',
                                                 'high_chg_atr', 'dist_h_']):
                trading_params[key] = value
            elif any(keyword in key for keyword in ['api_key', 'base_url', 'date']):
                api_params[key] = value
            elif any(keyword in key for keyword in ['rolling_window', 'ema_span']):
                technical_params[key] = value
            else:
                generic_params[key] = value

        print(f"🎯 TRADING PARAMETERS ({len(trading_params)}):")
        for key, value in sorted(trading_params.items()):
            print(f"   📈 {key}: {value}")

        print(f"\n🔧 API PARAMETERS ({len(api_params)}):")
        for key, value in sorted(api_params.items()):
            print(f"   🔑 {key}: {value}")

        print(f"\n📊 TECHNICAL INDICATORS ({len(technical_params)}):")
        for key, value in sorted(technical_params.items()):
            print(f"   📊 {key}: {value}")

        if generic_params:
            print(f"\n🔍 OTHER PARAMETERS ({len(generic_params)}):")
            for key, value in sorted(generic_params.items()):
                print(f"   🔍 {key}: {value}")

        # Validation checks
        print(f"\n✅ VALIDATION CHECKS:")
        print("-" * 60)

        success_criteria = []

        # Check 1: Should have meaningful trading parameters (not just rolling_window)
        has_trading_params = len(trading_params) > 0
        success_criteria.append(("Has meaningful trading parameters", has_trading_params))

        # Check 2: Should have fewer rolling_window parameters than trading parameters
        has_fewer_rolling_windows = len(technical_params) <= len(trading_params)
        success_criteria.append(("Prioritizes trading params over rolling windows", has_fewer_rolling_windows))

        # Check 3: Should detect key trading thresholds
        key_params = ['atr_mult', 'ema_dev', 'rvol', 'gap']
        detected_key_params = [param for param in key_params if any(param in key for key in trading_params.keys())]
        has_key_params = len(detected_key_params) >= 3
        success_criteria.append(("Detects key trading parameters", has_key_params))

        # Check 4: Should have API constants
        has_api_params = len(api_params) > 0
        success_criteria.append(("Detects API constants", has_api_params))

        # Print validation results
        all_passed = True
        for check_name, passed in success_criteria:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"   {status}: {check_name}")
            if not passed:
                all_passed = False

        print(f"\n{'🎉 ALL TESTS PASSED!' if all_passed else '❌ SOME TESTS FAILED'}")
        print(f"📋 Summary: {len(trading_params)} trading params, {len(technical_params)} technical params")

        if has_trading_params:
            print(f"\n💡 SUCCESS: Frontend will now show meaningful parameters like:")
            for key in list(trading_params.keys())[:5]:
                print(f"   📈 {key}: {trading_params[key]}")
            print(f"   📈 ... instead of generic 'rolling_window' parameters!")

        return all_passed, signature

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        return False, None
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None

if __name__ == "__main__":
    success, signature = test_lc_d2_parameter_detection()

    if success:
        print(f"\n🎯 READY FOR FRONTEND TESTING!")
        print("The frontend should now display meaningful trading parameters instead of 'rolling_window'.")
    else:
        print(f"\n⚠️ ENHANCEMENT NEEDED")
        print("Additional parameter detection patterns may be required.")