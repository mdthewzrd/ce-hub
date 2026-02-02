# Intelligent Trading Parameter Extraction Agent - Implementation Plan

## Overview

Replace the current regex-based parameter extraction system with an AI-powered agent that uses AST analysis + local LLM classification to find ALL trading filter parameters (36+ instead of current 5).

## Architecture Design

### Core Components

```python
# 1. AST Structure Extractor
class ASTParameterExtractor:
    """Extract all numeric assignments and comparisons from Python code"""

# 2. Trading Context Classifier
class TradingParameterClassifier:
    """Use local LLM to classify parameters as trading filters vs config"""

# 3. Smart Result Formatter
class ParameterResultFormatter:
    """Format results for frontend consumption with confidence scoring"""

# 4. Integration Manager
class IntelligentParameterExtractor:
    """Main orchestrator replacing current regex system"""
```

## Implementation Steps

### Phase 1: AST Foundation (Week 1)

#### 1.1 Create AST Parameter Extractor

```python
# File: backend/core/ast_parameter_extractor.py

import ast
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass

@dataclass
class ExtractedParameter:
    name: str
    value: Any
    context: str  # surrounding code for classification
    line_number: int
    extraction_type: str  # 'assignment', 'comparison', 'dict_value'

class ASTParameterExtractor:
    def __init__(self):
        self.parameters = []

    def extract_parameters(self, code: str) -> List[ExtractedParameter]:
        """Extract all potential parameters using AST analysis"""
        try:
            tree = ast.parse(code)
            self.parameters = []
            self.visit(tree)
            return self.parameters
        except SyntaxError:
            return []

    def visit_Assign(self, node):
        """Handle variable assignments: atr_mult = 4"""
        # Extract assignments to variables that look like trading parameters

    def visit_Compare(self, node):
        """Handle comparisons: df['gap_atr'] >= 0.3"""
        # Extract threshold values from comparison operations

    def visit_Dict(self, node):
        """Handle dictionary definitions: {'atr_mult': 4}"""
        # Extract parameters from parameter dictionaries

    def visit_Call(self, node):
        """Handle function calls: rolling(window=14)"""
        # Extract parameters from method calls
```

#### 1.2 Test AST Extractor

```python
# File: backend/tests/test_ast_extractor.py

def test_lc_d2_scanner_extraction():
    """Test AST extraction on actual LC D2 scanner"""
    with open('/path/to/lc_d2_scanner.py', 'r') as f:
        code = f.read()

    extractor = ASTParameterExtractor()
    params = extractor.extract_parameters(code)

    # Should find 36+ parameters instead of 5
    assert len(params) >= 30

    # Should find specific trading filters
    param_names = [p.name for p in params]
    assert 'dist_h_9ema_atr' in param_names
    assert 'gap_atr' in param_names
    assert 'high_pct_chg' in param_names
```

#### 1.3 Enhance Current System

```python
# File: backend/core/parameter_integrity_system.py

# Replace extract_original_signature method with AST-based extraction
def extract_original_signature(self, original_code: str) -> ParameterSignature:
    """Enhanced extraction using AST + existing regex as fallback"""

    # Try AST extraction first
    ast_extractor = ASTParameterExtractor()
    ast_params = ast_extractor.extract_parameters(original_code)

    if len(ast_params) > 5:  # AST found more parameters than regex
        params = self._convert_ast_to_dict(ast_params)
        print(f"🎯 AST extraction found {len(params)} parameters")
    else:
        # Fallback to existing regex system
        params = self._legacy_regex_extraction(original_code)
        print(f"⚠️ Fallback to regex, found {len(params)} parameters")
```

### Phase 2: Local LLM Integration (Week 2)

#### 2.1 Local LLM Setup

```python
# File: backend/core/local_llm_classifier.py

import ollama
from typing import List, Dict
import json

class LocalLLMClassifier:
    def __init__(self, model_name="llama3.1:8b"):
        self.model_name = model_name
        self._ensure_model_available()

    def _ensure_model_available(self):
        """Ensure Ollama model is downloaded and ready"""
        try:
            ollama.pull(self.model_name)
        except Exception as e:
            print(f"Warning: Could not load {self.model_name}: {e}")
            self.model_name = None  # Disable LLM classification

    def classify_parameters(self, parameters: List[ExtractedParameter]) -> Dict[str, str]:
        """Classify parameters as 'trading_filter' or 'config'"""
        if not self.model_name:
            return self._fallback_classification(parameters)

        classifications = {}
        for param in parameters:
            classification = self._classify_single_parameter(param)
            classifications[param.name] = classification

        return classifications

    def _classify_single_parameter(self, param: ExtractedParameter) -> str:
        """Use LLM to classify a single parameter"""
        prompt = f"""
        Analyze this Python trading scanner parameter:

        Parameter: {param.name} = {param.value}
        Context: {param.context}

        Classify as either:
        - "trading_filter": A threshold/condition that filters trading opportunities
        - "config": Technical configuration (API keys, windows, dates, etc.)

        Trading filters typically involve market data like prices, volumes, gaps, ATR,
        EMAs, percentage changes, etc. Config parameters are infrastructure settings.

        Respond with only: "trading_filter" or "config"
        """

        try:
            response = ollama.generate(model=self.model_name, prompt=prompt)
            result = response['response'].strip().lower()

            if "trading_filter" in result:
                return "trading_filter"
            elif "config" in result:
                return "config"
            else:
                return "unknown"
        except Exception:
            return self._fallback_classification([param])[param.name]

    def _fallback_classification(self, parameters: List[ExtractedParameter]) -> Dict[str, str]:
        """Rule-based fallback when LLM unavailable"""
        TRADING_KEYWORDS = ['atr', 'gap', 'ema', 'vol', 'price', 'high', 'low', 'close', 'pct']
        CONFIG_KEYWORDS = ['api', 'key', 'url', 'date', 'window', 'span', 'worker']

        classifications = {}
        for param in parameters:
            name_lower = param.name.lower()

            if any(keyword in name_lower for keyword in TRADING_KEYWORDS):
                classifications[param.name] = "trading_filter"
            elif any(keyword in name_lower for keyword in CONFIG_KEYWORDS):
                classifications[param.name] = "config"
            else:
                classifications[param.name] = "unknown"

        return classifications
```

#### 2.2 Integration with Main System

```python
# File: backend/core/intelligent_parameter_extractor.py

class IntelligentParameterExtractor:
    def __init__(self):
        self.ast_extractor = ASTParameterExtractor()
        self.llm_classifier = LocalLLMClassifier()
        self.result_formatter = ParameterResultFormatter()

    def extract_parameters(self, code: str) -> Dict[str, Any]:
        """Main extraction pipeline"""

        # Step 1: Extract all parameters using AST
        extracted_params = self.ast_extractor.extract_parameters(code)
        print(f"🔍 AST found {len(extracted_params)} potential parameters")

        # Step 2: Classify parameters using LLM
        classifications = self.llm_classifier.classify_parameters(extracted_params)

        # Step 3: Filter to trading parameters only
        trading_params = [
            param for param in extracted_params
            if classifications.get(param.name) == "trading_filter"
        ]
        print(f"🎯 Classified {len(trading_params)} as trading filters")

        # Step 4: Format for frontend
        return self.result_formatter.format_results(trading_params, classifications)
```

#### 2.3 Result Formatting

```python
# File: backend/core/parameter_result_formatter.py

class ParameterResultFormatter:
    def format_results(self, trading_params: List[ExtractedParameter],
                      classifications: Dict[str, str]) -> Dict[str, Any]:
        """Format results in expected frontend format"""

        # Convert to {parameter_name: numeric_value} format
        formatted_params = {}
        confidence_scores = {}

        for param in trading_params:
            formatted_params[param.name] = param.value
            confidence_scores[param.name] = self._calculate_confidence(param, classifications)

        return {
            'parameters': formatted_params,
            'confidence_scores': confidence_scores,
            'extraction_method': 'ast_llm',
            'total_found': len(formatted_params),
            'trading_filters': len(trading_params),
            'config_params': sum(1 for c in classifications.values() if c == 'config')
        }

    def _calculate_confidence(self, param: ExtractedParameter, classifications: Dict[str, str]) -> float:
        """Calculate confidence score for parameter classification"""
        base_confidence = 0.9 if classifications.get(param.name) == "trading_filter" else 0.7

        # Adjust based on parameter characteristics
        if param.extraction_type == 'comparison':
            base_confidence += 0.05  # Comparisons are more likely to be filters

        return min(base_confidence, 1.0)
```

### Phase 3: Production Integration (Week 3)

#### 3.1 Replace Current System

```python
# File: backend/core/parameter_integrity_system.py

# Update the main extraction method
def extract_original_signature(self, original_code: str) -> ParameterSignature:
    """🎯 ENHANCED: Use intelligent extraction instead of regex"""

    print("🤖 INTELLIGENT parameter extraction starting...")

    # Use new intelligent extractor
    intelligent_extractor = IntelligentParameterExtractor()
    extraction_result = intelligent_extractor.extract_parameters(original_code)

    params = extraction_result['parameters']
    extraction_method = extraction_result['extraction_method']

    print(f"✅ INTELLIGENT extraction complete:")
    print(f"   📊 Method: {extraction_method}")
    print(f"   🎯 Trading filters found: {extraction_result['trading_filters']}")
    print(f"   ⚙️ Config params found: {extraction_result['config_params']}")
    print(f"   📈 Total parameters: {extraction_result['total_found']}")

    # Continue with existing signature creation logic...
    scanner_type = self._detect_scanner_type(original_code)
    scanner_name = self._extract_scanner_name(original_code)
    param_hash = self._create_parameter_hash(params)

    return ParameterSignature(
        scanner_type=scanner_type,
        parameter_values=params,
        parameter_hash=param_hash,
        scanner_name=scanner_name
    )
```

#### 3.2 Add Performance Monitoring

```python
# File: backend/core/extraction_metrics.py

class ExtractionMetrics:
    def __init__(self):
        self.extraction_times = []
        self.parameter_counts = []
        self.classification_accuracy = []

    def log_extraction(self, duration: float, param_count: int, method: str):
        """Log extraction performance metrics"""
        self.extraction_times.append(duration)
        self.parameter_counts.append(param_count)

        print(f"📊 Extraction metrics: {duration:.2f}s, {param_count} params, {method}")

    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary for monitoring"""
        if not self.extraction_times:
            return {}

        return {
            'avg_extraction_time': sum(self.extraction_times) / len(self.extraction_times),
            'avg_parameters_found': sum(self.parameter_counts) / len(self.parameter_counts),
            'total_extractions': len(self.extraction_times),
            'max_extraction_time': max(self.extraction_times)
        }
```

#### 3.3 Error Handling and Fallbacks

```python
# File: backend/core/intelligent_parameter_extractor.py

class IntelligentParameterExtractor:
    def extract_parameters(self, code: str) -> Dict[str, Any]:
        """Main extraction with comprehensive error handling"""

        try:
            # Primary: AST + LLM
            return self._extract_with_ast_llm(code)

        except Exception as e:
            print(f"⚠️ AST+LLM extraction failed: {e}")

            try:
                # Fallback 1: AST only with rule-based classification
                return self._extract_with_ast_rules(code)

            except Exception as e2:
                print(f"⚠️ AST extraction failed: {e2}")

                # Fallback 2: Enhanced regex (existing system)
                return self._extract_with_enhanced_regex(code)

    def _extract_with_ast_llm(self, code: str) -> Dict[str, Any]:
        """Primary extraction method"""
        # Implementation from Phase 2.2

    def _extract_with_ast_rules(self, code: str) -> Dict[str, Any]:
        """Fallback: AST + rule-based classification"""
        # Use AST extraction but skip LLM classification

    def _extract_with_enhanced_regex(self, code: str) -> Dict[str, Any]:
        """Final fallback: Enhanced regex patterns"""
        # Use existing regex system but with better patterns
```

## Performance Optimization Strategy

### Local LLM Optimization

#### 1. Model Selection and Caching
```python
class OptimizedLLMClassifier:
    def __init__(self):
        self.model_cache = {}  # Cache loaded models
        self.classification_cache = {}  # Cache classification results

    def classify_with_caching(self, param: ExtractedParameter) -> str:
        """Use caching to avoid repeated classifications"""
        cache_key = f"{param.name}_{param.value}_{hash(param.context)}"

        if cache_key in self.classification_cache:
            return self.classification_cache[cache_key]

        result = self._classify_single_parameter(param)
        self.classification_cache[cache_key] = result
        return result
```

#### 2. Batch Processing
```python
def classify_parameters_batch(self, parameters: List[ExtractedParameter]) -> Dict[str, str]:
    """Classify multiple parameters in a single LLM call"""
    if len(parameters) <= 3:
        # Use batch processing for efficiency
        return self._batch_classify(parameters)
    else:
        # Process individually for accuracy
        return {p.name: self._classify_single_parameter(p) for p in parameters}
```

#### 3. Performance Targets
- **AST Extraction**: < 100ms for typical scanner files
- **LLM Classification**: < 2 seconds for 30+ parameters
- **Total Extraction**: < 3 seconds end-to-end
- **Memory Usage**: < 2GB additional for local LLM

## Testing Strategy

### Unit Tests
```python
# File: backend/tests/test_intelligent_extractor.py

def test_lc_d2_scanner_complete_extraction():
    """Test complete extraction on LC D2 scanner"""
    extractor = IntelligentParameterExtractor()

    with open('sample_lc_d2_scanner.py', 'r') as f:
        code = f.read()

    result = extractor.extract_parameters(code)

    # Should find significantly more parameters than regex (5)
    assert result['total_found'] >= 30
    assert result['trading_filters'] >= 25

    # Should find specific known parameters
    params = result['parameters']
    assert 'dist_h_9ema_atr' in params
    assert 'gap_atr' in params
    assert 'high_pct_chg' in params
    assert 'close_range' in params

def test_a_plus_scanner_extraction():
    """Test extraction on A+ scanner"""
    # Similar test for A+ scanner type

def test_fallback_scenarios():
    """Test fallback behavior when LLM unavailable"""
    # Test with LLM disabled
    # Should still extract more parameters than current regex
```

### Integration Tests
```python
def test_full_pipeline_integration():
    """Test integration with existing parameter integrity system"""
    integrity_system = ParameterIntegrityVerifier()

    # Test that new system integrates seamlessly
    result = integrity_system.extract_original_signature(sample_code)

    # Should have more parameters than before
    assert len(result.parameter_values) >= 30

    # Should maintain existing interface
    assert hasattr(result, 'scanner_type')
    assert hasattr(result, 'parameter_hash')
```

## Deployment Plan

### Phase 1: Parallel Testing (Week 1)
- Deploy alongside existing system
- Compare extraction results
- Log performance metrics
- A/B test with small user group

### Phase 2: Gradual Rollout (Week 2)
- Enable for 50% of scanner uploads
- Monitor for issues and performance
- Collect user feedback on parameter completeness

### Phase 3: Full Deployment (Week 3)
- Replace existing regex system entirely
- Monitor production performance
- Fine-tune based on real usage patterns

## Success Metrics

### Technical Metrics
- **Parameter Detection Rate**: 95%+ vs current 14%
- **Classification Accuracy**: 90%+ for trading filters
- **Performance**: < 3 seconds extraction time
- **Reliability**: < 1% fallback to regex required

### User Experience Metrics
- **Parameter Completeness**: Users see all relevant trading filters
- **Manual Verification Time**: Reduced from minutes to seconds
- **User Satisfaction**: Improved scanner upload experience
- **Error Reduction**: Fewer missed trading parameters in production

This implementation plan provides a comprehensive roadmap for replacing the current regex-based parameter extraction with an intelligent AI-powered system that will dramatically improve parameter detection from 14% to 95%+.