"""
Scanner Type Detector - Detect Scanner Pattern Type

This module:
1. Detects which scanner pattern type is being used
2. Identifies single-scan vs multi-scan structure
3. Extracts pattern-specific parameters
4. Maps to reference templates
"""

import re
import ast
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ScannerType(Enum):
    """Known scanner types"""
    BACKSIDE_B = "backside_b"
    A_PLUS = "a_plus"
    HALF_A_PLUS = "half_a_plus"
    LC_D2 = "lc_d2"
    LC_3D_GAP = "lc_3d_gap"
    D1_GAP = "d1_gap"
    EXTENDED_GAP = "extended_gap"
    SC_DMR = "sc_dmr"
    CUSTOM = "custom"


class StructureType(Enum):
    """Structure types"""
    SINGLE_SCAN = "single-scan"
    MULTI_SCAN = "multi-scan"
    UNKNOWN = "unknown"


@dataclass
class ScannerDetectionResult:
    """Scanner detection result"""
    scanner_type: ScannerType
    structure_type: StructureType
    confidence: float
    indicators: List[str]
    evidence: Dict[str, Any]
    suggested_template: Optional[str]


class ScannerTypeDetector:
    """
    Detect scanner type and structure from code

    Detection methods:
    - Parameter name patterns
    - Method name patterns
    - Column name patterns
    - Logic pattern keywords
    """

    def __init__(self):
        """Initialize scanner type detector"""
        # Pattern indicators for each scanner type
        self.type_indicators = {
            ScannerType.BACKSIDE_B: {
                'parameters': ['bb_upper', 'bb_lower', 'bb_width', 'squeeze'],
                'columns': ['BB_Upper', 'BB_Lower', 'BB_Width'],
                'methods': ['check_backside_b', 'detect_bollinger'],
                'keywords': ['bollinger', 'squeeze', 'volatility squeeze', 'bands'],
                'patterns': [r'bb_', r'bollinger', r'squeeze']
            },
            ScannerType.A_PLUS: {
                'parameters': ['accumulation', 'distribution', 'a_plus'],
                'columns': ['ADV20', 'Volume_Ratio'],
                'methods': ['check_a_plus', 'check_accumulation'],
                'keywords': ['accumulation', 'distribution', 'a plus', 'aplus'],
                'patterns': [r'acc', r'dist', r'a_plus']
            },
            ScannerType.HALF_A_PLUS: {
                'parameters': ['modified_acc', 'half_acc'],
                'columns': ['ADV20', 'Half_APlus'],
                'methods': ['check_half_a_plus'],
                'keywords': ['half a plus', 'half aplus', 'modified accumulation'],
                'patterns': [r'half.*aplus', r'modified.*acc']
            },
            ScannerType.LC_D2: {
                'parameters': ['lc_d2', 'low_close_d2', 'extended_lc'],
                'columns': ['LC_D2', 'Low_Close_D2'],
                'methods': ['check_lc_d2', 'check_low_close_d2'],
                'keywords': ['lc d2', 'low close', 'day 2', 'extended'],
                'patterns': [r'lc.*d2', r'low.*close.*d2', r'extended']
            },
            ScannerType.LC_3D_GAP: {
                'parameters': ['lc_3d', 'gap_3d', 'three_day'],
                'columns': ['LC_3D', 'Gap_3D'],
                'methods': ['check_lc_3d', 'check_3d_gap'],
                'keywords': ['lc 3d', '3 day gap', 'three day'],
                'patterns': [r'3d', r'three.*day']
            },
            ScannerType.D1_GAP: {
                'parameters': ['gap_percent', 'min_gap', 'max_gap'],
                'columns': ['Gap_Percent', 'Gap'],
                'methods': ['check_gap', 'check_d1_gap'],
                'keywords': ['gap up', 'gap down', 'd1 gap', 'opening gap'],
                'patterns': [r'gap.*up', r'gap.*down', r'd1.*gap']
            },
            ScannerType.EXTENDED_GAP: {
                'parameters': ['extended_gap', 'gap_follow_through'],
                'columns': ['Gap_Extended', 'Gap_Follow_Through'],
                'methods': ['check_extended_gap'],
                'keywords': ['extended gap', 'gap follow through', 'gap continuation'],
                'patterns': [r'extended.*gap', r'gap.*follow']
            },
            ScannerType.SC_DMR: {
                'parameters': ['dmr', 'mean_reversion', 'daily_mean'],
                'columns': ['DMR', 'Mean_Reversion'],
                'methods': ['check_dmr', 'check_mean_reversion'],
                'keywords': ['dmr', 'daily mean reversion', 'mean reversion'],
                'patterns': [r'dmr', r'mean.*reversion']
            }
        }

    def detect_from_code(self, code: str) -> ScannerDetectionResult:
        """
        Detect scanner type from code

        Args:
            code: Python code string

        Returns:
            ScannerDetectionResult
        """
        # Parse AST for method and parameter detection
        try:
            tree = ast.parse(code)
        except:
            return ScannerDetectionResult(
                scanner_type=ScannerType.CUSTOM,
                structure_type=StructureType.UNKNOWN,
                confidence=0.0,
                indicators=[],
                evidence={'error': 'Syntax error - cannot parse'},
                suggested_template=None
            )

        # Detect scanner type
        scanner_type, scanner_confidence, scanner_indicators = self._detect_scanner_type(code, tree)

        # Detect structure type
        structure_type = self._detect_structure_type(code, tree)

        # Collect evidence
        evidence = self._collect_evidence(code, tree, scanner_type)

        # Suggest template
        suggested_template = self._suggest_template(scanner_type, structure_type)

        return ScannerDetectionResult(
            scanner_type=scanner_type,
            structure_type=structure_type,
            confidence=scanner_confidence,
            indicators=scanner_indicators,
            evidence=evidence,
            suggested_template=suggested_template
        )

    def detect_from_description(self, description: str) -> ScannerDetectionResult:
        """
        Detect scanner type from natural language description

        Args:
            description: Scanner description

        Returns:
            ScannerDetectionResult
        """
        desc_lower = description.lower()

        # Check each scanner type's keywords
        type_scores = {}

        for scanner_type, indicators in self.type_indicators.items():
            score = 0
            matching_keywords = []

            # Check keywords
            for keyword in indicators['keywords']:
                if keyword in desc_lower:
                    score += 2
                    matching_keywords.append(keyword)

            # Check patterns
            for pattern in indicators['patterns']:
                if re.search(pattern, desc_lower):
                    score += 1
                    matching_keywords.append(f"pattern: {pattern}")

            if score > 0:
                type_scores[scanner_type] = {
                    'score': score,
                    'keywords': matching_keywords
                }

        # Determine type
        if type_scores:
            best_type = max(type_scores, key=lambda k: type_scores[k]['score'])
            best_score = type_scores[best_type]['score']
            confidence = min(best_score / 5.0, 1.0)  # Normalize to 0-1
        else:
            best_type = ScannerType.CUSTOM
            best_score = 0
            confidence = 0.0

        return ScannerDetectionResult(
            scanner_type=best_type,
            structure_type=StructureType.SINGLE_SCAN,  # Default assumption
            confidence=confidence,
            indicators=type_scores.get(best_type, {}).get('keywords', []),
            evidence={'description_keywords': type_scores},
            suggested_template=self._suggest_template(best_type, StructureType.SINGLE_SCAN)
        )

    def _detect_scanner_type(self, code: str, tree: ast.AST) -> Tuple[ScannerType, float, List[str]]:
        """Detect scanner type from code"""
        type_scores = {}

        for scanner_type, indicators in self.type_indicators.items():
            score = 0
            matching_indicators = []

            # Check parameters
            for param in indicators['parameters']:
                if f"'{param}'" in code or f'"{param}"' in code or f'{param}=' in code:
                    score += 3
                    matching_indicators.append(f"param: {param}")

            # Check columns
            for col in indicators['columns']:
                if f"'{col}'" in code or f'"{col}"' in code or f'{col}' in code:
                    score += 2
                    matching_indicators.append(f"column: {col}")

            # Check methods
            for method in indicators['methods']:
                if f'def {method}(' in code:
                    score += 4
                    matching_indicators.append(f"method: {method}")

            # Check keywords in comments and strings
            code_lower = code.lower()
            for keyword in indicators['keywords']:
                if keyword in code_lower:
                    score += 1
                    matching_indicators.append(f"keyword: {keyword}")

            # Check regex patterns
            for pattern in indicators['patterns']:
                if re.search(pattern, code_lower):
                    score += 2
                    matching_indicators.append(f"pattern: {pattern}")

            if score > 0:
                type_scores[scanner_type] = {
                    'score': score,
                    'indicators': matching_indicators
                }

        # Determine best match
        if type_scores:
            best_type = max(type_scores, key=lambda k: type_scores[k]['score'])
            best_score = type_scores[best_type]['score']
            indicators = type_scores[best_type]['indicators']

            # Normalize confidence (score of ~10+ is high confidence)
            confidence = min(best_score / 10.0, 1.0)
        else:
            best_type = ScannerType.CUSTOM
            best_score = 0
            indicators = []
            confidence = 0.0

        return best_type, confidence, indicators

    def _detect_structure_type(self, code: str, tree: ast.AST) -> StructureType:
        """Detect if single-scan or multi-scan structure"""
        # Check for multiple parameter sets
        multiple_params = bool(re.search(
            r'(backside_b|a_plus|lc_d2|half_a).*_params',
            code,
            re.IGNORECASE
        ))

        # Check for dictionary return with signals
        returns_signals = "return {" in code and "signals" in code.lower()

        # Check for multiple pattern detection methods
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        multiple_pattern_methods = False
        for cls in classes:
            methods = [node.name for node in cls.body if isinstance(node, ast.FunctionDef)]
            pattern_methods = [
                'check_backside_b', 'check_a_plus', 'check_lc_d2',
                'detect_backside_b', 'detect_a_plus', 'detect_lc_d2'
            ]
            count = sum(1 for pm in pattern_methods if pm in methods)
            if count >= 2:
                multiple_pattern_methods = True
                break

        if multiple_params or returns_signals or multiple_pattern_methods:
            return StructureType.MULTI_SCAN
        else:
            return StructureType.SINGLE_SCAN

    def _collect_evidence(self, code: str, tree: ast.AST, scanner_type: ScannerType) -> Dict[str, Any]:
        """Collect evidence for detection"""
        evidence = {
            'classes': [],
            'methods': [],
            'parameters': [],
            'imports': []
        }

        # Extract classes
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        evidence['classes'] = [cls.name for cls in classes]

        # Extract methods from first class
        if classes:
            main_class = classes[0]
            methods = [node.name for node in main_class.body if isinstance(node, ast.FunctionDef)]
            evidence['methods'] = methods

        # Extract parameters (look for __init__)
        for cls in classes:
            for node in cls.body:
                if isinstance(node, ast.FunctionDef) and node.name == '__init__':
                    params = [arg.arg for arg in node.args.args[1:]]  # Skip 'self'
                    evidence['parameters'] = params
                    break

        # Extract imports
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    evidence['imports'].append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ''
                for alias in node.names:
                    evidence['imports'].append(f"{module}.{alias.name}" if module else alias.name)

        return evidence

    def _suggest_template(self, scanner_type: ScannerType, structure_type: StructureType) -> Optional[str]:
        """Suggest reference template based on detection"""
        template_map = {
            ScannerType.BACKSIDE_B: 'backside_b',
            ScannerType.A_PLUS: 'a_plus_para',
            ScannerType.HALF_A_PLUS: 'a_plus_para',  # Use A Plus as base
            ScannerType.LC_D2: 'lc_d2',
            ScannerType.LC_3D_GAP: 'lc_3d_gap',
            ScannerType.D1_GAP: 'd1_gap',
            ScannerType.EXTENDED_GAP: 'extended_gap',
            ScannerType.SC_DMR: 'sc_dmr',
        }

        if scanner_type == ScannerType.CUSTOM:
            return None

        return template_map.get(scanner_type)

    def get_detection_report(self, result: ScannerDetectionResult) -> str:
        """Generate human-readable detection report"""
        lines = []
        lines.append("=" * 70)
        lines.append("SCANNER TYPE DETECTION REPORT")
        lines.append("=" * 70)

        lines.append(f"\n🔍 Detected Type: {result.scanner_type.value}")
        lines.append(f"📐 Structure Type: {result.structure_type.value}")
        lines.append(f"📊 Confidence: {result.confidence:.2%}")

        if result.indicators:
            lines.append(f"\n🧠 Indicators Found:")
            for indicator in result.indicators[:10]:
                lines.append(f"  • {indicator}")
            if len(result.indicators) > 10:
                lines.append(f"  ... and {len(result.indicators) - 10} more")

        if result.suggested_template:
            lines.append(f"\n📄 Suggested Template: {result.suggested_template}")

        if result.evidence:
            lines.append(f"\n📋 Evidence:")
            for key, value in result.evidence.items():
                if isinstance(value, list) and value:
                    lines.append(f"  {key}: {', '.join(str(v) for v in value[:5])}")
                    if len(value) > 5:
                        lines.append(f"    ... and {len(value) - 5} more")

        if result.confidence < 0.5:
            lines.append(f"\n⚠️  Low confidence - scanner type may be custom or unclear")
        elif result.confidence < 0.8:
            lines.append(f"\n⚠️  Medium confidence - some ambiguity detected")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the detector
if __name__ == "__main__":
    detector = ScannerTypeDetector()

    print("Testing ScannerTypeDetector...\n")

    # Test code
    test_code = """
class BacksideBScanner:
    def __init__(self, api_key, bb_width=2.0, squeeze_days=5):
        self.api_key = api_key
        self.bb_width = bb_width
        self.squeeze_days = squeeze_days

    def check_backside_b(self, df):
        '''Check for backside B pattern'''
        # Look for Bollinger Band squeeze
        df['BB_Upper'] = df['close'] + (df['BB_Width'] * self.bb_width)
        df['BB_Lower'] = df['close'] - (df['BB_Width'] * self.bb_width)
        return df
"""

    result = detector.detect_from_code(test_code)
    print(detector.get_detection_report(result))

    print("\n" + "=" * 70 + "\n")

    # Test from description
    test_description = "I want a scanner that looks for Bollinger Band squeeze patterns with volatility contraction"
    result2 = detector.detect_from_description(test_description)
    print("From Description:")
    print(detector.get_detection_report(result2))
