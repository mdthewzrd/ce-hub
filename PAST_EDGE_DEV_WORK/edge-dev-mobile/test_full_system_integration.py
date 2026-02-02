#!/usr/bin/env python3
"""
Complete System Integration Test

Tests the entire multi-scanner workflow from upload to parameter extraction
to identify ALL issues at once instead of fixing them piecemeal.
"""

import sys
import os
import json
import asyncio
import aiohttp

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_complete_system():
    """Test the complete system integration"""

    print("🧪 COMPLETE SYSTEM INTEGRATION TEST")
    print("=" * 60)

    # Read the LC D2 scanner file
    lc_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(lc_file_path, 'r') as f:
            code = f.read()

        print(f"✅ Read test file ({len(code)} characters)")

        async with aiohttp.ClientSession() as session:

            # Step 1: Test Analysis API
            print("\n🔍 Step 1: Testing Analysis API")
            analysis_response = await session.post(
                'http://localhost:8000/api/format/analyze-code',
                json={
                    'code': code,
                    'analysis_type': 'comprehensive_with_separation'
                }
            )

            if analysis_response.status != 200:
                print(f"❌ Analysis API failed: {analysis_response.status}")
                return False

            analysis_data = await analysis_response.json()
            print(f"✅ Analysis API: {analysis_data.get('scanner_type')}")
            print(f"   Detected scanners: {len(analysis_data.get('detected_scanners', []))}")
            print(f"   Separation possible: {analysis_data.get('separation_possible', False)}")

            # Step 2: Test Parameter Extraction API
            print("\n📊 Step 2: Testing Parameter Extraction API")
            param_response = await session.post(
                'http://localhost:8000/api/format/extract-parameters',
                json={'code': code}
            )

            if param_response.status != 200:
                print(f"❌ Parameter extraction API failed: {param_response.status}")
                return False

            param_data = await param_response.json()
            print(f"✅ Parameter Extraction API: {len(param_data.get('parameters', []))} parameters")

            # Step 3: Test Individual Scanner Extraction
            print("\n🔧 Step 3: Testing Individual Scanner Extraction")
            detected_scanners = analysis_data.get('detected_scanners', [])
            scanners_with_parameters = 0  # Track how many scanners have parameters

            if not detected_scanners:
                print("❌ No scanners detected to extract")
                return False

            for i, scanner in enumerate(detected_scanners):
                print(f"\n   Testing scanner {i+1}: {scanner.get('name')}")

                extraction_response = await session.post(
                    'http://localhost:8000/api/format/extract-scanners',
                    json={
                        'code': code,
                        'scanner_analysis': {
                            'detected_scanners': [scanner]
                        }
                    }
                )

                if extraction_response.status != 200:
                    print(f"   ❌ Extraction failed: {extraction_response.status}")
                    continue

                extraction_data = await extraction_response.json()
                print(f"   ✅ Extracted: {extraction_data.get('message', 'Success')}")

                # Check if scanners were actually extracted
                extracted_scanners = extraction_data.get('extracted_scanners', [])
                if extracted_scanners:
                    for extracted in extracted_scanners:
                        params_count = extracted.get('parameters_count', 0)
                        print(f"      Scanner: {extracted.get('scanner_name')}")
                        print(f"      Parameters: {params_count}")

                        # Count scanners that successfully have parameters
                        if params_count > 0:
                            scanners_with_parameters += 1

                        # Test parameter extraction for individual scanner
                        scanner_code = extracted.get('formatted_code', '')
                        if scanner_code:
                            individual_param_response = await session.post(
                                'http://localhost:8000/api/format/extract-parameters',
                                json={'code': scanner_code}
                            )

                            if individual_param_response.status == 200:
                                individual_params = await individual_param_response.json()
                                actual_param_count = len(individual_params.get('parameters', []))
                                print(f"      Actual parameters found: {actual_param_count}")

                                if actual_param_count == 0:
                                    print(f"      ❌ ISSUE: No parameters extracted from individual scanner code")
                                    print(f"      Code length: {len(scanner_code)} characters")
                                    # Save problematic code for inspection
                                    with open(f'/Users/michaeldurante/ai dev/ce-hub/edge-dev/debug_scanner_{i}.py', 'w') as f:
                                        f.write(scanner_code)
                                    print(f"      Debug code saved to debug_scanner_{i}.py")
                else:
                    print(f"   ❌ No extracted scanners returned")

            # Step 4: Test Frontend Integration Points
            print("\n🖥️ Step 4: Testing Frontend Integration Points")

            # Test the complete workflow as the frontend would do it
            workflow_test = {
                'analysis_works': analysis_response.status == 200,
                'parameters_work': param_response.status == 200,
                'scanners_detected': len(detected_scanners) == 3,
                'extraction_works': scanners_with_parameters > 0,  # Updated based on actual extraction results
                'parameters_extracted': scanners_with_parameters == len(detected_scanners)  # All scanners have parameters
            }

            print(f"   Analysis API: {'✅' if workflow_test['analysis_works'] else '❌'}")
            print(f"   Parameter API: {'✅' if workflow_test['parameters_work'] else '❌'}")
            print(f"   Scanner Detection: {'✅' if workflow_test['scanners_detected'] else '❌'}")

            # Summary
            print(f"\n📋 SYSTEM INTEGRATION SUMMARY")
            print(f"=" * 40)

            issues_found = []

            if not workflow_test['analysis_works']:
                issues_found.append("Analysis API not working")

            if not workflow_test['parameters_work']:
                issues_found.append("Parameter extraction API not working")

            if not workflow_test['scanners_detected']:
                issues_found.append("Scanner detection not finding 3 scanners")

            if len(param_data.get('parameters', [])) == 0:
                issues_found.append("No parameters extracted from full file")

            # Check if individual scanner parameter extraction is working by tracking from above
            if not workflow_test.get('extraction_works', False):
                issues_found.append("Individual scanner parameter extraction not working")

            if issues_found:
                print("❌ ISSUES FOUND:")
                for issue in issues_found:
                    print(f"   - {issue}")
                return False
            else:
                print("✅ ALL TESTS PASSED")
                return True

    except Exception as e:
        print(f"❌ Critical error in system test: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    success = await test_complete_system()

    if success:
        print("\n🎉 SYSTEM INTEGRATION: PASSED!")
        print("✅ Multi-scanner workflow is fully functional")
    else:
        print("\n💥 SYSTEM INTEGRATION: FAILED!")
        print("❌ Critical issues found in multi-scanner workflow")
        print("\n🔧 RECOMMENDED FIXES:")
        print("1. Fix individual scanner parameter extraction")
        print("2. Ensure scanner code contains proper trading filters")
        print("3. Validate parameter detection in extracted code")
        print("4. Test complete frontend workflow")

if __name__ == "__main__":
    asyncio.run(main())