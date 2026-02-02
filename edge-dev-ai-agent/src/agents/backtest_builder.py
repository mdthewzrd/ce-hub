"""
Backtest Builder Agent

Specialist agent for creating and running backtests to validate strategies.
Handles configuration, execution simulation, and performance analysis.
"""

import re
from typing import Optional, Dict, Any

from .base_agent import SimpleAgent


class BacktestBuilderAgent(SimpleAgent):
    """Agent for building and running strategy backtests."""

    def __init__(self, **kwargs):
        super().__init__(name="backtest_builder", **kwargs)

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process backtest building request."""
        analysis = self._analyze_request(user_input)
        knowledge_query = self._build_knowledge_query(analysis)

        return await self.process_with_knowledge(
            user_input=user_input,
            context=context,
            knowledge_query=knowledge_query,
            match_count=7
        )

    def _analyze_request(self, user_input: str) -> Dict[str, Any]:
        """Analyze backtest request."""
        analysis = {
            "backtest_type": "simple",
            "timeframe": "daily",
            "universe": "stocks",
            "needs_optimization": False,
            "needs_validation": False,
        }

        user_input_lower = user_input.lower()

        # Backtest type detection
        if "enhanced" in user_input_lower or "intraday" in user_input_lower:
            analysis["backtest_type"] = "enhanced_intraday"
        elif "full" in user_input_lower or "complete" in user_input_lower or "production" in user_input_lower:
            analysis["backtest_type"] = "full_strategy"

        # Universe detection
        if "etf" in user_input_lower or "spy" in user_input_lower or "qqq" in user_input_lower:
            analysis["universe"] = "etf"
        elif "forex" in user_input_lower or "currency" in user_input_lower:
            analysis["universe"] = "forex"
        elif "crypto" in user_input_lower or "bitcoin" in user_input_lower:
            analysis["universe"] = "crypto"

        # Optimization detection
        if "optim" in user_input_lower or "tune" in user_input_lower or "improve" in user_input_lower:
            analysis["needs_optimization"] = True

        # Validation detection
        if "validat" in user_input_lower or "verify" in user_input_lower or "confirm" in user_input_lower:
            analysis["needs_validation"] = True

        return analysis

    def _build_knowledge_query(self, analysis: Dict[str, Any]) -> str:
        """Build knowledge query."""
        parts = ["backtest", analysis["backtest_type"]]

        if analysis["needs_optimization"]:
            parts.append("optimization")

        if analysis["needs_validation"]:
            parts.append("validation")

        return " ".join(parts)


def create_backtest_builder(**kwargs) -> BacktestBuilderAgent:
    """Create a backtest builder agent."""
    return BacktestBuilderAgent(**kwargs)
