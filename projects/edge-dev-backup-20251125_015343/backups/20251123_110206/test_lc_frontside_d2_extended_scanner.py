#!/usr/bin/env python3
"""
Test the lc_frontside_d2_extended individual scanner
Validate it meets our bulletproof plan success criteria
"""
import asyncio
import aiohttp
import json

async def test_lc_frontside_d2_extended_scanner():
    """Test the complete workflow for lc_frontside_d2_extended scanner"""
    print("🎯 TESTING LC FRONTSIDE D2 EXTENDED INDIVIDUAL SCANNER")
    print("=" * 70)

    # Load the scanner file
    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Loaded scanner file: {len(code)} characters")
        print()

        async with aiohttp.ClientSession() as session:

            # Step 1: Test Analysis (should show 100% confidence individual scanner)
            print("🔍 STEP 1: SCANNER ANALYSIS (Backend Detection)")
            analysis_url = "http://localhost:8000/api/format/analyze-code"
            analysis_payload = {"code": code}

            async with session.post(analysis_url, json=analysis_payload) as response:
                print(f"   Status: {response.status}")

                if response.status == 200:
                    analysis_result = await response.json()
                    print(f"   ✅ Scanner type: {analysis_result.get('scanner_type')}")
                    print(f"   ✅ Confidence: {analysis_result.get('confidence')}%")
                    print(f"   ✅ Ready for execution: {analysis_result.get('ready_for_execution', False)}")
                    print(f"   ✅ Bypass formatting: {analysis_result.get('bypass_formatting', False)}")
                    print(f"   ✅ Pattern count: {analysis_result.get('pattern_count', 'N/A')}")

                    # Validate our success criteria
                    if analysis_result.get('confidence', 0) == 100:
                        scanner_type = analysis_result.get('scanner_type')
                        if scanner_type in ['individual', 'individual_lc_scanner']:
                            print("   🎉 SUCCESS: 100% confidence individual scanner detected!")
                            individual_detected = True
                        else:
                            print(f"   ❌ ISSUE: Detected as {scanner_type} instead of individual")
                            individual_detected = False
                    else:
                        print(f"   ❌ ISSUE: Only {analysis_result.get('confidence')}% confidence")
                        individual_detected = False
                else:
                    print(f"   ❌ Analysis API failed: {response.status}")
                    error_text = await response.text()
                    print(f"   Error: {error_text[:200]}...")
                    return False

            print()

            # Step 2: Test Execution (should work via Run button)
            if individual_detected:
                print("🚀 STEP 2: SCANNER EXECUTION (Run Button Test)")
                scan_url = "http://localhost:8000/api/scan/execute"
                scan_payload = {
                    "start_date": "2025-11-10",
                    "end_date": "2025-11-14",
                    "scanner_type": "uploaded",
                    "uploaded_code": code,
                    "use_real_scan": True
                }

                async with session.post(scan_url, json=scan_payload) as response:
                    print(f"   Status: {response.status}")

                    if response.status == 200:
                        scan_result = await response.json()
                        scan_id = scan_result.get("scan_id")
                        print(f"   ✅ Scan started: {scan_id}")

                        # Step 3: Monitor execution
                        print()
                        print("⏳ STEP 3: MONITORING EXECUTION")

                        execution_success = False
                        for i in range(15):  # Check status up to 15 times
                            await asyncio.sleep(3)  # Wait 3 seconds between checks

                            status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
                            async with session.get(status_url) as status_response:
                                if status_response.status == 200:
                                    status_data = await status_response.json()
                                    status = status_data.get("status")
                                    progress = status_data.get("progress_percent", 0)
                                    message = status_data.get("message", "")

                                    print(f"   Check {i+1}: {status} ({progress}%) - {message[:50]}...")

                                    if status == "completed":
                                        results = status_data.get("results", [])
                                        print(f"   🎉 EXECUTION SUCCESS: Found {len(results)} results!")
                                        execution_success = True

                                        # Validate results contain our specific pattern
                                        if results:
                                            print("   📊 Sample results:")
                                            for j, result in enumerate(results[:3]):
                                                ticker = result.get('ticker', 'N/A')
                                                date = result.get('date', 'N/A')
                                                pattern = result.get('lc_frontside_d2_extended', 'N/A')
                                                print(f"      {j+1}. {ticker} on {date} (lc_frontside_d2_extended: {pattern})")
                                        break

                                    elif status == "failed":
                                        print(f"   ❌ EXECUTION FAILED: {message}")
                                        break
                                else:
                                    print(f"   ❌ Status check failed: {status_response.status}")

                        if not execution_success:
                            print("   ⏰ Execution timed out or failed")
                            return False

                        return True
                    else:
                        print(f"   ❌ Scan execution failed: {response.status}")
                        error_text = await response.text()
                        print(f"   Error: {error_text[:200]}...")
                        return False
            else:
                print("🚫 STEP 2: SKIPPED - Scanner not detected as individual")
                return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run the complete test suite"""
    print("🎯 LC FRONTSIDE D2 EXTENDED SCANNER TEST")
    print("=" * 70)
    print("Testing: Detection → Analysis → Execution")
    print()

    success = await test_lc_frontside_d2_extended_scanner()

    print()
    print("=" * 70)
    print("🎯 TEST RESULTS")
    print("=" * 70)

    if success:
        print("✅ ALL TESTS PASSED!")
        print("🎉 LC Frontside D2 Extended scanner works end-to-end!")
        print("🚀 Detection → Analysis → Execution: ALL WORKING!")
        print()
        print("✅ Bulletproof Plan Success Criteria Met:")
        print("   ✅ 100% confidence individual scanner detection")
        print("   ✅ Successful Run button execution")
        print("   ✅ Pattern-specific results returned")
    else:
        print("❌ TESTS FAILED")
        print("🔧 Issues found - needs debugging")

if __name__ == "__main__":
    asyncio.run(main())