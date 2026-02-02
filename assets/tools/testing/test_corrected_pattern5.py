#!/usr/bin/env python3
"""
Test Corrected Pattern 5 Detection for LC D2 Scanner
Verifies the updated pattern detection logic
"""

import os

def test_pattern5_detection():
    """Test the corrected Pattern 5 detection logic"""

    print("🧪 TESTING CORRECTED PATTERN 5 DETECTION")
    print("=" * 60)

    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    if not os.path.exists(lc_d2_file):
        print(f"❌ LC D2 file not found: {lc_d2_file}")
        return False

    try:
        with open(lc_d2_file, 'r', encoding='utf-8') as f:
            code = f.read()

        print(f"📄 File loaded: {len(code)} characters")

        # Test the corrected Pattern 5 detection logic
        has_async_main = 'async def main(' in code
        has_dates = 'DATES' in code
        has_asyncio_run = 'asyncio.run(main())' in code

        print(f"\n🔍 CORRECTED PATTERN 5 CHECKS:")
        print(f"   ✅ 'async def main(' in code: {has_async_main}")
        print(f"   ✅ 'DATES' in code: {has_dates}")
        print(f"   ✅ 'asyncio.run(main())' in code: {has_asyncio_run}")

        pattern5_match = has_async_main and has_dates and has_asyncio_run

        if pattern5_match:
            print(f"\n🎯 PATTERN 5 DETECTION: ✅ SUCCESS!")
            print(f"   Scanner pattern: async_main_DATES")
            print(f"   Expected log: 'Detected Pattern 5: async def main + DATES + asyncio.run(main()) - LC D2 scanner'")
        else:
            print(f"\n❌ PATTERN 5 DETECTION: FAILED!")
            print(f"   Missing components:")
            if not has_async_main:
                print(f"   - async def main(")
            if not has_dates:
                print(f"   - DATES")
            if not has_asyncio_run:
                print(f"   - asyncio.run(main())")

        # Also verify the OLD pattern 5 (which was wrong) does NOT match
        print(f"\n🔍 OLD PATTERN 5 CHECKS (should be FALSE):")
        old_has_fetch_daily = 'def fetch_daily_data(' in code
        old_has_adjust_daily = 'def adjust_daily(' in code
        old_has_symbols = 'SYMBOLS = [' in code

        print(f"   ❌ 'def fetch_daily_data(' in code: {old_has_fetch_daily}")
        print(f"   ✅ 'def adjust_daily(' in code: {old_has_adjust_daily}")
        print(f"   ❌ 'SYMBOLS = [' in code: {old_has_symbols}")

        old_pattern_match = old_has_fetch_daily and old_has_adjust_daily and old_has_symbols

        if not old_pattern_match:
            print(f"   ✅ OLD PATTERN 5: Correctly does NOT match (good!)")
        else:
            print(f"   ❌ OLD PATTERN 5: Incorrectly matches (bad!)")

        return pattern5_match

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    print("🔧 LC D2 PATTERN 5 CORRECTION TEST")
    print("=" * 60)
    print("Testing the corrected Pattern 5 detection for LC D2 scanner")
    print()

    success = test_pattern5_detection()

    print(f"\n🎯 TEST RESULT: {'✅ PASS' if success else '❌ FAIL'}")
    print("=" * 60)

    if success:
        print("✅ The corrected Pattern 5 should now detect LC D2 scanner correctly!")
        print("📋 Next steps:")
        print("   1. Upload your LC D2 scanner file")
        print("   2. Click 'Run Scan'")
        print("   3. Check for log: 'Detected Pattern 5: async def main + DATES...'")
        print("   4. Verify scan produces actual results (not 0)")
    else:
        print("❌ Pattern 5 detection logic needs further adjustment")

    print()

if __name__ == "__main__":
    main()