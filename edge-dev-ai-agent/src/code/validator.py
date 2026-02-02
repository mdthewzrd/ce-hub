"""
Code Validator

Validates Python code for syntax, imports, and basic quality checks.
"""

import ast
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class ValidationStatus(Enum):
    """Status of code validation."""
    VALID = "valid"
    SYNTAX_ERROR = "syntax_error"
    IMPORT_ERROR = "import_error"
    STYLE_WARNING = "style_warning"
    MISSING_COMPONENT = "missing_component"


@dataclass
class ValidationError:
    """A validation error or warning."""
    status: ValidationStatus
    message: str
    line: Optional[int] = None
    column: Optional[int] = None
    code: Optional[str] = None  # Error code


@dataclass
class ValidationResult:
    """Result of code validation."""
    is_valid: bool
    errors: List[ValidationError]
    warnings: List[ValidationError]
    info: Dict[str, Any]

    @property
    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return len(self.errors) > 0

    @property
    def has_warnings(self) -> bool:
        """Check if there are any warnings."""
        return len(self.warnings) > 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "is_valid": self.is_valid,
            "errors": [
                {
                    "status": e.status.value,
                    "message": e.message,
                    "line": e.line,
                    "column": e.column,
                }
                for e in self.errors
            ],
            "warnings": [
                {
                    "status": w.status.value,
                    "message": w.message,
                    "line": w.line,
                    "column": w.column,
                }
                for w in self.warnings
            ],
            "info": self.info,
        }


class CodeValidator:
    """Validates Python code."""

    def __init__(self, requirements: Optional[List[str]] = None):
        """Initialize code validator.

        Args:
            requirements: List of required imports/modules
        """
        self.requirements = requirements or []
        self.project_root = Path(__file__).parent.parent.parent

    def validate_syntax(self, code: str) -> ValidationResult:
        """Validate Python syntax.

        Args:
            code: Python source code

        Returns:
            ValidationResult with any syntax errors
        """
        errors = []

        try:
            ast.parse(code)
        except SyntaxError as e:
            errors.append(ValidationError(
                status=ValidationStatus.SYNTAX_ERROR,
                message=str(e),
                line=e.lineno,
                column=e.offset,
            ))

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=[],
            info={"checked": "syntax"}
        )

    def validate_imports(self, code: str) -> ValidationResult:
        """Validate imports and check if modules are available.

        Args:
            code: Python source code

        Returns:
            ValidationResult with any import errors
        """
        errors = []
        warnings = []

        try:
            tree = ast.parse(code)

            # Collect all imports
            imports = []
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)

            # Check if imports are available
            for imp in imports:
                try:
                    __import__(imp)
                except ImportError:
                    # Check if it's a known external library
                    common_libs = ['pandas', 'numpy', 'requests', 'fastapi', 'uvicorn',
                                   'anthropic', 'openai', 'pydantic', 'asyncio']
                    if imp in common_libs:
                        warnings.append(ValidationError(
                            status=ValidationStatus.IMPORT_ERROR,
                            message=f"External library '{imp}' may not be installed",
                        ))
                    else:
                        errors.append(ValidationError(
                            status=ValidationStatus.IMPORT_ERROR,
                            message=f"Cannot import '{imp}'",
                        ))

        except SyntaxError:
            # Syntax errors will be caught by validate_syntax
            pass

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            info={"checked": "imports", "found_imports": len(imports) if 'imports' in locals() else 0}
        )

    def validate_v31_structure(self, code: str) -> ValidationResult:
        """Validate code follows V31 scanner structure.

        Args:
            code: Python source code

        Returns:
            ValidationResult with missing components
        """
        errors = []
        info = {"found_methods": []}

        try:
            tree = ast.parse(code)

            # Find the main class
            main_class = None
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef) and "Scanner" in node.name:
                    main_class = node
                    break

            if main_class:
                # Check for required V31 methods
                required_methods = [
                    "fetch_grouped_data",
                    "compute_simple_features",
                    "apply_smart_filters",
                    "compute_full_features",
                    "detect_patterns",
                ]

                found_methods = [n.name for n in main_class.body if isinstance(n, ast.FunctionDef)]
                info["found_methods"] = found_methods

                for method in required_methods:
                    if method not in found_methods:
                        errors.append(ValidationError(
                            status=ValidationStatus.MISSING_COMPONENT,
                            message=f"Missing required V31 method: {method}",
                        ))

            else:
                errors.append(ValidationError(
                    status=ValidationStatus.MISSING_COMPONENT,
                    message="No scanner class found (class name should contain 'Scanner')",
                ))

        except SyntaxError:
            # Syntax errors will be caught elsewhere
            pass

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=[],
            info=info
        )

    def validate_style(self, code: str) -> ValidationResult:
        """Basic style checks (PEP 8 basics).

        Args:
            code: Python source code

        Returns:
            ValidationResult with style warnings
        """
        warnings = []

        lines = code.split('\n')

        for i, line in enumerate(lines, 1):
            # Check line length
            if len(line) > 100:
                warnings.append(ValidationError(
                    status=ValidationStatus.STYLE_WARNING,
                    message=f"Line too long ({len(line)} > 100 characters)",
                    line=i,
                ))

            # Check for trailing whitespace
            if line.rstrip() != line and line.strip():
                warnings.append(ValidationError(
                    status=ValidationStatus.STYLE_WARNING,
                    message=f"Trailing whitespace",
                    line=i,
                ))

        return ValidationResult(
            is_valid=True,  # Style warnings don't make code invalid
            errors=[],
            warnings=warnings,
            info={"checked": "style"}
        )

    def validate_all(self, code: str, check_v31: bool = False) -> ValidationResult:
        """Run all validation checks.

        Args:
            code: Python source code
            check_v31: Whether to check V31 structure

        Returns:
            Combined validation result
        """
        all_errors = []
        all_warnings = []
        all_info = {}

        # Syntax validation
        syntax_result = self.validate_syntax(code)
        all_errors.extend(syntax_result.errors)
        all_info.update(syntax_result.info)

        if syntax_result.has_errors:
            return ValidationResult(
                is_valid=False,
                errors=all_errors,
                warnings=all_warnings,
                info=all_info
            )

        # Import validation
        import_result = self.validate_imports(code)
        all_errors.extend(import_result.errors)
        all_warnings.extend(import_result.warnings)
        all_info.update(import_result.info)

        # V31 structure validation (if requested)
        if check_v31 or "Scanner" in code:
            v31_result = self.validate_v31_structure(code)
            all_errors.extend(v31_result.errors)
            all_info.update(v31_result.info)

        # Style validation
        style_result = self.validate_style(code)
        all_warnings.extend(style_result.warnings)

        return ValidationResult(
            is_valid=len(all_errors) == 0,
            errors=all_errors,
            warnings=all_warnings,
            info=all_info
        )

    def validate_file(self, file_path: str) -> ValidationResult:
        """Validate a Python file.

        Args:
            file_path: Path to Python file

        Returns:
            ValidationResult
        """
        path = Path(file_path)
        if not path.exists():
            return ValidationResult(
                is_valid=False,
                errors=[ValidationError(
                    status=ValidationStatus.SYNTAX_ERROR,
                    message=f"File not found: {file_path}"
                )],
                warnings=[],
                info={}
            )

        code = path.read_text()

        # Check if it looks like a scanner
        check_v31 = "scanner" in file_path.lower() or "Scanner" in code

        return self.validate_all(code, check_v31=check_v31)
