"""
Helpers - Utility Functions for Renata Rebuild

This module:
1. String manipulation utilities
2. Code formatting utilities
3. File I/O utilities
4. Common helper functions
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime


class StringUtils:
    """String manipulation utilities"""

    @staticmethod
    def snake_case(text: str) -> str:
        """Convert text to snake_case"""
        # Insert space before capital letters
        text = re.sub(r'([A-Z])', r' \1', text)
        # Replace spaces and hyphens with underscores
        text = re.sub(r'[\s-]+', '_', text)
        # Convert to lowercase and strip
        return text.lower().strip('_')

    @staticmethod
    def pascal_case(text: str) -> str:
        """Convert text to PascalCase"""
        # Split by underscores, spaces, hyphens
        words = re.split(r'[_\s-]+', text.lower())
        # Capitalize each word
        return ''.join(word.capitalize() for word in words if word)

    @staticmethod
    def camel_case(text: str) -> str:
        """Convert text to camelCase"""
        pascal = StringUtils.pascal_case(text)
        # Lowercase first letter
        return pascal[0].lower() + pascal[1:] if pascal else ''

    @staticmethod
    def normalize_whitespace(text: str) -> str:
        """Normalize whitespace in text"""
        return re.sub(r'\s+', ' ', text).strip()

    @staticmethod
    def remove_comments(code: str) -> str:
        """Remove comments from Python code"""
        # Remove single-line comments
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
        # Remove multi-line docstrings
        code = re.sub(r'""".*?"""', '', code, flags=re.DOTALL)
        code = re.sub(r"'''.*?'''", '', code, flags=re.DOTALL)
        return code

    @staticmethod
    def extract_string_literals(code: str) -> List[str]:
        """Extract all string literals from code"""
        # Single-quoted strings
        single = re.findall(r"'([^']*)'", code)
        # Double-quoted strings
        double = re.findall(r'"([^"]*)"', code)
        # Triple-quoted strings
        triple_single = re.findall(r"'''(.*?)'''", code, flags=re.DOTALL)
        triple_double = re.findall(r'"""(.*?)"""', code, flags=re.DOTALL)

        return single + double + triple_single + triple_double


class CodeFormatter:
    """Code formatting utilities"""

    @staticmethod
    def indent_code(code: str, spaces: int = 4) -> str:
        """Indent code by specified spaces"""
        lines = code.split('\n')
        indent = ' ' * spaces
        return '\n'.join(indent + line if line.strip() else line for line in lines)

    @staticmethod
    def dedent_code(code: str) -> str:
        """Remove common leading whitespace"""
        lines = code.split('\n')
        # Find minimum indentation
        min_indent = float('inf')
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                min_indent = min(min_indent, indent)

        # Remove minimum indentation
        result = []
        for line in lines:
            if line.strip() and len(line) >= min_indent:
                result.append(line[min_indent:])
            else:
                result.append(line)

        return '\n'.join(result)

    @staticmethod
    def format_dict(d: Dict[str, Any], indent: int = 0) -> str:
        """Format dictionary as pretty string"""
        lines = []
        spaces = '  ' * indent

        for key, value in d.items():
            if isinstance(value, dict):
                lines.append(f"{spaces}{key}:")
                lines.append(CodeFormatter.format_dict(value, indent + 1))
            elif isinstance(value, list):
                lines.append(f"{spaces}{key}: {len(value)} items")
            else:
                lines.append(f"{spaces}{key}: {value}")

        return '\n'.join(lines)

    @staticmethod
    def wrap_method_code(method_name: str, code: str, indent: int = 4) -> str:
        """Wrap code in method definition"""
        indented_code = CodeFormatter.indent_code(code, indent)
        return f"def {method_name}(self):\n{indented_code}"

    @staticmethod
    def add_imports(code: str, imports: List[str]) -> str:
        """Add import statements to code"""
        # Find where to insert imports (after existing imports or at start)
        lines = code.split('\n')
        insert_pos = 0

        for i, line in enumerate(lines):
            if line.strip().startswith('import ') or line.strip().startswith('from '):
                insert_pos = i + 1
            elif line.strip().startswith('class ') or line.strip().startswith('def '):
                break

        # Insert new imports
        new_imports = [f"import {imp}" for imp in imports if not imp.startswith('from')]
        from_imports = [imp for imp in imports if imp.startswith('from')]

        all_new_imports = from_imports + new_imports

        # Insert at position
        lines[insert_pos:insert_pos] = all_new_imports

        return '\n'.join(lines)


class FileIO:
    """File I/O utilities"""

    @staticmethod
    def read_file(file_path: str, encoding: str = 'utf-8') -> str:
        """Read file contents"""
        path = Path(file_path)
        return path.read_text(encoding=encoding)

    @staticmethod
    def write_file(file_path: str, content: str, encoding: str = 'utf-8') -> None:
        """Write content to file"""
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding=encoding)

    @staticmethod
    def read_json(file_path: str) -> Dict[str, Any]:
        """Read JSON file"""
        content = FileIO.read_file(file_path)
        return json.loads(content)

    @staticmethod
    def write_json(file_path: str, data: Dict[str, Any], indent: int = 2) -> None:
        """Write JSON file"""
        content = json.dumps(data, indent=indent)
        FileIO.write_file(file_path, content)

    @staticmethod
    def list_files(
        directory: str,
        pattern: str = '*',
        recursive: bool = False
    ) -> List[Path]:
        """List files in directory"""
        path = Path(directory)
        if recursive:
            return list(path.rglob(pattern))
        else:
            return list(path.glob(pattern))

    @staticmethod
    def ensure_directory(directory: str) -> Path:
        """Ensure directory exists"""
        path = Path(directory)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @staticmethod
    def get_unique_filename(base_path: str, suffix: str = '') -> str:
        """Generate unique filename if file exists"""
        path = Path(base_path)
        counter = 0

        while path.exists():
            counter += 1
            stem = path.stem.split(f'__{counter-1}')[0] if counter > 1 else path.stem
            new_name = f"{stem}_{counter}{suffix}{path.suffix}"
            path = path.parent / new_name

        return str(path)


class DateTimeUtils:
    """Date and time utilities"""

    @staticmethod
    def now_str() -> str:
        """Get current timestamp as string"""
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    @staticmethod
    def now_filename() -> str:
        """Get current timestamp for filename"""
        return datetime.now().strftime('%Y%m%d_%H%M%S')

    @staticmethod
    def parse_date(date_str: str) -> datetime:
        """Parse date string"""
        formats = [
            '%Y-%m-%d',
            '%Y/%m/%d',
            '%m-%d-%Y',
            '%m/%d/%Y',
            '%Y%m%d'
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        raise ValueError(f"Unable to parse date: {date_str}")


class ValidationUtils:
    """Validation utilities"""

    @staticmethod
    def is_valid_python_name(name: str) -> bool:
        """Check if name is valid Python identifier"""
        return name.isidentifier()

    @staticmethod
    def is_valid_api_key(api_key: str) -> bool:
        """Validate API key format (basic check)"""
        return len(api_key) >= 10 and api_key.replace('_', '').replace('-', '').isalnum()

    @staticmethod
    def is_valid_date(date_str: str) -> bool:
        """Check if date string is valid"""
        try:
            DateTimeUtils.parse_date(date_str)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_parameters(params: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate scanner parameters"""
        errors = []

        # Check parameter types
        type_checks = {
            'min_price': (int, float),
            'max_price': (int, float),
            'min_volume': (int, float),
            'max_volume': (int, float),
            'min_gap': (int, float),
            'max_gap': (int, float),
            'lookback': int
        }

        for param, value in params.items():
            if param in type_checks:
                expected_types = type_checks[param]
                if not isinstance(value, expected_types):
                    errors.append(
                        f"{param} should be {expected_types}, got {type(value).__name__}"
                    )

        # Check logical constraints
        if 'min_price' in params and 'max_price' in params:
            if params['min_price'] > params['max_price']:
                errors.append("min_price cannot be greater than max_price")

        if 'min_volume' in params and 'max_volume' in params:
            if params['min_volume'] > params['max_volume']:
                errors.append("min_volume cannot be greater than max_volume")

        return len(errors) == 0, errors


class ProgressTracker:
    """Progress tracking utilities"""

    def __init__(self, total: int, description: str = "Progress"):
        """Initialize progress tracker"""
        self.total = total
        self.current = 0
        self.description = description

    def update(self, n: int = 1) -> None:
        """Update progress"""
        self.current += n
        self._print_progress()

    def _print_progress(self) -> None:
        """Print progress bar"""
        percent = (self.current / self.total) * 100
        bar_length = 50
        filled = int(bar_length * self.current / self.total)
        bar = '█' * filled + '░' * (bar_length - filled)
        print(f'\r{self.description}: [{bar}] {percent:.1f}%', end='')

        if self.current >= self.total:
            print()  # New line when complete


# Test helpers
if __name__ == "__main__":
    print("Testing Utilities...\n")

    # StringUtils
    print("StringUtils:")
    print(f"  snake_case('BacksideBScanner') = {StringUtils.snake_case('BacksideBScanner')}")
    print(f"  pascal_case('backside b scanner') = {StringUtils.pascal_case('backside b scanner')}")
    print(f"  normalize_whitespace('test   multiple   spaces') = '{StringUtils.normalize_whitespace('test   multiple   spaces')}'")

    # CodeFormatter
    print("\nCodeFormatter:")
    code = "def test():\n  print('hello')"
    print(f"  dedent_code: {repr(CodeFormatter.dedent_code(code))}")

    # ValidationUtils
    print("\nValidationUtils:")
    params = {'min_price': 5.0, 'max_price': 10.0, 'lookback': 20}
    valid, errors = ValidationUtils.validate_parameters(params)
    print(f"  Valid parameters: {valid}")
    print(f"  Errors: {errors}")

    # ProgressTracker
    print("\nProgressTracker:")
    tracker = ProgressTracker(10, "Processing")
    for i in range(10):
        tracker.update(1)
