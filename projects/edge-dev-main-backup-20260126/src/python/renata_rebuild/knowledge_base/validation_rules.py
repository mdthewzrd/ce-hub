"""
Validation Rules - Comprehensive Code Validation System

This module:
1. Defines all validation rules for EdgeDev code
2. Validates syntax, structure, and standards
3. Checks determinism requirements
4. Provides detailed error reporting
"""

import ast
import re
from typing import Dict, List, Any, Tuple, Optional
from pathlib import Path


class ValidationRules:
    """
    Complete validation system for EdgeDev standardized code

    Validation categories:
    - Syntax validation (compile check)
    - Structure validation (3-stage architecture)
    - Standards validation (7 mandatory standardizations)
    - Determinism validation (consistent output)
    - Best practices validation (code quality)
    """

    def __init__(self):
        """Initialize validation rules"""
        self.validation_results: Dict[str, Any] = {}

    def validate_all(self, code: str, filename: str = "scanner.py") -> Dict[str, Any]:
        """
        Run complete validation suite

        Returns dict with:
        - passed: bool - Overall validation status
        - syntax: dict - Syntax validation results
        - structure: dict - Structure validation results
        - standards: dict - Standards validation results
        - determinism: dict - Determinism validation results
        - best_practices: dict - Best practices validation results
        - errors: List[str] - All errors found
        - warnings: List[str] - All warnings found
        """
        results = {
            'passed': True,
            'syntax': self._validate_syntax(code, filename),
            'structure': self._validate_structure(code),
            'standards': self._validate_standards(code),
            'determinism': self._validate_determinism(code),
            'best_practices': self._validate_best_practices(code),
            'errors': [],
            'warnings': []
        }

        # Aggregate errors and warnings
        for category in ['syntax', 'structure', 'standards', 'determinism', 'best_practices']:
            if not results[category]['passed']:
                results['passed'] = False
                results['errors'].extend(results[category].get('errors', []))
                results['warnings'].extend(results[category].get('warnings', []))

        return results

    def _validate_syntax(self, code: str, filename: str) -> Dict[str, Any]:
        """Validate Python syntax"""
        result = {
            'passed': True,
            'errors': [],
            'warnings': []
        }

        # 1. Compile check
        try:
            ast.parse(code)
            result['checks'] = {
                'compilable': True,
                'ast_parse': 'Success'
            }
        except SyntaxError as e:
            result['passed'] = False
            result['errors'].append(f"Syntax error at line {e.lineno}: {e.msg}")
            result['checks'] = {
                'compilable': False,
                'ast_parse': f"Failed: {e.msg}"
            }
            return result

        # 2. Check for common syntax issues
        issues = []

        # Check for mixed tabs and spaces
        if '\t' in code and '    ' in code:
            issues.append("Mixed tabs and spaces (use spaces only)")

        # Check for lines too long
        lines = code.split('\n')
        long_lines = [i+1 for i, line in enumerate(lines) if len(line) > 100]
        if long_lines:
            result['warnings'].append(
                f"Lines too long (>100 chars): {long_lines[:5]}{'...' if len(long_lines) > 5 else ''}"
            )

        # Check for trailing whitespace
        trailing_lines = [i+1 for i, line in enumerate(lines) if line != line.rstrip()]
        if trailing_lines:
            result['warnings'].append(
                f"Trailing whitespace on lines: {trailing_lines[:5]}{'...' if len(trailing_lines) > 5 else ''}"
            )

        result['checks']['issues'] = issues

        return result

    def _validate_structure(self, code: str) -> Dict[str, Any]:
        """Validate 3-stage structure"""
        result = {
            'passed': True,
            'errors': [],
            'warnings': [],
            'checks': {}
        }

        try:
            tree = ast.parse(code)
        except:
            result['passed'] = False
            result['errors'].append("Cannot validate structure - syntax errors")
            return result

        # 1. Check for class definition
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        if not classes:
            result['passed'] = False
            result['errors'].append("No class definition found")
            return result

        main_class = classes[0]
        methods = [node.name for node in main_class.body if isinstance(node, ast.FunctionDef)]

        # 2. Check for required methods
        required_methods = {
            'get_trading_dates': 'Generate trading date range',
            'fetch_all_grouped_data': 'Fetch grouped market data',
            'apply_smart_filters': 'Apply D0 parameter-based filtering',
            'compute_full_features': 'Compute all features and indicators',
            'detect_patterns': 'Detect trading patterns',
            'execute': 'Main execution method'
        }

        missing_methods = []
        for method, purpose in required_methods.items():
            if method not in methods:
                missing_methods.append(f"{method} ({purpose})")

        result['checks']['required_methods'] = {
            'found': methods,
            'missing': missing_methods,
            'all_present': len(missing_methods) == 0
        }

        if missing_methods:
            result['passed'] = False
            result['errors'].append(f"Missing required methods: {', '.join(missing_methods)}")

        # 3. Check for __init__ method
        has_init = '__init__' in methods
        result['checks']['has_init'] = has_init
        if not has_init:
            result['warnings'].append("No __init__ method found")

        # 4. Check for 3-stage structure in execute method
        execute_node = next(
            (node for node in main_class.body if isinstance(node, ast.FunctionDef) and node.name == 'execute'),
            None
        )

        if execute_node:
            execute_code = ast.get_source_segment(code, execute_node) or ""

            stages = {
                'stage1_grouped_fetch': 'fetch_all_grouped_data' in execute_code,
                'stage2_smart_filters': 'apply_smart_filters' in execute_code,
                'stage3_full_features': 'compute_full_features' in execute_code
            }

            result['checks']['three_stage_structure'] = stages

            if not all(stages.values()):
                missing = [k for k, v in stages.items() if not v]
                result['warnings'].append(f"3-stage structure incomplete: {missing}")
        else:
            result['warnings'].append("Cannot validate 3-stage structure - no execute method")

        return result

    def _validate_standards(self, code: str) -> Dict[str, Any]:
        """Validate 7 mandatory EdgeDev standardizations"""
        result = {
            'passed': True,
            'errors': [],
            'warnings': [],
            'checks': {}
        }

        # Define all 7 standardizations
        standardizations = {
            'grouped_endpoint': {
                'check': 'grouped/locale/us/market/stocks' in code,
                'error': 'Must use Polygon grouped endpoint (/v2/aggs/grouped/locale/us/market/stocks/{date})',
                'category': 'data_fetching'
            },
            'thread_pooling': {
                'check': 'ThreadPoolExecutor' in code,
                'error': 'Must use ThreadPoolExecutor for parallel processing',
                'category': 'performance'
            },
            'polygon_api': {
                'check': 'self.api_key' in code or 'api_key' in code,
                'error': 'Must use self.api_key for Polygon authentication',
                'category': 'api_integration'
            },
            'smart_filtering': {
                'check': 'apply_smart_filters' in code and 'self.params' in code,
                'error': 'Must have apply_smart_filters method based on scanner parameters',
                'category': 'filtering'
            },
            'vectorized_operations': {
                'check': '.transform(' in code or '.groupby(' in code,
                'error': 'Must use vectorized operations (no .iterrows() loops)',
                'category': 'performance'
            },
            'connection_pooling': {
                'check': 'requests.Session()' in code,
                'error': 'Must use requests.Session() for connection pooling',
                'category': 'api_optimization'
            },
            'date_range_config': {
                'check': 'd0_start' in code and 'd0_end' in code,
                'error': 'Must accept d0_start and d0_end parameters in __init__',
                'category': 'configuration'
            }
        }

        # Check each standardization
        missing_standardizations = []

        for std_name, std_info in standardizations.items():
            passed = std_info['check']
            result['checks'][std_name] = {
                'passed': passed,
                'category': std_info['category']
            }

            if not passed:
                result['passed'] = False
                missing_standardizations.append(std_name)
                result['errors'].append(f"Missing standardization: {std_info['error']}")

        result['checks']['missing_standardizations'] = missing_standardizations

        # Additional checks
        # Check for .iterrows() (anti-pattern)
        if '.iterrows()' in code:
            result['passed'] = False
            result['errors'].append("Anti-pattern detected: .iterrows() - use vectorized operations instead")

        # Check for hardcoded API keys
        if re.search(r'api_key\s*=\s*["\'][^"\']+["\']', code):
            result['warnings'].append("Possible hardcoded API key detected")

        return result

    def _validate_determinism(self, code: str) -> Dict[str, Any]:
        """Validate determinism requirements"""
        result = {
            'passed': True,
            'errors': [],
            'warnings': [],
            'checks': {}
        }

        # 1. Check for non-deterministic functions
        non_deterministic = [
            ('random.random', 'random module usage'),
            ('time.time()', 'system time dependency'),
            ('datetime.now()', 'system datetime dependency'),
            ('uuid.uuid4', 'UUID generation')
        ]

        found_non_deterministic = []
        for pattern, desc in non_deterministic:
            if pattern in code:
                found_non_deterministic.append(desc)
                result['warnings'].append(f"Non-deterministic code: {desc}")

        result['checks']['non_deterministic'] = found_non_deterministic

        # 2. Check for proper parameter handling
        if 'self.params' not in code:
            result['warnings'].append("No self.params found - may affect determinism")

        # 3. Check for external dependencies
        external_patterns = [
            'requests.get(',
            'urllib.request',
            'http.client'
        ]

        has_external = any(pattern in code for pattern in external_patterns)
        result['checks']['external_dependencies'] = has_external

        # 4. Check for state management
        has_state = any(pattern in code for pattern in ['self.state', 'self.cache', 'self.memory'])
        result['checks']['state_management'] = has_state

        if has_state:
            result['warnings'].append("State management detected - may affect determinism")

        # Determinism requires all standardizations
        # If any standardization is missing, determinism is compromised
        mandatory_for_determinism = [
            'grouped_endpoint',
            'vectorized_operations',
            'smart_filtering'
        ]

        missing = []
        for std in mandatory_for_determinism:
            if std == 'grouped_endpoint' and 'grouped/locale/us/market/stocks' not in code:
                missing.append(std)
            elif std == 'vectorized_operations' and '.transform(' not in code:
                missing.append(std)
            elif std == 'smart_filtering' and 'apply_smart_filters' not in code:
                missing.append(std)

        if missing:
            result['passed'] = False
            result['errors'].append(f"Determinism compromised: Missing {', '.join(missing)}")
            result['checks']['determinism_risk'] = 'HIGH'
        else:
            result['checks']['determinism_risk'] = 'LOW'

        return result

    def _validate_best_practices(self, code: str) -> Dict[str, Any]:
        """Validate code quality best practices"""
        result = {
            'passed': True,
            'errors': [],
            'warnings': [],
            'checks': {}
        }

        try:
            tree = ast.parse(code)
        except:
            return result

        # 1. Check for docstrings
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        functions = [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]

        has_class_docstring = any(ast.get_docstring(node) for node in classes)
        has_function_docstrings = sum(1 for f in functions if ast.get_docstring(f))

        result['checks']['documentation'] = {
            'class_docstring': has_class_docstring,
            'function_docstrings': has_function_docstrings,
            'total_functions': len(functions)
        }

        if not has_class_docstring:
            result['warnings'].append("No class docstring found")

        # 2. Check for type hints
        has_type_hints = any(
            node.returns for node in functions
            if isinstance(node, ast.FunctionDef)
        )

        result['checks']['type_hints'] = has_type_hints
        if not has_type_hints:
            result['warnings'].append("No type hints found")

        # 3. Check for error handling
        has_try_except = 'try:' in code and 'except' in code
        result['checks']['error_handling'] = has_try_except
        if not has_try_except:
            result['warnings'].append("No error handling (try/except) found")

        # 4. Check for constants
        has_constants = bool(re.search(r'[A-Z_]{2,}\s*=', code))
        result['checks']['constants'] = has_constants

        # 5. Check for proper naming
        # Classes should be PascalCase
        class_names = [node.name for node in classes]
        bad_class_names = [n for n in class_names if not n[0].isupper() or '_' in n]

        if bad_class_names:
            result['warnings'].append(f"Class names should be PascalCase: {bad_class_names}")

        # Functions/methods should be snake_case
        function_names = [node.name for node in functions]
        bad_function_names = [n for n in function_names if n[0].isupper() or '-' in n]

        if bad_function_names:
            result['warnings'].append(f"Function names should be snake_case: {bad_function_names[:5]}")

        result['checks']['naming_conventions'] = {
            'classes': len(bad_class_names) == 0,
            'functions': len(bad_function_names) == 0
        }

        return result

    def get_validation_report(self, results: Dict[str, Any]) -> str:
        """
        Generate human-readable validation report

        Args:
            results: Validation results from validate_all()

        Returns:
            Formatted report string
        """
        report = []
        report.append("=" * 70)
        report.append("VALIDATION REPORT")
        report.append("=" * 70)

        # Overall status
        status = "✅ PASSED" if results['passed'] else "❌ FAILED"
        report.append(f"\nOverall Status: {status}")
        report.append(f"Errors: {len(results['errors'])}")
        report.append(f"Warnings: {len(results['warnings'])}")

        # Category results
        for category in ['syntax', 'structure', 'standards', 'determinism', 'best_practices']:
            cat_result = results[category]
            cat_status = "✅" if cat_result['passed'] else "❌"
            report.append(f"\n{category.replace('_', ' ').title()}: {cat_status}")

            if cat_result.get('checks'):
                for check, value in cat_result['checks'].items():
                    check_status = "✅" if value is True else "❌" if value is False else "⚠️"
                    if isinstance(value, dict):
                        report.append(f"  {check_status} {check}")
                        for k, v in value.items():
                            report.append(f"      {k}: {v}")
                    elif isinstance(value, list):
                        if value:
                            report.append(f"  {check_status} {check}: {value}")
                    else:
                        report.append(f"  {check_status} {check}: {value}")

        # Errors and warnings
        if results['errors']:
            report.append("\n" + "=" * 70)
            report.append("ERRORS")
            report.append("=" * 70)
            for i, error in enumerate(results['errors'], 1):
                report.append(f"{i}. {error}")

        if results['warnings']:
            report.append("\n" + "=" * 70)
            report.append("WARNINGS")
            report.append("=" * 70)
            for i, warning in enumerate(results['warnings'], 1):
                report.append(f"{i}. {warning}")

        report.append("\n" + "=" * 70)

        return "\n".join(report)


# Test the validation rules
if __name__ == "__main__":
    validator = ValidationRules()

    # Test with simple code
    test_code = """
import pandas as pd
import requests

class TestScanner:
    def __init__(self, api_key, d0_start, d0_end):
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end

    def get_trading_dates(self):
        return []

    def fetch_all_grouped_data(self):
        return pd.DataFrame()

    def apply_smart_filters(self, df):
        return df

    def compute_full_features(self, df):
        return df

    def detect_patterns(self, df):
        return df

    def execute(self):
        df = self.fetch_all_grouped_data()
        df = self.apply_smart_filters(df)
        df = self.compute_full_features(df)
        return self.detect_patterns(df)
"""

    results = validator.validate_all(test_code, "test.py")
    report = validator.get_validation_report(results)
    print(report)
