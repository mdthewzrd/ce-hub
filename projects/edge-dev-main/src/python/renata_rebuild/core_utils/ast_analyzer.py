"""
AST Analyzer - Deep AST Analysis for Pattern Detection

This module:
1. Analyzes AST for code patterns
2. Detects anti-patterns
3. Identifies standardization opportunities
4. Provides code quality metrics
"""

import ast
import re
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict


class ASTAnalyzer:
    """
    Deep AST analysis for pattern detection

    Analyzes:
    - Loop patterns (for, while, list comprehensions)
    - Function call patterns
    - Data manipulation patterns
    - API integration patterns
    - Standardization compliance
    """

    def __init__(self):
        """Initialize AST analyzer"""
        self.current_tree = None
        self.current_code = None

    def analyze(self, code: str) -> Dict[str, Any]:
        """
        Perform complete AST analysis

        Args:
            code: Python code string

        Returns:
            Analysis results dict
        """
        self.current_code = code
        self.current_tree = ast.parse(code)

        return {
            'loops': self._analyze_loops(),
            'function_calls': self._analyze_function_calls(),
            'data_operations': self._analyze_data_operations(),
            'patterns': self._detect_patterns(),
            'anti_patterns': self._detect_anti_patterns(),
            'standardization': self._check_standardization_patterns(),
            'quality_metrics': self._calculate_quality_metrics()
        }

    def _analyze_loops(self) -> Dict[str, Any]:
        """Analyze loop patterns"""
        for_loops = []
        while_loops = []
        list_comps = []
        dict_comps = []

        for node in ast.walk(self.current_tree):
            if isinstance(node, ast.For):
                for_loops.append({
                    'lineno': node.lineno,
                    'target': ast.unparse(node.target),
                    'iter': ast.unparse(node.iter),
                    'has_orelse': bool(node.orelse)
                })
            elif isinstance(node, ast.While):
                while_loops.append({
                    'lineno': node.lineno,
                    'test': ast.unparse(node.test)
                })
            elif isinstance(node, ast.ListComp):
                list_comps.append({
                    'lineno': node.lineno
                })
            elif isinstance(node, ast.DictComp):
                dict_comps.append({
                    'lineno': node.lineno
                })

        # Check for problematic patterns
        iterrows_loops = []
        for loop in for_loops:
            if '.iterrows()' in loop['iter']:
                iterrows_loops.append(loop)

        return {
            'for_loops': for_loops,
            'while_loops': while_loops,
            'list_comprehensions': list_comps,
            'dict_comprehensions': dict_comps,
            'has_iterrows': len(iterrows_loops) > 0,
            'iterrows_count': len(iterrows_loops),
            'vectorizable': len(iterrows_loops) > 0 or len(for_loops) > 3
        }

    def _analyze_function_calls(self) -> Dict[str, Any]:
        """Analyze function call patterns"""
        calls = defaultdict(list)

        for node in ast.walk(self.current_tree):
            if isinstance(node, ast.Call):
                func_name = self._get_call_name(node)
                calls[func_name].append({
                    'lineno': node.lineno,
                    'args': len(node.args)
                })

        # Categorize calls
        categories = {
            'pandas': [],
            'requests': [],
            'dataframe': [],
            'api': []
        }

        for func_name in calls.keys():
            if 'pd.' in func_name or 'pandas.' in func_name:
                categories['pandas'].append(func_name)
            elif 'requests.' in func_name or 'session.' in func_name.lower():
                categories['requests'].append(func_name)
            elif '.groupby(' in func_name or '.transform(' in func_name:
                categories['dataframe'].append(func_name)
            elif 'get(' in func_name or 'post(' in func_name:
                categories['api'].append(func_name)

        return {
            'all_calls': dict(calls),
            'categories': categories,
            'total_unique_calls': len(calls),
            'pandas_operations': len(categories['pandas']),
            'api_operations': len(categories['requests'])
        }

    def _analyze_data_operations(self) -> Dict[str, Any]:
        """Analyze data manipulation patterns"""
        operations = {
            'groupby': [],
            'transform': [],
            'apply': [],
            'iterrows': [],
            'itertuples': [],
            'vectorized': [],
            'loop_based': []
        }

        for node in ast.walk(self.current_tree):
            if isinstance(node, ast.Call):
                func_name = self._get_call_name(node)

                if '.groupby(' in func_name:
                    operations['groupby'].append({'lineno': node.lineno})
                elif '.transform(' in func_name:
                    operations['transform'].append({'lineno': node.lineno})
                elif '.apply(' in func_name:
                    operations['apply'].append({'lineno': node.lineno})
                elif '.iterrows(' in func_name:
                    operations['iterrows'].append({'lineno': node.lineno})
                elif '.itertuples(' in func_name:
                    operations['itertuples'].append({'lineno': node.lineno})

        # Categorize as vectorized or loop-based
        if operations['groupby'] or operations['transform']:
            operations['vectorized'] = operations['groupby'] + operations['transform']

        if operations['iterrows'] or operations['itertuples'] or operations['apply']:
            operations['loop_based'] = operations['iterrows'] + operations['itertuples']

        return operations

    def _detect_patterns(self) -> Dict[str, Any]:
        """Detect common patterns in code"""
        patterns = {
            'api_integration': False,
            'data_fetching': False,
            'parallel_processing': False,
            'error_handling': False,
            'logging': False,
            'caching': False
        }

        code_lower = self.current_code.lower()

        # API integration
        if 'requests.get(' in self.current_code or 'session.get(' in self.current_code.lower():
            patterns['api_integration'] = True

        # Data fetching
        if 'fetch' in code_lower or 'get_data' in code_lower:
            patterns['data_fetching'] = True

        # Parallel processing
        if 'ThreadPoolExecutor' in self.current_code or 'ProcessPoolExecutor' in self.current_code:
            patterns['parallel_processing'] = True

        # Error handling
        if 'try:' in self.current_code and 'except' in self.current_code:
            patterns['error_handling'] = True

        # Logging
        if 'print(' in self.current_code or 'logger.' in self.current_code or 'logging.' in self.current_code:
            patterns['logging'] = True

        # Caching
        if 'cache' in code_lower or '@lru_cache' in self.current_code:
            patterns['caching'] = True

        return patterns

    def _detect_anti_patterns(self) -> List[Dict[str, Any]]:
        """Detect anti-patterns and code smells"""
        anti_patterns = []

        # Check for .iterrows()
        if '.iterrows()' in self.current_code:
            anti_patterns.append({
                'type': 'performance',
                'severity': 'high',
                'pattern': 'iterrows()',
                'description': 'DataFrame.iterrows() is slow, use vectorized operations',
                'suggestion': 'Use df.groupby().transform() instead'
            })

        # Check for hardcoded API keys
        if re.search(r'api_key\s*=\s*["\'][^"\']+["\']', self.current_code):
            anti_patterns.append({
                'type': 'security',
                'severity': 'high',
                'pattern': 'hardcoded_api_key',
                'description': 'API key is hardcoded',
                'suggestion': 'Use environment variables or config files'
            })

        # Check for nested loops
        loops = [node for node in ast.walk(self.current_tree) if isinstance(node, ast.For)]
        if len(loops) > 2:
            # Check if nested
            for loop in loops:
                for inner_node in ast.walk(loop):
                    if isinstance(inner_node, ast.For) and inner_node != loop:
                        anti_patterns.append({
                            'type': 'performance',
                            'severity': 'medium',
                            'pattern': 'nested_loops',
                            'description': 'Nested loops detected',
                            'suggestion': 'Consider vectorized operations or restructure'
                        })
                        break

        # Check for magic numbers
        if re.search(r'\b\d{3,}\b', self.current_code):
            anti_patterns.append({
                'type': 'readability',
                'severity': 'low',
                'pattern': 'magic_numbers',
                'description': 'Large numbers without context',
                'suggestion': 'Use named constants'
            })

        # Check for missing error handling in API calls
        has_api_calls = 'requests.get(' in self.current_code or 'session.get(' in self.current_code.lower()
        has_try_except = 'try:' in self.current_code and 'except' in self.current_code

        if has_api_calls and not has_try_except:
            anti_patterns.append({
                'type': 'reliability',
                'severity': 'medium',
                'pattern': 'no_error_handling',
                'description': 'API calls without error handling',
                'suggestion': 'Wrap API calls in try/except blocks'
            })

        return anti_patterns

    def _check_standardization_patterns(self) -> Dict[str, bool]:
        """Check for EdgeDev standardization patterns"""
        standardizations = {
            'grouped_endpoint': 'grouped/locale/us/market/stocks' in self.current_code,
            'thread_pooling': 'ThreadPoolExecutor' in self.current_code,
            'polygon_api': 'self.api_key' in self.current_code or 'api_key' in self.current_code,
            'smart_filtering': 'apply_smart_filters' in self.current_code,
            'vectorized_operations': '.transform(' in self.current_code or '.groupby(' in self.current_code,
            'connection_pooling': 'requests.Session()' in self.current_code,
            'date_range_config': 'd0_start' in self.current_code and 'd0_end' in self.current_code
        }

        return standardizations

    def _calculate_quality_metrics(self) -> Dict[str, Any]:
        """Calculate code quality metrics"""
        lines = self.current_code.split('\n')

        # Count lines
        total_lines = len(lines)
        code_lines = len([l for l in lines if l.strip() and not l.strip().startswith('#')])
        comment_lines = len([l for l in lines if l.strip().startswith('#')])
        blank_lines = len([l for l in lines if not l.strip()])

        # Count functions and classes
        classes = [n for n in ast.walk(self.current_tree) if isinstance(n, ast.ClassDef)]
        functions = [n for n in ast.walk(self.current_tree) if isinstance(n, ast.FunctionDef)]

        # Calculate complexity (cyclomatic complexity approximation)
        complexity = 1
        for node in ast.walk(self.current_tree):
            if isinstance(node, (ast.If, ast.For, ast.While, ast.Try)):
                complexity += 1

        return {
            'total_lines': total_lines,
            'code_lines': code_lines,
            'comment_lines': comment_lines,
            'blank_lines': blank_lines,
            'num_classes': len(classes),
            'num_functions': len(functions),
            'cyclomatic_complexity': complexity,
            'comment_ratio': comment_lines / code_lines if code_lines > 0 else 0
        }

    def _get_call_name(self, node: ast.Call) -> str:
        """Get function call name"""
        try:
            return ast.unparse(node.func)
        except:
            return ""

    def get_standardization_report(self, analysis: Dict[str, Any]) -> str:
        """Generate human-readable standardization report"""
        lines = []
        lines.append("=" * 70)
        lines.append("STANDARDIZATION ANALYSIS")
        lines.append("=" * 70)

        std_checks = analysis['standardization']
        missing = [k for k, v in std_checks.items() if not v]
        present = [k for k, v in std_checks.items() if v]

        lines.append(f"\n✅ Present Standardizations ({len(present)}/7):")
        for std in present:
            lines.append(f"  - {std}")

        lines.append(f"\n❌ Missing Standardizations ({len(missing)}/7):")
        for std in missing:
            lines.append(f"  - {std}")

        anti_patterns = analysis['anti_patterns']
        if anti_patterns:
            lines.append(f"\n⚠️ Anti-Patterns Detected ({len(anti_patterns)}):")
            for ap in anti_patterns:
                lines.append(f"  - [{ap['severity'].upper()}] {ap['pattern']}")
                lines.append(f"    {ap['suggestion']}")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the AST analyzer
if __name__ == "__main__":
    analyzer = ASTAnalyzer()

    test_code = """
import pandas as pd
import requests

class Scanner:
    def __init__(self, api_key):
        self.api_key = api_key  # Hardcoded - bad!
        self.session = requests.Session()

    def fetch_data(self):
        try:
            response = requests.get("https://api.example.com/data")
            return response.json()
        except:
            return None

    def process_data(self, df):
        result = []
        for index, row in df.iterrows():  # Anti-pattern!
            result.append(row['price'] * 1.1)
        return result
"""

    print("Testing ASTAnalyzer...\n")

    analysis = analyzer.analyze(test_code)

    print("Loop Analysis:")
    loops = analysis['loops']
    print(f"  For loops: {len(loops['for_loops'])}")
    print(f"  Has iterrows: {loops['has_iterrows']}")

    print("\nData Operations:")
    data_ops = analysis['data_operations']
    print(f"  Transform ops: {len(data_ops['transform'])}")
    print(f"  Iterrows ops: {len(data_ops['iterrows'])}")

    print("\nPatterns Detected:")
    patterns = analysis['patterns']
    for pattern, detected in patterns.items():
        if detected:
            print(f"  ✅ {pattern}")

    print("\nAnti-Patterns:")
    for ap in analysis['anti_patterns']:
        print(f"  - [{ap['severity']}] {ap['pattern']}")

    print("\nStandardization:")
    std = analysis['standardization']
    for check, passed in std.items():
        status = "✅" if passed else "❌"
        print(f"  {status} {check}")

    print("\n" + analyzer.get_standardization_report(analysis))
