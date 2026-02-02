#!/usr/bin/env python3
"""
Test with more relaxed parameters to find signals
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from datetime import datetime, timedelta
import pandas as pd

print("=== TESTING WITH RELAXED PARAMETERS ===")

# Load the fixed scanner
scanner_path = "/Users/michaeldurante/Downloads/backside_para_b_copy_scanner (4).py"
with open(scanner_path, 'r') as f:
    content = f.read()

exec(content.replace('if __name__ == "__main__":', 'if False:'))

# Create scanner instance
scanner = locals().get('FormattedBacksideParaBScanner')()

print(f"\n📋 Original Parameters:")
for key, value in scanner.backside_params.items():
    print(f"  {key}: {value}")

# Temporarily relax parameters for testing
print(f"\n🔧 Testing with RELAXED parameters...")
original_params = scanner.backside_params.copy()

scanner.backside_params.update({
    "price_min": 1,                     # Lower: from 8 to 1
    "adv20_min_usd": 5,                 # Lower: from 30M to 5M
    "d1_volume_min": 1_000_000,         # Lower: from 15M to 1M
    "slope5d_min": 1,                   # Lower: from 3 to 1
    "gap_div_atr_min": 0.3,             # Lower: from 0.75 to 0.3
    "d1_green_atr_min": 0.1,            # Lower: from 0.3 to 0.1
    "high_ema9_mult": 0.5,              # Lower: from 1.05 to 0.5
    "atr_mult": 0.5,                    # Lower: from 0.9 to 0.5
    "vol_mult": 0.5,                    # Lower: from 0.9 to 0.5
})

print(f"\n📋 Relaxed Parameters:")
for key, value in scanner.backside_params.items():
    if original_params[key] != value:
        print(f"  {key}: {original_params[key]} → {value}")

# Test with more symbols
test_symbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMD', 'SPY', 'QQQ', 'PLTR', 'MSTR']

total_signals = 0
print(f"\n🧪 Testing relaxed parameters...")
for symbol in test_symbols:
    try:
        print(f"  Testing {symbol}...")
        results = scanner.scan_symbol_original_logic(symbol, "2025-01-01", "2025-12-18")
        if not results.empty:
            print(f"    🎯 {symbol}: {len(results)} SIGNALS")
            for _, row in results.iterrows():
                print(f"      {row['Date']}: Gap/ATR={row['Gap/ATR']:.2f}, Vol={row['D1Vol/Avg']:.1f}x")
            total_signals += len(results)
        else:
            print(f"    ❌ {symbol}: No signals")
    except Exception as e:
        print(f"    ❌ {symbol}: Error - {e}")

print(f"\n📊 Summary:")
print(f"  Total signals with relaxed parameters: {total_signals}")

if total_signals > 0:
    print(f"✅ Scanner works! The original parameters are just too restrictive for current market conditions.")
else:
    print(f"❌ Even with relaxed parameters, no signals found. There might be a data issue.")

print(f"\n=== TEST COMPLETE ===")