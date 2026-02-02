"""
Comprehensive Tests for Scanner Integration System

Tests the scanner loading and execution functionality including:
- Scanner file loading and validation
- Parameter injection and isolation
- Dynamic scanner discovery
- Error handling for invalid scanners
- Performance monitoring
- Security validation
"""

import unittest
import tempfile
import shutil
import json
import os
import sys
import importlib
import ast
import time
from pathlib import Path
from unittest.mock import patch, MagicMock
import hashlib

# Import the modules to test
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from backend.project_composition.scanner_integration import (
    ScannerIntegration,
    ScannerValidationError,
    ScannerExecutionContext,
    ScannerDiscovery
)
from backend.project_composition.parameter_manager import ParameterManager


class TestScannerIntegration(unittest.TestCase):
    """Test cases for ScannerIntegration"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.scanner_integration = ScannerIntegration()
        self.param_manager = ParameterManager()

        # Create test directory structure
        self.scanners_dir = Path(self.test_dir) / "generated_scanners"
        self.params_dir = Path(self.test_dir) / "params"
        self.scanners_dir.mkdir(parents=True, exist_ok=True)
        self.params_dir.mkdir(parents=True, exist_ok=True)

        # Create valid test scanner
        self._create_valid_test_scanner()

        # Create invalid test scanners for error testing
        self._create_invalid_test_scanners()

        # Create test parameter files
        self._create_test_parameter_files()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def _create_valid_test_scanner(self):
        """Create a valid test scanner file"""
        scanner_content = '''
"""
Valid Test Scanner for Integration Testing
"""
import pandas as pd
from datetime import datetime
import logging

# Scanner configuration
SCANNER_CONFIG = {
    'name': 'Valid Test Scanner',
    'version': '1.0.0',
    'description': 'Test scanner for integration testing',
    'requires_isolation': True,
    'expected_parameters': ['lookback_period', 'confidence_threshold'],
    'output_format': 'standard'
}

logger = logging.getLogger(__name__)


def run_scanner(config):
    """
    Main scanner execution function

    Args:
        config (dict): Scanner configuration with parameters

    Returns:
        list: List of signal dictionaries
    """
    try:
        # Validate required parameters
        required_params = ['tickers', 'start_date', 'end_date']
        for param in required_params:
            if param not in config:
                raise ValueError(f"Missing required parameter: {param}")

        # Extract parameters with defaults
        lookback_period = config.get('lookback_period', 20)
        confidence_threshold = config.get('confidence_threshold', 0.7)
        tickers = config.get('tickers', [])

        logger.info(f"Running scanner with {len(tickers)} tickers, lookback={lookback_period}")

        # Generate test signals
        signals = []
        for ticker in tickers[:3]:  # Limit for testing
            signal = {
                'ticker': ticker,
                'date': '2024-10-15',
                'confidence': min(0.95, confidence_threshold + 0.1),
                'signal_type': 'valid_test_signal',
                'scanner_id': 'valid_test_scanner',
                'metadata': {
                    'lookback_period': lookback_period,
                    'confidence_threshold': confidence_threshold,
                    'calculation_time': datetime.now().isoformat(),
                    'parameters_hash': _calculate_parameters_hash(config)
                }
            }
            signals.append(signal)

        logger.info(f"Generated {len(signals)} signals")
        return signals

    except Exception as e:
        logger.error(f"Scanner execution failed: {str(e)}")
        raise


def validate_parameters(params):
    """
    Validate scanner parameters

    Args:
        params (dict): Parameters to validate

    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        # Check required parameters
        if 'lookback_period' in params:
            if not isinstance(params['lookback_period'], (int, float)) or params['lookback_period'] <= 0:
                return False, "lookback_period must be a positive number"

        if 'confidence_threshold' in params:
            if not 0 <= params['confidence_threshold'] <= 1:
                return False, "confidence_threshold must be between 0 and 1"

        return True, None

    except Exception as e:
        return False, f"Parameter validation error: {str(e)}"


def get_scanner_info():
    """
    Get scanner metadata information

    Returns:
        dict: Scanner information
    """
    return {
        'config': SCANNER_CONFIG,
        'parameters': {
            'lookback_period': {'type': 'int', 'default': 20, 'min': 1, 'max': 100},
            'confidence_threshold': {'type': 'float', 'default': 0.7, 'min': 0.0, 'max': 1.0}
        },
        'requirements': ['pandas', 'numpy'],
        'performance': {
            'avg_execution_time': 0.5,
            'memory_usage_mb': 10
        }
    }


def _calculate_parameters_hash(config):
    """Calculate hash of parameters for contamination detection"""
    param_str = json.dumps(config, sort_keys=True)
    return hashlib.md5(param_str.encode()).hexdigest()
'''

        scanner_path = self.scanners_dir / "valid_test_scanner.py"
        with open(scanner_path, "w") as f:
            f.write(scanner_content)

    def _create_invalid_test_scanners(self):
        """Create invalid test scanner files for error testing"""

        # Scanner with syntax error
        syntax_error_content = '''
def run_scanner(config):
    return [  # Missing closing bracket
'''
        with open(self.scanners_dir / "syntax_error_scanner.py", "w") as f:
            f.write(syntax_error_content)

        # Scanner without required function
        no_function_content = '''
# This scanner is missing the run_scanner function
SCANNER_CONFIG = {'name': 'No Function Scanner'}
'''
        with open(self.scanners_dir / "no_function_scanner.py", "w") as f:
            f.write(no_function_content)

        # Scanner that raises exception
        exception_content = '''
def run_scanner(config):
    raise RuntimeError("Test runtime error")
'''
        with open(self.scanners_dir / "exception_scanner.py", "w") as f:
            f.write(exception_content)

        # Scanner with infinite loop (timeout test)
        timeout_content = '''
def run_scanner(config):
    import time
    while True:
        time.sleep(1)  # Infinite loop
'''
        with open(self.scanners_dir / "timeout_scanner.py", "w") as f:
            f.write(timeout_content)

        # Scanner with security issues
        security_content = '''
import os
import subprocess

def run_scanner(config):
    # This would be flagged as security risk
    os.system('rm -rf /')  # Dangerous command
    subprocess.call(['cat', '/etc/passwd'])  # Another security risk
    return []
'''
        with open(self.scanners_dir / "security_risk_scanner.py", "w") as f:
            f.write(security_content)

    def _create_test_parameter_files(self):
        """Create test parameter files"""
        # Valid parameters
        valid_params = {
            "lookback_period": 20,
            "confidence_threshold": 0.75,
            "volume_threshold": 1000000,
            "custom_param": "test_value"
        }

        with open(self.params_dir / "valid_test_scanner.json", "w") as f:
            json.dump(valid_params, f, indent=2)

        # Invalid parameters (for error testing)
        invalid_params = {
            "lookback_period": -5,  # Invalid: negative value
            "confidence_threshold": 1.5,  # Invalid: > 1
            "malformed_param": {"nested": {"too": {"deep": True}}}
        }

        with open(self.params_dir / "invalid_parameters.json", "w") as f:
            json.dump(invalid_params, f, indent=2)

        # Empty parameters
        with open(self.params_dir / "empty_parameters.json", "w") as f:
            json.dump({}, f)

        # Malformed JSON
        with open(self.params_dir / "malformed.json", "w") as f:
            f.write("{ invalid json content")

    def test_valid_scanner_loading(self):
        """Test loading of valid scanner files"""
        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        # Load scanner
        scanner_info = self.scanner_integration.load_scanner(
            scanner_path=scanner_path,
            parameter_path=param_path
        )

        # Validate scanner loading
        self.assertIsNotNone(scanner_info)
        self.assertIn('scanner_module', scanner_info)
        self.assertIn('parameters', scanner_info)
        self.assertIn('metadata', scanner_info)

        # Verify required function exists
        self.assertTrue(hasattr(scanner_info['scanner_module'], 'run_scanner'))

        # Verify parameter loading
        self.assertEqual(scanner_info['parameters']['lookback_period'], 20)
        self.assertEqual(scanner_info['parameters']['confidence_threshold'], 0.75)

    def test_scanner_execution_isolation(self):
        """Test scanner execution with proper isolation"""
        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        # Load and execute scanner
        scanner_info = self.scanner_integration.load_scanner(scanner_path, param_path)

        execution_config = {
            'tickers': ['AAPL', 'GOOGL', 'MSFT'],
            'start_date': '2024-10-01',
            'end_date': '2024-10-15',
            'lookback_period': 25,
            'confidence_threshold': 0.8
        }

        # Execute scanner
        results = self.scanner_integration.execute_scanner(scanner_info, execution_config)

        # Validate results
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)

        # Validate signal structure
        for signal in results:
            self.assertIn('ticker', signal)
            self.assertIn('date', signal)
            self.assertIn('confidence', signal)
            self.assertIn('metadata', signal)

            # Verify parameter injection worked
            self.assertEqual(signal['metadata']['lookback_period'], 25)
            self.assertEqual(signal['metadata']['confidence_threshold'], 0.8)

    def test_parameter_contamination_detection(self):
        """Test parameter contamination detection between scanner executions"""
        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        # Execute scanner with different parameters multiple times
        results = []
        parameter_hashes = []

        for i in range(3):
            scanner_info = self.scanner_integration.load_scanner(scanner_path, param_path)

            execution_config = {
                'tickers': ['AAPL'],
                'start_date': '2024-10-01',
                'end_date': '2024-10-15',
                'lookback_period': 20 + i * 5,  # Different values
                'confidence_threshold': 0.7 + i * 0.1,
                'iteration_marker': f"iteration_{i}"  # Unique marker
            }

            result = self.scanner_integration.execute_scanner(scanner_info, execution_config)
            results.append(result)

            # Extract parameter hash from metadata
            if result and len(result) > 0:
                param_hash = result[0]['metadata'].get('parameters_hash')
                parameter_hashes.append(param_hash)

        # All hashes should be different (no contamination)
        self.assertEqual(len(set(parameter_hashes)), len(parameter_hashes),
                        "Parameter contamination detected: hashes are not unique")

    def test_invalid_scanner_handling(self):
        """Test handling of various invalid scanner types"""

        # Test syntax error scanner
        with self.assertRaises(ScannerValidationError):
            self.scanner_integration.load_scanner(
                str(self.scanners_dir / "syntax_error_scanner.py"),
                str(self.params_dir / "valid_test_scanner.json")
            )

        # Test scanner without required function
        with self.assertRaises(ScannerValidationError):
            self.scanner_integration.load_scanner(
                str(self.scanners_dir / "no_function_scanner.py"),
                str(self.params_dir / "valid_test_scanner.json")
            )

        # Test non-existent file
        with self.assertRaises(FileNotFoundError):
            self.scanner_integration.load_scanner(
                str(self.scanners_dir / "non_existent.py"),
                str(self.params_dir / "valid_test_scanner.json")
            )

    def test_parameter_validation(self):
        """Test parameter validation functionality"""
        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")

        # Test invalid parameters
        with self.assertRaises(ValueError):
            self.scanner_integration.load_scanner(
                scanner_path,
                str(self.params_dir / "invalid_parameters.json")
            )

        # Test malformed JSON
        with self.assertRaises(json.JSONDecodeError):
            self.scanner_integration.load_scanner(
                scanner_path,
                str(self.params_dir / "malformed.json")
            )

        # Test empty parameters (should work with defaults)
        scanner_info = self.scanner_integration.load_scanner(
            scanner_path,
            str(self.params_dir / "empty_parameters.json")
        )
        self.assertIsNotNone(scanner_info)

    def test_security_validation(self):
        """Test security validation of scanner files"""
        security_scanner_path = str(self.scanners_dir / "security_risk_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        # Should detect and reject security risks
        with self.assertRaises(ScannerValidationError) as context:
            self.scanner_integration.load_scanner(
                security_scanner_path,
                param_path,
                security_check=True
            )

        # Error message should indicate security issue
        self.assertIn("security", str(context.exception).lower())

    def test_execution_timeout(self):
        """Test execution timeout for scanners that run too long"""
        timeout_scanner_path = str(self.scanners_dir / "timeout_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        scanner_info = self.scanner_integration.load_scanner(timeout_scanner_path, param_path)

        execution_config = {
            'tickers': ['AAPL'],
            'start_date': '2024-10-01',
            'end_date': '2024-10-15'
        }

        # Should timeout and raise appropriate exception
        with self.assertRaises(TimeoutError):
            self.scanner_integration.execute_scanner(
                scanner_info,
                execution_config,
                timeout_seconds=2
            )

    def test_performance_monitoring(self):
        """Test performance monitoring during scanner execution"""
        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        scanner_info = self.scanner_integration.load_scanner(scanner_path, param_path)

        execution_config = {
            'tickers': ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
            'start_date': '2024-10-01',
            'end_date': '2024-10-15'
        }

        # Execute with performance monitoring
        start_time = time.time()
        results = self.scanner_integration.execute_scanner(
            scanner_info,
            execution_config,
            monitor_performance=True
        )
        execution_time = time.time() - start_time

        # Validate performance data is captured
        self.assertIsNotNone(results)
        self.assertLess(execution_time, 5.0, "Execution took too long")

        # Check if performance metadata is included
        if hasattr(scanner_info, 'performance_data'):
            self.assertIn('execution_time', scanner_info.performance_data)

    def test_concurrent_scanner_loading(self):
        """Test concurrent loading of multiple scanners"""
        from concurrent.futures import ThreadPoolExecutor
        import threading

        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        def load_scanner():
            return self.scanner_integration.load_scanner(scanner_path, param_path)

        # Load scanners concurrently
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(load_scanner) for _ in range(3)]
            results = [future.result() for future in futures]

        # All should load successfully
        self.assertEqual(len(results), 3)
        for result in results:
            self.assertIsNotNone(result)
            self.assertIn('scanner_module', result)

    def test_memory_cleanup(self):
        """Test that scanner loading/unloading properly manages memory"""
        import gc
        import psutil

        process = psutil.Process()
        initial_memory = process.memory_info().rss

        scanner_path = str(self.scanners_dir / "valid_test_scanner.py")
        param_path = str(self.params_dir / "valid_test_scanner.json")

        # Load and unload scanners multiple times
        for i in range(10):
            scanner_info = self.scanner_integration.load_scanner(scanner_path, param_path)

            execution_config = {
                'tickers': ['AAPL'],
                'start_date': '2024-10-01',
                'end_date': '2024-10-15'
            }

            results = self.scanner_integration.execute_scanner(scanner_info, execution_config)

            # Force cleanup
            del scanner_info
            del results
            gc.collect()

        final_memory = process.memory_info().rss
        memory_growth = (final_memory - initial_memory) / 1024 / 1024  # MB

        # Should not have significant memory growth
        self.assertLess(memory_growth, 20, "Excessive memory growth detected")


class TestScannerDiscovery(unittest.TestCase):
    """Test cases for ScannerDiscovery"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.discovery = ScannerDiscovery()

        # Create test scanner files
        self._create_test_scanner_files()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def _create_test_scanner_files(self):
        """Create test scanner files for discovery"""
        scanners_dir = Path(self.test_dir) / "scanners"
        scanners_dir.mkdir(exist_ok=True)

        # Create various scanner files
        scanner_files = [
            ("lc_momentum_d1.py", "LC Momentum D1"),
            ("lc_momentum_d2.py", "LC Momentum D2"),
            ("volume_breakout.py", "Volume Breakout"),
            ("rsi_oversold.py", "RSI Oversold"),
            ("not_a_scanner.txt", None)  # Non-Python file
        ]

        for filename, scanner_name in scanner_files:
            if filename.endswith('.py') and scanner_name:
                content = f'''
SCANNER_CONFIG = {{
    'name': '{scanner_name}',
    'version': '1.0.0'
}}

def run_scanner(config):
    return []
'''
            else:
                content = "This is not a scanner file"

            with open(scanners_dir / filename, "w") as f:
                f.write(content)

    def test_scanner_discovery(self):
        """Test automatic scanner discovery"""
        scanners_dir = Path(self.test_dir) / "scanners"

        discovered_scanners = self.discovery.discover_scanners(str(scanners_dir))

        # Should find 4 Python scanner files
        self.assertEqual(len(discovered_scanners), 4)

        # Verify scanner information
        scanner_names = [s['name'] for s in discovered_scanners]
        expected_names = ["LC Momentum D1", "LC Momentum D2", "Volume Breakout", "RSI Oversold"]

        for name in expected_names:
            self.assertIn(name, scanner_names)

    def test_scanner_validation_during_discovery(self):
        """Test that discovery validates scanners"""
        scanners_dir = Path(self.test_dir) / "scanners"

        # Add invalid scanner
        invalid_scanner = scanners_dir / "invalid.py"
        with open(invalid_scanner, "w") as f:
            f.write("def invalid_function(): pass")  # Missing run_scanner

        # Discovery should filter out invalid scanners
        discovered_scanners = self.discovery.discover_scanners(
            str(scanners_dir),
            validate=True
        )

        # Should still find 4 valid scanners (invalid one filtered out)
        self.assertEqual(len(discovered_scanners), 4)


class TestScannerExecutionContext(unittest.TestCase):
    """Test cases for ScannerExecutionContext"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def test_context_isolation(self):
        """Test execution context provides proper isolation"""
        scanner_path = Path(self.test_dir) / "context_test_scanner.py"

        scanner_content = '''
# Global state that should not persist
GLOBAL_COUNTER = 0

def run_scanner(config):
    global GLOBAL_COUNTER
    GLOBAL_COUNTER += 1
    return [{'counter_value': GLOBAL_COUNTER}]
'''

        with open(scanner_path, "w") as f:
            f.write(scanner_content)

        # Execute multiple times in isolated contexts
        results = []
        for i in range(3):
            with ScannerExecutionContext(str(scanner_path)) as context:
                result = context.execute_scanner({'test': True})
                results.append(result)

        # If properly isolated, counter should reset each time
        counter_values = [r[0]['counter_value'] for r in results]

        # With proper isolation, all should be 1 (reset each time)
        # Without isolation, would be [1, 2, 3]
        self.assertEqual(counter_values, [1, 1, 1],
                        "Context isolation failed - global state persisted")

    def test_context_resource_cleanup(self):
        """Test that context properly cleans up resources"""
        scanner_path = Path(self.test_dir) / "resource_test_scanner.py"

        scanner_content = '''
import tempfile
import os

def run_scanner(config):
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.close()

    return [{'temp_file': temp_file.name}]
'''

        with open(scanner_path, "w") as f:
            f.write(scanner_content)

        temp_files = []

        # Execute in context
        with ScannerExecutionContext(str(scanner_path)) as context:
            result = context.execute_scanner({'test': True})
            temp_files.append(result[0]['temp_file'])

        # Context should clean up temporary files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.unlink(temp_file)  # Manual cleanup for test


if __name__ == '__main__':
    # Run tests with detailed output
    unittest.main(verbosity=2, buffer=True)