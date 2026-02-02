# AST Analysis for Renata V2

## 📋 Overview

AST (Abstract Syntax Tree) analysis is the first stage in the Renata V2 transformation pipeline. It converts raw Python code into a structured tree representation that allows us to understand the code's structure, extract key components, and detect patterns.

---

## 🎯 What is AST?

### Definition
An **Abstract Syntax Tree** is a tree representation of the abstract syntactic structure of source code. Each node in the tree denotes a construct occurring in the source code.

### Why Use AST?
- **Structure Understanding**: See how code is organized
- **Component Extraction**: Pull out functions, classes, conditions
- **Pattern Detection**: Identify coding patterns and conventions
- **Safe Transformation**: Modify code without breaking syntax
- **Type Analysis**: Understand data types and flows

### AST vs String Manipulation
```python
# String manipulation (BAD)
code.replace("get_all_stocks()", "fetch_grouped_data()")
# ❌ Can break if variable named "get_all_stocks"
# ❌ Can break if commented out
# ❌ Can break if in string literal

# AST manipulation (GOOD)
tree = ast.parse(code)
# Find function calls
# Replace only actual function calls
# ✅ Safe, accurate, reliable
```

---

## 🔧 Python AST Module

### Basic Usage

```python
import ast

# Parse code into AST
code = """
def scan_stocks():
    stocks = get_all_stocks()
    for stock in stocks:
        if stock['price'] > 50:
            print(stock['ticker'])
"""

tree = ast.parse(code)

# Analyze the tree
print(ast.dump(tree, indent=2))
```

### AST Node Types

**Common Node Types**:
- `Module`: Top-level container
- `FunctionDef`: Function definition
- `ClassDef`: Class definition
- `Call`: Function call
- `Compare`: Comparison operation
- `If`: If statement
- `For`: For loop
- `Assign`: Assignment
- `Import`: Import statement

**Example AST Structure**:
```
Module
├── FunctionDef (scan_stocks)
│   ├── body
│   │   ├── Assign
│   │   │   ├── Call (get_all_stocks)
│   │   │   └── Name (stocks)
│   │   ├── For
│   │   │   ├── target (Name: stock)
│   │   │   ├── iter (Name: stocks)
│   │   │   └── body
│   │   │       └── If
│   │   │           ├── test (Compare)
│   │   │           │   ├── Subscript (stock['price'])
│   │   │           │   ├── Gt
│   │   │           │   └── Constant (50)
│   │   │           └── body
│   │   │               └── Call (print)
```

---

## 🏗️ Renata V2 AST Parser Architecture

### Component Structure

```python
# RENATA_V2/core/ast_parser.py

from dataclasses import dataclass
from typing import List, Dict, Any
import ast

@dataclass
class FunctionInfo:
    """Information about a function"""
    name: str
    args: List[str]
    returns: str
    docstring: str
    line_number: int
    body_length: int

@dataclass
class ClassInfo:
    """Information about a class"""
    name: str
    methods: List[str]
    base_classes: List[str]
    docstring: str
    line_number: int

@dataclass
class ConditionInfo:
    """Information about a condition"""
    condition_type: str  # 'if', 'elif', 'else'
    test: str
    line_number: int
    context: str

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
    name: str
    alias: str
    line_number: int

class ASTParser:
    """Parse Python code and extract structured information"""

    def __init__(self):
        self.tree = None
        self.source_lines = []

    def parse_code(self, code: str) -> ast.Module:
        """Parse code into AST"""
        self.tree = ast.parse(code)
        self.source_lines = code.split('\n')
        return self.tree

    def extract_functions(self) -> List[FunctionInfo]:
        """Extract all function definitions"""
        # Implementation below
        pass

    def extract_conditions(self) -> List[ConditionInfo]:
        """Extract all conditionals"""
        # Implementation below
        pass

    # ... more methods
```

---

## 🔍 Extraction Methods

### 1. Function Extraction

```python
def extract_functions(self) -> List[FunctionInfo]:
    """
    Extract all function definitions from AST

    Returns:
        List of FunctionInfo objects
    """
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
```

**Example Output**:
```python
[
    FunctionInfo(
        name='scan_stocks',
        args=['self', 'start_date', 'end_date'],
        returns='List[Dict]',
        docstring='Scan stocks for A+ parabolic setup',
        line_number=15,
        body_length=42
    ),
    FunctionInfo(
        name='check_parabolic',
        args=['self', 'stock'],
        returns='bool',
        docstring='Check if stock is in parabolic setup',
        line_number=58,
        body_length=12
    )
]
```

---

### 2. Condition Extraction

```python
def extract_conditions(self) -> List[ConditionInfo]:
    """
    Extract all conditionals (if/elif/else)

    Returns:
        List of ConditionInfo objects
    """
    conditions = []

    for node in ast.walk(self.tree):
        if isinstance(node, ast.If):
            # Get the test expression
            test = ast.unparse(node.test)

            # Determine condition type
            # Check if this is an elif (part of previous if)
            condition_type = 'if'
            # (Simplified - in reality need to check parent)

            info = ConditionInfo(
                condition_type=condition_type,
                test=test,
                line_number=node.lineno,
                context=''  # Would extract from parent
            )
            conditions.append(info)

    return conditions
```

**Example Output**:
```python
[
    ConditionInfo(
        condition_type='if',
        test="stock['price'] > stock['ma200']",
        line_number=23,
        context='scan_stocks'
    ),
    ConditionInfo(
        condition_type='if',
        test='volume > 1_000_000',
        line_number=25,
        context='scan_stocks'
    )
]
```

---

### 3. Comparison Extraction

```python
def extract_comparisons(self) -> List[ComparisonInfo]:
    """
    Extract all comparison operations

    Returns:
        List of ComparisonInfo objects
    """
    comparisons = []

    for node in ast.walk(self.tree):
        if isinstance(node, ast.Compare):
            # Get left operand
            left = ast.unparse(node.left)

            # Get operator
            if len(node.ops) > 0:
                operator = type(node.ops[0]).__name__
                # Convert to readable
                operator_map = {
                    'Gt': '>',
                    'Lt': '<',
                    'GtE': '>=',
                    'LtE': '<=',
                    'Eq': '==',
                    'NotEq': '!='
                }
                operator = operator_map.get(operator, operator)

            # Get right operand
            if len(node.comparators) > 0:
                right = ast.unparse(node.comparators[0])

            info = ComparisonInfo(
                left=left,
                operator=operator,
                right=right,
                line_number=node.lineno
            )
            comparisons.append(info)

    return comparisons
```

**Example Output**:
```python
[
    ComparisonInfo(
        left="stock['price']",
        operator='>',
        right='50',
        line_number=23
    ),
    ComparisonInfo(
        left='pct_change',
        operator='>=',
        right='0.5',
        line_number=45
    ),
    ComparisonInfo(
        left='volume',
        operator='>',
        right='1_000_000',
        line_number=28
    )
]
```

---

### 4. Data Source Detection

```python
def detect_data_sources(self) -> DataSourceInfo:
    """
    Detect where data comes from

    Returns:
        DataSourceInfo object
    """
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
            if func_name in ['open', 'pd.read_csv', 'pd.read_feather', 'pd.read_parquet']:
                sources['files'].append({
                    'function': func_name,
                    'line': node.lineno
                })

            # Polygon API usage
            if 'polygon.io' in ast.unparse(node):
                sources['polygon_usage'] = True
                sources['apis'].append({
                    'endpoint': 'polygon',
                    'line': node.lineno
                })

        # Detect hardcoded lists
        if isinstance(node, ast.List):
            # Check if it's a list of strings (likely tickers)
            if len(node.elts) > 0 and all(isinstance(elt, ast.Constant) for elt in node.elts[:5]):
                sources['hardcoded_lists'].append({
                    'length': len(node.elts),
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
```

**Example Output**:
```python
DataSourceInfo(
    primary_source='polygon_api',
    files=[],
    apis=[{'endpoint': 'polygon', 'line': 45}],
    hardcoded_lists=[],
    polygon_usage=True
)
```

---

### 5. Scanner Type Classification

```python
def classify_scanner_type(self) -> ScannerType:
    """
    Classify scanner as single or multi-pattern

    Returns:
        ScannerType enum
    """
    # Indicators of multi-scanner
    multi_scanner_indicators = {
        'pattern_columns': 0,
        'pattern_check_methods': 0,
        'pattern_filter_sections': 0
    }

    # Check for pattern column assignments
    for node in ast.walk(self.tree):
        # Look for: results['pattern_name'] = ...
        if isinstance(node, ast.Assign):
            if isinstance(node.targets[0], ast.Subscript):
                subscript = node.targets[0]
                if isinstance(subscript.slice, ast.Constant):
                    col_name = subscript.slice.value.lower()
                    if 'pattern' in col_name or col_name in ['d2', 'd3', 'd4', 'lc_frontside']:
                        multi_scanner_indicators['pattern_columns'] += 1

        # Look for methods like check_d2_pattern, check_d3_pattern
        if isinstance(node, ast.FunctionDef):
            if 'pattern' in node.name.lower() or any(x in node.name.lower() for x in ['d2', 'd3', 'd4', 'lc']):
                if 'check' in node.name.lower():
                    multi_scanner_indicators['pattern_check_methods'] += 1

    # Make determination
    pattern_count = (
        multi_scanner_indicators['pattern_columns'] +
        multi_scanner_indicators['pattern_check_methods']
    )

    if pattern_count >= 3:
        confidence = 'high'
        scanner_type = ScannerType.MULTI_SCANNER
    elif pattern_count >= 1:
        confidence = 'medium'
        scanner_type = ScannerType.MULTI_SCANNER
    else:
        confidence = 'high'
        scanner_type = ScannerType.SINGLE_SCANNER

    return ClassificationResult(
        scanner_type=scanner_type,
        confidence=confidence,
        indicators=multi_scanner_indicators
    )
```

**Example Output**:
```python
# Single-Scanner (A+ Parabolic)
ClassificationResult(
    scanner_type=ScannerType.SINGLE_SCANNER,
    confidence='high',
    indicators={'pattern_columns': 0, 'pattern_check_methods': 0}
)

# Multi-Scanner (SC DMR)
ClassificationResult(
    scanner_type=ScannerType.MULTI_SCANNER,
    confidence='high',
    indicators={
        'pattern_columns': 6,
        'pattern_check_methods': 6
    }
)
```

---

## 🎯 Advanced AST Techniques

### 1. Visitor Pattern

For more complex traversals, use the visitor pattern:

```python
class ScannerTypeVisitor(ast.NodeVisitor):
    """Visitor to detect scanner type"""

    def __init__(self):
        self.pattern_count = 0
        self.pattern_names = []

    def visit_Assign(self, node):
        """Visit assignment nodes"""
        if isinstance(node.targets[0], ast.Subscript):
            if isinstance(node.targets[0].slice, ast.Constant):
                col_name = node.targets[0].slice.value
                if 'pattern' in str(col_name).lower():
                    self.pattern_count += 1
                    self.pattern_names.append(col_name)

        self.generic_visit(node)

# Usage
visitor = ScannerTypeVisitor()
visitor.visit(tree)

print(f"Found {visitor.pattern_count} patterns")
print(f"Pattern names: {visitor.pattern_names}")
```

---

### 2. Transformer Pattern

For modifying code:

```python
class UpgradingTransformer(ast.NodeTransformer):
    """Transform outdated code to v31 standard"""

    def visit_Call(self, node):
        """Replace old API calls with new ones"""
        # Replace get_all_stocks() with fetch_grouped_data()
        if isinstance(node.func, ast.Name) and node.func.id == 'get_all_stocks':
            new_call = ast.Call(
                func=ast.Name(id='fetch_grouped_data', ctx=ast.Load()),
                args=node.args,
                keywords=node.keywords
            )
            return new_call

        return self.generic_visit(node)

# Usage
transformer = UpgradingTransformer()
new_tree = transformer.visit(old_tree)
new_code = ast.unparse(new_tree)
```

---

### 3. Extracting Variable Values

Find numeric constants and their meanings:

```python
def extract_parameters(self) -> Dict[str, Any]:
    """
    Extract numeric parameters from code

    Returns:
        Dict of parameter name to value
    """
    parameters = {}

    for node in ast.walk(self.tree):
        if isinstance(node, ast.Assign):
            # Look for: min_price = 0.75
            if isinstance(node.targets[0], ast.Name):
                var_name = node.targets[0].id
                if isinstance(node.value, ast.Constant):
                    value = node.value.value
                    if isinstance(value, (int, float)):
                        parameters[var_name] = {
                            'value': value,
                            'line': node.lineno
                        }

    return parameters
```

**Example Output**:
```python
{
    'min_price': {'value': 0.75, 'line': 23},
    'min_volume': {'value': 1_000_000, 'line': 24},
    'gap_threshold': {'value': 0.5, 'line': 25}
}
```

---

## 🧪 Testing AST Parser

### Unit Tests

```python
# tests/test_ast_parser.py

import pytest
from RENATA_V2.core.ast_parser import ASTParser

def test_parse_a_plus_scanner():
    """Test parsing A+ Parabolic scanner"""
    with open('tests/data/a_plus_scanner.py', 'r') as f:
        code = f.read()

    parser = ASTParser()
    tree = parser.parse_code(code)

    # Verify functions extracted
    functions = parser.extract_functions()
    assert len(functions) >= 2
    assert any(f.name == 'check_parabolic' for f in functions)

    # Verify conditions extracted
    conditions = parser.extract_conditions()
    assert len(conditions) > 0

    # Verify comparisons extracted
    comparisons = parser.extract_comparisons()
    assert len(comparisons) > 0

def test_classify_single_scanner():
    """Test single-scanner classification"""
    with open('tests/data/a_plus_scanner.py', 'r') as f:
        code = f.read()

    parser = ASTParser()
    parser.parse_code(code)

    result = parser.classify_scanner_type()
    assert result.scanner_type == ScannerType.SINGLE_SCANNER
    assert result.confidence == 'high'

def test_classify_multi_scanner():
    """Test multi-scanner classification"""
    with open('tests/data/dmr_scanner.py', 'r') as f:
        code = f.read()

    parser = ASTParser()
    parser.parse_code(code)

    result = parser.classify_scanner_type()
    assert result.scanner_type == ScannerType.MULTI_SCANNER
    assert result.confidence == 'high'

def test_detect_polygon_usage():
    """Test Polygon API detection"""
    with open('tests/data/dmr_scanner.py', 'r') as f:
        code = f.read()

    parser = ASTParser()
    parser.parse_code(code)

    sources = parser.detect_data_sources()
    assert sources.primary_source == 'polygon_api'
    assert sources.polygon_usage is True
```

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Cache Parsed Trees**:
```python
@lru_cache(maxsize=128)
def parse_cached(code_hash: str) -> ast.Module:
    """Cache parsed ASTs"""
    return ast.parse(code)
```

2. **Early Termination**:
```python
def classify_scanner_type(self) -> ScannerType:
    """Classify with early termination"""
    # If we find 3+ patterns, stop looking
    pattern_count = 0

    for node in ast.walk(self.tree):
        if self._is_pattern_node(node):
            pattern_count += 1
            if pattern_count >= 3:
                return ScannerType.MULTI_SCANNER

    return ScannerType.SINGLE_SCANNER
```

3. **Parallel Processing**:
```python
from concurrent.futures import ThreadPoolExecutor

def analyze_multiple_scanners(codes: List[str]) -> List[ASTInfo]:
    """Analyze multiple scanners in parallel"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = executor.map(analyze_scanner, codes)

    return list(results)
```

---

## 🔗 Integration with AI Agent

The AST parser provides structured information to the AI agent:

```python
# AST Parser extracts structure
parser = ASTParser()
tree = parser.parse_code(code)
ast_info = ASTInfo(
    functions=parser.extract_functions(),
    conditions=parser.extract_conditions(),
    comparisons=parser.extract_comparisons(),
    data_source=parser.detect_data_sources(),
    scanner_type=parser.classify_scanner_type()
)

# AI Agent uses AST info for better understanding
strategy = ai_agent.extract_strategy_intent(
    code=code,
    ast_info=ast_info  # ✅ Better context!
)
```

---

## 📝 Best Practices

### DO:
✅ Use AST for understanding code structure
✅ Combine AST analysis with AI for best results
✅ Handle syntax errors gracefully
✅ Cache parsed trees for performance
✅ Use visitor pattern for complex traversals

### DON'T:
❌ Don't use string replacement for code transformation
❌ Don't assume all code is well-formed
❌ Don't ignore line numbers (need for error messages)
❌ Don't traverse tree unnecessarily (early termination)
❌ Don't modify code without validation

---

## 🎯 Key Takeaways

1. **AST is Safe**: Unlike string manipulation, AST is safe and accurate
2. **Structure First**: AST tells us HOW code is organized
3. **AI Second**: AI tells us WHAT code does
4. **Together**: AST + AI = Complete understanding
5. **Classification**: AST can reliably classify scanner types
6. **Extraction**: AST can extract functions, conditions, comparisons
7. **Detection**: AST can detect data sources and patterns

---

## 📚 References

- [Python AST Documentation](https://docs.python.org/3/library/ast.html)
- [ast module source code](https://github.com/python/cpython/blob/main/Lib/ast.py)
- [Green Tree Snakes - AST Tutorial](https://greentreesnakes.readthedocs.io/)

---

**Version**: 2.0
**Last Updated**: 2025-01-02
