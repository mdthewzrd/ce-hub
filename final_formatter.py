#!/usr/bin/env python3
"""
Final Trading Code Formatter
Robust formatter with better symbol replacement logic
"""

import re
import ast
import sys
from typing import Dict, List, Optional

class FinalTradingFormatter:
    def __init__(self):
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

    def analyze_and_enhance(self, file_path: str) -> Dict:
        """Complete analysis and enhancement process"""
        with open(file_path, 'r') as f:
            original_code = f.read()

        lines = original_code.split('\n')
        enhanced_lines = lines.copy()
        changes_made = []

        # 1. Add missing imports
        imports_to_add = []
        if 'import aiohttp' not in original_code:
            imports_to_add.append('import aiohttp')
        if 'import asyncio' not in original_code:
            imports_to_add.append('import asyncio')
        if 'from typing import' not in original_code:
            imports_to_add.append('from typing import List')

        if imports_to_add:
            # Find insertion point after existing imports
            insert_idx = 0
            for i, line in enumerate(lines):
                if not line.strip() or line.strip().startswith(('import ', 'from ')):
                    insert_idx = i
                else:
                    break

            enhanced_lines.insert(insert_idx + 1, '')
            enhanced_lines.insert(insert_idx + 2, '# Enhanced imports for universal market coverage')
            for imp in imports_to_add:
                enhanced_lines.insert(insert_idx + 3, imp)
            enhanced_lines.insert(insert_idx + 3 + len(imports_to_add), '')
            changes_made.append("Added missing imports (aiohttp, asyncio, typing)")

        # 2. Replace hardcoded symbols list with universal coverage
        symbols_replaced = self._replace_symbols_with_universe(enhanced_lines)
        if symbols_replaced:
            changes_made.append("Replaced hardcoded symbols with universal market coverage")

        # 3. Add universe coverage functions at the end if needed
        if symbols_replaced:
            universe_functions = self._generate_universe_functions()
            enhanced_lines.extend(['', ''] + universe_functions)
            changes_made.append("Added universal market coverage functions")

        # 4. Ensure correct API key
        api_key_fixed = self._ensure_api_key(enhanced_lines)
        if api_key_fixed:
            changes_made.append("Updated API key to high-rate key")

        enhanced_code = '\n'.join(enhanced_lines)

        # 5. Validate syntax
        syntax_valid = self._validate_syntax(enhanced_code)

        # 6. Save enhanced code
        output_path = file_path.replace('.py', '_enhanced.py')
        with open(output_path, 'w') as f:
            f.write(enhanced_code)

        return {
            'success': syntax_valid,
            'changes_made': changes_made,
            'output_path': output_path,
            'syntax_valid': syntax_valid,
            'error': None if syntax_valid else "Syntax validation failed"
        }

    def _replace_symbols_with_universe(self, lines: List[str]) -> bool:
        """Replace hardcoded symbols list with universal market coverage"""
        symbols_patterns = [
            r'SYMBOLS\s*=\s*\[',
            r'symbols\s*=\s*\['
        ]

        # Find the main execution block and symbols usage
        in_main_execution = False
        symbols_usage_found = False

        for i, line in enumerate(lines):
            if 'if __name__' in line and '__main__' in line:
                in_main_execution = True
                continue

            if in_main_execution:
                # Look for ThreadPoolExecutor or similar parallel execution that uses symbols
                if any(pattern in line for pattern in ['ThreadPoolExecutor', 'for s in symbols', 'for symbol in symbols']):
                    symbols_usage_found = True
                    break

        if not symbols_usage_found:
            return False

        # Find and replace the symbols list definition and its usage
        enhanced_lines = lines.copy()
        symbols_replaced = False

        for i, line in enumerate(enhanced_lines):
            # Find symbols list definition
            if any(re.match(pattern, line) for pattern in symbols_patterns):
                # Replace with universal market coverage setup
                indent = len(line) - len(line.lstrip())

                replacement = [
                    f'{" " * indent}# Universal market coverage - dynamically fetch all market tickers',
                    f'{" " * indent}def get_universe_symbols():',
                    f'{" " * (indent + 4)}import asyncio',
                    f'{" " * (indent + 4)}import aiohttp',
                    f'{" " * (indent + 4)}from datetime import datetime, timedelta',
                    f'{" " * (indent + 4)}',
                    f'{" " * (indent + 4)}async def _fetch_universe():',
                    f'{" " * (indent + 8)}API_KEY = "{self.api_key}"',
                    f'{" " * (indent + 8)}all_tickers = set()',
                    f'{" " * (indent + 8)}',
                    f'{" " * (indent + 8)}# Get recent trading days',
                    f'{" " * (indent + 8)}end_date = datetime.now()',
                    f'{" " * (indent + 8)}dates = []',
                    f'{" " * (indent + 8)}for i in range(5):',
                    f'{" " * (indent + 8)}    date = end_date - timedelta(days=i)',
                    f'{" " * (indent + 8)}    if date.weekday() < 5:  # Weekdays only',
                    f'{" " * (indent + 8)}        dates.append(date.strftime("%Y-%m-%d"))',
                    f'{" " * (indent + 8)}    if len(dates) >= 3:',
                    f'{" " * (indent + 8)}        break',
                    f'{" " * (indent + 8)}',
                    f'{" " * (indent + 8)}async with aiohttp.ClientSession() as session:',
                    f'{" " * (indent + 12)}tasks = []',
                    f'{" " * (indent + 12)}for date in dates:',
                    f'{" " * (indent + 12)}    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/" + date + f"?adjusted=true&apiKey={{API_KEY}}"',
                    f'{" " * (indent + 12)}    tasks.append(session.get(url))',
                    f'{" " * (indent + 12)}',
                    f'{" " * (indent + 12)}responses = await asyncio.gather(*tasks)',
                    f'{" " * (indent + 12)}for response in responses:',
                    f'{" " * (indent + 12)}    if response.status == 200:',
                    f'{" " * (indent + 12)}        data = await response.json()',
                    f'{" " * (indent + 12)}        for ticker_data in data.get("results", []):',
                    f'{" " * (indent + 12)}            symbol = ticker_data.get("T")',
                    f'{" " * (indent + 12)}            if symbol and ticker_data.get("c", 0) > 1.0:  # Exclude penny stocks',
                    f'{" " * (indent + 12)}                all_tickers.add(symbol)',
                    f'{" " * (indent + 8)}',
                    f'{" " * (indent + 8)}return sorted(list(all_tickers))',
                    f'{" " * (indent + 8)}',
                    f'{" " * (indent + 4)}return asyncio.run(_fetch_universe())',
                    f'{" " * indent}',
                    f'{" " * indent}# Get universe symbols at runtime',
                    f'{" " * indent}symbols = get_universe_symbols()',
                    f'{" " * indent}print(f"🔍 Loaded {{len(symbols)}} universe tickers")'
                ]

                # Replace the original symbols list
                # Find the end of the symbols list
                list_end = i + 1
                bracket_count = 0
                in_list = False

                for j in range(i, len(enhanced_lines)):
                    line_content = enhanced_lines[j]
                    for char in line_content:
                        if char == '[':
                            bracket_count += 1
                            in_list = True
                        elif char == ']':
                            bracket_count -= 1
                    if in_list and bracket_count == 0:
                        list_end = j + 1
                        break

                # Replace the symbols list with our universal coverage
                enhanced_lines = enhanced_lines[:i] + replacement + enhanced_lines[list_end:]
                symbols_replaced = True
                break

        if symbols_replaced:
            lines[:] = enhanced_lines

        return symbols_replaced

    def _ensure_api_key(self, lines: List[str]) -> bool:
        """Ensure the correct API key is used"""
        for i, line in enumerate(lines):
            if 'API_KEY' in line and '=' in line and not line.strip().startswith('#'):
                if self.api_key not in line:
                    lines[i] = f'API_KEY = "{self.api_key}"  # Your high-rate key'
                    return True
        return False

    def _generate_universe_functions(self) -> List[str]:
        """Generate additional universe coverage functions if needed"""
        return [
            '# Additional universe functions for edge cases',
            'async def validate_symbol_data(symbols: List[str]) -> List[str]:',
            '    """Validate that symbols have sufficient data"""',
            '    valid_symbols = []',
            '    async with aiohttp.ClientSession() as session:',
            '        for symbol in symbols[:100]:  # Limit for testing',
            '            try:',
            '                url = f"https://api.polygon.io/v3/reference/tickers/{symbol}?apiKey={self.api_key}"',
            '                async with session.get(url) as response:',
            '                    if response.status == 200:',
            '                        data = await response.json()',
            '                        if data.get("results"):',
            '                            valid_symbols.append(symbol)',
            '            except Exception as e:',
            '                print(f"Error validating {symbol}: {e}")',
            '    return valid_symbols'
        ]

    def _validate_syntax(self, code: str) -> bool:
        """Validate Python syntax"""
        try:
            ast.parse(code)
            return True
        except SyntaxError:
            return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python final_formatter.py <trading_code.py>")
        sys.exit(1)

    file_path = sys.argv[1]
    print(f"🔧 Enhancing {file_path}...")

    formatter = FinalTradingFormatter()
    result = formatter.analyze_and_enhance(file_path)

    print(f"\n✅ Enhancement completed!")
    print(f"📋 Changes made: {', '.join(result['changes_made'])}")
    print(f"💾 Output saved to: {result['output_path']}")

    if result['syntax_valid']:
        print("🧪 Syntax validation: PASSED")
        print("\n🎉 Code is ready for terminal execution!")
    else:
        print("🧪 Syntax validation: FAILED")
        print(f"❌ Error: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main()