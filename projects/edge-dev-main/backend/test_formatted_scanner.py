#!/usr/bin/env python3
"""
Test script to run the formatted scanner directly
"""
import sys
import warnings
warnings.filterwarnings('ignore')

# Read the formatted scanner
with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/Lc_D2_Scan_Oct_25_New_Ideas_Project_scanner_FIXED_V2.py', 'r') as f:
    code = f.read()

# Execute the code to define the scanner class
namespace = {}
exec(code, namespace)

# Find the scanner class
ScannerClass = None
for name, obj in namespace.items():
    if isinstance(obj, type) and hasattr(obj, 'run_scan'):
        ScannerClass = obj
        break

if ScannerClass:
    print(f"Found scanner class: {ScannerClass.__name__}")

    # Create scanner instance with a larger date range for testing
    scanner = ScannerClass(d0_start="2024-01-01", d0_end="2024-12-31")

    print(f"\nTesting scanner with date range: 2024-01-01 to 2024-12-31")
    print(f"Scanner has {len(scanner.pattern_assignments)} patterns")
    for i, pattern in enumerate(scanner.pattern_assignments, 1):
        print(f"  {i}. {pattern['name']}")

    # Run the scan
    print("\nRunning scan...")
    try:
        results = scanner.run_scan(start_date="2024-01-01", end_date="2024-12-31")

        if not results.empty:
            print(f"\n✅ SUCCESS: Found {len(results)} signals")
            print("\nResults:")
            for idx, row in results.head(10).iterrows():
                print(f"  {row['Ticker']:6s} | {row['Date']} | {row['Scanner_Label']}")
        else:
            print("\n❌ NO SIGNALS FOUND")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("ERROR: Could not find scanner class")
