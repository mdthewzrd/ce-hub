"""
Writer Agent
Generates press release content using Claude 3.5 Sonnet
Integrates with Archon for research and brand voice retrieval
"""
from typing import Dict, Any, Optional, List
from .base_agent import BaseAgent, AgentResponse, AgentError
from ..core.config import settings
import json


class WriterAgent(BaseAgent):
    """
    Writer agent for creating press release content.
    Uses Claude 3.5 Sonnet for high-quality writing.
    """

    def __init__(self, **kwargs):
        super().__init__(name="writer", **kwargs)

    def get_default_model(self) -> str:
        """Use Claude 3.5 Sonnet for writing"""
        return settings.MODEL_WRITER

    def get_system_prompt(self) -> str:
        """System prompt for press release writing"""
        return """You are an expert press release writer with decades of experience in journalism and PR.

Your role is to create compelling, professional press releases that:
1. Follow AP Style guidelines
2. Are newsworthy and fact-based
3. Include compelling quotes
4. Have strong, clear headlines
5. Are optimized for media pickup

**Press Release Structure:**

1. **FOR IMMEDIATE RELEASE** at the top
2. **Dateline**: CITY, State – Month Day, Year –
3. **Headline**: Compelling, informative, under 100 characters
4. **Subheadline** (optional): Additional context
5. **Lead Paragraph**: Who, what, when, where, why (most important info)
6. **Body Paragraphs**: Supporting details, context, background
7. **Quotes**: 2-3 quotes from key stakeholders
8. **About Section**: Company boilerplate at the end
9. **Media Contact**: Contact information
10. **###** (end mark)

**Writing Guidelines:**

- Write in inverted pyramid style (most important info first)
- Keep sentences and paragraphs concise
- Use active voice and strong verbs
- Avoid marketing fluff and hype words like "revolutionary", "game-changing", "world-class"
- Include specific facts, figures, and data
- Quotes should sound natural and add human perspective
- Keep total length between 400-800 words
- Write objectively, like a journalist would
- Focus on news value, not promotion

**Tone and Style:**

- Professional and journalistic
- Objective but positive
- Clear and concise
- Factual and verifiable
- Industry-appropriate terminology

**Brand Voice Application:**

Apply the provided brand voice characteristics:
- Match the specified tone (formal, casual, friendly, authoritative)
- Include style keywords naturally
- Avoid forbidden phrases
- Reference example texts for style guidance

**Output Format:**

Respond with JSON structure:
```json
{
  "headline": "Compelling headline here",
  "subheadline": "Optional subheadline",
  "dateline": "SAN FRANCISCO, California –",
  "lead_paragraph": "Who, what, when, where, why...",
  "body_paragraphs": [
    "Paragraph 1...",
    "Paragraph 2...",
    "Paragraph 3..."
  ],
  "quotes": [
    {
      "speaker": "John Doe",
      "title": "CEO",
      "company": "ABC Corp",
      "text": "Quote text here..."
    }
  ],
  "about_section": "About ABC Company...",
  "media_contact": {
    "name": "Contact Name",
    "email": "contact@company.com",
    "phone": "555-123-4567"
  },
  "word_count": 525
}
```

Write press releases that journalists will want to publish and readers will find informative and credible."""

    async def generate_press_release(
        self,
        onboarding_data: Dict[str, Any],
        brand_voice: Optional[Dict[str, Any]] = None,
        similar_articles: Optional[List[Dict[str, Any]]] = None,
    ) -> AgentResponse:
        """
        Generate a complete press release

        Args:
            onboarding_data: Data collected during onboarding
            brand_voice: Optional brand voice profile
            similar_articles: Optional similar press releases for reference

        Returns:
            Agent response with generated press release
        """
        # Build research context
        research_context = await self._build_research_context(
            onboarding_data,
            similar_articles,
        )

        # Build brand voice instructions
        brand_voice_instructions = self._build_brand_voice_instructions(brand_voice)

        # Build the prompt
        prompt = self._build_generation_prompt(
            onboarding_data,
            research_context,
            brand_voice_instructions,
        )

        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.7,
                json_mode=True,
            )

            # Parse the JSON response
            press_release = self._parse_press_release(result["content"])

            return AgentResponse.success_response(
                data={
                    "press_release": press_release,
                    "research_context": research_context,
                    "brand_voice_applied": brand_voice is not None,
                },
                metrics=result,
                next_action="review",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"Failed to generate press release: {str(e)}",
                details={"onboarding_data": onboarding_data},
            )

    async def _build_research_context(
        self,
        onboarding_data: Dict[str, Any],
        similar_articles: Optional[List[Dict[str, Any]]],
    ) -> Dict[str, Any]:
        """Build research context from Archon and onboarding data"""
        context = {
            "similar_articles_found": 0,
            "industry_examples": [],
            "announcement_examples": [],
        }

        # Search for similar articles if Archon is available
        if self.archon_client:
            announcement_type = onboarding_data.get("announcement_type", "")
            industry = onboarding_data.get("industry", "")

            similar = await self.search_archon(
                query=f"{announcement_type} press release {industry}",
                knowledge_type="completed_press_release",
                limit=3,
            )

            if similar:
                context["similar_articles_found"] = len(similar)
                context["industry_examples"] = [
                    {
                        "headline": article.get("metadata", {}).get("headline", ""),
                        "snippet": article.get("content", "")[:200] + "...",
                    }
                    for article in similar
                ]

        # Add provided similar articles
        if similar_articles:
            context["announcement_examples"] = similar_articles

        return context

    def _build_brand_voice_instructions(
        self,
        brand_voice: Optional[Dict[str, Any]],
    ) -> str:
        """Build brand voice instructions from profile"""
        if not brand_voice:
            return "Use a professional, journalistic tone appropriate for business press."

        tone = brand_voice.get("tone", {})
        keywords = brand_voice.get("style_keywords", [])
        forbidden = brand_voice.get("forbidden_phrases", [])

        instructions = []

        # Tone instructions
        if tone:
            tone_desc = ", ".join([f"{k} ({v})" for k, v in tone.items() if v > 0.5])
            if tone_desc:
                instructions.append(f"**Tone:** {tone_desc}")

        # Style keywords
        if keywords:
            instructions.append(f"**Style Keywords to use:** {', '.join(keywords[:5])}")

        # Forbidden phrases
        if forbidden:
            instructions.append(f"**Phrases to avoid:** {', '.join(forbidden[:5])}")

        return "\n".join(instructions) if instructions else "Use a professional, journalistic tone."

    def _build_generation_prompt(
        self,
        onboarding_data: Dict[str, Any],
        research_context: Dict[str, Any],
        brand_voice_instructions: str,
    ) -> str:
        """Build the complete prompt for press release generation"""
        prompt = """Generate a press release based on the following information:

**Announcement Details:**

"""

        # Add announcement details
        announcement_type = onboarding_data.get("announcement_type", "announcement")
        prompt += f"- **Type:** {announcement_type}\n"

        key_messages = onboarding_data.get("key_messages", [])
        if key_messages:
            prompt += f"- **Key Messages:**\n"
            for i, msg in enumerate(key_messages, 1):
                prompt += f"  {i}. {msg}\n"

        quotes = onboarding_data.get("quotes", [])
        if quotes:
            prompt += f"\n**Quotes to Include:**\n"
            for quote in quotes:
                speaker = quote.get("speaker", "Spokesperson")
                title = quote.get("title", "")
                text = quote.get("text", "")
                prompt += f"- {speaker}"
                if title:
                    prompt += f", {title}"
                prompt += f": \"{text}\"\n"

        company_desc = onboarding_data.get("company_description", "")
        if company_desc:
            prompt += f"\n**Company:** {company_desc}\n"

        product_details = onboarding_data.get("product_service_details", "")
        if product_details:
            prompt += f"\n**Product/Service Details:** {product_details}\n"

        target_audience = onboarding_data.get("target_audience", "")
        if target_audience:
            prompt += f"\n**Target Audience:** {target_audience}\n"

        geographic = onboarding_data.get("geographic_focus", "")
        if geographic:
            prompt += f"\n**Geographic Focus:** {geographic}\n"

        # Add brand voice instructions
        prompt += f"\n**Brand Voice Guidelines:**\n{brand_voice_instructions}\n"

        # Add research context
        if research_context.get("similar_articles_found", 0) > 0:
            prompt += "\n**Similar Articles for Reference:**\n"
            for example in research_context.get("industry_examples", [])[:2]:
                prompt += f"- Headline: {example['headline']}\n"
                prompt += f"  {example['snippet']}\n"

        prompt += """
Generate a complete, publication-ready press release following the structure and guidelines provided in your system instructions.
Respond with valid JSON only, no additional text."""

        return prompt

    def _parse_press_release(self, content: str) -> Dict[str, Any]:
        """Parse and validate press release from LLM response"""
        try:
            # Try to parse JSON
            if isinstance(content, str):
                # Remove markdown code blocks if present
                if "```json" in content:
                    start = content.find("```json") + 7
                    end = content.find("```", start)
                    content = content[start:end].strip()
                elif "```" in content:
                    start = content.find("```") + 3
                    end = content.rfind("```")
                    content = content[start:end].strip()

            press_release = json.loads(content)

            # Validate required fields
            required_fields = ["headline", "lead_paragraph", "body_paragraphs"]
            missing = [f for f in required_fields if f not in press_release or not press_release[f]]

            if missing:
                raise ValueError(f"Missing required fields: {', '.join(missing)}")

            # Add computed fields
            body_text = press_release.get("lead_paragraph", "")
            if press_release.get("body_paragraphs"):
                body_text += "\n\n" + "\n\n".join(press_release["body_paragraphs"])

            press_release["full_text"] = body_text
            press_release["word_count"] = len(body_text.split())

            return press_release

        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response: {e}")
        except Exception as e:
            raise ValueError(f"Failed to parse press release: {e}")

    async def generate_revision(
        self,
        current_release: Dict[str, Any],
        revision_notes: str,
    ) -> AgentResponse:
        """
        Generate a revised version of a press release

        Args:
            current_release: Current press release content
            revision_notes: Specific revision requests

        Returns:
            Agent response with revised press release
        """
        prompt = f"""Revise the following press release based on the feedback provided:

**Current Press Release:**
Headline: {current_release.get('headline', '')}

{current_release.get('full_text', current_release.get('body_text', ''))}

**Revision Feedback:**
{revision_notes}

Please generate a revised version that addresses the feedback while maintaining AP style and journalistic quality.
Respond with the same JSON structure as the original."""

        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.7,
                json_mode=True,
            )

            revised_release = self._parse_press_release(result["content"])
            revised_release["version"] = current_release.get("version", 1) + 1
            revised_release["parent_version"] = current_release.get("version", 1)

            return AgentResponse.success_response(
                data={
                    "press_release": revised_release,
                    "revision_notes": revision_notes,
                },
                metrics=result,
                next_action="review",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"Failed to generate revision: {str(e)}",
                details={"current_release": current_release, "revision_notes": revision_notes},
            )

    async def execute(
        self,
        state: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute writer agent (for LangGraph workflow)

        Args:
            state: Current workflow state
            input_data: Input with onboarding data

        Returns:
            Updated state with generated press release
        """
        onboarding_data = input_data.get("onboarding_data", state.get("collected_info", {}))
        brand_voice = state.get("brand_voice", {})

        response = await self.generate_press_release(
            onboarding_data=onboarding_data,
            brand_voice=brand_voice,
        )

        if response.success:
            state["press_release"] = response.data.get("press_release", {})
            state["research_data"] = response.data.get("research_context", {})
            state["tokens_used"] += response.metrics.get("total_tokens", 0)
            state["cost_usd"] += response.metrics.get("cost_usd", 0)
            state["current_agent"] = "writer"
            state["workflow_step"] = "draft_complete"

        return state
