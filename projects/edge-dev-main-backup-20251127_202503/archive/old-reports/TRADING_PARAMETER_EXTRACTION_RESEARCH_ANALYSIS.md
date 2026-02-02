# Intelligent Trading Scanner Parameter Extraction Research Analysis

## Executive Summary

**Problem**: Current regex system only extracts 5 out of 36+ trading filter parameters from uploaded scanner code
**Solution**: AI-powered parameter extraction agent that intelligently identifies trading filters vs. configuration
**Priority**: Replace rigid regex with intelligent classification for complete parameter capture

## Current System Analysis

### Parameter Integrity System Issues
- **Limited Pattern Recognition**: Only finds basic patterns like `atr_mult >= 4`
- **Missing Complex Filters**: Cannot extract conditional logic like price-based thresholds
- **No Context Understanding**: Treats all numeric values equally regardless of trading purpose
- **Template Dependency**: Assumes specific parameter dictionary structures

### LC D2 Scanner Parameter Profile (36+ Parameters Found)
```python
# Trading Filters (What Users Need to See)
dist_h_9ema_atr >= 2.0      # EMA distance filters
gap_atr >= 0.3              # Gap size filters
high_pct_chg >= 0.5         # Percentage change filters
close_range >= 0.6          # Close range filters
high_chg_atr >= 1.5         # ATR expansion filters
v_ua >= 10000000           # Volume filters
dol_v >= 500000000         # Dollar volume filters
c_ua >= 5                  # Price filters

# Technical Configuration (Less Important)
rolling_window_14 = 14     # Calculation windows
ema_span_9 = 9            # EMA periods
API_KEY = "..."           # Infrastructure
```

## AI Architecture Options Research

### Option 1: Local LLM with AST Analysis (RECOMMENDED)
**Hybrid Approach**: Combine Python AST parsing with local LLM classification

**Advantages**:
- **Privacy**: No external API calls, all processing local
- **Speed**: AST parsing is instant, LLM classification is fast
- **Accuracy**: AST provides structure, LLM provides context understanding
- **Cost**: No per-request costs, one-time model deployment

**Implementation**:
```python
# 1. AST Analysis extracts all numeric assignments and comparisons
# 2. Local LLM classifies each parameter as trading filter vs config
# 3. Format results for frontend display
```

### Option 2: OpenAI/Claude API Integration
**Advantages**: Powerful understanding, easy integration
**Disadvantages**: Cost per request, privacy concerns, internet dependency

### Option 3: Rule-Based Classification Engine
**Advantages**: Fast, predictable, no AI dependency
**Disadvantages**: Brittle, requires constant rule updates for new scanner types

## Trading Filter Classification Strategy

### Core Classification Logic

#### 1. Trading Filters (High Priority - Show to User)
```python
TRADING_FILTER_INDICATORS = {
    'threshold_comparisons': ['>=', '<=', '>', '<'],
    'trading_metrics': [
        'atr', 'gap', 'ema', 'dist_h', 'high_chg', 'close_range',
        'pct_chg', 'vol', 'dol_v', 'rvol', 'slope', 'price', 'high_pct'
    ],
    'condition_patterns': [
        'df[.*] >=',      # DataFrame conditions
        '\\(.*>=.*\\)',   # Parenthetical conditions
        '&.*>=',          # Chained conditions
    ]
}
```

#### 2. Technical Configuration (Low Priority - Filter Out)
```python
CONFIG_INDICATORS = {
    'api_settings': ['API_KEY', 'BASE_URL', 'DATE'],
    'calculation_windows': ['rolling_window', 'ema_span'],
    'infrastructure': ['MAX_WORKERS', 'timeout', 'calendar'],
    'date_constants': ['START_DATE', 'END_DATE']
}
```

#### 3. Context-Aware Classification
```python
def classify_parameter(param_name, param_value, context_lines):
    """
    Intelligent classification using:
    1. Parameter name analysis
    2. Value range analysis (trading thresholds vs config values)
    3. Context analysis (surrounding code patterns)
    4. LLM classification for ambiguous cases
    """
```

## Implementation Architecture

### Phase 1: AST-Based Structure Extraction
```python
class TradingParameterExtractor:
    def extract_structure(self, code: str):
        # Parse Python AST
        # Find all assignments and comparisons
        # Extract numeric thresholds from conditions
        # Map parameters to their usage contexts
```

### Phase 2: Local LLM Classification
```python
class ParameterClassifier:
    def __init__(self):
        # Load local model (Llama 3.1 8B or similar)
        # Pre-trained on trading domain knowledge

    def classify_parameters(self, parameters: List[Parameter]):
        # Classify each parameter as:
        # - Trading Filter (show to user)
        # - Technical Config (hide from user)
        # - Ambiguous (ask LLM)
```

### Phase 3: Smart Result Formatting
```python
class ResultFormatter:
    def format_for_frontend(self, classified_params):
        # Prioritize trading filters
        # Group by filter type (gap, volume, price, etc.)
        # Format as {parameter_name: numeric_value}
        # Include confidence scores
```

## Performance Optimization Strategy

### Local LLM Deployment Options
1. **Ollama Integration**: Easy local deployment, good performance
2. **LM Studio**: User-friendly interface, OpenAI-compatible API
3. **Direct Model Loading**: Fastest inference, higher memory usage

### Caching and Efficiency
- **Parameter Pattern Cache**: Remember similar scanner patterns
- **LLM Result Cache**: Cache classification results for common patterns
- **Incremental Processing**: Only re-analyze changed code sections

### Fallback Strategies
1. **Primary**: AST + Local LLM classification
2. **Fallback 1**: Enhanced regex patterns with trading context
3. **Fallback 2**: Conservative extraction (show all found parameters)

## Expected Results

### Current System (Regex Only)
- **Parameters Found**: 5/36 (14%)
- **Accuracy**: High for found parameters
- **Coverage**: Very low, missing complex filters

### Proposed AI System
- **Parameters Found**: 34+/36 (95%+)
- **Accuracy**: High with confidence scoring
- **Coverage**: Comprehensive including complex conditional logic

### User Experience Improvement
- **Before**: User sees 5 basic parameters, must manually verify 31 missing
- **After**: User sees all 36 parameters with trading context, can quickly validate

## Implementation Timeline

### Week 1: AST Foundation
- Implement AST-based parameter extraction
- Create parameter classification rules
- Test on LC D2 and A+ scanner samples

### Week 2: Local LLM Integration
- Deploy local LLM for classification
- Implement hybrid AST+LLM pipeline
- Performance optimization and caching

### Week 3: Production Integration
- Replace existing regex system
- Add confidence scoring and fallback logic
- User testing and refinement

## Risk Mitigation

### Technical Risks
- **Local LLM Performance**: Test multiple models, implement fallbacks
- **Memory Usage**: Optimize model loading, implement model swapping
- **Classification Accuracy**: Extensive testing with diverse scanner types

### Business Risks
- **User Adoption**: Gradual rollout with opt-in testing
- **Parameter Verification**: Include confidence scores for user validation
- **Backward Compatibility**: Maintain existing regex as fallback option

This research analysis provides the foundation for implementing an intelligent trading parameter extraction agent that will dramatically improve the user experience by finding all relevant trading parameters instead of just 14% of them.