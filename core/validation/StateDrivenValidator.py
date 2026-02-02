"""
Phase 2: Visual Validation Overhaul
State-Driven Validation System replacing brittle PlayWright
"""

from typing import Dict, List, Optional, Any, Union, Callable, TypeVar, Tuple, Set
from pydantic import BaseModel, Field, validator
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
from datetime import datetime, timedelta
import hashlib
import time
import re
from dataclasses import dataclass
from collections import defaultdict

logger = logging.getLogger(__name__)

T = TypeVar('T')

class ValidationState(str, Enum):
    """Validation state enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    TIMEOUT = "timeout"

class ValidationSeverity(str, Enum):
    """Validation issue severity"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class ComponentType(str, Enum):
    """Component type enumeration"""
    BUTTON = "button"
    INPUT = "input"
    SELECT = "select"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    TEXT = "text"
    IMAGE = "image"
    LINK = "link"
    TABLE = "table"
    FORM = "form"
    MODAL = "modal"
    NAVIGATION = "navigation"
    LAYOUT = "layout"

class ValidationRule(BaseModel):
    """Validation rule definition"""
    id: str = Field(..., description="Rule identifier")
    name: str = Field(..., description="Rule name")
    description: str = Field(..., description="Rule description")
    component_types: List[ComponentType] = Field(..., description="Applicable component types")
    severity: ValidationSeverity = Field(..., description="Issue severity")
    validator: str = Field(..., description="Validator function name")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Rule parameters")
    enabled: bool = Field(default=True, description="Whether rule is enabled")
    timeout: int = Field(default=30, description="Timeout in seconds")

    class Config:
        use_enum_values = True

@dataclass
class ComponentState:
    """Component state representation"""
    component_id: str
    component_type: ComponentType
    properties: Dict[str, Any]
    visible: bool
    enabled: bool
    text_content: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    size: Optional[Dict[str, float]] = None
    parent_id: Optional[str] = None
    children_ids: Set[str] = None
    last_updated: float = Field(default_factory=time.time)
    checksum: str = ""

    def __post_init__(self):
        if self.children_ids is None:
            self.children_ids = set()
        self.checksum = self._calculate_checksum()

    def _calculate_checksum(self) -> str:
        """Calculate checksum of component state"""
        state_data = {
            "component_type": self.component_type,
            "properties": self.properties,
            "visible": self.visible,
            "enabled": self.enabled,
            "text_content": self.text_content,
            "position": self.position,
            "size": self.size,
            "parent_id": self.parent_id
        }
        return hashlib.md5(json.dumps(state_data, sort_keys=True).encode()).hexdigest()

    def update(self, **kwargs):
        """Update component state"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.last_updated = time.time()
        self.checksum = self._calculate_checksum()

class ValidationIssue(BaseModel):
    """Validation issue representation"""
    rule_id: str
    component_id: str
    severity: ValidationSeverity
    title: str
    description: str
    suggestion: Optional[str] = None
    screenshot: Optional[str] = None
    element_selector: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    context: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True

class ValidationResult(BaseModel):
    """Validation result representation"""
    rule_id: str
    state: ValidationState
    issues: List[ValidationIssue] = Field(default_factory=list)
    execution_time: float = Field(ge=0, description="Execution time in seconds")
    timestamp: datetime = Field(default_factory=datetime.now)
    details: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True

class ComponentValidator(ABC):
    """Abstract base class for component validators"""

    @abstractmethod
    async def validate(self, component: ComponentState, rule: ValidationRule) -> ValidationResult:
        """Validate component against rule"""
        pass

class VisibilityValidator(ComponentValidator):
    """Validator for component visibility"""

    async def validate(self, component: ComponentState, rule: ValidationRule) -> ValidationResult:
        """Validate component visibility"""
        start_time = time.time()
        issues = []

        try:
            # Check if component should be visible
            should_be_visible = rule.parameters.get("should_be_visible", True)

            if should_be_visible and not component.visible:
                issues.append(ValidationIssue(
                    rule_id=rule.id,
                    component_id=component.component_id,
                    severity=rule.severity,
                    title="Component not visible",
                    description=f"Component {component.component_id} should be visible but is hidden",
                    suggestion="Check component CSS display property and parent visibility",
                    element_selector=f"#{component.component_id}"
                ))
            elif not should_be_visible and component.visible:
                issues.append(ValidationIssue(
                    rule_id=rule.id,
                    component_id=component.component_id,
                    severity=ValidationSeverity.WARNING,
                    title="Component visible when it should be hidden",
                    description=f"Component {component.component_id} should be hidden but is visible",
                    suggestion="Check component visibility conditions"
                ))

            # Check if component is within viewport
            if component.visible and rule.parameters.get("check_viewport", False):
                if not self._is_in_viewport(component):
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.WARNING,
                        title="Component outside viewport",
                        description=f"Component {component.component_id} is not within the visible viewport",
                        suggestion="Scroll to component or adjust layout"
                    ))

        except Exception as e:
            logger.error(f"Visibility validation error: {e}")
            return ValidationResult(
                rule_id=rule.id,
                state=ValidationState.FAILED,
                execution_time=time.time() - start_time,
                details={"error": str(e)}
            )

        return ValidationResult(
            rule_id=rule.id,
            state=ValidationState.COMPLETED,
            issues=issues,
            execution_time=time.time() - start_time
        )

    def _is_in_viewport(self, component: ComponentState) -> bool:
        """Check if component is within viewport"""
        if not component.position:
            return True  # Assume visible if no position data

        # Simple viewport check (adjust based on actual viewport size)
        x, y = component.position.get("x", 0), component.position.get("y", 0)
        width, height = component.size.get("width", 0), component.size.get("height", 0)

        viewport_width, viewport_height = 1920, 1080  # Default viewport size

        return (x >= 0 and x + width <= viewport_width and
                y >= 0 and y + height <= viewport_height)

class AccessibilityValidator(ComponentValidator):
    """Validator for accessibility compliance"""

    async def validate(self, component: ComponentState, rule: ValidationRule) -> ValidationResult:
        """Validate component accessibility"""
        start_time = time.time()
        issues = []

        try:
            # Check for alt text on images
            if component.component_type == ComponentType.IMAGE:
                alt_text = component.properties.get("alt", "")
                if not alt_text:
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.ERROR,
                        title="Missing alt text",
                        description="Image component is missing alt text for screen readers",
                        suggestion="Add descriptive alt text to improve accessibility"
                    ))

            # Check for proper button labeling
            if component.component_type == ComponentType.BUTTON:
                if not component.text_content and not component.properties.get("aria-label"):
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.ERROR,
                        title="Unlabeled button",
                        description="Button has no text content or aria-label",
                        suggestion="Add descriptive text or aria-label to button"
                    ))

            # Check form input labeling
            if component.component_type == ComponentType.INPUT:
                has_label = component.properties.get("aria-label") or component.properties.get("aria-labelledby")
                if not has_label:
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.WARNING,
                        title="Unlabeled form input",
                        description="Form input lacks proper labeling",
                        suggestion="Add label element or aria-label for accessibility"
                    ))

            # Check color contrast (simplified)
            if rule.parameters.get("check_contrast", False):
                if not self._check_color_contrast(component):
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.WARNING,
                        title="Poor color contrast",
                        description="Component text may have insufficient color contrast",
                        suggestion="Improve color contrast for better readability"
                    ))

        except Exception as e:
            logger.error(f"Accessibility validation error: {e}")
            return ValidationResult(
                rule_id=rule.id,
                state=ValidationState.FAILED,
                execution_time=time.time() - start_time,
                details={"error": str(e)}
            )

        return ValidationResult(
            rule_id=rule.id,
            state=ValidationState.COMPLETED,
            issues=issues,
            execution_time=time.time() - start_time
        )

    def _check_color_contrast(self, component: ComponentState) -> bool:
        """Simplified color contrast check"""
        # In a real implementation, this would calculate actual contrast ratios
        # For now, return True (pass) as placeholder
        return True

class FunctionalityValidator(ComponentValidator):
    """Validator for component functionality"""

    async def validate(self, component: ComponentState, rule: ValidationRule) -> ValidationResult:
        """Validate component functionality"""
        start_time = time.time()
        issues = []

        try:
            # Check if button is clickable
            if component.component_type == ComponentType.BUTTON:
                if not component.enabled:
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.ERROR,
                        title="Button not enabled",
                        description="Button is disabled but should be clickable",
                        suggestion="Enable button functionality"
                    ))

                # Check for click handlers
                has_click_handler = component.properties.get("onclick") or component.properties.get("data-action")
                if not has_click_handler and rule.parameters.get("require_interactivity", False):
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.WARNING,
                        title="No click handler found",
                        description="Button may not have proper click functionality",
                        suggestion="Add appropriate click event handler"
                    ))

            # Check form inputs
            if component.component_type == ComponentType.INPUT:
                input_type = component.properties.get("type", "text")

                # Validate email inputs
                if input_type == "email":
                    pattern = component.properties.get("pattern")
                    if not pattern:
                        issues.append(ValidationIssue(
                            rule_id=rule.id,
                            component_id=component.component_id,
                            severity=ValidationSeverity.WARNING,
                            title="Email input missing validation pattern",
                            description="Email input should have proper validation pattern",
                            suggestion="Add email validation pattern for better UX"
                        ))

                # Check required fields
                if component.properties.get("required", False):
                    if not component.properties.get("aria-required"):
                        issues.append(ValidationIssue(
                            rule_id=rule.id,
                            component_id=component.component_id,
                            severity=ValidationSeverity.INFO,
                            title="Missing aria-required",
                            description="Required field should have aria-required attribute",
                            suggestion="Add aria-required attribute for screen readers"
                        ))

            # Check navigation links
            if component.component_type == ComponentType.LINK:
                href = component.properties.get("href")
                if not href or href == "#":
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.WARNING,
                        title="Invalid link href",
                        description="Link has empty or placeholder href",
                        suggestion="Provide proper link destination"
                    ))

        except Exception as e:
            logger.error(f"Functionality validation error: {e}")
            return ValidationResult(
                rule_id=rule.id,
                state=ValidationState.FAILED,
                execution_time=time.time() - start_time,
                details={"error": str(e)}
            )

        return ValidationResult(
            rule_id=rule.id,
            state=ValidationState.COMPLETED,
            issues=issues,
            execution_time=time.time() - start_time
        )

class LayoutValidator(ComponentValidator):
    """Validator for layout and responsive design"""

    async def validate(self, component: ComponentState, rule: ValidationRule) -> ValidationResult:
        """Validate component layout"""
        start_time = time.time()
        issues = []

        try:
            # Check for overlapping elements
            if rule.parameters.get("check_overlaps", False):
                overlaps = await self._check_overlaps(component)
                if overlaps:
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.WARNING,
                        title="Overlapping elements detected",
                        description=f"Component overlaps with: {', '.join(overlaps)}",
                        suggestion="Adjust CSS positioning or margins"
                    ))

            # Check responsive design
            if rule.parameters.get("check_responsive", False):
                responsive_issues = await self._check_responsive_design(component)
                issues.extend(responsive_issues)

            # Check text readability
            if component.text_content:
                text_length = len(component.text_content)
                if text_length > 500:  # Long text block
                    issues.append(ValidationIssue(
                        rule_id=rule.id,
                        component_id=component.component_id,
                        severity=ValidationSeverity.INFO,
                        title="Long text content",
                        description="Text content is very long, consider breaking into smaller sections",
                        suggestion="Use paragraphs, headings, or pagination for better readability"
                    ))

        except Exception as e:
            logger.error(f"Layout validation error: {e}")
            return ValidationResult(
                rule_id=rule.id,
                state=ValidationState.FAILED,
                execution_time=time.time() - start_time,
                details={"error": str(e)}
            )

        return ValidationResult(
            rule_id=rule.id,
            state=ValidationState.COMPLETED,
            issues=issues,
            execution_time=time.time() - start_time
        )

    async def _check_overlaps(self, component: ComponentState) -> List[str]:
        """Check for overlapping elements (simplified implementation)"""
        # In a real implementation, this would check actual DOM positions
        return []

    async def _check_responsive_design(self, component: ComponentState) -> List[ValidationIssue]:
        """Check responsive design issues"""
        issues = []

        # Simplified responsive checks
        if component.component_type in [ComponentType.TABLE, ComponentType.IMAGE]:
            if not component.properties.get("responsive"):
                issues.append(ValidationIssue(
                    rule_id="responsive_design",
                    component_id=component.component_id,
                    severity=ValidationSeverity.INFO,
                    title="Missing responsive design",
                    description=f"{component.component_type.value} should be responsive",
                    suggestion="Add responsive classes or CSS for mobile compatibility"
                ))

        return issues

class StateDrivenValidationEngine:
    """Main state-driven validation engine"""

    def __init__(self):
        self.validators: Dict[str, ComponentValidator] = {}
        self.rules: Dict[str, ValidationRule] = {}
        self.component_states: Dict[str, ComponentState] = {}
        self.validation_history: List[Dict[str, Any]] = []
        self.active_validations: Dict[str, asyncio.Task] = {}

        # Initialize default validators
        self._initialize_validators()

    def _initialize_validators(self):
        """Initialize default validators"""
        self.validators["visibility"] = VisibilityValidator()
        self.validators["accessibility"] = AccessibilityValidator()
        self.validators["functionality"] = FunctionalityValidator()
        self.validators["layout"] = LayoutValidator()
        logger.info("Initialized default validators")

    def register_validator(self, name: str, validator: ComponentValidator):
        """Register a custom validator"""
        self.validators[name] = validator
        logger.info(f"Registered validator: {name}")

    def register_rule(self, rule: ValidationRule):
        """Register a validation rule"""
        self.rules[rule.id] = rule
        logger.info(f"Registered validation rule: {rule.name}")

    def update_component_state(self, component_id: str, component_data: Dict[str, Any]):
        """Update component state"""
        try:
            # Extract component type from data
            component_type = ComponentType(component_data.get("type", "text"))

            # Create or update component state
            if component_id in self.component_states:
                component = self.component_states[component_id]
                # Update fields
                for key, value in component_data.items():
                    if hasattr(component, key):
                        setattr(component, key, value)
            else:
                component = ComponentState(
                    component_id=component_id,
                    component_type=component_type,
                    properties=component_data.get("properties", {}),
                    visible=component_data.get("visible", True),
                    enabled=component_data.get("enabled", True),
                    text_content=component_data.get("text"),
                    position=component_data.get("position"),
                    size=component_data.get("size"),
                    parent_id=component_data.get("parent_id")
                )
                self.component_states[component_id] = component

            # Update timestamp and checksum
            component.last_updated = time.time()
            component.checksum = component._calculate_checksum()

        except Exception as e:
            logger.error(f"Error updating component state {component_id}: {e}")

    async def validate_component(self, component_id: str, rule_ids: List[str] = None) -> Dict[str, ValidationResult]:
        """Validate specific component"""
        if component_id not in self.component_states:
            logger.warning(f"Component not found: {component_id}")
            return {}

        component = self.component_states[component_id]
        component_type = component.component_type

        # Filter applicable rules
        applicable_rules = []
        if rule_ids:
            applicable_rules = [self.rules[rule_id] for rule_id in rule_ids if rule_id in self.rules]
        else:
            applicable_rules = [
                rule for rule in self.rules.values()
                if rule.enabled and component_type in rule.component_types
            ]

        results = {}
        validation_tasks = []

        # Schedule validations
        for rule in applicable_rules:
            validator = self.validators.get(rule.validator)
            if not validator:
                logger.warning(f"Validator not found: {rule.validator}")
                continue

            # Create validation task with timeout
            task = asyncio.create_task(
                self._execute_validation_with_timeout(validator, component, rule)
            )
            validation_tasks.append((rule.id, task))

        # Wait for all validations with parallel execution
        for rule_id, task in validation_tasks:
            try:
                result = await task
                results[rule_id] = result
            except asyncio.TimeoutError:
                results[rule_id] = ValidationResult(
                    rule_id=rule_id,
                    state=ValidationState.TIMEOUT,
                    execution_time=self.rules[rule_id].timeout,
                    details={"error": "Validation timeout"}
                )
            except Exception as e:
                logger.error(f"Validation error for {rule_id}: {e}")
                results[rule_id] = ValidationResult(
                    rule_id=rule_id,
                    state=ValidationState.FAILED,
                    execution_time=0,
                    details={"error": str(e)}
                )

        # Record validation in history
        self._record_validation(component_id, results)

        return results

    async def _execute_validation_with_timeout(
        self,
        validator: ComponentValidator,
        component: ComponentState,
        rule: ValidationRule
    ) -> ValidationResult:
        """Execute validation with timeout"""
        return await asyncio.wait_for(
            validator.validate(component, rule),
            timeout=rule.timeout
        )

    async def validate_all_components(self, rule_ids: List[str] = None) -> Dict[str, Dict[str, ValidationResult]]:
        """Validate all components"""
        results = {}

        for component_id in self.component_states:
            component_results = await self.validate_component(component_id, rule_ids)
            if component_results:
                results[component_id] = component_results

        return results

    def get_validation_summary(self, component_id: str = None) -> Dict[str, Any]:
        """Get validation summary"""
        if component_id:
            # Single component summary
            component_validations = [
                record for record in self.validation_history
                if record.get("component_id") == component_id
            ]

            if not component_validations:
                return {"message": f"No validation history for component: {component_id}"}

            latest_validation = component_validations[-1]
            results = latest_validation.get("results", {})

            total_rules = len(results)
            passed_rules = sum(1 for result in results.values() if result.state == ValidationState.COMPLETED)
            total_issues = sum(len(result.issues) for result in results.values())

            severity_counts = defaultdict(int)
            for result in results.values():
                for issue in result.issues:
                    severity_counts[issue.severity] += 1

            return {
                "component_id": component_id,
                "total_rules": total_rules,
                "passed_rules": passed_rules,
                "pass_rate": passed_rules / total_rules if total_rules > 0 else 0,
                "total_issues": total_issues,
                "issue_severity_counts": dict(severity_counts),
                "last_validation": latest_validation.get("timestamp"),
                "component_type": self.component_states.get(component_id, {}).component_type
            }
        else:
            # All components summary
            if not self.validation_history:
                return {"message": "No validation history available"}

            latest_validation = self.validation_history[-1]
            all_results = latest_validation.get("results", {})

            component_summaries = {}
            for comp_id, comp_results in all_results.items():
                total_rules = len(comp_results)
                passed_rules = sum(1 for result in comp_results.values() if result.state == ValidationState.COMPLETED)
                total_issues = sum(len(result.issues) for result in comp_results.values())

                component_summaries[comp_id] = {
                    "total_rules": total_rules,
                    "passed_rules": passed_rules,
                    "pass_rate": passed_rules / total_rules if total_rules > 0 else 0,
                    "total_issues": total_issues
                }

            # Overall statistics
            total_components = len(component_summaries)
            avg_pass_rate = sum(s["pass_rate"] for s in component_summaries.values()) / total_components if total_components > 0 else 0
            total_issues_all = sum(s["total_issues"] for s in component_summaries.values())

            return {
                "total_components": total_components,
                "average_pass_rate": avg_pass_rate,
                "total_issues": total_issues_all,
                "component_details": component_summaries,
                "last_validation": latest_validation.get("timestamp")
            }

    def _record_validation(self, component_id: str, results: Dict[str, ValidationResult]):
        """Record validation in history"""
        validation_record = {
            "component_id": component_id,
            "timestamp": datetime.now(),
            "results": results,
            "component_type": self.component_states.get(component_id, {}).component_type
        }

        self.validation_history.append(validation_record)

        # Keep only last 1000 records
        if len(self.validation_history) > 1000:
            self.validation_history = self.validation_history[-1000:]

    def get_validation_report(self, days: int = 7) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_validations = [
            record for record in self.validation_history
            if record["timestamp"] >= cutoff_date
        ]

        if not recent_validations:
            return {"message": f"No validation history in the last {days} days"}

        # Calculate statistics
        total_validations = len(recent_validations)
        issue_counts = defaultdict(int)
        rule_performance = defaultdict(list)

        for validation in recent_validations:
            for rule_id, result in validation["results"].items():
                rule_performance[rule_id].append(1 if result.state == ValidationState.COMPLETED else 0)
                for issue in result.issues:
                    issue_counts[issue.severity] += 1

        # Calculate rule success rates
        rule_stats = {}
        for rule_id, results in rule_performance.items():
            success_rate = sum(results) / len(results) if results else 0
            rule_stats[rule_id] = {
                "total_executions": len(results),
                "success_rate": success_rate,
                "rule_name": self.rules.get(rule_id, {}).name
            }

        return {
            "period": f"Last {days} days",
            "total_validations": total_validations,
            "issue_breakdown": dict(issue_counts),
            "rule_performance": rule_stats,
            "components_validated": len(set(v["component_id"] for v in recent_validations)),
            "average_rules_per_validation": sum(len(v["results"]) for v in recent_validations) / total_validations if total_validations > 0 else 0
        }

# Global validation engine instance
validation_engine = StateDrivenValidationEngine()

# Initialize default rules
def initialize_default_rules():
    """Initialize default validation rules"""
    default_rules = [
        ValidationRule(
            id="visibility_check",
            name="Component Visibility Check",
            description="Ensure components are properly visible",
            component_types=list(ComponentType),
            severity=ValidationSeverity.ERROR,
            validator="visibility",
            parameters={"check_viewport": True}
        ),
        ValidationRule(
            id="accessibility_check",
            name="Accessibility Compliance",
            description="Check accessibility standards compliance",
            component_types=[ComponentType.IMAGE, ComponentType.BUTTON, ComponentType.INPUT],
            severity=ValidationSeverity.ERROR,
            validator="accessibility",
            parameters={"check_contrast": True}
        ),
        ValidationRule(
            id="functionality_check",
            name="Component Functionality",
            description="Verify component functionality",
            component_types=[ComponentType.BUTTON, ComponentType.INPUT, ComponentType.LINK],
            severity=ValidationSeverity.WARNING,
            validator="functionality",
            parameters={"require_interactivity": False}
        ),
        ValidationRule(
            id="layout_check",
            name="Layout Validation",
            description="Check layout and responsive design",
            component_types=list(ComponentType),
            severity=ValidationSeverity.INFO,
            validator="layout",
            parameters={"check_overlaps": False, "check_responsive": True}
        )
    ]

    for rule in default_rules:
        validation_engine.register_rule(rule)

    logger.info(f"Initialized {len(default_rules)} default validation rules")

initialize_default_rules()