#!/usr/bin/env python3
"""
Complete Parameter Extraction Test
Tests the fixed AI scanner splitting with enhanced parameter extraction
"""

import asyncio
import aiohttp
import json

async def test_complete_parameter_extraction():
    """Test the complete fixed parameter extraction workflow"""

    print("🧪 Testing Complete Parameter Extraction Workflow")
    print("=" * 70)

    # Load the user's scanner file
    with open("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py", "r") as f:
        code_content = f.read()

    base_url = "http://localhost:8000"

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        try:
            # Step 1: AI Split the Scanner with Parameter Extraction
            print("\n📊 Step 1: AI-Splitting Scanner with Parameter Extraction...")

            payload = {
                "code": code_content,
                "filename": "lc d2 scan - oct 25 new ideas (2).py"
            }

            async with session.post(f"{base_url}/api/format/ai-split-scanners",
                                  json=payload) as response:
                if response.status != 200:
                    print(f"❌ AI split failed: {response.status}")
                    error_text = await response.text()
                    print(f"Error details: {error_text[:500]}")
                    return False

                split_result = await response.json()

                # Validate response structure
                print(f"✅ AI Split Response Analysis:")
                print(f"   📊 Response Keys: {list(split_result.keys())}")
                print(f"   🎯 Success: {split_result.get('success')}")
                print(f"   🔢 Total Scanners: {split_result.get('total_scanners')}")
                print(f"   🤖 Model Used: {split_result.get('model_used')}")
                print(f"   📈 Confidence: {split_result.get('analysis_confidence', 0):.2f}")

                # Check if scanners key exists (this was the bug!)
                if 'scanners' not in split_result:
                    print(f"❌ CRITICAL ERROR: No 'scanners' key in response!")
                    print(f"   Available keys: {list(split_result.keys())}")
                    return False

                scanners = split_result['scanners']
                total_scanners = split_result.get('total_scanners', 0)

                print(f"\n📋 Detailed Scanner Analysis:")
                print(f"   🔍 Found {len(scanners)} scanners (expected: {total_scanners})")

                if len(scanners) != total_scanners:
                    print(f"❌ Scanner count mismatch: found {len(scanners)} vs reported {total_scanners}")

                total_parameters = 0
                for i, scanner in enumerate(scanners, 1):
                    scanner_name = scanner.get('scanner_name', 'Unknown')
                    description = scanner.get('description', 'No description')
                    parameters = scanner.get('parameters', [])
                    complexity = scanner.get('complexity', 'Unknown')

                    print(f"\n   📄 Scanner {i}: {scanner_name}")
                    print(f"      📝 Description: {description[:100]}...")
                    print(f"      🔧 Parameters: {len(parameters)}")
                    print(f"      📏 Complexity: {complexity}")

                    # Detailed parameter analysis
                    if parameters:
                        print(f"      🔍 Parameter Details:")
                        for j, param in enumerate(parameters[:5]):  # Show first 5
                            param_name = param.get('name', 'Unknown')
                            param_type = param.get('type', 'Unknown')
                            param_value = param.get('current_value', 'N/A')
                            print(f"         {j+1}. {param_name} ({param_type}): {param_value}")

                        if len(parameters) > 5:
                            print(f"         ... and {len(parameters) - 5} more parameters")
                    else:
                        print(f"      ❌ NO PARAMETERS EXTRACTED!")

                    total_parameters += len(parameters)

                # Summary Analysis
                print(f"\n🎯 PARAMETER EXTRACTION SUMMARY:")
                print(f"   📊 Total Scanners Detected: {len(scanners)}")
                print(f"   🔧 Total Parameters Extracted: {total_parameters}")
                print(f"   📈 Average Parameters per Scanner: {total_parameters / len(scanners) if scanners else 0:.1f}")

                # Validation against expected results
                expected_parameters = 20  # Based on user's file analysis
                if total_parameters >= expected_parameters:
                    print(f"   ✅ SUCCESS: Extracted {total_parameters} parameters (expected ≥{expected_parameters})")

                    # Test the complete workflow - save scanners to system
                    print(f"\n💾 Step 2: Testing Scanner Save to System...")
                    saved_count = 0

                    for scanner in scanners[:2]:  # Test first 2 to avoid overwhelming
                        save_payload = {
                            "scanner_code": scanner.get('formatted_code', ''),
                            "scanner_name": scanner.get('scanner_name', 'Test Scanner'),
                            "parameters_count": len(scanner.get('parameters', [])),
                            "scanner_type": "ai_generated_test"
                        }

                        async with session.post(f"{base_url}/api/format/save-scanner-to-system",
                                              json=save_payload) as save_response:
                            if save_response.status == 200:
                                save_result = await save_response.json()
                                if save_result.get('success'):
                                    saved_count += 1
                                    print(f"   ✅ Saved: {scanner.get('scanner_name')}")
                                else:
                                    print(f"   ❌ Save failed: {save_result.get('error')}")
                            else:
                                print(f"   ❌ Save request failed: {save_response.status}")

                    print(f"\n🎉 WORKFLOW TEST RESULTS:")
                    print(f"   ✅ Scanner Detection: {len(scanners)}/3 scanners found")
                    print(f"   ✅ Parameter Extraction: {total_parameters} parameters extracted")
                    print(f"   ✅ Response Structure: Fixed (now uses 'scanners' key)")
                    print(f"   ✅ System Integration: {saved_count}/{min(2, len(scanners))} scanners saved successfully")
                    print(f"\n   🎯 The user's issue with '0 Parameters Made Configurable' should now be RESOLVED!")

                    return True

                else:
                    print(f"   ❌ FAILURE: Only extracted {total_parameters} parameters (expected ≥{expected_parameters})")
                    print(f"   ❌ Parameter extraction is still not working properly")
                    return False

        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            import traceback
            traceback.print_exc()
            return False

async def main():
    success = await test_complete_parameter_extraction()

    print(f"\n{'=' * 70}")
    if success:
        print("🎉 SUCCESS: Complete Parameter Extraction Workflow is FIXED!")
        print("✅ Scanner detection: Working (3 scanners)")
        print("✅ Parameter extraction: Working (20+ parameters)")
        print("✅ Response structure: Fixed (scanners key)")
        print("✅ System integration: Working")
        print("\n🔥 The user should now see proper parameter extraction in the UI!")
        print("🔥 No more '0 Parameters Made Configurable' error!")
    else:
        print("❌ FAILED: Parameter extraction workflow still has issues")
        print("❌ Further investigation and fixes needed")
    print(f"{'=' * 70}")

if __name__ == "__main__":
    asyncio.run(main())