#!/usr/bin/env python3
"""
Universal Scanner Engine (USE)
Intelligent scanning ecosystem for market analysis and pattern detection

This module provides a comprehensive platform for executing uploaded scanner code
with intelligent classification, resource allocation, and optimized execution.

Main Components:
- Scanner Classification: Automatically identifies scanner types and requirements
- Parameter Extraction: Intelligently extracts and validates scanner parameters
- Resource Management: Dynamically allocates threading and system resources
- API Management: Handles Polygon API integration with rate limiting and caching
- Execution Orchestration: Coordinates the complete scanner lifecycle

Usage:
    from universal_scanner_engine import execute_uploaded_scanner, ScannerExecutionRequest

    request = ScannerExecutionRequest(
        scanner_id="unique_id",
        filename="my_scanner.py",
        code=scanner_code_string
    )

    result = await execute_uploaded_scanner(request)
"""

from .core.use_orchestrator import (
    execute_uploaded_scanner,
    get_scanner_status,
    get_system_status,
    ScannerExecutionRequest,
    ExecutionResult,
    ExecutionStatus
)

from .classification.scanner_classifier import (
    classify_uploaded_scanner,
    ScannerProfile,
    ScannerType
)

from .extraction.parameter_extractor import (
    extract_scanner_parameters,
    ParameterExtractionResult
)

from .api.polygon_manager import (
    PolygonAPIManager
)

from .resource.thread_manager import (
    allocate_scanner_resources,
    execute_scanner_with_resources,
    ThreadAllocation,
    ThreadStrategy
)

__version__ = "1.0.0"
__author__ = "CE-Hub Universal Scanner Engine Team"

# Main exports for easy importing
__all__ = [
    # Core orchestration
    "execute_uploaded_scanner",
    "get_scanner_status",
    "get_system_status",
    "ScannerExecutionRequest",
    "ExecutionResult",
    "ExecutionStatus",

    # Classification
    "classify_uploaded_scanner",
    "ScannerProfile",
    "ScannerType",

    # Parameter extraction
    "extract_scanner_parameters",
    "ParameterExtractionResult",

    # API management
    "PolygonAPIManager",

    # Resource management
    "allocate_scanner_resources",
    "execute_scanner_with_resources",
    "ThreadAllocation",
    "ThreadStrategy"
]

# Package-level constants
DEFAULT_TIMEOUT_SECONDS = 3600  # 1 hour
MAX_CONCURRENT_SCANNERS = 3
SUPPORTED_FILE_EXTENSIONS = ['.py']

def get_engine_info():
    """Get information about the Universal Scanner Engine"""
    return {
        "name": "Universal Scanner Engine",
        "version": __version__,
        "author": __author__,
        "description": "Intelligent scanning ecosystem for market analysis",
        "components": [
            "Scanner Classification System",
            "Enhanced Parameter Extraction",
            "Polygon API Manager",
            "Dynamic Threading Management",
            "Universal Scanner Orchestrator"
        ],
        "supported_scanner_types": [
            "Enterprise (4000+ symbols, multi-year backtesting)",
            "Focused (curated lists, pattern-specific)",
            "Daily (real-time market scanning)",
            "Intraday (sub-daily analysis)"
        ]
    }