"""
Traderra FastAPI Application

Main application entry point for the Traderra trading journal backend.
Integrates Archon MCP for AI knowledge management and PydanticAI for
intelligent trading analysis through Renata.

Architecture:
- FastAPI for REST API and WebSocket endpoints
- Archon MCP for AI knowledge backend
- PydanticAI for conversational AI (Renata)
- PostgreSQL + pgvector for data storage
- Redis for caching and real-time features
"""

import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .core.archon_client import get_archon_client, close_archon_client
from .core.database import init_database, close_connection_pool
from .api.ai_endpoints import router as ai_router, api_router as renata_api_router
from .api.folders import router as folders_router
from .api.blocks import router as blocks_router
from .api.scan_endpoints import router as scan_router
from .api.agui_endpoints import router as agui_router
from .api.trade_upload_endpoints import router as trade_upload_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan management

    Handles startup and shutdown operations including:
    - Archon MCP client initialization
    - Database connections
    - Background task setup
    """
    # Startup
    logger.info("Starting Traderra API server...")

    try:
        # Initialize database
        await init_database()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # Don't fail startup - allow API to run for debugging

    try:
        # Initialize Archon client
        archon = await get_archon_client()
        health = await archon.health_check()

        if health.success:
            logger.info(f"✅ Archon MCP connected successfully: {settings.archon_base_url}")
        else:
            logger.warning(f"⚠️  Archon MCP connection issues: {health.error}")

    except Exception as e:
        logger.error(f"❌ Failed to connect to Archon MCP: {e}")
        # Don't fail startup - allow API to run without Archon for debugging

    logger.info("🚀 Traderra API startup complete")

    yield

    # Shutdown
    logger.info("Shutting down Traderra API...")

    try:
        await close_connection_pool()
        logger.info("✅ Database connection pool closed")
    except Exception as e:
        logger.error(f"Error closing database pool: {e}")

    try:
        await close_archon_client()
        logger.info("✅ Archon MCP client closed")
    except Exception as e:
        logger.error(f"Error closing Archon client: {e}")

    logger.info("👋 Traderra API shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="Traderra API",
    description="AI-powered trading journal and performance analysis platform",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:6565", "http://localhost:3000", "http://127.0.0.1:6565", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.traderra.com"]
    )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An unexpected error occurred",
            "type": "internal_error"
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint

    Returns:
        - API status
        - Archon MCP connectivity
        - System information
    """
    try:
        # Check Archon connectivity
        archon = await get_archon_client()
        archon_health = await archon.health_check()

        return {
            "status": "healthy",
            "api_version": "0.1.0",
            "timestamp": "2025-10-13T20:52:00Z",
            "services": {
                "api": "online",
                "archon_mcp": "online" if archon_health.success else "offline",
                "database": "unknown",  # TODO: Add DB health check
                "redis": "unknown"      # TODO: Add Redis health check
            },
            "archon": {
                "connected": archon_health.success,
                "project_id": archon.project_id,
                "base_url": settings.archon_base_url
            }
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "api_version": "0.1.0",
            "error": str(e),
            "services": {
                "api": "online",
                "archon_mcp": "offline"
            }
        }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Traderra API",
        "description": "AI-powered trading journal and performance analysis platform",
        "version": "0.1.0",
        "docs": "/docs" if settings.debug else "Documentation not available in production",
        "ai_features": {
            "renata_agent": "Professional trading AI with three personality modes",
            "archon_integration": "Knowledge graph-powered insights",
            "modes": ["analyst", "coach", "mentor"]
        },
        "endpoints": {
            "health": "/health",
            "ai_query": "/ai/query",
            "ai_analyze": "/ai/analyze",
            "ai_status": "/ai/status",
            "knowledge_search": "/ai/knowledge/search",
            "scan_execute": "/api/scan/execute",
            "scan_status": "/api/scan/status/{scan_id}",
            "scan_list": "/api/scan/list"
        }
    }


# Include routers
app.include_router(ai_router)
app.include_router(renata_api_router)  # /api/renata/* for frontend compatibility
app.include_router(folders_router)
app.include_router(blocks_router, prefix="/api/blocks", tags=["blocks"])
app.include_router(scan_router)
app.include_router(agui_router)
app.include_router(trade_upload_router)


# Development middleware and routes
if settings.debug:
    @app.get("/debug/archon")
    async def debug_archon():
        """Debug endpoint to test Archon connectivity"""
        try:
            archon = await get_archon_client()

            # Test basic connectivity
            health = await archon.health_check()

            # Test knowledge search
            search_result = await archon.search_trading_knowledge(
                query="trading performance test",
                match_count=2
            )

            return {
                "archon_config": {
                    "base_url": settings.archon_base_url,
                    "project_id": settings.archon_project_id,
                    "timeout": settings.archon_timeout
                },
                "health_check": {
                    "success": health.success,
                    "data": health.data,
                    "error": health.error
                },
                "search_test": {
                    "success": search_result.success,
                    "results_count": len(search_result.data) if search_result.data else 0,
                    "error": search_result.error
                }
            }

        except Exception as e:
            return {
                "error": str(e),
                "type": "debug_error"
            }

    @app.get("/debug/renata")
    async def debug_renata():
        """Debug endpoint to test Renata AI functionality"""
        try:
            from .ai.renata_agent import (
                create_renata_agent,
                PerformanceData,
                TradingContext,
                UserPreferences,
                RenataMode
            )

            archon = await get_archon_client()
            renata = create_renata_agent(archon)

            # Mock data for testing
            performance_data = PerformanceData(
                trades_count=25,
                win_rate=0.56,
                expectancy=0.82,
                total_pnl=1250.0,
                avg_winner=95.0,
                avg_loser=-68.0,
                max_drawdown=0.08,
                profit_factor=1.39
            )

            trading_context = TradingContext(
                user_id="debug_user",
                workspace_id="debug_workspace"
            )

            user_preferences = UserPreferences(
                ai_mode=RenataMode.COACH,
                verbosity="normal"
            )

            # Test Renata analysis
            result = await renata.analyze_performance(
                performance_data=performance_data,
                trading_context=trading_context,
                user_preferences=user_preferences,
                prompt="Analyze my recent performance"
            )

            return {
                "renata_test": {
                    "success": True,
                    "response": result.text,
                    "mode_used": result.mode_used.value if result.mode_used else None,
                    "archon_sources": result.archon_sources,
                    "insights_generated": result.insights_generated
                },
                "test_data": {
                    "performance": performance_data.dict(),
                    "context": trading_context.dict(),
                    "preferences": user_preferences.dict()
                }
            }

        except Exception as e:
            logger.error(f"Renata debug test failed: {e}", exc_info=True)
            return {
                "error": str(e),
                "type": "renata_debug_error"
            }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=6500,
        reload=settings.debug,
        log_level="info"
    )