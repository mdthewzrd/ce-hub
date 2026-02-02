# 🧠 Parameter Translation Engine
# AI-Agent Core: Natural Language → Trading Scan Parameters
# Foundation component for conversational scan building

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import pandas as pd
import numpy as np

# ═══════════════════════════════════════════════════════════════════════════════
# 🎯 CORE DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ParameterModification:
    """Result of translating natural language request to parameter changes"""
    changes: Dict[str, Any]
    confidence: float
    explanation: str
    requires_approval: bool
    estimated_impact: Dict[str, str]
    warnings: List[str]
    suggestions: List[str]

@dataclass
class ConversationContext:
    """Context for maintaining conversation state"""
    user_request: str
    current_parameters: Dict[str, Any]
    session_history: List[Dict[str, str]]
    market_conditions: str = 'neutral'
    user_experience: str = 'intermediate'
    risk_tolerance: str = 'moderate'

class IntentType(Enum):
    """Types of user intents for parameter modification"""
    INCREASE_AGGRESSIVENESS = "increase_aggressiveness"
    DECREASE_AGGRESSIVENESS = "decrease_aggressiveness"
    FOCUS_SECTOR = "focus_sector"
    ADJUST_RISK = "adjust_risk"
    MODIFY_TIMEFRAME = "modify_timeframe"
    IMPROVE_QUALITY = "improve_quality"
    INCREASE_SIGNALS = "increase_signals"
    DECREASE_SIGNALS = "decrease_signals"
    TARGET_MARKET_CAP = "target_market_cap"
    ADJUST_VOLUME = "adjust_volume"
    MODIFY_MOMENTUM = "modify_momentum"
    UNKNOWN = "unknown"

# ═══════════════════════════════════════════════════════════════════════════════
# 🧠 CORE TRANSLATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class ParameterTranslationEngine:
    """
    🎯 Core AI-Agent component that converts natural language into parameter changes

    Capabilities:
    - Intent classification from natural language
    - Entity extraction (sectors, market caps, risk levels)
    - Parameter mapping to specific modifications
    - Impact prediction and explanation generation
    - Human approval requirement assessment
    """

    def __init__(self):
        self.intent_patterns = self._build_intent_patterns()
        self.entity_patterns = self._build_entity_patterns()
        self.parameter_bounds = self._build_parameter_bounds()
        self.impact_models = self._build_impact_models()

    def translate_request(self, context: ConversationContext) -> ParameterModification:
        """
        Main translation function: Natural Language → Parameter Changes
        """
        user_request = context.user_request.lower()
        current_params = context.current_parameters

        # Step 1: Classify intent
        intent = self._classify_intent(user_request)

        # Step 2: Extract entities
        entities = self._extract_entities(user_request)

        # Step 3: Map to parameter modifications
        modifications = self._map_intent_to_parameters(
            intent, entities, current_params, context
        )

        # Step 4: Validate and bound check
        validated_modifications = self._validate_modifications(
            modifications, current_params
        )

        # Step 5: Calculate confidence
        confidence = self._calculate_confidence(intent, entities, modifications)

        # Step 6: Generate explanation
        explanation = self._generate_explanation(validated_modifications, intent)

        # Step 7: Predict impact
        impact = self._predict_impact(validated_modifications, current_params)

        # Step 8: Generate warnings and suggestions
        warnings = self._generate_warnings(validated_modifications, current_params)
        suggestions = self._generate_suggestions(validated_modifications, context)

        # Step 9: Determine approval requirement
        requires_approval = self._requires_human_approval(
            validated_modifications, confidence, warnings
        )

        return ParameterModification(
            changes=validated_modifications,
            confidence=confidence,
            explanation=explanation,
            requires_approval=requires_approval,
            estimated_impact=impact,
            warnings=warnings,
            suggestions=suggestions
        )

    def _classify_intent(self, user_request: str) -> IntentType:
        """Classify user intent from natural language request"""

        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, user_request, re.IGNORECASE):
                    return intent

        return IntentType.UNKNOWN

    def _extract_entities(self, user_request: str) -> Dict[str, Any]:
        """Extract specific entities (sectors, market caps, etc.) from request"""

        entities = {}

        for entity_type, patterns in self.entity_patterns.items():
            for pattern_key, pattern in patterns.items():
                match = re.search(pattern, user_request, re.IGNORECASE)
                if match:
                    entities[entity_type] = pattern_key
                    break

        return entities

    def _map_intent_to_parameters(
        self,
        intent: IntentType,
        entities: Dict[str, Any],
        current_params: Dict[str, Any],
        context: ConversationContext
    ) -> Dict[str, Any]:
        """Map classified intent to specific parameter changes"""

        modifications = {}

        if intent == IntentType.INCREASE_AGGRESSIVENESS:
            modifications.update({
                'momentum_triggers.atr_multiple': max(0.5, current_params.get('momentum_triggers', {}).get('atr_multiple', 1.0) - 0.3),
                'momentum_triggers.volume_multiple': max(1.0, current_params.get('momentum_triggers', {}).get('volume_multiple', 1.5) - 0.5),
                'signal_scoring.signal_strength_min': max(0.3, current_params.get('signal_scoring', {}).get('signal_strength_min', 0.6) - 0.1),
                'market_filters.volume_min_usd': max(5_000_000, current_params.get('market_filters', {}).get('volume_min_usd', 30_000_000) * 0.5)
            })

        elif intent == IntentType.DECREASE_AGGRESSIVENESS:
            modifications.update({
                'momentum_triggers.atr_multiple': min(5.0, current_params.get('momentum_triggers', {}).get('atr_multiple', 1.0) + 0.5),
                'momentum_triggers.volume_multiple': min(10.0, current_params.get('momentum_triggers', {}).get('volume_multiple', 1.5) + 1.0),
                'signal_scoring.signal_strength_min': min(0.9, current_params.get('signal_scoring', {}).get('signal_strength_min', 0.6) + 0.15),
                'market_filters.volume_min_usd': min(100_000_000, current_params.get('market_filters', {}).get('volume_min_usd', 30_000_000) * 2.0)
            })

        elif intent == IntentType.DECREASE_SIGNALS:
            modifications.update({
                'signal_scoring.signal_strength_min': min(0.9, current_params.get('signal_scoring', {}).get('signal_strength_min', 0.6) + 0.1),
                'momentum_triggers.atr_multiple': min(5.0, current_params.get('momentum_triggers', {}).get('atr_multiple', 1.0) + 0.3),
                'momentum_triggers.volume_multiple': min(10.0, current_params.get('momentum_triggers', {}).get('volume_multiple', 1.5) + 0.5),
                'entry_criteria.max_results_per_day': min(20, max(10, current_params.get('entry_criteria', {}).get('max_results_per_day', 50) - 20))
            })

        elif intent == IntentType.INCREASE_SIGNALS:
            modifications.update({
                'signal_scoring.signal_strength_min': max(0.3, current_params.get('signal_scoring', {}).get('signal_strength_min', 0.6) - 0.1),
                'momentum_triggers.atr_multiple': max(0.5, current_params.get('momentum_triggers', {}).get('atr_multiple', 1.0) - 0.2),
                'entry_criteria.max_results_per_day': min(100, current_params.get('entry_criteria', {}).get('max_results_per_day', 50) + 25)
            })

        elif intent == IntentType.TARGET_MARKET_CAP and 'market_cap' in entities:
            market_cap = entities['market_cap']
            if market_cap == 'small':
                modifications.update({
                    'market_filters.price_min': 5.0,
                    'market_filters.price_max': 25.0,
                    'market_filters.volume_min_usd': 10_000_000
                })
            elif market_cap == 'mid':
                modifications.update({
                    'market_filters.price_min': 25.0,
                    'market_filters.price_max': 100.0,
                    'market_filters.volume_min_usd': 50_000_000
                })
            elif market_cap == 'large':
                modifications.update({
                    'market_filters.price_min': 50.0,
                    'market_filters.price_max': 1000.0,
                    'market_filters.volume_min_usd': 100_000_000
                })

        elif intent == IntentType.ADJUST_RISK and 'risk_level' in entities:
            risk_level = entities['risk_level']
            if risk_level == 'conservative':
                modifications.update({
                    'signal_scoring.signal_strength_min': 0.75,
                    'momentum_triggers.volume_multiple': 2.5,
                    'entry_criteria.close_range_min': 0.8,
                    'market_filters.volume_min_usd': 50_000_000
                })
            elif risk_level == 'aggressive':
                modifications.update({
                    'signal_scoring.signal_strength_min': 0.5,
                    'momentum_triggers.volume_multiple': 1.2,
                    'entry_criteria.close_range_min': 0.6,
                    'market_filters.volume_min_usd': 15_000_000
                })

        return modifications

    def _validate_modifications(
        self,
        modifications: Dict[str, Any],
        current_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate and apply bounds to parameter modifications"""

        validated = {}

        for param_path, value in modifications.items():
            if param_path in self.parameter_bounds:
                bounds = self.parameter_bounds[param_path]
                validated[param_path] = max(bounds['min'], min(bounds['max'], value))
            else:
                validated[param_path] = value

        return validated

    def _calculate_confidence(
        self,
        intent: IntentType,
        entities: Dict[str, Any],
        modifications: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for the translation"""

        base_confidence = 0.7

        # Boost confidence for recognized intents
        if intent != IntentType.UNKNOWN:
            base_confidence += 0.2

        # Boost confidence for extracted entities
        if entities:
            base_confidence += 0.1

        # Reduce confidence for many simultaneous changes
        if len(modifications) > 5:
            base_confidence -= 0.1

        return min(1.0, max(0.1, base_confidence))

    def _generate_explanation(
        self,
        modifications: Dict[str, Any],
        intent: IntentType
    ) -> str:
        """Generate human-readable explanation of parameter changes"""

        explanations = []

        intent_explanations = {
            IntentType.INCREASE_AGGRESSIVENESS: "Making scan more aggressive to find more opportunities",
            IntentType.DECREASE_AGGRESSIVENESS: "Making scan more conservative for higher quality signals",
            IntentType.DECREASE_SIGNALS: "Reducing signal count by tightening criteria",
            IntentType.INCREASE_SIGNALS: "Increasing signal count by loosening filters",
            IntentType.TARGET_MARKET_CAP: "Adjusting filters for targeted market cap range",
            IntentType.ADJUST_RISK: "Modifying risk profile based on preference"
        }

        if intent in intent_explanations:
            explanations.append(intent_explanations[intent])

        for param_path, value in modifications.items():
            param_name = param_path.split('.')[-1]
            explanations.append(f"• {param_name}: → {value}")

        return "\\n".join(explanations)

    def _predict_impact(
        self,
        modifications: Dict[str, Any],
        current_params: Dict[str, Any]
    ) -> Dict[str, str]:
        """Predict the impact of parameter changes"""

        impact = {
            'signal_count_change': 'No significant change expected',
            'quality_impact': 'Quality should remain similar',
            'performance_prediction': 'Performance impact unclear'
        }

        # Analyze signal count impact
        signal_affecting_params = [
            'signal_scoring.signal_strength_min',
            'momentum_triggers.atr_multiple',
            'momentum_triggers.volume_multiple',
            'market_filters.volume_min_usd'
        ]

        significant_changes = sum(1 for param in signal_affecting_params if param in modifications)

        if significant_changes >= 2:
            # Check if changes are restrictive or permissive
            restrictive_count = 0
            permissive_count = 0

            for param in signal_affecting_params:
                if param in modifications:
                    current_value = self._get_nested_param(current_params, param, 1.0)
                    new_value = modifications[param]

                    if param == 'signal_scoring.signal_strength_min' and new_value > current_value:
                        restrictive_count += 1
                    elif param in ['momentum_triggers.atr_multiple', 'momentum_triggers.volume_multiple'] and new_value > current_value:
                        restrictive_count += 1
                    elif param == 'market_filters.volume_min_usd' and new_value > current_value:
                        restrictive_count += 1
                    else:
                        permissive_count += 1

            if restrictive_count > permissive_count:
                impact['signal_count_change'] = f"~{20 + (restrictive_count * 10)}% fewer signals"
                impact['quality_impact'] = "Higher quality signals expected"
            elif permissive_count > restrictive_count:
                impact['signal_count_change'] = f"~{15 + (permissive_count * 10)}% more signals"
                impact['quality_impact'] = "Quality may decrease slightly"

        return impact

    def _generate_warnings(
        self,
        modifications: Dict[str, Any],
        current_params: Dict[str, Any]
    ) -> List[str]:
        """Generate warnings for potentially problematic parameter combinations"""

        warnings = []

        # Check for extreme values
        if 'signal_scoring.signal_strength_min' in modifications:
            value = modifications['signal_scoring.signal_strength_min']
            if value < 0.3:
                warnings.append("Very low signal strength threshold may produce noisy results")
            elif value > 0.85:
                warnings.append("Very high signal strength threshold may produce too few signals")

        # Check for very loose volume requirements
        if 'market_filters.volume_min_usd' in modifications:
            value = modifications['market_filters.volume_min_usd']
            if value < 10_000_000:
                warnings.append("Low volume requirement may result in illiquid positions")

        # Check for contradictory changes
        if ('momentum_triggers.atr_multiple' in modifications and
            modifications['momentum_triggers.atr_multiple'] > 3.0 and
            'signal_scoring.signal_strength_min' in modifications and
            modifications['signal_scoring.signal_strength_min'] > 0.8):
            warnings.append("High ATR requirement + high signal threshold may produce very few signals")

        return warnings

    def _generate_suggestions(
        self,
        modifications: Dict[str, Any],
        context: ConversationContext
    ) -> List[str]:
        """Generate helpful suggestions for the user"""

        suggestions = []

        # Suggest backtesting
        if len(modifications) >= 3:
            suggestions.append("Consider running a backtest to validate these changes")

        # Suggest complementary changes
        if 'signal_scoring.signal_strength_min' in modifications:
            if modifications['signal_scoring.signal_strength_min'] > 0.75:
                suggestions.append("You might also want to reduce volume requirements to maintain signal count")

        # Suggest monitoring
        suggestions.append("Monitor scan results for the first few days after applying changes")

        return suggestions

    def _requires_human_approval(
        self,
        modifications: Dict[str, Any],
        confidence: float,
        warnings: List[str]
    ) -> bool:
        """Determine if human approval is required for these changes"""

        # Always require approval for low confidence
        if confidence < 0.6:
            return True

        # Require approval if there are warnings
        if warnings:
            return True

        # Require approval for many simultaneous changes
        if len(modifications) > 4:
            return True

        # Require approval for extreme parameter values
        extreme_params = [
            ('signal_scoring.signal_strength_min', 0.3, 0.85),
            ('momentum_triggers.atr_multiple', 0.5, 4.0),
            ('market_filters.volume_min_usd', 5_000_000, 80_000_000)
        ]

        for param, min_val, max_val in extreme_params:
            if param in modifications:
                value = modifications[param]
                if value <= min_val or value >= max_val:
                    return True

        return False

    def _get_nested_param(self, params: Dict[str, Any], path: str, default: Any) -> Any:
        """Get nested parameter value using dot notation"""
        keys = path.split('.')
        value = params

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    def _build_intent_patterns(self) -> Dict[IntentType, List[str]]:
        """Build regex patterns for intent classification"""
        return {
            IntentType.INCREASE_AGGRESSIVENESS: [
                r'more aggressive', r'find more', r'less strict', r'lower threshold',
                r'more opportunities', r'cast wider net', r'less conservative'
            ],
            IntentType.DECREASE_AGGRESSIVENESS: [
                r'more conservative', r'less aggressive', r'higher quality', r'stricter',
                r'more selective', r'better signals', r'higher threshold'
            ],
            IntentType.DECREASE_SIGNALS: [
                r'too many signals', r'fewer signals', r'reduce signals', r'less signals',
                r'more selective', r'tighten', r'quality over quantity'
            ],
            IntentType.INCREASE_SIGNALS: [
                r'more signals', r'find more', r'increase signals', r'more opportunities',
                r'cast wider', r'loosen'
            ],
            IntentType.TARGET_MARKET_CAP: [
                r'small.?cap', r'large.?cap', r'mid.?cap', r'penny stock', r'blue chip'
            ],
            IntentType.ADJUST_RISK: [
                r'conservative', r'aggressive', r'risky', r'safe', r'risk'
            ],
            IntentType.FOCUS_SECTOR: [
                r'tech', r'energy', r'healthcare', r'finance', r'sector'
            ]
        }

    def _build_entity_patterns(self) -> Dict[str, Dict[str, str]]:
        """Build regex patterns for entity extraction"""
        return {
            'market_cap': {
                'small': r'small.?cap|penny|micro.?cap',
                'mid': r'mid.?cap|medium',
                'large': r'large.?cap|blue.?chip|mega.?cap'
            },
            'risk_level': {
                'conservative': r'conservative|safe|low.?risk',
                'aggressive': r'aggressive|risky|high.?risk'
            },
            'sector': {
                'tech': r'tech|technology|software',
                'energy': r'energy|oil|gas',
                'healthcare': r'healthcare|pharma|biotech',
                'finance': r'finance|banking|fintech'
            }
        }

    def _build_parameter_bounds(self) -> Dict[str, Dict[str, float]]:
        """Define safe bounds for all parameters"""
        return {
            'signal_scoring.signal_strength_min': {'min': 0.2, 'max': 0.95},
            'momentum_triggers.atr_multiple': {'min': 0.3, 'max': 5.0},
            'momentum_triggers.volume_multiple': {'min': 1.0, 'max': 10.0},
            'momentum_triggers.gap_threshold_atr': {'min': 0.1, 'max': 3.0},
            'market_filters.price_min': {'min': 1.0, 'max': 100.0},
            'market_filters.price_max': {'min': 10.0, 'max': 2000.0},
            'market_filters.volume_min_usd': {'min': 1_000_000, 'max': 200_000_000},
            'entry_criteria.max_results_per_day': {'min': 5, 'max': 200},
            'entry_criteria.close_range_min': {'min': 0.5, 'max': 0.95}
        }

    def _build_impact_models(self) -> Dict[str, Any]:
        """Build models for predicting parameter change impacts"""
        # Placeholder for more sophisticated impact modeling
        return {
            'signal_count_model': 'placeholder',
            'quality_model': 'placeholder',
            'performance_model': 'placeholder'
        }

# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 TESTING AND VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

def test_parameter_translation():
    """Test the parameter translation engine with sample requests"""

    engine = ParameterTranslationEngine()

    # Sample current parameters (from Master Unified Template)
    current_params = {
        'market_filters': {
            'price_min': 8.0,
            'price_max': 1000.0,
            'volume_min_usd': 30_000_000,
        },
        'momentum_triggers': {
            'atr_multiple': 1.0,
            'volume_multiple': 1.5,
            'gap_threshold_atr': 0.75,
            'ema_distance_9': 1.5,
            'ema_distance_20': 2.0,
        },
        'signal_scoring': {
            'signal_strength_min': 0.6,
            'target_multiplier': 1.08,
        },
        'entry_criteria': {
            'max_results_per_day': 50,
            'close_range_min': 0.7,
        }
    }

    # Test cases
    test_cases = [
        "This scan is finding too many signals, make it more selective",
        "I want to focus on small cap stocks",
        "Make this more aggressive to find more opportunities",
        "This seems too risky, make it more conservative",
        "I'm getting good results but want a few more signals"
    ]

    print("🧪 Testing Parameter Translation Engine")
    print("=" * 60)

    for i, request in enumerate(test_cases, 1):
        print(f"\\n🎯 Test Case {i}: '{request}'")

        context = ConversationContext(
            user_request=request,
            current_parameters=current_params,
            session_history=[],
            user_experience='intermediate'
        )

        result = engine.translate_request(context)

        print(f"   Intent Confidence: {result.confidence:.2f}")
        print(f"   Requires Approval: {result.requires_approval}")
        print(f"   Changes Proposed: {len(result.changes)}")
        print(f"   Explanation: {result.explanation}")

        if result.warnings:
            print(f"   ⚠️  Warnings: {'; '.join(result.warnings)}")

        print(f"   📊 Impact: {result.estimated_impact.get('signal_count_change', 'Unknown')}")

if __name__ == "__main__":
    test_parameter_translation()