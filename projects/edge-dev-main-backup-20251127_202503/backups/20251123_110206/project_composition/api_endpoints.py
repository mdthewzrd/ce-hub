"""
API Endpoints for Project Composition Management

This module provides RESTful API endpoints for managing project composition,
including CRUD operations for projects, scanner management, parameter configuration,
and project execution.

Endpoints:
- Project Management: Create, read, update, delete projects
- Scanner Management: Add, remove, configure scanners in projects
- Parameter Management: Update scanner-specific parameters
- Project Execution: Execute projects and retrieve results
- Status & Monitoring: Project status, execution history, health checks

Integration:
- FastAPI framework for high-performance async operations
- Pydantic models for request/response validation
- Built on Project Composition Engine with complete scanner isolation
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date
import asyncio
import logging
import json
import io
import csv
from pathlib import Path

# Import project composition components
from .project_config import (
    ProjectConfig, ScannerReference, AggregationMethod,
    ProjectManager, ExecutionConfig
)
from .parameter_manager import ParameterManager
from .composition_engine import ProjectCompositionEngine
from .signal_aggregation import AggregatedSignals
from .models import Project, ProjectScanner, ProjectExecution
from .scanner_integration import ScannerIntegrationManager


logger = logging.getLogger(__name__)

# Initialize managers
BASE_PATH = "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
project_manager = ProjectManager(f"{BASE_PATH}/projects")
parameter_manager = ParameterManager(f"{BASE_PATH}/projects")
integration_manager = ScannerIntegrationManager(BASE_PATH)

# Active execution tracking
active_executions = {}


# Pydantic models for API requests and responses
class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field("", description="Project description")
    aggregation_method: AggregationMethod = Field(AggregationMethod.UNION, description="Signal aggregation method")
    tags: List[str] = Field(default_factory=list, description="Project tags")


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    aggregation_method: Optional[AggregationMethod] = None
    tags: Optional[List[str]] = None


class AddScannerRequest(BaseModel):
    scanner_id: str = Field(..., description="Scanner identifier")
    scanner_file: str = Field(..., description="Path to scanner file")
    enabled: bool = Field(True, description="Whether scanner is enabled")
    weight: float = Field(1.0, ge=0.0, description="Scanner weight for aggregation")
    order_index: int = Field(0, description="Execution order")


class UpdateScannerRequest(BaseModel):
    enabled: Optional[bool] = None
    weight: Optional[float] = Field(None, ge=0.0)
    order_index: Optional[int] = None


class ExecuteProjectRequest(BaseModel):
    date_range: Dict[str, str] = Field(..., description="Start and end dates")
    symbols: Optional[List[str]] = Field(None, description="Specific symbols to scan")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional scan filters")
    parallel_execution: bool = Field(True, description="Execute scanners in parallel")
    timeout_seconds: int = Field(300, ge=30, le=1800, description="Execution timeout")

    @validator('date_range')
    def validate_date_range(cls, v):
        required_keys = ['start_date', 'end_date']
        for key in required_keys:
            if key not in v:
                raise ValueError(f"Missing required key: {key}")

        try:
            start = datetime.strptime(v['start_date'], '%Y-%m-%d')
            end = datetime.strptime(v['end_date'], '%Y-%m-%d')
            if end <= start:
                raise ValueError("End date must be after start date")
        except ValueError as e:
            raise ValueError(f"Invalid date format: {e}")

        return v


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    aggregation_method: str
    tags: List[str]
    scanner_count: int
    created_at: str
    updated_at: str
    last_executed: Optional[str]
    execution_count: int


class ScannerResponse(BaseModel):
    id: str
    scanner_id: str
    scanner_file: str
    enabled: bool
    weight: float
    order_index: int
    parameter_count: int


class ExecutionResponse(BaseModel):
    execution_id: str
    project_id: str
    status: str
    started_at: str
    total_signals: Optional[int] = None
    execution_time: Optional[float] = None
    scanner_results: Optional[Dict[str, int]] = None


# Create FastAPI app
app = FastAPI(
    title="Project Composition API",
    description="API for managing multi-scanner projects with complete isolation",
    version="1.0.0"
)

# Create router for including in main app
from fastapi import APIRouter
router = APIRouter()


# Project Management Endpoints
@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    try:
        # Create project configuration
        project_config = ProjectConfig(
            project_id="",  # Will be auto-generated
            name=request.name,
            description=request.description,
            scanners=[],  # Start with empty scanners list
            aggregation_method=request.aggregation_method,
            tags=request.tags
        )

        # Save project
        config_path = project_manager.create_project(project_config)

        # Return project response
        return ProjectResponse(
            id=project_config.project_id,
            name=project_config.name,
            description=project_config.description,
            aggregation_method=project_config.aggregation_method.value,
            tags=project_config.tags,
            scanner_count=0,
            created_at=project_config.created_at.isoformat(),
            updated_at=project_config.updated_at.isoformat(),
            last_executed=None,
            execution_count=0
        )

    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {e}")


@app.get("/api/projects", response_model=List[ProjectResponse])
async def list_projects():
    """List all projects"""
    try:
        projects = project_manager.list_projects()

        return [
            ProjectResponse(
                id=project.project_id,
                name=project.name,
                description=project.description,
                aggregation_method=project.aggregation_method.value,
                tags=project.tags,
                scanner_count=len(project.scanners),
                created_at=project.created_at.isoformat(),
                updated_at=project.updated_at.isoformat(),
                last_executed=project.last_executed.isoformat() if project.last_executed else None,
                execution_count=project.execution_count
            )
            for project in projects
        ]

    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {e}")


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a specific project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        return ProjectResponse(
            id=project.project_id,
            name=project.name,
            description=project.description,
            aggregation_method=project.aggregation_method.value,
            tags=project.tags,
            scanner_count=len(project.scanners),
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat(),
            last_executed=project.last_executed.isoformat() if project.last_executed else None,
            execution_count=project.execution_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get project: {e}")


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, request: UpdateProjectRequest):
    """Update a project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Update fields if provided
        if request.name is not None:
            project.name = request.name
        if request.description is not None:
            project.description = request.description
        if request.aggregation_method is not None:
            project.aggregation_method = request.aggregation_method
        if request.tags is not None:
            project.tags = request.tags

        # Save updated project
        project_manager.update_project(project)

        return ProjectResponse(
            id=project.project_id,
            name=project.name,
            description=project.description,
            aggregation_method=project.aggregation_method.value,
            tags=project.tags,
            scanner_count=len(project.scanners),
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat(),
            last_executed=project.last_executed.isoformat() if project.last_executed else None,
            execution_count=project.execution_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        success = project_manager.delete_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")

        return {"message": "Project deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {e}")


# Scanner Management Endpoints
@app.post("/api/projects/{project_id}/scanners", response_model=ScannerResponse)
async def add_scanner_to_project(project_id: str, request: AddScannerRequest):
    """Add a scanner to a project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Create scanner reference
        scanner_ref = ScannerReference(
            scanner_id=request.scanner_id,
            scanner_file=request.scanner_file,
            parameter_file="",  # Will be set by parameter manager
            enabled=request.enabled,
            weight=request.weight,
            order_index=request.order_index
        )

        # Add scanner to project
        project.add_scanner(scanner_ref)

        # Save updated project
        project_manager.update_project(project)

        # Get parameter count
        try:
            parameters = parameter_manager.load_scanner_parameters(project_id, request.scanner_id)
            parameter_count = len(parameters)
        except:
            parameter_count = 0

        return ScannerResponse(
            id=scanner_ref.scanner_id,
            scanner_id=scanner_ref.scanner_id,
            scanner_file=scanner_ref.scanner_file,
            enabled=scanner_ref.enabled,
            weight=scanner_ref.weight,
            order_index=scanner_ref.order_index,
            parameter_count=parameter_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add scanner: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add scanner: {e}")


@app.get("/api/projects/{project_id}/scanners", response_model=List[ScannerResponse])
async def list_project_scanners(project_id: str):
    """List scanners in a project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        scanners = []
        for scanner_ref in project.scanners:
            try:
                parameters = parameter_manager.load_scanner_parameters(project_id, scanner_ref.scanner_id)
                parameter_count = len(parameters)
            except:
                parameter_count = 0

            scanners.append(ScannerResponse(
                id=scanner_ref.scanner_id,
                scanner_id=scanner_ref.scanner_id,
                scanner_file=scanner_ref.scanner_file,
                enabled=scanner_ref.enabled,
                weight=scanner_ref.weight,
                order_index=scanner_ref.order_index,
                parameter_count=parameter_count
            ))

        return scanners

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list scanners: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list scanners: {e}")


@app.put("/api/projects/{project_id}/scanners/{scanner_id}", response_model=ScannerResponse)
async def update_scanner_in_project(project_id: str, scanner_id: str, request: UpdateScannerRequest):
    """Update a scanner in a project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        scanner = project.get_scanner(scanner_id)
        if not scanner:
            raise HTTPException(status_code=404, detail="Scanner not found in project")

        # Update scanner properties
        if request.enabled is not None:
            scanner.enabled = request.enabled
        if request.weight is not None:
            scanner.weight = request.weight
        if request.order_index is not None:
            scanner.order_index = request.order_index

        # Save updated project
        project_manager.update_project(project)

        # Get parameter count
        try:
            parameters = parameter_manager.load_scanner_parameters(project_id, scanner_id)
            parameter_count = len(parameters)
        except:
            parameter_count = 0

        return ScannerResponse(
            id=scanner.scanner_id,
            scanner_id=scanner.scanner_id,
            scanner_file=scanner.scanner_file,
            enabled=scanner.enabled,
            weight=scanner.weight,
            order_index=scanner.order_index,
            parameter_count=parameter_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update scanner: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update scanner: {e}")


@app.delete("/api/projects/{project_id}/scanners/{scanner_id}")
async def remove_scanner_from_project(project_id: str, scanner_id: str):
    """Remove a scanner from a project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        success = project.remove_scanner(scanner_id)
        if not success:
            raise HTTPException(status_code=404, detail="Scanner not found in project")

        # Save updated project
        project_manager.update_project(project)

        return {"message": "Scanner removed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove scanner: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to remove scanner: {e}")


# Parameter Management Endpoints
@app.get("/api/projects/{project_id}/scanners/{scanner_id}/parameters")
async def get_scanner_parameters(project_id: str, scanner_id: str):
    """Get parameters for a scanner"""
    try:
        parameters = parameter_manager.load_scanner_parameters(project_id, scanner_id)
        return {"parameters": parameters}

    except Exception as e:
        logger.error(f"Failed to get parameters: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get parameters: {e}")


@app.put("/api/projects/{project_id}/scanners/{scanner_id}/parameters")
async def update_scanner_parameters(project_id: str, scanner_id: str, parameters: Dict[str, Any]):
    """Update parameters for a scanner"""
    try:
        success = parameter_manager.save_scanner_parameters(project_id, scanner_id, parameters)
        if not success:
            raise HTTPException(status_code=400, detail="Parameter validation failed")

        return {"message": "Parameters updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update parameters: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update parameters: {e}")


@app.get("/api/projects/{project_id}/scanners/{scanner_id}/parameters/history")
async def get_scanner_parameter_history(project_id: str, scanner_id: str):
    """Get parameter history for a scanner"""
    try:
        history = parameter_manager.get_parameter_history(project_id, scanner_id)
        return {
            "history": [snapshot.to_dict() for snapshot in history]
        }

    except Exception as e:
        logger.error(f"Failed to get parameter history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get parameter history: {e}")


# Project Execution Endpoints
@app.post("/api/projects/{project_id}/execute", response_model=ExecutionResponse)
async def execute_project(project_id: str, request: ExecuteProjectRequest, background_tasks: BackgroundTasks):
    """Execute a project (async)"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Validate project has scanners before execution
        if not project.scanners:
            raise HTTPException(status_code=400, detail="Project must contain at least one scanner for execution")

        # Create execution configuration
        execution_config = ExecutionConfig(
            date_range=request.date_range,
            symbols=request.symbols,
            filters=request.filters,
            parallel_execution=request.parallel_execution,
            timeout_seconds=request.timeout_seconds
        )

        # Generate execution ID
        execution_id = f"{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Track execution
        active_executions[execution_id] = {
            'project_id': project_id,
            'status': 'running',
            'started_at': datetime.now(),
            'config': execution_config
        }

        # Start background execution
        background_tasks.add_task(
            execute_project_background,
            execution_id,
            project,
            execution_config
        )

        return ExecutionResponse(
            execution_id=execution_id,
            project_id=project_id,
            status='running',
            started_at=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start project execution: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start execution: {e}")


async def execute_project_background(execution_id: str, project: ProjectConfig, config: ExecutionConfig):
    """Background task for project execution"""
    try:
        # Initialize composition engine
        engine = ProjectCompositionEngine(project)

        # Execute project
        results, report = await engine.execute_project(config)

        # Update execution status
        if execution_id in active_executions:
            active_executions[execution_id].update({
                'status': 'completed',
                'completed_at': datetime.now(),
                'total_signals': len(results.signals),
                'execution_time': report.get('execution_time', 0),
                'scanner_results': report.get('scanner_results_summary', {}),
                'results': results,
                'report': report
            })

        logger.info(f"Project execution completed: {execution_id}")

    except Exception as e:
        logger.error(f"Project execution failed: {e}")
        if execution_id in active_executions:
            active_executions[execution_id].update({
                'status': 'failed',
                'completed_at': datetime.now(),
                'error': str(e)
            })


@app.get("/api/projects/{project_id}/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution_status(project_id: str, execution_id: str):
    """Get execution status"""
    try:
        if execution_id not in active_executions:
            raise HTTPException(status_code=404, detail="Execution not found")

        execution = active_executions[execution_id]

        response = ExecutionResponse(
            execution_id=execution_id,
            project_id=execution['project_id'],
            status=execution['status'],
            started_at=execution['started_at'].isoformat()
        )

        if 'total_signals' in execution:
            response.total_signals = execution['total_signals']
        if 'execution_time' in execution:
            response.execution_time = execution['execution_time']
        if 'scanner_results' in execution:
            response.scanner_results = execution['scanner_results']

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get execution status: {e}")


@app.get("/api/projects/{project_id}/executions/{execution_id}/results")
async def get_execution_results(
    project_id: str,
    execution_id: str,
    format: str = Query("json", description="Response format: json or csv")
):
    """Get execution results"""
    try:
        if execution_id not in active_executions:
            raise HTTPException(status_code=404, detail="Execution not found")

        execution = active_executions[execution_id]

        if execution['status'] != 'completed':
            raise HTTPException(status_code=400, detail="Execution not completed")

        results = execution.get('results')
        if not results:
            raise HTTPException(status_code=404, detail="No results available")

        if format.lower() == 'csv':
            # Return CSV format
            df = results.to_dataframe()
            output = io.StringIO()
            df.to_csv(output, index=False)
            csv_content = output.getvalue()

            return StreamingResponse(
                io.StringIO(csv_content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={execution_id}_results.csv"}
            )
        else:
            # Return JSON format
            return {
                "execution_id": execution_id,
                "project_id": project_id,
                "signals": [signal.to_dict() for signal in results.signals],
                "summary": results.execution_summary,
                "metadata": results.metadata
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get execution results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get execution results: {e}")


# Health and Status Endpoints
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/api/status")
async def get_system_status():
    """Get comprehensive system status"""
    try:
        # Get project count
        projects = project_manager.list_projects()
        project_count = len(projects)

        # Get active execution count
        active_count = len([e for e in active_executions.values() if e['status'] == 'running'])

        # Get integration status
        integration_report = integration_manager.get_integration_report()

        return {
            "system_status": "operational",
            "timestamp": datetime.now().isoformat(),
            "projects": {
                "total": project_count,
                "active_executions": active_count
            },
            "integration": integration_report,
            "memory": {
                "active_executions": len(active_executions),
                "cached_parameters": len(parameter_manager.parameters_cache)
            }
        }

    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        return {
            "system_status": "error",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


# Exception handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    logger.info("Project Composition API starting up...")


# Copy all routes from app to router for inclusion in main app
for route in app.routes:
    router.routes.append(route)

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Project Composition API shutting down...")
    # Clean up active resources
    integration_manager.cleanup_all_wrappers()
    active_executions.clear()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)