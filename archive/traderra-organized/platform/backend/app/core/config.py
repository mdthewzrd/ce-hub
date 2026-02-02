"""
Traderra Backend Configuration

Environment configuration for the FastAPI backend with Archon MCP integration.
"""

import os
from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application
    app_name: str = "Traderra API"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False, env="DEBUG")

    # Database
    database_url: str = Field(env="DATABASE_URL")
    database_host: str = Field(default="localhost", env="DATABASE_HOST")
    database_port: int = Field(default=5432, env="DATABASE_PORT")
    database_name: str = Field(default="traderra", env="DATABASE_NAME")
    database_user: str = Field(default="traderra", env="DATABASE_USER")
    database_password: str = Field(default="", env="DATABASE_PASSWORD")
    database_ssl: str = Field(default="prefer", env="DATABASE_SSL")
    database_pool_min_size: int = Field(default=5, env="DATABASE_POOL_MIN_SIZE")
    database_pool_max_size: int = Field(default=20, env="DATABASE_POOL_MAX_SIZE")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")

    # Archon MCP Configuration
    archon_base_url: str = Field(default="http://localhost:8051", env="ARCHON_BASE_URL")
    archon_timeout: int = Field(default=30, env="ARCHON_TIMEOUT")
    archon_project_id: str = Field(
        default="7816e33d-2c75-41ab-b232-c40e3ffc2c19",
        env="ARCHON_PROJECT_ID"
    )

    # Authentication (Clerk)
    clerk_secret_key: str = Field(env="CLERK_SECRET_KEY")
    clerk_jwt_issuer: str = Field(env="CLERK_JWT_ISSUER")

    # AI Configuration
    openai_api_key: str = Field(env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4", env="OPENAI_MODEL")

    # Multi-Model AI Configuration
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    google_api_key: Optional[str] = Field(default=None, env="GOOGLE_API_KEY")

    # Default AI provider and model
    default_ai_provider: str = Field(default="openai", env="DEFAULT_AI_PROVIDER")
    default_ai_model: str = Field(default="gpt-4", env="DEFAULT_AI_MODEL")

    # Available AI models configuration
    available_ai_providers: List[str] = Field(
        default=["openai", "anthropic", "google"],
        env="AVAILABLE_AI_PROVIDERS"
    )

    # Model capability mapping
    openai_models: List[str] = Field(
        default=["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        env="OPENAI_MODELS"
    )
    anthropic_models: List[str] = Field(
        default=["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"],
        env="ANTHROPIC_MODELS"
    )
    google_models: List[str] = Field(
        default=["gemini-pro", "gemini-pro-vision"],
        env="GOOGLE_MODELS"
    )

    # External APIs
    polygon_api_key: Optional[str] = Field(default=None, env="POLYGON_API_KEY")

    # CORS
    allowed_origins: List[str] = Field(
        default=["http://localhost:6565", "http://localhost:3000"],
        env="ALLOWED_ORIGINS"
    )

    # File Storage
    storage_provider: str = Field(default="local", env="STORAGE_PROVIDER")  # local, s3, r2
    s3_bucket: Optional[str] = Field(default=None, env="S3_BUCKET")
    s3_region: Optional[str] = Field(default=None, env="S3_REGION")

    # Additional fields from .env
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    secret_key: str = Field(env="SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    mock_auth: bool = Field(default=True, env="MOCK_AUTH")
    enable_debug_endpoints: bool = Field(default=True, env="ENABLE_DEBUG_ENDPOINTS")

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "env_file_encoding": "utf-8",
        "extra": "allow"
    }


class AIModelConfig:
    """Utility class for AI model configuration and management"""

    @staticmethod
    def get_available_models() -> dict:
        """Get all available AI models organized by provider"""
        return {
            "openai": {
                "name": "OpenAI",
                "models": settings.openai_models,
                "available": bool(settings.openai_api_key)
            },
            "anthropic": {
                "name": "Anthropic",
                "models": settings.anthropic_models,
                "available": bool(settings.anthropic_api_key)
            },
            "google": {
                "name": "Google",
                "models": settings.google_models,
                "available": bool(settings.google_api_key)
            }
        }

    @staticmethod
    def get_model_display_name(provider: str, model: str) -> str:
        """Get user-friendly display name for a model"""
        display_names = {
            "gpt-4": "GPT-4",
            "gpt-4-turbo": "GPT-4 Turbo",
            "gpt-3.5-turbo": "GPT-3.5 Turbo",
            "claude-3-opus-20240229": "Claude 3 Opus",
            "claude-3-sonnet-20240229": "Claude 3 Sonnet",
            "claude-3-haiku-20240307": "Claude 3 Haiku",
            "gemini-pro": "Gemini Pro",
            "gemini-pro-vision": "Gemini Pro Vision"
        }
        return display_names.get(model, model)

    @staticmethod
    def validate_model_config(provider: str, model: str) -> bool:
        """Validate if a provider/model combination is available"""
        available_models = AIModelConfig.get_available_models()

        if provider not in available_models:
            return False

        provider_config = available_models[provider]
        return provider_config["available"] and model in provider_config["models"]

    @staticmethod
    def get_default_model() -> tuple[str, str]:
        """Get the default provider and model"""
        return settings.default_ai_provider, settings.default_ai_model


# Singleton settings instance
settings = Settings()