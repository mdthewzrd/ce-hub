"""
Comprehensive Validation Suite
Integrates all validation components into a cohesive testing framework
"""

import asyncio
import time
from typing import (
    Any, Dict, List, Optional, Union, Callable,
    Type, Tuple, Set
)
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import json
import logging
from abc import ABC, abstractmethod

# Import our validation components
from .stateful_validator import (
    StateValidator, ReactStateValidator, VueStateValidator,
    ValidationResult, ComponentState
)
from .component_testing import (
    ComponentTestSuite, InteractionContract, ComponentTester,
    ComponentTestResult, BehaviorTestResult
)
from .waiting_strategies import (
    SmartWaiter, CommonWaitStrategies, WaitResult,
    WaitConfig, WaitStrategy
)
from .visual_regression import (
    VisualRegressionTester, RegressionResult, RegressionConfig,
    VisualDifference, SeverityLevel
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValidationLevel(Enum):
    """Levels of validation rigor"""
    BASIC = "basic"  # Essential checks only
    STANDARD = "standard"  # Normal validation
    COMPREHENSIVE = "comprehensive"  # Thorough validation
    PRODUCTION = "production"  # Maximum validation for production

class TestCategory(Enum):
    """Categories of tests"""
    FUNCTIONAL = "functional"
    VISUAL = "visual"
    PERFORMANCE = "performance"
    ACCESSIBILITY = "accessibility"
    SECURITY = "security"
    COMPATIBILITY = "compatibility"

@dataclass
class ValidationConfig:
    """Configuration for validation suite"""
    level: ValidationLevel = ValidationLevel.STANDARD
    enabled_categories: Set[TestCategory] = field(default_factory=lambda: {
        TestCategory.FUNCTIONAL, TestCategory.VISUAL
    })
    timeout: float = 30.0
    retry_count: int = 3
    parallel_execution: bool = True
    generate_reports: bool = True
    save_screenshots: bool = True
    baseline_update_mode: bool = False

    # Component validation settings
    component_timeout: float = 10.0
    state_validation: bool = True
    interaction_testing: bool = True

    # Visual regression settings
    visual_threshold: float = 0.95
    ignore_animations: bool = True
    ignore_dynamic_content: bool = True

@dataclass
class TestSuite:
    """Collection of tests to run"""
    name: str
    tests: List[Dict[str, Any]] = field(default_factory=list)
    config: Optional[ValidationConfig] = None
    setup_hooks: List[Callable] = field(default_factory=list)
    teardown_hooks: List[Callable] = field(default_factory=list)

@dataclass
class SuiteResult:
    """Result of running a test suite"""
    suite_name: str
    passed: bool
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    execution_time: float
    results: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

class BaseValidator(ABC):
    """Base class for all validators"""

    def __init__(self, config: ValidationConfig):
        self.config = config
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    @abstractmethod
    async def validate(self, target: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Perform validation on target"""
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Get validator name"""
        pass

class ComponentValidator(BaseValidator):
    """Validator for component state and behavior"""

    def __init__(self, config: ValidationConfig):
        super().__init__(config)
        self.state_validator = StateValidator()
        self.component_tester = ComponentTester()

    def get_name(self) -> str:
        return "Component Validator"

    async def validate(self, page_or_element: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Validate component state and behavior"""
        context = context or {}
        results = {}

        try:
            # State validation
            if self.config.state_validation:
                state_result = await self.state_validator.validate(page_or_element)
                results['state_validation'] = state_result

            # Interaction testing
            if self.config.interaction_testing:
                # Get component type from context or auto-detect
                component_type = context.get('component_type', 'auto')
                test_result = await self.component_tester.test_component_interactions(
                    page_or_element, component_type
                )
                results['interaction_testing'] = test_result

            return results

        except Exception as e:
            self.logger.error(f"Component validation failed: {str(e)}")
            return {
                'error': str(e),
                'state_validation': None,
                'interaction_testing': None
            }

class VisualValidator(BaseValidator):
    """Validator for visual regression"""

    def __init__(self, config: ValidationConfig):
        super().__init__(config)

        visual_config = RegressionConfig(
            similarity_threshold=config.visual_threshold,
            ignore_animations=config.ignore_animations,
            ignore_dynamic_content=config.ignore_dynamic_content
        )
        self.visual_tester = VisualRegressionTester(visual_config)

    def get_name(self) -> str:
        return "Visual Validator"

    async def validate(self, page_or_element: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Validate visual appearance"""
        context = context or {}
        test_name = context.get('test_name', 'visual_test')

        try:
            # Capture screenshot
            if hasattr(page_or_element, 'screenshot'):
                screenshot_data = page_or_element.screenshot(type='png')
                from .visual_regression import ImageProcessor
                image = ImageProcessor.load_image(screenshot_data)
            else:
                raise ValueError("Object doesn't support screenshot capture")

            # Compare with baseline
            result = await self.visual_tester.compare_with_baseline(
                image, test_name, self.config.baseline_update_mode
            )

            return {'visual_regression': result}

        except Exception as e:
            self.logger.error(f"Visual validation failed: {str(e)}")
            return {'error': str(e), 'visual_regression': None}

class PerformanceValidator(BaseValidator):
    """Validator for performance metrics"""

    def get_name(self) -> str:
        return "Performance Validator"

    async def validate(self, page_or_element: Any, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Validate performance characteristics"""
        try:
            results = {}

            # Check load time
            if hasattr(page_or_element, 'evaluate'):
                load_time = await page_or_element.evaluate('performance.now()')
                results['load_time'] = load_time

            # Check for performance issues
            if hasattr(page_or_element, 'evaluate'):
                # Check for memory leaks
                memory_usage = await page_or_element.evaluate(
                    'performance.memory ? performance.memory.usedJSHeapSize : null'
                )
                results['memory_usage'] = memory_usage

                # Check for long tasks
                long_tasks = await page_or_element.evaluate(
                    'performance.getEntriesByType("longtask").length'
                )
                results['long_tasks'] = long_tasks

            return {'performance_metrics': results}

        except Exception as e:
            self.logger.error(f"Performance validation failed: {str(e)}")
            return {'error': str(e), 'performance_metrics': None}

class ValidationSuite:
    """
    Main validation suite that coordinates all validation types
    """

    def __init__(self, config: ValidationConfig = None):
        self.config = config or ValidationConfig()
        self.validators: Dict[TestCategory, BaseValidator] = {}
        self.waiter = SmartWaiter()
        self.logger = logging.getLogger(__name__)

        # Initialize validators based on enabled categories
        self._initialize_validators()

    def _initialize_validators(self):
        """Initialize validators based on configuration"""
        if TestCategory.FUNCTIONAL in self.config.enabled_categories:
            self.validators[TestCategory.FUNCTIONAL] = ComponentValidator(self.config)

        if TestCategory.VISUAL in self.config.enabled_categories:
            self.validators[TestCategory.VISUAL] = VisualValidator(self.config)

        if TestCategory.PERFORMANCE in self.config.enabled_categories:
            self.validators[TestCategory.PERFORMANCE] = PerformanceValidator(self.config)

    async def run_test_suite(self, test_suite: TestSuite) -> SuiteResult:
        """Run a complete test suite"""
        start_time = time.time()

        self.logger.info(f"Running test suite: {test_suite.name}")

        # Run setup hooks
        for hook in test_suite.setup_hooks:
            try:
                await hook()
            except Exception as e:
                self.logger.warning(f"Setup hook failed: {str(e)}")

        # Run tests
        passed_tests = 0
        failed_tests = 0
        skipped_tests = 0
        all_results = []
        errors = []
        warnings = []

        for test_config in test_suite.tests:
            try:
                test_result = await self._run_single_test(test_config)
                all_results.append(test_result)

                if test_result.get('passed', False):
                    passed_tests += 1
                elif test_result.get('skipped', False):
                    skipped_tests += 1
                else:
                    failed_tests += 1

            except Exception as e:
                failed_tests += 1
                error_msg = f"Test {test_config.get('name', 'unknown')} failed: {str(e)}"
                errors.append(error_msg)
                self.logger.error(error_msg)

        # Run teardown hooks
        for hook in test_suite.teardown_hooks:
            try:
                await hook()
            except Exception as e:
                self.logger.warning(f"Teardown hook failed: {str(e)}")

        execution_time = time.time() - start_time

        # Generate suite result
        suite_result = SuiteResult(
            suite_name=test_suite.name,
            passed=failed_tests == 0,
            total_tests=len(test_suite.tests),
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            skipped_tests=skipped_tests,
            execution_time=execution_time,
            results=all_results,
            errors=errors,
            warnings=warnings
        )

        self.logger.info(f"Test suite '{test_suite.name}' completed in {execution_time:.2f}s: "
                        f"{passed_tests} passed, {failed_tests} failed, {skipped_tests} skipped")

        # Generate report if enabled
        if self.config.generate_reports:
            await self._generate_report(suite_result)

        return suite_result

    async def _run_single_test(self, test_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single test with the appropriate validator"""
        test_name = test_config.get('name', 'unnamed_test')
        category = TestCategory(test_config.get('category', 'functional'))
        target = test_config.get('target')
        context = test_config.get('context', {})

        self.logger.info(f"Running test: {test_name} ({category.value})")

        if category not in self.validators:
            self.logger.warning(f"No validator available for category: {category.value}")
            return {'name': test_name, 'skipped': True, 'reason': f"No validator for {category.value}"}

        validator = self.validators[category]

        # Wait for target to be ready
        if target:
            await self._wait_for_target_ready(target)

        # Run validation
        start_time = time.time()
        validation_results = await validator.validate(target, context)
        execution_time = time.time() - start_time

        # Determine if test passed
        passed = self._evaluate_test_result(validation_results)

        result = {
            'name': test_name,
            'category': category.value,
            'passed': passed,
            'execution_time': execution_time,
            'validation_results': validation_results,
            'validator': validator.get_name()
        }

        return result

    async def _wait_for_target_ready(self, target: Any):
        """Wait for target to be ready for testing"""
        # Basic readiness check
        if hasattr(target, 'wait_for_load_state'):
            await target.wait_for_load_state('networkidle')
        elif hasattr(target, 'is_visible'):
            # Wait for visibility
            await self.waiter.wait(
                lambda: target.is_visible() if hasattr(target, 'is_visible') else True,
                WaitConfig(strategy=WaitStrategy.VISIBILITY, timeout=5.0)
            )
        else:
            # Default wait
            await asyncio.sleep(0.5)

    def _evaluate_test_result(self, results: Dict[str, Any]) -> bool:
        """Evaluate if test passed based on validation results"""
        if 'error' in results:
            return False

        # Check specific validation results
        for key, value in results.items():
            if value is None:
                continue

            # Handle different result types
            if hasattr(value, 'passed'):  # ValidationResult, RegressionResult, etc.
                if not value.passed:
                    return False
            elif isinstance(value, dict):
                if not value.get('passed', True):
                    return False

        return True

    async def _generate_report(self, result: SuiteResult):
        """Generate validation report"""
        report_dir = Path("validation_reports")
        report_dir.mkdir(exist_ok=True)

        timestamp = int(time.time())
        report_file = report_dir / f"{result.suite_name}_{timestamp}.json"

        # Convert result to serializable format
        serializable_result = {
            'suite_name': result.suite_name,
            'passed': result.passed,
            'total_tests': result.total_tests,
            'passed_tests': result.passed_tests,
            'failed_tests': result.failed_tests,
            'skipped_tests': result.skipped_tests,
            'execution_time': result.execution_time,
            'errors': result.errors,
            'warnings': result.warnings,
            'results': self._serialize_results(result.results)
        }

        with open(report_file, 'w') as f:
            json.dump(serializable_result, f, indent=2, default=str)

        self.logger.info(f"Validation report saved to: {report_file}")

    def _serialize_results(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Serialize results for JSON output"""
        serialized = []

        for result in results:
            serialized_item = {}

            for key, value in result.items():
                if hasattr(value, '__dict__'):
                    # Convert dataclass to dict
                    if hasattr(value, 'to_dict'):
                        serialized_item[key] = value.to_dict()
                    else:
                        serialized_item[key] = value.__dict__
                else:
                    serialized_item[key] = value

            serialized.append(serialized_item)

        return serialized

# Utility functions for common validation patterns
async def quick_component_validation(
    page_or_element: Any,
    component_type: str = "auto",
    level: ValidationLevel = ValidationLevel.STANDARD
) -> Dict[str, Any]:
    """Quick component validation with sensible defaults"""
    config = ValidationConfig(level=level)
    suite = ValidationSuite(config)

    test_config = {
        'name': 'quick_component_test',
        'category': 'functional',
        'target': page_or_element,
        'context': {'component_type': component_type}
    }

    test_suite = TestSuite('quick_validation', [test_config], config)
    result = await suite.run_test_suite(test_suite)

    return {
        'passed': result.passed,
        'execution_time': result.execution_time,
        'test_results': result.results
    }

async def quick_visual_validation(
    page_or_element: Any,
    test_name: str,
    update_baseline: bool = False
) -> Dict[str, Any]:
    """Quick visual regression test"""
    config = ValidationConfig(
        baseline_update_mode=update_baseline,
        enabled_categories={TestCategory.VISUAL}
    )
    suite = ValidationSuite(config)

    test_config = {
        'name': 'quick_visual_test',
        'category': 'visual',
        'target': page_or_element,
        'context': {'test_name': test_name}
    }

    test_suite = TestSuite('quick_visual_validation', [test_config], config)
    result = await suite.run_test_suite(test_suite)

    return {
        'passed': result.passed,
        'execution_time': result.execution_time,
        'test_results': result.results
    }

# Global instance for easy access
default_validation_suite = ValidationSuite()