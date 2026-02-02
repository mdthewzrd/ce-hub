#!/usr/bin/env python3
"""
Quick validation test - just 1 week to verify the fix works
"""

import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main")

from backside_b_AI_FORMATTED_V3 import GroupedEndpointBacksideBScanner

scanner = GroupedEndpointBacksideBScanner(
    d0_start="2025-01-01",
    d0_end="2025-01-07"  # Just 1 week
)

print("\n" + "="*70)
print("QUICK VALIDATION TEST - V3 (Reference Template)")
print("="*70 + "\n")

import time
start = time.time()
results = scanner.execute()
elapsed = time.time() - start

print(f"\nExecution time: {elapsed:.1f} seconds")
print(f"Signals found: {len(results)}")
print("="*70)
