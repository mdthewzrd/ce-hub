#!/usr/bin/env python3
"""
Test runner for AI-formatted V2 Backside B scanner
Fixed with historical data calculation
"""

import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")

# Import the AI-formatted V2 scanner
from backside_b_AI_FORMATTED_V2 import BacksideBMessy

# Create scanner instance with same date as reference
scanner = BacksideBMessy(
    d0_start="2025-01-02",
    d0_end="2025-01-02"
)

# Run scan
print("\n" + "="*70)
print("Testing AI-FORMATTED V2 SCANNER (Fixed)")
print("="*70 + "\n")

results = scanner.run_scan()

# Output results
import pandas as pd

if isinstance(results, pd.DataFrame):
    df = results
    if not df.empty:
        print(f"\n✅ Found {len(df)} signals:")
        for col in df.columns:
            print(f"  {col}")
        print("\nFirst 5 signals:")
        print(df.head().to_string())
    else:
        print("\nNo signals found")
elif results and len(results) > 0:
    df = pd.DataFrame(results)
    print(f"\n✅ Found {len(results)} signals:")
    for col in df.columns:
        print(f"  {col}")
    print("\nFirst 5 signals:")
    print(df.head().to_string())
else:
    print("\nNo signals found")

print("\n" + "="*70)
print("Test complete")
print("="*70)
