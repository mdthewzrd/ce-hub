# Backend Input Validation
import re
import json
import hashlib
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, validator
from fastapi import HTTPException, status

class SecurityValidator:
    """Comprehensive input validation for security"""

    DANGEROUS_PATTERNS = [
        r'eval\s*\(',
        r'exec\s*\(',
        r'system\s*\(',
        r'subprocess\.',
        r'os\.system',
        r'__import__',
        r'open\s*\(',
        r'file\s*\(',
        r'read\s*\(',
        r'write\s*\('
    ]

    @classmethod
    def validate_scanner_code(cls, code: str) -> Dict[str, Any]:
        """Validate scanner code for security threats"""
        errors = []

        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, code, re.IGNORECASE):
                errors.append(f"Dangerous pattern detected: {pattern}")

        # Check code size
        if len(code) > 1024 * 1024:  # 1MB limit
            errors.append("Code too large (max 1MB)")

        # Check for basic Python syntax
        try:
            compile(code, '<string>', 'exec')
        except SyntaxError as e:
            errors.append(f"Syntax error: {str(e)}")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "hash": hashlib.sha256(code.encode()).hexdigest()
        }

    @classmethod
    def sanitize_input(cls, data: str) -> str:
        """Sanitize string input"""
        # Remove potential XSS characters
        dangerous = ['<', '>', '&', '"', "'", 'javascript:', 'data:']
        sanitized = data

        for char in dangerous:
            sanitized = sanitized.replace(char, '')

        return sanitized.strip()

    @classmethod
    def validate_api_key(cls, api_key: str) -> bool:
        """Validate API key format"""
        if not api_key:
            return False

        # OpenRouter API key pattern
        pattern = r'^sk-or-v1-[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, api_key))

class SecureScanRequest(BaseModel):
    """Secure scan request model"""
    scanner_code: str

    @validator('scanner_code')
    def validate_code(cls, v):
        validation = SecurityValidator.validate_scanner_code(v)
        if not validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid scanner code: {', '.join(validation['errors'])}"
            )
        return v
