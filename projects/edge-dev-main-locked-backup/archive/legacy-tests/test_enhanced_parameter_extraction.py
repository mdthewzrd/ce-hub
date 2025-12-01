#!/usr/bin/env python3
"""
🧪 Test Enhanced Parameter Extraction with AI Refactoring
============================================================

Test the new AI-powered parameter extraction system that can handle
complex scanner code by automatically refactoring it.
"""

import sys
import os
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

from core.intelligent_parameter_extractor import IntelligentParameterExtractor

def test_enhanced_extraction():
    """Test enhanced extraction with the problematic LC D2 scanner"""

    print("🧪 TESTING Enhanced Parameter Extraction System")
    print("=" * 60)

    # Load the problematic scanner file
    problematic_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(problematic_file, 'r') as f:
            problematic_code = f.read()

        print(f"📄 Loaded problematic scanner: {len(problematic_code)} characters")
        print()

        # Test enhanced extraction
        extractor = IntelligentParameterExtractor()
        result = extractor.extract_parameters(problematic_code, "lc_d2")

        print("\n" + "=" * 60)
        print("📊 ENHANCED EXTRACTION RESULTS:")
        print("=" * 60)
        print(f"✅ Success: {result.success}")
        print(f"🔧 Method: {result.extraction_method}")
        print(f"⏱️ Time: {result.extraction_time:.2f}s")
        print(f"🎯 Trading filters: {result.trading_filters}")
        print(f"⚙️ Config params: {result.config_params}")
        print(f"📈 Total found: {result.total_found}")
        print(f"⚡ Fallback used: {result.fallback_used}")

        if result.parameters:
            print(f"\n🎯 EXTRACTED TRADING PARAMETERS ({len(result.parameters)}):")
            for name, value in result.parameters.items():
                confidence = result.confidence_scores.get(name, 0)
                print(f"   📌 {name}: {value} (confidence: {confidence:.2f})")

        if result.details:
            print(f"\n📈 EXTRACTION DETAILS:")
            for key, value in result.details.items():
                if isinstance(value, list) and len(value) > 5:
                    print(f"   {key}: {len(value)} items - {value[:3]}...")
                elif isinstance(value, dict):
                    print(f"   {key}: {value}")
                else:
                    print(f"   {key}: {value}")

        # Compare with working scanner
        print("\n" + "=" * 60)
        print("🔬 COMPARISON TEST: Working vs Problematic Scanner")
        print("=" * 60)

        working_file = "/Users/michaeldurante/Downloads/backside para b copy.py"
        with open(working_file, 'r') as f:
            working_code = f.read()

        working_result = extractor.extract_parameters(working_code, "backside")

        print(f"📊 COMPARISON RESULTS:")
        print(f"   Working scanner: {working_result.total_found} parameters")
        print(f"   Problematic scanner: {result.total_found} parameters")
        print(f"   Improvement: {result.total_found - working_result.total_found:+d} parameters")

        return result.success and result.total_found >= 3

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_pattern_based_refactoring():
    """Test the pattern-based refactoring fallback"""

    print("\n🔧 TESTING Pattern-Based Refactoring Fallback")
    print("=" * 60)

    # Sample complex code with hardcoded parameters
    test_code = """
# Complex scanner with hardcoded parameters
if (df['gap_atr'] >= 0.3) & (df['high_chg_atr'] >= 1.5) & (df['volume'] >= 10000000):
    if (df['dist_h_9ema_atr'] >= 2.0) & (df['close_range'] >= 0.6):
        results.append(ticker)
"""

    print(f"📄 Test code: {len(test_code)} characters")

    # Test extraction
    extractor = IntelligentParameterExtractor()
    result = extractor.extract_parameters(test_code, "test")

    print(f"\n📊 Pattern-Based Results:")
    print(f"   Success: {result.success}")
    print(f"   Method: {result.extraction_method}")
    print(f"   Parameters found: {result.total_found}")

    if result.parameters:
        print(f"   Parameters: {list(result.parameters.keys())}")

    return result.success

if __name__ == "__main__":
    print("🚀 Starting Enhanced Parameter Extraction Tests...")

    # Test 1: Enhanced extraction with problematic scanner
    test1_success = test_enhanced_extraction()

    # Test 2: Pattern-based refactoring
    test2_success = test_pattern_based_refactoring()

    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Enhanced extraction: {'PASS' if test1_success else 'FAIL'}")
    print(f"✅ Pattern refactoring: {'PASS' if test2_success else 'FAIL'}")

    if test1_success and test2_success:
        print("🎉 ALL TESTS PASSED! Enhanced system is working!")
    else:
        print("❌ Some tests failed. Check logs above.")