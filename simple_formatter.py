#!/usr/bin/env python3
"""
Simplified Trading Code Formatter
Focus on core functionality without complex string manipulation
"""

import re
import ast
import sys
from typing import Dict, List

class SimpleTradingFormatter:
    def __init__(self):
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

    def analyze_code(self, file_path: str) -> Dict:
        """Analyze trading code structure"""
        with open(file_path, 'r') as f:
            code = f.read()

        analysis = {
            'has_async': 'async' in code and 'await' in code,
            'has_aiohttp': 'aiohttp' in code,
            'has_threadpool': 'ThreadPoolExecutor' in code,
            'has_universe': 'grouped/locale/us/market' in code,
            'has_hardcoded_symbols': self._find_symbols_list(code) is not None,
            'api_key_correct': self._check_api_key(code),
            'symbols_list': self._find_symbols_list(code),
            'original_lines': code.split('\n')
        }

        return analysis

    def _find_symbols_list(self, code: str) -> str:
        """Find hardcoded symbols list"""
        patterns = [
            r'SYMBOLS\s*=\s*\[(.*?)\]',
            r'symbols\s*=\s*\[(.*?)\]'
        ]

        for pattern in patterns:
            match = re.search(pattern, code, re.DOTALL)
            if match:
                return match.group(0)
        return None

    def _check_api_key(self, code: str) -> bool:
        """Check if API key matches your high-rate key"""
        match = re.search(r'API_KEY\s*=\s*[\'"]([^\'\"]+)[\'"]', code)
        if match:
            return match.group(1) == self.api_key
        return False

    def enhance_code(self, analysis: Dict) -> str:
        """Enhance code based on analysis"""
        lines = analysis['original_lines'].copy()
        enhanced_lines = []

        # 1. Add missing imports at the top
        import_section = []
        if not analysis['has_aiohttp']:
            import_section.append('import aiohttp')
        if not analysis['has_async']:
            import_section.append('import asyncio')
        if not analysis['has_threadpool']:
            import_section.append('from concurrent.futures import ThreadPoolExecutor, as_completed')

        # Add imports after existing imports
        if import_section:
            # Find where to insert imports
            insert_pos = 0
            for i, line in enumerate(lines):
                if line.strip().startswith(('import ', 'from ')) or line.strip() == '':
                    insert_pos = i
                else:
                    break

            # Insert new imports
            lines.insert(insert_pos + 1, '')
            lines.insert(insert_pos + 2, '# Enhanced imports for universal market coverage')
            for imp in import_section:
                lines.insert(insert_pos + 3, imp)
            lines.insert(insert_pos + 3 + len(import_section), '')

        # 2. Add universe coverage if missing
        if not analysis['has_universe'] and analysis['has_hardcoded_symbols']:
            lines.extend([
                '',
                '# Universal market coverage functions',
                'async def fetch_universe_tickers(dates: List[str]):',
                '    """Get all market tickers for given dates"""',
                '    import aiohttp',
                '    import pandas as pd',
                f'    API_KEY = "{self.api_key}"',
                '    all_tickers = set()',
                '    ',
                '    async with aiohttp.ClientSession() as session:',
                '        tasks = []',
                '        for date in dates[:5]:  # Last 5 trading days',
                '            url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted=true&apiKey={API_KEY}"',
                '            tasks.append(session.get(url))',
                '        ',
                '        responses = await asyncio.gather(*tasks)',
                '        for response in responses:',
                '            if response.status == 200:',
                '                data = await response.json()',
                '                for ticker_data in data.get("results", []):',
                '                    symbol = ticker_data.get("T")',
                '                    if symbol and ticker_data.get("c", 0) > 1.0:  # Exclude penny stocks',
                '                        all_tickers.add(symbol)',
                '    ',
                '    return sorted(list(all_tickers))',
                ''
            ])

        # 3. Replace symbols list usage in main execution
        if analysis['symbols_list']:
            main_replacement = [
                '    # Enhanced with universal market coverage',
                '    print("🔍 Fetching universe tickers...")',
                '    import pandas as pd',
                '    from datetime import datetime, timedelta',
                '    ',
                '    # Generate recent trading dates',
                '    end_date = datetime.now()',
                '    dates = []',
                '    for i in range(5):',
                '        date = end_date - timedelta(days=i)',
                '        if date.weekday() < 5:  # Weekdays only',
                '            dates.append(date.strftime("%Y-%m-%d"))',
                '        if len(dates) >= 3:',
                '            break',
                '    ',
                '    symbols = asyncio.run(fetch_universe_tickers(dates))',
                '    print(f"📊 Loaded {len(symbols)} universe tickers")',
                '    '
            ]

            in_main = False
            for i, line in enumerate(lines):
                if 'if __name__' in line and '__main__' in line:
                    in_main = True
                elif in_main and analysis['symbols_list'] in line:
                    # Replace the symbols assignment
                    indent = len(line) - len(line.lstrip())
                    replacement_lines = []
                    for replacement_line in main_replacement:
                        replacement_lines.append(' ' * indent + replacement_line)

                    # Replace the line with multiple lines
                    lines = lines[:i] + replacement_lines + lines[i+1:]
                    break

        # 4. Fix API key if needed
        if not analysis['api_key_correct']:
            for i, line in enumerate(lines):
                if 'API_KEY' in line and '=' in line and not line.strip().startswith('#'):
                    lines[i] = f'API_KEY = "{self.api_key}"  # Your high-rate key'
                    break

        return '\n'.join(lines)

    def validate_syntax(self, code: str) -> Dict:
        """Validate code syntax"""
        try:
            ast.parse(code)
            return {'valid': True, 'error': None}
        except SyntaxError as e:
            return {'valid': False, 'error': str(e)}

def format_file(file_path: str):
    """Format a trading code file"""
    print(f"🔍 Analyzing {file_path}...")

    formatter = SimpleTradingFormatter()
    analysis = formatter.analyze_code(file_path)

    print("📊 Analysis Results:")
    print(f"  Async Support: {analysis['has_async']}")
    print(f"  Aiohttp Import: {analysis['has_aiohttp']}")
    print(f"  Threading Support: {analysis['has_threadpool']}")
    print(f"  Universe Coverage: {analysis['has_universe']}")
    print(f"  Hardcoded Symbols: {analysis['has_hardcoded_symbols']}")
    print(f"  API Key Correct: {analysis['api_key_correct']}")

    if analysis['symbols_list']:
        print(f"  Symbols List: Found")

    print("\n🔧 Enhancing code...")
    enhanced_code = formatter.enhance_code(analysis)

    print("🧪 Validating syntax...")
    validation = formatter.validate_syntax(enhanced_code)

    if validation['valid']:
        print("✅ Syntax validation passed")

        # Save enhanced code
        output_path = file_path.replace('.py', '_enhanced.py')
        with open(output_path, 'w') as f:
            f.write(enhanced_code)

        print(f"💾 Enhanced code saved to: {output_path}")
        return True
    else:
        print(f"❌ Syntax error: {validation['error']}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python simple_formatter.py <trading_code.py>")
        sys.exit(1)

    file_path = sys.argv[1]
    success = format_file(file_path)

    if success:
        print("\n🎉 Code enhancement completed successfully!")
    else:
        print("\n❌ Code enhancement failed")
        sys.exit(1)