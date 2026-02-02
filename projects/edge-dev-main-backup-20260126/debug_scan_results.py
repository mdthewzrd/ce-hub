#!/usr/bin/env python3
"""
Debug the scanner to see why it's only returning 2 results
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Test the scanner that was uploaded
from datetime import datetime, timedelta
import pandas as pd

print("=== DEBUGGING BACKSIDE B SCANNER ===")

# Check what parameters are being used
print("\n1. Testing your uploaded scanner parameters...")

# Read the uploaded scanner file
scanner_path = "/Users/michaeldurante/Downloads/backside_para_b_copy_scanner (4).py"
try:
    with open(scanner_path, 'r') as f:
        content = f.read()

    print(f"✅ File found: {len(content)} characters")

    # Check for key components
    if "FormattedBacksideParaBScanner" in content:
        print("✅ Correct class name found")
    else:
        print("❌ Missing correct class name")

    if "from datetime import datetime, timedelta" in content:
        print("✅ Correct datetime import found")
    else:
        print("❌ Missing timedelta import")

    # Extract parameters
    params_start = content.find("self.backside_params = {")
    if params_start != -1:
        params_section = content[params_start:content.find("}", params_start)+1]
        print(f"\n📋 Scanner Parameters:")
        print(params_section)

    # Test basic functionality
    exec(content.replace('if __name__ == "__main__":', 'if False:'))

    # Create scanner instance
    scanner = locals().get('FormattedBacksideParaBScanner')()

    print(f"\n🔧 Scanner Configuration:")
    print(f"  Scan Start: {scanner.scan_start}")
    print(f"  Scan End: {scanner.scan_end}")
    print(f"  Smart Start: {scanner.smart_start}")
    print(f"  Smart End: {scanner.smart_end}")

    # Test with a small subset first
    print(f"\n🧪 Testing with small symbol subset...")
    test_symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL']

    for symbol in test_symbols:
        try:
            print(f"  Testing {symbol}...")
            df = scanner.fetch_daily_data(symbol, "2025-01-01", "2025-12-18")
            if not df.empty:
                print(f"    ✅ {symbol}: {len(df)} days of data")
                results = scanner.scan_symbol_original_logic(symbol, "2025-01-01", "2025-12-18")
                if not results.empty:
                    print(f"    🎯 {symbol}: {len(results)} SIGNALS FOUND")
                    print(f"     Latest: {results['Date'].iloc[-1]}")
                else:
                    print(f"    ❌ {symbol}: No signals")
            else:
                print(f"    ❌ {symbol}: No data")
        except Exception as e:
            print(f"    ❌ {symbol}: Error - {e}")

except Exception as e:
    print(f"❌ Error debugging scanner: {e}")
    import traceback
    traceback.print_exc()

print(f"\n=== DEBUG COMPLETE ===")