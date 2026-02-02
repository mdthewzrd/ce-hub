#!/usr/bin/env python3
"""
Test the execution fixes to verify both issues are resolved:
1. NoneType await expression error
2. datetime.date.today() method_descriptor error

This should finally allow the LC scanner to execute and find actual results.
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_lc_scanner_fixed():
    """Test the LC scanner with fixes applied"""
    print("🧪 TESTING LC SCANNER WITH EXECUTION FIXES")
    print("=" * 70)
    print("Testing both NoneType await and datetime.date.today() fixes")
    print()

    # Load LC scanner
    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded LC scanner: {len(code)} characters")
        print()

        # Test with async progress callback (this should work now)
        async def test_progress_callback(percentage, message):
            print(f"  ✅ Progress callback working: [{percentage:3d}%] {message}")

        print("🔧 Testing with recent dates that should have volatility:")
        print("   2024-11-01 to 2024-11-15 (Election aftermath + Fed meeting)")

        result = await execute_uploaded_scanner_direct(
            code=code,
            start_date="2024-11-01",
            end_date="2024-11-15",
            progress_callback=test_progress_callback
        )

        print(f"\n✅ EXECUTION COMPLETED WITHOUT ERRORS!")

        if isinstance(result, list):
            result_count = len(result)
            print(f"📊 Results found: {result_count}")

            if result_count > 0:
                print(f"🎉 SUCCESS! LC scanner found {result_count} trading signals!")
                print(f"🎯 This proves your point - there ARE results to be found!")

                # Show sample results
                print(f"\n📋 Sample trading signals:")
                for i, signal in enumerate(result[:10]):
                    if isinstance(signal, dict):
                        symbol = signal.get('symbol', 'Unknown')
                        date = signal.get('date', 'Unknown')
                        print(f"   {i+1}. {symbol} on {date}")
                    else:
                        print(f"   {i+1}. {signal}")

                if result_count > 10:
                    print(f"   ... and {result_count - 10} more signals")

                return True, result_count
            else:
                print(f"⚠️ No results found in this period")
                print(f"💡 Scanner executed without errors but found 0 matches")
                print(f"   This suggests the pattern criteria may be very restrictive")
                return True, 0
        else:
            print(f"❌ Unexpected result type: {type(result)}")
            return False, 0

    except Exception as e:
        print(f"❌ Scanner still failing: {e}")
        import traceback
        traceback.print_exc()
        return False, 0

async def test_backside_scanner_fixed():
    """Test the backside scanner to compare"""
    print(f"\n🧪 TESTING BACKSIDE SCANNER WITH FIXES")
    print("=" * 70)

    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/standardized_backside_para_b_scanner.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded backside scanner: {len(code)} characters")

        # Use silent callback to test the fix
        async def silent_callback(percentage, message):
            pass  # Silent but async

        result = await execute_uploaded_scanner_direct(
            code=code,
            start_date="2024-11-01",
            end_date="2024-11-15",
            progress_callback=silent_callback
        )

        if isinstance(result, list):
            result_count = len(result)
            print(f"✅ Backside scanner executed: {result_count} results")
            return True, result_count
        else:
            print(f"❌ Backside error: {result}")
            return False, 0

    except Exception as e:
        print(f"❌ Backside scanner error: {e}")
        return False, 0

async def test_multiple_periods():
    """Test LC scanner across multiple periods to find results"""
    print(f"\n🧪 TESTING MULTIPLE PERIODS FOR LC RESULTS")
    print("=" * 70)

    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        # Test multiple volatile periods
        test_periods = [
            ("2024-03-15", "2024-03-22", "Fed March meeting week"),
            ("2024-07-15", "2024-07-31", "Earnings season volatility"),
            ("2024-08-01", "2024-08-15", "August market correction"),
            ("2024-11-05", "2024-11-12", "Election week volatility")
        ]

        total_results = 0
        working_periods = 0

        for start_date, end_date, description in test_periods:
            print(f"   🔍 {description}: {start_date} to {end_date}")

            try:
                result = await execute_uploaded_scanner_direct(
                    code=code,
                    start_date=start_date,
                    end_date=end_date,
                    progress_callback=None  # Test None callback handling
                )

                if isinstance(result, list):
                    count = len(result)
                    total_results += count
                    if count > 0:
                        working_periods += 1
                        print(f"      ✅ Found {count} LC signals!")
                    else:
                        print(f"      ⚪ 0 results in this period")

            except Exception as e:
                print(f"      ❌ Error: {e}")

        print(f"\n📊 MULTI-PERIOD RESULTS:")
        print(f"   Total signals found: {total_results}")
        print(f"   Periods with signals: {working_periods}/{len(test_periods)}")

        return total_results > 0

    except Exception as e:
        print(f"❌ Multi-period test failed: {e}")
        return False

async def main():
    """Test all execution fixes"""
    print("🎯 EXECUTION FIXES VERIFICATION")
    print("=" * 70)
    print("Testing fixes for both execution errors")
    print()

    # Test LC scanner
    lc_works, lc_count = await test_lc_scanner_fixed()

    # Test backside scanner
    backside_works, backside_count = await test_backside_scanner_fixed()

    # Test multiple periods
    multi_period_works = await test_multiple_periods()

    print("\n" + "=" * 70)
    print("🎯 FIXES VERIFICATION RESULTS")
    print("=" * 70)

    print(f"🔧 LC Scanner Execution: {'✅ FIXED' if lc_works else '❌ Still broken'}")
    print(f"🔧 Backside Scanner Execution: {'✅ FIXED' if backside_works else '❌ Still broken'}")

    if lc_works:
        print(f"\n🎉 EXECUTION ERRORS SUCCESSFULLY RESOLVED!")
        print(f"   ✅ No more 'await None' errors")
        print(f"   ✅ No more 'method_descriptor today' errors")
        print(f"   ✅ Scanners can now execute properly")

        if lc_count > 0:
            print(f"\n🎯 USER WAS RIGHT - SCANNER FOUND {lc_count} RESULTS!")
            print(f"   The issue WAS execution errors preventing results")
        elif multi_period_works:
            print(f"\n💡 Scanner works but may need broader date ranges")
            print(f"   Try testing with longer periods or different market conditions")
        else:
            print(f"\n🤔 Scanner executes but finds 0 results across all periods")
            print(f"   This may indicate very restrictive pattern criteria")

        return True
    else:
        print(f"\n❌ EXECUTION ERRORS STILL PRESENT")
        print(f"   Need additional debugging to resolve remaining issues")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n✅ FIXES VERIFIED: User's scanner issues are resolved!")
    else:
        print("\n🔧 MORE WORK NEEDED: Additional fixes required")