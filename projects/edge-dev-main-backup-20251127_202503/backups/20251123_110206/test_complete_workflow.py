#!/usr/bin/env python3
"""
Complete workflow test: Simulate user uploading LC scanner through frontend
"""
import asyncio
import aiohttp
import json

async def test_complete_user_workflow():
    """Test the complete user workflow"""
    print("🧪 TESTING COMPLETE USER WORKFLOW")
    print("=" * 70)
    
    # Load user's LC scanner file
    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"
    
    try:
        with open(file_path, 'r') as f:
            code = f.read()
        
        print(f"📄 Loaded user file: {len(code)} characters")
        print()
        
        async with aiohttp.ClientSession() as session:
            
            # Step 1: Analysis (what frontend does when file is uploaded)
            print("🔍 STEP 1: ANALYSIS (Frontend Upload)")
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
                    
                    if analysis_result.get('confidence', 0) == 100:
                        print("   🎉 Analysis SUCCESS: 100% confidence individual scanner!")
                    else:
                        print(f"   ❌ Analysis FAILED: {analysis_result.get('confidence')}% confidence")
                        return False
                else:
                    print(f"   ❌ Analysis API failed: {response.status}")
                    return False
            
            print()
            
            # Step 2: Execution (what happens when user clicks RUN)
            print("🚀 STEP 2: EXECUTION (User Clicks RUN)")
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
                    
                    for i in range(10):  # Check status up to 10 times
                        await asyncio.sleep(2)  # Wait 2 seconds between checks
                        
                        status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
                        async with session.get(status_url) as status_response:
                            if status_response.status == 200:
                                status_data = await status_response.json()
                                status = status_data.get("status")
                                progress = status_data.get("progress_percent", 0)
                                message = status_data.get("message", "")
                                
                                print(f"   Status check {i+1}: {status} ({progress}%) - {message[:50]}...")
                                
                                if status == "completed":
                                    results = status_data.get("results", [])
                                    print(f"   🎉 EXECUTION SUCCESS: Found {len(results)} results!")
                                    print()
                                    
                                    # Show sample results
                                    if results:
                                        print("   📊 Sample results:")
                                        for j, result in enumerate(results[:3]):
                                            print(f"      {j+1}. {result.get('ticker', 'N/A')} on {result.get('date', 'N/A')}")
                                    return True
                                
                                elif status == "failed":
                                    print(f"   ❌ EXECUTION FAILED: {message}")
                                    return False
                            else:
                                print(f"   ❌ Status check failed: {status_response.status}")
                    
                    print("   ⏰ Execution timed out (monitoring)")
                    return False
                else:
                    print(f"   ❌ Scan execution failed: {response.status}")
                    error_text = await response.text()
                    print(f"   Error: {error_text[:200]}...")
                    return False
        
    except Exception as e:
        print(f"❌ Complete workflow failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run complete workflow test"""
    print("🎯 COMPLETE USER WORKFLOW TEST")
    print("=" * 70)
    print("Simulating: User uploads LC file → Analysis → Execution")
    print()
    
    success = await test_complete_user_workflow()
    
    print()
    print("=" * 70)
    print("🎯 WORKFLOW TEST RESULTS")
    print("=" * 70)
    
    if success:
        print("✅ COMPLETE WORKFLOW SUCCESS!")
        print("🎉 User's LC scanner works end-to-end!")
        print("🚀 Frontend → Backend → Analysis → Execution: ALL WORKING!")
    else:
        print("❌ WORKFLOW FAILED")
        print("🔧 Issue found in user workflow - needs debugging")

if __name__ == "__main__":
    asyncio.run(main())
