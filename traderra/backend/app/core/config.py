"""
Traderra Backend Configuration

Environment configuration for the FastAPI backend with Archon MCP integration.
"""

import os
from typing import Optional, List
from pydantic import BaseSettings, Field


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

    class Config:
        env_file = ".env"
        case_sensitive = False


# Singleton settings instance
settings = Settings()