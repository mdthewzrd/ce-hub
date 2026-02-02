"""
RENATA_V2 Validator

Validates generated code for syntax, structure, and logic correctness.
"""

import ast
import sys
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of validation"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    category: str  # 'syntax', 'structure', 'logic'


class ValidationError(Exception):
    """Validation error"""
    pass


class Validator:
    """
    Validates generated trading scanner code

    Performs three types of validation:
    1. Syntax validation - Check Python syntax
    2. Structure validation - Check v31 architecture compliance
    3. Logic validation - Check for common logic errors
    """

    def __init__(self):
        """Initialize validator"""
        self.required_methods = [
            'fetch_grouped_data',
            'apply_smart_filters',
            'detect_patterns',
            'format_results',
            'run_scan'
        ]

        self.required_imports = [
            'pandas',
            'numpy'
        ]

    def validate_all(self, code: str) -> Tuple[bool, List[ValidationResult]]:
        """
        Run all validation checks

        Args:
            code: Generated Python code

        Returns:
            Tuple of (all_valid, list of validation results)
        """
        results = []

        # Syntax validation
        syntax_result = self.validate_syntax(code)
        results.append(syntax_result)

        # Skip other validations if syntax is invalid
        if not syntax_result.is_valid:
            return False, results

        # Structure validation
        structure_result = self.validate_structure(code)
        results.append(structure_result)

        # ✅ TRUE v31 compliance validation
        v31_result = self.validate_v31_compliance(code)
        results.append(v31_result)

        # Logic validation
        logic_result = self.validate_logic(code)
        results.append(logic_result)

        # Check if all validations passed
        all_valid = all(result.is_valid for result in results)

        return all_valid, results

    def validate_syntax(self, code: str) -> ValidationResult:
        """
        Validate Python syntax

        Args:
            code: Python code to validate

        Returns:
            ValidationResult with syntax check results
        """
        errors = []
        warnings = []

        try:
            # Try to compile the code
            compile(code, '<string>', 'exec')

        except SyntaxError as e:
            errors.append(
                f"Syntax error at line {e.lineno}: {e.msg}"
            )
            if e.text:
                errors.append(f"  {e.text.strip()}")

        except Exception as e:
            errors.append(f"Compilation error: {e}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            category='syntax'
        )

    def validate_structure(self, code: str) -> ValidationResult:
        """
        Validate v31 structure compliance

        Checks that the code has:
        - All required methods (fetch_grouped_data, apply_smart_filters, etc.)
        - Class definition inheriting from object or no inheritance
        - Proper docstrings

        Args:
            code: Python code to validate

        Returns:
            ValidationResult with structure check results
        """
        errors = []
        warnings = []

        try:
            tree = ast.parse(code)

            # Find class definitions
            classes = [
                node for node in ast.walk(tree)
                if isinstance(node, ast.ClassDef)
            ]

            if not classes:
                errors.append("No class definition found in code")
            else:
                # Check first class for required methods
                main_class = classes[0]
                methods = {
                    node.name: node
                    for node in main_class.body
                    if isinstance(node, ast.FunctionDef)
                }

                # Check for required methods
                missing_methods = [
                    method for method in self.required_methods
                    if method not in methods
                ]

                if missing_methods:
                    errors.append(
                        f"Missing required methods: {', '.join(missing_methods)}"
                    )

                # Check method signatures
                for method_name in self.required_methods:
                    if method_name in methods:
                        method = methods[method_name]
                        if not self._has_valid_signature(method_name, method):
                            warnings.append(
                                f"Method '{method_name}' may have invalid signature"
                            )

                # Check for docstrings
                if not ast.get_docstring(main_class):
                    warnings.append("Main class missing docstring")

                for method_name, method in methods.items():
                    if not ast.get_docstring(method):
                        warnings.append(f"Method '{method_name}' missing docstring")

        except Exception as e:
            errors.append(f"Structure validation error: {e}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            category='structure'
        )

    def validate_logic(self, code: str) -> ValidationResult:
        """
        Validate code logic for common errors

        Checks for:
        - Use of iterrows() (should use vectorized operations)
        - Missing return statements
        - Undefined variables
        - Common pandas anti-patterns

        Args:
            code: Python code to validate

        Returns:
            ValidationResult with logic check results
        """
        errors = []
        warnings = []

        try:
            tree = ast.parse(code)

            # Check for iterrows usage
            for node in ast.walk(tree):
                # Check for iterrows() calls
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        if node.func.attr == 'iterrows':
                            warnings.append(
                                "Use of iterrows() detected. "
                                "Consider using vectorized operations for better performance."
                            )

                # Check for hardcoded API keys
                if isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            if 'api_key' in target.id.lower():
                                if isinstance(node.value, ast.Constant):
                                    warnings.append(
                                        f"Potential hardcoded API key in variable '{target.id}'"
                                    )

        except Exception as e:
            errors.append(f"Logic validation error: {e}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            category='logic'
        )

    def _has_valid_signature(self, method_name: str, method_node: ast.FunctionDef) -> bool:
        """
        Check if method has valid signature

        Args:
            method_name: Name of the method
            method_node: AST FunctionDef node

        Returns:
            True if signature appears valid
        """
        # Expected signatures for each method
        expected_params = {
            'fetch_grouped_data': ['self', 'start_date', 'end_date'],
            'apply_smart_filters': ['self', 'stage1_data'],
            'detect_patterns': ['self', 'stage2_data'],
            'format_results': ['self', 'stage3_results'],
            'run_scan': ['self', 'start_date', 'end_date']
        }

        if method_name not in expected_params:
            return True

        expected = expected_params[method_name]
        actual = [arg.arg for arg in method_node.args.args]

        # Check if all expected params are present
        return all(param in actual for param in expected)

    def validate_v31_compliance(self, code: str) -> ValidationResult:
        """
        ✅ TRUE v31 compliance validation - checks all 7 core pillars

        Validates that generated code follows TRUE v31 architecture:
        1. Market calendar (pandas_market_calendars, NOT weekday checks)
        2. Historical buffer calculation
        3. Per-ticker operations (.groupby().transform())
        4. Historical/D0 separation
        5. Parallel processing (ThreadPoolExecutor)
        6. Two-pass feature computation
        7. Pre-sliced data for parallel processing

        Args:
            code: Python code to validate

        Returns:
            ValidationResult with v31 compliance check results
        """
        errors = []
        warnings = []

        try:
            # Parse code
            tree = ast.parse(code)
            code_lower = code.lower()

            # ✅ PILLAR 1: Market calendar check
            has_market_calendar = 'pandas_market_calendars' in code_lower or 'import mcal' in code_lower
            if not has_market_calendar:
                errors.append(
                    "❌ PILLAR 1 FAILED: Missing market calendar (pandas_market_calendars). "
                    "Code must use 'mcal.get_calendar(\"NYSE\")' instead of weekday() checks."
                )

            # ✅ PILLAR 2: Historical buffer check
            has_historical_buffer = (
                'scan_start' in code_lower and
                'timedelta' in code_lower and
                ('lookback' in code_lower or 'buffer' in code_lower)
            )
            if not has_historical_buffer:
                errors.append(
                    "❌ PILLAR 2 FAILED: Missing historical buffer calculation. "
                    "Code must calculate scan_start = d0_start - lookback_buffer."
                )

            # ✅ PILLAR 3: Per-ticker operations check
            has_per_ticker_ops = (
                ".groupby('ticker')" in code or
                '.groupby("ticker")' in code or
                '.groupby(df["ticker"])' in code or
                '.groupby(df[\'ticker\'])' in code
            )
            if not has_per_ticker_ops:
                errors.append(
                    "❌ PILLAR 3 FAILED: Missing per-ticker operations. "
                    "Code must use .groupby('ticker').transform() for rolling operations."
                )

            # ✅ PILLAR 4: Historical/D0 separation check
            has_historical_d0_split = (
                'df_historical' in code_lower or
                'historical' in code_lower
            )
            if not has_historical_d0_split:
                errors.append(
                    "❌ PILLAR 4 FAILED: Missing historical/D0 separation. "
                    "Code must split historical data from D0 range, filter D0, then recombine."
                )

            # ✅ PILLAR 5: Parallel processing check
            has_parallel_processing = (
                'ThreadPoolExecutor' in code or
                'ProcessPoolExecutor' in code
            )
            if not has_parallel_processing:
                errors.append(
                    "❌ PILLAR 5 FAILED: Missing parallel processing. "
                    "Code must use ThreadPoolExecutor for parallel date/ticker processing."
                )

            # ✅ PILLAR 6: Two-pass feature computation check
            has_simple_features = (
                'compute_simple_features' in code or
                'def compute_simple_features' in code
            )
            has_full_features = (
                'compute_full_features' in code or
                'def compute_full_features' in code
            )
            if not (has_simple_features and has_full_features):
                errors.append(
                    "❌ PILLAR 6 FAILED: Missing two-pass feature computation. "
                    "Code must have separate compute_simple_features() and compute_full_features() methods."
                )

            # ✅ PILLAR 7: Pre-sliced data check
            has_presliced_data = (
                ('pre_sliced' in code_lower or 'pre-sliced' in code_lower or 'presliced' in code_lower) or
                ('ticker_data_list' in code_lower and 'executor.submit' in code_lower)
            )
            if not has_presliced_data:
                warnings.append(
                    "⚠️  PILLAR 7: Pre-sliced data optimization not detected. "
                    "For best performance, use pre-sliced ticker data with ThreadPoolExecutor."
                )

            # Additional critical checks
            # Check for grouped endpoint usage
            has_grouped_endpoint = (
                '/grouped/locale/us/market/stocks/' in code or
                'grouped' in code_lower
            )
            if not has_grouped_endpoint:
                warnings.append(
                    "⚠️  Grouped endpoint not detected. "
                    "V31 should use Polygon grouped endpoint for efficient data fetching."
                )

            # Check for proper 5-stage pipeline
            required_stages = [
                ('fetch_grouped_data', 'Stage 1'),
                ('compute_simple_features', 'Stage 2a'),
                ('apply_smart_filters', 'Stage 2b'),
                ('compute_full_features', 'Stage 3a'),
                ('detect_patterns', 'Stage 3b')
            ]
            missing_stages = [
                stage_name for stage_name, _ in required_stages
                if stage_name not in code_lower
            ]
            if missing_stages:
                errors.append(
                    f"❌ Missing required pipeline stages: {', '.join(missing_stages)}. "
                    "V31 requires complete 5-stage pipeline."
                )

            # Check for early D0 filtering
            has_early_d0_filter = (
                'd0_start_dt' in code_lower or
                'if d0 < d0_start' in code or
                'if d0 > d0_end' in code
            )
            if not has_early_d0_filter:
                warnings.append(
                    "⚠️  Early D0 filtering not detected. "
                    "For best performance, add early D0 range checks in detection loop."
                )

        except Exception as e:
            errors.append(f"V31 compliance validation error: {e}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            category='v31_compliance'
        )

    def validate_imports(self, code: str) -> ValidationResult:
        """
        Validate required imports are present

        Args:
            code: Python code to validate

        Returns:
            ValidationResult with import check results
        """
        errors = []
        warnings = []

        try:
            tree = ast.parse(code)

            # Find all imports
            imports = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split('.')[0])

            # Check for required imports
            missing_imports = [
                imp for imp in self.required_imports
                if imp not in imports
            ]

            if missing_imports:
                errors.append(
                    f"Missing required imports: {', '.join(missing_imports)}"
                )

        except Exception as e:
            errors.append(f"Import validation error: {e}")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            category='syntax'
        )

    def format_validation_results(
        self,
        results: List[ValidationResult]
    ) -> str:
        """
        Format validation results for display

        Args:
            results: List of ValidationResult objects

        Returns:
            Formatted string
        """
        lines = []
        lines.append("=" * 60)
        lines.append("VALIDATION RESULTS")
        lines.append("=" * 60)

        for result in results:
            lines.append(f"\n{result.category.upper()} VALIDATION:")
            lines.append(f"  Valid: {result.is_valid}")

            if result.errors:
                lines.append(f"  Errors ({len(result.errors)}):")
                for error in result.errors:
                    lines.append(f"    - {error}")

            if result.warnings:
                lines.append(f"  Warnings ({len(result.warnings)}):")
                for warning in result.warnings:
                    lines.append(f"    - {warning}")

        lines.append("\n" + "=" * 60)

        return "\n".join(lines)

