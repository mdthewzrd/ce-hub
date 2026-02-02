#!/usr/bin/env python3
"""
Simplified Traderra Backend for Demo
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any
import json

app = FastAPI(
    title="Traderra API",
    description="Simplified Traderra Trading Platform API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:6565", "http://127.0.0.1:6565"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
mock_metrics = {
    "totalPnL": 2847.50,
    "winRate": 0.524,
    "expectancy": 0.82,
    "profitFactor": 1.47,
    "maxDrawdown": -0.15,
    "totalTrades": 67,
    "avgWinner": 180.25,
    "avgLoser": -95.50
}

mock_ai_models = {
    "default_provider": "openai",
    "default_model": "gpt-4",
    "providers": {
        "openai": {
            "name": "OpenAI",
            "available": True,
            "models": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
        },
        "anthropic": {
            "name": "Anthropic",
            "available": False,
            "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
        },
        "google": {
            "name": "Google",
            "available": False,
            "models": ["gemini-pro", "gemini-pro-vision"]
        }
    },
    "available_models": [
        {"provider": "openai", "model": "gpt-4", "display_name": "GPT-4", "available": True},
        {"provider": "openai", "model": "gpt-4-turbo", "display_name": "GPT-4 Turbo", "available": True},
        {"provider": "openai", "model": "gpt-3.5-turbo", "display_name": "GPT-3.5 Turbo", "available": True},
        {"provider": "anthropic", "model": "claude-3-opus", "display_name": "Claude 3 Opus", "available": False},
        {"provider": "anthropic", "model": "claude-3-sonnet", "display_name": "Claude 3 Sonnet", "available": False},
        {"provider": "google", "model": "gemini-pro", "display_name": "Gemini Pro", "available": False},
    ]
}

@app.get("/")
async def root():
    return {"message": "Traderra API is running", "status": "ok"}

@app.get("/ping")
async def ping():
    return {"status": "ok", "message": "pong"}

# AI endpoints
@app.get("/api/ai/status")
async def get_ai_status():
    return {
        "connected": True,
        "health": "good",
        "project_id": "demo_project"
    }

@app.get("/api/ai/models")
async def get_ai_models():
    return mock_ai_models

@app.post("/api/ai/models/select")
async def select_ai_model(request: Dict[str, Any]):
    provider = request.get("provider", "openai")
    model = request.get("model", "gpt-4")

    # Find the model in our mock data
    for model_info in mock_ai_models["available_models"]:
        if model_info["provider"] == provider and model_info["model"] == model:
            return {
                "success": True,
                "display_name": model_info["display_name"],
                "provider": provider,
                "model": model
            }

    return {
        "success": False,
        "error": "Model not found"
    }

# Trading endpoints
@app.get("/api/metrics")
async def get_metrics():
    return mock_metrics

@app.post("/api/renata/analyze")
async def renata_analyze(request: Dict[str, Any]):
    mode = request.get("mode", "coach")
    return {
        "response": f"Analysis in {mode} mode: Your trading performance shows consistent improvement.",
        "insights": ["Risk management is improving", "Entry timing could be refined"],
        "recommendations": ["Consider reducing position size", "Focus on high-probability setups"]
    }

# Health check endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "traderra-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6500, reload=True)