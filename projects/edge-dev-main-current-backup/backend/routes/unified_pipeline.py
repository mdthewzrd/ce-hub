"""
🚀 UNIFIED PIPELINE API ROUTES
Phase 4: Pipeline Optimization - Direct Upload → Execution Workflow

This module provides FastAPI endpoints for the unified pipeline system,
eliminating bottlenecks and providing real-time progress tracking.
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import asyncio
import json
import logging
from datetime import datetime

# Import unified pipeline system
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from unified_pipeline import (
    process_scanner_upload,
    get_unified_pipeline_status,
    PipelineRequest,
    PipelineResult,
    PipelineStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/unified-pipeline", tags=["unified-pipeline"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, execution_id: str):
        await websocket.accept()
        self.active_connections[execution_id] = websocket
        logger.info(f"✅ WebSocket connected for execution: {execution_id}")

    def disconnect(self, execution_id: str):
        if execution_id in self.active_connections:
            del self.active_connections[execution_id]
            logger.info(f"🔌 WebSocket disconnected for execution: {execution_id}")

    async def send_progress(self, execution_id: str, message: Dict[str, Any]):
        if execution_id in self.active_connections:
            try:
                await self.active_connections[execution_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"❌ Failed to send WebSocket message: {e}")
                self.disconnect(execution_id)

manager = ConnectionManager()

# Request/Response Models
class PipelineProcessRequest(BaseModel):
    scanner_code: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None

class PipelineProcessResponse(BaseModel):
    execution_id: str
    status: str
    message: str

class PipelineStatusResponse(BaseModel):
    success: bool
    status: Optional[PipelineStatus] = None
    result: Optional[PipelineResult] = None
    message: Optional[str] = None

# API Endpoints

@router.post("/process", response_model=PipelineProcessResponse)
async def start_unified_pipeline(request: PipelineProcessRequest):
    """
    🚀 START UNIFIED PIPELINE PROCESSING

    Initiates the direct Upload → Format → Execute workflow.

    Eliminates bottlenecks:
    ❌ Multiple service calls
    ❌ Intermediate routing delays
    ❌ Separate formatter and execution endpoints
    ❌ Complex state management

    Unified workflow:
    ✅ Single endpoint processing
    ✅ Direct formatter integration
    ✅ Real-time progress tracking
    ✅ Optimized resource usage
    """
    try:
        logger.info(f"🚀 UNIFIED PIPELINE: Starting processing for user {request.user_id}")

        # Create pipeline request
        pipeline_request = PipelineRequest(
            scanner_code=request.scanner_code,
            user_id=request.user_id,
            session_id=request.session_id,
            parameters=request.parameters,
            options=request.options
        )

        # Generate execution ID
        execution_id = f"exec_{int(datetime.now().timestamp())}"

        # Start processing in background
        asyncio.create_task(
            process_pipeline_with_websocket(execution_id, pipeline_request)
        )

        logger.info(f"✅ Pipeline started with execution ID: {execution_id}")

        return PipelineProcessResponse(
            execution_id=execution_id,
            status="started",
            message="Unified pipeline processing started"
        )

    except Exception as e:
        logger.error(f"❌ Failed to start unified pipeline: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline start failed: {str(e)}")

@router.get("/status/{execution_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status_api(execution_id: str):
    """
    📊 GET PIPELINE STATUS

    Returns current pipeline status and results if completed.
    """
    try:
        # Get pipeline status from unified pipeline system
        status = await get_unified_pipeline_status_from_system(execution_id)

        if status is None:
            return PipelineStatusResponse(
                success=False,
                message=f"Pipeline execution not found: {execution_id}"
            )

        # Check if pipeline is completed
        if status.stage == "completion":
            # Get final results
            result = await get_pipeline_result(execution_id)
            return PipelineStatusResponse(
                success=True,
                status=status,
                result=result,
                message="Pipeline completed successfully"
            )

        elif status.stage == "error":
            return PipelineStatusResponse(
                success=False,
                status=status,
                message=f"Pipeline execution failed: {status.message}"
            )

        else:
            return PipelineStatusResponse(
                success=True,
                status=status,
                message="Pipeline execution in progress"
            )

    except Exception as e:
        logger.error(f"❌ Failed to get pipeline status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@router.get("/stats")
async def get_pipeline_statistics_api():
    """
    📈 GET PIPELINE STATISTICS

    Returns comprehensive pipeline performance statistics.
    """
    try:
        stats = get_unified_pipeline_status()
        return {
            "success": True,
            "pipeline_status": "ACTIVE",
            "workflow": "Upload → Format → Execute → Results",
            "bottlenecks_eliminated": 4,
            "performance_improvements": 4,
            "statistics": stats,
            "endpoints": [
                "/api/unified-pipeline/process",
                "/api/unified-pipeline/status/{execution_id}",
                "/api/unified-pipeline/stats",
                "/ws/pipeline/{execution_id}"
            ]
        }
    except Exception as e:
        logger.error(f"❌ Failed to get pipeline statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Statistics fetch failed: {str(e)}")

@router.websocket("/ws/pipeline/{execution_id}")
async def pipeline_websocket(websocket: WebSocket, execution_id: str):
    """
    🔌 REAL-TIME PROGRESS WEBSOCKET

    Provides real-time progress updates for pipeline execution.

    Progress stages:
    - initialization (0-10%): Setting up pipeline
    - formatting (10-25%): Production formatter application
    - execution (25-85%): Scanner execution
    - completion (85-100%): Results finalization
    """
    await manager.connect(websocket, execution_id)
    try:
        while True:
            # Keep connection alive and wait for messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(execution_id)
    except Exception as e:
        logger.error(f"❌ WebSocket error for {execution_id}: {str(e)}")
        manager.disconnect(execution_id)

# Background Processing Functions

async def process_pipeline_with_websocket(execution_id: str, request: PipelineRequest):
    """
    🔄 BACKGROUND PIPELINE PROCESSING WITH WEBSOCKET UPDATES
    """
    try:
        logger.info(f"🚀 Starting background pipeline processing: {execution_id}")

        # Progress callback for WebSocket updates
        async def progress_callback(progress: int, message: str):
            await manager.send_progress(execution_id, {
                "type": "progress",
                "progress": progress,
                "message": message,
                "timestamp": datetime.now().isoformat()
            })

        # Send initial progress
        await progress_callback(5, "Initializing unified pipeline...")

        # Process pipeline with progress tracking
        result = await process_scanner_upload(
            scanner_code=request.scanner_code,
            user_id=request.user_id,
            session_id=request.session_id,
            parameters=request.parameters,
            options=request.options,
            progress_callback=progress_callback
        )

        # Send completion message
        await manager.send_progress(execution_id, {
            "type": "complete",
            "result": {
                "success": result.success,
                "execution_id": result.execution_id,
                "formatted_code": result.formatted_code,
                "execution_results": result.execution_results,
                "processing_time": result.processing_time,
                "metadata": result.metadata,
                "errors": result.errors
            },
            "timestamp": datetime.now().isoformat()
        })

        logger.info(f"✅ Pipeline processing completed: {execution_id}")

    except Exception as e:
        logger.error(f"❌ Pipeline processing failed: {execution_id} - {str(e)}")

        # Send error message via WebSocket
        await manager.send_progress(execution_id, {
            "type": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        })

# Helper Functions

async def get_unified_pipeline_status_from_system(execution_id: str) -> Optional[PipelineStatus]:
    """
    📊 GET PIPELINE STATUS FROM SYSTEM
    """
    try:
        from unified_pipeline import unified_pipeline
        return await unified_pipeline.get_pipeline_status(execution_id)
    except Exception as e:
        logger.error(f"❌ Failed to get pipeline status: {str(e)}")
        return None

async def get_pipeline_result(execution_id: str) -> Optional[PipelineResult]:
    """
    📋 GET PIPELINE RESULT
    """
    try:
        # This would typically be stored in a database or cache
        # For now, return a placeholder
        return None
    except Exception as e:
        logger.error(f"❌ Failed to get pipeline result: {str(e)}")
        return None

# Health Check
@router.get("/health")
async def health_check():
    """
    🏥 UNIFIED PIPELINE HEALTH CHECK
    """
    try:
        # Test pipeline system availability
        stats = get_unified_pipeline_status()

        return {
            "status": "healthy",
            "pipeline_system": "active",
            "unified_workflow": True,
            "bottlenecks_eliminated": stats.get("bottlenecks_eliminated", 4),
            "active_connections": len(manager.active_connections),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Pipeline health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Cleanup on shutdown
async def cleanup_websockets():
    """
    🧹 CLEANUP WEBSOCKET CONNECTIONS ON SHUTDOWN
    """
    logger.info("🧹 Cleaning up pipeline WebSocket connections...")
    for execution_id in list(manager.active_connections.keys()):
        manager.disconnect(execution_id)

# Export router for FastAPI app
__all__ = ["router", "cleanup_websockets"]