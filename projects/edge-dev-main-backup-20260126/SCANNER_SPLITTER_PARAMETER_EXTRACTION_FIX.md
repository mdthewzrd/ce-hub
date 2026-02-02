# Scanner Splitter Parameter Extraction Fix

## Problem Summary
Split scanners from the scanner splitter show "0 configurable parameters" in the interactive formatter due to critical bugs in the `extract_scanner_code` function.

## Root Cause Analysis
1. **Syntax Errors**: The extraction process creates malformed Python code with indentation and syntax issues
2. **Missing Dependencies**: Extracted code lacks necessary imports and global variables
3. **AST Parsing Failure**: Malformed code prevents parameter extraction from working
4. **Data Flow Issues**: Parameters are lost between splitter and formatter

## Critical Issues in `extract_scanner_code` Function

### Issue 1: Incomplete Import Extraction
The current code only extracts imports until it hits the first non-import/non-comment line:
```python
# PROBLEMATIC CODE:
for line in lines:
    stripped = line.strip()
    if stripped.startswith(('import ', 'from ')) or (in_imports and not stripped):
        extracted_lines.append(line)
    elif stripped and not stripped.startswith('#'):
        in_imports = False
        break  # ← STOPS TOO EARLY
```

**Fix:** Extract all imports and global variables from the entire file.

### Issue 2: Malformed Function Extraction
The function extraction logic has indentation and syntax problems:
```python
# PROBLEMATIC: Creates broken code structure
for func_name in functions_to_include:
    for i, line in enumerate(lines):
        if line.strip().startswith(f'def {func_name}('):
            # Function finding logic is flawed
```

**Fix:** Preserve complete function structure with proper indentation.

### Issue 3: Missing Global Variables and Constants
The extraction misses critical global variables that parameters depend on:
- API keys
- Configuration constants
- Global arrays and dictionaries

**Fix:** Include all global variables and constants.

## Proposed Fix

Replace the `extract_scanner_code` function with an improved version:

```python
def extract_scanner_code_fixed(full_code: str, scanner_info: Dict) -> str:
    """
    🔧 FIXED: Extract Individual Scanner Code from Multi-Scanner File

    This version preserves syntax validity and includes all necessary dependencies.
    """
    try:
        import ast

        lines = full_code.split('\n')
        extracted_lines = []

        # Step 1: Extract ALL imports and global variables
        imports_and_globals = []

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Include all imports
            if stripped.startswith(('import ', 'from ')):
                imports_and_globals.append(line)

            # Include global variable assignments (before any function definitions)
            elif ('=' in stripped and
                  not stripped.startswith(('def ', 'class ', '#')) and
                  not any('def ' in prev_line for prev_line in lines[max(0, i-5):i]) and
                  stripped):
                imports_and_globals.append(line)

            # Include API keys and constants
            elif any(keyword in stripped.upper() for keyword in ['API_KEY', 'API', 'KEY', 'TOKEN']):
                imports_and_globals.append(line)

        # Step 2: Extract functions properly
        scanner_functions = scanner_info.get("functions", [])
        function_names = [f["function_name"] for f in scanner_functions]

        for func_name in function_names:
            func_code = extract_complete_function(lines, func_name)
            if func_code:
                extracted_lines.extend(func_code)
                extracted_lines.append("")  # Add spacing

        # Step 3: Combine and validate
        final_code_lines = imports_and_globals + [""] + extracted_lines

        # Step 4: Add main execution if present
        main_execution = extract_main_execution(lines)
        if main_execution:
            final_code_lines.extend([""] + main_execution)

        extracted_code = '\n'.join(final_code_lines)

        # Step 5: Validate syntax before returning
        try:
            ast.parse(extracted_code)
            return extracted_code
        except SyntaxError as e:
            logger.warning(f"Generated code has syntax error: {e}")
            # Return original code if extraction fails
            return full_code

    except Exception as e:
        logger.error(f"Scanner code extraction failed: {e}")
        return full_code

def extract_complete_function(lines: List[str], func_name: str) -> List[str]:
    """Extract a complete function with proper indentation preserved"""
    for i, line in enumerate(lines):
        if line.strip().startswith(f'def {func_name}('):
            # Find function end by tracking indentation
            func_start = i
            base_indent = len(line) - len(line.lstrip())

            func_end = len(lines)
            for j in range(i + 1, len(lines)):
                current_line = lines[j]
                if (current_line.strip() and
                    len(current_line) - len(current_line.lstrip()) <= base_indent and
                    not current_line.lstrip().startswith(('@', '#'))):
                    func_end = j
                    break

            return lines[func_start:func_end]

    return []

def extract_main_execution(lines: List[str]) -> List[str]:
    """Extract main execution block if present"""
    for i, line in enumerate(lines):
        if "if __name__ == '__main__':" in line:
            return lines[i:]
    return []
```

## Implementation Steps

1. **Backup current function**: Save the existing `extract_scanner_code` function
2. **Replace with fixed version**: Implement the improved extraction logic
3. **Test with problematic file**: Verify parameter extraction works
4. **Update error handling**: Add proper fallbacks and validation
5. **Add logging**: Improve debugging for future issues

## Testing Plan

```python
# Test the fix with the problematic file
test_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py'

# Expected results after fix:
# - Original: 59 parameters
# - Split: 59 parameters (or close to it)
# - Formatter: Shows actual parameter count instead of 0
```

## Impact
- **Immediate**: Fixes "0 parameters" issue in split scanner workflow
- **Long-term**: Improves reliability of scanner splitting feature
- **User Experience**: Split scanners will work as expected in formatter

## Priority: CRITICAL
This fix is essential for the scanner splitter functionality to work properly.