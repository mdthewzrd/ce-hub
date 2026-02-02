#!/usr/bin/env python3
"""
CRITICAL TEST: Real Scanner File vs Commented File Analysis
Tests both the real unmodified file and the commented file to compare results
"""

import asyncio
import aiohttp
import json

async def test_real_vs_commented_comparison():
    print("🎯 TESTING REAL VS COMMENTED SCANNER FILE ANALYSIS")
    print("=" * 70)

    # Test 1: Real unmodified file
    print(f"\n🔬 PHASE 1: TESTING REAL UNMODIFIED SCANNER FILE")
    print("-" * 60)

    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py', 'r') as f:
            real_code = f.read()
        print(f"📄 Real file loaded: {len(real_code):,} characters")
        print(f"📊 Real file lines: {len(real_code.splitlines())} lines")
    except Exception as e:
        print(f"❌ Failed to load real file: {e}")
        return

    # Test 2: Previously tested commented file
    print(f"\n🔬 PHASE 2: TESTING PREVIOUSLY USED COMMENTED FILE")
    print("-" * 60)

    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            commented_code = f.read()
        print(f"📄 Commented file loaded: {len(commented_code):,} characters")
        print(f"📊 Commented file lines: {len(commented_code.splitlines())} lines")
    except Exception as e:
        print(f"❌ Failed to load commented file: {e}")
        return

    async with aiohttp.ClientSession() as session:

        print(f"\n🧪 TESTING REAL UNMODIFIED FILE:")
        print("=" * 50)
        real_payload = {'code': real_code, 'filename': 'lc d2 scan - oct 25 new ideas (3).py'}

        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=real_payload) as response:
            print(f"📡 Real File Status: {response.status}")

            if response.status == 200:
                real_result = await response.json()
                print(f"✅ Real File Analysis SUCCESS!")
                print(f"🔢 Real File Scanners: {real_result.get('total_scanners', 0)}")
                print(f"🎯 Real File Success: {real_result.get('success', False)}")
                print(f"🤖 Real File Method: {real_result.get('method', 'Unknown')}")
                print(f"📈 Real File Confidence: {real_result.get('analysis_confidence', 0):.2f}")

                if "scanners" in real_result:
                    real_scanners = real_result["scanners"]
                    real_total_params = 0

                    print(f"\n📋 REAL FILE SCANNER DETAILS:")
                    for i, scanner in enumerate(real_scanners, 1):
                        name = scanner.get("scanner_name", "Unknown")
                        params = scanner.get("parameters", [])
                        complexity = scanner.get("complexity", "Unknown")

                        print(f"   {i}. {name}")
                        print(f"      🔧 Parameters: {len(params)}")
                        print(f"      📏 Complexity: {complexity}")

                        real_total_params += len(params)

                    print(f"\n🎉 REAL FILE SUMMARY:")
                    print(f"   📊 Total Scanners: {len(real_scanners)}")
                    print(f"   🔧 Total Parameters: {real_total_params}")
                    print(f"   📈 Avg Parameters/Scanner: {real_total_params/len(real_scanners):.1f}")

                else:
                    print(f"❌ No scanners found in real file response!")
                    real_total_params = 0

            else:
                error_text = await response.text()
                print(f"❌ Real File ERROR: {response.status}")
                print(f"📄 Error: {error_text[:300]}")
                real_total_params = 0

        print(f"\n🧪 TESTING COMMENTED FILE (PREVIOUSLY USED):")
        print("=" * 50)
        commented_payload = {'code': commented_code, 'filename': 'lc d2 scan - oct 25 new ideas (2).py'}

        async with session.post('http://localhost:8000/api/format/ai-split-scanners', json=commented_payload) as response:
            print(f"📡 Commented File Status: {response.status}")

            if response.status == 200:
                commented_result = await response.json()
                print(f"✅ Commented File Analysis SUCCESS!")
                print(f"🔢 Commented File Scanners: {commented_result.get('total_scanners', 0)}")
                print(f"🎯 Commented File Success: {commented_result.get('success', False)}")
                print(f"🤖 Commented File Method: {commented_result.get('method', 'Unknown')}")
                print(f"📈 Commented File Confidence: {commented_result.get('analysis_confidence', 0):.2f}")

                if "scanners" in commented_result:
                    commented_scanners = commented_result["scanners"]
                    commented_total_params = 0

                    print(f"\n📋 COMMENTED FILE SCANNER DETAILS:")
                    for i, scanner in enumerate(commented_scanners, 1):
                        name = scanner.get("scanner_name", "Unknown")
                        params = scanner.get("parameters", [])
                        complexity = scanner.get("complexity", "Unknown")

                        print(f"   {i}. {name}")
                        print(f"      🔧 Parameters: {len(params)}")
                        print(f"      📏 Complexity: {complexity}")

                        commented_total_params += len(params)

                    print(f"\n🎉 COMMENTED FILE SUMMARY:")
                    print(f"   📊 Total Scanners: {len(commented_scanners)}")
                    print(f"   🔧 Total Parameters: {commented_total_params}")
                    print(f"   📈 Avg Parameters/Scanner: {commented_total_params/len(commented_scanners):.1f}")

                else:
                    print(f"❌ No scanners found in commented file response!")
                    commented_total_params = 0

            else:
                error_text = await response.text()
                print(f"❌ Commented File ERROR: {response.status}")
                print(f"📄 Error: {error_text[:300]}")
                commented_total_params = 0

        # Final comparison
        print(f"\n🔍 CRITICAL COMPARISON ANALYSIS")
        print("=" * 50)

        print(f"Real File (unmodified): {real_total_params if 'real_total_params' in locals() else 0} parameters")
        print(f"Commented File (test): {commented_total_params if 'commented_total_params' in locals() else 0} parameters")

        if 'real_total_params' in locals() and 'commented_total_params' in locals():
            if real_total_params > commented_total_params:
                print(f"✅ DISCOVERY: Real file extracts MORE parameters ({real_total_params} vs {commented_total_params})")
                print(f"✅ This confirms the user's suspicion about the commented file issue!")
            elif real_total_params == commented_total_params:
                print(f"⚠️ CONCERNING: Both files extract same parameters ({real_total_params})")
                print(f"💡 This suggests the system is still using templates, not parsing real code!")
            else:
                print(f"❓ UNEXPECTED: Commented file extracts more parameters")

            if real_total_params < 30:
                print(f"❌ PROBLEM: Real file should extract 30-50+ parameters, only got {real_total_params}")
                print(f"💡 The system is NOT parsing the real complex scanner logic!")
            else:
                print(f"✅ SUCCESS: Real file parameter extraction is working properly!")

        print(f"\n🎯 USER EXPERIENCE PREDICTION:")
        if 'real_total_params' in locals() and real_total_params >= 30:
            print(f"  ✅ EXCELLENT: User would see '{real_total_params} Parameters Made Configurable' with real file!")
            print(f"  ✅ The '0 Parameters Made Configurable' issue would be FIXED with proper analysis!")
        else:
            print(f"  ❌ POOR: User would still see low parameter counts")
            print(f"  🔍 System needs to analyze REAL scanner code, not use template fallbacks!")

if __name__ == "__main__":
    asyncio.run(test_real_vs_commented_comparison())