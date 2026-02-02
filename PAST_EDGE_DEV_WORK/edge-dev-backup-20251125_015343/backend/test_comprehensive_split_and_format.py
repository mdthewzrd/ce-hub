#!/usr/bin/env python3
"""
Comprehensive test of both AI split and individual scanner formatting
to verify the current state and identify exactly what's working vs broken
"""

import asyncio
import aiohttp
import json
import time

async def test_comprehensive_workflow():
    print("🔍 COMPREHENSIVE TEST: AI SPLIT + INDIVIDUAL FORMATTING WORKFLOW")
    print("=" * 80)

    # Load the user's scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded user scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    async with aiohttp.ClientSession() as session:
        print(f"\n🎯 PHASE 1: TESTING AI SPLIT SCANNERS")
        print("-" * 50)

        # Test the AI split
        payload = {'code': code, 'filename': 'lc d2 scan - oct 25 new ideas (2).py'}
        start_time = time.time()

        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=payload) as response:
            split_duration = time.time() - start_time
            print(f"📡 AI Split Status: {response.status}")
            print(f"⏱️ AI Split Duration: {split_duration:.2f} seconds")

            if response.status == 200:
                result = await response.json()
                print(f"✅ AI SPLIT SUCCESS!")
                print(f"📊 Response structure: {list(result.keys())}")
                print(f"🔢 Total scanners: {result.get('total_scanners', 'Missing')}")
                print(f"🔧 Total parameters: {result.get('total_parameters', 'Missing')}")
                print(f"🎯 Success flag: {result.get('success', 'Missing')}")
                print(f"🤖 Method used: {result.get('method', 'Missing')}")

                # Analyze scanners in detail
                if 'scanners' in result:
                    scanners = result['scanners']
                    print(f"\n📋 SCANNER ANALYSIS:")

                    total_split_params = 0
                    all_scanner_codes = []

                    for i, scanner in enumerate(scanners, 1):
                        name = scanner.get('scanner_name', 'Unknown')
                        params = scanner.get('parameters', [])
                        scanner_code = scanner.get('scanner_code', '')
                        complexity = scanner.get('complexity', 'Unknown')

                        print(f"  📄 Scanner {i}: {name}")
                        print(f"     🔧 Parameters from split: {len(params)}")
                        print(f"     📏 Complexity: {complexity}")
                        print(f"     📝 Scanner code length: {len(scanner_code)} characters")

                        total_split_params += len(params)
                        all_scanner_codes.append((name, scanner_code))

                        # Show first few parameters from split
                        if params:
                            print(f"     🔍 Sample parameters from split:")
                            for j, param in enumerate(params[:3], 1):
                                param_name = param.get('name', 'Unknown')
                                param_value = param.get('current_value', 'N/A')
                                print(f"        {j}. {param_name} = {param_value}")
                            if len(params) > 3:
                                print(f"        ... and {len(params) - 3} more")
                        else:
                            print(f"     ❌ NO PARAMETERS EXTRACTED in split")

                        if len(scanner_code) == 0:
                            print(f"     ❌ CRITICAL: No scanner_code field! This will break individual formatting!")
                        else:
                            print(f"     ✅ Scanner code available for individual formatting")

                        print()

                    print(f"📊 SPLIT SUMMARY:")
                    print(f"   Total scanners found: {len(scanners)}")
                    print(f"   Total parameters extracted in split: {total_split_params}")
                    print(f"   Scanners with code: {sum(1 for _, code in all_scanner_codes if len(code) > 0)}/{len(all_scanner_codes)}")

                    if total_split_params >= 15:
                        print(f"   ✅ SPLIT PHASE: WORKING! ({total_split_params} parameters)")
                    else:
                        print(f"   ❌ SPLIT PHASE: BROKEN! ({total_split_params} parameters)")

                    print(f"\n🔧 PHASE 2: TESTING INDIVIDUAL SCANNER FORMATTING")
                    print("-" * 50)

                    # Test individual scanner formatting for each scanner
                    individual_results = []

                    for i, (scanner_name, scanner_code) in enumerate(all_scanner_codes, 1):
                        print(f"\n🧪 Testing individual formatting for {scanner_name}:")
                        print(f"   📝 Input code length: {len(scanner_code)} characters")

                        if len(scanner_code) == 0:
                            print(f"   ❌ SKIP: No code to test - this explains '0 Parameters Made Configurable'!")
                            individual_results.append({
                                'scanner_name': scanner_name,
                                'success': False,
                                'parameters_found': 0,
                                'reason': 'No scanner code available'
                            })
                            continue

                        # Test individual parameter extraction
                        individual_payload = {'code': scanner_code}
                        start_time = time.time()

                        async with session.post('http://localhost:8000/api/format/extract-parameters', json=individual_payload) as individual_response:
                            individual_duration = time.time() - start_time
                            print(f"   📡 Individual format status: {individual_response.status}")
                            print(f"   ⏱️ Individual format duration: {individual_duration:.2f} seconds")

                            if individual_response.status == 200:
                                individual_result = await individual_response.json()
                                individual_params = individual_result.get('parameters', [])

                                print(f"   ✅ Individual format response received")
                                print(f"   🔧 Parameters extracted individually: {len(individual_params)}")

                                if individual_params:
                                    print(f"   ✅ INDIVIDUAL FORMATTING: WORKING!")
                                    print(f"   🔍 Sample individual parameters:")
                                    for j, param in enumerate(individual_params[:3], 1):
                                        name = param.get('name', 'Unknown')
                                        value = param.get('value', 'N/A')
                                        print(f"      {j}. {name} = {value}")
                                    if len(individual_params) > 3:
                                        print(f"      ... and {len(individual_params) - 3} more")
                                else:
                                    print(f"   ❌ INDIVIDUAL FORMATTING: BROKEN! No parameters extracted")

                                individual_results.append({
                                    'scanner_name': scanner_name,
                                    'success': len(individual_params) > 0,
                                    'parameters_found': len(individual_params),
                                    'reason': 'Success' if len(individual_params) > 0 else 'No parameters extracted'
                                })
                            else:
                                error_text = await individual_response.text()
                                print(f"   ❌ Individual format ERROR {individual_response.status}: {error_text[:100]}...")
                                individual_results.append({
                                    'scanner_name': scanner_name,
                                    'success': False,
                                    'parameters_found': 0,
                                    'reason': f'HTTP {individual_response.status}'
                                })

                    print(f"\n🎉 FINAL WORKFLOW ANALYSIS")
                    print("=" * 50)

                    # Overall assessment
                    split_working = total_split_params >= 15
                    individual_working = any(result['success'] for result in individual_results)
                    scanners_with_code = sum(1 for _, code in all_scanner_codes if len(code) > 0)

                    print(f"✅ PHASE 1 - AI SPLIT: {'✅ WORKING' if split_working else '❌ BROKEN'}")
                    print(f"   📊 {len(scanners)} scanners found with {total_split_params} total parameters")

                    print(f"\n🔧 PHASE 2 - INDIVIDUAL FORMATTING: {'✅ WORKING' if individual_working else '❌ BROKEN'}")
                    print(f"   📝 Scanners with code: {scanners_with_code}/{len(all_scanner_codes)}")
                    for result in individual_results:
                        status = "✅" if result['success'] else "❌"
                        print(f"   {status} {result['scanner_name']}: {result['parameters_found']} params - {result['reason']}")

                    print(f"\n🎯 USER EXPERIENCE DIAGNOSIS:")
                    if split_working and individual_working:
                        print(f"   ✅ COMPLETE SUCCESS: Both splitting and individual formatting work!")
                        print(f"   ✅ User should see: '3 Scanners Detected' and configurable parameters!")
                    elif split_working and not individual_working:
                        print(f"   ⚠️ PARTIAL SUCCESS: Splitting works but individual formatting broken")
                        print(f"   ❌ User sees: '3 Scanners Detected' but '0 Parameters Made Configurable'")
                        print(f"   🔍 ROOT CAUSE: Missing scanner_code fields in AI split response!")
                    elif not split_working and not individual_working:
                        print(f"   ❌ COMPLETE FAILURE: Both splitting and formatting broken")
                    else:
                        print(f"   🤔 UNUSUAL: Individual formatting works but splitting doesn't")

                    if scanners_with_code == 0:
                        print(f"\n🚨 CRITICAL ISSUE IDENTIFIED:")
                        print(f"   ❌ ZERO scanners have scanner_code fields!")
                        print(f"   ❌ This is why user sees '0 Parameters Made Configurable'")
                        print(f"   💡 SOLUTION: Fix AI split to include actual scanner code for each scanner")
                    elif scanners_with_code < len(all_scanner_codes):
                        print(f"\n⚠️ PARTIAL ISSUE:")
                        print(f"   Only {scanners_with_code}/{len(all_scanner_codes)} scanners have code")
                        print(f"   💡 SOLUTION: Ensure ALL scanners include scanner_code in AI split response")

                else:
                    print(f"❌ CRITICAL: No 'scanners' key found in AI split response")

            else:
                error_text = await response.text()
                print(f"❌ AI Split failed: {response.status}")
                print(f"📄 Error: {error_text[:300]}")

if __name__ == "__main__":
    asyncio.run(test_comprehensive_workflow())