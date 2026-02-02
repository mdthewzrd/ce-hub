"""
Diagnostic test for Extended Gap scanner
Tests with a small date range to see what's filtering out candidates
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_extended_gap():
    """Test Extended Gap with November 2025"""
    print("\n" + "="*70)
    print("🔍 TESTING EXTENDED GAP SCANNER")
    print("="*70)

    from fixed_formatted import GroupedEndpointExtendedGapScanner

    # Test with November 2025
    scanner = GroupedEndpointExtendedGapScanner(
        d0_start="2025-11-01",
        d0_end="2025-11-30"
    )

    print(f"\n📅 Testing: {scanner.d0_start} to {scanner.d0_end}")
    print(f"📊 Data range: {scanner.scan_start} to {scanner.scan_end}")

    # Check key filters
    print(f"\n📋 Key Filters:")
    print(f"  - D-1 Volume >= {scanner.params['day_minus_1_vol_min']:,}")
    print(f"  - Breakout Extension >= {scanner.params['breakout_extension_min']} ATR")
    print(f"  - D-1 High to EMA10/30 >= {scanner.params['d1_high_to_ema10_div_atr_min']} ATR")
    print(f"  - PMH % >= {scanner.params['pmh_pct_min']}%")
    print(f"  - D-1 Change >= {scanner.params['d1_change_pct_min']}%")
    print(f"  - Range D-1 High/D-2 Low >= {scanner.params['range_d1h_d2l_min']} ATR")
    print(f"  - Range D-1 High/D-3 Low >= {scanner.params['range_d1h_d3l_min']} ATR")
    print(f"  - Range D-1 High/D-8 Low >= {scanner.params['range_d1h_d8l_min']} ATR")
    print(f"  - Range D-1 High/D-15 Low >= {scanner.params['range_d1h_d15l_min']} ATR")

    # Run the scan
    results = scanner.execute()

    print(f"\n✅ RESULTS: {len(results)} signals found")

    if not results.empty:
        print(f"\n📊 Signals found:")
        print(results.to_string(index=False))
    else:
        print(f"\n⚠️  No signals found - this may indicate:")
        print(f"   1. Extended Gap is genuinely a rare pattern")
        print(f"   2. Filters are too strict")
        print(f"   3. Data range insufficient")
        print(f"   4. Need to check if original found results for this period")

if __name__ == "__main__":
    test_extended_gap()

    print("\n" + "="*70)
    print("🔍 DIAGNOSTIC COMPLETE")
    print("="*70)
    print("\n💡 NOTES:")
    print("   - Extended Gap is a VERY complex pattern with 13+ conditions")
    print("   - Original scanner only checked 140 specific tickers")
    print("   - Our scanner checks ALL 12,000+ tickers from grouped endpoint")
    print("   - This is expected to be a rare pattern")
    print("   - 5 results in a full year might be accurate")
