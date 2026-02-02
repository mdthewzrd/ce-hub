"""
Validator Agent

Specialist agent for code quality, V31 compliance, and standards validation.
Reviews code, strategies, and configurations before deployment.
"""

import re
from typing import Optional, Dict, Any

from .base_agent import SimpleAgent


class ValidatorAgent(SimpleAgent):
    """Agent for validating code quality and standards compliance."""

    def __init__(self, **kwargs):
        super().__init__(name="validator", **kwargs)

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process validation request."""
        analysis = self._analyze_request(user_input)
        knowledge_query = self._build_knowledge_query(analysis)

        return await self.process_with_knowledge(
            user_input=user_input,
            context=context,
            knowledge_query=knowledge_query,
            match_count=7
        )

    def _analyze_request(self, user_input: str) -> Dict[str, Any]:
        """Analyze validation request."""
        analysis = {
            "validation_type": "code",
            "target": "scanner",
            "standards": ["v31"],
            "focus_areas": [],
        }

        user_input_lower = user_input.lower()

        # Validation type detection
        if "strategy" in user_input_lower:
            analysis["validation_type"] = "strategy"
            analysis["target"] = "strategy"
        elif "backtest" in user_input_lower:
            analysis["validation_type"] = "backtest_config"

        # V31 detection
        if "v31" in user_input_lower or "scanner" in user_input_lower:
            analysis["standards"].append("v31")

        # Focus areas
        if "code" in user_input_lower or "python" in user_input_lower:
            analysis["focus_areas"].append("code_quality")

        if "risk" in user_input_lower:
            analysis["focus_areas"].append("risk_management")

        if "standards" in user_input_lower or "compliance" in user_input_lower:
            analysis["focus_areas"].append("standards_compliance")

        if "best practices" in user_input_lower:
            analysis["focus_areas"].append("best_practices")

        return analysis

    def _build_knowledge_query(self, analysis: Dict[str, Any]) -> str:
        """Build knowledge query."""
        parts = ["validation", analysis["validation_type"]]

        if analysis["standards"]:
            parts.extend(analysis["standards"])

        if analysis["focus_areas"]:
            parts.extend(analysis["focus_areas"])

        return " ".join(parts)


def create_validator(**kwargs) -> ValidatorAgent:
    """Create a validator agent."""
    return ValidatorAgent(**kwargs)
