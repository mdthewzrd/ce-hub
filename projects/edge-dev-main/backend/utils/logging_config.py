"""
Comprehensive logging configuration for LC Scanner Backend
Provides structured logging with performance monitoring
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import structlog


class PerformanceFilter(logging.Filter):
    """Custom filter to track performance metrics"""

    def filter(self, record):
        # Add performance tracking to log records
        if hasattr(record, 'execution_time'):
            if record.execution_time > 1.0:  # Slow operations
                record.performance_flag = 'SLOW'
            elif record.execution_time > 0.1:
                record.performance_flag = 'MEDIUM'
            else:
                record.performance_flag = 'FAST'
        return True


class ScannerLogFormatter(logging.Formatter):
    """Custom formatter with color coding and structured output"""

    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'       # Reset
    }

    def format(self, record):
        # Add color for console output
        if hasattr(record, 'color') and record.color:
            color = self.COLORS.get(record.levelname, '')
            reset = self.COLORS['RESET']
            record.levelname = f"{color}{record.levelname}{reset}"

        # Add performance flag if present
        perf_flag = getattr(record, 'performance_flag', '')
        if perf_flag:
            record.msg = f"[{perf_flag}] {record.msg}"

        return super().format(record)


def setup_logging(
    log_level: str = "INFO",
    log_dir: str = "logs",
    enable_file_logging: bool = True,
    enable_console_logging: bool = True,
    max_file_size_mb: int = 100,
    backup_count: int = 5
) -> Dict[str, logging.Logger]:
    """
    Setup comprehensive logging configuration
    Returns dict of specialized loggers
    """

    # Create log directory
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="ISO"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Main application logger
    app_logger = logging.getLogger("scanner_app")
    app_logger.setLevel(getattr(logging, log_level.upper()))

    # Performance logger
    perf_logger = logging.getLogger("scanner_performance")
    perf_logger.setLevel(logging.INFO)
    perf_logger.addFilter(PerformanceFilter())

    # API logger
    api_logger = logging.getLogger("scanner_api")
    api_logger.setLevel(logging.INFO)

    # Scanner core logger
    scanner_logger = logging.getLogger("scanner_core")
    scanner_logger.setLevel(logging.INFO)

    # WebSocket logger
    websocket_logger = logging.getLogger("scanner_websocket")
    websocket_logger.setLevel(logging.INFO)

    # Clear existing handlers
    loggers = [app_logger, perf_logger, api_logger, scanner_logger, websocket_logger]
    for logger in loggers:
        logger.handlers.clear()

    # Console handler with color
    if enable_console_logging:
        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = ScannerLogFormatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)

        # Add color attribute for console
        class ColorFilter(logging.Filter):
            def filter(self, record):
                record.color = True
                return True

        console_handler.addFilter(ColorFilter())

        for logger in loggers:
            logger.addHandler(console_handler)

    # File handlers
    if enable_file_logging:
        max_bytes = max_file_size_mb * 1024 * 1024

        # Main application log
        app_file_handler = logging.handlers.RotatingFileHandler(
            log_path / "scanner_app.log",
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        app_file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(pathname)s:%(lineno)d - %(message)s'
        ))
        app_logger.addHandler(app_file_handler)

        # Performance log
        perf_file_handler = logging.handlers.RotatingFileHandler(
            log_path / "scanner_performance.log",
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        perf_file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(performance_flag)s - %(message)s - %(execution_time).3fs'
        ))
        perf_logger.addHandler(perf_file_handler)

        # API access log
        api_file_handler = logging.handlers.RotatingFileHandler(
            log_path / "scanner_api.log",
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        api_file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        ))
        api_logger.addHandler(api_file_handler)

        # Error log (errors from all loggers)
        error_file_handler = logging.handlers.RotatingFileHandler(
            log_path / "scanner_errors.log",
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        error_file_handler.setLevel(logging.ERROR)
        error_file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(pathname)s:%(lineno)d - %(message)s\n%(exc_info)s'
        ))

        for logger in loggers:
            logger.addHandler(error_file_handler)

    # Prevent log propagation to avoid duplication
    for logger in loggers:
        logger.propagate = False

    return {
        "app": app_logger,
        "performance": perf_logger,
        "api": api_logger,
        "scanner": scanner_logger,
        "websocket": websocket_logger
    }


class LoggerMixin:
    """Mixin class to add logging capabilities to any class"""

    @property
    def logger(self):
        if not hasattr(self, '_logger'):
            self._logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
        return self._logger

    def log_performance(self, operation: str, execution_time: float, **kwargs):
        """Log performance metrics"""
        perf_logger = logging.getLogger("scanner_performance")
        perf_logger.info(
            f"{operation} completed",
            extra={
                'execution_time': execution_time,
                'operation': operation,
                **kwargs
            }
        )

    def log_api_access(self, method: str, path: str, status_code: int, execution_time: float):
        """Log API access"""
        api_logger = logging.getLogger("scanner_api")
        api_logger.info(
            f"{method} {path} - {status_code} - {execution_time:.3f}s"
        )


def get_logger(name: str = None) -> logging.Logger:
    """Get a configured logger instance"""
    if name:
        return logging.getLogger(f"scanner_{name}")
    else:
        return logging.getLogger("scanner_app")


# Performance monitoring decorator
def log_performance(operation_name: str = None):
    """Decorator to automatically log performance metrics"""
    def decorator(func):
        import functools
        import time

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            op_name = operation_name or f"{func.__module__}.{func.__name__}"

            try:
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time

                perf_logger = logging.getLogger("scanner_performance")
                perf_logger.info(
                    f"{op_name} completed successfully",
                    extra={'execution_time': execution_time}
                )

                return result

            except Exception as e:
                execution_time = time.time() - start_time

                perf_logger = logging.getLogger("scanner_performance")
                perf_logger.error(
                    f"{op_name} failed: {str(e)}",
                    extra={'execution_time': execution_time}
                )
                raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            op_name = operation_name or f"{func.__module__}.{func.__name__}"

            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time

                perf_logger = logging.getLogger("scanner_performance")
                perf_logger.info(
                    f"{op_name} completed successfully",
                    extra={'execution_time': execution_time}
                )

                return result

            except Exception as e:
                execution_time = time.time() - start_time

                perf_logger = logging.getLogger("scanner_performance")
                perf_logger.error(
                    f"{op_name} failed: {str(e)}",
                    extra={'execution_time': execution_time}
                )
                raise

        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator