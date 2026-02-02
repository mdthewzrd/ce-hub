"""
RENATA Chat API Endpoint

Provides conversational AI capabilities for discussing trading strategies,
code design, and architecture decisions.
"""

import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import HTTPException, APIRouter
from pydantic import BaseModel
import requests

# Create router
router = APIRouter(prefix="/api/renata_chat", tags=["renata-chat"])

# Setup logger
logger = logging.getLogger(__name__)

# OpenRouter API configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Chat model (use a conversational model, not code-specialized)
CHAT_MODEL = "qwen/qwen-2.5-72b-instruct"  # Good for chat and reasoning
# Alternative models:
# CHAT_MODEL = "anthropic/claude-3-haiku"
# CHAT_MODEL = "openai/gpt-4o-mini"
# CHAT_MODEL = "meta-llama/llama-3.1-8b-instruct"


class ChatMessage(BaseModel):
    """Chat message model"""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request model for chat"""
    messages: List[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 1000


class ChatResponse(BaseModel):
    """Response model for chat"""
    success: bool
    message: str
    error: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    Handle conversational AI chat for discussing trading strategies

    Args:
        request: Chat request with message history

    Returns:
        ChatResponse with AI response
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API key not configured"
        )

    try:
        # Build messages array with system prompt
        system_prompt = """You are Renata, an expert trading system architect and AI assistant specializing in the EdgeDev platform.

Your expertise includes:
- Trading strategy design and optimization
- Python code architecture for scanners
- EdgeDev v31 5-stage architecture
- Market data analysis and pattern detection
- Backtesting and validation

You help users:
1. Design trading strategies from scratch
2. Think through code architecture decisions
3. Optimize scanner performance
4. Debug and improve existing code
5. Transform code to EdgeDev v31 standard when requested

When users want to transform code, tell them to upload a .py file or paste the code and you'll use the transformation system.

Be helpful, technical, and conversational. Keep responses focused on trading systems and code."""

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        # Add conversation history
        for msg in request.messages:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://cehub.dev",
            "X-Title": "CE-Hub Renata Chat"
        }

        payload = {
            "model": CHAT_MODEL,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens
        }

        logger.info(f"📨 Sending chat request to OpenRouter...")
        logger.debug(f"Model: {CHAT_MODEL}")
        logger.debug(f"Messages count: {len(messages)}")

        response = requests.post(
            OPENROUTER_BASE_URL,
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            logger.error(f"OpenRouter error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"AI provider error: {response.text}"
            )

        data = response.json()

        # Extract assistant's response
        assistant_message = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        if not assistant_message:
            raise HTTPException(
                status_code=500,
                detail="No response from AI model"
            )

        logger.info(f"✅ Chat response received: {len(assistant_message)} characters")

        return ChatResponse(
            success=True,
            message=assistant_message
        )

    except requests.exceptions.Timeout:
        logger.error("AI request timed out")
        raise HTTPException(
            status_code=504,
            detail="AI request timed out. Please try again."
        )
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "available": bool(OPENROUTER_API_KEY),
        "model": CHAT_MODEL,
        "version": "1.0.0"
    }
