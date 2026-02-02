"""
OpenRouter API Client for Instagram Caption Generation
Supports multiple models with automatic fallback and cost optimization
"""

import os
import requests
import json
from typing import Dict, Optional, List
from dataclasses import dataclass


# Model configurations with pricing
MODELS = {
    # CHEAPEST - Gemini Flash Lite (best for bulk generation)
    "gemini-flash-lite": {
        "id": "google/gemini-2.0-flash-lite-001",
        "input_price": 0.075,  # $ per million tokens
        "output_price": 0.30,
        "context": 1048576,
        "description": "Cheapest, fast, great for bulk caption generation"
    },

    # FAST - Gemini Flash
    "gemini-flash": {
        "id": "google/gemini-2.0-flash-001",
        "input_price": 0.10,
        "output_price": 0.40,
        "context": 1048576,
        "description": "Fast, good balance of speed and quality"
    },

    # PREMIUM - GPT-4o-mini (best quality)
    "gpt-4o-mini": {
        "id": "openai/gpt-4o-mini",
        "input_price": 0.15,
        "output_price": 0.60,
        "context": 128000,
        "description": "Best quality, excellent creative writing"
    },

    # HIGH QUALITY - Llama 3.1 405B
    "llama-405b": {
        "id": "meta-llama/llama-3.1-405b-instruct",
        "input_price": 0.80,
        "output_price": 0.80,
        "context": 131072,
        "description": "High quality open source, more expensive"
    }
}

# Default model selection
DEFAULT_MODEL = "gemini-flash-lite"  # Cheapest for bulk generation
PREMIUM_MODEL = "gpt-4o-mini"  # Use when quality matters most


@dataclass
class GenerationResult:
    """Result from caption generation"""
    success: bool
    content: str
    model_used: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    error: Optional[str] = None


class OpenRouterClient:
    """Client for interacting with OpenRouter API"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable must be set")

        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://instagram-automation.local",
            "X-Title": "Instagram Caption Engine",
            "Content-Type": "application/json"
        }

    def generate_caption(
        self,
        prompt: str,
        model: str = DEFAULT_MODEL,
        temperature: float = 0.8,
        max_tokens: int = 1000
    ) -> GenerationResult:
        """
        Generate a caption using OpenRouter API

        Args:
            prompt: The prompt to send
            model: Model key from MODELS dict
            temperature: Creativity (0-1)
            max_tokens: Maximum tokens to generate

        Returns:
            GenerationResult with content and metadata
        """
        if model not in MODELS:
            model = DEFAULT_MODEL

        model_config = MODELS[model]
        model_id = model_config["id"]

        payload = {
            "model": model_id,
            "messages": [
                {
                    "role": "system",
                    "content": "You are an elite Instagram caption writer specializing in viral, engagement-driving content for REELS. Your captions increase watch time, drive comments, and convert viewers into subscribers."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"}  # Ensure JSON output
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30
            )

            response.raise_for_status()
            data = response.json()

            # Extract usage data
            usage = data.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", 0)

            # Calculate cost
            input_cost = (prompt_tokens / 1_000_000) * model_config["input_price"]
            output_cost = (completion_tokens / 1_000_000) * model_config["output_price"]
            total_cost = input_cost + output_cost

            content = data["choices"][0]["message"]["content"]

            return GenerationResult(
                success=True,
                content=content,
                model_used=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cost_usd=total_cost
            )

        except requests.exceptions.RequestException as e:
            return GenerationResult(
                success=False,
                content="",
                model_used=model,
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                cost_usd=0.0,
                error=str(e)
            )

    def generate_with_fallback(
        self,
        prompt: str,
        preferred_model: str = DEFAULT_MODEL,
        fallback_models: List[str] = None
    ) -> GenerationResult:
        """
        Try generating with preferred model, fall back to alternatives if it fails

        Args:
            prompt: Generation prompt
            preferred_model: First model to try
            fallback_models: List of models to try in order if preferred fails

        Returns:
            GenerationResult from first successful model
        """
        if fallback_models is None:
            fallback_models = ["gemini-flash", "gpt-4o-mini"]

        # Try preferred model first
        result = self.generate_caption(prompt, model=preferred_model)
        if result.success:
            return result

        # Try fallback models
        for model in fallback_models:
            result = self.generate_caption(prompt, model=model)
            if result.success:
                return result

        # All failed
        return GenerationResult(
            success=False,
            content="",
            model_used="none",
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            cost_usd=0.0,
            error="All models failed"
        )


def get_prompt_for_caption(
    category: str,
    theme: str,
    target_keyword: str,
    context: str = "",
    emotion: str = "inspiring"
) -> str:
    """
    Build the comprehensive caption generation prompt

    Args:
        category: Content category (fitness, motivation, business, etc.)
        theme: Specific theme/topic
        target_keyword: ManyChat trigger word
        context: Additional context about the content
        emotion: Target emotion (inspiring, urgent, friendly, etc.)

    Returns:
        Formatted prompt string
    """
    prompt = f"""
Generate a viral Instagram caption for a REEL about {theme} in the {category} category.

TARGET KEYWORD: {target_keyword} (for ManyChat comment trigger)
TARGET EMOTION: {emotion}
ADDITIONAL CONTEXT: {context}

REQUIREMENTS:

1. HOOK (First 2 lines, 70 chars max)
   - Must stop the scroll
   - Use: Question, bold claim, open loop, or controversial statement
   - NO generic phrases like "Here's something..."

2. STORY BODY (3-5 paragraphs with line breaks)
   - Build emotional connection
   - Create narrative arc (tension → revelation → resolution)
   - Make it feel personal, not generic
   - Each paragraph: 1-3 sentences

3. VALUE INJECTION
   - Give actionable takeaway
   - Include "Save this" reminder
   - Educational or inspiring insight

4. CTA (Conversion-focused)
   - Primary: "Comment '{target_keyword}' to get [freebie] 🔥"
   - Secondary: "Follow for more {category} content"
   - Make it feel urgent/exclusive

5. FORMATTING
   - Line breaks between EVERY paragraph (double space)
   - Apple emojis (strategic, not spammy: 3-5 total)
   - Hashtags at bottom (15-25, mix high + low volume)
   - Max length: 800-1200 characters

CAPTION STYLE GUIDE:
- Conversational, not corporate
- Show, don't just tell
- Use specifics, not generalities
- Create curiosity gaps
- End with strong CTA

Return ONLY a JSON object with this exact structure:
{{
  "hook": "First 2 lines...",
  "story": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3",
  "value": "Save this because...",
  "cta_comment": "Comment '{target_keyword}' for...",
  "cta_follow": "Follow for more...",
  "full_caption": "Complete formatted caption with all sections",
  "hashtags": "#hashtag1 #hashtag2..."
}}
"""
    return prompt


# Cost calculator
def estimate_caption_cost(
    num_captions: int,
    model: str = DEFAULT_MODEL,
    avg_caption_length: int = 800
) -> Dict[str, float]:
    """
    Estimate cost for generating captions

    Args:
        num_captions: Number of captions to generate
        model: Model to use
        avg_caption_length: Average caption length in characters

    Returns:
        Cost breakdown
    """
    model_config = MODELS[model]

    # Estimate tokens (roughly 4 chars per token)
    prompt_tokens = 1500  # Approx tokens for the prompt
    completion_tokens = avg_caption_length // 4

    total_input_tokens = prompt_tokens * num_captions
    total_output_tokens = completion_tokens * num_captions

    input_cost = (total_input_tokens / 1_000_000) * model_config["input_price"]
    output_cost = (total_output_tokens / 1_000_000) * model_config["output_price"]
    total_cost = input_cost + output_cost

    return {
        "input_tokens": total_input_tokens,
        "output_tokens": total_output_tokens,
        "total_tokens": total_input_tokens + total_output_tokens,
        "input_cost": input_cost,
        "output_cost": output_cost,
        "total_cost": total_cost,
        "cost_per_caption": total_cost / num_captions
    }


if __name__ == "__main__":
    # Test cost estimation
    print("💰 Cost Estimates for Caption Generation\n")
    print("=" * 50)

    for model_key in ["gemini-flash-lite", "gpt-4o-mini", "llama-405b"]:
        costs = estimate_caption_cost(1000, model=model_key)
        print(f"\n{model_key.upper()}:")
        print(f"  1,000 captions: ${costs['total_cost']:.4f}")
        print(f"  Per caption: ${costs['cost_per_caption']:.6f}")
        print(f"  Description: {MODELS[model_key]['description']}")

    print("\n" + "=" * 50)
    print(f"\n🏆 RECOMMENDED: {MODELS[DEFAULT_MODEL]['id']}")
    print(f"   Only ${estimate_caption_cost(1, DEFAULT_MODEL)['total_cost']:.6f} per caption!")
