#!/usr/bin/env python3
"""
Safe Multi-Scan Formatter - Conservative Approach
Adds universe functions without breaking existing code
"""

import re
import ast
import sys

def create_safe_universe_enhancement(api_key: str) -> str:
    """Create safe universe enhancement that won't break existing code"""
    # Define constants outside the f-string to avoid scope issues
    PRICE_MIN = 5.0
    VOLUME_MIN = 2000000

    return f'''
# === SAFE UNIVERSAL MARKET COVERAGE ===
import aiohttp
import asyncio
from typing import List
from datetime import datetime, timedelta

async def fetch_quality_universe() -> List[str]:
    """Fetch quality universe with conservative filtering"""
    API_KEY = "{api_key}"

    # Conservative filters that work for most scans
    PRICE_MIN = {PRICE_MIN}        # $5 minimum (safe for most scans)
    VOLUME_MIN = {VOLUME_MIN}  # 2M shares minimum

    print(f"🔍 Using conservative filters: ${{PRICE_MIN:.2f}}+ price, {{VOLUME_MIN:,}}+ volume")

    quality_tickers = set()

    # Date range: January 1, 2024 to November 1, 2025
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2025, 11, 1)

    # Generate trading days (sample weekly for performance)
    trading_days = []
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5:  # Only weekdays
            trading_days.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=7)  # Sample weekly for performance

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
                        for ticker_data in data['results'][:3000]:
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)

                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN):

                                quality_tickers.add(symbol)

                        total_processed += len(data['results'])

            print(f"📊 Found {len(quality_tickers)} quality tickers from ~{total_processed:,} total records")

    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        # Fallback to major stocks
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM',
            'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'BAC', 'XOM',
            'CVX', 'PFE', 'KO', 'PEP', 'T', 'DIS', 'CSCO', 'NFLX', 'ADBE',
            'CRM', 'PYPL', 'INTC', 'CMCSA', 'NKE', 'ABT', 'ACN', 'DHR',
            'MRK', 'HON', 'TXN', 'IBM', 'GS', 'CAT', 'BA', 'ORCL'
        ]

    return sorted(list(quality_tickers))

def get_quality_symbols():
    """Get quality universe"""
    try:
        return asyncio.run(fetch_quality_universe())
    except Exception as e:
        print(f"❌ Error getting symbols: {e}")
        return []

'''

def analyze_code(file_path: str) -> dict:
    """Analyze trading code for safe enhancements"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error analyzing code: {e}")
        return {}

    # Extract the exact API key from the original file
    api_key_match = re.search(r'API_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', content)

    # Look for import section to add universe functions safely
    import_section_match = re.search(r'^import.*?\n\n', content, re.MULTILINE | re.DOTALL)

    # Look for main execution section
    main_match = re.search(r'if __name__ == ["\']__main__["\']:', content)

    # Look for symbol lists or data fetching areas
    symbol_patterns = [
        r'(symbols|SYMBOLS|tickers)\s*=\s*\[',
        r'for\s+\w+\s+in\s+[\'"][\w]+[\'"]:',
        r'data_fetch.*?fetch.*?\(',
    ]

    has_symbols = any(re.search(pattern, content, re.IGNORECASE) for pattern in symbol_patterns)

    analysis = {
        'content_length': len(content),
        'has_imports': bool(re.search(r'^import\s+', content, re.MULTILINE)),
        'has_main': bool(main_match),
        'has_symbols': has_symbols,
        'import_section_end': import_section_match.end() if import_section_match else None,
        'main_section_start': main_match.start() if main_match else None,
        'api_key_found': bool(api_key_match),
        'api_key': api_key_match.group(1) if api_key_match else None,
        'original_content': content,
    }

    return analysis

def safe_enhance_code(file_path: str) -> bool:
    """Safely enhance trading code with universe functions"""
    print(f"🔧 Safely analyzing: {file_path}")

    analysis = analyze_code(file_path)
    if not analysis:
        return False

    print("📊 Safe Analysis:")
    print(f"  Has Imports: {'✅' if analysis['has_imports'] else '❌'}")
    print(f"  Has Main: {'✅' if analysis['has_main'] else '❌'}")
    print(f"  Has Symbols: {'✅' if analysis['has_symbols'] else '❌'}")
    print(f"  API Key Found: {'✅' if analysis['api_key_found'] else '❌'}")
    if analysis['api_key']:
        print(f"  API Key: {analysis['api_key'][:10]}...")

    enhanced_code = analysis['original_content']
    changes = []

    # 1. Add universe functions at the very beginning (before any other imports)
    if analysis['has_imports'] and analysis['api_key']:
        # Insert universe functions after existing imports
        import_end = analysis['import_section_end']
        if import_end:
            universe_code = create_safe_universe_enhancement(analysis['api_key'])
            enhanced_code = enhanced_code[:import_end] + '\n' + universe_code + enhanced_code[import_end:]
            changes.append(f"Added safe universe functions using file's API key")

    # 2. Create a simple replacement suggestion for symbol lists (conservative approach)
    if analysis['has_symbols']:
        # Instead of replacing code, add a comment showing the recommended change
        universe_comment = '''
# RECOMMENDED: Replace hardcoded symbol lists with:
# symbols = get_quality_symbols()  # Dynamic market coverage

'''
        if analysis['main_section_start']:
            enhanced_code = enhanced_code[:analysis['main_section_start']] + universe_comment + enhanced_code[analysis['main_section_start']:]
            changes.append("Added recommendation for dynamic symbols")

    # 3. Basic syntax validation
    try:
        ast.parse(enhanced_code)
        print("🧪 Syntax validation: ✅ PASSED")
    except SyntaxError as e:
        print(f"🧪 Syntax validation: ⚠️ WARNING - {e}")
        print("⚠️ Reverting to original code to avoid syntax errors")
        enhanced_code = original_code
        changes = ["Syntax validation failed - kept original code"]

    # 4. Save enhanced code with safe name
    try:
        enhanced_file = file_path.replace('.py', '_safe_enhanced.py')
        with open(enhanced_file, 'w') as f:
            f.write(enhanced_code)

        print(f"💾 Safe enhanced code saved to: {enhanced_file}")
        print(f"📋 Changes made: {', '.join(changes) if changes else 'None'}")
        print("🎉 SUCCESS! Code enhanced safely without breaking syntax.")
        return True

    except Exception as e:
        print(f"❌ Error saving enhanced file: {e}")
        return False

def create_usage_instructions(file_path: str, enhanced_file: str):
    """Create instructions for using the enhanced code"""
    instructions = f"""
# Safe Enhancement Instructions for: {file_path}

## Enhanced File: {enhanced_file}

## What was added:
1. ✅ Safe universe fetching functions
2. ✅ Conservative quality filters ($5+ price, 2M+ volume)
3. ✅ Error handling with fallback major stocks list
4. ✅ No syntax-breaking modifications

## To use dynamic symbols:
1. Find your hardcoded symbol list (look for: symbols = [...])
2. Replace with: symbols = get_quality_symbols()
3. Run: python3 {enhanced_file}

## Safe Approach:
- Original code is preserved
- Only adds new functions, doesn't modify existing logic
- Conservative filters work for most scan types
- Syntax validation prevents broken code
"""

    instruction_file = file_path.replace('.py', '_instructions.txt')
    with open(instruction_file, 'w') as f:
        f.write(instructions)
    print(f"📝 Instructions saved to: {instruction_file}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python safe_multi_scan_formatter.py <trading_code_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    success = safe_enhance_code(file_path)

    if success:
        enhanced_file = file_path.replace('.py', '_safe_enhanced.py')
        create_usage_instructions(file_path, enhanced_file)
        print("\n📝 Next Steps:")
        print("1. Review the safe enhanced file")
        print("2. See instructions file for usage guidance")
        print("3. Run: python enhanced_file.py")
        print("4. Replace symbol lists manually if desired")
        print("🛡️ Safe enhancement complete - no syntax errors!")
    else:
        print("❌ Safe enhancement failed!")
        sys.exit(1)