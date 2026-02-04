"""
Authentication and Authorization Module
JWT-based user authentication with role-based access control
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path
import jwt
from passlib.context import CryptContext
from config import (
    USERS_DIR, SECRET_KEY, ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserManager:
    """Manages user accounts and authentication"""

    def __init__(self):
        self.users_dir = USERS_DIR
        self.users_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_file(self, username: str) -> Path:
        """Get user file path"""
        return self.users_dir / f"{username}.json"

    def _hash_password(self, password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        return pwd_context.verify(plain_password, hashed_password)

    def create_user(
        self,
        username: str,
        password: str,
        email: str = "",
        admin: bool = False
    ) -> Dict[str, Any]:
        """Create new user"""

        # Check if user exists
        user_file = self._get_user_file(username)
        if user_file.exists():
            raise ValueError(f"User '{username}' already exists")

        # Validate username
        if not username or len(username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not username.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain alphanumeric characters, hyphens, and underscores")

        # Validate password
        if not password or len(password) < 6:
            raise ValueError("Password must be at least 6 characters")

        # Create user data
        user_data = {
            "username": username,
            "email": email,
            "hashed_password": self._hash_password(password),
            "is_admin": admin,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "last_login": None,
            "instance_quota": 2 if admin else 2,
            "settings": {
                "theme": "dark",
                "terminal_font_size": 14,
                "auto_save": True
            }
        }

        # Save user
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=2)

        # Create user workspace
        from config import WORKSPACE_DIR
        user_workspace = WORKSPACE_DIR / username
        user_workspace.mkdir(parents=True, exist_ok=True)

        return {
            "username": username,
            "email": email,
            "is_admin": admin,
            "instance_quota": user_data["instance_quota"]
        }

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user"""

        user_file = self._get_user_file(username)
        if not user_file.exists():
            return None

        with open(user_file, 'r') as f:
            user_data = json.load(f)

        if not user_data.get("is_active", True):
            return None

        if not self._verify_password(password, user_data["hashed_password"]):
            return None

        # Update last login
        user_data["last_login"] = datetime.utcnow().isoformat()
        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=2)

        return {
            "username": user_data["username"],
            "email": user_data.get("email", ""),
            "is_admin": user_data.get("is_admin", False),
            "is_active": user_data.get("is_active", True),
            "instance_quota": user_data.get("instance_quota", 2),
            "settings": user_data.get("settings", {})
        }

    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        user_file = self._get_user_file(username)
        if not user_file.exists():
            return None

        with open(user_file, 'r') as f:
            user_data = json.load(f)

        return {
            "username": user_data["username"],
            "email": user_data.get("email", ""),
            "is_admin": user_data.get("is_admin", False),
            "is_active": user_data.get("is_active", True),
            "created_at": user_data.get("created_at"),
            "last_login": user_data.get("last_login"),
            "instance_quota": user_data.get("instance_quota", 2),
            "settings": user_data.get("settings", {})
        }

    def update_user(self, username: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user"""
        user_file = self._get_user_file(username)
        if not user_file.exists():
            return None

        with open(user_file, 'r') as f:
            user_data = json.load(f)

        # Update allowed fields
        allowed_fields = ["email", "is_active", "instance_quota", "settings"]
        for field, value in updates.items():
            if field in allowed_fields:
                user_data[field] = value

        with open(user_file, 'w') as f:
            json.dump(user_data, f, indent=2)

        return self.get_user(username)

    def list_users(self) -> list:
        """List all users"""
        users = []
        for user_file in self.users_dir.glob("*.json"):
            with open(user_file, 'r') as f:
                user_data = json.load(f)
                users.append({
                    "username": user_data["username"],
                    "email": user_data.get("email", ""),
                    "is_admin": user_data.get("is_admin", False),
                    "is_active": user_data.get("is_active", True),
                    "created_at": user_data.get("created_at")
                })
        return users

    def delete_user(self, username: str) -> bool:
        """Delete user"""
        user_file = self._get_user_file(username)
        if not user_file.exists():
            return False

        user_file.unlink()
        return True


class TokenManager:
    """Manages JWT tokens"""

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow()
        })

        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None


# Helper functions
def create_user(username: str, password: str, email: str = "", admin: bool = False):
    """Helper function to create a user"""
    manager = UserManager()
    return manager.create_user(username, password, email, admin)


def authenticate(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Helper function to authenticate"""
    manager = UserManager()
    return manager.authenticate_user(username, password)


def create_token(username: str, is_admin: bool = False) -> str:
    """Helper function to create token"""
    data = {
        "sub": username,
        "admin": is_admin
    }
    return TokenManager.create_access_token(data)


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Helper function to verify token"""
    return TokenManager.verify_token(token)
