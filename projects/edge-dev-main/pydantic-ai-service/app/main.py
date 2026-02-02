"""
Edge.dev Trading Agent Service
FastAPI application with PydanticAI integration for enhanced trading workflows
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import os
from typing import Dict, List

from app.core.config import settings
from app.agents.trading_agent import TradingAgent
from app.agents.scan_creator import ScanCreatorAgent
from app.agents.backtest_generator import BacktestGeneratorAgent
from app.agents.parameter_optimizer import ParameterOptimizerAgent
from app.models.schemas import (
    ScanCreationRequest,
    BacktestRequest,
    ParameterOptimizationRequest,
    AgentResponse,
    WebSocketMessage
)
from app.core.websocket_manager import WebSocketManager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize global agents and managers
trading_agent = TradingAgent()
scan_creator = ScanCreatorAgent()
backtest_generator = BacktestGeneratorAgent()
parameter_optimizer = ParameterOptimizerAgent()
websocket_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Edge.dev Trading Agent Service")

    # Initialize agents
    await trading_agent.initialize()
    await scan_creator.initialize()
    await backtest_generator.initialize()
    await parameter_optimizer.initialize()

    logger.info("✅ All agents initialized successfully")
    yield

    # Cleanup
    logger.info("🛑 Shutting down Trading Agent Service")


# Create FastAPI app
app = FastAPI(
    title="Edge.dev Trading Agent Service",
    description="PydanticAI-powered trading workflows for Edge.dev",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "edge-dev-trading-agent",
        "version": "0.1.0",
        "agents": {
            "trading_agent": trading_agent.is_ready(),
            "scan_creator": scan_creator.is_ready(),
            "backtest_generator": backtest_generator.is_ready(),
            "parameter_optimizer": parameter_optimizer.is_ready()
        }
    }


@app.post("/api/agent/scan/create")
async def create_scan(request: ScanCreationRequest) -> AgentResponse:
    """
    Create a new scan using AI assistance
    """
    try:
        logger.info(f"Creating scan: {request.description}")

        response = await scan_creator.create_scan(
            description=request.description,
            market_conditions=request.market_conditions,
            preferences=request.preferences,
            existing_scanners=request.existing_scanners
        )

        return AgentResponse(
            success=True,
            message="Scan created successfully",
            data=response,
            agent_type="scan_creator"
        )

    except Exception as e:
        logger.error(f"Scan creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agent/backtest/generate")
async def generate_backtest(request: BacktestRequest) -> AgentResponse:
    """
    Generate backtest configuration from strategy description
    """
    try:
        logger.info(f"Generating backtest for strategy: {request.strategy_name}")

        response = await backtest_generator.generate_backtest(
            strategy_description=request.strategy_description,
            scan_parameters=request.scan_parameters,
            timeframe=request.timeframe,
            market_conditions=request.market_conditions
        )

        return AgentResponse(
            success=True,
            message="Backtest generated successfully",
            data=response,
            agent_type="backtest_generator"
        )

    except Exception as e:
        logger.error(f"Backtest generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/agent/parameters/optimize")
async def optimize_parameters(request: ParameterOptimizationRequest) -> AgentResponse:
    """
    Optimize scan parameters using AI analysis
    """
    try:
        logger.info(f"Optimizing parameters for scan: {request.scan_id}")

        response = await parameter_optimizer.optimize_parameters(
            current_parameters=request.current_parameters,
            performance_metrics=request.performance_metrics,
            optimization_goals=request.optimization_goals,
            historical_data=request.historical_data
        )

        return AgentResponse(
            success=True,
            message="Parameters optimized successfully",
            data=response,
            agent_type="parameter_optimizer"
        )

    except Exception as e:
        logger.error(f"Parameter optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agent/patterns/analyze")
async def analyze_patterns(
    timeframe: str = "1D",
    market_conditions: str = "bullish",
    volume_threshold: float = 1000000
) -> AgentResponse:
    """
    Analyze market patterns using AI
    """
    try:
        logger.info(f"Analyzing patterns: {timeframe}, {market_conditions}")

        response = await trading_agent.analyze_patterns(
            timeframe=timeframe,
            market_conditions=market_conditions,
            volume_threshold=volume_threshold
        )

        return AgentResponse(
            success=True,
            message="Pattern analysis completed",
            data=response,
            agent_type="trading_agent"
        )

    except Exception as e:
        logger.error(f"Pattern analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/agent")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time AI agent communication
    """
    await websocket_manager.connect(websocket)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message = WebSocketMessage(**data)

            logger.info(f"WebSocket message received: {message.type}")

            # Route message to appropriate agent
            if message.type == "scan_creation":
                response = await scan_creator.handle_websocket_message(message)
            elif message.type == "backtest_generation":
                response = await backtest_generator.handle_websocket_message(message)
            elif message.type == "parameter_optimization":
                response = await parameter_optimizer.handle_websocket_message(message)
            elif message.type == "pattern_analysis":
                response = await trading_agent.handle_websocket_message(message)
            else:
                response = {
                    "type": "error",
                    "message": f"Unknown message type: {message.type}"
                }

            # Send response back to client
            await websocket_manager.send_personal_message(response, websocket)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
        websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket_manager.send_personal_message(
            {"type": "error", "message": str(e)},
            websocket
        )


@app.get("/api/agent/status")
async def get_agent_status():
    """
    Get status of all AI agents
    """
    return {
        "agents": {
            "trading_agent": {
                "ready": trading_agent.is_ready(),
                "model": trading_agent.get_model_info(),
                "last_activity": trading_agent.get_last_activity()
            },
            "scan_creator": {
                "ready": scan_creator.is_ready(),
                "model": scan_creator.get_model_info(),
                "last_activity": scan_creator.get_last_activity()
            },
            "backtest_generator": {
                "ready": backtest_generator.is_ready(),
                "model": backtest_generator.get_model_info(),
                "last_activity": backtest_generator.get_last_activity()
            },
            "parameter_optimizer": {
                "ready": parameter_optimizer.is_ready(),
                "model": parameter_optimizer.get_model_info(),
                "last_activity": parameter_optimizer.get_last_activity()
            }
        },
        "websocket_connections": len(websocket_manager.active_connections)
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "internal_error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )