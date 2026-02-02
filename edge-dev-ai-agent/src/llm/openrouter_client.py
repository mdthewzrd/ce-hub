"""
OpenRouter LLM Client

Provides unified interface for LLM interactions via OpenRouter API.
Supports multiple models (Claude, GPT-4, etc.) with fallback support.
"""

import os
from typing import List, Dict, Any, Optional, AsyncIterator
from dataclasses import dataclass, field
from openai import AsyncOpenAI
import asyncio


@dataclass
class Message:
    """A message in the conversation."""
    role: str  # 'system', 'user', 'assistant'
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMResponse:
    """Response from LLM."""
    content: str
    model: str
    finish_reason: str
    usage: Dict[str, int] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMConfig:
    """Configuration for LLM client."""
    api_key: str = ""
    base_url: str = "https://openrouter.ai/api/v1"
    default_model: str = "anthropic/claude-sonnet"
    fallback_model: str = "anthropic/claude-3-haiku"
    temperature: float = 0.7
    max_tokens: int = 4096
    timeout: int = 120

    def __post_init__(self):
        """Load API key from environment if not provided."""
        if not self.api_key:
            self.api_key = os.getenv("OPENROUTER_API_KEY", "")


class OpenRouterClient:
    """Client for OpenRouter LLM API."""

    def __init__(self, config: Optional[LLMConfig] = None):
        self.config = config or LLMConfig()
        self.client = AsyncOpenAI(
            api_key=self.config.api_key,
            base_url=self.config.base_url,
        )
        self._current_model = self.config.default_model

    @property
    def model(self) -> str:
        """Get current model."""
        return self._current_model

    def set_model(self, model: str):
        """Set the model to use."""
        self._current_model = model

    async def chat(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """Send chat completion request.

        Args:
            messages: List of messages in conversation
            model: Model to use (overrides current)
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            **kwargs: Additional parameters for API

        Returns:
            LLMResponse with generated content
        """
        model = model or self._current_model
        temperature = temperature if temperature is not None else self.config.temperature
        max_tokens = max_tokens or self.config.max_tokens

        # Convert messages to OpenAI format
        api_messages = [
            {"role": m.role, "content": m.content}
            for m in messages
        ]

        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=model,
                    messages=api_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                ),
                timeout=self.config.timeout
            )

            choice = response.choices[0]
            return LLMResponse(
                content=choice.message.content,
                model=response.model,
                finish_reason=choice.finish_reason,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                },
                metadata={
                    "id": response.id,
                    "created": response.created,
                }
            )

        except asyncio.TimeoutError:
            # Try fallback model on timeout
            if model != self.config.fallback_model:
                print(f"Timeout with {model}, trying fallback {self.config.fallback_model}")
                return await self.chat(
                    messages,
                    model=self.config.fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                )
            raise

        except Exception as e:
            # Try fallback model on error
            if model != self.config.fallback_model:
                print(f"Error with {model}: {e}, trying fallback {self.config.fallback_model}")
                return await self.chat(
                    messages,
                    model=self.config.fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                )
            raise

    async def chat_stream(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncIterator[str]:
        """Stream chat completion response.

        Yields chunks of content as they're generated.

        Args:
            messages: List of messages in conversation
            model: Model to use (overrides current)
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            **kwargs: Additional parameters for API

        Yields:
            Content chunks as strings
        """
        model = model or self._current_model
        temperature = temperature if temperature is not None else self.config.temperature
        max_tokens = max_tokens or self.config.max_tokens

        api_messages = [
            {"role": m.role, "content": m.content}
            for m in messages
        ]

        try:
            stream = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=model,
                    messages=api_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True,
                    **kwargs
                ),
                timeout=self.config.timeout
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except asyncio.TimeoutError:
            if model != self.config.fallback_model:
                print(f"Timeout with {model}, trying fallback {self.config.fallback_model}")
                async for content in self.chat_stream(
                    messages,
                    model=self.config.fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                ):
                    yield content
                return
            raise

        except Exception as e:
            if model != self.config.fallback_model:
                print(f"Error with {model}: {e}, trying fallback {self.config.fallback_model}")
                async for content in self.chat_stream(
                    messages,
                    model=self.config.fallback_model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **kwargs
                ):
                    yield content
                return
            raise

    def chat_sync(
        self,
        messages: List[Message],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """Synchronous wrapper for chat completion."""
        return asyncio.run(self.chat(
            messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        ))

    async def count_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)."""
        # Rough estimate: ~4 characters per token
        return len(text) // 4

    async def truncate_to_fit(
        self,
        messages: List[Message],
        max_tokens: int,
        reserve_for_output: int = 2048
    ) -> List[Message]:
        """Truncate messages to fit within token limit.

        Keeps system message and recent messages.
        """
        # Estimate current tokens
        total_tokens = sum(
            await self.count_tokens(m.content)
            for m in messages
        )

        if total_tokens <= max_tokens - reserve_for_output:
            return messages

        # Keep system message, truncate from end
        result = []
        tokens_used = 0

        # Always keep system message
        for m in messages:
            if m.role == "system":
                result.append(m)
                tokens_used += await self.count_tokens(m.content)

        # Add messages from end until we hit limit
        for m in reversed(messages):
            if m.role == "system":
                continue

            msg_tokens = await self.count_tokens(m.content)

            if tokens_used + msg_tokens > max_tokens - reserve_for_output:
                break

            result.insert(1, m)  # Insert after system message
            tokens_used += msg_tokens

        return result


# Singleton instance for easy access
_default_client: Optional[OpenRouterClient] = None


def get_client(config: Optional[LLMConfig] = None) -> OpenRouterClient:
    """Get or create default LLM client."""
    global _default_client
    if _default_client is None:
        _default_client = OpenRouterClient(config)
    return _default_client


def reset_client():
    """Reset default client (useful for testing)."""
    global _default_client
    _default_client = None
