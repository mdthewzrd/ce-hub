"""
Template Repository - Load and Analyze Reference Templates

This module:
1. Loads all 7 reference templates
2. Extracts structure patterns (single-scan vs multi-scan)
3. Extracts standardization patterns
4. Provides template matching for user code
"""

import ast
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd


class TemplateRepository:
    """
    Repository for EdgeDev reference templates

    Loads templates and extracts:
    - Class structure
    - Method signatures
    - Parameter patterns
    - Standardization patterns
    """

    def __init__(self, templates_dir: str):
        """
        Initialize template repository

        Args:
            templates_dir: Path to templates directory
        """
        self.templates_dir = Path(templates_dir)
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.single_scan_patterns: Dict[str, Any] = {}
        self.multi_scan_patterns: Dict[str, Any] = {}

        self._load_all_templates()
        self._extract_patterns()

    def _load_all_templates(self):
        """Load all template files"""
        template_files = list(self.templates_dir.glob("*.py"))

        print(f"📚 Loading {len(template_files)} reference templates...")

        for template_file in template_files:
            try:
                template_name = template_file.stem
                template_code = template_file.read_text()

                # Parse template
                tree = ast.parse(template_code)

                # Extract class info
                class_info = self._extract_class_info(tree, template_code)

                self.templates[template_name] = {
                    'name': template_name,
                    'file_path': str(template_file),
                    'code': template_code,
                    'ast': tree,
                    'class_info': class_info,
                }

                print(f"  ✅ Loaded: {template_name}")

            except Exception as e:
                print(f"  ❌ Error loading {template_file.name}: {e}")

        print(f"📚 Loaded {len(self.templates)} templates successfully")

    def _extract_class_info(self, tree: ast.AST, code: str) -> Dict[str, Any]:
        """Extract class information from AST"""
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        if not classes:
            return {}

        main_class = classes[0]  # Assume first class is main scanner class

        return {
            'class_name': main_class.name,
            'methods': self._extract_methods(main_class),
            'attributes': self._extract_attributes(main_class),
            'docstring': ast.get_docstring(main_class),
        }

    def _extract_methods(self, class_node: ast.ClassDef) -> Dict[str, Dict[str, Any]]:
        """Extract method information"""
        methods = {}

        for node in class_node.body:
            if isinstance(node, ast.FunctionDef):
                methods[node.name] = {
                    'name': node.name,
                    'args': [arg.arg for arg in node.args.args],
                    'docstring': ast.get_docstring(node),
                    'lineno': node.lineno,
                }

        return methods

    def _extract_attributes(self, class_node: ast.ClassDef) -> List[str]:
        """Extract class attributes"""
        attributes = []

        for node in class_node.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        attributes.append(target.id)

        return attributes

    def _extract_patterns(self):
        """Extract structure patterns from loaded templates"""
        print("\n🔍 Extracting structure patterns...")

        for template_name, template in self.templates.items():
            class_info = template['class_info']

            # Determine if single-scan or multi-scan
            structure_type = self._determine_structure_type(template, class_info)

            # Extract patterns
            if structure_type == 'single-scan':
                self.single_scan_patterns[template_name] = self._extract_single_scan_patterns(template)
                print(f"  📊 {template_name}: Single-scan structure")
            else:
                self.multi_scan_patterns[template_name] = self._extract_multi_scan_patterns(template)
                print(f"  📊 {template_name}: Multi-scan structure")

        print(f"\n📊 Pattern extraction complete:")
        print(f"  - Single-scan patterns: {len(self.single_scan_patterns)}")
        print(f"  - Multi-scan patterns: {len(self.multi_scan_patterns)}")

    def _determine_structure_type(self, template: Dict, class_info: Dict) -> str:
        """
        Determine if template is single-scan or multi-scan

        Indicators of MULTI-SCAN:
        - Multiple parameter sets
        - Returns dictionary of signals
        - Multiple pattern detection methods
        """
        code = template['code']
        class_name = class_info.get('class_name', '')

        # Check for multiple parameter sets
        has_multiple_params = (
            'params' in code.lower() and
            ('backside_b_params' in code.lower() or
             'a_plus_params' in code.lower() or
             'lc_d2_params' in code.lower())
        )

        # Check for dictionary return
        returns_dict = 'return {' in code and 'signals' in code.lower()

        # Check for multiple pattern methods
        pattern_methods = [
            'check_backside_b', 'check_a_plus', 'check_lc_d2',
            'detect_backside_b', 'detect_a_plus', 'detect_lc_d2',
        ]
        has_multiple_patterns = any(method in code.lower() for method in pattern_methods)

        if has_multiple_params or returns_dict or has_multiple_patterns:
            return 'multi-scan'
        else:
            return 'single-scan'

    def _extract_single_scan_patterns(self, template: Dict) -> Dict[str, Any]:
        """Extract single-scan structure patterns"""
        class_info = template['class_info']
        methods = class_info.get('methods', {})

        return {
            'structure_type': 'single-scan',
            'required_methods': [
                'get_trading_dates',
                'fetch_all_grouped_data',
                '_fetch_grouped_day',
                'compute_simple_features',
                'apply_smart_filters',
                'compute_full_features',
                'detect_patterns',
                'execute',
            ],
            'methods': methods,
            'has_grouped_endpoint': 'fetch_all_grouped_data' in methods,
            'has_smart_filters': 'apply_smart_filters' in methods,
            'has_parallel_processing': 'ThreadPoolExecutor' in template['code'],
        }

    def _extract_multi_scan_patterns(self, template: Dict) -> Dict[str, Any]:
        """Extract multi-scan structure patterns"""
        class_info = template['class_info']
        methods = class_info.get('methods', {})

        return {
            'structure_type': 'multi-scan',
            'required_methods': [
                'get_trading_dates',
                'fetch_all_grouped_data',
                '_fetch_grouped_day',
                'compute_simple_features',
                'apply_smart_filters',
                'compute_full_features',
                'detect_patterns',
                'execute',
            ],
            'methods': methods,
            'has_grouped_endpoint': 'fetch_all_grouped_data' in methods,
            'has_smart_filters': 'apply_smart_filters' in methods,
            'has_parallel_processing': 'ThreadPoolExecutor' in template['code'],
            'returns_dict': True,
        }

    def get_template(self, template_name: str) -> Optional[Dict[str, Any]]:
        """Get specific template by name"""
        return self.templates.get(template_name)

    def get_all_templates(self) -> Dict[str, Dict[str, Any]]:
        """Get all loaded templates"""
        return self.templates

    def get_single_scan_patterns(self) -> Dict[str, Any]:
        """Get all single-scan structure patterns"""
        return self.single_scan_patterns

    def get_multi_scan_patterns(self) -> Dict[str, Any]:
        """Get all multi-scan structure patterns"""
        return self.multi_scan_patterns

    def find_matching_template(self, user_code: str) -> Optional[str]:
        """
        Find the template that best matches user code

        This is used to:
        1. Determine structure type (single-scan vs multi-scan)
        2. Find similar scanner for reference
        3. Extract patterns to apply
        """
        # Parse user code
        try:
            user_tree = ast.parse(user_code)
            user_classes = [node for node in ast.walk(user_tree) if isinstance(node, ast.ClassDef)]

            if not user_classes:
                return None

            user_class = user_classes[0]
            user_methods = set(node.name for node in user_class.body if isinstance(node, ast.FunctionDef))

            # Score each template
            best_match = None
            best_score = 0

            for template_name, template in self.templates.items():
                template_methods = set(template['class_info']['methods'].keys())

                # Calculate similarity (Jaccard index)
                intersection = len(user_methods & template_methods)
                union = len(user_methods | template_methods)
                similarity = intersection / union if union > 0 else 0

                if similarity > best_score:
                    best_score = similarity
                    best_match = template_name

            return best_match

        except Exception as e:
            print(f"Error finding matching template: {e}")
            return None

    def validate_template_completeness(self) -> Dict[str, bool]:
        """
        Validate that all templates have required components

        Returns dict with validation results
        """
        validation_results = {}

        required_methods = {
            'get_trading_dates',
            'fetch_all_grouped_data',
            'apply_smart_filters',
            'detect_patterns',
        }

        for template_name, template in self.templates.items():
            methods = set(template['class_info']['methods'].keys())

            validation_results[template_name] = {
                'has_all_required_methods': all(method in methods for method in required_methods),
                'has_grouped_endpoint': 'fetch_all_grouped_data' in methods,
                'has_smart_filters': 'apply_smart_filters' in methods,
                'has_parallel_processing': 'ThreadPoolExecutor' in template['code'],
            }

        return validation_results


# Test the repository
if __name__ == "__main__":
    # Get templates directory (relative to this file)
    current_dir = Path(__file__).parent
    templates_dir = current_dir.parent.parent / "templates"

    print("=" * 70)
    print("TEMPLATE REPOSITORY - TEST")
    print("=" * 70)

    repo = TemplateRepository(str(templates_dir))

    print("\n" + "=" * 70)
    print("VALIDATION RESULTS")
    print("=" * 70)

    validation = repo.validate_template_completeness()

    for template_name, results in validation.items():
        print(f"\n{template_name}:")
        for check, passed in results.items():
            status = "✅" if passed else "❌"
            print(f"  {status} {check}")
