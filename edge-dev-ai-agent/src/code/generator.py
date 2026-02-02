"""
Code Generator

Extracts, validates, and saves Python code from LLM responses.
"""

import re
import ast
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass


@dataclass
class CodeBlock:
    """A code block extracted from an LLM response."""
    code: str
    language: str
    start_line: int
    end_line: int
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


@dataclass
class GeneratedFile:
    """A generated file ready to be saved."""
    filename: str
    content: str
    directory: str
    language: str
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

    @property
    def full_path(self) -> Path:
        """Get full file path."""
        return Path(self.directory) / self.filename


class CodeGenerator:
    """Extracts and processes code from LLM responses."""

    def __init__(self, output_dir: Optional[str] = None):
        """Initialize code generator.

        Args:
            output_dir: Default output directory for generated code
        """
        self.output_dir = Path(output_dir or "generated_code")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def extract_code_blocks(self, text: str) -> List[CodeBlock]:
        """Extract code blocks from markdown-formatted text.

        Args:
            text: Text potentially containing code blocks

        Returns:
            List of extracted code blocks
        """
        blocks = []
        lines = text.split('\n')

        in_code_block = False
        current_block = []
        current_lang = "python"
        start_line = 0

        for i, line in enumerate(lines):
            # Check for code block start
            if line.strip().startswith('```'):
                if not in_code_block:
                    # Starting a new code block
                    in_code_block = True
                    start_line = i + 1
                    # Extract language
                    parts = line.strip().split('```')
                    current_lang = parts[1] if len(parts) > 1 else "python"
                    current_block = []
                else:
                    # Ending code block
                    in_code_block = False
                    if current_block:
                        blocks.append(CodeBlock(
                            code='\n'.join(current_block),
                            language=current_lang,
                            start_line=start_line,
                            end_line=i,
                        ))
                    current_block = []
            elif in_code_block:
                current_block.append(line)

        return blocks

    def extract_python_code(self, text: str) -> List[str]:
        """Extract only Python code blocks.

        Args:
            text: Text potentially containing Python code

        Returns:
            List of Python code strings
        """
        blocks = self.extract_code_blocks(text)
        return [b.code for b in blocks if b.language in ['python', 'py']]

    def extract_class_definition(self, code: str) -> Optional[Dict[str, Any]]:
        """Extract class definition information from Python code.

        Args:
            code: Python source code

        Returns:
            Dict with class name, bases, methods, or None
        """
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    return {
                        "name": node.name,
                        "bases": [ast.unparse(base) for base in node.bases],
                        "methods": [n.name for n in node.body if isinstance(n, ast.FunctionDef)],
                        "lineno": node.lineno,
                    }
        except (SyntaxError, ValueError):
            pass
        return None

    def extract_imports(self, code: str) -> List[str]:
        """Extract import statements from Python code.

        Args:
            code: Python source code

        Returns:
            List of import statements
        """
        imports = []
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(f"import {alias.name}")
                elif isinstance(node, ast.ImportFrom):
                    module = node.module if node.module else ""
                    for alias in node.names:
                        imports.append(f"from {module} import {alias.name}")
        except (SyntaxError, ValueError):
            # Fallback to regex
            import_patterns = [
                r'^import\s+.*$',
                r'^from\s+.*\s+import\s+.*$',
            ]
            for line in code.split('\n'):
                line = line.strip()
                for pattern in import_patterns:
                    if re.match(pattern, line):
                        imports.append(line)
                        break

        return imports

    def generate_filename(
        self,
        class_name: Optional[str] = None,
        description: Optional[str] = None,
        prefix: str = ""
    ) -> str:
        """Generate a filename for generated code.

        Args:
            class_name: Name of the main class (if any)
            description: Description of what the code does
            prefix: Optional prefix for the filename

        Returns:
            Generated filename
        """
        # Use class name if available
        if class_name:
            # Convert to snake_case
            name = re.sub(r'(?<!^)(?=[A-Z])', '_', class_name).lower()
            base = f"{name}.py"
        elif description:
            # Generate from description
            words = re.findall(r'\w+', description.lower())
            # Use first 3 meaningful words
            meaningful = [w for w in words if len(w) > 3][:3]
            if meaningful:
                base = "_".join(meaningful) + ".py"
            else:
                base = "generated_code.py"
        else:
            base = "generated_code.py"

        # Add prefix
        if prefix:
            base = f"{prefix}_{base}"

        # Add timestamp if file exists
        if (self.output_dir / base).exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name_part = base.replace('.py', '')
            base = f"{name_part}_{timestamp}.py"

        return base

    def create_generated_file(
        self,
        code: str,
        filename: Optional[str] = None,
        description: Optional[str] = None,
        subdirectory: Optional[str] = None
    ) -> GeneratedFile:
        """Create a GeneratedFile object.

        Args:
            code: Python code to save
            filename: Specific filename (auto-generated if None)
            description: Description for filename generation
            subdirectory: Subdirectory within output_dir

        Returns:
            GeneratedFile object
        """
        # Extract class name for filename
        class_info = self.extract_class_definition(code)
        class_name = class_info['name'] if class_info else None

        # Generate filename if not provided
        if filename is None:
            filename = self.generate_filename(
                class_name=class_name,
                description=description
            )

        # Determine directory
        directory = str(self.output_dir)
        if subdirectory:
            directory = str(self.output_dir / subdirectory)
            Path(directory).mkdir(parents=True, exist_ok=True)

        return GeneratedFile(
            filename=filename,
            content=code,
            directory=directory,
            language="python",
            metadata={
                "class_name": class_name,
                "description": description,
                "created_at": datetime.now().isoformat(),
            }
        )

    def save_code(self, generated_file: GeneratedFile) -> Path:
        """Save generated code to file.

        Args:
            generated_file: GeneratedFile to save

        Returns:
            Path to saved file
        """
        file_path = generated_file.full_path

        # Create directory if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Add header
        header = f'''"""
Auto-generated by EdgeDev AI Agent
Generated: {generated_file.metadata.get('created_at', 'Unknown')}
Description: {generated_file.metadata.get('description', 'N/A')}
"""

'''

        # Write file
        file_path.write_text(header + generated_file.content)

        return file_path


class CodeExtractor:
    """Extract code and metadata from agent responses."""

    @staticmethod
    def parse_agent_response(response: str) -> Dict[str, Any]:
        """Parse an agent's response to extract code and metadata.

        Args:
            response: Agent's response text

        Returns:
            Dict with code blocks, description, metadata
        """
        generator = CodeGenerator()

        # Extract code blocks
        code_blocks = generator.extract_code_blocks(response)

        # Try to find description (first paragraph before code)
        description = ""
        lines = response.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith('```'):
                description = '\n'.join(lines[:i]).strip()
                break

        return {
            "code_blocks": code_blocks,
            "python_code": generator.extract_python_code(response),
            "description": description,
            "has_code": len(code_blocks) > 0,
        }
