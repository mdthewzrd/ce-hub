# Performance Caching Middleware
import json
import hashlib
import time
import asyncio
from typing import Dict, Any, Optional
from functools import wraps
import redis.asyncio as redis

class PerformanceCache:
    """High-performance caching system"""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.memory_cache = {}
        self.memory_cache_max_size = 1000
        self.cache_stats = {
            "hits": 0,
            "misses": 0,
            "redis_hits": 0,
            "memory_hits": 0
        }

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        # Try memory cache first
        if key in self.memory_cache:
            self.cache_stats["hits"] += 1
            self.cache_stats["memory_hits"] += 1
            return self.memory_cache[key]["data"]

        # Try Redis cache
        try:
            redis_client = redis.from_url(self.redis_url)
            cached_data = await redis_client.get(key)

            if cached_data:
                data = json.loads(cached_data)
                self.cache_stats["hits"] += 1
                self.cache_stats["redis_hits"] += 1

                # Store in memory cache
                self._store_in_memory(key, data)
                return data
        except Exception:
            pass

        self.cache_stats["misses"] += 1
        return None

    async def set(
        self,
        key: str,
        data: Any,
        ttl: int = 3600,
        use_memory: bool = True
    ):
        """Set value in cache"""
        # Store in Redis
        try:
            redis_client = redis.from_url(self.redis_url)
            serialized_data = json.dumps(data, default=str)
            await redis_client.setex(key, ttl, serialized_data)
        except Exception:
            pass

        # Store in memory if requested
        if use_memory:
            self._store_in_memory(key, data, ttl)

    def _store_in_memory(self, key: str, data: Any, ttl: int = 3600):
        """Store in memory cache"""
        # Remove oldest item if cache is full
        if len(self.memory_cache) >= self.memory_cache_max_size:
            oldest_key = min(self.memory_cache.keys(),
                           key=lambda k: self.memory_cache[k]["timestamp"])
            del self.memory_cache[oldest_key]

        self.memory_cache[key] = {
            "data": data,
            "timestamp": time.time(),
            "ttl": ttl
        }

    def get_cache_key(self, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = {
            "args": args,
            "kwargs": sorted(kwargs.items())
        }
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.sha256(key_string.encode()).hexdigest()[:32]

    def cache(self, ttl: int = 3600, use_memory: bool = True):
        """Cache decorator"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self.get_cache_key(func.__name__, *args, **kwargs)

                # Try to get from cache
                cached_result = await self.get(cache_key)
                if cached_result is not None:
                    return cached_result

                # Execute function
                result = await func(*args, **kwargs)

                # Cache result
                await self.set(cache_key, result, ttl, use_memory)

                return result
            return wrapper
        return decorator

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
        hit_rate = (self.cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0

        return {
            "hit_rate_percent": round(hit_rate, 2),
            "total_requests": total_requests,
            "cache_size": len(self.memory_cache),
            **self.cache_stats
        }

# Initialize cache
cache = PerformanceCache()
