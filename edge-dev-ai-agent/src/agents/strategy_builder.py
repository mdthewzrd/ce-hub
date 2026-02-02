"""
Strategy Builder Agent

Specialist agent for designing complete execution strategies with
entry rules, position sizing, pyramiding, stops, targets, and capital management.
"""

import re
from typing import Optional, Dict, Any

from .base_agent import SimpleAgent


class StrategyBuilderAgent(SimpleAgent):
    """Agent for building complete trading execution strategies."""

    def __init__(self, **kwargs):
        super().__init__(name="strategy_builder", **kwargs)

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process strategy building request."""
        # Extract key information from user request
        analysis = self._analyze_request(user_input)

        # Build knowledge query
        knowledge_query = self._build_knowledge_query(analysis)

        # Process with knowledge
        return await self.process_with_knowledge(
            user_input=user_input,
            context=context,
            knowledge_query=knowledge_query,
            match_count=7
        )

    def _analyze_request(self, user_input: str) -> Dict[str, Any]:
        """Analyze user request to extract strategy requirements."""
        analysis = {
            "strategy_type": None,
            "entry_type": "unknown",
            "timeframe": "daily",
            "components": [],
            "risk_level": "medium",
        }

        user_input_lower = user_input.lower()

        # Strategy type detection
        if "mean reversion" in user_input_lower or "revers" in user_input_lower:
            analysis["strategy_type"] = "mean_reversion"
        elif "momentum" in user_input_lower or "breakout" in user_input_lower:
            analysis["strategy_type"] = "momentum"
        elif "trend" in user_input_lower:
            analysis["strategy_type"] = "trend_following"

        # Entry type detection
        if "scanner" in user_input_lower:
            analysis["entry_type"] = "scanner_based"
        elif "signal" in user_input_lower:
            analysis["entry_type"] = "custom_signal"
        elif "manual" in user_input_lower:
            analysis["entry_type"] = "manual"

        # Component detection
        components = {
            "pyramid": r"\bpyramid\b|\bscale\s+in\b|\badd\b.*\bposition\b",
            "stops": r"\bstop\b.*\bloss\b|\bstop\b|\bexit\b",
            "targets": r"\btarget\b|\btake\b.*\bprofit\b|\bexit\b.*\bprofit\b",
            "position sizing": r"\bposition\b.*\bsize\b|\brisk\b.*\bper\b.*\btrade\b",
            "trailing": r"\btrail\b.*\bstop\b|\btrailing\b",
            "retry": r"\bre[-]?entry\b|\btry\b.*\bagain\b",
            "recycling": r"\brecycl[e]?n?\b|\breinvest\b",
        }

        for component, pattern in components.items():
            if re.search(pattern, user_input_lower):
                analysis["components"].append(component)

        # Timeframe detection
        if "intraday" in user_input_lower or "day trading" in user_input_lower:
            analysis["timeframe"] = "intraday"
        elif "swing" in user_input_lower:
            analysis["timeframe"] = "swing"
        elif "weekly" in user_input_lower or "position" in user_input_lower:
            analysis["timeframe"] = "position"

        # Risk level detection
        if "conservative" in user_input_lower or "low risk" in user_input_lower:
            analysis["risk_level"] = "low"
        elif "aggressive" in user_input_lower or "high risk" in user_input_lower:
            analysis["risk_level"] = "high"

        return analysis

    def _build_knowledge_query(self, analysis: Dict[str, Any]) -> str:
        """Build knowledge query from analysis."""
        parts = []

        if analysis["strategy_type"]:
            parts.append(analysis["strategy_type"].replace("_", " "))

        if analysis["components"]:
            parts.extend(analysis["components"])

        if analysis["timeframe"]:
            parts.append(f"{analysis['timeframe']} trading")

        return " ".join(parts) if parts else "trading strategy execution components"


def create_strategy_builder(**kwargs) -> StrategyBuilderAgent:
    """Create a strategy builder agent."""
    return StrategyBuilderAgent(**kwargs)
