#!/usr/bin/env python3
"""
Test Parameter Extraction Fix: Verify that generated scanners have extractable parameters
"""
import asyncio
import aiohttp
import json

async def test_parameter_extraction_fix():
    """Test that our generated scanners now have extractable parameters"""

    print("🔍 TESTING PARAMETER EXTRACTION FIX")
    print("=" * 70)
    print("Testing: Generated Scanner → Format → Parameter Extraction")
    print()

    # Load the original file
    original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"

    try:
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        print(f"📄 Loaded original file: {len(original_code)} characters")

        async with aiohttp.ClientSession() as session:

            # Step 1: Generate scanners with multi-split
            print("🧠 STEP 1: GENERATE SCANNERS WITH MULTI-SPLIT")
            print("-" * 50)

            ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
            split_payload = {
                "code": original_code,
                "filename": "lc d2 scan - oct 25 new ideas (3).py"
            }

            async with session.post(ai_split_url, json=split_payload) as response:
                if response.status != 200:
                    print(f"   ❌ Multi-split failed: {response.status}")
                    return False

                split_result = await response.json()
                scanners = split_result.get('scanners', [])

                if not scanners:
                    print(f"   ❌ No scanners generated")
                    return False

                print(f"   ✅ Generated {len(scanners)} scanners")

            # Step 2: Test parameter extraction on first generated scanner
            print("\n🎯 STEP 2: TEST PARAMETER EXTRACTION")
            print("-" * 50)

            test_scanner = scanners[0]
            scanner_name = test_scanner.get('scanner_name', 'Test Scanner')
            scanner_code = test_scanner.get('formatted_code', '')

            print(f"   Testing scanner: {scanner_name}")
            print(f"   Scanner code length: {len(scanner_code)} characters")

            # Check if our extractable parameters are in the code
            has_extractable_params = "# 🎯 EXTRACTABLE TRADING PARAMETERS" in scanner_code
            print(f"   Has extractable parameters section: {has_extractable_params}")

            if has_extractable_params:
                # Count parameter definitions
                import re
                param_lines = re.findall(r'\s+(\w+)\s*=\s*[\d.]+\s*#.*[Cc]onfigurable parameter', scanner_code)
                print(f"   Found {len(param_lines)} parameter definitions: {param_lines[:3]}")

            # Step 3: Format the generated scanner and test parameter extraction
            format_url = "http://localhost:8000/api/format/code"
            format_payload = {
                "code": scanner_code
            }

            async with session.post(format_url, json=format_payload) as response:
                print(f"   Format API status: {response.status}")

                if response.status == 200:
                    format_result = await response.json()

                    # Check if parameters were extracted successfully
                    metadata = format_result.get('metadata', {})
                    ai_extraction = metadata.get('ai_extraction', {})
                    total_parameters = ai_extraction.get('total_parameters', 0)

                    print(f"   ✅ Format SUCCESS!")
                    print(f"   📊 Extracted parameters: {total_parameters}")

                    if total_parameters > 0:
                        print(f"   🎉 PARAMETER EXTRACTION SUCCESS!")

                        # Show extracted parameters
                        intelligent_params = metadata.get('intelligent_parameters', [])
                        if intelligent_params:
                            print(f"   📋 First 3 parameters:")
                            for i, param in enumerate(intelligent_params[:3], 1):
                                param_name = param.get('name', 'unknown')
                                param_value = param.get('value', 'unknown')
                                param_type = param.get('type', 'unknown')
                                print(f"      {i}. {param_name} = {param_value} ({param_type})")

                        return True
                    else:
                        print(f"   ❌ PARAMETER EXTRACTION FAILED: 0 parameters found")
                        return False
                else:
                    error_text = await response.text()
                    print(f"   ❌ Format failed: {response.status}")
                    print(f"   Error: {error_text[:200]}...")
                    return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run the parameter extraction test"""
    print("🎯 PARAMETER EXTRACTION FIX TEST")
    print("=" * 70)
    print("Validating: Generated Scanner Parameter Extraction")
    print()

    success = await test_parameter_extraction_fix()

    print()
    print("=" * 70)
    print("🎯 PARAMETER EXTRACTION TEST RESULTS")
    print("=" * 70)

    if success:
        print("✅ PARAMETER EXTRACTION FIX SUCCESS!")
        print("🎉 Generated scanners now have extractable parameters!")
        print("🚀 Multi-split → Format → Parameter Extraction: ALL WORKING!")
    else:
        print("❌ PARAMETER EXTRACTION STILL FAILING")
        print("🔧 Additional fixes needed for parameter extraction")

if __name__ == "__main__":
    asyncio.run(main())