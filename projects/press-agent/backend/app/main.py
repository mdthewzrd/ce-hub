"""
Press Agent - FastAPI Main Application
Press release automation platform with multi-agent AI workflow
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid

from .core.config import settings
from .core.database import get_db, init_db, close_db
from .core.archon_client import get_archon_client
from .services.openrouter_service import get_openrouter_service


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Press release automation platform with multi-agent AI",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database and connections on startup"""
    await init_db()
    print(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Close connections on shutdown"""
    await close_db()
    archon_client = await get_archon_client()
    await archon_client.close()
    openrouter_service = get_openrouter_service()
    await openrouter_service.close()


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else None,
        "health": "/health",
    }


# Pydantic models for requests/responses
class HealthResponse(BaseModel):
    status: str
    app: str
    version: str


class OnboardingMessage(BaseModel):
    message: str
    request_id: Optional[str] = None
    client_id: Optional[str] = None


class OnboardingResponse(BaseModel):
    complete: bool
    message: Optional[str] = None
    collected_info: Dict[str, Any] = {}
    next_action: Optional[str] = None


# API Routes will be organized in separate router modules
# For now, basic endpoints are defined here

@app.post(
    "/api/v1/onboarding/message",
    response_model=OnboardingResponse,
    tags=["Onboarding"],
)
async def onboarding_message(
    data: OnboardingMessage,
    db: AsyncSession = Depends(get_db),
):
    """
    Process a message during client onboarding chat
    """
    from .agents.onboarding_agent import OnboardingAgent

    agent = OnboardingAgent()

    # For now, return a simple response
    # Full implementation will process the message through the agent
    return OnboardingResponse(
        complete=False,
        message="Onboarding endpoint - implementation in progress",
        collected_info={},
        next_action="continue_onboarding",
    )


@app.get(
    "/api/v1/requests/{request_id}",
    tags=["Requests"],
)
async def get_press_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a press request by ID
    """
    return {
        "request_id": request_id,
        "status": "in_progress",
        "message": "Endpoint implementation in progress",
    }


@app.get("/api/v1/archon/health", tags=["Archon"])
async def archon_health():
    """Check Archon MCP connection status"""
    archon_client = await get_archon_client()
    is_healthy = await archon_client.health_check()
    return {
        "archon_connected": is_healthy,
        "archon_url": settings.ARCHON_MCP_URL,
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
