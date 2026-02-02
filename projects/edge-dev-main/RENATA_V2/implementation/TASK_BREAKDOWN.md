# Renata V2 Task Breakdown

## 📋 Overview

This document provides a detailed, actionable task breakdown for building Renata V2. Tasks are organized by phase and priority, with clear acceptance criteria and dependencies.

---

## 🎯 Phase 1: Foundation (Week 1-2)

### Sprint 1: AST Parser & Basic Infrastructure

#### Task 1.1: Set Up Development Environment
**Priority**: P0 (Blocking)
**Estimated Time**: 2 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create RENATA_V2 directory structure
- [ ] Initialize Python virtual environment
- [ ] Install dependencies:
  ```bash
  pip install ast refactor jinja2 openai pandas numpy
  pip install openrouter python-dotenv pytest pytest-cov
  ```
- [ ] Set up environment variables (.env)
- [ ] Create test data directory with 5 example scanners
- [ ] Set up git repository

**Acceptance Criteria**:
- ✅ All dependencies installed
- ✅ Example scanners in test directory
- ✅ Can import all required modules
- ✅ Environment variables accessible

**Dependencies**: None

---

#### Task 1.2: Build AST Parser - Core Functionality
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `RENATA_V2/core/ast_parser.py`
- [ ] Implement `ASTParser` class with methods:
  - [ ] `parse_code(code: str) -> ast.Module`
  - [ ] `extract_functions(tree) -> List[FunctionInfo]`
  - [ ] `extract_classes(tree) -> List[ClassInfo]`
  - [ ] `extract_imports(tree) -> List[ImportInfo]`
- [ ] Add error handling for syntax errors
- [ ] Create `FunctionInfo` dataclass
- [ ] Create `ClassInfo` dataclass
- [ ] Create `ImportInfo` dataclass

**Acceptance Criteria**:
- ✅ Can parse all 5 example scanners without errors
- ✅ Extracts all function names and signatures
- ✅ Extracts all class names and methods
- ✅ Identifies all imports
- ✅ Handles syntax errors gracefully

**Dependencies**: Task 1.1

---

#### Task 1.3: Build AST Parser - Condition Extraction
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `extract_conditions(tree) -> List[ConditionInfo]`
- [ ] Implement `extract_comparisons(tree) -> List[ComparisonInfo]`
- [ ] Create `ConditionInfo` dataclass:
  - condition_type (if, elif, etc.)
  - condition_expression (AST node)
  - line_number
  - context (parent function)
- [ ] Create `ComparisonInfo` dataclass:
  - left_operand
  - operator
  - right_operand
  - line_number
- [ ] Add logic to extract comparison operators
- [ ] Add logic to extract boolean operators

**Acceptance Criteria**:
- ✅ Extracts all if/elif/else conditions
- ✅ Identifies comparison operators (>, <, >=, <=, ==, !=)
- ✅ Extracts both operands
- ✅ Records line numbers
- ✅ Handles nested conditions

**Dependencies**: Task 1.2

---

#### Task 1.4: Build AST Parser - Data Source Detection
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `detect_data_sources(tree) -> DataSourceInfo`
- [ ] Create `DataSourceInfo` dataclass:
  - source_type (file, api, hardcoded)
  - source_path (if file)
  - api_endpoint (if API)
  - ticker_list (if hardcoded)
- [ ] Detect file reads (open(), pd.read_csv(), pd.read_feather())
- [ ] Detect API calls (requests.get(), specific URLs)
- [ ] Detect hardcoded ticker lists
- [ ] Detect Polygon API usage

**Acceptance Criteria**:
- ✅ Correctly identifies data source for all 5 examples
- ✅ Detects Polygon API usage
- [ ] Detects file-based data sources
- ✅ Detects hardcoded ticker lists
- ✅ Returns structured DataSourceInfo

**Dependencies**: Task 1.2

---

#### Task 1.5: Build AST Parser - Scanner Type Classification
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `classify_scanner_type(tree) -> ScannerType`
- [ ] Create `ScannerType` enum:
  - SINGLE_SCANNER
  - MULTI_SCANNER
- [ ] Implement detection logic:
  - Count pattern column assignments
  - Check for multiple pattern check methods
  - Look for pattern-specific filter sections
- [ ] Add confidence score
- [ ] Document detection rules

**Acceptance Criteria**:
- ✅ Correctly classifies all 5 example scanners
- ✅ 100% accuracy on test set
- ✅ Returns confidence score
- ✅ Handles ambiguous cases

**Dependencies**: Task 1.2, Task 1.3

**Test Cases**:
```python
# Test single-scanner detection
assert classify_scanner_type(a_plus_scanner) == SINGLE_SCANNER
assert classify_scanner_type(half_a_plus_scanner) == SINGLE_SCANNER

# Test multi-scanner detection
assert classify_scanner_type(d1_gap_scanner) == MULTI_SCANNER
assert classify_scanner_type(dmr_scanner) == MULTI_SCANNER
assert classify_scanner_type(lc_scanner) == MULTI_SCANNER
```

---

#### Task 1.6: Write Unit Tests for AST Parser
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] Create `tests/test_ast_parser.py`
- [ ] Write tests for `parse_code()`
- [ ] Write tests for `extract_functions()`
- [ ] Write tests for `extract_conditions()`
- [ ] Write tests for `detect_data_sources()`
- [ ] Write tests for `classify_scanner_type()`
- [ ] Achieve 95%+ code coverage
- [ ] Run tests with pytest

**Acceptance Criteria**:
- ✅ All tests passing
- ✅ 95%+ code coverage
- ✅ Tests for all 5 example scanners
- ✅ Edge cases covered

**Dependencies**: Task 1.2, Task 1.3, Task 1.4, Task 1.5

---

### Sprint 2: AI Agent Integration

#### Task 1.7: Set Up OpenRouter Integration
**Priority**: P0 (Blocking)
**Estimated Time**: 3 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `RENATA_V2/core/ai_agent.py`
- [ ] Implement OpenRouter client:
  ```python
  from openai import OpenAI

  client = OpenAI(
      base_url="https://openrouter.ai/api/v1",
      api_key=os.getenv("OPENROUTER_API_KEY")
  )
  ```
- [ ] Create configuration for models:
  - Primary: `qwen/qwen-3-coder-32b-instruct`
  - Fallback: `deepseek/deepseek-coder`
  - Validation: `openai/gpt-4`
- [ ] Add error handling for API failures
- [ ] Add retry logic
- [ ] Add rate limiting

**Acceptance Criteria**:
- ✅ Can connect to OpenRouter API
- ✅ Can send prompts and receive responses
- ✅ Error handling working
- ✅ Retry logic working
- ✅ Rate limiting working

**Dependencies**: Task 1.1

---

#### Task 1.8: Implement Strategy Intent Extraction
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `extract_strategy_intent(code, ast_info) -> StrategySpec`
- [ ] Design prompt template:
  ```
  Analyze this trading scanner code and extract:

  1. Strategy Name: What pattern is being traded?
  2. Entry Conditions: What triggers the setup?
  3. Parameters: What are the numeric thresholds?
  4. Timeframe: Daily, intraday, multi-day?
  5. Scanner Type: Single or multi-pattern?

  Code:
  {code}

  AST Info:
  {ast_info}

  Return as JSON.
  ```
- [ ] Create `StrategySpec` dataclass:
  - name: str
  - description: str
  - entry_conditions: List[str]
  - exit_conditions: List[str]
  - parameters: Dict[str, Any]
  - timeframe: str
  - scanner_type: ScannerType
- [ ] Add JSON response parsing
- [ ] Add validation of extracted data

**Acceptance Criteria**:
- ✅ Extracts strategy name correctly
- ✅ Extracts entry conditions
- ✅ Extracts parameters with 95%+ accuracy
- ✅ Returns valid StrategySpec
- ✅ Handles all 5 example scanners

**Dependencies**: Task 1.7

---

#### Task 1.9: Implement Parameter Extraction
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `identify_parameters(code) -> ParameterSpec`
- [ ] Design prompt template:
  ```
  Extract ALL numeric parameters from this scanner code:

  {code}

  Include:
  - Price thresholds (min_price, max_price)
  - Volume thresholds (min_volume, max_volume)
  - Gap percentages (min_gap, max_gap)
  - Lookback periods (EMA lengths, etc.)
  - Consecutive day requirements
  - Any other numeric thresholds

  Return as JSON with parameter name, value, and description.
  ```
- [ ] Create `ParameterSpec` dataclass:
  - parameters: Dict[str, Parameter]
  - Parameter: value, description, units
- [ ] Combine AST extraction with AI extraction
- [ ] Merge and deduplicate parameters

**Acceptance Criteria**:
- ✅ Extracts 100% of parameters from test scanners
- ✅ Identifies parameter units
- ✅ Provides parameter descriptions
- ✅ Returns valid ParameterSpec

**Dependencies**: Task 1.7, Task 1.2

---

#### Task 1.10: Implement v31 Component Mapping
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `map_to_v31_components(strategy) -> V31Mapping`
- [ ] Define v31 components:
  - fetch_grouped_data
  - apply_smart_filters
  - detect_patterns
  - format_results
  - run_scan
- [ ] Map strategy logic to appropriate component
- [ ] Identify which components need AI-generated code
- [ ] Create `V31Mapping` dataclass

**Acceptance Criteria**:
- ✅ Maps strategy to correct v31 components
- ✅ Identifies which components need customization
- ✅ Returns valid V31Mapping

**Dependencies**: Task 1.8

---

#### Task 1.11: Implement Pattern Logic Generation
**Priority**: P1 (High)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `generate_pattern_logic(strategy) -> str`
- [ ] Design prompt template:
  ```
  Generate Python code for detect_patterns method.

  Strategy: {strategy.name}
  Entry Conditions: {strategy.entry_conditions}
  Parameters: {strategy.parameters}

  Requirements:
  - Use vectorized pandas operations
  - Return list of results
  - Include all indicator calculations
  - Check all conditions
  - Handle edge cases

  Return only the code, no explanations.
  ```
- [ ] Add code validation:
  - AST parse to check syntax
  - Check for vectorized operations
  - Check for proper error handling
- [ ] Add self-correction loop (max 3 attempts)

**Acceptance Criteria**:
- ✅ Generates valid Python code
- ✅ Uses vectorized pandas operations
- ✅ Implements all strategy conditions
- ✅ Handles edge cases
- ✅ Passes syntax validation

**Dependencies**: Task 1.8, Task 1.9

---

#### Task 1.12: Write Unit Tests for AI Agent
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] Create `tests/test_ai_agent.py`
- [ ] Mock OpenRouter API responses
- [ ] Write tests for `extract_strategy_intent()`
- [ ] Write tests for `identify_parameters()`
- [ ] Write tests for `map_to_v31_components()`
- [ ] Write tests for `generate_pattern_logic()`
- [ ] Test error handling
- [ ] Test retry logic
- [ ] Achieve 90%+ code coverage

**Acceptance Criteria**:
- ✅ All tests passing
- ✅ 90%+ code coverage
- ✅ Error cases covered
- ✅ Edge cases covered

**Dependencies**: Task 1.8, Task 1.9, Task 1.10, Task 1.11

---

### Sprint 3: Template System & Validation

#### Task 1.13: Set Up Jinja2 Template System
**Priority**: P0 (Blocking)
**Estimated Time**: 3 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `RENATA_V2/templates/` directory
- [ ] Create `RENATA_V2/core/template_engine.py`
- [ ] Implement `TemplateEngine` class:
  ```python
  from jinja2 import Environment, FileSystemLoader

  class TemplateEngine:
      def __init__(self, template_dir):
          self.env = Environment(
              loader=FileSystemLoader(template_dir)
          )

      def render(self, template_name, **context):
          template = self.env.get_template(template_name)
          return template.render(**context)
  ```
- [ ] Add template filters if needed
- [ ] Add template globals

**Acceptance Criteria**:
- ✅ Can load templates from directory
- ✅ Can render templates with context
- ✅ Handles template errors gracefully

**Dependencies**: Task 1.1

---

#### Task 1.14: Create Base v31 Template
**Priority**: P0 (Blocking)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `templates/base.j2`
- [ ] Define base v31 structure:
  ```python
  class {{ scanner_name }}Scanner:
      """
      {{ description }}

      Generated by Renata V2
      EdgeDev v31 Standard
      """

      def __init__(self):
          self.stage1_workers = {{ stage1_workers }}
          self.stage3_workers = {{ stage3_workers }}
          self.api_key = os.getenv('POLYGON_API_KEY')
          self.base_url = "https://api.polygon.io"
  ```
- [ ] Add placeholder methods for all v31 components
- [ ] Add docstrings
- [ ] Add type hints

**Acceptance Criteria**:
- ✅ Template compiles to valid Python
- ✅ All v31 methods present
- ✅ Proper docstrings
- ✅ Type hints included

**Dependencies**: Task 1.13

---

#### Task 1.15: Create Reusable Template Components
**Priority**: P1 (High)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `templates/components/fetch_data.j2`:
  - Polygon grouped endpoint integration
  - Parallel processing with ThreadPoolExecutor
  - Data aggregation logic
- [ ] Create `templates/components/smart_filters.j2`:
  - Price filtering
  - Volume filtering
  - Gap filtering
  - Vectorized operations
- [ ] Create `templates/components/orchestration.j2`:
  - run_scan method
  - 5-stage coordination
  - Result formatting
- [ ] Create `templates/components/formatting.j2`:
  - Result formatting
  - JSON output
  - Column selection

**Acceptance Criteria**:
- ✅ All components compile to valid Python
- ✅ Components can be included in base template
- ✅ Follow v31 standards
- ✅ Include error handling

**Dependencies**: Task 1.14

---

#### Task 1.16: Create Single-Scanner Template
**Priority**: P0 (Blocking)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `templates/single_scanner.j2`
- [ ] Extend base template
- [ ] Include all components
- [ ] Add AI-generated pattern logic section
- [ ] Define all template variables:
  - scanner_name
  - description
  - pattern_logic
  - stage1_workers
  - stage3_workers
- [ ] Test rendering with sample data

**Acceptance Criteria**:
- ✅ Template compiles to valid Python
- ✅ Includes all v31 methods
- ✅ Pattern logic section accepts AI code
- ✅ Renders successfully with sample data

**Dependencies**: Task 1.14, Task 1.15

---

#### Task 1.17: Implement Syntax Validation
**Priority**: P0 (Blocking)
**Estimated Time**: 3 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `RENATA_V2/core/validator.py`
- [ ] Implement `validate_syntax(code) -> ValidationResult`
- [ ] Use AST parsing to check syntax:
  ```python
  try:
      ast.parse(code)
      return ValidationResult(is_valid=True)
  except SyntaxError as e:
      return ValidationResult(
          is_valid=False,
          error_message=str(e),
          line_number=e.lineno
      )
  ```
- [ ] Test with valid and invalid code

**Acceptance Criteria**:
- ✅ Catches all syntax errors
- ✅ Returns line number
- ✅ Returns helpful error message
- ✅ Handles edge cases

**Dependencies**: Task 1.2

---

#### Task 1.18: Implement v31 Structure Validation
**Priority**: P0 (Blocking)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `validate_v31_structure(code) -> ValidationResult`
- [ ] Check for required methods:
  ```python
  required_methods = [
      'fetch_grouped_data',
      'apply_smart_filters',
      'detect_patterns',
      'run_scan'
  ]
  ```
- [ ] Verify class structure
- [ ] Check for proper initialization
- [ ] Validate Polygon API integration
- [ ] Check for vectorized operations

**Acceptance Criteria**:
- ✅ Detects missing required methods
- ✅ Validates class structure
- ✅ Returns specific missing components
- ✅ Provides actionable error messages

**Dependencies**: Task 1.17

---

#### Task 1.19: Implement Logic Validation
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Implement `validate_logic(code) -> ValidationResult`
- [ ] Check for common issues:
  - Invalid characters ($)
  - Wrong function names (fetch_all_grouped_data)
  - Wrong API usage (get_all_stocks)
  - Missing error handling
- [ ] Check for deprecated patterns
- [ ] Validate API endpoints
- [ ] Check for hardcoded values

**Acceptance Criteria**:
- ✅ Detects common logic errors
- ✅ Catches invalid characters
- ✅ Identifies wrong function names
- ✅ Returns list of issues

**Dependencies**: Task 1.18

---

#### Task 1.20: Write Integration Tests for Validation Pipeline
**Priority**: P1 (High)
**Estimated Time**: 3 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] Create `tests/test_validator.py`
- [ ] Create test fixtures:
  - Valid v31 scanner
  - Invalid syntax
  - Missing methods
  - Logic errors
- [ ] Write tests for all 3 validation stages
- [ ] Test error messages
- [ ] Test edge cases

**Acceptance Criteria**:
- ✅ All tests passing
- ✅ Covers all validation stages
- ✅ Edge cases covered
- ✅ Error messages tested

**Dependencies**: Task 1.17, Task 1.18, Task 1.19

---

### Sprint 4: End-to-End Integration

#### Task 1.21: Build Main Transformation Pipeline
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `RENATA_V2/core/transformer.py`
- [ ] Implement `RenataTransformer` class:
  ```python
  class RenataTransformer:
      def __init__(self):
          self.ast_parser = ASTParser()
          self.ai_agent = AIAgent()
          self.template_engine = TemplateEngine()
          self.validator = Validator()

      def transform(
          self,
          input_code: str,
          scanner_name: str
      ) -> TransformResult:
          # 1. Parse with AST
          # 2. Extract strategy with AI
          # 3. Generate pattern logic
          # 4. Render template
          # 5. Validate
          # 6. Self-correct if needed
  ```
- [ ] Add error handling for each stage
- [ ] Add progress tracking
- [ ] Add logging

**Acceptance Criteria**:
- ✅ Transforms code end-to-end
- ✅ Handles errors gracefully
- ✅ Provides progress updates
- ✅ Returns TransformResult with all info

**Dependencies**: All previous tasks

---

#### Task 1.22: Implement Self-Correction Loop
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Add self-correction logic to transformer:
  ```python
  max_attempts = 3
  for attempt in range(max_attempts):
      validation = validator.validate(v31_code)
      if validation.is_valid:
          break

      # Self-correct based on errors
      v31_code = self._self_correct(
          v31_code,
          validation.errors
      )
  ```
- [ ] Implement `_self_correct()` method:
  - Parse error messages
  - Generate correction prompt
  - Apply corrections
- [ ] Add validation feedback to AI

**Acceptance Criteria**:
- ✅ Attempts self-correction up to 3 times
- ✅ Uses validation errors to guide corrections
- ✅ Improves code quality
- ✅ Returns best effort if max attempts reached

**Dependencies**: Task 1.21

---

#### Task 1.23: Create End-to-End Tests
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] Create `tests/test_e2e.py`
- [ ] Test transformation of A+ Parabolic scanner
- [ ] Test transformation of Half A+ scanner
- [ ] Validate output structure
- [ ] Test execution of generated code
- [ ] Compare results with original scanners
- [ ] Test error handling
- [ ] Test with invalid input

**Acceptance Criteria**:
- ✅ Both scanners transformed successfully
- ✅ Generated code executes without errors
- ✅ Results match original logic
- ✅ Error cases handled gracefully

**Dependencies**: Task 1.21, Task 1.22

---

## 🎯 Phase 2: Single-Scanner Support (Week 3-4)

### Sprint 5: Single-Scanner Enhancement

#### Task 2.1: Enhance AI Strategy Extraction for Single-Scanners
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create specialized prompt for single-scanner extraction
- [ ] Focus on pattern-specific logic
- [ ] Extract entry/exit conditions
- [ ] Identify indicator calculations
- [ ] Map to v31 components
- [ ] Test with A+ Parabolic and Half A+

**Acceptance Criteria**:
- ✅ Extracts strategy from single-scanners
- ✅ Identifies pattern-specific logic
- ✅ Maps correctly to v31 components
- ✅ Works for both test scanners

**Dependencies**: Phase 1 complete

---

#### Task 2.2: Enhance Pattern Logic Generation
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create specialized prompt for single-scanner pattern logic
- [ ] Focus on vectorized pandas operations
- [ ] Generate indicator calculations
- [ ] Generate condition checks
- [ ] Add error handling
- [ ] Validate generated code
- [ ] Test with both examples

**Acceptance Criteria**:
- ✅ Generates valid pattern detection code
- ✅ Uses vectorized operations
- ✅ Includes all indicators
- ✅ Checks all conditions
- ✅ Handles edge cases

**Dependencies**: Task 2.1

---

#### Task 2.3: Transform A+ Parabolic Scanner
**Priority**: P0 (Blocking)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Run transformation pipeline on A+ Parabolic
- [ ] Validate output structure
- [ ] Test execution
- [ ] Compare results with original
- [ ] Fix any issues
- [ ] Document transformation

**Acceptance Criteria**:
- ✅ Transformation successful
- ✅ v31 structure valid
- ✅ Code executes without errors
- ✅ Results match original

**Dependencies**: Task 2.2

---

#### Task 2.4: Transform Half A+ Scanner
**Priority**: P0 (Blocking)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Run transformation pipeline on Half A+
- [ ] Validate output structure
- [ ] Test execution
- [ ] Compare results with original
- [ ] Fix any issues
- [ ] Document transformation

**Acceptance Criteria**:
- ✅ Transformation successful
- ✅ v31 structure valid
- ✅ Code executes without errors
- ✅ Results match original

**Dependencies**: Task 2.2

---

#### Task 2.5: Optimize Single-Scanner Transformation
**Priority**: P1 (High)
**Estimated Time**: 4 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Profile transformation performance
- [ ] Identify bottlenecks
- [ ] Optimize AI prompts
- [ ] Add caching where appropriate
- [ ] Reduce transformation time
- [ ] Target: < 30 seconds

**Acceptance Criteria**:
- ✅ Transformation time < 30 seconds
- ✅ No accuracy loss
- ✅ Improved efficiency

**Dependencies**: Task 2.3, Task 2.4

---

#### Task 2.6: Comprehensive Single-Scanner Testing
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] Create comprehensive test suite
- [ ] Test with various single-scanners
- [ ] Test edge cases
- [ ] Test error handling
- [ ] Performance testing
- [ ] Documentation testing
- [ ] Achieve 95%+ coverage

**Acceptance Criteria**:
- ✅ All tests passing
- ✅ Edge cases covered
- ✅ Performance benchmarks met
- ✅ Documentation accurate

**Dependencies**: Task 2.5

---

## 🎯 Phase 3: Multi-Scanner Support (Week 5-6)

### Sprint 6-7: Multi-Scanner Implementation

#### Task 3.1: Create Multi-Scanner Template
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `templates/multi_scanner.j2`
- [ ] Define multi-scanner structure:
  - Multiple pattern configs
  - Pattern-specific filter methods
  - Pattern-specific indicator methods
  - Multi-pattern coordination
- [ ] Add pattern iteration logic
- [ ] Add result aggregation logic
- [ ] Test compilation

**Acceptance Criteria**:
- ✅ Template compiles to valid Python
- ✅ Supports multiple patterns
- ✅ Pattern-specific filters supported
- ✅ Pattern-specific indicators supported

**Dependencies**: Phase 2 complete

---

#### Task 3.2: Implement Pattern-Specific Filter Extraction
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `core/pattern_filters.py`
- [ ] Implement `extract_pattern_filters(pattern_code, pattern_name)`
- [ ] Design prompt for filter extraction:
  ```
  Extract smart filter parameters for this pattern.

  Pattern: {pattern_name}
  Code: {pattern_code}

  Extract:
  - min_price, max_price
  - min_volume, max_volume
  - min_gap, max_gap
  - Consecutive day requirements
  - Any other thresholds

  Return as JSON.
  ```
- [ ] Create `PatternFilterSpec` dataclass
- [ ] Test with DMR patterns

**Acceptance Criteria**:
- ✅ Extracts unique filters for each pattern
- ✅ Preserves parameter differences
- ✅ Returns valid PatternFilterSpec
- ✅ Works for all DMR patterns

**Dependencies**: Task 3.1

---

#### Task 3.3: Implement Multi-Pattern Coordinator
**Priority**: P0 (Blocking)
**Estimated Time**: 10 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `core/multi_coordination.py`
- [ ] Implement `MultiPatternCoordinator` class:
  - Calculate common indicators once
  - Apply pattern-specific filters
  - Calculate pattern-specific indicators
  - Check pattern conditions
  - Aggregate results
- [ ] Optimize for efficiency
- [ ] Add error handling
- [ ] Test with DMR scanner

**Acceptance Criteria**:
- ✅ Coordinates 3+ patterns efficiently
- ✅ Avoids redundant calculations
- ✅ Preserves pattern-specific logic
- ✅ Returns properly grouped results

**Dependencies**: Task 3.2

---

#### Task 3.4: Transform D1 Gap Multi-Scanner
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Run transformation on D1 Gap scanner
- [ ] Validate multi-scanner structure
- [ ] Test pattern-specific filters
- [ ] Compare results with original
- [ ] Fix any issues
- [ ] Document transformation

**Acceptance Criteria**:
- ✅ Transformation successful
- ✅ Multi-scanner structure valid
- ✅ Pattern-specific filters working
- ✅ Results match original

**Dependencies**: Task 3.3

---

#### Task 3.5: Transform SC DMR Multi-Scanner
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Run transformation on SC DMR scanner
- [ ] Validate 6 patterns preserved
- [ ] Test pattern-specific filters differ
- [ ] Compare results for each pattern
- [ ] Fix any issues
- [ ] Document transformation

**Acceptance Criteria**:
- ✅ All 6 patterns transformed
- ✅ Pattern-specific filters correct
- ✅ Results match original for each pattern
- ✅ Performance acceptable

**Dependencies**: Task 3.3

---

#### Task 3.6: Transform LC Multi-Scanner
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Run transformation on LC scanner
- [ ] Validate LC patterns preserved
- [ ] Test 3-day gap logic
- [ ] Test FBO logic
- [ ] Compare results with original
- [ ] Fix any issues
- [ ] Document transformation

**Acceptance Criteria**:
- ✅ All LC patterns transformed
- ✅ Complex logic preserved
- ✅ Results match original
- ✅ Performance acceptable

**Dependencies**: Task 3.3

---

#### Task 3.7: Optimize Multi-Scanner Performance
**Priority**: P1 (High)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Profile multi-scanner execution
- [ ] Identify bottlenecks
- [ ] Optimize indicator calculations
- [ ] Optimize filter applications
- [ ] Add parallel processing where possible
- [ ] Target: Within 20% of hand-coded

**Acceptance Criteria**:
- ✅ Performance within 20% of hand-coded
- ✅ No accuracy loss
- ✅ Efficient resource usage

**Dependencies**: Task 3.4, Task 3.5, Task 3.6

---

#### Task 3.8: Comprehensive Multi-Scanner Testing
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] Create comprehensive test suite
- [ ] Test all 3 multi-scanners
- [ ] Test pattern-specific filters
- [ ] Test result aggregation
- [ ] Performance testing
- [ ] Edge case testing
- [ ] Achieve 95%+ coverage

**Acceptance Criteria**:
- ✅ All tests passing
- ✅ All multi-scanners working
- ✅ Performance benchmarks met
- ✅ Edge cases covered

**Dependencies**: Task 3.7

---

## 🎯 Phase 4: Integration & Polish (Week 7-8)

### Sprint 8: EdgeDev Integration

#### Task 4.1: Create Backend API Endpoints
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Create `backend/renata_v2_api.py`
- [ ] Implement `/api/renata-v2/transform` endpoint
- [ ] Implement `/api/renata-v2/validate` endpoint
- [ ] Add request/response models
- [ ] Add error handling
- [ ] Add rate limiting
- [ ] Add logging
- [ ] Test endpoints

**Acceptance Criteria**:
- ✅ Transform endpoint working
- ✅ Validate endpoint working
- ✅ Error handling robust
- ✅ Response times < 30 seconds

**Dependencies**: Phase 3 complete

---

#### Task 4.2: Create Frontend UI Components
**Priority**: P0 (Blocking)
**Estimated Time**: 12 hours
**Assigned To**: Frontend Developer

**Subtasks**:
- [ ] Create `src/components/RenataV2Uploader.tsx`
- [ ] Design file upload interface
- [ ] Add progress tracking UI
- [ ] Add validation results display
- [ ] Add code preview with syntax highlighting
- [ ] Add action buttons (download, add to project)
- [ ] Style with EdgeDev theme
- [ ] Test UI interactions

**Acceptance Criteria**:
- ✅ Clean, intuitive UI
- ✅ Real-time progress updates
- ✅ Clear error messages
- ✅ Responsive design

**Dependencies**: Task 4.1

---

#### Task 4.3: Integrate with Project System
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Add transformed scanner to project
- [ ] Save to projects directory
- [ ] Update project.json
- [ ] List transformed scanners
- [ ] Delete transformed scanners
- [ ] Test integration

**Acceptance Criteria**:
- ✅ Transformed scanners save correctly
- ✅ Project system integration working
- ✅ All CRUD operations working

**Dependencies**: Task 4.1

---

#### Task 4.4: Integrate with Scanner Execution
**Priority**: P0 (Blocking)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Execute transformed scanners
- [ ] Display results in UI
- [ ] Compare with original scanners
- [ ] Handle execution errors
- [ ] Test with all examples

**Acceptance Criteria**:
- ✅ Transformed scanners execute
- ✅ Results display correctly
- ✅ Error handling working

**Dependencies**: Task 4.3

---

#### Task 4.5: Create User Documentation
**Priority**: P1 (High)
**Estimated Time**: 6 hours
**Assigned To**: Technical Writer

**Subtasks**:
- [ ] Write user guide
- [ ] Create tutorial videos/screenshots
- [ ] Document API endpoints
- [ ] Create troubleshooting guide
- [ ] Add FAQ
- [ ] Review and edit

**Acceptance Criteria**:
- ✅ Comprehensive user guide
- ✅ API documentation complete
- ✅ Troubleshooting guide helpful
- ✅ FAQ covers common questions

**Dependencies**: Task 4.2, Task 4.4

---

#### Task 4.6: Performance Optimization
**Priority**: P1 (High)
**Estimated Time**: 6 hours
**Assigned To**: Backend Developer

**Subtasks**:
- [ ] Add AI response caching
- [ ] Optimize AST parsing
- [ ] Add parallel processing
- [ ] Optimize database queries
- [ ] Profile and optimize bottlenecks
- [ ] Load testing

**Acceptance Criteria**:
- ✅ Transformation time < 30 seconds
- ✅ API response time < 2 seconds
- ✅ System handles 10+ concurrent users

**Dependencies**: Task 4.1

---

#### Task 4.7: Production Deployment
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: DevOps Engineer

**Subtasks**:
- [ ] Set up production environment
- [ ] Configure environment variables
- [ ] Set up monitoring
- [ ] Set up logging
- [ ] Set up backups
- [ ] Deploy to production
- [ ] Smoke testing
- [ ] Documentation

**Acceptance Criteria**:
- ✅ Production environment stable
- ✅ Monitoring working
- ✅ Logging working
- ✅ Backups automated

**Dependencies**: All previous tasks

---

#### Task 4.8: Final Testing & Validation
**Priority**: P0 (Blocking)
**Estimated Time**: 8 hours
**Assigned To**: QA Developer

**Subtasks**:
- [ ] End-to-end testing
- [ ] Integration testing
- [ ] Performance testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Regression testing

**Acceptance Criteria**:
- ✅ All tests passing
- ✅ No critical bugs
- ✅ Performance benchmarks met
- ✅ User acceptance complete

**Dependencies**: Task 4.7

---

## 📊 Task Summary

### Phase 1: Foundation (23 tasks)
- **Sprint 1**: 6 tasks (AST Parser)
- **Sprint 2**: 6 tasks (AI Agent)
- **Sprint 3**: 8 tasks (Templates & Validation)
- **Sprint 4**: 3 tasks (Integration)

**Total Estimated Time**: ~80 hours

### Phase 2: Single-Scanner (6 tasks)
- **Sprint 5**: 6 tasks

**Total Estimated Time**: ~32 hours

### Phase 3: Multi-Scanner (8 tasks)
- **Sprint 6-7**: 8 tasks

**Total Estimated Time**: ~54 hours

### Phase 4: Integration (8 tasks)
- **Sprint 8**: 8 tasks

**Total Estimated Time**: ~54 hours

### Grand Total: 45 tasks, ~220 hours (6-8 weeks)

---

## 🎯 Critical Path

These tasks must be completed in order and are blocking:

1. Task 1.1 (Environment Setup)
2. Task 1.2 (AST Parser Core)
3. Task 1.5 (Scanner Classification)
4. Task 1.7 (OpenRouter Integration)
5. Task 1.8 (Strategy Extraction)
6. Task 1.11 (Pattern Logic Generation)
7. Task 1.14 (Base Template)
8. Task 1.16 (Single-Scanner Template)
9. Task 1.21 (Transformation Pipeline)
10. Task 2.2 (Enhanced Pattern Logic)
11. Task 3.1 (Multi-Scanner Template)
12. Task 3.3 (Multi-Pattern Coordinator)
13. Task 4.1 (Backend API)
14. Task 4.2 (Frontend UI)
15. Task 4.7 (Production Deployment)

---

## 📝 Notes

- **Parallelizable Tasks**: Tasks within same sprint can often be done in parallel
- **Buffer Time**: Build in 20% buffer for unexpected issues
- **Testing**: QA tasks should run parallel with development
- **Documentation**: Document as you go, don't leave to end
- **Review**: Code reviews required before merging

---

**Version**: 2.0
**Status**: Ready for Development
**Last Updated**: 2025-01-02
