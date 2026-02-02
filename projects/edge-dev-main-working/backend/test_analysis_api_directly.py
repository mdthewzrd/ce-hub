#!/usr/bin/env python3
"""
Test the analysis API endpoint directly to see if it's returning 0% or 100% confidence
This will help determine if the issue is in the API or in the frontend/caching
"""
import sys
import os
import asyncio
import aiohttp
import json

async def test_analysis_api():
    """Test the actual API endpoint that's causing 0% confidence"""
    print("🧪 TESTING ANALYSIS API ENDPOINT DIRECTLY")
    print("=" * 70)

    # Load the problematic file
    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Loaded file: {len(code)} characters")
        print()

        # Test the API endpoint directly
        url = "http://localhost:5757/api/format/analyze-code"

        payload = {
            "code": code
        }

        print(f"🌐 Making API request to: {url}")
        print(f"📊 Payload size: {len(json.dumps(payload))} characters")

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                print(f"📡 Response status: {response.status}")

                if response.status == 200:
                    result = await response.json()
                    print(f"✅ API Response received")
                    print()

                    print("🔍 ANALYSIS RESULTS:")
                    print(f"   Scanner type: {result.get('scanner_type', 'Unknown')}")
                    print(f"   Confidence: {result.get('confidence', 0)}")
                    print(f"   Ready for execution: {result.get('ready_for_execution', False)}")
                    print(f"   Bypass formatting: {result.get('bypass_formatting', False)}")
                    print(f"   Message: {result.get('message', 'No message')}")
                    print(f"   Parameters found: {len(result.get('parameters', []))}")
                    print(f"   Filters found: {len(result.get('filters', []))}")

                    # Check if it detected as individual scanner
                    if result.get('confidence', 0) == 100:
                        print("\n🎉 SUCCESS: API correctly detected individual scanner!")
                        print("✅ Should return 100% confidence")
                        print("✅ Should bypass formatting")
                        return True
                    else:
                        print(f"\n❌ API ISSUE: Confidence is {result.get('confidence', 0)}% instead of 100%")
                        print("🔧 The detection logic isn't working in the live API")

                        # Show debug info if available
                        if 'debug_info' in result:
                            print(f"🔍 Debug info: {result['debug_info']}")

                        return False

                else:
                    error_text = await response.text()
                    print(f"❌ API Error: {response.status}")
                    print(f"   Error details: {error_text}")
                    return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_with_curl():
    """Test using a simpler approach to validate API"""
    print(f"\n🧪 TESTING WITH SIMPLE REQUEST")
    print("=" * 70)

    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        # Create a minimal test payload
        test_code = '''import pandas as pd
import asyncio

async def main(start_date: str, end_date: str):
    print("Testing LC scanner")
    df = pd.DataFrame()
    df['lc_frontside_d2_extended'] = ((df['h'] >= df['h1']) & (df['l'] >= df['l1']))
    return df[df['lc_frontside_d2_extended'] == 1]
'''

        payload = {
            "code": test_code
        }

        print(f"📄 Testing with minimal code: {len(test_code)} characters")
        print()

        async with aiohttp.ClientSession() as session:
            async with session.post("http://localhost:5757/api/format/analyze-code", json=payload) as response:
                print(f"📡 Response status: {response.status}")

                if response.status == 200:
                    result = await response.json()
                    print(f"🔍 Minimal test results:")
                    print(f"   Confidence: {result.get('confidence', 0)}")
                    print(f"   Scanner type: {result.get('scanner_type', 'Unknown')}")
                    print(f"   Ready for execution: {result.get('ready_for_execution', False)}")
                    return result.get('confidence', 0) == 100
                else:
                    print(f"❌ Minimal test failed: {response.status}")
                    return False

    except Exception as e:
        print(f"❌ Simple test error: {e}")
        return False

async def main():
    """Test the analysis API to debug confidence issue"""
    print("🎯 ANALYSIS API DEBUGGING")
    print("=" * 70)
    print("Testing why the API returns 0% confidence instead of 100%")
    print()

    # Test full file
    full_file_works = await test_analysis_api()

    # Test minimal code
    minimal_works = await test_with_curl()

    print("\n" + "=" * 70)
    print("🎯 API TESTING RESULTS")
    print("=" * 70)

    if full_file_works:
        print("✅ Full file API test: PASSED (100% confidence)")
        print("💡 The issue may be frontend caching or display")
    elif minimal_works:
        print("✅ Minimal test: PASSED (100% confidence)")
        print("❌ Full file test: FAILED")
        print("💡 Something in the full file is breaking detection")
    else:
        print("❌ Both tests FAILED")
        print("🔧 The individual scanner detection is broken in the live API")

    return full_file_works

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n✅ API working correctly - issue is likely frontend/caching")
    else:
        print("\n🔧 API issue found - backend detection needs fixing")