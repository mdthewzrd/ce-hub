"""
Parameter Extractor - Extract and Validate Scanner Parameters

This module:
1. Extracts all parameters from scanner code
2. Identifies parameter types and constraints
3. Validates parameter values
4. Generates parameter documentation
"""

import ast
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ParameterType(Enum):
    """Parameter types"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    LIST = "list"
    DICT = "dict"
    DATE = "date"
    UNKNOWN = "unknown"


@dataclass
class Parameter:
    """Extracted parameter"""
    name: str
    param_type: ParameterType
    default_value: Any
    description: Optional[str]
    required: bool
    constraints: Dict[str, Any]
    source: str  # '__init__', 'self.params', etc.


@dataclass
class ParameterExtractionResult:
    """Complete parameter extraction result"""
    parameters: Dict[str, Parameter]
    init_params: List[str]
    scanner_params: Dict[str, Any]
    validation_results: Dict[str, Any]
    metadata: Dict[str, Any]


class ParameterExtractor:
    """
    Extract and validate scanner parameters

    Extracts from:
    - __init__ method parameters
    - self.params dictionary
    - Default values
    - Docstrings
    """

    def __init__(self):
        """Initialize parameter extractor"""
        # Common scanner parameter definitions
        self.parameter_definitions = {
            # Price parameters
            'min_price': {
                'type': ParameterType.FLOAT,
                'default': 5.0,
                'min': 0.01,
                'max': 10000.0,
                'description': 'Minimum share price'
            },
            'max_price': {
                'type': ParameterType.FLOAT,
                'default': 1000.0,
                'min': 0.01,
                'max': 10000.0,
                'description': 'Maximum share price'
            },

            # Volume parameters
            'min_volume': {
                'type': ParameterType.INTEGER,
                'default': 1000000,
                'min': 0,
                'description': 'Minimum trading volume'
            },
            'max_volume': {
                'type': ParameterType.INTEGER,
                'default': 1000000000,
                'min': 0,
                'description': 'Maximum trading volume'
            },

            # Gap parameters
            'min_gap': {
                'type': ParameterType.FLOAT,
                'default': 0.03,
                'min': 0.0,
                'max': 1.0,
                'description': 'Minimum gap percentage (as decimal, e.g., 0.03 = 3%)'
            },
            'max_gap': {
                'type': ParameterType.FLOAT,
                'default': 0.50,
                'min': 0.0,
                'max': 1.0,
                'description': 'Maximum gap percentage'
            },

            # ATR parameters
            'min_atr': {
                'type': ParameterType.FLOAT,
                'default': 0.5,
                'min': 0.0,
                'description': 'Minimum ATR value'
            },
            'max_atr': {
                'type': ParameterType.FLOAT,
                'default': 10.0,
                'min': 0.0,
                'description': 'Maximum ATR value'
            },

            # Lookback parameters
            'lookback_period': {
                'type': ParameterType.INTEGER,
                'default': 20,
                'min': 1,
                'max': 252,
                'description': 'Lookback period in trading days'
            },

            # EMA parameters
            'ema_short': {
                'type': ParameterType.INTEGER,
                'default': 9,
                'min': 1,
                'max': 50,
                'description': 'Short EMA period'
            },
            'ema_long': {
                'type': ParameterType.INTEGER,
                'default': 20,
                'min': 1,
                'max': 200,
                'description': 'Long EMA period'
            },

            # Bollinger Band parameters
            'bb_period': {
                'type': ParameterType.INTEGER,
                'default': 20,
                'min': 5,
                'max': 50,
                'description': 'Bollinger Band period'
            },
            'bb_std': {
                'type': ParameterType.FLOAT,
                'default': 2.0,
                'min': 0.5,
                'max': 4.0,
                'description': 'Bollinger Band standard deviations'
            },
            'bb_width': {
                'type': ParameterType.FLOAT,
                'default': 2.0,
                'min': 0.1,
                'max': 10.0,
                'description': 'Bollinger Band width multiplier'
            },

            # Date range parameters
            'd0_start': {
                'type': ParameterType.DATE,
                'required': True,
                'description': 'D0 start date (YYYY-MM-DD)'
            },
            'd0_end': {
                'type': ParameterType.DATE,
                'required': True,
                'description': 'D0 end date (YYYY-MM-DD)'
            },

            # API key
            'api_key': {
                'type': ParameterType.STRING,
                'required': True,
                'description': 'Polygon API key'
            }
        }

    def extract_parameters(self, code: str) -> ParameterExtractionResult:
        """
        Extract all parameters from code

        Args:
            code: Python code string

        Returns:
            ParameterExtractionResult
        """
        try:
            tree = ast.parse(code)
        except:
            return ParameterExtractionResult(
                parameters={},
                init_params=[],
                scanner_params={},
                validation_results={'valid': False, 'errors': ['Syntax error']},
                metadata={'error': 'Cannot parse code'}
            )

        # Extract parameters from different sources
        init_params = self._extract_init_params(tree)
        scanner_params = self._extract_scanner_params(code, tree)
        docstring_params = self._extract_docstring_params(tree)

        # Merge all parameters
        all_params = {}
        for param_name in set(list(init_params.keys()) + list(scanner_params.keys()) + list(docstring_params.keys())):
            # Prefer init params, then scanner params, then docstring
            if param_name in init_params:
                all_params[param_name] = self._create_parameter(
                    param_name,
                    init_params[param_name],
                    '__init__',
                    docstring_params.get(param_name)
                )
            elif param_name in scanner_params:
                all_params[param_name] = self._create_parameter(
                    param_name,
                    scanner_params[param_name],
                    'self.params',
                    docstring_params.get(param_name)
                )
            elif param_name in docstring_params:
                all_params[param_name] = self._create_parameter(
                    param_name,
                    docstring_params[param_name],
                    'docstring',
                    docstring_params[param_name]
                )

        # Validate parameters
        validation_results = self._validate_parameters(all_params)

        # Generate metadata
        metadata = {
            'total_parameters': len(all_params),
            'required_parameters': sum(1 for p in all_params.values() if p.required),
            'parameter_types': self._count_parameter_types(all_params),
            'has_date_range': 'd0_start' in all_params and 'd0_end' in all_params,
            'has_api_key': 'api_key' in all_params
        }

        return ParameterExtractionResult(
            parameters=all_params,
            init_params=list(init_params.keys()),
            scanner_params=scanner_params,
            validation_results=validation_results,
            metadata=metadata
        )

    def _extract_init_params(self, tree: ast.AST) -> Dict[str, Any]:
        """Extract __init__ parameters"""
        params = {}

        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        if not classes:
            return params

        main_class = classes[0]

        # Find __init__ method
        for node in main_class.body:
            if isinstance(node, ast.FunctionDef) and node.name == '__init__':
                # Extract parameters (skip 'self')
                for i, arg in enumerate(node.args.args[1:], 1):  # Start at 1 to skip 'self'
                    param_name = arg.arg

                    # Check for default value
                    default = None
                    defaults_offset = len(node.args.args) - len(node.args.defaults)
                    default_index = i - 1 - defaults_offset

                    if default_index >= 0 and default_index < len(node.args.defaults):
                        try:
                            default = ast.literal_eval(node.args.defaults[default_index])
                        except:
                            default = None

                    params[param_name] = default

                break

        return params

    def _extract_scanner_params(self, code: str, tree: ast.AST) -> Dict[str, Any]:
        """Extract self.params dictionary"""
        params = {}

        # Look for self.params = {...}
        params_match = re.search(
            r'self\.params\s*=\s*\{([^}]+)\}',
            code,
            re.DOTALL
        )

        if params_match:
            params_dict_str = '{' + params_match.group(1) + '}'
            try:
                # Try to evaluate as Python literal
                params = ast.literal_eval(params_dict_str)
            except:
                # If that fails, try to extract key-value pairs manually
                kv_pairs = re.findall(r"['\"]([^'\"]+)['\"]:\s*([^,}]+)", params_dict_str)
                for key, value in kv_pairs:
                    try:
                        params[key] = ast.literal_eval(value.strip())
                    except:
                        params[key] = value.strip()

        return params

    def _extract_docstring_params(self, tree: ast.AST) -> Dict[str, str]:
        """Extract parameter descriptions from docstrings"""
        params = {}

        classes = [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        if not classes:
            return params

        main_class = classes[0]
        class_docstring = ast.get_docstring(main_class)

        if not class_docstring:
            return params

        # Look for parameter documentation patterns
        # Pattern: :param param_name: description
        param_docs = re.findall(r':param\s+(\w+):\s*(.*?)(?=:param|\:return|\:type|$)', class_docstring, re.DOTALL)
        for param_name, description in param_docs:
            params[param_name] = description.strip()

        # Also look for Args: section in docstring
        args_match = re.search(r'Args:\s*\n((?:\s+\w+.*?\n)+)', class_docstring)
        if args_match:
            args_text = args_match.group(1)
            arg_lines = re.findall(r'\s+(\w+):\s*(.*?)(?=\n)', args_text)
            for param_name, description in arg_lines:
                params[param_name] = description.strip()

        return params

    def _create_parameter(
        self,
        name: str,
        value: Any,
        source: str,
        description: Optional[str] = None
    ) -> Parameter:
        """Create Parameter object"""
        # Determine type
        if value is None:
            param_type = ParameterType.UNKNOWN
        elif isinstance(value, bool):
            param_type = ParameterType.BOOLEAN
        elif isinstance(value, int):
            param_type = ParameterType.INTEGER
        elif isinstance(value, float):
            param_type = ParameterType.FLOAT
        elif isinstance(value, str):
            param_type = ParameterType.STRING
        elif isinstance(value, list):
            param_type = ParameterType.LIST
        elif isinstance(value, dict):
            param_type = ParameterType.DICT
        else:
            param_type = ParameterType.UNKNOWN

        # Get constraints from definition
        constraints = {}
        if name in self.parameter_definitions:
            defn = self.parameter_definitions[name]
            constraints = {k: v for k, v in defn.items() if k not in ['type', 'description', 'default']}

        # Check if required
        required = False
        if name in self.parameter_definitions:
            required = self.parameter_definitions[name].get('required', False)

        return Parameter(
            name=name,
            param_type=param_type,
            default_value=value,
            description=description,
            required=required,
            constraints=constraints,
            source=source
        )

    def _validate_parameters(self, parameters: Dict[str, Parameter]) -> Dict[str, Any]:
        """Validate extracted parameters"""
        results = {
            'valid': True,
            'errors': [],
            'warnings': []
        }

        for param_name, param in parameters.items():
            # Check if parameter has a definition
            if param_name in self.parameter_definitions:
                defn = self.parameter_definitions[param_name]

                # Check type match
                expected_type = defn.get('type')
                if expected_type and expected_type != param.param_type:
                    # Allow integer for float type
                    if not (expected_type == ParameterType.FLOAT and param.param_type == ParameterType.INTEGER):
                        results['warnings'].append(
                            f"{param_name}: Expected type {expected_type.value}, got {param.param_type.value}"
                        )

                # Check constraints
                if 'min' in defn and param.default_value is not None:
                    if param.default_value < defn['min']:
                        results['errors'].append(
                            f"{param_name}: Value {param.default_value} below minimum {defn['min']}"
                        )
                        results['valid'] = False

                if 'max' in defn and param.default_value is not None:
                    if param.default_value > defn['max']:
                        results['errors'].append(
                            f"{param_name}: Value {param.default_value} above maximum {defn['max']}"
                        )
                        results['valid'] = False

        return results

    def _count_parameter_types(self, parameters: Dict[str, Parameter]) -> Dict[str, int]:
        """Count parameters by type"""
        type_counts = {}
        for param in parameters.values():
            type_name = param.param_type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        return type_counts

    def generate_parameter_documentation(self, result: ParameterExtractionResult) -> str:
        """Generate parameter documentation"""
        lines = []
        lines.append("=" * 70)
        lines.append("PARAMETER EXTRACTION REPORT")
        lines.append("=" * 70)

        lines.append(f"\n📊 Total Parameters: {result.metadata['total_parameters']}")
        lines.append(f"✅ Required: {result.metadata['required_parameters']}")
        lines.append(f"📋 Optional: {result.metadata['total_parameters'] - result.metadata['required_parameters']}")

        if result.parameters:
            lines.append("\n📋 Parameters:")
            for param_name, param in sorted(result.parameters.items()):
                req_str = "REQUIRED" if param.required else "optional"
                default_str = f" (default: {param.default_value})" if param.default_value is not None else ""
                desc_str = f" - {param.description}" if param.description else ""
                lines.append(f"  • {param_name} ({param.param_type.value}, {req_str}){default_str}{desc_str}")

        if result.validation_results.get('errors'):
            lines.append("\n❌ Validation Errors:")
            for error in result.validation_results['errors']:
                lines.append(f"  • {error}")

        if result.validation_results.get('warnings'):
            lines.append("\n⚠️  Validation Warnings:")
            for warning in result.validation_results['warnings']:
                lines.append(f"  • {warning}")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the parameter extractor
if __name__ == "__main__":
    extractor = ParameterExtractor()

    print("Testing ParameterExtractor...\n")

    test_code = """
class BacksideBScanner:
    def __init__(self, api_key, d0_start, d0_end, min_price=5.0, min_volume=1000000, bb_width=2.0):
        '''
        Backside B scanner

        Args:
            api_key: Polygon API key
            d0_start: Start date for D0 range
            d0_end: End date for D0 range
            min_price: Minimum share price
            min_volume: Minimum trading volume
            bb_width: Bollinger Band width multiplier
        '''
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end
        self.min_price = min_price
        self.min_volume = min_volume
        self.bb_width = bb_width

        self.params = {
            'min_price': min_price,
            'min_volume': min_volume,
            'bb_width': bb_width
        }

    def execute(self):
        return pd.DataFrame()
"""

    result = extractor.extract_parameters(test_code)
    print(extractor.generate_parameter_documentation(result))
