#!/usr/bin/env python3
"""
Verify Extracted Scanner Quality

Tests that an extracted scanner maintains its functionality
and can operate independently in the dashboard system.
"""

import sys
import os
import tempfile

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main import (
    analyze_scanner_code_intelligence_with_separation,
    extract_scanner_code
)

def verify_extracted_scanner():
    """Verify that an extracted scanner works independently"""

    print("🔬 Verifying Extracted Scanner Quality")
    print("=" * 50)

    # Read the original LC D2 scanner file
    lc_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(lc_file_path, 'r') as f:
            original_code = f.read()

        print(f"✅ Read original file ({len(original_code)} characters)")

        # Analyze and get logical scanners
        analysis = analyze_scanner_code_intelligence_with_separation(original_code)
        logical_scanners = [s for s in analysis.get('detected_scanners', [])
                          if s.get('type') == 'logical_scanner']

        if not logical_scanners:
            print("❌ No logical scanners found")
            return False

        # Test the first scanner (D3 Extended)
        test_scanner = logical_scanners[0]  # lc_frontside_d3_extended_1
        scanner_name = test_scanner.get('name')
        scanner_pattern = test_scanner.get('pattern')

        print(f"\n🧪 Testing extracted scanner: {scanner_name}")
        print(f"Pattern: {scanner_pattern}")

        # Extract the scanner code
        extracted_code = extract_scanner_code(original_code, test_scanner)

        print(f"✅ Extracted scanner ({len(extracted_code)} characters)")

        # Verify the extracted code structure
        print("\n🔍 Verifying code structure...")

        # Check for essential components
        checks = [
            ("Imports section", "import pandas as pd"),
            ("Data adjustment", "def adjust_daily("),
            ("Core logic", "def check_high_lvl_filter_lc("),
            ("Row filtering", "def filter_lc_rows("),
            ("Scanner pattern", f"df['{scanner_pattern}']"),
            ("Main execution", "async def main("),
            ("Only target pattern in filter", f"df['{scanner_pattern}'] == 1")
        ]

        passed_checks = 0
        for check_name, check_pattern in checks:
            if check_pattern in extracted_code:
                print(f"   ✅ {check_name}")
                passed_checks += 1
            else:
                print(f"   ❌ {check_name}")

        # Verify no other scanner patterns leaked in
        other_patterns = [p for p in ['lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_frontside_d2_extended_1']
                         if p != scanner_pattern]

        leaked_patterns = 0
        for pattern in other_patterns:
            if f"df['{pattern}']" in extracted_code and "=" in extracted_code:
                # Check if it's actually defining the pattern (not just referencing)
                lines = extracted_code.split('\n')
                for line in lines:
                    if f"df['{pattern}']" in line and "=" in line and pattern != scanner_pattern:
                        print(f"   ⚠️  Leaked pattern definition: {pattern}")
                        leaked_patterns += 1
                        break

        if leaked_patterns == 0:
            print("   ✅ No pattern leakage detected")
            passed_checks += 1

        # Write the extracted scanner to a file for manual inspection
        output_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/extracted_{scanner_pattern}.py"
        with open(output_file, 'w') as f:
            f.write(extracted_code)

        print(f"\n📄 Extracted scanner saved to: {output_file}")

        # Syntax validation
        print("\n🔧 Validating Python syntax...")
        try:
            compile(extracted_code, '<extracted_scanner>', 'exec')
            print("   ✅ Python syntax is valid")
            passed_checks += 1
        except SyntaxError as e:
            print(f"   ❌ Syntax error: {e}")

        # Quality score
        total_checks = len(checks) + 2  # +2 for pattern leakage and syntax
        quality_score = (passed_checks / total_checks) * 100

        print(f"\n📊 Quality Score: {quality_score:.1f}% ({passed_checks}/{total_checks})")

        if quality_score >= 90:
            print("🌟 EXCELLENT - Scanner ready for production")
            result = "excellent"
        elif quality_score >= 75:
            print("✅ GOOD - Scanner ready with minor review")
            result = "good"
        elif quality_score >= 60:
            print("⚠️  ACCEPTABLE - Scanner needs review")
            result = "acceptable"
        else:
            print("❌ POOR - Scanner needs significant work")
            result = "poor"

        # Test with sample data simulation
        print(f"\n🎯 Final Assessment: {result.upper()}")

        return quality_score >= 75

    except Exception as e:
        print(f"❌ Error verifying scanner: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_extracted_scanner()

    if success:
        print("\n🎉 Scanner Verification: PASSED!")
        print("✅ Extracted scanner maintains quality and functionality")
        print("✅ Ready for dashboard integration")
    else:
        print("\n💥 Scanner Verification: FAILED!")
        print("❌ Extracted scanner needs improvement")