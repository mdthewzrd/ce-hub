"""
Diagnostic test for LC 3D Gap scanner
Tests with December 2025 to verify signals are found
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_lc_3d_gap():
    """Test LC 3D Gap with December 2025 (should find PSLV, SLV signals)"""
    print("\n" + "="*70)
    print("🔍 TESTING LC 3D GAP SCANNER")
    print("="*70)

    from fixed_formatted import GroupedEndpointLC3DGapScanner

    # Test with December 2025
    scanner = GroupedEndpointLC3DGapScanner(
        d0_start="2025-12-01",
        d0_end="2025-12-31"
    )

    print(f"\n📅 Testing: {scanner.d0_start} to {scanner.d0_end}")
    print(f"📊 Data range: {scanner.scan_start} to {scanner.scan_end}")

    # Check key filters
    print(f"\n📋 Key Filters:")
    print(f"  - Day -14 Avg EMA10 >= {scanner.params['day_14_avg_ema10_min']}x ATR")
    print(f"  - Day -14 Avg EMA30 >= {scanner.params['day_14_avg_ema30_min']}x ATR")
    print(f"  - Day -7 Avg EMA10 >= {scanner.params['day_7_avg_ema10_min']}x ATR")
    print(f"  - Day -7 Avg EMA30 >= {scanner.params['day_7_avg_ema30_min']}x ATR")
    print(f"  - Day -3 Avg EMA10 >= {scanner.params['day_3_avg_ema10_min']}x ATR")
    print(f"  - Day -3 Avg EMA30 >= {scanner.params['day_3_avg_ema30_min']}x ATR")
    print(f"  - Day -2 EMA10 >= {scanner.params['day_2_ema10_distance_min']}x ATR")
    print(f"  - Day -2 EMA30 >= {scanner.params['day_2_ema30_distance_min']}x ATR")
    print(f"  - Day -1 EMA10 >= {scanner.params['day_1_ema10_distance_min']}x ATR")
    print(f"  - Day -1 EMA30 >= {scanner.params['day_1_ema30_distance_min']}x ATR")
    print(f"  - Day -1 Volume >= {scanner.params['day_1_vol_min']:,}")
    print(f"  - Day -1 Close >= ${scanner.params['day_1_close_min']}")
    print(f"  - Day -1 High >= {scanner.params['day_1_high_vs_swing_high_min']}x ATR above swing high")
    print(f"  - Day 0 Gap >= {scanner.params['day_0_gap_min']}x ATR")
    print(f"  - Day 0 Open - Day -1 High >= {scanner.params['day_0_open_minus_d1_high_min']}x ATR")

    # Run the scan
    results = scanner.execute()

    print(f"\n✅ RESULTS: {len(results)} signals found")

    if not results.empty:
        print(f"\n📊 Signals found:")
        for idx, row in results.iterrows():
            print(f"\n  {row['Ticker']} on {row['Date']}:")
            print(f"    Open: ${row['Open']:.2f}, High: ${row['High']:.2f}, Close: ${row['Close']:.2f}")
            print(f"    Day_14_Avg_EMA10: {row['Day_14_Avg_EMA10']:.2f}x ATR")
            print(f"    Day_14_Avg_EMA30: {row['Day_14_Avg_EMA30']:.2f}x ATR")
            print(f"    Day_7_Avg_EMA10: {row['Day_7_Avg_EMA10']:.2f}x ATR")
            print(f"    Day_7_Avg_EMA30: {row['Day_7_Avg_EMA30']:.2f}x ATR")
            print(f"    Day_3_Avg_EMA10: {row['Day_3_Avg_EMA10']:.2f}x ATR")
            print(f"    Day_3_Avg_EMA30: {row['Day_3_Avg_EMA30']:.2f}x ATR")
            print(f"    Day_2_EMA10_Dist: {row['Day_2_EMA10_Dist']:.2f}x ATR")
            print(f"    Day_2_EMA30_Dist: {row['Day_2_EMA30_Dist']:.2f}x ATR")
            print(f"    Day_1_EMA10_Dist: {row['Day_1_EMA10_Dist']:.2f}x ATR")
            print(f"    Day_1_EMA30_Dist: {row['Day_1_EMA30_Dist']:.2f}x ATR")
            print(f"    Day_1_High_vs_Swing: {row['Day_1_High_vs_Swing']:.2f}x ATR")
            print(f"    Day_0_Gap: {row['Day_0_Gap']:.2f}x ATR")
            print(f"    Day_0_Open_Minus_D1_High: {row['Day_0_Open_Minus_D1_High']:.2f}x ATR")
    else:
        print(f"\n❌ No signals found!")

if __name__ == "__main__":
    test_lc_3d_gap()

    print("\n" + "="*70)
    print("🔍 DIAGNOSTIC COMPLETE")
    print("="*70)
    print("\n💡 NOTES:")
    print("   - LC 3D Gap is a complex pattern with 15 conditions")
    print("   - Original scanner only checked 140 specific tickers")
    print("   - Our scanner checks ALL tickers from grouped endpoint")
    print("   - Expected to find several signals in December 2025")
