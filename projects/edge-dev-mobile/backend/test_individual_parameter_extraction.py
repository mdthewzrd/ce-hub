#!/usr/bin/env python3
"""
Test individual scanner parameter extraction endpoint
"""

import asyncio
import aiohttp
import json

async def test_individual_parameter_extraction():
    print("🔍 TESTING INDIVIDUAL SCANNER PARAMETER EXTRACTION")
    print("=" * 60)

    # First, get a scanner from the split to use for individual testing
    with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
        original_code = f.read()

    # Get the individual scanners first
    split_payload = {'code': original_code, 'filename': 'lc d2 scan - oct 25 new ideas (2).py'}

    async with aiohttp.ClientSession() as session:
        print("📊 Step 1: Getting individual scanners from AI split...")
        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=split_payload) as response:
            if response.status == 200:
                result = await response.json()
                scanners = result.get('scanners', [])
                print(f"✅ Found {len(scanners)} scanners from split")

                if scanners:
                    # Test parameter extraction for each scanner
                    for i, scanner in enumerate(scanners[:3], 1):  # Test first 3
                        scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
                        scanner_code = scanner.get('scanner_code', '')

                        print(f"\n🔧 Step 2.{i}: Testing parameter extraction for {scanner_name}")
                        print(f"   📄 Scanner code length: {len(scanner_code)} characters")

                        if scanner_code.strip():
                            # Test the individual parameter extraction endpoint
                            extraction_payload = {'code': scanner_code}

                            async with session.post('http://localhost:8000/api/format/extract-parameters', json=extraction_payload) as extract_response:
                                print(f"   📡 Response status: {extract_response.status}")

                                if extract_response.status == 200:
                                    extract_result = await extract_response.json()
                                    parameters = extract_result.get('parameters', [])
                                    total_parameters = extract_result.get('total_parameters', 0)

                                    print(f"   ✅ SUCCESS: Individual extraction response received")
                                    print(f"   🔢 Parameters found: {len(parameters)}")
                                    print(f"   📊 Total parameters field: {total_parameters}")

                                    if parameters:
                                        print(f"   🔍 Parameter details:")
                                        for j, param in enumerate(parameters[:5], 1):
                                            name = param.get('name', 'Unknown')
                                            value = param.get('value', 'N/A')
                                            category = param.get('category', 'Unknown')
                                            print(f"      {j}. {name} = {value} ({category})")

                                        if len(parameters) > 5:
                                            print(f"      ... and {len(parameters) - 5} more")

                                        print(f"   ✅ INDIVIDUAL FORMATTING: Would show {len(parameters)} parameters")

                                        if len(parameters) > 0:
                                            print(f"   ✅ User's '0 Parameters Made Configurable' issue: FIXED for {scanner_name}!")
                                        else:
                                            print(f"   ❌ User's '0 Parameters Made Configurable' issue: STILL EXISTS for {scanner_name}")
                                    else:
                                        print(f"   ❌ NO PARAMETERS EXTRACTED for {scanner_name}")
                                        print(f"   🔍 This explains why user sees '0 Parameters Made Configurable'")

                                        # Debug: show response structure
                                        print(f"   📊 Full response keys: {list(extract_result.keys())}")
                                        print(f"   📄 Response preview: {str(extract_result)[:200]}...")
                                else:
                                    error_text = await extract_response.text()
                                    print(f"   ❌ ERROR {extract_response.status}: {error_text[:200]}")
                        else:
                            print(f"   ⚠️ SKIP: No scanner code available for {scanner_name}")

                # Summary
                print(f"\n🎉 INDIVIDUAL PARAMETER EXTRACTION TEST SUMMARY:")
                print(f"   📊 Total scanners tested: {min(len(scanners), 3)}")
                print(f"   🔍 This endpoint is what the frontend calls for individual formatting")
                print(f"   💡 If this shows 0 parameters, that's why user sees '0 Parameters Made Configurable'")

            else:
                print(f"❌ Failed to get scanners for testing: {response.status}")

if __name__ == "__main__":
    asyncio.run(test_individual_parameter_extraction())