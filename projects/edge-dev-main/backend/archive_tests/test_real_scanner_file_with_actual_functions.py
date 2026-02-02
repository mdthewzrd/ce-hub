#!/usr/bin/env python3
"""
CRITICAL TEST: Real Scanner File (3) with Actual Function Names
Tests the real unmodified scanner file to confirm function detection and parameter extraction
"""

import asyncio
import aiohttp
import json
import time

async def test_real_scanner_file_comprehensive():
    print("🎯 TESTING REAL SCANNER FILE - COMPREHENSIVE ANALYSIS")
    print("=" * 70)

    # Use the real unmodified file (3) that the user specifically provided
    file_path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py'

    try:
        with open(file_path, 'r') as f:
            real_code = f.read()

        print(f"📄 Real scanner file loaded: {len(real_code):,} characters")
        print(f"📊 Real scanner file lines: {len(real_code.splitlines())} lines")

        # Manual verification of actual function names
        print(f"\n🔍 MANUAL FUNCTION VERIFICATION:")
        test_functions = ['adjust_intraday', 'check_high_lvl_filter_lc', 'check_next_day_valid_lc']
        found_functions = []

        for func_name in test_functions:
            if f"def {func_name}(" in real_code:
                found_functions.append(func_name)
                print(f"  ✅ Found: def {func_name}(")
            else:
                print(f"  ❌ Missing: def {func_name}(")

        print(f"\n📊 FUNCTION DETECTION SUMMARY:")
        print(f"   Expected functions: {test_functions}")
        print(f"   Found functions: {found_functions}")
        print(f"   Detection rate: {len(found_functions)}/{len(test_functions)}")

        if len(found_functions) == 0:
            print(f"   ❌ CRITICAL: No expected functions found - may need to find actual function names")
        else:
            print(f"   ✅ GOOD: {len(found_functions)} scanner functions detected")

    except Exception as e:
        print(f"❌ Failed to load real scanner file: {e}")
        return

    # Test with actual API
    payload = {'code': real_code, 'filename': 'lc d2 scan - oct 25 new ideas (3).py'}

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        print(f"\n🚀 TESTING REAL FILE WITH AI ANALYSIS SYSTEM")
        print("=" * 50)

        start_time = time.time()

        try:
            async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=payload) as response:
                duration = time.time() - start_time

                print(f"📡 Response Status: {response.status}")
                print(f"⏱️ Analysis Duration: {duration:.1f} seconds")

                if response.status == 200:
                    result = await response.json()

                    print(f"\n✅ REAL FILE ANALYSIS SUCCESS!")
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

                            # Check if this is one of our expected functions
                            if name in found_functions:
                                print(f"   ✅ VERIFIED: This matches a detected function!")

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

                        print(f"\n🎉 REAL FILE RESULTS SUMMARY:")
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
                            print(f"💡 Real AI analysis failed - may need function name updates")

                        # Method evaluation
                        method_used = result.get('method', 'Unknown')
                        if method_used == 'Real_AI_Analysis_OpenRouter':
                            print(f"\n✅ SUCCESS: Real AI analysis was used (not templates)!")
                            print(f"✅ The template fallback bypass is working!")
                        elif 'template' in method_used.lower() or 'guaranteed' in method_used.lower():
                            print(f"\n❌ PROBLEM: Still using template fallback system")
                            print(f"❌ Real AI analysis failed and fell back to templates")
                            print(f"💡 Method: {method_used}")
                        else:
                            print(f"\n⚠️ UNCLEAR: Method used was '{method_used}'")

                        # Compare scanner names with detected functions
                        scanner_names = [scanner.get("scanner_name", "") for scanner in scanners]
                        print(f"\n🔍 SCANNER NAME VERIFICATION:")
                        print(f"   Expected Functions: {found_functions}")
                        print(f"   Detected Scanners: {scanner_names}")

                        matches = set(scanner_names) & set(found_functions)
                        if len(matches) > 0:
                            print(f"   ✅ Matches Found: {list(matches)}")
                        else:
                            print(f"   ❌ No matches between detected functions and scanner names")
                            print(f"   💡 System may be extracting different function names")

                    else:
                        print(f"\n❌ CRITICAL ERROR: No 'scanners' key in response!")
                        print(f"Available response keys: {list(result.keys())}")

                else:
                    error_text = await response.text()
                    print(f"\n❌ API ERROR: {response.status}")
                    print(f"📄 Error Response: {error_text[:500]}")

                    if response.status == 500:
                        print(f"💡 This might be a server error - check if the backend is running with OPENROUTER_API_KEY")
                    elif response.status == 404:
                        print(f"💡 This might be a routing error - check if the endpoint exists")

        except asyncio.TimeoutError:
            print(f"❌ TIMEOUT: Analysis took longer than 60 seconds")
        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")

    print(f"\n🏁 REAL SCANNER FILE TEST COMPLETED")
    print("=" * 30)

if __name__ == "__main__":
    asyncio.run(test_real_scanner_file_comprehensive())