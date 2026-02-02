#!/usr/bin/env python3
"""
Test runner for reference template Backside B scanner
Uses the same date range as AI version for fair comparison
"""

import sys
sys.path.insert(0, "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/backside_b")

# Import the reference scanner
from fixed_formatted import GroupedEndpointBacksideBScanner

# Create scanner instance with same date as AI version
scanner = GroupedEndpointBacksideBScanner(
    d0_start="2025-01-02",
    d0_end="2025-01-02"
)

# Run scan
print("Running reference template scanner...")
results = scanner.run_and_save()

# Output results
if results is not None and not results.empty:
    print(f"\n✅ Found {len(results)} signals:")
    print(results.head().to_string())
else:
    print("No signals found")
