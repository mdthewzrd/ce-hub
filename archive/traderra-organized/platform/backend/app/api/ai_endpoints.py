"""
Traderra AI API Endpoints

FastAPI endpoints for AI operations including Renata interactions,
performance analysis, and knowledge management through Archon integration.

Following CE-Hub principles:
- All AI operations use Archon-First protocol
- Systematic Plan → Research → Produce → Ingest workflow
- Context preservation and learning accumulation
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..core.dependencies import AIContext, get_ai_context
from ..core.config import AIModelConfig, settings
from ..ai.renata_agent import (
    RenataAgent,
    create_renata_agent,
    RenataMode,
    UserPreferences,
    TradingContext,
    PerformanceData,
    RenataResponse
)

router = APIRouter(prefix="/ai", tags=["AI"])


# Request/Response Models
class AIQueryRequest(BaseModel):
    """Request for general AI query"""
    prompt: str = Field(description="User question or analysis request")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    mode: Optional[RenataMode] = Field(None, description="Override default AI mode")


class PerformanceAnalysisRequest(BaseModel):
    """Request for performance analysis"""
    time_range: Optional[str] = Field("week", description="Analysis time range")
    symbols: Optional[List[str]] = Field(None, description="Filter by symbols")
    strategies: Optional[List[str]] = Field(None, description="Filter by strategies")
    include_open_positions: bool = Field(False, description="Include open P&L")
    basis: str = Field("gross", description="gross or net")
    unit: str = Field("r_multiple", description="percent, absolute, or r_multiple")


class AIResponse(BaseModel):
    """Standardized AI response"""
    success: bool
    response: str
    mode_used: str
    data: Optional[Dict[str, Any]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    archon_sources: Optional[List[str]] = None
    insights_generated: Optional[List[str]] = None
    timestamp: str


class ArchonStatusResponse(BaseModel):
    """Archon connection status"""
    connected: bool
    health: Optional[Dict[str, Any]] = None
    project_id: str
    last_query_time: Optional[str] = None


class AIModelInfo(BaseModel):
    """Information about an AI model"""
    provider: str
    model: str
    display_name: str
    available: bool


class AIModelConfigResponse(BaseModel):
    """Available AI models configuration"""
    providers: Dict[str, Dict[str, Any]]
    default_provider: str
    default_model: str
    available_models: List[AIModelInfo]


class UpdateModelRequest(BaseModel):
    """Request to update AI model selection"""
    provider: str = Field(description="AI provider (openai, anthropic, google)")
    model: str = Field(description="Model identifier")


class UpdateModelResponse(BaseModel):
    """Response for model update"""
    success: bool
    provider: str
    model: str
    display_name: str
    message: str


@router.get("/models", response_model=AIModelConfigResponse)
async def get_ai_models():
    """
    Get available AI models and current configuration

    Returns all available AI models organized by provider, along with
    the current default provider and model configuration.
    """
    try:
        providers_config = AIModelConfig.get_available_models()
        default_provider, default_model = AIModelConfig.get_default_model()

        # Build flat list of available models
        available_models = []
        for provider_id, provider_info in providers_config.items():
            for model_id in provider_info["models"]:
                available_models.append(AIModelInfo(
                    provider=provider_id,
                    model=model_id,
                    display_name=AIModelConfig.get_model_display_name(provider_id, model_id),
                    available=provider_info["available"]
                ))

        return AIModelConfigResponse(
            providers=providers_config,
            default_provider=default_provider,
            default_model=default_model,
            available_models=available_models
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI model configuration: {str(e)}"
        )


@router.post("/models/select", response_model=UpdateModelResponse)
async def select_ai_model(request: UpdateModelRequest):
    """
    Select AI model for Renata interactions

    Updates the active AI model for the current session. Note: This is a
    session-level change and doesn't persist across restarts.
    """
    try:
        # Validate the model configuration
        if not AIModelConfig.validate_model_config(request.provider, request.model):
            available_models = AIModelConfig.get_available_models()
            provider_available = request.provider in available_models

            if not provider_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Provider '{request.provider}' is not available. Available providers: {list(available_models.keys())}"
                )

            provider_config = available_models[request.provider]
            if not provider_config["available"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Provider '{request.provider}' is not configured (missing API key)"
                )

            if request.model not in provider_config["models"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Model '{request.model}' is not available for provider '{request.provider}'. Available models: {provider_config['models']}"
                )

        # TODO: Implement session-level model selection
        # For now, we'll just validate and return success
        display_name = AIModelConfig.get_model_display_name(request.provider, request.model)

        return UpdateModelResponse(
            success=True,
            provider=request.provider,
            model=request.model,
            display_name=display_name,
            message=f"Model selected: {display_name} (Note: Session-level selection not yet implemented)"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to select AI model: {str(e)}"
        )


@router.get("/status", response_model=ArchonStatusResponse)
async def get_ai_status(ai_ctx: AIContext = Depends(get_ai_context)):
    """
    Get AI system status including Archon connectivity

    This endpoint verifies that the Archon MCP integration is working
    and provides system health information.
    """
    try:
        # Check Archon health
        health_response = await ai_ctx.archon.health_check()

        return ArchonStatusResponse(
            connected=health_response.success,
            health=health_response.data,
            project_id=ai_ctx.archon.project_id,
            last_query_time=datetime.now().isoformat()
        )

    except Exception as e:
        return ArchonStatusResponse(
            connected=False,
            health={"error": str(e)},
            project_id=ai_ctx.archon.project_id
        )


@router.post("/query", response_model=AIResponse)
async def ai_query(
    request: AIQueryRequest,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    General AI query endpoint for conversational interactions with Renata

    This endpoint handles general questions, requests for analysis,
    and conversational interactions with the Renata AI agent.

    Example queries:
    - "Summarize my performance this week"
    - "What patterns do you see in my losing trades?"
    - "How can I improve my risk management?"
    """
    try:
        # Create Renata agent with Archon integration
        renata = create_renata_agent(ai_ctx.archon)

        # Get user preferences (mock for now)
        user_prefs = UserPreferences(
            ai_mode=request.mode or RenataMode.COACH,
            verbosity="normal",
            stats_basis="gross",
            unit_mode="r_multiple"
        )

        # Create trading context
        trading_ctx = TradingContext(
            user_id=ai_ctx.user_id,
            workspace_id=ai_ctx.workspace_id,
            current_filters=request.context
        )

        # For general queries, we need to get performance data
        # This is a simplified version - would normally query database
        mock_performance = PerformanceData(
            trades_count=42,
            win_rate=0.52,
            expectancy=0.75,
            total_pnl=2150.0,
            avg_winner=125.0,
            avg_loser=-85.0,
            max_drawdown=0.15,
            profit_factor=1.47
        )

        # Analyze with Renata
        result = await renata.analyze_performance(
            performance_data=mock_performance,
            trading_context=trading_ctx,
            user_preferences=user_prefs,
            prompt=request.prompt
        )

        return AIResponse(
            success=True,
            response=result.text,
            mode_used=result.mode_used.value if result.mode_used else "coach",
            data=result.data,
            actions=result.actions,
            archon_sources=result.archon_sources,
            insights_generated=result.insights_generated,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI query failed: {str(e)}"
        )


@router.post("/analyze", response_model=AIResponse)
async def analyze_performance(
    request: PerformanceAnalysisRequest,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Dedicated performance analysis endpoint

    This endpoint performs comprehensive performance analysis using
    Renata AI with Archon knowledge integration.

    The analysis follows CE-Hub workflow:
    1. PLAN: Define analysis parameters
    2. RESEARCH: Query Archon for relevant patterns
    3. PRODUCE: Generate AI analysis
    4. INGEST: Store insights for future use
    """
    try:
        # Create Renata agent
        renata = create_renata_agent(ai_ctx.archon)

        # TODO: Query actual performance data from database
        # For now, using mock data
        performance_data = PerformanceData(
            trades_count=67,
            win_rate=0.48,
            expectancy=0.83,
            total_pnl=3420.0,
            avg_winner=180.0,
            avg_loser=-95.0,
            max_drawdown=0.12,
            profit_factor=1.52
        )

        # Set up context and preferences
        trading_ctx = TradingContext(
            user_id=ai_ctx.user_id,
            workspace_id=ai_ctx.workspace_id,
            time_range={"period": request.time_range},
            symbols=request.symbols,
            strategies=request.strategies
        )

        user_prefs = UserPreferences(
            ai_mode=RenataMode.COACH,  # Default for analysis
            verbosity="normal",
            stats_basis=request.basis,
            unit_mode=request.unit
        )

        # Perform analysis
        result = await renata.analyze_performance(
            performance_data=performance_data,
            trading_context=trading_ctx,
            user_preferences=user_prefs
        )

        return AIResponse(
            success=True,
            response=result.text,
            mode_used=result.mode_used.value if result.mode_used else "coach",
            data={
                "performance_metrics": performance_data.dict(),
                "analysis_context": trading_ctx.dict()
            },
            archon_sources=result.archon_sources,
            insights_generated=result.insights_generated,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Performance analysis failed: {str(e)}"
        )


@router.get("/knowledge/search")
async def search_knowledge(
    query: str,
    source_id: Optional[str] = None,
    match_count: int = 5,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Direct access to Archon knowledge search

    This endpoint allows direct querying of the Archon knowledge base
    for trading patterns, insights, and historical context.

    Useful for:
    - Exploring available knowledge
    - Research phase of development
    - Understanding AI decision context
    """
    try:
        # Search Archon knowledge base
        results = await ai_ctx.archon.search_trading_knowledge(
            query=query,
            source_id=source_id,
            match_count=match_count
        )

        if not results.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Knowledge search failed: {results.error}"
            )

        return {
            "success": True,
            "query": query,
            "results": results.data,
            "metadata": results.metadata,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Knowledge search error: {str(e)}"
        )


@router.post("/knowledge/ingest")
async def ingest_insight(
    insight_data: Dict[str, Any],
    tags: List[str],
    insight_type: str,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Ingest new insights into Archon knowledge base

    This endpoint implements the INGEST phase of the CE-Hub workflow,
    allowing manual or automated ingestion of trading insights.
    """
    try:
        from ..core.archon_client import TradingInsight

        # Create insight object
        insight = TradingInsight(
            content=insight_data,
            tags=tags,
            insight_type=insight_type,
            metadata={
                "user_id": ai_ctx.user_id,
                "workspace_id": ai_ctx.workspace_id,
                "ingestion_method": "manual_api"
            }
        )

        # Ingest to Archon
        result = await ai_ctx.archon.ingest_trading_insight(insight)

        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Insight ingestion failed: {result.error}"
            )

        return {
            "success": True,
            "document_id": result.metadata.get("document_id"),
            "insight_type": insight_type,
            "tags": tags,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Insight ingestion error: {str(e)}"
        )


@router.get("/modes")
async def get_ai_modes():
    """
    Get available AI modes and their descriptions

    Returns information about Renata's three personality modes:
    Analyst, Coach, and Mentor.
    """
    return {
        "modes": [
            {
                "mode": "analyst",
                "name": "Analyst",
                "description": "Direct, data-focused, minimal emotion. Reports raw performance truth.",
                "traits": ["Clinical tone", "Metric-driven", "Unfiltered feedback", "Compact responses"]
            },
            {
                "mode": "coach",
                "name": "Coach",
                "description": "Constructive guidance with accountability. Frames observations as correctable actions.",
                "traits": ["Professional tone", "Forward-looking", "Actionable suggestions", "Balanced feedback"]
            },
            {
                "mode": "mentor",
                "name": "Mentor",
                "description": "Reflective insights and long-term perspective. Correlates data with human patterns.",
                "traits": ["Reflective tone", "Pattern-focused", "Contextual awareness", "Narrative style"]
            }
        ],
        "default_mode": "coach"
    }