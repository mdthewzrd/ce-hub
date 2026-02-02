"""
Test feature calculation for SC DMR scanner
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates')

from sc_dmr.formatted import UltraFastRenataSCDMRMultiScanner
import pandas as pd

print("="*80)
print("TESTING FEATURE CALCULATIONS")
print("="*80)

# Create scanner
scanner = UltraFastRenataSCDMRMultiScanner()

# Create sample data
sample_data = {
    't': [1704067200000, 1704153600000, 1704240000000, 1704326400000, 1704412800000],
    'o': [100.0, 102.0, 105.0, 103.0, 106.0],
    'h': [105.0, 108.0, 110.0, 107.0, 112.0],
    'l': [99.0, 101.0, 104.0, 102.0, 105.0],
    'c': [104.0, 107.0, 106.0, 105.0, 111.0],
    'v': [10000000, 12000000, 11000000, 13000000, 14000000],
    'n': [1000, 1200, 1100, 1300, 1400],
    'vw': [102.0, 105.0, 107.0, 104.0, 108.0]
}

df = pd.DataFrame(sample_data)
print(f"\n📊 Original data ({len(df)} rows):")
print(df[['o', 'h', 'l', 'c']])

# Calculate features
df_with_features = scanner._calculate_features(df)

print(f"\n📊 Data with features:")
print(f"Columns: {list(df_with_features.columns)}")

# Check key columns
print(f"\n✅ Checking key columns:")
key_columns = [
    'prev_high',
    'prev_high_1',
    'prev_high_2',
    'prev_low',
    'prev_open',
    'prev_open_2',
    'prev_close_raw',
    'prev_close_1',
    'prev_close_2',
    'prev_range',
    'prev_range_2',
    'prev_gap',
    'prev_gap_2',
    'pm_high',
    'dol_pmh_gap',
    'pct_pmh_gap',
    'dol_gap',
    'opening_range',
    'prev_close_range',
    'prev_volume',
]

for col in key_columns:
    if col in df_with_features.columns:
        print(f"  ✅ {col}")
    else:
        print(f"  ❌ {col} - MISSING!")

# Show a sample of calculated features
print(f"\n📊 Sample of calculated features (row 3, first row with complete data):")
row = df_with_features.iloc[3]
sample_features = {
    'prev_high': row.get('prev_high'),
    'prev_high_1': row.get('prev_high_1'),
    'prev_high_2': row.get('prev_high_2'),
    'prev_low': row.get('prev_low'),
    'prev_open': row.get('prev_open'),
    'prev_close_raw': row.get('prev_close_raw'),
    'prev_close_1': row.get('prev_close_1'),
    'prev_range': row.get('prev_range'),
    'prev_gap': row.get('prev_gap'),
    'pm_high': row.get('pm_high'),
    'dol_pmh_gap': row.get('dol_pmh_gap'),
    'pct_pmh_gap': row.get('pct_pmh_gap'),
    'dol_gap': row.get('dol_gap'),
    'opening_range': row.get('opening_range'),
    'prev_close_range': row.get('prev_close_range'),
}

for k, v in sample_features.items():
    if pd.notna(v):
        print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")
    else:
        print(f"  {k}: NaN")

print("\n" + "="*80)
