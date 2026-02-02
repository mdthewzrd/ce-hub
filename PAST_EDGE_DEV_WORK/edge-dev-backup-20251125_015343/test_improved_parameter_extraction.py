#!/usr/bin/env python3
"""
Test script to validate improved trading parameter extraction
"""

import sys
import os
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

from core.enhanced_parameter_discovery import enhanced_parameter_extractor

def test_file_parameter_extraction(file_path: str, file_name: str):
    """Test parameter extraction on a specific file"""
    print(f"\n{'='*80}")
    print(f"TESTING: {file_name}")
    print(f"{'='*80}")

    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()

        print(f"File size: {len(code):,} characters")

        # Extract parameters
        result = enhanced_parameter_extractor.extract_parameters(code)

        print(f"\n📊 EXTRACTION RESULTS:")
        print(f"Success: {result.success}")
        print(f"Scanner Type: {result.scanner_type}")
        print(f"Confidence Score: {result.confidence_score:.2f}")
        print(f"Parameters Found: {len(result.parameters)}")
        print(f"Analysis Time: {result.analysis_time:.2f}s")
        print(f"Methods Used: {result.extraction_methods_used}")
        print(f"Complexity: {result.complexity_analysis}")

        if result.parameters:
            print(f"\n🎯 TRADING PARAMETERS DETECTED:")
            for i, param in enumerate(result.parameters, 1):
                print(f"{i:2d}. {param.name} = {param.value}")
                print(f"    Type: {param.type}, Confidence: {param.confidence:.2f}")
                print(f"    Line: {param.line}, Method: {param.extraction_method}")
                print(f"    Context: {param.context[:100]}...")
                if param.suggested_description:
                    print(f"    Description: {param.suggested_description}")
                print()
        else:
            print("⚠️  No parameters found!")

        if result.suggestions:
            print(f"\n💡 SUGGESTIONS:")
            for suggestion in result.suggestions:
                print(f"  • {suggestion}")

        return result

    except Exception as e:
        print(f"❌ Error testing {file_name}: {e}")
        return None

def main():
    """Test all user files"""
    print("🔍 IMPROVED TRADING PARAMETER EXTRACTION TEST")
    print("Testing focus on actual trading logic vs infrastructure values")

    test_files = [
        ('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'LC D2 Scanner'),
        ('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'LC D2 Scanner (2)'),
        ('/Users/michaeldurante/Downloads/half A+ scan copy.py', 'Half A+ Scanner')
    ]

    results = []

    for file_path, file_name in test_files:
        if os.path.exists(file_path):
            result = test_file_parameter_extraction(file_path, file_name)
            results.append((file_name, result))
        else:
            print(f"❌ File not found: {file_path}")

    # Summary
    print(f"\n{'='*80}")
    print("📋 SUMMARY RESULTS")
    print(f"{'='*80}")

    total_params = 0
    for file_name, result in results:
        if result:
            param_count = len(result.parameters)
            total_params += param_count
            print(f"{file_name}: {param_count} parameters, confidence: {result.confidence_score:.2f}")
        else:
            print(f"{file_name}: Failed")

    print(f"\n🎯 TOTAL TRADING PARAMETERS DETECTED: {total_params}")

    if total_params >= 45:  # Expecting 15+ per file × 3 files
        print("✅ SUCCESS: Detected sufficient trading parameters!")
    else:
        print("❌ ISSUE: Still not detecting enough trading parameters")

    return results

if __name__ == "__main__":
    main()