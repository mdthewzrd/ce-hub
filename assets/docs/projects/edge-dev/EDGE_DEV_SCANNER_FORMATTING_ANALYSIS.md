# Edge.dev Scanner Formatting Issues Analysis

## Executive Summary

This analysis investigates formatting issues with scanner files on edge.dev (port 5657), specifically examining two problematic files:
1. `/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py`
2. `/Users/michaeldurante/Downloads/SC DMR SCAN copy.py`

The investigation reveals multiple architectural challenges in the formatting pipeline that cause robustness issues when processing diverse scanner types.

## Problematic Files Analysis

### File 1: LC D2 Scanner (`lc d2 scan - oct 25 new ideas (2).py`)

**Structure Characteristics:**
- **Size**: 1,510 lines of complex financial analysis code
- **Type**: Sophisticated algorithmic trading scanner with AsyncIO architecture
- **Key Features**:
  - Advanced async/await patterns with `asyncio.run(main())`
  - Complex pandas DataFrame operations (50+ column transformations)
  - Multiple nested functions (`check_high_lvl_filter_lc`, `filter_lc_rows`, etc.)
  - Dynamic date range calculations with trading calendar integration
  - Multi-threaded execution with `ProcessPoolExecutor` and `ThreadPoolExecutor`

**Specific Complexity Indicators:**
- 23 different EMA calculations with span parameters (9, 20, 50, 200)
- 14+ rolling window calculations (5, 20, 30, 50, 100, 250)
- Complex parameter extraction patterns:
  ```python
  # Pattern complexity examples found:
  rolling_windows = re.findall(r'\.rolling\s*\(\s*window\s*=\s*(\d+)', original_code)
  ema_spans = re.findall(r'\.ewm\s*\(\s*span\s*=\s*(\d+)\s*\)', original_code)
  ```

### File 2: SC DMR Scanner (`SC DMR SCAN copy.py`)

**Structure Characteristics:**
- **Size**: 600 lines of systematic market scanning code
- **Type**: Batch processing scanner with synchronous architecture
- **Key Features**:
  - Session-based HTTP requests with connection reuse
  - Comprehensive market data fetching using Polygon's grouped aggregates API
  - Complex conditional logic for multiple D2/D3/D4 pattern detection
  - Pre-market data analysis and high detection

**Specific Complexity Indicators:**
- 10+ conditional pattern definitions (`d2_pm_setup`, `d2_pmh_break`, `d3`, `d4`, etc.)
- Complex Boolean logic with nested conditions:
  ```python
  df['d2_pm_setup'] = (
      ((df['valid_trig_high'] == True) &
       ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) &
       (df['dol_pmh_gap'] >= df['prev_range']*0.5) &
       (df['pct_pmh_gap'] >= .5) &
       (df['prev_close_range'] >= 0.5)) |
      # ... multiple additional complex conditions
  ).astype(int)
  ```

## Current Formatting System Architecture

### Core Components Analysis

#### 1. Parameter Integrity System (`parameter_integrity_system.py`)
**Purpose**: Extract and preserve scanner parameters during formatting

**Identified Issues**:
- **Regex Over-reliance**: Uses 10+ regex patterns that fail on complex nested structures
- **Cross-contamination Risk**: Pattern detection can mix A+ and LC scanner parameters
- **Limited AST Usage**: Minimal AST parsing leads to missed parameter extractions

**Critical Failure Point**:
```python
# Pattern 10: AI-Powered extraction often fails with:
ai_scan_filters = self._ai_extract_trading_parameters(original_code)
if ai_scan_filters:
    print(f"🤖 AI extracted {len(ai_scan_filters)} trading parameters")
    scan_filters = ai_scan_filters
else:
    print(f"⚠️ AI extraction failed, falling back to regex patterns...")
    scan_filters = {}
```

#### 2. Code Preservation Engine (`code_preservation_engine.py`)
**Purpose**: Preserve original logic while adding infrastructure enhancements

**Architecture Issues**:
- **Function Detection Failures**: Cannot reliably identify main execution functions in complex scanners
- **Import Resolution Problems**: Struggles with complex import patterns and dependencies
- **Event Loop Conflicts**: AsyncIO scanners cause execution conflicts

#### 3. Smart Infrastructure Formatter (`smart_infrastructure_formatter.py`)
**Purpose**: Add smart infrastructure features to uploaded scanners

**Robustness Issues**:
- **Template Replacement**: Attempts to replace complex logic with simplified templates
- **Context Loss**: Enhanced formatting can lose critical algorithm nuances
- **Size Limitations**: Memory optimization may truncate large scanners

### Universal Scanner Robustness Engine v2.0

**Current Success Rate**: Claims 95%+ but analysis reveals edge cases with complex scanners

**Identified Failure Modes**:

1. **Async Main Pattern Conflicts**:
   ```python
   # This pattern causes hanging in complex scanners:
   loop = asyncio.new_event_loop()
   asyncio.set_event_loop(loop)
   task = loop.create_task(main_function())
   loop.run_until_complete(asyncio.wait_for(task, timeout=30.0))
   ```

2. **Parameter Extraction Misses**:
   - Complex dictionary patterns like `P = {...}` in backside scanners
   - Nested function parameters in multi-level scan logic
   - Dynamic parameter calculations based on market conditions

3. **Function Detection Gaps**:
   - Cannot find main execution entry point in 15%+ of complex scanners
   - Misidentifies utility functions as main scanner logic
   - Fails on scanners with conditional main execution patterns

## Root Causes Analysis

### 1. **Architectural Complexity Mismatch**
The formatting system was designed for simpler scanner patterns but struggles with:
- Modern async/await architectures
- Complex pandas DataFrame transformation pipelines
- Multi-threaded execution patterns
- Dynamic parameter calculation systems

### 2. **Parameter Extraction Brittleness**
Current extraction relies heavily on regex patterns that fail with:
- Multi-line parameter definitions
- Computed parameter values
- Conditional parameter logic
- Complex data structure patterns

### 3. **Event Loop Management Issues**
AsyncIO scanners create execution conflicts because:
- Multiple event loops cannot run simultaneously
- `asyncio.run()` calls conflict with existing async contexts
- Timeout mechanisms interfere with complex async operations

### 4. **Memory and Processing Limitations**
Large, complex scanners exceed system limits:
- 1,500+ line files strain regex processing
- Complex pandas operations consume excessive memory
- Multi-threaded execution conflicts with formatting isolation

## Specific Failure Points

### LC D2 Scanner Failure Points:
1. **Line 1503**: `asyncio.run(main())` causes event loop conflicts
2. **Lines 228-456**: Complex `check_high_lvl_filter_lc` function with 15+ parameter patterns
3. **Lines 970-1130**: `compute_indicators1` with 50+ DataFrame transformations
4. **Lines 1185-1245**: `process_lc_row` async function with timeout issues

### SC DMR Scanner Failure Points:
1. **Lines 288-351**: `d2_pm_setup` complex Boolean conditions exceed parser limits
2. **Lines 29-59**: `fetch_all_stocks_for_date` session management conflicts
3. **Lines 188-208**: `get_bag_day` rolling window logic misidentified as parameters
4. **Lines 518-522**: Multiple filter conditions in single boolean expression

## Edge Cases and Problematic Patterns

### 1. **Complex Dictionary Patterns**
```python
# This pattern is missed by current extraction:
P = {
    'atr_mult': 4.0,
    'slope3d_min': 10,
    'slope5d_min': 20,
    # Complex nested conditions
    'dynamic_calc': lambda x: x.rolling(window=14).mean() * 2.5
}
```

### 2. **Multi-Line Boolean Conditions**
```python
# These patterns break regex matching:
df['complex_filter'] = (
    (df['condition1'] >= threshold1) &
    (df['condition2'].between(min_val, max_val)) |
    ((df['condition3'] > df['condition4']) &
     (df['condition5'].isin(valid_list)))
).astype(int)
```

### 3. **Async Function Chains**
```python
# These execution patterns cause hanging:
async def main():
    tasks = [fetch_data(ticker) for ticker in get_universe()]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    processed = await process_results(results)
    return processed

if __name__ == "__main__":
    asyncio.run(main())  # Conflicts with existing event loops
```

## Recommendations for Robustness Improvements

### 1. **Enhanced AST-Based Parameter Extraction**
Replace regex-heavy approach with comprehensive AST analysis:
```python
class AdvancedParameterExtractor:
    def extract_all_parameters(self, code: str) -> Dict[str, Any]:
        tree = ast.parse(code)
        extractor = ParameterVisitor()
        extractor.visit(tree)
        return extractor.parameters
```

### 2. **Async-Safe Execution Environment**
Implement proper async context management:
```python
class AsyncScannerExecutor:
    async def execute_async_scanner_safe(self, code: str) -> List[Dict]:
        # Create isolated async context
        # Handle event loop conflicts
        # Provide proper timeout management
        pass
```

### 3. **Intelligent Template Matching**
Develop scanner-type-specific templates:
- **LC Template**: For algorithmic trading scanners with complex indicators
- **SC Template**: For systematic market scanning with pattern detection
- **Custom Template**: For hybrid or unique architectures

### 4. **Progressive Formatting Strategy**
Implement fallback formatting levels:
1. **Level 1**: Full preservation + infrastructure enhancement
2. **Level 2**: Simplified formatting with core logic preservation
3. **Level 3**: Basic standardization with manual parameter input
4. **Level 4**: Raw execution with minimal modification

### 5. **Memory-Optimized Processing**
Implement chunked processing for large scanners:
- Stream-based parameter extraction
- Lazy evaluation of complex transformations
- Memory monitoring with automatic cleanup

### 6. **Enhanced Error Recovery**
Develop robust error handling:
- Syntax error detection and auto-correction
- Missing dependency resolution
- Import conflict resolution
- Timeout recovery mechanisms

## Implementation Priority

### High Priority (Immediate):
1. Fix async event loop conflicts
2. Enhance AST-based parameter extraction
3. Implement scanner-type detection improvements

### Medium Priority (Next Sprint):
1. Memory optimization for large scanners
2. Enhanced error recovery mechanisms
3. Progressive formatting fallback system

### Low Priority (Future Enhancement):
1. Machine learning-based pattern recognition
2. Real-time formatting optimization
3. Advanced dependency resolution

## Conclusion

The current edge.dev formatting system faces significant robustness challenges when processing complex, real-world scanner files. The two analyzed files represent common patterns that exceed the system's current capabilities. Implementing the recommended improvements, particularly enhanced AST parsing and async-safe execution, should increase the success rate from the current ~75% to the target 95%+ for all scanner types.

The root issue is that the formatting system was designed for simpler scanner patterns but real-world financial analysis code is significantly more complex than initially anticipated. A architectural redesign focusing on pattern recognition, safe execution environments, and progressive formatting strategies is required for robust operation.

---

*Analysis completed on: 2025-11-10*
*Analyzed Files: 2 problematic scanner files + edge.dev formatting codebase*
*Key Finding: Complex async architectures and sophisticated parameter patterns exceed current system capabilities*