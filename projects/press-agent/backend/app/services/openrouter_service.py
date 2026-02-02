"""
OpenRouter LLM Service
Model routing and cost-optimized LLM calls via OpenRouter API
"""
import httpx
from typing import Any, Optional, List, Dict
from ..core.config import settings
import json


class OpenRouterService:
    """
    Service for making LLM calls through OpenRouter.
    Handles model selection, cost tracking, and response parsing.
    """

    def __init__(self, api_key: str = settings.OPENROUTER_API_KEY):
        self.api_key = api_key
        self.base_url = settings.OPENROUTER_BASE_URL
        self._client: Optional[httpx.AsyncClient] = None

        # Model assignments by task type
        self.models = {
            "onboarding": settings.MODEL_ONBOARDING,
            "writer": settings.MODEL_WRITER,
            "editor": settings.MODEL_EDITOR,
            "qa": settings.MODEL_QA,
        }

        # Cost per 1K tokens
        self.costs = {
            "onboarding": settings.COST_ONBOARDING,
            "writer": settings.COST_WRITER,
            "editor": settings.COST_EDITOR,
            "qa": settings.COST_QA,
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            timeout = httpx.Timeout(300.0, connect=30.0)  # 5 min timeout
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://press-agent.ai",
                "X-Title": "Press Agent",
            }
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=timeout,
                headers=headers,
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _calculate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate cost based on model and tokens"""
        task_type = None
        for task, task_model in self.models.items():
            if task_model == model:
                task_type = task
                break

        if task_type is None:
            # Default cost if unknown model
            return 0.001

        cost_per_1k = self.costs.get(task_type, 0.001)
        total_tokens = prompt_tokens + completion_tokens
        return (total_tokens / 1000) * cost_per_1k

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """
        Make a chat completion request

        Args:
            messages: List of message dicts with role and content
            model: Model identifier (e.g., "anthropic/claude-3.5-sonnet")
            temperature: Sampling temperature
            max_tokens: Max tokens to generate
            json_mode: Force JSON response

        Returns:
            Dict with content, tokens_used, cost_usd
        """
        client = await self._get_client()

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        try:
            response = await client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()

            choice = data["choices"][0]
            content = choice.get("message", {}).get("content", "")
            usage = data.get("usage", {})

            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", 0)

            cost = self._calculate_cost(model, prompt_tokens, completion_tokens)

            return {
                "content": content,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_usd": cost,
                "finish_reason": choice.get("finish_reason"),
            }

        except httpx.HTTPError as e:
            print(f"OpenRouter API error: {e}")
            raise

    async def stream_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
    ):
        """
        Stream a chat completion response

        Args:
            messages: List of message dicts
            model: Model identifier
            temperature: Sampling temperature

        Yields:
            Content chunks as they arrive
        """
        client = await self._get_client()

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
        }

        try:
            async with client.stream("POST", "/chat/completions", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        try:
                            data = json.loads(line[6:])
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            if "content" in delta:
                                yield delta["content"]
                        except json.JSONDecodeError:
                            continue
        except httpx.HTTPError as e:
            print(f"OpenRouter stream error: {e}")
            raise

    # Convenience methods for each task type

    async def onboarding_call(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.8,
    ) -> Dict[str, Any]:
        """Make an onboarding agent call (free DeepSeek)"""
        return await self.chat_completion(
            messages=messages,
            model=self.models["onboarding"],
            temperature=temperature,
        )

    async def writer_call(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        json_mode: bool = False,
    ) -> Dict[str, Any]:
        """Make a writer agent call (Claude 3.5 Sonnet)"""
        return await self.chat_completion(
            messages=messages,
            model=self.models["writer"],
            temperature=temperature,
            json_mode=json_mode,
        )

    async def editor_call(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.5,
    ) -> Dict[str, Any]:
        """Make an editor agent call (GPT-4o-mini)"""
        return await self.chat_completion(
            messages=messages,
            model=self.models["editor"],
            temperature=temperature,
        )

    async def qa_call(
        self,
        messages: List[Dict[str, str]],
        json_mode: bool = True,
    ) -> Dict[str, Any]:
        """Make a QA agent call (GPT-4o-mini)"""
        return await self.chat_completion(
            messages=messages,
            model=self.models["qa"],
            temperature=0.2,
            json_mode=json_mode,
        )

    async def stream_writer(
        self,
        messages: List[Dict[str, str]],
    ):
        """Stream writer agent response"""
        return self.stream_completion(
            messages=messages,
            model=self.models["writer"],
            temperature=0.7,
        )

    def get_model_for_task(self, task: str) -> str:
        """Get model name for a task type"""
        return self.models.get(task, self.models["writer"])

    def get_cost_estimate(
        self,
        task: str,
        estimated_tokens: int,
    ) -> float:
        """Estimate cost for a task based on token count"""
        cost_per_1k = self.costs.get(task, 0.001)
        return (estimated_tokens / 1000) * cost_per_1k


# Global service instance
_openrouter_service: Optional[OpenRouterService] = None


def get_openrouter_service() -> OpenRouterService:
    """Get or create global OpenRouter service"""
    global _openrouter_service
    if _openrouter_service is None:
        _openrouter_service = OpenRouterService()
    return _openrouter_service
