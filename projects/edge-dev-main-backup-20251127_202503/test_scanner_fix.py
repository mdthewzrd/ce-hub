#!/usr/bin/env python3
"""
Quick Test of Scanner Fixes
============================
Test that the START_DATE and END_DATE variables are now properly included
and that scanner execution works.
"""

import asyncio
import aiohttp
import json

async def test_scanner_fix():
    """Test the scanner fixes"""

    print("🔧 TESTING SCANNER FIXES")
    print("=" * 50)

    async with aiohttp.ClientSession() as session:

        # Load the original file
        original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        print(f"📄 Original file loaded: {len(original_code):,} characters")

        # Get the generated scanners
        ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
        split_payload = {
            "code": original_code,
            "filename": "lc d2 scan - oct 25 new ideas (3).py"
        }

        async with session.post(ai_split_url, json=split_payload) as response:
            if response.status == 200:
                split_result = await response.json()
                scanners = split_result.get('scanners', [])

                print(f"✅ Generated {len(scanners)} scanners")

                # Test first scanner
                if scanners:
                    scanner = scanners[0]
                    scanner_name = scanner.get('scanner_name', 'Unknown')
                    formatted_code = scanner.get('formatted_code', '')

                    print(f"\n🔍 Testing Scanner: {scanner_name}")
                    print(f"📄 Code size: {len(formatted_code):,} characters")

                    # Check if START_DATE and END_DATE are in the code
                    has_start_date = 'START_DATE = ' in formatted_code
                    has_end_date = 'END_DATE = ' in formatted_code

                    print(f"🔧 START_DATE variable: {'✅ Found' if has_start_date else '❌ Missing'}")
                    print(f"🔧 END_DATE variable: {'✅ Found' if has_end_date else '❌ Missing'}")

                    # Check for ScannerConfig pattern
                    has_scanner_config = 'class ScannerConfig:' in formatted_code
                    print(f"📋 ScannerConfig class: {'✅ Found' if has_scanner_config else '❌ Missing'}")

                    # Count parameters in ScannerConfig
                    if has_scanner_config:
                        import re
                        # Extract the ScannerConfig class content
                        config_match = re.search(r'class ScannerConfig:.*?\n(.*?)(?=\n\S|\n#|$)', formatted_code, re.DOTALL)
                        if config_match:
                            config_content = config_match.group(1)
                            # Count parameter assignments
                            param_pattern = r'^\s*(\w+)\s*=\s*([^#\n]+)'
                            params = re.findall(param_pattern, config_content, re.MULTILINE)
                            params = [p for p in params if not p[0].startswith('_') and p[0] != 'pass']
                            print(f"📊 Parameters found in ScannerConfig: {len(params)}")

                            # Show first 5 parameters
                            if params:
                                print(f"📋 Sample parameters:")
                                for i, (name, value) in enumerate(params[:5], 1):
                                    print(f"   {i}. {name} = {value.strip()}")

                    # Test parameter extraction API
                    print(f"\n🔍 Testing Parameter Extraction API...")
                    extract_url = "http://localhost:8000/api/format/extract-parameters"
                    extract_payload = {"code": formatted_code}

                    async with session.post(extract_url, json=extract_payload) as extract_response:
                        if extract_response.status == 200:
                            extract_result = await extract_response.json()
                            metadata = extract_result.get('metadata', {})
                            param_count = metadata.get('parameter_count', 0)
                            ai_extraction = metadata.get('ai_extraction', {})
                            ai_param_count = ai_extraction.get('total_parameters', 0)

                            print(f"✅ Parameter extraction successful")
                            print(f"📊 Backend parameter count: {param_count}")
                            print(f"🤖 AI extraction count: {ai_param_count}")
                        else:
                            print(f"❌ Parameter extraction failed: {extract_response.status}")

                    # Quick execution test
                    print(f"\n🚀 Testing Scanner Execution...")
                    scan_url = "http://localhost:8000/api/scan/execute"
                    scan_payload = {
                        "scanner_code": formatted_code,
                        "start_date": "2025-11-14",
                        "end_date": "2025-11-15",  # Very short range for quick test
                        "use_real_scan": True
                    }

                    try:
                        async with session.post(scan_url, json=scan_payload) as scan_response:
                            if scan_response.status == 200:
                                scan_result = await scan_response.json()
                                scan_id = scan_result.get('scan_id')
                                print(f"✅ Scanner execution initiated: {scan_id}")

                                # Check status once
                                status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
                                await asyncio.sleep(2)

                                async with session.get(status_url) as status_response:
                                    if status_response.status == 200:
                                        status_result = await status_response.json()
                                        status_val = status_result.get('status')
                                        message = status_result.get('message', '')
                                        results = status_result.get('results', [])

                                        print(f"📊 Scan status: {status_val}")
                                        print(f"💬 Message: {message}")
                                        print(f"📊 Results: {len(results)} hits")

                                        if status_val != 'error' and 'START_DATE' not in message:
                                            print(f"✅ No START_DATE error - Fix appears successful!")
                                        else:
                                            print(f"❌ Still seeing START_DATE issues")
                                    else:
                                        print(f"❌ Status check failed: {status_response.status}")
                            else:
                                error_text = await scan_response.text()
                                print(f"❌ Scan execution failed: {scan_response.status}")
                                print(f"💬 Error: {error_text[:200]}")
                    except Exception as e:
                        print(f"❌ Execution test error: {e}")

            else:
                print(f"❌ Failed to generate scanners: {response.status}")

        print(f"\n" + "=" * 50)
        print(f"🎯 SCANNER FIX TEST SUMMARY")
        print(f"=" * 50)
        print(f"✅ Test completed - check results above")

if __name__ == "__main__":
    asyncio.run(test_scanner_fix())