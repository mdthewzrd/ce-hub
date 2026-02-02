"""
CE Hub Component-Based Testing Strategy

This module implements component-based testing that validates behavior rather than
DOM structure, providing reliable testing through interaction contracts and state validation.
"""

from typing import Dict, List, Any, Optional, Callable, Type, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import json
import logging
from pathlib import Path
from abc import ABC, abstractmethod

# Playwright imports
from playwright.async_api import Page, Locator, Browser, BrowserContext
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

# Local imports
from .stateful_validator import (
    ComponentState, ValidationResult, ComponentType, ValidationState
)


class InteractionType(str, Enum):
    """Types of interactions with components"""
    CLICK = "click"
    FILL = "fill"
    SELECT = "select"
    HOVER = "hover"
    FOCUS = "focus"
    BLUR = "blur"
    KEYPRESS = "keypress"
    UPLOAD = "upload"
    DRAG_DROP = "drag_drop"
    SUBMIT = "submit"
    CANCEL = "cancel"


class ValidationLevel(str, Enum):
    """Levels of validation strictness"""
    BASIC = "basic"        # Check for basic functionality
    INTERACTION = "interaction"  # Validate interaction behavior
    ACCESSIBILITY = "accessibility"  # Check accessibility compliance
    PERFORMANCE = "performance"  # Validate performance characteristics
    INTEGRATION = "integration"  # Check backend integration
    COMPREHENSIVE = "comprehensive"  # All of the above


@dataclass
class InteractionContract:
    """Defines expected behavior for component interactions"""
    component_id: str
    component_type: ComponentType
    interactions: List[InteractionType]
    expected_states: Dict[str, ValidationState]
    validation_rules: List[str]
    pre_conditions: List[Callable] = field(default_factory=list)
    post_conditions: List[Callable] = field(default_factory=list)
    timeout: float = 30.0
    retry_count: int = 3

    def __post_init__(self):
        """Post-initialization setup"""
        if not self.validation_rules:
            self.validation_rules = self._get_default_validation_rules()

    def _get_default_validation_rules(self) -> List[str]:
        """Get default validation rules based on component type"""
        rules = ["state_consistency", "interaction_validity"]

        if self.component_type == ComponentType.FORM:
            rules.extend(["form_validation", "accessibility"])
        elif self.component_type == ComponentType.INPUT:
            rules.extend(["input_validation", "accessibility"])
        elif self.component_type == ComponentType.BUTTON:
            rules.extend(["clickable", "accessibility"])
        elif self.component_type == ComponentType.MODAL:
            rules.extend(["focus_management", "accessibility"])

        return rules


@dataclass
class ComponentTestCase:
    """A test case for a specific component"""
    test_id: str
    name: str
    description: str
    component_id: str
    interaction_contract: InteractionContract
    test_data: Dict[str, Any] = field(default_factory=dict)
    setup_actions: List[Callable] = field(default_factory=list)
    cleanup_actions: List[Callable] = field(default_factory=list)
    validation_level: ValidationLevel = ValidationLevel.BASIC
    tags: List[str] = field(default_factory=list)

    def __post_init__(self):
        """Post-initialization setup"""
        self.created_at = datetime.now()
        self.last_run = None


class ComponentTestRunner:
    """Runs component-based tests with comprehensive validation"""

    def __init__(self, browser: Optional[Browser] = None):
        self.browser = browser
        self.logger = logging.getLogger("component_test_runner")
        self.test_history: List[Dict[str, Any]] = []
        self.performance_metrics = {}
        self.validation_results = {}

    async def run_test_case(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Run a single component test case

        Args:
            test_case: The test case to run
            page: Playwright page instance
            timeout: Optional timeout override

        Returns:
            Test execution results
        """
        start_time = datetime.now()
        test_id = test_case.test_id

        self.logger.info(f"Running test case: {test_case.name} ({test_id})")

        results = {
            "test_id": test_id,
            "name": test_case.name,
            "success": False,
            "start_time": start_time.isoformat(),
            "end_time": None,
            "duration": 0.0,
            "validations": {},
            "interactions": [],
            "errors": [],
            "warnings": [],
            "suggestions": [],
            "performance_metrics": {},
            "validation_level": test_case.validation_level.value
        }

        try:
            # Setup phase
            await self._setup_test(test_case, page)

            # Pre-condition validation
            pre_validation = await self._validate_preconditions(test_case, page)
            if not pre_validation.is_valid:
                results["errors"].extend(pre_validation.errors)
                results["validations"]["pre_conditions"] = pre_validation
                return results

            # Interaction phase
            interaction_results = await self._run_interactions(test_case, page, timeout)
            results["interactions"] = interaction_results
            results["performance_metrics"].update(interaction_results.get("performance", {}))

            # Post-condition validation
            post_validation = await self._validate_postconditions(test_case, page)
            results["validations"]["post_conditions"] = post_validation

            # Overall test success
            results["success"] = (
                len(results["errors"]) == 0 and
                all(result.get("success", False) for result in results["validations"].values())
            )

            # Gather suggestions
            for validation in results["validations"].values():
                results["suggestions"].extend(validation.suggestions)

        except Exception as e:
            self.logger.error(f"Test case {test_id} failed with exception: {e}")
            results["errors"].append(f"Test execution failed: {str(e)}")
            results["success"] = False

        finally:
            # Cleanup phase
            try:
                await self._cleanup_test(test_case, page)
            except Exception as e:
                self.logger.warning(f"Cleanup failed for test {test_id}: {e}")

            # Update timing
            end_time = datetime.now()
            results["end_time"] = end_time.isoformat()
            results["duration"] = (end_time - start_time).total_seconds()

            # Store in history
            self.test_history.append(results)
            test_case.last_run = end_time

        return results

    async def run_test_suite(
        self,
        test_cases: List[ComponentTestCase],
        page: Page,
        parallel: bool = False,
        timeout: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Run a suite of component test cases

        Args:
            test_cases: List of test cases to run
            page: Playwright page instance
            parallel: Whether to run tests in parallel
            timeout: Optional timeout override

        Returns:
            Suite execution results
        """
        suite_start = datetime.now()
        self.logger.info(f"Running test suite with {len(test_cases)} test cases")

        if parallel and len(test_cases) > 1:
            # Run tests in parallel
            tasks = [
                self.run_test_case(test_case, page, timeout)
                for test_case in test_cases
            ]
            test_results = await asyncio.gather(*tasks, return_exceptions=True)
        else:
            # Run tests sequentially
            test_results = []
            for test_case in test_cases:
                result = await self.run_test_case(test_case, page, timeout)
                test_results.append(result)

        # Process results
        successful_tests = sum(1 for result in test_results if isinstance(result, dict) and result.get("success", False))
        total_tests = len(test_results)

        suite_results = {
            "suite_start": suite_start.isoformat(),
            "suite_end": datetime.now().isoformat(),
            "duration": (datetime.now() - suite_start).total_seconds(),
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": total_tests - successful_tests,
            "success_rate": successful_tests / total_tests if total_tests > 0 else 0,
            "test_results": [result for result in test_results if isinstance(result, dict)],
            "performance_summary": self._calculate_performance_summary(test_results)
        }

        self.logger.info(
            f"Test suite completed: {successful_tests}/{total_tests} tests passed "
            f"({suite_results['success_rate']:.1%}) in {suite_results['duration']:.2f}s"
        )

        return suite_results

    async def _setup_test(self, test_case: ComponentTestCase, page: Page):
        """Setup test environment"""
        self.logger.debug(f"Setting up test {test_case.test_id}")

        for setup_action in test_case.setup_actions:
            try:
                await setup_action(page, test_case)
            except Exception as e:
                raise Exception(f"Setup action failed: {str(e)}")

    async def _validate_preconditions(
        self,
        test_case: ComponentTestCase,
        page: Page
    ) -> ValidationResult:
        """Validate test preconditions"""
        validation = ValidationResult(
            is_valid=True,
            component_id=test_case.component_id,
            validation_type="preconditions",
            state=ValidationState.READY,
            message="Preconditions validated"
        )

        for pre_condition in test_case.interaction_contract.pre_conditions:
            try:
                result = await pre_condition(page, test_case)
                if not result:
                    validation.add_error(f"Precondition failed: {pre_condition.__name__}")
            except Exception as e:
                validation.add_error(f"Precondition error: {str(e)}")

        return validation

    async def _run_interactions(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: Optional[float]
    ) -> Dict[str, Any]:
        """Run component interactions"""
        interaction_timeout = timeout or test_case.interaction_contract.timeout
        interaction_results = {
            "executed": [],
            "performance": {},
            "errors": []
        }

        performance_start = datetime.now()

        for interaction_type in test_case.interaction_contract.interactions:
            try:
                interaction_start = datetime.now()

                if interaction_type == InteractionType.CLICK:
                    await self._perform_click(test_case, page, interaction_timeout)
                elif interaction_type == InteractionType.FILL:
                    await self._perform_fill(test_case, page, interaction_timeout)
                elif interaction_type == InteractionType.SELECT:
                    await self._perform_select(test_case, page, interaction_timeout)
                elif interaction_type == InteractionType.UPLOAD:
                    await self._perform_upload(test_case, page, interaction_timeout)
                elif interaction_type == InteractionType.HOVER:
                    await self._perform_hover(test_case, page, interaction_timeout)
                elif interaction_type == InteractionType.FOCUS:
                    await self._perform_focus(test_case, page, interaction_timeout)
                elif interaction_type == InteractionType.SUBMIT:
                    await self._perform_submit(test_case, page, interaction_timeout)

                interaction_end = datetime.now()
                interaction_duration = (interaction_end - interaction_start).total_seconds()

                interaction_results["executed"].append({
                    "type": interaction_type.value,
                    "duration": interaction_duration,
                    "success": True
                })

            except Exception as e:
                self.logger.error(f"Interaction {interaction_type} failed: {e}")
                interaction_results["errors"].append(f"{interaction_type}: {str(e)}")

        interaction_results["performance"]["total_interaction_time"] = (
            datetime.now() - performance_start
        ).total_seconds()

        return interaction_results

    async def _validate_postconditions(
        self,
        test_case: ComponentTestCase,
        page: Page
    ) -> ValidationResult:
        """Validate test postconditions"""
        validation = ValidationResult(
            is_valid=True,
            component_id=test_case.component_id,
            validation_type="postconditions",
            state=ValidationState.SUCCESS,
            message="Postconditions validated"
        )

        # Validate expected states
        for state_name, expected_state in test_case.interaction_contract.expected_states.items():
            try:
                from .stateful_validator import create_stateful_validator
                validator = create_stateful_validator()

                # Wait for expected state
                state_result = await validator.wait_for_state(
                    page,
                    test_case.component_id,
                    expected_state,
                    test_case.interaction_contract.timeout
                )

                if not state_result.is_valid:
                    validation.add_error(f"Expected state {expected_state} not reached for {state_name}")

            except Exception as e:
                validation.add_error(f"Postcondition validation failed for {state_name}: {str(e)}")

        # Run post-condition functions
        for post_condition in test_case.interaction_contract.post_conditions:
            try:
                result = await post_condition(page, test_case)
                if not result:
                    validation.add_error(f"Postcondition failed: {post_condition.__name__}")
            except Exception as e:
                validation.add_error(f"Postcondition error: {str(e)}")

        return validation

    async def _cleanup_test(self, test_case: ComponentTestCase, page: Page):
        """Cleanup test environment"""
        self.logger.debug(f"Cleaning up test {test_case.test_id}")

        for cleanup_action in test_case.cleanup_actions:
            try:
                await cleanup_action(page, test_case)
            except Exception as e:
                self.logger.warning(f"Cleanup action failed for test {test_case.test_id}: {e}")

    async def _perform_click(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform click interaction"""
        component_id = test_case.component_id

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for click")

        # Perform click
        await component.click(timeout=timeout)

    async def _perform_fill(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform fill interaction"""
        component_id = test_case.component_id
        test_data = test_case.test_data

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for fill")

        # Get fill value
        fill_value = test_data.get("value", "")
        if not fill_value:
            raise Exception("No fill value provided for input component")

        # Perform fill
        await component.fill(fill_value, timeout=timeout)

    async def _perform_select(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform select interaction"""
        component_id = test_case.component_id
        test_data = test_case.test_data

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for select")

        # Get select value
        select_value = test_data.get("value", "")
        if not select_value:
            raise Exception("No select value provided for dropdown component")

        # Perform select
        await component.select_option(label=select_value, timeout=timeout)

    async def _perform_upload(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform file upload interaction"""
        component_id = test_case.component_id
        test_data = test_case.test_data

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for upload")

        # Get file path
        file_path = test_data.get("file_path")
        if not file_path:
            raise Exception("No file path provided for upload")

        # Perform upload
        await component.set_input_files(file_path)

    async def _perform_hover(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform hover interaction"""
        component_id = test_case.component_id

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for hover")

        # Perform hover
        await component.hover(timeout=timeout)

    async def _perform_focus(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform focus interaction"""
        component_id = test_case.component_id

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for focus")

        # Perform focus
        await component.focus(timeout=timeout)

    async def _perform_submit(
        self,
        test_case: ComponentTestCase,
        page: Page,
        timeout: float
    ):
        """Perform submit interaction"""
        component_id = test_case.component_id

        # Find component
        component = await self._find_component(page, component_id)
        if not component:
            raise Exception(f"Component {component_id} not found for submit")

        # Look for submit button within the form
        submit_button = await component.locator('button[type="submit"]').first()
        if await submit_button.count() > 0:
            await submit_button.click(timeout=timeout)
        else:
            # Try to submit form directly
            await component.evaluate((element) => element.submit(), timeout=timeout)

    async def _find_component(
        self,
        page: Page,
        component_id: str
    ) -> Optional[Locator]:
        """Find component by ID using multiple strategies"""
        strategies = [
            # Try data-testid
            lambda: page.get_by_test_id(component_id),
            # Try ID
            lambda: page.locator(f"#{component_id}"),
            # Try name attribute
            lambda: page.locator(f'[name="{component_id}"]'),
            # Try aria-label
            lambda: page.locator(f'[aria-label*="{component_id}"]'),
            # Try title
            lambda: page.locator(f'[title*="{component_id}"]'),
            # Try placeholder
            lambda: page.locator(f'[placeholder*="{component_id}"]'),
            # Try text content
            lambda: page.locator(f"text={component_id}"),
        ]

        for strategy in strategies:
            try:
                component = strategy()
                if await component.count() > 0:
                    return component
            except:
                continue

        return None

    def _calculate_performance_summary(self, test_results: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate performance summary from test results"""
        if not test_results:
            return {}

        durations = [
            result.get("duration", 0) for result in test_results
            if isinstance(result, dict) and result.get("duration")
        ]

        interaction_times = []
        for result in test_results:
            if isinstance(result, dict) and "performance_metrics" in result:
                interaction_time = result["performance_metrics"].get("total_interaction_time", 0)
                interaction_times.append(interaction_time)

        return {
            "average_duration": sum(durations) / len(durations) if durations else 0,
            "max_duration": max(durations) if durations else 0,
            "min_duration": min(durations) if durations else 0,
            "average_interaction_time": sum(interaction_times) / len(interaction_times) if interaction_times else 0,
            "max_interaction_time": max(interaction_times) if interaction_times else 0
        }


# Pre-built component test contracts
class ComponentContracts:
    """Pre-built component contracts for common UI patterns"""

    @staticmethod
    def login_form() -> InteractionContract:
        """Login form interaction contract"""
        return InteractionContract(
            component_id="login-form",
            component_type=ComponentType.FORM,
            interactions=[InteractionType.FILL, InteractionType.SUBMIT],
            expected_states={
                "form_ready": ValidationState.READY,
                "processing": ValidationState.PROCESSING,
                "success": ValidationState.SUCCESS,
                "error": ValidationState.ERROR
            },
            validation_rules=["form_validation", "accessibility", "input_validation"],
            timeout=30.0
        )

    @staticmethod
    def search_input() -> InteractionContract:
        """Search input interaction contract"""
        return InteractionContract(
            component_id="search-input",
            component_type=ComponentType.INPUT,
            interactions=[InteractionType.FILL, InteractionType.SUBMIT],
            expected_states={
                "ready": ValidationState.READY,
                "processing": ValidationState.PROCESSING,
                "results_loaded": ValidationState.SUCCESS
            },
            validation_rules=["input_validation", "accessibility"],
            timeout=15.0
        )

    @staticmethod
    def upload_button() -> InteractionContract:
        """Upload button interaction contract"""
        return InteractionContract(
            component_id="upload-button",
            componentType=ComponentType.BUTTON,
            interactions=[InteractionType.CLICK],
            expected_states={
                "ready": ValidationState.READY,
                "uploading": ValidationState.PROCESSING,
                "success": ValidationState.SUCCESS
            },
            validation_rules=["clickable", "accessible"],
            timeout=60.0
        )

    @staticmethod
    def modal_dialog() -> InteractionContract:
        """Modal dialog interaction contract"""
        return InteractionContract(
            component_id="modal-dialog",
            componentType=ComponentType.MODAL,
            interactions=[InteractionType.CLICK, InteractionType.CLOSE],
            expected_states={
                "closed": ValidationState.INITIAL,
                "open": ValidationState.READY,
                "closing": ValidationState.PROCESSING
            },
            validation_rules=["focus_management", "accessibility"],
            timeout=15.0
        )

    @staticmethod
    def navigation_menu() -> InteractionContract:
        """Navigation menu interaction contract"""
        return InteractionContract(
            component_id="navigation-menu",
            componentType=ComponentType.NAVIGATION,
            interactions=[InteractionType.CLICK, InteractionType.HOVER],
            expected_states={
                "collapsed": ValidationState.INITIAL,
                "expanded": ValidationState.READY
            },
            validation_rules=["accessible", "clickable"],
            timeout=10.0
        )


# Pre-built test cases
class ComponentTestCases:
    """Pre-built component test cases"""

    @staticmethod
    def create_login_test() -> ComponentTestCase:
        """Create login form test case"""
        return ComponentTestCase(
            test_id="login-001",
            name="User Login Form Test",
            description="Validates user can successfully login with valid credentials",
            component_id="login-form",
            interaction_contract=ComponentContracts.login_form(),
            test_data={
                "username": "testuser@example.com",
                "password": "testpass123"
            },
            validation_level=ValidationLevel.INTERACTION,
            tags=["authentication", "form", "critical"]
        )

    @staticmethod
    def create_search_test() -> ComponentTestCase:
        """Create search input test case"""
        return ComponentTestCase(
            test_id="search-001",
            name="Search Functionality Test",
            description="Validates search input accepts text and returns results",
            component_id="search-input",
            interaction_contract=ComponentContracts.search_input(),
            test_data={
                "value": "test search query"
            },
            validation_level=ValidationLevel.INTERACTION,
            tags=["search", "input", "ux"]
        )

    @staticmethod
    def create_file_upload_test() -> ComponentTestCase:
        """Create file upload test case"""
        return ComponentTestCase(
            test_id="upload-001",
            name="File Upload Test",
            description="Validates file upload accepts files and processes them correctly",
            component_id="upload-button",
            interaction_contract=ComponentContracts.upload_button(),
            test_data={
                "file_path": "/tmp/test-upload.txt",
                "file_name": "test.txt"
            },
            validation_level=ValidationLevel.INTEGRATION,
            tags=["upload", "file", "integration"]
        )


# Test runner factory function
def create_component_test_runner(browser: Optional[Browser] = None) -> ComponentTestRunner:
    """Create a component test runner instance"""
    return ComponentTestRunner(browser)


# Utility functions for common test patterns
async def test_component_lifecycle(
    page: Page,
    component_id: str,
    component_type: ComponentType,
    test_data: Dict[str, Any],
    timeout: float = 30.0
) -> Dict[str, Any]:
    """Test component lifecycle from initialization to completion"""
    runner = create_component_test_runner()

    # Create test case
    test_case = ComponentTestCase(
        test_id=f"lifecycle-{component_id}",
        name=f"{component_id.title()} Lifecycle Test",
        description=f"Tests {component_id.title()} component through full lifecycle",
        component_id=component_id,
        component_type=component_type,
        interaction_contract=InteractionContract(
            component_id=component_id,
            component_type=component_type,
            interactions=[InteractionType.CLICK],  # Simplified for lifecycle test
            expected_states={"ready": ValidationState.READY},
            validation_level=ValidationLevel.BASIC
        ),
        test_data=test_data,
        validation_level=ValidationLevel.COMPREHENSIVE,
        tags=["lifecycle", component_id]
    )

    # Run test
    return await runner.run_test_case(test_case, page, timeout)


async def test_component_accessibility(
    page: Page,
    component_id: str,
    component_type: ComponentType,
    timeout: float = 15.0
) -> Dict[str, Any]:
    """Test component accessibility compliance"""
    runner = create_component_test_runner()

    # Create accessibility test case
    test_case = ComponentTestCase(
        test_id=f"a11y-{component_id}",
        name=f"{component_id.title()} Accessibility Test",
        description=f"Tests {component_id.title()} accessibility compliance",
        component_id=component_id,
        component_type=component_type,
        interaction_contract=InteractionContract(
            component_id=component_id,
            component_type=component_type,
            interactions=[],
            expected_states={},
            validation_rules=["accessibility", "focus_management"],
            validation_level=ValidationLevel.ACCESSIBILITY
        ),
        validation_level=ValidationLevel.ACCESSIBILITY,
        tags=["accessibility", "a11y", component_id]
    )

    # Run test
    return await runner.run_test_case(test_case, page, timeout)


async def test_component_performance(
    page: Page,
    component_id: str,
    component_type: ComponentType,
    interaction_count: int = 10,
    timeout: float = 60.0
) -> Dict[str, Any]:
    """Test component performance under load"""
    runner = create_component_test_runner()

    # Create performance test case
    test_case = ComponentTestCase(
        test_id=f"perf-{component_id}",
        name=f"{component_id.title()} Performance Test",
        description=f"Tests {component_id.title()} performance under {interaction_count} interactions",
        component_id=component_id,
        component_type=component_type,
        interaction_contract=InteractionContract(
            component_id=component_id,
            component_type=component_type,
            interactions=[InteractionType.CLICK] * interaction_count,
            expected_states={},
            validation_level=ValidationLevel.PERFORMANCE
        ),
        validation_level=ValidationLevel.PERFORMANCE,
        tags=["performance", component_id]
    )

    # Run test
    return await runner.run_test_case(test_case, page, timeout)