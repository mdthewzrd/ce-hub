"""
Scanner Builder Agent (Enhanced)

Specialist agent for building V31-compliant trading scanners.
Now extracts code from responses and saves to files.
"""

import re
from typing import Optional, Dict, Any
from pathlib import Path

from .base_agent import SimpleAgent
from ..code.generator import CodeGenerator, CodeExtractor
from ..code.validator import CodeValidator


class ScannerBuilderAgent(SimpleAgent):
    """Agent for building V31-compliant trading scanners."""

    def __init__(self, **kwargs):
        super().__init__(name="scanner_builder", **kwargs)
        self.code_generator = CodeGenerator(output_dir="generated_scanners")
        self.code_validator = CodeValidator()

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process scanner building request."""
        # Extract key information from user request
        analysis = self._analyze_request(user_input)

        # Build knowledge query
        if analysis["pattern_type"]:
            knowledge_query = f"{analysis['pattern_type']} scanner V31 pattern"
        elif analysis["indicators"]:
            knowledge_query = f"scanner {analysis['indicators']} indicators"
        else:
            knowledge_query = "V31 scanner architecture pattern detection"

        # Process with knowledge
        response = await self.process_with_knowledge(
            user_input=user_input,
            context=context,
            knowledge_query=knowledge_query,
            match_count=7  # Get more results for scanner building
        )

        # Try to extract and save code from the response
        code_saved = await self._extract_and_save_code(response, analysis)

        if code_saved:
            response += f"\n\n---\n\n✅ **Code saved to**: `{code_saved}`"

        return response

    async def _extract_and_save_code(
        self,
        response: str,
        analysis: Dict[str, str]
    ) -> Optional[str]:
        """Extract code from response and save to file.

        Args:
            response: Agent's response text
            analysis: Request analysis

        Returns:
            Path to saved file, or None if no code found
        """
        # Extract code blocks
        python_code_list = self.code_generator.extract_python_code(response)

        if not python_code_list:
            return None

        # Use the first/main code block
        code = python_code_list[0]

        # Validate the code
        validation = self.code_validator.validate_all(code, check_v31=True)

        # Add validation info to response
        if validation.has_errors:
            # Code has errors - don't save, or save with warning
            return None

        # Create and save file
        generated_file = self.code_generator.create_generated_file(
            code=code,
            description=analysis.get("pattern_type") or "scanner",
            subdirectory=analysis.get("pattern_type", "").replace(" ", "_")
        )

        file_path = self.code_generator.save_code(generated_file)

        return str(file_path.relative_to(Path.cwd()))

    def _analyze_request(self, user_input: str) -> Dict[str, str]:
        """Analyze user request to extract scanner requirements.

        Args:
            user_input: User's scanner request

        Returns:
            Dictionary with extracted information
        """
        analysis = {
            "pattern_type": None,
            "indicators": [],
            "timeframe": "daily",
            "filters": [],
        }

        user_input_lower = user_input.lower()

        # Pattern type detection
        patterns = {
            "mean reversion": r"\bmean[- ]?reversion\b",
            "momentum": r"\bmomentum\b|\bbreakout\b",
            "gap": r"\bgap\b",
            "bollinger": r"\bbollinger\b",
            "rsi": r"\brsi\b",
            "moving average": r"\bma\b|\bmoving[- ]?average\b|\bsma\b|\bema\b",
            "support resistance": r"\bsupport.*resistance\b|\blevel\b",
        }

        for pattern, regex in patterns.items():
            if re.search(regex, user_input_lower):
                analysis["pattern_type"] = pattern
                break

        # Indicator detection
        indicators = ["rsi", "macd", "bollinger", "ema", "sma", "atr", "volume", "vwap"]
        for indicator in indicators:
            if indicator in user_input_lower:
                analysis["indicators"].append(indicator)

        # Timeframe detection
        if "intraday" in user_input_lower or "1min" in user_input_lower or "5min" in user_input_lower:
            analysis["timeframe"] = "intraday"
        elif "weekly" in user_input_lower:
            analysis["timeframe"] = "weekly"

        # Filter detection
        if "min price" in user_input_lower or "minimum price" in user_input_lower:
            analysis["filters"].append("min_price")
        if "min volume" in user_input_lower or "minimum volume" in user_input_lower:
            analysis["filters"].append("min_volume")

        return analysis


def create_scanner_builder(**kwargs) -> ScannerBuilderAgent:
    """Create a scanner builder agent."""
    return ScannerBuilderAgent(**kwargs)
