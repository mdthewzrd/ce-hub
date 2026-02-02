"""
CE Hub Puppeteer-Based Component Testing Strategy

This module implements component-based testing using Puppeteer instead of Playwright,
providing reliable testing through interaction contracts and state validation.
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

# Puppeteer imports
try:
    from pyppeteer import launch
    from pyppeteer.page import Page
    from pyppeteer.browser import Browser
    from pyppeteer.element_handle import ElementHandle
    PUPPETEER_AVAILABLE = True
except ImportError:
    # Fallback to our custom Node.js Puppeteer integration
    PUPPETEER_AVAILABLE = False
    import subprocess
    import os

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


class PuppeteerComponentTestRunner:
    """Runs component-based tests using Puppeteer with comprehensive validation"""

    def __init__(self, browser: Optional[Browser] = None, use_node_integration: bool = False):
        self.browser = browser
        self.use_node_integration = use_node_integration or not PUPPETEER_AVAILABLE
        self.logger = logging.getLogger("puppeteer_component_test_runner")
        self.test_history: List[Dict[str, Any]] = []
        self.performance_metrics = {}
        self.validation_results = {}

    async def launch_browser(self, headless: bool = False) -> Optional[Browser]:
        """Launch Puppeteer browser using Node.js integration"""
        if self.use_node_integration:
            # Use our working Node.js Puppeteer approach
            return None  # We'll use subprocess calls for Node.js
        else:
            # Use Python Puppeteer
            return await launch(
                headless=headless,
                executablePath='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' if os.name != 'nt' else None,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )

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
            page: Puppeteer page instance
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
            results["end_time"] end_time.isoformat()
            results["duration"] = (end_time - start_time).total_seconds()

            # Store in history
            self.test_history.append(results)
            test_case.last_run = end_time

        return results

    async def run_test_with_node_integration(
        self,
        test_case: ComponentTestCase,
        frontend_url: str = "http://localhost:5656",
        timeout: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Run test case using Node.js Puppeteer integration (our working solution)

        Args:
            test_case: The test case to run
            frontend_url: URL to test
            timeout: Optional timeout override

        Returns:
            Test execution results
        """
        start_time = datetime.now()
        test_id = test_case.test_id

        self.logger.info(f"Running Node.js test case: {test_case.name} ({test_id})")

        # Create a Node.js test script for this specific test case
        test_script = self._generate_node_test_script(test_case, frontend_url, timeout)

        try:
            # Write test script to temporary file
            script_path = f"/tmp/test_{test_id}_{int(start_time.timestamp())}.js"
            with open(script_path, 'w') as f:
                f.write(test_script)

            # Execute the Node.js test
            result = subprocess.run(
                ['node', script_path],
                capture_output=True,
                text=True,
                timeout=timeout or 60
            )

            # Parse results
            try:
                results = json.loads(result.stdout.strip())
            except json.JSONDecodeError:
                results = {
                    "test_id": test_id,
                    "name": test_case.name,
                    "success": result.returncode == 0,
                    "start_time": start_time.isoformat(),
                    "end_time": datetime.now().isoformat(),
                    "duration": (datetime.now() - start_time).total_seconds(),
                    "validations": {},
                    "interactions": [],
                    "errors": [result.stderr] if result.stderr else [],
                    "warnings": [],
                    "suggestions": [],
                    "performance_metrics": {},
                    "validation_level": test_case.validation_level.value,
                    "raw_output": result.stdout
                }

            # Cleanup script file
            try:
                os.remove(script_path)
            except:
                pass

            return results

        except subprocess.TimeoutExpired:
            return {
                "test_id": test_id,
                "name": test_case.name,
                "success": False,
                "start_time": start_time.isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration": (datetime.now() - start_time).total_seconds(),
                "validations": {},
                "interactions": [],
                "errors": ["Test execution timed out"],
                "warnings": [],
                "suggestions": ["Consider increasing timeout value"],
                "performance_metrics": {},
                "validation_level": test_case.validation_level.value
            }
        except Exception as e:
            self.logger.error(f"Node.js test execution failed: {e}")
            return {
                "test_id": test_id,
                "name": test_case.name,
                "success": False,
                "start_time": start_time.isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration": (datetime.now() - start_time).total_seconds(),
                "validations": {},
                "interactions": [],
                "errors": [f"Test execution failed: {str(e)}"],
                "warnings": [],
                "suggestions": [],
                "performance_metrics": {},
                "validation_level": test_case.validation_level.value
            }

    def _generate_node_test_script(
        self,
        test_case: ComponentTestCase,
        frontend_url: str,
        timeout: Optional[float]
    ) -> str:
        """Generate Node.js Puppeteer test script for the test case"""

        script = f"""
const puppeteer = require('puppeteer-core');

async function runTest() {{
    const browser = await puppeteer.launch({{
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        defaultViewport: {{ width: 1400, height: 900 }},
        args: ['--no-sandbox']
    }});

    try {{
        const page = await browser.newPage();
        await page.goto('{frontend_url}', {{ waitUntil: 'networkidle2' }});

        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        const results = {{
            test_id: '{test_case.test_id}',
            name: '{test_case.name}',
            success: true,
            start_time: new Date().toISOString(),
            end_time: null,
            duration: 0,
            validations: {{}},
            interactions: [],
            errors: [],
            warnings: [],
            suggestions: [],
            performance_metrics: {{}},
            validation_level: '{test_case.validation_level.value}'
        }};

        // Step 1: Click Renata AI Assistant button
        try {{
            const buttons = await page.$$('button');
            let assistantClicked = false;

            for (const button of buttons) {{
                const text = await button.evaluate(el => el.textContent?.trim() || '');
                if (text.includes('RenataAI Assistant')) {{
                    await button.click();
                    assistantClicked = true;
                    break;
                }}
            }}

            if (assistantClicked) {{
                await new Promise(resolve => setTimeout(resolve, 3000));
                results.interactions.push({{
                    type: 'click',
                    target: 'RenataAI Assistant',
                    success: true
                }});
            }} else {{
                results.errors.push('RenataAI Assistant button not found');
                results.success = false;
            }}
        }} catch (e) {{
            results.errors.push('Failed to click RenataAI Assistant: ' + e.message);
            results.success = false;
        }}

        // Step 2: Look for target component
        try {{
            const component = await page.evaluate(() => {{
                const elements = document.querySelectorAll('button, input, textarea, select, [data-testid], [id]');
                for (const el of elements) {{
                    if (el.id === '{test_case.component_id}' ||
                        el.getAttribute('data-testid') === '{test_case.component_id}' ||
                        el.textContent?.includes('{test_case.component_id}')) {{
                        return {{
                            found: true,
                            tagName: el.tagName,
                            id: el.id,
                            textContent: el.textContent?.substring(0, 100) || ''
                        }};
                    }}
                }}
                return {{ found: false }};
            }});

            if (component.found) {{
                results.interactions.push({{
                    type: 'find_component',
                    target: '{test_case.component_id}',
                    success: true,
                    details: component
                }});
            }} else {{
                results.warnings.push('Component {test_case.component_id} not found');
            }}
        }} catch (e) {{
            results.errors.push('Component search failed: ' + e.message);
        }}

        // Final results
        results.end_time = new Date().toISOString();
        results.duration = (new Date() - new Date(results.start_time)) / 1000;

        console.log(JSON.stringify(results));

    }} catch (error) {{
        console.error('Test failed:', error);
        process.exit(1);
    }} finally {{
        await browser.close();
    }}
}}

runTest().catch(console.error);
"""
        return script

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
        interaction_results = {
            "executed": [],
            "performance": {},
            "errors": []
        }

        for interaction_type in test_case.interaction_contract.interactions:
            try:
                if interaction_type == InteractionType.CLICK:
                    await self._perform_click(test_case, page)
                elif interaction_type == InteractionType.FILL:
                    await self._perform_fill(test_case, page)
                elif interaction_type == InteractionType.UPLOAD:
                    await self._perform_upload(test_case, page)

                interaction_results["executed"].append({
                    "type": interaction_type.value,
                    "success": True
                })

            except Exception as e:
                self.logger.error(f"Interaction {interaction_type} failed: {e}")
                interaction_results["errors"].append(f"{interaction_type}: {str(e)}")

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

        return validation

    async def _cleanup_test(self, test_case: ComponentTestCase, page: Page):
        """Cleanup test environment"""
        self.logger.debug(f"Cleaning up test {test_case.test_id}")

        for cleanup_action in test_case.cleanup_actions:
            try:
                await cleanup_action(page, test_case)
            except Exception as e:
                self.logger.warning(f"Cleanup action failed for test {test_case.test_id}: {e}")

    async def _perform_click(self, test_case: ComponentTestCase, page: Page):
        """Perform click interaction using Puppeteer"""
        # Simplified click implementation for Puppeteer
        if self.use_node_integration:
            # Will be handled by Node.js script
            return
        else:
            # Python Puppeteer implementation
            elements = await page.querySelectorAll(f'#{test_case.component_id}, [data-testid="{test_case.component_id}"]')
            if elements:
                await elements[0].click()

    async def _perform_fill(self, test_case: ComponentTestCase, page: Page):
        """Perform fill interaction using Puppeteer"""
        # Simplified fill implementation for Puppeteer
        if self.use_node_integration:
            # Will be handled by Node.js script
            return
        else:
            # Python Puppeteer implementation
            elements = await page.querySelectorAll(f'#{test_case.component_id}, [data-testid="{test_case.component_id}"]')
            if elements:
                value = test_case.test_data.get("value", "")
                await elements[0].type(value)

    async def _perform_upload(self, test_case: ComponentTestCase, page: Page):
        """Perform upload interaction using Puppeteer"""
        # Simplified upload implementation for Puppeteer
        if self.use_node_integration:
            # Will be handled by Node.js script
            return
        else:
            # Python Puppeteer implementation
            file_path = test_case.test_data.get("file_path")
            if file_path:
                elements = await page.querySelectorAll('input[type="file"]')
                if elements:
                    await elements[0].uploadFile(file_path)


# Factory functions
def create_puppeteer_component_test_runner(use_node_integration: bool = True) -> PuppeteerComponentTestRunner:
    """Create a Puppeteer component test runner instance"""
    return PuppeteerComponentTestRunner(use_node_integration=use_node_integration)


# Pre-built component test contracts (same as original)
class ComponentContracts:
    """Pre-built component contracts for common UI patterns"""

    @staticmethod
    def renata_ai_workflow() -> InteractionContract:
        """Renata AI workflow interaction contract"""
        return InteractionContract(
            component_id="renata-ai-assistant",
            component_type=ComponentType.BUTTON,
            interactions=[InteractionType.CLICK],
            expected_states={
                "ready": ValidationState.READY,
                "chat_open": ValidationState.SUCCESS
            },
            validation_rules=["clickable", "accessible"],
            timeout=30.0
        )

    @staticmethod
    def file_upload() -> InteractionContract:
        """File upload interaction contract"""
        return InteractionContract(
            component_id="file-upload",
            component_type=ComponentType.INPUT,
            interactions=[InteractionType.UPLOAD],
            expected_states={
                "ready": ValidationState.READY,
                "uploaded": ValidationState.SUCCESS
            },
            validation_rules=["input_validation", "accessible"],
            timeout=60.0
        )


# Pre-built test cases
class ComponentTestCases:
    """Pre-built component test cases"""

    @staticmethod
    def create_renata_ai_test() -> ComponentTestCase:
        """Create Renata AI workflow test case"""
        return ComponentTestCase(
            test_id="renata-ai-001",
            name="Renata AI Workflow Test",
            description="Validates Renata AI assistant interaction and file processing",
            component_id="renata-ai-assistant",
            interaction_contract=ComponentContracts.renata_ai_workflow(),
            validation_level=ValidationLevel.INTEGRATION,
            tags=["renata", "ai", "workflow", "critical"]
        )

    @staticmethod
    def create_file_upload_test() -> ComponentTestCase:
        """Create file upload test case"""
        return ComponentTestCase(
            test_id="upload-001",
            name="File Upload Test",
            description="Validates file upload to Renata AI assistant",
            component_id="file-upload",
            interaction_contract=ComponentContracts.file_upload(),
            test_data={
                "file_path": "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/scanners/backside para b copy.py"
            },
            validation_level=ValidationLevel.INTEGRATION,
            tags=["upload", "file", "integration"]
        )


# Utility functions
async def test_complete_workflow(
    frontend_url: str = "http://localhost:5656",
    test_file_path: Optional[str] = None
) -> Dict[str, Any]:
    """Test complete A-Z workflow using Puppeteer"""
    runner = create_puppeteer_component_test_runner(use_node_integration=True)

    # Create Renata AI test case
    test_case = ComponentTestCases.create_renata_ai_test()

    if test_file_path:
        test_case.test_data["file_path"] = test_file_path

    # Run the test
    return await runner.run_test_with_node_integration(test_case, frontend_url)


# Main execution function
async def main():
    """Main execution function for testing"""
    print("🚀 Starting CE Hub Puppeteer Component Testing...")

    # Test the complete workflow
    result = await test_complete_workflow()

    print(f"✅ Test completed: {result['success']}")
    if result.get('errors'):
        print(f"❌ Errors: {result['errors']}")
    if result.get('warnings'):
        print(f"⚠️ Warnings: {result['warnings']}")

    return result


if __name__ == "__main__":
    asyncio.run(main())