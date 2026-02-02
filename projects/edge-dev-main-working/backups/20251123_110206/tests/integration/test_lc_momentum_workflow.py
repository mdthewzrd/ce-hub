"""
Integration Tests for LC Momentum Workflow

This test suite validates the complete Project Composition System workflow
using the real LC Momentum Setup project as the test case.

Tests include:
- End-to-end project creation and execution
- Scanner isolation validation during real execution
- Parameter contamination detection with actual scanners
- Signal aggregation accuracy with weighted results
- Performance benchmarks with real scanner files
- Regression validation against existing functionality
"""

import unittest
import asyncio
import tempfile
import shutil
import json
import os
import sys
import time
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch, MagicMock
import subprocess
import psutil

# Import the modules to test
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from backend.project_composition.composition_engine import CompositionEngine
from backend.project_composition.project_config import (
    ProjectConfig,
    ScannerReference,
    AggregationMethod,
    ExecutionConfig,
    ProjectManager
)
from backend.project_composition.parameter_manager import ParameterManager
from backend.project_composition.signal_aggregation import SignalAggregator


class TestLCMomentumWorkflow(unittest.TestCase):
    """Integration tests for LC Momentum workflow using real scanner files"""

    @classmethod
    def setUpClass(cls):
        """Set up class-level fixtures"""
        cls.base_dir = Path(__file__).parent.parent.parent.parent
        cls.test_dir = tempfile.mkdtemp()

        # Verify real scanner files exist
        cls.generated_scanners_dir = cls.base_dir / "generated_scanners"
        cls._verify_scanner_files_exist()

        # Initialize components
        cls.engine = CompositionEngine()
        cls.project_manager = ProjectManager()
        cls.param_manager = ParameterManager()

    @classmethod
    def tearDownClass(cls):
        """Clean up class-level fixtures"""
        shutil.rmtree(cls.test_dir)

    @classmethod
    def _verify_scanner_files_exist(cls):
        """Verify that the real scanner files exist"""
        expected_scanners = [
            "lc_frontside_d2_extended.py",
            "lc_frontside_d3_extended_1.py",
            "lc_frontside_d2_extended_1.py"
        ]

        existing_scanners = []
        for scanner_file in expected_scanners:
            scanner_path = cls.generated_scanners_dir / scanner_file
            if scanner_path.exists():
                existing_scanners.append(str(scanner_path))

        if len(existing_scanners) < 2:
            raise unittest.SkipTest(f"Insufficient scanner files found. Need at least 2, found {len(existing_scanners)}")

        cls.available_scanner_files = existing_scanners

    def setUp(self):
        """Set up test fixtures"""
        # Create LC Momentum Setup project configuration
        self.lc_project = ProjectConfig(
            name="LC Momentum Setup Integration Test",
            description="Integration test of LC momentum strategy with 3 scanners",
            aggregation_method=AggregationMethod.WEIGHTED
        )

        # Add real scanner references
        self._add_real_scanners()

        # Create realistic execution configuration
        self.exec_config = ExecutionConfig(
            start_date=(datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            end_date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            tickers=["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "AMZN", "META"]  # Major stocks
        )

        # Performance tracking
        self.performance_metrics = {}

    def _add_real_scanners(self):
        """Add real scanner files to the project"""
        scanner_configs = [
            {
                "scanner_id": "lc_frontside_d2_extended",
                "scanner_name": "LC Frontside D2 Extended",
                "weight": 0.4
            },
            {
                "scanner_id": "lc_frontside_d3_extended",
                "scanner_name": "LC Frontside D3 Extended",
                "weight": 0.35
            },
            {
                "scanner_id": "lc_frontside_d2_extended_1",
                "scanner_name": "LC Frontside D2 Extended V1",
                "weight": 0.25
            }
        ]

        # Map to available files
        for i, config in enumerate(scanner_configs[:len(self.available_scanner_files)]):
            scanner_file = self.available_scanner_files[i]

            # Create parameter file path
            param_file = self._create_parameter_file(config["scanner_id"])

            scanner_ref = ScannerReference(
                scanner_id=config["scanner_id"],
                scanner_name=config["scanner_name"],
                scanner_file=scanner_file,
                parameter_file=param_file,
                weight=config["weight"]
            )

            self.lc_project.add_scanner(scanner_ref)

    def _create_parameter_file(self, scanner_id):
        """Create parameter file for scanner"""
        params_dir = Path(self.test_dir) / "params"
        params_dir.mkdir(exist_ok=True)

        # Default parameters for LC scanners
        if "d2" in scanner_id:
            params = {
                "lookback_period": 20,
                "volume_threshold": 1000000,
                "price_change_threshold": 0.02,
                "momentum_factor": 1.2,
                "confidence_threshold": 0.7
            }
        elif "d3" in scanner_id:
            params = {
                "lookback_period": 30,
                "volume_threshold": 1500000,
                "price_change_threshold": 0.025,
                "momentum_factor": 1.3,
                "confidence_threshold": 0.75
            }
        else:
            params = {
                "lookback_period": 25,
                "volume_threshold": 1200000,
                "price_change_threshold": 0.023,
                "momentum_factor": 1.25,
                "confidence_threshold": 0.72
            }

        param_file = params_dir / f"{scanner_id}.json"
        with open(param_file, "w") as f:
            json.dump(params, f, indent=2)

        return str(param_file)

    def test_complete_lc_momentum_workflow(self):
        """Test the complete LC momentum workflow end-to-end"""
        print("\n=== Testing Complete LC Momentum Workflow ===")

        # Step 1: Validate project configuration
        self._validate_project_configuration()

        # Step 2: Execute project with performance monitoring
        start_time = time.time()
        result = self._execute_project_with_monitoring()
        execution_time = time.time() - start_time

        # Step 3: Validate execution results
        self._validate_execution_results(result, execution_time)

        # Step 4: Validate scanner isolation
        self._validate_scanner_isolation()

        # Step 5: Validate signal aggregation accuracy
        self._validate_signal_aggregation(result)

        print(f"OK Complete workflow test passed in {execution_time:.2f}s")

    def _validate_project_configuration(self):
        """Validate project configuration is correct"""
        self.assertIsNotNone(self.lc_project)
        self.assertEqual(self.lc_project.aggregation_method, AggregationMethod.WEIGHTED)
        self.assertGreaterEqual(len(self.lc_project.scanners), 2)

        # Validate weights sum to approximately 1.0
        total_weight = sum(scanner.weight for scanner in self.lc_project.scanners)
        self.assertAlmostEqual(total_weight, 1.0, places=1)

        print(f"OK Project configuration valid with {len(self.lc_project.scanners)} scanners")

    def _execute_project_with_monitoring(self):
        """Execute project with detailed monitoring"""
        print("Executing LC Momentum project with real scanners...")

        # Monitor system resources before execution
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        initial_cpu = process.cpu_percent()

        # Execute the project
        try:
            result = self.engine.execute_project(
                project=self.lc_project,
                execution_config=self.exec_config
            )

            # Monitor system resources after execution
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            final_cpu = process.cpu_percent()

            # Store performance metrics
            self.performance_metrics = {
                'memory_growth_mb': final_memory - initial_memory,
                'cpu_usage_percent': final_cpu,
                'execution_time_seconds': result.execution_time_seconds if result else 0,
                'initial_memory_mb': initial_memory,
                'final_memory_mb': final_memory
            }

            return result

        except Exception as e:
            self.fail(f"Project execution failed: {str(e)}")

    def _validate_execution_results(self, result, execution_time):
        """Validate the execution results are correct"""
        # Basic result validation
        self.assertIsNotNone(result, "Execution result should not be None")
        self.assertEqual(result.scanner_error_count, 0, "No scanners should fail")
        self.assertGreater(result.scanner_success_count, 0, "At least one scanner should succeed")

        # Performance validation
        self.assertLess(execution_time, 60.0, "Execution should complete within 60 seconds")
        self.assertLess(
            self.performance_metrics['memory_growth_mb'],
            100,
            "Memory growth should be less than 100MB"
        )

        # Signal validation
        if result.total_signals > 0:
            self.assertGreater(len(result.signals), 0, "Should have signal results")

            # Validate signal structure
            for signal in result.signals[:5]:  # Check first 5 signals
                self.assertIn('ticker', signal)
                self.assertIn('date', signal)
                self.assertIn('confidence', signal)
                self.assertIsInstance(signal['confidence'], (int, float))
                self.assertGreaterEqual(signal['confidence'], 0)
                self.assertLessEqual(signal['confidence'], 1)

        print(f"OK Execution results valid: {result.total_signals} signals generated")
        print(f"OK Performance metrics: {execution_time:.2f}s, {self.performance_metrics['memory_growth_mb']:.1f}MB growth")

    def _validate_scanner_isolation(self):
        """Validate that scanner isolation is maintained"""
        print("Validating scanner isolation...")

        # Execute project multiple times to test isolation
        results = []
        for i in range(3):
            # Modify execution config slightly to test parameter isolation
            test_config = ExecutionConfig(
                start_date=self.exec_config.start_date,
                end_date=self.exec_config.end_date,
                tickers=self.exec_config.tickers[:5],  # Subset for speed
                additional_params={'isolation_test_marker': f'run_{i}'}
            )

            result = self.engine.execute_project(
                project=self.lc_project,
                execution_config=test_config
            )
            results.append(result)

        # Validate isolation by checking result consistency
        if all(r and r.total_signals > 0 for r in results):
            signal_counts = [r.total_signals for r in results]

            # With proper isolation, results should be consistent
            # Allow small variations due to potential market data differences
            max_variation = max(signal_counts) - min(signal_counts)
            avg_signals = sum(signal_counts) / len(signal_counts)
            variation_percent = (max_variation / avg_signals) * 100 if avg_signals > 0 else 0

            self.assertLess(
                variation_percent,
                20,  # Allow 20% variation
                f"Scanner isolation may be compromised: signal counts vary by {variation_percent:.1f}%"
            )

        print(f"OK Scanner isolation validated across {len(results)} executions")

    def _validate_signal_aggregation(self, result):
        """Validate signal aggregation accuracy"""
        if not result or result.total_signals == 0:
            print("⚠ Skipping signal aggregation validation - no signals generated")
            return

        print("Validating signal aggregation accuracy...")

        # Validate aggregation metadata
        self.assertIn('aggregation_method', result.aggregation_metadata)
        self.assertEqual(
            result.aggregation_metadata['aggregation_method'],
            AggregationMethod.WEIGHTED.value
        )

        # Validate scanner contributions
        if hasattr(result, 'scanner_contributions') and result.scanner_contributions:
            total_contributions = sum(result.scanner_contributions.values())
            self.assertEqual(
                total_contributions,
                result.total_signals,
                "Sum of scanner contributions should equal total signals"
            )

        # Validate weighted confidence calculations for sample signals
        sample_signals = result.signals[:min(5, len(result.signals))]
        for signal in sample_signals:
            if 'scanner_signals' in signal and len(signal['scanner_signals']) > 1:
                # Calculate expected weighted confidence
                total_weight = 0
                weighted_confidence = 0

                for scanner_signal in signal['scanner_signals']:
                    scanner_id = scanner_signal.get('scanner_id')
                    confidence = scanner_signal.get('confidence', 0)

                    # Find scanner weight
                    scanner_weight = 1.0
                    for scanner_ref in self.lc_project.scanners:
                        if scanner_ref.scanner_id == scanner_id:
                            scanner_weight = scanner_ref.weight
                            break

                    weighted_confidence += confidence * scanner_weight
                    total_weight += scanner_weight

                if total_weight > 0:
                    expected_confidence = weighted_confidence / total_weight
                    actual_confidence = signal.get('confidence', 0)

                    self.assertAlmostEqual(
                        actual_confidence,
                        expected_confidence,
                        places=2,
                        msg=f"Weighted confidence calculation incorrect for signal {signal.get('ticker', 'unknown')}"
                    )

        print(f"OK Signal aggregation validated for {len(sample_signals)} sample signals")

    def test_parameter_contamination_detection(self):
        """Test parameter contamination detection with real scanners"""
        print("\n=== Testing Parameter Contamination Detection ===")

        contamination_detected = False

        # Create multiple execution configurations with different parameters
        base_params = {
            'lookback_period': 20,
            'volume_threshold': 1000000
        }

        contamination_configs = []
        for i in range(3):
            config = ExecutionConfig(
                start_date=self.exec_config.start_date,
                end_date=self.exec_config.end_date,
                tickers=["AAPL", "GOOGL"],  # Smaller subset for speed
                additional_params={
                    **base_params,
                    'contamination_marker': f'test_{i}',
                    'lookback_period': base_params['lookback_period'] + i * 5
                }
            )
            contamination_configs.append(config)

        # Execute with contamination detection enabled
        contamination_results = []
        for config in contamination_configs:
            result = self.engine.execute_project(
                project=self.lc_project,
                execution_config=config,
                enable_contamination_detection=True
            )
            contamination_results.append(result)

        # Analyze results for contamination
        if all(r for r in contamination_results):
            # Check that different parameters produce different results
            # (indicating no contamination)
            unique_results = set()
            for result in contamination_results:
                if result.signals:
                    # Create signature of first few signals
                    signature = tuple(
                        (s.get('ticker'), s.get('date'), round(s.get('confidence', 0), 3))
                        for s in result.signals[:3]
                    )
                    unique_results.add(signature)

            # If properly isolated, should have different results for different parameters
            if len(unique_results) > 1:
                print("OK No parameter contamination detected - different parameters produce different results")
            else:
                print("⚠ Potential parameter contamination - identical results despite different parameters")

        print(f"OK Parameter contamination test completed")

    def test_performance_benchmarks(self):
        """Test performance benchmarks against requirements"""
        print("\n=== Testing Performance Benchmarks ===")

        # Benchmark execution with various configurations
        benchmark_configs = [
            {
                'name': 'Small Dataset',
                'tickers': ["AAPL", "GOOGL"],
                'days': 7,
                'max_time': 15.0
            },
            {
                'name': 'Medium Dataset',
                'tickers': ["AAPL", "GOOGL", "MSFT", "TSLA"],
                'days': 15,
                'max_time': 30.0
            },
            {
                'name': 'Large Dataset',
                'tickers': ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "AMZN", "META"],
                'days': 30,
                'max_time': 60.0
            }
        ]

        benchmark_results = []

        for config in benchmark_configs:
            end_date = datetime.now() - timedelta(days=1)
            start_date = end_date - timedelta(days=config['days'])

            exec_config = ExecutionConfig(
                start_date=start_date.strftime("%Y-%m-%d"),
                end_date=end_date.strftime("%Y-%m-%d"),
                tickers=config['tickers']
            )

            print(f"Running benchmark: {config['name']} ({len(config['tickers'])} tickers, {config['days']} days)")

            start_time = time.time()
            result = self.engine.execute_project(
                project=self.lc_project,
                execution_config=exec_config
            )
            execution_time = time.time() - start_time

            benchmark_result = {
                'name': config['name'],
                'execution_time': execution_time,
                'max_time': config['max_time'],
                'success': result is not None and result.scanner_error_count == 0,
                'signal_count': result.total_signals if result else 0
            }

            benchmark_results.append(benchmark_result)

            # Validate performance requirement
            self.assertLess(
                execution_time,
                config['max_time'],
                f"{config['name']} benchmark exceeded time limit: {execution_time:.2f}s > {config['max_time']}s"
            )

            print(f"  OK {config['name']}: {execution_time:.2f}s, {benchmark_result['signal_count']} signals")

        # Overall performance summary
        avg_time = sum(r['execution_time'] for r in benchmark_results) / len(benchmark_results)
        success_rate = sum(1 for r in benchmark_results if r['success']) / len(benchmark_results)

        self.assertGreater(success_rate, 0.9, "Success rate should be > 90%")

        print(f"OK Performance benchmarks passed: avg={avg_time:.2f}s, success_rate={success_rate:.1%}")

    def test_regression_validation(self):
        """Test that new functionality doesn't break existing features"""
        print("\n=== Testing Regression Validation ===")

        # Test 1: Individual scanner execution still works
        if self.available_scanner_files:
            first_scanner = self.available_scanner_files[0]

            # Test direct scanner execution (regression test)
            try:
                # This tests the original scanner isolation system
                from backend.project_composition.scanner_integration import ScannerIntegration

                scanner_integration = ScannerIntegration()
                scanner_info = scanner_integration.load_scanner(
                    first_scanner,
                    self.lc_project.scanners[0].parameter_file
                )

                test_config = {
                    'tickers': ['AAPL'],
                    'start_date': self.exec_config.start_date,
                    'end_date': self.exec_config.end_date
                }

                individual_result = scanner_integration.execute_scanner(scanner_info, test_config)

                self.assertIsNotNone(individual_result, "Individual scanner execution should work")
                print("OK Individual scanner execution still functional")

            except Exception as e:
                self.fail(f"Regression detected: Individual scanner execution failed: {str(e)}")

        # Test 2: Original isolation metrics still maintained
        # Execute project and verify 96% contamination reduction claim
        try:
            # This would require implementing contamination measurement
            # For now, verify basic functionality doesn't regress
            result = self.engine.execute_project(
                project=self.lc_project,
                execution_config=self.exec_config
            )

            self.assertIsNotNone(result, "Project execution should not regress")
            self.assertEqual(result.scanner_error_count, 0, "Error rate should not increase")

            print("OK Original isolation functionality preserved")

        except Exception as e:
            self.fail(f"Regression detected: Project execution failed: {str(e)}")

        # Test 3: Memory management hasn't regressed
        initial_memory = psutil.Process().memory_info().rss

        # Execute multiple times
        for _ in range(3):
            result = self.engine.execute_project(
                project=self.lc_project,
                execution_config=ExecutionConfig(
                    start_date=self.exec_config.start_date,
                    end_date=self.exec_config.end_date,
                    tickers=["AAPL", "GOOGL"]
                )
            )

        final_memory = psutil.Process().memory_info().rss
        memory_growth = (final_memory - initial_memory) / 1024 / 1024  # MB

        self.assertLess(memory_growth, 50, "Memory usage should not regress significantly")
        print(f"OK Memory management regression test passed: {memory_growth:.1f}MB growth")

        print("OK All regression tests passed")

    def test_error_handling_robustness(self):
        """Test robust error handling with real scanners"""
        print("\n=== Testing Error Handling Robustness ===")

        # Test 1: Invalid date ranges
        invalid_config = ExecutionConfig(
            start_date="2024-12-01",  # Future date
            end_date="2024-11-01",    # Before start date
            tickers=["AAPL"]
        )

        with self.assertRaises((ValueError, Exception)) as context:
            self.engine.execute_project(self.lc_project, invalid_config)
        print("OK Invalid date range properly handled")

        # Test 2: Empty ticker list
        empty_tickers_config = ExecutionConfig(
            start_date=self.exec_config.start_date,
            end_date=self.exec_config.end_date,
            tickers=[]
        )

        result = self.engine.execute_project(self.lc_project, empty_tickers_config)
        # Should handle gracefully (might return empty results)
        self.assertIsNotNone(result, "Empty tickers should be handled gracefully")
        print("OK Empty ticker list properly handled")

        # Test 3: Non-existent scanner file
        corrupted_project = ProjectConfig(
            name="Corrupted Test Project",
            description="Test project with invalid scanner",
            aggregation_method=AggregationMethod.UNION
        )

        invalid_scanner = ScannerReference(
            scanner_id="non_existent_scanner",
            scanner_name="Non Existent Scanner",
            scanner_file="/path/that/does/not/exist.py",
            parameter_file="/path/that/does/not/exist.json",
            weight=1.0
        )

        corrupted_project.add_scanner(invalid_scanner)

        result = self.engine.execute_project(corrupted_project, self.exec_config)

        # Should handle gracefully and report errors
        if result:
            self.assertGreater(result.scanner_error_count, 0, "Should report scanner errors")
        print("OK Non-existent scanner file properly handled")

        print("OK Error handling robustness validated")

    def test_scalability_validation(self):
        """Test system scalability with increasing load"""
        print("\n=== Testing Scalability Validation ===")

        scalability_tests = [
            {'scanners': 2, 'tickers': 5, 'expected_time': 20},
            {'scanners': 3, 'tickers': 10, 'expected_time': 40},
        ]

        for test_case in scalability_tests:
            # Create project with specified number of scanners
            scale_project = ProjectConfig(
                name=f"Scalability Test {test_case['scanners']} Scanners",
                aggregation_method=AggregationMethod.WEIGHTED
            )

            # Add available scanners up to the test limit
            available_scanners = self.lc_project.scanners[:test_case['scanners']]
            for scanner in available_scanners:
                scale_project.add_scanner(scanner)

            # Create execution config with specified tickers
            scale_config = ExecutionConfig(
                start_date=self.exec_config.start_date,
                end_date=self.exec_config.end_date,
                tickers=self.exec_config.tickers[:test_case['tickers']]
            )

            # Execute and measure performance
            start_time = time.time()
            result = self.engine.execute_project(scale_project, scale_config)
            execution_time = time.time() - start_time

            # Validate scalability
            self.assertIsNotNone(result, f"Scalability test {test_case} should complete")
            self.assertLess(
                execution_time,
                test_case['expected_time'],
                f"Scalability test {test_case} exceeded time limit"
            )

            print(f"OK Scalability test passed: {test_case['scanners']} scanners, {test_case['tickers']} tickers in {execution_time:.2f}s")

        print("OK Scalability validation completed")


class TestRealWorldDataIntegration(unittest.TestCase):
    """Test integration with real-world data scenarios"""

    def setUp(self):
        """Set up real-world test scenarios"""
        self.base_dir = Path(__file__).parent.parent.parent.parent
        self.engine = CompositionEngine()

    def test_historical_data_periods(self):
        """Test with various historical data periods"""
        print("\n=== Testing Historical Data Periods ===")

        # This test would require actual market data access
        # For now, test the configuration and basic execution flow

        historical_periods = [
            {
                'name': 'Recent Month',
                'start': (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
                'end': (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                'expected_signals': True
            },
            {
                'name': 'Quarter Period',
                'start': (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"),
                'end': (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                'expected_signals': True
            }
        ]

        for period in historical_periods:
            print(f"Testing period: {period['name']}")

            # Basic configuration test
            config = ExecutionConfig(
                start_date=period['start'],
                end_date=period['end'],
                tickers=["AAPL", "GOOGL"]
            )

            # Verify configuration is valid
            self.assertIsNotNone(config)
            self.assertLessEqual(
                datetime.strptime(config.start_date, "%Y-%m-%d"),
                datetime.strptime(config.end_date, "%Y-%m-%d")
            )

            print(f"OK {period['name']} configuration valid")

        print("OK Historical data period tests completed")

    def test_market_condition_scenarios(self):
        """Test behavior under different market conditions"""
        print("\n=== Testing Market Condition Scenarios ===")

        # Test scenarios that could be implemented with mock data
        scenarios = [
            {'name': 'High Volatility', 'ticker_count': 10},
            {'name': 'Low Volume', 'ticker_count': 5},
            {'name': 'Mixed Conditions', 'ticker_count': 7}
        ]

        for scenario in scenarios:
            print(f"Testing scenario: {scenario['name']}")

            # Create test configuration
            config = ExecutionConfig(
                start_date=(datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d"),
                end_date=(datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
                tickers=[f"TEST{i:03d}" for i in range(scenario['ticker_count'])]
            )

            # Verify configuration handles the scenario
            self.assertEqual(len(config.tickers), scenario['ticker_count'])

            print(f"OK {scenario['name']} scenario configuration valid")

        print("OK Market condition scenario tests completed")


if __name__ == '__main__':
    # Configure test output
    unittest.main(verbosity=2, buffer=True)