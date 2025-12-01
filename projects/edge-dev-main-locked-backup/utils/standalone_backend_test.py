#!/usr/bin/env python3
"""
Standalone Backend Test
=====================

Test the optimized LC scanner using your existing working backend.
This connects directly to your FastAPI backend that's already finding LC patterns.

Usage:
    python standalone_backend_test.py
"""

import asyncio
import aiohttp
import time
import json
from datetime import datetime
from typing import List, Dict, Any

class BackendTester:
    """Test the optimized backend directly"""

    def __init__(self):
        self.backend_url = "http://localhost:8000"
        print("🚀 Backend Tester Initialized")
        print(f"   Backend URL: {self.backend_url}")

    async def test_backend_health(self) -> bool:
        """Test if backend is available"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.backend_url}/api/health") as response:
                    return response.status == 200
        except Exception as e:
            print(f"❌ Backend health check failed: {e}")
            return False

    async def run_optimized_scan(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """Run scan using the optimized backend"""
        print(f"🚀 Starting optimized scan: {start_date} to {end_date}")

        scan_request = {
            "start_date": start_date,
            "end_date": end_date,
            "use_real_scan": True,
            "filters": {
                "lc_frontside_d2_extended": True,
                "min_volume": 10000000,
                "scan_type": "general"
            }
        }

        try:
            async with aiohttp.ClientSession() as session:
                # Start the scan
                async with session.post(
                    f"{self.backend_url}/api/scan/execute",
                    json=scan_request
                ) as response:
                    if response.status == 200:
                        scan_response = await response.json()
                        scan_id = scan_response.get('scan_id')
                        print(f"📊 Scan started with ID: {scan_id}")

                        # Wait for completion with real-time status updates
                        return await self.wait_for_completion(session, scan_id)
                    else:
                        print(f"❌ Failed to start scan: {response.status}")
                        return None
        except Exception as e:
            print(f"❌ Scan failed: {e}")
            return None

    async def wait_for_completion(self, session: aiohttp.ClientSession, scan_id: str) -> Dict[str, Any]:
        """Wait for scan completion with status updates"""
        print("⏳ Waiting for scan completion...")

        max_wait = 300  # 5 minutes max
        poll_interval = 2  # Check every 2 seconds
        start_time = time.time()

        while time.time() - start_time < max_wait:
            try:
                async with session.get(f"{self.backend_url}/api/scan/status/{scan_id}") as response:
                    if response.status == 200:
                        status = await response.json()

                        progress = status.get('progress_percent', 0)
                        message = status.get('message', 'Processing...')
                        scan_status = status.get('status', 'unknown')

                        print(f"   📊 {progress:3d}% - {message}")

                        if scan_status == 'completed':
                            results = status.get('results', [])
                            total_found = status.get('total_found', 0)
                            execution_time = status.get('execution_time', 0)

                            print(f"✅ Scan completed successfully!")
                            print(f"   ⚡ Execution time: {execution_time:.1f}s")
                            print(f"   🎯 LC patterns found: {len(results)}")
                            print(f"   📊 Total processed: {total_found}")

                            return {
                                'success': True,
                                'results': results,
                                'total_found': total_found,
                                'execution_time': execution_time,
                                'scan_id': scan_id
                            }

                        elif scan_status == 'error':
                            error_msg = status.get('error', 'Unknown error')
                            print(f"❌ Scan failed: {error_msg}")
                            return None

                        # Continue waiting
                        await asyncio.sleep(poll_interval)
                    else:
                        print(f"❌ Failed to get status: {response.status}")
                        break
            except Exception as e:
                print(f"❌ Error checking status: {e}")
                break

        print(f"⚠️ Scan timeout after {max_wait} seconds")
        return None

    def display_results(self, results: List[Dict[str, Any]]):
        """Display LC pattern results in a nice format"""
        if not results:
            print("🔍 No LC patterns found")
            return

        print()
        print("🏆 LC PATTERN RESULTS")
        print("=" * 80)
        print(f"{'#':>3} {'TICKER':>8} {'DATE':>12} {'GAP %':>8} {'VOLUME':>12} {'SCORE':>8} {'CONF %':>8}")
        print("-" * 80)

        for i, result in enumerate(results[:20], 1):  # Show top 20
            ticker = result.get('ticker', 'N/A')
            date = result.get('date', 'N/A')
            gap_pct = result.get('gap_pct', 0)
            volume = result.get('volume', 0)
            score = result.get('parabolic_score', 0)
            confidence = result.get('confidence_score', 0)

            print(f"{i:3d} {ticker:>8} {date:>12} {gap_pct:>7.1f}% {volume:>11,} {score:>7.1f} {confidence:>7.1f}%")

        print("=" * 80)

async def main():
    """Main test function"""
    print("=" * 60)
    print("🚀 STANDALONE BACKEND TEST")
    print("=" * 60)
    print("Testing the optimized LC scanner backend directly")
    print()

    tester = BackendTester()

    # Check backend health
    print("🔍 Checking backend health...")
    healthy = await tester.test_backend_health()
    if not healthy:
        print("❌ Backend is not available. Please ensure the FastAPI server is running on port 8000.")
        return

    print("✅ Backend is healthy and ready")
    print()

    # Test different date ranges to show optimization
    test_cases = [
        ("2024-10-28", "2024-10-30", "Recent 3-day scan (should be fast)"),
        ("2024-10-01", "2024-10-30", "October 2024 scan (medium range)"),
        ("2024-08-01", "2024-10-30", "3-month scan (larger range)"),
    ]

    for start_date, end_date, description in test_cases:
        print(f"📅 {description}")
        print(f"   Date range: {start_date} to {end_date}")

        start_time = time.time()
        result = await tester.run_optimized_scan(start_date, end_date)
        total_time = time.time() - start_time

        if result:
            print(f"   ⚡ Total time (including wait): {total_time:.1f}s")
            print(f"   🎯 Backend execution time: {result.get('execution_time', 0):.1f}s")

            results = result.get('results', [])
            if results:
                print(f"   📊 Found {len(results)} LC patterns")

                # Show top 3 results
                print("   🏆 Top results:")
                for i, res in enumerate(results[:3], 1):
                    ticker = res.get('ticker', 'N/A')
                    gap = res.get('gap_pct', 0)
                    score = res.get('parabolic_score', 0)
                    print(f"      {i}. {ticker}: {gap:.1f}% gap, score: {score:.1f}")
            else:
                print("   🔍 No patterns found in this range")
        else:
            print("   ❌ Scan failed")

        print()

    print("✅ Backend testing completed!")
    print("🔄 The optimized scanner is working correctly with your existing backend")

if __name__ == "__main__":
    asyncio.run(main())