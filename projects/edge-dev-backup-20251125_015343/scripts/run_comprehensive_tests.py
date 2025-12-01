#!/usr/bin/env python3
"""
Comprehensive Test Execution Script for Project Composition System

This script orchestrates the execution of all testing suites including:
- Backend unit tests
- Frontend component tests
- Integration tests
- End-to-end tests
- Performance benchmarks
- Regression validation
- Quality gates validation

Execution Flow:
1. Environment validation and setup
2. Backend testing suite execution
3. Frontend testing suite execution
4. Integration testing execution
5. End-to-end testing execution
6. Performance benchmarking
7. Regression validation
8. Quality gates validation
9. Comprehensive reporting

Exit codes:
0 - All tests passed
1 - Some tests failed but system is functional
2 - Critical failures, system not ready for deployment
"""

import os
import sys
import subprocess
import time
import json
import shutil
from datetime import datetime
from pathlib import Path
import logging
import argparse
from typing import Dict, List, Optional, Tuple, Any
import concurrent.futures
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'comprehensive_tests_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)


class TestSuite:
    """Represents a test suite with execution details"""

    def __init__(self, name: str, description: str, command: List[str],
                 working_dir: str, timeout: int = 600, critical: bool = True):
        self.name = name
        self.description = description
        self.command = command
        self.working_dir = working_dir
        self.timeout = timeout
        self.critical = critical

        # Results
        self.executed = False
        self.passed = False
        self.execution_time = 0.0
        self.exit_code = None
        self.stdout = ""
        self.stderr = ""
        self.coverage_data = {}
        self.performance_data = {}
        self.error_details = []


class ComprehensiveTestRunner:
    """Main test runner orchestrating all test suites"""

    def __init__(self, base_dir: str, config: Dict[str, Any] = None):
        self.base_dir = Path(base_dir).absolute()
        self.config = config or self._get_default_config()
        self.test_suites = []
        self.results = {
            'start_time': datetime.now().isoformat(),
            'base_dir': str(self.base_dir),
            'config': self.config,
            'environment': self._get_environment_info(),
            'test_suites': [],
            'summary': {},
            'recommendations': []
        }

        # Initialize test suites
        self._initialize_test_suites()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            'parallel_execution': True,
            'max_workers': min(4, os.cpu_count() or 1),
            'stop_on_critical_failure': True,
            'generate_coverage_report': True,
            'run_performance_benchmarks': True,
            'run_regression_tests': True,
            'output_formats': ['json', 'html', 'console'],
            'timeouts': {
                'unit_tests': 300,      # 5 minutes
                'integration_tests': 600, # 10 minutes
                'e2e_tests': 1200,      # 20 minutes
                'performance_tests': 1800, # 30 minutes
                'quality_gates': 900    # 15 minutes
            }
        }

    def _get_environment_info(self) -> Dict[str, Any]:
        """Get environment information"""
        return {
            'python_version': sys.version,
            'platform': sys.platform,
            'cpu_count': os.cpu_count(),
            'memory_gb': round(psutil.virtual_memory().total / (1024**3), 2),
            'working_directory': str(self.base_dir),
            'timestamp': datetime.now().isoformat()
        }

    def _initialize_test_suites(self):
        """Initialize all test suites"""

        # Backend Unit Tests
        self.add_test_suite(TestSuite(
            name="Backend Unit Tests",
            description="Core backend component unit tests",
            command=[
                sys.executable, "-m", "pytest",
                "backend/tests/project_composition/",
                "-v", "--tb=short", "--strict-markers",
                "--cov=backend/project_composition",
                "--cov-report=json:backend_coverage.json",
                "--cov-report=html:backend_coverage_html",
                "--junit-xml=backend_test_results.xml"
            ],
            working_dir=str(self.base_dir),
            timeout=self.config['timeouts']['unit_tests'],
            critical=True
        ))

        # Backend Integration Tests
        self.add_test_suite(TestSuite(
            name="Backend Integration Tests",
            description="Backend integration and workflow tests",
            command=[
                sys.executable, "-m", "pytest",
                "backend/tests/integration/",
                "-v", "--tb=short",
                "--junit-xml=backend_integration_results.xml"
            ],
            working_dir=str(self.base_dir),
            timeout=self.config['timeouts']['integration_tests'],
            critical=True
        ))

        # Frontend Component Tests
        self.add_test_suite(TestSuite(
            name="Frontend Component Tests",
            description="React component unit tests",
            command=[
                "npm", "test", "--",
                "--coverage", "--watchAll=false",
                "--testResultsProcessor=jest-junit",
                "--coverageReporters=json", "--coverageReporters=html",
                "--testPathPattern=src/tests/components"
            ],
            working_dir=str(self.base_dir),
            timeout=self.config['timeouts']['unit_tests'],
            critical=True
        ))

        # End-to-End Tests
        if self._check_e2e_dependencies():
            self.add_test_suite(TestSuite(
                name="End-to-End Tests",
                description="Complete workflow validation via browser automation",
                command=[
                    "npx", "playwright", "test",
                    "src/tests/e2e/",
                    "--reporter=json", "--output=e2e_results.json"
                ],
                working_dir=str(self.base_dir),
                timeout=self.config['timeouts']['e2e_tests'],
                critical=False  # E2E failures don't block deployment
            ))

        # LC Momentum Workflow Integration Test
        self.add_test_suite(TestSuite(
            name="LC Momentum Workflow Test",
            description="Real-world LC momentum workflow validation",
            command=[
                sys.executable, "-m", "pytest",
                "backend/tests/integration/test_lc_momentum_workflow.py",
                "-v", "--tb=long",
                "--junit-xml=lc_workflow_results.xml"
            ],
            working_dir=str(self.base_dir),
            timeout=self.config['timeouts']['integration_tests'],
            critical=True
        ))

        # Scanner Isolation Regression Tests
        self.add_test_suite(TestSuite(
            name="Scanner Isolation Regression",
            description="Validate existing scanner isolation functionality",
            command=[
                sys.executable,
                "scripts/test_scanner_isolation_regression.py",
                str(self.base_dir)
            ],
            working_dir=str(self.base_dir),
            timeout=self.config['timeouts']['unit_tests'],
            critical=True
        ))

        # Performance Benchmarks
        if self.config['run_performance_benchmarks']:
            self.add_test_suite(TestSuite(
                name="Performance Benchmarks",
                description="System performance validation",
                command=[
                    sys.executable,
                    "scripts/performance_benchmarks.py",
                    str(self.base_dir)
                ],
                working_dir=str(self.base_dir),
                timeout=self.config['timeouts']['performance_tests'],
                critical=False
            ))

        # Quality Gates Validation
        self.add_test_suite(TestSuite(
            name="Quality Gates Validation",
            description="Comprehensive quality gates validation",
            command=[
                sys.executable,
                "scripts/quality_gates_validator.py",
                str(self.base_dir)
            ],
            working_dir=str(self.base_dir),
            timeout=self.config['timeouts']['quality_gates'],
            critical=True
        ))

    def add_test_suite(self, suite: TestSuite):
        """Add a test suite to the execution plan"""
        self.test_suites.append(suite)

    def run_all_tests(self) -> Dict[str, Any]:
        """Execute all test suites and return comprehensive results"""
        logger.info("Starting Comprehensive Test Execution")
        logger.info(f"Base Directory: {self.base_dir}")
        logger.info(f"Test Suites: {len(self.test_suites)}")
        logger.info(f"Parallel Execution: {self.config['parallel_execution']}")

        start_time = time.time()

        # Validate environment
        if not self._validate_environment():
            logger.error("Environment validation failed")
            return self._generate_failure_results("Environment validation failed")

        # Execute test suites
        if self.config['parallel_execution']:
            self._run_parallel_tests()
        else:
            self._run_sequential_tests()

        # Calculate total execution time
        total_execution_time = time.time() - start_time

        # Generate comprehensive results
        self._generate_final_results(total_execution_time)

        # Generate reports
        self._generate_reports()

        return self.results

    def _validate_environment(self) -> bool:
        """Validate the test environment"""
        logger.info("Validating test environment...")

        # Check Python version
        if sys.version_info < (3, 8):
            logger.error(f"Python 3.8+ required, got {sys.version}")
            return False

        # Check required directories
        required_dirs = [
            'backend/project_composition',
            'backend/tests',
            'src/components/projects',
            'src/tests'
        ]

        for dir_path in required_dirs:
            full_path = self.base_dir / dir_path
            if not full_path.exists():
                logger.error(f"Required directory not found: {full_path}")
                return False

        # Check for package.json (frontend)
        package_json = self.base_dir / 'package.json'
        if not package_json.exists():
            logger.warning("package.json not found - frontend tests may fail")

        # Check for Python requirements
        if (self.base_dir / 'requirements.txt').exists():
            try:
                subprocess.run([
                    sys.executable, '-m', 'pip', 'check'
                ], check=True, capture_output=True)
            except subprocess.CalledProcessError as e:
                logger.warning(f"Python package dependencies issue: {e}")

        # Check available memory
        available_memory_gb = psutil.virtual_memory().available / (1024**3)
        if available_memory_gb < 2.0:
            logger.warning(f"Low available memory: {available_memory_gb:.1f}GB")

        logger.info("✓ Environment validation passed")
        return True

    def _check_e2e_dependencies(self) -> bool:
        """Check if E2E test dependencies are available"""
        try:
            subprocess.run(['npx', 'playwright', '--version'],
                         check=True, capture_output=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("Playwright not available - skipping E2E tests")
            return False

    def _run_parallel_tests(self):
        """Execute test suites in parallel"""
        logger.info("Running tests in parallel...")

        # Group tests by criticality
        critical_tests = [suite for suite in self.test_suites if suite.critical]
        non_critical_tests = [suite for suite in self.test_suites if not suite.critical]

        # Run critical tests first
        if critical_tests:
            logger.info(f"Running {len(critical_tests)} critical test suites...")
            self._execute_test_group(critical_tests)

            # Check if any critical tests failed
            critical_failures = [suite for suite in critical_tests if not suite.passed]
            if critical_failures and self.config['stop_on_critical_failure']:
                logger.error(f"{len(critical_failures)} critical tests failed - stopping execution")
                return

        # Run non-critical tests
        if non_critical_tests:
            logger.info(f"Running {len(non_critical_tests)} non-critical test suites...")
            self._execute_test_group(non_critical_tests)

    def _run_sequential_tests(self):
        """Execute test suites sequentially"""
        logger.info("Running tests sequentially...")

        for i, suite in enumerate(self.test_suites, 1):
            logger.info(f"Running test suite {i}/{len(self.test_suites)}: {suite.name}")

            self._execute_test_suite(suite)

            if suite.critical and not suite.passed and self.config['stop_on_critical_failure']:
                logger.error(f"Critical test failed: {suite.name} - stopping execution")
                break

    def _execute_test_group(self, test_suites: List[TestSuite]):
        """Execute a group of test suites in parallel"""
        max_workers = min(self.config['max_workers'], len(test_suites))

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_suite = {
                executor.submit(self._execute_test_suite, suite): suite
                for suite in test_suites
            }

            for future in concurrent.futures.as_completed(future_to_suite):
                suite = future_to_suite[future]
                try:
                    future.result()
                except Exception as exc:
                    logger.error(f"Test suite {suite.name} generated exception: {exc}")
                    suite.passed = False
                    suite.error_details.append(str(exc))

    def _execute_test_suite(self, suite: TestSuite):
        """Execute a single test suite"""
        logger.info(f"Executing: {suite.name}")
        logger.info(f"Command: {' '.join(suite.command)}")
        logger.info(f"Working Directory: {suite.working_dir}")

        start_time = time.time()

        try:
            # Ensure working directory exists
            os.makedirs(suite.working_dir, exist_ok=True)

            # Execute the test command
            result = subprocess.run(
                suite.command,
                cwd=suite.working_dir,
                capture_output=True,
                text=True,
                timeout=suite.timeout
            )

            suite.exit_code = result.returncode
            suite.stdout = result.stdout
            suite.stderr = result.stderr
            suite.passed = result.returncode == 0

            if suite.passed:
                logger.info(f"✓ {suite.name}: PASSED")
            else:
                logger.error(f"✗ {suite.name}: FAILED (exit code: {result.returncode})")
                if result.stderr:
                    logger.error(f"Error output: {result.stderr[:500]}...")

        except subprocess.TimeoutExpired:
            suite.passed = False
            suite.exit_code = -1
            suite.error_details.append(f"Test timed out after {suite.timeout} seconds")
            logger.error(f"✗ {suite.name}: TIMEOUT ({suite.timeout}s)")

        except Exception as e:
            suite.passed = False
            suite.exit_code = -1
            suite.error_details.append(str(e))
            logger.error(f"✗ {suite.name}: ERROR - {str(e)}")

        finally:
            suite.executed = True
            suite.execution_time = time.time() - start_time

            # Extract additional data
            self._extract_suite_data(suite)

    def _extract_suite_data(self, suite: TestSuite):
        """Extract additional data from test suite execution"""
        # Extract coverage data
        coverage_files = [
            'backend_coverage.json',
            'coverage/coverage-final.json'
        ]

        for coverage_file in coverage_files:
            coverage_path = Path(suite.working_dir) / coverage_file
            if coverage_path.exists():
                try:
                    with open(coverage_path, 'r') as f:
                        suite.coverage_data = json.load(f)
                    break
                except Exception as e:
                    logger.warning(f"Could not parse coverage data from {coverage_path}: {e}")

        # Extract performance data from stdout if available
        if 'performance' in suite.name.lower() and suite.stdout:
            try:
                # Look for JSON performance data in stdout
                lines = suite.stdout.split('\n')
                for line in lines:
                    if line.strip().startswith('{') and 'execution_time' in line:
                        suite.performance_data = json.loads(line.strip())
                        break
            except Exception as e:
                logger.warning(f"Could not extract performance data: {e}")

    def _generate_final_results(self, total_execution_time: float):
        """Generate final comprehensive results"""
        # Count results
        total_suites = len(self.test_suites)
        executed_suites = sum(1 for suite in self.test_suites if suite.executed)
        passed_suites = sum(1 for suite in self.test_suites if suite.passed)
        failed_suites = executed_suites - passed_suites

        # Critical results
        critical_suites = [suite for suite in self.test_suites if suite.critical]
        critical_passed = sum(1 for suite in critical_suites if suite.passed)
        critical_failed = len(critical_suites) - critical_passed

        # Calculate overall score
        overall_score = (passed_suites / executed_suites * 100) if executed_suites > 0 else 0
        critical_score = (critical_passed / len(critical_suites) * 100) if critical_suites else 100

        # Determine deployment readiness
        deployment_ready = (
            critical_failed == 0 and
            overall_score >= 80  # At least 80% of tests must pass
        )

        # Update results
        self.results.update({
            'end_time': datetime.now().isoformat(),
            'total_execution_time': total_execution_time,
            'summary': {
                'total_suites': total_suites,
                'executed_suites': executed_suites,
                'passed_suites': passed_suites,
                'failed_suites': failed_suites,
                'critical_passed': critical_passed,
                'critical_failed': critical_failed,
                'overall_score': overall_score,
                'critical_score': critical_score,
                'deployment_ready': deployment_ready
            },
            'test_suites': [self._suite_to_dict(suite) for suite in self.test_suites]
        })

        # Generate recommendations
        self._generate_recommendations()

        # Log summary
        logger.info(f"\n{'='*60}")
        logger.info("COMPREHENSIVE TEST EXECUTION SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Overall Score: {overall_score:.1f}%")
        logger.info(f"Critical Score: {critical_score:.1f}%")
        logger.info(f"Passed Suites: {passed_suites}/{executed_suites}")
        logger.info(f"Critical Failures: {critical_failed}")
        logger.info(f"Deployment Ready: {'YES' if deployment_ready else 'NO'}")
        logger.info(f"Total Execution Time: {total_execution_time:.1f}s")
        logger.info(f"{'='*60}")

    def _suite_to_dict(self, suite: TestSuite) -> Dict[str, Any]:
        """Convert test suite to dictionary"""
        return {
            'name': suite.name,
            'description': suite.description,
            'critical': suite.critical,
            'executed': suite.executed,
            'passed': suite.passed,
            'execution_time': suite.execution_time,
            'exit_code': suite.exit_code,
            'command': suite.command,
            'stdout': suite.stdout[:1000] if suite.stdout else "",  # Truncate for JSON
            'stderr': suite.stderr[:1000] if suite.stderr else "",
            'coverage_data': suite.coverage_data,
            'performance_data': suite.performance_data,
            'error_details': suite.error_details
        }

    def _generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []

        failed_critical = [suite for suite in self.test_suites if suite.critical and not suite.passed]
        failed_non_critical = [suite for suite in self.test_suites if not suite.critical and not suite.passed]

        if not failed_critical and not failed_non_critical:
            recommendations.append({
                'type': 'success',
                'priority': 'info',
                'message': 'All tests passed successfully. System ready for production deployment.',
                'action': 'Proceed with deployment'
            })
        else:
            if failed_critical:
                recommendations.append({
                    'type': 'critical',
                    'priority': 'high',
                    'message': f'{len(failed_critical)} critical test(s) failed',
                    'action': 'Fix critical issues before deployment',
                    'failed_suites': [suite.name for suite in failed_critical]
                })

            if failed_non_critical:
                recommendations.append({
                    'type': 'warning',
                    'priority': 'medium',
                    'message': f'{len(failed_non_critical)} non-critical test(s) failed',
                    'action': 'Review and fix if time permits',
                    'failed_suites': [suite.name for suite in failed_non_critical]
                })

        # Performance recommendations
        performance_suites = [suite for suite in self.test_suites if 'performance' in suite.name.lower()]
        slow_suites = [suite for suite in self.test_suites if suite.execution_time > 300]  # > 5 minutes

        if slow_suites:
            recommendations.append({
                'type': 'performance',
                'priority': 'low',
                'message': f'{len(slow_suites)} test suite(s) running slowly',
                'action': 'Consider optimizing test execution time',
                'slow_suites': [f"{suite.name}: {suite.execution_time:.1f}s" for suite in slow_suites]
            })

        self.results['recommendations'] = recommendations

    def _generate_reports(self):
        """Generate test reports in multiple formats"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # JSON Report
        if 'json' in self.config['output_formats']:
            json_file = f"comprehensive_test_results_{timestamp}.json"
            with open(json_file, 'w') as f:
                json.dump(self.results, f, indent=2)
            logger.info(f"JSON report saved: {json_file}")

        # HTML Report
        if 'html' in self.config['output_formats']:
            html_file = f"comprehensive_test_report_{timestamp}.html"
            self._generate_html_report(html_file)
            logger.info(f"HTML report saved: {html_file}")

        # Console Summary (always generated)
        self._print_console_summary()

    def _generate_html_report(self, filename: str):
        """Generate HTML test report"""
        html_template = """
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .suite { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .critical { background-color: #ffebee; }
        .recommendations { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Comprehensive Test Results</h1>
        <p><strong>Execution Time:</strong> {total_time:.1f} seconds</p>
        <p><strong>Overall Score:</strong> {overall_score:.1f}%</p>
        <p><strong>Deployment Ready:</strong> {deployment_ready}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <ul>
            <li>Total Suites: {total_suites}</li>
            <li>Passed: {passed_suites}</li>
            <li>Failed: {failed_suites}</li>
            <li>Critical Failures: {critical_failed}</li>
        </ul>
    </div>

    <div class="recommendations">
        <h2>Recommendations</h2>
        {recommendations_html}
    </div>

    <div class="test-suites">
        <h2>Test Suite Details</h2>
        {suites_html}
    </div>
</body>
</html>"""

        # Generate suite HTML
        suites_html = ""
        for suite_data in self.results['test_suites']:
            status_class = "passed" if suite_data['passed'] else "failed"
            critical_class = "critical" if suite_data['critical'] else ""

            suites_html += f"""
            <div class="suite {status_class} {critical_class}">
                <h3>{suite_data['name']} {'✓' if suite_data['passed'] else '✗'}</h3>
                <p>{suite_data['description']}</p>
                <p><strong>Execution Time:</strong> {suite_data['execution_time']:.1f}s</p>
                {f"<p><strong>Exit Code:</strong> {suite_data['exit_code']}</p>" if suite_data['exit_code'] is not None else ""}
                {f"<pre>{suite_data['stderr'][:500]}</pre>" if suite_data['stderr'] else ""}
            </div>"""

        # Generate recommendations HTML
        recommendations_html = ""
        for rec in self.results['recommendations']:
            recommendations_html += f"<p><strong>{rec['priority'].upper()}:</strong> {rec['message']}</p>"

        # Format HTML
        html_content = html_template.format(
            total_time=self.results['total_execution_time'],
            overall_score=self.results['summary']['overall_score'],
            deployment_ready="YES" if self.results['summary']['deployment_ready'] else "NO",
            total_suites=self.results['summary']['total_suites'],
            passed_suites=self.results['summary']['passed_suites'],
            failed_suites=self.results['summary']['failed_suites'],
            critical_failed=self.results['summary']['critical_failed'],
            recommendations_html=recommendations_html,
            suites_html=suites_html
        )

        with open(filename, 'w') as f:
            f.write(html_content)

    def _print_console_summary(self):
        """Print detailed console summary"""
        print(f"\n{'='*80}")
        print("COMPREHENSIVE TEST EXECUTION DETAILED SUMMARY")
        print(f"{'='*80}")

        summary = self.results['summary']
        print(f"Overall Score: {summary['overall_score']:.1f}%")
        print(f"Critical Score: {summary['critical_score']:.1f}%")
        print(f"Deployment Ready: {'YES' if summary['deployment_ready'] else 'NO'}")
        print(f"Total Execution Time: {self.results['total_execution_time']:.1f}s")
        print()

        # Test suite results
        print("Test Suite Results:")
        print("-" * 60)
        for suite_data in self.results['test_suites']:
            status = "PASS" if suite_data['passed'] else "FAIL"
            critical_mark = " [CRITICAL]" if suite_data['critical'] else ""
            print(f"{status:4} | {suite_data['execution_time']:6.1f}s | {suite_data['name']}{critical_mark}")

        print()

        # Recommendations
        if self.results['recommendations']:
            print("Recommendations:")
            print("-" * 60)
            for rec in self.results['recommendations']:
                print(f"[{rec['priority'].upper()}] {rec['message']}")

        print(f"{'='*80}")

    def _generate_failure_results(self, error_message: str) -> Dict[str, Any]:
        """Generate failure results when environment validation fails"""
        return {
            'start_time': self.results['start_time'],
            'end_time': datetime.now().isoformat(),
            'error': error_message,
            'summary': {
                'deployment_ready': False,
                'overall_score': 0,
                'total_suites': 0,
                'passed_suites': 0,
                'failed_suites': 0
            }
        }


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Comprehensive Test Runner for Project Composition System")

    parser.add_argument(
        'base_dir',
        help='Base directory of the project'
    )

    parser.add_argument(
        '--config',
        help='Path to configuration JSON file',
        type=str
    )

    parser.add_argument(
        '--parallel',
        action='store_true',
        default=True,
        help='Run tests in parallel (default: True)'
    )

    parser.add_argument(
        '--no-parallel',
        dest='parallel',
        action='store_false',
        help='Run tests sequentially'
    )

    parser.add_argument(
        '--max-workers',
        type=int,
        default=4,
        help='Maximum number of parallel workers (default: 4)'
    )

    parser.add_argument(
        '--skip-e2e',
        action='store_true',
        help='Skip end-to-end tests'
    )

    parser.add_argument(
        '--skip-performance',
        action='store_true',
        help='Skip performance benchmarks'
    )

    parser.add_argument(
        '--output-format',
        choices=['json', 'html', 'console'],
        action='append',
        default=['json', 'html', 'console'],
        help='Output format(s) for results'
    )

    return parser.parse_args()


def main():
    """Main execution function"""
    args = parse_arguments()

    # Validate base directory
    if not os.path.exists(args.base_dir):
        print(f"Error: Directory {args.base_dir} does not exist")
        sys.exit(2)

    # Load configuration
    config = None
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config = json.load(f)

    # Override config with command line arguments
    if config is None:
        config = {}

    config.update({
        'parallel_execution': args.parallel,
        'max_workers': args.max_workers,
        'run_performance_benchmarks': not args.skip_performance,
        'output_formats': args.output_format
    })

    # Initialize and run tests
    runner = ComprehensiveTestRunner(args.base_dir, config)
    results = runner.run_all_tests()

    # Determine exit code
    if not results.get('summary', {}).get('deployment_ready', False):
        critical_failed = results.get('summary', {}).get('critical_failed', 1)
        if critical_failed > 0:
            print(f"\nCRITICAL: {critical_failed} critical test(s) failed")
            sys.exit(2)  # Critical failure
        else:
            print("\nWARNING: Some non-critical tests failed")
            sys.exit(1)  # Non-critical failure

    print("\nSUCCESS: All critical tests passed - system ready for deployment")
    sys.exit(0)


if __name__ == "__main__":
    main()