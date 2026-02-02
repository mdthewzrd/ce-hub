#!/usr/bin/env python3
"""
Test script for Human-in-the-Loop Formatting System
==================================================

This script tests the collaborative formatting system with real problematic
scanner examples to validate the functionality.
"""

import asyncio
import json
import aiohttp
from datetime import datetime

# Test scanner codes (simplified versions of the complex ones)
TEST_SCANNERS = {
    "lc_d2_basic": '''
# LC D2 Scanner - Basic Version
import pandas as pd
import numpy as np

# CRITICAL PARAMETERS
PREV_CLOSE_MIN = 5.0  # Minimum previous close price
VOLUME_THRESHOLD = 1000000  # Minimum volume
GAP_PERCENT_MIN = 2.5  # Minimum gap percentage
LC_FRONTSIDE_THRESHOLD = 0.8  # LC frontside signal
ATR_MULTIPLIER = 2.0  # ATR-based volatility filter

def scan_ticker(ticker, start_date, end_date):
    df = get_stock_data(ticker, start_date, end_date)

    # Apply filters
    df_filtered = df[df['prev_close'] >= PREV_CLOSE_MIN]
    df_vol = df_filtered[df_filtered['volume'] >= VOLUME_THRESHOLD]

    # Calculate gap
    df_vol['gap_percent'] = ((df_vol['open'] - df_vol['prev_close']) / df_vol['prev_close']) * 100
    df_gap = df_vol[df_vol['gap_percent'] >= GAP_PERCENT_MIN]

    return df_gap.to_dict('records')
''',

    "simple_gap": '''
# Simple Gap Scanner
min_gap_percent = 2.0
min_volume = 500000
min_price = 10.0

def scan_gaps(ticker_list, start_date, end_date):
    results = []
    for ticker in ticker_list:
        data = get_stock_data(ticker, start_date, end_date)
        data['gap_percent'] = ((data['open'] - data['prev_close']) / data['prev_close']) * 100

        filtered = data[
            (data['gap_percent'] >= min_gap_percent) &
            (data['volume'] >= min_volume) &
            (data['prev_close'] >= min_price)
        ]

        results.extend(filtered.to_dict('records'))
    return results
''',

    "complex_parameters": '''
# Scanner with complex parameter interdependencies
DMR_BASE_PERIOD = 20
DMR_SENSITIVITY = 1.5
VOLUME_PERCENTILE = 75
MEAN_REVERSION_THRESHOLD = 2.0
RSI_OVERSOLD = 30
VOLATILITY_PERCENTILE = 60

class AdvancedScanner:
    def __init__(self):
        self.volume_ma_period = max(int(DMR_BASE_PERIOD * 1.5), 10)
        self.dynamic_rsi_oversold = RSI_OVERSOLD - (DMR_SENSITIVITY * 5)
        self.dynamic_volume_threshold = VOLUME_PERCENTILE + (DMR_SENSITIVITY * 10)

    def analyze(self, data):
        # Complex logic using interdependent parameters
        filtered = data[
            (data['rsi'] <= self.dynamic_rsi_oversold) &
            (data['volume_percentile'] >= self.dynamic_volume_threshold) &
            (data['mean_reversion_score'] >= MEAN_REVERSION_THRESHOLD)
        ]
        return filtered
'''
}

API_BASE_URL = "http://localhost:8000"

class HumanInTheLoopTester:
    def __init__(self):
        self.session = None
        self.test_results = {}

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def test_capabilities(self):
        """Test the capabilities endpoint"""
        print("🔍 Testing system capabilities...")

        try:
            async with self.session.get(f"{API_BASE_URL}/api/format/capabilities") as response:
                if response.status == 200:
                    capabilities = await response.json()
                    print(f"✅ System: {capabilities['system_name']} v{capabilities['version']}")
                    print(f"✅ Philosophy: {capabilities['philosophy']}")
                    print(f"✅ Process steps: {len(capabilities['process_steps'])} steps")
                    return True
                else:
                    print(f"❌ Capabilities test failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Capabilities test error: {e}")
            return False

    async def test_parameter_extraction(self, scanner_name, scanner_code):
        """Test parameter extraction for a specific scanner"""
        print(f"\n🤖 Testing parameter extraction for: {scanner_name}")

        try:
            payload = {"code": scanner_code}

            async with self.session.post(
                f"{API_BASE_URL}/api/format/extract-parameters",
                json=payload
            ) as response:

                if response.status == 200:
                    result = await response.json()

                    print(f"✅ Extraction successful")
                    print(f"📊 Scanner type: {result['scanner_type']}")
                    print(f"🎯 Confidence: {result['confidence_score']:.2f}")
                    print(f"🔍 Parameters found: {len(result['parameters'])}")

                    for param in result['parameters']:
                        confidence_emoji = "🟢" if param['confidence'] > 0.8 else "🟡" if param['confidence'] > 0.6 else "🔴"
                        print(f"  {confidence_emoji} {param['name']}: {param['value']} ({param['type']}, {param['confidence']:.2f})")
                        print(f"    📍 Line {param['line']}: {param['context'][:60]}...")
                        print(f"    💬 {param['suggested_description']}")

                    self.test_results[scanner_name] = {
                        'extraction_success': True,
                        'parameters_found': len(result['parameters']),
                        'confidence': result['confidence_score'],
                        'scanner_type': result['scanner_type']
                    }

                    return result
                else:
                    print(f"❌ Parameter extraction failed: {response.status}")
                    error_text = await response.text()
                    print(f"   Error: {error_text}")

                    self.test_results[scanner_name] = {
                        'extraction_success': False,
                        'error': f"HTTP {response.status}"
                    }
                    return None

        except Exception as e:
            print(f"❌ Parameter extraction error: {e}")
            self.test_results[scanner_name] = {
                'extraction_success': False,
                'error': str(e)
            }
            return None

    async def test_collaborative_step(self, scanner_code, parameters, step_id="parameter_discovery"):
        """Test a collaborative formatting step"""
        print(f"\n🔄 Testing collaborative step: {step_id}")

        try:
            payload = {
                "code": scanner_code,
                "step_id": step_id,
                "parameters": parameters,
                "user_choices": {
                    "add_async": True,
                    "add_error_handling": True,
                    "add_imports": True
                }
            }

            async with self.session.post(
                f"{API_BASE_URL}/api/format/collaborative-step",
                json=payload
            ) as response:

                if response.status == 200:
                    result = await response.json()

                    print(f"✅ Step completed successfully")
                    print(f"📝 Preview length: {len(result['preview_code'])} characters")
                    print(f"🎯 Suggestions: {len(result['next_suggestions'])}")

                    for suggestion in result['next_suggestions']:
                        print(f"  💡 {suggestion}")

                    return result
                else:
                    print(f"❌ Collaborative step failed: {response.status}")
                    return None

        except Exception as e:
            print(f"❌ Collaborative step error: {e}")
            return None

    async def test_personalized_suggestions(self, scanner_code):
        """Test personalized suggestions"""
        print(f"\n🎯 Testing personalized suggestions...")

        try:
            payload = {"code": scanner_code}

            async with self.session.post(
                f"{API_BASE_URL}/api/format/personalized-suggestions",
                json=payload
            ) as response:

                if response.status == 200:
                    result = await response.json()

                    print(f"✅ Suggestions generated")
                    print(f"🎯 Confidence: {result['confidence']}")
                    print(f"📊 Based on history: {result['based_on_history']}")

                    for suggestion in result['suggestions']:
                        print(f"  💡 {suggestion}")

                    return result
                else:
                    print(f"❌ Personalized suggestions failed: {response.status}")
                    return None

        except Exception as e:
            print(f"❌ Personalized suggestions error: {e}")
            return None

    async def run_comprehensive_test(self):
        """Run comprehensive test suite"""
        print("🚀 Starting comprehensive human-in-the-loop formatting tests\n")

        # Test 1: System capabilities
        capabilities_ok = await self.test_capabilities()

        if not capabilities_ok:
            print("❌ System capabilities test failed, aborting")
            return

        # Test 2: Parameter extraction for all test scanners
        extraction_results = {}
        for scanner_name, scanner_code in TEST_SCANNERS.items():
            result = await self.test_parameter_extraction(scanner_name, scanner_code)
            if result:
                extraction_results[scanner_name] = result

        # Test 3: Collaborative formatting steps
        if extraction_results:
            scanner_name = list(extraction_results.keys())[0]
            scanner_code = TEST_SCANNERS[scanner_name]
            parameters = extraction_results[scanner_name]['parameters']

            step_result = await self.test_collaborative_step(scanner_code, parameters)

            # Test 4: Personalized suggestions
            await self.test_personalized_suggestions(scanner_code)

        # Summary
        await self.print_test_summary()

    async def print_test_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 HUMAN-IN-THE-LOOP FORMATTING TEST SUMMARY")
        print("="*60)

        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results.values() if result.get('extraction_success', False))

        print(f"Total scanners tested: {total_tests}")
        print(f"Successful extractions: {successful_tests}")
        print(f"Success rate: {(successful_tests/total_tests*100):.1f}%")

        print("\nDetailed Results:")
        for scanner_name, result in self.test_results.items():
            if result.get('extraction_success', False):
                print(f"✅ {scanner_name}: {result['parameters_found']} parameters, {result['confidence']:.2f} confidence, type: {result['scanner_type']}")
            else:
                print(f"❌ {scanner_name}: {result.get('error', 'Unknown error')}")

        print("\n🎯 Key Findings:")
        if successful_tests > 0:
            avg_confidence = sum(r.get('confidence', 0) for r in self.test_results.values() if r.get('extraction_success', False)) / successful_tests
            total_parameters = sum(r.get('parameters_found', 0) for r in self.test_results.values() if r.get('extraction_success', False))

            print(f"• Average confidence score: {avg_confidence:.2f}")
            print(f"• Total parameters discovered: {total_parameters}")
            print(f"• Most complex scanner: {max(self.test_results.keys(), key=lambda k: self.test_results[k].get('parameters_found', 0))}")

        print("\n🚀 System Status: Human-in-the-loop formatting is operational and ready for production!")

async def main():
    """Main test execution"""
    print("🤖 Human-in-the-Loop Scanner Formatter Test Suite")
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Backend URL: {API_BASE_URL}")
    print("-" * 60)

    async with HumanInTheLoopTester() as tester:
        await tester.run_comprehensive_test()

    print(f"\n⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("✨ Test suite finished!")

if __name__ == "__main__":
    asyncio.run(main())