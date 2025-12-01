#!/usr/bin/env python3
"""
Debug Parameter Extraction: Compare working vs generated scanner parameter extraction
"""
import asyncio
import aiohttp
import json

async def debug_parameter_extraction():
    """Debug why parameter extraction works for working scanner but not generated"""

    print("🔧 PARAMETER EXTRACTION DEBUG")
    print("=" * 70)

    async with aiohttp.ClientSession() as session:

        # Get a generated scanner
        print("📄 STEP 1: Generate a scanner")
        print("-" * 40)

        # Load original and generate scanner
        original_code = open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py').read()

        ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
        split_payload = {"code": original_code, "filename": "test.py"}

        async with session.post(ai_split_url, json=split_payload) as response:
            split_result = await response.json()
            generated_scanner = split_result['scanners'][0]['formatted_code']
            print(f"✅ Generated scanner: {len(generated_scanner)} characters")

        # Test parameter extraction on working scanner
        print("\n🎯 STEP 2: Test working backside scanner")
        print("-" * 40)

        working_scanner = open('/Users/michaeldurante/Downloads/formatted_backside para b copy.py.py').read()

        format_url = "http://localhost:8000/api/format/code"
        working_payload = {"code": working_scanner}

        async with session.post(format_url, json=working_payload) as response:
            if response.status == 200:
                result = await response.json()
                metadata = result.get('metadata', {})
                ai_extraction = metadata.get('ai_extraction', {})
                total_params = ai_extraction.get('total_parameters', 0)

                print(f"✅ Working scanner extraction: {total_params} parameters")

                # Check what types of parameters were found
                intelligent_params = metadata.get('intelligent_parameters', [])
                print(f"📋 Parameter types found:")
                for param in intelligent_params[:5]:
                    param_name = param.get('name', 'unknown')
                    param_value = param.get('value', 'unknown')
                    param_type = param.get('type', 'unknown')
                    print(f"   - {param_name} = {param_value} ({param_type})")
            else:
                print(f"❌ Working scanner failed: {response.status}")

        # Test parameter extraction on generated scanner
        print("\n🔬 STEP 3: Test generated scanner")
        print("-" * 40)

        generated_payload = {"code": generated_scanner}

        async with session.post(format_url, json=generated_payload) as response:
            if response.status == 200:
                result = await response.json()
                metadata = result.get('metadata', {})
                ai_extraction = metadata.get('ai_extraction', {})
                total_params = ai_extraction.get('total_parameters', 0)

                print(f"📊 Generated scanner extraction: {total_params} parameters")

                if total_params > 0:
                    intelligent_params = metadata.get('intelligent_parameters', [])
                    print(f"📋 Parameter types found:")
                    for param in intelligent_params[:5]:
                        param_name = param.get('name', 'unknown')
                        param_value = param.get('value', 'unknown')
                        param_type = param.get('type', 'unknown')
                        print(f"   - {param_name} = {param_value} ({param_type})")
                else:
                    print("❌ No parameters detected")

                    # Check extraction details
                    print("🔍 Extraction analysis:")
                    print(f"   AI extraction data: {ai_extraction}")

                    # Check if there's any regex extraction
                    regex_extraction = metadata.get('regex_extraction', {})
                    print(f"   Regex extraction: {regex_extraction}")

            else:
                error_text = await response.text()
                print(f"❌ Generated scanner failed: {response.status}")
                print(f"   Error: {error_text[:200]}")

        # Compare ScannerConfig structures
        print("\n🆚 STEP 4: Compare ScannerConfig structures")
        print("-" * 40)

        print("Working scanner ScannerConfig:")
        working_lines = working_scanner.split('\n')
        in_config = False
        for line in working_lines[:30]:
            if 'class ScannerConfig' in line:
                in_config = True
            elif in_config and line.startswith('class '):
                break
            elif in_config:
                print(f"   {line}")

        print("\nGenerated scanner ScannerConfig:")
        generated_lines = generated_scanner.split('\n')
        in_config = False
        for line in generated_lines[:40]:
            if 'class ScannerConfig' in line:
                in_config = True
            elif in_config and (line.startswith('# Initialize') or line.startswith('config =')):
                print(f"   {line}")
                break
            elif in_config:
                print(f"   {line}")

if __name__ == "__main__":
    asyncio.run(debug_parameter_extraction())