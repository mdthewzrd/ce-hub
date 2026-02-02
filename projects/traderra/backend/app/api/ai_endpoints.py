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
import logging
import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

from ..core.dependencies import AIContext, get_ai_context, LightweightAIContext, get_lightweight_ai_context, get_db
from sqlalchemy.orm import Session
from ..ai.renata_agent import (
    RenataAgent,
    create_renata_agent,
    RenataMode,
    UserPreferences,
    TradingContext,
    PerformanceData,
    RenataResponse
)
from ..core.sqlite_database import get_performance_metrics, get_user_trades

router = APIRouter(prefix="/ai", tags=["AI"])


# Request/Response Models
class AIQueryRequest(BaseModel):
    """Request for general AI query"""
    prompt: str = Field(description="User question or analysis request")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    mode: Optional[RenataMode] = Field(None, description="Override default AI mode")


class IntelligentConversationRequest(BaseModel):
    """Request for intelligent conversation with context awareness"""
    message: str = Field(description="User message or command")
    ui_context: Optional[Dict[str, Any]] = Field(None, description="Current UI state context")
    conversation_history: Optional[List[Dict[str, Any]]] = Field(None, description="Recent conversation history")
    mode: Optional[str] = Field(None, description="AI mode: analyst, coach, mentor")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context from frontend")


class PerformanceAnalysisRequest(BaseModel):
    """Request for performance analysis"""
    time_range: Optional[str] = Field("week", description="Analysis time range")
    symbols: Optional[List[str]] = Field(None, description="Filter by symbols")
    strategies: Optional[List[str]] = Field(None, description="Filter by strategies")
    include_open_positions: bool = Field(False, description="Include open P&L")
    basis: str = Field("gross", description="gross or net")
    unit: str = Field("r_multiple", description="percent, absolute, or r_multiple")


class AIResponse(BaseModel):
    """Standardized AI response matching frontend expectations"""
    response: str
    command_type: str = Field(description="Type of command: ui_action, ai_mode, question, etc.")
    intent: str = Field(description="Specific intent like switch_to_r_display")
    confidence: float = Field(description="Confidence score 0-1")
    ui_action: Optional[Dict[str, Any]] = Field(None, description="UI action parameters")
    ai_mode_change: Optional[Dict[str, Any]] = Field(None, description="AI mode change details")
    learning_applied: bool = Field(False, description="Whether learning patterns were applied")
    suggested_learning: Optional[str] = Field(None, description="Learning suggestions")
    tool_calls: Optional[List[Dict[str, Any]]] = Field(None, description="AG-UI tool calls for frontend execution")


class ArchonStatusResponse(BaseModel):
    """Archon connection status"""
    connected: bool
    health: Optional[Dict[str, Any]] = None
    project_id: str
    last_query_time: Optional[str] = None


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


@router.post("/conversation", response_model=AIResponse)
async def intelligent_conversation(
    request: IntelligentConversationRequest,
    ai_ctx: LightweightAIContext = Depends(get_lightweight_ai_context)
):
    """
    Intelligent conversation endpoint with command parsing and context awareness

    This endpoint uses the new command parser to distinguish between:
    - UI commands ("switch to R", "show dollars")
    - AI mode commands ("analyst mode", "coach mode")
    - Regular questions ("how's my performance?")
    - Corrections ("no, I meant...")

    The parser learns from user corrections and stores patterns in Archon.

    Example requests:
    - "switch to R" (when on stats page) → UI guidance to click R button
    - "use analyst mode" → AI mode change
    - "No, I meant the display mode" → Learning correction
    """
    try:
        # Create Renata agent with command parser
        renata = create_renata_agent(ai_ctx.archon)

        # Convert string mode to RenataMode enum
        ai_mode = RenataMode.COACH  # default
        if request.mode:
            try:
                # Handle both string and enum inputs
                if isinstance(request.mode, str):
                    ai_mode = RenataMode(request.mode.lower())
                else:
                    ai_mode = request.mode
            except ValueError:
                # If mode is invalid, default to COACH
                ai_mode = RenataMode.COACH

        # User preferences
        user_prefs = UserPreferences(
            ai_mode=ai_mode,
            verbosity="normal",
            stats_basis="gross",
            unit_mode="r_multiple"
        )

        # Trading context
        trading_ctx = TradingContext(
            user_id=ai_ctx.user_id,
            workspace_id=ai_ctx.workspace_id,
            current_filters=request.ui_context
        )

        # Try to get real performance data from frontend trades API
        performance_data = await _get_real_performance_data(ai_ctx.user_id)

        # Fallback to mock data if no real data available
        if not performance_data:
            logger.info("No real trading data found, using mock data")
            performance_data = PerformanceData(
                trades_count=42,
                win_rate=0.52,
                expectancy=0.75,
                total_pnl=2150.0,
                avg_winner=125.0,
                avg_loser=-85.0,
                max_drawdown=0.15,
                profit_factor=1.47
            )

        # Use intelligent conversation with context awareness
        result = await renata.intelligent_conversation(
            user_input=request.message,
            performance_data=performance_data,
            trading_context=trading_ctx,
            user_preferences=user_prefs,
            ui_context=request.ui_context,
            conversation_history=request.conversation_history
        )

        # Extract command parsing results from the renata response
        command_data = result.data or {}

        # Handle UI actions with proper parameter extraction
        ui_action = None
        tool_calls = []  # Initialize tool_calls array for AG-UI integration

        if command_data.get("command_type") == "ui_action":
            action_type = command_data.get("action", "")
            parameters = command_data.get("parameters", {})

            # Extract direct fields that should be in parameters
            if "page" in command_data:
                parameters["page"] = command_data["page"]
            if "range" in command_data:
                parameters["range"] = command_data["range"]
            if "target_mode" in command_data:
                parameters["target_mode"] = command_data["target_mode"]
            if "start_date" in command_data:
                parameters["start_date"] = command_data["start_date"]
            if "end_date" in command_data:
                parameters["end_date"] = command_data["end_date"]
            # Also check if they're in the root data object (as used by Renata agent)
            if "start_date" in result.data and "start_date" not in command_data:
                parameters["start_date"] = result.data["start_date"]
            if "end_date" in result.data and "end_date" not in command_data:
                parameters["end_date"] = result.data["end_date"]

            ui_action = {
                "action_type": action_type,
                "parameters": parameters
            }

            # Transform filter UI actions into AG-UI tool_calls
            # This enables AI-controlled filtering on Statistics page
            filter_tool_mapping = {
                "filter_long_trades": ("setStatisticsSideFilter", {"side": "Long"}),
                "filter_short_trades": ("setStatisticsSideFilter", {"side": "Short"}),
                "show_all_trades": ("setStatisticsSideFilter", {"side": "All"}),
                "clear_all_filters": ("clearStatisticsFilters", {}),
                "show_filters": ("showStatisticsFilters", {"action": "show"}),
                "hide_filters": ("showStatisticsFilters", {"action": "hide"})
            }

            # Map filter_type to appropriate AG-UI tools
            filter_type = parameters.get("filter_type")
            filter_value = parameters.get("filter_value")

            if action_type == "set_filter" and filter_type:
                if filter_type == "direction" and filter_value:
                    if filter_value.lower() == "long":
                        tool_calls.append({"tool": "setStatisticsSideFilter", "args": {"side": "Long"}})
                    elif filter_value.lower() == "short":
                        tool_calls.append({"tool": "setStatisticsSideFilter", "args": {"side": "Short"}})
                    elif filter_value.lower() == "all":
                        tool_calls.append({"tool": "setStatisticsSideFilter", "args": {"side": "All"}})

                elif filter_type == "symbol" and filter_value:
                    tool_calls.append({"tool": "setStatisticsSymbolFilter", "args": {"symbol": str(filter_value)}})

                elif filter_type == "strategy" and filter_value:
                    tool_calls.append({"tool": "setStatisticsStrategyFilter", "args": {"strategy": str(filter_value)}})

                elif filter_type == "profitability" and filter_value:
                    if filter_value.lower() == "profitable":
                        # Note: profitability filter would need additional implementation
                        logger.info(f"Profitability filter requested: {filter_value}")
                    elif filter_value.lower() == "losing":
                        logger.info(f"Profitability filter requested: {filter_value}")

            elif action_type == "clear_all_filters":
                tool_calls.append({"tool": "clearStatisticsFilters", "args": {}})

            elif action_type == "show_filters":
                tool_calls.append({"tool": "showStatisticsFilters", "args": {"action": "show"}})

            elif action_type == "hide_filters":
                tool_calls.append({"tool": "showStatisticsFilters", "args": {"action": "hide"}})

            # Map navigation actions to AG-UI tools
            elif action_type == "navigation":
                if parameters.get("page"):
                    tool_calls.append({
                        "tool": "navigateToPage",
                        "args": {"page": parameters["page"]}
                    })

            # Map display mode changes to AG-UI tools
            elif action_type == "switch_display_mode":
                target_mode = parameters.get("target_mode", "")
                if target_mode == "r_multiple":
                    tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "r_multiple"}})
                elif target_mode == "dollar":
                    tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "dollar"}})
                elif target_mode == "percent":
                    tool_calls.append({"tool": "setDisplayMode", "args": {"mode": "percentage"}})

            # Map date range changes to AG-UI tools
            elif action_type in ["set_date_range", "set_custom_date_range"]:
                if action_type == "set_date_range" and parameters.get("range"):
                    tool_calls.append({
                        "tool": "setDateRange",
                        "args": {"range": parameters["range"]}
                    })
                elif action_type == "set_custom_date_range":
                    tool_calls.append({
                        "tool": "setDateRange",
                        "args": {
                            "range": "custom",
                            "startDate": parameters.get("start_date", ""),
                            "endDate": parameters.get("end_date", "")
                        }
                    })

            # Map stats tab changes to AG-UI tools
            elif action_type == "switch_stats_tab":
                tab = parameters.get("stats_tab", "")
                if tab in ["overview", "analytics", "performance"]:
                    tool_calls.append({"tool": "setStatsTab", "args": {"tab": tab}})

            logger.info(f"[Backend] Generated {len(tool_calls)} AG-UI tool_calls: {tool_calls}")

        return AIResponse(
            response=result.text,
            command_type=command_data.get("command_type", "question"),
            intent=command_data.get("action", command_data.get("intent", "general_response")),
            confidence=command_data.get("confidence", 1.0),
            ui_action=ui_action,
            ai_mode_change={
                "new_mode": command_data.get("target_mode", ""),
                "mode_description": f"Switched to {command_data.get('target_mode', '')} mode"
            } if command_data.get("command_type") == "ai_mode" else None,
            learning_applied=False,
            suggested_learning=None,
            # Add tool_calls to response for frontend execution
            tool_calls=tool_calls if tool_calls else None
        )

    except Exception as e:
        logger.error(f"Intelligent conversation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Intelligent conversation failed: {str(e)}"
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


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint without dependencies"""
    return {"status": "ok", "message": "AI endpoints are working"}


@router.post("/renata/chat-simple", response_model=AIResponse)
async def renata_chat_simple(request: dict):
    """
    Simplified Renata chat endpoint for development/testing

    Works without authentication or database dependencies
    """
    try:
        from ..core.archon_client import ArchonClient, ArchonConfig
        from ..ai.renata_agent import create_renata_agent, PerformanceData, TradingContext, UserPreferences, RenataMode
        from ..core.config import settings

        # Extract request data
        query = request.get("query", "")
        mode = request.get("mode", "coach")
        performance_data = request.get("performance_data", {})

        # Convert to backend format
        backend_performance = PerformanceData(
            trades_count=int(performance_data.get("totalTrades", 50)),
            win_rate=float(performance_data.get("winRate", 0.5)),
            expectancy=float(performance_data.get("expectancy", 0.0)),
            total_pnl=float(performance_data.get("totalPnL", 0.0)),
            avg_winner=float(performance_data.get("avgWinner", 0.0)),
            avg_loser=float(performance_data.get("avgLoser", 0.0)),
            max_drawdown=float(performance_data.get("maxDrawdown", 0.0)),
            profit_factor=performance_data.get("profitFactor")
        )

        # Create minimal Archon client (will fail gracefully)
        archon_config = ArchonConfig(
            base_url=settings.archon_base_url,
            timeout=settings.archon_timeout,
            project_id=settings.archon_project_id
        )
        archon_client = ArchonClient(archon_config)

        # Create Renata agent
        renata = create_renata_agent(archon_client)

        # Setup minimal context
        trading_ctx = TradingContext(
            user_id="dev_user_123",
            workspace_id="dev_workspace_123"
        )

        # Map frontend modes to backend modes
        mode_mapping = {
            'renata': 'coach',  # Default renata mode maps to coach
            'analyst': 'analyst',
            'coach': 'coach',
            'mentor': 'mentor'
        }

        backend_mode = mode_mapping.get(mode, 'coach')  # Default to coach if unknown

        user_prefs = UserPreferences(
            ai_mode=RenataMode(backend_mode),
            verbosity="normal"
        )

        # Perform analysis (will use mock responses if OpenAI/Archon unavailable)
        result = await renata.analyze_performance(
            performance_data=backend_performance,
            trading_context=trading_ctx,
            user_preferences=user_prefs,
            prompt=query
        )

        return AIResponse(
            success=True,
            response=result.text,
            mode_used=result.mode_used.value if result.mode_used else mode,
            data=result.data,
            actions=result.actions,
            archon_sources=result.archon_sources,
            insights_generated=result.insights_generated,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Simple Renata chat failed: {e}")
        return AIResponse(
            success=False,
            response=f"Error: {str(e)}",
            mode_used=request.get("mode", "coach"),
            timestamp=datetime.now().isoformat()
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


# Learning-enhanced endpoints
@router.post("/renata/chat-enhanced", response_model=AIResponse)
async def renata_chat_enhanced(
    request: dict,
    db: Session = Depends(get_db),
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Enhanced Renata chat with learning capabilities

    This endpoint uses the enhanced Renata agent that applies
    learned user context and preferences to responses.
    """
    try:
        from ..ai.enhanced_renata_agent import create_enhanced_renata_agent

        # Extract frontend request format
        query = request.get("query", "")
        mode = request.get("mode", "coach")
        performance_data = request.get("performance_data", {})
        trading_context = request.get("trading_context", {})
        user_id = request.get("user_id", ai_ctx.user_id)

        # Convert frontend performance data format to backend format
        backend_performance = PerformanceData(
            trades_count=int(performance_data.get("totalTrades", 50)),
            win_rate=float(performance_data.get("winRate", 0.5)),
            expectancy=float(performance_data.get("expectancy", 0.0)),
            total_pnl=float(performance_data.get("totalPnL", 0.0)),
            avg_winner=float(performance_data.get("avgWinner", 0.0)),
            avg_loser=float(performance_data.get("avgLoser", 0.0)),
            max_drawdown=float(performance_data.get("maxDrawdown", 0.0)),
            profit_factor=performance_data.get("profitFactor")
        )

        # Create enhanced Renata agent with learning capabilities
        enhanced_renata = create_enhanced_renata_agent(ai_ctx.archon, db)

        # Set up context and preferences
        trading_ctx = TradingContext(
            user_id=user_id,
            workspace_id=ai_ctx.workspace_id,
            time_range=trading_context.get("timeRange"),
            current_filters=trading_context
        )

        # Map frontend mode to valid backend RenataMode
        mode_mapping = {
            'renata': 'coach',
            'analyst': 'analyst',
            'coach': 'coach',
            'mentor': 'mentor'
        }
        backend_mode = mode_mapping.get(mode, 'coach')

        user_prefs = UserPreferences(
            ai_mode=RenataMode(backend_mode),
            verbosity="normal"
        )

        # Perform enhanced analysis with learning
        result = await enhanced_renata.analyze_performance_with_learning(
            user_id=user_id,
            performance_data=backend_performance,
            trading_context=trading_ctx,
            user_preferences=user_prefs,
            prompt=query
        )

        return AIResponse(
            response=result.text,
            command_type="enhanced_analysis",
            intent="performance_analysis",
            confidence=result.learning_confidence or 0.8,
            learning_applied=result.learning_applied,
            suggested_learning=result.feedback_prompt
        )

    except Exception as e:
        logger.error(f"Enhanced Renata chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Enhanced Renata chat failed: {str(e)}"
        )


@router.post("/renata/feedback")
async def submit_renata_feedback(
    request: dict,
    db: Session = Depends(get_db),
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Submit feedback on Renata's response for learning

    This endpoint integrates with the learning system to collect
    user feedback and improve future responses.
    """
    try:
        from ..ai.enhanced_renata_agent import create_enhanced_renata_agent, LearningFeedback

        user_id = request.get("user_id", ai_ctx.user_id)
        feedback_type = request.get("feedback_type")
        user_query = request.get("user_query", "")
        renata_response = request.get("renata_response", "")
        feedback_details = request.get("feedback_details")
        improvement_suggestions = request.get("improvement_suggestions")
        correction = request.get("correction")
        renata_mode = request.get("renata_mode", "coach")
        trading_context = request.get("trading_context", {})

        # Create enhanced Renata agent
        enhanced_renata = create_enhanced_renata_agent(ai_ctx.archon, db)

        # Create feedback object
        feedback = LearningFeedback(
            feedback_type=feedback_type,
            feedback_details=feedback_details,
            improvement_suggestions=improvement_suggestions,
            correction=correction
        )

        # Collect feedback through enhanced agent
        success = await enhanced_renata.collect_feedback(
            user_id=user_id,
            user_query=user_query,
            renata_response=renata_response,
            feedback=feedback,
            renata_mode=renata_mode,
            trading_context=trading_context
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process feedback"
            )

        return {
            "success": True,
            "message": "Feedback collected successfully",
            "feedback_type": feedback_type,
            "learning_applied": feedback_type == "fix_understanding",
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feedback submission failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feedback submission failed: {str(e)}"
        )


# Additional endpoints for frontend compatibility
@router.post("/renata/chat", response_model=AIResponse)
async def renata_chat(
    request: dict,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Renata chat endpoint for frontend compatibility

    Maps frontend renata.chat() calls to the analyze_performance functionality
    """
    try:
        # Extract frontend request format
        query = request.get("query", "")
        mode = request.get("mode", "coach")
        performance_data = request.get("performance_data", {})
        trading_context = request.get("trading_context", {})

        # Convert frontend performance data format to backend format
        backend_performance = PerformanceData(
            trades_count=int(performance_data.get("totalTrades", 50)),
            win_rate=float(performance_data.get("winRate", 0.5)),
            expectancy=float(performance_data.get("expectancy", 0.0)),
            total_pnl=float(performance_data.get("totalPnL", 0.0)),
            avg_winner=float(performance_data.get("avgWinner", 0.0)),
            avg_loser=float(performance_data.get("avgLoser", 0.0)),
            max_drawdown=float(performance_data.get("maxDrawdown", 0.0)),
            profit_factor=performance_data.get("profitFactor")
        )

        # Create Renata agent
        renata = create_renata_agent(ai_ctx.archon)

        # Set up context and preferences
        trading_ctx = TradingContext(
            user_id=ai_ctx.user_id,
            workspace_id=ai_ctx.workspace_id,
            time_range=trading_context.get("timeRange"),
            current_filters=trading_context
        )

        # Map frontend mode to valid backend RenataMode
        mode_mapping = {
            'renata': 'coach',  # Default renata mode maps to coach
            'analyst': 'analyst',
            'coach': 'coach',
            'mentor': 'mentor'
        }
        backend_mode = mode_mapping.get(mode, 'coach')

        user_prefs = UserPreferences(
            ai_mode=RenataMode(backend_mode),
            verbosity="normal"
        )

        # Perform analysis
        result = await renata.analyze_performance(
            performance_data=backend_performance,
            trading_context=trading_ctx,
            user_preferences=user_prefs,
            prompt=query
        )

        return AIResponse(
            success=True,
            response=result.text,
            mode_used=result.mode_used.value if result.mode_used else mode,
            data=result.data,
            actions=result.actions,
            archon_sources=result.archon_sources,
            insights_generated=result.insights_generated,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Renata chat failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Renata chat failed: {str(e)}"
        )


@router.post("/renata/chat-agui", response_model=AIResponse)
async def renata_chat_agui(
    request: dict,
    ai_ctx: AIContext = Depends(get_ai_context)
):
    """
    Renata AGUI chat endpoint for frontend compatibility

    Enhanced chat with AI-Generated UI components
    """
    # For now, delegate to regular chat endpoint
    # TODO: Add AGUI component generation
    return await renata_chat(request, ai_ctx)


async def _get_real_performance_data(user_id: str) -> Optional[PerformanceData]:
    """
    Fetch real trading performance data from the SQLite database

    This function queries the SQLite database directly to get actual trading data
    and calculates performance metrics from it.
    """
    try:
        logger.info(f"📊 Fetching real performance data for user {user_id} from SQLite database")

        # Get performance metrics directly from SQLite database
        metrics = await get_performance_metrics(user_id)

        if metrics.get('total_trades', 0) == 0:
            logger.info(f"No trades found for user {user_id} in database")
            return None

        logger.info(f"✅ Retrieved real performance data: {metrics}")

        # Convert database metrics to PerformanceData format
        return PerformanceData(
            trades_count=metrics['total_trades'],
            win_rate=metrics['win_rate'] / 100,  # Convert percentage to decimal
            expectancy=metrics['avg_r_multiple'],
            total_pnl=metrics['total_pnl'],
            avg_winner=metrics['avg_winner'],
            avg_loser=metrics['avg_loser'],
            max_drawdown=0,  # Would need equity curve calculation
            profit_factor=metrics['profit_factor']
        )

    except Exception as e:
        logger.error(f"Error fetching real performance data: {e}")
        return None


def _calculate_performance_from_trades(trades: List[Dict]) -> PerformanceData:
    """
    Calculate performance metrics from raw trade data
    """
    import numpy as np

    total_trades = len(trades)
    winning_trades = [t for t in trades if t.get('pnl', 0) > 0]
    losing_trades = [t for t in trades if t.get('pnl', 0) < 0]

    win_rate = len(winning_trades) / total_trades if total_trades > 0 else 0

    total_pnl = sum(t.get('pnl', 0) for t in trades)

    avg_winner = np.mean([t.get('pnl', 0) for t in winning_trades]) if winning_trades else 0
    avg_loser = np.mean([t.get('pnl', 0) for t in losing_trades]) if losing_trades else 0

    # Calculate expectancy using R-multiple if available, otherwise use P&L
    r_multiples = [t.get('rMultiple') for t in trades if t.get('rMultiple') is not None]
    if r_multiples:
        expectancy = np.mean(r_multiples)
    else:
        # Simple expectancy calculation
        expectancy = (total_pnl / total_trades) / abs(avg_loser) if avg_loser != 0 and total_trades > 0 else 0

    # Calculate profit factor
    total_wins = sum(t.get('pnl', 0) for t in winning_trades)
    total_losses = abs(sum(t.get('pnl', 0) for t in losing_trades))
    profit_factor = total_wins / total_losses if total_losses > 0 else 0

    # Simple drawdown calculation (would need equity curve for accurate calculation)
    max_drawdown = 0.15  # Placeholder

    return PerformanceData(
        trades_count=total_trades,
        win_rate=win_rate,
        expectancy=expectancy,
        total_pnl=total_pnl,
        avg_winner=avg_winner,
        avg_loser=avg_loser,
        max_drawdown=max_drawdown,
        profit_factor=profit_factor
    )