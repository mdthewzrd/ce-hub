#!/usr/bin/env python3
"""
Test script to validate hourly chart functionality and fixes
Tests the chart API with known test data to verify target date positioning and market session shading
"""

import asyncio
import json
import aiohttp
from datetime import datetime

# Test configuration
BACKEND_URL = "http://localhost:8000"
TEST_TICKER = "TSLA"
TARGET_DATE = "2025-01-31"  # From test_scan_results.csv
TIMEFRAMES = ["hour", "day"]

async def test_chart_api():
    """Test the chart API endpoints with test data"""

    print("🧪 Testing Hourly Chart API Fixes")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Ticker: {TEST_TICKER}")
    print(f"Target Date: {TARGET_DATE}")
    print()

    async with aiohttp.ClientSession() as session:

        for timeframe in TIMEFRAMES:
            print(f"📊 Testing {timeframe} chart...")

            try:
                # Test chart endpoint
                chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
                params = {
                    'timeframe': timeframe,
                    'lc_date': TARGET_DATE,
                    'day_offset': 0  # Target day (Day 0)
                }

                print(f"   Request URL: {chart_url}")
                print(f"   Parameters: {params}")

                async with session.get(chart_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()

                        print(f"   ✅ Status: {response.status}")

                        # Analyze response
                        if 'chartData' in data:
                            chart_data = data['chartData']
                            x_data = chart_data.get('x', [])

                            if x_data:
                                first_timestamp = x_data[0]
                                last_timestamp = x_data[-1]

                                print(f"   📈 Data points: {len(x_data)}")
                                print(f"   🕐 First timestamp: {first_timestamp}")
                                print(f"   🕐 Last timestamp: {last_timestamp}")

                                # For hourly charts, verify target date positioning
                                if timeframe == 'hour':
                                    if TARGET_DATE in last_timestamp:
                                        print(f"   🎯 TARGET DATE POSITIONING: ✅ CORRECT - Last timestamp contains target date")

                                        # Check if it ends at 8pm (20:00) EST/EDT
                                        last_time = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
                                        hour_utc = last_time.hour

                                        # EST = UTC-5, EDT = UTC-4, so 8pm EST/EDT = 1am or 12am UTC (next day)
                                        if hour_utc in [0, 1]:  # 8pm EST/EDT
                                            print(f"   🕰️  TARGET TIME: ✅ CORRECT - Ends around 8pm ET ({hour_utc}:00 UTC)")
                                        else:
                                            print(f"   🕰️  TARGET TIME: ❌ ISSUE - Should end at 8pm ET, got {hour_utc}:00 UTC")

                                    else:
                                        print(f"   🎯 TARGET DATE POSITIONING: ❌ ISSUE - Last timestamp should contain target date")
                                        print(f"       Expected: {TARGET_DATE}")
                                        print(f"       Got: {last_timestamp}")
                            else:
                                print(f"   ❌ No chart data points returned")
                        else:
                            print(f"   ❌ No chartData in response")

                        # Check for market session shapes (grey shading)
                        if 'shapes' in data:
                            shapes = data['shapes']
                            print(f"   🎨 Market session shapes: {len(shapes)} found")
                            if len(shapes) > 0:
                                print(f"   🎨 MARKET SESSION SHADING: ✅ PRESENT")
                            else:
                                print(f"   🎨 MARKET SESSION SHADING: ❌ MISSING")
                        else:
                            print(f"   🎨 MARKET SESSION SHADING: ❌ NO SHAPES DATA")

                    else:
                        error_text = await response.text()
                        print(f"   ❌ Status: {response.status}")
                        print(f"   ❌ Error: {error_text}")

            except asyncio.TimeoutError:
                print(f"   ❌ Timeout error - request took too long")
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")

            print()

    print("🏁 Chart API testing complete!")
    print("\n📋 Expected Results for Fixed Charts:")
    print("✅ Hourly charts should have 15 days of data ENDING on target date")
    print("✅ Target date's 8pm candle should be the rightmost point")
    print("✅ Continuous hourly coverage 4am-8pm with no gaps")
    print("✅ Grey market session shading for pre-market and after-hours")

if __name__ == "__main__":
    asyncio.run(test_chart_api())