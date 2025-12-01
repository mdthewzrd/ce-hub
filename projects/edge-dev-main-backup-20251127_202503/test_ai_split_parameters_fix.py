#!/usr/bin/env python3
"""
AI Split Parameters Fix Test
============================
Test the ai-split-scanners endpoint to see if individual scanners
have their parameters properly returned.
"""

import asyncio
import aiohttp
import json

async def test_ai_split_parameters():
    """Test that AI split scanners have parameters properly returned"""

    print("🔧 TESTING AI SPLIT SCANNERS PARAMETER RETURN")
    print("=" * 60)

    # Load the original multi-scanner file
    original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"
    with open(original_file_path, 'r') as f:
        original_code = f.read()

    print(f"📄 Original file loaded: {len(original_code):,} characters")

    async with aiohttp.ClientSession() as session:

        # Test ai-split-scanners endpoint
        print(f"\n🔍 Testing ai-split-scanners endpoint...")
        ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
        split_payload = {
            "code": original_code,
            "filename": "lc d2 scan - oct 25 new ideas (3).py"
        }

        async with session.post(ai_split_url, json=split_payload) as response:
            if response.status == 200:
                split_result = await response.json()
                scanners = split_result.get('scanners', [])
                total_scanners = split_result.get('total_scanners', 0)
                total_parameters = split_result.get('total_parameters', 0)

                print(f"✅ AI Split successful")
                print(f"📊 Total scanners: {total_scanners}")
                print(f"📊 Total parameters (backend calculated): {total_parameters}")
                print(f"📊 Actual scanners returned: {len(scanners)}")

                # Check each individual scanner
                for i, scanner in enumerate(scanners, 1):
                    name = scanner.get('scanner_name', f'Scanner_{i}')
                    parameters = scanner.get('parameters', [])
                    formatted_code = scanner.get('formatted_code', '')

                    print(f"\n🔍 Scanner {i}: {name}")
                    print(f"   📊 Parameters in object: {len(parameters)}")
                    print(f"   📄 Code size: {len(formatted_code):,} characters")

                    # Check if ScannerConfig is in the code
                    has_config = 'class ScannerConfig:' in formatted_code
                    print(f"   🔧 Has ScannerConfig class: {'✅' if has_config else '❌'}")

                    # Show first few parameters if they exist
                    if parameters:
                        print(f"   📋 First 3 parameters:")
                        for j, param in enumerate(parameters[:3], 1):
                            param_name = param.get('name', 'unnamed')
                            param_value = param.get('default_value', 'no value')
                            print(f"      {j}. {param_name} = {param_value}")
                    else:
                        print(f"   ❌ NO PARAMETERS FOUND IN SCANNER OBJECT!")

                        # Manual check for ScannerConfig parameters in code
                        if has_config:
                            import re
                            config_match = re.search(r'class ScannerConfig:.*?(?=\n\S|\nclass |\n#|\n$)', formatted_code, re.DOTALL)
                            if config_match:
                                config_content = config_match.group(0)
                                param_pattern = r'^\s*(\w+)\s*=\s*([^#\n]+)'
                                params = re.findall(param_pattern, config_content, re.MULTILINE)
                                params = [p for p in params if not p[0].startswith('_')]
                                print(f"   🔍 Manual extraction found {len(params)} parameters in ScannerConfig")
                                if params:
                                    print(f"   📋 Sample manual params: {[p[0] for p in params[:3]]}")

                # Overall assessment
                print(f"\n📊 PARAMETER RETURN ASSESSMENT:")
                if total_parameters > 0:
                    print(f"   ✅ Backend calculated {total_parameters} total parameters")
                else:
                    print(f"   ❌ Backend calculated 0 total parameters - ISSUE FOUND!")

                param_counts = [len(s.get('parameters', [])) for s in scanners]
                actual_total = sum(param_counts)
                print(f"   📊 Actual parameter counts per scanner: {param_counts}")
                print(f"   📊 Sum of actual parameters: {actual_total}")

                if actual_total != total_parameters:
                    print(f"   🚨 MISMATCH: Backend calculation ({total_parameters}) != Actual count ({actual_total})")
                    print(f"   🔧 Individual scanners missing 'parameters' field!")
                else:
                    print(f"   ✅ Parameter counts match!")

            else:
                error_text = await response.text()
                print(f"❌ AI Split failed: {response.status}")
                print(f"Error: {error_text[:200]}")

if __name__ == "__main__":
    asyncio.run(test_ai_split_parameters())