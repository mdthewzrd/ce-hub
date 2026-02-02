"""
EdgeDev Platform Integration

API client and utilities for connecting to the EdgeDev platform.
"""

__version__ = "0.1.0"

from .client import EdgeDevClient, ExecutionResult, get_edgedev_client

__all__ = [
    "EdgeDevClient",
    "ExecutionResult",
    "get_edgedev_client",
]
