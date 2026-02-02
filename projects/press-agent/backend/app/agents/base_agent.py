"""
Base Agent Class
Foundation for all Press Agent AI agents
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from ..services.openrouter_service import OpenRouterService
from ..core.archon_client import ArchonClient
from ..core.config import settings


class BaseAgent(ABC):
    """
    Base class for all Press Agent agents.
    Provides common functionality for LLM calls, Archon integration, and state management.
    """

    def __init__(
        self,
        name: str,
        model: Optional[str] = None,
        llm_service: Optional[OpenRouterService] = None,
        archon_client: Optional[ArchonClient] = None,
    ):
        """
        Initialize base agent

        Args:
            name: Agent identifier
            model: Model override (uses default if not provided)
            llm_service: OpenRouter service instance
            archon_client: Archon MCP client instance
        """
        self.name = name
        self.model = model or self.get_default_model()
        self.llm_service = llm_service or OpenRouterService()
        self.archon_client = archon_client

        # Agent metrics
        self.tokens_used = 0
        self.cost_usd = 0.0
        self.calls_made = 0

    @abstractmethod
    def get_default_model(self) -> str:
        """Return the default model for this agent type"""
        pass

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent"""
        pass

    @abstractmethod
    async def execute(
        self,
        state: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute the agent's primary function

        Args:
            state: Current workflow state
            input_data: Input data for this execution

        Returns:
            Updated state or output data
        """
        pass

    async def call_llm(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """
        Make an LLM call with the agent's model

        Args:
            messages: Conversation messages
            temperature: Sampling temperature
            json_mode: Force JSON output

        Returns:
            LLM response with content, tokens, cost
        """
        result = await self.llm_service.chat_completion(
            messages=messages,
            model=self.model,
            temperature=temperature,
            json_mode=json_mode,
        )

        # Track metrics
        self.tokens_used += result["total_tokens"]
        self.cost_usd += result["cost_usd"]
        self.calls_made += 1

        return result

    async def call_llm_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
    ):
        """
        Stream an LLM response

        Args:
            messages: Conversation messages
            temperature: Sampling temperature

        Yields:
            Content chunks
        """
        async for chunk in self.llm_service.stream_completion(
            messages=messages,
            model=self.model,
            temperature=temperature,
        ):
            yield chunk

            # Estimate tokens (rough approximation: 4 chars per token)
            self.tokens_used += len(chunk) // 4

    def build_messages(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        """
        Build message list with system prompt and conversation history

        Args:
            user_message: Current user message
            conversation_history: Optional conversation history

        Returns:
            Complete message list for LLM call
        """
        messages = [{"role": "system", "content": self.get_system_prompt()}]

        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": user_message})
        return messages

    async def search_archon(
        self,
        query: str,
        knowledge_type: Optional[str] = None,
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search Archon knowledge graph

        Args:
            query: Search query
            knowledge_type: Optional type filter
            limit: Max results
            filters: Additional filters

        Returns:
            Search results
        """
        if not self.archon_client:
            return []

        return await self.archon_client.search_knowledge(
            query=query,
            knowledge_type=knowledge_type,
            limit=limit,
            filters=filters,
        )

    async def store_to_archon(
        self,
        knowledge_type: str,
        content: str,
        metadata: Dict[str, Any],
        project_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Store knowledge in Archon

        Args:
            knowledge_type: Type of knowledge
            content: Content text
            metadata: Metadata dictionary
            project_id: Optional project ID

        Returns:
            Knowledge ID if successful
        """
        if not self.archon_client:
            return None

        return await self.archon_client.store_knowledge(
            knowledge_type=knowledge_type,
            content=content,
            metadata=metadata,
            project_id=project_id,
        )

    def get_metrics(self) -> Dict[str, Any]:
        """Get agent usage metrics"""
        return {
            "agent": self.name,
            "model": self.model,
            "tokens_used": self.tokens_used,
            "cost_usd": round(self.cost_usd, 4),
            "calls_made": self.calls_made,
        }

    def reset_metrics(self) -> None:
        """Reset agent metrics"""
        self.tokens_used = 0
        self.cost_usd = 0.0
        self.calls_made = 0


class AgentError(Exception):
    """Custom exception for agent errors"""

    def __init__(self, agent_name: str, message: str, details: Optional[Dict[str, Any]] = None):
        self.agent_name = agent_name
        self.message = message
        self.details = details or {}
        super().__init__(f"[{agent_name}] {message}")


class AgentResponse:
    """Structured response from agent execution"""

    def __init__(
        self,
        success: bool,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        metrics: Optional[Dict[str, Any]] = None,
        next_action: Optional[str] = None,
    ):
        self.success = success
        self.data = data or {}
        self.error = error
        self.metrics = metrics or {}
        self.next_action = next_action

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "metrics": self.metrics,
            "next_action": self.next_action,
        }

    @classmethod
    def success_response(
        cls,
        data: Dict[str, Any],
        metrics: Optional[Dict[str, Any]] = None,
        next_action: Optional[str] = None,
    ) -> "AgentResponse":
        """Create a successful response"""
        return cls(
            success=True,
            data=data,
            metrics=metrics,
            next_action=next_action,
        )

    @classmethod
    def error_response(
        cls,
        error: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> "AgentResponse":
        """Create an error response"""
        return cls(
            success=False,
            error=error,
            data=details,
        )
