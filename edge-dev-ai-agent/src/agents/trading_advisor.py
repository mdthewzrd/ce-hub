"""
Trading Advisor Agent

Specialist agent for market analysis, edge assessment, and trading insights.
Provides advice on market conditions, strategy edges, and risk management.
"""

import re
from typing import Optional, Dict, Any

from .base_agent import SimpleAgent


class TradingAdvisorAgent(SimpleAgent):
    """Agent for trading advice and market analysis."""

    def __init__(self, **kwargs):
        super().__init__(name="trading_advisor", **kwargs)

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process trading advice request."""
        analysis = self._analyze_request(user_input)
        knowledge_query = self._build_knowledge_query(analysis)

        return await self.process_with_knowledge(
            user_input=user_input,
            context=context,
            knowledge_query=knowledge_query,
            match_count=7
        )

    def _analyze_request(self, user_input: str) -> Dict[str, Any]:
        """Analyze trading advice request."""
        analysis = {
            "advice_type": "general",
            "topic": None,
            "asset_class": "stocks",
            "timeframe": "swing",
        }

        user_input_lower = user_input.lower()

        # Advice type detection
        if "regime" in user_input_lower or "market condition" in user_input_lower:
            analysis["advice_type"] = "regime_analysis"

        elif "edge" in user_input_lower or "advantage" in user_input_lower:
            analysis["advice_type"] = "edge_assessment"

        elif "risk" in user_input_lower or "position size" in user_input_lower:
            analysis["advice_type"] = "risk_analysis"

        elif "buy" in user_input_lower or "sell" in user_input_lower or "trade" in user_input_lower:
            analysis["advice_type"] = "trade_recommendation"

        elif "backtest" in user_input_lower or "performance" in user_input_lower or "result" in user_input_lower:
            analysis["advice_type"] = "performance_analysis"

        # Topic detection
        topics = {
            "mean reversion": r"\bmean[- ]?reversion\b",
            "momentum": r"\bmomentum\b|\bbreakout\b",
            "scanner": r"\bscann?e?r?\b",
            "strategy": r"\bstrategy\b|\bsystem\b",
            "volatility": r"\bvola[t]?i?l?i?t?y?\b",
        }

        for topic, pattern in topics.items():
            if re.search(pattern, user_input_lower):
                analysis["topic"] = topic
                break

        # Asset class detection
        if "etf" in user_input_lower or "spy" in user_input_lower or "qqq" in user_input_lower:
            analysis["asset_class"] = "etf"
        elif "forex" in user_input_lower or "currency" in user_input_lower:
            analysis["asset_class"] = "forex"
        elif "crypto" in user_input_lower or "bitcoin" in user_input_lower or "btc" in user_input_lower:
            analysis["asset_class"] = "crypto"
        elif "options" in user_input_lower or "calls" in user_input_lower or "puts" in user_input_lower:
            analysis["asset_class"] = "options"

        # Timeframe detection
        if "intraday" in user_input_lower or "day" in user_input_lower:
            analysis["timeframe"] = "intraday"
        elif "swing" in user_input_lower:
            analysis["timeframe"] = "swing"
        elif "weekly" in user_input_lower or "position" in user_input_lower:
            analysis["timeframe"] = "position"

        return analysis

    def _build_knowledge_query(self, analysis: Dict[str, Any]) -> str:
        """Build knowledge query."""
        parts = []

        if analysis["advice_type"] != "general":
            parts.append(analysis["advice_type"])

        if analysis["topic"]:
            parts.append(analysis["topic"])

        if analysis["asset_class"]:
            parts.append(analysis["asset_class"])

        return " ".join(parts) if parts else "trading advice analysis"


def create_trading_advisor(**kwargs) -> TradingAdvisorAgent:
    """Create a trading advisor agent."""
    return TradingAdvisorAgent(**kwargs)
