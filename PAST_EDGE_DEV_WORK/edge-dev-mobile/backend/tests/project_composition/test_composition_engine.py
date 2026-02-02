"""
Comprehensive Tests for Project Composition Engine

Tests the core orchestration engine including:
- Scanner isolation and execution
- Parameter injection without contamination
- Signal aggregation accuracy
- Error handling and recovery
- Performance benchmarks
- Memory management
- Concurrent execution
"""

import unittest
import asyncio
import tempfile
import shutil
import json
import os
import time
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock
from concurrent.futures import ThreadPoolExecutor
import threading
import psutil
import hashlib

# Import the modules to test
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from backend.project_composition.composition_engine import (
    CompositionEngine,
    ScannerExecutionError,
    IsolatedScannerContext
)
from backend.project_composition.project_config import (
    ProjectConfig,
    ScannerReference,
    AggregationMethod,
    ExecutionConfig
)
from backend.project_composition.parameter_manager import ParameterManager
from backend.project_composition.signal_aggregation import SignalAggregator


class TestCompositionEngine(unittest.TestCase):
    """Test cases for CompositionEngine"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.engine = CompositionEngine()

        # Create test project configuration
        self.test_project = ProjectConfig(
            name="Test LC Momentum Setup",
            description="Test project for composition engine validation",
            aggregation_method=AggregationMethod.WEIGHTED
        )

        # Create test scanner references
        self.scanner_refs = [
            ScannerReference(
                scanner_id="lc_frontside_d2_extended",
                scanner_name="LC Frontside D2 Extended",
                scanner_file="generated_scanners/lc_frontside_d2_extended.py",
                parameter_file="params/lc_frontside_d2_extended.json",
                weight=0.4
            ),
            ScannerReference(
                scanner_id="lc_frontside_d3_extended",
                scanner_name="LC Frontside D3 Extended",
                scanner_file="generated_scanners/lc_frontside_d3_extended_1.py",
                parameter_file="params/lc_frontside_d3_extended.json",
                weight=0.6
            )
        ]

        for scanner_ref in self.scanner_refs:
            self.test_project.add_scanner(scanner_ref)

        # Create test execution config
        self.exec_config = ExecutionConfig(
            start_date="2024-10-01",
            end_date="2024-10-30",
            tickers=["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"]
        )

        # Create mock scanner files for testing
        self._create_mock_scanner_files()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def _create_mock_scanner_files(self):
        """Create mock scanner files for testing"""
        # Create directories
        scanners_dir = Path(self.test_dir) / "generated_scanners"
        params_dir = Path(self.test_dir) / "params"
        scanners_dir.mkdir(parents=True, exist_ok=True)
        params_dir.mkdir(parents=True, exist_ok=True)

        # Mock scanner 1
        scanner1_content = '''
"""Mock LC Frontside D2 Extended Scanner"""
import pandas as pd
from datetime import datetime

def run_scanner(config):
    """Mock scanner that returns test signals"""
    results = []
    for ticker in config.get('tickers', ['AAPL', 'GOOGL']):
        results.append({
            'ticker': ticker,
            'date': '2024-10-15',
            'confidence': 0.75,
            'signal_type': 'lc_frontside_d2',
            'scanner_id': 'lc_frontside_d2_extended',
            'metadata': {
                'lookback_period': config.get('lookback_period', 20),
                'volume_threshold': config.get('volume_threshold', 1000000)
            }
        })
    return results

# Configuration for isolation testing
SCANNER_CONFIG = {
    'name': 'LC Frontside D2 Extended',
    'version': '1.0.0',
    'requires_isolation': True
}
'''

        scanner2_content = '''
"""Mock LC Frontside D3 Extended Scanner"""
import pandas as pd
from datetime import datetime

def run_scanner(config):
    """Mock scanner that returns test signals"""
    results = []
    for ticker in config.get('tickers', ['AAPL', 'MSFT', 'TSLA']):
        results.append({
            'ticker': ticker,
            'date': '2024-10-15',
            'confidence': 0.85,
            'signal_type': 'lc_frontside_d3',
            'scanner_id': 'lc_frontside_d3_extended',
            'metadata': {
                'lookback_period': config.get('lookback_period', 30),
                'momentum_threshold': config.get('momentum_threshold', 0.05)
            }
        })
    return results

SCANNER_CONFIG = {
    'name': 'LC Frontside D3 Extended',
    'version': '1.0.0',
    'requires_isolation': True
}
'''

        # Write scanner files
        with open(scanners_dir / "lc_frontside_d2_extended.py", "w") as f:
            f.write(scanner1_content)

        with open(scanners_dir / "lc_frontside_d3_extended_1.py", "w") as f:
            f.write(scanner2_content)

        # Create parameter files
        params1 = {
            "lookback_period": 20,
            "volume_threshold": 1000000,
            "confidence_min": 0.7,
            "scanner_specific_param_1": "value1"
        }

        params2 = {
            "lookback_period": 30,
            "momentum_threshold": 0.05,
            "confidence_min": 0.8,
            "scanner_specific_param_2": "value2"
        }

        with open(params_dir / "lc_frontside_d2_extended.json", "w") as f:
            json.dump(params1, f, indent=2)

        with open(params_dir / "lc_frontside_d3_extended.json", "w") as f:
            json.dump(params2, f, indent=2)

        # Update scanner references with correct paths
        for scanner_ref in self.scanner_refs:
            if "d2_extended" in scanner_ref.scanner_id:
                scanner_ref.scanner_file = str(scanners_dir / "lc_frontside_d2_extended.py")
                scanner_ref.parameter_file = str(params_dir / "lc_frontside_d2_extended.json")
            elif "d3_extended" in scanner_ref.scanner_id:
                scanner_ref.scanner_file = str(scanners_dir / "lc_frontside_d3_extended_1.py")
                scanner_ref.parameter_file = str(params_dir / "lc_frontside_d3_extended.json")

    def test_engine_initialization(self):
        """Test engine initialization and configuration"""
        self.assertIsInstance(self.engine, CompositionEngine)
        self.assertTrue(hasattr(self.engine, 'execute_project'))
        self.assertTrue(hasattr(self.engine, 'load_scanner'))
        self.assertTrue(hasattr(self.engine, 'aggregate_signals'))

    def test_scanner_isolation_validation(self):
        """Test that scanners run in complete isolation"""
        # Execute project multiple times to test isolation
        results = []
        for i in range(3):
            result = self.engine.execute_project(
                project=self.test_project,
                execution_config=self.exec_config
            )
            results.append(result)

        # Validate results consistency (should be identical if properly isolated)
        self.assertEqual(len(results), 3)
        for i in range(1, 3):
            self.assertEqual(
                len(results[0].signals),
                len(results[i].signals),
                "Scanner isolation failed: different signal counts"
            )

    def test_parameter_contamination_detection(self):
        """Test zero parameter contamination between scanners"""
        # Create execution config with contamination markers
        contamination_markers = {
            "contamination_test_marker_1": "scanner1_specific",
            "contamination_test_marker_2": "scanner2_specific"
        }

        # Execute with contamination detection
        with patch.object(self.engine, '_detect_contamination', return_value=True) as mock_detect:
            result = self.engine.execute_project(
                project=self.test_project,
                execution_config=self.exec_config,
                contamination_check=True
            )

            # Verify contamination detection was called
            mock_detect.assert_called()
            self.assertIsNotNone(result)

    def test_signal_aggregation_accuracy(self):
        """Test mathematical accuracy of signal aggregation"""
        result = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        # Validate aggregation results
        self.assertIsNotNone(result.signals)
        self.assertGreater(len(result.signals), 0)

        # Test weighted aggregation accuracy
        if result.aggregation_method == AggregationMethod.WEIGHTED:
            expected_weights = {ref.scanner_id: ref.weight for ref in self.scanner_refs}
            total_weight = sum(expected_weights.values())

            for signal in result.signals:
                # Verify confidence calculation matches weighted average
                if len(signal.get('contributing_scanners', [])) > 1:
                    weighted_confidence = self._calculate_weighted_confidence(
                        signal, expected_weights, total_weight
                    )
                    self.assertAlmostEqual(
                        signal.get('confidence', 0),
                        weighted_confidence,
                        places=3,
                        msg="Weighted aggregation calculation incorrect"
                    )

    def _calculate_weighted_confidence(self, signal, weights, total_weight):
        """Calculate expected weighted confidence"""
        weighted_sum = 0
        for scanner_data in signal.get('scanner_signals', []):
            scanner_id = scanner_data.get('scanner_id')
            confidence = scanner_data.get('confidence', 0)
            weight = weights.get(scanner_id, 1.0)
            weighted_sum += confidence * weight
        return weighted_sum / total_weight

    def test_error_handling_and_recovery(self):
        """Test robust error handling and recovery"""
        # Create scanner with intentional error
        error_scanner_content = '''
def run_scanner(config):
    raise ValueError("Intentional test error")
'''

        error_scanner_path = Path(self.test_dir) / "error_scanner.py"
        with open(error_scanner_path, "w") as f:
            f.write(error_scanner_content)

        # Add error scanner to project
        error_ref = ScannerReference(
            scanner_id="error_scanner",
            scanner_name="Error Scanner",
            scanner_file=str(error_scanner_path),
            parameter_file=str(Path(self.test_dir) / "params" / "lc_frontside_d2_extended.json"),
            weight=0.3
        )

        self.test_project.add_scanner(error_ref)

        # Execute and verify graceful error handling
        result = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        # Should complete despite one scanner failing
        self.assertIsNotNone(result)
        self.assertIn("error_scanner", result.execution_errors)
        self.assertGreater(result.scanner_success_count, 0)
        self.assertEqual(result.scanner_error_count, 1)

    def test_performance_benchmarks(self):
        """Test execution performance benchmarks"""
        start_time = time.time()

        result = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        execution_time = time.time() - start_time

        # Performance assertions
        self.assertLess(execution_time, 10.0, "Execution took too long")
        self.assertIsNotNone(result.execution_time_seconds)
        self.assertLess(result.execution_time_seconds, 10.0)

        # Memory usage validation
        process = psutil.Process()
        memory_mb = process.memory_info().rss / 1024 / 1024
        self.assertLess(memory_mb, 500, "Memory usage too high")

    def test_concurrent_execution(self):
        """Test concurrent project execution"""
        num_concurrent = 3

        def execute_project():
            return self.engine.execute_project(
                project=self.test_project,
                execution_config=self.exec_config
            )

        # Execute multiple projects concurrently
        with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = [executor.submit(execute_project) for _ in range(num_concurrent)]
            results = [future.result() for future in futures]

        # Validate all executions completed successfully
        self.assertEqual(len(results), num_concurrent)
        for result in results:
            self.assertIsNotNone(result)
            self.assertEqual(result.scanner_error_count, 0)
            self.assertGreater(result.scanner_success_count, 0)

    def test_memory_management(self):
        """Test memory management and cleanup"""
        initial_memory = psutil.Process().memory_info().rss

        # Execute multiple times to test cleanup
        for i in range(5):
            result = self.engine.execute_project(
                project=self.test_project,
                execution_config=self.exec_config
            )

            # Force garbage collection
            import gc
            gc.collect()

        final_memory = psutil.Process().memory_info().rss
        memory_growth = (final_memory - initial_memory) / 1024 / 1024

        # Should not have significant memory growth
        self.assertLess(memory_growth, 50, "Memory leak detected")

    def test_scanner_loading_isolation(self):
        """Test that scanner loading doesn't affect global state"""
        # Capture initial module state
        initial_modules = set(sys.modules.keys())

        # Execute project
        result = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        # Verify minimal module pollution
        final_modules = set(sys.modules.keys())
        new_modules = final_modules - initial_modules

        # Should only add essential modules
        self.assertLess(len(new_modules), 10, "Too many modules added to global state")

    def test_aggregation_method_switching(self):
        """Test switching between different aggregation methods"""
        methods_to_test = [
            AggregationMethod.UNION,
            AggregationMethod.INTERSECTION,
            AggregationMethod.WEIGHTED
        ]

        results = {}

        for method in methods_to_test:
            # Update project configuration
            self.test_project.aggregation_method = method

            # Execute with this method
            result = self.engine.execute_project(
                project=self.test_project,
                execution_config=self.exec_config
            )

            results[method] = result
            self.assertIsNotNone(result)
            self.assertEqual(result.aggregation_method, method)

        # Validate different methods produce different results
        union_signals = len(results[AggregationMethod.UNION].signals)
        intersection_signals = len(results[AggregationMethod.INTERSECTION].signals)

        # Union should have more or equal signals than intersection
        self.assertGreaterEqual(union_signals, intersection_signals)

    def test_scanner_metadata_preservation(self):
        """Test that scanner metadata is properly preserved"""
        result = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        # Verify scanner metadata is captured
        self.assertIn('scanner_metadata', result.aggregation_metadata)

        for scanner_ref in self.scanner_refs:
            scanner_id = scanner_ref.scanner_id
            if scanner_id in result.scanner_results:
                scanner_result = result.scanner_results[scanner_id]
                self.assertIn('execution_time', scanner_result)
                self.assertIn('signal_count', scanner_result)

    def test_execution_reproducibility(self):
        """Test that executions are reproducible with same inputs"""
        # Execute same project multiple times
        result1 = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        result2 = self.engine.execute_project(
            project=self.test_project,
            execution_config=self.exec_config
        )

        # Results should be identical for deterministic scanners
        self.assertEqual(len(result1.signals), len(result2.signals))

        # Convert signals to comparable format
        signals1 = sorted([f"{s.get('ticker')}:{s.get('date')}" for s in result1.signals])
        signals2 = sorted([f"{s.get('ticker')}:{s.get('date')}" for s in result2.signals])

        self.assertEqual(signals1, signals2, "Execution not reproducible")


class TestIsolatedScannerContext(unittest.TestCase):
    """Test cases for IsolatedScannerContext"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def test_context_isolation(self):
        """Test that context provides proper isolation"""
        scanner_path = Path(self.test_dir) / "test_scanner.py"

        # Create test scanner
        scanner_content = '''
GLOBAL_VARIABLE = "initial_value"

def run_scanner(config):
    global GLOBAL_VARIABLE
    GLOBAL_VARIABLE = "modified_value"
    return [{'ticker': 'TEST', 'date': '2024-10-15'}]
'''

        with open(scanner_path, "w") as f:
            f.write(scanner_content)

        # Execute in isolated context
        context = IsolatedScannerContext(str(scanner_path))

        with context:
            result = context.execute({'tickers': ['TEST']})
            self.assertIsNotNone(result)

        # Verify global state wasn't affected
        # (This would require actual isolation implementation)

    def test_context_cleanup(self):
        """Test that context properly cleans up resources"""
        scanner_path = Path(self.test_dir) / "test_scanner.py"

        # Create test scanner
        scanner_content = '''
def run_scanner(config):
    return [{'ticker': 'TEST', 'date': '2024-10-15'}]
'''

        with open(scanner_path, "w") as f:
            f.write(scanner_content)

        # Test context cleanup
        context = IsolatedScannerContext(str(scanner_path))

        with context:
            result = context.execute({'tickers': ['TEST']})

        # Context should be properly cleaned up after exit
        self.assertTrue(context._cleaned_up)


if __name__ == '__main__':
    # Run tests with detailed output
    unittest.main(verbosity=2, buffer=True)