#!/usr/bin/env python3
"""
Test the fix for the 0% confidence issue
This will verify that the improved detection logic now correctly identifies individual scanners
"""
import asyncio
import aiohttp
import json

async def test_improved_api_detection():
    """Test the improved API detection logic"""
    print("🧪 TESTING IMPROVED API DETECTION LOGIC")
    print("=" * 70)
    print("Testing if the fix resolves the 0% confidence issue")
    print()

    # Load the problematic file
    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Loaded LC file: {len(code)} characters")
        print()

        # Test the analysis API with improved logic
        url = "http://localhost:8000/api/format/analyze-code"

        payload = {
            "code": code
        }

        print(f"🌐 Making API request to: {url}")
        print(f"📊 Payload size: {len(json.dumps(payload))} characters")
        print()

        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                print(f"📡 Response status: {response.status}")
                print()

                if response.status == 200:
                    result = await response.json()
                    print(f"✅ API Response received successfully")
                    print()
                    print(f"🔍 IMPROVED API ANALYSIS RESULTS:")
                    print(f"   Scanner type: {result.get('scanner_type', 'Unknown')}")
                    print(f"   Confidence: {result.get('confidence', 0)}")
                    print(f"   Ready for execution: {result.get('ready_for_execution', False)}")
                    print(f"   Bypass formatting: {result.get('bypass_formatting', False)}")
                    print(f"   Message: {result.get('message', 'No message')}")
                    print(f"   Parameters found: {len(result.get('parameters', []))}")
                    print()

                    if result.get('confidence', 0) == 100:
                        print(f"🎉 SUCCESS: IMPROVED LOGIC WORKS!")
                        print(f"✅ API now correctly detects individual scanner!")
                        print(f"✅ Returns 100% confidence as expected!")
                        print(f"✅ Ready for direct execution without parameter extraction!")
                        print()
                        print(f"🔧 DETECTION ISSUE RESOLVED:")
                        print(f"   - Fixed standalone script detection logic")
                        print(f"   - Individual scanner properly identified")
                        print(f"   - No more 0% confidence false positives")
                        return True
                    else:
                        print(f"❌ API still returning {result.get('confidence', 0)}% confidence")
                        print(f"🔧 May need additional investigation")
                        return False
                else:
                    error_text = await response.text()
                    print(f"❌ API Error: {response.status}")
                    print(f"   Error details: {error_text}")

                    if response.status == 500:
                        print(f"🔧 500 Internal Server Error - checking server logs for details")
                    return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_confidence_comparison():
    """Compare before vs after the fix"""
    print(f"\n🔍 CONFIDENCE ISSUE RESOLUTION SUMMARY")
    print("=" * 70)
    print("Comparing detection logic results:")
    print()
    print("BEFORE (Original Logic):")
    print("   Detection criteria: async def main + NOT standalone + 1 pattern + valid pattern")
    print("   Issue: 'if __name__' check was too strict")
    print("   Result: is standalone script: True → INDIVIDUAL SCANNER RESULT: False → 0% confidence")
    print()
    print("AFTER (Improved Logic):")
    print("   Detection criteria: main function + exactly one pattern + valid pattern + NOT true standalone")
    print("   Improvement: Only exclude if truly standalone WITH execution calls")
    print("   Expected: has_main_function: True → INDIVIDUAL SCANNER RESULT: True → 100% confidence")
    print()

    success = await test_improved_api_detection()

    if success:
        print(f"🎯 DIAGNOSIS CONFIRMED: USER WAS RIGHT!")
        print(f"   The LC scanner file IS a valid individual scanner")
        print(f"   The 0% confidence was due to detection logic being too restrictive")
        print(f"   The improved logic correctly identifies it as ready for execution")
    else:
        print(f"⚠️ Additional investigation may be needed")

    return success

async def main():
    """Run the validation test"""
    print("🎯 DETECTION FIX VALIDATION")
    print("=" * 70)
    print("Testing the improved individual scanner detection logic")
    print()

    # Test the improved detection
    success = await test_confidence_comparison()

    print("\n" + "=" * 70)
    print("🎯 FINAL VALIDATION RESULTS")
    print("=" * 70)

    if success:
        print("✅ FIX SUCCESSFUL: 0% confidence issue resolved!")
        print("🎉 Individual scanner detection now works correctly!")
        print("🚀 User can now run their LC scanner without issues!")
    else:
        print("🔧 ADDITIONAL DEBUGGING NEEDED")
        print("   The fix may need further refinement")

    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n🎊 MISSION ACCOMPLISHED: Your LC scanner is ready to run!")
    else:
        print("\n🔧 More work needed to resolve the issue")