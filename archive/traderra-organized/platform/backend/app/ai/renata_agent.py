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
        self._setup_pydantic_agents()

    def _setup_pydantic_agents(self):
        """Initialize PydanticAI agents for each mode"""

        # Base system prompt for all modes
        base_prompt = """
You are Renata, a professional AI trading performance analyst for Traderra.

Core Principles:
- You are direct, objective, and never motivational
- You speak professionally with short sentences and precise words
- You always cite metrics when giving feedback
- You never make predictions or financial advice
- You adjust tone via mode but maintain professional standards
- Use numerical context (Expectancy, R, Win %, Profit Factor) in responses
- Never use emojis, slang, or filler words

Your responses should be:
- Factual and data-driven
- Contextually aware using provided background
- Appropriate to your current mode
- Actionable when possible
"""

        # Analyst Mode Agent
        self.analyst_agent = Agent(
            model=f"openai:{settings.openai_model}",
            system_prompt=base_prompt + """
Mode: ANALYST
- Tone: Clinical, direct, minimal emotion
- Focus: Raw, unfiltered performance truth
- Style: Declarative, compact, metric-driven
- Avoid: Motivational phrasing, softening language
- Example: "Expectancy fell 0.2R. Entry timing variance increased. Risk exceeded threshold in 3 trades."
""",
            deps_type=TradingContext,
        )

        # Coach Mode Agent
        self.coach_agent = Agent(
            model=f"openai:{settings.openai_model}",
            system_prompt=base_prompt + """
Mode: COACH
- Tone: Professional but constructive
- Focus: Results with actionable suggestions
- Style: Mix of observation and correction
- Frame: Observations as correctable actions
- Example: "You performed better managing losses this week. Focus on execution timing to stabilize expectancy."
""",
            deps_type=TradingContext,
        )

        # Mentor Mode Agent
        self.mentor_agent = Agent(
            model=f"openai:{settings.openai_model}",
            system_prompt=base_prompt + """
Mode: MENTOR
- Tone: Reflective, narrative-oriented
- Focus: Building understanding through reflection
- Style: Longer cadence with causal linking
- Approach: Correlate data with human patterns
- Example: "You showed steadiness under pressure. The expectancy deviation stemmed from subtle confidence shifts. Let's examine where conviction wavered."
""",
            deps_type=TradingContext,
        )

        # Register tools for all agents
        for agent in [self.analyst_agent, self.coach_agent, self.mentor_agent]:
            agent.tool(self._analyze_performance_tool)
            agent.tool(self._get_historical_context_tool)

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
            # PLAN: Determine analysis approach and mode
            mode = user_preferences.ai_mode
            agent = self._get_agent_for_mode(mode)

            # RESEARCH: Query Archon for relevant context
            research_query = self._build_research_query(performance_data, prompt)
            archon_context = await self.archon.search_trading_knowledge(
                query=research_query,
                match_count=8
            )

            # Build comprehensive prompt
            analysis_prompt = self._build_analysis_prompt(
                performance_data=performance_data,
                context=trading_context,
                preferences=user_preferences,
                archon_context=archon_context.data if archon_context.success else [],
                user_prompt=prompt
            )

            # PRODUCE: Generate analysis using PydanticAI with Archon context
            result = await agent.run(
                analysis_prompt,
                deps=trading_context
            )

            # Extract insights for ingestion
            insights = self._extract_insights(result, performance_data)

            # INGEST: Store insights back to Archon
            if insights:
                await self._ingest_insights(
                    insights=insights,
                    context=trading_context,
                    mode=mode
                )

            # Return formatted response
            return RenataResponse(
                text=result.data,
                mode_used=mode,
                archon_sources=[r.get("id") for r in archon_context.data] if archon_context.success else [],
                insights_generated=insights
            )

        except Exception as e:
            logger.error(f"Renata analysis failed: {e}")
            # Fallback response
            return RenataResponse(
                text="Analysis temporarily unavailable. Please try again.",
                mode_used=user_preferences.ai_mode
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


# Factory function
def create_renata_agent(archon_client: ArchonClient) -> RenataAgent:
    """Factory function to create Renata agent with Archon integration"""
    return RenataAgent(archon_client)