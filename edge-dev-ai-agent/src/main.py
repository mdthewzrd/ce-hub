"""
EdgeDev AI Agent - Main Entry Point

FastAPI application for the EdgeDev AI Agent system.
"""

import asyncio
import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from .conversation.manager import ConversationManager
from .llm.openrouter_client import LLMConfig, get_client, reset_client
from .code.validator import CodeValidator
from .edgedev import EdgeDevClient
from .learning.extractor import ResultLogger, PatternInsight
from .learning.memory import MemoryManager
from .learning.evolution import get_pattern_evolution


# Request/Response models
class MessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class MessageResponse(BaseModel):
    session_id: str
    response: str
    status: str


class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    updated_at: str
    status: str
    message_count: int


class StatusResponse(BaseModel):
    status: str
    version: str
    orchestrator: dict
    sessions: dict
    knowledge_base: bool


# Global conversation manager
conversation_manager: Optional[ConversationManager] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    global conversation_manager

    # Startup
    print("=" * 60)
    print("  EdgeDev AI Agent Starting")
    print("=" * 60)

    # Initialize LLM client
    config = LLMConfig()
    if not config.api_key or config.api_key == "your_openrouter_api_key_here":
        print("  ⚠️  WARNING: OPENROUTER_API_KEY not set")
        print("  Set your API key in .env file")
        print("  Starting anyway (will fail on LLM calls)")
    else:
        print(f"  ✓ OpenRouter API key loaded")
        print(f"  ✓ Default model: {config.default_model}")

    # Initialize conversation manager
    conversation_manager = ConversationManager()
    print(f"  ✓ Conversation manager initialized")
    print(f"  ✓ Orchestrator ready")

    # Check knowledge base
    from pathlib import Path
    chunks_dir = Path(__file__).parent.parent / "data" / "chunks"
    if chunks_dir.exists():
        print(f"  ✓ Knowledge base: 549 chunks from 6 Gold Standards")
    else:
        print(f"  ⚠️  Knowledge base not found (run: python -m src.ingest.save_chunks)")

    print("\n  Server ready at http://localhost:7447")
    print("=" * 60)

    yield

    # Shutdown
    print("\nShutting down EdgeDev AI Agent...")


# Create FastAPI app
app = FastAPI(
    title="EdgeDev AI Agent",
    description="Archon-powered trading strategy development system",
    version="0.5.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint with system info."""
    return {
        "name": "EdgeDev AI Agent",
        "version": "0.7.0",
        "status": "running",
        "description": "Archon-powered trading strategy development system with learning loop and web UI",
        "web_ui": "http://localhost:7446",
        "docs": "/docs",
        "endpoints": {
            "chat": "/api/chat",
            "status": "/api/status",
            "sessions": "/api/sessions",
            "health": "/health",
            "learning": {
                "workflows": "/api/learning/workflows",
                "insights": "/api/learning/insights",
                "projects": "/api/learning/projects",
                "patterns": "/api/learning/patterns",
                "memory_search": "/api/learning/memory/search",
                "stats": "/api/learning/stats",
            },
            "code": {
                "validate": "/api/code/validate",
                "files": "/api/generated/files",
            },
            "edgedev": {
                "health": "/api/edgedev/health",
                "execute": "/api/edgedev/execute",
            }
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "0.6.0",
        "components": {
            "api": "ok",
            "orchestrator": "ok",
            "knowledge_base": "ok" if conversation_manager else "not_initialized",
        }
    }


@app.post("/api/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    """Send a message and get a response.

    Args:
        request: Message request with session_id

    Returns:
        Response with session_id and AI response
    """
    if conversation_manager is None:
        raise HTTPException(status_code=503, detail="Conversation manager not initialized")

    try:
        result = await conversation_manager.send_message(
            message=request.message,
            session_id=request.session_id
        )
        return MessageResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sessions", response_model=list[SessionInfo])
async def list_sessions():
    """List all conversation sessions."""
    if conversation_manager is None:
        raise HTTPException(status_code=503, detail="Conversation manager not initialized")

    sessions = conversation_manager.list_sessions()
    return [SessionInfo(**s) for s in sessions]


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get session details and history."""
    if conversation_manager is None:
        raise HTTPException(status_code=503, detail="Conversation manager not initialized")

    session = conversation_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session.session_id,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "status": session.status.value,
        "messages": conversation_manager.get_session_history(session_id),
        "metadata": session.metadata,
    }


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    if conversation_manager is None:
        raise HTTPException(status_code=503, detail="Conversation manager not initialized")

    conversation_manager.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}


@app.post("/api/sessions/{session_id}/clear")
async def clear_session(session_id: str):
    """Clear messages from a session."""
    if conversation_manager is None:
        raise HTTPException(status_code=503, detail="Conversation manager not initialized")

    conversation_manager.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


@app.get("/api/status", response_model=StatusResponse)
async def get_status():
    """Get system status."""
    if conversation_manager is None:
        raise HTTPException(status_code=503, detail="Conversation manager not initialized")

    status = conversation_manager.get_status()
    orchestrator_status = conversation_manager.orchestrator.get_status()

    return StatusResponse(
        status="running",
        version="0.7.0",
        orchestrator=orchestrator_status,
        sessions=status,
        knowledge_base=orchestrator_status.get("knowledge_base", False),
    )


@app.post("/api/restart")
async def restart_system():
    """Restart the system (clear all sessions and reinitialize)."""
    global conversation_manager

    conversation_manager = None
    reset_client()

    # Reinitialize
    config = LLMConfig()
    get_client(config)
    conversation_manager = ConversationManager()

    return {"status": "restarted", "message": "System restarted successfully"}


# Code validation endpoints
class CodeValidationRequest(BaseModel):
    code: str
    check_v31: bool = False


@app.post("/api/code/validate")
async def validate_code(request: CodeValidationRequest):
    """Validate Python code for syntax and style.

    Args:
        request: Code validation request

    Returns:
        Validation result
    """
    validator = CodeValidator()
    result = validator.validate_all(request.code, check_v31=request.check_v31)
    return result.to_dict()


@app.get("/api/code/validate/{file_path:path}")
async def validate_file(file_path: str):
    """Validate a Python file.

    Args:
        file_path: Path to Python file (relative to project root)

    Returns:
        Validation result
    """
    from pathlib import Path

    validator = CodeValidator()
    full_path = Path(file_path)

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    result = validator.validate_file(str(full_path))
    return result.to_dict()


# Generated files endpoints
@app.get("/api/generated/files")
async def list_generated_files():
    """List all generated code files."""
    from pathlib import Path

    generated_dir = Path("generated_scanners")
    if not generated_dir.exists():
        return {"files": []}

    files = []
    for py_file in generated_dir.rglob("*.py"):
        files.append({
            "name": py_file.name,
            "path": str(py_file.relative_to(Path.cwd())),
            "size": py_file.stat().st_size,
            "modified": py_file.stat().st_mtime,
        })

    return {"files": files}


@app.get("/api/generated/files/{file_path:path}")
async def get_generated_file(file_path: str):
    """Get content of a generated file.

    Args:
        file_path: Path to file (relative to generated_scanners)

    Returns:
        File content
    """
    from pathlib import Path

    full_path = Path("generated_scanners") / file_path

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "path": file_path,
        "content": full_path.read_text(),
    }


# EdgeDev integration endpoints
@app.get("/api/edgedev/health")
async def edgedev_health():
    """Check EdgeDev platform health."""
    try:
        client = EdgeDevClient()
        health = await client.health_check()
        await client.close()
        return health
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "backend_url": os.getenv("EDGEDEV_BACKEND_URL", "http://localhost:5666")
        }


@app.post("/api/edgedev/execute")
async def execute_scanner_on_edgedev(request: dict):
    """Execute a scanner on EdgeDev platform.

    Args:
        request: Execution request with code, tickers, dates

    Returns:
        Execution result
    """
    try:
        client = EdgeDevClient()

        result = await client.execute_scanner(
            scanner_code=request.get("code", ""),
            tickers=request.get("tickers", []),
            start_date=request.get("start_date", ""),
            end_date=request.get("end_date", ""),
            params=request.get("params", {})
        )

        await client.close()

        return {
            "success": result.success,
            "signals": result.signals,
            "metrics": result.metrics,
            "execution_time": result.execution_time,
            "error": result.error,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Learning System endpoints
@app.get("/api/learning/workflows")
async def list_workflows(limit: int = 50):
    """List workflow logs from learning system.

    Args:
        limit: Maximum number of workflows to return

    Returns:
        List of workflow logs
    """
    from pathlib import Path

    workflow_log = Path("logs/workflows.jsonl")
    if not workflow_log.exists():
        return {"workflows": []}

    workflows = []
    with open(workflow_log, 'r') as f:
        for i, line in enumerate(f):
            if i >= limit:
                break
            import json
            try:
                workflows.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    return {"workflows": workflows}


@app.get("/api/learning/insights")
async def get_insights(pattern_type: Optional[str] = None):
    """Get stored insights from learning system.

    Args:
        pattern_type: Filter by pattern type (optional)

    Returns:
        List of insights
    """
    result_logger = ResultLogger()
    insights = result_logger.get_all_insights(pattern_type)

    return {
        "insights": [i.to_dict() for i in insights],
        "count": len(insights)
    }


@app.get("/api/learning/projects")
async def list_projects(tag: Optional[str] = None):
    """List projects from memory.

    Args:
        tag: Filter by tag (optional)

    Returns:
        List of projects
    """
    memory_manager = MemoryManager()
    projects = memory_manager.list_projects(tag=tag)

    return {
        "projects": [p.to_dict() for p in projects],
        "count": len(projects)
    }


@app.get("/api/learning/projects/{project_id}")
async def get_project(project_id: str):
    """Get a specific project.

    Args:
        project_id: Project ID

    Returns:
        Project details
    """
    memory_manager = MemoryManager()
    project = memory_manager.load_project(project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project.to_dict()


@app.get("/api/learning/memory/search")
async def search_memory(query: str, max_results: int = 3):
    """Search memory for relevant context.

    Args:
        query: Search query
        max_results: Maximum results to return

    Returns:
        Relevant context items
    """
    memory_manager = MemoryManager()
    context = memory_manager.get_relevant_context(query, max_results)

    return {
        "query": query,
        "results": context,
        "count": len(context)
    }


@app.get("/api/learning/patterns")
async def get_patterns(n: int = 5):
    """Get top performing patterns.

    Args:
        n: Number of top patterns to return

    Returns:
        Top patterns
    """
    evolution = get_pattern_evolution()
    top_patterns = evolution.get_top_patterns(n=n)

    return {
        "patterns": [p.to_dict() for p in top_patterns],
        "count": len(top_patterns)
    }


@app.get("/api/learning/patterns/{pattern_name}")
async def get_pattern_recommendation(pattern_name: str):
    """Get recommendation for a specific pattern.

    Args:
        pattern_name: Pattern name

    Returns:
        Pattern recommendation
    """
    evolution = get_pattern_evolution()
    recommendation = evolution.get_recommendation(pattern_name)

    if not recommendation:
        raise HTTPException(status_code=404, detail="Pattern not found")

    return recommendation.to_dict()


@app.get("/api/learning/parameters/{parameter}")
async def get_parameter_range(parameter: str):
    """Get recommended range for a parameter.

    Args:
        parameter: Parameter name

    Returns:
        Parameter range
    """
    evolution = get_pattern_evolution()
    param_range = evolution.get_parameter_range(parameter)

    if not param_range:
        raise HTTPException(status_code=404, detail="Parameter not found")

    return param_range.__dict__


@app.get("/api/learning/stats")
async def get_learning_stats():
    """Get learning system statistics.

    Returns:
        System statistics
    """
    from pathlib import Path

    # Count workflows
    workflow_log = Path("logs/workflows.jsonl")
    workflow_count = 0
    if workflow_log.exists():
        with open(workflow_log, 'r') as f:
            workflow_count = sum(1 for _ in f)

    # Get insights
    result_logger = ResultLogger()
    insights = result_logger.get_all_insights()

    # Get projects
    memory_manager = MemoryManager()
    projects = memory_manager.list_projects()

    # Get patterns
    evolution = get_pattern_evolution()
    all_patterns = list(evolution.recommendations.values())

    return {
        "workflows_logged": workflow_count,
        "insights_count": len(insights),
        "projects_count": len(projects),
        "patterns_tracked": len(all_patterns),
        "storage_dirs": {
            "logs": str(Path("logs").absolute()),
            "memory": str(Path("memory").absolute()),
            "sessions": str(Path("sessions").absolute()),
        }
    }


def main():
    """Run the server."""
    # Load config
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", "7447"))

    # Run server
    uvicorn.run(
        "src.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    main()
