"""
Code Generator - Orchestrate Complete Code Transformation

This module:
1. Coordinates all analysis and transformation components
2. Generates complete standardized EdgeDev code
3. Preserves original logic and parameters
4. Ensures determinism
"""

from typing import Dict, List, Any, Optional
from pathlib import Path
import sys

# Import all processing engine components
sys.path.insert(0, str(Path(__file__).parent.parent))

from processing_engine.code_analyzer import CodeAnalyzer, CodeAnalysisResult
from processing_engine.scanner_type_detector import ScannerTypeDetector, ScannerType, StructureType
from processing_engine.parameter_extractor import ParameterExtractor
from processing_engine.structure_applier import StructureApplier
from processing_engine.standardization_adder import StandardizationAdder


class CodeGenerationResult:
    """Complete code generation result"""

    def __init__(self):
        self.original_code: str = ""
        self.transformed_code: str = ""
        self.analysis: Optional[CodeAnalysisResult] = None
        self.scanner_type: Optional[ScannerType] = None
        self.structure_type: Optional[StructureType] = None
        self.parameters: Dict[str, Any] = {}
        self.changes_made: List[str] = []
        self.validation_passed: bool = False
        self.warnings: List[str] = []


class CodeGenerator:
    """
    Main code generation orchestrator

    Pipeline:
    1. Analyze code
    2. Detect scanner type
    3. Extract parameters
    4. Apply structure
    5. Add standardizations
    6. Validate output
    """

    def __init__(self, templates_dir: str):
        """
        Initialize code generator

        Args:
            templates_dir: Path to reference templates
        """
        self.templates_dir = templates_dir
        self.analyzer = CodeAnalyzer(templates_dir)
        self.detector = ScannerTypeDetector()
        self.extractor = ParameterExtractor()
        self.structure_applier = StructureApplier()
        self.std_adder = StandardizationAdder()

    def generate_from_code(
        self,
        code: str,
        filename: str = "scanner.py",
        preserve_logic: bool = True
    ) -> CodeGenerationResult:
        """
        Generate standardized EdgeDev code from input code

        Args:
            code: Original scanner code
            filename: Optional filename
            preserve_logic: Whether to preserve original logic

        Returns:
            CodeGenerationResult
        """
        result = CodeGenerationResult()
        result.original_code = code
        current_code = code

        # Step 1: Analyze code
        print("🔍 Step 1: Analyzing code...")
        analysis = self.analyzer.analyze_code(code, filename)
        result.analysis = analysis

        # Step 2: Detect scanner type
        print("🔍 Step 2: Detecting scanner type...")
        detection = self.detector.detect_from_code(code)
        result.scanner_type = detection.scanner_type
        result.structure_type = detection.structure_type

        # Step 3: Extract parameters
        print("🔍 Step 3: Extracting parameters...")
        params = self.extractor.extract_parameters(code)
        result.parameters = params.scanner_params

        # Step 4: Apply EdgeDev structure
        print("🔧 Step 4: Applying EdgeDev structure...")
        structure_result = self.structure_applier.apply_structure(
            current_code,
            result.structure_type.value if result.structure_type else 'single-scan'
        )
        current_code = structure_result['transformed_code']
        result.changes_made.extend(structure_result['changes_made'])

        # Step 5: Add standardizations
        print("🔧 Step 5: Adding EdgeDev standardizations...")
        std_result = self.std_adder.apply_all_standardizations(current_code)
        current_code = std_result['transformed_code']
        result.changes_made.extend(std_result['changes'])

        # Step 6: Validate output
        print("✔️  Step 6: Validating output...")
        validation = self.analyzer.validator.validate_all(current_code, filename)
        result.validation_passed = validation['passed']
        result.warnings = validation.get('warnings', [])

        # Set final code
        result.transformed_code = current_code

        # Add summary
        result.changes_made.insert(0, f"Scanner type: {result.scanner_type.value}")
        result.changes_made.insert(1, f"Structure type: {result.structure_type.value}")

        return result

    def generate_from_description(
        self,
        description: str,
        suggested_params: Optional[Dict[str, Any]] = None
    ) -> CodeGenerationResult:
        """
        Generate scanner code from natural language description

        Args:
            description: Scanner description
            suggested_params: Optional parameter suggestions

        Returns:
            CodeGenerationResult
        """
        result = CodeGenerationResult()
        result.original_code = f"# Description: {description}"

        # Analyze description
        print("🔍 Analyzing description...")
        text_analysis = self.analyzer.analyze_text_description(description)

        # Detect scanner type
        detection = self.detector.detect_from_description(description)
        result.scanner_type = detection.scanner_type
        result.structure_type = StructureType.SINGLE_SCAN  # Default

        # Build basic scanner structure
        class_name = self._generate_class_name(result.scanner_type, description)

        # Generate code from specification
        code = self._generate_scanner_from_spec(
            class_name,
            result.scanner_type,
            suggested_params or text_analysis.input_info.get('parameters', {})
        )

        # Now apply standardizations
        return self.generate_from_code(code, f"{class_name}.py")

    def _generate_class_name(self, scanner_type: ScannerType, description: str) -> str:
        """Generate class name from scanner type"""
        type_names = {
            ScannerType.BACKSIDE_B: "BacksideBScanner",
            ScannerType.A_PLUS: "APlusScanner",
            ScannerType.HALF_A_PLUS: "HalfAPlusScanner",
            ScannerType.LC_D2: "LCD2Scanner",
            ScannerType.LC_3D_GAP: "LC3DGapScanner",
            ScannerType.D1_GAP: "D1GapScanner",
            ScannerType.EXTENDED_GAP: "ExtendedGapScanner",
            ScannerType.SC_DMR: "SCDMRScanner",
            ScannerType.CUSTOM: "CustomScanner"
        }
        return type_names.get(scanner_type, "CustomScanner")

    def _generate_scanner_from_spec(
        self,
        class_name: str,
        scanner_type: ScannerType,
        params: Dict[str, Any]
    ) -> str:
        """Generate basic scanner from specification"""
        # This would generate scanner code based on type and params
        # For now, return a template that will be enhanced by other components

        code = f"""
import pandas as pd
import numpy as np
import requests

class {class_name}:
    def __init__(self, api_key: str, d0_start: str, d0_end: str, **params):
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end
        self.params = params

    def execute(self):
        return pd.DataFrame()
"""
        return code

    def get_generation_report(self, result: CodeGenerationResult) -> str:
        """Generate human-readable generation report"""
        lines = []
        lines.append("=" * 70)
        lines.append("CODE GENERATION REPORT")
        lines.append("=" * 70)

        lines.append(f"\n📊 Scanner Type: {result.scanner_type.value if result.scanner_type else 'Unknown'}")
        lines.append(f"📐 Structure Type: {result.structure_type.value if result.structure_type else 'Unknown'}")

        lines.append(f"\n✅ Validation: {'PASSED' if result.validation_passed else 'FAILED'}")

        if result.parameters:
            lines.append(f"\n📋 Parameters ({len(result.parameters)}):")
            for param, value in result.parameters.items():
                lines.append(f"  • {param}: {value}")

        lines.append(f"\n🔧 Changes Made ({len(result.changes_made)}):")
        for change in result.changes_made[:10]:
            lines.append(f"  • {change}")
        if len(result.changes_made) > 10:
            lines.append(f"  ... and {len(result.changes_made) - 10} more")

        if result.warnings:
            lines.append(f"\n⚠️  Warnings ({len(result.warnings)}):")
            for warning in result.warnings[:5]:
                lines.append(f"  • {warning}")
            if len(result.warnings) > 5:
                lines.append(f"  ... and {len(result.warnings) - 5} more")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the code generator
if __name__ == "__main__":
    # Get templates directory
    current_dir = Path(__file__).parent.parent.parent
    templates_dir = current_dir / "templates"

    print("Testing CodeGenerator...\n")

    generator = CodeGenerator(str(templates_dir))

    # Test with simple code
    test_code = """
class TestScanner:
    def __init__(self, api_key):
        self.api_key = api_key

    def execute(self):
        return pd.DataFrame()
"""

    result = generator.generate_from_code(test_code, "test.py")

    print(generator.get_generation_report(result))

    print("\nGenerated code preview (first 1000 chars):")
    print(result.transformed_code[:1000] + "...")
