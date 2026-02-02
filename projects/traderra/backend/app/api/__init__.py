"""
API Package for Traderra Backend

This package contains all FastAPI routers and endpoints for the Traderra application.
Includes AI endpoints, learning endpoints, and other core functionality.
"""

from fastapi import APIRouter
from .ai_endpoints import router as ai_router
from .learning_endpoints import router as learning_router

# Create main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(ai_router, tags=["AI"])
api_router.include_router(learning_router, tags=["Learning"])

# Export for use in main app
__all__ = ["api_router", "ai_router", "learning_router"]