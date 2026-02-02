# Advanced Rate Limiting
import time
import asyncio
from typing import Dict, Optional
from collections import defaultdict, deque
from fastapi import HTTPException, status
import redis.asyncio as redis

class RateLimiter:
    """Advanced rate limiting with Redis backend"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.requests = defaultdict(lambda: deque())
        self.cleanup_interval = 3600  # 1 hour

    async def is_allowed(
        self,
        identifier: str,
        limit: int = 1000,
        window: int = 3600
    ) -> bool:
        """Check if request is allowed"""
        try:
            # Try Redis first
            redis_client = redis.from_url(self.redis_url)
            key = f"rate_limit:{identifier}"

            # Use sliding window counter
            current_time = int(time.time())
            window_start = current_time - window

            # Remove old requests
            await redis_client.zremrangebyscore(key, 0, window_start)

            # Count current requests
            current_requests = await redis_client.zcard(key)

            if current_requests >= limit:
                return False

            # Add current request
            await redis_client.zadd(key, {str(current_time): current_time})
            await redis_client.expire(key, window)

            return True

        except Exception:
            # Fallback to in-memory rate limiting
            return self._memory_rate_limit(identifier, limit, window)

    def _memory_rate_limit(self, identifier: str, limit: int, window: int) -> bool:
        """In-memory rate limiting fallback"""
        current_time = time.time()
        requests = self.requests[identifier]

        # Remove old requests
        while requests and requests[0] <= current_time - window:
            requests.popleft()

        # Check limit
        if len(requests) >= limit:
            return False

        # Add current request
        requests.append(current_time)
        return True

class APIRateLimitMiddleware:
    """API rate limiting middleware"""

    def __init__(self):
        self.rate_limiter = RateLimiter()
        self.limits = {
            "scan": {"limit": 10, "window": 300},      # 10 scans per 5 minutes
            "upload": {"limit": 20, "window": 3600},    # 20 uploads per hour
            "api": {"limit": 1000, "window": 3600}      # 1000 requests per hour
        }

    async def check_rate_limit(
        self,
        endpoint: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> bool:
        """Check rate limit for endpoint"""
        identifier = user_id or ip_address or "anonymous"

        if endpoint in self.limits:
            config = self.limits[endpoint]
            return await self.rate_limiter.is_allowed(
                f"{endpoint}:{identifier}",
                config["limit"],
                config["window"]
            )

        # Default rate limiting
        return await self.rate_limiter.is_allowed(
            f"api:{identifier}",
            1000,
            3600
        )

# Initialize rate limiter
rate_limiter = APIRateLimitMiddleware()
