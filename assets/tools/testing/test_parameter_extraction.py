#!/usr/bin/env python3
"""
🔍 TEST PARAMETER EXTRACTION FIX
=================================

Test that the Code Preservation Engine correctly extracts custom_params
instead of function defaults, fixing the 55% result loss issue.
"""

import sys
import os
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

from core.code_preservation_engine import CodePreservationEngine

def test_parameter_extraction():
    """Test parameter extraction prioritizes custom_params over defaults"""

    print("🔍 TESTING PARAMETER EXTRACTION FIX")
    print("=" * 60)

    # Read the original scan file
    original_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"

    try:
        with open(original_file, 'r') as f:
            original_code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find original file: {original_file}")
        return False

    # Create preservation engine
    engine = CodePreservationEngine()

    # Extract parameters
    print("🔍 Testing parameter extraction...")
    params = engine._extract_parameters(original_code)

    # Expected values from custom_params (NOT function defaults!)
    expected_values = {
        'slope15d_min': 50,        # NOT 40 (from defaults)
        'open_over_ema9_min': 1.0, # NOT 1.25 (from defaults)
        'prev_close_min': 10.0,    # NOT 15.0 (from defaults)
        'atr_mult': 4,
        'vol_mult': 2.0,
        'slope3d_min': 10,
        'slope5d_min': 20,
        'slope50d_min': 60
    }

    print(f"\n🔍 VALIDATION RESULTS:")
    print(f"   📊 Total extracted parameters: {len(params)}")

    # Check critical parameters
    all_correct = True
    for param_name, expected_value in expected_values.items():
        extracted_value = params.get(param_name)

        if extracted_value == expected_value:
            print(f"   ✅ {param_name}: {extracted_value} (CORRECT)")
        else:
            print(f"   ❌ {param_name}: {extracted_value} (EXPECTED: {expected_value})")
            all_correct = False

    print(f"\n🔍 RESULT: {'✅ ALL PARAMETERS CORRECT' if all_correct else '❌ PARAMETER EXTRACTION FAILED'}")

    if all_correct:
        print("🎯 SUCCESS: custom_params correctly prioritized over function defaults!")
        print("🎯 This should fix the 55% result loss issue!")
    else:
        print("❌ FAILURE: Still extracting from function defaults instead of custom_params")

    return all_correct

if __name__ == "__main__":
    success = test_parameter_extraction()
    sys.exit(0 if success else 1)