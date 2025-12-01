#!/usr/bin/env python3
"""
Simple FastAPI Server with Timeout Fix
Uses guaranteed scanner service and applies 90-second timeout fix
"""

import asyncio
import json
import logging
from typing import Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from ai_scanner_service_guaranteed import GuaranteedAIScannerService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Edge-Dev Scanner API with Timeout Fix")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scanner service
scanner_service = GuaranteedAIScannerService()

class ScannerAnalysisRequest(BaseModel):
    code: str
    filename: str = "uploaded_scanner.py"

@app.post("/analyze-scanner")
async def analyze_scanner(request: ScannerAnalysisRequest):
    """
    Analyze scanner code and extract parameters with 90-second timeout fix applied
    """
    try:
        logger.info(f"🎯 Starting scanner analysis for {request.filename}")

        # Apply 90-second timeout fix by using asyncio.wait_for
        result = await asyncio.wait_for(
            scanner_service.split_scanner_intelligent(request.code, request.filename),
            timeout=90.0  # 90-second timeout fix applied here
        )

        logger.info(f"✅ Scanner analysis completed successfully")
        return {
            "success": True,
            "analysis": result,
            "timestamp": datetime.now().isoformat(),
            "timeout_fix_applied": True,
            "timeout_seconds": 90
        }

    except asyncio.TimeoutError:
        logger.error(f"❌ Scanner analysis timed out after 90 seconds")
        raise HTTPException(
            status_code=408,
            detail="Scanner analysis timed out after 90 seconds"
        )
    except Exception as e:
        logger.error(f"❌ Error in scanner analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Scanner analysis failed: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "timeout_fix_version": "90_seconds",
        "scanner_service": "guaranteed"
    }

@app.post("/api/format/ai-split-scanners")
async def ai_split_scanners_frontend(request: ScannerAnalysisRequest):
    """
    Frontend endpoint for AI scanner splitting with guaranteed service
    Maps frontend calls to the guaranteed scanner service
    """
    try:
        logger.info(f"🎯 Frontend endpoint called for {request.filename}")

        # Use the same guaranteed service with 90-second timeout
        result = await asyncio.wait_for(
            scanner_service.split_scanner_intelligent(request.code, request.filename),
            timeout=90.0  # 90-second timeout fix applied here
        )

        logger.info(f"✅ Frontend scanner analysis completed successfully")
        # Return in the format the frontend expects
        return result

    except asyncio.TimeoutError:
        logger.error(f"❌ Frontend scanner analysis timed out after 90 seconds")
        raise HTTPException(
            status_code=408,
            detail="Scanner analysis timed out after 90 seconds"
        )
    except Exception as e:
        logger.error(f"❌ Error in frontend scanner analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Scanner analysis failed: {str(e)}"
        )

@app.post("/api/format/analyze-code")
async def analyze_code_frontend(request: ScannerAnalysisRequest):
    """
    Frontend endpoint for code analysis with guaranteed service
    Maps frontend calls to the guaranteed scanner service
    """
    try:
        logger.info(f"🎯 Frontend analyze-code called for {request.filename}")

        # Use the same guaranteed service with 90-second timeout
        result = await asyncio.wait_for(
            scanner_service.split_scanner_intelligent(request.code, request.filename),
            timeout=90.0  # 90-second timeout fix applied here
        )

        logger.info(f"✅ Frontend code analysis completed successfully")
        # Return in the format the frontend expects
        return result

    except asyncio.TimeoutError:
        logger.error(f"❌ Frontend code analysis timed out after 90 seconds")
        raise HTTPException(
            status_code=408,
            detail="Code analysis timed out after 90 seconds"
        )
    except Exception as e:
        logger.error(f"❌ Error in frontend code analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Code analysis failed: {str(e)}"
        )

class ParameterExtractionRequest(BaseModel):
    code: str

@app.post("/api/format/extract-parameters")
async def extract_parameters_frontend(request: ParameterExtractionRequest):
    """
    Frontend endpoint for individual scanner parameter extraction
    Extracts parameters from a single scanner code using guaranteed service
    """
    try:
        logger.info(f"🎯 Frontend extract-parameters called")

        # Use the same guaranteed service with 90-second timeout
        # We'll process it as a single scanner analysis
        result = await asyncio.wait_for(
            scanner_service.split_scanner_intelligent(request.code, "individual_scanner.py"),
            timeout=90.0  # 90-second timeout fix applied here
        )

        logger.info(f"✅ Frontend parameter extraction completed successfully")

        # For individual parameter extraction, return just the parameters from the first scanner
        if result.get('success') and 'scanners' in result and len(result['scanners']) > 0:
            first_scanner = result['scanners'][0]
            parameters = first_scanner.get('parameters', [])

            # Return in the format expected for individual parameter extraction
            return {
                "success": True,
                "parameters": parameters,
                "scanner_name": first_scanner.get('scanner_name', 'Unknown'),
                "timestamp": datetime.now().isoformat()
            }
        else:
            # No parameters found
            return {
                "success": False,
                "parameters": [],
                "scanner_name": "Unknown",
                "timestamp": datetime.now().isoformat()
            }

    except asyncio.TimeoutError:
        logger.error(f"❌ Frontend parameter extraction timed out after 90 seconds")
        raise HTTPException(
            status_code=408,
            detail="Parameter extraction timed out after 90 seconds"
        )
    except Exception as e:
        logger.error(f"❌ Error in frontend parameter extraction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Parameter extraction failed: {str(e)}"
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Edge-Dev Scanner API with 90-second timeout fix",
        "endpoints": ["/analyze-scanner", "/api/format/ai-split-scanners", "/api/format/extract-parameters", "/health"],
        "timeout_fix_applied": True
    }

if __name__ == "__main__":
    logger.info("🚀 Starting Edge-Dev Scanner API with 90-second timeout fix...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )