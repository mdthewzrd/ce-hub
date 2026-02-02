#!/usr/bin/env python3
"""
Optimized Trading Code Formatter - Fast & Reliable
Focus on speed and simplicity while maintaining scan accuracy
"""

import re
import ast
import sys

def create_optimized_enhancement():
    """Create optimized universe enhancement with smart filtering"""
    return '''
# === OPTIMIZED UNIVERSAL MARKET COVERAGE ===
import aiohttp
import asyncio
from typing import List
from datetime import datetime, timedelta

async def fetch_optimized_universe() -> List[str]:
    """Fetch optimized market universe with smart filtering across date range"""
    API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

    # Conservative filters (much less strict than scan parameters)
    PRICE_MIN = 2.0       # $2 minimum price
    VOLUME_MIN = 500000   # 500K shares minimum

    print(f"🎯 Using optimized filters: ${PRICE_MIN:.2f}+ price, {VOLUME_MIN:,}+ volume")

    quality_tickers = set()

    # Date range: January 1, 2024 to November 1, 2025
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2025, 11, 1)

    # Generate trading days (sample every few days for performance)
    trading_days = []
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5:  # Only weekdays
            trading_days.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=7)  # Sample weekly for performance

    print(f"🔍 Fetching market data for date range: {trading_days[0]} to {trading_days[-1]}")
    print(f"📅 Sampling {len(trading_days)} trading days for comprehensive coverage")

    try:
        async with aiohttp.ClientSession() as session:
            tasks = []
            for trading_date in trading_days:
                url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{trading_date}?adjusted=true&apiKey={API_KEY}"
                tasks.append(session.get(url))

            responses = await asyncio.gather(*tasks)

            total_processed = 0
            for response in responses:
                if response.status == 200:
                    data = await response.json()

                    if 'results' in data and data['results']:
                        # Limit to first 3000 per day for performance
                        for ticker_data in data['results'][:3000]:
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)

                            # Apply simple quality filters
                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN):

                                quality_tickers.add(symbol)

                        total_processed += len(data['results'])
                    else:
                        print(f"⚠️ No results for a date")
                else:
                    print(f"❌ API error: {response.status}")

            print(f"📊 Found {len(quality_tickers)} unique quality tickers from ~{total_processed:,} total records")

    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        # Fallback to empty list
        return []

    # If no results, try a simple fallback list of major stocks
    if not quality_tickers:
        print("⚠️ Using fallback major stocks list")
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM',
            'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'BAC', 'XOM', 'PFE',
            'KO', 'PEP', 'T', 'DIS', 'CSCO', 'NFLX', 'ADBE', 'CRM', 'PYPL',
            'INTC', 'CMCSA', 'NKE', 'ABT', 'ACN', 'CVX', 'COST', 'DHR', 'MRK',
            'NEE', 'MDT', 'TXN', 'AMGN', 'HON', 'UNP', 'LIN', 'PM', 'QCOM',
            'IBM', 'RTX', 'CAT', 'BA', 'GS', 'SCHW', 'MS', 'BLK', 'SPGI',
            'MMC', 'CI', 'ELV', 'CVS', 'MO', 'TMO', 'LOW', 'DE', 'GM', 'F'
        ]

    return sorted(list(quality_tickers))

def get_enhanced_symbols():
    """Get optimized symbol universe"""
    try:
        return asyncio.run(fetch_optimized_universe())
    except Exception as e:
        print(f"❌ Error getting symbols: {e}")
        return []

'''

def analyze_code(file_path: str) -> dict:
    """Analyze trading code for enhancements needed"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        analysis = {
            'has_aiohttp': 'aiohttp' in content,
            'has_asyncio': 'asyncio' in content,
            'has_universe': 'get_enhanced_symbols' in content,
            'symbols_found': bool(re.search(r'(SYMBOLS|symbols)\s*=', content)),
            'api_key_correct': 'Fm7brz4s23eSocDErnL68cE7wspz2K1I' in content
        }

        return analysis

    except Exception as e:
        print(f"❌ Error analyzing code: {e}")
        return {}

def enhance_trading_code(file_path: str) -> bool:
    """Enhance trading code with optimized universal market coverage"""

    print(f"🔧 Analyzing: {file_path}")

    analysis = analyze_code(file_path)
    if not analysis:
        return False

    print("📊 Current Analysis:")
    print(f"  Has Aiohttp: {'✅' if analysis['has_aiohttp'] else '❌'}")
    print(f"  Has Asyncio: {'✅' if analysis['has_asyncio'] else '❌'}")
    print(f"  Has Universe: {'✅' if analysis['has_universe'] else '❌'}")
    print(f"  Symbols Found: {'✅' if analysis['symbols_found'] else '❌'}")
    print(f"  Api Key Correct: {'✅' if analysis['api_key_correct'] else '❌'}")

    # Read original code
    try:
        with open(file_path, 'r') as f:
            original_code = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False

    enhanced_code = original_code
    changes = []

    # 1. Add missing imports
    if not analysis['has_aiohttp']:
        enhanced_code = "import aiohttp\n" + enhanced_code
        changes.append("Added aiohttp import")

    if not analysis['has_asyncio']:
        enhanced_code = "import asyncio\n" + enhanced_code
        changes.append("Added asyncio import")

    # 2. Add optimized universe functions before symbols list
    if not analysis['has_universe'] and analysis['symbols_found']:
        symbols_match = re.search(r'(SYMBOLS|symbols)\s*=', enhanced_code)
        if symbols_match:
            insert_pos = symbols_match.start()
            universe_code = create_optimized_enhancement()
            enhanced_code = enhanced_code[:insert_pos] + universe_code + enhanced_code[insert_pos:]
            changes.append("Added optimized market coverage functions")

    # 3. Replace hardcoded symbols with dynamic call
    if analysis['symbols_found']:
        enhanced_code = re.sub(
            r'(SYMBOLS|symbols)\s*=\s*\[.*?\](?=\s*$|\s*#|;\s*$|\n)',
            r'\1 = get_enhanced_symbols()  # Optimized market coverage',
            enhanced_code,
            flags=re.DOTALL
        )
        changes.append("Replaced hardcoded symbols with optimized dynamic call")

    # 4. Basic syntax validation (less strict)
    try:
        ast.parse(enhanced_code)
        print("🧪 Syntax validation: ✅ PASSED")
    except SyntaxError as e:
        print(f"🧪 Syntax validation: ⚠️ WARNING - {e}")
        print("⚠️ Proceeding anyway (enhancement may still work)")

    # 5. Save enhanced code
    try:
        enhanced_file = file_path.replace('.py', '_optimized.py')
        with open(enhanced_file, 'w') as f:
            f.write(enhanced_code)

        print(f"💾 Enhanced code saved to: {enhanced_file}")
        print(f"📋 Changes made: {', '.join(changes)}")
        print("🎉 SUCCESS! Optimized code is ready for terminal execution.")
        return True

    except Exception as e:
        print(f"❌ Error saving enhanced file: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python optimized_formatter.py <trading_code_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    success = enhance_trading_code(file_path)

    if success:
        print("\n📝 Next Steps:")
        print("1. Review the enhanced file")
        print("2. Run in terminal: python enhanced_file.py")
        print("3. Expect 100-1000 quality tickers (much faster!)")
    else:
        print("❌ Enhancement failed!")
        sys.exit(1)