"""
RENATA_V2 AST Parser

Parse Python code and extract structured information for transformation.

This module provides the AST parsing capabilities that are the first stage
in the Renata V2 transformation pipeline.
"""

import ast
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any, Optional


class ScannerType(Enum):
    """Scanner type classification"""
    SINGLE_SCANNER = "single"
    MULTI_SCANNER = "multi"


@dataclass
class FunctionInfo:
    """Information about a function"""
    name: str
    args: List[str]
    returns: Optional[str]
    docstring: Optional[str]
    line_number: int
    body_length: int


@dataclass
class ClassInfo:
    """Information about a class"""
    name: str
    methods: List[str]
    base_classes: List[str]
    docstring: Optional[str]
    line_number: int


@dataclass
class ConditionInfo:
    """Information about a condition"""
    condition_type: str  # 'if', 'elif', 'else'
    test: str
    line_number: int
    context: Optional[str]


@dataclass
class ComparisonInfo:
    """Information about a comparison"""
    left: str
    operator: str
    right: str
    line_number: int


@dataclass
class ImportInfo:
    """Information about an import"""
    module: str
    name: Optional[str]
    alias: Optional[str]
    line_number: int


@dataclass
class DataSourceInfo:
    """Information about data sources"""
    primary_source: str  # 'polygon_api', 'file', 'hardcoded', 'unknown'
    files: List[Dict[str, Any]]
    apis: List[Dict[str, Any]]
    hardcoded_lists: List[Dict[str, Any]]
    polygon_usage: bool


@dataclass
class ClassificationResult:
    """Result of scanner type classification"""
    scanner_type: ScannerType
    confidence: str  # 'high', 'medium', 'low'
    indicators: Dict[str, int]


class ASTParser:
    """
    Parse Python code and extract structured information

    This class provides the first stage in the Renata V2 transformation pipeline.
    It converts raw Python code into structured information that can be used
    by the AI agent and template engine.
    """

    def __init__(self):
        """Initialize AST parser"""
        self.tree: Optional[ast.Module] = None
        self.source_lines: List[str] = []

    def parse_code(self, code: str) -> ast.Module:
        """
        Parse code into AST

        Args:
            code: Python code to parse

        Returns:
            AST module

        Raises:
            SyntaxError: If code has syntax errors
        """
        try:
            self.tree = ast.parse(code)
            self.source_lines = code.split('\n')
            return self.tree
        except SyntaxError as e:
            raise SyntaxError(
                f"Syntax error at line {e.lineno}: {e.msg}\n"
                f"{' '.join(self.source_lines[e.lineno-1:e.lineno+2])}"
            )

    def extract_functions(self) -> List[FunctionInfo]:
        """
        Extract all function definitions from AST

        Returns:
            List of FunctionInfo objects
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        functions = []

        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef):
                # Extract arguments
                args = [arg.arg for arg in node.args.args]

                # Extract return annotation
                returns = None
                if node.returns:
                    returns = ast.unparse(node.returns)

                # Extract docstring
                docstring = ast.get_docstring(node)

                # Calculate body length
                body_length = len(node.body)

                info = FunctionInfo(
                    name=node.name,
                    args=args,
                    returns=returns,
                    docstring=docstring,
                    line_number=node.lineno,
                    body_length=body_length
                )
                functions.append(info)

        return functions

    def extract_classes(self) -> List[ClassInfo]:
        """
        Extract all class definitions from AST

        Returns:
            List of ClassInfo objects
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        classes = []

        for node in self.tree.body:
            if isinstance(node, ast.ClassDef):
                # Extract base classes
                base_classes = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        base_classes.append(base.id)
                    elif isinstance(base, ast.Attribute):
                        base_classes.append(ast.unparse(base))

                # Extract methods
                methods = []
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        methods.append(item.name)

                # Extract docstring
                docstring = ast.get_docstring(node)

                info = ClassInfo(
                    name=node.name,
                    methods=methods,
                    base_classes=base_classes,
                    docstring=docstring,
                    line_number=node.lineno
                )
                classes.append(info)

        return classes

    def extract_imports(self) -> List[ImportInfo]:
        """
        Extract all imports from AST

        Returns:
            List of ImportInfo objects
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        imports = []

        for node in self.tree.body:
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(ImportInfo(
                        module=alias.name,
                        name=None,
                        alias=alias.asname,
                        line_number=node.lineno
                    ))
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    imports.append(ImportInfo(
                        module=module,
                        name=alias.name,
                        alias=alias.asname,
                        line_number=node.lineno
                    ))

        return imports

    def has_method(self, class_name: str, method_name: str) -> bool:
        """
        Check if a class has a specific method

        Args:
            class_name: Name of the class
            method_name: Name of the method

        Returns:
            True if class has method
        """
        classes = self.extract_classes()
        for cls in classes:
            if cls.name == class_name:
                return method_name in cls.methods
        return False

    def get_class_methods(self, class_name: str) -> List[str]:
        """
        Get all methods for a specific class

        Args:
            class_name: Name of the class

        Returns:
            List of method names
        """
        classes = self.extract_classes()
        for cls in classes:
            if cls.name == class_name:
                return cls.methods
        return []

    def extract_conditions(self) -> List[ConditionInfo]:
        """
        Extract all conditionals (if/elif/else) from AST

        Returns:
            List of ConditionInfo objects
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        conditions = []

        for node in ast.walk(self.tree):
            if isinstance(node, ast.If):
                # Get the test expression
                test = ast.unparse(node.test)

                # Determine if this is an elif or if
                # (Simplified - in production would check parent)
                condition_type = 'if'

                # Try to determine context (enclosing function)
                context = self._get_parent_function_name(node)

                info = ConditionInfo(
                    condition_type=condition_type,
                    test=test,
                    line_number=node.lineno,
                    context=context
                )
                conditions.append(info)

        return conditions

    def extract_comparisons(self) -> List[ComparisonInfo]:
        """
        Extract all comparison operations from AST

        Returns:
            List of ComparisonInfo objects
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        comparisons = []

        for node in ast.walk(self.tree):
            if isinstance(node, ast.Compare):
                # Get left operand
                left = ast.unparse(node.left)

                # Get operator
                operator = None
                if len(node.ops) > 0:
                    op = node.ops[0]
                    op_type = type(op).__name__
                    # Convert to readable operator
                    operator_map = {
                        'Gt': '>',
                        'Lt': '<',
                        'GtE': '>=',
                        'LtE': '<=',
                        'Eq': '==',
                        'NotEq': '!=',
                        'In': 'in',
                        'NotIn': 'not in',
                        'Is': 'is',
                        'IsNot': 'is not'
                    }
                    operator = operator_map.get(op_type, op_type)

                # Get right operand
                right = None
                if len(node.comparators) > 0:
                    right = ast.unparse(node.comparators[0])

                if operator and right:
                    info = ComparisonInfo(
                        left=left,
                        operator=operator,
                        right=right,
                        line_number=node.lineno
                    )
                    comparisons.append(info)

        return comparisons

    def _get_parent_function_name(self, node: ast.AST) -> Optional[str]:
        """
        Get the name of the parent function for a node

        Args:
            node: AST node

        Returns:
            Function name if node is inside a function, None otherwise
        """
        for parent in ast.walk(self.tree):
            if isinstance(parent, ast.FunctionDef):
                # Check if node is in this function's body
                for child in ast.walk(parent):
                    if child is node:
                        return parent.name
        return None

    def extract_numeric_literals(self) -> Dict[str, Any]:
        """
        Extract all numeric literals from code

        Returns:
            Dict mapping variable names to numeric values
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        parameters = {}

        for node in ast.walk(self.tree):
            if isinstance(node, ast.Assign):
                # Look for: variable = value
                if len(node.targets) == 1:
                    target = node.targets[0]

                    # Simple variable assignment
                    if isinstance(target, ast.Name) and isinstance(node.value, ast.Constant):
                        var_name = target.id
                        value = node.value.value

                        if isinstance(value, (int, float)):
                            parameters[var_name] = {
                                'value': value,
                                'line': node.lineno
                            }

        return parameters

    def extract_string_literals(self) -> Dict[str, str]:
        """
        Extract all string literals from code

        Returns:
            Dict mapping variable names to string values
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        strings = {}

        for node in ast.walk(self.tree):
            if isinstance(node, ast.Assign):
                if len(node.targets) == 1:
                    target = node.targets[0]

                    if isinstance(target, ast.Name) and isinstance(node.value, ast.Constant):
                        var_name = target.id
                        value = node.value.value

                        if isinstance(value, str):
                            strings[var_name] = {
                                'value': value,
                                'line': node.lineno
                            }

        return strings

    def detect_data_sources(self) -> DataSourceInfo:
        """
        Detect where data comes from (file, API, hardcoded)

        Returns:
            DataSourceInfo with detected sources
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        sources = {
            'files': [],
            'apis': [],
            'hardcoded_lists': [],
            'polygon_usage': False
        }

        for node in ast.walk(self.tree):
            # Detect file reads
            if isinstance(node, ast.Call):
                func_name = ast.unparse(node.func)

                # File operations
                file_operations = ['open', 'pd.read_csv', 'pd.read_feather',
                                  'pd.read_parquet', 'pd.read_json', 'pd.read_excel']
                if any(op in func_name for op in file_operations):
                    sources['files'].append({
                        'function': func_name,
                        'line': node.lineno
                    })

                # requests.get with API
                if func_name == 'requests.get':
                    # Try to extract URL from arguments
                    if node.args and isinstance(node.args[0], ast.Constant):
                        url = node.args[0].value
                        if isinstance(url, str) and 'polygon.io' in url.lower():
                            sources['polygon_usage'] = True
                            sources['apis'].append({
                                'endpoint': 'polygon',
                                'line': node.lineno
                            })

            # Detect string constants containing polygon.io
            if isinstance(node, ast.Constant) and isinstance(node.value, str):
                if 'polygon.io' in node.value.lower():
                    sources['polygon_usage'] = True

            # Detect hardcoded lists
            if isinstance(node, ast.List):
                # Check if it's a list of strings (likely tickers)
                if len(node.elts) > 2:  # At least 3 elements
                    # Check if first few are string constants
                    all_strings = all(isinstance(elt, ast.Constant) and isinstance(elt.value, str)
                                    for elt in node.elts[:min(5, len(node.elts))])

                    if all_strings:
                        sources['hardcoded_lists'].append({
                            'length': len(node.elts),
                            'line': node.lineno
                        })

            # Detect list comprehensions that might create ticker lists
            if isinstance(node, ast.ListComp):
                sources['hardcoded_lists'].append({
                    'type': 'list_comprehension',
                    'line': node.lineno
                })

        # Determine primary source
        if sources['polygon_usage']:
            primary_source = 'polygon_api'
        elif sources['files']:
            primary_source = 'file'
        elif sources['hardcoded_lists']:
            primary_source = 'hardcoded'
        else:
            primary_source = 'unknown'

        return DataSourceInfo(
            primary_source=primary_source,
            files=sources['files'],
            apis=sources['apis'],
            hardcoded_lists=sources['hardcoded_lists'],
            polygon_usage=sources['polygon_usage']
        )

    def classify_scanner_type(self) -> ClassificationResult:
        """
        Classify scanner as single or multi-pattern

        This is a critical method that determines the scanner type by analyzing:
        - Pattern column assignments (e.g., results['d2_pattern'] = ...)
        - Multiple pattern check methods (e.g., check_d2, check_d3, check_d4)
        - Pattern-specific filter sections

        Returns:
            ClassificationResult with scanner type and confidence
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        # Indicators of multi-scanner
        multi_scanner_indicators = {
            'pattern_columns': 0,
            'pattern_check_methods': 0,
            'pattern_filter_sections': 0,
            'pattern_names': set()
        }

        for node in ast.walk(self.tree):
            # Check for pattern column assignments
            # e.g., results['d2_pattern'] = ...
            if isinstance(node, ast.Assign):
                if len(node.targets) > 0:
                    target = node.targets[0]
                    if isinstance(target, ast.Subscript):
                        # Check if subscript has a string key
                        if isinstance(target.slice, ast.Constant):
                            col_name = str(target.slice.value).lower()
                            # Pattern indicators
                            pattern_keywords = ['pattern', 'd2', 'd3', 'd4',
                                             'lc_frontside', 'lc_backside',
                                             'pm_setup', 'pmh_break', 'extreme']
                            if any(keyword in col_name for keyword in pattern_keywords):
                                # ✅ FIX: Only count as pattern if it's an actual pattern detection
                                # Pattern detections are typically:
                                # - df['pattern'] = (condition).astype(int)
                                #
                                # NOT pattern detections (feature computations):
                                # - df['Close_D3'] = df['Close'].shift(3)
                                # - df['High_D2'] = df['High'].shift(2)

                                is_pattern_detection = False

                                # Check if the value is a Call expression
                                if isinstance(node.value, ast.Call):
                                    # Check if it's .astype(int) - this is pattern detection
                                    if isinstance(node.value.func, ast.Attribute):
                                        if node.value.func.attr == 'astype':
                                            is_pattern_detection = True

                                # Check if the value is a direct Compare (condition/comparison)
                                elif isinstance(node.value, ast.Compare):
                                    is_pattern_detection = True
                                # Check if the value is a BoolOp (and/or conditions)
                                elif isinstance(node.value, ast.BoolOp):
                                    is_pattern_detection = True
                                # Check if the value is a UnaryOp with not (negation)
                                elif isinstance(node.value, ast.UnaryOp):
                                    if isinstance(node.value.op, ast.Not):
                                        is_pattern_detection = True

                                # Only count if it's actually a pattern detection
                                if is_pattern_detection:
                                    multi_scanner_indicators['pattern_columns'] += 1
                                    multi_scanner_indicators['pattern_names'].add(col_name)

            # Check for pattern-specific check methods
            # e.g., check_d2_pattern, check_d3, check_d4_pattern
            if isinstance(node, ast.FunctionDef):
                func_name = node.name.lower()
                # Pattern check method indicators
                if 'check' in func_name:
                    if any(pattern in func_name for pattern in
                          ['d2', 'd3', 'd4', 'pattern', 'lc_frontside', 'lc_backside']):
                        multi_scanner_indicators['pattern_check_methods'] += 1
                        # Extract pattern name
                        for pattern in ['d2', 'd3', 'd4', 'lc_frontside', 'lc_backside']:
                            if pattern in func_name:
                                multi_scanner_indicators['pattern_names'].add(pattern)

        # Make determination
        pattern_count = (
            multi_scanner_indicators['pattern_columns'] +
            multi_scanner_indicators['pattern_check_methods']
        )

        # Determine scanner type
        if pattern_count >= 3:
            scanner_type = ScannerType.MULTI_SCANNER
            confidence = 'high'
        elif pattern_count >= 1:
            scanner_type = ScannerType.MULTI_SCANNER
            confidence = 'medium'
        else:
            scanner_type = ScannerType.SINGLE_SCANNER
            confidence = 'high'

        return ClassificationResult(
            scanner_type=scanner_type,
            confidence=confidence,
            indicators={
                'pattern_count': pattern_count,
                'pattern_columns': multi_scanner_indicators['pattern_columns'],
                'pattern_check_methods': multi_scanner_indicators['pattern_check_methods'],
                'unique_pattern_names': list(multi_scanner_indicators['pattern_names'])
            }
        )

    def get_code_statistics(self) -> Dict[str, Any]:
        """
        Get general statistics about the code

        Returns:
            Dict with code statistics
        """
        if not self.tree:
            raise ValueError("No AST tree. Call parse_code() first.")

        stats = {
            'total_lines': len(self.source_lines),
            'total_functions': 0,
            'total_classes': 0,
            'total_imports': 0,
            'has_main_execution': False,
            'complexity_score': 0
        }

        # Count all functions (including methods in classes)
        for node in ast.walk(self.tree):
            if isinstance(node, ast.FunctionDef):
                stats['total_functions'] += 1

        # Count top-level classes and imports
        for node in self.tree.body:
            if isinstance(node, ast.ClassDef):
                stats['total_classes'] += 1
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                stats['total_imports'] += 1
            elif isinstance(node, ast.If):
                # Check for main execution block
                if (isinstance(node.test, ast.Compare) and
                    len(node.test.ops) > 0 and
                    isinstance(node.test.left, ast.Name) and
                    node.test.left.id == '__name__'):
                    stats['has_main_execution'] = True

        # Calculate complexity score (simplified)
        stats['complexity_score'] = (
            stats['total_functions'] * 2 +
            stats['total_classes'] * 3 +
            len(self.extract_conditions())
        )

        return stats
