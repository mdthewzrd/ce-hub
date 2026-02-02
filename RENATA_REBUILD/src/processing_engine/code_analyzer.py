"""
Code Analyzer - Main Analysis Orchestrator

This module:
1. Coordinates all analysis components
2. Generates comprehensive code analysis reports
3. Identifies transformation requirements
4. Provides recommendations for standardization
"""

import re
from typing import Dict, List, Any, Optional
from pathlib import Path

# Import knowledge base components
import sys
sys.path.append(str(Path(__file__).parent.parent))

from knowledge_base.template_repository import TemplateRepository
from knowledge_base.standards_database import StandardsDatabase
from knowledge_base.pattern_library import PatternLibrary
from knowledge_base.validation_rules import ValidationRules

from input_handlers.code_input_handler import CodeInputHandler
from input_handlers.text_input_handler import TextInputHandler

from core_utils.code_parser import CodeParser
from core_utils.ast_analyzer import ASTAnalyzer
from core_utils.helpers import StringUtils


class CodeAnalysisResult:
    """Complete code analysis result"""

    def __init__(self):
        self.input_info: Dict[str, Any] = {}
        self.structure: Dict[str, Any] = {}
        self.standardizations: Dict[str, Any] = {}
        self.patterns: Dict[str, Any] = {}
        self.anti_patterns: List[Dict[str, Any]] = []
        self.validation: Dict[str, Any] = {}
        self.transformation_requirements: Dict[str, Any] = {}
        self.recommendations: List[str] = []


class CodeAnalyzer:
    """
    Main code analysis orchestrator

    Coordinates:
    - Template matching
    - Structure analysis
    - Standardization checking
    - Pattern extraction
    - Validation
    - Transformation requirements
    """

    def __init__(self, templates_dir: str):
        """
        Initialize code analyzer

        Args:
            templates_dir: Path to reference templates
        """
        self.templates_dir = templates_dir
        self.template_repo = TemplateRepository(templates_dir)
        self.standards_db = StandardsDatabase()
        self.pattern_lib = PatternLibrary(templates_dir)
        self.validator = ValidationRules()

        self.code_handler = CodeInputHandler()
        self.text_handler = TextInputHandler()
        self.parser = CodeParser()
        self.ast_analyzer = ASTAnalyzer()

    def analyze_code(self, code: str, filename: str = "scanner.py") -> CodeAnalysisResult:
        """
        Perform complete code analysis

        Args:
            code: Python code to analyze
            filename: Optional filename for reference

        Returns:
            CodeAnalysisResult with complete analysis
        """
        result = CodeAnalysisResult()

        # 1. Handle input
        code_input = self.code_handler.handle_input(code=code)
        result.input_info = {
            'filename': filename,
            'class_name': code_input.class_name,
            'structure_type': code_input.structure_type,
            'methods': list(code_input.methods.keys()),
            'parameters': code_input.parameters,
            'imports': code_input.imports
        }

        # 2. Parse code structure
        parsed = self.parser.parse(code)
        result.structure = {
            'classes': list(parsed.classes.keys()),
            'functions': list(parsed.functions.keys()),
            'complexity': self.parser.analyze_code_complexity(parsed)
        }

        # 3. Analyze AST
        ast_analysis = self.ast_analyzer.analyze(code)
        result.patterns = ast_analysis['patterns']
        result.anti_patterns = ast_analysis['anti_patterns']

        # 4. Check standardizations
        missing_standardizations = self.standards_db.get_missing_standardizations(code)
        result.standardizations = {
            'missing': missing_standardizations,
            'present_count': 7 - len(missing_standardizations),
            'missing_count': len(missing_standardizations)
        }

        # 5. Find matching template
        matching_template = self.template_repo.find_matching_template(code)
        result.input_info['matching_template'] = matching_template

        # 6. Find applicable patterns
        applicable = self.pattern_lib.find_applicable_patterns(code)
        result.patterns['applicable'] = {
            'missing': [p['type'] for p in applicable['missing']],
            'present': [p['type'] for p in applicable['present']]
        }

        # 7. Validate code
        validation = self.validator.validate_all(code, filename)
        result.validation = validation

        # 8. Determine transformation requirements
        result.transformation_requirements = self._determine_requirements(
            result, code_input
        )

        # 9. Generate recommendations
        result.recommendations = self._generate_recommendations(result)

        return result

    def analyze_text_description(self, description: str) -> CodeAnalysisResult:
        """
        Analyze natural language scanner description

        Args:
            description: Natural language description

        Returns:
            CodeAnalysisResult with requirements analysis
        """
        result = CodeAnalysisResult()

        # 1. Handle text input
        text_input = self.text_handler.handle_input(description)
        result.input_info = {
            'description': description,
            'scanner_type': text_input.scanner_type,
            'parameters': text_input.parameters,
            'indicators': text_input.indicators,
            'filters': text_input.filters,
            'confidence': text_input.confidence
        }

        # 2. Get specification
        spec = self.text_handler.generate_specification(text_input)
        result.structure = {'specification': spec}

        # 3. Find template based on type
        if text_input.scanner_type:
            # Try to find matching template
            template_map = {
                'backside_b': 'backside_b',
                'a_plus': 'a_plus_para',
                'd1_gap': 'd1_gap',
                'lc_d2': 'lc_d2',
                'lc_3d_gap': 'lc_3d_gap',
                'sc_dmr': 'sc_dmr'
            }
            template_name = template_map.get(text_input.scanner_type)
            if template_name:
                template = self.template_repo.get_template(template_name)
                if template:
                    result.input_info['matching_template'] = template_name

        # 4. Determine transformation requirements
        result.transformation_requirements = {
            'needs_full_generation': True,
            'structure_type': 'single-scan',  # Default assumption
            'required_standardizations': self.standards_db.mandatory_standardizations.keys(),
            'suggested_parameters': text_input.parameters or {}
        }

        # 5. Generate recommendations
        result.recommendations = self._generate_text_recommendations(text_input)

        return result

    def _determine_requirements(
        self,
        result: CodeAnalysisResult,
        code_input
    ) -> Dict[str, Any]:
        """Determine transformation requirements"""
        requirements = {
            'needs_standardization': len(result.standardizations['missing']) > 0,
            'needs_refactoring': len(result.anti_patterns) > 0,
            'structure_type': code_input.structure_type,
            'required_changes': []
        }

        # Check which standardizations are missing
        for std in result.standardizations['missing']:
            requirements['required_changes'].append(f"Add {std}")

        # Check for anti-patterns
        for ap in result.anti_patterns:
            requirements['required_changes'].append(
                f"Fix {ap['pattern']} ({ap['severity']} severity)"
            )

        # Determine structure requirements
        if code_input.structure_type == 'single-scan':
            requirements['required_changes'].append("Apply single-scan structure")
        else:
            requirements['required_changes'].append("Apply multi-scan structure")

        return requirements

    def _generate_recommendations(self, result: CodeAnalysisResult) -> List[str]:
        """Generate improvement recommendations"""
        recommendations = []

        # Standardization recommendations
        if result.standardizations['missing_count'] > 0:
            recommendations.append(
                f"Add {result.standardizations['missing_count']} missing EdgeDev standardizations"
            )

        # Anti-pattern recommendations
        high_severity = [ap for ap in result.anti_patterns if ap['severity'] == 'high']
        if high_severity:
            recommendations.append(
                f"Fix {len(high_severity)} high-severity anti-patterns"
            )

        # Pattern recommendations
        if 'applicable' in result.patterns:
            missing_patterns = result.patterns['applicable'].get('missing', [])
            if missing_patterns:
                recommendations.append(
                    f"Apply {len(missing_patterns)} missing patterns: {', '.join(missing_patterns[:3])}"
                )

        # Template recommendation
        if result.input_info.get('matching_template'):
            recommendations.append(
                f"Reference template: {result.input_info['matching_template']}"
            )

        return recommendations

    def _generate_text_recommendations(self, text_input) -> List[str]:
        """Generate recommendations for text input"""
        recommendations = []

        if text_input.confidence < 0.5:
            recommendations.append("Low confidence - consider providing more details")

        if not text_input.parameters:
            recommendations.append("Define scanner parameters (min_price, min_volume, etc.)")

        if not text_input.indicators:
            recommendations.append("Specify technical indicators to use (EMA, ATR, etc.)")

        if text_input.scanner_type:
            recommendations.append(
                f"Will generate {text_input.scanner_type} scanner with EdgeDev standardizations"
            )

        return recommendations

    def generate_analysis_report(self, result: CodeAnalysisResult) -> str:
        """
        Generate human-readable analysis report

        Args:
            result: CodeAnalysisResult

        Returns:
            Formatted report string
        """
        lines = []
        lines.append("=" * 70)
        lines.append("CODE ANALYSIS REPORT")
        lines.append("=" * 70)

        # Input Information
        lines.append("\n📋 INPUT INFORMATION:")
        for key, value in result.input_info.items():
            if isinstance(value, list):
                lines.append(f"  {key}: {len(value)} items")
            elif isinstance(value, dict):
                lines.append(f"  {key}: {len(value)} parameters")
            else:
                lines.append(f"  {key}: {value}")

        # Structure
        if result.structure:
            lines.append("\n🏗️  STRUCTURE:")
            if 'classes' in result.structure:
                lines.append(f"  Classes: {', '.join(result.structure['classes']) or 'N/A'}")
            if 'functions' in result.structure:
                lines.append(f"  Functions: {', '.join(result.structure['functions']) or 'N/A'}")
            if 'complexity' in result.structure:
                comp = result.structure['complexity']
                lines.append(f"  Lines of code: {comp.get('lines_of_code', 'N/A')}")

        # Standardizations
        lines.append(f"\n✅ STANDARDIZATIONS:")
        lines.append(f"  Present: {result.standardizations['present_count']}/7")
        lines.append(f"  Missing: {result.standardizations['missing_count']}/7")
        if result.standardizations['missing']:
            lines.append(f"  Missing standardizations:")
            for std in result.standardizations['missing']:
                lines.append(f"    - {std}")

        # Patterns
        if result.patterns:
            lines.append(f"\n🔍 PATTERNS:")
            if 'applicable' in result.patterns:
                applicable = result.patterns['applicable']
                if applicable['present']:
                    lines.append(f"  Present: {', '.join(applicable['present'])}")
                if applicable['missing']:
                    lines.append(f"  Missing: {', '.join(applicable['missing'])}")

        # Anti-Patterns
        if result.anti_patterns:
            lines.append(f"\n⚠️  ANTI-PATTERNS ({len(result.anti_patterns)}):")
            for ap in result.anti_patterns[:5]:  # First 5
                lines.append(f"  [{ap['severity'].upper()}] {ap['pattern']}")
                lines.append(f"    → {ap['suggestion']}")
            if len(result.anti_patterns) > 5:
                lines.append(f"  ... and {len(result.anti_patterns) - 5} more")

        # Validation
        if result.validation:
            lines.append(f"\n✔️  VALIDATION:")
            lines.append(f"  Overall: {'✅ PASSED' if result.validation.get('passed') else '❌ FAILED'}")
            lines.append(f"  Errors: {len(result.validation.get('errors', []))}")
            lines.append(f"  Warnings: {len(result.validation.get('warnings', []))}")

        # Transformation Requirements
        if result.transformation_requirements:
            lines.append(f"\n🔧 TRANSFORMATION REQUIREMENTS:")
            tr = result.transformation_requirements
            if tr.get('needs_standardization'):
                lines.append("  ⚠️  Needs EdgeDev standardizations applied")
            if tr.get('needs_refactoring'):
                lines.append("  ⚠️  Needs anti-pattern fixes")
            if 'required_changes' in tr:
                lines.append(f"  Required changes: {len(tr['required_changes'])}")
                for change in tr['required_changes'][:5]:
                    lines.append(f"    - {change}")

        # Recommendations
        if result.recommendations:
            lines.append(f"\n💡 RECOMMENDATIONS:")
            for rec in result.recommendations:
                lines.append(f"  • {rec}")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the code analyzer
if __name__ == "__main__":
    # Get templates directory
    current_dir = Path(__file__).parent.parent.parent
    templates_dir = current_dir / "templates"

    print("Testing CodeAnalyzer...\n")

    analyzer = CodeAnalyzer(str(templates_dir))

    # Test code
    test_code = """
import pandas as pd
import requests

class BacksideBScanner:
    def __init__(self, api_key, d0_start, d0_end):
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end

    def get_trading_dates(self):
        return pd.date_range(self.d0_start, self.d0_end, freq='B')

    def fetch_data(self):
        response = requests.get("https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2024-01-01/2024-01-31")
        return response.json()

    def process_data(self, df):
        result = []
        for index, row in df.iterrows():
            result.append(row['close'] * 1.1)
        return result

    def execute(self):
        dates = self.get_trading_dates()
        data = self.fetch_data()
        return self.process_data(data)
"""

    result = analyzer.analyze_code(test_code, "test_scanner.py")

    print(analyzer.generate_analysis_report(result))
