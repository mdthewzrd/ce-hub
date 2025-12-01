#!/usr/bin/env python3
"""
Simple test of backside scanner execution through Python Executor Service
"""

import sys
import json
from services.pythonExecutorService import pythonExecutorService

def test_backside_scanner():
    """Test backside scanner directly with Python executor"""

    # Read the backside scanner code
    with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
        backside_code = f.read()

    print("🚀 Testing Backside Scanner Direct Execution")
    print(f"📊 Code length: {len(backside_code)} characters")
    print(f"📅 Date range: 2025-01-01 to 2025-11-01")
    print(f"🔑 API Key: Fm7brz4s23eSocDErnL68cE7wspz2K1I")
    print()

    # Prepare execution request
    execution_request = {
        "code": backside_code,
        "start_date": "2025-01-01",
        "end_date": "2025-11-01",
        "scanner_type": "custom",
        "api_key": "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        "symbols": [],  # Will use market-wide scanning
        "parameters": {
            "price_min": 8.0,
            "adv20_min_usd": 30000000,
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "gap_div_atr_min": 0.75,
            "d1_volume_min": 15000000
        }
    }

    try:
        print("🔥 Starting direct Python execution...")
        print("⚡ Using market-wide scanning with full coverage...")
        print()

        # Execute the scanner
        result = pythonExecutorService.executeScanner(execution_request)

        print(f"✅ Execution completed!")
        print(f"📈 Success: {result['success']}")

        if result['success']:
            signals = result.get('results', [])
            print(f"🎯 Signals found: {len(signals)}")
            print(f"⏱️ Execution time: {result.get('execution_time', 0):.2f} seconds")
            print(f"🔑 Execution ID: {result.get('execution_id', 'unknown')}")

            if signals:
                print(f"\n📊 First 5 trading signals:")
                for i, signal in enumerate(signals[:5]):
                    print(f"  {i+1}. {signal.get('ticker', 'N/A')} - {signal.get('date', 'N/A')} - Gap/ATR: {signal.get('gap_atr', 0):.2f}")

                if len(signals) >= 8:
                    print(f"✅ SUCCESS: Found {len(signals)} signals (8+ as requested!)")
                else:
                    print(f"⚠️  Found {len(signals)} signals (expected 8+)")
            else:
                print("❌ No signals found")
        else:
            print(f"❌ Execution failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backside_scanner()