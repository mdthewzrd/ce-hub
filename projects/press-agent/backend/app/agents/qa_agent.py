"""
QA Agent
Performs comprehensive quality checks on press releases using GPT-4o-mini
Checks for plagiarism, AI detection, AP style, grammar, and readability
"""
from typing import Dict, Any, Optional, List
from .base_agent import BaseAgent, AgentResponse, AgentError
from ..core.config import settings
import json


class QAAgent(BaseAgent):
    """
    QA agent for validating press release quality.
    Uses GPT-4o-mini for cost-effective quality assurance.
    """

    def __init__(self, **kwargs):
        super().__init__(name="qa", **kwargs)

    def get_default_model(self) -> str:
        """Use GPT-4o-mini for QA checks"""
        return settings.MODEL_QA

    def get_system_prompt(self) -> str:
        """System prompt for quality assurance"""
        return """You are a quality assurance specialist for press releases with expertise in:
- Plagiarism detection and originality assessment
- AI-generated content identification
- AP Style mastery
- Grammar and syntax analysis
- Readability scoring
- Journalism best practices

**Your Role:**

Perform comprehensive quality checks on press releases to ensure they meet publication standards.

**Quality Dimensions:**

1. **Originality (Plagiarism Check)**
   - Assess if content appears original or derivative
   - Flag generic or templated language
   - Identify phrases that seem copied from common sources
   - Score: 0-100 (lower is better, <5% acceptable)

2. **Human Quality (AI Detection)**
   - Evaluate how natural and human-like the writing sounds
   - Check for robotic or formulaic patterns
   - Assess emotional intelligence and nuance
   - Score: 0-100 (lower is better, <15% acceptable)

3. **AP Style Compliance**
   - Verify correct formatting of dates, times, numbers
   - Check state abbreviations, titles, punctuation
   - Ensure proper headline and dateline format
   - Score: 0-100 (higher is better, >85% required)

4. **Grammar and Mechanics**
   - Check for spelling errors
   - Verify subject-verb agreement
   - Check punctuation and capitalization
   - Ensure proper quote formatting
   - Score: 0-100 (higher is better, >90% required)

5. **Readability**
   - Assess sentence structure variety
   - Check paragraph length and flow
   - Evaluate clarity and conciseness
   - Target: Flesch-Kincaid grade 8-12
   - Score: 0-100 (higher is better, >70% required)

6. **Journalistic Quality**
   - News value assessment
   - Objectivity and lack of hype
   - Factual support for claims
   - Quote quality and relevance
   - Score: 0-100 (higher is better, >80% required)

**Overall Quality Score:**
- Weighted average of all dimensions
- Minimum 85% required for approval
- Critical failures in any dimension result in rejection

**Response Format:**

```json
{
  "overall_score": 88,
  "passed": true,
  "checks": {
    "plagiarism": {
      "score": 3,
      "passed": true,
      "details": "Content appears original with no concerning similarities",
      "threshold": 5
    },
    "ai_detection": {
      "score": 12,
      "passed": true,
      "details": "Writing sounds natural with good variation",
      "threshold": 15
    },
    "ap_style": {
      "score": 92,
      "passed": true,
      "issues": [],
      "suggestions": []
    },
    "grammar": {
      "score": 95,
      "passed": true,
      "issues": [],
      "corrections": []
    },
    "readability": {
      "score": 78,
      "passed": true,
      "grade_level": "10.2",
      "details": "Appropriate for business audience"
    },
    "journalistic_quality": {
      "score": 85,
      "passed": true,
      "strengths": ["Strong lead", "Good quotes"],
      "weaknesses": ["Could use more data"]
    }
  },
  "critical_issues": [],
  "recommendations": [],
  "approval_decision": "approve"
}
```

**Critical Issues** (result in automatic failure):
- Plagiarism score > 20%
- AI detection score > 30%
- Grammar score < 70%
- Factual claims without support
- Libelous or defamatory content
- Obvious bias or lack of objectivity

**Approval Decisions:**
- "approve" - Meets all quality standards
- "minor_revision" - Small fixes needed (<3 issues)
- "major_revision" - Significant issues (3-10 issues)
- "reject" - Critical failures or >10 issues
- "human_review" - Uncertain, needs manual review

Be thorough but fair. Focus on actionable feedback that improves the press release."""

    async def run_quality_checks(
        self,
        press_release: Dict[str, Any],
        onboarding_data: Dict[str, Any],
    ) -> AgentResponse:
        """
        Run all quality checks on a press release

        Args:
            press_release: Press release to validate
            onboarding_data: Original request context

        Returns:
            Agent response with comprehensive QA report
        """
        prompt = self._build_qa_prompt(press_release, onboarding_data)
        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.2,  # Low temperature for consistent evaluation
                json_mode=True,
            )

            qa_report = self._parse_qa_report(result["content"])

            # Calculate overall scores
            overall_score = self._calculate_overall_score(qa_report)
            qa_report["overall_score"] = overall_score

            # Determine if passed
            passed = self._determine_pass_status(qa_report)
            qa_report["passed"] = passed

            return AgentResponse.success_response(
                data={
                    "qa_report": qa_report,
                    "quality_score": overall_score,
                    "passed": passed,
                    "approval_decision": qa_report.get("approval_decision", "human_review"),
                },
                metrics=result,
                next_action="finalize" if passed else "revision",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"Quality check failed: {str(e)}",
                details={"press_release": press_release},
            )

    def _build_qa_prompt(
        self,
        press_release: Dict[str, Any],
        onboarding_data: Dict[str, Any],
    ) -> str:
        """Build prompt for quality assurance checks"""
        prompt = """Perform comprehensive quality assurance on the following press release.

**Press Release to Evaluate:**

"""

        # Add full press release
        prompt += f"""Headline: {press_release.get('headline', '')}

"""
        if press_release.get("subheadline"):
            prompt += f"Subheadline: {press_release['subheadline']}\n\n"

        prompt += f"""{press_release.get('full_text', press_release.get('body_text', ''))}

"""

        if press_release.get("quotes"):
            prompt += "**Quotes Included:**\n"
            for quote in press_release.get("quotes", []):
                prompt += f"- {quote.get('speaker', 'Speaker')}: {quote.get('text', '')}\n"

        if press_release.get("about_section"):
            prompt += f"\n**About:** {press_release['about_section']}\n"

        # Add context
        prompt += f"""
**Context:**
- Announcement Type: {onboarding_data.get('announcement_type', 'N/A')}
- Company: {onboarding_data.get('company_description', 'N/A')}
- Word Count: {press_release.get('word_count', len(press_release.get('body_text', '').split()))}

**Instructions:**
Run all quality checks and provide a comprehensive report with scores, issues, and recommendations.
Respond in JSON format as specified in your system instructions."""

        return prompt

    def _parse_qa_report(self, content: str) -> Dict[str, Any]:
        """Parse QA report from LLM response"""
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

            report = json.loads(content)

            # Ensure required check categories exist
            checks = report.get("checks", {})
            required_checks = [
                "plagiarism",
                "ai_detection",
                "ap_style",
                "grammar",
                "readability",
                "journalistic_quality",
            ]

            for check_name in required_checks:
                if check_name not in checks:
                    checks[check_name] = {
                        "score": 50,
                        "passed": False,
                        "details": "Check not performed",
                    }

            report["checks"] = checks
            return report

        except json.JSONDecodeError:
            # Return default report if parsing fails
            return {
                "checks": {
                    "plagiarism": {"score": 100, "passed": False, "details": "Parse error"},
                    "ai_detection": {"score": 100, "passed": False, "details": "Parse error"},
                    "ap_style": {"score": 50, "passed": False, "details": "Parse error"},
                    "grammar": {"score": 50, "passed": False, "details": "Parse error"},
                    "readability": {"score": 50, "passed": False, "details": "Parse error"},
                    "journalistic_quality": {"score": 50, "passed": False, "details": "Parse error"},
                },
                "critical_issues": ["Unable to parse QA report"],
                "approval_decision": "human_review",
            }

    def _calculate_overall_score(self, qa_report: Dict[str, Any]) -> float:
        """Calculate overall quality score from individual checks"""
        checks = qa_report.get("checks", {})

        # Weight each check
        weights = {
            "plagiarism": 0.25,  # Inverse: lower is better
            "ai_detection": 0.20,  # Inverse: lower is better
            "ap_style": 0.20,
            "grammar": 0.15,
            "readability": 0.10,
            "journalistic_quality": 0.10,
        }

        total_weighted = 0.0
        total_weight = 0.0

        for check_name, weight in weights.items():
            check = checks.get(check_name, {})
            score = check.get("score", 50)

            # Invert scores for plagiarism and AI detection (lower is better)
            if check_name in ["plagiarism", "ai_detection"]:
                score = 100 - score

            total_weighted += score * weight
            total_weight += weight

        return round(total_weighted / total_weight if total_weight > 0 else 0, 1)

    def _determine_pass_status(self, qa_report: Dict[str, Any]) -> bool:
        """Determine if the press release passes quality standards"""
        from ..core.config import settings

        overall = qa_report.get("overall_score", 0)
        checks = qa_report.get("checks", {})

        # Check overall score
        if overall < settings.MIN_QUALITY_SCORE:
            return False

        # Check individual thresholds
        if checks.get("plagiarism", {}).get("score", 0) > settings.MAX_PLAGIARISM_SCORE:
            return False

        if checks.get("ai_detection", {}).get("score", 0) > settings.MAX_AI_DETECTION_SCORE:
            return False

        # All critical checks must pass
        critical_checks = ["ap_style", "grammar", "journalistic_quality"]
        for check_name in critical_checks:
            if not checks.get(check_name, {}).get("passed", True):
                return False

        return True

    async def run_single_check(
        self,
        check_type: str,
        press_release: Dict[str, Any],
    ) -> AgentResponse:
        """
        Run a single quality check

        Args:
            check_type: Type of check (plagiarism, ai_detection, ap_style, etc.)
            press_release: Press release to check

        Returns:
            Agent response with single check result
        """
        check_prompts = {
            "plagiarism": "Analyze this press release for plagiarism. Assess originality, identify generic/templated language, and flag any phrases that seem copied. Provide a 0-100 score (lower is better).",
            "ai_detection": "Evaluate how human-like this press release sounds. Check for robotic patterns, assess emotional intelligence and nuance. Provide a 0-100 AI detection score (lower is more human-like).",
            "ap_style": "Review this press release for AP style compliance. Check dates, times, numbers, titles, state abbreviations, punctuation. Provide a 0-100 score (higher is better).",
            "grammar": "Check this press release for grammar, spelling, and mechanical errors. List any issues found. Provide a 0-100 score (higher is better).",
            "readability": "Assess the readability of this press release. Check sentence structure, paragraph flow, clarity. Provide Flesch-Kincaid grade level and 0-100 score.",
            "journalistic_quality": "Evaluate the journalistic quality of this press release. Assess news value, objectivity, factual support, quote quality. Provide a 0-100 score.",
        }

        prompt = check_prompts.get(check_type, check_prompts["journalistic_quality"])
        prompt += f"\n\nPress Release:\n{press_release.get('full_text', press_release.get('body_text', ''))}"

        messages = self.build_messages(prompt)

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.2,
                json_mode=True,
            )

            return AgentResponse.success_response(
                data={
                    "check_type": check_type,
                    "result": json.loads(result["content"]) if isinstance(result["content"], str) else result["content"],
                },
                metrics=result,
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=f"{check_type} check failed: {str(e)}",
            )

    async def execute(
        self,
        state: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute QA agent (for LangGraph workflow)

        Args:
            state: Current workflow state
            input_data: Input with press release to check

        Returns:
            Updated state with QA report
        """
        press_release = input_data.get(
            "press_release",
            state.get("press_release", {}),
        )
        onboarding_data = state.get("collected_info", {})

        # Check if running single check or full QA
        check_type = input_data.get("check_type")

        if check_type:
            response = await self.run_single_check(check_type, press_release)
        else:
            response = await self.run_quality_checks(press_release, onboarding_data)

        if response.success:
            data = response.data

            if "qa_report" in data:
                qa_report = data["qa_report"]
                state["qa_report"] = qa_report
                state["quality_score"] = qa_report.get("overall_score", 0)
                state["plagiarism_score"] = qa_report.get("checks", {}).get("plagiarism", {}).get("score", 100)
                state["ai_detection_score"] = qa_report.get("checks", {}).get("ai_detection", {}).get("score", 100)

            state["tokens_used"] += response.metrics.get("total_tokens", 0)
            state["cost_usd"] += response.metrics.get("cost_usd", 0)
            state["current_agent"] = "qa"

            if data.get("passed"):
                state["workflow_step"] = "qa_passed"
            else:
                state["workflow_step"] = "qa_failed"
                state["approval"] = False

        return state
