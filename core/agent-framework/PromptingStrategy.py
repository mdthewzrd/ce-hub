"""
Enhanced Agent Prompting Strategy with Structured Information Gathering
Phase 1: Agent Standardization & Quality Improvement
"""

from typing import Dict, List, Optional, Any, Union, Callable, TypeVar, Generic
from pydantic import BaseModel, Field, validator
from abc import ABC, abstractmethod
from enum import Enum
import json
import re
import logging
from datetime import datetime
import asyncio
import inspect

logger = logging.getLogger(__name__)

T = TypeVar('T')

class PromptingStyle(str, Enum):
    """Standardized prompting styles"""
    ANALYTICAL = "analytical"
    CREATIVE = "creative"
    STEP_BY_STEP = "step_by_step"
    CONVERSATIONAL = "conversational"
    TECHNICAL = "technical"
    EDUCATIONAL = "educational"

class InformationRequirement(BaseModel):
    """Structured information requirement for prompting"""
    name: str = Field(..., description="Requirement name")
    type: str = Field(..., description="Data type (string, number, boolean, list, object)")
    required: bool = Field(default=True, description="Whether this information is required")
    description: str = Field(..., description="What this information represents")
    validation_rules: List[str] = Field(default_factory=list, description="Validation rules")
    example: Optional[Any] = Field(None, description="Example value")
    extraction_method: str = Field(default="direct", description="How to extract this info")

class PromptTemplate(BaseModel):
    """Structured prompt template"""
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="What this template is for")
    style: PromptingStyle = Field(..., description="Prompting style")
    context: str = Field(..., description="Context information")
    task: str = Field(..., description="Main task description")
    requirements: List[InformationRequirement] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list, description="Constraints and rules")
    examples: List[Dict[str, Any]] = Field(default_factory=list, description="Example inputs/outputs")
    output_format: str = Field(..., description="Expected output format")

    class Config:
        use_enum_values = True

class ExtractedInformation(BaseModel):
    """Model for extracted information from user input"""
    requirement_name: str
    value: Any
    confidence: float = Field(ge=0, le=1, description="Confidence score")
    source: str = Field(..., description="How this was extracted")
    validated: bool = Field(default=False, description="Whether validation passed")

class InformationExtractor(ABC):
    """Abstract base class for information extraction strategies"""

    @abstractmethod
    async def extract(self, text: str, requirement: InformationRequirement) -> ExtractedInformation:
        """Extract information based on requirement"""
        pass

class DirectExtractor(InformationExtractor):
    """Direct extraction for explicit information"""

    async def extract(self, text: str, requirement: InformationRequirement) -> ExtractedInformation:
        """Extract information directly from text"""
        # Simple keyword-based extraction
        keywords = requirement.name.lower().split()
        text_lower = text.lower()

        # Look for the requirement name and extract following content
        pattern = rf"{re.escape(requirement.name)}[^:]*:\s*([^.\n]+)"
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            value = match.group(1).strip()
            return ExtractedInformation(
                requirement_name=requirement.name,
                value=value,
                confidence=0.9,
                source="direct_pattern_matching"
            )

        # Fallback: look for keywords in context
        for keyword in keywords:
            if keyword in text_lower:
                # Extract sentence containing keyword
                sentences = text.split('.')
                for sentence in sentences:
                    if keyword in sentence.lower():
                        return ExtractedInformation(
                            requirement_name=requirement.name,
                            value=sentence.strip(),
                            confidence=0.6,
                            source="keyword_context"
                        )

        return ExtractedInformation(
            requirement_name=requirement.name,
            value=None,
            confidence=0.0,
            source="not_found"
        )

class LLMExtractor(InformationExtractor):
    """LLM-based extraction for complex information"""

    def __init__(self, llm_function: Callable[[str, str], Any]):
        self.llm_function = llm_function

    async def extract(self, text: str, requirement: InformationRequirement) -> ExtractedInformation:
        """Extract information using LLM"""
        prompt = f"""
        Extract the '{requirement.name}' from the following text.

        Requirement: {requirement.description}
        Type expected: {requirement.type}
        Required: {requirement.required}

        Text to analyze:
        {text}

        Return ONLY the extracted value in the specified format.
        If the information is not found, return "NOT_FOUND".
        """

        try:
            result = await self.llm_function(prompt)
            if result and result != "NOT_FOUND":
                return ExtractedInformation(
                    requirement_name=requirement.name,
                    value=result,
                    confidence=0.8,
                    source="llm_extraction"
                )
        except Exception as e:
            logger.error(f"LLM extraction failed for {requirement.name}: {e}")

        return ExtractedInformation(
            requirement_name=requirement.name,
            value=None,
            confidence=0.0,
            source="llm_failed"
        )

class StructuredPromptingStrategy:
    """Enhanced prompting strategy with structured information gathering"""

    def __init__(self):
        self.templates: Dict[str, PromptTemplate] = {}
        self.extractors: Dict[str, InformationExtractor] = {
            "direct": DirectExtractor(),
            "llm": None  # Will be set when LLM function is provided
        }
        self.extraction_history: List[Dict[str, Any]] = []

    def register_template(self, template: PromptTemplate):
        """Register a prompt template"""
        self.templates[template.name] = template
        logger.info(f"Registered prompt template: {template.name}")

    def register_extractor(self, name: str, extractor: InformationExtractor):
        """Register an information extractor"""
        self.extractors[name] = extractor
        logger.info(f"Registered information extractor: {name}")

    def set_llm_function(self, llm_function: Callable):
        """Set the LLM function for extraction"""
        self.extractors["llm"] = LLMExtractor(llm_function)

    async def extract_information(
        self,
        user_input: str,
        template_name: str,
        preferred_methods: List[str] = None
    ) -> Dict[str, ExtractedInformation]:
        """Extract structured information from user input"""
        if template_name not in self.templates:
            raise ValueError(f"Template not found: {template_name}")

        template = self.templates[template_name]
        methods = preferred_methods or ["direct", "llm"]

        extracted_info = {}

        for requirement in template.requirements:
            for method in methods:
                extractor = self.extractors.get(method)
                if not extractor:
                    continue

                try:
                    result = await extractor.extract(user_input, requirement)
                    if result.confidence > 0.5:  # Accept reasonable confidence
                        extracted_info[requirement.name] = result
                        break  # Use the first successful extraction
                except Exception as e:
                    logger.error(f"Extraction failed for {requirement.name} with {method}: {e}")

        # Log extraction for analysis
        extraction_record = {
            "template": template_name,
            "input": user_input,
            "extracted": {k: v.dict() for k, v in extracted_info.items()},
            "timestamp": datetime.now().isoformat()
        }
        self.extraction_history.append(extraction_record)

        return extracted_info

    def generate_prompt(
        self,
        template_name: str,
        extracted_info: Dict[str, ExtractedInformation] = None,
        additional_context: str = None
    ) -> str:
        """Generate a structured prompt from template and extracted information"""
        if template_name not in self.templates:
            raise ValueError(f"Template not found: {template_name}")

        template = self.templates[template_name]

        # Build the prompt
        prompt_parts = []

        # Add context
        prompt_parts.append("## CONTEXT")
        prompt_parts.append(template.context)

        if additional_context:
            prompt_parts.append(additional_context)

        # Add extracted information
        if extracted_info:
            prompt_parts.append("\n## PROVIDED INFORMATION")
            for req_name, info in extracted_info.items():
                if info.value is not None:
                    prompt_parts.append(f"- {req_name}: {info.value}")

        # Add task
        prompt_parts.append(f"\n## TASK")
        prompt_parts.append(template.task)

        # Add requirements
        if template.requirements:
            prompt_parts.append("\n## REQUIREMENTS")
            for req in template.requirements:
                status = "✓" if (extracted_info and req.name in extracted_info and extracted_info[req.name].value) else "○"
                prompt_parts.append(f"{status} {req.name}: {req.description}")
                if req.example:
                    prompt_parts.append(f"   Example: {req.example}")

        # Add constraints
        if template.constraints:
            prompt_parts.append("\n## CONSTRAINTS")
            for constraint in template.constraints:
                prompt_parts.append(f"- {constraint}")

        # Add examples
        if template.examples:
            prompt_parts.append("\n## EXAMPLES")
            for i, example in enumerate(template.examples, 1):
                prompt_parts.append(f"### Example {i}")
                if "input" in example:
                    prompt_parts.append(f"Input: {example['input']}")
                if "output" in example:
                    prompt_parts.append(f"Output: {example['output']}")

        # Add output format
        prompt_parts.append(f"\n## OUTPUT FORMAT")
        prompt_parts.append(template.output_format)

        # Add style-specific instructions
        prompt_parts.append(f"\n## STYLE INSTRUCTIONS")
        prompt_parts.append(self._get_style_instructions(template.style))

        return "\n".join(prompt_parts)

    def _get_style_instructions(self, style: PromptingStyle) -> str:
        """Get style-specific instructions"""
        instructions = {
            PromptingStyle.ANALYTICAL: """
            - Use structured, logical reasoning
            - Break down complex problems into steps
            - Provide evidence-based conclusions
            - Consider multiple perspectives
            - Cite sources when relevant
            """,

            PromptingStyle.CREATIVE: """
            - Think outside the box
            - Generate innovative solutions
            - Use vivid language and examples
            - Explore multiple possibilities
            - Be original and imaginative
            """,

            PromptingStyle.STEP_BY_STEP: """
            - Number each step clearly
            - Explain your reasoning at each step
            - Show your work
            - Verify each step before proceeding
            - Provide clear conclusions
            """,

            PromptingStyle.CONVERSATIONAL: """
            - Use friendly, approachable language
            - Ask clarifying questions if needed
            - Provide explanations in simple terms
            - Be encouraging and supportive
            - Use examples and analogies
            """,

            PromptingStyle.TECHNICAL: """
            - Use precise terminology
            - Include technical specifications
            - Provide detailed explanations
            - Reference relevant standards or frameworks
            - Be thorough and comprehensive
            """,

            PromptingStyle.EDUCATIONAL: """
            - Explain concepts clearly
            - Provide learning objectives
            - Use progressive disclosure
            - Include practice examples
            - Encourage deeper understanding
            """
        }

        return instructions.get(style, "Follow standard best practices for clear communication.")

    def validate_extraction(
        self,
        extracted_info: Dict[str, ExtractedInformation],
        template_name: str
    ) -> Dict[str, Any]:
        """Validate extracted information against requirements"""
        if template_name not in self.templates:
            raise ValueError(f"Template not found: {template_name}")

        template = self.templates[template_name]
        validation_results = {
            "valid": True,
            "issues": [],
            "missing_required": [],
            "low_confidence": []
        }

        for requirement in template.requirements:
            if requirement.name not in extracted_info:
                if requirement.required:
                    validation_results["missing_required"].append(requirement.name)
                    validation_results["valid"] = False
            else:
                info = extracted_info[requirement.name]
                if info.confidence < 0.5:
                    validation_results["low_confidence"].append({
                        "requirement": requirement.name,
                        "confidence": info.confidence
                    })

        return validation_results

# Standard prompt templates for common agent interactions
class StandardPromptTemplates:
    """Collection of standard prompt templates"""

    @staticmethod
    def trading_analysis_template() -> PromptTemplate:
        """Template for trading analysis requests"""
        return PromptTemplate(
            name="trading_analysis",
            description="Analyze trading opportunities and market conditions",
            style=PromptingStyle.ANALYTICAL,
            context="You are an expert trading analyst with access to market data, technical indicators, and fundamental analysis tools.",
            task="Provide comprehensive trading analysis based on the provided information.",
            requirements=[
                InformationRequirement(
                    name="symbol",
                    type="string",
                    description="Trading symbol or ticker",
                    example="AAPL"
                ),
                InformationRequirement(
                    name="timeframe",
                    type="string",
                    description="Analysis timeframe",
                    example="1D"
                ),
                InformationRequirement(
                    name="analysis_type",
                    type="string",
                    description="Type of analysis needed",
                    example="technical"
                )
            ],
            constraints=[
                "Always include risk assessment",
                "Provide clear entry/exit points",
                "Consider market conditions",
                "Include stop-loss recommendations"
            ],
            output_format="Structured analysis with clear sections: Overview, Technical Analysis, Risk Assessment, Recommendations"
        )

    @staticmethod
    def portfolio_optimization_template() -> PromptTemplate:
        """Template for portfolio optimization requests"""
        return PromptTemplate(
            name="portfolio_optimization",
            description="Optimize portfolio allocation based on risk-return objectives",
            style=PromptingStyle.ANALYTICAL,
            context="You are a portfolio optimization expert specializing in modern portfolio theory and risk management.",
            task="Optimize the portfolio allocation to achieve the stated objectives.",
            requirements=[
                InformationRequirement(
                    name="current_allocation",
                    type="object",
                    description="Current portfolio allocation",
                    required=False
                ),
                InformationRequirement(
                    name="risk_tolerance",
                    type="string",
                    description="Investor risk tolerance level",
                    example="moderate"
                ),
                InformationRequirement(
                    name="investment_horizon",
                    type="string",
                    description="Investment time horizon",
                    example="5 years"
                )
            ],
            constraints=[
                "Maintain diversification",
                "Consider tax implications",
                "Include rebalancing strategy",
                "Address liquidity needs"
            ],
            output_format="Optimization results with allocation percentages, expected returns, and risk metrics"
        )

    @staticmethod
    def market_research_template() -> PromptTemplate:
        """Template for market research requests"""
        return PromptTemplate(
            name="market_research",
            description="Conduct comprehensive market research and analysis",
            style=PromptingStyle.STEP_BY_STEP,
            context="You are a market research analyst with expertise in fundamental analysis, market trends, and industry research.",
            task="Provide thorough market research based on the specified criteria.",
            requirements=[
                InformationRequirement(
                    name="market_or_sector",
                    type="string",
                    description="Market or sector to research",
                    example="technology sector"
                ),
                InformationRequirement(
                    name="research_depth",
                    type="string",
                    description="Level of research detail needed",
                    example="comprehensive"
                )
            ],
            constraints=[
                "Use recent and reliable data sources",
                "Consider multiple timeframes",
                "Include competitive analysis",
                "Provide actionable insights"
            ],
            output_format="Research report with sections: Market Overview, Trends, Analysis, Opportunities, Risks, Recommendations"
        )

class PromptingOrchestrator:
    """Orchestrates the prompting strategy across multiple agents"""

    def __init__(self):
        self.strategy = StructuredPromptingStrategy()
        self.agent_specializations: Dict[str, str] = {}
        self.interaction_history: List[Dict[str, Any]] = []

    def register_agent_specialization(self, agent_name: str, template_name: str):
        """Register an agent's specialized template"""
        self.agent_specializations[agent_name] = template_name

    async def process_user_request(
        self,
        agent_name: str,
        user_input: str,
        context: str = None
    ) -> Dict[str, Any]:
        """Process a user request for a specific agent"""
        template_name = self.agent_specializations.get(agent_name)
        if not template_name:
            return {
                "success": False,
                "error": f"No template registered for agent: {agent_name}"
            }

        try:
            # Extract information
            extracted_info = await self.strategy.extract_information(
                user_input, template_name
            )

            # Validate extraction
            validation = self.strategy.validate_extraction(extracted_info, template_name)

            # Generate prompt
            prompt = self.strategy.generate_prompt(
                template_name, extracted_info, context
            )

            # Log interaction
            interaction_record = {
                "agent": agent_name,
                "template": template_name,
                "input": user_input,
                "extracted_info": {k: v.dict() for k, v in extracted_info.items()},
                "validation": validation,
                "generated_prompt": prompt,
                "timestamp": datetime.now().isoformat()
            }
            self.interaction_history.append(interaction_record)

            return {
                "success": True,
                "prompt": prompt,
                "extracted_info": extracted_info,
                "validation": validation
            }

        except Exception as e:
            logger.error(f"Error processing request for {agent_name}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_interaction_analytics(self) -> Dict[str, Any]:
        """Get analytics on prompting interactions"""
        if not self.interaction_history:
            return {"total_interactions": 0}

        total_interactions = len(self.interaction_history)
        successful_extractions = sum(
            1 for interaction in self.interaction_history
            if interaction.get("validation", {}).get("valid", False)
        )

        # Agent performance
        agent_performance = {}
        for interaction in self.interaction_history:
            agent = interaction.get("agent")
            if agent not in agent_performance:
                agent_performance[agent] = {"total": 0, "successful": 0}
            agent_performance[agent]["total"] += 1
            if interaction.get("validation", {}).get("valid", False):
                agent_performance[agent]["successful"] += 1

        return {
            "total_interactions": total_interactions,
            "successful_extractions": successful_extractions,
            "success_rate": successful_extractions / total_interactions,
            "agent_performance": agent_performance,
            "templates_used": list(set(
                interaction.get("template") for interaction in self.interaction_history
            ))
        }

# Initialize standard templates
def initialize_standard_templates(strategy: StructuredPromptingStrategy):
    """Initialize standard prompt templates"""
    strategy.register_template(StandardPromptTemplates.trading_analysis_template())
    strategy.register_template(StandardPromptTemplates.portfolio_optimization_template())
    strategy.register_template(StandardPromptTemplates.market_research_template())
    logger.info("Initialized standard prompt templates")

# Global orchestrator instance
prompting_orchestrator = PromptingOrchestrator()
initialize_standard_templates(prompting_orchestrator.strategy)