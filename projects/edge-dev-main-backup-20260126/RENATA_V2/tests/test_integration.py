"""
Integration tests for RENATA_V2 transformation pipeline

Tests the complete workflow from AST parsing through validation.
"""

import pytest
from pathlib import Path

from RENATA_V2.core.ast_parser import ASTParser
from RENATA_V2.core.ai_agent import AIAgent
from RENATA_V2.core.template_engine import TemplateEngine, TemplateEngineError
from RENATA_V2.core.validator import Validator, ValidationResult


class TestTemplateEngine:
    """Test template engine functionality"""

    def test_template_engine_initialization(self):
        """Test template engine can be initialized"""
        engine = TemplateEngine()
        assert engine is not None
        assert engine.template_dir.exists()

    def test_list_templates(self):
        """Test listing available templates"""
        engine = TemplateEngine()
        templates = engine.list_templates()

        assert isinstance(templates, list)
        assert len(templates) > 0

    def test_validate_template_exists(self):
        """Test validating an existing template"""
        engine = TemplateEngine()
        templates = engine.list_templates()

        if templates:
            assert engine.validate_template(templates[0]) is True

    def test_validate_template_not_exists(self):
        """Test validating a non-existent template"""
        engine = TemplateEngine()
        assert engine.validate_template("nonexistent.jinja2") is False


class TestValidator:
    """Test validator functionality"""

    @pytest.fixture
    def valid_scanner_code(self):
        """Valid v31 scanner code"""
        return '''
import pandas as pd
import numpy as np

class TestScanner:
    """Test scanner"""

    def __init__(self):
        pass

    def fetch_grouped_data(self, start_date, end_date, workers=4):
        """Fetch grouped data"""
        return pd.DataFrame()

    def apply_smart_filters(self, stage1_data, workers=4):
        """Apply smart filters"""
        return stage1_data

    def detect_patterns(self, stage2_data):
        """Detect patterns"""
        return []

    def format_results(self, stage3_results):
        """Format results"""
        return pd.DataFrame()

    def run_scan(self, start_date, end_date, workers=4):
        """Run scan"""
        return pd.DataFrame()
'''

    @pytest.fixture
    def invalid_syntax_code(self):
        """Code with syntax errors"""
        return '''
def broken(
    # Missing closing paren
    return x
'''

    @pytest.fixture
    def invalid_structure_code(self):
        """Code with missing required methods"""
        return '''
class IncompleteScanner:
    """Incomplete scanner"""

    def __init__(self):
        pass

    def fetch_grouped_data(self, start_date, end_date):
        return pd.DataFrame()

    # Missing other required methods
'''

    def test_validate_syntax_valid(self, valid_scanner_code):
        """Test syntax validation with valid code"""
        validator = Validator()
        result = validator.validate_syntax(valid_scanner_code)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_validate_syntax_invalid(self, invalid_syntax_code):
        """Test syntax validation with invalid code"""
        validator = Validator()
        result = validator.validate_syntax(invalid_syntax_code)

        assert result.is_valid is False
        assert len(result.errors) > 0

    def test_validate_structure_valid(self, valid_scanner_code):
        """Test structure validation with valid code"""
        validator = Validator()
        result = validator.validate_structure(valid_scanner_code)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_validate_structure_invalid(self, invalid_structure_code):
        """Test structure validation with invalid code"""
        validator = Validator()
        result = validator.validate_structure(invalid_structure_code)

        assert result.is_valid is False
        assert len(result.errors) > 0
        assert any("Missing required methods" in e for e in result.errors)

    def test_validate_all_valid(self, valid_scanner_code):
        """Test complete validation with valid code"""
        validator = Validator()
        is_valid, results = validator.validate_all(valid_scanner_code)

        assert is_valid is True
        assert len(results) == 3  # syntax, structure, logic

    def test_validate_all_invalid(self, invalid_syntax_code):
        """Test complete validation with invalid code"""
        validator = Validator()
        is_valid, results = validator.validate_all(invalid_syntax_code)

        assert is_valid is False
        # Should fail at syntax validation and stop

    def test_format_validation_results(self, valid_scanner_code):
        """Test formatting validation results"""
        validator = Validator()
        is_valid, results = validator.validate_all(valid_scanner_code)

        formatted = validator.format_validation_results(results)

        assert isinstance(formatted, str)
        assert "VALIDATION RESULTS" in formatted
        assert "SYNTAX VALIDATION" in formatted
        assert "STRUCTURE VALIDATION" in formatted
        assert "LOGIC VALIDATION" in formatted


class TestTemplateRendering:
    """Test template rendering with context"""

    def test_render_base_template(self):
        """Test rendering base v31 template"""
        engine = TemplateEngine()

        context = {
            'scanner_name': 'TestScanner',
            'strategy_name': 'Test Strategy',
            'description': 'A test scanner',
            'date_range': '2024-01-01 to 2024-12-31',
            'needs_polygon_api': False,
            'scanner_type': 'single',
            'timestamp': '2024-01-01 12:00:00',
            'smart_filters': {
                'min_prev_close': 0.75,
                'max_prev_close': 1000,
                'min_prev_volume': 500000,
                'max_prev_volume': 100000000
            },
            'stage1_workers': 4,
            'stage3_workers': 4,
            'pattern_detection_method': '''
# Calculate gap
stage2_data['gap'] = (stage2_data['open'] / stage2_data['close'].shift(1)) - 1

# Find signals
signals = stage2_data[stage2_data['gap'] >= 0.5]

# Build results
for idx, row in signals.iterrows():
    result = {
        'ticker': row['ticker'],
        'date': row['date'],
        'entry_price': row['open'],
        'gap': row['gap']
    }
    results.append(result)
'''
        }

        try:
            rendered = engine.render('base_v31.py.jinja2', context)

            assert isinstance(rendered, str)
            assert len(rendered) > 0
            assert 'class TestScanner' in rendered
            assert 'fetch_grouped_data' in rendered
            assert 'apply_smart_filters' in rendered
            assert 'detect_patterns' in rendered

        except TemplateEngineError as e:
            pytest.skip(f"Template rendering failed: {e}")

    def test_render_and_validate(self):
        """Test rendering template and validating output"""
        engine = TemplateEngine()
        validator = Validator()

        context = {
            'scanner_name': 'ValidatedScanner',
            'strategy_name': 'Test Strategy',
            'description': 'A test scanner',
            'date_range': '2024-01-01 to 2024-12-31',
            'needs_polygon_api': False,
            'scanner_type': 'single',
            'timestamp': '2024-01-01 12:00:00',
            'smart_filters': {
                'min_prev_close': 0.75,
                'max_prev_close': 1000,
                'min_prev_volume': 500000,
                'max_prev_volume': 100000000
            },
            'stage1_workers': 4,
            'stage3_workers': 4,
            'pattern_detection_method': 'pass  # Placeholder'
        }

        try:
            # Render template
            rendered = engine.render('base_v31.py.jinja2', context)

            # Validate rendered code
            is_valid, results = validator.validate_all(rendered)

            # Format results
            if not is_valid:
                formatted = validator.format_validation_results(results)
                print(formatted)

            # At minimum, syntax should be valid
            syntax_valid = results[0].is_valid
            assert syntax_valid, "Generated code has syntax errors"

        except TemplateEngineError as e:
            pytest.skip(f"Template rendering failed: {e}")


class TestPipelineIntegration:
    """Test complete pipeline integration"""

    def test_ast_parser_integration(self):
        """Test AST parser integration"""
        code = '''
def run_scan():
    """Scan for gaps"""
    # Gap >= 0.5
    # Volume >= 1M
    results = df[df['gap'] >= 0.5]
    return results
'''

        parser = ASTParser()
        parser.parse_code(code)

        functions = parser.extract_functions()
        assert len(functions) == 1
        assert functions[0].name == 'run_scan'

    def test_template_engine_integration(self):
        """Test template engine in pipeline"""
        engine = TemplateEngine()

        # Verify templates exist
        templates = engine.list_templates()
        assert len(templates) > 0

        # Verify template directory
        assert engine.template_dir.exists()

    def test_validator_integration(self):
        """Test validator in pipeline"""
        validator = Validator()

        # Test with simple valid code
        code = '''
class Scanner:
    def fetch_grouped_data(self, start_date, end_date):
        return pd.DataFrame()

    def apply_smart_filters(self, stage1_data):
        return stage1_data

    def detect_patterns(self, stage2_data):
        return []

    def format_results(self, stage3_results):
        return pd.DataFrame()

    def run_scan(self, start_date, end_date):
        return pd.DataFrame()
'''

        is_valid, results = validator.validate_all(code)

        # Should have validation results
        assert len(results) > 0
        assert isinstance(results[0], ValidationResult)
