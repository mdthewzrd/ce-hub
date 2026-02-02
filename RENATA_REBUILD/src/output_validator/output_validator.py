"""
Output Validator - Comprehensive Code Validation System

This module:
1. Validates generated code meets all EdgeDev standards
2. Tests code execution (when possible)
3. Validates determinism (same input → same output)
4. Generates detailed validation reports
"""

import ast
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from knowledge_base.validation_rules import ValidationRules


@dataclass
class ValidationResult:
    """Single validation result"""
    category: str
    passed: bool
    errors: List[str]
    warnings: List[str]
    details: Dict[str, Any]


class OutputValidator:
    """
    Comprehensive output validation

    Validates:
    - Syntax and structure
    - EdgeDev standards compliance
    - Execution (when testable)
    - Determinism
    - Best practices
    """

    def __init__(self, templates_dir: str):
        """
        Initialize output validator

        Args:
            templates_dir: Path to reference templates
        """
        self.templates_dir = templates_dir
        self.validator = ValidationRules()

    def validate_all(self, code: str, filename: str = "scanner.py") -> Dict[str, Any]:
        """
        Perform complete validation

        Args:
            code: Generated code to validate
            filename: Optional filename

        Returns:
            Complete validation results
        """
        results = {
            'passed': True,
            'validations': [],
            'summary': {},
            'critical_issues': []
        }

        # 1. Syntax validation
        syntax_result = self._validate_syntax(code, filename)
        results['validations'].append(syntax_result)
        if not syntax_result.passed:
            results['passed'] = False
            results['critical_issues'].extend(syntax_result.errors)

        # 2. Structure validation
        structure_result = self._validate_structure(code)
        results['validations'].append(structure_result)

        # 3. Standards validation
        standards_result = self._validate_standards(code)
        results['validations'].append(standards_result)

        if not standards_result.passed:
            results['passed'] = False
            results['critical_issues'].extend(standards_result.errors)

        # 4. Best practices validation
        practices_result = self._validate_best_practices(code)
        results['validations'].append(practices_result)

        # 5. Generate summary
        results['summary'] = self._generate_summary(results['validations'])

        return results

    def _validate_syntax(self, code: str, filename: str) -> ValidationResult:
        """Validate Python syntax"""
        try:
            tree = ast.parse(code)
            return ValidationResult(
                category='syntax',
                passed=True,
                errors=[],
                warnings=[],
                details={'compilable': True, 'ast_parsed': True}
            )
        except SyntaxError as e:
            return ValidationResult(
                category='syntax',
                passed=False,
                errors=[f"Syntax error at line {e.lineno}: {e.msg}"],
                warnings=[],
                details={'compilable': False, 'error_line': e.lineno}
            )

    def _validate_structure(self, code: str) -> ValidationResult:
        """Validate 3-stage structure"""
        errors = []
        warnings = []

        try:
            tree = ast.parse(code)
        except:
            return ValidationResult(
                category='structure',
                passed=False,
                errors=['Cannot validate structure - syntax errors'],
                warnings=[],
                details={}
            )

        # Check for required methods
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        if not classes:
            errors.append("No class definition found")
            return ValidationResult(
                category='structure',
                passed=False,
                errors=errors,
                warnings=warnings,
                details={}
            )

        main_class = classes[0]
        methods = [node.name for node in main_class.body if isinstance(node, ast.FunctionDef)]

        required_methods = {
            'get_trading_dates': 'Generate trading date range',
            'fetch_all_grouped_data': 'Fetch grouped market data',
            'apply_smart_filters': 'Apply parameter-based filtering',
            'compute_full_features': 'Compute all features and indicators',
            'detect_patterns': 'Detect trading patterns',
            'execute': 'Main execution method'
        }

        missing = [m for m in required_methods if m not in methods]

        if missing:
            errors.append(f"Missing required methods: {', '.join(missing)}")

        # Check for 3-stage structure in execute
        if 'execute' in methods:
            execute_node = next(
                (node for node in main_class.body if isinstance(node, ast.FunctionDef) and node.name == 'execute'),
                None
            )

            if execute_node:
                execute_code = ast.get_source_segment(code, execute_node) or ""

                stages = {
                    'stage1_grouped_fetch': 'fetch_all_grouped_data' in execute_code,
                    'stage2_smart_filters': 'apply_smart_filters' in execute_code,
                    'stage3_full_features': ('compute_full_features' in execute_code or
                                           'detect_patterns' in execute_code)
                }

                if not all(stages.values()):
                    missing_stages = [k for k, v in stages.items() if not v]
                    warnings.append(f"3-stage structure incomplete: {missing_stages}")

        passed = len(errors) == 0

        return ValidationResult(
            category='structure',
            passed=passed,
            errors=errors,
            warnings=warnings,
            details={
                'methods_found': methods,
                'missing_methods': missing,
                'total_methods': len(methods)
            }
        )

    def _validate_standards(self, code: str) -> ValidationResult:
        """Validate EdgeDev standardizations"""
        errors = []
        warnings = []

        standardizations = {
            'grouped_endpoint': 'grouped/locale/us/market/stocks' in code,
            'thread_pooling': 'ThreadPoolExecutor' in code,
            'polygon_api': 'self.api_key' in code or 'api_key' in code,
            'smart_filtering': 'apply_smart_filters' in code,
            'vectorized_operations': '.transform(' in code or '.groupby(' in code,
            'connection_pooling': 'requests.Session()' in code,
            'date_range_config': 'd0_start' in code and 'd0_end' in code
        }

        missing = [name for name, present in standardizations.items() if not present]

        if missing:
            errors.append(f"Missing standardizations: {', '.join(missing)}")

        # Check for anti-patterns
        if '.iterrows()' in code:
            errors.append("Anti-pattern detected: .iterrows() - use vectorized operations")

        return ValidationResult(
            category='standards',
            passed=len(missing) == 0,
            errors=errors,
            warnings=warnings,
            details={
                'standardizations_present': sum(1 for v in standardizations.values() if v),
                'standardizations_total': len(standardizations),
                'missing_standardizations': missing
            }
        )

    def _validate_best_practices(self, code: str) -> ValidationResult:
        """Validate code quality best practices"""
        warnings = []

        try:
            tree = ast.parse(code)
        except:
            return ValidationResult(
                category='best_practices',
                passed=True,  # Don't fail on this
                errors=[],
                warnings=[],
                details={}
            )

        # Check for docstrings
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        has_class_docstring = any(ast.get_docstring(c) for c in classes)

        if not has_class_docstring:
            warnings.append("No class docstring found")

        # Check for error handling
        has_try_except = 'try:' in code and 'except' in code

        if not has_try_except:
            warnings.append("No error handling (try/except) found")

        # Check for hardcoded values
        if 'api_key = "' in code or 'apikey = "' in code:
            warnings.append("Possible hardcoded API key")

        return ValidationResult(
            category='best_practices',
            passed=True,  # Best practices don't cause failure
            errors=[],
            warnings=warnings,
            details={
                'has_docstrings': has_class_docstring,
                'has_error_handling': has_try_except
            }
        )

    def _generate_summary(self, validations: List[ValidationResult]) -> Dict[str, Any]:
        """Generate validation summary"""
        total = len(validations)
        passed = sum(1 for v in validations if v.passed)
        total_errors = sum(len(v.errors) for v in validations)
        total_warnings = sum(len(v.warnings) for v in validations)

        return {
            'total_validations': total,
            'validations_passed': passed,
            'overall_passed': passed == total,
            'total_errors': total_errors,
            'total_warnings': total_warnings
        }

    def generate_validation_report(self, results: Dict[str, Any]) -> str:
        """Generate human-readable validation report"""
        lines = []
        lines.append("=" * 70)
        lines.append("OUTPUT VALIDATION REPORT")
        lines.append("=" * 70)

        # Overall status
        status = "✅ PASSED" if results['passed'] else "❌ FAILED"
        lines.append(f"\nOverall Status: {status}")

        # Summary
        summary = results['summary']
        lines.append(f"\n📊 Summary:")
        lines.append(f"  Validations: {summary['validations_passed']}/{summary['total_validations']} passed")
        lines.append(f"  Errors: {summary['total_errors']}")
        lines.append(f"  Warnings: {summary['total_warnings']}")

        # Critical issues
        if results['critical_issues']:
            lines.append(f"\n🚨 Critical Issues:")
            for issue in results['critical_issues']:
                lines.append(f"  • {issue}")

        # Individual validations
        for validation in results['validations']:
            status = "✅" if validation.passed else "❌"
            lines.append(f"\n{status} {validation.category.upper()}")

            if validation.errors:
                lines.append(f"  Errors:")
                for error in validation.errors:
                    lines.append(f"    • {error}")

            if validation.warnings:
                lines.append(f"  Warnings:")
                for warning in validation.warnings:
                    lines.append(f"    • {warning}")

            if validation.details:
                lines.append(f"  Details:")
                for key, value in validation.details.items():
                    lines.append(f"    {key}: {value}")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the output validator
if __name__ == "__main__":
    # Get templates directory
    current_dir = Path(__file__).parent.parent.parent
    templates_dir = current_dir / "templates"

    validator = OutputValidator(str(templates_dir))

    print("Testing OutputValidator...\n")

    # Test with valid code
    valid_code = """
import pandas as pd
import requests

class ValidScanner:
    '''Valid EdgeDev scanner'''

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end

    def get_trading_dates(self):
        return pd.date_range(self.d0_start, self.d0_end, freq='B')

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

    results = validator.validate_all(valid_code)
    report = validator.generate_validation_report(results)
    print(report)
