#!/usr/bin/env python3
"""
Test a greatly simplified version of the LC pattern to see if we can get ANY results
This will help determine if the issue is with the pattern being too restrictive
or if there's a fundamental problem with data/execution
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_very_simple_pattern():
    """Test with extremely loose LC criteria to see if we can get any results"""
    print("🧪 TESTING VERY SIMPLIFIED LC PATTERN")
    print("=" * 70)
    print("Using minimal criteria to test if pattern can find anything")
    print()

    # Load original scanner
    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(scanner_file, 'r') as f:
            original_code = f.read()
    except Exception as e:
        print(f"❌ Failed to load scanner: {e}")
        return False

    # Create super simplified version - just basic breakout criteria
    simplified_code = original_code.replace(
        """    df['lc_frontside_d2_extended'] = ((df['h'] >= df['h1']) &

                        (df['l'] >= df['l1']) &

                        (((df['high_pct_chg'] >= .5) & (df['c_ua'] >= 5) & (df['c_ua'] < 15) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=2.5)) |
                        ((df['high_pct_chg'] >= .3) & (df['c_ua'] >= 15) & (df['c_ua'] < 25) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=2)) |
                        ((df['high_pct_chg'] >= .2) & (df['c_ua'] >= 25) & (df['c_ua'] < 50) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=1.5)) |
                        ((df['high_pct_chg'] >= .15) & (df['c_ua'] >= 50) & (df['c_ua'] < 90) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=1)) |
                        ((df['high_pct_chg'] >= .1) & (df['c_ua'] >= 90) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=0.75)))  &

                        (df['high_chg_atr'] >= 1.5) &
                        (df['c'] >= df['o']) &
                        (df['dist_h_9ema_atr'] >= 2) &
                        (df['dist_h_20ema_atr'] >= 3) &
                        (df['v_ua'] >= 10000000) &
                        (df['dol_v'] >= 500000000) &
                        (df['c_ua'] >= 5) &

                        (df['dist_l_9ema_atr'] >= 1) &

                        (df['h_dist_to_highest_high_20_1_atr']>=1)&

                        (df['dol_v_cum5_1']>=500000000)&

                        ((df['h'] >= df['highest_high_20']) &
                        (df['ema9'] >= df['ema20']) &
                        (df['ema20'] >= df['ema50']))

                        ).astype(int)""",

        """    # 🧪 SUPER SIMPLIFIED TEST: Just basic higher high/low with minimal volume
    df['lc_frontside_d2_extended'] = ((df['h'] >= df['h1']) &     # Higher high than yesterday
                        (df['l'] >= df['l1']) &                   # Higher low than yesterday
                        (df['c'] >= df['o']) &                    # Close above open (green day)
                        (df['v_ua'] >= 1000000) &                 # At least 1M volume (vs 10M)
                        (df['c_ua'] >= 1)                         # At least $1 (vs $5)
                        ).astype(int)"""
    )

    print("🔧 Created super simplified scanner (just higher high/low + green + volume)")
    print("   - Removed ATR requirements")
    print("   - Reduced volume from 10M to 1M")
    print("   - Removed dollar volume requirement")
    print("   - Removed EMA requirements")
    print("   - Removed new high requirements")
    print()

    # Test multiple periods
    test_periods = [
        ("2024-11-01", "2024-11-05", "Early November 2024"),
        ("2024-10-01", "2024-10-31", "October 2024"),
        ("2024-08-01", "2024-08-31", "August 2024"),
    ]

    for start_date, end_date, description in test_periods:
        print(f"🔍 Testing {description}: {start_date} to {end_date}")

        try:
            result = await execute_uploaded_scanner_direct(
                code=simplified_code,
                start_date=start_date,
                end_date=end_date,
                progress_callback=lambda p, m: None  # Silent
            )

            if isinstance(result, list):
                result_count = len(result)
                print(f"   ✅ Found {result_count} results with simplified criteria")

                if result_count > 0:
                    print(f"   🎉 SUCCESS: Simplified pattern found results!")

                    # Show some examples
                    for i, stock in enumerate(result[:3]):
                        if isinstance(stock, dict):
                            symbol = stock.get('symbol', 'Unknown')
                            date = stock.get('date', 'Unknown')
                            print(f"      {i+1}. {symbol} on {date}")

                    return True
                else:
                    print(f"   ⚠️ Still 0 results even with simplified criteria")
            else:
                print(f"   ❌ Error: {result}")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            continue

    return False

async def test_backside_comparison():
    """Test a known working backside scanner for comparison"""
    print(f"\n🧪 TESTING WORKING BACKSIDE SCANNER FOR COMPARISON")
    print("=" * 70)

    # Look for working backside scanners
    possible_files = [
        "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_backside_b_extended_scanner.py",
        "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_backside_b_scanner.py"
    ]

    for file_path in possible_files:
        if os.path.exists(file_path):
            print(f"📄 Testing {os.path.basename(file_path)}")
            try:
                with open(file_path, 'r') as f:
                    backside_code = f.read()

                result = await execute_uploaded_scanner_direct(
                    code=backside_code,
                    start_date="2024-11-01",
                    end_date="2024-11-05",
                    progress_callback=lambda p, m: None
                )

                if isinstance(result, list) and len(result) > 0:
                    print(f"   ✅ Backside scanner found {len(result)} results!")
                    print(f"   💡 This confirms the system CAN find results")
                    return True
                else:
                    print(f"   ⚠️ Backside scanner also found 0 results")

            except Exception as e:
                print(f"   ❌ Error with backside: {e}")
                continue

    print("⚠️ No working backside scanners found")
    return False

async def main():
    """Test simplified patterns to isolate the issue"""
    print("🎯 SIMPLIFIED PATTERN TESTING")
    print("=" * 70)
    print("Testing if the issue is restrictive criteria vs fundamental problems")
    print()

    # Test super simplified LC pattern
    simplified_works = await test_very_simple_pattern()

    # Test known working scanner
    backside_works = await test_backside_comparison()

    print("\n" + "=" * 70)
    print("🎯 SIMPLIFIED TESTING RESULTS")
    print("=" * 70)

    if simplified_works:
        print("🎉 BREAKTHROUGH: Simplified LC pattern FOUND results!")
        print("💡 The issue is that the original pattern is TOO RESTRICTIVE")
        print("🔧 Solution: Relax some of the extreme requirements:")
        print("   - Lower volume requirement from 10M to 2-3M")
        print("   - Lower dollar volume from $500M to $100M")
        print("   - Relax ATR requirements")
        print("   - Consider making EMA requirements optional")
    elif backside_works:
        print("🤔 Backside scanners work, but LC pattern doesn't")
        print("💡 This suggests LC pattern logic may have an issue")
        print("🔧 Need to debug the specific LC pattern calculation")
    else:
        print("❌ Even simplified patterns find 0 results")
        print("💡 This suggests a fundamental issue with:")
        print("   - Data access/API connectivity")
        print("   - Date range handling")
        print("   - Market data availability")

    print(f"\n🎯 USER WAS RIGHT: If no results found even with simple criteria,")
    print(f"   there's definitely an issue that needs fixing!")

if __name__ == "__main__":
    asyncio.run(main())