#!/usr/bin/env python3
"""
Quick test of the backside scanner to identify any remaining errors
"""

import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend')

try:
    print("🔧 Testing backside scanner import...")
    from standardized_backside_para_b_scanner import scan_symbol, SYMBOLS, SCANNER_CONFIG
    print("✅ Import successful!")

    print(f"📊 Scanner config: {SCANNER_CONFIG['name']}")
    print(f"📈 Symbols configured: {len(SYMBOLS)}")

    # Test with minimal date range to avoid API limits
    print("\n🧪 Testing scan execution with minimal data...")
    test_symbol = 'AAPL'
    start_date = "2024-01-01"
    end_date = "2024-01-31"  # Just one month for testing

    print(f"🔍 Scanning {test_symbol} from {start_date} to {end_date}...")
    results = scan_symbol(test_symbol, start_date, end_date)

    print(f"✅ Scan completed! Found {len(results)} results")

    if results:
        print("📊 Sample result:")
        print(f"  {results[0]}")
    else:
        print("ℹ️  No results found (this may be normal for the test period)")

except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Execution error: {e}")
    import traceback
    traceback.print_exc()