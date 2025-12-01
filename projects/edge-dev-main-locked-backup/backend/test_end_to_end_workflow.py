#!/usr/bin/env python3
"""
End-to-End Workflow Test
Tests the complete workflow: AI Split -> Save as Project -> Execute Scanner -> Get Results
"""

import asyncio
import aiohttp
import json
from pathlib import Path

async def test_complete_workflow():
    """Test the complete end-to-end workflow"""

    print("🎯 Testing Complete End-to-End Workflow")
    print("=" * 60)

    # Read the user's scanner file
    scanner_file = Path("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py")
    if not scanner_file.exists():
        print(f"❌ Scanner file not found: {scanner_file}")
        return

    with open(scanner_file, "r") as f:
        code_content = f.read()

    base_url = "http://localhost:8000"

    async with aiohttp.ClientSession() as session:
        try:
            # Step 1: AI Split the Scanner
            print("\n📊 Step 1: AI-Splitting the Scanner...")
            payload = {
                "code": code_content,
                "filename": "lc d2 scan - oct 25 new ideas (2).py"
            }

            async with session.post(f"{base_url}/api/format/ai-split-scanners",
                                  json=payload) as response:
                if response.status != 200:
                    print(f"❌ AI split failed: {response.status}")
                    print(await response.text())
                    return

                split_result = await response.json()
                print(f"✅ AI Split successful: {split_result['total_scanners']} scanners generated")

                # Print scanner details
                for i, scanner in enumerate(split_result['scanners'], 1):
                    print(f"  Scanner {i}: {scanner['scanner_name']}")
                    print(f"    - Parameters: {len(scanner['parameters'])}")
                    print(f"    - Complexity: {scanner['complexity']}")

                # Step 2: Test Scanner Execution
                print(f"\n🚀 Step 2: Testing Scanner Execution...")

                # Test the first split scanner
                if split_result['scanners']:
                    test_scanner = split_result['scanners'][0]
                    test_code = test_scanner['formatted_code']

                    print(f"Testing scanner: {test_scanner['scanner_name']}")

                    # Create scan request
                    scan_payload = {
                        "start_date": "2025-01-01",
                        "end_date": "2025-11-11",
                        "use_real_scan": True,
                        "sophisticated_mode": True,
                        "uploaded_code": test_code
                    }

                    async with session.post(f"{base_url}/api/scan/execute",
                                          json=scan_payload) as scan_response:
                        if scan_response.status != 200:
                            print(f"❌ Scanner execution failed: {scan_response.status}")
                            print(await scan_response.text())
                            return

                        scan_result = await scan_response.json()
                        scan_id = scan_result['scan_id']
                        print(f"✅ Scanner execution started: {scan_id}")

                        # Step 3: Monitor Execution Progress
                        print(f"\n📈 Step 3: Monitoring Execution Progress...")

                        # Check status periodically
                        for attempt in range(10):  # Check for up to 30 seconds
                            await asyncio.sleep(3)

                            async with session.get(f"{base_url}/api/scan/status/{scan_id}") as status_response:
                                if status_response.status != 200:
                                    print(f"❌ Status check failed: {status_response.status}")
                                    continue

                                status_result = await status_response.json()
                                status = status_result['status']
                                progress = status_result.get('progress_percent', 0)
                                message = status_result.get('message', '')

                                print(f"  Status: {status} ({progress}%) - {message}")

                                if status == 'completed':
                                    results = status_result.get('results', [])
                                    print(f"🎉 EXECUTION SUCCESSFUL!")
                                    print(f"  Results: {len(results)} matches found")

                                    if results:
                                        print(f"  Sample result: {results[0] if results else 'None'}")

                                    return True

                                elif status == 'failed':
                                    error_msg = status_result.get('message', 'Unknown error')
                                    print(f"❌ EXECUTION FAILED: {error_msg}")
                                    return False

                        print(f"⏱️ Execution timed out after monitoring")
                        return False

        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            return False

async def main():
    success = await test_complete_workflow()

    print(f"\n{'='*60}")
    if success:
        print("🎉 END-TO-END TEST SUCCESSFUL!")
        print("✅ The corrected AI-split scanners work and produce results!")
    else:
        print("❌ END-TO-END TEST FAILED")
        print("❌ The scanners still have execution issues")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(main())