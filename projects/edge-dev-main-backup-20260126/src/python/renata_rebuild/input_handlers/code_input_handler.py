"""
Code Input Handler - Process Python Scanner Code Input

This module:
1. Accepts Python code input (file upload or text)
2. Parses and validates input code
3. Extracts key information (class name, methods, parameters)
4. Identifies structure type (single-scan vs multi-scan)
5. Prepares code for processing engine
"""

import ast
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class CodeInput:
    """Structured representation of input code"""
    raw_code: str
    filename: str
    class_name: str
    methods: Dict[str, Dict[str, Any]]
    parameters: Dict[str, Any]
    structure_type: str  # 'single-scan' or 'multi-scan'
    imports: List[str]
    docstring: Optional[str]
    issues: List[str]


class CodeInputHandler:
    """
    Handler for Python code input

    Accepts:
    - Raw code strings
    - Python files (.py)
    - Uploaded code files

    Outputs:
    - Structured CodeInput object
    - Parsed AST
    - Extraction results
    """

    def __init__(self):
        """Initialize code input handler"""
        self.supported_formats = ['.py']
        self.max_file_size = 1024 * 1024  # 1MB

    def handle_input(
        self,
        code: Optional[str] = None,
        file_path: Optional[str] = None
    ) -> CodeInput:
        """
        Handle code input from various sources

        Args:
            code: Raw code string
            file_path: Path to Python file

        Returns:
            CodeInput object with parsed information

        Raises:
            ValueError: If input is invalid
        """
        # Get code from appropriate source
        if code:
            raw_code = code
            filename = "uploaded_code.py"
        elif file_path:
            raw_code, filename = self._load_file(file_path)
        else:
            raise ValueError("Must provide either code string or file_path")

        # Parse the code
        parsed = self._parse_code(raw_code, filename)

        return parsed

    def _load_file(self, file_path: str) -> Tuple[str, str]:
        """
        Load code from file

        Args:
            file_path: Path to file

        Returns:
            Tuple of (code, filename)

        Raises:
            ValueError: If file is invalid
        """
        path = Path(file_path)

        # Check file exists
        if not path.exists():
            raise ValueError(f"File not found: {file_path}")

        # Check file extension
        if path.suffix not in self.supported_formats:
            raise ValueError(
                f"Unsupported file format: {path.suffix}. "
                f"Supported: {', '.join(self.supported_formats)}"
            )

        # Check file size
        file_size = path.stat().st_size
        if file_size > self.max_file_size:
            raise ValueError(
                f"File too large: {file_size} bytes "
                f"(max: {self.max_file_size} bytes)"
            )

        # Read file
        try:
            code = path.read_text(encoding='utf-8')
            return code, path.name
        except Exception as e:
            raise ValueError(f"Error reading file: {e}")

    def _parse_code(self, code: str, filename: str) -> CodeInput:
        """
        Parse code and extract information

        Args:
            code: Raw code string
            filename: Filename for reference

        Returns:
            CodeInput object
        """
        issues = []

        # Parse AST
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            issues.append(f"Syntax error at line {e.lineno}: {e.msg}")
            # Return partial input even with syntax errors
            return CodeInput(
                raw_code=code,
                filename=filename,
                class_name="",
                methods={},
                parameters={},
                structure_type="unknown",
                imports=[],
                docstring=None,
                issues=issues
            )

        # Extract information
        imports = self._extract_imports(tree)
        class_info = self._extract_class_info(tree, code)
        parameters = self._extract_parameters(tree, code)
        structure_type = self._determine_structure_type(tree, code)

        # Create CodeInput
        code_input = CodeInput(
            raw_code=code,
            filename=filename,
            class_name=class_info['name'],
            methods=class_info['methods'],
            parameters=parameters,
            structure_type=structure_type,
            imports=imports,
            docstring=class_info.get('docstring'),
            issues=issues
        )

        return code_input

    def _extract_imports(self, tree: ast.AST) -> List[str]:
        """Extract import statements"""
        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    imports.append(f"{module}.{alias.name}" if module else alias.name)

        return imports

    def _extract_class_info(self, tree: ast.AST, code: str) -> Dict[str, Any]:
        """Extract class information"""
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        if not classes:
            return {
                'name': '',
                'methods': {},
                'docstring': None
            }

        main_class = classes[0]

        # Extract methods
        methods = {}
        for node in main_class.body:
            if isinstance(node, ast.FunctionDef):
                methods[node.name] = {
                    'args': [arg.arg for arg in node.args.args],
                    'docstring': ast.get_docstring(node),
                    'lineno': node.lineno,
                    'returns': ast.unparse(node.returns) if node.returns else None
                }

        return {
            'name': main_class.name,
            'methods': methods,
            'docstring': ast.get_docstring(main_class)
        }

    def _extract_parameters(self, tree: ast.AST, code: str) -> Dict[str, Any]:
        """
        Extract scanner parameters

        Looks for:
        - __init__ parameters
        - self.params assignments
        - Parameter definitions
        """
        parameters = {}

        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        if not classes:
            return parameters

        main_class = classes[0]

        # Find __init__ method
        init_method = None
        for node in main_class.body:
            if isinstance(node, ast.FunctionDef) and node.name == '__init__':
                init_method = node
                break

        if not init_method:
            return parameters

        # Extract __init__ parameters (excluding self)
        init_params = [arg.arg for arg in init_method.args.args[1:]]  # Skip 'self'
        parameters['init_params'] = init_params

        # Look for self.params assignments
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Attribute):
                        if target.attr == 'params':
                            # Found self.params = ...
                            try:
                                value = ast.literal_eval(node.value)
                                if isinstance(value, dict):
                                    parameters['params_dict'] = value
                            except:
                                pass

        # Extract common parameter names from code
        common_params = [
            'min_price', 'max_price',
            'min_volume', 'max_volume',
            'min_gap', 'max_gap',
            'min_atr', 'max_atr',
            'lookback_period',
            'ema_short', 'ema_long'
        ]

        found_params = []
        for param in common_params:
            if f"'{param}'" in code or f'"{param}"' in code:
                found_params.append(param)

        parameters['detected_params'] = found_params

        return parameters

    def _determine_structure_type(self, tree: ast.AST, code: str) -> str:
        """
        Determine if code is single-scan or multi-scan structure

        Multi-scan indicators:
        - Multiple parameter sets (backside_b_params, a_plus_params, etc.)
        - Returns dictionary of signals
        - Multiple pattern detection methods
        """
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        if not classes:
            return 'unknown'

        # Check for multiple parameter sets
        has_multiple_params = bool(
            re.search(r'(backside_b|a_plus|lc_d2|half_a)_params', code, re.IGNORECASE)
        )

        # Check for dictionary return
        returns_dict = "return {" in code and "signals" in code.lower()

        # Check for multiple pattern methods
        pattern_methods = [
            'check_backside_b', 'check_a_plus', 'check_lc_d2',
            'detect_backside_b', 'detect_a_plus', 'detect_lc_d2',
        ]
        has_multiple_patterns = any(
            method in code.lower() for method in pattern_methods
        )

        if has_multiple_params or returns_dict or has_multiple_patterns:
            return 'multi-scan'
        else:
            return 'single-scan'

    def validate_input(self, code_input: CodeInput) -> Dict[str, Any]:
        """
        Validate code input

        Returns dict with:
        - valid: bool
        - issues: List[str]
        - warnings: List[str]
        """
        result = {
            'valid': True,
            'issues': [],
            'warnings': []
        }

        # Check for issues
        if code_input.issues:
            result['valid'] = False
            result['issues'].extend(code_input.issues)

        # Check for class
        if not code_input.class_name:
            result['warnings'].append("No class definition found")

        # Check for required methods
        required_methods = ['execute', 'detect_patterns']
        missing = [m for m in required_methods if m not in code_input.methods]

        if missing:
            result['warnings'].append(f"Missing methods: {', '.join(missing)}")

        # Check for parameters
        if not code_input.parameters.get('init_params'):
            result['warnings'].append("No __init__ parameters found")

        return result

    def get_input_summary(self, code_input: CodeInput) -> str:
        """
        Get human-readable summary of code input

        Returns formatted string
        """
        lines = []
        lines.append("=" * 70)
        lines.append("CODE INPUT SUMMARY")
        lines.append("=" * 70)

        lines.append(f"\nFilename: {code_input.filename}")
        lines.append(f"Class Name: {code_input.class_name or 'N/A'}")
        lines.append(f"Structure Type: {code_input.structure_type}")

        lines.append(f"\nMethods ({len(code_input.methods)}):")
        for method_name, method_info in code_input.methods.items():
            args = ', '.join(method_info['args'])
            lines.append(f"  - {method_name}({args})")

        lines.append(f"\nParameters:")
        init_params = code_input.parameters.get('init_params', [])
        if init_params:
            lines.append(f"  - __init__ params: {', '.join(init_params)}")

        detected_params = code_input.parameters.get('detected_params', [])
        if detected_params:
            lines.append(f"  - Detected: {', '.join(detected_params)}")

        params_dict = code_input.parameters.get('params_dict')
        if params_dict:
            lines.append(f"  - params dict: {len(params_dict)} parameters")

        lines.append(f"\nImports ({len(code_input.imports)}):")
        for imp in code_input.imports[:10]:  # First 10
            lines.append(f"  - {imp}")
        if len(code_input.imports) > 10:
            lines.append(f"  ... and {len(code_input.imports) - 10} more")

        if code_input.issues:
            lines.append(f"\n⚠️ Issues:")
            for issue in code_input.issues:
                lines.append(f"  - {issue}")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the code input handler
if __name__ == "__main__":
    handler = CodeInputHandler()

    # Test with sample code
    test_code = """
import pandas as pd
import requests

class BacksideBScanner:
    def __init__(self, api_key, d0_start, d0_end, min_price=5.0, min_volume=1000000):
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end
        self.params = {
            'min_price': min_price,
            'min_volume': min_volume
        }

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

    print("Testing CodeInputHandler...\n")

    code_input = handler.handle_input(code=test_code)

    print(handler.get_input_summary(code_input))

    validation = handler.validate_input(code_input)
    print(f"\nValidation:")
    print(f"  Valid: {validation['valid']}")
    print(f"  Issues: {validation['issues']}")
    print(f"  Warnings: {validation['warnings']}")
