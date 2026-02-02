#!/usr/bin/env python3
"""
Quick test for AI-formatted V3 Backside B scanner
Testing for January 2025 only to validate ~5 signals (1/12 of yearly ~60)
"""

import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")

# Import the AI-formatted V3 scanner
from backside_b_AI_FORMATTED_V2 import BacksideBMessy

# Create scanner instance for January 2025 only
scanner = BacksideBMessy(
    api_key="Fm7brz4s23eSocDErnL68cE7wspz2K1I",
    d0_start="2025-01-01",
    d0_end="2025-01-31"
)

# Run scan
print("\n" + "="*70)
print("Testing AI-FORMATTED V3 SCANNER (January 2025)")
print("="*70 + "\n")

import time
start_time = time.time()

results = scanner.run_scan()

elapsed_time = time.time() - start_time

# Output results
import pandas as pd

if isinstance(results, pd.DataFrame):
    df = results
    if not df.empty:
        print(f"\n✅ Found {len(df)} signals in {elapsed_time:.1f} seconds")
        print(f"Expected: ~5 signals (1/12 of yearly ~60)")

        print(f"\nFirst 10 signals:")
        print(df.head(10)[['Ticker', 'Date', 'Gap/ATR', 'D1Vol/Avg']].to_string())

        # Save results
        df.to_csv('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/ai_v3_results_january.csv', index=False)
        print(f"\n✅ Results saved to: ai_v3_results_january.csv")
    else:
        print("\n❌ No signals found (expected ~5)")
else:
    print(f"\nResults type: {type(results)}")
    if results and len(results) > 0:
        df = pd.DataFrame(results)
        print(f"\n✅ Found {len(results)} signals in {elapsed_time:.1f} seconds")
        print(f"Expected: ~5 signals (1/12 of yearly ~60)")
    else:
        print("\n❌ No signals found (expected ~5)")

print(f"\nExecution time: {elapsed_time:.1f} seconds")
print("="*70)
