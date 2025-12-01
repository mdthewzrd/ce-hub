#!/usr/bin/env python3
"""
Test the fixed total_parameters field in AI split response
"""

import asyncio
import aiohttp
import json

async def test_fixed_total_parameters():
    print("🎯 TESTING FIXED TOTAL_PARAMETERS FIELD")
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
            if response.status == 200:
                result = await response.json()

                print(f"\n✅ TESTING TOTAL_PARAMETERS FIELD FIX:")
                print(f"Response keys: {list(result.keys())}")

                # Check if total_parameters field is present
                has_total_params = 'total_parameters' in result
                total_params_value = result.get('total_parameters', 'MISSING')

                print(f"\n🔍 CRITICAL FIELD ANALYSIS:")
                print(f"   'total_parameters' field present: {'✅ YES' if has_total_params else '❌ NO'}")
                print(f"   'total_parameters' value: {total_params_value}")

                # Manual calculation to verify
                manual_count = 0
                if 'scanners' in result:
                    for scanner in result['scanners']:
                        manual_count += len(scanner.get('parameters', []))

                print(f"   Manual parameter count: {manual_count}")
                print(f"   Values match: {'✅ YES' if total_params_value == manual_count else '❌ NO'}")

                print(f"\n🎉 FIX VALIDATION:")
                if has_total_params and total_params_value == manual_count and manual_count > 0:
                    print(f"   ✅ TOTAL_PARAMETERS FIELD FIX: SUCCESSFUL!")
                    print(f"   ✅ User's '0 Parameters Made Configurable' issue: RESOLVED!")
                    print(f"   ✅ Frontend will now see {total_params_value} parameters")
                elif has_total_params and total_params_value == 0:
                    print(f"   ⚠️ Field present but value is 0 - parameter extraction still not working")
                elif has_total_params and total_params_value != manual_count:
                    print(f"   ⚠️ Field present but calculation mismatch: {total_params_value} vs {manual_count}")
                else:
                    print(f"   ❌ Field still missing - fix did not work")

                # Show detailed scanner info
                if 'scanners' in result:
                    print(f"\n📋 DETAILED PARAMETER BREAKDOWN:")
                    for i, scanner in enumerate(result['scanners'], 1):
                        name = scanner.get('scanner_name', 'Unknown')
                        params = scanner.get('parameters', [])
                        print(f"   Scanner {i}: {name} -> {len(params)} parameters")

                        # Show a few parameter examples
                        if params:
                            for j, param in enumerate(params[:3], 1):
                                param_name = param.get('name', 'Unknown')
                                param_value = param.get('current_value', 'N/A')
                                print(f"      {j}. {param_name} = {param_value}")
                            if len(params) > 3:
                                print(f"      ... and {len(params) - 3} more")

                # Test frontend interface expectation
                print(f"\n🖥️ FRONTEND INTERFACE IMPACT:")
                if has_total_params and total_params_value > 0:
                    print(f"   ✅ Frontend will receive: total_parameters = {total_params_value}")
                    print(f"   ✅ Instead of showing '0 Parameters Made Configurable'")
                    print(f"   ✅ Will show '{total_params_value} Parameters Made Configurable'")
                else:
                    print(f"   ❌ Frontend will still see 0 parameters")

            else:
                error_text = await response.text()
                print(f"❌ ERROR: {response.status}")
                print(f"Error response: {error_text[:500]}")

if __name__ == "__main__":
    asyncio.run(test_fixed_total_parameters())