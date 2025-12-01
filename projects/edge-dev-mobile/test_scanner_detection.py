#!/usr/bin/env python3
"""
Test Scanner Detection Logic for Multi-Scanner Separation

Tests the updated scanner detection logic to ensure it properly identifies
the 3 logical LC scanners from the multi-pattern file.
"""

import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from main import analyze_scanner_code_intelligence_with_separation

def test_lc_scanner_detection():
    """Test the LC D2 scanner file to ensure 3 logical scanners are detected"""

    print("🧪 Testing Scanner Detection Logic")
    print("=" * 50)

    # Read the LC D2 scanner file
    lc_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(lc_file_path, 'r') as f:
            code = f.read()

        print(f"✅ Successfully read LC scanner file ({len(code)} characters)")

        # Analyze the code
        print("\n🔍 Analyzing scanner code...")
        analysis = analyze_scanner_code_intelligence_with_separation(code)

        print("\n📊 Analysis Results:")
        print(f"Scanner Type: {analysis.get('scanner_type', 'Unknown')}")
        print(f"Scanner Purpose: {analysis.get('scanner_purpose', 'Unknown')}")
        print(f"Separation Possible: {analysis.get('separation_possible', False)}")
        print(f"Total Scanners Found: {analysis.get('total_scanners_found', 0)}")
        print(f"Confidence: {analysis.get('confidence', 0):.2f}")

        # Check detected scanners
        detected_scanners = analysis.get('detected_scanners', [])
        print(f"\n🎯 Detected Scanners ({len(detected_scanners)}):")

        for i, scanner in enumerate(detected_scanners):
            print(f"\n{i+1}. {scanner.get('name', 'Unknown')}")
            print(f"   Pattern: {scanner.get('pattern', 'N/A')}")
            print(f"   Type: {scanner.get('type', 'N/A')}")
            print(f"   Confidence: {scanner.get('confidence', 0):.2f}")
            print(f"   Line Range: {scanner.get('line_start', 'N/A')} - {scanner.get('line_end', 'N/A')}")

        # Validation
        print("\n✅ Validation:")

        expected_patterns = [
            'lc_frontside_d3_extended_1',
            'lc_frontside_d2_extended',
            'lc_frontside_d2_extended_1'
        ]

        found_patterns = [s.get('pattern', '') for s in detected_scanners]

        for pattern in expected_patterns:
            if pattern in found_patterns:
                print(f"✅ Found expected pattern: {pattern}")
            else:
                print(f"❌ Missing expected pattern: {pattern}")

        if len(detected_scanners) == 3:
            print("✅ Correct number of scanners detected (3)")
        else:
            print(f"❌ Expected 3 scanners, found {len(detected_scanners)}")

        if analysis.get('separation_possible', False):
            print("✅ Separation correctly identified as possible")
        else:
            print("❌ Separation not identified as possible")

        return analysis

    except Exception as e:
        print(f"❌ Error testing scanner detection: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = test_lc_scanner_detection()

    if result:
        print("\n🎉 Test completed!")

        # Write result to file for inspection
        with open('/Users/michaeldurante/ai dev/ce-hub/edge-dev/scanner_detection_test_result.json', 'w') as f:
            json.dump(result, f, indent=2, default=str)
        print("📄 Results saved to scanner_detection_test_result.json")
    else:
        print("\n💥 Test failed!")