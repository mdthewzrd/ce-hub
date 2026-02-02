"""
CE Hub Agent Validation Engine

This module provides comprehensive validation capabilities for CE Hub agents,
ensuring consistent quality and reliability across all agent outputs. It includes
pre-built validation rules, custom rule support, and detailed error reporting.
"""

from typing import Dict, List, Any, Optional, Union, Callable, Type, get_type_hints
from dataclasses import dataclass
from abc import ABC, abstractmethod
import re
import ast
import json
import subprocess
import tempfile
import os
from pathlib import Path
import time
from datetime import datetime

# Pydantic for type safety
from pydantic import BaseModel, ValidationError
from pydantic_ai import RunContext

# Local imports
from .cehub_dependencies import (
    CEHubDependencies,
    CEHubRunContext,
    ValidationResult,
    ValidationRule,
    ValidationConfig,
    ProjectRequirements,
    ProjectContext,
    TaskContext
)


class BaseValidator(ABC):
    """Base class for all validators"""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        """Validate the content against the rule"""
        pass

    def get_config(self, rule: ValidationRule, key: str, default: Any = None) -> Any:
        """Get configuration parameter from rule"""
        return rule.parameters.get(key, default)


class CodeValidator(BaseValidator):
    """Validates code syntax, structure, and quality"""

    def __init__(self):
        super().__init__("code_validator", "Validates code syntax and structure")

    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        """Validate code content"""
        result = ValidationResult(is_valid=True, score=1.0)

        # Detect programming language
        language = self._detect_language(content)
        if not language:
            result.add_warning("Could not detect programming language")
            return result

        # Language-specific validation
        if language == "python":
            await self._validate_python(content, result, ctx, rule)
        elif language == "javascript":
            await self._validate_javascript(content, result, ctx, rule)
        elif language == "typescript":
            await self._validate_typescript(content, result, ctx, rule)
        elif language == "json":
            await self._validate_json(content, result, ctx, rule)
        elif language == "yaml":
            await self._validate_yaml(content, result, ctx, rule)
        else:
            result.add_warning(f"No specific validation for language: {language}")

        # General code quality checks
        await self._validate_code_quality(content, result, ctx, rule, language)

        return result

    def _detect_language(self, content: str) -> Optional[str]:
        """Detect programming language from content"""
        content_lower = content.lower().strip()

        # Check for file extensions or language identifiers
        if content_lower.startswith(("```python", "```py")):
            return "python"
        elif content_lower.startswith(("```javascript", "```js")):
            return "javascript"
        elif content_lower.startswith(("```typescript", "```ts")):
            return "typescript"
        elif content_lower.startswith("```json"):
            return "json"
        elif content_lower.startswith(("```yaml", "```yml")):
            return "yaml"

        # Check for common language patterns
        if re.search(r"^(import|from|def|class|if __name__)", content, re.MULTILINE):
            return "python"
        elif re.search(r"^(const|let|var|function|=>)", content, re.MULTILINE):
            return "javascript"
        elif re.search(r"^(interface|type|declare)", content, re.MULTILINE):
            return "typescript"
        elif content.strip().startswith(("{", "[")):
            return "json"

        return None

    async def _validate_python(self, content: str, result: ValidationResult, ctx: CEHubRunContext, rule: ValidationRule):
        """Validate Python code"""
        try:
            # Remove markdown code blocks if present
            code = self._extract_code(content, "python")

            # Syntax validation
            ast.parse(code)

            # Import validation (optional)
            if self.get_config(rule, "check_imports", False):
                await self._validate_python_imports(code, result, ctx)

            # Style validation (optional)
            if self.get_config(rule, "check_style", True):
                await self._validate_python_style(code, result, ctx)

            # Test coverage (optional)
            if self.get_config(rule, "check_tests", False):
                await self._validate_python_tests(code, result, ctx)

        except SyntaxError as e:
            result.add_error(f"Python syntax error: {e}")
        except Exception as e:
            result.add_warning(f"Python validation error: {e}")

    async def _validate_javascript(self, content: str, result: ValidationResult, ctx: CEHubRunContext, rule: ValidationRule):
        """Validate JavaScript code"""
        try:
            code = self._extract_code(content, "javascript")

            # Basic syntax check using Node.js if available
            if self.get_config(rule, "check_syntax", True):
                await self._validate_js_syntax(code, result)

            # ESLint validation (optional)
            if self.get_config(rule, "check_eslint", False):
                await self._validate_js_eslint(code, result, ctx)

        except Exception as e:
            result.add_warning(f"JavaScript validation error: {e}")

    async def _validate_typescript(self, content: str, result: ValidationResult, ctx: CEHubRunContext, rule: ValidationRule):
        """Validate TypeScript code"""
        try:
            code = self._extract_code(content, "typescript")

            # TypeScript compilation check (optional)
            if self.get_config(rule, "check_types", True):
                await self._validate_ts_types(code, result, ctx)

        except Exception as e:
            result.add_warning(f"TypeScript validation error: {e}")

    async def _validate_json(self, content: str, result: ValidationResult, ctx: CEHubRunContext, rule: ValidationRule):
        """Validate JSON content"""
        try:
            json_content = self._extract_code(content, "json")
            json.loads(json_content)
        except json.JSONDecodeError as e:
            result.add_error(f"JSON syntax error: {e}")

    async def _validate_yaml(self, content: str, result: ValidationResult, ctx: CEHubRunContext, rule: ValidationRule):
        """Validate YAML content"""
        try:
            yaml_content = self._extract_code(content, "yaml")
            import yaml
            yaml.safe_load(yaml_content)
        except ImportError:
            result.add_warning("PyYAML not available for YAML validation")
        except Exception as e:
            result.add_error(f"YAML syntax error: {e}")

    def _extract_code(self, content: str, language: str) -> str:
        """Extract code from markdown code blocks"""
        lines = content.split('\n')
        in_code_block = False
        code_lines = []

        for line in lines:
            if line.startswith(f"```{language}"):
                in_code_block = True
            elif line.startswith("```") and in_code_block:
                in_code_block = False
            elif in_code_block:
                code_lines.append(line)

        return '\n'.join(code_lines) if code_lines else content

    async def _validate_python_imports(self, code: str, result: ValidationResult, ctx: CEHubRunContext):
        """Validate Python imports"""
        try:
            tree = ast.parse(code)
            imports = []

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    imports.append(f"{node.module or '.'}")

            # Check for common problematic imports
            problematic_imports = self.get_config(None, "problematic_imports", [])
            for imp in imports:
                for prob in problematic_imports:
                    if prob in imp:
                        result.add_warning(f"Potentially problematic import: {imp}")

        except Exception as e:
            result.add_warning(f"Import validation error: {e}")

    async def _validate_python_style(self, code: str, result: ValidationResult, ctx: CEHubRunContext):
        """Validate Python code style"""
        try:
            # Basic style checks
            lines = code.split('\n')

            # Check line length
            max_line_length = self.get_config(None, "max_line_length", 100)
            for i, line in enumerate(lines, 1):
                if len(line) > max_line_length:
                    result.add_warning(f"Line {i} exceeds {max_line_length} characters")

            # Check for trailing whitespace
            for i, line in enumerate(lines, 1):
                if line.rstrip() != line:
                    result.add_warning(f"Line {i} has trailing whitespace")

        except Exception as e:
            result.add_warning(f"Style validation error: {e}")

    async def _validate_python_tests(self, code: str, result: ValidationResult, ctx: CEHubRunContext):
        """Validate Python test coverage"""
        # This would be implemented with test coverage tools
        pass

    async def _validate_js_syntax(self, code: str, result: ValidationResult):
        """Validate JavaScript syntax using Node.js"""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(code)
                temp_file = f.name

            try:
                # Run Node.js syntax check
                result = subprocess.run(
                    ['node', '--check', temp_file],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                if result.returncode != 0:
                    result.add_error(f"JavaScript syntax error: {result.stderr}")

            finally:
                os.unlink(temp_file)

        except (subprocess.TimeoutExpired, FileNotFoundError):
            result.add_warning("Node.js not available for JavaScript syntax validation")
        except Exception as e:
            result.add_warning(f"JavaScript syntax validation error: {e}")

    async def _validate_js_eslint(self, code: str, result: ValidationResult, ctx: CEHubRunContext):
        """Validate JavaScript with ESLint"""
        # ESLint integration would go here
        pass

    async def _validate_ts_types(self, code: str, result: ValidationResult, ctx: CEHubRunContext):
        """Validate TypeScript types"""
        # TypeScript compiler integration would go here
        pass

    async def _validate_code_quality(self, content: str, result: ValidationResult, ctx: CEHubRunContext, rule: ValidationRule, language: str):
        """General code quality validation"""

        # Check for TODO/FIXME comments
        if self.get_config(rule, "check_todos", True):
            if re.search(r"# (TODO|FIXME|XXX)|// (TODO|FIXME|XXX)", content, re.IGNORECASE):
                result.add_warning("Code contains TODO or FIXME comments")

        # Check for security issues
        if self.get_config(rule, "check_security", True):
            await self._check_security_issues(content, result, language)

        # Check for documentation
        if self.get_config(rule, "check_documentation", True):
            await self._check_documentation(content, result, language)

    async def _check_security_issues(self, content: str, result: ValidationResult, language: str):
        """Check for common security issues"""
        security_patterns = {
            "python": [
                r"eval\s*\(",
                r"exec\s*\(",
                r"input\s*\(\s*['\"]\s*",
                r"subprocess\.call\s*\(",
                r"os\.system\s*\("
            ],
            "javascript": [
                r"eval\s*\(",
                r"Function\s*\(",
                r"setTimeout\s*\(\s*['\"]",
                r"innerHTML\s*=",
                r"outerHTML\s*="
            ]
        }

        patterns = security_patterns.get(language, [])
        for pattern in patterns:
            if re.search(pattern, content, re.IGNORECASE):
                result.add_warning(f"Potential security issue detected: {pattern}")

    async def _check_documentation(self, content: str, result: ValidationResult, language: str):
        """Check for adequate documentation"""
        # Simple documentation checks
        has_docstring = language == "python" and '"""' in content or "'''" in content
        has_comments = "//" in content or "#" in content

        if not has_docstring and not has_comments:
            result.add_suggestion("Consider adding documentation or comments")


class RequirementValidator(BaseValidator):
    """Validates that requirements have been met"""

    def __init__(self):
        super().__init__("requirement_validator", "Validates that project requirements are met")

    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        """Validate against project requirements"""
        result = ValidationResult(is_valid=True, score=1.0)

        requirements = ctx.deps.requirements

        # Check success criteria
        for criteria in requirements.success_criteria:
            if not self._content_meets_criteria(content, criteria):
                result.add_error(f"Missing success criteria: {criteria}")
                result.score -= 0.2

        # Check deliverables
        for deliverable in requirements.deliverables:
            if not self._content_includes_deliverable(content, deliverable):
                result.add_error(f"Missing deliverable: {deliverable}")
                result.score -= 0.1

        # Check technical constraints
        for constraint in requirements.technical_constraints:
            if not self._content_respects_constraint(content, constraint):
                result.add_warning(f"May violate constraint: {constraint}")
                result.score -= 0.05

        return result

    def _content_meets_criteria(self, content: str, criteria: str) -> bool:
        """Check if content meets a specific success criteria"""
        # Simple keyword matching - could be enhanced with NLP
        criteria_keywords = criteria.lower().split()
        content_lower = content.lower()

        # Check if most criteria keywords are present
        matches = sum(1 for keyword in criteria_keywords if keyword in content_lower)
        return matches >= len(criteria_keywords) * 0.6  # 60% match threshold

    def _content_includes_deliverable(self, content: str, deliverable: str) -> bool:
        """Check if content includes a required deliverable"""
        deliverable_lower = deliverable.lower()
        content_lower = content.lower()

        # Look for deliverable keywords
        if any(keyword in content_lower for keyword in deliverable_lower.split()):
            return True

        # Check file references
        if deliverable.endswith(('.js', '.py', '.html', '.css', '.md', '.json')):
            filename = deliverable.split('/')[-1]
            if filename.lower() in content_lower:
                return True

        return False

    def _content_respects_constraint(self, content: str, constraint: str) -> bool:
        """Check if content respects a technical constraint"""
        constraint_lower = constraint.lower()

        # Common constraint patterns
        if "no external dependencies" in constraint_lower:
            # Check for import/include statements
            import_patterns = [r"import\s+", r"require\s*\(", r"from\s+"]
            for pattern in import_patterns:
                if re.search(pattern, content):
                    return False

        elif "responsive" in constraint_lower:
            # Check for responsive design elements
            responsive_indicators = ["@media", "viewport", "flex", "grid", "breakpoint"]
            if not any(indicator in content.lower() for indicator in responsive_indicators):
                return False

        elif "accessibility" in constraint_lower or "a11y" in constraint_lower:
            # Check for accessibility features
            a11y_indicators = ["alt=", "aria-", "role=", "tabindex", "screen-reader"]
            if not any(indicator in content.lower() for indicator in a11y_indicators):
                return False

        return True


class ConsistencyValidator(BaseValidator):
    """Validates consistency with existing codebase patterns"""

    def __init__(self):
        super().__init__("consistency_validator", "Validates consistency with existing code patterns")

    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        """Validate code consistency"""
        result = ValidationResult(is_valid=True, score=1.0)

        try:
            # Get existing code patterns from project
            existing_patterns = await self._analyze_existing_patterns(ctx)

            # Validate against patterns
            await self._validate_naming_conventions(content, existing_patterns, result)
            await self._validate_code_structure(content, existing_patterns, result)
            await self._validate_dependencies(content, existing_patterns, result, ctx)

        except Exception as e:
            result.add_warning(f"Consistency validation error: {e}")

        return result

    async def _analyze_existing_patterns(self, ctx: CEHubRunContext) -> Dict[str, Any]:
        """Analyze existing codebase for patterns"""
        patterns = {
            "naming_conventions": {},
            "imports": set(),
            "file_structure": {},
            "dependencies": set()
        }

        try:
            # Get source files
            source_files = ctx.deps.get_source_files("**/*.py")  # Default to Python files

            for file_path in source_files[:10]:  # Limit to first 10 files for performance
                try:
                    file_content = ctx.deps.read_file(file_path)

                    # Analyze naming patterns
                    await self._analyze_naming_patterns(file_content, patterns)

                    # Analyze imports
                    await self._analyze_imports(file_content, patterns)

                except Exception as e:
                    ctx.deps.logger.warning(f"Error analyzing file {file_path}: {e}")

        except Exception as e:
            ctx.deps.logger.warning(f"Error analyzing existing patterns: {e}")

        return patterns

    async def _analyze_naming_patterns(self, content: str, patterns: Dict[str, Any]):
        """Analyze naming conventions in existing code"""
        # Python naming patterns
        import re

        # Class names (PascalCase)
        class_names = re.findall(r"class\s+([A-Z][a-zA-Z0-9]*)", content)
        patterns["naming_conventions"]["classes"] = class_names

        # Function names (snake_case)
        func_names = re.findall(r"def\s+([a-z][a-z0-9_]*)", content)
        patterns["naming_conventions"]["functions"] = func_names

        # Variable names (snake_case)
        var_names = re.findall(r"([a-z][a-z0-9_]*)\s*=", content)
        patterns["naming_conventions"]["variables"] = var_names

    async def _analyze_imports(self, content: str, patterns: Dict[str, Any]):
        """Analyze import patterns"""
        import re

        # Standard library imports
        std_imports = re.findall(r"^(import|from)\s+([a-z][a-z0-9_.]*)", content, re.MULTILINE)
        patterns["imports"].update(imp[1] for imp in std_imports)

    async def _validate_naming_conventions(self, content: str, existing_patterns: Dict[str, Any], result: ValidationResult):
        """Validate naming conventions"""
        import re

        naming_patterns = existing_patterns.get("naming_conventions", {})

        # Check class names
        new_classes = re.findall(r"class\s+([A-Z][a-zA-Z0-9]*)", content)
        if naming_patterns.get("classes") and new_classes:
            # Check if new classes follow existing patterns
            existing_classes = naming_patterns["classes"]
            for class_name in new_classes:
                if not self._follows_naming_pattern(class_name, existing_classes):
                    result.add_warning(f"Class name '{class_name}' may not follow project naming convention")

        # Check function names
        new_functions = re.findall(r"def\s+([a-z][a-z0-9_]*)", content)
        if naming_patterns.get("functions") and new_functions:
            existing_functions = naming_patterns["functions"]
            for func_name in new_functions:
                if not self._follows_naming_pattern(func_name, existing_functions):
                    result.add_warning(f"Function name '{func_name}' may not follow project naming convention")

    def _follows_naming_pattern(self, name: str, existing_names: List[str]) -> bool:
        """Check if a name follows existing naming patterns"""
        if not existing_names:
            return True  # No pattern to compare against

        # Simple pattern matching based on existing names
        patterns = set()
        for existing_name in existing_names[:5]:  # Sample first 5 names
            if '_' in existing_name:
                patterns.add('snake_case')
            elif existing_name[0].isupper():
                patterns.add('PascalCase')
            elif existing_name[0].islower():
                patterns.add('camelCase')

        # Determine pattern of new name
        if '_' in name:
            name_pattern = 'snake_case'
        elif name[0].isupper():
            name_pattern = 'PascalCase'
        else:
            name_pattern = 'camelCase'

        return name_pattern in patterns if patterns else True

    async def _validate_code_structure(self, content: str, existing_patterns: Dict[str, Any], result: ValidationResult):
        """Validate code structure consistency"""
        # This would implement more detailed structural validation
        pass

    async def _validate_dependencies(self, content: str, existing_patterns: Dict[str, Any], result: ValidationResult, ctx: CEHubRunContext):
        """Validate dependency usage"""
        existing_deps = existing_patterns.get("dependencies", set())

        # Check for new dependencies
        # Implementation depends on language-specific patterns
        pass


class PerformanceValidator(BaseValidator):
    """Validates performance characteristics"""

    def __init__(self):
        super().__init__("performance_validator", "Validates code performance characteristics")

    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        """Validate performance aspects"""
        result = ValidationResult(is_valid=True, score=1.0)

        # Check for performance anti-patterns
        await self._check_performance_antipatterns(content, result)

        # Check resource usage
        await self._check_resource_usage(content, result, ctx)

        # Check scalability concerns
        await self._check_scalability(content, result)

        return result

    async def _check_performance_antipatterns(self, content: str, result: ValidationResult):
        """Check for common performance anti-patterns"""
        antipatterns = {
            "nested_loops": r"for\s+.*:\s*\n\s*for\s+.*:",
            "inefficient_string_concat": r"\+\s*=.*['\"]",
            "synchronous_io": r"open\s*\(|requests\.",
            "large_data_structures": r"list\(range\([^)]*\)\s*\*\s*[^)]*\)",
            "blocking_operations": r"time\.sleep\s*\("
        }

        for pattern_name, pattern in antipatterns.items():
            if re.search(pattern, content, re.MULTILINE | re.DOTALL):
                result.add_warning(f"Potential performance anti-pattern detected: {pattern_name}")

    async def _check_resource_usage(self, content: str, result: ValidationResult, ctx: CEHubRunContext):
        """Check resource usage patterns"""
        # Check for memory leaks
        if re.search(r"(open|file)\s*\([^)]*\)\s*(?![^)]*close)", content, re.IGNORECASE):
            result.add_warning("Potential resource leak: file handle not explicitly closed")

        # Check for database connections
        if re.search(r"connect\s*\([^)]*\)", content, re.IGNORECASE):
            if not re.search(r"close\(\)|disconnect\(\)", content, re.IGNORECASE):
                result.add_warning("Database connection not explicitly closed")

    async def _check_scalability(self, content: str, result: ValidationResult):
        """Check scalability concerns"""
        # Check for hardcoded limits
        if re.search(r"\b(limit|size|count)\s*=\s*\d+", content):
            result.add_suggestion("Consider making limits configurable for better scalability")

        # Check for synchronous processing
        if re.search(r"for\s+.*:\s*\n\s*(?!.*await|.*async)", content, re.MULTILINE):
            result.add_suggestion("Consider async processing for better scalability")


class SecurityValidator(BaseValidator):
    """Validates security aspects"""

    def __init__(self):
        super().__init__("security_validator", "Validates security aspects")

    async def validate(self, content: str, ctx: CEHubRunContext, rule: ValidationRule) -> ValidationResult:
        """Validate security aspects"""
        result = ValidationResult(is_valid=True, score=1.0)

        # Check for security vulnerabilities
        await self._check_security_vulnerabilities(content, result)

        # Check input validation
        await self._check_input_validation(content, result)

        # Check authentication/authorization
        await self._check_auth_patterns(content, result)

        return result

    async def _check_security_vulnerabilities(self, content: str, result: ValidationResult):
        """Check for common security vulnerabilities"""
        vulnerabilities = {
            "sql_injection": r"(execute|exec|query)\s*\([^)]*\+",
            "xss": r"(innerHTML|outerHTML)\s*=",
            "path_traversal": r"open\s*\([^)]*\+\s*(user|input|request)",
            "command_injection": r"(os\.system|subprocess\.call|exec)\s*\([^)]*\+",
            "hardcoded_secrets": r"(password|secret|key|token)\s*=\s*['\"][^'\"]+['\"]",
            "weak_crypto": r"(md5|sha1)\s*\("
        }

        for vuln_name, pattern in vulnerabilities.items():
            if re.search(pattern, content, re.IGNORECASE):
                result.add_error(f"Security vulnerability detected: {vuln_name}")

    async def _check_input_validation(self, content: str, result: ValidationResult):
        """Check for input validation"""
        # Look for user input without validation
        if re.search(r"(request\.form|request\.args|input\(\))", content, re.IGNORECASE):
            if not re.search(r"(validate|sanitize|clean)", content, re.IGNORECASE):
                result.add_warning("User input detected without validation")

    async def _check_auth_patterns(self, content: str, result: ValidationResult):
        """Check authentication and authorization patterns"""
        # Check for missing authentication
        if re.search(r"(delete|update|create|admin)", content, re.IGNORECASE):
            if not re.search(r"(auth|login|permission|role)", content, re.IGNORECASE):
                result.add_warning("Protected operation without apparent authentication check")


class ValidationEngine:
    """Main validation engine that orchestrates all validators"""

    def __init__(self):
        self.validators: Dict[str, BaseValidator] = {}
        self._register_default_validators()

    def _register_default_validators(self):
        """Register default validators"""
        self.validators = {
            "code": CodeValidator(),
            "requirements": RequirementValidator(),
            "consistency": ConsistencyValidator(),
            "performance": PerformanceValidator(),
            "security": SecurityValidator()
        }

    def register_validator(self, name: str, validator: BaseValidator):
        """Register a custom validator"""
        self.validators[name] = validator

    def get_validator(self, name: str) -> Optional[BaseValidator]:
        """Get a validator by name"""
        return self.validators.get(name)

    async def validate_content(
        self,
        content: str,
        ctx: CEHubRunContext,
        validation_config: Optional[ValidationConfig] = None
    ) -> ValidationResult:
        """
        Validate content using configured validation rules

        Args:
            content: Content to validate
            ctx: Run context with dependencies
            validation_config: Validation configuration

        Returns:
            ValidationResult with all validation results
        """
        if validation_config is None:
            validation_config = ctx.deps.validation_config

        # Skip validation if configured
        if not ctx.deps.should_validate():
            return ValidationResult(is_valid=True, score=1.0)

        # Start validation timer
        start_time = time.time()

        # Get enabled validation rules
        enabled_rules = validation_config.get_rules()

        if not enabled_rules:
            # Use default rules if none configured
            enabled_rules = [
                ValidationRule(name="code", description="Code validation", enabled=True),
                ValidationRule(name="requirements", description="Requirements validation", enabled=True)
            ]

        # Combine all validation results
        combined_result = ValidationResult(is_valid=True, score=1.0)

        for rule in enabled_rules:
            validator = self.get_validator(rule.name)
            if not validator:
                ctx.deps.logger.warning(f"Unknown validator: {rule.name}")
                continue

            try:
                # Run individual validator
                result = await validator.validate(content, ctx, rule)

                # Combine results
                if not result.is_valid:
                    combined_result.is_valid = False

                combined_result.errors.extend(result.errors)
                combined_result.warnings.extend(result.warnings)
                combined_result.suggestions.extend(result.suggestions)

                # Update score (use minimum score)
                combined_result.score = min(combined_result.score, result.score)

                # Add metrics
                combined_result.metrics[f"validator_{rule.name}"] = result.score

                # Fail fast if configured
                if validation_config.fail_fast and not result.is_valid:
                    ctx.deps.logger.warning(f"Validation failed for rule {rule.name}, stopping early")
                    break

            except Exception as e:
                error_msg = f"Validation error for rule {rule.name}: {e}"
                ctx.deps.logger.error(error_msg)
                combined_result.add_error(error_msg)

                if validation_config.fail_fast:
                    break

        # Calculate validation duration
        duration = time.time() - start_time
        combined_result.metrics["validation_duration"] = duration

        # Record metrics
        ctx.deps.record_metric("validation_duration", duration)
        ctx.deps.record_metric("validation_score", combined_result.score)
        ctx.deps.record_metric("validation_errors", len(combined_result.errors))
        ctx.deps.record_metric("validation_warnings", len(combined_result.warnings))

        return combined_result

    async def validate_agent_output(
        self,
        agent_name: str,
        content: str,
        ctx: CEHubRunContext
    ) -> ValidationResult:
        """
        Validate agent output with agent-specific rules

        Args:
            agent_name: Name of the agent that produced the output
            content: Agent output to validate
            ctx: Run context

        Returns:
            ValidationResult with validation results
        """
        # Add agent-specific validation rules
        validation_config = ctx.deps.validation_config

        # Add agent-specific rule if not present
        agent_rule_name = f"agent_{agent_name}"
        if agent_rule_name not in validation_config.rules:
            validation_config.rules[agent_rule_name] = ValidationRule(
                name=agent_rule_name,
                description=f"Agent-specific validation for {agent_name}",
                enabled=True,
                parameters={"agent_type": agent_name}
            )

        return await self.validate_content(content, ctx, validation_config)


# Global validation engine instance
validation_engine = ValidationEngine()


# Convenience function for quick validation
async def validate(
    content: str,
    ctx: CEHubRunContext,
    validation_config: Optional[ValidationConfig] = None
) -> ValidationResult:
    """Convenience function to validate content"""
    return await validation_engine.validate_content(content, ctx, validation_config)