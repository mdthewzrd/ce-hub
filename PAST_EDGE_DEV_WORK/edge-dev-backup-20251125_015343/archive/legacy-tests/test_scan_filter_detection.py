#!/usr/bin/env python3
"""
🎯 Test Scan Filter Detection
Test that the new system extracts scan filters like "atr_mult >= 4" format
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.core.parameter_integrity_system import ParameterIntegrityVerifier

def test_half_a_plus_scan_filters():
    """
    Test scan filter detection on the Half A+ scanner
    """
    print("🎯 TESTING SCAN FILTER DETECTION")
    print("=" * 60)

    # Load the Half A+ scanner file
    scanner_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded Half A+ scanner: {len(code)} characters")

        # Initialize the parameter integrity verifier
        verifier = ParameterIntegrityVerifier()

        print(f"\n🔍 EXTRACTING SCAN FILTERS...")
        print("-" * 40)

        # Extract parameters using the new scan filter detection
        signature = verifier.extract_original_signature(code)

        print(f"\n📊 EXTRACTION RESULTS:")
        print("=" * 40)
        print(f"📋 Scanner Type: {signature.scanner_type}")
        print(f"📋 Total Parameters: {len(signature.parameter_values)}")

        print(f"\n🎯 SCAN FILTERS DETECTED:")
        print("-" * 40)

        # Look for scan filter parameters (the format user wants)
        scan_filters = []
        api_params = []
        other_params = []

        for key, value in signature.parameter_values.items():
            if any(param in key for param in ['atr_mult', 'vol_mult', 'slope', 'high_ema', 'pct', 'gap', 'open_over', 'prev_']):
                scan_filters.append((key, value))
            elif any(param in key for param in ['api_key', 'base_url', 'date']):
                api_params.append((key, value))
            else:
                other_params.append((key, value))

        if scan_filters:
            print(f"✅ SCAN FILTERS ({len(scan_filters)}):")
            for key, value in sorted(scan_filters):
                if " >= " in str(value) or " > " in str(value):
                    print(f"   🎯 {value}")  # Already formatted as "param >= value"
                else:
                    operator = ">=" if key != 'prev_close_min' else ">"
                    print(f"   🎯 {key} {operator} {value}")
        else:
            print(f"❌ No scan filters detected")

        if api_params:
            print(f"\n🔧 API PARAMETERS ({len(api_params)}):")
            for key, value in sorted(api_params):
                print(f"   🔑 {key}: {value}")

        if other_params:
            print(f"\n🔍 OTHER PARAMETERS ({len(other_params)}):")
            for key, value in sorted(other_params):
                print(f"   📊 {key}: {value}")

        # Validation
        success = len(scan_filters) > 0 and "rolling_window" not in str(signature.parameter_values)

        print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Scan filter detection")
        print(f"📊 Expected format: 'atr_mult >= 4', 'vol_mult >= 2', etc.")
        print(f"📊 No rolling_window parameters: {'✅' if 'rolling_window' not in str(signature.parameter_values) else '❌'}")

        return success, scan_filters

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        return False, []
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, []

if __name__ == "__main__":
    success, filters = test_half_a_plus_scan_filters()

    if success:
        print(f"\n🎉 SUCCESS: Frontend will now show {len(filters)} scan filters!")
        print("User can manually verify the trading logic is correct.")
    else:
        print(f"\n⚠️ Detection needs improvement.")