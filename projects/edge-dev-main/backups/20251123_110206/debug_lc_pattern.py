#!/usr/bin/env python3
"""
Debug the LC D2 Extended pattern to see why it's finding 0 results
Break down each filter condition to see where stocks are being eliminated
"""
import sys
import os
import asyncio
import pandas as pd

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def debug_lc_pattern():
    """
    Debug the LC pattern step by step to see where stocks get filtered out
    """
    print("🔍 DEBUGGING LC D2 EXTENDED PATTERN")
    print("=" * 70)
    print("Analyzing why the pattern finds 0 results...")
    print()

    # Load scanner and modify it for debugging
    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(scanner_file, 'r') as f:
            original_code = f.read()
    except Exception as e:
        print(f"❌ Failed to load scanner: {e}")
        return

    # Create debug version of the scanner
    debug_code = original_code.replace(
        "def check_high_lvl_filter_lc(df):",
        """def check_high_lvl_filter_lc(df):
    \"\"\"
    🔧 DEBUG VERSION: LC Frontside D2 Extended with step-by-step analysis
    \"\"\"
    print(f"🔍 DEBUG: Starting with {len(df)} total stocks")

    # Check each condition step by step
    step1 = df['h'] >= df['h1']
    print(f"   Step 1 - Higher high than previous: {step1.sum()} stocks pass")

    step2 = step1 & (df['l'] >= df['l1'])
    print(f"   Step 2 - Higher low than previous: {step2.sum()} stocks pass")

    # Check price/volume tier conditions
    tier_conditions = (
        ((df['high_pct_chg'] >= .5) & (df['c_ua'] >= 5) & (df['c_ua'] < 15) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=2.5)) |
        ((df['high_pct_chg'] >= .3) & (df['c_ua'] >= 15) & (df['c_ua'] < 25) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=2)) |
        ((df['high_pct_chg'] >= .2) & (df['c_ua'] >= 25) & (df['c_ua'] < 50) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=1.5)) |
        ((df['high_pct_chg'] >= .15) & (df['c_ua'] >= 50) & (df['c_ua'] < 90) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=1)) |
        ((df['high_pct_chg'] >= .1) & (df['c_ua'] >= 90) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=0.75))
    )
    step3 = step2 & tier_conditions
    print(f"   Step 3 - Price/volume tier conditions: {step3.sum()} stocks pass")

    step4 = step3 & (df['high_chg_atr'] >= 1.5)
    print(f"   Step 4 - ATR breakout requirement: {step4.sum()} stocks pass")

    step5 = step4 & (df['c'] >= df['o'])
    print(f"   Step 5 - Close above open: {step5.sum()} stocks pass")

    step6 = step5 & (df['dist_h_9ema_atr'] >= 2)
    print(f"   Step 6 - Distance from 9 EMA: {step6.sum()} stocks pass")

    step7 = step6 & (df['dist_h_20ema_atr'] >= 3)
    print(f"   Step 7 - Distance from 20 EMA: {step7.sum()} stocks pass")

    step8 = step7 & (df['v_ua'] >= 10000000)
    print(f"   Step 8 - Volume >= 10M: {step8.sum()} stocks pass")

    step9 = step8 & (df['dol_v'] >= 500000000)
    print(f"   Step 9 - Dollar volume >= $500M: {step9.sum()} stocks pass")

    step10 = step9 & (df['c_ua'] >= 5)
    print(f"   Step 10 - Price >= $5: {step10.sum()} stocks pass")

    step11 = step10 & (df['dist_l_9ema_atr'] >= 1)
    print(f"   Step 11 - Low distance from EMA: {step11.sum()} stocks pass")

    step12 = step11 & (df['h_dist_to_highest_high_20_1_atr']>=1)
    print(f"   Step 12 - Distance to recent highs: {step12.sum()} stocks pass")

    step13 = step12 & (df['dol_v_cum5_1']>=500000000)
    print(f"   Step 13 - 5-day dollar volume: {step13.sum()} stocks pass")

    step14 = step13 & (df['h'] >= df['highest_high_20'])
    print(f"   Step 14 - New 20-day highs: {step14.sum()} stocks pass")

    step15 = step14 & (df['ema9'] >= df['ema20'])
    print(f"   Step 15 - EMA9 > EMA20: {step15.sum()} stocks pass")

    final_condition = step15 & (df['ema20'] >= df['ema50'])
    print(f"   FINAL - EMA20 > EMA50: {final_condition.sum()} stocks pass")

    # Show some stats about the most restrictive filters
    print(f"\\n📊 FILTER IMPACT ANALYSIS:")
    print(f"   Most restrictive: Volume >= 10M eliminates {len(df) - (df['v_ua'] >= 10000000).sum()} stocks")
    print(f"   Dollar volume >= $500M eliminates {len(df) - (df['dol_v'] >= 500000000).sum()} stocks")
    print(f"   New 20-day highs eliminates {len(df) - (df['h'] >= df['highest_high_20']).sum()} stocks")"""
    ).replace(
        "df['lc_frontside_d2_extended'] = ((df['h'] >= df['h1']) &",
        "df['lc_frontside_d2_extended'] = final_condition.astype(int)\n    \n    # Original pattern for reference:\n    # df['lc_frontside_d2_extended'] = ((df['h'] >= df['h1']) &"
    ).replace(
        ").astype(int)",
        "# ).astype(int)  # Replaced with debug version above"
    )

    print("🔧 Created debug version of scanner")
    print("🚀 Running debug analysis on recent market data...")
    print()

    try:
        async def progress_callback(percentage, message):
            if percentage % 25 == 0:
                print(f"  [{percentage:3d}%] {message}")

        # Test with recent volatile period
        result = await execute_uploaded_scanner_direct(
            code=debug_code,
            start_date="2024-11-01",
            end_date="2024-11-30",
            progress_callback=progress_callback
        )

        print(f"\n✅ Debug analysis completed")
        print(f"📊 Final results: {len(result) if isinstance(result, list) else 'Error'}")

        return result

    except Exception as e:
        print(f"❌ Debug analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return None

async def main():
    """Run pattern debugging"""
    print("🎯 LC PATTERN DEBUGGING ANALYSIS")
    print("=" * 70)
    print("Investigating why LC D2 Extended finds 0 results")
    print("This will show exactly where stocks get filtered out")
    print()

    result = await debug_lc_pattern()

    print("\n" + "=" * 70)
    print("🔍 DEBUG ANALYSIS COMPLETE")
    print("=" * 70)

    if result is not None:
        if isinstance(result, list) and len(result) > 0:
            print("🎉 Found actual results! The pattern works but is very restrictive.")
        else:
            print("⚠️ Still 0 results - the pattern may be too restrictive for current market")
            print("💡 Consider loosening some of the more restrictive filters:")
            print("   - Volume requirement (currently 10M+)")
            print("   - Dollar volume requirement (currently $500M+)")
            print("   - ATR requirements")
    else:
        print("❌ Debug analysis failed")

if __name__ == "__main__":
    asyncio.run(main())