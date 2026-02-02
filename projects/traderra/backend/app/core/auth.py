"""
Simple Authentication Module for Traderra

Provides basic authentication functionality for the API endpoints.
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize HTTP Bearer token security
security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user from authorization token

    For now, this returns a mock user to allow the API to function.
    In production, this would validate JWT tokens and return real user data.

    Args:
        credentials: HTTP Bearer token credentials

    Returns:
        User information dictionary
    """

    # For development/testing, return a mock user
    # In production, you would validate the token and fetch user data
    mock_user = {
        "id": "user-1",
        "email": "dev@traderra.com",
        "name": "Development User",
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    }

    return mock_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Get current user but don't require authentication

    Returns:
        User information if authenticated, None otherwise
    """
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def require_auth(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency that requires valid authentication

    Args:
        user: User data from get_current_user

    Returns:
        Validated user data

    Raises:
        HTTPException: If user is not authenticated or inactive
    """
    if not user or not user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user