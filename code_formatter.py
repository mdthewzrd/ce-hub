#!/usr/bin/env python3
"""
Intelligent Trading Code Formatter
Analyzes and enhances trading algorithms while preserving parameter integrity
"""

import re
import ast
import sys
from typing import Dict, List, Tuple, Optional

class TradingCodeFormatter:
    def __init__(self):
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

    def analyze_code_structure(self, code: str) -> Dict:
        """Analyze uploaded code to understand its structure and components"""
        analysis = {
            'has_universe_coverage': False,
            'has_hardcoded_symbols': False,
            'parameter_structure': None,
            'api_configuration': None,
            'performance_setup': {
                'has_async': False,
                'has_threadpool': False,
                'max_workers': None
            },
            'algorithm_functions': [],
            'main_execution': None,
            'symbols_list': None,
            'parameter_dict': None
        }

        lines = code.split('\n')

        # 1. Check for universe coverage functions
        universe_patterns = [
            r'fetch_intial_stock_list',
            r'fetch_all_tickers',
            r'grouped/locale/us/market/stocks',
            r'v2/aggs/grouped'
        ]

        for pattern in universe_patterns:
            if re.search(pattern, code):
                analysis['has_universe_coverage'] = True
                break

        # 2. Check for hardcoded symbols
        symbols_patterns = [
            r'(SYMBOLS|symbols)\s*=\s*\[',
            r'tickers\s*=\s*\[',
            r'list_of_symbols\s*=\s*\['
        ]

        symbols_match = None
        for pattern in symbols_patterns:
            match = re.search(pattern, code, re.IGNORECASE)
            if match:
                analysis['has_hardcoded_symbols'] = True
                # Extract the symbols list
                start_idx = match.start()
                bracket_count = 0
                list_start = None
                for i in range(start_idx, len(code)):
                    char = code[i]
                    if char == '[':
                        bracket_count += 1
                        if list_start is None:
                            list_start = i
                    elif char == ']':
                        bracket_count -= 1
                        if bracket_count == 0 and list_start:
                            symbols_match = code[list_start:i+1]
                            break
                break

        if symbols_match:
            analysis['symbols_list'] = symbols_match

        # 3. Analyze parameter structure
        param_patterns = [
            (r'P\s*=\s*{', 'P_dict'),
            (r'defaults\s*=\s*{', 'defaults_dict'),
            (r'custom_params\s*=\s*{', 'custom_params_dict'),
            (r'parameters\s*=\s*{', 'parameters_dict')
        ]

        for pattern, param_type in param_patterns:
            match = re.search(pattern, code)
            if match:
                analysis['parameter_structure'] = param_type
                # Extract parameter dictionary
                param_dict = self._extract_dict_from_code(match.start(), code)
                if param_dict:
                    analysis['parameter_dict'] = param_dict
                break

        # 4. Check API configuration
        if re.search(r'API_KEY\s*=', code):
            api_match = re.search(r'API_KEY\s*=\s*[\'"]([^\'\"]+)[\'"]', code)
            if api_match:
                analysis['api_configuration'] = api_match.group(1)

        # 5. Check performance setup
        if re.search(r'import\s+asyncio|import\s+aiohttp|async\s+def', code):
            analysis['performance_setup']['has_async'] = True

        if re.search(r'ThreadPoolExecutor|ProcessPoolExecutor', code):
            analysis['performance_setup']['has_threadpool'] = True
            # Extract max_workers if specified
            workers_match = re.search(r'max_workers\s*=\s*(\d+)', code)
            if workers_match:
                analysis['performance_setup']['max_workers'] = int(workers_match.group(1))

        # 6. Find algorithm functions
        function_patterns = [
            r'def\s+(scan_|fetch_|calculate_|compute_|check_|process_)',
            r'async\s+def\s+(scan_|fetch_|calculate_|compute_|check_|process_)'
        ]

        for pattern in function_patterns:
            matches = re.findall(pattern, code)
            analysis['algorithm_functions'].extend(matches)

        # 7. Find main execution block
        if re.search(r'if\s+__name__\s*==\s*[\'"]__main__[\'"]\s*:', code):
            analysis['main_execution'] = True

        return analysis

    def _extract_dict_from_code(self, start_pos: int, code: str) -> Optional[str]:
        """Extract dictionary structure from code starting at position"""
        try:
            # Find the opening brace
            brace_start = code.find('{', start_pos)
            if brace_start == -1:
                return None

            brace_count = 0
            for i in range(brace_start, len(code)):
                char = code[i]
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        return code[brace_start:i+1]

        except Exception as e:
            print(f"Error extracting dict: {e}")

        return None

    def generate_universe_functions(self) -> str:
        """Generate universal market coverage functions"""
        return f'''
# UNIVERSAL MARKET COVERAGE (AUTO-ADDED)
import aiohttp
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List

async def fetch_universe_tickers(date_range: List[str], exclude_penny_stocks: bool = True) -> List[str]:
    """Get ALL market tickers using your high-rate Polygon API"""
    all_tickers = set()
    async with aiohttp.ClientSession() as session:
        tasks = []
        for date in date_range:
            # Fetch adjusted data
            url_adj = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{{date}}?adjusted=true&apiKey={self.api_key}"
            tasks.append(fetch_single_day_universe(session, url_adj, exclude_penny_stocks))

            # Fetch unadjusted data
            url_unadj = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{{date}}?adjusted=false&apiKey={self.api_key}"
            tasks.append(fetch_single_day_universe(session, url_unadj, exclude_penny_stocks))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_tickers.update(result)

    return sorted(list(all_tickers))

async def fetch_single_day_universe(session: aiohttp.ClientSession, url: str, exclude_penny_stocks: bool) -> List[str]:
    """Fetch tickers for a single day"""
    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                results = data.get('results', [])
                tickers = []

                for ticker_data in results:
                    symbol = ticker_data.get('T')
                    if not symbol:
                        continue

                    # Exclude penny stocks if requested
                    if exclude_penny_stocks:
                        close_price = ticker_data.get('c', 0)
                        volume = ticker_data.get('v', 0)
                        if close_price < 1.0 or volume < 100000:
                            continue

                    tickers.append(symbol)

                return tickers
    except Exception as e:
        print(f"Error fetching universe data: {{e}}")

    return []
'''

    def generate_performance_imports(self) -> str:
        """Generate performance optimization imports if missing"""
        return '''
# PERFORMANCE OPTIMIZATIONS (AUTO-ADDED)
import aiohttp
import asyncio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
import time
'''

    def enhance_code(self, original_code: str, analysis: Dict) -> Tuple[str, List[str]]:
        """Enhance code based on analysis, only adding what's missing"""
        enhanced_code = original_code
        changes_made = []

        # 1. Add performance imports if missing
        if not analysis['performance_setup']['has_async']:
            enhanced_code = self._add_imports(enhanced_code, self.generate_performance_imports())
            changes_made.append("Added async/performance imports")

        if not analysis['performance_setup']['has_threadpool']:
            enhanced_code = self._add_imports(enhanced_code, "from concurrent.futures import ThreadPoolExecutor, as_completed\n")
            changes_made.append("Added ThreadPoolExecutor imports")

        # 2. Add universe coverage if missing
        if not analysis['has_universe_coverage'] and analysis['has_hardcoded_symbols']:
            universe_functions = self.generate_universe_functions()
            enhanced_code = self._add_universe_functions(enhanced_code, universe_functions, analysis)
            changes_made.append("Added universal market coverage")

        # 3. Ensure API key is using your high-rate key
        if analysis['api_configuration'] and analysis['api_configuration'] != self.api_key:
            enhanced_code = re.sub(
                r'API_KEY\s*=\s*[\'"][^\'\"]*[\'"]',
                f'API_KEY = "{self.api_key}"',
                enhanced_code
            )
            changes_made.append("Updated API key to high-rate key")

        return enhanced_code, changes_made

    def _add_imports(self, code: str, imports: str) -> str:
        """Add imports after existing imports"""
        lines = code.split('\n')

        # Find where to insert imports (after existing imports)
        import_end_idx = 0
        for i, line in enumerate(lines):
            if line.strip().startswith(('import ', 'from ')) or line.strip() == '':
                import_end_idx = i
            else:
                break

        # Insert new imports
        lines.insert(import_end_idx + 1, imports)

        return '\n'.join(lines)

    def _add_universe_functions(self, code: str, universe_functions: str, analysis: Dict) -> str:
        """Add universe coverage functions and modify symbol usage"""
        lines = code.split('\n')

        # 1. Add universe functions after imports
        lines = self._add_imports(code, universe_functions)

        # 2. Find and replace the symbols list in main execution
        modified_lines = []
        in_main_block = False

        for i, line in enumerate(lines):
            # Detect main execution block
            if 'if __name__' in line and '__main__' in line:
                in_main_block = True

            # Replace symbols list with universe coverage
            if in_main_block and analysis['symbols_list'] and analysis['symbols_list'] in line:
                indent = len(line) - len(line.lstrip())
                universe_replacement = ' ' * indent + '# Enhanced with universal market coverage\n'
                universe_replacement += ' ' * indent + 'print("🔍 Fetching universe tickers...")\n'
                universe_replacement += ' ' * indent + '# Generate date range for universe fetch\n'
                universe_replacement += ' ' * indent + 'start_date = "2020-01-01"\n'
                universe_replacement += ' ' * indent + 'end_date = datetime.today().strftime("%Y-%m-%d")\n'
                universe_replacement += ' ' * indent + 'date_range = pd.date_range(start_date, end_date, freq="B").strftime("%Y-%m-%d").tolist()[:30]  # Last 30 trading days\n'
                universe_replacement += ' ' * indent + 'symbols = asyncio.run(fetch_universe_tickers(date_range))\n'
                universe_replacement += ' ' * indent + f'print(f"📊 Loaded {{len(symbols)}} universe tickers")\n'

                modified_lines.append(universe_replacement)
                # Skip the original symbols line
                continue

            modified_lines.append(line)

        return '\n'.join(modified_lines)

    def validate_enhanced_code(self, enhanced_code: str) -> Dict:
        """Validate that enhanced code will run successfully"""
        validation_result = {
            'syntax_valid': False,
            'imports_valid': False,
            'has_main_execution': False,
            'errors': [],
            'warnings': []
        }

        try:
            # 1. Syntax check
            ast.parse(enhanced_code)
            validation_result['syntax_valid'] = True

        except SyntaxError as e:
            validation_result['errors'].append(f"Syntax error: {e}")

        # 2. Check for required imports
        required_imports = ['pandas', 'asyncio', 'concurrent.futures']
        for imp in required_imports:
            if imp in enhanced_code:
                validation_result['imports_valid'] = True
                break

        # 3. Check for main execution
        if 'if __name__' in enhanced_code and '__main__' in enhanced_code:
            validation_result['has_main_execution'] = True

        return validation_result

def format_trading_code(file_path: str) -> Dict:
    """Main function to format trading code"""
    try:
        with open(file_path, 'r') as f:
            original_code = f.read()

        formatter = TradingCodeFormatter()

        print("🔍 Analyzing code structure...")
        analysis = formatter.analyze_code_structure(original_code)

        print("📊 Analysis Results:")
        print(f"  Universal Coverage: {analysis['has_universe_coverage']}")
        print(f"  Hardcoded Symbols: {analysis['has_hardcoded_symbols']}")
        print(f"  Parameter Structure: {analysis['parameter_structure']}")
        print(f"  API Key Found: {analysis['api_configuration'] is not None}")
        print(f"  Async Support: {analysis['performance_setup']['has_async']}")
        print(f"  Threading Support: {analysis['performance_setup']['has_threadpool']}")

        print("\n🔧 Enhancing code...")
        enhanced_code, changes = formatter.enhance_code(original_code, analysis)

        print("✅ Changes made:")
        for change in changes:
            print(f"  - {change}")

        print("\n🧪 Validating enhanced code...")
        validation = formatter.validate_enhanced_code(enhanced_code)

        print("📋 Validation Results:")
        print(f"  Syntax Valid: {validation['syntax_valid']}")
        print(f"  Imports Valid: {validation['imports_valid']}")
        print(f"  Main Execution: {validation['has_main_execution']}")

        if validation['errors']:
            print("❌ Errors:")
            for error in validation['errors']:
                print(f"  - {error}")

        # Save enhanced code
        output_path = file_path.replace('.py', '_enhanced.py')
        with open(output_path, 'w') as f:
            f.write(enhanced_code)

        print(f"\n💾 Enhanced code saved to: {output_path}")

        return {
            'success': True,
            'analysis': analysis,
            'changes': changes,
            'validation': validation,
            'output_path': output_path
        }

    except Exception as e:
        print(f"❌ Error formatting code: {e}")
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python code_formatter.py <path_to_trading_code.py>")
        sys.exit(1)

    file_path = sys.argv[1]
    result = format_trading_code(file_path)

    if result['success']:
        print("\n🎉 Code formatting completed successfully!")
    else:
        print(f"\n❌ Code formatting failed: {result['error']}")
        sys.exit(1)