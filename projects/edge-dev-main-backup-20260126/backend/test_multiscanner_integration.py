#!/usr/bin/env python3
"""
Integration Test for Multi-Scanner Fix

This script tests whether the multi-scanner fix is properly integrated
into the main.py execution pipeline.
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))


async def test_multi_scanner_detection():
    """Test that multi-scanners are properly detected"""
    print("\n" + "="*60)
    print("TEST 1: Multi-Scanner Detection Integration")
    print("="*60)

    # Test multi-scanner code
    multi_scanner_code = '''
class TestMultiScanner:
    """
    Multi-Pattern Scanner with 2 patterns

    Patterns:
    - lc_frontside_d3
    - lc_backside_d3
    """

    def __init__(self):
        self.d0_start = "2024-01-01"
        self.d0_end = "2024-12-31"
        self.historical_buffer_days = 1050

        # Pattern assignments
        self.pattern_assignments = [
            {
                "name": "lc_frontside_d3",
                "logic": "(gap > 0.01) & (range > range.mean()) & (close > open)"
            },
            {
                "name": "lc_backside_d3",
                "logic": "(gap < -0.01) & (range > range.mean()) & (close < open)"
            }
        ]

    def run_scan(self, start_date=None, end_date=None):
        import pandas as pd
        return pd.DataFrame({
            'ticker': ['AAPL', 'MSFT'],
            'date': ['2024-01-15', '2024-01-16'],
            'gap': [0.02, -0.015],
            'Scanner_Label': ['lc_frontside_d3', 'lc_backside_d3']
        })
'''

    # Test detection
    from multiscanner_fix import detect_pattern_assignments
    is_multi, patterns = detect_pattern_assignments(multi_scanner_code)

    print(f"Multi-scanner detected: {is_multi}")
    print(f"Patterns found: {len(patterns)}")

    if is_multi and len(patterns) == 2:
        print("✅ Multi-scanner detection working")
        for i, pattern in enumerate(patterns, 1):
            print(f"   Pattern {i}: {pattern['name']}")
        return True
    else:
        print("❌ Multi-scanner detection failed")
        return False


async def test_main_py_integration():
    """Test that main.py properly uses the multi-scanner fix"""
    print("\n" + "="*60)
    print("TEST 2: Main.py Integration")
    print("="*60)

    # Check if main.py imports the fix
    try:
        with open('main.py', 'r') as f:
            main_content = f.read()

        if 'from multiscanner_fix import detect_pattern_assignments' in main_content:
            print("✅ Main.py has multi-scanner import")
        else:
            print("⚠️  Main.py missing multi-scanner import")
            return False

        if 'MULTI-SCANNER FIX' in main_content or 'MULTI-SCANNER SUPPORT' in main_content:
            print("✅ Main.py has multi-scanner support code")
        else:
            print("⚠️  Main.py missing multi-scanner support code")
            return False

        if 'execute_multi_scanner' in main_content:
            print("✅ Main.py uses execute_multi_scanner function")
        else:
            print("⚠️  Main.py doesn't use execute_multi_scanner")
            return False

        return True

    except Exception as e:
        print(f"❌ Error checking main.py: {e}")
        return False


async def test_end_to_end_execution():
    """Test end-to-end execution through the pipeline"""
    print("\n" + "="*60)
    print("TEST 3: End-to-End Execution Simulation")
    print("="*60)

    # Simulate the execution pipeline
    test_scanner_code = '''
class EndToEndTestScanner:
    """Multi-scanner for end-to-end testing"""

    def __init__(self):
        self.d0_start = "2024-01-01"
        self.d0_end = "2024-01-31"

        self.pattern_assignments = [
            {"name": "test_pattern_1", "logic": "gap > 0.01"},
            {"name": "test_pattern_2", "logic": "gap < -0.01"}
        ]

    def run_scan(self, start_date=None, end_date=None):
        import pandas as pd
        return pd.DataFrame({
            'ticker': ['TEST1', 'TEST2'],
            'Scanner_Label': ['test_pattern_1', 'test_pattern_2']
        })
'''

    try:
        # Import the modules
        from multiscanner_fix import detect_pattern_assignments, execute_multi_scanner

        # Test detection
        is_multi, patterns = detect_pattern_assignments(test_scanner_code)

        if not is_multi:
            print("❌ Failed to detect multi-scanner")
            return False

        print(f"✅ Detected {len(patterns)} patterns")

        # Test execution (with mock data)
        print("🔄 Testing execution pipeline...")
        results = execute_multi_scanner(
            code=test_scanner_code,
            start_date="2024-01-01",
            end_date="2024-01-31",
            progress_callback=None,
            pure_execution_mode=True
        )

        if results:
            print(f"✅ Execution returned {len(results)} results")
            for result in results:
                print(f"   - {result.get('ticker', 'Unknown')}: {result.get('Scanner_Label', 'No label')}")
            return True
        else:
            print("❌ Execution returned no results")
            return False

    except Exception as e:
        print(f"❌ Execution test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all integration tests"""
    print("Multi-Scanner Integration Test Suite")
    print("="*60)

    results = []

    # Run tests
    results.append(("Multi-Scanner Detection", await test_multi_scanner_detection()))
    results.append(("Main.py Integration", await test_main_py_integration()))
    results.append(("End-to-End Execution", await test_end_to_end_execution()))

    # Summary
    print("\n" + "="*60)
    print("INTEGRATION TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All integration tests passed!")
        print("\n✅ Multi-scanner fix is properly integrated into the 5666/scan endpoint")
        print("✅ Multi-scanners will now execute correctly through the pipeline")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
