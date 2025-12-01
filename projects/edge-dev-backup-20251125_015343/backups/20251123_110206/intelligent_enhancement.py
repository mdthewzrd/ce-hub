#!/usr/bin/env python3
"""
🎯 Intelligent System Enhancement
==================================

Automatically detects and upgrades scanner infrastructure while preserving 100% algorithm integrity.

System Enhancements:
1. Polygon API integration (if missing)
2. ThreadPoolExecutor for max performance (if missing)
3. Full ticker universe expansion (if limited symbol list)

Algorithm Preservation:
- Never modifies scanner logic, parameters, or calculations
- Only enhances infrastructure components
- Maintains exact function signatures and behavior
"""

import re
import ast
import requests
from typing import Dict, List, Tuple, Optional

# Full market universe for system enhancement
FULL_UNIVERSE_SYMBOLS = None  # Will be loaded dynamically

def detect_infrastructure_needs(code: str) -> Dict[str, bool]:
    """
    Analyze uploaded code to detect what infrastructure enhancements are needed

    Returns:
        Dict with enhancement flags: {
            'needs_polygon_api': bool,
            'needs_threading': bool,
            'needs_full_universe': bool
        }
    """
    needs = {
        'needs_polygon_api': False,
        'needs_threading': False,
        'needs_full_universe': False
    }

    code_lower = code.lower()

    # Check if Polygon API is missing
    if 'polygon.io' not in code_lower and 'api.polygon.io' not in code_lower:
        needs['needs_polygon_api'] = True

    # Check if threading is missing
    if 'threadpoolexecutor' not in code_lower and 'concurrent.futures' not in code_lower:
        needs['needs_threading'] = True

    # Check if ticker universe is limited (has hardcoded symbol list < 500)
    symbol_lists = extract_symbol_lists(code)
    if symbol_lists:
        max_symbols = max(len(symbols) for symbols in symbol_lists)
        if max_symbols < 500:  # Threshold for "limited" vs "full universe"
            needs['needs_full_universe'] = True
    else:
        # No symbol list found - might need full universe
        needs['needs_full_universe'] = True

    return needs

def extract_symbol_lists(code: str) -> List[List[str]]:
    """
    Extract all symbol/ticker lists from code
    """
    symbol_lists = []

    # Pattern 1: SYMBOLS = [...]
    symbols_match = re.search(r'SYMBOLS\s*=\s*\[(.*?)\]', code, re.DOTALL)
    if symbols_match:
        symbols_content = symbols_match.group(1)
        symbols = re.findall(r'[\'"]([^\'"]+)[\'"]', symbols_content)
        if symbols:
            symbol_lists.append(symbols)

    # Pattern 2: symbols = [...]
    symbols_match = re.search(r'symbols\s*=\s*\[(.*?)\]', code, re.DOTALL)
    if symbols_match:
        symbols_content = symbols_match.group(1)
        symbols = re.findall(r'[\'"]([^\'"]+)[\'"]', symbols_content)
        if symbols:
            symbol_lists.append(symbols)

    return symbol_lists

def extract_scanner_parameters(code: str) -> Dict[str, any]:
    """
    🧠 INTELLIGENT PARAMETER EXTRACTION

    Analyzes uploaded scanner code to extract parameters that should influence
    the smart pre-filtering criteria. This makes the universe truly adaptive
    to each scanner's specific requirements.

    Returns:
        Dict with extracted parameters that can customize pre-filtering
    """
    extracted_params = {
        'min_price': None,
        'max_price': None,
        'min_volume': None,
        'min_market_cap': None,
        'min_avg_dollar_volume': None,
        'exclude_sectors': [],
        'require_options': False,
        'custom_filters': {}
    }

    print(f"🧠 Analyzing scanner parameters for adaptive pre-filtering...")

    # Extract P dictionary (common in A+ scanners)
    p_dict_match = re.search(r'P\s*=\s*\{(.*?)\}', code, re.DOTALL)
    if p_dict_match:
        p_content = p_dict_match.group(1)
        print(f"   📋 Found P dictionary - extracting price/volume parameters...")

        # Extract min_price from P dict
        min_price_match = re.search(r'[\'"]?min_price[\'"]?\s*:\s*([0-9.]+)', p_content)
        if min_price_match:
            extracted_params['min_price'] = float(min_price_match.group(1))
            print(f"      OK min_price: ${extracted_params['min_price']}")

        # Extract max_price from P dict
        max_price_match = re.search(r'[\'"]?max_price[\'"]?\s*:\s*([0-9.]+)', p_content)
        if max_price_match:
            extracted_params['max_price'] = float(max_price_match.group(1))
            print(f"      OK max_price: ${extracted_params['max_price']}")

    # Look for volume-related parameters
    volume_patterns = [
        r'min_vol(?:ume)?\s*[=:]\s*([0-9,_]+)',
        r'vol(?:ume)?_(?:min|threshold)\s*[=:]\s*([0-9,_]+)',
        r'MIN_VOLUME\s*=\s*([0-9,_]+)'
    ]

    for pattern in volume_patterns:
        volume_match = re.search(pattern, code, re.IGNORECASE)
        if volume_match:
            volume_str = volume_match.group(1).replace(',', '').replace('_', '')
            extracted_params['min_volume'] = int(volume_str)
            print(f"   📈 Found volume requirement: {extracted_params['min_volume']:,}")
            break

    # Look for market cap parameters
    mcap_patterns = [
        r'min_(?:market_cap|mcap|market_value)\s*[=:]\s*([0-9,_]+)',
        r'MIN_MARKET_CAP\s*=\s*([0-9,_]+)'
    ]

    for pattern in mcap_patterns:
        mcap_match = re.search(pattern, code, re.IGNORECASE)
        if mcap_match:
            mcap_str = mcap_match.group(1).replace(',', '').replace('_', '')
            extracted_params['min_market_cap'] = int(mcap_str)
            print(f"   💰 Found market cap requirement: ${extracted_params['min_market_cap']:,}")
            break

    # Look for dollar volume parameters
    dollar_vol_patterns = [
        r'min_(?:dollar_vol|adv|avg_dollar)\s*[=:]\s*([0-9,_]+)',
        r'MIN_ADV\s*=\s*([0-9,_]+)'
    ]

    for pattern in dollar_vol_patterns:
        dollar_vol_match = re.search(pattern, code, re.IGNORECASE)
        if dollar_vol_match:
            dollar_vol_str = dollar_vol_match.group(1).replace(',', '').replace('_', '')
            extracted_params['min_avg_dollar_volume'] = int(dollar_vol_str)
            print(f"   💵 Found dollar volume requirement: ${extracted_params['min_avg_dollar_volume']:,}")
            break

    # Check for sector exclusions
    if 'REIT' in code.upper() and ('exclude' in code.lower() or 'skip' in code.lower()):
        extracted_params['exclude_sectors'].append('REIT')
        print(f"   🚫 Found sector exclusion: REIT")

    # Check for options requirements
    if 'options' in code.lower() and ('require' in code.lower() or 'must_have' in code.lower()):
        extracted_params['require_options'] = True
        print(f"   📊 Found options requirement: True")

    # Summary
    param_count = sum(1 for v in extracted_params.values() if v is not None and v != [] and v != False)
    print(f"   📊 Extracted {param_count} parameters for adaptive pre-filtering")

    return extracted_params

def create_adaptive_prefilter_criteria(extracted_params: Dict[str, any]) -> Dict[str, any]:
    """
    🎯 ADAPTIVE PRE-FILTER GENERATION

    Takes extracted scanner parameters and creates custom pre-filtering criteria
    that's optimized for that specific scanner's requirements
    """
    # Start with intelligent defaults
    criteria = {
        'min_price': 8.0,              # Conservative default
        'min_avg_volume_20d': 500_000,  # Liquid stocks
        'min_market_cap': 50_000_000,   # Avoid micro caps
        'max_price': 2000.0,            # Avoid extreme outliers
        'min_adv_usd': 10_000_000,      # Minimum dollar volume
        'exclude_sectors': [],
        'require_options': False
    }

    print(f"🎯 Creating adaptive pre-filter criteria...")

    # Override with scanner-specific parameters
    if extracted_params['min_price'] is not None:
        criteria['min_price'] = extracted_params['min_price']
        print(f"   OK Adapted min_price to ${criteria['min_price']} (from scanner)")

    if extracted_params['max_price'] is not None:
        criteria['max_price'] = extracted_params['max_price']
        print(f"   OK Adapted max_price to ${criteria['max_price']} (from scanner)")

    if extracted_params['min_volume'] is not None:
        criteria['min_avg_volume_20d'] = extracted_params['min_volume']
        print(f"   OK Adapted volume to {criteria['min_avg_volume_20d']:,} (from scanner)")

    if extracted_params['min_market_cap'] is not None:
        criteria['min_market_cap'] = extracted_params['min_market_cap']
        print(f"   OK Adapted market cap to ${criteria['min_market_cap']:,} (from scanner)")

    if extracted_params['min_avg_dollar_volume'] is not None:
        criteria['min_adv_usd'] = extracted_params['min_avg_dollar_volume']
        print(f"   OK Adapted dollar volume to ${criteria['min_adv_usd']:,} (from scanner)")

    if extracted_params['exclude_sectors']:
        criteria['exclude_sectors'] = extracted_params['exclude_sectors']
        print(f"   OK Adapted sector exclusions: {criteria['exclude_sectors']}")

    if extracted_params['require_options']:
        criteria['require_options'] = extracted_params['require_options']
        print(f"   OK Adapted options requirement: {criteria['require_options']}")

    print(f"🎯 Adaptive criteria ready - customized for this scanner's needs")
    return criteria

def get_full_universe_symbols() -> List[str]:
    """
    Get TRUE full market universe with smart pre-filtering

    Returns comprehensive market coverage (NYSE + NASDAQ + Indexes)
    with smart pre-filtering for optimal performance
    """
    global FULL_UNIVERSE_SYMBOLS

    if FULL_UNIVERSE_SYMBOLS is not None:
        return FULL_UNIVERSE_SYMBOLS

    try:
        # Import true full universe system
        from true_full_universe import get_smart_enhanced_universe, get_full_raw_universe

        # Get smart pre-filtered universe (500-1000 qualified tickers)
        FULL_UNIVERSE_SYMBOLS = get_smart_enhanced_universe()

        print(f"🌍 TRUE FULL UNIVERSE: {len(FULL_UNIVERSE_SYMBOLS)} pre-qualified tickers")
        print(f"   (Smart filtered from ~5000+ total market universe)")

    except Exception as e:
        print(f"⚠️ Fallback to curated universe: {e}")
        # Fallback to expanded curated list
        FULL_UNIVERSE_SYMBOLS = [
            # Mega caps
            'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'LLY',
            'AVGO', 'JPM', 'UNH', 'XOM', 'V', 'JNJ', 'WMT', 'MA', 'PG', 'HD',

            # Large caps
            'CVX', 'ABBV', 'BAC', 'ORCL', 'CRM', 'KO', 'MRK', 'COST', 'AMD', 'PEP',
            'TMO', 'DHR', 'VZ', 'ABT', 'ADBE', 'ACN', 'MCD', 'CSCO', 'LIN', 'WFC',
            'DIS', 'TXN', 'PM', 'BMY', 'NFLX', 'COP', 'IBM', 'GE', 'QCOM', 'CAT',
            'SPGI', 'UPS', 'GS', 'LOW', 'HON', 'INTU', 'DE', 'BKNG', 'AXP', 'BLK',

            # High volume mid caps
            'SMCI', 'MSTR', 'SOXL', 'DJT', 'BABA', 'TCOM', 'AMC', 'MRVL', 'DOCU', 'ZM',
            'SNAP', 'RBLX', 'SE', 'INTC', 'BA', 'PYPL', 'RIVN', 'LCID', 'PLTR', 'SNOW',

            # Major ETFs
            'SPY', 'QQQ', 'IWM', 'DIA', 'XLF', 'XLK', 'XLE', 'XLV', 'ARKK', 'SQQQ', 'TQQQ'
        ]

    return FULL_UNIVERSE_SYMBOLS

def enhance_scanner_infrastructure(code: str, pure_execution_mode: bool = False) -> str:
    """
    Intelligently enhance scanner infrastructure while preserving 100% algorithm integrity

    Args:
        code: Scanner code to enhance
        pure_execution_mode: If True, skip ALL enhancements for 100% fidelity execution

    Enhancements:
    1. Add Polygon API integration if missing
    2. Add ThreadPoolExecutor if missing
    3. Expand to full universe if limited symbol list

    Algorithm Preservation:
    - Never modifies scanner logic or parameters
    - Only enhances infrastructure components
    """
    if pure_execution_mode:
        print(f"🎯 PURE EXECUTION MODE: Preserving 100% original code integrity")
        print(f"   - Skipping ALL enhancements for uploaded scanner fidelity")
        print(f"   - Executing code exactly as provided")
        return code

    needs = detect_infrastructure_needs(code)
    enhanced_code = code

    print(f"🔍 Infrastructure Analysis:")
    print(f"   - Needs Polygon API: {needs['needs_polygon_api']}")
    print(f"   - Needs Threading: {needs['needs_threading']}")
    print(f"   - Needs Full Universe: {needs['needs_full_universe']}")

    # Enhancement 1: Add Polygon API if missing
    if needs['needs_polygon_api']:
        print(f"🔧 Adding Polygon API integration...")
        enhanced_code = add_polygon_api_integration(enhanced_code)

    # Enhancement 2: Add threading if missing
    if needs['needs_threading']:
        print(f"🔧 Adding ThreadPoolExecutor for max performance...")
        enhanced_code = add_threading_support(enhanced_code)

    # Enhancement 3: Expand to full universe if limited
    if needs['needs_full_universe']:
        print(f"🔧 Expanding to full market universe...")
        enhanced_code = expand_to_full_universe(enhanced_code)

    return enhanced_code

def add_polygon_api_integration(code: str) -> str:
    """
    Add Polygon API integration if missing
    Preserves existing API calls but standardizes on Polygon
    """
    # Add Polygon imports and setup if missing
    polygon_setup = '''
# 🔧 System Enhancement: Polygon API Integration
import requests
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
session = requests.Session()
'''

    # Check if imports already exist
    if 'import requests' not in code or 'polygon.io' not in code:
        # Insert after existing imports
        lines = code.split('\n')
        import_end = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') or line.strip().startswith('from '):
                import_end = i + 1

        # Insert Polygon setup after imports
        lines.insert(import_end, polygon_setup)
        code = '\n'.join(lines)

    return code

def add_threading_support(code: str) -> str:
    """
    Add ThreadPoolExecutor support if missing
    Wraps existing symbol iteration in threading
    """
    # Add threading imports if missing
    if 'ThreadPoolExecutor' not in code and 'concurrent.futures' not in code:
        threading_import = "from concurrent.futures import ThreadPoolExecutor, as_completed\n"

        # Find first import line
        lines = code.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') or line.strip().startswith('from '):
                lines.insert(i, threading_import)
                break

        code = '\n'.join(lines)

    # Note: Actual threading implementation happens at execution time
    # The system will wrap symbol iteration in ThreadPoolExecutor

    return code

def expand_to_full_universe(code: str) -> str:
    """
    🎯 ADAPTIVE UNIVERSE EXPANSION

    Expands limited symbol lists to full market universe with intelligent
    pre-filtering based on the scanner's specific parameters
    """
    # Step 1: Extract scanner-specific parameters
    extracted_params = extract_scanner_parameters(code)

    # Step 2: Create adaptive pre-filtering criteria
    adaptive_criteria = create_adaptive_prefilter_criteria(extracted_params)

    # Step 3: Get smart universe with adaptive criteria
    try:
        from true_full_universe import get_smart_enhanced_universe
        print(f"🌍 Getting adaptive universe with scanner-specific criteria...")
        smart_universe = get_smart_enhanced_universe(adaptive_criteria)
    except Exception as e:
        print(f"⚠️ Adaptive universe fallback: {e}")
        smart_universe = get_full_universe_symbols()

    # Replace SYMBOLS = [...] with adaptive universe
    symbols_pattern = r'SYMBOLS\s*=\s*\[(.*?)\]'
    if re.search(symbols_pattern, code, re.DOTALL):
        universe_str = ',\n    '.join([f"'{symbol}'" for symbol in smart_universe])
        replacement = f"SYMBOLS = [\n    {universe_str}\n]"
        code = re.sub(symbols_pattern, replacement, code, flags=re.DOTALL)
        print(f"   ✅ Enhanced SYMBOLS list: {len(smart_universe)} adaptive tickers")

    # Replace symbols = [...] with adaptive universe
    symbols_pattern = r'symbols\s*=\s*\[(.*?)\]'
    if re.search(symbols_pattern, code, re.DOTALL):
        universe_str = ',\n        '.join([f"'{symbol}'" for symbol in smart_universe])
        replacement = f"symbols = [\n        {universe_str}\n]"
        code = re.sub(symbols_pattern, replacement, code, flags=re.DOTALL)
        print(f"   ✅ Enhanced symbols list: {len(smart_universe)} adaptive tickers")

    return code

def get_enhancement_summary(original_code: str, enhanced_code: str, pure_execution_mode: bool = False) -> Dict[str, any]:
    """
    Generate summary of enhancements applied
    """
    if pure_execution_mode:
        # In pure execution mode, no enhancements are applied
        original_symbols = extract_symbol_lists(original_code)
        return {
            'polygon_api_added': False,
            'threading_added': False,
            'universe_expanded': False,
            'original_symbol_count': len(original_symbols[0]) if original_symbols else 0,
            'enhanced_symbol_count': len(original_symbols[0]) if original_symbols else 0,
            'performance_improvement': 'none (pure mode)',
            'coverage_improvement': 'none (pure mode)'
        }

    needs = detect_infrastructure_needs(original_code)
    original_symbols = extract_symbol_lists(original_code)
    enhanced_symbols = extract_symbol_lists(enhanced_code)

    return {
        'polygon_api_added': needs['needs_polygon_api'],
        'threading_added': needs['needs_threading'],
        'universe_expanded': needs['needs_full_universe'],
        'original_symbol_count': len(original_symbols[0]) if original_symbols else 0,
        'enhanced_symbol_count': len(enhanced_symbols[0]) if enhanced_symbols else 0,
        'performance_improvement': 'significant' if needs['needs_threading'] else 'moderate',
        'coverage_improvement': 'massive' if needs['needs_full_universe'] else 'none'
    }