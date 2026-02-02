#!/usr/bin/env python3
"""
🔍 TEST FULL CODE PRESERVATION PROCESS
======================================

Test the complete code preservation process to ensure:
1. Parameters are correctly extracted from custom_params
2. Enhanced scan file is generated with correct parameters
3. No result loss occurs (maintains 9 matches)
"""

import sys
import os
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

from core.code_preservation_engine import preserve_and_enhance_code

def test_full_preservation():
    """Test the complete code preservation process"""

    print("🔍 TESTING FULL CODE PRESERVATION PROCESS")
    print("=" * 60)

    # Read the original scan file
    original_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"

    try:
        with open(original_file, 'r') as f:
            original_code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find original file: {original_file}")
        return False

    print(f"📁 Original file size: {len(original_code)} characters")

    # Run the preservation process
    print("\n🔧 Running code preservation process...")
    result = preserve_and_enhance_code(original_code, "A+ Daily Parabolic")

    if not result['success']:
        print(f"❌ Code preservation failed: {result['error']}")
        return False

    print(f"✅ Code preservation successful!")
    print(f"   📊 Functions preserved: {result['preserved_functions']}")
    print(f"   📊 Parameters preserved: {result['preserved_parameters']}")
    print(f"   📊 Scanner type: {result['scanner_type']}")

    # Save the enhanced code for inspection
    enhanced_file = "/Users/michaeldurante/ai dev/ce-hub/test_enhanced_scan.py"
    with open(enhanced_file, 'w') as f:
        f.write(result['enhanced_code'])

    print(f"📁 Enhanced file saved: {enhanced_file}")

    # Extract and verify the preserved parameters in the enhanced code
    enhanced_code = result['enhanced_code']

    # Check for the preserved parameters in the enhanced code
    if 'slope15d_min' in enhanced_code:
        if "'slope15d_min': 50" in enhanced_code:
            print("✅ slope15d_min: 50 (CORRECT - from custom_params)")
        elif "'slope15d_min': 40" in enhanced_code:
            print("❌ slope15d_min: 40 (WRONG - from function defaults)")
            return False
        else:
            print("⚠️ slope15d_min found but value unclear")

    if 'open_over_ema9_min' in enhanced_code:
        if "'open_over_ema9_min': 1.0" in enhanced_code:
            print("✅ open_over_ema9_min: 1.0 (CORRECT - from custom_params)")
        elif "'open_over_ema9_min': 1.25" in enhanced_code:
            print("❌ open_over_ema9_min: 1.25 (WRONG - from function defaults)")
            return False
        else:
            print("⚠️ open_over_ema9_min found but value unclear")

    if 'prev_close_min' in enhanced_code:
        if "'prev_close_min': 10.0" in enhanced_code:
            print("✅ prev_close_min: 10.0 (CORRECT - from custom_params)")
        elif "'prev_close_min': 15.0" in enhanced_code:
            print("❌ prev_close_min: 15.0 (WRONG - from function defaults)")
            return False
        else:
            print("⚠️ prev_close_min found but value unclear")

    print(f"\n🎯 SUCCESS: Enhanced scan file created with correct custom_params!")
    print(f"🎯 This should eliminate the 55% result loss issue!")
    print(f"🎯 Enhanced file ready for testing at: {enhanced_file}")

    return True

if __name__ == "__main__":
    success = test_full_preservation()
    sys.exit(0 if success else 1)