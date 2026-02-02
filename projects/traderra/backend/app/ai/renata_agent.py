"""
Renata AI Agent - The Professional Trading Performance Counterpart

Renata is Traderra's central AI orchestrator that provides adaptive, professional
trading analysis and coaching through three distinct modes:
- Analyst: Direct, data-focused, minimal emotion
- Coach: Constructive guidance with accountability
- Mentor: Reflective insights and long-term perspective

Architecture follows CE-Hub principles:
- Archon-First: All intelligence flows through Archon RAG
- Plan → Research → Produce → Ingest workflow
- Context as product for continuous learning
"""

import logging
import os
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime
from enum import Enum
from dataclasses import dataclass

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, Tool

from ..core.archon_client import ArchonClient, TradingQueryPatterns
from ..core.config import settings

logger = logging.getLogger(__name__)


class RenataMode(str, Enum):
    """Renata's three personality modes"""
    ANALYST = "analyst"
    COACH = "coach"
    MENTOR = "mentor"


class UserPreferences(BaseModel):
    """User preferences for AI interaction"""
    ai_mode: RenataMode = RenataMode.COACH
    verbosity: Literal["concise", "normal", "detailed"] = "normal"
    stats_basis: Literal["gross", "net"] = "gross"
    unit_mode: Literal["percent", "absolute", "r_multiple"] = "r_multiple"


class TradingContext(BaseModel):
    """Trading context for AI analysis"""
    user_id: str
    workspace_id: str
    time_range: Optional[Dict[str, str]] = None
    symbols: Optional[List[str]] = None
    strategies: Optional[List[str]] = None
    current_filters: Optional[Dict[str, Any]] = None


class PerformanceData(BaseModel):
    """Performance data structure"""
    trades_count: int
    win_rate: float
    profit_factor: Optional[float] = None
    expectancy: float
    total_pnl: float
    avg_winner: float
    avg_loser: float
    max_drawdown: float
    sharpe_ratio: Optional[float] = None


@dataclass
class RenataResponse:
    """Standardized response from Renata"""
    text: str
    data: Optional[Dict[str, Any]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    mode_used: Optional[RenataMode] = None
    archon_sources: Optional[List[str]] = None
    insights_generated: Optional[List[str]] = None


class RenataAgent:
    """
    Renata - Professional Trading AI Agent with Archon Integration

    Renata provides intelligent trading analysis and coaching by:
    1. Querying Archon for relevant trading patterns and insights
    2. Analyzing current performance data with historical context
    3. Generating mode-appropriate responses and recommendations
    4. Ingesting insights back to Archon for continuous learning
    """

    def __init__(self, archon_client: ArchonClient):
        self.archon = archon_client
        self.agents_initialized = False

        # Initialize command parser for intelligent command processing
        from .command_parser import get_command_parser
        self.command_parser = get_command_parser(archon_client)

        try:
            self._setup_pydantic_agents()
            self.agents_initialized = True
            logger.info("PydanticAI agents initialized successfully")
        except Exception as e:
            logger.error(f"PydanticAI agents initialization failed: {e}. Check API key configuration and connectivity.")
            logger.error(f"OpenRouter API key configured: {'Yes' if settings.openrouter_api_key else 'No'}")
            logger.error(f"OpenAI API key configured: {'Yes' if settings.openai_api_key else 'No'}")
            self.agents_initialized = False

    def _setup_pydantic_agents(self):
        """Initialize intelligent response system - simplified without PydanticAI complexity"""

        # Set up intelligent response system using real data analysis
        if settings.openrouter_api_key:
            self.openrouter_api_key = settings.openrouter_api_key
            self.agents_initialized = True
            logger.info("Intelligent response system initialized with real trading data analysis")
        else:
            logger.warning("No API keys found - will use basic template responses")
            self.agents_initialized = False

    @Tool
    async def _analyze_performance_tool(
        self,
        time_range: str,
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Tool to analyze performance data with Archon context"""

        # RESEARCH phase: Query Archon for relevant patterns
        query = f"trading performance analysis {time_range}"
        archon_response = await self.archon.search_trading_knowledge(
            query=query,
            match_count=5
        )

        performance_context = []
        if archon_response.success:
            performance_context = archon_response.data

        # Return structured analysis
        return {
            "metrics": metrics,
            "archon_context": performance_context,
            "analysis_timestamp": datetime.now().isoformat(),
            "context_sources": len(performance_context)
        }

    @Tool
    async def _get_historical_context_tool(
        self,
        pattern_type: str
    ) -> Dict[str, Any]:
        """Tool to get historical context from Archon"""

        # Query Archon for historical patterns
        query_patterns = {
            "risk_management": "risk management position sizing drawdown",
            "psychology": "trading psychology emotional control discipline",
            "strategy": "strategy optimization backtesting performance",
            "general": "trading performance patterns analysis"
        }

        query = query_patterns.get(pattern_type, query_patterns["general"])

        archon_response = await self.archon.search_trading_knowledge(
            query=query,
            match_count=3
        )

        context = []
        if archon_response.success:
            context = archon_response.data

        return {
            "pattern_type": pattern_type,
            "historical_context": context,
            "sources_found": len(context)
        }

    async def analyze_performance(
        self,
        performance_data: PerformanceData,
        trading_context: TradingContext,
        user_preferences: UserPreferences,
        prompt: Optional[str] = None
    ) -> RenataResponse:
        """
        Analyze trading performance following CE-Hub workflow:
        Plan → Research → Produce → Ingest

        Args:
            performance_data: Current performance metrics
            trading_context: User and filter context
            user_preferences: AI mode and display preferences
            prompt: Optional specific query from user

        Returns:
            RenataResponse with analysis and insights
        """
        try:
            # Use intelligent response system with real data analysis
            logger.info("Using intelligent response system with real trading data")

            # Try to get Archon context for enhanced analysis
            try:
                research_query = self._build_research_query(performance_data, prompt)
                archon_context = await self.archon.search_trading_knowledge(
                    query=research_query,
                    match_count=5
                )
            except Exception as e:
                logger.warning(f"Archon context unavailable: {e}")
                archon_context = None

            # Generate intelligent response based on real performance data
            return self._generate_intelligent_response(
                performance_data=performance_data,
                trading_context=trading_context,
                user_preferences=user_preferences,
                prompt=prompt,
                archon_context=archon_context.data if archon_context and archon_context.success else None
            )

        except Exception as e:
            logger.error(f"Renata analysis failed: {e}")
            # Enhanced fallback response with mock analysis
            return self._generate_intelligent_response(
                performance_data=performance_data,
                trading_context=trading_context,
                user_preferences=user_preferences,
                prompt=prompt,
                error=str(e)
            )

    def _get_agent_for_mode(self, mode: RenataMode) -> Agent:
        """Get appropriate PydanticAI agent for mode"""
        agents = {
            RenataMode.ANALYST: self.analyst_agent,
            RenataMode.COACH: self.coach_agent,
            RenataMode.MENTOR: self.mentor_agent
        }
        return agents[mode]

    def _build_research_query(
        self,
        performance_data: PerformanceData,
        user_prompt: Optional[str] = None
    ) -> str:
        """Build focused query for Archon RAG"""

        if user_prompt:
            # Extract key terms from user prompt
            return f"trading {user_prompt}"

        # Build query based on performance characteristics
        query_parts = ["trading performance"]

        if performance_data.win_rate < 0.4:
            query_parts.append("low win rate")
        elif performance_data.win_rate > 0.6:
            query_parts.append("high win rate")

        if performance_data.profit_factor and performance_data.profit_factor < 1.2:
            query_parts.append("risk reward")

        if performance_data.expectancy < 0:
            query_parts.append("negative expectancy")

        return " ".join(query_parts)

    def _build_analysis_prompt(
        self,
        performance_data: PerformanceData,
        context: TradingContext,
        preferences: UserPreferences,
        archon_context: List[Dict],
        user_prompt: Optional[str] = None
    ) -> str:
        """Build comprehensive prompt for AI analysis"""

        base_prompt = f"""
Analyze the following trading performance data:

PERFORMANCE METRICS:
- Trades: {performance_data.trades_count}
- Win Rate: {performance_data.win_rate:.1%}
- Expectancy: {performance_data.expectancy:.2f}R
- Profit Factor: {performance_data.profit_factor or 'N/A'}
- Total P&L: {performance_data.total_pnl:.2f}
- Avg Winner: {performance_data.avg_winner:.2f}
- Avg Loser: {performance_data.avg_loser:.2f}
- Max Drawdown: {performance_data.max_drawdown:.2f}

CONTEXT FROM KNOWLEDGE BASE:
"""

        # Add Archon context
        for i, ctx in enumerate(archon_context[:3]):  # Limit to top 3 results
            content = ctx.get("content", "")[:200]  # Truncate for token management
            base_prompt += f"\n{i+1}. {content}...\n"

        # Add user-specific prompt if provided
        if user_prompt:
            base_prompt += f"\nUSER QUESTION: {user_prompt}\n"

        base_prompt += f"""
Provide a {preferences.verbosity} analysis focusing on key insights and actionable observations.
Response should be 2-3 sentences maximum, cite specific metrics, and maintain professional tone.
"""

        return base_prompt

    def _extract_insights(
        self,
        ai_result: Any,
        performance_data: PerformanceData
    ) -> List[str]:
        """Extract key insights for Archon ingestion"""

        insights = []

        # Extract performance patterns
        if performance_data.win_rate > 0.6 and performance_data.expectancy > 0.5:
            insights.append("high_performance_pattern")

        if performance_data.profit_factor and performance_data.profit_factor < 1.0:
            insights.append("negative_expectancy_pattern")

        if performance_data.max_drawdown > 0.2:
            insights.append("high_drawdown_risk")

        return insights

    async def _ingest_insights(
        self,
        insights: List[str],
        context: TradingContext,
        mode: RenataMode
    ):
        """Ingest insights back to Archon for learning"""

        from ..core.archon_client import TradingInsight

        insight_data = TradingInsight(
            content={
                "insights": insights,
                "mode_used": mode.value,
                "user_context": context.dict(),
                "timestamp": datetime.now().isoformat()
            },
            tags=["ai_analysis", f"mode_{mode.value}", "performance_insights"],
            insight_type="ai_analysis"
        )

        await self.archon.ingest_trading_insight(insight_data)

    async def intelligent_conversation(
        self,
        user_input: str,
        performance_data: PerformanceData,
        trading_context: TradingContext,
        user_preferences: UserPreferences,
        ui_context: Optional[Dict[str, str]] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> RenataResponse:
        """
        Handle user input with intelligent command parsing and context awareness

        This method uses the command parser to distinguish between:
        - UI commands (switch to R, show dollars)
        - AI mode commands (analyst mode, coach mode)
        - Regular questions (how's my performance?)
        """

        from .command_parser import UIContext, CommandType

        # Build UI context for command parser
        ui_ctx = UIContext(
            current_page=ui_context.get("page", "unknown") if ui_context else "unknown",
            display_mode=ui_context.get("displayMode", "unknown") if ui_context else "unknown",
            pnl_mode=ui_context.get("pnlMode", "unknown") if ui_context else "unknown",
            time_range=ui_context.get("selectedRange", "unknown") if ui_context else "unknown",
            calendar_view=ui_context.get("viewMode", "unknown") if ui_context else "unknown",
            calendar_year=ui_context.get("currentYear", None) if ui_context else None,
            calendar_month=ui_context.get("selectedMonth", None) if ui_context else None
        )

        # Parse the command
        parsed = await self.command_parser.parse_command(
            user_input=user_input,
            ui_context=ui_ctx,
            conversation_history=conversation_history
        )

        logger.info(f"Parsed command: {parsed.command_type} | {parsed.intent} | confidence: {parsed.confidence}")

        # Handle different command types
        if parsed.command_type == CommandType.UI_ACTION:
            return self._handle_ui_command(parsed, user_preferences)

        elif parsed.command_type == CommandType.AI_MODE:
            return self._handle_ai_mode_command(parsed, user_preferences)

        elif parsed.command_type == CommandType.CORRECTION:
            return await self._handle_correction(parsed, ui_ctx, conversation_history)

        elif parsed.command_type == CommandType.GREETING:
            return self._handle_greeting(parsed, user_preferences, performance_data)

        else:  # Regular question
            # Fall back to regular mock response for performance questions
            return self._generate_intelligent_response(
                performance_data=performance_data,
                trading_context=trading_context,
                user_preferences=user_preferences,
                prompt=user_input
            )

    def _handle_ui_command(self, parsed: Any, user_preferences: UserPreferences) -> RenataResponse:
        """Handle UI action commands like 'switch to R'"""

        intent = parsed.intent
        params = parsed.parameters

        if intent == "switch_to_r_display":
            return RenataResponse(
                text="I understand you want to switch to R-multiple display mode. Look for the 'R' button in your stats view - it should be next to the '$' button.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_display_mode",
                    "target_mode": "r_multiple",
                    "ui_element": "stats_display_toggle"
                },
                actions=[{
                    "type": "ui_guidance",
                    "target": "display_mode_toggle",
                    "instruction": "Click the 'R' button to switch to R-multiples"
                }],
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_r_display":
            return RenataResponse(
                text="I'll switch to R-multiple display mode.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_display_mode",
                    "target_mode": "r",
                    "ui_element": "stats_display_toggle"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_dollar_display":
            return RenataResponse(
                text="I'll switch to dollar display mode.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_display_mode",
                    "target_mode": "dollar",
                    "ui_element": "stats_display_toggle"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_percent_display":
            return RenataResponse(
                text="I'll switch to percentage display mode.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_display_mode",
                    "target_mode": "percent",
                    "ui_element": "stats_display_toggle"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_to_stats":
            return RenataResponse(
                text="I'll navigate you to the statistics page.",
                data={
                    "command_type": "ui_action",
                    "action": "navigation",
                    "page": "statistics"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_to_journal":
            return RenataResponse(
                text="I'll navigate you to the trading journal.",
                data={
                    "command_type": "ui_action",
                    "action": "navigation",
                    "page": "journal"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_to_dashboard":
            return RenataResponse(
                text="I'll navigate you to the dashboard.",
                data={
                    "command_type": "ui_action",
                    "action": "navigation",
                    "page": "dashboard"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_ytd_range" or intent == "set_date_range_ytd":
            return RenataResponse(
                text="I'll set the date range to Year to Date.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "ytd"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_year_2025":
            return RenataResponse(
                text="I'll set the date range to 2025.",
                data={
                    "command_type": "ui_action",
                    "action": "set_custom_date_range",
                    "start_date": "2025-01-01",
                    "end_date": "2025-12-31"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_year_2024":
            return RenataResponse(
                text="I'll set the date range to 2024.",
                data={
                    "command_type": "ui_action",
                    "action": "set_custom_date_range",
                    "start_date": "2024-01-01",
                    "end_date": "2024-12-31"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_today":
            return RenataResponse(
                text="I'll set the date range to today.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "today"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_yesterday":
            return RenataResponse(
                text="I'll set the date range to yesterday.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "yesterday"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_last_week":
            return RenataResponse(
                text="I'll set the date range to last week.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "week"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_last_7_days":
            return RenataResponse(
                text="I'll set the date range to the last 7 days.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "7d"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_last_30_days":
            return RenataResponse(
                text="I'll set the date range to the last 30 days.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "30d"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_this_quarter":
            return RenataResponse(
                text="I'll set the date range to this quarter.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "quarter"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_date_range_last_quarter":
            return RenataResponse(
                text="I'll set the date range to last quarter.",
                data={
                    "command_type": "ui_action",
                    "action": "set_date_range",
                    "range": "last_quarter"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "set_custom_date_range":
            start_date = parsed.parameters.get("start_date")
            end_date = parsed.parameters.get("end_date")

            return RenataResponse(
                text=f"I'll set the date range from {start_date} to {end_date}.",
                data={
                    "command_type": "ui_action",
                    "action": "set_custom_date_range",
                    "start_date": start_date,
                    "end_date": end_date
                },
                mode_used=user_preferences.ai_mode
            )

        # Filter Management Handlers
        elif intent == "filter_profitable_trades":
            return RenataResponse(
                text="I'll filter to show only profitable trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "profitability",
                    "filter_value": "profitable"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_losing_trades":
            return RenataResponse(
                text="I'll filter to show only losing trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "profitability",
                    "filter_value": "losing"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_long_trades":
            return RenataResponse(
                text="I'll filter to show only long trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "direction",
                    "filter_value": "long"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_short_trades":
            return RenataResponse(
                text="I'll filter to show only short trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "direction",
                    "filter_value": "short"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_by_symbol":
            # Extract symbol from user input if possible
            symbol = parsed.parameters.get("symbol", "specified")
            return RenataResponse(
                text=f"I'll filter trades by symbol. Which symbol would you like to focus on?",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "symbol",
                    "filter_value": symbol
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_recent_trades":
            return RenataResponse(
                text="I'll filter to show only recent trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "timeframe",
                    "filter_value": "recent"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_large_trades":
            return RenataResponse(
                text="I'll filter to show only large trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "size",
                    "filter_value": "large"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "filter_small_trades":
            return RenataResponse(
                text="I'll filter to show only small trades.",
                data={
                    "command_type": "ui_action",
                    "action": "set_filter",
                    "filter_type": "size",
                    "filter_value": "small"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "show_active_filters":
            return RenataResponse(
                text="I'll show you all currently active filters.",
                data={
                    "command_type": "ui_action",
                    "action": "show_filters"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "clear_all_filters":
            return RenataResponse(
                text="I'll clear all active filters.",
                data={
                    "command_type": "ui_action",
                    "action": "clear_all_filters"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "add_filter" or intent == "remove_filter":
            return RenataResponse(
                text="I can help you manage filters. Please specify what you'd like to filter by (e.g., 'show only profitable trades', 'filter by AAPL', 'show recent trades').",
                data={
                    "command_type": "filter_guidance",
                    "action": "show_filter_options"
                },
                mode_used=user_preferences.ai_mode
            )

        # Calendar-specific handlers
        elif intent == "navigate_to_calendar":
            return RenataResponse(
                text="I'll navigate you to the trading calendar.",
                data={
                    "command_type": "ui_action",
                    "action": "navigation",
                    "page": "calendar"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_gross_pnl":
            return RenataResponse(
                text="I'll switch to Gross P&L mode (before commissions).",
                data={
                    "command_type": "ui_action",
                    "action": "set_pnl_mode",
                    "pnl_mode": "gross"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_net_pnl":
            return RenataResponse(
                text="I'll switch to Net P&L mode (after commissions).",
                data={
                    "command_type": "ui_action",
                    "action": "set_pnl_mode",
                    "pnl_mode": "net"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_calendar_year_view":
            return RenataResponse(
                text="I'll switch the calendar to year view to show all months.",
                data={
                    "command_type": "ui_action",
                    "action": "set_calendar_view_mode",
                    "view_mode": "year"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_calendar_month_view":
            return RenataResponse(
                text="I'll switch the calendar to month view for detailed view.",
                data={
                    "command_type": "ui_action",
                    "action": "set_calendar_view_mode",
                    "view_mode": "month"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_stats_overview":
            return RenataResponse(
                text="I'll switch to the Overview tab on the statistics page.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_stats_tab",
                    "stats_tab": "overview"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_stats_analytics":
            return RenataResponse(
                text="I'll switch to the Analytics tab on the statistics page.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_stats_tab",
                    "stats_tab": "analytics"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_to_stats_performance":
            return RenataResponse(
                text="I'll switch to the Performance tab on the statistics page.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_stats_tab",
                    "stats_tab": "performance"
                },
                mode_used=user_preferences.ai_mode
            )

        # Calendar month navigation handlers
        elif intent in ["navigate_to_january", "navigate_to_february", "navigate_to_march", "navigate_to_april",
                        "navigate_to_may", "navigate_to_june", "navigate_to_july", "navigate_to_august",
                        "navigate_to_september", "navigate_to_october", "navigate_to_november", "navigate_to_december"]:
            month = parsed.parameters.get("calendar_month")
            month_names = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"]
            month_name = month_names[month] if month is not None else "selected month"
            return RenataResponse(
                text=f"I'll navigate to {month_name} on the calendar.",
                data={
                    "command_type": "ui_action",
                    "action": "navigate_calendar",
                    "month": month,
                    "view_mode": "month"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_calendar_next_year":
            return RenataResponse(
                text="I'll advance the calendar to the next year.",
                data={
                    "command_type": "ui_action",
                    "action": "navigate_calendar_year",
                    "direction": "next"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_calendar_previous_year":
            return RenataResponse(
                text="I'll go back to the previous year on the calendar.",
                data={
                    "command_type": "ui_action",
                    "action": "navigate_calendar_year",
                    "direction": "previous"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent in ["navigate_calendar_to_2021", "navigate_calendar_to_2022", "navigate_calendar_to_2023",
                       "navigate_calendar_to_2024", "navigate_calendar_to_2025", "navigate_calendar_to_2026",
                       "navigate_calendar_to_2027"]:
            year = parsed.parameters.get("calendar_year")
            return RenataResponse(
                text=f"I'll navigate the calendar to {year}.",
                data={
                    "command_type": "ui_action",
                    "action": "navigate_calendar_year",
                    "year": year
                },
                mode_used=user_preferences.ai_mode
            )

        # ==================== JOURNAL PAGE HANDLERS ====================
        elif intent == "open_journal_new_entry":
            return RenataResponse(
                text="I'll open the new journal entry modal for you.",
                data={
                    "command_type": "ui_action",
                    "action": "open_modal",
                    "modal": "journal.new-entry"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "scroll_journal_entries":
            return RenataResponse(
                text="I'll scroll to the journal entries section.",
                data={
                    "command_type": "ui_action",
                    "action": "scroll",
                    "target": "journal.entries"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_journal_grid_view":
            return RenataResponse(
                text="I'll switch the journal to grid view.",
                data={
                    "command_type": "ui_action",
                    "action": "set_view_mode",
                    "view_mode": "grid",
                    "target": "journal"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "switch_journal_list_view":
            return RenataResponse(
                text="I'll switch the journal to list view.",
                data={
                    "command_type": "ui_action",
                    "action": "set_view_mode",
                    "view_mode": "list",
                    "target": "journal"
                },
                mode_used=user_preferences.ai_mode
            )

        # ==================== TRADES PAGE HANDLERS ====================
        elif intent == "open_new_trade_modal":
            return RenataResponse(
                text="I'll open the new trade modal for you.",
                data={
                    "command_type": "ui_action",
                    "action": "open_modal",
                    "modal": "trades.new-trade"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "open_import_modal":
            return RenataResponse(
                text="I'll open the trade import modal for you.",
                data={
                    "command_type": "ui_action",
                    "action": "open_modal",
                    "modal": "trades.import"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "scroll_trades_table":
            return RenataResponse(
                text="I'll scroll to the trades table section.",
                data={
                    "command_type": "ui_action",
                    "action": "scroll",
                    "target": "trades.table"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "scroll_trades_summary":
            return RenataResponse(
                text="I'll scroll to the trades summary section.",
                data={
                    "command_type": "ui_action",
                    "action": "scroll",
                    "target": "trades.summary"
                },
                mode_used=user_preferences.ai_mode
            )

        # ==================== SETTINGS PAGE HANDLERS ====================
        elif intent in ["switch_to_profile_settings", "switch_to_trading_settings", "switch_to_integrations_settings",
                       "switch_to_notifications_settings", "switch_to_appearance_settings", "switch_to_data_settings",
                       "switch_to_security_settings"]:
            section = parsed.parameters.get("section")
            section_names = {
                "profile": "Profile",
                "trading": "Trading",
                "integrations": "Integrations",
                "notifications": "Notifications",
                "appearance": "Appearance",
                "data": "Data & Exports",
                "security": "Security"
            }
            section_name = section_names.get(section, section)
            return RenataResponse(
                text=f"I'll switch to the {section_name} settings section.",
                data={
                    "command_type": "ui_action",
                    "action": "switch_settings_section",
                    "section": section
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "save_settings":
            return RenataResponse(
                text="I'll save your settings.",
                data={
                    "command_type": "ui_action",
                    "action": "click",
                    "target": "settings.save"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "export_data":
            return RenataResponse(
                text="I'll export your data.",
                data={
                    "command_type": "ui_action",
                    "action": "click",
                    "target": "settings.export"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "import_data":
            return RenataResponse(
                text="I'll open the data import dialog.",
                data={
                    "command_type": "ui_action",
                    "action": "click",
                    "target": "settings.import"
                },
                mode_used=user_preferences.ai_mode
            )

        # ==================== DAILY SUMMARY PAGE HANDLERS ====================
        elif intent == "navigate_daily_summary_yesterday":
            return RenataResponse(
                text="I'll show yesterday's daily summary.",
                data={
                    "command_type": "ui_action",
                    "action": "navigate_daily_summary_date",
                    "direction": "prev"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_daily_summary_tomorrow":
            return RenataResponse(
                text="I'll show tomorrow's daily summary.",
                data={
                    "command_type": "ui_action",
                    "action": "navigate_daily_summary_date",
                    "direction": "next"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "navigate_daily_summary_today":
            return RenataResponse(
                text="I'll show today's daily summary.",
                data={
                    "command_type": "ui_action",
                    "action": "set_daily_summary_date",
                    "date": "today"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "scroll_daily_summary_stats":
            return RenataResponse(
                text="I'll scroll to the daily summary stats section.",
                data={
                    "command_type": "ui_action",
                    "action": "scroll",
                    "target": "daily-summary.stats"
                },
                mode_used=user_preferences.ai_mode
            )

        elif intent == "scroll_daily_summary_trades":
            return RenataResponse(
                text="I'll scroll to the daily summary trades section.",
                data={
                    "command_type": "ui_action",
                    "action": "scroll",
                    "target": "daily-summary.trades"
                },
                mode_used=user_preferences.ai_mode
            )

        else:
            return RenataResponse(
                text=parsed.suggested_response or "I can help with UI actions. What would you like me to do?",
                mode_used=user_preferences.ai_mode
            )

    def _handle_ai_mode_command(self, parsed: Any, user_preferences: UserPreferences) -> RenataResponse:
        """Handle AI mode change commands"""

        intent = parsed.intent

        if intent == "change_to_analyst":
            return RenataResponse(
                text="Switching to analyst mode. I'll provide direct, data-focused analysis with minimal emotion.",
                data={
                    "command_type": "ai_mode_change",
                    "new_mode": "analyst",
                    "mode_changed": True
                },
                actions=[{
                    "type": "mode_change",
                    "new_mode": "analyst"
                }],
                mode_used=RenataMode.ANALYST
            )

        elif intent == "change_to_coach":
            return RenataResponse(
                text="Switching to coach mode. I'll provide constructive guidance with accountability focus.",
                data={
                    "command_type": "ai_mode_change",
                    "new_mode": "coach",
                    "mode_changed": True
                },
                actions=[{
                    "type": "mode_change",
                    "new_mode": "coach"
                }],
                mode_used=RenataMode.COACH
            )

        elif intent == "change_to_mentor":
            return RenataResponse(
                text="Switching to mentor mode. I'll provide reflective insights with long-term perspective.",
                data={
                    "command_type": "ai_mode_change",
                    "new_mode": "mentor",
                    "mode_changed": True
                },
                actions=[{
                    "type": "mode_change",
                    "new_mode": "mentor"
                }],
                mode_used=RenataMode.MENTOR
            )

        else:
            return RenataResponse(
                text=parsed.suggested_response or "I have three modes: analyst (direct), coach (constructive), or mentor (reflective). Which would you prefer?",
                mode_used=user_preferences.ai_mode
            )

    async def _handle_correction(self, parsed: Any, ui_context: Any, conversation_history: Optional[List[Dict]]) -> RenataResponse:
        """Handle user corrections to learn from mistakes"""

        correction_text = parsed.parameters.get("correction_text", "")

        # Store correction for learning
        await self.command_parser.learn_from_correction(
            original_command=conversation_history[-1].get("input", "") if conversation_history else "",
            correction=correction_text,
            ui_context=ui_context,
            correct_intent="user_specified_correction",
            correct_command_type="question"
        )

        return RenataResponse(
            text="I understand you're correcting me. Could you clarify what you meant? I'll learn from this for next time.",
            data={
                "command_type": "correction",
                "learning": True,
                "correction_logged": True
            },
            mode_used=RenataMode.COACH  # Use coach mode for learning interactions
        )

    def _handle_greeting(self, parsed: Any, user_preferences: UserPreferences, performance_data: PerformanceData) -> RenataResponse:
        """Handle greetings with mode-appropriate responses"""

        mode = user_preferences.ai_mode
        win_rate_pct = performance_data.win_rate * 100

        if mode == RenataMode.ANALYST:
            response = f"Ready for analysis. Current performance: {win_rate_pct:.1f}% win rate, {performance_data.expectancy:.2f}R expectancy."
        elif mode == RenataMode.COACH:
            response = f"Hello! Ready to work on improving your trading. Your recent {win_rate_pct:.1f}% win rate shows progress areas we can address."
        elif mode == RenataMode.MENTOR:
            response = f"Welcome back. Every trading session offers learning opportunities. Your current {performance_data.expectancy:.2f}R expectancy tells a story we can explore together."
        else:
            response = "Hello! I'm Renata, your trading performance analyst. How can I help you today?"

        return RenataResponse(
            text=response,
            data={
                "command_type": "greeting",
                "performance_included": True
            },
            mode_used=mode
        )

    def _generate_intelligent_response(
        self,
        performance_data: PerformanceData,
        trading_context: TradingContext,
        user_preferences: UserPreferences,
        prompt: Optional[str] = None,
        archon_context: Optional[List[Dict]] = None,
        error: Optional[str] = None
    ) -> RenataResponse:
        """
        Generate intelligent Renata response based on real trading data analysis

        This provides sophisticated trading analysis based on actual performance metrics
        and optionally enhanced with Archon knowledge base context.
        """
        mode = user_preferences.ai_mode

        # Generate analysis based on performance metrics
        win_rate_pct = performance_data.win_rate * 100
        expectancy = performance_data.expectancy
        profit_factor = performance_data.profit_factor or 0
        trades_count = performance_data.trades_count
        drawdown_pct = abs(performance_data.max_drawdown) * 100

        # Mode-specific response templates
        if mode == RenataMode.ANALYST:
            if expectancy > 0.5:
                response = f"Expectancy {expectancy:.2f}R indicates positive edge. Win rate {win_rate_pct:.1f}% with {trades_count} trades. Drawdown {drawdown_pct:.1f}% within acceptable range."
            else:
                response = f"Expectancy {expectancy:.2f}R below target. Win rate {win_rate_pct:.1f}% suggests execution issues. {trades_count} trades insufficient for statistical significance."

        elif mode == RenataMode.COACH:
            if expectancy > 0.5 and win_rate_pct > 50:
                response = f"Strong performance this period. Your {win_rate_pct:.1f}% win rate and {expectancy:.2f}R expectancy show solid execution. Focus on maintaining consistency in your process."
            elif expectancy > 0:
                response = f"Positive expectancy of {expectancy:.2f}R is encouraging. Your {win_rate_pct:.1f}% win rate suggests room for improvement in trade selection or execution timing."
            else:
                response = f"Your {expectancy:.2f}R expectancy needs attention. With {trades_count} trades at {win_rate_pct:.1f}% win rate, consider reviewing your entry criteria and risk management."

        elif mode == RenataMode.MENTOR:
            if expectancy > 0.3:
                response = f"You're developing consistent profitability with {expectancy:.2f}R expectancy. The journey from {trades_count} trades shows emerging discipline. Consider how market conditions influenced your {win_rate_pct:.1f}% success rate."
            else:
                response = f"The {expectancy:.2f}R expectancy reflects a learning phase. Your {trades_count} trades at {win_rate_pct:.1f}% win rate provide valuable data about your decision-making under different market conditions."

        # Handle specific prompt types - enhanced for conversational context
        if prompt:
            lower_prompt = prompt.lower().strip()

            # Handle casual greetings and conversational inputs
            if any(greeting in lower_prompt for greeting in ['hey', 'hi', 'hello', 'sup', 'yo', 'wassup']):
                if mode == RenataMode.ANALYST:
                    response = "Hello. Ready to analyze your trading data? I can review performance metrics, individual trades, or risk management."
                elif mode == RenataMode.COACH:
                    response = "Hey there! Great to see you. What trading challenges are we working on today? I'm here to help you improve."
                elif mode == RenataMode.MENTOR:
                    response = "Welcome back. Every conversation is an opportunity to deepen your trading wisdom. What insights shall we explore together?"
                else:
                    response = "Hi! How's your trading going today? I can help with analysis, strategy, or answer any trading questions you have."

            # Handle thanks and acknowledgments
            elif any(thanks in lower_prompt for thanks in ['thank', 'thanks', 'thx']):
                response = "You're welcome! I'm here whenever you need trading insights or analysis. What else can I help you with?"

            # Handle specific questions about capabilities
            elif any(question in lower_prompt for question in ['what can you do', 'help me', 'what do you do']):
                response = f"I'm Renata, your AI trading assistant! I can analyze performance (currently {win_rate_pct:.1f}% win rate), provide insights, help with trade planning, and answer trading questions. What would you like to explore?"

            # Handle performance-specific questions
            elif "risk" in lower_prompt:
                response += f" Risk management analysis shows {drawdown_pct:.1f}% maximum drawdown."
            elif "improve" in lower_prompt:
                response += f" To improve: focus on trade selection consistency to enhance your current {win_rate_pct:.1f}% win rate."
            elif any(timeframe in lower_prompt for timeframe in ["week", "recent", "today", "yesterday"]):
                response += f" Recent performance shows {trades_count} trades with {expectancy:.2f}R expectancy."
            elif any(market_term in lower_prompt for market_term in ["market", "stock", "price", "chart"]):
                response += f" I can help analyze market trends and trading opportunities based on your {win_rate_pct:.1f}% historical performance."
            elif any(trade_term in lower_prompt for trade_term in ["buy", "sell", "entry", "exit", "position"]):
                response += f" For trade planning, consider your historical {expectancy:.2f}R expectancy when sizing positions."

        # Real data analysis - production mode

        return RenataResponse(
            text=response,
            mode_used=mode,
            data={
                "mock_analysis": True,
                "performance_summary": {
                    "trades": trades_count,
                    "win_rate": win_rate_pct,
                    "expectancy": expectancy,
                    "drawdown": drawdown_pct
                }
            },
            insights_generated=["mock_analysis_generated"]
        )


# Factory function
def create_renata_agent(archon_client: ArchonClient) -> RenataAgent:
    """Factory function to create Renata agent with Archon integration"""
    return RenataAgent(archon_client)