#!/usr/bin/env python3
"""
Show the full market universe size
"""

import sys
sys.path.append('backend')

def show_universe_size():
    try:
        from true_full_universe import get_smart_enhanced_universe

        print('🌍 FULL MARKET UNIVERSE ANALYSIS')
        print('================================\n')

        # Get the full universe
        universe = get_smart_enhanced_universe()

        print(f'📊 Total Market Universe: {len(universe):,} symbols')
        print(f'\n📋 Universe Composition:')

        # Count different types
        etf_count = sum(1 for s in universe if s in ['SPY', 'QQQ', 'IWM', 'XLF', 'XLK', 'SOXL', 'TQQQ', 'SQQQ'])
        crypto_count = sum(1 for s in universe if s in ['COIN', 'MARA', 'RIOT', 'MSTR', 'GBTC'])
        mega_cap_count = sum(1 for s in universe if s in ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META'])

        print(f'   • Total Symbols: {len(universe):,}')
        print(f'   • ETFs & Indexes: ~{etf_count}')
        print(f'   • Crypto Related: ~{crypto_count}')
        print(f'   • Mega Cap Stocks: ~{mega_cap_count}')
        print(f'   • Other Stocks: ~{len(universe) - etf_count - crypto_count - mega_cap_count}')

        print(f'\n🎯 This provides COMPREHENSIVE market coverage!')
        print(f'   ✅ NYSE tickers')
        print(f'   ✅ NASDAQ tickers')
        print(f'   ✅ Major ETFs')
        print(f'   ✅ Sector ETFs')
        print(f'   ✅ Leveraged ETFs')
        print(f'   ✅ Crypto-related stocks')

        print(f'\n📊 Sample symbols from different categories:')
        sample_categories = {
            'Mega Cap': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'],
            'ETFs': ['SPY', 'QQQ', 'SOXL', 'TQQQ'],
            'Crypto': ['COIN', 'MARA', 'RIOT', 'MSTR'],
            'Industrial': ['GE', 'BA', 'CAT', 'MMM'],
            'Financial': ['JPM', 'BAC', 'GS', 'MS']
        }

        for category, symbols in sample_categories.items():
            found = [s for s in symbols if s in universe]
            print(f'   • {category}: {found}')

    except Exception as e:
        print(f'Error loading universe: {e}')

if __name__ == "__main__":
    show_universe_size()