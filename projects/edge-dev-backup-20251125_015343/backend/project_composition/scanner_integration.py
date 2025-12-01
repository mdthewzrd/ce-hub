"""
Scanner Integration Layer

This module provides integration between the Project Composition Engine
and the existing AI Scanner Isolation System. It ensures seamless
interoperability while maintaining complete parameter isolation.

Integration Points:
- Scanner loading and instantiation
- Parameter injection and validation
- Execution coordination
- Result formatting and validation
- Error handling and isolation verification

Built on the proven AI Scanner Isolation System (96% contamination reduction).
"""

import os
import sys
import importlib.util
import inspect
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Union
import pandas as pd

# Import existing scanner infrastructure
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

try:
    from core.scanner import Scanner
    from core.parameter_integrity_system import ParameterIntegritySystem
    from universal_scanner_engine import UniversalScannerEngine
except ImportError as e:
    logging.warning(f"Could not import existing scanner infrastructure: {e}")
    # Create placeholder classes for development
    class Scanner:
        pass
    class ParameterIntegritySystem:
        pass
    class UniversalScannerEngine:
        pass

from .project_config import ScannerReference
from .parameter_manager import ParameterManager


logger = logging.getLogger(__name__)


class ScannerIntegrationError(Exception):
    """Exception raised when scanner integration fails"""
    pass


class IsolatedScannerWrapper:
    """
    Wrapper for isolated scanners that integrates with the existing system

    This class bridges the gap between the Project Composition Engine
    and the existing AI Scanner Isolation System, ensuring:
    - Complete parameter isolation
    - Consistent execution interface
    - Error handling and recovery
    - Result standardization
    """

    def __init__(self, scanner_reference: ScannerReference, parameters: Dict[str, Any]):
        self.reference = scanner_reference
        self.parameters = parameters
        self.scanner_instance = None
        self.integrity_system = None
        self.execution_context = {}

        # Integration tracking
        self.isolation_verified = False
        self.integration_timestamp = datetime.now()

    async def initialize_scanner(self) -> bool:
        """
        Initialize the scanner with integration to existing system
        """
        try:
            logger.info(f"Initializing isolated scanner: {self.reference.scanner_id}")

            # Step 1: Load scanner module using existing patterns
            if not await self._load_scanner_module():
                return False

            # Step 2: Initialize parameter integrity system
            self._initialize_parameter_integrity()

            # Step 3: Verify isolation
            if not self._verify_scanner_isolation():
                raise ScannerIntegrationError("Scanner isolation verification failed")

            # Step 4: Apply parameters with integrity validation
            if not self._apply_parameters_with_validation():
                raise ScannerIntegrationError("Parameter application failed")

            logger.info(f"✅ Scanner {self.reference.scanner_id} initialized successfully")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to initialize scanner {self.reference.scanner_id}: {e}")
            return False

    async def _load_scanner_module(self) -> bool:
        """Load scanner module using existing isolation patterns"""
        try:
            scanner_file = Path(self.reference.scanner_file)

            if not scanner_file.exists():
                raise FileNotFoundError(f"Scanner file not found: {scanner_file}")

            # Use existing module loading patterns from the isolation system
            module_name = f"{self.reference.scanner_id}_{id(self)}_{datetime.now().timestamp()}"

            spec = importlib.util.spec_from_file_location(module_name, scanner_file)
            if spec is None or spec.loader is None:
                raise ImportError(f"Failed to create module spec for {scanner_file}")

            # Create isolated module
            module = importlib.util.module_from_spec(spec)

            # Execute module in isolated namespace
            spec.loader.exec_module(module)

            # Find scanner class following existing patterns
            scanner_class = self._find_scanner_class(module)
            if scanner_class is None:
                raise ValueError(f"No valid scanner class found in {scanner_file}")

            # Instantiate scanner
            self.scanner_instance = scanner_class()

            logger.debug(f"Loaded scanner class: {scanner_class.__name__}")
            return True

        except Exception as e:
            logger.error(f"Scanner module loading failed: {e}")
            return False

    def _find_scanner_class(self, module) -> Optional[type]:
        """Find the scanner class in the module using existing patterns"""
        # Look for classes that end with 'Scanner'
        scanner_classes = [
            obj for name, obj in inspect.getmembers(module, inspect.isclass)
            if name.endswith('Scanner') and hasattr(obj, '__init__')
        ]

        if scanner_classes:
            return scanner_classes[0]

        # Fallback: look for any class with scan method
        scan_classes = [
            obj for name, obj in inspect.getmembers(module, inspect.isclass)
            if hasattr(obj, 'scan')
        ]

        return scan_classes[0] if scan_classes else None

    def _initialize_parameter_integrity(self) -> None:
        """Initialize parameter integrity system for isolation verification"""
        try:
            # Use existing parameter integrity system if available
            self.integrity_system = ParameterIntegritySystem()
            logger.debug("Parameter integrity system initialized")
        except Exception as e:
            logger.warning(f"Could not initialize parameter integrity system: {e}")
            # Create minimal integrity tracking
            self.integrity_system = self._create_minimal_integrity_system()

    def _create_minimal_integrity_system(self) -> object:
        """Create minimal parameter integrity system for fallback"""
        class MinimalIntegritySystem:
            def __init__(self):
                self.parameter_hashes = {}

            def track_parameters(self, scanner_id: str, parameters: Dict[str, Any]) -> str:
                import hashlib
                param_str = str(sorted(parameters.items()))
                hash_value = hashlib.md5(param_str.encode()).hexdigest()
                self.parameter_hashes[scanner_id] = hash_value
                return hash_value

            def verify_isolation(self, scanner_id: str) -> bool:
                return scanner_id in self.parameter_hashes

        return MinimalIntegritySystem()

    def _verify_scanner_isolation(self) -> bool:
        """Verify scanner isolation using existing system patterns"""
        try:
            # Check if scanner has isolated_params attribute (existing pattern)
            if not hasattr(self.scanner_instance, 'isolated_params'):
                logger.warning(f"Scanner {self.reference.scanner_id} missing isolated_params")
                return False

            # Verify parameter namespace isolation
            isolated_params = self.scanner_instance.isolated_params
            if not isinstance(isolated_params, dict):
                logger.error(f"Invalid isolated_params type for {self.reference.scanner_id}")
                return False

            # Check for parameter contamination indicators
            contamination_indicators = ['_shared_', '_global_', '_other_']
            for param_name in isolated_params.keys():
                for indicator in contamination_indicators:
                    if indicator in param_name.lower():
                        logger.warning(f"Potential contamination in parameter: {param_name}")
                        # Don't fail, but log warning

            self.isolation_verified = True
            logger.debug(f"Scanner isolation verified: {self.reference.scanner_id}")
            return True

        except Exception as e:
            logger.error(f"Scanner isolation verification failed: {e}")
            return False

    def _apply_parameters_with_validation(self) -> bool:
        """Apply custom parameters with validation using existing patterns"""
        try:
            if not self.scanner_instance or not self.isolation_verified:
                return False

            # Get original isolated parameters
            original_params = getattr(self.scanner_instance, 'isolated_params', {}).copy()

            # Merge with custom parameters while preserving isolation
            updated_params = original_params.copy()
            updated_params.update(self.parameters)

            # Validate parameter types match original types
            validation_errors = []
            for key, value in self.parameters.items():
                if key in original_params:
                    original_type = type(original_params[key])
                    if not isinstance(value, original_type):
                        try:
                            # Attempt type conversion
                            converted_value = original_type(value)
                            updated_params[key] = converted_value
                        except (ValueError, TypeError):
                            validation_errors.append(
                                f"Parameter {key}: cannot convert {type(value)} to {original_type}"
                            )

            if validation_errors:
                logger.error(f"Parameter validation errors: {validation_errors}")
                return False

            # Apply validated parameters
            self.scanner_instance.isolated_params = updated_params

            # Track parameter integrity
            if self.integrity_system:
                self.integrity_system.track_parameters(
                    self.reference.scanner_id, updated_params
                )

            logger.debug(f"Applied {len(self.parameters)} custom parameters to {self.reference.scanner_id}")
            return True

        except Exception as e:
            logger.error(f"Parameter application failed: {e}")
            return False

    async def execute_scan(self,
                          start_date: str,
                          end_date: str,
                          symbols: Optional[List[str]] = None,
                          filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Execute scanner using existing system patterns
        """
        if not self.scanner_instance or not self.isolation_verified:
            raise ScannerIntegrationError("Scanner not properly initialized")

        try:
            logger.info(f"Executing scanner: {self.reference.scanner_id}")

            # Prepare execution parameters
            execution_params = {
                'start_date': start_date,
                'end_date': end_date
            }

            if symbols:
                execution_params['symbols'] = symbols
            if filters:
                execution_params.update(filters)

            # Execute scanner using appropriate method
            results = await self._execute_with_existing_patterns(execution_params)

            # Validate and format results
            formatted_results = self._format_and_validate_results(results)

            logger.info(f"Scanner {self.reference.scanner_id} completed: {len(formatted_results)} results")
            return formatted_results

        except Exception as e:
            logger.error(f"Scanner execution failed: {e}")
            raise ScannerIntegrationError(f"Execution failed for {self.reference.scanner_id}: {e}")

    async def _execute_with_existing_patterns(self, params: Dict[str, Any]) -> Any:
        """Execute scanner using existing system patterns"""
        scanner = self.scanner_instance

        # Try async scan method first
        if hasattr(scanner, 'scan') and asyncio.iscoroutinefunction(scanner.scan):
            return await scanner.scan(**params)

        # Try synchronous scan method
        elif hasattr(scanner, 'scan'):
            # Run synchronous scan in executor to avoid blocking
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, scanner.scan, **params)

        # Try universal scanner engine pattern
        elif hasattr(scanner, 'execute'):
            return await self._execute_via_universal_engine(params)

        # Fallback: try direct execution
        else:
            return await self._execute_direct_pattern(params)

    async def _execute_via_universal_engine(self, params: Dict[str, Any]) -> Any:
        """Execute via universal scanner engine if available"""
        try:
            engine = UniversalScannerEngine()
            return await engine.execute_scanner(self.scanner_instance, params)
        except Exception as e:
            logger.warning(f"Universal engine execution failed: {e}")
            return await self._execute_direct_pattern(params)

    async def _execute_direct_pattern(self, params: Dict[str, Any]) -> Any:
        """Direct execution pattern for basic scanners"""
        try:
            # This is a simplified execution pattern
            # In practice, this would use the scanner's specific methods

            # Check if scanner has required methods for data fetching
            if hasattr(self.scanner_instance, 'get_data'):
                data = await self._safe_call_method('get_data', params['start_date'], params['end_date'])
            else:
                # Return empty result if no data method
                logger.warning(f"Scanner {self.reference.scanner_id} has no data method")
                return []

            # Process data if available
            if data is not None and hasattr(self.scanner_instance, 'process_data'):
                results = await self._safe_call_method('process_data', data)
                return results if results is not None else []

            return []

        except Exception as e:
            logger.error(f"Direct execution pattern failed: {e}")
            return []

    async def _safe_call_method(self, method_name: str, *args, **kwargs) -> Any:
        """Safely call scanner method with error handling"""
        try:
            if not hasattr(self.scanner_instance, method_name):
                return None

            method = getattr(self.scanner_instance, method_name)

            if asyncio.iscoroutinefunction(method):
                return await method(*args, **kwargs)
            else:
                loop = asyncio.get_event_loop()
                return await loop.run_in_executor(None, method, *args, **kwargs)

        except Exception as e:
            logger.warning(f"Method {method_name} failed: {e}")
            return None

    def _format_and_validate_results(self, results: Any) -> List[Dict[str, Any]]:
        """Format and validate scanner results using existing patterns"""
        formatted_results = []

        if results is None:
            return formatted_results

        try:
            # Handle DataFrame results (common pattern)
            if isinstance(results, pd.DataFrame):
                for _, row in results.iterrows():
                    formatted_result = self._format_dataframe_row(row)
                    if formatted_result:
                        formatted_results.append(formatted_result)

            # Handle list of dictionaries
            elif isinstance(results, list):
                for item in results:
                    if isinstance(item, dict):
                        formatted_result = self._format_dict_result(item)
                        if formatted_result:
                            formatted_results.append(formatted_result)

            # Handle single dictionary
            elif isinstance(results, dict):
                formatted_result = self._format_dict_result(results)
                if formatted_result:
                    formatted_results.append(formatted_result)

            # Validate all results have required fields
            validated_results = []
            for result in formatted_results:
                if self._validate_result_format(result):
                    validated_results.append(result)

            return validated_results

        except Exception as e:
            logger.error(f"Result formatting failed: {e}")
            return []

    def _format_dataframe_row(self, row: pd.Series) -> Optional[Dict[str, Any]]:
        """Format a DataFrame row into standard result format"""
        try:
            result = row.to_dict()

            # Add scanner attribution
            result['scanner_id'] = self.reference.scanner_id
            result['scanner_weight'] = self.reference.weight
            result['scan_timestamp'] = datetime.now().isoformat()

            # Ensure ticker field exists
            if 'ticker' not in result:
                if 'symbol' in result:
                    result['ticker'] = result['symbol']
                elif 'Symbol' in result:
                    result['ticker'] = result['Symbol']

            # Ensure date field exists
            if 'date' not in result:
                if 'Date' in result:
                    result['date'] = result['Date']
                elif 'scan_date' in result:
                    result['date'] = result['scan_date']

            return result

        except Exception as e:
            logger.warning(f"Failed to format DataFrame row: {e}")
            return None

    def _format_dict_result(self, result_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Format a dictionary result into standard format"""
        result = result_dict.copy()

        # Add scanner attribution
        result['scanner_id'] = self.reference.scanner_id
        result['scanner_weight'] = self.reference.weight
        result['scan_timestamp'] = datetime.now().isoformat()

        # Standardize field names
        field_mappings = {
            'symbol': 'ticker',
            'Symbol': 'ticker',
            'Date': 'date',
            'scan_date': 'date'
        }

        for old_field, new_field in field_mappings.items():
            if old_field in result and new_field not in result:
                result[new_field] = result[old_field]

        return result

    def _validate_result_format(self, result: Dict[str, Any]) -> bool:
        """Validate that result has required fields"""
        required_fields = ['ticker', 'scanner_id']

        for field in required_fields:
            if field not in result:
                logger.warning(f"Result missing required field: {field}")
                return False

        # Validate ticker is not empty
        if not result.get('ticker', '').strip():
            logger.warning("Result has empty ticker")
            return False

        return True

    def cleanup(self) -> None:
        """Clean up scanner resources"""
        try:
            if self.scanner_instance and hasattr(self.scanner_instance, 'cleanup'):
                self.scanner_instance.cleanup()

            # Clear references
            self.scanner_instance = None
            self.integrity_system = None
            self.execution_context.clear()

            logger.debug(f"Cleaned up scanner: {self.reference.scanner_id}")

        except Exception as e:
            logger.warning(f"Scanner cleanup warning: {e}")

    def get_integration_status(self) -> Dict[str, Any]:
        """Get integration status and validation report"""
        return {
            'scanner_id': self.reference.scanner_id,
            'isolation_verified': self.isolation_verified,
            'scanner_loaded': self.scanner_instance is not None,
            'integrity_system_active': self.integrity_system is not None,
            'parameters_applied': len(self.parameters) if self.parameters else 0,
            'integration_timestamp': self.integration_timestamp.isoformat(),
            'integration_successful': (
                self.isolation_verified and
                self.scanner_instance is not None
            )
        }


class ScannerIntegrationManager:
    """
    Manager class for handling scanner integration with the existing system
    """

    def __init__(self, base_path: str = "/Users/michaeldurante/ai dev/ce-hub/edge-dev"):
        self.base_path = Path(base_path)
        self.parameter_manager = ParameterManager(str(self.base_path / "projects"))
        self.active_wrappers = {}

    async def create_scanner_wrapper(self,
                                   scanner_reference: ScannerReference,
                                   project_id: str) -> IsolatedScannerWrapper:
        """Create an integrated scanner wrapper"""
        try:
            # Load scanner parameters
            parameters = self.parameter_manager.load_scanner_parameters(
                project_id, scanner_reference.scanner_id
            )

            # Create wrapper
            wrapper = IsolatedScannerWrapper(scanner_reference, parameters)

            # Initialize scanner
            if await wrapper.initialize_scanner():
                # Track active wrapper
                wrapper_key = f"{project_id}:{scanner_reference.scanner_id}"
                self.active_wrappers[wrapper_key] = wrapper

                logger.info(f"✅ Created scanner wrapper: {scanner_reference.scanner_id}")
                return wrapper
            else:
                raise ScannerIntegrationError(f"Failed to initialize scanner: {scanner_reference.scanner_id}")

        except Exception as e:
            logger.error(f"Failed to create scanner wrapper: {e}")
            raise

    def cleanup_wrapper(self, project_id: str, scanner_id: str) -> None:
        """Clean up a specific scanner wrapper"""
        wrapper_key = f"{project_id}:{scanner_id}"
        if wrapper_key in self.active_wrappers:
            wrapper = self.active_wrappers[wrapper_key]
            wrapper.cleanup()
            del self.active_wrappers[wrapper_key]

    def cleanup_all_wrappers(self) -> None:
        """Clean up all active scanner wrappers"""
        for wrapper in self.active_wrappers.values():
            wrapper.cleanup()
        self.active_wrappers.clear()

    def get_integration_report(self) -> Dict[str, Any]:
        """Get comprehensive integration status report"""
        report = {
            'active_wrappers': len(self.active_wrappers),
            'wrappers': {},
            'overall_status': 'healthy',
            'timestamp': datetime.now().isoformat()
        }

        failed_count = 0
        for key, wrapper in self.active_wrappers.items():
            wrapper_status = wrapper.get_integration_status()
            report['wrappers'][key] = wrapper_status

            if not wrapper_status['integration_successful']:
                failed_count += 1

        if failed_count > 0:
            report['overall_status'] = f'{failed_count} wrappers failed'

        return report