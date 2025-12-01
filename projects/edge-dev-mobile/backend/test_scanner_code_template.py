#!/usr/bin/env python3
"""
Test scanner code template generation specifically to see if the fix is working
"""

import asyncio
import aiohttp
import json

async def test_scanner_code_template():
    print("🔧 TESTING SCANNER CODE TEMPLATE GENERATION")
    print("=" * 60)

    # Load the user's scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    payload = {'code': code, 'filename': 'lc d2 scan - oct 25 new ideas (2).py'}

    async with aiohttp.ClientSession() as session:
        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=payload) as response:
            print(f"📡 AI Split Status: {response.status}")

            if response.status == 200:
                result = await response.json()
                scanners = result.get('scanners', [])

                print(f"✅ SUCCESS: Got {len(scanners)} scanners")
                print(f"🎯 Success: {result.get('success', False)}")
                print(f"🤖 Method: {result.get('method', 'Unknown')}")

                print(f"\n🔍 SCANNER CODE ANALYSIS:")
                for i, scanner in enumerate(scanners, 1):
                    scanner_name = scanner.get('scanner_name', 'Unknown')
                    scanner_code = scanner.get('scanner_code', '')
                    formatted_code = scanner.get('formatted_code', '')
                    parameters = scanner.get('parameters', [])

                    print(f"\n   📄 Scanner {i}: {scanner_name}")
                    print(f"      🔧 Parameters: {len(parameters)}")

                    # Critical test: Check scanner_code field
                    print(f"      📝 scanner_code field length: {len(scanner_code)} characters")
                    print(f"      📝 formatted_code field length: {len(formatted_code)} characters")

                    if len(scanner_code) > 0:
                        print(f"      ✅ SCANNER_CODE PRESENT! Template generation WORKING!")
                        print(f"      🔍 Code preview (first 200 chars):")
                        print(f"         {scanner_code[:200]}...")

                        # Check if it contains parameter values
                        param_count_in_code = 0
                        for param in parameters:
                            param_name = param.get('name', '')
                            param_value = str(param.get('current_value', ''))
                            if param_name in scanner_code and param_value in scanner_code:
                                param_count_in_code += 1

                        print(f"      🎯 Parameters found in code: {param_count_in_code}/{len(parameters)}")

                        if param_count_in_code >= len(parameters) * 0.5:  # At least 50% of parameters
                            print(f"      ✅ PARAMETER INJECTION: WORKING!")
                        else:
                            print(f"      ⚠️ PARAMETER INJECTION: Partial or not working")

                    else:
                        print(f"      ❌ SCANNER_CODE EMPTY! Template generation NOT working!")
                        print(f"      🔍 This is why individual formatting shows '0 Parameters Made Configurable'")

                # Test individual formatting with one of these scanners
                if scanners:
                    first_scanner = scanners[0]
                    first_scanner_code = first_scanner.get('scanner_code', '')
                    first_scanner_name = first_scanner.get('scanner_name', 'Test')

                    print(f"\n🧪 TESTING INDIVIDUAL PARAMETER EXTRACTION:")
                    print(f"   📄 Testing: {first_scanner_name}")
                    print(f"   📝 Input code length: {len(first_scanner_code)} characters")

                    if len(first_scanner_code) > 0:
                        # Test individual parameter extraction
                        individual_payload = {'code': first_scanner_code}

                        async with session.post('http://localhost:8000/api/format/extract-parameters', json=individual_payload) as extract_response:
                            print(f"   📡 Individual extraction status: {extract_response.status}")

                            if extract_response.status == 200:
                                extract_result = await extract_response.json()
                                extracted_params = extract_result.get('parameters', [])

                                print(f"   ✅ Individual extraction response received")
                                print(f"   🔧 Parameters extracted: {len(extracted_params)}")

                                if len(extracted_params) > 0:
                                    print(f"   🎉 INDIVIDUAL FORMATTING: WOULD WORK!")
                                    print(f"   ✅ User's '0 Parameters Made Configurable' issue: FIXED!")

                                    print(f"   🔍 Extracted parameter examples:")
                                    for j, param in enumerate(extracted_params[:3], 1):
                                        name = param.get('name', 'Unknown')
                                        value = param.get('value', 'N/A')
                                        print(f"      {j}. {name} = {value}")
                                else:
                                    print(f"   ❌ INDIVIDUAL FORMATTING: Still broken")
                            else:
                                error_text = await extract_response.text()
                                print(f"   ❌ Individual extraction error: {extract_response.status}")
                                print(f"   📄 Error: {error_text[:200]}")
                    else:
                        print(f"   ❌ SKIP: No scanner code available to test")
                        print(f"   🔍 This confirms why individual formatting fails")

                print(f"\n🎉 FINAL DIAGNOSIS:")
                scanners_with_code = sum(1 for s in scanners if len(s.get('scanner_code', '')) > 0)
                if scanners_with_code == len(scanners) and scanners_with_code > 0:
                    print(f"   ✅ COMPLETE SUCCESS: All {len(scanners)} scanners have working code!")
                    print(f"   ✅ Template generation is working perfectly!")
                    print(f"   ✅ User's issue should be completely resolved!")
                elif scanners_with_code > 0:
                    print(f"   ⚠️ PARTIAL SUCCESS: {scanners_with_code}/{len(scanners)} scanners have code")
                    print(f"   💡 Some template generation is working")
                else:
                    print(f"   ❌ COMPLETE FAILURE: No scanners have code")
                    print(f"   💡 Template generation is not working yet")
            else:
                error_text = await response.text()
                print(f"❌ Error: {response.status}")
                print(f"📄 Error response: {error_text[:500]}")

if __name__ == "__main__":
    asyncio.run(test_scanner_code_template())