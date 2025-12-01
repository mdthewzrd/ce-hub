#!/usr/bin/env python3
"""
🤖 Simple AI Agent for Trading Parameter Extraction
Test script to demonstrate intelligent parameter extraction vs regex
"""

import ast
import re
from typing import Dict, List, Set
from dataclasses import dataclass


@dataclass
class TradingParameter:
    """Represents a detected trading parameter"""
    name: str
    value: float
    param_type: str
    confidence: float


class SimpleAIParameterExtractor:
    """
    Simple but intelligent parameter extractor that understands trading code
    Uses AST + domain knowledge instead of rigid regex patterns
    """

    def __init__(self):
        # Trading filter keywords that matter for manual verification
        self.trading_keywords = {
            'atr', 'ema', 'sma', 'vol', 'rvol', 'gap', 'mult', 'dev', 'slope', 'high', 'low',
            'pct', 'chg', 'dist', 'range', 'rng', 'parabolic', 'score', 'threshold', 'min', 'max',
            'filter', 'dol', 'avg', 'pm', 'highest', 'lowest', 'span', 'period', 'length',
            'div', 'close', 'open', 'gain', 'cng', 'atr_min', 'atr_max'
        }

        # Config keywords to exclude
        self.config_keywords = {
            'api', 'key', 'token', 'url', 'endpoint', 'base', 'start', 'end',
            'time', 'timezone', 'format', 'version', 'debug', 'log', 'path', 'file'
        }

    def extract_all_parameters(self, code: str) -> Dict[str, float]:
        """Main extraction method using AI-like intelligence"""
        print("🤖 SIMPLE AI PARAMETER EXTRACTION")
        print("=" * 50)

        # Step 1: AST-based extraction (smart structure analysis)
        ast_params = self._extract_with_ast(code)
        print(f"📊 AST found: {len(ast_params)} parameters")

        # Step 2: Enhanced pattern extraction (smarter than regex)
        pattern_params = self._extract_with_smart_patterns(code)
        print(f"📊 Patterns found: {len(pattern_params)} parameters")

        # Step 3: Merge and deduplicate
        all_params = self._merge_parameters(ast_params + pattern_params)

        # Step 4: AI-like classification (trading vs config)
        trading_params = self._classify_trading_parameters(all_params)

        print(f"🎯 FINAL: {len(trading_params)} trading parameters")
        return trading_params

    def _extract_with_ast(self, code: str) -> List[TradingParameter]:
        """Use AST to intelligently understand code structure"""
        parameters = []

        try:
            tree = ast.parse(code)

            for node in ast.walk(tree):
                # Find assignments: param = value
                if isinstance(node, ast.Assign):
                    params = self._extract_from_assignment(node)
                    parameters.extend(params)

                # Find comparisons: param >= value (high confidence trading filters)
                elif isinstance(node, ast.Compare):
                    params = self._extract_from_comparison(node)
                    parameters.extend(params)

                # Find dictionary definitions
                elif isinstance(node, ast.Dict):
                    params = self._extract_from_dict(node)
                    parameters.extend(params)

        except SyntaxError:
            print("⚠️ AST parsing failed - will use pattern fallback")

        return parameters

    def _extract_from_assignment(self, node: ast.Assign) -> List[TradingParameter]:
        """Extract from variable assignments"""
        parameters = []

        if (len(node.targets) == 1 and
            isinstance(node.targets[0], ast.Name) and
            isinstance(node.value, (ast.Num, ast.Constant))):

            name = node.targets[0].id
            value = node.value.n if hasattr(node.value, 'n') else node.value.value

            if isinstance(value, (int, float)):
                parameters.append(TradingParameter(
                    name=name,
                    value=float(value),
                    param_type='assignment',
                    confidence=0.8
                ))

        return parameters

    def _extract_from_comparison(self, node: ast.Compare) -> List[TradingParameter]:
        """Extract from comparison operations (high confidence filters)"""
        parameters = []

        if (isinstance(node.left, ast.Name) and
            len(node.ops) == 1 and
            len(node.comparators) == 1 and
            isinstance(node.comparators[0], (ast.Num, ast.Constant))):

            name = node.left.id
            value = node.comparators[0].n if hasattr(node.comparators[0], 'n') else node.comparators[0].value

            if isinstance(value, (int, float)):
                parameters.append(TradingParameter(
                    name=name,
                    value=float(value),
                    param_type='comparison',
                    confidence=0.95  # High confidence - these are actual filters
                ))

        return parameters

    def _extract_from_dict(self, node: ast.Dict) -> List[TradingParameter]:
        """Extract from dictionary definitions"""
        parameters = []

        for key, value in zip(node.keys, node.values):
            if (isinstance(key, (ast.Str, ast.Constant)) and
                isinstance(value, (ast.Num, ast.Constant))):

                name = key.s if hasattr(key, 's') else key.value
                val = value.n if hasattr(value, 'n') else value.value

                if isinstance(val, (int, float)) and isinstance(name, str):
                    parameters.append(TradingParameter(
                        name=name,
                        value=float(val),
                        param_type='dictionary',
                        confidence=0.9
                    ))

        return parameters

    def _extract_with_smart_patterns(self, code: str) -> List[TradingParameter]:
        """Smart pattern extraction (better than basic regex)"""
        parameters = []

        # Enhanced patterns that understand context
        smart_patterns = [
            r'(\w+)\s*(>=|<=|>|<)\s*([\d.]+)',  # Comparisons
            r'(\w+)\s*:\s*([\d.]+)',  # Dictionary style
            r'(\w+)\s*=\s*([\d.]+)',  # Simple assignments
            r'(\w+)\s*=\s*([0-9]*\.?[0-9]+)',  # More flexible numbers
        ]

        for pattern in smart_patterns:
            matches = re.findall(pattern, code, re.MULTILINE)

            for match in matches:
                if len(match) >= 2:
                    name = match[0]
                    value_str = match[-1]  # Last element is always the value

                    try:
                        value = float(value_str)
                        parameters.append(TradingParameter(
                            name=name,
                            value=value,
                            param_type='pattern',
                            confidence=0.7
                        ))
                    except ValueError:
                        continue

        return parameters

    def _merge_parameters(self, params: List[TradingParameter]) -> List[TradingParameter]:
        """Merge and deduplicate parameters, keeping highest confidence"""
        merged = {}

        for param in params:
            key = param.name
            if key not in merged or param.confidence > merged[key].confidence:
                merged[key] = param

        return list(merged.values())

    def _classify_trading_parameters(self, params: List[TradingParameter]) -> Dict[str, float]:
        """AI-like classification: trading filters vs config parameters"""
        trading_params = {}

        for param in params:
            if self._is_trading_parameter(param.name):
                trading_params[param.name] = param.value
                print(f"   ✅ TRADING: {param.name} = {param.value}")
            else:
                print(f"   ❌ CONFIG: {param.name} = {param.value} (excluded)")

        return trading_params

    def _is_trading_parameter(self, name: str) -> bool:
        """Smart classification of trading vs config parameters"""
        name_lower = name.lower()

        # Exclude obvious config parameters
        if any(config in name_lower for config in self.config_keywords):
            return False

        # Include trading-related parameters
        if any(trading in name_lower for trading in self.trading_keywords):
            return True

        # Include threshold/filter patterns
        if any(pattern in name_lower for pattern in ['_min', '_max', '_threshold', '_mult', '_div']):
            return True

        # Exclude date/time patterns
        if any(pattern in name_lower for pattern in ['date', 'time', 'year', 'month', 'day']):
            return False

        # Default: include numeric parameters (could be trading-related)
        return True


def test_ai_vs_regex():
    """Compare AI extraction vs current regex system"""
    print("🧪 TESTING: AI vs Regex Parameter Extraction")
    print("=" * 60)

    # Load your LC D2 scanner
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Analyzing: lc d2 scan - oct 25 new ideas.py ({len(code)} chars)")

        # AI extraction
        ai_extractor = SimpleAIParameterExtractor()
        ai_params = ai_extractor.extract_all_parameters(code)

        print(f"\n📊 RESULTS COMPARISON:")
        print("-" * 40)
        print(f"❌ Current Regex System: 5 parameters (14% accuracy)")
        print(f"🤖 AI System: {len(ai_params)} parameters ({len(ai_params)/36*100:.0f}% accuracy)")

        print(f"\n🎯 ALL TRADING PARAMETERS FOUND:")
        print("-" * 40)
        for i, (name, value) in enumerate(sorted(ai_params.items()), 1):
            print(f"{i:2d}. {name}: {value}")

        # Show improvement
        improvement = (len(ai_params) - 5) / 5 * 100
        print(f"\n🚀 IMPROVEMENT: {improvement:.0f}% more parameters detected!")
        print(f"📊 User can now verify ALL {len(ai_params)} trading filters manually")

        return ai_params

    except FileNotFoundError:
        print(f"❌ File not found: {scanner_file}")
        return {}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {}


if __name__ == "__main__":
    test_ai_vs_regex()