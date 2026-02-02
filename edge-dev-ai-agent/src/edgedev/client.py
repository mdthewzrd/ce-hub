"""
EdgeDev Platform Client

Connects to the EdgeDev platform backend API for executing
scanners and retrieving results.
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

import httpx
from dotenv import load_dotenv


@dataclass
class ExecutionResult:
    """Result from EdgeDev execution."""
    success: bool
    signals: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    execution_time: float
    error: Optional[str] = None
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()


class EdgeDevClient:
    """Client for EdgeDev platform API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        dashboard_url: Optional[str] = None,
        timeout: float = 30.0
    ):
        """Initialize EdgeDev client.

        Args:
            base_url: Backend API URL (from env or default)
            dashboard_url: Dashboard URL (from env or default)
            timeout: Request timeout in seconds
        """
        load_dotenv()

        self.base_url = base_url or os.getenv("EDGEDEV_BACKEND_URL", "http://localhost:5666")
        self.dashboard_url = dashboard_url or os.getenv("EDGEDEV_DASHBOARD_URL", "http://localhost:5665")
        self.timeout = timeout

        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
        )

    async def health_check(self) -> Dict[str, Any]:
        """Check if EdgeDev backend is running.

        Returns:
            Health check response
        """
        try:
            response = await self.client.get("/health")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "backend_url": self.base_url
            }

    async def execute_scanner(
        self,
        scanner_code: str,
        tickers: List[str],
        start_date: str,
        end_date: str,
        params: Optional[Dict[str, Any]] = None
    ) -> ExecutionResult:
        """Execute a scanner on EdgeDev backend.

        Args:
            scanner_code: Python code for the scanner
            tickers: List of ticker symbols
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            params: Optional scanner parameters

        Returns:
            ExecutionResult with signals and metrics
        """
        import time
        start_time = time.time()

        try:
            # Prepare execution request
            payload = {
                "code": scanner_code,
                "tickers": tickers,
                "start_date": start_date,
                "end_date": end_date,
                "params": params or {},
            }

            # Send execution request
            response = await self.client.post(
                "/api/scan/execute",
                json=payload
            )
            response.raise_for_status()

            data = response.json()

            execution_time = time.time() - start_time

            return ExecutionResult(
                success=True,
                signals=data.get("signals", []),
                metrics=data.get("metrics", {}),
                execution_time=execution_time,
                timestamp=datetime.now().isoformat(),
            )

        except httpx.HTTPStatusError as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                signals=[],
                metrics={},
                execution_time=execution_time,
                error=f"HTTP {e.response.status_code}: {e.response.text}",
            )

        except Exception as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                success=False,
                signals=[],
                metrics={},
                execution_time=execution_time,
                error=str(e),
            )

    async def upload_scanner(
        self,
        scanner_name: str,
        scanner_code: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Upload a scanner to EdgeDev.

        Args:
            scanner_name: Name for the scanner
            scanner_code: Python code
            description: Optional description

        Returns:
            Upload response
        """
        try:
            payload = {
                "name": scanner_name,
                "code": scanner_code,
                "description": description or "",
            }

            response = await self.client.post(
                "/api/scanner/upload",
                json=payload
            )
            response.raise_for_status()

            return response.json()

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_available_scanners(self) -> List[Dict[str, Any]]:
        """Get list of available scanners on EdgeDev.

        Returns:
            List of scanner info
        """
        try:
            response = await self.client.get("/api/scanner/list")
            response.raise_for_status()

            data = response.json()
            return data.get("scanners", [])

        except Exception as e:
            return []

    async def get_market_data(
        self,
        ticker: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """Get historical market data for a ticker.

        Args:
            ticker: Ticker symbol
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            Market data response
        """
        try:
            params = {
                "ticker": ticker,
                "start_date": start_date,
                "end_date": end_date,
            }

            response = await self.client.get(
                "/api/data/historical",
                params=params
            )
            response.raise_for_status()

            return response.json()

        except Exception as e:
            return {
                "error": str(e),
                "ticker": ticker
            }

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()


# Singleton instance
_default_client: Optional[EdgeDevClient] = None


def get_edgedev_client() -> EdgeDevClient:
    """Get or create default EdgeDev client."""
    global _default_client
    if _default_client is None:
        _default_client = EdgeDevClient()
    return _default_client
