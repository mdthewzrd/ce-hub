"""
End-to-end tests for RENATA_V2 transformation pipeline

Tests the complete transformation workflow from source code to v31 output.
"""

import pytest
import sys
import os
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from RENATA_V2.core.transformer import (
    RenataTransformer,
    TransformationError,
    TransformationResult
)


@pytest.fixture(autouse=True)
def mock_api_key():
    """Mock OpenRouter API key for all tests"""
    with patch.dict('os.environ', {'OPENROUTER_API_KEY': 'test_key_for_testing'}):
        yield


class TestEndToEndTransformation:
    """End-to-end transformation tests"""

    @pytest.fixture
    def simple_gap_scanner(self):
        """Simple gap scanner for testing"""
        return '''
def run_scan():
    """
    Scan for gap down setups

    Looking for stocks that gap down at least 0.5%
    with volume confirmation.
    """
    results = []

    # Get tickers
    tickers = ["AAPL", "MSFT", "GOOGL"]

    for ticker in tickers:
        # Get data
        df = get_data(ticker)

        # Calculate gap
        df['gap'] = (df['open'] / df['close'].shift(1)) - 1

        # Find signals
        signals = df[
            (df['gap'] <= -0.5) &  # Gap down at least 0.5%
            (df['volume'] >= 1000000) &  # Volume at least 1M
            (df['close'] >= 0.75)  # Price at least $0.75
        ]

        # Collect results
        for idx, row in signals.iterrows():
            results.append({
                'ticker': ticker,
                'date': row['date'],
                'entry_price': row['open'],
                'gap': row['gap']
            })

    return results
'''

    @pytest.fixture
    def ema_crossover_scanner(self):
        """EMA crossover scanner"""
        return '''
def scan_ema_crossover():
    """
    Scan for EMA crossover signals

    Bullish crossover when 9 EMA crosses above 21 EMA
    """
    results = []

    tickers = get_universe()

    for ticker in tickers:
        df = fetch_data(ticker)

        # Calculate EMAs
        df['ema_9'] = df['close'].ewm(span=9).mean()
        df['ema_21'] = df['close'].ewm(span=21).mean()

        # Find crossovers
        df['crossover'] = df['ema_9'] > df['ema_21']
        df['signal'] = df['crossover'] & ~df['crossover'].shift(1)

        signals = df[df['signal'] == True]

        for idx, row in signals.iterrows():
            results.append({
                'ticker': ticker,
                'date': row['date'],
                'entry': row['close'],
                'ema_9': row['ema_9'],
                'ema_21': row['ema_21']
            })

    return results
'''

    def test_transformer_initialization(self):
        """Test transformer can be initialized"""
        transformer = RenataTransformer()

        assert transformer is not None
        assert transformer.ast_parser is not None
        assert transformer.ai_agent is not None
        assert transformer.template_engine is not None
        assert transformer.validator is not None
        assert transformer.max_correction_attempts == 3

    def test_simple_transformation_structure(self, simple_gap_scanner):
        """Test basic transformation without AI (structure only)"""
        transformer = RenataTransformer()

        # This test verifies the pipeline structure without making API calls
        # We'll mock the AI components to test just the flow

        # Parse source code
        ast_result = transformer._parse_source_code(simple_gap_scanner)

        assert ast_result is not None
        assert ast_result.scanner_type is not None

    def test_scanner_name_generation(self, simple_gap_scanner):
        """Test automatic scanner name generation"""
        transformer = RenataTransformer()

        # Test name generation
        name1 = transformer._generate_scanner_name("Gap Down")
        assert name1 == "GapDownScanner"

        name2 = transformer._generate_scanner_name("EMA Crossover")
        assert name2 == "EmaCrossoverScanner"  # Note: capitalize() lowercases rest of word

    def test_context_building(self, simple_gap_scanner):
        """Test template context building"""
        from RENATA_V2.core.models import StrategySpec, ParameterSpec, StrategyType

        transformer = RenataTransformer()

        # Create mock strategy and parameters
        strategy = StrategySpec(
            name="Gap Down Scanner",
            description="Tests for gap down patterns",
            strategy_type=StrategyType.GAP,
            entry_conditions=["Gap <= -0.5%", "Volume >= 1M"],
            exit_conditions=[],
            parameters={},
            timeframe="daily",
            rationale="Gap downs indicate selling pressure",
            scanner_type="single"
        )

        parameters = ParameterSpec(
            price_thresholds={"min_price": {"value": 0.75, "units": "dollars"}},
            volume_thresholds={"min_volume": {"value": 1000000, "units": "shares"}},
            gap_thresholds={},
            ema_periods={},
            consecutive_day_requirements={},
            other_parameters={}
        )

        # Parse source code
        ast_result = transformer._parse_source_code(simple_gap_scanner)

        # Build context
        context = transformer._build_context(
            scanner_name="TestScanner",
            strategy=strategy,
            parameters=parameters,
            ast_result=ast_result,
            pattern_detection_code="pass",
            date_range="2024-01-01 to 2024-12-31",
            attempt=0,
            previous_corrections=[]
        )

        # Verify context has required keys
        assert 'scanner_name' in context
        assert 'strategy_name' in context
        assert 'smart_filters' in context
        assert 'pattern_detection_method' in context
        assert context['scanner_name'] == "TestScanner"

    def test_template_selection(self, simple_gap_scanner):
        """Test template selection based on scanner type"""
        transformer = RenataTransformer()

        # Parse and classify
        ast_result = transformer._parse_source_code(simple_gap_scanner)

        # Select template
        template = transformer._select_template(
            ast_result,
            strategy=None  # Not needed for this test
        )

        assert template is not None
        assert template.endswith('.jinja2')


class TestTransformationResult:
    """Test TransformationResult data class"""

    def test_successful_result(self):
        """Test successful transformation result"""
        result = TransformationResult(
            success=True,
            generated_code="# Valid code\ndef test():\n    pass",
            validation_results=[],
            transformation_metadata={'test': 'data'},
            errors=[],
            corrections_made=0
        )

        assert result.success is True
        assert result.generated_code is not None
        assert len(result.errors) == 0
        assert result.corrections_made == 0

    def test_failed_result(self):
        """Test failed transformation result"""
        result = TransformationResult(
            success=False,
            generated_code=None,
            validation_results=[],
            transformation_metadata={},
            errors=["Syntax error", "Missing method"],
            corrections_made=0
        )

        assert result.success is False
        assert result.generated_code is None
        assert len(result.errors) == 2


class TestErrorHandling:
    """Test error handling in transformation pipeline"""

    def test_invalid_source_code(self):
        """Test handling of invalid source code"""
        transformer = RenataTransformer()

        invalid_code = "this is not valid python code ))))"

        with pytest.raises(Exception):
            transformer._parse_source_code(invalid_code)

    def test_empty_source_code(self):
        """Test handling of empty source code"""
        transformer = RenataTransformer()

        empty_code = ""

        # Should handle gracefully
        try:
            result = transformer._parse_source_code(empty_code)
            # If it doesn't raise, check result
            assert result is not None
        except Exception:
            # Either behavior is acceptable
            pass


class TestSelfCorrectionLoop:
    """Test self-correction loop functionality"""

    def test_correction_attempt_for_missing_imports(self):
        """Test correction attempt for missing imports"""
        from RENATA_V2.core.validator import ValidationResult

        transformer = RenataTransformer()

        # Create validation results with missing import error
        validation_results = [
            ValidationResult(
                is_valid=False,
                errors=["Missing required imports: pandas"],
                warnings=[],
                category='syntax'
            )
        ]

        # Attempt correction
        correction = transformer._attempt_correction(
            code="",
            errors=["Missing required imports: pandas"],
            validation_results=validation_results,
            attempt=0
        )

        # Should return a correction
        assert correction is not None
        assert correction['type'] == 'context'

    def test_correction_attempt_for_pattern_syntax(self):
        """Test correction attempt for pattern syntax errors"""
        from RENATA_V2.core.validator import ValidationResult

        transformer = RenataTransformer()

        # Create validation results with syntax error
        validation_results = [
            ValidationResult(
                is_valid=False,
                errors=["Syntax error at line 15 in detect_patterns"],
                warnings=[],
                category='syntax'
            )
        ]

        # Attempt correction
        correction = transformer._attempt_correction(
            code="def detect_patterns():\n    broken syntax here",
            errors=["Syntax error at line 15 in detect_patterns"],
            validation_results=validation_results,
            attempt=0
        )

        # Should return a correction with simplified logic
        assert correction is not None
        assert correction['type'] == 'pattern_logic'
        assert 'corrected_code' in correction

    def test_no_correction_available(self):
        """Test case where no correction is available"""
        from RENATA_V2.core.validator import ValidationResult

        transformer = RenataTransformer()

        # Create validation results with uncorrectable error
        validation_results = [
            ValidationResult(
                is_valid=False,
                errors=["Unknown error that can't be auto-fixed"],
                warnings=[],
                category='logic'
            )
        ]

        # Attempt correction
        correction = transformer._attempt_correction(
            code="some code",
            errors=["Unknown error"],
            validation_results=validation_results,
            attempt=0
        )

        # Should return None (no correction available)
        assert correction is None


class TestFileOutput:
    """Test file output functionality"""

    def test_save_successful_transformation(self, tmp_path):
        """Test saving successful transformation to file"""
        transformer = RenataTransformer()

        result = TransformationResult(
            success=True,
            generated_code="# Generated scanner\nclass TestScanner:\n    pass",
            validation_results=[],
            transformation_metadata={},
            errors=[],
            corrections_made=0
        )

        output_file = tmp_path / "test_scanner.py"

        # Save should succeed
        transformer.save_to_file(result, str(output_file))

        # Verify file exists and contains code
        assert output_file.exists()

        with open(output_file, 'r') as f:
            content = f.read()

        assert "class TestScanner" in content

    def test_save_failed_transformation_raises_error(self, tmp_path):
        """Test that saving failed transformation raises error"""
        transformer = RenataTransformer()

        result = TransformationResult(
            success=False,
            generated_code=None,
            validation_results=[],
            transformation_metadata={},
            errors=["Syntax errors"],
            corrections_made=0
        )

        output_file = tmp_path / "test_scanner.py"

        # Should raise error
        with pytest.raises(TransformationError):
            transformer.save_to_file(result, str(output_file))


class TestPipelineComponents:
    """Test individual pipeline components"""

    def test_ast_parser_component(self):
        """Test AST parser component"""
        transformer = RenataTransformer()

        code = "def test(): return 42"

        ast_result = transformer._parse_source_code(code)

        assert ast_result is not None
        assert hasattr(ast_result, 'scanner_type')

    def test_template_engine_component(self):
        """Test template engine component"""
        transformer = RenataTransformer()

        templates = transformer.template_engine.list_templates()

        assert isinstance(templates, list)
        assert len(templates) > 0

    def test_validator_component(self):
        """Test validator component"""
        transformer = RenataTransformer()

        valid_code = '''
import pandas as pd

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

        is_valid, results = transformer.validator.validate_all(valid_code)

        assert is_valid is True
        assert len(results) == 3  # syntax, structure, logic
