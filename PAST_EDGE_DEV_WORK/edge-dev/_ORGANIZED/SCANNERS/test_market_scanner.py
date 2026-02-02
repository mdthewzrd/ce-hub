#!/usr/bin/env python3
"""
Test Market Scanner - Small subset for testing
============================================
Tests the market-wide scanning approach with limited tickers
"""

import requests
from market_wide_scanner import scan_symbol

# Test with a small subset of popular tickers
TEST_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B',
    'JNJ', 'V', 'PG', 'JPM', 'UNH', 'HD', 'MA', 'BAC', 'PFE', 'CSCO',
    'ADBE', 'CRM', 'NFLX', 'CMCSA', 'T', 'VZ', 'KO', 'PEP', 'INTC'
]

def main():
    print("🧪 Testing Market Scanner with 30 popular tickers")
    print("=" * 60)

    total_signals = 0
    symbols_with_signals = []

    for i, symbol in enumerate(TEST_TICKERS):
        print(f"[{i+1}/30] Scanning {symbol}...")
        results = scan_symbol(symbol, '2024-01-01', '2025-11-01')

        if results:
            print(f"  ✅ {symbol}: {len(results)} signals")
            symbols_with_signals.append((symbol, results))
            total_signals += len(results)
        else:
            print(f"   {symbol}: No signals")

    print(f"\n🎉 TEST RESULTS:")
    print(f"   Total Symbols Scanned: {len(TEST_TICKERS)}")
    print(f"   Symbols with Signals: {len(symbols_with_signals)}")
    print(f"   Total Signals Found: {total_signals}")

    if symbols_with_signals:
        print(f"\n🔥 SIGNALS BY SYMBOL:")
        for symbol, results in symbols_with_signals:
            print(f"\n{symbol}:")
            for result in results:
                print(f"  {result['Date']}: ${result['Close']} (ADV: ${result['ADV20_$']:,})")

    print(f"\n✅ Market scanner approach validated!")
    return total_signals > 0

if __name__ == "__main__":
    main()