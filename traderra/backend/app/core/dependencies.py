"""
FastAPI Dependencies for Traderra

Provides dependency injection for Archon client, database connections,
authentication, and other core services.
"""

from typing import Optional, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .archon_client import ArchonClient, ArchonConfig, get_archon_client
from .database import get_async_session, get_database_connection


# Authentication
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Validate JWT token and extract user information

    This will be implemented with Clerk JWT validation
    """
    try:
        # TODO: Implement Clerk JWT validation
        # For now, return mock user for development
        if settings.debug:
            return {
                "user_id": "dev_user_123",
                "email": "dev@traderra.com",
                "workspace_id": "dev_workspace_123"
            }

        # Clerk JWT validation logic will go here
        payload = jwt.decode(
            credentials.credentials,
            settings.clerk_secret_key,
            algorithms=["RS256"],
            issuer=settings.clerk_jwt_issuer
        )

        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "workspace_id": payload.get("workspace_id")
        }

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_workspace_id(
    current_user: dict = Depends(get_current_user)
) -> str:
    """Extract workspace_id from current user"""
    workspace_id = current_user.get("workspace_id")
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No workspace associated with user"
        )
    return workspace_id


# Archon MCP Dependencies
async def get_archon() -> AsyncGenerator[ArchonClient, None]:
    """
    Dependency to provide Archon MCP client

    Usage:
        @app.get("/analyze")
        async def analyze_performance(
            archon: ArchonClient = Depends(get_archon)
        ):
            results = await archon.search_trading_knowledge("performance analysis")
            return results
    """
    archon_config = ArchonConfig(
        base_url=settings.archon_base_url,
        timeout=settings.archon_timeout,
        project_id=settings.archon_project_id
    )

    async with ArchonClient(archon_config) as client:
        yield client


# Database Dependencies
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to provide database session

    Usage:
        @app.get("/trades")
        async def get_trades(
            db: AsyncSession = Depends(get_db)
        ):
            # Database operations
            pass
    """
    async for session in get_async_session():
        yield session


# Combined Dependencies for AI Operations
class AIContext:
    """
    Combined context for AI operations including user, workspace, and Archon client

    This provides all necessary context for Renata AI operations following
    the CE-Hub Archon-First protocol.
    """

    def __init__(
        self,
        user: dict,
        workspace_id: str,
        archon: ArchonClient,
        db: AsyncSession
    ):
        self.user = user
        self.workspace_id = workspace_id
        self.archon = archon
        self.db = db

    @property
    def user_id(self) -> str:
        return self.user["user_id"]

    @property
    def user_email(self) -> str:
        return self.user["email"]


async def get_ai_context(
    user: dict = Depends(get_current_user),
    workspace_id: str = Depends(get_current_workspace_id),
    archon: ArchonClient = Depends(get_archon),
    db: AsyncSession = Depends(get_db)
) -> AIContext:
    """
    Dependency that provides complete AI context for Renata operations

    This combines user authentication, workspace context, Archon client,
    and database session for comprehensive AI operations.

    Usage:
        @app.post("/ai/analyze")
        async def ai_analyze_performance(
            ai_ctx: AIContext = Depends(get_ai_context)
        ):
            # Perform AI analysis with full context
            results = await renata_agent.analyze(ai_ctx)
            return results
    """
    return AIContext(
        user=user,
        workspace_id=workspace_id,
        archon=archon,
        db=db
    )


# Workspace-specific dependencies
async def verify_workspace_access(
    workspace_id: str,
    current_user: dict = Depends(get_current_user)
) -> bool:
    """
    Verify that the current user has access to the specified workspace

    This implements Row-Level Security (RLS) checks at the API level
    """
    user_workspace = current_user.get("workspace_id")

    if user_workspace != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to workspace"
        )

    return True