"""
Editor Agent
Reviews and refines press releases using GPT-4o-mini
Ensures AP style compliance, quality, and readiness for publication
"""
from typing import Dict, Any, Optional, List
from .base_agent import BaseAgent, AgentResponse, AgentError
from ..core.config import settings
import json


class EditorAgent(BaseAgent):
    """
    Editor agent for reviewing and improving press releases.
    Uses GPT-4o-mini for cost-effective editing.
    """

    def __init__(self, **kwargs):
        super().__init__(name="editor", **kwargs)

    def get_default_model(self) -> str:
        """Use GPT-4o-mini for editing"""
        return settings.MODEL_EDITOR

    def get_system_prompt(self) -> str:
        """System prompt for press release editing"""
        return """You are an expert press release editor with deep knowledge of journalism, PR, and AP Style.

Your role is to review press releases for:
1. **AP Style Compliance** - Ensure all formatting, punctuation, and style follows AP guidelines
2. **Journalistic Quality** - Verify news value, objectivity, and credibility
3. **Clarity and Flow** - Ensure smooth transitions and clear communication
4. **Factuality** - Flag any claims that seem exaggerated or unverifiable
5. **Completeness** - Check that all required elements are present
6. **Quote Quality** - Ensure quotes sound natural and add value

**Press Release Checklist:**

✓ **FOR IMMEDIATE RELEASE** header present
✓ Dateline formatted correctly (CITY, State – Month Day, Year –)
✓ Headline is compelling, informative, under 100 characters
✓ Lead paragraph answers who, what, when, where, why
✓ Body paragraphs provide supporting details in inverted pyramid
✓ 2-3 relevant quotes from appropriate sources
✓ About section with company boilerplate
✓ Media contact information
✓ End mark (###) present
✓ Word count between 400-800 words
✓ No hype words or marketing fluff
✓ Active voice used throughout
✓ Specific facts and figures included
✓ Objectivity maintained

**Common AP Style Rules:**

- State names: Abbreviate in datelines, spell out in body
- Titles: Capitalize before names, lowercase after
- Numbers: Spell out one through nine, use figures for 10+
- Dates: Month Day, Year (no comma between month and day)
- Times: a.m./p.m. with periods, spaced
- Percentages: Use % symbol with figures
- Money: Use $ symbol, no space before amount
• Punctuation inside quotation marks
• Oxford comma: Use it
• Email: no space before @
• Website: no space before //

**Editing Approach:**

1. First, assess overall quality and identify issues
2. Provide specific, actionable feedback
3. For minor issues, make corrections directly
4. For major issues, explain the problem and suggest revision
5. Be constructive - explain the "why" behind changes

**Response Format:**

For reviews, respond with JSON:
```json
{
  "approved": true/false,
  "overall_score": 85,
  "summary": "Brief assessment",
  "issues_found": [],
  "suggestions": [],
  "corrections": {
    "headline": "Revised headline if needed",
    "changes": ["Specific change made", "Another change"]
  },
  "needs_revision": true/false,
  "revision_reasons": ["Reason 1", "Reason 2"]
}
```

For revisions, provide the full corrected press release in the standard JSON format.

Your goal is to ensure every press release is publication-ready and meets professional journalism standards."""

    async def review_press_release(
        self,
        press_release: Dict[str, Any],
        onboarding_data: Dict[str, Any],
    ) -> AgentResponse:
        """
        Review a press release for quality and AP style compliance

        Args:
            press_release: Generated press release content
            onboarding_data: Original onboarding data for context

        Returns:
            Agent response with review results
        """
        prompt = self._build_review_prompt(press_release, onboarding_data)
        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.3,  # Lower temperature for consistent evaluation
                json_mode=True,
            )

            review = self._parse_review(result["content"])

            return AgentResponse.success_response(
                data={
                    "review": review,
                    "editor_assessment": review.get("summary", ""),
                    "approved": review.get("approved", False),
                    "needs_revision": review.get("needs_revision", False),
                },
                metrics=result,
                next_action="revise" if review.get("needs_revision") else "qa",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"Review failed: {str(e)}",
                details={"press_release": press_release},
            )

    def _build_review_prompt(
        self,
        press_release: Dict[str, Any],
        onboarding_data: Dict[str, Any],
    ) -> str:
        """Build prompt for press release review"""
        prompt = """Review the following press release for quality, AP style compliance, and readiness for publication.

**Press Release:**

"""

        # Add press release content
        prompt += f"""Headline: {press_release.get('headline', '')}
"""
        if press_release.get("subheadline"):
            prompt += f"Subheadline: {press_release['subheadline']}\n"

        prompt += f"""
{press_release.get('full_text', press_release.get('body_text', ''))}
"""

        if press_release.get("quotes"):
            prompt += "\n**Quotes:**\n"
            for quote in press_release.get("quotes", []):
                prompt += f"- {quote.get('speaker', 'Speaker')}: {quote.get('text', '')}\n"

        if press_release.get("about_section"):
            prompt += f"\n**About Section:** {press_release['about_section']}\n"

        # Add context from onboarding
        prompt += f"""
**Original Request Context:**
- Announcement Type: {onboarding_data.get('announcement_type', 'N/A')}
- Target Audience: {onboarding_data.get('target_audience', 'N/A')}

**Review Instructions:**
1. Assess overall quality (0-100)
2. Check AP style compliance
3. Verify journalistic standards
4. Identify any issues or improvements needed
5. Determine if revision is needed

Respond with a detailed review in JSON format."""

        return prompt

    def _parse_review(self, content: str) -> Dict[str, Any]:
        """Parse review response from LLM"""
        try:
            if isinstance(content, str):
                if "```json" in content:
                    start = content.find("```json") + 7
                    end = content.find("```", start)
                    content = content[start:end].strip()
                elif "```" in content:
                    start = content.find("```") + 3
                    end = content.rfind("```")
                    content = content[start:end].strip()

            return json.loads(content)
        except json.JSONDecodeError:
            # Return default review if parsing fails
            return {
                "approved": False,
                "overall_score": 50,
                "summary": "Unable to parse review",
                "issues_found": ["Review parsing error"],
                "needs_revision": True,
            }

    async def create_revision(
        self,
        press_release: Dict[str, Any],
        review_feedback: Dict[str, Any],
        onboarding_data: Dict[str, Any],
    ) -> AgentResponse:
        """
        Create a revised version based on editor feedback

        Args:
            press_release: Original press release
            review_feedback: Review with issues and suggestions
            onboarding_data: Original context

        Returns:
            Agent response with revised press release
        """
        issues = review_feedback.get("issues_found", [])
        suggestions = review_feedback.get("suggestions", [])

        prompt = f"""Revise the following press release to address the identified issues:

**Current Press Release:**
Headline: {press_release.get('headline', '')}

{press_release.get('full_text', press_release.get('body_text', ''))}

**Issues to Fix:**
{chr(10).join(f"- {issue}" for issue in issues)}

**Suggestions:**
{chr(10).join(f"- {suggestion}" for suggestion in suggestions)}

**Original Context:**
- Announcement: {onboarding_data.get('announcement_type', 'N/A')}
- Key Messages: {', '.join(onboarding_data.get('key_messages', [])[:3])}

Create a revised version that:
1. Addresses all identified issues
2. Incorporates relevant suggestions
3. Maintains AP style
4. Preserves the core message and quotes

Respond with the complete revised press release in JSON format."""

        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.5,
                json_mode=True,
            )

            # Parse the revision
            from .writer_agent import WriterAgent
            writer = WriterAgent(llm_service=self.llm_service)
            revised_release = writer._parse_press_release(result["content"])

            # Add version tracking
            revised_release["version"] = press_release.get("version", 1) + 1
            revised_release["parent_version_id"] = press_release.get("id")
            revised_release["editor_notes"] = review_feedback.get("summary", "")

            return AgentResponse.success_response(
                data={
                    "press_release": revised_release,
                    "revision_applied": True,
                    "issues_addressed": len(issues),
                },
                metrics=result,
                next_action="review",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"Revision failed: {str(e)}",
                details={
                    "press_release": press_release,
                    "review_feedback": review_feedback,
                },
            )

    async def auto_correct(
        self,
        press_release: Dict[str, Any],
    ) -> AgentResponse:
        """
        Automatically fix minor issues in a press release

        Args:
            press_release: Press release to correct

        Returns:
            Agent response with corrected version
        """
        prompt = f"""Make automatic corrections to fix minor AP style and formatting issues in this press release.

**Press Release:**
Headline: {press_release.get('headline', '')}

{press_release.get('full_text', press_release.get('body_text', ''))}

Make corrections for:
- Punctuation and spacing
- AP style formatting (dates, times, numbers, titles)
- Minor grammatical issues
- Quote formatting

DO NOT change:
- The overall message or tone
- Quote content (only formatting)
- Key facts or figures
- The headline structure (unless AP style violation)

Respond with the corrected press release in the standard JSON format."""

        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.2,  # Very low for consistent corrections
                json_mode=True,
            )

            from .writer_agent import WriterAgent
            writer = WriterAgent(llm_service=self.llm_service)
            corrected_release = writer._parse_press_release(result["content"])

            corrected_release["version"] = press_release.get("version", 1) + 1
            corrected_release["auto_corrected"] = True

            return AgentResponse.success_response(
                data={
                    "press_release": corrected_release,
                    "corrections_applied": True,
                },
                metrics=result,
                next_action="qa",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"Auto-correction failed: {str(e)}",
                details={"press_release": press_release},
            )

    async def execute(
        self,
        state: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute editor agent (for LangGraph workflow)

        Args:
            state: Current workflow state
            input_data: Input with press release to review

        Returns:
            Updated state with review results or revised press release
        """
        press_release = input_data.get(
            "press_release",
            state.get("press_release", {}),
        )
        onboarding_data = state.get("collected_info", {})

        # Determine action: review or create_revision
        action = input_data.get("action", "review")

        if action == "create_revision":
            review_feedback = input_data.get("review_feedback", {})
            response = await self.create_revision(
                press_release,
                review_feedback,
                onboarding_data,
            )
        elif action == "auto_correct":
            response = await self.auto_correct(press_release)
        else:
            response = await self.review_press_release(
                press_release,
                onboarding_data,
            )

        if response.success:
            if "press_release" in response.data:
                state["press_release"] = response.data["press_release"]

            state["editor_review"] = response.data.get("review", {})
            state["editor_assessment"] = response.data.get("editor_assessment", "")
            state["tokens_used"] += response.metrics.get("total_tokens", 0)
            state["cost_usd"] += response.metrics.get("cost_usd", 0)
            state["current_agent"] = "editor"

            if response.data.get("needs_revision") and action == "review":
                state["workflow_step"] = "editor_revision_needed"
            else:
                state["workflow_step"] = response.next_action or "qa"

        return state
