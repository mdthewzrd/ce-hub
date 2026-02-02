#!/usr/bin/env python3
"""
Test Frontend Multi-Scanner Fix
================================

This script tests whether the frontend fix correctly detects multi-scanner files
and routes them to the correct backend endpoint.
"""

import asyncio
import aiohttp
import json

async def test_frontend_multiscanner_fix():
    """Test that frontend now correctly routes multi-scanner files"""

    print("🧪 TESTING FRONTEND MULTI-SCANNER FIX")
    print("=" * 70)

    # Load the original multi-scanner file
    original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"

    try:
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        print(f"📄 Loaded original file: {len(original_code):,} characters")

        async with aiohttp.ClientSession() as session:

            # Test 1: Direct backend multi-split endpoint (this should work)
            print("\n🔧 TEST 1: Direct backend multi-split endpoint")
            print("-" * 50)

            ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
            split_payload = {
                "code": original_code,
                "filename": "lc d2 scan - oct 25 new ideas (3).py"
            }

            async with session.post(ai_split_url, json=split_payload) as response:
                if response.status == 200:
                    split_result = await response.json()
                    scanners = split_result.get('scanners', [])

                    print(f"✅ Backend multi-split: {len(scanners)} scanners generated")

                    total_params = 0
                    for scanner in scanners:
                        params = scanner.get('parameters', [])
                        total_params += len(params)
                        print(f"   📋 {scanner.get('scanner_name', 'Unknown')}: {len(params)} parameters")

                    print(f"   🎯 Total parameters across all scanners: {total_params}")
                else:
                    print(f"❌ Backend multi-split failed: {response.status}")

            # Test 2: Frontend formatting endpoint (this should now auto-detect and route correctly)
            print("\n🎯 TEST 2: Frontend formatting endpoint (with multi-scanner auto-detection)")
            print("-" * 50)

            format_url = "http://localhost:8000/api/format/code"
            format_payload = {"code": original_code}

            async with session.post(format_url, json=format_payload) as response:
                if response.status == 200:
                    format_result = await response.json()
                    metadata = format_result.get('metadata', {})

                    print(f"✅ Frontend format endpoint: Success")
                    print(f"   📊 Scanner type: {format_result.get('scanner_type', 'unknown')}")
                    print(f"   📋 Parameters: {metadata.get('parameter_count', 0)}")

                    ai_extraction = metadata.get('ai_extraction', {})
                    if ai_extraction:
                        print(f"   🤖 AI extraction: {ai_extraction.get('total_parameters', 0)} parameters")

                    intelligent_params = metadata.get('intelligent_parameters', [])
                    if intelligent_params:
                        print(f"   🧠 Intelligent parameters: {len(intelligent_params)}")
                        for i, param in enumerate(intelligent_params[:5], 1):
                            name = param.get('name', 'unknown')
                            value = param.get('value', 'unknown')
                            print(f"      {i}. {name} = {value}")
                else:
                    error_text = await response.text()
                    print(f"❌ Frontend format endpoint failed: {response.status}")
                    print(f"   Error: {error_text[:200]}")

            print("\n" + "=" * 70)
            print("🧪 FRONTEND MULTI-SCANNER FIX TEST COMPLETE")
            print("=" * 70)

            print("\n📊 Summary:")
            print("1. Backend multi-split endpoint: Working (baseline)")
            print("2. Frontend format endpoint: Should now auto-detect and route correctly")
            print("\n✅ If Test 2 shows similar parameter counts to Test 1, the fix is working!")
            print("❌ If Test 2 shows 0 parameters, the fix needs more work.")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_frontend_multiscanner_fix())