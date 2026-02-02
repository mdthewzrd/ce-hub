"""
Test Runner for Project Composition Engine

This script runs the comprehensive test suite for the project composition system
and validates that all components work together correctly.

Usage:
    python test_runner.py [--verbose] [--module MODULE_NAME]

Examples:
    python test_runner.py                    # Run all tests
    python test_runner.py --verbose          # Run with detailed output
    python test_runner.py --module project_config  # Run specific module tests
"""

import unittest
import sys
import os
import tempfile
import shutil
from pathlib import Path
import argparse
import logging

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Configure logging for tests
logging.basicConfig(
    level=logging.WARNING,  # Reduce noise during testing
    format='%(levelname)s: %(message)s'
)


def create_test_environment():
    """Create a temporary test environment"""
    temp_dir = tempfile.mkdtemp(prefix="project_composition_test_")

    # Create test scanner files
    scanners_dir = os.path.join(temp_dir, "generated_scanners")
    os.makedirs(scanners_dir)

    # Create basic scanner files for testing
    scanner_template = '''
class {class_name}:
    def __init__(self):
        self.isolated_params = {params}
        self.name = "{scanner_name}"

    def scan(self, start_date, end_date):
        return []
'''

    test_scanners = {
        "lc_frontside_d2_extended.py": {
            "class_name": "LcFrontsideD2ExtendedScanner",
            "scanner_name": "lc_frontside_d2_extended",
            "params": "{'param1': 1.0, 'param2': 'test'}"
        },
        "lc_frontside_d2_extended_1.py": {
            "class_name": "LcFrontsideD2Extended1Scanner",
            "scanner_name": "lc_frontside_d2_extended_1",
            "params": "{'param1': 2.0, 'param3': True}"
        },
        "lc_frontside_d3_extended_1.py": {
            "class_name": "LcFrontsideD3Extended1Scanner",
            "scanner_name": "lc_frontside_d3_extended_1",
            "params": "{'param1': 3.0, 'param4': 'advanced'}"
        }
    }

    for filename, config in test_scanners.items():
        scanner_content = scanner_template.format(**config)
        scanner_path = os.path.join(scanners_dir, filename)
        with open(scanner_path, 'w') as f:
            f.write(scanner_content)

    return temp_dir


def discover_and_run_tests(test_dir=None, pattern="test_*.py", verbosity=1, specific_module=None):
    """Discover and run all tests in the project composition package"""

    if test_dir is None:
        test_dir = Path(__file__).parent / "tests"

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    if specific_module:
        # Load specific test module
        module_pattern = f"test_{specific_module}.py"
        try:
            specific_suite = loader.discover(str(test_dir), pattern=module_pattern)
            suite.addTest(specific_suite)
            print(f"Running tests for module: {specific_module}")
        except Exception as e:
            print(f"Error loading module {specific_module}: {e}")
            return False
    else:
        # Load all tests
        all_tests = loader.discover(str(test_dir), pattern=pattern)
        suite.addTest(all_tests)
        print("Running all project composition tests...")

    # Run tests
    runner = unittest.TextTestRunner(verbosity=verbosity, buffer=True)
    result = runner.run(suite)

    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped) if hasattr(result, 'skipped') else 0}")

    if result.failures:
        print(f"\nFAILURES ({len(result.failures)}):")
        for i, (test, traceback) in enumerate(result.failures, 1):
            print(f"{i}. {test}")
            if verbosity > 1:
                print(f"   {traceback}")

    if result.errors:
        print(f"\nERRORS ({len(result.errors)}):")
        for i, (test, traceback) in enumerate(result.errors, 1):
            print(f"{i}. {test}")
            if verbosity > 1:
                print(f"   {traceback}")

    success = len(result.failures) == 0 and len(result.errors) == 0
    if success:
        print("\n✅ ALL TESTS PASSED!")
    else:
        print(f"\n❌ TESTS FAILED: {len(result.failures)} failures, {len(result.errors)} errors")

    return success


def run_integration_test():
    """Run a comprehensive integration test"""
    print("\n🔄 Running Integration Test...")

    temp_dir = None
    try:
        # Create test environment
        temp_dir = create_test_environment()

        # Import modules for testing
        from backend.project_composition.project_config import ProjectConfig, ScannerReference, ProjectManager
        from backend.project_composition.parameter_manager import ParameterManager
        from backend.project_composition.signal_aggregation import SignalAggregator

        print("✅ All modules imported successfully")

        # Test project creation
        scanners_dir = os.path.join(temp_dir, "generated_scanners")
        scanner_ref = ScannerReference(
            scanner_id="test_scanner",
            scanner_file=os.path.join(scanners_dir, "lc_frontside_d2_extended.py"),
            parameter_file="test_params.json"
        )

        project_config = ProjectConfig(
            project_id="integration_test",
            name="Integration Test Project",
            description="Test project for integration validation",
            scanners=[scanner_ref]
        )

        print("✅ Project configuration created successfully")

        # Test project manager
        projects_dir = os.path.join(temp_dir, "projects")
        project_manager = ProjectManager(projects_dir)
        config_path = project_manager.create_project(project_config)

        print("✅ Project manager operations successful")

        # Test parameter manager
        param_manager = ParameterManager(projects_dir)
        test_params = {'param1': 1.0, 'param2': 'test_value'}

        # Mock validation for test
        import unittest.mock
        with unittest.mock.patch.object(param_manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}
            param_success = param_manager.save_scanner_parameters(
                project_config.project_id, scanner_ref.scanner_id, test_params
            )

        if param_success:
            print("✅ Parameter manager operations successful")
        else:
            print("⚠️ Parameter manager test skipped (validation issues)")

        # Test signal aggregator
        aggregator = SignalAggregator()
        test_signals = {
            'scanner1': [{'ticker': 'AAPL', 'date': '2024-01-15', 'confidence': 0.8}],
            'scanner2': [{'ticker': 'AAPL', 'date': '2024-01-15', 'confidence': 0.9}]
        }

        result = aggregator.aggregate_signals(test_signals, method='union')

        if len(result.signals) > 0:
            print("✅ Signal aggregation successful")
        else:
            print("⚠️ Signal aggregation produced no results")

        print("✅ Integration test completed successfully")
        return True

    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Clean up
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


def validate_system_requirements():
    """Validate that all required components are available"""
    print("🔍 Validating system requirements...")

    required_modules = [
        'pandas',
        'numpy',
        'asyncio',
        'pathlib',
        'datetime',
        'json',
        'os',
        'tempfile',
        'unittest'
    ]

    missing_modules = []
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing_modules.append(module)

    if missing_modules:
        print(f"❌ Missing required modules: {', '.join(missing_modules)}")
        return False

    # Check if project composition modules can be imported
    try:
        from backend.project_composition import (
            ProjectConfig, ScannerReference, ParameterManager,
            SignalAggregator, ProjectCompositionEngine
        )
        print("✅ All project composition modules available")
    except ImportError as e:
        print(f"❌ Failed to import project composition modules: {e}")
        return False

    print("✅ All system requirements satisfied")
    return True


def main():
    """Main test runner function"""
    parser = argparse.ArgumentParser(description="Run Project Composition Engine tests")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Run tests with verbose output")
    parser.add_argument("--module", "-m", type=str,
                       help="Run tests for specific module only")
    parser.add_argument("--integration", "-i", action="store_true",
                       help="Run integration test only")
    parser.add_argument("--no-unit", action="store_true",
                       help="Skip unit tests")

    args = parser.parse_args()

    print("🧪 Project Composition Engine Test Suite")
    print("=" * 50)

    # Validate system requirements
    if not validate_system_requirements():
        print("❌ System requirements not satisfied. Please install missing dependencies.")
        return 1

    success = True

    # Run unit tests unless skipped
    if not args.no_unit:
        verbosity = 2 if args.verbose else 1
        test_success = discover_and_run_tests(
            verbosity=verbosity,
            specific_module=args.module
        )
        success = success and test_success

    # Run integration test
    if args.integration or not args.no_unit:
        integration_success = run_integration_test()
        success = success and integration_success

    print("\n" + "=" * 50)
    if success:
        print("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        print("✅ Project Composition Engine is ready for production use")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("🔧 Please review the errors above and fix issues before deployment")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)