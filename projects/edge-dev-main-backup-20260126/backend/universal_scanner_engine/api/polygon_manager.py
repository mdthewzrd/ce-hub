#!/usr/bin/env python3
"""
Intelligent Polygon API Manager
Advanced rate limiting, caching, and API management for your Polygon account
"""

import asyncio
import aiohttp
import time
import json
from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta, date
import pandas as pd
import logging
from collections import defaultdict, deque
import hashlib

logger = logging.getLogger(__name__)

# Your Polygon API Key (from the scanner files)
POLYGON_API_KEY = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"  # From LC D2 scanner
POLYGON_BASE_URL = "https://api.polygon.io"

@dataclass
class APIRequest:
    """Individual API request specification"""
    endpoint: str
    symbol: str
    start_date: str
    end_date: str
    adjusted: bool = True
    timespan: str = "day"
    multiplier: int = 1
    limit: int = 50000
    priority: int = 1  # Higher = more priority

@dataclass
class APIResponse:
    """Standardized API response"""
    success: bool
    symbol: str
    data: Optional[pd.DataFrame]
    raw_data: Dict
    cached: bool
    request_time: float
    api_calls_used: int
    error_message: Optional[str] = None

@dataclass
class RateLimitStatus:
    """Current rate limiting status"""
    requests_remaining: int
    requests_per_minute: int
    reset_time: datetime
    current_minute_count: int
    backoff_until: Optional[datetime] = None

class IntelligentCache:
    """
    Smart caching system for API responses with TTL and memory management
    """

    def __init__(self, max_size: int = 10000, default_ttl: int = 3600):
        self.cache = {}
        self.access_times = {}
        self.max_size = max_size
        self.default_ttl = default_ttl

    def _generate_key(self, request: APIRequest) -> str:
        """Generate cache key from request"""
        key_data = f"{request.symbol}_{request.start_date}_{request.end_date}_{request.adjusted}_{request.timespan}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, request: APIRequest) -> Optional[Dict]:
        """Get cached response if valid"""
        key = self._generate_key(request)

        if key in self.cache:
            entry = self.cache[key]
            # Check TTL
            if time.time() - entry['timestamp'] < entry['ttl']:
                self.access_times[key] = time.time()
                logger.debug(f"Cache HIT: {request.symbol}")
                return entry['data']
            else:
                # Expired
                del self.cache[key]
                if key in self.access_times:
                    del self.access_times[key]

        return None

    def set(self, request: APIRequest, data: Dict, ttl: Optional[int] = None) -> None:
        """Cache response with TTL"""
        key = self._generate_key(request)
        ttl = ttl or self.default_ttl

        # Memory management
        if len(self.cache) >= self.max_size:
            self._evict_oldest()

        self.cache[key] = {
            'data': data,
            'timestamp': time.time(),
            'ttl': ttl
        }
        self.access_times[key] = time.time()
        logger.debug(f"Cache SET: {request.symbol}")

    def _evict_oldest(self) -> None:
        """Evict oldest accessed entry"""
        if self.access_times:
            oldest_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
            del self.cache[oldest_key]
            del self.access_times[oldest_key]

class AdaptiveRateLimiter:
    """
    Adaptive rate limiting for Polygon API with intelligent backoff
    """

    def __init__(self, requests_per_minute: int = 5, burst_allowance: int = 2):
        self.requests_per_minute = requests_per_minute
        self.burst_allowance = burst_allowance
        self.request_history = deque()
        self.current_minute_count = 0
        self.last_reset = datetime.now()
        self.backoff_until = None
        self.consecutive_errors = 0

    async def wait_if_needed(self) -> None:
        """Wait if rate limiting is needed"""
        now = datetime.now()

        # Check if we need to wait for backoff
        if self.backoff_until and now < self.backoff_until:
            wait_time = (self.backoff_until - now).total_seconds()
            logger.info(f"⏳ Backoff wait: {wait_time:.1f} seconds")
            await asyncio.sleep(wait_time)
            self.backoff_until = None

        # Reset minute counter if needed
        if now - self.last_reset >= timedelta(minutes=1):
            self.current_minute_count = 0
            self.last_reset = now
            self.request_history.clear()

        # Check if we're at rate limit
        if self.current_minute_count >= self.requests_per_minute:
            wait_time = 60 - (now - self.last_reset).total_seconds()
            if wait_time > 0:
                logger.info(f"⏱️ Rate limit wait: {wait_time:.1f} seconds")
                await asyncio.sleep(wait_time)
                self.current_minute_count = 0
                self.last_reset = datetime.now()

    def record_request(self, success: bool) -> None:
        """Record request for rate limiting"""
        self.current_minute_count += 1
        self.request_history.append({
            'timestamp': datetime.now(),
            'success': success
        })

        # Adaptive backoff on errors
        if not success:
            self.consecutive_errors += 1
            if self.consecutive_errors >= 3:
                backoff_seconds = min(300, 30 * (2 ** (self.consecutive_errors - 3)))  # Exponential backoff
                self.backoff_until = datetime.now() + timedelta(seconds=backoff_seconds)
                logger.warning(f"🔴 Adaptive backoff: {backoff_seconds} seconds after {self.consecutive_errors} errors")
        else:
            self.consecutive_errors = 0

    def get_status(self) -> RateLimitStatus:
        """Get current rate limiting status"""
        return RateLimitStatus(
            requests_remaining=max(0, self.requests_per_minute - self.current_minute_count),
            requests_per_minute=self.requests_per_minute,
            reset_time=self.last_reset + timedelta(minutes=1),
            current_minute_count=self.current_minute_count,
            backoff_until=self.backoff_until
        )

class PolygonAPIManager:
    """
    Intelligent Polygon API Manager with caching, rate limiting, and optimization
    """

    def __init__(self, api_key: str = POLYGON_API_KEY, base_url: str = POLYGON_BASE_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.cache = IntelligentCache()
        self.rate_limiter = AdaptiveRateLimiter()
        self.session: Optional[aiohttp.ClientSession] = None
        self.total_requests = 0
        self.cache_hits = 0

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'Traderra-EdgeDev/1.0'}
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def fetch_daily_data(self, request: APIRequest) -> APIResponse:
        """
        Fetch daily OHLCV data for a symbol with intelligent caching and rate limiting
        """
        logger.debug(f"📊 Fetching data: {request.symbol} ({request.start_date} to {request.end_date})")

        # Check cache first
        cached_data = self.cache.get(request)
        if cached_data:
            self.cache_hits += 1
            return APIResponse(
                success=True,
                symbol=request.symbol,
                data=pd.DataFrame(cached_data.get('results', [])),
                raw_data=cached_data,
                cached=True,
                request_time=0.0,
                api_calls_used=0
            )

        # Rate limiting
        await self.rate_limiter.wait_if_needed()

        # Make API request
        start_time = time.time()
        try:
            url = f"{self.base_url}/v2/aggs/ticker/{request.symbol}/range/{request.multiplier}/{request.timespan}/{request.start_date}/{request.end_date}"

            params = {
                'apiKey': self.api_key,
                'adjusted': str(request.adjusted).lower(),
                'sort': 'asc',
                'limit': request.limit
            }

            logger.debug(f"🌐 API Request: {request.symbol}")

            async with self.session.get(url, params=params) as response:
                request_time = time.time() - start_time
                self.total_requests += 1

                if response.status == 200:
                    data = await response.json()

                    # Cache successful response
                    self.cache.set(request, data)

                    # Record successful request
                    self.rate_limiter.record_request(True)

                    # Convert to DataFrame
                    df = self._process_polygon_data(data.get('results', []))

                    return APIResponse(
                        success=True,
                        symbol=request.symbol,
                        data=df,
                        raw_data=data,
                        cached=False,
                        request_time=request_time,
                        api_calls_used=1
                    )

                elif response.status == 429:  # Rate limited
                    logger.warning(f"🔴 Rate limited for {request.symbol}")
                    self.rate_limiter.record_request(False)

                    # Retry with backoff
                    await asyncio.sleep(60)  # Wait 1 minute
                    return await self.fetch_daily_data(request)

                else:
                    error_msg = f"API error {response.status} for {request.symbol}"
                    logger.error(error_msg)
                    self.rate_limiter.record_request(False)

                    return APIResponse(
                        success=False,
                        symbol=request.symbol,
                        data=None,
                        raw_data={},
                        cached=False,
                        request_time=request_time,
                        api_calls_used=1,
                        error_message=error_msg
                    )

        except Exception as e:
            request_time = time.time() - start_time
            error_msg = f"Request failed for {request.symbol}: {str(e)}"
            logger.error(error_msg)
            self.rate_limiter.record_request(False)

            return APIResponse(
                success=False,
                symbol=request.symbol,
                data=None,
                raw_data={},
                cached=False,
                request_time=request_time,
                api_calls_used=0,
                error_message=error_msg
            )

    async def fetch_multiple_symbols(self, requests: List[APIRequest]) -> List[APIResponse]:
        """
        Fetch data for multiple symbols with intelligent batching and concurrency
        """
        logger.info(f"📈 Fetching data for {len(requests)} symbols")

        # Sort by priority
        sorted_requests = sorted(requests, key=lambda r: r.priority, reverse=True)

        responses = []

        # Process in batches to respect rate limits
        batch_size = min(5, self.rate_limiter.requests_per_minute)

        for i in range(0, len(sorted_requests), batch_size):
            batch = sorted_requests[i:i + batch_size]

            # Process batch concurrently
            batch_tasks = [self.fetch_daily_data(req) for req in batch]
            batch_responses = await asyncio.gather(*batch_tasks, return_exceptions=True)

            # Handle exceptions
            for j, response in enumerate(batch_responses):
                if isinstance(response, Exception):
                    logger.error(f"❌ Batch request failed: {batch[j].symbol} - {response}")
                    responses.append(APIResponse(
                        success=False,
                        symbol=batch[j].symbol,
                        data=None,
                        raw_data={},
                        cached=False,
                        request_time=0.0,
                        api_calls_used=0,
                        error_message=str(response)
                    ))
                else:
                    responses.append(response)

            # Brief pause between batches
            if i + batch_size < len(sorted_requests):
                await asyncio.sleep(1)

        logger.info(f"✅ Completed {len(responses)} requests (Cache hits: {self.cache_hits}/{self.total_requests})")
        return responses

    def _process_polygon_data(self, results: List[Dict]) -> pd.DataFrame:
        """Convert Polygon API results to standardized DataFrame"""
        if not results:
            return pd.DataFrame()

        df = pd.DataFrame(results)

        # Standardize column names
        column_mapping = {
            't': 'timestamp',
            'o': 'open',
            'h': 'high',
            'l': 'low',
            'c': 'close',
            'v': 'volume',
            'vw': 'volume_weighted_price',
            'n': 'transactions'
        }

        df.rename(columns=column_mapping, inplace=True)

        # Convert timestamp to datetime
        if 'timestamp' in df.columns:
            df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.date
            df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')

        # Sort by date
        if 'date' in df.columns:
            df.sort_values('date', inplace=True)
            df.reset_index(drop=True, inplace=True)

        return df

    async def fetch_grouped_daily(self, target_date: str, adjusted: bool = True) -> APIResponse:
        """
        Fetch grouped daily data for entire market on a specific date
        (Used by enterprise scanners like LC D2)
        """
        logger.info(f"🌐 Fetching grouped daily data for {target_date}")

        # Check cache
        cache_key = f"grouped_{target_date}_{adjusted}"
        cached_data = self.cache.cache.get(cache_key)
        if cached_data and time.time() - cached_data['timestamp'] < 1800:  # 30 min cache
            self.cache_hits += 1
            return APIResponse(
                success=True,
                symbol="GROUPED",
                data=pd.DataFrame(cached_data['data'].get('results', [])),
                raw_data=cached_data['data'],
                cached=True,
                request_time=0.0,
                api_calls_used=0
            )

        # Rate limiting
        await self.rate_limiter.wait_if_needed()

        try:
            url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{target_date}"
            params = {
                'apiKey': self.api_key,
                'adjusted': str(adjusted).lower()
            }

            start_time = time.time()

            async with self.session.get(url, params=params) as response:
                request_time = time.time() - start_time
                self.total_requests += 1

                if response.status == 200:
                    data = await response.json()

                    # Cache for 30 minutes
                    self.cache.cache[cache_key] = {
                        'data': data,
                        'timestamp': time.time(),
                        'ttl': 1800
                    }

                    self.rate_limiter.record_request(True)

                    # Process grouped data
                    df = self._process_grouped_data(data.get('results', []), target_date)

                    return APIResponse(
                        success=True,
                        symbol="GROUPED",
                        data=df,
                        raw_data=data,
                        cached=False,
                        request_time=request_time,
                        api_calls_used=1
                    )
                else:
                    error_msg = f"Grouped data API error {response.status} for {target_date}"
                    logger.error(error_msg)
                    self.rate_limiter.record_request(False)

                    return APIResponse(
                        success=False,
                        symbol="GROUPED",
                        data=None,
                        raw_data={},
                        cached=False,
                        request_time=request_time,
                        api_calls_used=1,
                        error_message=error_msg
                    )

        except Exception as e:
            error_msg = f"Grouped data request failed for {target_date}: {str(e)}"
            logger.error(error_msg)
            self.rate_limiter.record_request(False)

            return APIResponse(
                success=False,
                symbol="GROUPED",
                data=None,
                raw_data={},
                cached=False,
                request_time=0.0,
                api_calls_used=0,
                error_message=error_msg
            )

    def _process_grouped_data(self, results: List[Dict], target_date: str) -> pd.DataFrame:
        """Process grouped daily data"""
        if not results:
            return pd.DataFrame()

        df = pd.DataFrame(results)

        # Add date column
        df['date'] = target_date

        # Rename columns to match standard format
        column_mapping = {
            'T': 'ticker',
            'o': 'open',
            'h': 'high',
            'l': 'low',
            'c': 'close',
            'v': 'volume',
            'vw': 'volume_weighted_price',
            'n': 'transactions'
        }

        df.rename(columns=column_mapping, inplace=True)

        return df

    def get_performance_stats(self) -> Dict:
        """Get API performance statistics"""
        cache_hit_rate = (self.cache_hits / max(1, self.total_requests)) * 100

        return {
            'total_requests': self.total_requests,
            'cache_hits': self.cache_hits,
            'cache_hit_rate': f"{cache_hit_rate:.1f}%",
            'rate_limit_status': asdict(self.rate_limiter.get_status()),
            'cached_items': len(self.cache.cache)
        }


# Global API manager instance
polygon_manager = PolygonAPIManager()


async def get_daily_data(symbol: str, start_date: str, end_date: str, adjusted: bool = True) -> APIResponse:
    """
    Convenience function for getting daily data for a single symbol
    """
    request = APIRequest(
        endpoint="daily",
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        adjusted=adjusted
    )

    async with PolygonAPIManager() as manager:
        return await manager.fetch_daily_data(request)


async def get_multiple_daily_data(symbols: List[str], start_date: str, end_date: str, adjusted: bool = True) -> List[APIResponse]:
    """
    Convenience function for getting daily data for multiple symbols
    """
    requests = [
        APIRequest(
            endpoint="daily",
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            adjusted=adjusted
        )
        for symbol in symbols
    ]

    async with PolygonAPIManager() as manager:
        return await manager.fetch_multiple_symbols(requests)


async def get_grouped_daily_data(target_date: str, adjusted: bool = True) -> APIResponse:
    """
    Convenience function for getting grouped daily data (entire market)
    """
    async with PolygonAPIManager() as manager:
        return await manager.fetch_grouped_daily(target_date, adjusted)