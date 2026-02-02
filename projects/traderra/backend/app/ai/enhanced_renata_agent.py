"""
Enhanced Renata AI Agent with Trading Context Learning

This enhanced version of Renata incorporates the trading context learning engine
to provide personalized responses based on user corrections and feedback.

Key enhancements:
1. Integration with learning engine for context-aware responses
2. Automatic application of learned terminology and preferences
3. Improved understanding of user-specific trading concepts
4. Feedback collection for continuous learning
"""

import logging
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime
from dataclasses import dataclass

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, Tool
from sqlalchemy.orm import Session

from ..core.archon_client import ArchonClient
from ..core.config import settings
from .learning_engine import TradingContextLearningEngine, UserLearningContext, FeedbackData, CorrectionData
from .renata_agent import (
    RenataMode,
    UserPreferences,
    TradingContext,
    PerformanceData,
    RenataResponse
)

logger = logging.getLogger(__name__)


@dataclass
class EnhancedRenataResponse:
    """Extended response with learning capabilities"""
    text: str
    data: Optional[Dict[str, Any]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    mode_used: Optional[RenataMode] = None
    archon_sources: Optional[List[str]] = None
    insights_generated: Optional[List[str]] = None
    learning_applied: bool = False
    learning_confidence: float = 0.0
    terminology_used: Optional[Dict[str, str]] = None
    feedback_prompt: Optional[str] = None


class LearningFeedback(BaseModel):
    """Feedback structure for learning"""
    feedback_type: Literal["thumbs_up", "thumbs_down", "fix_understanding"]
    feedback_details: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    correction: Optional[str] = None


class EnhancedRenataAgent:
    """
    Enhanced Renata Agent with Trading Context Learning

    This version of Renata learns from user interactions and adapts
    responses based on individual user's trading context and terminology.
    """

    def __init__(self, archon_client: ArchonClient, db_session: Optional[Session] = None):
        self.archon = archon_client
        self.db = db_session
        self.agents_initialized = False

        # Initialize learning engine if database available
        self.learning_engine = None
        if db_session:
            self.learning_engine = TradingContextLearningEngine(db_session, archon_client)

        # Initialize command parser for intelligent command processing
        try:
            from .command_parser import get_command_parser
            self.command_parser = get_command_parser(archon_client)
        except ImportError:
            self.command_parser = None
            logger.warning("Command parser not available")

        try:
            self._setup_pydantic_agents()
            self.agents_initialized = True
        except Exception as e:
            logger.warning(f"PydanticAI agents initialization failed: {e}. Using mock responses.")
            self.agents_initialized = False

    def _setup_pydantic_agents(self):
        """Initialize PydanticAI agents for each mode with learning awareness"""

        # Enhanced base prompt that includes learning context
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

LEARNING CONTEXT AWARENESS:
- Apply user-specific terminology learned from previous interactions
- Respect user's trading strategy preferences and risk tolerance
- Reference previous corrections to avoid misunderstandings
- When uncertain about user's meaning, ask for clarification

Your responses should be:
- Factual and data-driven
- Contextually aware using provided background AND learned user context
- Appropriate to your current mode
- Actionable when possible
- Personalized based on learned user preferences
"""

        # Determine which model to use
        if settings.enable_openrouter and settings.openrouter_api_key:
            model_prefix = "openrouter"
            model_name = settings.openrouter_model
        else:
            model_prefix = "openai"
            model_name = settings.openai_model

        # Analyst Mode Agent
        self.analyst_agent = Agent(
            model=f"{model_prefix}:{model_name}",
            system_prompt=base_prompt + """
Mode: ANALYST
- Tone: Clinical, direct, minimal emotion
- Focus: Raw, unfiltered performance truth
- Style: Declarative, compact, metric-driven
- Avoid: Motivational phrasing, softening language
- Learning Application: Use exact terminology user prefers, maintain clinical objectivity
- Example: "Expectancy fell 0.2R. Entry timing variance increased. Risk exceeded threshold in 3 trades."
""",
            deps_type=TradingContext,
        )

        # Coach Mode Agent
        self.coach_agent = Agent(
            model=f"{model_prefix}:{model_name}",
            system_prompt=base_prompt + """
Mode: COACH
- Tone: Professional but constructive
- Focus: Results with actionable suggestions
- Style: Mix of observation and correction
- Frame: Observations as correctable actions
- Learning Application: Apply user's strategy preferences, respect their risk tolerance
- Example: "You performed better managing losses this week. Focus on execution timing to stabilize expectancy."
""",
            deps_type=TradingContext,
        )

        # Mentor Mode Agent
        self.mentor_agent = Agent(
            model=f"{model_prefix}:{model_name}",
            system_prompt=base_prompt + """
Mode: MENTOR
- Tone: Reflective, narrative-oriented
- Focus: Building understanding through reflection
- Style: Longer cadence with causal linking
- Approach: Correlate data with human patterns
- Learning Application: Reference user's learning journey, acknowledge their growth
- Example: "You showed steadiness under pressure. The expectancy deviation stemmed from subtle confidence shifts. Let's examine where conviction wavered."
""",
            deps_type=TradingContext,
        )

        # Register tools for all agents
        for agent in [self.analyst_agent, self.coach_agent, self.mentor_agent]:
            agent.tool(self._analyze_performance_with_learning_tool)
            agent.tool(self._get_historical_context_tool)

    @Tool
    async def _analyze_performance_with_learning_tool(
        self,
        time_range: str,
        metrics: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """Enhanced analysis tool that incorporates learned user context"""

        # RESEARCH phase: Query Archon for relevant patterns
        query = f"trading performance analysis {time_range}"
        archon_response = await self.archon.search_trading_knowledge(
            query=query,
            match_count=5
        )

        performance_context = []
        if archon_response.success:
            performance_context = archon_response.data

        # Get user learning context if available
        learning_context = None
        if self.learning_engine:
            try:
                learning_context = await self.learning_engine.get_user_learning_context(user_id)
            except Exception as e:
                logger.warning(f"Failed to get learning context for user {user_id}: {e}")

        # Return structured analysis with learning context
        return {
            "metrics": metrics,
            "archon_context": performance_context,
            "learning_context": learning_context.__dict__ if learning_context else None,
            "analysis_timestamp": datetime.now().isoformat(),
            "context_sources": len(performance_context),
            "learning_applied": learning_context is not None
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

    async def analyze_performance_with_learning(
        self,
        user_id: str,
        performance_data: PerformanceData,
        trading_context: TradingContext,
        user_preferences: UserPreferences,
        prompt: Optional[str] = None
    ) -> EnhancedRenataResponse:
        """
        Enhanced performance analysis with learning context application

        This method follows the CE-Hub workflow with learning integration:
        Plan → Research (+ Learning Context) → Produce → Ingest
        """
        try:
            # Get user learning context first
            learning_context = None
            if self.learning_engine:
                try:
                    learning_context = await self.learning_engine.get_user_learning_context(user_id)
                except Exception as e:
                    logger.warning(f"Could not load learning context: {e}")

            # Check if agents are initialized (OpenAI available)
            if not self.agents_initialized:
                logger.info("Using mock response - OpenAI agents not available")
                return self._generate_enhanced_mock_response(
                    performance_data=performance_data,
                    trading_context=trading_context,
                    user_preferences=user_preferences,
                    prompt=prompt,
                    learning_context=learning_context
                )

            # PLAN: Determine analysis approach and mode
            mode = user_preferences.ai_mode
            agent = self._get_agent_for_mode(mode)

            # RESEARCH: Query Archon for relevant context
            research_query = self._build_research_query(performance_data, prompt)
            archon_context = await self.archon.search_trading_knowledge(
                query=research_query,
                match_count=8
            )

            # Build enhanced prompt with learning context
            analysis_prompt = self._build_enhanced_analysis_prompt(
                performance_data=performance_data,
                context=trading_context,
                preferences=user_preferences,
                archon_context=archon_context.data if archon_context.success else [],
                user_prompt=prompt,
                learning_context=learning_context
            )

            # PRODUCE: Generate analysis using PydanticAI with enhanced context
            result = await agent.run(
                analysis_prompt,
                deps=trading_context
            )

            # Extract insights for ingestion
            insights = self._extract_insights(result, performance_data)

            # INGEST: Store insights back to Archon including learning insights
            if insights:
                await self._ingest_enhanced_insights(
                    insights=insights,
                    context=trading_context,
                    mode=mode,
                    learning_applied=learning_context is not None
                )

            # Prepare feedback prompt for learning
            feedback_prompt = self._generate_feedback_prompt(result.data, learning_context)

            # Return enhanced response
            return EnhancedRenataResponse(
                text=result.data,
                mode_used=mode,
                archon_sources=[r.get("id") for r in archon_context.data] if archon_context.success else [],
                insights_generated=insights,
                learning_applied=learning_context is not None,
                learning_confidence=learning_context.understanding_accuracy if learning_context else 0.0,
                terminology_used=learning_context.terminology_mappings if learning_context else None,
                feedback_prompt=feedback_prompt
            )

        except Exception as e:
            logger.error(f"Enhanced Renata analysis failed: {e}")
            # Enhanced fallback response with learning context
            return self._generate_enhanced_mock_response(
                performance_data=performance_data,
                trading_context=trading_context,
                user_preferences=user_preferences,
                prompt=prompt,
                learning_context=learning_context,
                error=str(e)
            )

    async def collect_feedback(
        self,
        user_id: str,
        user_query: str,
        renata_response: str,
        feedback: LearningFeedback,
        renata_mode: str,
        trading_context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Collect user feedback for learning

        Args:
            user_id: User identifier
            user_query: Original user query
            renata_response: Renata's response
            feedback: User feedback data
            renata_mode: Mode used for response
            trading_context: Trading context at time of response

        Returns:
            True if feedback was successfully collected
        """
        if not self.learning_engine:
            logger.warning("Learning engine not available for feedback collection")
            return False

        try:
            feedback_data = FeedbackData(
                feedback_type=feedback.feedback_type,
                user_query=user_query,
                renata_response=renata_response,
                feedback_details=feedback.feedback_details,
                improvement_suggestions=feedback.improvement_suggestions,
                renata_mode=renata_mode,
                trading_context=trading_context
            )

            success = await self.learning_engine.collect_user_feedback(user_id, feedback_data)

            # If it's a correction, also collect the correction
            if feedback.feedback_type == "fix_understanding" and feedback.correction:
                correction_data = CorrectionData(
                    original_user_input=user_query,
                    renata_interpretation=renata_response,
                    renata_response=renata_response,
                    user_correction=feedback.correction,
                    correction_type="general",  # Could be more specific
                    trading_concept=None  # Could be extracted from context
                )

                await self.learning_engine.collect_user_correction(user_id, correction_data)

            return success

        except Exception as e:
            logger.error(f"Failed to collect feedback: {e}")
            return False

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

    def _build_enhanced_analysis_prompt(
        self,
        performance_data: PerformanceData,
        context: TradingContext,
        preferences: UserPreferences,
        archon_context: List[Dict],
        user_prompt: Optional[str] = None,
        learning_context: Optional[UserLearningContext] = None
    ) -> str:
        """Build comprehensive prompt with learning context"""

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

        # Apply learning context if available
        if learning_context and self.learning_engine:
            base_prompt = self.learning_engine.apply_learning_to_prompt(base_prompt, learning_context)

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

    async def _ingest_enhanced_insights(
        self,
        insights: List[str],
        context: TradingContext,
        mode: RenataMode,
        learning_applied: bool
    ):
        """Ingest insights back to Archon for learning including learning metadata"""

        from ..core.archon_client import TradingInsight

        insight_data = TradingInsight(
            content={
                "insights": insights,
                "mode_used": mode.value,
                "user_context": context.dict(),
                "timestamp": datetime.now().isoformat(),
                "learning_applied": learning_applied,
                "enhanced_analysis": True
            },
            tags=["ai_analysis", f"mode_{mode.value}", "performance_insights", "enhanced_renata"],
            insight_type="enhanced_ai_analysis"
        )

        await self.archon.ingest_trading_insight(insight_data)

    def _generate_feedback_prompt(
        self,
        response_text: str,
        learning_context: Optional[UserLearningContext]
    ) -> str:
        """Generate contextual feedback prompt for the user"""

        if learning_context and learning_context.understanding_accuracy < 0.8:
            return "Was this response helpful? If not, please let me know how I can better understand your trading approach."
        else:
            return "How was this analysis? Your feedback helps me provide better insights."

    def _generate_enhanced_mock_response(
        self,
        performance_data: PerformanceData,
        trading_context: TradingContext,
        user_preferences: UserPreferences,
        prompt: Optional[str] = None,
        learning_context: Optional[UserLearningContext] = None,
        error: Optional[str] = None
    ) -> EnhancedRenataResponse:
        """Generate enhanced mock response with learning awareness"""

        mode = user_preferences.ai_mode

        # Generate analysis based on performance metrics
        win_rate_pct = performance_data.win_rate * 100
        expectancy = performance_data.expectancy
        trades_count = performance_data.trades_count

        # Apply learned terminology if available
        terminology_used = {}
        if learning_context and learning_context.terminology_mappings:
            terminology_used = learning_context.terminology_mappings

        # Mode-specific response templates with learning awareness
        if mode == RenataMode.ANALYST:
            if expectancy > 0.5:
                response = f"Expectancy {expectancy:.2f}R indicates positive edge. Win rate {win_rate_pct:.1f}% with {trades_count} trades."
            else:
                response = f"Expectancy {expectancy:.2f}R below target. Win rate {win_rate_pct:.1f}% suggests execution issues."

        elif mode == RenataMode.COACH:
            if expectancy > 0.5 and win_rate_pct > 50:
                response = f"Strong performance this period. Your {win_rate_pct:.1f}% win rate and {expectancy:.2f}R expectancy show solid execution."
            else:
                response = f"Your {expectancy:.2f}R expectancy needs attention. With {trades_count} trades at {win_rate_pct:.1f}% win rate, consider reviewing your entry criteria."

        elif mode == RenataMode.MENTOR:
            response = f"You're developing consistency with {expectancy:.2f}R expectancy. Your {trades_count} trades show emerging discipline."

        # Add learning context awareness
        if learning_context and learning_context.recent_corrections:
            response += " I've noted your previous feedback and am applying what I've learned about your approach."

        # Production mode - no demo notice

        return EnhancedRenataResponse(
            text=response,
            mode_used=mode,
            learning_applied=learning_context is not None,
            learning_confidence=learning_context.understanding_accuracy if learning_context else 0.0,
            terminology_used=terminology_used,
            feedback_prompt="How was this response? Your feedback helps me learn your preferences.",
            data={
                "enhanced_mock": True,
                "learning_context_applied": learning_context is not None,
                "performance_summary": {
                    "trades": trades_count,
                    "win_rate": win_rate_pct,
                    "expectancy": expectancy
                }
            },
            insights_generated=["enhanced_mock_analysis_generated"]
        )


# Factory function
def create_enhanced_renata_agent(
    archon_client: ArchonClient,
    db_session: Optional[Session] = None
) -> EnhancedRenataAgent:
    """Factory function to create enhanced Renata agent with learning capabilities"""
    return EnhancedRenataAgent(archon_client, db_session)