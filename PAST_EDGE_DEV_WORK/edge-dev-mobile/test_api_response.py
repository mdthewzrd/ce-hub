#!/usr/bin/env python3
"""
Quick API Response Test

Debug the exact API response to see what's happening with parameter extraction.
"""

import asyncio
import aiohttp
import json

async def test_api_response():
    """Test what the API is actually returning"""

    print("🔍 DEBUGGING API RESPONSE")
    print("=" * 50)

    # Read the LC D2 scanner file
    lc_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(lc_file_path, 'r') as f:
            code = f.read()

        print(f"✅ Read test file ({len(code)} characters)")

        async with aiohttp.ClientSession() as session:

            # Step 1: Get scanner analysis
            print("\n🔍 Step 1: Getting Scanner Analysis")
            analysis_response = await session.post(
                'http://localhost:8000/api/format/analyze-code',
                json={
                    'code': code,
                    'analysis_type': 'comprehensive_with_separation'
                }
            )

            analysis_data = await analysis_response.json()
            detected_scanners = analysis_data.get('detected_scanners', [])
            print(f"   Detected {len(detected_scanners)} scanners")

            # Step 2: Test individual scanner extraction for first scanner
            if detected_scanners:
                test_scanner = detected_scanners[0]
                print(f"\n🧪 Step 2: Testing extraction for '{test_scanner['name']}'")

                extraction_response = await session.post(
                    'http://localhost:8000/api/format/extract-scanners',
                    json={
                        'code': code,
                        'scanner_analysis': {
                            'detected_scanners': [test_scanner]
                        }
                    }
                )

                extraction_data = await extraction_response.json()

                print(f"\n📋 RAW API RESPONSE:")
                print(f"Status: {extraction_response.status}")
                print(f"Success: {extraction_data.get('success')}")
                print(f"Message: {extraction_data.get('message')}")

                extracted_scanners = extraction_data.get('extracted_scanners', [])
                print(f"Extracted scanners count: {len(extracted_scanners)}")

                if extracted_scanners:
                    scanner_data = extracted_scanners[0]
                    print(f"\n🔍 FIRST SCANNER DATA:")
                    print(f"   Scanner name: {scanner_data.get('scanner_name')}")
                    print(f"   Parameters count: {scanner_data.get('parameters_count')}")
                    print(f"   Has parameters array: {'parameters' in scanner_data}")

                    if 'parameters' in scanner_data:
                        params = scanner_data.get('parameters', [])
                        print(f"   Parameters array length: {len(params)}")
                        if params:
                            print(f"   First 3 parameters: {[p.get('name', 'unnamed') for p in params[:3]]}")
                    else:
                        print("   ❌ NO PARAMETERS ARRAY in response!")

                    print(f"\n🔍 FORMATTED CODE SAMPLE:")
                    formatted_code = scanner_data.get('formatted_code', '')
                    print(f"   Code length: {len(formatted_code)} characters")
                    if formatted_code:
                        # Show first few lines
                        lines = formatted_code.split('\n')[:10]
                        for i, line in enumerate(lines, 1):
                            print(f"   {i:2}: {line}")
                        if len(lines) > 10:
                            print(f"   ... and {len(formatted_code.split('\\n')) - 10} more lines")
                else:
                    print("   ❌ NO EXTRACTED SCANNERS in response!")

            else:
                print("❌ No scanners detected in analysis")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api_response())