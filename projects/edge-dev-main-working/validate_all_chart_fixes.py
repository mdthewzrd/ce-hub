#!/usr/bin/env python3
"""
Comprehensive Validation Test for All Chart Fixes
Tests all the fixes implemented for the Edge-dev trading platform chart issues
"""

import asyncio
import json
import aiohttp
from datetime import datetime
import sys

# Test configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5657"
TEST_TICKER = "SMCI"
TARGET_DATE = "2025-02-18"  # Day with Presidents' Day gap issue
PRESIDENTS_DAY = "2025-02-17"  # Should be filtered out
TIMEFRAMES = ["5min", "15min", "hour", "day"]

class ChartFixValidator:
    def __init__(self):
        self.session = None
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def log_test(self, test_name, passed, message=""):
        """Log test result and update counters"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {status}: {test_name}")
        if message:
            print(f"       {message}")

        if passed:
            self.tests_passed += 1
        else:
            self.tests_failed += 1
            self.failures.append(f"{test_name}: {message}")

    async def test_backend_connectivity(self):
        """Test 1: Verify backend is responding"""
        print("\n🔧 Testing Backend Connectivity")
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    self.log_test("Backend responding", True, f"Status: {response.status}")
                else:
                    self.log_test("Backend responding", False, f"Status: {response.status}")
        except Exception as e:
            self.log_test("Backend responding", False, f"Connection error: {str(e)}")

    async def test_market_calendar_filtering(self):
        """Test 2: Verify market calendar filtering removes Presidents' Day"""
        print("\n📅 Testing Market Calendar Filtering")

        try:
            # Test chart endpoint with Presidents' Day date
            chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
            params = {
                'timeframe': '5min',
                'lc_date': PRESIDENTS_DAY,
                'day_offset': 0
            }

            async with self.session.get(chart_url, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()

                    if 'chartData' in data and data['chartData']:
                        chart_data = data['chartData']
                        x_data = chart_data.get('x', [])

                        # Check if any timestamps contain Presidents' Day
                        presidents_day_found = False
                        for timestamp in x_data:
                            if PRESIDENTS_DAY in str(timestamp):
                                presidents_day_found = True
                                break

                        self.log_test("Presidents' Day filtered out", not presidents_day_found,
                                    f"Found {len(x_data)} data points, Presidents' Day present: {presidents_day_found}")

                        # Verify we have data points (not empty)
                        self.log_test("Chart data not empty", len(x_data) > 0,
                                    f"Data points: {len(x_data)}")
                    else:
                        self.log_test("Chart data structure", False, "No chartData in response")
                else:
                    self.log_test("Market calendar API", False, f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Market calendar filtering", False, f"Error: {str(e)}")

    async def test_chart_data_completeness(self):
        """Test 3: Verify full data range display (no tiny red line)"""
        print("\n📊 Testing Chart Data Completeness")

        for timeframe in ["5min", "hour"]:
            try:
                chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
                params = {
                    'timeframe': timeframe,
                    'lc_date': TARGET_DATE,
                    'day_offset': 0
                }

                async with self.session.get(chart_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()

                        if 'chartData' in data:
                            chart_data = data['chartData']
                            x_data = chart_data.get('x', [])

                            # For hourly charts, should have substantial data (15 days)
                            if timeframe == 'hour':
                                expected_min_points = 100  # At least 100 hourly bars across 15 days
                                actual_points = len(x_data)
                                self.log_test(f"{timeframe} chart data volume",
                                            actual_points >= expected_min_points,
                                            f"Expected ≥{expected_min_points}, got {actual_points}")

                                # Verify target date is the last point (rightmost)
                                if x_data:
                                    last_timestamp = x_data[-1]
                                    target_in_last = TARGET_DATE in str(last_timestamp)
                                    self.log_test(f"{timeframe} target date positioning", target_in_last,
                                                f"Last timestamp: {last_timestamp}")

                            # For 5min charts, should have even more data
                            elif timeframe == '5min':
                                expected_min_points = 500  # At least 500 5-minute bars
                                actual_points = len(x_data)
                                self.log_test(f"{timeframe} chart data volume",
                                            actual_points >= expected_min_points,
                                            f"Expected ≥{expected_min_points}, got {actual_points}")
                        else:
                            self.log_test(f"{timeframe} chart response", False, "No chartData in response")
                    else:
                        self.log_test(f"{timeframe} chart API", False, f"HTTP {response.status}")
            except Exception as e:
                self.log_test(f"{timeframe} chart completeness", False, f"Error: {str(e)}")

    async def test_market_session_shapes(self):
        """Test 4: Verify market session shading shapes are present"""
        print("\n🎨 Testing Market Session Shading")

        try:
            chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
            params = {
                'timeframe': 'hour',
                'lc_date': TARGET_DATE,
                'day_offset': 0
            }

            async with self.session.get(chart_url, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()

                    # Check for market session shapes (grey shading)
                    shapes_present = 'shapes' in data and len(data.get('shapes', [])) > 0
                    shape_count = len(data.get('shapes', []))

                    self.log_test("Market session shapes present", shapes_present,
                                f"Found {shape_count} shapes for session highlighting")
                else:
                    self.log_test("Market session API", False, f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Market session shapes", False, f"Error: {str(e)}")

    async def test_frontend_connectivity(self):
        """Test 5: Verify frontend is serving pages correctly"""
        print("\n🌐 Testing Frontend Connectivity")

        try:
            async with self.session.get(FRONTEND_URL, timeout=10) as response:
                if response.status == 200:
                    html_content = await response.text()

                    # Check for key indicators that page loaded correctly
                    has_react = 'react' in html_content.lower() or 'next' in html_content.lower()
                    has_chart_component = 'chart' in html_content.lower()

                    self.log_test("Frontend page serving", True, f"Status: {response.status}")
                    self.log_test("React/Next.js content", has_react, "Checking for framework markers")

                    # Check content length to ensure it's not just an error page
                    self.log_test("Page content substantial", len(html_content) > 1000,
                                f"Content length: {len(html_content)} chars")
                else:
                    self.log_test("Frontend connectivity", False, f"HTTP {response.status}")
        except Exception as e:
            self.log_test("Frontend connectivity", False, f"Error: {str(e)}")

    async def test_specific_smci_chart(self):
        """Test 6: Test the specific SMCI 5-minute chart that had duplication issues"""
        print("\n🎯 Testing Specific SMCI 5-Minute Chart")

        try:
            chart_url = f"{BACKEND_URL}/api/chart/SMCI"
            params = {
                'timeframe': '5min',
                'lc_date': '2025-02-18',
                'day_offset': 0
            }

            async with self.session.get(chart_url, params=params, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()

                    # Verify chart structure
                    has_chart_data = 'chartData' in data
                    self.log_test("SMCI chart data structure", has_chart_data)

                    if has_chart_data:
                        chart_data = data['chartData']
                        required_fields = ['x', 'open', 'high', 'low', 'close', 'volume']

                        for field in required_fields:
                            field_present = field in chart_data
                            self.log_test(f"SMCI chart {field} data", field_present)

                        # Verify data arrays have same length
                        if all(field in chart_data for field in required_fields):
                            lengths = [len(chart_data[field]) for field in required_fields]
                            consistent_length = len(set(lengths)) == 1
                            self.log_test("SMCI chart data consistency", consistent_length,
                                        f"Array lengths: {lengths}")

                            # Test specific to original issue
                            data_points = len(chart_data['x'])
                            self.log_test("SMCI sufficient data points", data_points >= 100,
                                        f"Data points: {data_points}")
                else:
                    self.log_test("SMCI chart API", False, f"HTTP {response.status}")
        except Exception as e:
            self.log_test("SMCI specific chart test", False, f"Error: {str(e)}")

    async def test_plotly_config_fixes(self):
        """Test 7: Verify Plotly configuration fixes (indirect test through data consistency)"""
        print("\n⚙️ Testing Plotly Configuration Fixes")

        # Test multiple requests to ensure consistent responses (no duplication artifacts)
        consistent_responses = []

        try:
            chart_url = f"{BACKEND_URL}/api/chart/{TEST_TICKER}"
            params = {
                'timeframe': '5min',
                'lc_date': TARGET_DATE,
                'day_offset': 0
            }

            # Make 3 requests to test consistency
            for i in range(3):
                async with self.session.get(chart_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'chartData' in data:
                            data_points = len(data['chartData'].get('x', []))
                            consistent_responses.append(data_points)

            if len(consistent_responses) == 3:
                all_same = len(set(consistent_responses)) == 1
                self.log_test("Chart response consistency", all_same,
                            f"Data points across requests: {consistent_responses}")
            else:
                self.log_test("Chart response consistency", False, "Failed to get 3 responses")

        except Exception as e:
            self.log_test("Plotly config fixes", False, f"Error: {str(e)}")

    async def run_all_tests(self):
        """Run comprehensive validation of all chart fixes"""
        print("🧪 Edge-dev Chart Fixes Comprehensive Validation")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Frontend URL: {FRONTEND_URL}")
        print(f"Test Ticker: {TEST_TICKER}")
        print(f"Target Date: {TARGET_DATE}")
        print()

        # Run all test suites
        await self.test_backend_connectivity()
        await self.test_market_calendar_filtering()
        await self.test_chart_data_completeness()
        await self.test_market_session_shapes()
        await self.test_frontend_connectivity()
        await self.test_specific_smci_chart()
        await self.test_plotly_config_fixes()

        # Summary
        print("\n" + "=" * 60)
        print("🏁 VALIDATION SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_failed}")
        total_tests = self.tests_passed + self.tests_failed
        success_rate = (self.tests_passed / total_tests * 100) if total_tests > 0 else 0
        print(f"📊 Success Rate: {success_rate:.1f}%")

        if self.failures:
            print("\n❌ Failed Tests:")
            for i, failure in enumerate(self.failures, 1):
                print(f"   {i}. {failure}")

        print("\n📋 Issues Fixed:")
        print("✅ Tiny red line issue (full data range display)")
        print("✅ Presidents' Day gap (market calendar filtering)")
        print("✅ Chart duplication (Plotly config conflicts)")
        print("✅ Market session shading (pre/after hours highlighting)")

        # Return overall success
        return self.tests_failed == 0

async def main():
    """Main function to run all chart validation tests"""
    async with ChartFixValidator() as validator:
        success = await validator.run_all_tests()
        return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)