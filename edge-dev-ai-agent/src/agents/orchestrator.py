"""
Main Orchestrator Agent

Coordinates all subagents, routes requests, and manages workflows.
This is the entry point for all user interactions.
"""

import re
from typing import Dict, Any, Optional, List
from pathlib import Path

from .base_agent import BaseAgent
from ..llm.openrouter_client import Message


class OrchestratorAgent(BaseAgent):
    """Main orchestrator that coordinates all subagents."""

    # Agent routing patterns
    ROUTING_PATTERNS = {
        "scanner_builder": [
            r"\bscanner\b",
            r"\bscreen\b",
            r"\bscan\b",
            r"\bdetect\b.*\bpatter[n]?n?\b",
            r"\bsetup\b.*\bdetect\b",
        ],
        "strategy_builder": [
            r"\bstrategy\b",
            r"\bexecution\b",
            r"\bpyramid\b",
            r"\bposition\b.*\bsize\b",
            r"\brisk\b.*\bmanagement\b",
            r"\bentry\b.*\brules?\b",
            r"\bexit\b.*\brules?\b",
        ],
        "backtest_builder": [
            r"\bbacktest\b",
            r"\btest\b.*\bhistor[y]?i?\b",
            r"\bvalidate\b",
            r"\bsimulat[e]?n?\b",
            r"\bperformance\b",
        ],
        "optimizer": [
            r"\boptim[iz]?[sz]?\b",
            r"\btun[e]?n?\b.*\bparam\b",
            r"\bparamet[er]?n?\b.*\btun[e]?n?\b",
            r"\bimprove\b.*\bperform\b",
        ],
        "validator": [
            r"\bvalidat[e]?n?\b",
            r"\bcheck\b",
            r"\breview\b.*\bcode\b",
            r"\bquality\b",
            r"\binspect\b",
        ],
        "trading_advisor": [
            r"\badvic[e]?n?\b",
            r"\brecommend\b",
            r"\bwhat\b.*\bbuy\b",
            r"\bmarket\b.*\bcondition\b",
            r"\bedge\b",
            r"\bregime\b",
            r"\bsignal\b",
        ],
    }

    def __init__(
        self,
        subagents: Optional[Dict[str, BaseAgent]] = None,
        **kwargs
    ):
        """Initialize orchestrator.

        Args:
            subagents: Dictionary of agent name -> agent instance
            **kwargs: Passed to BaseAgent
        """
        super().__init__(name="orchestrator", **kwargs)
        self.subagents = subagents or {}
        self.routing_cache: Dict[str, str] = {}

    def register_subagent(self, name: str, agent: BaseAgent):
        """Register a subagent for routing."""
        self.subagents[name] = agent

    def _route_request(self, user_input: str) -> Optional[str]:
        """Determine which subagent should handle the request.

        Args:
            user_input: User's request

        Returns:
            Agent name or None for orchestrator to handle
        """
        user_input_lower = user_input.lower()

        # Check each agent's patterns
        for agent_name, patterns in self.ROUTING_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, user_input_lower):
                    # Check if agent exists
                    if agent_name in self.subagents:
                        return agent_name
                    else:
                        # Agent not yet implemented, note it
                        return f"unimplemented_{agent_name}"

        # No match - orchestrator handles it
        return None

    async def _clarify_request(self, user_input: str) -> str:
        """Ask clarifying questions for ambiguous requests.

        Args:
            user_input: User's ambiguous request

        Returns:
            Clarification response
        """
        response = await self.generate_response(
            user_input=f"""
The user request is unclear. Please ask 2-3 focused questions to clarify.

User Request: "{user_input}"

Your questions should be:
- Focused on objectives and requirements
- Not asking about technical implementation details
- About WHAT they want, not HOW to do it

Ask your questions directly, then wait for their answers.
""",
            retrieved_knowledge="",
            include_history=False,
        )

        return response.content

    def _format_for_subagent(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Format user input for delegation to subagent.

        Args:
            user_input: Original user input
            context: Additional context

        Returns:
            Formatted request for subagent
        """
        output = f"USER REQUEST: {user_input}\n"

        if context:
            if "conversation_history" in context:
                history = context["conversation_history"]
                if history:
                    output += f"\nCONVERSATION CONTEXT:\n"
                    for msg in history[-3:]:
                        output += f"  {msg.role}: {msg.content[:100]}...\n"

            if "retrieved_knowledge" in context:
                output += f"\nRELEVANT CONTEXT:\n{context['retrieved_knowledge']}\n"

        return output

    def _format_subagent_response(
        self,
        agent_name: str,
        response: str,
        user_input: str
    ) -> str:
        """Format subagent's response for user.

        Args:
            agent_name: Name of subagent
            response: Subagent's response
            user_input: Original user input

        Returns:
            Formatted response
        """
        agent_display_name = agent_name.replace("_", " ").title()

        output = f"""## Understanding

{self._summarize_request(user_input)}

## Plan

I've delegated this to the **{agent_display_name}** specialist agent.

## Results

{response}

## Summary

The {agent_display_name} has completed your request. Let me know if you need any adjustments or have follow-up questions.
"""
        return output

    def _summarize_request(self, user_input: str) -> str:
        """Generate a brief summary of the user's request."""
        # Simple summarization - first sentence or first 100 chars
        first_period = user_input.find(".")
        if first_period > 0 and first_period < 150:
            return user_input[:first_period + 1]
        return user_input[:100] + ("..." if len(user_input) > 100 else "")

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process user request with appropriate routing.

        Args:
            user_input: User's request
            context: Additional context (conversation history, etc.)

        Returns:
            Response to user
        """
        # Determine which agent should handle this
        agent_name = self._route_request(user_input)

        # No specific agent matched - orchestrator handles
        if agent_name is None:
            # Check if this is a knowledge query
            knowledge_chunks = await self.query_knowledge(user_input, match_count=3)

            if knowledge_chunks:
                # We have relevant knowledge - provide answer
                knowledge = self.format_knowledge_for_prompt(knowledge_chunks)
                response = await self.generate_response(
                    user_input=user_input,
                    retrieved_knowledge=knowledge
                )
                return response.content
            else:
                # No clear match or knowledge - ask for clarification
                clarification = await self._clarify_request(user_input)
                return clarification

        # Route to appropriate subagent
        subagent = self.subagents.get(agent_name)
        if subagent:
            # Format request for subagent
            formatted_request = self._format_for_subagent(user_input, context)

            # Delegate to subagent
            try:
                subagent_response = await subagent.process(formatted_request, context)

                # Format response for user
                return self._format_subagent_response(
                    agent_name,
                    subagent_response,
                    user_input
                )
            except Exception as e:
                return f"""I delegated your request to the {agent_name.replace('_', ' ').title()} agent, but encountered an error:

**Error**: {str(e)}

This might be a temporary issue. Would you like me to:
1. Search the knowledge base for relevant information?
2. Try a different approach?
"""

        # Fallback - shouldn't reach here
        return "I'm sorry, I couldn't determine how to handle your request. Could you please rephrase it?"

    async def chat(
        self,
        message: str,
        conversation_history: Optional[List[Message]] = None
    ) -> str:
        """Chat interface for simple interactions.

        Args:
            message: User message
            conversation_history: Previous messages

        Returns:
            Agent response
        """
        context = {}
        if conversation_history:
            context["conversation_history"] = conversation_history

        return await self.process(message, context)

    def get_status(self) -> Dict[str, Any]:
        """Get orchestrator status and available agents."""
        return {
            "orchestrator": "active",
            "registered_agents": list(self.subagents.keys()),
            "knowledge_base": self.knowledge_base is not None,
            "model": self.llm_client.model,
        }


def create_orchestrator(
    subagents: Optional[Dict[str, BaseAgent]] = None,
    **kwargs
) -> OrchestratorAgent:
    """Create a new orchestrator instance.

    Args:
        subagents: Dictionary of subagent instances
        **kwargs: Additional arguments for orchestrator

    Returns:
        Configured orchestrator agent
    """
    orchestrator = OrchestratorAgent(subagents=subagents, **kwargs)

    # Auto-register any provided subagents
    if subagents:
        for name, agent in subagents.items():
            orchestrator.register_subagent(name, agent)

    return orchestrator
