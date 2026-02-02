"""
Code Parser - Parse and Extract Code Structure

This module:
1. Parses Python code into AST
2. Extracts classes, methods, and functions
3. Identifies code structure and patterns
4. Provides code navigation and analysis
"""

import ast
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ParsedClass:
    """Parsed class information"""
    name: str
    docstring: Optional[str]
    methods: Dict[str, 'ParsedMethod']
    attributes: List[str]
    decorators: List[str]
    bases: List[str]
    lineno: int


@dataclass
class ParsedMethod:
    """Parsed method information"""
    name: str
    args: List[str]
    returns: Optional[str]
    docstring: Optional[str]
    decorators: List[str]
    lineno: int
    body: str


@dataclass
class ParsedCode:
    """Complete parsed code structure"""
    tree: ast.AST
    classes: Dict[str, ParsedClass]
    functions: Dict[str, ParsedMethod]
    imports: List[str]
    globals: List[str]
    docstring: Optional[str]


class CodeParser:
    """
    Parse Python code and extract structure

    Provides:
    - AST parsing
    - Class extraction
    - Method extraction
    - Import analysis
    - Code navigation
    """

    def __init__(self):
        """Initialize code parser"""
        self.current_code = None
        self.current_tree = None

    def parse(self, code: str) -> ParsedCode:
        """
        Parse code and extract all information

        Args:
            code: Python code string

        Returns:
            ParsedCode object

        Raises:
            SyntaxError: If code has syntax errors
        """
        self.current_code = code
        self.current_tree = ast.parse(code)

        # Extract all components
        classes = self._extract_classes()
        functions = self._extract_functions()
        imports = self._extract_imports()
        globals = self._extract_globals()
        docstring = ast.get_docstring(self.current_tree)

        return ParsedCode(
            tree=self.current_tree,
            classes=classes,
            functions=functions,
            imports=imports,
            globals=globals,
            docstring=docstring
        )

    def _extract_classes(self) -> Dict[str, ParsedClass]:
        """Extract all classes from AST"""
        classes = {}

        for node in ast.walk(self.current_tree):
            if isinstance(node, ast.ClassDef):
                # Extract methods
                methods = {}
                for item in node.body:
                    if isinstance(item, ast.FunctionDef):
                        methods[item.name] = self._parse_method(item)

                # Extract attributes
                attributes = []
                for item in node.body:
                    if isinstance(item, ast.Assign):
                        for target in item.targets:
                            if isinstance(target, ast.Name):
                                attributes.append(target.id)
                            elif isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name):
                                attributes.append(f"{target.value.id}.{target.attr}")

                # Extract decorators
                decorators = [self._get_decorator_name(d) for d in node.decorator_list]

                # Extract base classes
                bases = [self._get_base_name(base) for base in node.bases]

                classes[node.name] = ParsedClass(
                    name=node.name,
                    docstring=ast.get_docstring(node),
                    methods=methods,
                    attributes=attributes,
                    decorators=decorators,
                    bases=bases,
                    lineno=node.lineno
                )

        return classes

    def _extract_functions(self) -> Dict[str, ParsedMethod]:
        """Extract all top-level functions"""
        functions = {}

        for node in self.current_tree.body:
            if isinstance(node, ast.FunctionDef):
                functions[node.name] = self._parse_method(node)

        return functions

    def _parse_method(self, node: ast.FunctionDef) -> ParsedMethod:
        """Parse method/function"""
        # Extract arguments
        args = [arg.arg for arg in node.args.args]

        # Extract return type
        returns = None
        if node.returns:
            returns = ast.unparse(node.returns)

        # Extract decorators
        decorators = [self._get_decorator_name(d) for d in node.decorator_list]

        # Extract body
        body = ast.get_source_segment(self.current_code, node) or ""

        return ParsedMethod(
            name=node.name,
            args=args,
            returns=returns,
            docstring=ast.get_docstring(node),
            decorators=decorators,
            lineno=node.lineno,
            body=body
        )

    def _extract_imports(self) -> List[str]:
        """Extract all imports"""
        imports = []

        for node in ast.walk(self.current_tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    imports.append(f"{module}.{alias.name}" if module else alias.name)

        return imports

    def _extract_globals(self) -> List[str]:
        """Extract global variable assignments"""
        globals = []

        for node in self.current_tree.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        globals.append(target.id)

        return globals

    def _get_decorator_name(self, decorator: ast.AST) -> str:
        """Get decorator name"""
        if isinstance(decorator, ast.Name):
            return decorator.id
        elif isinstance(decorator, ast.Call):
            return self._get_decorator_name(decorator.func)
        elif isinstance(decorator, ast.Attribute):
            return decorator.attr
        return ""

    def _get_base_name(self, base: ast.AST) -> str:
        """Get base class name"""
        if isinstance(base, ast.Name):
            return base.id
        elif isinstance(base, ast.Attribute):
            return ast.unparse(base)
        return ""

    def find_method_by_name(self, parsed_code: ParsedCode, method_name: str) -> Optional[ParsedMethod]:
        """Find method by name across all classes"""
        for cls in parsed_code.classes.values():
            if method_name in cls.methods:
                return cls.methods[method_name]
        return None

    def find_class_by_method(self, parsed_code: ParsedCode, method_name: str) -> Optional[str]:
        """Find which class has a method"""
        for cls_name, cls in parsed_code.classes.items():
            if method_name in cls.methods:
                return cls_name
        return None

    def get_method_body(self, parsed_code: ParsedCode, method_name: str) -> Optional[str]:
        """Get method body as string"""
        method = self.find_method_by_name(parsed_code, method_name)
        return method.body if method else None

    def get_all_method_names(self, parsed_code: ParsedCode, class_name: str = None) -> List[str]:
        """Get all method names, optionally filtered by class"""
        if class_name:
            cls = parsed_code.classes.get(class_name)
            return list(cls.methods.keys()) if cls else []
        else:
            # Get methods from all classes
            methods = []
            for cls in parsed_code.classes.values():
                methods.extend(cls.methods.keys())
            return methods

    def get_class_hierarchy(self, parsed_code: ParsedCode) -> Dict[str, List[str]]:
        """Get class inheritance hierarchy"""
        hierarchy = {}

        for cls_name, cls in parsed_code.classes.items():
            hierarchy[cls_name] = cls.bases

        return hierarchy

    def analyze_code_complexity(self, parsed_code: ParsedCode) -> Dict[str, Any]:
        """Analyze code complexity"""
        total_methods = sum(len(cls.methods) for cls in parsed_code.classes.values())
        total_functions = len(parsed_code.functions)

        # Count lines of code
        lines = self.current_code.split('\n')
        loc = len(lines)
        non_empty_loc = len([l for l in lines if l.strip()])

        return {
            'total_classes': len(parsed_code.classes),
            'total_methods': total_methods,
            'total_functions': total_functions,
            'total_imports': len(parsed_code.imports),
            'lines_of_code': loc,
            'non_empty_lines': non_empty_loc,
            'average_methods_per_class': total_methods / len(parsed_code.classes) if parsed_code.classes else 0
        }


# Test the code parser
if __name__ == "__main__":
    parser = CodeParser()

    test_code = """
import pandas as pd
import requests

class BacksideBScanner:
    '''Scanner for backside B patterns'''

    def __init__(self, api_key, d0_start, d0_end):
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end

    def get_trading_dates(self):
        return pd.date_range(self.d0_start, self.d0_end, freq='B')

    def fetch_data(self):
        return pd.DataFrame()

def helper_function():
    pass
"""

    print("Testing CodeParser...\n")

    parsed = parser.parse(test_code)

    print("=" * 70)
    print("PARSED CODE STRUCTURE")
    print("=" * 70)

    print(f"\nClasses: {list(parsed.classes.keys())}")
    print(f"Functions: {list(parsed.functions.keys())}")
    print(f"Imports: {parsed.imports}")

    print(f"\nClass: BacksideBScanner")
    cls = parsed.classes['BacksideBScanner']
    print(f"  Methods: {list(cls.methods.keys())}")
    print(f"  Attributes: {cls.attributes}")
    print(f"  Bases: {cls.bases}")

    print("\nMethods:")
    for method_name, method in cls.methods.items():
        print(f"  - {method_name}({', '.join(method.args)})")

    complexity = parser.analyze_code_complexity(parsed)
    print("\nComplexity Analysis:")
    for key, value in complexity.items():
        print(f"  {key}: {value}")
