"""
Debug SC DMR scanner to see why no signals are found
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates')

from sc_dmr.formatted import UltraFastRenataSCDMRMultiScanner
import pandas as pd

print("="*80)
print("DEBUGGING SC DMR SCANNER")
print("="*80)

# Initialize scanner
scanner = UltraFastRenataSCDMRMultiScanner()

print(f"\n📅 Configuration:")
print(f"  D0 Signal Range: {scanner.d0_start} to {scanner.d0_end}")
print(f"  Data Fetch Range: {scanner.scan_start} to {scanner.scan_end}")
print(f"  Mass Parameters: {scanner.mass_params}")

# Test with a few known volatile stocks
test_symbols = ['NVDA', 'TSLA', 'GME', 'AMC', 'SPY', 'QQQ']

print(f"\n🔍 Testing {len(test_symbols)} symbols: {test_symbols}")

for symbol in test_symbols[:2]:  # Test first 2
    print(f"\n{'='*70}")
    print(f"Testing {symbol}...")
    print('='*70)

    # Fetch data
    df = scanner._fetch_symbol_history(symbol)

    if df.empty:
        print(f"  ❌ No data fetched")
        continue

    print(f"  ✅ Fetched {len(df)} rows of data")
    print(f"  📊 Date range: {df['Date'].min()} to {df['Date'].max()}")

    # Calculate features
    df = scanner._calculate_features(df)
    print(f"  ✅ Features calculated, {len(df.columns)} columns")

    # Show sample of key features
    print(f"\n  📈 Sample features (row 5, first with complete history):")
    if len(df) > 5:
        row = df.iloc[5]
        print(f"    Date: {row['Date']}")
        print(f"    prev_high: {row.get('prev_high', 'N/A')}")
        print(f"    prev_close_1: {row.get('prev_close_1', 'N/A')}")
        print(f"    prev_close_raw: {row.get('prev_close_raw', 'N/A')}")
        print(f"    prev_range: {row.get('prev_range', 'N/A')}")
        print(f"    prev_gap: {row.get('prev_gap', 'N/A')}")
        print(f"    prev_volume: {row.get('prev_volume', 'N/A')}")
        print(f"    valid_trig_high: {row.get('valid_trig_high', 'N/A')}")

    # Filter by D0 range
    df['Date'] = pd.to_datetime(df['Date'])
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(scanner.d0_start)) &
        (df['Date'] <= pd.to_datetime(scanner.d0_end))
    ]

    print(f"\n  📅 After D0 filter: {len(df_d0)} rows")

    if df_d0.empty:
        print(f"  ⚠️  No data in D0 range!")
        continue

    # Apply mass filters
    df_filtered = df_d0.copy()

    initial_count = len(df_filtered)

    if scanner.mass_params['prev_close_bullish']:
        df_filtered = df_filtered[df_filtered['prev_close_raw'] >= df_filtered['prev_open']]
        print(f"  🔒 After bullish filter: {len(df_filtered)} rows")

    df_filtered = df_filtered[df_filtered['prev_close_raw'] >= scanner.mass_params['prev_close_min']]
    print(f"  💰 After price filter (>= ${scanner.mass_params['prev_close_min']}): {len(df_filtered)} rows")

    df_filtered = df_filtered[df_filtered['prev_volume'] >= scanner.mass_params['prev_volume_min']]
    print(f"  📊 After volume filter (>= {scanner.mass_params['prev_volume_min']:,}): {len(df_filtered)} rows")

    if scanner.mass_params['valid_trig_high_enabled']:
        df_filtered = df_filtered[df_filtered['valid_trig_high'] == True]
        print(f"  ✅ After valid high filter: {len(df_filtered)} rows")

    print(f"\n  📊 Mass filter summary: {initial_count} → {len(df_filtered)} rows")

    if df_filtered.empty:
        print(f"  ❌ No rows passed mass filters!")
        continue

    # Check pattern conditions on filtered data
    print(f"\n  🔍 Checking pattern conditions on {len(df_filtered)} rows...")

    # Test D3 pattern (simplest one)
    mask = (
        ((df_filtered['prev_high'] / df_filtered['prev_close_1'] - 1) >= 0.2) &
        (df_filtered['prev_gap'] >= 0.2) &
        (df_filtered['prev_gap_2'] >= 0.2) &
        (df_filtered['prev_range'] > df_filtered['prev_range_2']) &
        (df_filtered['dol_gap'] >= df_filtered['prev_range'] * 0.3) &
        (df_filtered['prev_volume_2'] >= scanner.mass_params['prev_volume_min'])
    )

    matches = df_filtered[mask]
    print(f"  📊 D3 Pattern: {len(matches)} matches")

    if not matches.empty:
        print(f"  ✅ Found D3 signals!")
        for idx, row in matches.iterrows():
            print(f"    - {row['Date']}: prev_high gain = {(row['prev_high'] / row['prev_close_1'] - 1):.2%}")
    else:
        print(f"  ❌ No D3 matches")
        # Show why no matches
        if len(df_filtered) > 0:
            test_row = df_filtered.iloc[0]
            print(f"\n  🔬 Debugging first row:")
            gain = (test_row['prev_high'] / test_row['prev_close_1'] - 1)
            print(f"    prev_high/prev_close_1 - 1 = {gain:.4f} (need >= 0.2)")
            print(f"    prev_gap = {test_row['prev_gap']:.4f} (need >= 0.2)")
            print(f"    prev_gap_2 = {test_row.get('prev_gap_2', 'N/A')} (need >= 0.2)")
            print(f"    prev_range > prev_range_2 = {test_row['prev_range']:.2f} > {test_row.get('prev_range_2', 'N/A')}")
            print(f"    dol_gap >= prev_range*0.3 = {test_row['dol_gap']:.2f} >= {test_row['prev_range']*0.3:.2f}")

print("\n" + "="*80)
print("DEBUG COMPLETE")
print("="*80)
