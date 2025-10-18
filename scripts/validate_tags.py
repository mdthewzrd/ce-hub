#!/usr/bin/env python3
"""
CE-Hub Tag Validation Script
Validates document tags against the official CE-Hub Tag Policy.

Usage:
    python scripts/validate_tags.py [file_path]
    python scripts/validate_tags.py --directory docs/
    python scripts/validate_tags.py --all
    python scripts/validate_tags.py --fix [file_path]

Examples:
    python scripts/validate_tags.py docs/WEEKLY_REFLECTION_2025-10-11.md
    python scripts/validate_tags.py --directory docs/
    python scripts/validate_tags.py --all --verbose
"""

import os
import re
import yaml
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Set, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of tag validation for a single document."""
    file_path: str
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    current_tags: List[str]
    suggested_tags: Optional[List[str]] = None


class TagPolicy:
    """CE-Hub Tag Policy implementation and validation rules."""

    # Required categories
    REQUIRED_CATEGORIES = {'scope', 'type'}

    # Valid values for each category
    VALID_VALUES = {
        'scope': {
            'global', 'project', 'meta', 'local'
        },
        'type': {
            'plan', 'sop', 'report', 'implementation', 'summary',
            'specialist', 'reflection', 'docs', 'patterns', 'examples',
            'api', 'guide', 'status-report'
        },
        'stage': {
            'draft', 'review', 'active', 'archived', 'weekly', 'monthly',
            'planning', 'development', 'testing', 'production'
        },
        'project': {
            'ce-hub', 'auth-edge', 'planner-chat', 'archon', 'agui'
        },
        'domain': {
            'context-engineering', 'frontend', 'backend', 'devops',
            'security', 'testing', 'documentation', 'supabase',
            'pydantic', 'typescript', 'vercel'
        },
        'intelligence': {
            'meta-analysis', 'pattern-recognition', 'learning-synthesis',
            'knowledge-aggregation', 'trend-analysis'
        },
        'source': {
            'claude-code', 'planner-chat', 'archon', 'manual', 'automated'
        }
    }

    # Tag format validation
    TAG_FORMAT_PATTERN = re.compile(r'^[a-z-]+:[a-z0-9-]+$')

    # Category format validation
    CATEGORY_PATTERN = re.compile(r'^[a-z-]+$')
    VALUE_PATTERN = re.compile(r'^[a-z0-9-]+$')

    # Conditional requirements
    CONDITIONAL_REQUIREMENTS = {
        'scope:project': ['project']  # scope:project requires project tag
    }

    # Limits
    MIN_TAGS = 2
    MAX_TAGS = 8


class TagValidator:
    """Main tag validation engine."""

    def __init__(self, policy: TagPolicy):
        self.policy = policy

    def validate_file(self, file_path: str) -> ValidationResult:
        """Validate tags in a single file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            tags = self._extract_tags(content)
            if tags is None:
                return ValidationResult(
                    file_path=file_path,
                    is_valid=False,
                    errors=['No tags section found in document'],
                    warnings=[],
                    current_tags=[]
                )

            return self._validate_tags(file_path, tags)

        except Exception as e:
            return ValidationResult(
                file_path=file_path,
                is_valid=False,
                errors=[f'Error reading file: {str(e)}'],
                warnings=[],
                current_tags=[]
            )

    def _extract_tags(self, content: str) -> Optional[List[str]]:
        """Extract tags from document frontmatter or content."""
        # Try YAML frontmatter first
        if content.startswith('---'):
            try:
                # Find the end of frontmatter
                end_match = re.search(r'\n---\n', content)
                if end_match:
                    frontmatter = content[:end_match.start()]
                    yaml_content = yaml.safe_load(frontmatter[3:])  # Remove first ---
                    if isinstance(yaml_content, dict) and 'tags' in yaml_content:
                        tags = yaml_content['tags']
                        if isinstance(tags, list):
                            # Handle both string and list formats
                            return [tag.strip('- ') for tag in tags if tag.strip('- ')]
            except yaml.YAMLError:
                pass

        # Try to find tags: section in content
        tags_match = re.search(r'tags:\s*\n((?:- .+\n?)+)', content, re.MULTILINE)
        if tags_match:
            tags_section = tags_match.group(1)
            # Extract individual tags
            tag_lines = re.findall(r'- (.+)', tags_section)
            return [tag.strip() for tag in tag_lines if tag.strip()]

        # Try inline tags format
        inline_match = re.search(r'tags:\s*\[(.*?)\]', content)
        if inline_match:
            tags_str = inline_match.group(1)
            # Split by comma and clean up
            tags = [tag.strip(' "\',') for tag in tags_str.split(',')]
            return [tag for tag in tags if tag]

        return None

    def _validate_tags(self, file_path: str, tags: List[str]) -> ValidationResult:
        """Validate a list of tags against policy."""
        errors = []
        warnings = []

        # Check tag count
        if len(tags) < self.policy.MIN_TAGS:
            errors.append(f'Insufficient tags: {len(tags)} < {self.policy.MIN_TAGS} required')
        if len(tags) > self.policy.MAX_TAGS:
            warnings.append(f'Too many tags: {len(tags)} > {self.policy.MAX_TAGS} recommended')

        # Validate format and categorize
        categories_found = set()
        tag_categories = {}

        for tag in tags:
            # Validate format
            if not self.policy.TAG_FORMAT_PATTERN.match(tag):
                errors.append(f'Invalid tag format: "{tag}" (must be category:value)')
                continue

            # Split and validate parts
            try:
                category, value = tag.split(':', 1)
            except ValueError:
                errors.append(f'Invalid tag structure: "{tag}"')
                continue

            # Validate category format
            if not self.policy.CATEGORY_PATTERN.match(category):
                errors.append(f'Invalid category format: "{category}"')
                continue

            # Validate value format
            if not self.policy.VALUE_PATTERN.match(value):
                errors.append(f'Invalid value format: "{value}" in tag "{tag}"')
                continue

            # Check for duplicate categories
            if category in categories_found:
                errors.append(f'Duplicate category: "{category}" (only one per document)')
            else:
                categories_found.add(category)
                tag_categories[category] = value

            # Validate against allowed values
            if category in self.policy.VALID_VALUES:
                if value not in self.policy.VALID_VALUES[category]:
                    errors.append(f'Invalid value "{value}" for category "{category}"')
                    valid_values = ', '.join(sorted(self.policy.VALID_VALUES[category]))
                    errors.append(f'  Valid values: {valid_values}')

        # Check required categories
        for required_cat in self.policy.REQUIRED_CATEGORIES:
            if required_cat not in categories_found:
                errors.append(f'Missing required category: "{required_cat}"')

        # Check conditional requirements
        for condition, required_cats in self.policy.CONDITIONAL_REQUIREMENTS.items():
            condition_cat, condition_val = condition.split(':', 1)
            if condition_cat in tag_categories and tag_categories[condition_cat] == condition_val:
                for req_cat in required_cats:
                    if req_cat not in categories_found:
                        errors.append(f'Conditional requirement: "{condition}" requires "{req_cat}" category')

        # Generate suggestions
        suggested_tags = self._generate_suggestions(file_path, tag_categories, categories_found)

        return ValidationResult(
            file_path=file_path,
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            current_tags=tags,
            suggested_tags=suggested_tags
        )

    def _generate_suggestions(self, file_path: str, tag_categories: Dict[str, str],
                            categories_found: Set[str]) -> List[str]:
        """Generate tag suggestions based on file path and content."""
        suggestions = []

        # Infer from file path
        path_lower = file_path.lower()

        # Suggest scope based on location
        if 'scope' not in categories_found:
            if '/docs/' in path_lower and ('reflection' in path_lower or 'report' in path_lower):
                suggestions.append('scope:meta')
            elif '/functions/' in path_lower or '/scripts/' in path_lower:
                suggestions.append('scope:project')
            else:
                suggestions.append('scope:global')

        # Suggest type based on filename
        if 'type' not in categories_found:
            if 'reflection' in path_lower:
                suggestions.append('type:reflection')
            elif 'report' in path_lower:
                suggestions.append('type:report')
            elif 'prp' in path_lower or 'plan' in path_lower:
                suggestions.append('type:plan')
            elif path_lower.endswith('.py') or path_lower.endswith('.js') or path_lower.endswith('.ts'):
                suggestions.append('type:implementation')
            elif 'summary' in path_lower:
                suggestions.append('type:summary')
            else:
                suggestions.append('type:docs')

        # Suggest project based on path
        if 'project' not in categories_found and 'scope' in tag_categories and tag_categories['scope'] == 'project':
            if 'auth-edge' in path_lower:
                suggestions.append('project:auth-edge')
            elif 'planner-chat' in path_lower:
                suggestions.append('project:planner-chat')
            else:
                suggestions.append('project:ce-hub')

        # Suggest stage based on content
        if 'stage' not in categories_found:
            if 'weekly' in path_lower:
                suggestions.append('stage:weekly')
            elif 'archive' in path_lower:
                suggestions.append('stage:archived')
            else:
                suggestions.append('stage:active')

        return suggestions


def find_markdown_files(directory: str) -> List[str]:
    """Find all markdown files in a directory recursively."""
    markdown_files = []
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and other non-content directories
        dirs[:] = [d for d in dirs if d not in {'node_modules', '.git', 'dist', 'build', '__pycache__'}]

        for file in files:
            if file.endswith('.md'):
                markdown_files.append(os.path.join(root, file))

    return sorted(markdown_files)


def print_validation_result(result: ValidationResult, verbose: bool = False):
    """Print validation result in a formatted way."""
    status = "✅ VALID" if result.is_valid else "❌ INVALID"
    print(f"\n{status}: {result.file_path}")

    if result.current_tags:
        print(f"  Current tags: {', '.join(result.current_tags)}")

    if result.errors:
        print("  Errors:")
        for error in result.errors:
            print(f"    - {error}")

    if result.warnings:
        print("  Warnings:")
        for warning in result.warnings:
            print(f"    - {warning}")

    if result.suggested_tags and (not result.is_valid or verbose):
        print("  Suggestions:")
        for suggestion in result.suggested_tags:
            print(f"    + {suggestion}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Validate CE-Hub document tags against policy",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument('path', nargs='?', help='File or directory path to validate')
    parser.add_argument('--directory', '-d', help='Validate all markdown files in directory')
    parser.add_argument('--all', '-a', action='store_true', help='Validate all files in ce-hub')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show suggestions even for valid files')
    parser.add_argument('--fix', action='store_true', help='Attempt to auto-fix simple issues')
    parser.add_argument('--quiet', '-q', action='store_true', help='Only show summary')

    args = parser.parse_args()

    # Determine files to validate
    files_to_validate = []

    if args.all:
        # Find CE-Hub root directory
        script_dir = Path(__file__).parent
        ce_hub_root = script_dir.parent
        files_to_validate = find_markdown_files(str(ce_hub_root / 'docs'))
        # Add other relevant directories
        for subdir in ['chats/archive', 'PRPs']:
            subdir_path = ce_hub_root / subdir
            if subdir_path.exists():
                files_to_validate.extend(find_markdown_files(str(subdir_path)))

    elif args.directory:
        if not os.path.isdir(args.directory):
            print(f"Error: Directory not found: {args.directory}")
            sys.exit(1)
        files_to_validate = find_markdown_files(args.directory)

    elif args.path:
        if os.path.isfile(args.path):
            files_to_validate = [args.path]
        elif os.path.isdir(args.path):
            files_to_validate = find_markdown_files(args.path)
        else:
            print(f"Error: Path not found: {args.path}")
            sys.exit(1)

    else:
        parser.print_help()
        sys.exit(1)

    if not files_to_validate:
        print("No markdown files found to validate.")
        sys.exit(0)

    # Initialize validator
    policy = TagPolicy()
    validator = TagValidator(policy)

    # Validate files
    results = []
    for file_path in files_to_validate:
        result = validator.validate_file(file_path)
        results.append(result)

        if not args.quiet:
            print_validation_result(result, args.verbose)

    # Print summary
    valid_count = sum(1 for r in results if r.is_valid)
    total_count = len(results)

    print(f"\n{'='*50}")
    print(f"VALIDATION SUMMARY")
    print(f"{'='*50}")
    print(f"Total files: {total_count}")
    print(f"Valid: {valid_count}")
    print(f"Invalid: {total_count - valid_count}")

    if valid_count == total_count:
        print("🎉 All files pass tag validation!")
        sys.exit(0)
    else:
        print("❌ Some files have tag validation errors.")
        sys.exit(1)


if __name__ == '__main__':
    main()