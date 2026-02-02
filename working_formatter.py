#!/usr/bin/env python3
"""
Working Trading Code Formatter
Simple, robust approach that works reliably
"""

import re
import ast
import sys

def create_universe_enhancement():
    """Create the universe enhancement code with dynamic smart filtering"""
    return '''
# === UNIVERSAL MARKET COVERAGE WITH DYNAMIC SMART FILTERING ===
import aiohttp
import asyncio
from typing import List, Dict
from datetime import datetime, timedelta
import json

def extract_scan_parameters() -> Dict:
    """Extract key parameters from the scan for dynamic filtering"""
    try:
        # Extract parameters from P dictionary if it exists
        price_min = 8.0
        adv_min = 30_000_000
        volume_min = 5_000_000

        # Try to extract from P dictionary (common pattern)
        import re
        content = open(__file__).read()

        # Extract price_min
        price_match = re.search(r'"price_min"\s*:\s*([\d.]+)', content)
        if price_match:
            price_min = float(price_match.group(1))

        # Extract adv20_min_usd
        adv_match = re.search(r'"adv20_min_usd"\s*:\s*([\d_]+)', content)
        if adv_match:
            adv_min = int(adv_match.group(1).replace('_', ''))

        # Extract d1_volume_min if exists
        vol_match = re.search(r'"d1_volume_min"\s*:\s*([\d_]+)', content)
        if vol_match:
            volume_min = int(vol_match.group(1).replace('_', ''))

        return {
            "price_min": price_min * 0.1,   # Use 10% of scan min as filter (much more relaxed)
            "adv_min": adv_min * 0.05,      # Use 5% of scan ADV as filter (much more relaxed)
            "volume_min": volume_min * 0.05 # Use 5% of volume min as filter (much more relaxed)
        }
    except:
        # Fallback conservative defaults (very relaxed)
        return {
            "price_min": 1.0,          # Much more relaxed
            "adv_min": 1_000_000,      # Much more relaxed
            "volume_min": 500_000      # Much more relaxed
        }

async def fetch_filtered_market_universe() -> List[str]:
    """Fetch market tickers with dynamic smart filtering based on scan parameters"""
    API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
    params = extract_scan_parameters()

    print(f"🎯 Dynamic filter params: ${params['price_min']:.2f} min price, ${params['adv_min']:,} min ADV, {params['volume_min']:,} min volume")

    all_tickers = {}

    # Get recent trading days for filtering
    end_date = datetime.now()
    dates = []
    for i in range(5):
        date = end_date - timedelta(days=i)
        if date.weekday() < 5:  # Weekdays only
            dates.append(date.strftime("%Y-%m-%d"))
        if len(dates) >= 3:
            break

    print(f"🔍 Fetching market universe for dates: {dates}")

    async with aiohttp.ClientSession() as session:
        tasks = []
        for date in dates:
            # Use locale/us to exclude most OTC/pink sheets
            url = "https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/" + date + f"?adjusted=true&apiKey={API_KEY}"
            tasks.append(session.get(url))

        responses = await asyncio.gather(*tasks)

        for response in responses:
            if response.status == 200:
                data = await response.json()
                for ticker_data in data.get("results", []):
                    ticker = ticker_data.get("T")
                    if not ticker:
                        continue

                    # Basic quality filters (price > $0 to exclude invalid data)
                    close_price = ticker_data.get("c", 0)
                    volume = ticker_data.get("v", 0)

                    if close_price <= 0:
                        continue

                    # Estimated ADV (very rough estimate)
                    estimated_adv = volume * 250

                    # Apply dynamic filters - be less strict than the actual scan
                    if (close_price >= params["price_min"] and
                        volume >= params["volume_min"] and
                        estimated_adv >= params["adv_min"]):

                        # Store with quality score for ranking
                        quality_score = close_price * (volume / 1_000_000)
                        all_tickers[ticker] = {
                            "price": close_price,
                            "volume": volume,
                            "adv_est": estimated_adv,
                            "quality_score": quality_score
                        }

    # Sort by quality score and take top tickers (but cap at reasonable number)
    sorted_tickers = sorted(all_tickers.items(), key=lambda x: x[1]["quality_score"], reverse=True)

    # Take top quality tickers, but ensure we have enough for good scan coverage
    max_tickers = min(3000, max(1500, len(sorted_tickers)))  # 1500-3000 range

    final_tickers = [ticker for ticker, _ in sorted_tickers[:max_tickers]]

    print(f"📊 Smart filtering result: {len(final_tickers)} quality tickers (reduced from ~{len(all_tickers):,} total)")
    if final_tickers:
        print(f"🎯 Price range: ${all_tickers[final_tickers[0]]['price']:.2f} - ${all_tickers[final_tickers[-1]]['price']:.2f}")

    return final_tickers

# Enhanced symbol getter with smart filtering
def get_enhanced_symbols():
    """Get dynamically filtered market universe"""
    return asyncio.run(fetch_filtered_market_universe())

'''

def enhance_trading_code(file_path: str):
    """Enhance trading code with universal market coverage"""

    print(f"🔧 Analyzing: {file_path}")

    with open(file_path, 'r') as f:
        original_code = f.read()

    # Analyze current state
    analysis = {
        'has_aiohttp': 'aiohttp' in original_code,
        'has_asyncio': 'asyncio' in original_code,
        'has_universe': 'grouped/locale/us/market' in original_code,
        'symbols_found': bool(re.search(r'(SYMBOLS|symbols)\s*=\s*\[', original_code)),
        'api_key_correct': 'Fm7brz4s23eSocDErnL68cE7wspz2K1I' in original_code
    }

    print("📊 Current Analysis:")
    for key, value in analysis.items():
        status = "✅" if value else "❌"
        print(f"  {key.replace('_', ' ').title()}: {status}")

    # Create enhanced code
    enhanced_code = original_code
    changes = []

    # 1. Add missing imports at the top
    imports_needed = []
    if not analysis['has_aiohttp']:
        imports_needed.append('import aiohttp')
    if not analysis['has_asyncio']:
        imports_needed.append('import asyncio')

    if imports_needed:
        # Find insertion point after existing imports
        lines = enhanced_code.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if not line.strip() or line.strip().startswith(('import ', 'from ')):
                insert_idx = i
            else:
                break

        import_block = [''] + ['# Enhanced imports for universal market coverage'] + imports_needed + ['']
        lines = lines[:insert_idx + 1] + import_block + lines[insert_idx + 1:]
        enhanced_code = '\n'.join(lines)
        changes.append("Added missing imports")

    # 2. Add universe enhancement functions before symbols list
    if not analysis['has_universe'] and analysis['symbols_found']:
        # Find where to insert the universe functions (before SYMBOLS definition)
        symbols_match = re.search(r'(SYMBOLS|symbols)\s*=', enhanced_code)
        if symbols_match:
            insert_pos = symbols_match.start()
            universe_code = create_universe_enhancement()
            enhanced_code = enhanced_code[:insert_pos] + universe_code + enhanced_code[insert_pos:]
            changes.append("Added universal market coverage functions before symbols list")

    # 3. Ensure correct API key
    if not analysis['api_key_correct']:
        enhanced_code = re.sub(
            r'API_KEY\s*=\s*[\'"][^\'\"]*[\'"]',
            'API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"  # Your high-rate key',
            enhanced_code
        )
        changes.append("Updated to high-rate API key")

    # 4. Automatically replace hardcoded symbols with universal coverage
    if analysis['symbols_found'] and not analysis['has_universe']:
        # Replace SYMBOLS = [...] with SYMBOLS = get_enhanced_symbols()
        enhanced_code = re.sub(
            r'(SYMBOLS|symbols)\s*=\s*\[.*?\](?=\s*$|\s*#|;\s*$|\n)',
            r'\1 = get_enhanced_symbols()  # Universal market coverage (replaced hardcoded list)',
            enhanced_code,
            flags=re.DOTALL
        )
        changes.append("Automatically replaced hardcoded symbols with universal coverage")

    # Validate syntax
    try:
        ast.parse(enhanced_code)
        syntax_valid = True
        print("🧪 Syntax validation: ✅ PASSED")
    except SyntaxError as e:
        syntax_valid = False
        print(f"🧪 Syntax validation: ❌ FAILED - {e}")

    # Save enhanced code
    output_path = file_path.replace('.py', '_enhanced.py')
    with open(output_path, 'w') as f:
        f.write(enhanced_code)

    print(f"\n💾 Enhanced code saved to: {output_path}")
    print(f"📋 Changes made: {', '.join(changes)}")

    if syntax_valid:
        print("\n🎉 SUCCESS! Code is ready for terminal execution.")
        print("\n📝 Next Steps:")
        print("1. Review the enhanced file")
        print("2. Follow the instructions to replace hardcoded symbols")
        print("3. Run in terminal: python enhanced_file.py")
        return True
    else:
        print("\n❌ FAILED - Syntax errors need to be fixed")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python working_formatter.py <trading_code.py>")
        sys.exit(1)

    file_path = sys.argv[1]
    success = enhance_trading_code(file_path)

    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()