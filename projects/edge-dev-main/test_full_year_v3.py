#!/usr/bin/env python3
"""
Full year 2025 test using reference template (V3)
Expected: ~60 signals
"""

import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")

from backside_b_AI_FORMATTED_V3 import GroupedEndpointBacksideBScanner

scanner = GroupedEndpointBacksideBScanner(
    d0_start="2025-01-01",
    d0_end="2025-12-31"
)

print("\n" + "="*70)
print("FULL YEAR 2025 TEST - V3 (Reference Template)")
print("Expected: ~60 signals")
print("="*70 + "\n")

import time
start = time.time()
results = scanner.execute()
elapsed = time.time() - start

print(f"\nExecution time: {elapsed:.1f} seconds ({elapsed/60:.1f} minutes)")
print(f"Signals found: {len(results)}")
print(f"Expected: ~60 signals")

if len(results) > 0:
    print(f"\nFirst 10 signals:")
    print(results.head(10)[['Ticker', 'Date', 'Gap/ATR', 'D1Vol/Avg']].to_string())

    # Save results
    results.to_csv('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/v3_full_year_results.csv', index=False)
    print(f"\n✅ Results saved to: v3_full_year_results.csv")
else:
    print("\n❌ No signals found (expected ~60)")

print("="*70)
