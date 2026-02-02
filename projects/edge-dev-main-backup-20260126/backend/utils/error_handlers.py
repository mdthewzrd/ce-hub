"""
Comprehensive error handling for LC Scanner Backend
Provides structured error responses and monitoring
"""

import traceback
from datetime import datetime
from typing import Any, Dict, Optional, Union
import logging

from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from models.schemas import ErrorResponse

logger = logging.getLogger("scanner_app")


class ScannerError(Exception):
    """Base exception for scanner-specific errors"""

    def __init__(
        self,
        message: str,
        error_code: str = "SCANNER_ERROR",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)


class ScanExecutionError(ScannerError):
    """Error during scan execution"""

    def __init__(self, message: str, scan_id: str = None, **kwargs):
        super().__init__(
            message=message,
            error_code="SCAN_EXECUTION_ERROR",
            details={"scan_id": scan_id} if scan_id else {},
            **kwargs
        )


class DataFetchError(ScannerError):
    """Error fetching data from external APIs"""

    def __init__(self, message: str, api_endpoint: str = None, **kwargs):
        super().__init__(
            message=message,
            error_code="DATA_FETCH_ERROR",
            details={"api_endpoint": api_endpoint} if api_endpoint else {},
            **kwargs
        )


class ProcessingError(ScannerError):
    """Error during data processing"""

    def __init__(self, message: str, processing_stage: str = None, **kwargs):
        super().__init__(
            message=message,
            error_code="PROCESSING_ERROR",
            details={"processing_stage": processing_stage} if processing_stage else {},
            **kwargs
        )


class ValidationError(ScannerError):
    """Data validation error"""

    def __init__(self, message: str, field: str = None, **kwargs):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={"field": field} if field else {},
            status_code=400,
            **kwargs
        )


class RateLimitError(ScannerError):
    """API rate limit exceeded"""

    def __init__(self, message: str = "API rate limit exceeded", **kwargs):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            status_code=429,
            **kwargs
        )


class ResourceNotFoundError(ScannerError):
    """Resource not found error"""

    def __init__(self, message: str, resource_type: str = None, resource_id: str = None, **kwargs):
        super().__init__(
            message=message,
            error_code="RESOURCE_NOT_FOUND",
            details={
                "resource_type": resource_type,
                "resource_id": resource_id
            },
            status_code=404,
            **kwargs
        )


def create_error_response(
    error: Union[Exception, str],
    status_code: int = 500,
    details: Optional[Dict[str, Any]] = None,
    include_traceback: bool = False
) -> JSONResponse:
    """Create a standardized error response"""

    if isinstance(error, str):
        message = error
        error_code = "GENERIC_ERROR"
    elif isinstance(error, ScannerError):
        message = error.message
        error_code = error.error_code
        status_code = error.status_code
        details = {**(details or {}), **error.details}
    else:
        message = str(error)
        error_code = type(error).__name__

    error_data = {
        "success": False,
        "error": message,
        "error_code": error_code,
        "timestamp": datetime.now().isoformat()
    }

    if details:
        error_data["details"] = details

    if include_traceback and not isinstance(error, str):
        error_data["traceback"] = traceback.format_exc()

    # Log the error
    logger.error(f"Error {error_code}: {message}", extra={
        "error_code": error_code,
        "status_code": status_code,
        "details": details
    })

    return JSONResponse(
        status_code=status_code,
        content=error_data
    )


async def scanner_exception_handler(request: Request, exc: ScannerError) -> JSONResponse:
    """Handle scanner-specific exceptions"""
    return create_error_response(exc)


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    return create_error_response(
        error=exc.detail,
        status_code=exc.status_code,
        details={"url": str(request.url), "method": request.method}
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    return create_error_response(
        error="Request validation failed",
        status_code=422,
        details={
            "validation_errors": errors,
            "url": str(request.url),
            "method": request.method
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    logger.exception(f"Unexpected error: {str(exc)}")

    return create_error_response(
        error="An unexpected error occurred",
        status_code=500,
        details={
            "exception_type": type(exc).__name__,
            "url": str(request.url),
            "method": request.method
        },
        include_traceback=True  # Include traceback for debugging
    )


class ErrorTracker:
    """Track and analyze error patterns"""

    def __init__(self):
        self.error_counts: Dict[str, int] = {}
        self.recent_errors: list = []
        self.max_recent_errors = 100

    def track_error(self, error_code: str, message: str, details: Dict[str, Any] = None):
        """Track an error occurrence"""
        self.error_counts[error_code] = self.error_counts.get(error_code, 0) + 1

        error_entry = {
            "timestamp": datetime.now().isoformat(),
            "error_code": error_code,
            "message": message,
            "details": details or {}
        }

        self.recent_errors.append(error_entry)

        # Keep only recent errors
        if len(self.recent_errors) > self.max_recent_errors:
            self.recent_errors.pop(0)

    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""
        return {
            "total_errors": sum(self.error_counts.values()),
            "error_counts": self.error_counts,
            "recent_errors": self.recent_errors[-10:],  # Last 10 errors
            "most_common_errors": sorted(
                self.error_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }

    def clear_stats(self):
        """Clear error statistics"""
        self.error_counts.clear()
        self.recent_errors.clear()


# Global error tracker instance
error_tracker = ErrorTracker()


def handle_scan_error(func):
    """Decorator to handle scan-related errors"""
    import functools

    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except ScannerError:
            raise  # Re-raise scanner errors as-is
        except Exception as e:
            # Convert unexpected errors to scanner errors
            logger.exception(f"Unexpected error in {func.__name__}")
            raise ScanExecutionError(f"Unexpected error in {func.__name__}: {str(e)}")

    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ScannerError:
            raise  # Re-raise scanner errors as-is
        except Exception as e:
            # Convert unexpected errors to scanner errors
            logger.exception(f"Unexpected error in {func.__name__}")
            raise ScanExecutionError(f"Unexpected error in {func.__name__}: {str(e)}")

    # Return appropriate wrapper based on function type
    import asyncio
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


def retry_on_error(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator to retry operations on specific errors"""
    import functools
    import asyncio
    import time

    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except (DataFetchError, RateLimitError) as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(f"Attempt {attempt + 1} failed, retrying in {current_delay}s: {str(e)}")
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"All {max_retries + 1} attempts failed")
                        raise

            raise last_exception

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (DataFetchError, RateLimitError) as e:
                    last_exception = e
                    if attempt < max_retries:
                        logger.warning(f"Attempt {attempt + 1} failed, retrying in {current_delay}s: {str(e)}")
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(f"All {max_retries + 1} attempts failed")
                        raise

            raise last_exception

        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator