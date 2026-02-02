"""
Test with relaxed thresholds to see if we can find any signals
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates')

from sc_dmr.formatted import UltraFastRenataSCDMRMultiScanner
import pandas as pd

print("="*80)
print("TESTING WITH RELAXED THRESHOLDS")
print("="*80)

scanner = UltraFastRenataSCDMRMultiScanner()

# Test NVDA with relaxed filters
symbol = 'NVDA'
df = scanner._fetch_symbol_history(symbol)

if not df.empty:
    df = scanner._calculate_features(df)
    df['Date'] = pd.to_datetime(df['Date'])

    # Filter to 2025 only
    df_2025 = df[df['Date'] >= '2025-01-01'].copy()

    print(f"\n{symbol} in 2025: {len(df_2025)} rows")

    if len(df_2025) > 0:
        # Check what ranges of gains we actually have
        df_2025['gain_pct'] = (df_2025['prev_high'] / df_2025['prev_close_1'] - 1) * 100
        df_2025['gap_pct'] = df_2025['prev_gap'] * 100

        print(f"\nGain distribution (prev_high vs prev_close_1):")
        print(f"  Min: {df_2025['gain_pct'].min():.2f}%")
        print(f"  Max: {df_2025['gain_pct'].max():.2f}%")
        print(f"  Mean: {df_2025['gain_pct'].mean():.2f}%")
        print(f"  Median: {df_2025['gain_pct'].median():.2f}%")

        print(f"\nGap distribution (prev_gap):")
        print(f"  Min: {df_2025['gap_pct'].min():.2f}%")
        print(f"  Max: {df_2025['gap_pct'].max():.2f}%")
        print(f"  Mean: {df_2025['gap_pct'].mean():.2f}%")
        print(f"  Median: {df_2025['gap_pct'].median():.2f}%")

        # Count how many would pass different thresholds
        for threshold in [5, 10, 15, 20]:
            count = (df_2025['gain_pct'] >= threshold).sum()
            print(f"\nRows with gain >= {threshold}%: {count}")

        for threshold in [1, 2, 5, 10, 20]:
            count = (df_2025['gap_pct'] >= threshold).sum()
            print(f"Rows with gap >= {threshold}%: {count}")

        # Test with 5% threshold
        print(f"\n{'='*70}")
        print("Testing with 5% thresholds instead of 20%:")
        print('='*70)

        mask = (
            ((df_2025['prev_high'] / df_2025['prev_close_1'] - 1) >= 0.05) &
            (df_2025['prev_gap'] >= 0.02) &
            (df_2025['prev_gap_2'] >= 0.02) &
            (df_2025['prev_range'] > df_2025['prev_range_2']) &
            (df_2025['dol_gap'] >= df_2025['prev_range'] * 0.1)
        )

        matches = df_2025[mask]
        print(f"Matches with 5% gain threshold: {len(matches)}")

        if not matches.empty:
            print(f"\nFound signals:")
            for idx, row in matches.head(10).iterrows():
                print(f"  - {row['Date']}: gain={row['gain_pct']:.2f}%, gap={row['gap_pct']:.2f}%")
        else:
            print(f"  Still no matches - checking first row details...")
            if len(df_2025) > 0:
                row = df_2025.iloc[0]
                print(f"  First row:")
                print(f"    gain: {row['gain_pct']:.2f}% (need >= 5%)")
                print(f"    gap: {row['gap_pct']:.2f}% (need >= 2%)")
                print(f"    gap_2: {row.get('prev_gap_2', 0) * 100:.2f}% (need >= 2%)")
                print(f"    range condition: {row['prev_range']:.2f} > {row.get('prev_range_2', 0):.2f}")

print("\n" + "="*80)
