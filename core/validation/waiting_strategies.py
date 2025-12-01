"""
Robust Waiting Strategies
Intelligent waiting that replaces fixed delays with condition-based waits
"""

import asyncio
import time
from typing import (
    Any, Callable, Dict, List, Optional, Union,
    TypeVar, Generic, Awaitable
)
from dataclasses import dataclass, field
from enum import Enum
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

T = TypeVar('T')

class WaitStrategy(Enum):
    """Different waiting strategies for different scenarios"""
    STATE = "state"  # Wait for specific state
    VISIBILITY = "visibility"  # Wait for element visibility
    FUNCTION = "function"  # Wait for custom condition
    NETWORK = "network"  # Wait for network requests
    DOM_STABILITY = "dom_stability"  # Wait for DOM to stabilize
    FILE_UPLOAD = "file_upload"  # Wait for file upload completion
    FORM_VALIDATION = "form_validation"  # Wait for form validation

@dataclass
class WaitResult:
    """Result of a wait operation"""
    success: bool
    value: Any = None
    duration: float = 0.0
    attempts: int = 0
    error: Optional[str] = None
    strategy: Optional[WaitStrategy] = None

@dataclass
class WaitConfig:
    """Configuration for wait operations"""
    timeout: float = 10.0
    interval: float = 0.1
    max_attempts: Optional[int] = None
    exponential_backoff: bool = True
    backoff_multiplier: float = 1.5
    strategy: WaitStrategy = WaitStrategy.FUNCTION
    throw_on_timeout: bool = True

class SmartWaiter:
    """
    Smart waiting utility with multiple strategies and intelligent retry logic
    """

    def __init__(self, default_config: WaitConfig = None):
        self.default_config = default_config or WaitConfig()
        self.performance_history: Dict[str, List[float]] = {}
        self.logger = logging.getLogger(__name__)

    async def wait(
        self,
        condition: Union[Callable[[], bool], Callable[[], Awaitable[bool]], Any],
        config: Optional[WaitConfig] = None,
        description: str = "condition"
    ) -> WaitResult:
        """
        Wait for a condition to be true using intelligent retry logic

        Args:
            condition: The condition to wait for (function or value)
            config: Wait configuration
            description: Description for logging

        Returns:
            WaitResult with success status and metadata
        """
        cfg = config or self.default_config
        start_time = time.time()

        # Determine max attempts from timeout if not specified
        if cfg.max_attempts is None:
            cfg.max_attempts = int(cfg.timeout / cfg.interval) + 1

        self.logger.info(f"Waiting for {description} using {cfg.strategy.value} strategy")

        current_interval = cfg.interval
        last_value = None

        for attempt in range(1, cfg.max_attempts + 1):
            try:
                # Evaluate condition
                if callable(condition):
                    # Check if it's async
                    if asyncio.iscoroutinefunction(condition):
                        result = await condition()
                    else:
                        result = condition()
                else:
                    # Direct value check
                    result = bool(condition)

                last_value = result

                if result:
                    duration = time.time() - start_time
                    self._record_performance(description, duration, True, attempt)

                    return WaitResult(
                        success=True,
                        value=result,
                        duration=duration,
                        attempts=attempt,
                        strategy=cfg.strategy
                    )

                # Condition not met, wait before retry
                if attempt < cfg.max_attempts:
                    await asyncio.sleep(current_interval)

                    # Exponential backoff if enabled
                    if cfg.exponential_backoff:
                        current_interval = min(
                            current_interval * cfg.backoff_multiplier,
                            cfg.timeout / 4  # Cap interval to avoid missing timeout
                        )

            except Exception as e:
                self.logger.warning(f"Error in attempt {attempt} for {description}: {str(e)}")

                if attempt == cfg.max_attempts:
                    duration = time.time() - start_time
                    self._record_performance(description, duration, False, attempt)

                    return WaitResult(
                        success=False,
                        duration=duration,
                        attempts=attempt,
                        error=str(e),
                        strategy=cfg.strategy
                    )

                # Wait before retry after error
                await asyncio.sleep(current_interval)

        # Timeout reached
        duration = time.time() - start_time
        self._record_performance(description, duration, False, cfg.max_attempts)

        error_msg = f"Timeout after {duration:.2f}s waiting for {description}"
        self.logger.error(error_msg)

        if cfg.throw_on_timeout:
            raise TimeoutError(error_msg)

        return WaitResult(
            success=False,
            duration=duration,
            attempts=cfg.max_attempts,
            error=error_msg,
            strategy=cfg.strategy
        )

    def _record_performance(self, description: str, duration: float, success: bool, attempts: int):
        """Record performance metrics for adaptive tuning"""
        if description not in self.performance_history:
            self.performance_history[description] = []

        self.performance_history[description].append(duration)

        # Keep only last 10 measurements
        if len(self.performance_history[description]) > 10:
            self.performance_history[description] = self.performance_history[description][-10:]

        # Log performance
        status = "SUCCESS" if success else "TIMEOUT"
        self.logger.info(f"{status}: {description} in {duration:.2f}s after {attempts} attempts")

    def get_adaptive_timeout(self, description: str) -> float:
        """Get adaptive timeout based on historical performance"""
        if description not in self.performance_history:
            return self.default_config.timeout

        durations = self.performance_history[description]
        if not durations:
            return self.default_config.timeout

        # Set timeout to 2x the average successful duration
        avg_duration = sum(durations) / len(durations)
        return max(avg_duration * 2, self.default_config.timeout * 0.5)

# Pre-built wait strategies for common scenarios
class CommonWaitStrategies:
    """Collection of common waiting strategies"""

    def __init__(self, waiter: SmartWaiter):
        self.waiter = waiter

    async def wait_for_element_visibility(
        self,
        get_element: Callable[[], Optional[Any]],
        visible: bool = True,
        timeout: Optional[float] = None
    ) -> WaitResult:
        """Wait for element to become visible or hidden"""
        config = WaitConfig(
            strategy=WaitStrategy.VISIBILITY,
            timeout=timeout or self.waiter.get_adaptive_timeout("element_visibility")
        )

        def check_visibility():
            element = get_element()
            if element is None:
                return not visible

            # Check visibility based on element properties
            if hasattr(element, 'is_visible'):
                return element.is_visible == visible
            elif hasattr(element, 'visible'):
                return element.visible == visible
            else:
                # Default: assume element is visible if it exists
                return (element is not None) == visible

        return await self.waiter.wait(
            check_visibility,
            config,
            f"element {'visibility' if visible else 'invisibility'}"
        )

    async def wait_for_dom_stability(
        self,
        get_dom_snapshot: Callable[[], str],
        timeout: Optional[float] = None
    ) -> WaitResult:
        """Wait for DOM to stabilize (no changes over a period)"""
        config = WaitConfig(
            strategy=WaitStrategy.DOM_STABILITY,
            timeout=timeout or self.waiter.get_adaptive_timeout("dom_stability"),
            interval=0.2  # Check every 200ms
        )

        previous_snapshots = []
        stability_checks_needed = 3  # Need 3 identical snapshots for stability

        def check_stability():
            snapshot = get_dom_snapshot()
            previous_snapshots.append(snapshot)

            # Keep only last N snapshots
            if len(previous_snapshots) > stability_checks_needed:
                previous_snapshots.pop(0)

            # Check if all recent snapshots are identical
            return len(set(previous_snapshots)) == 1

        return await self.waiter.wait(
            check_stability,
            config,
            "DOM stability"
        )

    async def wait_for_file_upload(
        self,
        check_upload_status: Callable[[], Dict[str, Any]],
        timeout: Optional[float] = None
    ) -> WaitResult:
        """Wait for file upload to complete"""
        config = WaitConfig(
            strategy=WaitStrategy.FILE_UPLOAD,
            timeout=timeout or self.waiter.get_adaptive_timeout("file_upload"),
            interval=0.5  # Check every 500ms
        )

        def check_upload_complete():
            status = check_upload_status()

            # Check various upload completion indicators
            if isinstance(status, dict):
                # Common status patterns
                if status.get('status') == 'completed':
                    return True
                if status.get('progress', 0) >= 100:
                    return True
                if status.get('done'):
                    return True
                if status.get('error'):
                    # Upload failed, stop waiting
                    raise Exception(f"Upload failed: {status['error']}")

            return False

        return await self.waiter.wait(
            check_upload_complete,
            config,
            "file upload completion"
        )

    async def wait_for_form_validation(
        self,
        get_form_state: Callable[[], Dict[str, Any]],
        timeout: Optional[float] = None
    ) -> WaitResult:
        """Wait for form validation to complete"""
        config = WaitConfig(
            strategy=WaitStrategy.FORM_VALIDATION,
            timeout=timeout or self.waiter.get_adaptive_timeout("form_validation"),
            interval=0.1  # Check frequently for fast feedback
        )

        def check_validation_complete():
            state = get_form_state()

            if not isinstance(state, dict):
                return False

            # Check if validation is complete
            if state.get('validating'):
                return False  # Still validating

            # Check if there are validation errors
            errors = state.get('errors', {})
            if errors and any(errors.values()):  # Has errors
                return True  # Validation complete with errors

            # Check if form is valid
            if state.get('valid'):
                return True  # Validation complete successfully

            return False  # Still in progress

        return await self.waiter.wait(
            check_validation_complete,
            config,
            "form validation completion"
        )

    async def wait_for_network_idle(
        self,
        get_network_state: Callable[()[...] , Dict[str, Any]],
        timeout: Optional[float] = None
    ) -> WaitResult:
        """Wait for network activity to settle"""
        config = WaitConfig(
            strategy=WaitStrategy.NETWORK,
            timeout=timeout or self.waiter.get_adaptive_timeout("network_idle"),
            interval=0.2
        )

        def check_network_idle():
            state = get_network_state()

            if not isinstance(state, dict):
                return False

            # Common patterns for network idle state
            active_requests = state.get('active_requests', 0)
            if active_requests == 0:
                return True

            # Check if there are pending operations
            pending = state.get('pending', 0)
            if pending == 0:
                return True

            return False

        return await self.waiter.wait(
            check_network_idle,
            config,
            "network idle state"
        )

    async def wait_for_custom_state(
        self,
        get_state: Callable[[], Any],
        expected_state: Any,
        timeout: Optional[float] = None
    ) -> WaitResult:
        """Wait for a custom state value"""
        config = WaitConfig(
            strategy=WaitStrategy.STATE,
            timeout=timeout or self.waiter.get_adaptive_timeout("custom_state")
        )

        def check_state():
            current_state = get_state()
            return current_state == expected_state

        description = f"state to become {expected_state}"
        return await self.waiter.wait(check_state, config, description)

# Utility functions for common wait patterns
async def wait_for_file_exists(
    file_path: Union[str, Path],
    timeout: float = 10.0,
    check_size: bool = True,
    min_size: int = 0
) -> WaitResult:
    """Wait for a file to exist (and optionally have minimum size)"""
    waiter = SmartWaiter()
    path = Path(file_path)

    def check_file():
        if not path.exists():
            return False

        if check_size:
            return path.stat().st_size >= min_size

        return True

    config = WaitConfig(
        timeout=timeout,
        strategy=WaitStrategy.FUNCTION,
        interval=0.1
    )

    description = f"file {file_path} to exist"
    if check_size:
        description += f" with size >= {min_size}"

    return await waiter.wait(check_file, config, description)

async def wait_for_condition(
    condition: Callable[[], bool],
    timeout: float = 10.0,
    interval: float = 0.1,
    description: str = "condition"
) -> WaitResult:
    """Simple utility to wait for any condition"""
    waiter = SmartWaiter()
    config = WaitConfig(
        timeout=timeout,
        interval=interval,
        strategy=WaitStrategy.FUNCTION
    )

    return await waiter.wait(condition, config, description)

# Global instance for easy access
default_waiter = SmartWaiter()
common_waits = CommonWaitStrategies(default_waiter)

# Quick access functions
async def wait_for(
    condition: Callable[[], bool],
    timeout: float = 10.0,
    description: str = "condition"
) -> WaitResult:
    """Quick wait for any condition"""
    return await wait_for_condition(condition, timeout, description=description)

async def wait_until(
    timestamp: float,
    timeout: float = 60.0
) -> WaitResult:
    """Wait until a specific timestamp"""
    def check_time():
        return time.time() >= timestamp

    return await wait_for_condition(
        check_time,
        timeout=timeout,
        description=f"time {timestamp}"
    )