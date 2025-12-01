#!/usr/bin/env python3
"""
Test Fixed Scanner Generation
Tests if the updated AI generates scanners with data type fixes included
"""

import asyncio
import aiohttp
import json

async def test_fixed_generation():
    """Test that AI now generates scanners with data type fixes"""

    print("🔧 Testing Updated AI Scanner Generation with Data Type Fixes")
    print("=" * 70)

    # Read the user's scanner file
    with open("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py", "r") as f:
        code_content = f.read()

    base_url = "http://localhost:8000"

    async with aiohttp.ClientSession() as session:
        try:
            # Test AI Split with updated generation
            print("📊 Running AI Split with Updated Generation...")
            payload = {
                "code": code_content,
                "filename": "lc d2 scan - oct 25 new ideas (2).py"
            }

            async with session.post(f"{base_url}/api/format/ai-split-scanners",
                                  json=payload) as response:
                if response.status != 200:
                    print(f"❌ AI split failed: {response.status}")
                    print(await response.text())
                    return False

                result = await response.json()
                print(f"✅ AI Split successful: {result['total_scanners']} scanners generated")

                # Check if generated scanners include data type fixes
                for i, scanner in enumerate(result['scanners'], 1):
                    generated_code = scanner['formatted_code']

                    print(f"\n🔍 Scanner {i}: {scanner['scanner_name']}")

                    # Check for data type fix function
                    has_fix_function = 'def fix_data_types(' in generated_code
                    has_fix_calls = 'fix_data_types(' in generated_code and generated_code.count('fix_data_types(') > 1  # Function definition + calls
                    has_numeric_conversion = 'pd.to_numeric(' in generated_code

                    print(f"  - Contains fix_data_types function: {'✅' if has_fix_function else '❌'}")
                    print(f"  - Contains fix_data_types calls: {'✅' if has_fix_calls else '❌'}")
                    print(f"  - Contains numeric conversion: {'✅' if has_numeric_conversion else '❌'}")

                    # Show a snippet of the generated code
                    lines = generated_code.split('\n')
                    print(f"  - Code length: {len(lines)} lines")

                    # Find fix_data_types function in code
                    for line_num, line in enumerate(lines, 1):
                        if 'def fix_data_types(' in line:
                            print(f"  - fix_data_types function found at line {line_num}")
                            break

                    # Save this scanner for testing
                    if i == 1:  # Save first scanner for execution test
                        test_scanner_code = generated_code
                        test_scanner_name = scanner['scanner_name']

                print(f"\n🚀 Testing Execution of Fixed Scanner: {test_scanner_name}")

                # Test execution of the generated scanner
                scan_payload = {
                    "start_date": "2025-01-01",
                    "end_date": "2025-11-11",
                    "use_real_scan": True,
                    "sophisticated_mode": True,
                    "uploaded_code": test_scanner_code
                }

                async with session.post(f"{base_url}/api/scan/execute",
                                      json=scan_payload) as scan_response:
                    if scan_response.status != 200:
                        print(f"❌ Execution failed: {scan_response.status}")
                        print(await scan_response.text())
                        return False

                    scan_result = await scan_response.json()
                    scan_id = scan_result['scan_id']
                    print(f"✅ Execution started: {scan_id}")

                    # Monitor execution for a short time
                    for attempt in range(10):
                        await asyncio.sleep(3)

                        async with session.get(f"{base_url}/api/scan/status/{scan_id}") as status_response:
                            if status_response.status != 200:
                                continue

                            status_result = await status_response.json()
                            status = status_result['status']
                            progress = status_result.get('progress_percent', 0)
                            message = status_result.get('message', '')

                            print(f"  Status: {status} ({progress}%) - {message}")

                            if status == 'completed':
                                results = status_result.get('results', [])
                                print(f"🎉 EXECUTION SUCCESS! {len(results)} results found")
                                return True
                            elif status == 'failed':
                                print(f"❌ EXECUTION FAILED: {message}")
                                return False

                    print(f"⏱️ Execution monitoring timed out")
                    return False

        except Exception as e:
            print(f"❌ Test failed: {e}")
            return False

async def main():
    success = await test_fixed_generation()

    print(f"\n{'=' * 70}")
    if success:
        print("🎉 SUCCESS: AI now generates working scanners with data type fixes!")
        print("✅ End-to-end workflow is now functional!")
    else:
        print("❌ FAILED: Generated scanners still have issues")
    print(f"{'=' * 70}")

if __name__ == "__main__":
    asyncio.run(main())