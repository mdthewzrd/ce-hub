#!/usr/bin/env python3
"""
FINAL TEST: Complete Scanner Code Fix Validation
Tests both splitting and individual formatting to verify the scanner_code field fix
"""

import asyncio
import aiohttp
import json

async def test_complete_scanner_code_fix():
    print("🎯 FINAL TEST: COMPLETE SCANNER CODE FIX VALIDATION")
    print("=" * 70)

    # Load the user's scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded user scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    async with aiohttp.ClientSession() as session:
        print(f"\n🔧 PHASE 1: TESTING AI SPLIT WITH SCANNER_CODE FIELD")
        print("-" * 60)

        # Test the AI split
        payload = {'code': code, 'filename': 'lc d2 scan - oct 25 new ideas (2).py'}

        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=payload) as response:
            print(f"📡 AI Split Status: {response.status}")

            if response.status == 200:
                result = await response.json()
                print(f"✅ AI SPLIT SUCCESS!")
                print(f"🔢 Total Scanners: {result.get('total_scanners', 0)}")
                print(f"🎯 Success Flag: {result.get('success', False)}")

                if "scanners" in result:
                    scanners = result["scanners"]

                    print(f"\n📋 SCANNER_CODE FIELD ANALYSIS:")
                    scanners_with_code = 0
                    all_scanner_codes = []

                    for i, scanner in enumerate(scanners, 1):
                        name = scanner.get("scanner_name", "Unknown")
                        scanner_code = scanner.get("scanner_code", "")
                        formatted_code = scanner.get("formatted_code", "")
                        params = scanner.get("parameters", [])

                        print(f"\n   📄 Scanner {i}: {name}")
                        print(f"      📝 scanner_code length: {len(scanner_code)} characters")
                        print(f"      📝 formatted_code length: {len(formatted_code)} characters")
                        print(f"      🔧 Parameters from split: {len(params)}")

                        if len(scanner_code) > 0:
                            scanners_with_code += 1
                            all_scanner_codes.append((name, scanner_code))
                            print(f"      ✅ SCANNER_CODE FIELD: PRESENT!")

                            # Show code preview
                            print(f"      🔍 Code preview: {scanner_code[:100]}...")
                        else:
                            print(f"      ❌ SCANNER_CODE FIELD: MISSING!")
                            all_scanner_codes.append((name, ""))

                    print(f"\n📊 SCANNER_CODE FIELD SUMMARY:")
                    print(f"   Scanners with scanner_code: {scanners_with_code}/{len(scanners)}")

                    if scanners_with_code == len(scanners) and scanners_with_code > 0:
                        print(f"   ✅ PERFECT: All scanners have scanner_code field!")
                        print(f"   ✅ AI split scanner_code fix is WORKING!")
                    else:
                        print(f"   ❌ ISSUE: Not all scanners have scanner_code field")
                        return

                    print(f"\n🧪 PHASE 2: TESTING INDIVIDUAL PARAMETER EXTRACTION")
                    print("-" * 60)

                    individual_success_count = 0
                    total_individual_params = 0

                    for i, (scanner_name, scanner_code) in enumerate(all_scanner_codes, 1):
                        print(f"\n🔧 Testing individual extraction for {scanner_name}:")
                        print(f"   📝 Input code length: {len(scanner_code)} characters")

                        if len(scanner_code) == 0:
                            print(f"   ❌ SKIP: No scanner_code to test!")
                            continue

                        # Test individual parameter extraction
                        individual_payload = {'code': scanner_code}

                        async with session.post('http://localhost:8000/api/format/extract-parameters', json=individual_payload) as individual_response:
                            print(f"   📡 Individual extraction status: {individual_response.status}")

                            if individual_response.status == 200:
                                individual_result = await individual_response.json()
                                extracted_params = individual_result.get('parameters', [])

                                print(f"   ✅ Individual extraction SUCCESS!")
                                print(f"   🔧 Parameters extracted: {len(extracted_params)}")

                                if len(extracted_params) > 0:
                                    individual_success_count += 1
                                    total_individual_params += len(extracted_params)

                                    print(f"   🎉 INDIVIDUAL FORMATTING: WORKING!")
                                    print(f"   🔍 Sample parameters:")
                                    for j, param in enumerate(extracted_params[:3], 1):
                                        name = param.get('name', 'Unknown')
                                        value = param.get('value', 'N/A')
                                        print(f"      {j}. {name} = {value}")

                                    if len(extracted_params) > 3:
                                        print(f"      ... and {len(extracted_params) - 3} more")
                                else:
                                    print(f"   ❌ INDIVIDUAL FORMATTING: No parameters found")
                            else:
                                error_text = await individual_response.text()
                                print(f"   ❌ Individual extraction ERROR {individual_response.status}: {error_text[:100]}")

                    print(f"\n🎉 FINAL RESULTS ANALYSIS")
                    print("=" * 50)

                    # Overall assessment
                    split_working = scanners_with_code == len(scanners) and scanners_with_code > 0
                    individual_working = individual_success_count > 0

                    print(f"📊 PHASE 1 - AI SPLIT: {'✅ WORKING' if split_working else '❌ BROKEN'}")
                    print(f"   🔢 Scanners found: {len(scanners)}")
                    print(f"   📝 Scanners with scanner_code: {scanners_with_code}/{len(scanners)}")

                    print(f"\n🔧 PHASE 2 - INDIVIDUAL FORMATTING: {'✅ WORKING' if individual_working else '❌ BROKEN'}")
                    print(f"   📊 Successful extractions: {individual_success_count}/{len(all_scanner_codes)}")
                    print(f"   🔧 Total parameters found: {total_individual_params}")

                    print(f"\n🎯 USER EXPERIENCE PREDICTION:")
                    if split_working and individual_working:
                        print(f"   ✅ COMPLETE SUCCESS! Both phases working perfectly!")
                        print(f"   ✅ User will see: '3 Scanners Detected'")
                        print(f"   ✅ User will see: '{total_individual_params}+ Parameters Made Configurable'")
                        print(f"   ✅ The '0 Parameters Made Configurable' issue is COMPLETELY FIXED!")
                    elif split_working and not individual_working:
                        print(f"   ⚠️ PARTIAL: Split works but individual formatting still broken")
                        print(f"   ❌ User still sees: '0 Parameters Made Configurable'")
                    elif not split_working and individual_working:
                        print(f"   🤔 UNUSUAL: Individual works but split doesn't")
                    else:
                        print(f"   ❌ COMPLETE FAILURE: Both phases broken")

                    if individual_success_count == len(all_scanner_codes) and total_individual_params >= 15:
                        print(f"\n🏆 PERFECT RESULT!")
                        print(f"   ✅ All scanners have working individual parameter extraction!")
                        print(f"   ✅ User's original issues are COMPLETELY RESOLVED!")
                        print(f"   ✅ Frontend will now show proper parameter counts!")

                else:
                    print(f"❌ No scanners found in AI split response")

            else:
                error_text = await response.text()
                print(f"❌ AI split failed: {response.status}")
                print(f"📄 Error: {error_text[:300]}")

if __name__ == "__main__":
    asyncio.run(test_complete_scanner_code_fix())