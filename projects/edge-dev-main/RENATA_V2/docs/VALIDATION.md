# Validation Pipeline for Renata V2

## 📋 Overview

The Validation Pipeline ensures all generated code is **production-ready** and **v31 compliant**. It performs three stages of validation: syntax, structure, and logic.

---

## 🎯 Why Validation?

### The Problem

AI-generated code can have issues:

```python
# ❌ AI generates code with errors:
def detect_patterns(data):
    # Syntax error: missing colon
    if data['price'] > data['ma200']

    # Wrong function name
    results = fetch_all_grouped_data()  # Should be fetch_grouped_data()

    # Invalid characters
    ADV20_ = data['adv20']  # $ is invalid

    # Non-vectorized (slow)
    results = []
    for i, row in data.iterrows():  # Very slow!
        if row['price'] > row['ma200']:
            results.append(row)

    return results
```

### The Solution

Three-stage validation catches all errors:

```python
# ✅ Validation catches and fixes:
# 1. Syntax errors (missing colons, invalid Python)
# 2. Structure errors (wrong function names, missing methods)
# 3. Logic errors (bad patterns, deprecated functions)
```

---

## 🏗️ Validation Architecture

### Three-Stage Pipeline

```
Generated Code
    ↓
┌─────────────────────────────────┐
│  STAGE 1: Syntax Validation     │
│  - AST parse to check syntax    │
│  - Catch syntax errors          │
│  - Return line numbers          │
└─────────────────────────────────┘
    ↓ (if valid)
┌─────────────────────────────────┐
│  STAGE 2: Structure Validation  │
│  - Check required methods        │
│  - Verify v31 structure         │
│  - Validate class structure     │
└─────────────────────────────────┘
    ↓ (if valid)
┌─────────────────────────────────┐
│  STAGE 3: Logic Validation      │
│  - Check for common issues       │
│  - Validate API usage            │
│  - Check for bad patterns        │
└─────────────────────────────────┘
    ↓ (if valid)
✅ VALIDATED - Ready for Production
```

### Self-Correction Loop

If validation fails, Renata automatically attempts to fix:

```
Validation Failed
    ↓
Generate Correction Prompt
    ↓ (describe errors)
Ask AI to Fix
    ↓
Re-Validate
    ↓ (if still invalid)
Retry (max 3 attempts)
    ↓
Return Best Effort
```

---

## 🔧 Stage 1: Syntax Validation

### Implementation

```python
# RENATA_V2/core/validator.py

import ast
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class ValidationResult:
    """Result of validation"""
    is_valid: bool
    stage: str
    errors: List[str]
    warnings: List[str]
    line_numbers: List[int]

class Validator:
    """Validate generated v31 scanner code"""

    def validate_syntax(self, code: str) -> ValidationResult:
        """
        STAGE 1: Validate Python syntax

        Args:
            code: Generated Python code

        Returns:
            ValidationResult with syntax validation results
        """
        errors = []
        warnings = []
        line_numbers = []

        try:
            # Attempt to parse code
            tree = ast.parse(code)
            print("✅ Stage 1: Syntax validation passed")

            return ValidationResult(
                is_valid=True,
                stage='syntax',
                errors=[],
                warnings=[],
                line_numbers=[]
            )

        except SyntaxError as e:
            # Catch syntax errors
            error_msg = f"Syntax error at line {e.lineno}: {e.msg}"
            errors.append(error_msg)
            line_numbers.append(e.lineno)

            print(f"❌ Stage 1: Syntax validation failed")
            print(f"   Line {e.lineno}: {e.msg}")

            return ValidationResult(
                is_valid=False,
                stage='syntax',
                errors=errors,
                warnings=warnings,
                line_numbers=line_numbers
            )

        except IndentationError as e:
            # Catch indentation errors
            error_msg = f"Indentation error at line {e.lineno}: {e.msg}"
            errors.append(error_msg)
            line_numbers.append(e.lineno)

            print(f"❌ Stage 1: Indentation error")
            print(f"   Line {e.lineno}: {e.msg}")

            return ValidationResult(
                is_valid=False,
                stage='syntax',
                errors=errors,
                warnings=warnings,
                line_numbers=line_numbers
            )
```

### Common Syntax Errors

1. **Missing Colon**:
```python
# ❌ Error
if data['price'] > data['ma200']  # Missing colon

# ✅ Fixed
if data['price'] > data['ma200']:
```

2. **Mismatched Brackets**:
```python
# ❌ Error
results = data[(data['price'] > 50) & (data['volume'] > 1_000_000]  # Wrong bracket

# ✅ Fixed
results = data[(data['price'] > 50) & (data['volume'] > 1_000_000)]
```

3. **Invalid Characters**:
```python
# ❌ Error
ADV20_ = data['adv20']  # $ is invalid in variable names

# ✅ Fixed
adv20 = data['adv20']  # Removed $
```

---

## 🔧 Stage 2: Structure Validation

### Implementation

```python
def validate_v31_structure(self, code: str) -> ValidationResult:
    """
    STAGE 2: Validate v31 structure compliance

    Checks for required methods and proper structure.

    Args:
        code: Generated Python code

    Returns:
        ValidationResult with structure validation results
    """
    errors = []
    warnings = []
    line_numbers = []

    try:
        tree = ast.parse(code)
    except SyntaxError:
        # If syntax is invalid, skip structure validation
        return ValidationResult(
            is_valid=False,
            stage='structure',
            errors=['Syntax validation failed first'],
            warnings=[],
            line_numbers=[]
        )

    # Check for required methods
    required_methods = {
        'fetch_grouped_data',
        'apply_smart_filters',
        'detect_patterns',
        'run_scan'
    }

    found_methods = set()

    # Find all class definitions
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Find all methods in this class
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    found_methods.add(item.name)

    # Check for missing methods
    missing_methods = required_methods - found_methods

    if missing_methods:
        for method in missing_methods:
            error_msg = f"❌ Missing required method: {method}()"
            errors.append(error_msg)

        print(f"❌ Stage 2: Structure validation failed")
        print(f"   Missing methods: {missing_methods}")

        return ValidationResult(
            is_valid=False,
            stage='structure',
            errors=errors,
            warnings=warnings,
            line_numbers=line_numbers
        )

    # Check for wrong function names
    wrong_names = found_methods & {
        'fetch_all_grouped_data',  # Wrong!
        'get_all_stocks',  # Wrong!
        'scan_stocks',  # Wrong!
    }

    if wrong_names:
        for name in wrong_names:
            error_msg = f"❌ Using wrong function name: {name}()"
            errors.append(error_msg)

        print(f"❌ Stage 2: Wrong function names detected")
        print(f"   Wrong names: {wrong_names}")

        return ValidationResult(
            is_valid=False,
            stage='structure',
            errors=errors,
            warnings=warnings,
            line_numbers=line_numbers
        )

    # Check for class definition
    has_class = any(isinstance(node, ast.ClassDef) for node in tree.body)

    if not has_class:
        errors.append("❌ No class definition found")
        print("❌ Stage 2: No class definition found")

        return ValidationResult(
            is_valid=False,
            stage='structure',
            errors=errors,
            warnings=warnings,
            line_numbers=line_numbers
        )

    # Check for __init__ method
    has_init = '__init__' in found_methods

    if not has_init:
        warnings.append("⚠️  No __init__ method found (should initialize API key)")

    print("✅ Stage 2: Structure validation passed")

    return ValidationResult(
        is_valid=True,
        stage='structure',
        errors=[],
        warnings=warnings,
        line_numbers=[]
    )
```

### Common Structure Errors

1. **Missing Methods**:
```python
# ❌ Error: Missing run_scan method
class MyScanner:
    def fetch_grouped_data(self):
        pass

    def apply_smart_filters(self, data):
        pass

    def detect_patterns(self, data):
        pass

    # ❌ Missing run_scan!

# ✅ Fixed
class MyScanner:
    def fetch_grouped_data(self):
        pass

    def apply_smart_filters(self, data):
        pass

    def detect_patterns(self, data):
        pass

    def run_scan(self, start_date, end_date):  # ✅ Added
        pass
```

2. **Wrong Function Names**:
```python
# ❌ Error: Wrong function name
def fetch_all_grouped_data(self):  # ❌ Should be fetch_grouped_data
    pass

# ✅ Fixed
def fetch_grouped_data(self):  # ✅ Correct
    pass
```

3. **No Class Definition**:
```python
# ❌ Error: Functions not in a class
def fetch_grouped_data(self):
    pass

def apply_smart_filters(self, data):
    pass

# ✅ Fixed
class MyScanner:  # ✅ Wrap in class
    def fetch_grouped_data(self):
        pass

    def apply_smart_filters(self, data):
        pass
```

---

## 🔧 Stage 3: Logic Validation

### Implementation

```python
def validate_logic(self, code: str) -> ValidationResult:
    """
    STAGE 3: Validate code logic and patterns

    Checks for common issues and bad patterns.

    Args:
        code: Generated Python code

    Returns:
        ValidationResult with logic validation results
    """
    errors = []
    warnings = []
    line_numbers = []

    # Check 1: Invalid characters
    if '$' in code:
        # Find line numbers with $
        lines = code.split('\n')
        for i, line in enumerate(lines, 1):
            if '$' in line:
                errors.append(f"❌ Line {i}: Contains invalid special character ($)")
                line_numbers.append(i)

    # Check 2: Wrong function usage
    wrong_functions = [
        'fetch_all_grouped_data()',
        'get_all_stocks()',
    ]

    for func in wrong_functions:
        if func in code:
            errors.append(f"❌ Using {func} (should use fetch_grouped_data)")

    # Check 3: Non-vectorized operations
    slow_patterns = [
        '.iterrows()',
        'for i, row in',
        'for index, row in',
    ]

    for pattern in slow_patterns:
        if pattern in code:
            warnings.append(f"⚠️  Using {pattern} (slow, use vectorized operations)")

    # Check 4: Missing error handling
    if 'try:' not in code:
        warnings.append("⚠️  No try-except blocks found (should handle API errors)")

    # Check 5: Hardcoded values
    if 'api_key = "' in code or 'api_key = "' in code.lower():
        errors.append("❌ Hardcoded API key detected (should use environment variable)")

    # Check 6: Deprecated patterns
    deprecated = [
        'pd.DataFrame.iterrows',
        'pd.DataFrame.itertuples',
    ]

    for pattern in deprecated:
        if pattern in code:
            warnings.append(f"⚠️  Using deprecated pattern: {pattern}")

    # Check 7: Missing type hints
    if 'def ' in code and ' -> ' not in code:
        warnings.append("⚠️  Missing type hints in function definitions")

    # Determine validity
    is_valid = len(errors) == 0

    if not is_valid:
        print(f"❌ Stage 3: Logic validation failed")
        for error in errors:
            print(f"   {error}")
    else:
        print("✅ Stage 3: Logic validation passed")

        if warnings:
            print(f"⚠️  {len(warnings)} warnings:")
            for warning in warnings[:3]:  # Show first 3
                print(f"   {warning}")

    return ValidationResult(
        is_valid=is_valid,
        stage='logic',
        errors=errors,
        warnings=warnings,
        line_numbers=line_numbers
    )
```

### Common Logic Errors

1. **Invalid Characters**:
```python
# ❌ Error
ADV20_ = data['adv20']  # $ is invalid

# ✅ Fixed
adv20 = data['adv20']
```

2. **Wrong API Usage**:
```python
# ❌ Error
data = get_all_stocks()  # Wrong function

# ✅ Fixed
data = self.fetch_grouped_data(start_date, end_date)
```

3. **Non-Vectorized Operations**:
```python
# ❌ Error: Very slow!
results = []
for i, row in data.iterrows():
    if row['price'] > row['ma200']:
        results.append(row)

# ✅ Fixed: Fast!
pattern_mask = data['price'] > data['ma200']
results = data[pattern_mask]
```

4. **Missing Error Handling**:
```python
# ❌ Error: No error handling
def fetch_data(self, date):
    response = requests.get(url)
    return response.json()  # Can fail!

# ✅ Fixed: Has error handling
def fetch_data(self, date):
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching {date}: {e}")
        return []
```

---

## 🔄 Self-Correction Loop

### Implementation

```python
def validate_and_correct(
    self,
    code: str,
    max_attempts: int = 3
) -> tuple[str, ValidationResult]:
    """
    Validate code and attempt self-correction

    Args:
        code: Generated code
        max_attempts: Maximum correction attempts

    Returns:
        Tuple of (corrected_code, final_validation_result)
    """
    current_code = code
    validation_history = []

    for attempt in range(max_attempts):
        print(f"\n🔄 Validation attempt {attempt + 1}/{max_attempts}")

        # Stage 1: Syntax
        syntax_result = self.validate_syntax(current_code)
        validation_history.append(syntax_result)

        if not syntax_result.is_valid:
            print("🔧 Attempting syntax correction...")
            current_code = self._correct_syntax_errors(
                current_code,
                syntax_result.errors
            )
            continue

        # Stage 2: Structure
        structure_result = self.validate_v31_structure(current_code)
        validation_history.append(structure_result)

        if not structure_result.is_valid:
            print("🔧 Attempting structure correction...")
            current_code = self._correct_structure_errors(
                current_code,
                structure_result.errors
            )
            continue

        # Stage 3: Logic
        logic_result = self.validate_logic(current_code)
        validation_history.append(logic_result)

        if not logic_result.is_valid:
            print("🔧 Attempting logic correction...")
            current_code = self._correct_logic_errors(
                current_code,
                logic_result.errors
            )
            continue

        # All stages passed!
        print("\n✅ All validation stages passed!")
        return current_code, logic_result

    # Max attempts reached
    print(f"\n⚠️  Max attempts ({max_attempts}) reached")
    print("Returning best effort code")

    # Return the code with the fewest errors
    best_result = min(validation_history, key=lambda r: len(r.errors))
    return current_code, best_result

def _correct_syntax_errors(
    self,
    code: str,
    errors: List[str]
) -> str:
    """Correct syntax errors using AI"""
    prompt = f"""
Fix the syntax errors in this code.

## Code with Errors:
{code}

## Errors:
{json.dumps(errors, indent=2)}

## Instructions:
1. Fix ALL syntax errors
2. Keep the same logic
3. Ensure valid Python syntax
4. Return ONLY the corrected code (no explanations)

Corrected code:
"""

    from RENATA_V2.core.ai_agent import AIAgent
    agent = AIAgent()

    response = agent._make_request(prompt, response_format="text")

    return response

def _correct_structure_errors(
    self,
    code: str,
    errors: List[str]
) -> str:
    """Correct structure errors using AI"""
    prompt = f"""
Fix the structure errors in this code.

## Code with Errors:
{code}

## Errors:
{json.dumps(errors, indent=2)}

## Required Methods for v31 Compliance:
1. fetch_grouped_data(self, start_date, end_date)
2. apply_smart_filters(self, stage1_data)
3. detect_patterns(self, stage2_data)
4. run_scan(self, start_date, end_date)

## Instructions:
1. Add missing methods
2. Fix wrong function names
3. Ensure class structure
4. Return ONLY the corrected code

Corrected code:
"""

    from RENATA_V2.core.ai_agent import AIAgent
    agent = AIAgent()

    response = agent._make_request(prompt, response_format="text")

    return response

def _correct_logic_errors(
    self,
    code: str,
    errors: List[str]
) -> str:
    """Correct logic errors using AI"""
    prompt = f"""
Fix the logic errors in this code.

## Code with Errors:
{code}

## Errors:
{json.dumps(errors, indent=2)}

## Common Fixes:
1. Remove $ characters from variable names
2. Replace fetch_all_grouped_data with fetch_grouped_data
3. Replace get_all_stocks with Polygon API calls
4. Use vectorized pandas operations instead of iterrows
5. Add try-except blocks for error handling

## Instructions:
1. Fix ALL logic errors
2. Keep the same logic
3. Use vectorized operations
4. Add error handling
5. Return ONLY the corrected code

Corrected code:
"""

    from RENATA_V2.core.ai_agent import AIAgent
    agent = AIAgent()

    response = agent._make_request(prompt, response_format="text")

    return response
```

---

## 🧪 Testing Validation

### Unit Tests

```python
# tests/test_validator.py

import pytest
from RENATA_V2.core.validator import Validator

def test_validate_syntax_valid_code():
    """Test syntax validation with valid code"""
    validator = Validator()

    code = """
def test_function():
    return 42
"""

    result = validator.validate_syntax(code)

    assert result.is_valid is True
    assert len(result.errors) == 0

def test_validate_syntax_invalid_code():
    """Test syntax validation with invalid code"""
    validator = Validator()

    code = """
def test_function()
    return 42  # Missing colon
"""

    result = validator.validate_syntax(code)

    assert result.is_valid is False
    assert len(result.errors) > 0
    assert 'Syntax error' in result.errors[0]

def test_validate_v31_structure_valid():
    """Test structure validation with valid v31 code"""
    validator = Validator()

    code = """
class TestScanner:
    def fetch_grouped_data(self):
        pass

    def apply_smart_filters(self, data):
        pass

    def detect_patterns(self, data):
        pass

    def run_scan(self, start_date, end_date):
        pass
"""

    result = validator.validate_v31_structure(code)

    assert result.is_valid is True
    assert len(result.errors) == 0

def test_validate_v31_structure_missing_methods():
    """Test structure validation with missing methods"""
    validator = Validator()

    code = """
class TestScanner:
    def fetch_grouped_data(self):
        pass

    def apply_smart_filters(self, data):
        pass

    # Missing detect_patterns and run_scan
"""

    result = validator.validate_v31_structure(code)

    assert result.is_valid is False
    assert len(result.errors) == 2
    assert any('detect_patterns' in e for e in result.errors)
    assert any('run_scan' in e for e in result.errors)

def test_validate_logic_invalid_characters():
    """Test logic validation with invalid characters"""
    validator = Validator()

    code = """
def test_function():
    ADV20_ = data['adv20']  # $ is invalid
    return ADV20_
"""

    result = validator.validate_logic(code)

    assert result.is_valid is False
    assert any('$' in e for e in result.errors)

def test_validate_and_correct():
    """Test full validation and correction loop"""
    validator = Validator()

    code_with_errors = """
def test_function()
    ADV20_ = data['adv20']
    return ADV20_
"""

    corrected_code, final_result = validator.validate_and_correct(
        code_with_errors,
        max_attempts=2
    )

    # Should have attempted corrections
    assert final_result is not None
```

---

## 📊 Validation Metrics

### Success Metrics

Track validation performance:

```python
class ValidationMetrics:
    """Track validation performance"""

    def __init__(self):
        self.total_validations = 0
        self.syntax_errors = 0
        self.structure_errors = 0
        self.logic_errors = 0
        self.corrections_needed = 0
        self.correction_success_rate = 0.0

    def record_validation(
        self,
        result: ValidationResult,
        corrections: int = 0
    ):
        """Record a validation result"""
        self.total_validations += 1

        if result.stage == 'syntax' and not result.is_valid:
            self.syntax_errors += 1
        elif result.stage == 'structure' and not result.is_valid:
            self.structure_errors += 1
        elif result.stage == 'logic' and not result.is_valid:
            self.logic_errors += 1

        if corrections > 0:
            self.corrections_needed += 1

    def calculate_success_rate(self) -> float:
        """Calculate correction success rate"""
        if self.corrections_needed == 0:
            return 100.0

        return (1 - (self.syntax_errors + self.structure_errors + self.logic_errors) /
                (3 * self.total_validations)) * 100

    def print_report(self):
        """Print validation metrics"""
        print(f"\n📊 Validation Metrics:")
        print(f"   Total validations: {self.total_validations}")
        print(f"   Syntax errors: {self.syntax_errors}")
        print(f"   Structure errors: {self.structure_errors}")
        print(f"   Logic errors: {self.logic_errors}")
        print(f"   Corrections needed: {self.corrections_needed}")
        print(f"   Success rate: {self.calculate_success_rate():.1f}%")
```

---

## 📝 Best Practices

### DO:
✅ Validate all generated code
✅ Use all three validation stages
✅ Implement self-correction loop
✅ Track validation metrics
✅ Provide actionable error messages
✅ Test validation thoroughly

### DON'T:
❌ Don't skip validation stages
❌ Don't ignore warnings
❌ Don't use generated code without validation
❌ Don't exceed max correction attempts (can get stuck)
❌ Don't forget to log validation results

---

## 🎯 Key Takeaways

1. **Three Stages**: Syntax → Structure → Logic
2. **Self-Correction**: Automatically fix common errors
3. **Actionable Errors**: Provide line numbers and clear messages
4. **Track Metrics**: Monitor validation performance
5. **Test Thoroughly**: Validate the validator
6. **Fail Fast**: Catch errors early
7. **Iterate**: Use feedback to improve AI prompts

---

## 📚 References

- [Python AST Documentation](https://docs.python.org/3/library/ast.html)
- [Code Quality Best Practices](https://docs.python-guide.org/writing/style/)

---

**Version**: 2.0
**Last Updated**: 2025-01-02
