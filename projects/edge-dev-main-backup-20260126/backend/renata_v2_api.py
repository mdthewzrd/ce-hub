"""
RENATA_V2 Transformation API Endpoint

Transforms any trading scanner code into EdgeDev v31 standard
"""

import logging
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import HTTPException, APIRouter
from pydantic import BaseModel

# Create router
router = APIRouter(prefix="/api/renata_v2", tags=["renata-v2"])

# Setup logger
logger = logging.getLogger(__name__)

# Add RENATA_V2 to path
renata_v2_path = Path(__file__).parent.parent / "RENATA_V2"
if renata_v2_path.exists():
    # Add parent directory to path so we can import RENATA_V2 as a package
    sys.path.insert(0, str(renata_v2_path.parent))
    logger.info(f"✅ Added RENATA_V2 parent directory to path: {renata_v2_path.parent}")
else:
    logger.warning(f"⚠️  RENATA_V2 not found at: {renata_v2_path}")

# Import RENATA_V2 components
try:
    from RENATA_V2.core.transformer import RenataTransformer, TransformationResult
    RENATA_V2_AVAILABLE = True
    logger.info("✅ RENATA_V2 components loaded successfully")
except ImportError as e:
    RENATA_V2_AVAILABLE = False
    logger.warning(f"⚠️  RENATA_V2 not available: {e}")


# Pydantic models for API
class TransformRequest(BaseModel):
    """Request model for scanner transformation"""
    source_code: str
    scanner_name: Optional[str] = None
    date_range: str = "2024-01-01 to 2024-12-31"
    verbose: bool = True


class TransformResponse(BaseModel):
    """Response model for transformation results"""
    success: bool
    generated_code: Optional[str] = None
    validation_results: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None
    corrections_made: int = 0


class HealthCheckResponse(BaseModel):
    """Health check response"""
    available: bool
    version: str
    components: List[str]


@router.post("/transform", response_model=TransformResponse)
async def transform_scanner_code(request: TransformRequest) -> TransformResponse:
    """
    Transform scanner code to v31 standard using RENATA_V2

    Args:
        request: Transform request with source code

    Returns:
        TransformResponse with generated code

    Raises:
        HTTPException: If transformation fails
    """
    if not RENATA_V2_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="RENATA_V2 transformation service is not available. Please ensure it's properly installed."
        )

    try:
        logger.info("🚀 Starting RENATA_V2 transformation...")
        logger.info(f"📝 Source code length: {len(request.source_code)} characters")
        logger.info(f"🎯 Original scanner name: {request.scanner_name or 'auto-generated'}")

        # Sanitize scanner name to be a valid Python identifier
        def sanitize_scanner_name(name: str) -> str:
            """Convert scanner name to valid Python class name"""
            if not name:
                return "auto_generated_scanner"

            # Replace spaces and special chars with underscores
            import re
            sanitized = re.sub(r'[^\w]', '_', name)

            # Ensure it starts with a letter or underscore
            if sanitized[0].isdigit():
                sanitized = 'scanner_' + sanitized

            # Remove consecutive underscores
            sanitized = re.sub(r'_+', '_', sanitized)

            # Strip leading/trailing underscores
            sanitized = sanitized.strip('_')

            # Ensure it's not empty
            if not sanitized:
                sanitized = "auto_generated_scanner"

            return sanitized

        sanitized_name = sanitize_scanner_name(request.scanner_name)
        logger.info(f"🎯 Sanitized scanner name: {sanitized_name}")

        # Initialize transformer
        transformer = RenataTransformer()

        # Perform transformation
        result = transformer.transform(
            source_code=request.source_code,
            scanner_name=sanitized_name,
            date_range=request.date_range,
            verbose=request.verbose
        )

        logger.info(f"✅ Transformation completed: success={result.success}")

        # Format validation results for response
        validation_results = None
        if result.validation_results:
            validation_results = [
                {
                    "category": vr.category,
                    "is_valid": vr.is_valid,
                    "errors": vr.errors,
                    "warnings": vr.warnings
                }
                for vr in result.validation_results
            ]

        # Build response
        return TransformResponse(
            success=result.success,
            generated_code=result.generated_code,
            validation_results=validation_results,
            metadata=result.transformation_metadata,
            errors=result.errors,
            corrections_made=result.corrections_made
        )

    except Exception as e:
        logger.error(f"❌ Transformation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Transformation failed: {str(e)}"
        )


@router.get("/health", response_model=HealthCheckResponse)
async def check_renata_v2_health() -> HealthCheckResponse:
    """
    Check if RENATA_V2 service is available

    Returns:
        HealthCheckResponse with service status
    """
    components = []

    if RENATA_V2_AVAILABLE:
        # Test importing and initializing components
        try:
            from RENATA_V2.core.transformer import RenataTransformer
            from RENATA_V2.core.ast_parser import ASTParser
            from RENATA_V2.core.ai_agent import AIAgent
            from RENATA_V2.core.template_engine import TemplateEngine
            from RENATA_V2.core.validator import Validator

            components = [
                "Transformer",
                "AST Parser",
                "AI Agent (Qwen 3 Coder)",
                "Template Engine (Jinja2)",
                "Validator"
            ]

            return HealthCheckResponse(
                available=True,
                version="2.0.0",
                components=components
            )

        except Exception as e:
            logger.warning(f"⚠️  RENATA_V2 partially available: {e}")
            return HealthCheckResponse(
                available=False,
                version="2.0.0",
                components=[]
            )
    else:
        return HealthCheckResponse(
            available=False,
            version="2.0.0",
            components=[]
        )


# Example usage function
async def example_transformation():
    """
    Example of how to use the RENATA_V2 transformation
    """
    example_code = '''
def run_scan():
    """Scan for gap down setups"""
    results = []

    tickers = ["AAPL", "MSFT", "GOOGL"]

    for ticker in tickers:
        df = get_data(ticker)

        # Calculate gap
        df['gap'] = (df['open'] / df['close'].shift(1)) - 1

        # Find signals
        signals = df[
            (df['gap'] <= -0.5) &
            (df['volume'] >= 1000000)
        ]

        results.extend(signals.to_dict('records'))

    return results
'''

    request = TransformRequest(
        source_code=example_code,
        scanner_name="GapDownExample",
        date_range="2024-01-01 to 2024-12-31",
        verbose=True
    )

    result = transform_scanner_code(request)

    if result.success:
        print("✅ Transformation successful!")
        print(f"Generated {len(result.generated_code)} lines of code")
        print(f"Applied {result.corrections_made} corrections")

        # Save to file
        output_path = Path("output/transformed_scanner.py")
        output_path.parent.mkdir(exist_ok=True)

        with open(output_path, 'w') as f:
            f.write(result.generated_code)

        print(f"✅ Saved to: {output_path}")
    else:
        print("❌ Transformation failed:")
        for error in result.errors:
            print(f"  - {error}")


if __name__ == "__main__":
    # Test the transformation
    import asyncio
    asyncio.run(example_transformation())
