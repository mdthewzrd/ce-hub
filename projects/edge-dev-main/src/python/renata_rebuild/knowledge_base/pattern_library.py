"""
Pattern Library - Extract and Catalog Reusable Code Patterns

This module:
1. Analyzes all templates for recurring patterns
2. Categorizes patterns by type (data fetching, computation, filtering, etc.)
3. Extracts implementation patterns with best practices
4. Provides pattern matching for user code
"""

import ast
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
import pandas as pd


class PatternLibrary:
    """
    Library of reusable EdgeDev code patterns

    Extracts patterns from templates:
    - Data fetching patterns
    - Computation patterns
    - Filtering patterns
    - Column creation patterns
    - Method structure patterns
    """

    def __init__(self, templates_dir: str):
        """
        Initialize pattern library

        Args:
            templates_dir: Path to templates directory
        """
        self.templates_dir = Path(templates_dir)
        self.patterns: Dict[str, Dict[str, Any]] = {}
        self.pattern_categories: Dict[str, List[str]] = defaultdict(list)

        self._extract_all_patterns()

    def _extract_all_patterns(self):
        """Extract patterns from all templates"""
        print("=" * 70)
        print("PATTERN LIBRARY - INITIALIZING")
        print("=" * 70)

        template_files = list(self.templates_dir.glob("*.py"))

        print(f"\n📚 Analyzing {len(template_files)} templates for patterns...\n")

        for template_file in template_files:
            try:
                template_code = template_file.read_text()
                tree = ast.parse(template_code)

                # Extract all pattern types
                patterns = self._extract_patterns_from_template(
                    template_file.stem,
                    template_code,
                    tree
                )

                # Categorize patterns
                for pattern_name, pattern_data in patterns.items():
                    category = pattern_data['category']
                    self.patterns[pattern_name] = pattern_data
                    self.pattern_categories[category].append(pattern_name)

            except Exception as e:
                print(f"  ❌ Error extracting patterns from {template_file.name}: {e}")

        print(f"\n✅ Pattern extraction complete:")
        print(f"  - Total patterns: {len(self.patterns)}")
        print(f"  - Categories: {len(self.pattern_categories)}")

        for category, pattern_names in self.pattern_categories.items():
            print(f"    - {category}: {len(pattern_names)} patterns")

    def _extract_patterns_from_template(
        self,
        template_name: str,
        code: str,
        tree: ast.AST
    ) -> Dict[str, Dict[str, Any]]:
        """Extract all patterns from a single template"""
        patterns = {}

        # 1. Grouped endpoint pattern
        grouped_pattern = self._extract_grouped_endpoint_pattern(code)
        if grouped_pattern:
            patterns[f"{template_name}_grouped_endpoint"] = {
                'type': 'grouped_endpoint',
                'category': 'data_fetching',
                'template': template_name,
                'pattern': grouped_pattern,
                'description': 'Polygon grouped API endpoint for market-wide data'
            }

        # 2. Thread pooling pattern
        threading_pattern = self._extract_threading_pattern(code)
        if threading_pattern:
            patterns[f"{template_name}_threading"] = {
                'type': 'thread_pooling',
                'category': 'parallel_processing',
                'template': template_name,
                'pattern': threading_pattern,
                'description': 'ThreadPoolExecutor for parallel data processing'
            }

        # 3. Connection pooling pattern
        connection_pattern = self._extract_connection_pooling_pattern(code)
        if connection_pattern:
            patterns[f"{template_name}_connection_pooling"] = {
                'type': 'connection_pooling',
                'category': 'api_optimization',
                'template': template_name,
                'pattern': connection_pattern,
                'description': 'requests.Session with HTTPAdapter for connection pooling'
            }

        # 4. Smart filtering pattern
        filtering_pattern = self._extract_smart_filtering_pattern(code, tree)
        if filtering_pattern:
            patterns[f"{template_name}_smart_filtering"] = {
                'type': 'smart_filtering',
                'category': 'data_filtering',
                'template': template_name,
                'pattern': filtering_pattern,
                'description': 'Parameter-based filtering on D0 date range'
            }

        # 5. Vectorized computation pattern
        vectorized_pattern = self._extract_vectorized_pattern(code)
        if vectorized_pattern:
            patterns[f"{template_name}_vectorized"] = {
                'type': 'vectorized_operations',
                'category': 'computation',
                'template': template_name,
                'pattern': vectorized_pattern,
                'description': 'Vectorized DataFrame operations using transform()'
            }

        # 6. Column creation pattern
        column_pattern = self._extract_column_creation_pattern(code)
        if column_pattern:
            patterns[f"{template_name}_columns"] = {
                'type': 'column_creation',
                'category': 'data_transformation',
                'template': template_name,
                'pattern': column_pattern,
                'description': 'EdgeDev-standard column naming and creation'
            }

        # 7. Method structure pattern
        method_pattern = self._extract_method_structure_pattern(tree)
        if method_pattern:
            patterns[f"{template_name}_methods"] = {
                'type': 'method_structure',
                'category': 'code_organization',
                'template': template_name,
                'pattern': method_pattern,
                'description': 'Standard method structure for EdgeDev scanners'
            }

        return patterns

    def _extract_grouped_endpoint_pattern(self, code: str) -> Optional[Dict]:
        """Extract grouped endpoint usage pattern"""
        if 'grouped/locale/us/market/stocks' not in code:
            return None

        # Extract the endpoint pattern
        endpoint_match = re.search(
            r'base_url\s*=.*?["\']([^"\']*grouped[^"\']*)["\']',
            code,
            re.DOTALL
        )

        if not endpoint_match:
            return None

        return {
            'endpoint_template': endpoint_match.group(1),
            'method': 'GET',
            'usage': 'Single API call per day for entire market',
            'pattern_example': f'base_url + "{endpoint_match.group(1)}" + date',
            'requires_api_key': True,
            'returns': 'DataFrame with all tickers for given date'
        }

    def _extract_threading_pattern(self, code: str) -> Optional[Dict]:
        """Extract thread pooling pattern"""
        if 'ThreadPoolExecutor' not in code:
            return None

        # Extract worker counts
        stage1_match = re.search(r'stage1_workers\s*=\s*(\d+)', code)
        stage3_match = re.search(r'stage3_workers\s*=\s*(\d+)', code)

        return {
            'executor': 'ThreadPoolExecutor',
            'stage1_workers': int(stage1_match.group(1)) if stage1_match else 5,
            'stage3_workers': int(stage3_match.group(1)) if stage3_match else 10,
            'usage': 'Parallel processing of date-based data fetching',
            'pattern_example': 'with ThreadPoolExecutor(max_workers=workers) as executor:',
            'best_for': 'I/O-bound operations (API calls, file reading)'
        }

    def _extract_connection_pooling_pattern(self, code: str) -> Optional[Dict]:
        """Extract connection pooling pattern"""
        if 'requests.Session()' not in code:
            return None

        session_match = re.search(
            r'self\.session\s*=\s*requests\.Session\(\)',
            code
        )

        if not session_match:
            return None

        # Check for HTTPAdapter
        adapter_match = re.search(
            r'HTTPAdapter\(pool_connections=\d+,\s*pool_maxsize=\d+\)',
            code
        )

        return {
            'session_creation': 'requests.Session()',
            'adapter': 'HTTPAdapter' if adapter_match else None,
            'usage': 'Reuses TCP connections for multiple requests',
            'pattern_example': 'self.session = requests.Session()\n    adapter = HTTPAdapter(pool_connections=10, pool_maxsize=100)\n    self.session.mount("https://", adapter)',
            'benefit': 'Reduces connection overhead for Polygon API'
        }

    def _extract_smart_filtering_pattern(
        self,
        code: str,
        tree: ast.AST
    ) -> Optional[Dict]:
        """Extract smart filtering pattern"""
        if 'apply_smart_filters' not in code:
            return None

        # Find the apply_smart_filters method
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == 'apply_smart_filters':
                # Extract parameter references
                params_used = []
                for param in ['min_price', 'min_volume', 'max_gap', 'min_atr']:
                    if param in code:
                        params_used.append(param)

                return {
                    'method': 'apply_smart_filters',
                    'scope': 'D0 date range only',
                    'based_on': 'scanner parameters',
                    'parameters_checked': params_used,
                    'pattern_example': 'df = df.groupby("ticker").filter(lambda x: len(x) > 0)',
                    'purpose': 'Filter out tickers that dont meet basic criteria on D0'
                }

        return None

    def _extract_vectorized_pattern(self, code: str) -> Optional[Dict]:
        """Extract vectorized operations pattern"""
        if '.transform(' not in code:
            return None

        # Find transform examples
        transform_examples = re.findall(
            r'df\[([^\]]+)\]\s*=\s*df\.groupby\([^\)]+\)\.transform\([^\)]+\)',
            code
        )

        if not transform_examples:
            return None

        return {
            'method': 'groupby().transform()',
            'purpose': 'Vectorized computations across groups',
            'examples': transform_examples[:3],  # First 3 examples
            'pattern_example': "df['Prev_Close'] = df.groupby('ticker')['close'].transform(lambda x: x.shift(1))",
            'avoids': '.iterrows(), .apply() with loops',
            'benefit': '10-100x faster than row-based operations'
        }

    def _extract_column_creation_pattern(self, code: str) -> Optional[Dict]:
        """Extract column creation patterns"""
        # Find common EdgeDev column names
        edge_dev_columns = [
            'Prev_Close', 'Prev_High', 'Prev2_High',
            'EMA_9', 'EMA_20', 'ATR',
            'VOL_AVG', 'ADV20',
            'High_over_EMA9', 'Gap_over_ATR'
        ]

        found_columns = []
        for col in edge_dev_columns:
            if f"'{col}'" in code or f'"{col}"' in code:
                found_columns.append(col)

        if not found_columns:
            return None

        return {
            'naming_convention': 'PascalCase_with_underscores',
            'examples': found_columns,
            'categories': {
                'previous_data': [c for c in found_columns if 'Prev' in c],
                'indicators': [c for c in found_columns if c in ['EMA_9', 'EMA_20', 'ATR']],
                'metrics': [c for c in found_columns if 'over' in c or '_div_' in c]
            },
            'pattern_example': "df['Prev_Close'] = df.groupby('ticker')['close'].transform(lambda x: x.shift(1))",
            'standard': 'All column names must follow EdgeDev conventions'
        }

    def _extract_method_structure_pattern(self, tree: ast.AST) -> Optional[Dict]:
        """Extract method structure pattern"""
        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]

        if not classes:
            return None

        main_class = classes[0]
        methods = [node.name for node in main_class.body if isinstance(node, ast.FunctionDef)]

        required_methods = [
            'get_trading_dates',
            'fetch_all_grouped_data',
            'apply_smart_filters',
            'detect_patterns',
            'execute'
        ]

        has_required = [m for m in required_methods if m in methods]

        return {
            'required_methods': required_methods,
            'found_methods': methods,
            'coverage': f"{len(has_required)}/{len(required_methods)} required methods present",
            'structure': '3-stage: grouped fetch → smart filters → full features',
            'pattern_example': 'def execute(self):\n    # Stage 1: Grouped data fetch\n    df = self.fetch_all_grouped_data()\n    # Stage 2: Smart filters\n    df = self.apply_smart_filters(df)\n    # Stage 3: Full features\n    df = self.compute_full_features(df)'
        }

    def get_patterns_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get all patterns in a category"""
        pattern_names = self.pattern_categories.get(category, [])
        return [self.patterns[name] for name in pattern_names]

    def get_pattern_by_type(self, pattern_type: str) -> List[Dict[str, Any]]:
        """Get all patterns of a specific type"""
        return [
            pattern for pattern in self.patterns.values()
            if pattern['type'] == pattern_type
        ]

    def find_applicable_patterns(self, user_code: str) -> Dict[str, List[Dict]]:
        """
        Find patterns that should be applied to user code

        Returns dict with:
        - 'missing': Patterns not present in user code
        - 'present': Patterns already in user code
        """
        applicable_patterns = {
            'missing': [],
            'present': []
        }

        # Check each mandatory pattern type
        mandatory_types = [
            'grouped_endpoint',
            'thread_pooling',
            'connection_pooling',
            'smart_filtering',
            'vectorized_operations'
        ]

        for pattern_type in mandatory_types:
            patterns = self.get_pattern_by_type(pattern_type)

            if not patterns:
                continue

            # Check if user code has this pattern
            has_pattern = self._code_has_pattern(user_code, pattern_type)

            if has_pattern:
                applicable_patterns['present'].extend(patterns)
            else:
                applicable_patterns['missing'].extend(patterns)

        return applicable_patterns

    def _code_has_pattern(self, code: str, pattern_type: str) -> bool:
        """Check if code contains a specific pattern type"""
        pattern_indicators = {
            'grouped_endpoint': 'grouped/locale/us/market/stocks',
            'thread_pooling': 'ThreadPoolExecutor',
            'connection_pooling': 'requests.Session()',
            'smart_filtering': 'apply_smart_filters',
            'vectorized_operations': '.transform('
        }

        indicator = pattern_indicators.get(pattern_type)
        return indicator in code if indicator else False

    def get_pattern_implementation_guide(self, pattern_type: str) -> Optional[str]:
        """
        Get implementation guide for a pattern type

        Returns formatted guide with code examples
        """
        patterns = self.get_pattern_by_type(pattern_type)

        if not patterns:
            return None

        # Use first pattern as example
        pattern = patterns[0]

        guide = f"""
# {pattern['type'].replace('_', ' ').title()} Pattern

**Category**: {pattern['category']}
**Description**: {pattern['description']}

## Implementation

```python
{pattern.get('pattern_example', '# See pattern details')}
```

## Purpose
{pattern.get('usage', pattern.get('purpose', 'Standard EdgeDev pattern'))}

## Benefits
"""

        # Add benefits based on pattern type
        benefits = {
            'grouped_endpoint': '- Single API call per day vs 3000+ calls\n- Faster execution\n- Lower API costs',
            'thread_pooling': '- Parallel processing\n- 5-10x speed improvement\n- Better resource utilization',
            'connection_pooling': '- Reuses TCP connections\n- Reduces latency\n- Better throughput',
            'smart_filtering': '- Early filtering reduces computation\n- Parameter-based validation\n- Scanner-specific logic',
            'vectorized_operations': '- 10-100x faster than loops\n- Memory efficient\n- Pandas best practice'
        }

        guide += benefits.get(pattern_type, '- Standardized implementation\n- Consistent behavior\n- Maintainable code')

        return guide


# Test the pattern library
if __name__ == "__main__":
    # Get templates directory (relative to this file)
    current_dir = Path(__file__).parent
    templates_dir = current_dir.parent.parent / "templates"

    library = PatternLibrary(str(templates_dir))

    print("\n" + "=" * 70)
    print("PATTERN CATEGORIES")
    print("=" * 70)

    for category, pattern_names in library.pattern_categories.items():
        print(f"\n{category}:")
        for pattern_name in pattern_names:
            pattern = library.patterns[pattern_name]
            print(f"  - {pattern['type']} (from {pattern['template']})")

    print("\n" + "=" * 70)
    print("IMPLEMENTATION GUIDE: vectorized_operations")
    print("=" * 70)

    guide = library.get_pattern_implementation_guide('vectorized_operations')
    print(guide)

    print("\n" + "=" * 70)
    print("TEST: Find applicable patterns for user code")
    print("=" * 70)

    test_code = """
def execute(self):
    # Simple implementation without threading
    df = self.fetch_data()

    # No smart filters
    df['close'] = df['close'] * 1.1
"""

    applicable = library.find_applicable_patterns(test_code)

    print(f"\nMissing patterns: {len(applicable['missing'])}")
    for pattern in applicable['missing']:
        print(f"  - {pattern['type']}")

    print(f"\nPresent patterns: {len(applicable['present'])}")
    for pattern in applicable['present']:
        print(f"  - {pattern['type']}")
