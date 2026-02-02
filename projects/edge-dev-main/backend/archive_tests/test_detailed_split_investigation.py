#!/usr/bin/env python3
"""
Detailed investigation of AI split response to understand parameter extraction failure
"""

import asyncio
import aiohttp
import json

async def detailed_split_investigation():
    print("🔍 DETAILED AI SPLIT INVESTIGATION")
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

                print(f"\n✅ DETAILED RESPONSE ANALYSIS:")
                print(f"Response keys: {list(result.keys())}")
                print(f"Success: {result.get('success', 'Missing')}")
                print(f"Total scanners: {result.get('total_scanners', 'Missing')}")
                print(f"Total parameters: {result.get('total_parameters', 'Missing')}")
                print(f"Total complexity: {result.get('total_complexity', 'Missing')}")
                print(f"Method: {result.get('method', 'Missing')}")
                print(f"Confidence: {result.get('analysis_confidence', 'Missing')}")

                # Examine scanners in detail
                if 'scanners' in result:
                    scanners = result['scanners']
                    print(f"\n🔎 SCANNERS DETAILED ANALYSIS ({len(scanners)} found):")

                    for i, scanner in enumerate(scanners, 1):
                        print(f"\n📄 Scanner {i}:")
                        print(f"  All keys: {list(scanner.keys())}")
                        print(f"  Name: {scanner.get('scanner_name', 'MISSING')}")
                        print(f"  Description: {scanner.get('description', 'MISSING')[:150]}...")
                        print(f"  Parameters: {len(scanner.get('parameters', []))}")
                        print(f"  Complexity: {scanner.get('complexity', 'MISSING')}")
                        print(f"  Scanner Code Present: {'scanner_code' in scanner}")

                        # Check if parameters exist but are empty
                        params = scanner.get('parameters', [])
                        if isinstance(params, list):
                            if len(params) == 0:
                                print(f"  ❌ PROBLEM: Parameters list is EMPTY")
                            else:
                                print(f"  ✅ Parameters found: {len(params)}")
                                # Show first few parameters
                                for j, param in enumerate(params[:3], 1):
                                    param_keys = list(param.keys()) if isinstance(param, dict) else "Not a dict"
                                    print(f"    Param {j}: {param_keys}")
                        else:
                            print(f"  ❌ PROBLEM: Parameters is not a list: {type(params)}")

                    # Check what target scanners we should find vs what we actually find
                    expected_names = [
                        'lc_frontside_d3_extended_1',
                        'lc_frontside_d2_extended',
                        'lc_fbo'
                    ]

                    found_names = [s.get('scanner_name', '') for s in scanners]

                    print(f"\n🎯 SCANNER NAME MATCHING:")
                    print(f"Expected: {expected_names}")
                    print(f"Found: {found_names}")

                    for expected in expected_names:
                        if expected in found_names:
                            print(f"  ✅ {expected} - FOUND")
                        else:
                            print(f"  ❌ {expected} - MISSING")

                    print(f"\n🤔 ROOT CAUSE ANALYSIS:")
                    if len(scanners) == 3 and all(len(s.get('parameters', [])) == 0 for s in scanners):
                        print(f"  🔍 ISSUE TYPE: Parameter extraction failure")
                        print(f"  📝 OBSERVATION: AI found 3 scanners but extracted 0 parameters from each")
                        print(f"  🎯 ROOT CAUSE: Parameter extraction logic is failing")
                        print(f"  💡 SOLUTION: Need to debug parameter extraction in AI service")

                    if not any(name in found_names for name in expected_names):
                        print(f"  🔍 ISSUE TYPE: Scanner name recognition failure")
                        print(f"  📝 OBSERVATION: AI is not recognizing expected scanner names")
                        print(f"  🎯 ROOT CAUSE: Scanner naming logic is failing")
                        print(f"  💡 SOLUTION: Need to debug scanner name extraction")

                else:
                    print(f"\n❌ CRITICAL: 'scanners' key missing from response")

            else:
                error_text = await response.text()
                print(f"❌ ERROR: {response.status}")
                print(f"Error response: {error_text[:500]}")

if __name__ == "__main__":
    asyncio.run(detailed_split_investigation())