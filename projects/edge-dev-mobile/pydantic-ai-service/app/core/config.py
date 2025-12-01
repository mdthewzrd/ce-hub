"""
Configuration settings for the Trading Agent Service
"""

from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""

    # API Keys
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: str = Field("", env="ANTHROPIC_API_KEY")

    # Server Configuration
    HOST: str = Field("0.0.0.0", env="HOST")
    PORT: int = Field(8001, env="PORT")
    DEBUG: bool = Field(True, env="DEBUG")

    # Database
    DATABASE_URL: str = Field("sqlite:///./trading_agent.db", env="DATABASE_URL")

    # CORS
    CORS_ORIGINS: List[str] = Field(
        ["http://localhost:3000", "http://localhost:3001"],
        env="CORS_ORIGINS"
    )

    # Edge.dev Integration
    EDGE_DEV_API_URL: str = Field("http://localhost:8000", env="EDGE_DEV_API_URL")
    EDGE_DEV_API_KEY: str = Field("", env="EDGE_DEV_API_KEY")

    # PydanticAI Configuration
    AGENT_MODEL: str = Field("gpt-4", env="AGENT_MODEL")
    AGENT_TEMPERATURE: float = Field(0.7, env="AGENT_TEMPERATURE")
    MAX_TOKENS: int = Field(2048, env="MAX_TOKENS")

    # Logging
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")
    LOG_FILE: str = Field("logs/trading_agent.log", env="LOG_FILE")

    # Security
    SECRET_KEY: str = Field("your-secret-key-here", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Trading Configuration
    DEFAULT_TIMEFRAME: str = Field("1D", env="DEFAULT_TIMEFRAME")
    MAX_SCAN_RESULTS: int = Field(1000, env="MAX_SCAN_RESULTS")
    DEFAULT_VOLUME_THRESHOLD: float = Field(1000000.0, env="DEFAULT_VOLUME_THRESHOLD")

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create logs directory if it doesn't exist
        log_dir = os.path.dirname(self.LOG_FILE)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)


# Global settings instance
settings = Settings()