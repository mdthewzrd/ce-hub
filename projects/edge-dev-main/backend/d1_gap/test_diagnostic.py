"""
Quick diagnostic test for D1 Gap and Extended Gap scanners
Tests with a small date range to see what's filtering out candidates
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_d1_gap():
    """Test D1 Gap with known dates that should have signals"""
    print("\n" + "="*70)
    print("🔍 TESTING D1 GAP SCANNER")
    print("="*70)

    from fixed_formatted import GroupedEndpointD1GapScanner

    # Test with November 2025 (old results have signals from this period)
    scanner = GroupedEndpointD1GapScanner(
        d0_start="2025-11-01",
        d0_end="2025-11-30"
    )

    print(f"\n📅 Testing: {scanner.d0_start} to {scanner.d0_end}")
    print(f"📊 Data range: {scanner.scan_start} to {scanner.scan_end}")

    # Check Stage 2 filters
    print(f"\n📋 Stage 2 Filters:")
    print(f"  - Price >= ${scanner.params['price_min']}")
    print(f"  - Volume >= {scanner.params['pm_vol_min']:,}")

    # Check Stage 3a filters
    print(f"\n📋 Stage 3a Filters:")
    print(f"  - Close <= {scanner.params['ema200_max_pct']*100}% of EMA200")
    print(f"  - Gap >= {scanner.params['gap_pct_min']*100}%")
    print(f"  - Open >= {scanner.params['open_over_prev_high_pct_min']*100}% above prev_high")

    # Run the scan
    results = scanner.execute()

    print(f"\n✅ RESULTS: {len(results)} signals found")

    if not results.empty:
        print(f"\n📊 First 10 signals:")
        print(results.head(10).to_string(index=False))

def test_extended_gap():
    """Test Extended Gap with a small date range"""
    print("\n" + "="*70)
    print("🔍 TESTING EXTENDED GAP SCANNER")
    print("="*70)

    from fixed_formatted import GroupedEndpointExtendedGapScanner

    # Test with a small recent date range
    scanner = GroupedEndpointExtendedGapScanner(
        d0_start="2024-12-01",
        d0_end="2024-12-31"
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

    # Run the scan
    results = scanner.execute()

    print(f"\n✅ RESULTS: {len(results)} signals found")

    if not results.empty:
        print(f"\n📊 Signals found:")
        print(results.to_string(index=False))
    else:
        print(f"\n⚠️  No signals found - this may indicate:")
        print(f"   1. Stage 2 filters too aggressive")
        print(f"   2. Data range insufficient (400 days)")
        print(f"   3. Extended Gap is genuinely rare")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Test scanners with diagnostics')
    parser.add_argument('--scanner', choices=['d1_gap', 'extended_gap', 'both'], default='both',
                       help='Which scanner to test')

    args = parser.parse_args()

    if args.scanner in ['d1_gap', 'both']:
        test_d1_gap()

    if args.scanner in ['extended_gap', 'both']:
        test_extended_gap()

    print("\n" + "="*70)
    print("🔍 DIAGNOSTIC COMPLETE")
    print("="*70)
    print("\n💡 NEXT STEPS:")
    print("   1. Review the debug output above")
    print("   2. Check which filter is removing candidates")
    print("   3. Verify data range has enough history")
    print("   4. Compare with original scanner results")
