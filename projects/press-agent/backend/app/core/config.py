"""
Press Agent Configuration
Centralized configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    APP_NAME: str = "Press Agent API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database (Supabase PostgreSQL)
    DATABASE_URL: str

    # OpenRouter API
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Archon MCP
    ARCHON_MCP_URL: str = "http://localhost:8051"
    ARCHON_MCP_ENABLED: bool = True

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # LLM Model Configuration
    MODEL_ONBOARDING: str = "deepseek/deepseek-chat:free"
    MODEL_WRITER: str = "anthropic/claude-3.5-sonnet"
    MODEL_EDITOR: str = "openai/gpt-4o-mini"
    MODEL_QA: str = "openai/gpt-4o-mini"

    # Cost Tracking (per 1K tokens)
    COST_ONBOARDING: float = 0.0
    COST_WRITER: float = 0.003
    COST_EDITOR: float = 0.00015
    COST_QA: float = 0.00015

    # Quality Thresholds
    MIN_QUALITY_SCORE: float = 85.0
    MAX_PLAGIARISM_SCORE: float = 5.0
    MAX_AI_DETECTION_SCORE: float = 15.0

    # Workflow Timeouts (seconds)
    WORKFLOW_TIMEOUT: int = 3600  # 1 hour
    AGENT_TIMEOUT: int = 300  # 5 minutes

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Creates settings from environment variables on first call.
    """
    return Settings()


# Global settings instance
settings = get_settings()
