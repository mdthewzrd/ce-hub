"""
Optimizer Agent

Specialist agent for parameter tuning, optimization, and robustness testing.
Prevents overfitting and ensures strategies work across market conditions.
"""

import re
from typing import Optional, Dict, Any

from .base_agent import SimpleAgent


class OptimizerAgent(SimpleAgent):
    """Agent for optimizing strategy parameters."""

    def __init__(self, **kwargs):
        super().__init__(name="optimizer", **kwargs)

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process optimization request."""
        analysis = self._analyze_request(user_input)
        knowledge_query = self._build_knowledge_query(analysis)

        return await self.process_with_knowledge(
            user_input=user_input,
            context=context,
            knowledge_query=knowledge_query,
            match_count=7
        )

    def _analyze_request(self, user_input: str) -> Dict[str, Any]:
        """Analyze optimization request."""
        analysis = {
            "optimization_method": "grid_search",
            "objective": "sharpe_ratio",
            "needs_walk_forward": True,
            "param_count": 0,
        }

        user_input_lower = user_input.lower()

        # Method detection
        if "bayesian" in user_input_lower:
            analysis["optimization_method"] = "bayesian"
        elif "random" in user_input_lower:
            analysis["optimization_method"] = "random_search"

        # Count parameters mentioned
        param_keywords = ["lookback", "period", "threshold", "multiplier", "atr", "rsi", "macd"]
        analysis["param_count"] = sum(1 for kw in param_keywords if kw in user_input_lower)

        # Switch method based on parameter count
        if analysis["param_count"] > 6:
            analysis["optimization_method"] = "bayesian"
        elif analysis["param_count"] > 3:
            analysis["optimization_method"] = "random_search"

        # Objective detection
        if "profit factor" in user_input_lower:
            analysis["objective"] = "profit_factor"
        elif "return" in user_input_lower or "total return" in user_input_lower:
            analysis["objective"] = "total_return"
        elif "sortino" in user_input_lower:
            analysis["objective"] = "sortino_ratio"
        elif "drawdown" in user_input_lower:
            analysis["objective"] = "calmar_ratio"  # return/drawdown

        # Walk-forward detection
        if "walk" in user_input_lower or "forward" in user_input_lower or "robust" in user_input_lower:
            analysis["needs_walk_forward"] = True

        return analysis

    def _build_knowledge_query(self, analysis: Dict[str, Any]) -> str:
        """Build knowledge query."""
        parts = [
            "optimization",
            analysis["optimization_method"],
            analysis["objective"],
        ]

        if analysis["needs_walk_forward"]:
            parts.append("walk forward analysis")

        parts.append("overfitting prevention")

        return " ".join(parts)


def create_optimizer(**kwargs) -> OptimizerAgent:
    """Create an optimizer agent."""
    return OptimizerAgent(**kwargs)
