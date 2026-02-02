#!/usr/bin/env python3
"""
Test runner for AI-formatted V3 Backside B scanner
Testing for full year 2025 to validate ~60 signals
"""

import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")

# Import the AI-formatted V3 scanner
from backside_b_AI_FORMATTED_V2 import BacksideBMessy

# Create scanner instance for full year 2025
scanner = BacksideBMessy(
    api_key="Fm7brz4s23eSocDErnL68cE7wspz2K1I",
    d0_start="2025-01-01",
    d0_end="2025-12-31"
)

# Run scan
print("\n" + "="*70)
print("Testing AI-FORMATTED V3 SCANNER (Full Year 2025)")
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
        print(f"Expected: ~60 signals")
        print(f"\nSignal distribution by month:")
        df['month'] = pd.to_datetime(df['date']).dt.month
        print(df.groupby('month').size())

        print(f"\nFirst 10 signals:")
        print(df.head(10)[['ticker', 'date', 'close', 'volume']].to_string())

        # Save results
        df.to_csv('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/ai_v3_results_2025.csv', index=False)
        print(f"\n✅ Results saved to: ai_v3_results_2025.csv")
    else:
        print("\n❌ No signals found (expected ~60)")
else:
    print(f"\nResults type: {type(results)}")
    if results and len(results) > 0:
        df = pd.DataFrame(results)
        print(f"\n✅ Found {len(results)} signals in {elapsed_time:.1f} seconds")
        print(f"Expected: ~60 signals")
    else:
        print("\n❌ No signals found (expected ~60)")

print(f"\nExecution time: {elapsed_time:.1f} seconds")
print("="*70)
