"""
Base Agent Class

All specialist agents inherit from this base class.
Provides common functionality for LLM interaction, knowledge retrieval, and response formatting.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

from ..llm.openrouter_client import OpenRouterClient, Message, LLMResponse, get_client
from ..ingest.local_retriever import LocalKnowledgeRetriever


class BaseAgent(ABC):
    """Base class for all specialist agents."""

    def __init__(
        self,
        name: str,
        system_prompt_file: Optional[str] = None,
        llm_client: Optional[OpenRouterClient] = None,
        knowledge_base: Optional[LocalKnowledgeRetriever] = None,
    ):
        """Initialize base agent.

        Args:
            name: Agent name (e.g., "scanner_builder")
            system_prompt_file: Path to system prompt markdown file
            llm_client: LLM client (uses default if None)
            knowledge_base: Knowledge retriever (creates default if None)
        """
        self.name = name
        self.llm_client = llm_client or get_client()
        self.knowledge_base = knowledge_base or self._create_knowledge_base()
        self.system_prompt = self._load_system_prompt(system_prompt_file)
        self.conversation_history: List[Message] = []

    def _create_knowledge_base(self) -> LocalKnowledgeRetriever:
        """Create default knowledge base."""
        chunks_dir = Path(__file__).parent.parent.parent / "data" / "chunks"
        if chunks_dir.exists():
            return LocalKnowledgeRetriever(str(chunks_dir))
        return None

    def _load_system_prompt(self, prompt_file: Optional[str]) -> str:
        """Load system prompt from file."""
        if prompt_file is None:
            # Default to prompts/{name}.md
            prompt_file = Path(__file__).parent.parent.parent / "prompts" / f"{self.name}.md"

        prompt_path = Path(prompt_file)
        if prompt_path.exists():
            return prompt_path.read_text()

        # Fallback default prompt
        return f"""You are the {self.name} agent for the EdgeDev AI Agent system.

Your role is to assist with trading strategy development.
Always provide clear, actionable responses based on the Gold Standards.
"""

    @abstractmethod
    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process user input and generate response.

        Args:
            user_input: User's request or question
            context: Additional context (e.g., conversation history, retrieved knowledge)

        Returns:
            Agent's response
        """
        pass

    async def query_knowledge(
        self,
        query: str,
        match_count: int = 5,
        chunk_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Query knowledge base for relevant information.

        Args:
            query: Search query
            match_count: Number of results to return
            chunk_type: Filter by chunk type (optional)

        Returns:
            List of relevant chunks
        """
        if self.knowledge_base is None:
            return []

        return self.knowledge_base.search(
            query=query,
            match_count=match_count,
            chunk_type=chunk_type
        )

    def format_knowledge_for_prompt(self, chunks: List[Dict[str, Any]]) -> str:
        """Format retrieved knowledge for inclusion in prompt.

        Args:
            chunks: Retrieved knowledge chunks

        Returns:
            Formatted string with knowledge content
        """
        if not chunks:
            return "No relevant knowledge found."

        output = "RELEVANT KNOWLEDGE FROM GOLD STANDARDS:\n\n"

        for i, chunk in enumerate(chunks, 1):
            heading = " > ".join(chunk.get("heading_path", [])[-2:])
            source = chunk.get("source_file", "Unknown")
            tags = ", ".join(chunk.get("tags", []))

            # Get content snippet
            content = chunk.get("content", "")
            if len(content) > 500:
                content = content[:500] + "..."

            output += f"[{i}] From: {source}\n"
            output += f"    Section: {heading}\n"
            output += f"    Tags: {tags}\n"
            output += f"    Content: {content}\n\n"

        return output

    async def generate_response(
        self,
        user_input: str,
        retrieved_knowledge: Optional[str] = None,
        temperature: float = 0.7,
        include_history: bool = True
    ) -> LLMResponse:
        """Generate LLM response with system prompt and context.

        Args:
            user_input: User's request
            retrieved_knowledge: Formatted knowledge from retrieval
            temperature: Sampling temperature
            include_history: Include conversation history

        Returns:
            LLM response
        """
        # Build messages
        messages = []

        # System prompt
        system_prompt = self.system_prompt
        if retrieved_knowledge:
            system_prompt += f"\n\n{retrieved_knowledge}"
        messages.append(Message(role="system", content=system_prompt))

        # Conversation history (if enabled)
        if include_history:
            messages.extend(self.conversation_history[-10:])  # Last 10 messages

        # Current user input
        messages.append(Message(role="user", content=user_input))

        # Generate response
        response = await self.llm_client.chat(
            messages=messages,
            temperature=temperature,
        )

        # Update conversation history
        self.conversation_history.append(Message(role="user", content=user_input))
        self.conversation_history.append(Message(role="assistant", content=response.content))

        # Keep history manageable
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]

        return response

    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []

    def get_history(self) -> List[Message]:
        """Get conversation history."""
        return self.conversation_history.copy()

    async def process_with_knowledge(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None,
        knowledge_query: Optional[str] = None,
        match_count: int = 5
    ) -> str:
        """Process input with automatic knowledge retrieval.

        Args:
            user_input: User's request
            context: Additional context
            knowledge_query: Specific query for knowledge (uses user_input if None)
            match_count: Number of knowledge chunks to retrieve

        Returns:
            Agent's response
        """
        # Query knowledge base
        query = knowledge_query or self._extract_knowledge_query(user_input)
        chunks = await self.query_knowledge(query, match_count=match_count)
        knowledge = self.format_knowledge_for_prompt(chunks)

        # Generate response
        response = await self.generate_response(
            user_input=user_input,
            retrieved_knowledge=knowledge,
        )

        return response.content

    def _extract_knowledge_query(self, user_input: str) -> str:
        """Extract relevant query for knowledge retrieval from user input.

        Args:
            user_input: User's request

        Returns:
            Query string for knowledge search
        """
        # Simple approach: use first few meaningful words
        words = user_input.split()
        meaningful_words = [w for w in words if len(w) > 3][:10]
        return " ".join(meaningful_words)

    def format_response(
        self,
        content: str,
        include_metadata: bool = False
    ) -> str:
        """Format response for presentation to user.

        Args:
            content: Response content
            include_metadata: Include agent metadata

        Returns:
            Formatted response
        """
        if include_metadata:
            header = f"## Response from {self.name}\n\n"
            return header + content
        return content


class SimpleAgent(BaseAgent):
    """Simple implementation of BaseAgent for quick testing."""

    async def process(self, user_input: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process user input with knowledge retrieval."""
        return await self.process_with_knowledge(user_input, context)
