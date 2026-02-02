"""
Onboarding Agent
Handles client onboarding through conversational questionnaire
Uses free DeepSeek model for cost-effective data collection
"""
from typing import Dict, Any, Optional, List
from .base_agent import BaseAgent, AgentResponse, AgentError
from ..core.config import settings


class OnboardingAgent(BaseAgent):
    """
    Onboarding agent for collecting press request details through chat.
    Uses free DeepSeek model to minimize costs.
    """

    # Required information for press release
    REQUIRED_FIELDS = [
        "announcement_type",
        "key_messages",
        "quotes",
        "company_description",
        "target_audience",
        "target_date",
    ]

    # Announcement types
    ANNOUNCEMENT_TYPES = [
        "product_launch",
        "funding_announcement",
        "executive_hiring",
        "partnership",
        "acquisition",
        "award_recognition",
        "event_announcement",
        "research_publication",
        "expansion",
        "milestone",
        "rebranding",
        "other",
    ]

    def __init__(self, **kwargs):
        super().__init__(name="onboarding", **kwargs)

    def get_default_model(self) -> str:
        """Use free DeepSeek for onboarding"""
        return settings.MODEL_ONBOARDING

    def get_system_prompt(self) -> str:
        """System prompt for onboarding conversations"""
        return """You are a helpful press release onboarding specialist for Press Agent.

Your role is to gather necessary information from clients to create an effective press release. Be friendly, professional, and conversational.

**Information to collect:**
1. **Announcement Type** - What type of announcement is this?
   Options: product_launch, funding_announcement, executive_hiring, partnership, acquisition, award_recognition, event_announcement, research_publication, expansion, milestone, rebranding, other

2. **Key Messages** - What are the 3-5 most important points to communicate?
   Ask for specific details, metrics, or news that should be highlighted.

3. **Quotes** - Who can provide quotes? (CEO, executives, stakeholders)
   Collect the speaker's name, title, and what they might say.

4. **Company Description** - Brief description of the company
   What does the company do? What's their industry?

5. **Target Audience** - Who should read this press release?
   Industry, geography, demographics, interests?

6. **Target Date** - When should this be released?
   Any specific embargo dates or deadlines?

7. **Budget Range** - What's the budget for press distribution?
   This helps recommend appropriate media outlets.

**Guidelines:**
- Ask one question at a time in a natural, conversational way
- Acknowledge and validate the client's responses
- If information is unclear or incomplete, gently ask for clarification
- Don't overwhelm the client with too many questions at once
- Maintain context from previous responses
- Be helpful and suggest options when appropriate
- When you have all required information, summarize it and ask for confirmation

**Response Format:**
When you've collected all information, structure your final response as JSON:
```json
{
  "complete": true,
  "summary": "Brief summary of the announcement",
  "data": {
    "announcement_type": "...",
    "key_messages": ["...", "..."],
    "quotes": [{"speaker": "...", "title": "...", "text": "..."}],
    "company_description": "...",
    "target_audience": "...",
    "target_date": "YYYY-MM-DD",
    "budget_min": 1000,
    "budget_max": 5000,
    "additional_context": "..."
  }
}
```

Keep your responses concise and friendly. Focus on gathering quality information efficiently."""

    async def start_onboarding(self, request_id: str, client_name: str) -> str:
        """
        Generate the initial onboarding message

        Args:
            request_id: Press request ID
            client_name: Client's name or company name

        Returns:
            Initial greeting and first question
        """
        greeting = f"""Welcome to Press Agent, {client_name}! I'll help you create an effective press release.

Let's start with the basics. What type of announcement are you planning to make?

For example:
- Launching a new product or service
- Announcing funding or investment
- Hiring a new executive
- Forming a partnership
- Company acquisition
- Award or recognition
- Upcoming event
- Research findings
- Business expansion
- Company milestone
- Rebranding
- Something else

What type of announcement do you have in mind?"""
        return greeting

    async def process_message(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        collected_data: Dict[str, Any],
    ) -> AgentResponse:
        """
        Process a client message during onboarding

        Args:
            message: Client's message
            conversation_history: Previous conversation
            collected_data: Data collected so far

        Returns:
            Agent response with next message or completion status
        """
        # Build context for the LLM
        context_prompt = self._build_context_prompt(collected_data)

        messages = self.build_messages(
            user_message=f"{context_prompt}\n\nClient message: {message}",
            conversation_history=conversation_history,
        )

        try:
            result = await self.call_llm(
                messages=messages,
                temperature=0.8,
                json_mode=False,  # Let it respond naturally unless complete
            )

            response_text = result["content"]

            # Check if onboarding is complete (JSON response)
            if "```json" in response_text and '"complete": true' in response_text:
                # Extract JSON data
                import json
                try:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    json_data = json.loads(response_text[json_start:json_end].strip())

                    return AgentResponse.success_response(
                        data={
                            "complete": True,
                            "collected_info": json_data.get("data", {}),
                            "summary": json_data.get("summary", ""),
                        },
                        metrics=result,
                        next_action="complete_onboarding",
                    )
                except json.JSONDecodeError:
                    pass

            # Continue onboarding
            return AgentResponse.success_response(
                data={
                    "complete": False,
                    "agent_message": response_text,
                    "collected_info": self._extract_new_data(response_text, collected_data),
                },
                metrics=result,
                next_action="continue_onboarding",
            )

        except Exception as e:
            return AgentResponse.error_response(
                error=str(e),
                details={"message": message, "collected_data": collected_data},
            )

    def _build_context_prompt(self, collected_data: Dict[str, Any]) -> str:
        """Build context prompt with collected information"""
        if not collected_data:
            return "This is the start of our conversation. Begin the onboarding process."

        context = "Information collected so far:\n"
        for key, value in collected_data.items():
            if value:
                context += f"- {key}: {value}\n"

        context += "\nContinue gathering missing information naturally."
        return context

    def _extract_new_data(
        self,
        response_text: str,
        collected_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Extract newly collected data from agent response
        This is a simple placeholder - in production, use more sophisticated extraction
        """
        # For now, return the existing data
        # A more sophisticated implementation would parse the agent's understanding
        return collected_data

    async def validate_collected_data(
        self,
        data: Dict[str, Any],
    ) -> tuple[bool, List[str]]:
        """
        Validate that all required information has been collected

        Args:
            data: Collected onboarding data

        Returns:
            Tuple of (is_valid, missing_fields)
        """
        missing = []

        for field in self.REQUIRED_FIELDS:
            if field not in data or not data[field]:
                missing.append(field)

        # Validate announcement type
        if data.get("announcement_type") and data["announcement_type"] not in self.ANNOUNCEMENT_TYPES:
            missing.append("valid_announcement_type")

        return len(missing) == 0, missing

    async def execute(
        self,
        state: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute onboarding agent (for LangGraph workflow)

        Args:
            state: Current workflow state
            input_data: Input with message and conversation history

        Returns:
            Updated state
        """
        message = input_data.get("message", "")
        history = input_data.get("conversation_history", [])
        collected = state.get("collected_info", {})

        response = await self.process_message(message, history, collected)

        if response.success:
            state["collected_info"] = response.data.get("collected_info", {})
            state["tokens_used"] += response.metrics.get("total_tokens", 0)
            state["cost_usd"] += response.metrics.get("cost_usd", 0)

            if response.data.get("complete"):
                state["onboarding_complete"] = True
                state["workflow_step"] = "onboarding_complete"
            else:
                state["workflow_step"] = "onboarding_in_progress"

        return state
