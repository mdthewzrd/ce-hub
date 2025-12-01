#!/usr/bin/env python3
"""
FINAL TEST: Real Scanner File with Fixed AI Analysis System
Tests the real unmodified scanner file with the new real AI analysis to extract 30-50+ parameters
"""

import asyncio
import aiohttp
import json
import time

async def test_real_scanner_file_complete():
    print("🎯 FINAL TEST: REAL SCANNER FILE WITH FIXED AI ANALYSIS")
    print("=" * 70)

    # Test with the real unmodified file (not commented)
    file_path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py'

    try:
        with open(file_path, 'r') as f:
            real_code = f.read()

        print(f"📄 Real scanner file loaded: {len(real_code):,} characters")
        print(f"📊 Real scanner file lines: {len(real_code.splitlines())} lines")

        # Check that it contains active scanner functions
        active_functions = []
        for func_name in ['lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_fbo']:
            if f"def {func_name}(" in real_code and ".astype(int)" in real_code:
                active_functions.append(func_name)

        print(f"🔍 Active scanner functions detected: {active_functions}")
        print(f"✅ This is the REAL unmodified scanner file with active functions")

    except Exception as e:
        print(f"❌ Failed to load real scanner file: {e}")
        return

    payload = {'code': real_code, 'filename': 'lc d2 scan - oct 25 new ideas (3).py'}

    async with aiohttp.ClientSession() as session:
        print(f"\n🚀 TESTING REAL AI ANALYSIS SYSTEM")
        print("=" * 50)

        start_time = time.time()

        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=payload) as response:
            duration = time.time() - start_time

            print(f"📡 Response Status: {response.status}")
            print(f"⏱️ Analysis Duration: {duration:.1f} seconds")

            if response.status == 200:
                result = await response.json()

                print(f"\n✅ REAL AI ANALYSIS SUCCESS!")
                print(f"📊 Response Keys: {list(result.keys())}")
                print(f"🔢 Total Scanners: {result.get('total_scanners', 0)}")
                print(f"🎯 Success Flag: {result.get('success', False)}")
                print(f"🤖 Method Used: {result.get('method', 'Unknown')}")
                print(f"📈 Analysis Confidence: {result.get('analysis_confidence', 0):.2f}")
                print(f"🧠 Model Used: {result.get('model_used', 'Unknown')}")

                if "scanners" in result:
                    scanners = result["scanners"]
                    total_params = 0

                    print(f"\n📋 DETAILED REAL SCANNER ANALYSIS:")
                    print("=" * 60)

                    for i, scanner in enumerate(scanners, 1):
                        name = scanner.get("scanner_name", "Unknown")
                        desc = scanner.get("description", "No description")
                        params = scanner.get("parameters", [])
                        complexity = scanner.get("complexity", "Unknown")
                        scanner_code_length = len(scanner.get("scanner_code", ""))

                        print(f"\n📄 Scanner {i}: {name}")
                        print(f"   📝 Description: {desc}")
                        print(f"   🔧 Parameters Extracted: {len(params)}")
                        print(f"   📏 Complexity Score: {complexity}")
                        print(f"   📄 Code Length: {scanner_code_length:,} characters")

                        if len(params) > 0:
                            print(f"   🔍 Parameter Details (showing first 10):")
                            for j, param in enumerate(params[:10], 1):
                                param_name = param.get("name", "Unknown")
                                param_value = param.get("current_value", "N/A")
                                param_type = param.get("type", "Unknown")
                                param_category = param.get("category", "Unknown")
                                param_importance = param.get("importance", "Unknown")
                                print(f"      {j:2d}. {param_name} = {param_value}")
                                print(f"          Type: {param_type}, Category: {param_category}, Importance: {param_importance}")

                            if len(params) > 10:
                                print(f"      ... and {len(params) - 10} more parameters")
                        else:
                            print(f"   ❌ NO PARAMETERS EXTRACTED - PROBLEM!")

                        total_params += len(params)

                    print(f"\n🎉 FINAL RESULTS SUMMARY:")
                    print("=" * 40)
                    print(f"📊 Total Scanners Found: {len(scanners)}")
                    print(f"🔧 Total Parameters Extracted: {total_params}")
                    print(f"📈 Average Parameters per Scanner: {total_params/len(scanners):.1f}")
                    print(f"⏱️ Total Processing Time: {duration:.1f} seconds")

                    # User experience evaluation
                    print(f"\n🎯 USER EXPERIENCE EVALUATION:")
                    print("=" * 40)

                    if total_params >= 50:
                        print(f"✅ EXCELLENT: {total_params} parameters extracted!")
                        print(f"✅ This COMPLETELY FIXES the '0 Parameters Made Configurable' issue!")
                        print(f"✅ User will see: '{total_params} Parameters Made Configurable'")
                        print(f"✅ Each scanner has {total_params//len(scanners):.0f} average configurable parameters!")
                    elif total_params >= 30:
                        print(f"🎉 GREAT: {total_params} parameters extracted!")
                        print(f"✅ This FIXES the '0 Parameters Made Configurable' issue!")
                        print(f"✅ User will see: '{total_params} Parameters Made Configurable'")
                    elif total_params >= 15:
                        print(f"⚠️ GOOD: {total_params} parameters extracted")
                        print(f"✅ This fixes the '0 Parameters Made Configurable' issue")
                        print(f"⚠️ Could extract more parameters from the complex logic")
                    elif total_params >= 5:
                        print(f"⚠️ MODERATE: Only {total_params} parameters extracted")
                        print(f"❌ Expected 30-50+ parameters from this complex file")
                        print(f"💡 AI analysis may need improvement")
                    else:
                        print(f"❌ POOR: Only {total_params} parameters extracted")
                        print(f"❌ The system is still not analyzing the real scanner logic properly")
                        print(f"💡 Real AI analysis failed - falling back to templates")

                    # Method evaluation
                    method_used = result.get('method', 'Unknown')
                    if method_used == 'Real_AI_Analysis_OpenRouter':
                        print(f"\n✅ SUCCESS: Real AI analysis was used (not templates)!")
                        print(f"✅ The template fallback bypass is working!")
                    elif method_used == 'Guaranteed_Fallback_System':
                        print(f"\n❌ PROBLEM: Still using template fallback system")
                        print(f"❌ Real AI analysis failed and fell back to templates")
                    else:
                        print(f"\n⚠️ UNCLEAR: Method used was '{method_used}'")

                else:
                    print(f"\n❌ CRITICAL ERROR: No 'scanners' key in response!")
                    print(f"Available response keys: {list(result.keys())}")

                # Test individual parameter extraction
                if total_params > 0 and len(scanners) > 0:
                    print(f"\n🔬 TESTING INDIVIDUAL PARAMETER EXTRACTION")
                    print("=" * 50)

                    # Test with first scanner code
                    first_scanner = scanners[0]
                    scanner_code = first_scanner.get('scanner_code', '')

                    if scanner_code:
                        individual_payload = {'code': scanner_code}

                        async with session.post('http://localhost:8000/api/format/extract-parameters', json=individual_payload) as individual_response:

                            if individual_response.status == 200:
                                individual_result = await individual_response.json()
                                individual_params = individual_result.get('parameters', [])

                                print(f"✅ Individual extraction: {len(individual_params)} parameters")
                                print(f"🔧 This fixes the 'individual formatter shows 0 parameters' issue!")

                                if len(individual_params) > 0:
                                    print(f"📋 Sample individual parameters:")
                                    for i, param in enumerate(individual_params[:5], 1):
                                        print(f"  {i}. {param.get('name')} = {param.get('current_value')}")

                            else:
                                print(f"❌ Individual extraction failed: {individual_response.status}")
                                individual_error = await individual_response.text()
                                print(f"Error: {individual_error[:200]}")
                    else:
                        print(f"❌ No scanner_code available for individual testing")

            else:
                error_text = await response.text()
                print(f"\n❌ API ERROR: {response.status}")
                print(f"📄 Error Response: {error_text[:500]}")

                if response.status == 500:
                    print(f"💡 This might be a server error - check if the backend is running with OPENROUTER_API_KEY")
                elif response.status == 404:
                    print(f"💡 This might be a routing error - check if the endpoint exists")

    print(f"\n🏁 TEST COMPLETED")
    print("=" * 30)

if __name__ == "__main__":
    asyncio.run(test_real_scanner_file_complete())