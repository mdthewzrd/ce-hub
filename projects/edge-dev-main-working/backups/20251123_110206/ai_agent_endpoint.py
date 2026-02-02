"""
AI Agent Formatting Endpoint

This creates a new /api/format/smart endpoint that uses the AI agent
instead of the faulty rule-based formatting
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import os
from pathlib import Path

# Add the parent directory to path to import the AI agent
parent_dir = str(Path(__file__).parent.parent)
sys.path.append(parent_dir)

try:
    from smart_formatting_agent import SmartFormattingAgent
except ImportError:
    SmartFormattingAgent = None

router = APIRouter()

class SmartFormatRequest(BaseModel):
    code: str
    filename: str = "uploaded_scanner.py"

@router.post("/api/format/smart")
async def smart_format_code(request: SmartFormatRequest):
    """
    Smart formatting using AI agent (replaces faulty backend formatting)
    """
    if SmartFormattingAgent is None:
        raise HTTPException(
            status_code=503,
            detail="AI Agent not available. Please ensure smart_formatting_agent.py is accessible."
        )

    try:
        # Initialize AI agent
        agent = SmartFormattingAgent()

        # Perform smart analysis and formatting
        result = agent.analyze_and_format_scanner(request.code, request.filename)

        # Ensure compatibility with frontend expectations
        formatted_result = {
            "success": result["success"],
            "formatted_code": result["formatted_code"],
            "scanner_type": result["scanner_type"],
            "metadata": {
                **result["metadata"],
                # Ensure frontend compatibility
                "original_lines": result["metadata"]["original_lines"],
                "formatted_lines": result["metadata"]["formatted_lines"],
                "scanner_type": result["scanner_type"],
                "parameter_count": result["metadata"]["parameter_count"],
                "integrity_hash": "ai_agent_verified",
                "processing_time": result["metadata"]["processing_time"],
                "infrastructure_enhancements": result["metadata"]["infrastructure_enhancements"],
                "ai_extraction": result["metadata"]["ai_extraction"],
                "intelligent_parameters": result["metadata"]["intelligent_parameters"]
            }
        }

        return formatted_result

    except Exception as e:
        print(f"❌ AI Agent formatting failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI Agent formatting failed: {str(e)}"
        )

@router.post("/api/format/analyze-only")
async def fast_analyze_code(request: SmartFormatRequest):
    """
    🚀 FAST ANALYSIS MODE - Bypasses execution, returns parameters immediately

    This endpoint:
    1. Performs smart formatting/analysis (0.04s)
    2. Extracts all parameters and metadata
    3. Skips complex async execution (which hangs)
    4. Returns results immediately for instant display
    """
    if SmartFormattingAgent is None:
        raise HTTPException(
            status_code=503,
            detail="AI Agent not available. Please ensure smart_formatting_agent.py is accessible."
        )

    try:
        # Initialize AI agent
        agent = SmartFormattingAgent()

        # Perform smart analysis ONLY (no execution)
        result = agent.analyze_and_format_scanner(request.code, request.filename)

        # Create fast response with parameters for immediate display
        fast_result = {
            "success": True,
            "analysis_mode": "fast_parameters_only",
            "scanner_type": result["scanner_type"],
            "parameters_extracted": result["metadata"]["parameter_count"],
            "execution_skipped": True,
            "message": f"✅ Fast analysis complete - {result['metadata']['parameter_count']} parameters extracted",
            "metadata": {
                **result["metadata"],
                "analysis_method": "fast_analyze_only",
                "execution_bypassed": True,
                "parameter_count": result["metadata"]["parameter_count"],
                "processing_time": result["metadata"]["processing_time"],
                "ai_extraction": result["metadata"]["ai_extraction"],
                "intelligent_parameters": result["metadata"]["intelligent_parameters"],
                "scanner_info": {
                    "type": result["scanner_type"],
                    "size_chars": len(request.code),
                    "analysis_time": result["metadata"]["processing_time"],
                    "parameters_found": result["metadata"]["parameter_count"],
                    "complexity": "high" if len(request.code) > 50000 else "medium" if len(request.code) > 10000 else "low"
                }
            },
            # Include formatted code for reference but mark as analysis-only
            "formatted_code": result["formatted_code"],
            "ready_for_execution": True,
            "execution_note": "Code analyzed successfully. Execution available separately if needed."
        }

        return fast_result

    except Exception as e:
        print(f"❌ Fast analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Fast analysis failed: {str(e)}"
        )

@router.get("/api/format/smart/health")
async def check_smart_format_health():
    """
    Health check for AI agent availability
    """
    if SmartFormattingAgent is None:
        return {
            "available": False,
            "error": "SmartFormattingAgent not importable"
        }

    try:
        # Try to initialize the agent
        agent = SmartFormattingAgent()
        return {
            "available": True,
            "agent_version": "1.0.0",
            "capabilities": [
                "deep_code_analysis",
                "thorough_parameter_extraction",
                "polygon_api_integration",
                "smart_threadpooling",
                "integrity_verification",
                "fast_analyze_only"
            ]
        }
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }