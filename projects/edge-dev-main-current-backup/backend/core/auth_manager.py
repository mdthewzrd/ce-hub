# Authentication and Authorization
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets

class AuthManager:
    """Authentication and authorization manager"""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.security = HTTPBearer()
        self.session_timeout = 1800  # 30 minutes

        # In-memory user store (replace with database in production)
        self.users = {}
        self.sessions = {}

    def hash_password(self, password: str) -> str:
        """Hash password with bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def generate_token(self, user_id: str, permissions: List[str] = None) -> str:
        """Generate JWT token"""
        payload = {
            "user_id": user_id,
            "permissions": permissions or ["read"],
            "exp": datetime.now(timezone.utc) + timedelta(seconds=self.session_timeout),
            "iat": datetime.now(timezone.utc),
            "jti": secrets.token_urlsafe(32)
        }

        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    def check_permission(self, user_permissions: List[str], required: str) -> bool:
        """Check if user has required permission"""
        permission_hierarchy = {
            "read": 0,
            "write": 1,
            "admin": 2
        }

        user_level = max([permission_hierarchy.get(p, 0) for p in user_permissions])
        required_level = permission_hierarchy.get(required, 999)

        return user_level >= required_level

    async def get_current_user(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
    ) -> Dict[str, Any]:
        """Get current authenticated user"""
        token = credentials.credentials
        payload = self.verify_token(token)

        # Check if session is still valid
        session_id = payload.get("jti")
        if session_id and session_id not in self.sessions:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session revoked"
            )

        return payload

    async def require_permission(self, permission: str):
        """Decorator to require specific permission"""
        async def permission_dependency(
            current_user: Dict[str, Any] = Depends(self.get_current_user)
        ):
            user_permissions = current_user.get("permissions", [])
            if not self.check_permission(user_permissions, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            return current_user

        return permission_dependency

# Initialize auth manager
auth_manager = AuthManager(secrets.token_urlsafe(64))

# Permission decorators
require_read = auth_manager.require_permission("read")
require_write = auth_manager.require_permission("write")
require_admin = auth_manager.require_permission("admin")
