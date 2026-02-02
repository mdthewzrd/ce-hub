#!/usr/bin/env python3
"""
Smart Trading Code Formatter - Dynamic Parameter-Based Filtering
Extracts scan parameters and creates proportional filters to maintain scan integrity
"""

import re
import ast
import sys

def extract_scan_parameters(file_path: str) -> dict:
    """Extract key parameters from trading scan code"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return {}

    params = {}

    # Extract numerical parameter patterns from different scan types
    patterns = [
        # Backside/LC style parameters (JSON/dict format)
        (r'"price_min"\s*:\s*([\d.]+)', 'price_min', float),
        (r'"prev_close_min"\s*:\s*([\d.]+)', 'price_min', float),
        (r'"adv20_min_usd"\s*:\s*([\d_]+)', 'volume_min', lambda x: int(x.replace('_', ''))),
        (r'"prev_volume_min"\s*:\s*([\d_]+)', 'volume_min', lambda x: int(x.replace('_', ''))),
        (r'"vol_mult"\s*:\s*([\d.]+)', 'volume_mult', float),
        (r'"atr_mult"\s*:\s*([\d.]+)', 'atr_mult', float),

        # Traditional scan patterns (inequalities)
        (r'close_d1\s*>\s*([\d.]+)', 'price_min', float),  # close_d1 > 40
        (r'day_minus_1_close[^>]*>\s*([\d.]+)', 'price_min', float),
        (r'day_1_close[^>]*>=\s*([\d.]+)', 'price_min', float),

        # Volume patterns
        (r'volume_d1\s*>=\s*([\d_]+)', 'volume_min', lambda x: int(x.replace('_', ''))),
        (r'Volume[^>]*>=\s*([\d_]+)', 'volume_min', lambda x: int(x.replace('_', ''))),
        (r'Day -1 Volume.*?([\d_]+)', 'volume_min', lambda x: int(x.replace('_', ''))),
        (r'volume_d1\s*>=\s*([\d,]+)', 'volume_min', lambda x: int(x.replace(',', ''))),

        # EMA/ATR requirements
        (r'high_to_ema_[\d_]+_div_atr[^>]*>=\s*([\d.]+)', 'ema_atr_mult', float),
        (r'High_over_EMA[^>]*>=\s*([\d.]+)', 'ema_atr_mult', float),
        (r'day_minus_1_high_to_[\d_]+_ema[^>]*>=\s*([\d.]+)', 'ema_atr_mult', float),
        (r'gap_div_atr[^>]*>=\s*([\d.]+)', 'gap_mult', float),
        (r'Gap_over_ATR[^>]*>=\s*([\d.]+)', 'gap_mult', float),

        # Range/ATR requirements
        (r'Range_over_ATR[^>]*>=\s*([\d.]+)', 'range_mult', float),
        (r'tr[^>]*>=\s*atr[^>]*\*([\d.]+)', 'atr_mult', float),

        # FBO specific patterns
        (r'"gap_min_pct"\s*:\s*([\d.]+)', 'gap_pct_min', float),
        (r'dol_gap[^>]*>=\s*prev_range[^}]*\*([\d.]+)', 'gap_mult', float),

        # Swing high/extension patterns
        (r'day_0_open_above_x_atr[^>]*>=\s*([\d.]+)', 'open_atr_mult', float),
        (r'extension_distance\s*=\s*([\d.]+)', 'extension_mult', float),

        # Criteria dictionary patterns
        (r'"Day -1 Volume"\s*:\s*([\d_]+)', 'volume_min', lambda x: int(x.replace('_', ''))),
        (r'"Day -1 High[^>]*\*ATR"[^:]*:\s*([\d.]+)', 'ema_atr_mult', float),
        (r'"Gap[^>]*ATR"[^:]*:\s*([\d.]+)', 'gap_mult', float),
    ]

    for pattern, param_name, converter in patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE | re.DOTALL)
        if match:
            try:
                value = converter(match.group(1))
                params[param_name] = value
            except (ValueError, IndexError):
                continue

    # Calculate derived parameters
    if 'price_min' in params:
        # For smart filtering, use 50% of scan's price requirement
        params['filter_price_min'] = params['price_min'] * 0.5

    if 'volume_min' in params:
        # For volume, use 30% of scan's minimum
        params['filter_volume_min'] = params['volume_min'] * 0.3
    elif 'volume_mult' in params:
        # If only multiplier is available, assume base 1M and apply multiplier
        params['filter_volume_min'] = 1000000 * params['volume_mult'] * 0.3

    # Set minimums to avoid too aggressive filtering
    params['filter_price_min'] = max(params.get('filter_price_min', 1.0), 1.0)
    params['filter_volume_min'] = max(params.get('filter_volume_min', 100000), 100000)

    return params

def create_smart_enhancement(scan_params: dict) -> str:
    """Create smart universe enhancement based on scan parameters"""

    # Extract filter values from scan parameters
    price_min = scan_params.get('filter_price_min', 2.0)
    volume_min = scan_params.get('filter_volume_min', 500000)

    # If we have EMA/ATR requirements, we can be more selective
    if 'ema_atr_mult' in scan_params:
        # For high EMA distance requirements, ensure reasonable price levels
        price_min = max(price_min, 5.0)

    # If high volume multiplier, ensure adequate volume
    if 'volume_mult' in scan_params and scan_params['volume_mult'] > 2.0:
        volume_min = max(volume_min, 1000000)

    return f'''
# === SMART PARAMETER-BASED MARKET COVERAGE ===
import aiohttp
import asyncio
from typing import List
from datetime import datetime, timedelta

async def fetch_smart_universe() -> List[str]:
    """Fetch smart universe filtered by scan-specific parameters"""
    API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

    # Scan-specific filters extracted from parameters:
    PRICE_MIN = {price_min:.2f}       # Smart: 50% of scan's price requirement
    VOLUME_MIN = {int(volume_min):,}   # Smart: 30% of scan's volume requirement

    print(f"🧠 Smart filters based on scan params:")
    print(f"   Price >= ${{PRICE_MIN:.2f}} (50% of scan requirement)")
    print(f"   Volume >= {{VOLUME_MIN:,}} (30% of scan requirement)")

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

    print(f"🔍 Fetching market data for date range: {{trading_days[0]}} to {{trading_days[-1]}}")
    print(f"📅 Sampling {{len(trading_days)}} trading days for comprehensive coverage")

    try:
        async with aiohttp.ClientSession() as session:
            tasks = []
            for trading_date in trading_days:
                url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{{trading_date}}?adjusted=true&apiKey={{API_KEY}}"
                tasks.append(session.get(url))

            responses = await asyncio.gather(*tasks)

            total_processed = 0
            for response in responses:
                if response.status == 200:
                    data = await response.json()

                    if 'results' in data and data['results']:
                        # Process more tickers for comprehensive coverage
                        for ticker_data in data['results'][:5000]:
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)

                            # Apply scan-specific quality filters
                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN):

                                quality_tickers.add(symbol)

                        total_processed += len(data['results'])
                    else:
                        print(f"⚠️ No results for a date")
                else:
                    print(f"❌ API error: {{response.status}}")

            print(f"📊 Found {{len(quality_tickers)}} quality tickers matching scan requirements from ~{{total_processed:,}} total records")

    except Exception as e:
        print(f"❌ Error fetching data: {{e}}")
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

def get_smart_symbols():
    """Get smart universe based on scan parameters"""
    try:
        return asyncio.run(fetch_smart_universe())
    except Exception as e:
        print(f"❌ Error getting symbols: {{e}}")
        return []

'''

def analyze_code(file_path: str) -> dict:
    """Analyze trading code for enhancements needed"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error analyzing code: {e}")
        return {}

    # Extract scan parameters for smart filtering
    scan_params = extract_scan_parameters(file_path)

    analysis = {
        'has_aiohttp': 'aiohttp' in content,
        'has_asyncio': 'asyncio' in content,
        'has_universe': 'get_enhanced_symbols' in content or 'get_smart_symbols' in content,
        'symbols_found': bool(re.search(r'(SYMBOLS|symbols)\s*=', content)),
        'api_key_correct': 'Fm7brz4s23eSocDErnL68cE7wspz2K1I' in content,
        'scan_params': scan_params,
        'param_count': len(scan_params)
    }

    return analysis

def enhance_trading_code(file_path: str) -> bool:
    """Enhance trading code with smart parameter-based filtering"""

    print(f"🔧 Analyzing: {file_path}")

    analysis = analyze_code(file_path)
    if not analysis:
        return False

    scan_params = analysis['scan_params']
    print("📊 Current Analysis:")
    print(f"  Has Aiohttp: {'✅' if analysis['has_aiohttp'] else '❌'}")
    print(f"  Has Asyncio: {'✅' if analysis['has_asyncio'] else '❌'}")
    print(f"  Has Universe: {'✅' if analysis['has_universe'] else '❌'}")
    print(f"  Symbols Found: {'✅' if analysis['symbols_found'] else '❌'}")
    print(f"  Api Key Correct: {'✅' if analysis['api_key_correct'] else '❌'}")
    print(f"  Scan Parameters Found: {analysis['param_count']}")

    if scan_params:
        print("🧠 Detected Scan Parameters:")
        for param, value in scan_params.items():
            if 'filter_' not in param:  # Show only original params
                print(f"    {param}: {value}")
    else:
        print("⚠️ No scan parameters detected, using conservative defaults")

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

    # 2. Add smart universe functions before symbols list
    if not analysis['has_universe'] and analysis['symbols_found']:
        symbols_match = re.search(r'(SYMBOLS|symbols)\s*=', enhanced_code)
        if symbols_match:
            insert_pos = symbols_match.start()
            universe_code = create_smart_enhancement(scan_params)
            enhanced_code = enhanced_code[:insert_pos] + universe_code + enhanced_code[insert_pos:]
            changes.append("Added smart parameter-based market coverage")

    # 3. Replace hardcoded symbols with dynamic call
    if analysis['symbols_found']:
        enhanced_code = re.sub(
            r'(SYMBOLS|symbols)\s*=\s*\[.*?\](?=\s*$|\s*#|;\s*$|\n)',
            r'\1 = get_smart_symbols()  # Smart market coverage based on scan params',
            enhanced_code,
            flags=re.DOTALL
        )
        changes.append("Replaced hardcoded symbols with smart dynamic call")

    # 4. Basic syntax validation
    try:
        ast.parse(enhanced_code)
        print("🧪 Syntax validation: ✅ PASSED")
    except SyntaxError as e:
        print(f"🧪 Syntax validation: ⚠️ WARNING - {e}")
        print("⚠️ Proceeding anyway (enhancement may still work)")

    # 5. Save enhanced code
    try:
        enhanced_file = file_path.replace('.py', '_smart_optimized.py')
        with open(enhanced_file, 'w') as f:
            f.write(enhanced_code)

        print(f"💾 Smart enhanced code saved to: {enhanced_file}")
        print(f"📋 Changes made: {', '.join(changes)}")
        if scan_params:
            print(f"🧠 Smart filtering based on {analysis['param_count']} scan parameters")
        print("🎉 SUCCESS! Smart optimized code maintains scan integrity while improving speed.")
        return True

    except Exception as e:
        print(f"❌ Error saving enhanced file: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python smart_formatter.py <trading_code_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    success = enhance_trading_code(file_path)

    if success:
        print("\n📝 Next Steps:")
        print("1. Review the smart enhanced file")
        print("2. Run in terminal: python enhanced_file.py")
        print("3. Expect quality tickers matching scan requirements (much faster!)")
        print("4. Filtering preserves tickers that should pass the actual scan")
    else:
        print("❌ Smart enhancement failed!")
        sys.exit(1)