#!/usr/bin/env python3
"""
Renata Rebuild API Service
FastAPI service for code transformation and standardization
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from renata_rebuild.processing_engine.code_generator import CodeGenerator
from renata_rebuild.processing_engine.scanner_type_detector import ScannerType
from renata_rebuild.output_validator.output_validator import OutputValidator

# Initialize FastAPI app
app = FastAPI(
    title="Renata Rebuild API",
    description="EdgeDev code standardization and transformation service",
    version="1.0.0"
)

# Initialize components
templates_dir = Path(__file__).parent.parent / "renata_rebuild" / "templates"
code_generator = CodeGenerator(str(templates_dir))
output_validator = OutputValidator(str(templates_dir))


# Request/Response Models
class CodeTransformRequest(BaseModel):
    code: str
    filename: str = "scanner.py"
    preserve_logic: bool = True
    validate_only: bool = False


class CodeAnalysisRequest(BaseModel):
    code: str
    filename: str = "scanner.py"


class ScannerTypeDetectionRequest(BaseModel):
    code: str
    description: Optional[str] = None


class TransformResponse(BaseModel):
    success: bool
    scanner_type: str
    confidence: float
    transformed_code: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    validation: Optional[Dict[str, Any]] = None
    errors: List[str] = []


class AnalysisResponse(BaseModel):
    success: bool
    scanner_type: Optional[str] = None
    structure_type: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    anti_patterns: List[str] = []
    standardizations: List[str] = []
    errors: List[str] = []


# Health Check
@app.get("/")
async def root():
    return {
        "service": "Renata Rebuild API",
        "status": "operational",
        "version": "1.0.0",
        "capabilities": [
            "code_transformation",
            "scanner_type_detection",
            "parameter_extraction",
            "code_validation",
            "edge_dev_standardization"
        ]
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Transform endpoint - Main code transformation
@app.post("/api/transform", response_model=TransformResponse)
async def transform_code(request: CodeTransformRequest) -> TransformResponse:
    """
    Transform Python code to EdgeDev standards

    This endpoint:
    1. Analyzes the input code
    2. Detects scanner type
    3. Extracts parameters
    4. Applies EdgeDev 3-stage architecture
    5. Adds 7 mandatory standardizations
    6. Validates output
    """
    try:
        # If validate_only, just return analysis
        if request.validate_only:
            result = code_generator.code_analyzer.analyze_code(request.code, request.filename)
            validation = output_validator.validate_all(request.code, request.filename)

            return TransformResponse(
                success=True,
                scanner_type=result.scanner_type.value,
                confidence=result.confidence,
                transformed_code=None,
                analysis={
                    "scanner_type": result.scanner_type.value,
                    "structure_type": result.structure_type.value,
                    "parameters": result.parameters,
                    "anti_patterns": result.anti_patterns,
                    "missing_standardizations": result.missing_standardizations
                },
                validation=validation
            )

        # Full transformation
        result = code_generator.generate_from_code(
            request.code,
            request.filename,
            preserve_logic=request.preserve_logic
        )

        # Check if transformation was successful
        if not result.transformed_code:
            return TransformResponse(
                success=False,
                scanner_type=result.scanner_type.value if result.scanner_type else "unknown",
                confidence=0.0,
                errors=result.warnings if result.warnings else ["Transformation failed"]
            )

        # Validate the transformed code
        validation = output_validator.validate_all(result.transformed_code, request.filename)

        return TransformResponse(
            success=True,
            scanner_type=result.scanner_type.value if result.scanner_type else "custom",
            confidence=0.85,  # Default confidence since result doesn't have it
            transformed_code=result.transformed_code,
            analysis={
                "original_analysis": str(result.analysis) if result.analysis else None,
                "parameters_extracted": result.parameters,
                "standardizations_applied": result.changes_made
            },
            validation=validation,
            errors=[]
        )

    except Exception as e:
        return TransformResponse(
            success=False,
            scanner_type="error",
            confidence=0.0,
            errors=[str(e)]
        )


# Analyze endpoint - Code analysis without transformation
@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_code(request: CodeAnalysisRequest) -> AnalysisResponse:
    """
    Analyze Python code and return detailed information

    Returns:
    - Scanner type detection
    - Structure type (single-scan vs multi-scan)
    - Extracted parameters
    - Detected anti-patterns
    - Missing standardizations
    """
    try:
        analyzer = code_generator.code_analyzer
        result = analyzer.analyze_code(request.code, request.filename)

        return AnalysisResponse(
            success=True,
            scanner_type=result.scanner_type.value,
            structure_type=result.structure_type.value,
            parameters=result.parameters,
            anti_patterns=result.anti_patterns,
            standardizations=result.missing_standardizations,
            errors=[]
        )

    except Exception as e:
        return AnalysisResponse(
            success=False,
            errors=[str(e)]
        )


# Scanner type detection endpoint
@app.post("/api/detect-scanner", response_model=Dict[str, Any])
async def detect_scanner_type(request: ScannerTypeDetectionRequest) -> Dict[str, Any]:
    """
    Detect scanner type from code or description

    Returns:
    - Scanner type (backside_b, a_plus, lc_d2, etc.)
    - Structure type
    - Confidence score
    - Matching patterns
    """
    try:
        detector = code_generator.scanner_type_detector

        if request.code:
            result = detector.detect_from_code(request.code)
        elif request.description:
            result = detector.detect_from_description(request.description)
        else:
            raise HTTPException(status_code=400, detail="Either code or description required")

        return {
            "success": True,
            "scanner_type": result.scanner_type.value,
            "structure_type": result.structure_type.value,
            "confidence": result.confidence,
            "matching_patterns": result.matching_patterns,
            "reasoning": result.reasoning
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Validation endpoint
@app.post("/api/validate", response_model=Dict[str, Any])
async def validate_code(request: CodeAnalysisRequest) -> Dict[str, Any]:
    """
    Validate Python code against EdgeDev standards

    Checks:
    - Syntax validity
    - 3-stage architecture
    - 7 mandatory standardizations
    - Best practices
    """
    try:
        validation = output_validator.validate_all(request.code, request.filename)

        return {
            "success": validation["valid"],
            "syntax_valid": validation["syntax_valid"],
            "structure_valid": validation["structure_valid"],
            "standards_valid": validation["standards_valid"],
            "best_practices_valid": validation["best_practices_valid"],
            "validation_results": validation["validation_results"],
            "summary": validation["summary"]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# Template information endpoint
@app.get("/api/templates", response_model=Dict[str, Any])
async def get_templates():
    """
    Get information about available EdgeDev templates
    """
    try:
        templates = code_generator.template_repository

        return {
            "success": True,
            "templates": templates.templates,
            "patterns": templates.patterns,
            "scanner_types": [st.value for st in ScannerType]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    # Run the API server
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=5667,  # EdgeDev AI API (5665: frontend, 5666: backend, 5667: AI)
        log_level="info"
    )
