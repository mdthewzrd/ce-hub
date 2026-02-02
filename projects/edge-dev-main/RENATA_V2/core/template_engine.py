"""
RENATA_V2 Template Engine

Handles Jinja2-based template rendering for code generation.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
from jinja2 import (
    Environment,
    FileSystemLoader,
    Template,
    TemplateSyntaxError,
    TemplateError
)


class TemplateEngineError(Exception):
    """Template engine error"""
    pass


class TemplateEngine:
    """
    Jinja2-based template engine for code generation

    Manages template loading, rendering, and validation for the
    Renata V2 transformation pipeline.
    """

    def __init__(self, template_dir: Optional[str] = None):
        """
        Initialize template engine

        Args:
            template_dir: Path to templates directory (defaults to RENATA_V2/templates)
        """
        if template_dir is None:
            # Default to RENATA_V2/templates directory
            current_dir = Path(__file__).parent
            template_dir = current_dir.parent / "templates"

        self.template_dir = Path(template_dir)

        if not self.template_dir.exists():
            raise TemplateEngineError(
                f"Template directory not found: {self.template_dir}"
            )

        # Initialize Jinja2 environment
        self.env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=True
        )

        # Add custom filters if needed
        self._register_filters()

    def _register_filters(self):
        """Register custom Jinja2 filters"""
        # Add any custom filters here
        pass

    def get_template(self, template_name: str) -> Template:
        """
        Load a template by name

        Args:
            template_name: Name of template file (relative to template_dir)

        Returns:
            Jinja2 Template object

        Raises:
            TemplateEngineError: If template not found or has syntax errors
        """
        try:
            template = self.env.get_template(template_name)

            # Template is loaded successfully - return it
            return template

        except TemplateSyntaxError as e:
            raise TemplateEngineError(
                f"Template syntax error in {template_name}:{e.lineno}: {e.message}"
            )
        except Exception as e:
            raise TemplateEngineError(
                f"Failed to load template {template_name}: {e}"
            )

    def render(
        self,
        template_name: str,
        context: Dict[str, Any],
        validate_syntax: bool = True
    ) -> str:
        """
        Render a template with given context

        Args:
            template_name: Name of template file
            context: Variables to pass to template
            validate_syntax: Whether to validate Python syntax of output

        Returns:
            Rendered template as string

        Raises:
            TemplateEngineError: If rendering fails or syntax validation fails
        """
        try:
            template = self.get_template(template_name)
            rendered = template.render(**context)

            if validate_syntax:
                self._validate_python_syntax(rendered, template_name)

            return rendered

        except TemplateError as e:
            raise TemplateEngineError(
                f"Template rendering error in {template_name}: {e}"
            )
        except Exception as e:
            raise TemplateEngineError(
                f"Failed to render {template_name}: {e}"
            )

    def render_to_file(
        self,
        template_name: str,
        output_path: str,
        context: Dict[str, Any],
        validate_syntax: bool = True
    ) -> None:
        """
        Render template and write to file

        Args:
            template_name: Name of template file
            output_path: Path to output file
            context: Variables to pass to template
            validate_syntax: Whether to validate Python syntax of output
        """
        rendered = self.render(template_name, context, validate_syntax)

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            f.write(rendered)

    def _validate_python_syntax(self, code: str, template_name: str = "") -> None:
        """
        Validate Python syntax of generated code

        Args:
            code: Python code to validate
            template_name: Name of template (for error messages)

        Raises:
            TemplateEngineError: If code has syntax errors
        """
        try:
            compile(code, template_name or '<string>', 'exec')
        except SyntaxError as e:
            raise TemplateEngineError(
                f"Generated code has syntax error at line {e.lineno}: {e.msg}\n"
                f"Template: {template_name}\n"
                f"Context: {e.text}"
            )

    def list_templates(self) -> list:
        """
        List all available templates

        Returns:
            List of template names
        """
        return self.env.list_templates()

    def validate_template(self, template_name: str) -> bool:
        """
        Validate that a template exists and has valid syntax

        Args:
            template_name: Name of template to validate

        Returns:
            True if template is valid, False otherwise
        """
        try:
            self.env.get_template(template_name)
            return True
        except Exception:
            return False

    def get_template_source(self, template_name: str) -> str:
        """
        Get the source code of a template

        Args:
            template_name: Name of template

        Returns:
            Template source code as string
        """
        template = self.get_template(template_name)
        return template.source
