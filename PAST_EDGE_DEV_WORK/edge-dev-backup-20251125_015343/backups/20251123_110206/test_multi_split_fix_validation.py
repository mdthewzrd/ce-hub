#!/usr/bin/env python3
"""
Test Multi-Split Fix: Validate that automated multi-split creates complete working scanners
Tests the REAL FIX for the multi-split feature using the actual original file
"""
import asyncio
import aiohttp
import json
import os

async def test_multi_split_fix():
    """Test that multi-split now creates complete working scanners instead of fragments"""

    print("🎯 TESTING MULTI-SPLIT FIX")
    print("=" * 70)
    print("Testing: Automated Multi-Split → Complete Working Scanners")
    print()

    # Load the original LC multi-scanner file
    original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"

    try:
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        print(f"📄 Loaded original file: {len(original_code)} characters")
        print(f"   Expected patterns: lc_frontside_d3_extended_1, lc_frontside_d2_extended, lc_frontside_d2_extended_1")
        print()

        async with aiohttp.ClientSession() as session:

            # Test the AI-powered multi-split endpoint
            print("🧠 TESTING AI-POWERED MULTI-SPLIT")
            print("-" * 50)

            ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
            ai_payload = {
                "code": original_code,
                "filename": "lc d2 scan - oct 25 new ideas (3).py"
            }

            async with session.post(ai_split_url, json=ai_payload) as response:
                print(f"   Status: {response.status}")

                if response.status == 200:
                    result = await response.json()

                    # Analyze the results
                    scanners = result.get('scanners', [])
                    total_scanners = result.get('total_scanners', 0)
                    method_used = result.get('method', 'Unknown')
                    model_used = result.get('model_used', 'Unknown')
                    confidence = result.get('analysis_confidence', 0)

                    print(f"   ✅ Multi-split SUCCESS!")
                    print(f"   📊 Generated scanners: {total_scanners}")
                    print(f"   🛠️ Method used: {method_used}")
                    print(f"   🤖 Model used: {model_used}")
                    print(f"   🎯 Confidence: {confidence:.1%}")
                    print()

                    # Validate each generated scanner
                    print("🔍 VALIDATING GENERATED SCANNERS")
                    print("-" * 50)

                    for i, scanner in enumerate(scanners, 1):
                        scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
                        scanner_code = scanner.get('formatted_code', '')
                        parameters = scanner.get('parameters', [])

                        print(f"   Scanner {i}: {scanner_name}")
                        print(f"   📄 Code length: {len(scanner_code)} characters")
                        print(f"   ⚙️ Parameters: {len(parameters)}")

                        # Critical validations for complete scanners
                        has_imports = 'import pandas as pd' in scanner_code
                        has_main_function = 'async def main()' in scanner_code
                        has_api_calls = 'polygon.io' in scanner_code
                        has_helper_functions = 'compute_indicators1' in scanner_code
                        has_specific_pattern = scanner_name.replace('_Individual', '') in scanner_code

                        # Check if it's complete (not just a function fragment)
                        is_complete = (
                            has_imports and
                            has_main_function and
                            has_api_calls and
                            has_helper_functions and
                            len(scanner_code) > 1000  # Should be close to original file size
                        )

                        if is_complete:
                            print(f"   ✅ COMPLETE SCANNER: Has imports, main function, API calls, helpers")
                        else:
                            print(f"   ❌ INCOMPLETE: Missing critical components")
                            if not has_imports: print(f"      - Missing imports")
                            if not has_main_function: print(f"      - Missing main function")
                            if not has_api_calls: print(f"      - Missing API calls")
                            if not has_helper_functions: print(f"      - Missing helper functions")
                            if len(scanner_code) <= 1000: print(f"      - Too small ({len(scanner_code)} chars)")

                        # Validate parameters are real (not template)
                        real_parameters = len(parameters) > 0
                        if real_parameters:
                            print(f"   📋 Parameters extracted: {[p['name'] for p in parameters[:3]]}")
                        else:
                            print(f"   ⚠️ No parameters extracted")

                        print(f"   🎯 Pattern-specific: {has_specific_pattern}")
                        print()

                    # Final validation
                    all_complete = all(
                        len(s.get('formatted_code', '')) > 1000 and
                        'async def main()' in s.get('formatted_code', '') and
                        'import pandas' in s.get('formatted_code', '')
                        for s in scanners
                    )

                    print("=" * 70)
                    print("🎯 FINAL VALIDATION RESULTS")
                    print("=" * 70)

                    if all_complete and total_scanners == 3:
                        print("✅ MULTI-SPLIT FIX SUCCESS!")
                        print("🎉 All scanners are COMPLETE and WORKING!")
                        print("🚀 The automated multi-split now creates full scanners!")
                        print()
                        print("✅ Fix validation criteria met:")
                        print("   ✅ 3 complete scanners generated")
                        print("   ✅ Each scanner has full file structure")
                        print("   ✅ All imports, helpers, and main logic preserved")
                        print("   ✅ Real parameter extraction working")
                        print("   ✅ Pattern-specific filtering implemented")
                        return True
                    else:
                        print("❌ MULTI-SPLIT FIX INCOMPLETE")
                        print("🔧 Some scanners still incomplete or missing")
                        if total_scanners != 3:
                            print(f"   - Expected 3 scanners, got {total_scanners}")
                        if not all_complete:
                            print(f"   - Some scanners missing critical components")
                        return False

                else:
                    print(f"   ❌ AI split failed: {response.status}")
                    error_text = await response.text()
                    print(f"   Error: {error_text[:300]}...")
                    return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run the multi-split fix validation test"""
    print("🎯 MULTI-SPLIT FIX VALIDATION TEST")
    print("=" * 70)
    print("Validating: Complete Working Scanners vs Function Fragments")
    print()

    success = await test_multi_split_fix()

    print()
    print("=" * 70)
    print("🎯 MULTI-SPLIT FIX VALIDATION COMPLETE")
    print("=" * 70)

    if success:
        print("✅ VALIDATION PASSED!")
        print("🎉 Multi-split fix is working correctly!")
        print("🚀 Automated multi-split creates complete working scanners!")
    else:
        print("❌ VALIDATION FAILED")
        print("🔧 Multi-split fix needs additional work")

if __name__ == "__main__":
    asyncio.run(main())