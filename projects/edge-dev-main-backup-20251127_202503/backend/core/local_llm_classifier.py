#!/usr/bin/env python3
"""
🤖 Local LLM Trading Parameter Classifier
==========================================

Intelligent classification of extracted parameters as trading filters vs configuration
using local LLM inference. Designed for privacy, speed, and accuracy.

Key Features:
- Local inference using Ollama (no API calls)
- Trading domain-specific classification
- Batch processing for efficiency
- Comprehensive fallback rules
- Result caching for performance
"""

import json
import hashlib
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

# Import the AST extractor
from .ast_parameter_extractor import ExtractedParameter

try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("⚠️ Ollama not available - falling back to rule-based classification")

@dataclass
class ClassificationResult:
    """Result of parameter classification"""
    parameter_name: str
    classification: str  # 'trading_filter', 'config', 'unknown'
    confidence: float
    reasoning: str
    method: str  # 'llm', 'rules', 'cache'

class LocalLLMClassifier:
    """
    🧠 Local LLM-powered parameter classifier

    Uses Ollama to run local LLM for intelligent parameter classification.
    Distinguishes between trading filters (show to user) and configuration
    (hide from user) with high accuracy.
    """

    def __init__(self, model_name: str = "llama3.1:8b"):
        self.model_name = model_name
        self.ollama_available = OLLAMA_AVAILABLE
        self.classification_cache = {}
        self.cache_file = Path("parameter_classification_cache.json")

        # Load existing cache
        self._load_cache()

        # Initialize LLM if available
        if self.ollama_available:
            self._ensure_model_available()
        else:
            print("🔧 Using rule-based classification (Ollama not available)")

    def _ensure_model_available(self):
        """Ensure the specified model is available in Ollama"""
        try:
            # Test if model is available
            response = ollama.generate(model=self.model_name, prompt="test", options={"num_predict": 1})
            print(f"✅ LLM model {self.model_name} ready for classification")
        except Exception as e:
            print(f"⚠️ LLM model {self.model_name} not available: {e}")
            print("📥 Attempting to pull model...")
            try:
                ollama.pull(self.model_name)
                print(f"✅ Successfully pulled {self.model_name}")
            except Exception as pull_error:
                print(f"❌ Failed to pull model: {pull_error}")
                self.ollama_available = False

    def classify_parameters(self, parameters: List[ExtractedParameter], disable_cache: bool = False) -> List[ClassificationResult]:
        """
        🎯 Main classification method - classify all parameters

        Args:
            parameters: List of extracted parameters from AST analysis
            disable_cache: If True, forces fresh analysis without using cached results

        Returns:
            List of classification results with confidence scores
        """
        print(f"🧠 Classifying {len(parameters)} parameters...")
        if disable_cache:
            print("🎯 PURE ANALYSIS MODE: Cache disabled for fresh uploaded code analysis")

        results = []
        cache_hits = 0
        llm_calls = 0
        rule_based = 0

        for param in parameters:
            start_time = time.time()

            # Check cache first (unless disabled for fresh analysis)
            classification = None
            if not disable_cache:
                classification = self._get_cached_classification(param)
                if classification:
                    results.append(classification)
                    cache_hits += 1
                    continue

            # Use LLM if available, otherwise rules
            if self.ollama_available:
                classification = self._classify_with_llm(param)
                llm_calls += 1
            else:
                classification = self._classify_with_rules(param)
                rule_based += 1

            # Cache the result (unless caching is disabled)
            if not disable_cache:
                self._cache_classification(param, classification)
            results.append(classification)

            duration = time.time() - start_time
            print(f"   🎯 {param.name}: {classification.classification} ({duration:.3f}s, {classification.method})")

        print(f"📊 Classification complete:")
        print(f"   💾 Cache hits: {cache_hits}")
        print(f"   🤖 LLM calls: {llm_calls}")
        print(f"   📏 Rule-based: {rule_based}")

        return results

    def _classify_with_llm(self, param: ExtractedParameter) -> ClassificationResult:
        """Classify parameter using local LLM"""
        try:
            prompt = self._build_classification_prompt(param)

            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    "temperature": 0.1,  # Low temperature for consistent results
                    "num_predict": 150,  # Limit response length
                    "top_p": 0.9
                }
            )

            result_text = response['response'].strip()
            return self._parse_llm_response(param, result_text)

        except Exception as e:
            print(f"⚠️ LLM classification failed for {param.name}: {e}")
            return self._classify_with_rules(param)

    def _build_classification_prompt(self, param: ExtractedParameter) -> str:
        """Build classification prompt for LLM"""
        return f"""You are an expert in trading algorithm analysis. Classify this parameter from a Python trading scanner.

Parameter Details:
- Name: {param.name}
- Value: {param.value}
- Context: {param.context}
- Extraction Type: {param.extraction_type}

Classification Options:
1. "trading_filter" - A threshold or condition that filters trading opportunities
   Examples: gap thresholds, ATR multipliers, volume filters, price conditions, EMA distances

2. "config" - Technical configuration or infrastructure setting
   Examples: API keys, calculation windows, date ranges, worker counts, timeouts

Trading filters typically involve:
- Market data (prices, volumes, gaps, ATR, EMAs)
- Percentage changes or ratios
- Comparison thresholds (>=, <=, >, <)
- Risk or performance metrics

Configuration typically involves:
- API credentials and URLs
- Calculation parameters (rolling windows, spans)
- System settings (timeouts, workers)
- Date ranges and calendars

Respond with ONLY:
classification: [trading_filter|config]
confidence: [0.0-1.0]
reasoning: [brief explanation]

Example:
classification: trading_filter
confidence: 0.95
reasoning: ATR-based gap threshold for filtering trading opportunities"""

    def _parse_llm_response(self, param: ExtractedParameter, response_text: str) -> ClassificationResult:
        """Parse LLM response into classification result"""
        try:
            # Extract classification, confidence, and reasoning
            classification = "unknown"
            confidence = 0.5
            reasoning = "Failed to parse LLM response"

            lines = response_text.lower().split('\n')
            for line in lines:
                if 'classification:' in line:
                    if 'trading_filter' in line:
                        classification = 'trading_filter'
                    elif 'config' in line:
                        classification = 'config'

                elif 'confidence:' in line:
                    try:
                        confidence = float(line.split(':')[1].strip())
                    except:
                        pass

                elif 'reasoning:' in line:
                    reasoning = line.split(':', 1)[1].strip()

            return ClassificationResult(
                parameter_name=param.name,
                classification=classification,
                confidence=confidence,
                reasoning=reasoning,
                method='llm'
            )

        except Exception as e:
            print(f"⚠️ Failed to parse LLM response: {e}")
            return self._classify_with_rules(param)

    def _classify_with_rules(self, param: ExtractedParameter) -> ClassificationResult:
        """Enhanced rule-based classification for SC DMR-style scanners"""

        # Enhanced trading filter indicators - focus on actual scan criteria
        TRADING_KEYWORDS = [
            # Core technical indicators
            'atr', 'gap', 'ema', 'sma', 'vwap', 'rsi', 'macd', 'bb', 'stoch',
            'vol', 'rvol', 'price', 'high', 'low', 'close', 'open',
            'pct', 'percent', 'change', 'dist', 'range', 'threshold', 'mult',
            'slope', 'momentum', 'parabolic', 'filter', 'min', 'max',
            # SC DMR specific scan criteria
            'scoring', 'score', 'condition', 'criteria', 'level', 'trigger',
            'strength', 'signal', 'alert', 'breakout', 'support', 'resistance',
            'daily', 'intraday', 'timeframe', 'period', 'window', 'span',
            'market_cap', 'float', 'shares', 'dollar_volume', 'liquidity',
            # Scanner-specific terms
            'scan', 'screen', 'setup', 'entry', 'exit', 'target', 'stop'
        ]

        # Configuration indicators
        CONFIG_KEYWORDS = [
            'api', 'key', 'url', 'date', 'worker', 'timeout',
            'calendar', 'base_url', 'start_date', 'end_date', 'max_workers'
        ]

        # REJECTION PATTERNS - Variables that should NOT be parameters
        REJECTION_KEYWORDS = [
            # Loop variables and counters
            'i', 'j', 'k', 'index', 'idx', 'count', 'counter', 'iter',
            # Data processing variables
            'df', 'data', 'result', 'results', 'temp', 'tmp', 'var',
            'row', 'col', 'item', 'element', 'list', 'dict', 'array',
            # Function names and methods
            'function', 'method', 'func', 'call', 'return', 'yield',
            # System/internal variables
            'sys', 'os', 'path', 'file', 'dir', 'class', 'self'
        ]

        # Enhanced patterns for trading parameters
        TRADING_PATTERNS = [
            r'.*_atr\d*$',      # ATR-based metrics (atr, atr1, etc.)
            r'.*_mult\d*$',     # Multipliers
            r'.*_threshold$',   # Thresholds
            r'.*_min$',         # Minimums
            r'.*_max$',         # Maximums
            r'.*_pct$',         # Percentages
            r'.*_percent$',     # Percentages
            r'dist_.*',         # Distance metrics
            r'gap_.*',          # Gap metrics
            r'high_.*',         # High-based metrics
            r'low_.*',          # Low-based metrics
            r'.*_condition$',   # Condition parameters (key for SC DMR!)
            r'.*_criteria$',    # Criteria parameters
            r'.*_score$',       # Score parameters
            r'.*_level$',       # Level parameters
        ]

        # Rejection patterns - aggressively filter out internal variables
        REJECTION_PATTERNS = [
            r'^[ijkl]$',        # Single letter loop variables
            r'.*\d+$',          # Variables ending in numbers (often temp)
            r'temp.*',          # Temporary variables
            r'tmp.*',           # Temporary variables
            r'^df\d*$',         # DataFrame variables
            r'^data\d*$',       # Data variables
            r'.*_df$',          # DataFrame suffixes
            r'.*_data$',        # Data suffixes
        ]

        name_lower = param.name.lower()
        confidence = 0.7  # Base confidence for rule-based

        # FIRST: Check rejection patterns - aggressively filter out internal variables
        import re

        # Check if this should be rejected outright
        is_rejected = any(keyword in name_lower for keyword in REJECTION_KEYWORDS)
        is_rejected = is_rejected or any(re.match(pattern, name_lower) for pattern in REJECTION_PATTERNS)

        if is_rejected:
            return ClassificationResult(
                parameter_name=param.name,
                classification='internal_variable',
                confidence=0.9,
                reasoning=f"Rejected as internal variable: matches rejection patterns",
                method='rules_rejection'
            )

        # Check for trading keywords
        trading_score = sum(1 for keyword in TRADING_KEYWORDS if keyword in name_lower)
        config_score = sum(1 for keyword in CONFIG_KEYWORDS if keyword in name_lower)

        # Check trading patterns - boost score for strong matches
        pattern_match = any(re.match(pattern, name_lower) for pattern in TRADING_PATTERNS)
        if pattern_match:
            trading_score += 3  # Increased from 2 to be more aggressive

        # Special boost for SC DMR-style parameters
        if any(keyword in name_lower for keyword in ['condition', 'score', 'criteria', 'level']):
            trading_score += 2
            confidence = 0.9  # High confidence for these patterns

        # Check extraction type context
        if hasattr(param, 'extraction_type') and param.extraction_type == 'comparison':
            trading_score += 1  # Comparisons are likely trading filters
            confidence = 0.8

        # Enhanced value type checking
        if isinstance(param.value, (int, float)):
            if 0.1 <= param.value <= 100:  # Typical trading threshold range
                trading_score += 1
            elif isinstance(param.value, float) and 0.001 <= param.value <= 10:  # Precision thresholds
                trading_score += 1

        # Check for min/max dictionaries (classic trading parameters)
        if isinstance(param.value, dict):
            if 'min' in param.value and 'max' in param.value:
                trading_score += 3  # Strong indicator of trading filter
                confidence = 0.95

        # Check for array/list of numeric values (scoring arrays, thresholds)
        if isinstance(param.value, (list, tuple)):
            if all(isinstance(x, (int, float)) for x in param.value):
                trading_score += 2
                confidence = 0.85

        # String values that look like API keys or URLs
        if isinstance(param.value, str):
            if len(param.value) > 20 or 'http' in param.value or 'api' in param.value.lower():
                config_score += 2

        # Make enhanced classification decision
        if trading_score > config_score and trading_score > 0:
            classification = 'trading_filter'
            reasoning = f"Strong trading parameter indicators (score: {trading_score} vs {config_score})"
            # Boost confidence for high scores
            if trading_score >= 3:
                confidence = min(0.95, confidence + 0.1)
        elif config_score > trading_score:
            classification = 'config'
            reasoning = f"Configuration parameter detected (score: {config_score} vs {trading_score})"
        elif trading_score == 0 and config_score == 0:
            classification = 'internal_variable'
            reasoning = f"No trading or config indicators - likely internal variable"
            confidence = 0.8
        else:
            classification = 'unknown'
            reasoning = f"Ambiguous classification (trading: {trading_score}, config: {config_score})"
            confidence = 0.5

        return ClassificationResult(
            parameter_name=param.name,
            classification=classification,
            confidence=confidence,
            reasoning=reasoning,
            method='rules'
        )

    def _get_cached_classification(self, param: ExtractedParameter) -> Optional[ClassificationResult]:
        """Check if parameter classification is cached"""
        cache_key = self._get_cache_key(param)
        if cache_key in self.classification_cache:
            cached = self.classification_cache[cache_key]
            return ClassificationResult(
                parameter_name=param.name,
                classification=cached['classification'],
                confidence=cached['confidence'],
                reasoning=cached['reasoning'],
                method='cache'
            )
        return None

    def _cache_classification(self, param: ExtractedParameter, result: ClassificationResult):
        """Cache classification result"""
        cache_key = self._get_cache_key(param)
        self.classification_cache[cache_key] = {
            'classification': result.classification,
            'confidence': result.confidence,
            'reasoning': result.reasoning,
            'timestamp': time.time()
        }

        # Save cache periodically
        if len(self.classification_cache) % 10 == 0:
            self._save_cache()

    def _get_cache_key(self, param: ExtractedParameter) -> str:
        """Generate cache key for parameter"""
        # Create hash based on name, value, and context
        cache_data = f"{param.name}_{param.value}_{param.extraction_type}"
        return hashlib.md5(cache_data.encode()).hexdigest()

    def _load_cache(self):
        """Load classification cache from disk"""
        try:
            if self.cache_file.exists():
                with open(self.cache_file, 'r') as f:
                    self.classification_cache = json.load(f)
                print(f"📥 Loaded {len(self.classification_cache)} cached classifications")
        except Exception as e:
            print(f"⚠️ Failed to load cache: {e}")
            self.classification_cache = {}

    def _save_cache(self):
        """Save classification cache to disk"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.classification_cache, f, indent=2)
        except Exception as e:
            print(f"⚠️ Failed to save cache: {e}")

    def get_trading_filters(self, results: List[ClassificationResult]) -> List[ClassificationResult]:
        """Filter results to trading filters only"""
        return [r for r in results if r.classification == 'trading_filter']

    def get_config_parameters(self, results: List[ClassificationResult]) -> List[ClassificationResult]:
        """Filter results to configuration parameters only"""
        return [r for r in results if r.classification == 'config']

    def get_classification_summary(self, results: List[ClassificationResult]) -> Dict[str, any]:
        """Get summary of classification results"""
        total = len(results)
        trading_filters = len(self.get_trading_filters(results))
        config_params = len(self.get_config_parameters(results))
        unknown = total - trading_filters - config_params

        avg_confidence = sum(r.confidence for r in results) / total if total > 0 else 0

        methods = {}
        for result in results:
            methods[result.method] = methods.get(result.method, 0) + 1

        return {
            'total_parameters': total,
            'trading_filters': trading_filters,
            'config_parameters': config_params,
            'unknown': unknown,
            'average_confidence': avg_confidence,
            'methods_used': methods
        }

# Test function for development
if __name__ == "__main__":
    print("🧠 Local LLM Classifier - Test Mode")

    # Create test parameters
    from .ast_parameter_extractor import ExtractedParameter

    test_params = [
        ExtractedParameter("atr_mult", 4.0, "if atr_mult >= 4:", 10, "comparison", 0.9),
        ExtractedParameter("gap_atr", 0.3, "df['gap_atr'] >= 0.3", 15, "comparison", 0.95),
        ExtractedParameter("API_KEY", "sk-123456789", "API_KEY = 'sk-123456789'", 5, "assignment", 0.8),
        ExtractedParameter("rolling_window", 14, ".rolling(window=14)", 20, "method_arg", 0.7),
        ExtractedParameter("dist_h_9ema_atr", 2.0, "dist_h_9ema_atr >= 2.0", 25, "comparison", 0.95),
    ]

    classifier = LocalLLMClassifier()
    results = classifier.classify_parameters(test_params)

    print(f"\n📊 Classification Results:")
    for result in results:
        print(f"   🎯 {result.parameter_name}: {result.classification} ({result.confidence:.2f}, {result.method})")
        print(f"      Reasoning: {result.reasoning}")

    print(f"\n📈 Summary:")
    summary = classifier.get_classification_summary(results)
    for key, value in summary.items():
        print(f"   {key}: {value}")

    # Save cache
    classifier._save_cache()
    print("💾 Cache saved")