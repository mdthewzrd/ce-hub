#!/usr/bin/env python3
"""
Universal Scanner Engine (USE) Orchestrator
Core orchestrator that coordinates all components for intelligent scanner execution
"""

import asyncio
import json
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path

# Import all USE components
from ..classification.scanner_classifier import classify_uploaded_scanner, ScannerProfile, ScannerType
from ..extraction.parameter_extractor import extract_scanner_parameters, ParameterExtractionResult
from ..api.polygon_manager import PolygonAPIManager
from ..resource.thread_manager import allocate_scanner_resources, execute_scanner_with_resources, ThreadAllocation

logger = logging.getLogger(__name__)

class ExecutionStatus(Enum):
    PENDING = "pending"
    CLASSIFYING = "classifying"
    EXTRACTING = "extracting"
    ALLOCATING = "allocating"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class ScannerExecutionRequest:
    """Complete scanner execution request"""
    scanner_id: str
    filename: str
    code: str
    user_params: Optional[Dict[str, Any]] = None
    scan_date: Optional[str] = None
    priority: int = 3  # 1-5, where 1 is highest
    timeout_seconds: int = 3600  # 1 hour default

@dataclass
class ExecutionResult:
    """Complete execution result with metadata"""
    scanner_id: str
    status: ExecutionStatus
    start_time: datetime
    end_time: Optional[datetime]
    execution_time_seconds: Optional[float]

    # Component results
    classification: Optional[ScannerProfile] = None
    parameters: Optional[ParameterExtractionResult] = None
    allocation: Optional[ThreadAllocation] = None

    # Execution results
    scan_results: Optional[List[Dict[str, Any]]] = None
    symbols_processed: int = 0
    api_calls_made: int = 0

    # Error handling
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None

    # Performance metrics
    performance_metrics: Optional[Dict[str, Any]] = None

class ProgressCallback:
    """Progress tracking for long-running operations"""

    def __init__(self, scanner_id: str):
        self.scanner_id = scanner_id
        self.current_phase = "initializing"
        self.progress_percent = 0
        self.current_operation = ""
        self.symbols_processed = 0
        self.total_symbols = 0
        self.start_time = time.time()

    def update_phase(self, phase: str, progress: float = 0):
        self.current_phase = phase
        self.progress_percent = progress
        logger.info(f"📊 Scanner {self.scanner_id}: {phase} - {progress:.1f}%")

    def update_progress(self, progress: float, operation: str = ""):
        self.progress_percent = progress
        if operation:
            self.current_operation = operation
        logger.debug(f"📈 Scanner {self.scanner_id}: {operation} - {progress:.1f}%")

    def update_symbols(self, processed: int, total: int):
        self.symbols_processed = processed
        self.total_symbols = total
        if total > 0:
            symbol_progress = (processed / total) * 100
            logger.debug(f"📈 Scanner {self.scanner_id}: {processed}/{total} symbols ({symbol_progress:.1f}%)")

class UniversalScannerEngine:
    """
    Main orchestrator for the Universal Scanner Engine ecosystem
    """

    def __init__(self):
        self.polygon_manager = PolygonAPIManager()
        self.active_executions: Dict[str, ExecutionResult] = {}
        self.execution_history: List[ExecutionResult] = []
        self.progress_callbacks: Dict[str, ProgressCallback] = {}

        # Configuration
        self.max_concurrent_executions = 3
        self.results_cache_hours = 24
        self.auto_cleanup_hours = 48

        logger.info("🚀 Universal Scanner Engine initialized")

    async def execute_scanner(self, request: ScannerExecutionRequest,
                            progress_callback: Optional[Callable] = None) -> ExecutionResult:
        """
        Main entry point for scanner execution
        """
        logger.info(f"🎯 Starting scanner execution: {request.filename} (ID: {request.scanner_id})")

        # Initialize execution tracking
        result = ExecutionResult(
            scanner_id=request.scanner_id,
            status=ExecutionStatus.PENDING,
            start_time=datetime.now()
        )

        self.active_executions[request.scanner_id] = result
        progress = ProgressCallback(request.scanner_id)
        self.progress_callbacks[request.scanner_id] = progress

        try:
            # Phase 1: Classification
            progress.update_phase("classifying", 0)
            result.status = ExecutionStatus.CLASSIFYING

            logger.info(f"🔍 Phase 1: Classifying scanner {request.filename}")
            result.classification = await classify_uploaded_scanner(
                request.code, request.filename
            )

            logger.info(f"✅ Scanner classified as {result.classification.scanner_type.value} "
                       f"({result.classification.confidence_score:.2f} confidence)")
            progress.update_phase("classification_complete", 20)

            # Phase 2: Parameter Extraction
            progress.update_phase("extracting_parameters", 20)
            result.status = ExecutionStatus.EXTRACTING

            logger.info(f"🔧 Phase 2: Extracting parameters")
            result.parameters = await extract_scanner_parameters(
                request.code, request.filename
            )

            logger.info(f"✅ Extracted {len(result.parameters.extracted_params)} parameters "
                       f"({result.parameters.extraction_confidence:.2f} confidence)")
            progress.update_phase("extraction_complete", 40)

            # Phase 3: Resource Allocation
            progress.update_phase("allocating_resources", 40)
            result.status = ExecutionStatus.ALLOCATING

            logger.info(f"⚡ Phase 3: Allocating resources")
            result.allocation = await allocate_scanner_resources(
                result.classification, request.scanner_id
            )

            logger.info(f"✅ Allocated {result.allocation.max_workers} workers "
                       f"with {result.allocation.thread_strategy.value} strategy")
            progress.update_phase("allocation_complete", 60)

            # Phase 4: Scanner Execution
            progress.update_phase("executing_scanner", 60)
            result.status = ExecutionStatus.EXECUTING

            logger.info(f"🚀 Phase 4: Executing scanner")
            scan_results, performance_metrics = await self._execute_scanner_logic(
                request, result, progress
            )

            result.scan_results = scan_results
            result.performance_metrics = performance_metrics
            result.symbols_processed = progress.symbols_processed

            # Completion
            result.status = ExecutionStatus.COMPLETED
            result.end_time = datetime.now()
            result.execution_time_seconds = (result.end_time - result.start_time).total_seconds()

            logger.info(f"✅ Scanner execution completed successfully in {result.execution_time_seconds:.2f}s")
            logger.info(f"📊 Results: {len(scan_results)} matches from {result.symbols_processed} symbols")
            progress.update_phase("completed", 100)

            return result

        except Exception as e:
            logger.error(f"❌ Scanner execution failed: {str(e)}")
            result.status = ExecutionStatus.FAILED
            result.error_message = str(e)
            result.error_details = {
                'exception_type': type(e).__name__,
                'phase': result.status.value
            }
            result.end_time = datetime.now()
            result.execution_time_seconds = (result.end_time - result.start_time).total_seconds()

            progress.update_phase("failed", 0)
            return result

        finally:
            # Cleanup
            if request.scanner_id in self.active_executions:
                self.execution_history.append(self.active_executions[request.scanner_id])
                del self.active_executions[request.scanner_id]

            if request.scanner_id in self.progress_callbacks:
                del self.progress_callbacks[request.scanner_id]

    async def _execute_scanner_logic(self, request: ScannerExecutionRequest,
                                   result: ExecutionResult,
                                   progress: ProgressCallback) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Execute the actual scanner logic with intelligent adaptation
        """
        logger.info("🔧 Adapting scanner for Universal Scanner Engine execution")

        # Prepare execution environment
        scanner_params = self._prepare_scanner_params(request, result)
        symbols = await self._get_symbol_universe(result.classification, scanner_params)

        progress.update_symbols(0, len(symbols))
        logger.info(f"🎯 Processing {len(symbols)} symbols")

        # Execute based on scanner type
        if result.classification.scanner_type == ScannerType.ENTERPRISE:
            return await self._execute_enterprise_scanner(symbols, scanner_params, result, progress)
        elif result.classification.scanner_type == ScannerType.FOCUSED:
            return await self._execute_focused_scanner(symbols, scanner_params, result, progress)
        elif result.classification.scanner_type == ScannerType.DAILY:
            return await self._execute_daily_scanner(symbols, scanner_params, result, progress)
        else:
            return await self._execute_default_scanner(symbols, scanner_params, result, progress)

    def _prepare_scanner_params(self, request: ScannerExecutionRequest,
                              result: ExecutionResult) -> Dict[str, Any]:
        """Prepare unified parameter set for scanner execution"""

        # Start with extracted parameters
        params = result.parameters.extracted_params.copy()

        # Override with user-provided parameters
        if request.user_params:
            params.update(request.user_params)

        # Add system parameters
        params.update({
            'scan_date': request.scan_date or datetime.now().strftime('%Y-%m-%d'),
            'scanner_type': result.classification.scanner_type.value,
            'estimated_symbols': result.classification.estimated_symbols,
            'use_caching': True,
            'max_workers': result.allocation.max_workers,
            'batch_size': result.allocation.batch_size
        })

        logger.info(f"📋 Prepared {len(params)} parameters for execution")
        return params

    async def _get_symbol_universe(self, classification: ScannerProfile,
                                 params: Dict[str, Any]) -> List[str]:
        """Get appropriate symbol universe based on scanner classification"""

        if classification.symbol_strategy == "curated_list":
            # Extract symbols from parameters
            symbols = params.get('symbols', params.get('SYMBOLS', []))
            if isinstance(symbols, str):
                # Handle string-based symbol lists
                symbols = [s.strip().strip("'\"") for s in symbols.split(',') if s.strip()]
            logger.info(f"📋 Using curated symbol list: {len(symbols)} symbols")
            return symbols

        elif classification.symbol_strategy == "full_market":
            # Get full market universe from Polygon
            logger.info("🌍 Fetching full market universe from Polygon")
            return await self.polygon_manager.get_market_universe()

        else:
            # Default to common symbols
            default_symbols = [
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
                'CRM', 'ADBE', 'PYPL', 'INTC', 'AMD', 'SNOW', 'PLTR', 'RBLX'
            ]
            logger.info(f"📋 Using default symbol set: {len(default_symbols)} symbols")
            return default_symbols

    async def _execute_enterprise_scanner(self, symbols: List[str], params: Dict[str, Any],
                                        result: ExecutionResult, progress: ProgressCallback) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Execute enterprise-scale scanner with full backtesting"""

        logger.info("🏢 Executing enterprise scanner with multi-year backtesting")

        # Use date range for backtesting
        end_date = datetime.strptime(params['scan_date'], '%Y-%m-%d')
        start_date = end_date - timedelta(days=int(params.get('backtest_days', 400)))

        async def process_symbol_enterprise(symbol: str) -> Dict[str, Any]:
            """Process single symbol with enterprise logic"""
            try:
                # Get historical data
                data = await self.polygon_manager.get_symbol_data(
                    symbol, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d')
                )

                if not data:
                    return None

                # Apply enterprise analysis logic
                analysis_result = await self._apply_enterprise_analysis(symbol, data, params)

                # Update progress
                current_processed = progress.symbols_processed + 1
                progress.update_symbols(current_processed, len(symbols))

                return analysis_result

            except Exception as e:
                logger.warning(f"⚠️ Failed to process symbol {symbol}: {e}")
                return None

        # Execute with allocated resources
        results = await execute_scanner_with_resources(
            result.allocation,
            process_symbol_enterprise,
            symbols,
            result.scanner_id
        )

        # Filter successful results
        successful_results = [r for r in results if r is not None]

        performance_metrics = {
            'scanner_type': 'enterprise',
            'symbols_requested': len(symbols),
            'symbols_processed': len(results),
            'successful_results': len(successful_results),
            'api_calls': self.polygon_manager.get_api_call_count(),
            'execution_strategy': result.allocation.thread_strategy.value
        }

        return successful_results, performance_metrics

    async def _execute_focused_scanner(self, symbols: List[str], params: Dict[str, Any],
                                     result: ExecutionResult, progress: ProgressCallback) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Execute focused scanner with pattern-specific logic"""

        logger.info("🎯 Executing focused scanner with pattern analysis")

        async def process_symbol_focused(symbol: str) -> Dict[str, Any]:
            """Process single symbol with focused logic"""
            try:
                # Get recent data
                data = await self.polygon_manager.get_symbol_data(
                    symbol, params['scan_date']
                )

                if not data:
                    return None

                # Apply focused analysis logic
                analysis_result = await self._apply_focused_analysis(symbol, data, params)

                # Update progress
                current_processed = progress.symbols_processed + 1
                progress.update_symbols(current_processed, len(symbols))

                return analysis_result

            except Exception as e:
                logger.warning(f"⚠️ Failed to process symbol {symbol}: {e}")
                return None

        # Execute with allocated resources
        results = await execute_scanner_with_resources(
            result.allocation,
            process_symbol_focused,
            symbols,
            result.scanner_id
        )

        # Filter successful results
        successful_results = [r for r in results if r is not None]

        performance_metrics = {
            'scanner_type': 'focused',
            'symbols_requested': len(symbols),
            'symbols_processed': len(results),
            'successful_results': len(successful_results),
            'api_calls': self.polygon_manager.get_api_call_count(),
            'execution_strategy': result.allocation.thread_strategy.value
        }

        return successful_results, performance_metrics

    async def _execute_daily_scanner(self, symbols: List[str], params: Dict[str, Any],
                                   result: ExecutionResult, progress: ProgressCallback) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Execute daily scanner with real-time analysis"""

        logger.info("📅 Executing daily scanner with current market data")

        async def process_symbol_daily(symbol: str) -> Dict[str, Any]:
            """Process single symbol with daily logic"""
            try:
                # Get current day data
                data = await self.polygon_manager.get_symbol_data(
                    symbol, params['scan_date']
                )

                if not data:
                    return None

                # Apply daily analysis logic
                analysis_result = await self._apply_daily_analysis(symbol, data, params)

                # Update progress
                current_processed = progress.symbols_processed + 1
                progress.update_symbols(current_processed, len(symbols))

                return analysis_result

            except Exception as e:
                logger.warning(f"⚠️ Failed to process symbol {symbol}: {e}")
                return None

        # Execute with allocated resources
        results = await execute_scanner_with_resources(
            result.allocation,
            process_symbol_daily,
            symbols,
            result.scanner_id
        )

        # Filter successful results
        successful_results = [r for r in results if r is not None]

        performance_metrics = {
            'scanner_type': 'daily',
            'symbols_requested': len(symbols),
            'symbols_processed': len(results),
            'successful_results': len(successful_results),
            'api_calls': self.polygon_manager.get_api_call_count(),
            'execution_strategy': result.allocation.thread_strategy.value
        }

        return successful_results, performance_metrics

    async def _execute_default_scanner(self, symbols: List[str], params: Dict[str, Any],
                                     result: ExecutionResult, progress: ProgressCallback) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Execute with default analysis logic"""

        logger.info("🔧 Executing with default scanner logic")

        # Default to daily execution
        return await self._execute_daily_scanner(symbols, params, result, progress)

    async def _apply_enterprise_analysis(self, symbol: str, data: List[Dict], params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply enterprise-level analysis logic"""

        # Placeholder for sophisticated enterprise analysis
        # This would integrate the actual LC D2 scan logic

        return {
            'symbol': symbol,
            'analysis_type': 'enterprise',
            'data_points': len(data),
            'patterns_detected': [],
            'confidence_score': 0.0,
            'timestamp': datetime.now().isoformat()
        }

    async def _apply_focused_analysis(self, symbol: str, data: List[Dict], params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply focused pattern analysis logic"""

        # Placeholder for focused pattern analysis
        # This would integrate the actual Backside Para B logic

        return {
            'symbol': symbol,
            'analysis_type': 'focused',
            'data_points': len(data),
            'patterns_detected': [],
            'confidence_score': 0.0,
            'timestamp': datetime.now().isoformat()
        }

    async def _apply_daily_analysis(self, symbol: str, data: List[Dict], params: Dict[str, Any]) -> Dict[str, Any]:
        """Apply daily analysis logic"""

        # Placeholder for daily analysis
        # This would integrate the actual Half A+ scan logic

        return {
            'symbol': symbol,
            'analysis_type': 'daily',
            'data_points': len(data),
            'patterns_detected': [],
            'confidence_score': 0.0,
            'timestamp': datetime.now().isoformat()
        }

    def get_execution_status(self, scanner_id: str) -> Optional[Dict[str, Any]]:
        """Get current execution status"""

        if scanner_id in self.active_executions:
            result = self.active_executions[scanner_id]
            progress = self.progress_callbacks.get(scanner_id)

            return {
                'scanner_id': scanner_id,
                'status': result.status.value,
                'phase': progress.current_phase if progress else 'unknown',
                'progress_percent': progress.progress_percent if progress else 0,
                'symbols_processed': progress.symbols_processed if progress else 0,
                'total_symbols': progress.total_symbols if progress else 0,
                'execution_time': (datetime.now() - result.start_time).total_seconds(),
                'classification': asdict(result.classification) if result.classification else None,
                'allocation': asdict(result.allocation) if result.allocation else None
            }

        # Check execution history
        for result in self.execution_history:
            if result.scanner_id == scanner_id:
                return {
                    'scanner_id': scanner_id,
                    'status': result.status.value,
                    'execution_time': result.execution_time_seconds,
                    'symbols_processed': result.symbols_processed,
                    'results_count': len(result.scan_results) if result.scan_results else 0,
                    'error_message': result.error_message
                }

        return None

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""

        return {
            'active_executions': len(self.active_executions),
            'total_executions_today': len([
                r for r in self.execution_history
                if r.start_time.date() == datetime.now().date()
            ]),
            'successful_executions_today': len([
                r for r in self.execution_history
                if r.start_time.date() == datetime.now().date() and r.status == ExecutionStatus.COMPLETED
            ]),
            'polygon_api_calls_today': self.polygon_manager.get_performance_stats()['total_requests'],
            'system_resources': self._get_system_resource_summary()
        }

    def _get_system_resource_summary(self) -> Dict[str, Any]:
        """Get system resource summary"""

        # Import here to avoid circular dependency
        from ..resource.thread_manager import thread_manager

        return thread_manager.get_system_status()


# Global USE instance
use_engine = UniversalScannerEngine()

async def execute_uploaded_scanner(request: ScannerExecutionRequest) -> ExecutionResult:
    """
    Main entry point for executing uploaded scanners
    """
    return await use_engine.execute_scanner(request)

def get_scanner_status(scanner_id: str) -> Optional[Dict[str, Any]]:
    """
    Get status of a running or completed scanner
    """
    return use_engine.get_execution_status(scanner_id)

def get_system_status() -> Dict[str, Any]:
    """
    Get overall system status
    """
    return use_engine.get_system_status()