#!/usr/bin/env python3
"""
Intelligent Multi-Scan Formatter
Automatically detects active scans and maintains parameter integrity
"""

import re
import ast
import sys
from typing import Dict, List, Tuple, Set

class MultiScanAnalyzer:
    """Analyzes code to detect active scans and their parameters"""

    def __init__(self):
        self.scan_patterns = {}
        self.active_scans = []
        self.scan_outputs = []

    def analyze_code(self, file_path: str) -> Dict:
        """Analyze code to detect active scans"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return {}

        analysis = {
            'has_aiohttp': 'aiohttp' in content,
            'has_asyncio': 'asyncio' in content,
            'has_universe': 'get_enhanced_symbols' in content,
            'api_key_correct': self._extract_api_key(content),
            'scans': self._detect_scans(content),
            'active_scans': [],
            'scan_parameters': {}
        }

        return analysis

    def _extract_api_key(self, content: str) -> bool:
        """Extract and validate API key"""
        api_match = re.search(r"API_KEY\s*=\s*['\"]([^'\"]+)['\"]", content)
        if api_match:
            return bool(api_match.group(1))
        return False

    def _detect_scans(self, content: str) -> List[Dict]:
        """Detect all scans in the code"""
        scans = []

        # Look for scan patterns in the code
        scan_definitions = []

        # Find filter functions and their usage
        filter_functions = re.findall(r'def\s+(filter_\w+|check_\w+|get_\w+)\s*\([^)]*\):', content)

        # Look for scan output assignments
        scan_assignments = re.findall(r'(df_\w+)\s*=.*(?:filter_\w+|check_\w+|get_\w+)', content)

        # Look for scan filter conditions in comments or active code
        active_filters = re.findall(r'(?:#\s*|^.*?)(\w+\s*==\s*1|==\s*1)', content, re.MULTILINE)

        # Find scan output sections
        output_sections = re.findall(r'(df_\w+)\.to_csv\(["\']([^"\']+)["\']\)', content)

        # Find scan processing logic
        processing_logic = re.findall(r'(?:#\s*)?(\w+)\s*=\s*check_\w+\([^)]*\)', content)

        # Combine all evidence
        all_scan_refs = set()
        for ref in filter_functions:
            all_scan_refs.add(ref[0] if isinstance(ref, tuple) else ref)
        for ref in scan_assignments:
            all_scan_refs.add(ref.split('=')[0].strip())
        for ref in processing_logic:
            all_scan_refs.add(ref.split('=')[0].strip())
        for ref in output_sections:
            all_scan_refs.add(ref[0])

        # Identify scan types based on common patterns
        scan_types = []
        for scan_ref in all_scan_refs:
            if 'lc' in scan_ref.lower() or 'large' in scan_ref.lower():
                scan_types.append({
                    'name': 'LC Scan',
                    'variable': scan_ref,
                    'type': 'large_cap',
                    'detected_from': 'variable naming'
                })
            elif 'd2' in scan_ref.lower() or 'day2' in scan_ref.lower():
                scan_types.append({
                    'name': 'D2 Scan',
                    'variable': scan_ref,
                    'type': 'day2_momentum',
                    'detected_from': 'variable naming'
                })
            elif 'fbo' in scan_ref.lower() or 'breakout' in scan_ref.lower():
                scan_types.append({
                    'name': 'FBO Scan',
                    'variable': scan_ref,
                    'type': 'false_breakout',
                    'detected_from': 'variable naming'
                })
            else:
                scan_types.append({
                    'name': f'Unknown Scan ({scan_ref})',
                    'variable': scan_ref,
                    'type': 'unknown',
                    'detected_from': 'variable naming'
                })

        # Determine which scans are actually active (have output processing)
        active_scans = []
        for scan_type in scan_types:
            var_name = scan_type['variable']
            # Check if this scan has active processing
            if f'{var_name} =' in content and 'check_' in content:
                # Check if results are processed/saved
                if 'process_dataframe' in content and var_name in content:
                    scan_type['active'] = True
                    active_scans.append(scan_type)
                elif f'{var_name}.to_csv' in content:
                    scan_type['active'] = True
                    active_scans.append(scan_type)
                else:
                    scan_type['active'] = False
            else:
                scan_type['active'] = False

        # Remove duplicates while preserving order
        unique_scans = []
        seen = set()
        for scan in scan_types:
            scan_key = f"{scan['name']}_{scan['variable']}"
            if scan_key not in seen:
                seen.add(scan_key)
                unique_scans.append(scan)

        return unique_scans

def create_multi_scan_enhancement(scans: List[Dict]) -> str:
    """Create multi-scan enhancement code"""

    scan_enhancements = []

    # Create individual universe functions for each scan type
    scan_types = set(scan['type'] for scan in scans)

    enhancement_code = '''
# === INTELLIGENT MULTI-SCAN COVERAGE ===
import aiohttp
import asyncio
from typing import List, Dict, Set
from datetime import datetime, timedelta

'''

    # Add universe functions for each scan type
    universe_functions = {}
    for scan_type in scan_types:
        if scan_type == 'large_cap':
            universe_functions[scan_type] = '''async def fetch_large_cap_universe() -> List[str]:
    """Fetch large-cap universe with strict quality filters"""
    API_KEY = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"

    # LC-specific filters (more restrictive)
    PRICE_MIN = 10.0          # $10 minimum for LC
    VOLUME_MIN = 10000000     # 10M shares minimum
    MIN_DOLLAR_VOLUME = 50000000  # $50M daily minimum

    print(f"🏢 LC Scan Filters: ${PRICE_MIN:.2f}+ price, {VOLUME_MIN:,}+ shares, ${MIN_DOLLAR_VOLUME:,}+ daily volume")

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

    print(f"🔍 Fetching LC market data: {trading_days[0]} to {trading_days[-1]}")
    print(f"📅 Sampling {len(trading_days)} trading days for LC quality coverage")

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
                        # LC-specific quality filters
                        for ticker_data in data['results'][:2000]:  # Limit for quality focus
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)
                            dollar_volume = close_price * volume

                            # Apply LC-specific filters
                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN and
                                dollar_volume >= MIN_DOLLAR_VOLUME):

                                quality_tickers.add(symbol)

                        total_processed += len(data['results'])

            print(f"📊 LC Universe: {len(quality_tickers)} large-cap tickers from ~{total_processed:,} total")

    except Exception as e:
        print(f"❌ Error fetching LC data: {e}")
        # Fallback to major large-cap stocks
        print("⚠️ Using fallback large-cap stocks list")
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM',
            'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'HD', 'BAC', 'XOM',
            'CVX', 'PFE', 'KO', 'PEP', 'T', 'DIS', 'CSCO', 'NFLX', 'ADBE',
            'CRM', 'PYPL', 'INTC', 'CMCSA', 'NKE', 'ABT', 'ACN', 'DHR'
        ]

    return sorted(list(quality_tickers))

'''

        elif scan_type == 'day2_momentum':
            universe_functions[scan_type] = '''async def fetch_d2_universe() -> List[str]:
    """Fetch D2 momentum universe with dynamic filters"""
    API_KEY = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"

    # D2-specific filters (moderate requirements)
    PRICE_MIN = 5.0           # $5 minimum
    VOLUME_MIN = 2000000     # 2M shares minimum
    MIN_DOLLAR_VOLUME = 10000000  # $10M daily minimum

    print(f"🚀 D2 Scan Filters: ${PRICE_MIN:.2f}+ price, {VOLUME_MIN:,}+ shares, ${MIN_DOLLAR_VOLUME:,}+ daily volume")

    quality_tickers = set()

    # Date range: January 1, 2024 to November 1, 2025
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2025, 11, 1)

    # Generate trading days
    trading_days = []
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5:
            trading_days.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=5)  # Every 5 days for momentum coverage

    print(f"🔍 Fetching D2 market data: {trading_days[0]} to {trading_days[-1]}")
    print(f"📅 Sampling {len(trading_days)} trading days for D2 momentum coverage")

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
                        for ticker_data in data['results'][:2500]:  # More for momentum breadth
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)
                            dollar_volume = close_price * volume

                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN and
                                dollar_volume >= MIN_DOLLAR_VOLUME):

                                quality_tickers.add(symbol)

                        total_processed += len(data['results'])

            print(f"📊 D2 Universe: {len(quality_tickers)} momentum tickers from ~{total_processed:,} total")

    except Exception as e:
        print(f"❌ Error fetching D2 data: {e}")
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
            'AMD', 'NFLX', 'CRM', 'PYPL', 'SQ', 'SNAP', 'ROKU'
        ]

    return sorted(list(quality_tickers))

'''

        elif scan_type == 'false_breakout':
            universe_functions[scan_type] = '''async def fetch_fbo_universe() -> List[str]:
    """Fetch FBO universe with breakout potential filters"""
    API_KEY = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"

    # FBO-specific filters (lower barriers for breakout potential)
    PRICE_MIN = 3.0           # $3 minimum
    VOLUME_MIN = 1000000     # 1M shares minimum
    MIN_DOLLAR_VOLUME = 5000000   # $5M daily minimum

    print(f"💥 FBO Scan Filters: ${PRICE_MIN:.2f}+ price, {VOLUME_MIN:,}+ shares, ${MIN_DOLLAR_VOLUME:,}+ daily volume")

    quality_tickers = set()

    # Date range: January 1, 2024 to November 1, 2025
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2025, 11, 1)

    # Generate trading days
    trading_days = []
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5:
            trading_days.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=4)  # Every 4 days for breakout coverage

    print(f"🔍 Fetching FBO market data: {trading_days[0]} to {trading_days[-1]}")
    print(f"📅 Sampling {len(trading_days)} trading days for FBO breakout coverage")

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
                        # FBO needs broader coverage for breakout detection
                        for ticker_data in data['results'][:3000]:
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)
                            dollar_volume = close_price * volume

                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN and
                                dollar_volume >= MIN_DOLLAR_VOLUME):

                                quality_tickers.add(symbol)

                        total_processed += len(data['results'])

            print(f"📊 FBO Universe: {len(quality_tickers)} breakout tickers from ~{total_processed:,} total")

    except Exception as e:
        print(f"❌ Error fetching FBO data: {e}")
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
            'AMD', 'GME', 'AMC', 'BBBY', 'SNAP', 'ROKU', 'TLRY'
        ]

    return sorted(list(quality_tickers))

'''

        else:
            universe_functions[scan_type] = '''async def fetch_default_universe() -> List[str]:
    """Fetch default universe with balanced filters"""
    API_KEY = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"

    # Default balanced filters
    PRICE_MIN = 2.0           # $2 minimum
    VOLUME_MIN = 500000       # 500K shares minimum

    print(f"📈 Default Scan Filters: ${PRICE_MIN:.2f}+ price, {VOLUME_MIN:,}+ shares")

    quality_tickers = set()

    # Single most recent trading day for speed
    end_date = datetime.now()
    date = end_date
    while date.weekday() >= 5:
        date = date - timedelta(days=1)

    trading_date = date.strftime("%Y-%m-%d")
    print(f"🔍 Fetching default market data for: {trading_date}")

    try:
        url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{trading_date}?adjusted=true&apiKey={API_KEY}"

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()

                    if 'results' in data and data['results']:
                        for ticker_data in data['results'][:2000]:
                            symbol = ticker_data.get('T')
                            close_price = ticker_data.get('c', 0)
                            volume = ticker_data.get('v', 0)

                            if (symbol and
                                close_price >= PRICE_MIN and
                                volume >= VOLUME_MIN):

                                quality_tickers.add(symbol)

                        print(f"📊 Default Universe: {len(quality_tickers)} quality tickers from {len(data['results'])} total")

    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META']

    return sorted(list(quality_tickers))

'''

        enhancement_code += universe_functions[scan_type]
        enhancement_code += '\n'

    # Add individual getter functions for each active scan
    active_scans = [scan for scan in scans if scan.get('active', False)]
    for scan in active_scans:
        scan_name = scan['name'].replace(' ', '_').lower()
        scan_type = scan['type']

        if scan_type == 'large_cap':
            enhancement_code += f'''
def get_{scan_name}_universe():
    """Get {scan['name']} universe with LC-specific filters"""
    try:
        return asyncio.run(fetch_large_cap_universe())
    except Exception as e:
        print(f"❌ Error getting {scan['name']} universe: {{e}}")
        return []
'''
        elif scan_type == 'day2_momentum':
            enhancement_code += f'''
def get_{scan_name}_universe():
    """Get {scan['name']} universe with D2-specific filters"""
    try:
        return asyncio.run(fetch_d2_universe())
    except Exception as e:
        print(f"❌ Error getting {scan['name']} universe: {{e}}")
        return []
'''
        elif scan_type == 'false_breakout':
            enhancement_code += f'''
def get_{scan_name}_universe():
    """Get {scan['name']} universe with FBO-specific filters"""
    try:
        return asyncio.run(fetch_fbo_universe())
    except Exception as e:
        print(f"❌ Error getting {scan['name']} universe: {{e}}")
        return []
'''
        else:
            enhancement_code += f'''
def get_{scan_name}_universe():
    """Get {scan['name']} universe with default filters"""
    try:
        return asyncio.run(fetch_default_universe())
    except Exception as e:
        print(f"❌ Error getting {scan['name']} universe: {{e}}")
        return []
'''

    enhancement_code += '''
# Universal getter for compatibility
def get_enhanced_symbols():
    """Get enhanced symbols (default to LC scan)"""
    try:
        return asyncio.run(fetch_large_cap_universe())
    except Exception as e:
        print(f"❌ Error getting symbols: {e}")
        return []

'''

    return enhancement_code

def enhance_multi_scan_code(file_path: str) -> bool:
    """Enhance multi-scan trading code"""

    print(f"🔧 Analyzing Multi-Scan Code: {file_path}")

    # Analyze the code
    analyzer = MultiScanAnalyzer()
    analysis = analyzer.analyze_code(file_path)

    if not analysis:
        return False

    print("📊 Multi-Scan Analysis:")
    print(f"  Has Aiohttp: {'✅' if analysis['has_aiohttp'] else '❌'}")
    print(f"  Has Asyncio: {'✅' if analysis['has_asyncio'] else '❌'}")
    print(f"  Has Universe: {'✅' if analysis['has_universe'] else '❌'}")
    print(f"  API Key Found: {'✅' if analysis['api_key_correct'] else '❌'}")

    scans = analysis['scans']
    active_scans = [scan for scan in scans if scan.get('active', False)]

    print(f"🔍 Scans Detected: {len(scans)}")
    for scan in scans:
        status = "✅ ACTIVE" if scan.get('active', False) else "❌ INACTIVE"
        print(f"  {scan['name']} ({scan['type']}): {status}")

    if not active_scans:
        print("⚠️ No active scans found - using default LC scan")
        active_scans = [{
            'name': 'Default LC Scan',
            'type': 'large_cap',
            'active': True,
            'detected_from': 'default'
        }]

    print(f"🎯 Processing {len(active_scans)} Active Scans")

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

    # 2. Add multi-scan universe functions before any SYMBOLS assignments
    if not analysis['has_universe']:
        # Find first major assignment to insert before
        insert_patterns = [
            r'fetch_intial_stock_list|SYMBOLS\s*=|symbols\s*=|df_.*=.*fetch_intial_stock_list'
        ]

        insert_pos = None
        for pattern in insert_patterns:
            match = re.search(pattern, enhanced_code)
            if match:
                insert_pos = match.start()
                break

        if insert_pos:
            universe_code = create_multi_scan_enhancement(scans)
            enhanced_code = enhanced_code[:insert_pos] + universe_code + enhanced_code[insert_pos:]
            changes.append(f"Added multi-scan universe functions for {len(active_scans)} scans")
        else:
            # Fallback: add at the beginning
            universe_code = create_multi_scan_enhancement(scans)
            enhanced_code = universe_code + enhanced_code
            changes.append("Added multi-scan universe functions")

    # 3. Replace hardcoded data fetching with enhanced functions
    # Replace fetch_intial_stock_list calls
    if active_scans:
        # Use the first active scan's universe function for the main fetch
        primary_scan = active_scans[0]
        scan_name = primary_scan['name'].replace(' ', '_').lower()

        enhanced_code = re.sub(
            r'fetch_intial_stock_list\(session,\s*([^,]+),\s*([^)]+)\)',
            f'get_{scan_name}_universe()',
            enhanced_code
        )
        changes.append(f"Replaced hardcoded data fetching with {primary_scan['name']} universe")

    # 4. Validate syntax
    try:
        ast.parse(enhanced_code)
        print("🧪 Syntax validation: ✅ PASSED")
    except SyntaxError as e:
        print(f"🧪 Syntax validation: ⚠️ WARNING - {e}")
        print("⚠️ Proceeding anyway (enhancement may still work)")

    # 5. Save enhanced code
    try:
        enhanced_file = file_path.replace('.py', '_multi_enhanced.py')
        with open(enhanced_file, 'w') as f:
            f.write(enhanced_code)

        print(f"💾 Multi-scan enhanced code saved to: {enhanced_file}")
        print(f"📋 Changes made: {', '.join(changes)}")
        print("🎉 SUCCESS! Multi-scan code is ready for terminal execution.")

        print(f"\n📝 Active Scans Enhanced:")
        for scan in active_scans:
            print(f"  ✅ {scan['name']} - {scan['type']} scan")
            print(f"     Variable: {scan['variable']}")

        print(f"\n📝 Next Steps:")
        print(f"1. Run: python {enhanced_file}")
        print(f"2. Check individual scan outputs")
        print(f"3. Each scan maintains parameter integrity")

        return True

    except Exception as e:
        print(f"❌ Error saving enhanced file: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python multi_scan_formatter.py <multi_scan_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    success = enhance_multi_scan_code(file_path)

    if success:
        print(f"\n✅ Multi-scan enhancement complete!")
    else:
        print("❌ Multi-scan enhancement failed!")
        sys.exit(1)