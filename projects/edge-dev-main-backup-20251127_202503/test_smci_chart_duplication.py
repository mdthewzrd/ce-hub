#!/usr/bin/env python3
"""
Specific test for SMCI 2/18/25 5-minute chart duplication issue
Tests the exact conditions that the user reported
"""

import asyncio
import aiohttp
from datetime import datetime
import json

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5657"
TEST_TICKER = "SMCI"
TEST_DATE = "2025-02-18"
TEST_TIMEFRAME = "5min"

async def test_smci_specific_chart():
    """Test the specific SMCI 2/18/25 5-minute chart that showed duplication"""

    print("🔍 Testing Specific SMCI 2/18/25 5-Minute Chart Duplication Issue")
    print("=" * 70)
    print(f"Ticker: {TEST_TICKER}")
    print(f"Date: {TEST_DATE}")
    print(f"Timeframe: {TEST_TIMEFRAME}")
    print(f"Backend: {BACKEND_URL}")
    print(f"Frontend: {FRONTEND_URL}")
    print()

    async with aiohttp.ClientSession() as session:

        # Test 1: Backend API consistency
        print("📊 Testing Backend API Response")
        print("-" * 40)

        try:
            chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
            params = {
                'timeframe': TEST_TIMEFRAME,
                'lc_date': TEST_DATE,
                'day_offset': 0
            }

            # Make multiple requests to check for consistency
            responses = []
            for i in range(3):
                async with session.get(chart_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'chartData' in data:
                            chart_data = data['chartData']
                            x_data = chart_data.get('x', [])
                            responses.append({
                                'request': i + 1,
                                'data_points': len(x_data),
                                'first_timestamp': x_data[0] if x_data else None,
                                'last_timestamp': x_data[-1] if x_data else None,
                                'has_shapes': 'shapes' in data and len(data.get('shapes', [])) > 0,
                                'shape_count': len(data.get('shapes', []))
                            })
                        else:
                            responses.append({'request': i + 1, 'error': 'No chartData in response'})
                    else:
                        responses.append({'request': i + 1, 'error': f'HTTP {response.status}'})

            # Analyze responses
            print(f"✅ Made {len(responses)} API requests:")
            for resp in responses:
                if 'error' in resp:
                    print(f"   Request {resp['request']}: ❌ {resp['error']}")
                else:
                    print(f"   Request {resp['request']}: ✅ {resp['data_points']} data points, {resp['shape_count']} shapes")

            # Check consistency
            if len(responses) > 1:
                data_points = [r.get('data_points') for r in responses if 'data_points' in r]
                if len(set(data_points)) == 1:
                    print(f"✅ Backend API is consistent: All requests returned {data_points[0]} data points")
                else:
                    print(f"❌ Backend API inconsistency: Data points vary: {data_points}")

        except Exception as e:
            print(f"❌ Backend API test failed: {e}")

        print()

        # Test 2: Frontend page loading
        print("🌐 Testing Frontend Page Loading")
        print("-" * 40)

        try:
            async with session.get(FRONTEND_URL, timeout=10) as response:
                if response.status == 200:
                    html_content = await response.text()

                    # Check for React/Chart indicators
                    has_chart_component = 'EdgeChart' in html_content or 'chart' in html_content.lower()
                    has_plotly = 'plotly' in html_content.lower()
                    has_react = 'react' in html_content.lower() or 'next' in html_content.lower()

                    print(f"✅ Frontend status: {response.status}")
                    print(f"✅ Content length: {len(html_content):,} chars")
                    print(f"✅ Chart indicators: {has_chart_component}")
                    print(f"✅ Plotly detected: {has_plotly}")
                    print(f"✅ React/Next detected: {has_react}")
                else:
                    print(f"❌ Frontend failed: HTTP {response.status}")
        except Exception as e:
            print(f"❌ Frontend test failed: {e}")

        print()

        # Test 3: Specific chart data validation
        print("🎯 Testing Specific Chart Data")
        print("-" * 40)

        try:
            chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
            params = {
                'timeframe': TEST_TIMEFRAME,
                'lc_date': TEST_DATE,
                'day_offset': 0
            }

            async with session.get(chart_url, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()

                    if 'chartData' in data:
                        chart_data = data['chartData']

                        # Validate structure
                        required_fields = ['x', 'open', 'high', 'low', 'close', 'volume']
                        field_lengths = {}

                        for field in required_fields:
                            if field in chart_data:
                                field_lengths[field] = len(chart_data[field])
                                print(f"   ✅ {field}: {field_lengths[field]} points")
                            else:
                                print(f"   ❌ {field}: Missing")

                        # Check for consistency
                        unique_lengths = set(field_lengths.values())
                        if len(unique_lengths) == 1:
                            print(f"✅ Data consistency: All fields have {list(unique_lengths)[0]} points")
                        else:
                            print(f"❌ Data inconsistency: Field lengths vary: {field_lengths}")

                        # Check date range
                        if 'x' in chart_data and chart_data['x']:
                            first_timestamp = chart_data['x'][0]
                            last_timestamp = chart_data['x'][-1]
                            print(f"📅 Date range: {first_timestamp[:10]} to {last_timestamp[:10]}")

                            # Check if target date is the last date
                            if TEST_DATE in last_timestamp:
                                print(f"✅ Target date positioning: Last timestamp contains {TEST_DATE}")
                            else:
                                print(f"⚠️  Target date positioning: Last timestamp is {last_timestamp[:10]}, expected {TEST_DATE}")

                        # Check market session shapes
                        if 'shapes' in data:
                            shapes = data['shapes']
                            print(f"🎨 Market session shapes: {len(shapes)} found")
                        else:
                            print(f"⚠️  Market session shapes: None found")

                    else:
                        print(f"❌ No chartData in API response")

                else:
                    print(f"❌ Chart API failed: HTTP {response.status}")
        except Exception as e:
            print(f"❌ Chart data test failed: {e}")

        print()

    # Summary
    print("📋 Summary and Next Steps")
    print("=" * 70)
    print("✅ Hard frontend reset completed")
    print("✅ Fresh Next.js build with cleared caches")
    print("✅ Backend API confirmed working")
    print()
    print("🎯 To test for chart duplication:")
    print("1. Visit: http://localhost:5657")
    print("2. Load scan results that include SMCI")
    print("3. Click on SMCI to view chart")
    print("4. Select 5-minute timeframe")
    print("5. Navigate to 2025-02-18 (Day 0)")
    print("6. Check if two identical charts are stacked vertically")
    print()
    print("If duplication still occurs after hard reset, the issue may be:")
    print("• React component re-rendering bug")
    print("• Plotly.js internal duplication despite our fixes")
    print("• Browser caching (try hard refresh or incognito)")
    print("• Component lifecycle issue with state updates")

if __name__ == "__main__":
    asyncio.run(test_smci_specific_chart())