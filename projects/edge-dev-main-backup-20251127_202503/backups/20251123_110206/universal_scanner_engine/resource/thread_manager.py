#!/usr/bin/env python3
"""
Dynamic Threading Management System
Intelligently allocates threading resources based on scanner profiles and system constraints
"""

import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Dict, List, Optional, Callable, Any
from enum import Enum
import logging
import time
from collections import defaultdict
import multiprocessing

# Safe psutil import with fallback
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    # Create mock psutil functions for graceful degradation
    class MockPsutil:
        @staticmethod
        def cpu_count(logical=True):
            return multiprocessing.cpu_count()

        @staticmethod
        def virtual_memory():
            class MockMemory:
                total = 8 * 1024**3  # Default 8GB
                available = 4 * 1024**3  # Default 4GB available
            return MockMemory()

    psutil = MockPsutil()

from ..classification.scanner_classifier import ScannerProfile, ScannerType

logger = logging.getLogger(__name__)

class ThreadStrategy(Enum):
    SYMBOL_PARALLEL = "symbol_parallel"     # Parallel processing across symbols
    DATE_PARALLEL = "date_parallel"         # Parallel processing across dates
    HYBRID = "hybrid"                       # Mixed parallel processing
    SEQUENTIAL = "sequential"               # Sequential processing

@dataclass
class ResourceProfile:
    """System resource profile for threading decisions"""
    cpu_cores: int
    available_memory_gb: float
    current_cpu_usage: float
    current_memory_usage: float
    estimated_load_capacity: float
    threading_recommendation: ThreadStrategy

@dataclass
class ThreadAllocation:
    """Resource allocation for a specific scanner execution"""
    max_workers: int
    thread_strategy: ThreadStrategy
    use_multiprocessing: bool
    batch_size: int
    memory_limit_mb: int
    estimated_execution_time: int
    priority_level: int  # 1-5, where 1 is highest priority

class SystemResourceMonitor:
    """Monitors system resources for intelligent threading decisions"""

    def __init__(self):
        self.cpu_count = multiprocessing.cpu_count()
        self.total_memory_gb = psutil.virtual_memory().total / (1024**3)
        self.monitoring_interval = 30  # seconds
        self.resource_history = []

    def get_current_profile(self) -> ResourceProfile:
        """Get current system resource profile"""
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        memory_usage = memory.percent
        available_memory_gb = memory.available / (1024**3)

        # Calculate estimated load capacity
        load_capacity = self._calculate_load_capacity(cpu_usage, memory_usage)

        # Determine threading recommendation
        thread_recommendation = self._recommend_threading_strategy(
            cpu_usage, memory_usage, available_memory_gb
        )

        profile = ResourceProfile(
            cpu_cores=self.cpu_count,
            available_memory_gb=available_memory_gb,
            current_cpu_usage=cpu_usage,
            current_memory_usage=memory_usage,
            estimated_load_capacity=load_capacity,
            threading_recommendation=thread_recommendation
        )

        # Store in history for trend analysis
        self.resource_history.append({
            'timestamp': time.time(),
            'profile': profile
        })

        # Keep only last 100 measurements
        if len(self.resource_history) > 100:
            self.resource_history = self.resource_history[-100:]

        return profile

    def _calculate_load_capacity(self, cpu_usage: float, memory_usage: float) -> float:
        """Calculate system's current load capacity (0-1)"""
        # Conservative approach - if either CPU or memory is high, capacity is low
        cpu_capacity = max(0, (100 - cpu_usage) / 100)
        memory_capacity = max(0, (100 - memory_usage) / 100)

        # Return the limiting factor
        return min(cpu_capacity, memory_capacity)

    def _recommend_threading_strategy(self, cpu_usage: float, memory_usage: float,
                                     available_memory_gb: float) -> ThreadStrategy:
        """Recommend optimal threading strategy based on current system state"""

        # High resource usage - prefer sequential or light threading
        if cpu_usage > 80 or memory_usage > 85:
            return ThreadStrategy.SEQUENTIAL

        # Medium resource usage - prefer symbol parallel
        elif cpu_usage > 50 or memory_usage > 60:
            return ThreadStrategy.SYMBOL_PARALLEL

        # Low resource usage with good memory - can use hybrid
        elif available_memory_gb > 8:
            return ThreadStrategy.HYBRID

        # Default to symbol parallel
        return ThreadStrategy.SYMBOL_PARALLEL

class DynamicThreadManager:
    """
    Intelligent threading management for scanner execution
    """

    def __init__(self):
        self.resource_monitor = SystemResourceMonitor()
        self.active_allocations = {}
        self.allocation_history = []
        self.performance_metrics = defaultdict(list)

        # Resource constraints
        self.max_concurrent_scanners = 3
        self.max_total_workers = min(32, multiprocessing.cpu_count() * 4)
        self.memory_safety_threshold = 0.85  # Don't use more than 85% of RAM

    async def allocate_resources(self, scanner_profile: ScannerProfile,
                                scanner_id: str) -> ThreadAllocation:
        """
        Intelligently allocate threading resources for a scanner
        """
        logger.info(f"🎯 Allocating resources for scanner {scanner_id} ({scanner_profile.scanner_type.value})")

        # Get current system state
        resource_profile = self.resource_monitor.get_current_profile()

        # Calculate optimal allocation
        allocation = self._calculate_optimal_allocation(scanner_profile, resource_profile)

        # Validate allocation against constraints
        allocation = self._validate_allocation(allocation, resource_profile)

        # Store allocation for monitoring
        self.active_allocations[scanner_id] = {
            'allocation': allocation,
            'start_time': time.time(),
            'scanner_profile': scanner_profile,
            'resource_profile': resource_profile
        }

        logger.info(f"✅ Allocated {allocation.max_workers} workers with {allocation.thread_strategy.value} strategy")
        return allocation

    def _calculate_optimal_allocation(self, scanner_profile: ScannerProfile,
                                    resource_profile: ResourceProfile) -> ThreadAllocation:
        """Calculate optimal resource allocation"""

        # Base allocations by scanner type
        base_allocations = {
            ScannerType.ENTERPRISE: {
                'max_workers': min(16, resource_profile.cpu_cores),
                'use_multiprocessing': True,
                'batch_size': 50,
                'memory_limit_mb': 2048,
                'priority': 1
            },
            ScannerType.FOCUSED: {
                'max_workers': min(8, resource_profile.cpu_cores),
                'use_multiprocessing': False,
                'batch_size': 25,
                'memory_limit_mb': 1024,
                'priority': 2
            },
            ScannerType.DAILY: {
                'max_workers': min(4, resource_profile.cpu_cores),
                'use_multiprocessing': False,
                'batch_size': 10,
                'memory_limit_mb': 512,
                'priority': 3
            },
            ScannerType.INTRADAY: {
                'max_workers': min(2, resource_profile.cpu_cores),
                'use_multiprocessing': False,
                'batch_size': 5,
                'memory_limit_mb': 256,
                'priority': 4
            },
            ScannerType.UNKNOWN: {
                'max_workers': min(2, resource_profile.cpu_cores),
                'use_multiprocessing': False,
                'batch_size': 10,
                'memory_limit_mb': 512,
                'priority': 5
            }
        }

        base_config = base_allocations[scanner_profile.scanner_type]

        # Adjust based on system load
        load_multiplier = resource_profile.estimated_load_capacity
        adjusted_workers = max(1, int(base_config['max_workers'] * load_multiplier))

        # Determine thread strategy
        if scanner_profile.thread_strategy == "hybrid":
            thread_strategy = ThreadStrategy.HYBRID
        elif scanner_profile.thread_strategy == "date_parallel":
            thread_strategy = ThreadStrategy.DATE_PARALLEL
        else:
            # Use system recommendation or default to symbol parallel
            thread_strategy = resource_profile.threading_recommendation
            if thread_strategy == ThreadStrategy.SEQUENTIAL and scanner_profile.estimated_symbols > 100:
                thread_strategy = ThreadStrategy.SYMBOL_PARALLEL

        # Adjust batch size based on symbol count
        if scanner_profile.estimated_symbols > 1000:
            batch_size = max(base_config['batch_size'], 100)
        elif scanner_profile.estimated_symbols > 500:
            batch_size = max(base_config['batch_size'], 50)
        else:
            batch_size = base_config['batch_size']

        return ThreadAllocation(
            max_workers=adjusted_workers,
            thread_strategy=thread_strategy,
            use_multiprocessing=base_config['use_multiprocessing'],
            batch_size=batch_size,
            memory_limit_mb=base_config['memory_limit_mb'],
            estimated_execution_time=scanner_profile.estimated_runtime,
            priority_level=base_config['priority']
        )

    def _validate_allocation(self, allocation: ThreadAllocation,
                           resource_profile: ResourceProfile) -> ThreadAllocation:
        """Validate and adjust allocation based on system constraints"""

        # Check total worker limit
        current_workers = sum(
            alloc['allocation'].max_workers
            for alloc in self.active_allocations.values()
        )

        if current_workers + allocation.max_workers > self.max_total_workers:
            # Reduce workers to fit within limit
            allocation.max_workers = max(1, self.max_total_workers - current_workers)
            logger.warning(f"⚠️ Reduced workers to {allocation.max_workers} due to system limits")

        # Check memory constraints
        estimated_memory_usage = allocation.memory_limit_mb / 1024  # Convert to GB
        if (resource_profile.current_memory_usage / 100 * resource_profile.cpu_cores +
            estimated_memory_usage) > self.memory_safety_threshold:
            # Reduce memory allocation
            allocation.memory_limit_mb = int(allocation.memory_limit_mb * 0.7)
            allocation.max_workers = max(1, allocation.max_workers // 2)
            logger.warning(f"⚠️ Reduced allocation due to memory constraints")

        # If system is under high load, force sequential processing
        if resource_profile.estimated_load_capacity < 0.3:
            allocation.max_workers = 1
            allocation.thread_strategy = ThreadStrategy.SEQUENTIAL
            allocation.use_multiprocessing = False
            logger.warning("⚠️ Forcing sequential processing due to high system load")

        return allocation

    async def execute_with_allocation(self, allocation: ThreadAllocation,
                                    work_function: Callable,
                                    work_items: List[Any],
                                    scanner_id: str) -> List[Any]:
        """
        Execute work using the allocated threading strategy
        """
        logger.info(f"🚀 Executing scanner {scanner_id} with {allocation.thread_strategy.value} strategy")

        start_time = time.time()
        results = []

        try:
            if allocation.thread_strategy == ThreadStrategy.SEQUENTIAL:
                results = await self._execute_sequential(work_function, work_items)

            elif allocation.thread_strategy == ThreadStrategy.SYMBOL_PARALLEL:
                results = await self._execute_symbol_parallel(
                    allocation, work_function, work_items
                )

            elif allocation.thread_strategy == ThreadStrategy.DATE_PARALLEL:
                results = await self._execute_date_parallel(
                    allocation, work_function, work_items
                )

            elif allocation.thread_strategy == ThreadStrategy.HYBRID:
                results = await self._execute_hybrid(
                    allocation, work_function, work_items
                )

            execution_time = time.time() - start_time

            # Record performance metrics
            self.performance_metrics[scanner_id].append({
                'execution_time': execution_time,
                'allocation': allocation,
                'items_processed': len(work_items),
                'success': True
            })

            logger.info(f"✅ Scanner {scanner_id} completed in {execution_time:.2f}s")
            return results

        except Exception as e:
            execution_time = time.time() - start_time
            self.performance_metrics[scanner_id].append({
                'execution_time': execution_time,
                'allocation': allocation,
                'items_processed': len(work_items),
                'success': False,
                'error': str(e)
            })
            logger.error(f"❌ Scanner {scanner_id} failed after {execution_time:.2f}s: {e}")
            raise

        finally:
            # Clean up allocation
            if scanner_id in self.active_allocations:
                del self.active_allocations[scanner_id]

    async def _execute_sequential(self, work_function: Callable, work_items: List[Any]) -> List[Any]:
        """Execute work sequentially"""
        results = []
        for item in work_items:
            result = await asyncio.get_event_loop().run_in_executor(None, work_function, item)
            results.append(result)
        return results

    async def _execute_symbol_parallel(self, allocation: ThreadAllocation,
                                     work_function: Callable, work_items: List[Any]) -> List[Any]:
        """Execute work in parallel across symbols"""

        if allocation.use_multiprocessing:
            with ProcessPoolExecutor(max_workers=allocation.max_workers) as executor:
                futures = [executor.submit(work_function, item) for item in work_items]
                results = [future.result() for future in as_completed(futures)]
        else:
            with ThreadPoolExecutor(max_workers=allocation.max_workers) as executor:
                loop = asyncio.get_event_loop()
                futures = [
                    loop.run_in_executor(executor, work_function, item)
                    for item in work_items
                ]
                results = await asyncio.gather(*futures)

        return results

    async def _execute_date_parallel(self, allocation: ThreadAllocation,
                                    work_function: Callable, work_items: List[Any]) -> List[Any]:
        """Execute work in parallel across dates (for time-series processing)"""
        # Group items by date if applicable, otherwise fall back to symbol parallel
        return await self._execute_symbol_parallel(allocation, work_function, work_items)

    async def _execute_hybrid(self, allocation: ThreadAllocation,
                            work_function: Callable, work_items: List[Any]) -> List[Any]:
        """Execute work using hybrid parallel strategy"""

        # Split work into batches for mixed processing
        batch_size = allocation.batch_size
        batches = [work_items[i:i + batch_size] for i in range(0, len(work_items), batch_size)]

        # Process batches in parallel
        if allocation.use_multiprocessing:
            with ProcessPoolExecutor(max_workers=allocation.max_workers) as executor:
                batch_futures = []
                for batch in batches:
                    # Each batch processed as a unit
                    future = executor.submit(self._process_batch, work_function, batch)
                    batch_futures.append(future)

                batch_results = [future.result() for future in as_completed(batch_futures)]
        else:
            with ThreadPoolExecutor(max_workers=allocation.max_workers) as executor:
                loop = asyncio.get_event_loop()
                batch_futures = [
                    loop.run_in_executor(executor, self._process_batch, work_function, batch)
                    for batch in batches
                ]
                batch_results = await asyncio.gather(*batch_futures)

        # Flatten results
        results = []
        for batch_result in batch_results:
            results.extend(batch_result)

        return results

    def _process_batch(self, work_function: Callable, batch: List[Any]) -> List[Any]:
        """Process a batch of work items"""
        return [work_function(item) for item in batch]

    def release_resources(self, scanner_id: str):
        """Release resources for a completed scanner"""
        if scanner_id in self.active_allocations:
            allocation_info = self.active_allocations[scanner_id]
            execution_time = time.time() - allocation_info['start_time']

            # Store in history
            self.allocation_history.append({
                'scanner_id': scanner_id,
                'execution_time': execution_time,
                'allocation': allocation_info['allocation'],
                'scanner_profile': allocation_info['scanner_profile']
            })

            # Clean up
            del self.active_allocations[scanner_id]

            logger.info(f"🧹 Released resources for scanner {scanner_id}")

    def get_system_status(self) -> Dict[str, Any]:
        """Get current system and allocation status"""
        resource_profile = self.resource_monitor.get_current_profile()

        return {
            'system_resources': {
                'cpu_cores': resource_profile.cpu_cores,
                'cpu_usage': resource_profile.current_cpu_usage,
                'memory_usage': resource_profile.current_memory_usage,
                'available_memory_gb': resource_profile.available_memory_gb,
                'load_capacity': resource_profile.estimated_load_capacity
            },
            'active_scanners': len(self.active_allocations),
            'total_active_workers': sum(
                alloc['allocation'].max_workers
                for alloc in self.active_allocations.values()
            ),
            'active_allocations': {
                scanner_id: {
                    'scanner_type': alloc['scanner_profile'].scanner_type.value,
                    'workers': alloc['allocation'].max_workers,
                    'strategy': alloc['allocation'].thread_strategy.value,
                    'runtime': time.time() - alloc['start_time']
                }
                for scanner_id, alloc in self.active_allocations.items()
            }
        }

# Global thread manager instance
thread_manager = DynamicThreadManager()

async def allocate_scanner_resources(scanner_profile: ScannerProfile,
                                   scanner_id: str) -> ThreadAllocation:
    """
    Main entry point for resource allocation
    """
    return await thread_manager.allocate_resources(scanner_profile, scanner_id)

async def execute_scanner_with_resources(allocation: ThreadAllocation,
                                       work_function: Callable,
                                       work_items: List[Any],
                                       scanner_id: str) -> List[Any]:
    """
    Main entry point for executing scanner with allocated resources
    """
    return await thread_manager.execute_with_allocation(
        allocation, work_function, work_items, scanner_id
    )