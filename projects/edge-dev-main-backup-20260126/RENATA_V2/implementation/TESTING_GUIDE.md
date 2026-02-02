# Testing Guide for Renata V2

## 📋 Overview

This guide provides comprehensive testing strategies for Renata V2 to ensure the system transforms trading scanners accurately and reliably.

---

## 🎯 Testing Philosophy

### Test Pyramid

```
        /\
       /  \        E2E Tests (5%)
      /────\       - Full transformation pipeline
     /      \      - Integration with EdgeDev
    /        \
   /          \    Integration Tests (25%)
  /────────────\   - Component integration
 /              \  - API integration
/________________\
 Unit Tests (70%)  - Individual functions
                    - AST parser, AI agent, templates
                    - Validator, transformer
```

### Testing Principles

1. **Test Early**: Write tests alongside code
2. **Test Often**: Run tests on every commit
3. **Test Thoroughly**: Cover edge cases
4. **Test Realistically**: Use actual scanner code
5. **Test Automatically**: CI/CD pipeline

---

## 🧪 Unit Tests

### AST Parser Tests

**Location**: `tests/test_ast_parser.py`

```python
import pytest
from RENATA_V2.core.ast_parser import ASTParser, ScannerType

class TestASTParser:
    """Test AST parser functionality"""

    def test_parse_valid_code(self):
        """Test parsing valid Python code"""
        parser = ASTParser()
        code = """
def scan_stocks():
    stocks = get_all_stocks()
    return stocks
"""

        tree = parser.parse_code(code)

        assert tree is not None
        assert isinstance(tree, ast.Module)

    def test_extract_functions(self):
        """Test function extraction"""
        parser = ASTParser()
        code = """
class Scanner:
    def fetch_data(self):
        pass

    def check_pattern(self, stock):
        pass
"""

        parser.parse_code(code)
        functions = parser.extract_functions()

        assert len(functions) == 2
        assert functions[0].name == 'fetch_data'
        assert functions[1].name == 'check_pattern'

    def test_extract_comparisons(self):
        """Test comparison extraction"""
        parser = ASTParser()
        code = """
if stock['price'] > 50:
    results.append(stock)
elif volume >= 1_000_000:
    results.append(stock)
"""

        parser.parse_code(code)
        comparisons = parser.extract_comparisons()

        assert len(comparisons) == 2
        assert comparisons[0].operator == '>'
        assert comparisons[0].right == '50'
        assert comparisons[1].operator == '>='

    def test_classify_single_scanner(self):
        """Test single-scanner classification"""
        parser = ASTParser()

        with open('tests/data/a_plus_scanner.py', 'r') as f:
            code = f.read()

        parser.parse_code(code)
        result = parser.classify_scanner_type()

        assert result.scanner_type == ScannerType.SINGLE_SCANNER
        assert result.confidence in ['high', 'medium']

    def test_classify_multi_scanner(self):
        """Test multi-scanner classification"""
        parser = ASTParser()

        with open('tests/data/dmr_scanner.py', 'r') as f:
            code = f.read()

        parser.parse_code(code)
        result = parser.classify_scanner_type()

        assert result.scanner_type == ScannerType.MULTI_SCANNER
        assert result.confidence == 'high'

    def test_detect_polygon_usage(self):
        """Test Polygon API detection"""
        parser = ASTParser()
        code = """
url = "https://api.polygon.io/v2/aggs/grouped/..."
response = requests.get(url)
"""

        parser.parse_code(code)
        sources = parser.detect_data_sources()

        assert sources.polygon_usage is True
        assert sources.primary_source == 'polygon_api'
```

---

### AI Agent Tests

**Location**: `tests/test_ai_agent.py`

```python
import pytest
from unittest.mock import Mock, patch
from RENATA_V2.core.ai_agent import AIAgent, StrategySpec

class TestAIAgent:
    """Test AI agent functionality"""

    @patch('RENATA_V2.core.ai_agent.OpenAI')
    def test_extract_strategy_intent(self, mock_openai):
        """Test strategy intent extraction"""
        # Mock API response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '''{
    "name": "A+ Parabolic",
    "type": "momentum",
    "entry_conditions": ["gap >= 0.5%", "volume >= 5M"],
    "exit_conditions": [],
    "timeframe": "daily",
    "rationale": "Momentum strategy"
}'''

        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        agent = AIAgent()

        with open('tests/data/a_plus_scanner.py', 'r') as f:
            code = f.read()

        strategy = agent.extract_strategy_intent(code, Mock())

        assert strategy.name == "A+ Parabolic"
        assert strategy.type == "momentum"
        assert len(strategy.entry_conditions) == 2

    @patch('RENATA_V2.core.ai_agent.OpenAI')
    def test_identify_parameters(self, mock_openai):
        """Test parameter identification"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '''{
    "price_thresholds": {
        "min_price": {"value": 0.75, "units": "dollars"}
    },
    "volume_thresholds": {
        "min_volume": {"value": 5000000, "units": "shares"}
    }
}'''

        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        agent = AIAgent()
        parameters = agent.identify_parameters("code", Mock())

        assert parameters.price_thresholds['min_price']['value'] == 0.75
        assert parameters.volume_thresholds['min_volume']['value'] == 5000000

    @patch('RENATA_V2.core.ai_agent.OpenAI')
    def test_generate_pattern_logic(self, mock_openai):
        """Test pattern logic generation"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '''
def detect_patterns(self, stage2_data):
    pattern_mask = stage2_data['gap_pct'] >= 0.5
    return stage2_data[pattern_mask]
'''

        mock_client = Mock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        agent = AIAgent()
        code = agent.generate_pattern_logic(Mock(), Mock())

        assert 'def detect_patterns(' in code
        assert 'pattern_mask' in code

    def test_retry_logic(self):
        """Test API retry logic"""
        with patch('RENATA_V2.core.ai_agent.OpenAI') as mock_openai:
            # Fail first 2 attempts, succeed on 3rd
            mock_client = Mock()
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = '{"test": "value"}'

            mock_client.chat.completions.create.side_effect = [
                Exception("API Error"),
                Exception("API Error"),
                mock_response  # Success on 3rd try
            ]

            mock_openai.return_value = mock_client

            agent = AIAgent()
            agent.max_retries = 3

            result = agent._make_request("test", response_format="json")

            assert result == '{"test": "value"}'
            assert mock_client.chat.completions.create.call_count == 3
```

---

### Template Engine Tests

**Location**: `tests/test_template_engine.py`

```python
import pytest
from RENATA_V2.core.template_engine import TemplateEngine

class TestTemplateEngine:
    """Test template engine functionality"""

    def test_render_single_scanner(self):
        """Test single-scanner template rendering"""
        engine = TemplateEngine('RENATA_V2/templates')

        code = engine.render(
            'single_scanner.j2',
            scanner_name='TestScanner',
            scanner_type='single',
            description='Test scanner',
            generation_date='2025-01-02',
            stage1_workers=5,
            stage3_workers=10,
            strategy_name='Test Strategy',
            smart_filters={'min_price': 0.75},
            pattern_logic='return []',
            result_fields=[]
        )

        # Verify it's valid Python
        import ast
        tree = ast.parse(code)

        # Verify it contains required methods
        assert 'def fetch_grouped_data(' in code
        assert 'def apply_smart_filters(' in code
        assert 'def detect_patterns(' in code
        assert 'def run_scan(' in code

    def test_render_multi_scanner(self):
        """Test multi-scanner template rendering"""
        engine = TemplateEngine('RENATA_V2/templates')

        patterns = [
            {
                'name': 'pattern1',
                'filters': {'min_price': 0.75},
                'indicator_logic': 'pass',
                'condition_logic': 'pattern_mask = pd.Series([False], index=data.index)',
                'result_fields': []
            }
        ]

        code = engine.render(
            'multi_scanner.j2',
            scanner_name='TestMultiScanner',
            scanner_type='multi',
            patterns=patterns
        )

        # Verify it's valid Python
        import ast
        tree = ast.parse(code)

        # Verify multi-pattern structure
        assert 'results_by_pattern' in code

    def test_template_variables(self):
        """Test template variable substitution"""
        engine = TemplateEngine('RENATA_V2/templates')

        code = engine.render(
            'single_scanner.j2',
            scanner_name='MyScanner',
            stage1_workers=10,
            stage3_workers=20,
            # ... other vars
        )

        assert 'MyScanner' in code
        assert 'stage1_workers = 10' in code
        assert 'stage3_workers = 20' in code

    def test_custom_filters(self):
        """Test custom Jinja2 filters"""
        engine = TemplateEngine('RENATA_V2/templates')

        # Test snake_case filter
        assert engine.env.filters['snake_case']('MyScanner') == 'my_scanner'

        # Test pascal_case filter
        assert engine.env.filters['pascal_case']('my_scanner') == 'MyScanner'
```

---

### Validator Tests

**Location**: `tests/test_validator.py`

```python
import pytest
from RENATA_V2.core.validator import Validator

class TestValidator:
    """Test validator functionality"""

    def test_validate_syntax_valid_code(self):
        """Test syntax validation with valid code"""
        validator = Validator()

        code = """
def test_function():
    return 42
"""

        result = validator.validate_syntax(code)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_validate_syntax_invalid_code(self):
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

    def test_validate_v31_structure_valid(self):
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

    def test_validate_v31_structure_missing_methods(self):
        """Test structure validation with missing methods"""
        validator = Validator()

        code = """
class TestScanner:
    def fetch_grouped_data(self):
        pass

    # Missing other methods
"""

        result = validator.validate_v31_structure(code)

        assert result.is_valid is False
        assert len(result.errors) == 3  # Missing 3 methods

    def test_validate_logic_invalid_characters(self):
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

    def test_validate_logic_wrong_functions(self):
        """Test logic validation with wrong function names"""
        validator = Validator()

        code = """
def fetch_all_grouped_data(self):  # Wrong!
    pass
"""

        result = validator.validate_logic(code)

        assert result.is_valid is False
        assert any('fetch_all_grouped_data' in e for e in result.errors)
```

---

### Transformer Tests

**Location**: `tests/test_transformer.py`

```python
import pytest
from RENATA_V2.core.transformer import RenataTransformer

class TestRenataTransformer:
    """Test main transformer functionality"""

    @patch('RENATA_V2.core.transformer.ASTParser')
    @patch('RENATA_V2.core.transformer.AIAgent')
    @patch('RENATA_V2.core.transformer.TemplateEngine')
    @patch('RENATA_V2.core.transformer.Validator')
    def test_transform_single_scanner(
        self,
        mock_validator,
        mock_template,
        mock_ai,
        mock_ast
    ):
        """Test single-scanner transformation"""
        # Setup mocks
        mock_ast.return_value.parse_code.return_value = Mock()
        mock_ast.return_value.classify_scanner_type.return_value = \
            Mock(scanner_type='SINGLE_SCANNER')

        mock_ai.return_value.extract_strategy_intent.return_value = \
            Mock(name='Test Strategy')

        mock_template.return_value.render.return_value = 'generated_code'

        mock_validator.return_value.validate_and_correct.return_value = \
            ('corrected_code', Mock(is_valid=True))

        # Run transformation
        transformer = RenataTransformer()
        result = transformer.transform_single_scanner(
            input_code='original_code',
            scanner_name='TestScanner'
        )

        assert result is not None
        assert 'corrected_code' in result

    def test_transform_a_plus_scanner(self):
        """Test transforming actual A+ scanner"""
        transformer = RenataTransformer()

        with open('tests/data/a_plus_scanner.py', 'r') as f:
            original_code = f.read()

        result = transformer.transform_single_scanner(
            input_code=original_code,
            scanner_name='APlusParabolic'
        )

        # Verify result
        assert 'class APlusParabolicScanner' in result
        assert 'def fetch_grouped_data(' in result
        assert 'def apply_smart_filters(' in result
        assert 'def detect_patterns(' in result
        assert 'def run_scan(' in result

        # Verify it's valid Python
        import ast
        tree = ast.parse(result)
```

---

## 🔗 Integration Tests

### Component Integration

**Location**: `tests/integration/test_component_integration.py`

```python
import pytest
from RENATA_V2.core.ast_parser import ASTParser
from RENATA_V2.core.ai_agent import AIAgent
from RENATA_V2.core.template_engine import TemplateEngine
from RENATA_V2.core.validator import Validator

class TestComponentIntegration:
    """Test integration between components"""

    def test_ast_to_ai_integration(self):
        """Test AST parser feeding into AI agent"""
        parser = ASTParser()
        agent = AIAgent()

        with open('tests/data/a_plus_scanner.py', 'r') as f:
            code = f.read()

        # Parse with AST
        tree = parser.parse_code(code)
        ast_info = Mock(
            functions=parser.extract_functions(),
            scanner_type=parser.classify_scanner_type()
        )

        # Extract with AI (using AST info)
        strategy = agent.extract_strategy_intent(code, ast_info)

        assert strategy.name is not None
        assert len(strategy.entry_conditions) > 0

    def test_ai_to_template_integration(self):
        """Test AI agent feeding into template engine"""
        agent = AIAgent()
        engine = TemplateEngine('RENATA_V2/templates')

        # Extract strategy
        strategy = Mock(
            name='Test Strategy',
            description='Test description',
            entry_conditions=['condition1', 'condition2']
        )

        parameters = Mock(
            price_thresholds={'min_price': {'value': 0.75}}
        )

        # Generate pattern logic
        pattern_logic = agent.generate_pattern_logic(
            strategy,
            parameters
        )

        # Render template with AI-generated logic
        code = engine.render(
            'single_scanner.j2',
            scanner_name='TestScanner',
            strategy_name=strategy.name,
            pattern_logic=pattern_logic,
            # ... other vars
        )

        assert pattern_logic in code
        assert 'def detect_patterns(' in code

    def test_template_to_validator_integration(self):
        """Test template engine feeding into validator"""
        engine = TemplateEngine('RENATA_V2/templates')
        validator = Validator()

        # Generate code
        code = engine.render(
            'single_scanner.j2',
            # ... vars
        )

        # Validate generated code
        syntax_result = validator.validate_syntax(code)
        structure_result = validator.validate_v31_structure(code)
        logic_result = validator.validate_logic(code)

        assert syntax_result.is_valid
        assert structure_result.is_valid
        assert logic_result.is_valid
```

---

### End-to-End Tests

**Location**: `tests/e2e/test_transformation.py`

```python
import pytest
from RENATA_V2.core.transformer import RenataTransformer

class TestEndToEnd:
    """Test complete transformation pipeline"""

    def test_transform_a_plus_scanner(self):
        """Test transforming A+ Parabolic scanner end-to-end"""
        transformer = RenataTransformer()

        with open('tests/data/a_plus_scanner.py', 'r') as f:
            original_code = f.read()

        # Transform
        result = transformer.transform_single_scanner(
            input_code=original_code,
            scanner_name='APlusParabolic'
        )

        # Verify structure
        assert 'class APlusParabolicScanner' in result
        assert 'def fetch_grouped_data(' in result
        assert 'def apply_smart_filters(' in result
        assert 'def detect_patterns(' in result
        assert 'def run_scan(' in result

        # Verify it's valid Python
        import ast
        tree = ast.parse(result)

        # Verify v31 compliance
        validator = Validator()
        assert validator.validate_syntax(result).is_valid
        assert validator.validate_v31_structure(result).is_valid
        assert validator.validate_logic(result).is_valid

    def test_transform_dmr_multi_scanner(self):
        """Test transforming DMR multi-scanner end-to-end"""
        transformer = RenataTransformer()

        with open('tests/data/dmr_scanner.py', 'r') as f:
            original_code = f.read()

        # Transform
        result = transformer.transform_multi_scanner(
            input_code=original_code,
            scanner_name='DMRMultiScanner'
        )

        # Verify structure
        assert 'class DMRMultiScanner' in result
        assert 'def detect_patterns(' in result
        assert 'results_by_pattern' in result

        # Verify it's valid Python
        import ast
        tree = ast.parse(result)

    def test_execution_test(self):
        """Test that generated code actually executes"""
        transformer = RenataTransformer()

        with open('tests/data/simple_scanner.py', 'r') as f:
            original_code = f.read()

        # Transform
        result = transformer.transform_single_scanner(
            input_code=original_code,
            scanner_name='SimpleScanner'
        )

        # Write to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(result)
            temp_file = f.name

        try:
            # Try to import and execute
            import sys
            sys.path.insert(0, tempfile.gettempdir())

            module_name = temp_file.replace('/', '.').replace('.py', '')
            module = __import__(module_name)

            # Verify class exists
            assert hasattr(module, 'SimpleScanner')

            # Verify methods exist
            scanner = module.SimpleScanner()
            assert hasattr(scanner, 'fetch_grouped_data')
            assert hasattr(scanner, 'apply_smart_filters')
            assert hasattr(scanner, 'detect_patterns')
            assert hasattr(scanner, 'run_scan')

        finally:
            # Cleanup
            import os
            os.unlink(temp_file)
```

---

## 🚀 Performance Tests

**Location**: `tests/performance/test_performance.py`

```python
import pytest
import time
from RENATA_V2.core.transformer import RenataTransformer

class TestPerformance:
    """Test performance benchmarks"""

    def test_transformation_speed(self):
        """Test transformation completes in acceptable time"""
        transformer = RenataTransformer()

        with open('tests/data/a_plus_scanner.py', 'r') as f:
            original_code = f.read()

        start = time.time()
        result = transformer.transform_single_scanner(
            input_code=original_code,
            scanner_name='APlusParabolic'
        )
        elapsed = time.time() - start

        # Should complete in < 30 seconds
        assert elapsed < 30, f"Transformation took {elapsed:.2f}s (expected < 30s)"

    def test_validation_speed(self):
        """Test validation completes quickly"""
        from RENATA_V2.core.validator import Validator

        validator = Validator()

        with open('tests/data/generated_scanner.py', 'r') as f:
            code = f.read()

        start = time.time()
        result = validator.validate_and_correct(code)
        elapsed = time.time() - start

        # Should complete in < 5 seconds
        assert elapsed < 5, f"Validation took {elapsed:.2f}s (expected < 5s)"

    def test_parallel_transformation(self):
        """Test transforming multiple scanners in parallel"""
        from concurrent.futures import ThreadPoolExecutor

        transformer = RenataTransformer()

        scanners = [
            'a_plus_scanner.py',
            'half_a_plus_scanner.py',
            'd1_gap_scanner.py'
        ]

        start = time.time()

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = []
            for scanner in scanners:
                with open(f'tests/data/{scanner}', 'r') as f:
                    code = f.read()

                future = executor.submit(
                    transformer.transform_single_scanner,
                    code,
                    scanner.replace('.py', '')
                )
                futures.append(future)

            results = [f.result() for f in futures]

        elapsed = time.time() - start

        # Parallel should be faster than sequential
        assert elapsed < 60  # All 3 in < 60 seconds
        assert len(results) == 3
```

---

## 📊 Test Coverage

### Coverage Goals

- **Unit Tests**: 95%+ coverage
- **Integration Tests**: 80%+ coverage
- **E2E Tests**: Cover all main workflows

### Measuring Coverage

```bash
# Install pytest-cov
pip install pytest-cov

# Run tests with coverage
pytest --cov=RENATA_V2 --cov-report=html --cov-report=term

# View HTML report
open htmlcov/index.html
```

### Coverage Report

```
Name                                 Stmts   Miss  Cover
------------------------------------------------------------------
RENATA_V2/core/__init__                  2      0   100%
RENATA_V2/core/ast_parser.py            85      4    95%
RENATA_V2/core/ai_agent.py              92      6    94%
RENATA_V2/core/template_engine.py        48      2    96%
RENATA_V2/core/validator.py              67      3    96%
RENATA_V2/core/transformer.py            54      5    91%
------------------------------------------------------------------
TOTAL                                  348     20    94%
```

---

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run unit tests
      run: pytest tests/unit/ --cov=RENATA_V2

    - name: Run integration tests
      run: pytest tests/integration/

    - name: Run E2E tests
      run: pytest tests/e2e/

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

---

## 📝 Best Practices

### DO:
✅ Write tests alongside code
✅ Use descriptive test names
✅ Test edge cases
✅ Mock external dependencies
✅ Keep tests fast
✅ Maintain high coverage
✅ Run tests in CI/CD

### DON'T:
❌ Don't skip writing tests
❌ Don't write brittle tests
❌ Don't test implementation details
❌ Don't ignore failing tests
❌ Don't commit without tests passing

---

## 🎯 Key Takeaways

1. **Test Pyramid**: Unit → Integration → E2E
2. **High Coverage**: Aim for 95%+ unit test coverage
3. **Test Real Code**: Use actual scanner examples
4. **Mock External**: Mock AI API calls
5. **Performance**: Test transformation speed
6. **CI/CD**: Automate testing
7. **Fail Fast**: Catch errors early

---

**Version**: 2.0
**Last Updated**: 2025-01-02
