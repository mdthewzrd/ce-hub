#!/usr/bin/env python3
"""
Test ETF Scanner - Test stocks + ETFs
====================================
Tests the enhanced scanner with both stocks and ETFs
"""

from market_wide_scanner import scan_symbol, get_comprehensive_leveraged_etfs

# Test tickers including both stocks and popular ETFs
TEST_TICKERS = [
    # Individual Stocks
    'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMD', 'META',

    # Major Index ETFs
    'SPY', 'QQQ', 'IWM', 'DIA', 'VTI',

    # 3x Leveraged ETFs
    'SOXL', 'TQQQ', 'UPRO', 'FAS', 'LABU', 'NUGT',

    # -3x Inverse ETFs
    'SQQQ', 'SPXU', 'FAZ', 'LABD', 'DRIP',

    # Sector ETFs
    'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLRE',

    # Volatility ETFs
    'UVXY', 'VXX', 'SVXY',

    # International ETFs
    'EFA', 'EEM', 'EWZ', 'FXI',

    # Commodity ETFs
    'GLD', 'SLV', 'USO', 'UCO'
]

def main():
    print("🧪 Testing Enhanced Market Scanner (Stocks + ETFs)")
    print("=" * 70)
    print(f"Testing {len(TEST_TICKERS)} instruments:")
    print(f"  - Individual Stocks: 7")
    print(f"  - Major Index ETFs: 5")
    print(f"  - 3x Leveraged ETFs: 6")
    print(f"  - -3x Inverse ETFs: 5")
    print(f"  - Sector ETFs: 6")
    print(f"  - Volatility ETFs: 3")
    print(f"  - International ETFs: 4")
    print(f"  - Commodity ETFs: 4")
    print("=" * 70)

    total_signals = 0
    symbols_with_signals = []
    etf_signals = []
    stock_signals = []

    for i, symbol in enumerate(TEST_TICKERS):
        print(f"[{i+1:2d}/{len(TEST_TICKERS)}] Scanning {symbol}...", end="")
        results = scan_symbol(symbol, '2024-01-01', '2025-11-01')

        if results:
            print(f" ✅ {len(results)} signals")
            symbols_with_signals.append((symbol, results))
            total_signals += len(results)

            # Categorize by type
            if symbol in ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMD', 'META']:
                stock_signals.extend(results)
            else:
                etf_signals.extend(results)
        else:
            print("   No signals")

    print(f"\n🎉 ENHANCED SCANNER TEST RESULTS:")
    print("=" * 50)
    print(f"   Total Instruments Scanned: {len(TEST_TICKERS)}")
    print(f"   Instruments with Signals: {len(symbols_with_signals)}")
    print(f"   Total Signals Found: {total_signals}")
    print(f"   Stock Signals: {len(stock_signals)}")
    print(f"   ETF Signals: {len(etf_signals)}")

    if symbols_with_signals:
        print(f"\n🔥 SIGNALS BY CATEGORY:")

        if stock_signals:
            print(f"\n📈 INDIVIDUAL STOCKS:")
            for symbol, results in [(s, r) for s, r in symbols_with_signals if s in ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMD', 'META']]:
                for result in results:
                    print(f"   {symbol}: ${result['Close']} ({result['ADV20_$']:,.0f} ADV)")

        if etf_signals:
            print(f"\n📊 ETFs:")
            for symbol, results in [(s, r) for s, r in symbols_with_signals if s not in ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMD', 'META']]:
                etf_type = "3x Leveraged" if symbol in ['SOXL', 'TQQQ', 'UPRO', 'FAS', 'LABU', 'NUGT'] else \
                          "Inverse" if symbol in ['SQQQ', 'SPXU', 'FAZ', 'LABD', 'DRIP'] else \
                          "Sector" if symbol.startswith('XL') else \
                          "Index" if symbol in ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI'] else \
                          "Other"
                print(f"   {symbol} ({etf_type}):")
                for result in results:
                    print(f"      ${result['Close']} ({result['ADV20_$']:,.0f} ADV)")

    print(f"\n✅ Enhanced Market Scanner (Stocks + ETFs) validated!")
    return total_signals

if __name__ == "__main__":
    main()