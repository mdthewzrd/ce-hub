#!/usr/bin/env python3
"""
Bulletproof Error Handler
========================
Comprehensive error handling and recovery system for the edge.dev platform.
Ensures bulletproof operation and graceful error recovery.
"""

import logging
import traceback
import sys
import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, asdict
from pathlib import Path
import functools
import time
from enum import Enum

# Configure comprehensive logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('edge_dev_errors.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    """Error categories"""
    PARAMETER_VALIDATION = "parameter_validation"
    API_ERROR = "api_error"
    DATA_ERROR = "data_error"
    CALCULATION_ERROR = "calculation_error"
    FILE_SYSTEM_ERROR = "file_system_error"
    NETWORK_ERROR = "network_error"
    MEMORY_ERROR = "memory_error"
    UNKNOWN_ERROR = "unknown_error"

@dataclass
class ErrorReport:
    """Comprehensive error report"""
    error_id: str
    timestamp: str
    severity: ErrorSeverity
    category: ErrorCategory
    message: str
    traceback_str: str
    context: Dict[str, Any]
    scanner_name: Optional[str] = None
    function_name: Optional[str] = None
    line_number: Optional[int] = None
    recovery_action: Optional[str] = None
    resolved: bool = False

class BulletproofErrorHandler:
    """Comprehensive error handling and recovery system"""

    def __init__(self, error_log_file: str = "edge_dev_errors.json"):
        self.error_log_file = error_log_file
        self.error_reports: List[ErrorReport] = []
        self.error_callbacks: Dict[ErrorCategory, List[Callable]] = {}
        self.recovery_strategies = self._initialize_recovery_strategies()
        self.max_errors = 1000  # Maximum errors to store in memory

    def _initialize_recovery_strategies(self) -> Dict[ErrorCategory, Callable]:
        """Initialize recovery strategies for different error types"""
        return {
            ErrorCategory.PARAMETER_VALIDATION: self._recover_parameter_error,
            ErrorCategory.API_ERROR: self._recover_api_error,
            ErrorCategory.DATA_ERROR: self._recover_data_error,
            ErrorCategory.CALCULATION_ERROR: self._recover_calculation_error,
            ErrorCategory.FILE_SYSTEM_ERROR: self._recover_file_system_error,
            ErrorCategory.NETWORK_ERROR: self._recover_network_error,
            ErrorCategory.MEMORY_ERROR: self._recover_memory_error,
            ErrorCategory.UNKNOWN_ERROR: self._recover_unknown_error
        }

    def categorize_error(self, exception: Exception, context: Dict[str, Any]) -> ErrorCategory:
        """Categorize error based on exception type and context"""
        if isinstance(exception, ValueError) and 'parameter' in str(exception).lower():
            return ErrorCategory.PARAMETER_VALIDATION
        elif isinstance(exception, (requests.exceptions.RequestException, requests.exceptions.ConnectionError)):
            return ErrorCategory.API_ERROR
        elif isinstance(exception, (pd.errors.DataError, KeyError, IndexError)):
            return ErrorCategory.DATA_ERROR
        elif isinstance(exception, (ZeroDivisionError, ArithmeticError, OverflowError)):
            return ErrorCategory.CALCULATION_ERROR
        elif isinstance(exception, (FileNotFoundError, PermissionError, OSError)):
            return ErrorCategory.FILE_SYSTEM_ERROR
        elif isinstance(exception, (ConnectionError, TimeoutError)):
            return ErrorCategory.NETWORK_ERROR
        elif isinstance(exception, MemoryError):
            return ErrorCategory.MEMORY_ERROR
        else:
            return ErrorCategory.UNKNOWN_ERROR

    def determine_severity(self, exception: Exception, category: ErrorCategory, context: Dict[str, Any]) -> ErrorSeverity:
        """Determine error severity"""
        if category in [ErrorCategory.PARAMETER_VALIDATION, ErrorCategory.CALCULATION_ERROR]:
            return ErrorSeverity.CRITICAL
        elif category in [ErrorCategory.API_ERROR, ErrorCategory.DATA_ERROR]:
            return ErrorSeverity.HIGH
        elif category == ErrorCategory.FILE_SYSTEM_ERROR:
            return ErrorSeverity.MEDIUM
        else:
            return ErrorSeverity.LOW

    def create_error_report(self, exception: Exception, context: Dict[str, Any] = None) -> ErrorReport:
        """Create comprehensive error report"""
        if context is None:
            context = {}

        # Generate unique error ID
        error_id = f"ERR_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{id(exception)}"

        # Categorize and determine severity
        category = self.categorize_error(exception, context)
        severity = self.determine_severity(exception, category, context)

        # Extract traceback information
        tb = traceback.format_exc().split('\n')
        if tb and len(tb) > 1:
            function_name = "unknown"  # Could be parsed more carefully if needed
            line_number = None  # Could be extracted from traceback
        else:
            function_name = None
            line_number = None

        report = ErrorReport(
            error_id=error_id,
            timestamp=datetime.now().isoformat(),
            severity=severity,
            category=category,
            message=str(exception),
            traceback_str=traceback.format_exc(),
            context=context,
            scanner_name=context.get('scanner_name'),
            function_name=function_name,
            line_number=line_number
        )

        return report

    def handle_error(self, exception: Exception, context: Dict[str, Any] = None) -> Optional[Any]:
        """Handle error with automatic recovery"""
        if context is None:
            context = {}

        # Create error report
        report = self.create_error_report(exception, context)
        self.error_reports.append(report)

        # Log error
        logger.error(f"Error {report.error_id}: {report.message}")
        logger.error(f"Category: {report.category.value}, Severity: {report.severity.value}")
        logger.debug(f"Traceback: {report.traceback_str}")

        # Save error report
        self._save_error_report(report)

        # Execute callbacks
        self._execute_callbacks(report)

        # Attempt recovery
        try:
            recovery_result = self.recovery_strategies[report.category](exception, context, report)
            report.recovery_action = "Automatic recovery attempted"
            logger.info(f"Recovery attempted for error {report.error_id}")
            return recovery_result
        except Exception as recovery_error:
            report.recovery_action = f"Recovery failed: {str(recovery_error)}"
            logger.error(f"Recovery failed for error {report.error_id}: {str(recovery_error)}")

        # Clean up old errors
        self._cleanup_old_errors()

        return None

    def _save_error_report(self, report: ErrorReport):
        """Save error report to file"""
        try:
            # Load existing reports
            if os.path.exists(self.error_log_file):
                with open(self.error_log_file, 'r') as f:
                    existing_reports = json.load(f)
            else:
                existing_reports = []

            # Add new report
            existing_reports.append(asdict(report))

            # Keep only last 1000 reports
            if len(existing_reports) > 1000:
                existing_reports = existing_reports[-1000:]

            # Save back to file
            with open(self.error_log_file, 'w') as f:
                json.dump(existing_reports, f, indent=2, default=str)

        except Exception as e:
            logger.error(f"Failed to save error report: {str(e)}")

    def _execute_callbacks(self, report: ErrorReport):
        """Execute registered callbacks for error category"""
        callbacks = self.error_callbacks.get(report.category, [])
        for callback in callbacks:
            try:
                callback(report)
            except Exception as e:
                logger.error(f"Error in callback: {str(e)}")

    def _cleanup_old_errors(self):
        """Clean up old error reports to prevent memory leaks"""
        if len(self.error_reports) > self.max_errors:
            self.error_reports = self.error_reports[-self.max_errors:]

    # Recovery strategies
    def _recover_parameter_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> Dict[str, Any]:
        """Recover from parameter validation errors"""
        logger.warning("Parameter validation error - using safe defaults")

        # Return safe default parameters based on scanner type
        scanner_type = context.get('scanner_type', 'backside_b')

        safe_defaults = {
            'backside_b': {
                'price_min': 8.0,
                'adv20_min_usd': 30_000_000,
                'gap_div_atr_min': 0.75,
                'pos_abs_max': 0.75
            },
            'half_a_plus': {
                'price_min': 8.0,
                'adv20_min_usd': 15_000_000,
                'gap_div_atr_min': 1.25,
                'not_top_frac_abs': 0.75
            },
            'lc_multiscanner': {
                'price_min': 3.0,
                'adv20_min_usd': 5_000_000,
                'gap_div_atr_min': 0.4,
                'pos_abs_max': 0.85
            }
        }

        return safe_defaults.get(scanner_type, safe_defaults['backside_b'])

    def _recover_api_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> bool:
        """Recover from API errors"""
        logger.warning("API error - will retry with exponential backoff")

        # Exponential backoff for API retries
        max_retries = 3
        base_delay = 1

        for attempt in range(max_retries):
            delay = base_delay * (2 ** attempt)
            logger.info(f"API retry attempt {attempt + 1} in {delay} seconds")
            time.sleep(delay)

            # The actual retry logic should be implemented by the caller
            # This just indicates that retries should be attempted

        return False  # Indicate that manual intervention may be needed

    def _recover_data_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> bool:
        """Recover from data errors"""
        logger.warning("Data error - skipping problematic data point")

        # For data errors, we typically skip the problematic data point
        return True  # Indicate recovery by skipping

    def _recover_calculation_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> float:
        """Recover from calculation errors"""
        logger.warning("Calculation error - using safe default values")

        # Return safe default values for calculations
        return 0.0  # Safe default for most calculations

    def _recover_file_system_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> bool:
        """Recover from file system errors"""
        logger.warning("File system error - attempting to create directories")

        try:
            # Try to create missing directories
            file_path = context.get('file_path')
            if file_path:
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                return True
        except Exception:
            pass

        return False

    def _recover_network_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> bool:
        """Recover from network errors"""
        logger.warning("Network error - will continue with cached data if available")
        return True  # Continue with available data

    def _recover_memory_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> bool:
        """Recover from memory errors"""
        logger.critical("Memory error - attempting garbage collection")

        import gc
        gc.collect()

        # Reduce processing batch size
        context['reduced_batch_size'] = True
        return True

    def _recover_unknown_error(self, exception: Exception, context: Dict[str, Any], report: ErrorReport) -> bool:
        """Recover from unknown errors"""
        logger.error("Unknown error - continuing with caution")
        return True  # Try to continue

    def register_error_callback(self, category: ErrorCategory, callback: Callable):
        """Register callback for specific error category"""
        if category not in self.error_callbacks:
            self.error_callbacks[category] = []
        self.error_callbacks[category].append(callback)

    def get_error_statistics(self) -> Dict[str, Any]:
        """Get comprehensive error statistics"""
        if not self.error_reports:
            return {
                'total_errors': 0,
                'by_severity': {},
                'by_category': {},
                'by_scanner': {},
                'recent_errors': []
            }

        stats = {
            'total_errors': len(self.error_reports),
            'by_severity': {},
            'by_category': {},
            'by_scanner': {},
            'recent_errors': []
        }

        for report in self.error_reports:
            # Count by severity
            severity = report.severity.value
            stats['by_severity'][severity] = stats['by_severity'].get(severity, 0) + 1

            # Count by category
            category = report.category.value
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1

            # Count by scanner
            if report.scanner_name:
                scanner = report.scanner_name
                stats['by_scanner'][scanner] = stats['by_scanner'].get(scanner, 0) + 1

        # Get recent errors (last 10)
        stats['recent_errors'] = [
            {
                'error_id': report.error_id,
                'timestamp': report.timestamp,
                'severity': report.severity.value,
                'category': report.category.value,
                'message': report.message
            }
            for report in self.error_reports[-10:]
        ]

        return stats

def bulletproof(error_category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR):
    """Decorator for bulletproof function execution"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            error_handler = get_global_error_handler()

            try:
                return func(*args, **kwargs)
            except Exception as e:
                context = {
                    'function_name': func.__name__,
                    'module': func.__module__,
                    'args': str(args)[:200],  # Limit length
                    'kwargs': str(kwargs)[:200],  # Limit length
                    'error_category': error_category.value
                }

                # Attempt recovery
                recovery_result = error_handler.handle_error(e, context)

                # If recovery succeeded and returned a value, use it
                if recovery_result is not None:
                    return recovery_result

                # If no recovery, re-raise the exception
                raise

        return wrapper
    return decorator

# Global error handler instance
_global_error_handler = None

def get_global_error_handler() -> BulletproofErrorHandler:
    """Get global error handler instance"""
    global _global_error_handler
    if _global_error_handler is None:
        _global_error_handler = BulletproofErrorHandler()
    return _global_error_handler

def handle_error(exception: Exception, context: Dict[str, Any] = None) -> Optional[Any]:
    """Convenience function for global error handling"""
    handler = get_global_error_handler()
    return handler.handle_error(exception, context)

if __name__ == "__main__":
    # Example usage
    error_handler = BulletproofErrorHandler()

    # Test error handling
    try:
        # Simulate parameter error
        raise ValueError("Invalid parameter: price_min cannot be negative")
    except Exception as e:
        result = error_handler.handle_error(e, {
            'scanner_name': 'test_scanner',
            'scanner_type': 'backside_b',
            'function_name': 'test_function'
        })
        print(f"Recovery result: {result}")

    # Get error statistics
    stats = error_handler.get_error_statistics()
    print(f"Error statistics: {json.dumps(stats, indent=2)}")

# Import requests for API error handling
try:
    import requests
    import pandas as pd
except ImportError:
    # These imports are optional for the error handler
    pass