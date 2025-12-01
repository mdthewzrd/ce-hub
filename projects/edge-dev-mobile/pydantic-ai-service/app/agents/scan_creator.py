"""
Scan Creator Agent for AI-assisted scan generation
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.base_agent import BaseAgent, AgentState
from app.models.schemas import AgentType, ScanCreationResponse
from app.core.config import settings

import json
import re
import logging

logger = logging.getLogger(__name__)


class ScanCreatorState(AgentState):
    """Extended state for scan creator agent"""
    created_scans: List[Dict[str, Any]] = []
    scan_templates: Dict[str, Any] = {}
    pattern_database: Dict[str, Any] = {}


class ScanContext(BaseModel):
    """Context for scan creation"""
    description: str
    market_conditions: str
    preferences: Dict[str, Any] = {}
    existing_scanners: List[Dict[str, Any]] = []
    timeframe: str = "1D"
    volume_threshold: float = 1000000


class ScanCreatorAgent(BaseAgent):
    """
    AI agent specialized in creating trading scans from natural language descriptions
    """

    def __init__(self):
        super().__init__(AgentType.SCAN_CREATOR)
        self.state = ScanCreatorState()
        self.scan_templates = self._load_scan_templates()

    async def _setup_pydantic_agent(self):
        """Setup the PydanticAI agent for scan creation"""

        self.pydantic_agent = Agent(
            model=self.model,
            deps_type=ScanContext,
            result_type=ScanCreationResponse,
            system_prompt=self._get_system_prompt()
        )

        # Add tools for scan creation
        @self.pydantic_agent.tool
        async def analyze_description(ctx: RunContext[ScanContext], description: str) -> Dict[str, Any]:
            """Analyze scan description to extract key requirements"""
            return await self._analyze_scan_description(description)

        @self.pydantic_agent.tool
        async def get_scan_templates(ctx: RunContext[ScanContext], pattern_type: str) -> Dict[str, Any]:
            """Get relevant scan templates for the requested pattern"""
            return await self._get_relevant_templates(pattern_type)

        @self.pydantic_agent.tool
        async def generate_scan_code(ctx: RunContext[ScanContext], requirements: Dict[str, Any]) -> str:
            """Generate Python scan code based on requirements"""
            return await self._generate_scan_code(requirements)

        @self.pydantic_agent.tool
        async def validate_scan_parameters(ctx: RunContext[ScanContext], parameters: Dict[str, Any]) -> Dict[str, Any]:
            """Validate and optimize scan parameters"""
            return await self._validate_parameters(parameters)

        @self.pydantic_agent.tool
        async def suggest_improvements(ctx: RunContext[ScanContext], scan_code: str) -> List[str]:
            """Suggest improvements for the generated scan"""
            return await self._suggest_improvements(scan_code)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the scan creator agent"""
        return """
        You are Renata's scan creation specialist, an AI expert in generating trading scans from natural language descriptions.

        Your role is to:
        1. Understand user requirements from natural language descriptions
        2. Generate Python scan code that implements the requested strategy
        3. Optimize parameters based on market conditions and user preferences
        4. Provide clear explanations of the generated scan logic
        5. Suggest improvements and variations

        Scan creation process:
        1. Analyze the description to identify key requirements
        2. Map requirements to technical indicators and conditions
        3. Generate clean, efficient Python code
        4. Validate parameters and suggest optimizations
        5. Provide comprehensive explanation and documentation

        Code standards:
        - Use Edge.dev scanner format and conventions
        - Include proper error handling and validation
        - Optimize for performance with large datasets
        - Add clear comments explaining the logic
        - Follow Python best practices

        Focus areas:
        - Gap patterns, breakouts, volume analysis
        - Support/resistance levels
        - Momentum and trend indicators
        - Risk management parameters
        - Market condition filters

        Always provide:
        - Working Python code ready for execution
        - Parameter explanations with recommended ranges
        - Confidence assessment of the scan effectiveness
        - Suggested improvements and variations
        - Risk factors and limitations
        """

    def _load_scan_templates(self) -> Dict[str, Any]:
        """Load scan templates for different patterns"""
        return {
            "gap_up": {
                "description": "Stocks with significant gap up on volume",
                "base_code": """
def gap_up_scanner(data, min_gap_pct=2.0, min_volume_ratio=1.5):
    current = data.iloc[-1]
    previous = data.iloc[-2]

    gap_pct = ((current['open'] - previous['close']) / previous['close']) * 100
    volume_ratio = current['volume'] / data['volume'].rolling(20).mean().iloc[-1]

    return (gap_pct >= min_gap_pct and
            volume_ratio >= min_volume_ratio and
            current['close'] > current['open'])  # Green candle
""",
                "parameters": {
                    "min_gap_pct": {"default": 2.0, "range": [1.0, 10.0], "description": "Minimum gap percentage"},
                    "min_volume_ratio": {"default": 1.5, "range": [1.0, 5.0], "description": "Volume vs 20-day average"}
                }
            },
            "breakout": {
                "description": "Stocks breaking above resistance with volume",
                "base_code": """
def breakout_scanner(data, lookback_days=20, min_volume_ratio=2.0):
    current = data.iloc[-1]
    resistance = data['high'].rolling(lookback_days).max().iloc[-2]
    volume_ratio = current['volume'] / data['volume'].rolling(20).mean().iloc[-1]

    return (current['high'] > resistance and
            current['close'] > resistance and
            volume_ratio >= min_volume_ratio)
""",
                "parameters": {
                    "lookback_days": {"default": 20, "range": [10, 50], "description": "Days to look back for resistance"},
                    "min_volume_ratio": {"default": 2.0, "range": [1.5, 5.0], "description": "Volume confirmation"}
                }
            },
            "oversold_reversal": {
                "description": "Oversold stocks showing reversal signals",
                "base_code": """
def oversold_reversal_scanner(data, rsi_threshold=30, volume_threshold=1.5):
    import ta

    rsi = ta.momentum.rsi(data['close'], window=14).iloc[-1]
    volume_ratio = data.iloc[-1]['volume'] / data['volume'].rolling(20).mean().iloc[-1]
    price_change = ((data.iloc[-1]['close'] - data.iloc[-2]['close']) / data.iloc[-2]['close']) * 100

    return (rsi <= rsi_threshold and
            price_change > 0 and  # Green candle
            volume_ratio >= volume_threshold)
""",
                "parameters": {
                    "rsi_threshold": {"default": 30, "range": [20, 40], "description": "RSI oversold level"},
                    "volume_threshold": {"default": 1.5, "range": [1.0, 3.0], "description": "Volume confirmation"}
                }
            }
        }

    async def create_scan(
        self,
        description: str,
        market_conditions: str = "unknown",
        preferences: Dict[str, Any] = None,
        existing_scanners: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new scan based on natural language description
        """
        await self._update_activity()

        try:
            context = ScanContext(
                description=description,
                market_conditions=market_conditions,
                preferences=preferences or {},
                existing_scanners=existing_scanners or []
            )

            # Run the PydanticAI agent
            result = await self.pydantic_agent.run(
                f"Create a trading scan based on this description: {description}",
                deps=context
            )

            # Store the created scan
            scan_record = {
                "id": f"scan_{len(self.state.created_scans) + 1}",
                "description": description,
                "code": result.data.scan_code,
                "parameters": result.data.parameters,
                "created_at": datetime.utcnow().isoformat(),
                "confidence": result.data.confidence_score
            }
            self.state.created_scans.append(scan_record)

            # Update performance metrics
            self.state.performance_metrics['avg_confidence'] = sum(
                scan['confidence'] for scan in self.state.created_scans
            ) / len(self.state.created_scans)

            return result.data.model_dump()

        except Exception as e:
            await self._handle_error(e, "scan creation")
            raise

    async def _analyze_scan_description(self, description: str) -> Dict[str, Any]:
        """Analyze scan description to extract requirements"""
        try:
            description_lower = description.lower()

            requirements = {
                "pattern_type": "custom",
                "indicators": [],
                "conditions": [],
                "volume_requirements": False,
                "timeframe_specific": False
            }

            # Pattern type detection
            if any(word in description_lower for word in ["gap", "gapped", "opening"]):
                requirements["pattern_type"] = "gap_up"
                requirements["indicators"].extend(["gap_percentage", "volume"])

            elif any(word in description_lower for word in ["breakout", "break", "resistance"]):
                requirements["pattern_type"] = "breakout"
                requirements["indicators"].extend(["resistance_level", "volume", "momentum"])

            elif any(word in description_lower for word in ["oversold", "reversal", "bounce"]):
                requirements["pattern_type"] = "oversold_reversal"
                requirements["indicators"].extend(["rsi", "support_level", "volume"])

            elif any(word in description_lower for word in ["momentum", "trending", "moving"]):
                requirements["pattern_type"] = "momentum"
                requirements["indicators"].extend(["moving_averages", "macd", "volume"])

            # Volume requirements
            if any(word in description_lower for word in ["volume", "heavy", "unusual"]):
                requirements["volume_requirements"] = True
                requirements["indicators"].append("volume_ratio")

            # Technical indicators
            if "rsi" in description_lower:
                requirements["indicators"].append("rsi")
            if any(word in description_lower for word in ["moving average", "ma", "sma", "ema"]):
                requirements["indicators"].append("moving_averages")
            if "macd" in description_lower:
                requirements["indicators"].append("macd")
            if any(word in description_lower for word in ["bollinger", "bands"]):
                requirements["indicators"].append("bollinger_bands")

            # Extract numerical requirements
            numbers = re.findall(r'\d+(?:\.\d+)?', description)
            if numbers:
                requirements["numerical_params"] = [float(n) for n in numbers]

            return requirements

        except Exception as e:
            logger.error(f"Error analyzing scan description: {e}")
            return {"error": str(e)}

    async def _get_relevant_templates(self, pattern_type: str) -> Dict[str, Any]:
        """Get scan templates relevant to the pattern type"""
        try:
            if pattern_type in self.scan_templates:
                return {
                    "template": self.scan_templates[pattern_type],
                    "related_patterns": [
                        name for name in self.scan_templates.keys()
                        if name != pattern_type
                    ][:3]
                }

            # Return a generic template if specific pattern not found
            return {
                "template": {
                    "description": "Custom scan pattern",
                    "base_code": "def custom_scanner(data, **params):\n    # Custom scan logic here\n    return True",
                    "parameters": {}
                },
                "related_patterns": list(self.scan_templates.keys())[:3]
            }

        except Exception as e:
            logger.error(f"Error getting scan templates: {e}")
            return {"error": str(e)}

    async def _generate_scan_code(self, requirements: Dict[str, Any]) -> str:
        """Generate Python scan code based on requirements"""
        try:
            pattern_type = requirements.get("pattern_type", "custom")
            indicators = requirements.get("indicators", [])

            if pattern_type in self.scan_templates:
                template = self.scan_templates[pattern_type]
                base_code = template["base_code"]

                # Customize based on additional requirements
                if "rsi" in indicators and "rsi" not in base_code.lower():
                    base_code = self._add_rsi_logic(base_code)

                if "volume_ratio" in indicators:
                    base_code = self._enhance_volume_logic(base_code)

                return base_code

            # Generate custom code for unrecognized patterns
            return self._generate_custom_scan_code(requirements)

        except Exception as e:
            logger.error(f"Error generating scan code: {e}")
            return f"# Error generating code: {str(e)}"

    def _add_rsi_logic(self, base_code: str) -> str:
        """Add RSI logic to existing scan code"""
        rsi_addition = """
    # RSI calculation
    import ta
    rsi = ta.momentum.rsi(data['close'], window=14).iloc[-1]
    rsi_condition = 20 <= rsi <= 80  # Avoid extreme RSI values
    """

        # Insert before the return statement
        lines = base_code.split('\n')
        return_line_idx = next((i for i, line in enumerate(lines) if 'return' in line), -1)

        if return_line_idx > 0:
            lines.insert(return_line_idx, rsi_addition)
            lines[return_line_idx + len(rsi_addition.split('\n'))] = lines[return_line_idx + len(rsi_addition.split('\n'))].replace('return (', 'return (rsi_condition and ')

        return '\n'.join(lines)

    def _enhance_volume_logic(self, base_code: str) -> str:
        """Enhance volume logic in scan code"""
        if "volume_ratio" not in base_code:
            volume_addition = """
    # Enhanced volume analysis
    volume_20ma = data['volume'].rolling(20).mean().iloc[-1]
    volume_ratio = current['volume'] / volume_20ma
    high_volume = volume_ratio >= 1.5
    """

            lines = base_code.split('\n')
            return_line_idx = next((i for i, line in enumerate(lines) if 'return' in line), -1)

            if return_line_idx > 0:
                lines.insert(return_line_idx, volume_addition)
                lines[return_line_idx + len(volume_addition.split('\n'))] = lines[return_line_idx + len(volume_addition.split('\n'))].replace('return (', 'return (high_volume and ')

            return '\n'.join(lines)

        return base_code

    def _generate_custom_scan_code(self, requirements: Dict[str, Any]) -> str:
        """Generate custom scan code for unrecognized patterns"""
        indicators = requirements.get("indicators", [])

        code = """
def custom_scanner(data, **params):
    \"\"\"
    Custom scanner generated based on user requirements
    \"\"\"
    current = data.iloc[-1]
    previous = data.iloc[-2]

    conditions = []
"""

        # Add basic price/volume conditions
        code += """
    # Basic price action
    price_change_pct = ((current['close'] - previous['close']) / previous['close']) * 100
    conditions.append(abs(price_change_pct) >= params.get('min_price_change', 1.0))
"""

        # Add volume condition if required
        if "volume" in indicators or "volume_ratio" in indicators:
            code += """
    # Volume analysis
    avg_volume = data['volume'].rolling(20).mean().iloc[-1]
    volume_ratio = current['volume'] / avg_volume
    conditions.append(volume_ratio >= params.get('min_volume_ratio', 1.2))
"""

        # Add RSI if requested
        if "rsi" in indicators:
            code += """
    # RSI analysis
    import ta
    rsi = ta.momentum.rsi(data['close'], window=14).iloc[-1]
    conditions.append(30 <= rsi <= 70)  # Avoid extreme RSI
"""

        code += """
    return all(conditions)
"""

        return code

    async def _validate_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and optimize scan parameters"""
        try:
            validated = {}
            warnings = []

            for param_name, value in parameters.items():
                if param_name.endswith('_pct') or param_name.endswith('_percentage'):
                    # Percentage parameters
                    if value < 0 or value > 50:
                        warnings.append(f"{param_name} value {value} seems extreme")
                        validated[param_name] = max(0.1, min(value, 50.0))
                    else:
                        validated[param_name] = value

                elif param_name.endswith('_ratio'):
                    # Ratio parameters
                    if value < 0.1 or value > 10:
                        warnings.append(f"{param_name} value {value} seems extreme")
                        validated[param_name] = max(0.1, min(value, 10.0))
                    else:
                        validated[param_name] = value

                elif param_name.endswith('_days') or param_name.endswith('_period'):
                    # Time period parameters
                    if value < 1 or value > 252:  # Max 1 year
                        warnings.append(f"{param_name} value {value} should be between 1-252")
                        validated[param_name] = max(1, min(int(value), 252))
                    else:
                        validated[param_name] = int(value)

                else:
                    # Generic validation
                    validated[param_name] = value

            return {
                "validated_parameters": validated,
                "warnings": warnings,
                "optimizations_applied": len(warnings) > 0
            }

        except Exception as e:
            logger.error(f"Error validating parameters: {e}")
            return {"error": str(e)}

    async def _suggest_improvements(self, scan_code: str) -> List[str]:
        """Suggest improvements for the generated scan"""
        suggestions = []

        # Check for common improvements
        if "try:" not in scan_code:
            suggestions.append("Add error handling with try/except blocks")

        if "import ta" not in scan_code and ("rsi" in scan_code.lower() or "macd" in scan_code.lower()):
            suggestions.append("Consider using the 'ta' library for technical indicators")

        if ".rolling(" in scan_code and "fillna" not in scan_code:
            suggestions.append("Add .fillna() to handle missing values in rolling calculations")

        if "volume" in scan_code.lower() and "outlier" not in scan_code:
            suggestions.append("Consider filtering volume outliers to avoid false signals")

        if len(scan_code.split('\n')) > 20:
            suggestions.append("Consider breaking complex logic into separate functions")

        # Pattern-specific suggestions
        if "gap" in scan_code.lower():
            suggestions.append("Add gap classification (small/medium/large) for better analysis")

        if "breakout" in scan_code.lower():
            suggestions.append("Consider adding consolidation period validation before breakout")

        return suggestions

    async def _handle_scan_creation_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scan creation WebSocket messages"""
        try:
            description = data.get("description", "")
            market_conditions = data.get("market_conditions", "unknown")
            preferences = data.get("preferences", {})
            existing_scanners = data.get("existing_scanners", [])

            result = await self.create_scan(description, market_conditions, preferences, existing_scanners)

            return {
                "type": "scan_creation",
                "data": result,
                "agent": self.agent_type.value,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "type": "error",
                "message": str(e),
                "agent": self.agent_type.value
            }