"""
Unit tests for RENATA_V2 AI Agent

Tests the AI Agent's ability to:
- Extract strategy intent from scanner code
- Identify parameters
- Generate pattern logic
- Extract pattern filters
- Handle retry logic and errors
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
import time

from RENATA_V2.core.ai_agent import (
    AIAgent,
    AIExtractionError,
    AIRequestResult
)
from RENATA_V2.core.models import (
    StrategySpec,
    StrategyType,
    ParameterSpec,
    PatternFilterSpec
)


@pytest.fixture
def ai_agent_with_mock():
    """Create AI agent with mocked OpenAI client"""
    with patch.dict('os.environ', {'OPENROUTER_API_KEY': 'test_key_12345'}):
        with patch('openai.OpenAI') as mock_openai:
            mock_client = Mock()
            mock_openai.return_value = mock_client
            agent = AIAgent()
            agent.client = mock_client
            yield agent, mock_client


@pytest.fixture
def sample_scanner_code():
    """Sample scanner code for testing"""
    return '''
def run_scan():
    """Scan for D2 gap setup"""
    # Gap >= 0.5
    # Volume >= 1M
    # Price >= $0.75

    tickers = ["AAPL", "MSFT", "GOOGL"]

    for ticker in tickers:
        df = get_data(ticker)

        # Check gap condition
        df['gap'] = (df['open'] / df['close'].shift(1)) - 1

        # Filter by conditions
        results = df[
            (df['gap'] >= 0.5) &
            (df['volume'] >= 1000000) &
            (df['close'] >= 0.75)
        ]

        return results
'''


@pytest.fixture
def ai_agent():
    """Create AI agent instance with mocked API key (no client mock)"""
    with patch.dict('os.environ', {'OPENROUTER_API_KEY': 'test_key_12345'}):
        return AIAgent()


class TestAIAgentInitialization:
    """Test AI Agent initialization and configuration"""

    def test_init_with_api_key(self, ai_agent):
        """Test successful initialization with API key"""
        assert ai_agent is not None
        assert ai_agent.models['primary'] == 'qwen/qwen-3-coder-32b-instruct'
        assert ai_agent.models['fallback'] == 'deepseek/deepseek-coder'
        assert ai_agent.models['validation'] == 'openai/gpt-4'

    def test_init_without_api_key(self):
        """Test initialization fails without API key"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="OPENROUTER_API_KEY environment variable not set"):
                AIAgent()

    def test_retry_configuration(self, ai_agent):
        """Test retry configuration is set correctly"""
        assert ai_agent.max_retries == 3
        assert ai_agent.retry_delay == 1.0
        assert ai_agent.request_timeout == 60

    def test_cache_configuration(self, ai_agent):
        """Test cache is enabled and empty"""
        assert ai_agent.cache_enabled is True
        assert len(ai_agent.response_cache) == 0


class TestStrategyExtraction:
    """Test strategy intent extraction"""

    def test_extract_strategy_intent_success(
        self,
        ai_agent_with_mock,
        sample_scanner_code
    ):
        """Test successful strategy extraction"""
        ai_agent, mock_client = ai_agent_with_mock

        # Mock API response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "name": "D2 Gap Scanner",
            "description": "Scans for gap down setups with volume confirmation",
            "strategy_type": "gap",
            "entry_conditions": [
                "Gap down at least 0.5%",
                "Volume at least 1M shares",
                "Price at least $0.75"
            ],
            "exit_conditions": [
                "Exit at end of day"
            ],
            "timeframe": "daily",
            "rationale": "Gaps down with high volume indicate institutional activity and potential continuation"
        })

        mock_client.chat.completions.create.return_value = mock_response

        # Extract strategy
        result = ai_agent.extract_strategy_intent(sample_scanner_code)

        # Verify result
        assert isinstance(result, StrategySpec)
        assert result.name == "D2 Gap Scanner"
        assert result.strategy_type == StrategyType.GAP
        assert len(result.entry_conditions) == 3
        assert "Gap down at least 0.5%" in result.entry_conditions
        assert result.timeframe == "daily"

    def test_extract_strategy_intent_with_ast_info(
        self,
        ai_agent_with_mock,
        sample_scanner_code
    ):
        """Test strategy extraction with AST information"""
        from RENATA_V2.core.ast_parser import ASTParser

        ai_agent, mock_client = ai_agent_with_mock

        # Parse code first
        parser = ASTParser()
        parser.parse_code(sample_scanner_code)
        ast_info = parser.classify_scanner_type()

        # Mock API response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "name": "Test Strategy",
            "description": "Test description",
            "strategy_type": "other",
            "entry_conditions": [],
            "exit_conditions": [],
            "timeframe": "daily",
            "rationale": "Test rationale"
        })

        mock_client.chat.completions.create.return_value = mock_response

        # Extract strategy with AST info
        result = ai_agent.extract_strategy_intent(sample_scanner_code, ast_info)

        assert isinstance(result, StrategySpec)
        assert result.name == "Test Strategy"

    def test_extract_strategy_intent_invalid_json(
        self,
        ai_agent_with_mock,
        sample_scanner_code
    ):
        """Test handling of invalid JSON response"""
        ai_agent, mock_client = ai_agent_with_mock

        # Mock API response with invalid JSON
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "This is not valid JSON"

        mock_client.chat.completions.create.return_value = mock_response

        # Should raise error
        with pytest.raises(AIExtractionError, match="Failed to parse AI response as JSON"):
            ai_agent.extract_strategy_intent(sample_scanner_code)

    def test_extract_strategy_intent_maps_strategy_types(
        self,
        ai_agent_with_mock,
        sample_scanner_code
    ):
        """Test strategy type mapping"""
        ai_agent, mock_client = ai_agent_with_mock

        test_cases = [
            ("trend_following", StrategyType.TREND_FOLLOWING),
            ("mean_reversion", StrategyType.MEAN_REVERSION),
            ("momentum", StrategyType.MOMENTUM),
            ("gap", StrategyType.GAP),
            ("breakout", StrategyType.BREAKOUT),
            ("liquidity", StrategyType.LIQUIDITY),
            ("pattern", StrategyType.PATTERN),
            ("unknown", StrategyType.OTHER)
        ]

        for strategy_type_str, expected_enum in test_cases:
            # Clear cache to ensure fresh call for each iteration
            ai_agent.response_cache.clear()

            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = json.dumps({
                "name": "Test",
                "description": "Test",
                "strategy_type": strategy_type_str,
                "entry_conditions": [],
                "exit_conditions": [],
                "timeframe": "daily",
                "rationale": "Test"
            })

            mock_client.chat.completions.create.return_value = mock_response

            result = ai_agent.extract_strategy_intent(sample_scanner_code)
            assert result.strategy_type == expected_enum, f"Failed for {strategy_type_str}: got {result.strategy_type}, expected {expected_enum}"


class TestParameterExtraction:
    """Test parameter identification and extraction"""

    def test_identify_parameters_success(
        self,
        ai_agent_with_mock,
        sample_scanner_code
    ):
        """Test successful parameter extraction"""
        ai_agent, mock_client = ai_agent_with_mock

        # Mock API response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "price_thresholds": {
                "min_price": {"value": 0.75, "units": "dollars"},
                "max_price": None
            },
            "volume_thresholds": {
                "min_volume": {"value": 1000000, "units": "shares"}
            },
            "gap_thresholds": {
                "min_gap_pct": {"value": 0.5, "units": "percent"}
            },
            "ema_periods": {},
            "consecutive_day_requirements": {},
            "other_parameters": {}
        })

        mock_client.chat.completions.create.return_value = mock_response

        # Extract parameters
        result = ai_agent.identify_parameters(sample_scanner_code)

        # Verify result
        assert isinstance(result, ParameterSpec)
        assert result.price_thresholds['min_price']['value'] == 0.75
        assert result.volume_thresholds['min_volume']['value'] == 1000000
        assert result.gap_thresholds['min_gap_pct']['value'] == 0.5

    def test_identify_parameters_with_ema_periods(
        self,
        ai_agent_with_mock
    ):
        """Test parameter extraction with EMA periods"""
        ai_agent, mock_client = ai_agent_with_mock

        code = '''
def scan():
    df['ema_9'] = df['close'].ewm(span=9).mean()
    df['ema_21'] = df['close'].ewm(span=21).mean()
'''

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "price_thresholds": {},
            "volume_thresholds": {},
            "gap_thresholds": {},
            "ema_periods": {
                "ema_9": {"value": 9, "units": "days"},
                "ema_21": {"value": 21, "units": "days"}
            },
            "consecutive_day_requirements": {},
            "other_parameters": {}
        })

        mock_client.chat.completions.create.return_value = mock_response

        result = ai_agent.identify_parameters(code)
        assert result.ema_periods['ema_9']['value'] == 9
        assert result.ema_periods['ema_21']['value'] == 21

    def test_identify_parameters_with_consecutive_days(
        self,
        ai_agent_with_mock
    ):
        """Test parameter extraction with consecutive day requirements"""
        ai_agent, mock_client = ai_agent_with_mock

        code = '''
def scan():
    # Need 2 consecutive gap days
'''

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "price_thresholds": {},
            "volume_thresholds": {},
            "gap_thresholds": {},
            "ema_periods": {},
            "consecutive_day_requirements": {
                "min_consecutive": {"value": 2, "units": "days"}
            },
            "other_parameters": {}
        })

        mock_client.chat.completions.create.return_value = mock_response

        result = ai_agent.identify_parameters(code)
        assert result.consecutive_day_requirements['min_consecutive']['value'] == 2


class TestPatternLogicGeneration:
    """Test pattern logic code generation"""

    def test_generate_pattern_logic_success(
        self,
        ai_agent_with_mock
    ):
        """Test successful pattern logic generation"""
        ai_agent, mock_client = ai_agent_with_mock

        strategy = StrategySpec(
            name="Test Strategy",
            description="Test description",
            strategy_type=StrategyType.GAP,
            entry_conditions=["Gap >= 0.5", "Volume >= 1M"],
            exit_conditions=[],
            parameters={},
            timeframe="daily",
            rationale="Test",
            scanner_type="single"
        )

        parameters = ParameterSpec(
            price_thresholds={"min_price": {"value": 0.75, "units": "dollars"}},
            volume_thresholds={"min_volume": {"value": 1000000, "units": "shares"}},
            gap_thresholds={"min_gap_pct": {"value": 0.5, "units": "percent"}},
            ema_periods={},
            consecutive_day_requirements={},
            other_parameters={}
        )

        # Mock API response
        generated_code = '''def detect_patterns(self, stage2_data):
    """
    Check for Test Strategy setup

    Args:
        stage2_data: Filtered DataFrame from apply_smart_filters

    Returns:
        List of dictionaries with pattern results
    """
    results = []

    for ticker, data in stage2_data.groupby('ticker'):
        # Calculate gap
        data['gap'] = (data['open'] / data['prev_close']) - 1

        # Check conditions
        signals = data[
            (data['gap'] >= 0.5) &
            (data['volume'] >= 1000000)
        ]

        for idx, row in signals.iterrows():
            results.append({
                'ticker': ticker,
                'date': row['date'],
                'entry_price': row['open']
            })

    return results
'''

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = generated_code

        mock_client.chat.completions.create.return_value = mock_response

        # Generate pattern logic
        result = ai_agent.generate_pattern_logic(strategy, parameters)

        # Verify result contains function definition
        assert 'def detect_patterns(' in result
        assert 'stage2_data' in result

    def test_generate_pattern_logic_missing_function(
        self,
        ai_agent_with_mock
    ):
        """Test handling of invalid code generation"""
        ai_agent, mock_client = ai_agent_with_mock

        strategy = StrategySpec(
            name="Test",
            description="Test",
            strategy_type=StrategyType.OTHER,
            entry_conditions=[],
            exit_conditions=[],
            parameters={},
            timeframe="daily",
            rationale="Test",
            scanner_type="single"
        )

        parameters = ParameterSpec(
            price_thresholds={},
            volume_thresholds={},
            gap_thresholds={},
            ema_periods={},
            consecutive_day_requirements={},
            other_parameters={}
        )

        # Mock API response without function definition
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "This is not valid function code"

        mock_client.chat.completions.create.return_value = mock_response

        # Should raise error
        with pytest.raises(AIExtractionError, match="Generated code doesn't contain detect_patterns function"):
            ai_agent.generate_pattern_logic(strategy, parameters)


class TestPatternFilterExtraction:
    """Test pattern-specific filter extraction for multi-scanners"""

    def test_extract_pattern_filters_success(
        self,
        ai_agent_with_mock
    ):
        """Test successful pattern filter extraction"""
        ai_agent, mock_client = ai_agent_with_mock

        pattern_code = '''
def check_d2_pattern(df):
    # Requires gap >= 0.5
    # Volume >= 1M
    # Price >= $0.75
'''

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "min_price": {"value": 0.75, "units": "dollars"},
            "max_price": None,
            "min_volume": {"value": 1000000, "units": "shares"},
            "max_volume": None,
            "min_gap_pct": {"value": 0.5, "units": "percent"},
            "max_gap_pct": None,
            "min_gap_consecutive": {"value": 2, "units": "days"}
        })

        mock_client.chat.completions.create.return_value = mock_response

        # Extract filters
        result = ai_agent.extract_pattern_filters(pattern_code, "D2 Pattern")

        # Verify result
        assert isinstance(result, PatternFilterSpec)
        assert result.min_price == 0.75
        assert result.min_volume == 1000000
        assert result.min_gap_pct == 0.5
        assert result.min_gap_consecutive == 2

    def test_extract_pattern_filters_none_values(
        self,
        ai_agent_with_mock
    ):
        """Test pattern filter extraction with None values"""
        ai_agent, mock_client = ai_agent_with_mock

        pattern_code = 'def check_pattern(df): pass'

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = json.dumps({
            "min_price": None,
            "max_price": None,
            "min_volume": None,
            "max_volume": None,
            "min_gap_pct": None,
            "max_gap_pct": None,
            "min_gap_consecutive": None
        })

        mock_client.chat.completions.create.return_value = mock_response

        result = ai_agent.extract_pattern_filters(pattern_code, "Test")

        assert result.min_price is None
        assert result.max_price is None
        assert result.min_volume is None


class TestRetryLogic:
    """Test retry logic and error handling"""

    def test_retry_on_failure(self, ai_agent_with_mock):
        """Test retry mechanism on API failure"""
        ai_agent, mock_client = ai_agent_with_mock

        # Fail first two attempts, succeed on third
        mock_client.chat.completions.create.side_effect = [
            Exception("API Error 1"),
            Exception("API Error 2"),
            Mock(choices=[Mock(message=Mock(content="Success"))])
        ]

        result = ai_agent._make_request("Test prompt", response_format="text")

        assert result == "Success"
        assert mock_client.chat.completions.create.call_count == 3

    def test_retry_exhaustion(self, ai_agent_with_mock):
        """Test failure after all retries exhausted"""
        ai_agent, mock_client = ai_agent_with_mock

        # Always fail
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        with pytest.raises(AIExtractionError, match="AI request failed after 3 attempts"):
            ai_agent._make_request("Test prompt", response_format="text")

        assert mock_client.chat.completions.create.call_count == 3

    def test_exponential_backoff(self, ai_agent_with_mock):
        """Test exponential backoff between retries"""
        ai_agent, mock_client = ai_agent_with_mock

        mock_client.chat.completions.create.side_effect = [
            Exception("Error 1"),
            Exception("Error 2"),
            Mock(choices=[Mock(message=Mock(content="Success"))])
        ]

        start_time = time.time()
        ai_agent._make_request("Test prompt", response_format="text")
        elapsed_time = time.time() - start_time

        # Should have waited: 1s (first retry) + 2s (second retry) = 3s minimum
        assert elapsed_time >= 2.5  # Allow some tolerance


class TestResponseCaching:
    """Test response caching functionality"""

    def test_cache_hit(self, ai_agent_with_mock):
        """Test that cached responses are returned without API call"""
        ai_agent, mock_client = ai_agent_with_mock

        prompt = "Test prompt"
        response_text = "Cached response"

        # First call - cache miss
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = response_text

        mock_client.chat.completions.create.return_value = mock_response

        result1 = ai_agent._make_request(prompt, response_format="text")

        # Second call - should hit cache
        result2 = ai_agent._make_request(prompt, response_format="text")

        assert result1 == response_text
        assert result2 == response_text
        assert mock_client.chat.completions.create.call_count == 1

    def test_cache_key_different_formats(self, ai_agent_with_mock):
        """Test that different response formats create different cache entries"""
        ai_agent, mock_client = ai_agent_with_mock

        prompt = "Test prompt"

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Response"

        mock_client.chat.completions.create.return_value = mock_response

        # Call with different formats
        ai_agent._make_request(prompt, response_format="text")
        ai_agent._make_request(prompt, response_format="json")

        # Should make 2 API calls (different cache keys)
        assert mock_client.chat.completions.create.call_count == 2

    def test_cache_disabled(self, ai_agent_with_mock):
        """Test behavior when cache is disabled"""
        ai_agent, mock_client = ai_agent_with_mock
        ai_agent.cache_enabled = False

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Response"

        mock_client.chat.completions.create.return_value = mock_response

        # Two calls with same prompt
        ai_agent._make_request("Test prompt", response_format="text")
        ai_agent._make_request("Test prompt", response_format="text")

        # Should make 2 API calls (cache disabled)
        assert mock_client.chat.completions.create.call_count == 2


class TestResponseFormats:
    """Test different response format handling"""

    def test_json_response_format(self, ai_agent_with_mock):
        """Test JSON response format configuration"""
        ai_agent, mock_client = ai_agent_with_mock

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = '{"key": "value"}'

        mock_client.chat.completions.create.return_value = mock_response

        ai_agent._make_request("Test", response_format="json")

        # Verify API was called with JSON format
        call_args = mock_client.chat.completions.create.call_args
        assert call_args[1]['response_format']['type'] == 'json_object'

    def test_text_response_format(self, ai_agent_with_mock):
        """Test text response format configuration"""
        ai_agent, mock_client = ai_agent_with_mock

        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Text response"

        mock_client.chat.completions.create.return_value = mock_response

        ai_agent._make_request("Test", response_format="text")

        # Verify API was called with text format
        call_args = mock_client.chat.completions.create.call_args
        assert call_args[1]['response_format']['type'] == 'text'


class TestSystemPrompt:
    """Test system prompt generation"""

    def test_system_prompt_content(self, ai_agent):
        """Test system prompt contains required information"""
        prompt = ai_agent._get_system_prompt()

        assert "expert trading system analyst" in prompt.lower()
        assert "v31 standard" in prompt.lower()
        assert "fetch_grouped_data" in prompt
        assert "apply_smart_filters" in prompt
        assert "detect_patterns" in prompt
        assert "format_results" in prompt


class TestASTInfoFormatting:
    """Test AST information formatting for prompts"""

    def test_format_ast_info_with_parser_result(self, ai_agent):
        """Test formatting AST parser results"""
        from RENATA_V2.core.ast_parser import ASTParser, DataSourceInfo

        code = "def test(): pass"
        parser = ASTParser()
        parser.parse_code(code)
        result = parser.classify_scanner_type()

        formatted = ai_agent._format_ast_info(result)

        assert "Functions:" in formatted or "Scanner Type:" in formatted

    def test_format_ast_info_none(self, ai_agent):
        """Test formatting when AST info is None"""
        formatted = ai_agent._format_ast_info(None)

        assert formatted == "No AST information available"

    def test_format_ast_info_empty_object(self, ai_agent):
        """Test formatting when AST info has no attributes"""
        formatted = ai_agent._format_ast_info(object())

        # Should handle gracefully
        assert isinstance(formatted, str)


class TestParameterSpecToDict:
    """Test ParameterSpec serialization"""

    def test_parameter_spec_to_dict(self):
        """Test converting ParameterSpec to dictionary"""
        spec = ParameterSpec(
            price_thresholds={"min_price": {"value": 0.75, "units": "dollars"}},
            volume_thresholds={"min_volume": {"value": 1000000, "units": "shares"}},
            gap_thresholds={},
            ema_periods={},
            consecutive_day_requirements={},
            other_parameters={}
        )

        result = spec.to_dict()

        assert isinstance(result, dict)
        assert 'price_thresholds' in result
        assert 'volume_thresholds' in result
        assert result['price_thresholds']['min_price']['value'] == 0.75


class TestPatternFilterSpecToDict:
    """Test PatternFilterSpec serialization"""

    def test_pattern_filter_spec_to_dict(self):
        """Test converting PatternFilterSpec to dictionary"""
        spec = PatternFilterSpec(
            min_price=0.75,
            max_price=100.0,
            min_volume=1000000,
            min_gap_pct=0.5,
            min_gap_consecutive=2
        )

        result = spec.to_dict()

        assert isinstance(result, dict)
        assert result['min_price'] == 0.75
        assert result['max_price'] == 100.0
        assert result['min_volume'] == 1000000
        assert result['min_gap_pct'] == 0.5
        assert result['min_gap_consecutive'] == 2
