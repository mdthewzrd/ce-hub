"""
Enhanced AST-Based Parameter Discovery Engine
============================================

This module provides comprehensive parameter extraction using Abstract Syntax Tree (AST) analysis
combined with intelligent pattern recognition to identify complex trading scanner parameters.

Key Features:
- Full AST parsing for comprehensive code understanding
- Complex Boolean condition extraction: (atr_mult >= 2) & (atr_mult < 3)
- Array value detection: [20, 18, 15, 12]
- Conditional expression parsing in np.select, np.where patterns
- Scanner-type specific intelligence with confidence scoring
- Human-readable parameter descriptions with usage context

This addresses the critical gaps in parameter extraction accuracy identified in testing.
"""

import ast
import re
import logging
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

@dataclass
class ExtractedParameter:
    """Enhanced parameter representation with detailed metadata"""
    name: str
    value: Any
    type: str  # 'threshold', 'filter', 'array', 'condition', 'config'
    confidence: float
    line: int
    context: str
    suggested_description: str = ""
    extraction_method: str = ""  # 'ast', 'regex', 'hybrid'
    complexity_level: str = ""  # 'simple', 'complex', 'advanced'
    user_confirmed: bool = False
    user_edited: bool = False

@dataclass
class ParameterExtractionResult:
    """Enhanced extraction result with detailed analytics"""
    success: bool
    parameters: List[ExtractedParameter]
    scanner_type: str
    confidence_score: float
    analysis_time: float
    extraction_methods_used: List[str]
    complexity_analysis: Dict[str, int]
    suggestions: List[str]
    missed_patterns: List[str] = None

class EnhancedASTParameterExtractor:
    """
    Advanced AST-based parameter extraction system that identifies complex trading parameters
    with high accuracy using both AST analysis and intelligent pattern matching.
    """

    def __init__(self):
        """Initialize the enhanced parameter extractor with comprehensive patterns"""

        # Trading-specific parameter patterns with enhanced detection
        self.trading_patterns = {
            'atr_mult': {
                'ast_patterns': ['atr_mult', 'high_chg_atr1'],
                'regex_patterns': [
                    r'atr_mult\s*[>=<]+\s*([0-9.]+)',
                    r'high_chg_atr1.*[>=<]+\s*([0-9.]+)',
                    r'(\w*atr\w*)\s*[>=<]+\s*([0-9.]+)'
                ],
                'type': 'threshold',
                'description': 'ATR (Average True Range) multiplier for volatility-based filtering',
                'complexity': 'complex'
            },
            'score_arrays': {
                'ast_patterns': ['score_atr', 'score_volume', 'score_momentum'],
                'regex_patterns': [
                    r'\[\s*([0-9.]+(?:\s*,\s*[0-9.]+)*)\s*\]',
                    r'(\[(?:\s*[0-9.]+\s*,?\s*)+\])'
                ],
                'type': 'array',
                'description': 'Scoring arrays for weighted parameter evaluation',
                'complexity': 'advanced'
            },
            'boolean_conditions': {
                'ast_patterns': ['np.select', 'np.where'],
                'regex_patterns': [
                    r'\(\s*(\w+)\s*([>=<]+)\s*([0-9.]+)\s*\)\s*&\s*\(\s*(\w+)\s*([>=<]+)\s*([0-9.]+)\s*\)',
                    r'(\w+)\s*([>=<]+)\s*([0-9.]+)(?:\s*[&|]\s*\w+\s*[>=<]+\s*[0-9.]+)*'
                ],
                'type': 'condition',
                'description': 'Complex Boolean conditions for multi-criteria filtering',
                'complexity': 'advanced'
            },
            'default_values': {
                'ast_patterns': ['default'],
                'regex_patterns': [
                    r'default\s*=\s*([0-9.]+)',
                    r'default=([0-9.]+)'
                ],
                'type': 'config',
                'description': 'Default fallback values for conditional scoring',
                'complexity': 'simple'
            },
            # 🔧 ENHANCED: Infrastructure component patterns
            'api_keys': {
                'ast_patterns': ['API_KEY', 'POLYGON_API_KEY', 'api_key', 'apikey', 'token'],
                'regex_patterns': [
                    r'API_KEY\s*=\s*["\']([^"\']+)["\']',
                    r'POLYGON_API_KEY\s*=\s*["\']([^"\']+)["\']',
                    r'api_key\s*=\s*["\']([^"\']+)["\']',
                    r'apikey\s*:\s*["\']([^"\']+)["\']'
                ],
                'type': 'infrastructure',
                'description': 'API keys for external data services (Polygon, Alpha Vantage, etc.)',
                'complexity': 'simple',
                'priority': 'critical'
            },
            'base_urls': {
                'ast_patterns': ['BASE_URL', 'base_url', 'API_URL', 'endpoint'],
                'regex_patterns': [
                    r'BASE_URL\s*=\s*["\']([^"\']+)["\']',
                    r'base_url\s*=\s*["\']([^"\']+)["\']',
                    r'API_URL\s*=\s*["\']([^"\']+)["\']',
                    r'endpoint\s*=\s*["\']([^"\']+)["\']'
                ],
                'type': 'infrastructure',
                'description': 'Base URLs for API endpoints and data sources',
                'complexity': 'simple',
                'priority': 'critical'
            },
            'threading_config': {
                'ast_patterns': ['MAX_WORKERS', 'max_workers', 'ThreadPoolExecutor', 'workers'],
                'regex_patterns': [
                    r'MAX_WORKERS\s*=\s*([0-9]+)',
                    r'max_workers\s*=\s*([0-9]+)',
                    r'ThreadPoolExecutor\s*\(\s*max_workers\s*=\s*([0-9]+)',
                    r'workers\s*=\s*([0-9]+)'
                ],
                'type': 'infrastructure',
                'description': 'Threading configuration for parallel processing',
                'complexity': 'simple',
                'priority': 'high'
            },
            'symbol_lists': {
                'ast_patterns': ['SYMBOLS', 'TICKERS', 'symbols', 'tickers', 'stock_list'],
                'regex_patterns': [
                    r'SYMBOLS\s*=\s*\[(.*?)\]',
                    r'TICKERS\s*=\s*\[(.*?)\]',
                    r'symbols\s*=\s*\[(.*?)\]',
                    r'stock_list\s*=\s*\[(.*?)\]'
                ],
                'type': 'infrastructure',
                'description': 'Symbol/ticker lists for scanning universe',
                'complexity': 'simple',
                'priority': 'high'
            },
            'date_config': {
                'ast_patterns': ['DATE', 'start_date', 'end_date', 'PRINT_FROM', 'PRINT_TO'],
                'regex_patterns': [
                    r'DATE\s*=\s*["\']([^"\']+)["\']',
                    r'start_date\s*=\s*["\']([^"\']+)["\']',
                    r'end_date\s*=\s*["\']([^"\']+)["\']',
                    r'PRINT_FROM\s*=\s*["\']([^"\']+)["\']',
                    r'PRINT_TO\s*=\s*([^"\']+)'
                ],
                'type': 'infrastructure',
                'description': 'Date range configuration for data fetching',
                'complexity': 'simple',
                'priority': 'medium'
            }
        }

        # Scanner type detection patterns
        self.scanner_indicators = {
            'lc_d2_scanner': {
                'primary': ['lc_d2', 'late_continuation', 'lc d2'],
                'secondary': ['atr_mult', 'score_atr', 'high_chg_atr1'],
                'confidence_boost': 0.3
            },
            'a_plus_scanner': {
                'primary': ['atr_mult', 'parabolic', 'daily_parabolic'],
                'secondary': ['slope3d', 'momentum'],
                'confidence_boost': 0.25
            },
            'sophisticated_async_scanner': {
                'primary': ['async def main', 'asyncio.run', 'aiohttp'],
                'secondary': ['concurrent.futures', 'ThreadPoolExecutor'],
                'confidence_boost': 0.2
            }
        }

        # AST node type handlers
        self.ast_handlers = {
            ast.Assign: self._handle_assignment,
            ast.Call: self._handle_function_call,
            ast.Compare: self._handle_comparison,
            ast.BoolOp: self._handle_boolean_operation,
            ast.List: self._handle_list,
            ast.Dict: self._handle_dict
        }

    def extract_parameters(self, code: str) -> ParameterExtractionResult:
        """
        Extract parameters using comprehensive AST + regex analysis
        """
        start_time = datetime.now()

        try:
            logger.info(f"🚀 Starting enhanced parameter extraction on {len(code)} characters")

            # Initialize extraction tracking
            parameters = []
            extraction_methods = []
            complexity_analysis = {'simple': 0, 'complex': 0, 'advanced': 0}
            missed_patterns = []

            # Phase 1: AST-based extraction
            try:
                ast_params = self._extract_with_ast(code)
                parameters.extend(ast_params)
                extraction_methods.append('ast')
                logger.info(f"📊 AST extraction found {len(ast_params)} parameters")
            except Exception as e:
                logger.warning(f"⚠️ AST extraction failed: {e}")
                missed_patterns.append(f"AST parsing error: {str(e)}")

            # Phase 2: Enhanced regex extraction for complex patterns
            regex_params = self._extract_with_enhanced_regex(code)
            parameters.extend(regex_params)
            extraction_methods.append('enhanced_regex')
            logger.info(f"🔍 Enhanced regex found {len(regex_params)} additional parameters")

            # Phase 3: Hybrid pattern matching for edge cases
            hybrid_params = self._extract_hybrid_patterns(code)
            parameters.extend(hybrid_params)
            extraction_methods.append('hybrid')
            logger.info(f"🔧 Hybrid extraction found {len(hybrid_params)} edge case parameters")

            # Deduplicate and enhance parameters
            unique_parameters = self._deduplicate_and_enhance(parameters)

            # Update complexity analysis
            for param in unique_parameters:
                complexity_analysis[param.complexity_level] += 1

            # Detect scanner type with enhanced intelligence
            scanner_type = self._detect_scanner_type_enhanced(code, unique_parameters)

            # Calculate confidence score
            confidence_score = self._calculate_enhanced_confidence(unique_parameters, scanner_type)

            # Generate intelligent suggestions
            suggestions = self._generate_enhanced_suggestions(unique_parameters, scanner_type, missed_patterns)

            analysis_time = (datetime.now() - start_time).total_seconds()

            logger.info(f"✅ Enhanced extraction complete: {len(unique_parameters)} total parameters")
            logger.info(f"📈 Scanner: {scanner_type}, Confidence: {confidence_score:.2f}")
            logger.info(f"🎯 Complexity breakdown: {complexity_analysis}")

            return ParameterExtractionResult(
                success=True,
                parameters=unique_parameters,
                scanner_type=scanner_type,
                confidence_score=confidence_score,
                analysis_time=analysis_time,
                extraction_methods_used=extraction_methods,
                complexity_analysis=complexity_analysis,
                suggestions=suggestions,
                missed_patterns=missed_patterns
            )

        except Exception as e:
            logger.error(f"❌ Enhanced parameter extraction failed: {e}")
            analysis_time = (datetime.now() - start_time).total_seconds()

            return ParameterExtractionResult(
                success=False,
                parameters=[],
                scanner_type='unknown',
                confidence_score=0.0,
                analysis_time=analysis_time,
                extraction_methods_used=[],
                complexity_analysis={'simple': 0, 'complex': 0, 'advanced': 0},
                suggestions=[f"Extraction failed: {str(e)}"],
                missed_patterns=[str(e)]
            )

    def _extract_with_ast(self, code: str) -> List[ExtractedParameter]:
        """Extract parameters using AST analysis"""
        parameters = []

        try:
            # Parse code into AST
            tree = ast.parse(code)

            # Walk through all nodes
            for node in ast.walk(tree):
                node_type = type(node)
                if node_type in self.ast_handlers:
                    handler_params = self.ast_handlers[node_type](node, code)
                    parameters.extend(handler_params)

            return parameters

        except SyntaxError as e:
            logger.warning(f"⚠️ AST parsing failed due to syntax error: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ AST extraction error: {e}")
            return []

    def _handle_assignment(self, node: ast.Assign, code: str) -> List[ExtractedParameter]:
        """Handle assignment nodes in AST"""
        parameters = []

        try:
            for target in node.targets:
                if isinstance(target, ast.Name):
                    var_name = target.id

                    # Check if this is a trading parameter
                    if self._is_trading_parameter(var_name):
                        value = self._extract_value_from_node(node.value)
                        line_num = node.lineno
                        context = self._get_line_context(code, line_num)

                        parameters.append(ExtractedParameter(
                            name=var_name,
                            value=value,
                            type=self._determine_parameter_type(var_name, value),
                            confidence=0.8,
                            line=line_num,
                            context=context,
                            extraction_method='ast',
                            complexity_level='simple'
                        ))

        except Exception as e:
            logger.debug(f"Assignment handling error: {e}")

        return parameters

    def _handle_function_call(self, node: ast.Call, code: str) -> List[ExtractedParameter]:
        """Handle function call nodes (np.select, np.where, etc.)"""
        parameters = []

        try:
            # Check for np.select calls
            if (isinstance(node.func, ast.Attribute) and
                isinstance(node.func.value, ast.Name) and
                node.func.value.id == 'np' and
                node.func.attr == 'select'):

                # Extract conditions and values from np.select
                select_params = self._extract_np_select_parameters(node, code)
                parameters.extend(select_params)

        except Exception as e:
            logger.debug(f"Function call handling error: {e}")

        return parameters

    def _handle_comparison(self, node: ast.Compare, code: str) -> List[ExtractedParameter]:
        """Handle comparison nodes for threshold detection"""
        parameters = []

        try:
            # Extract comparison parameters
            if isinstance(node.left, ast.Name):
                var_name = node.left.id

                for i, comparator in enumerate(node.comparators):
                    if isinstance(comparator, ast.Constant):
                        value = comparator.value
                        operator = node.ops[i]

                        if self._is_trading_parameter(var_name):
                            line_num = node.lineno
                            context = self._get_line_context(code, line_num)

                            parameters.append(ExtractedParameter(
                                name=f"{var_name}_threshold",
                                value=value,
                                type='threshold',
                                confidence=0.7,
                                line=line_num,
                                context=context,
                                extraction_method='ast',
                                complexity_level='complex',
                                suggested_description=f"Threshold value for {var_name} comparison"
                            ))

        except Exception as e:
            logger.debug(f"Comparison handling error: {e}")

        return parameters

    def _handle_boolean_operation(self, node: ast.BoolOp, code: str) -> List[ExtractedParameter]:
        """Handle boolean operations for complex conditions"""
        parameters = []

        try:
            # Extract parameters from boolean combinations
            for value in node.values:
                if isinstance(value, ast.Compare):
                    comp_params = self._handle_comparison(value, code)
                    for param in comp_params:
                        param.complexity_level = 'advanced'
                        param.suggested_description = f"Complex condition parameter: {param.name}"
                    parameters.extend(comp_params)

        except Exception as e:
            logger.debug(f"Boolean operation handling error: {e}")

        return parameters

    def _handle_list(self, node: ast.List, code: str) -> List[ExtractedParameter]:
        """Handle list nodes for array parameters - excludes scoring/symbol arrays"""
        parameters = []

        try:
            # Extract list values
            values = []
            for elt in node.elts:
                if isinstance(elt, ast.Constant):
                    values.append(elt.value)

            # Skip arrays that are likely symbol lists or scoring arrays
            if values and len(values) > 1:
                # Check if this is a symbol/scoring array (contains strings or many elements)
                has_strings = any(isinstance(v, str) for v in values)
                is_large_array = len(values) > 10  # Symbol lists are typically large

                # Skip symbol lists and large scoring arrays
                if has_strings or is_large_array:
                    return parameters

                # Only extract small numeric arrays that might be actual trading parameters
                line_num = node.lineno
                context = self._get_line_context(code, line_num)

                parameters.append(ExtractedParameter(
                    name="trading_array",
                    value=values,
                    type='array',
                    confidence=0.8,
                    line=line_num,
                    context=context,
                    extraction_method='ast',
                    complexity_level='advanced',
                    suggested_description=f"Trading parameter array: {values}"
                ))

        except Exception as e:
            logger.debug(f"List handling error: {e}")

        return parameters

    def _handle_dict(self, node: ast.Dict, code: str) -> List[ExtractedParameter]:
        """Handle dictionary nodes for config parameters"""
        parameters = []

        try:
            # Extract dictionary key-value pairs
            for key, value in zip(node.keys, node.values):
                if isinstance(key, ast.Constant) and isinstance(value, ast.Constant):
                    param_name = str(key.value)
                    param_value = value.value

                    if self._is_trading_parameter(param_name):
                        line_num = node.lineno
                        context = self._get_line_context(code, line_num)

                        parameters.append(ExtractedParameter(
                            name=param_name,
                            value=param_value,
                            type='config',
                            confidence=0.8,
                            line=line_num,
                            context=context,
                            extraction_method='ast',
                            complexity_level='simple'
                        ))

        except Exception as e:
            logger.debug(f"Dictionary handling error: {e}")

        return parameters

    def _extract_with_enhanced_regex(self, code: str) -> List[ExtractedParameter]:
        """Extract parameters using enhanced regex patterns"""
        parameters = []
        lines = code.split('\n')

        # Enhanced regex patterns focused on actual trading logic
        enhanced_patterns = [
            {
                'name': 'complex_conditions',
                'pattern': r'\(\s*(\w+)\s*([>=<]+)\s*([0-9.]+)\s*\)\s*&\s*\(\s*(\w+)\s*([>=<]+)\s*([0-9.]+)\s*\)',
                'type': 'condition',
                'complexity': 'advanced'
            },
            {
                'name': 'trading_thresholds',
                'pattern': r'(high_pct_chg1?|atr_mult|ema_dev|gap_pct|gap_atr1?|rvol1?|dol_v1?|volume|close_range1?)\s*([>=<]+)\s*([0-9.]+)',
                'type': 'threshold',
                'complexity': 'complex'
            },
            {
                'name': 'dataframe_conditions',
                'pattern': r"df\['(\w+)'\]\s*([>=<]+)\s*([0-9.]+)",
                'type': 'threshold',
                'complexity': 'complex'
            },
            {
                'name': 'price_volume_thresholds',
                'pattern': r'\(\s*(c_ua1?|v_ua1?|dol_v1?)\s*([>=<]+)\s*([0-9.]+)\s*\)',
                'type': 'filter',
                'complexity': 'complex'
            },
            {
                'name': 'default_values',
                'pattern': r'default\s*=\s*([0-9.]+)',
                'type': 'config',
                'complexity': 'simple'
            }
        ]

        for pattern_info in enhanced_patterns:
            matches = re.finditer(pattern_info['pattern'], code, re.IGNORECASE)

            for match in matches:
                line_start = code[:match.start()].count('\n')
                line_content = lines[line_start].strip() if line_start < len(lines) else ''

                # Extract parameter details based on pattern type
                if pattern_info['name'] == 'complex_conditions':
                    param_name = match.group(1)
                    threshold1 = float(match.group(3))
                    threshold2 = float(match.group(6))

                    parameters.append(ExtractedParameter(
                        name=f"{param_name}_condition",
                        value={'min': threshold1, 'max': threshold2},
                        type=pattern_info['type'],
                        confidence=0.9,
                        line=line_start + 1,
                        context=line_content,
                        extraction_method='enhanced_regex',
                        complexity_level=pattern_info['complexity'],
                        suggested_description=f"Complex condition for {param_name}: {threshold1} to {threshold2}"
                    ))


                elif pattern_info['name'] in ['trading_thresholds', 'dataframe_conditions', 'price_volume_thresholds']:
                    # Handle trading threshold patterns
                    groups = match.groups()
                    if len(groups) >= 3:
                        param_name = groups[0]
                        operator = groups[1]
                        threshold_value = float(groups[2])

                        parameters.append(ExtractedParameter(
                            name=f"{param_name}_{operator}_{threshold_value}",
                            value=threshold_value,
                            type=pattern_info['type'],
                            confidence=0.9,
                            line=line_start + 1,
                            context=line_content,
                            extraction_method='enhanced_regex',
                            complexity_level=pattern_info['complexity'],
                            suggested_description=f"Trading threshold: {param_name} {operator} {threshold_value}"
                        ))

                else:
                    # Handle simpler patterns
                    groups = match.groups()
                    if len(groups) >= 1:
                        param_value = self._parse_value(groups[-1])
                        param_name = pattern_info['name'] + "_value"

                        parameters.append(ExtractedParameter(
                            name=param_name,
                            value=param_value,
                            type=pattern_info['type'],
                            confidence=0.8,
                            line=line_start + 1,
                            context=line_content,
                            extraction_method='enhanced_regex',
                            complexity_level=pattern_info['complexity'],
                            suggested_description=self._generate_parameter_description(param_name, pattern_info['type'])
                        ))

        return parameters

    def _extract_hybrid_patterns(self, code: str) -> List[ExtractedParameter]:
        """Extract parameters using hybrid AST + regex analysis"""
        parameters = []

        # Look for missed patterns that require special handling
        hybrid_patterns = [
            {
                'description': 'np.select with multiple conditions',
                'regex': r'np\.select\s*\(\s*\[(.*?)\]\s*,\s*\[(.*?)\]',
                'handler': self._extract_np_select_hybrid
            }
        ]

        for pattern in hybrid_patterns:
            matches = re.finditer(pattern['regex'], code, re.DOTALL | re.IGNORECASE)
            for match in matches:
                handler_params = pattern['handler'](match, code)
                parameters.extend(handler_params)

        return parameters

    def _extract_np_select_hybrid(self, match, code: str) -> List[ExtractedParameter]:
        """Extract parameters from np.select using hybrid analysis"""
        parameters = []

        try:
            conditions_str = match.group(1)
            values_str = match.group(2)

            # Extract numeric thresholds from conditions
            threshold_matches = re.findall(r'([>=<]+)\s*([0-9.]+)', conditions_str)
            for operator, value in threshold_matches:
                parameters.append(ExtractedParameter(
                    name=f"np_select_threshold",
                    value=float(value),
                    type='threshold',
                    confidence=0.85,
                    line=code[:match.start()].count('\n') + 1,
                    context=match.group(0)[:100] + "...",
                    extraction_method='hybrid',
                    complexity_level='advanced',
                    suggested_description=f"np.select threshold: {operator} {value}"
                ))

            # Extract scoring values
            score_matches = re.findall(r'([0-9.]+)', values_str)
            if score_matches and len(score_matches) > 1:
                scores = [float(x) for x in score_matches]
                parameters.append(ExtractedParameter(
                    name="np_select_scores",
                    value=scores,
                    type='array',
                    confidence=0.9,
                    line=code[:match.start()].count('\n') + 1,
                    context=match.group(0)[:100] + "...",
                    extraction_method='hybrid',
                    complexity_level='advanced',
                    suggested_description=f"np.select scoring array: {scores}"
                ))

        except Exception as e:
            logger.debug(f"np.select hybrid extraction error: {e}")

        return parameters

    def _extract_np_select_parameters(self, node: ast.Call, code: str) -> List[ExtractedParameter]:
        """Extract parameters from np.select AST nodes"""
        parameters = []

        try:
            if len(node.args) >= 2:
                # Extract conditions (first argument)
                conditions = node.args[0]
                values = node.args[1]

                # Process conditions list
                if isinstance(conditions, ast.List):
                    for condition in conditions.elts:
                        if isinstance(condition, ast.Compare):
                            comp_params = self._handle_comparison(condition, code)
                            for param in comp_params:
                                param.suggested_description = f"np.select condition: {param.name}"
                                param.complexity_level = 'advanced'
                            parameters.extend(comp_params)

                # Process values list
                if isinstance(values, ast.List):
                    score_values = []
                    for value in values.elts:
                        if isinstance(value, ast.Constant):
                            score_values.append(value.value)

                    if score_values:
                        parameters.append(ExtractedParameter(
                            name="np_select_values",
                            value=score_values,
                            type='array',
                            confidence=0.9,
                            line=node.lineno,
                            context=self._get_line_context(code, node.lineno),
                            extraction_method='ast',
                            complexity_level='advanced',
                            suggested_description=f"np.select scoring values: {score_values}"
                        ))

        except Exception as e:
            logger.debug(f"np.select parameter extraction error: {e}")

        return parameters

    def _is_trading_parameter(self, name: str) -> bool:
        """Check if a variable name represents a trading parameter"""

        # Exclude infrastructure parameters
        infrastructure_patterns = [
            'max_workers', 'timeout', 'api_key', 'base_url', 'date', 'port',
            'host', 'debug', 'log', 'config', 'path', 'file', 'url', 'endpoint',
            'thread', 'process', 'executor', 'pool', 'client', 'session',
            'window', 'span', 'adjust', 'unit', 'format', 'encoding', 'buffer'
        ]

        name_lower = name.lower()

        # Exclude infrastructure parameters
        if any(infra in name_lower for infra in infrastructure_patterns):
            return False

        # Include actual trading keywords
        trading_keywords = [
            'atr', 'mult', 'threshold', 'volume', 'price', 'gap', 'slope',
            'momentum', 'score', 'filter', 'min', 'max', 'pct', 'percent',
            'high_pct_chg', 'ema', 'burst', 'rvol', 'dol_v', 'close_range'
        ]

        return any(keyword in name_lower for keyword in trading_keywords)

    def _determine_parameter_type(self, name: str, value: Any) -> str:
        """Determine the type of parameter based on name and value"""
        name_lower = name.lower()

        if isinstance(value, list):
            return 'array'
        elif 'min' in name_lower or 'max' in name_lower or 'threshold' in name_lower:
            return 'threshold'
        elif 'filter' in name_lower:
            return 'filter'
        elif 'score' in name_lower:
            return 'scoring'
        else:
            return 'config'

    def _extract_value_from_node(self, node) -> Any:
        """Extract value from an AST node"""
        if isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.List):
            return [self._extract_value_from_node(elt) for elt in node.elts]
        elif isinstance(node, ast.Dict):
            return {
                self._extract_value_from_node(k): self._extract_value_from_node(v)
                for k, v in zip(node.keys, node.values)
            }
        else:
            return str(node.__class__.__name__)

    def _get_line_context(self, code: str, line_num: int) -> str:
        """Get the context around a specific line"""
        lines = code.split('\n')
        if 0 <= line_num - 1 < len(lines):
            return lines[line_num - 1].strip()
        return ""

    def _parse_value(self, value_str: str) -> Any:
        """Parse a string value to appropriate type"""
        if not value_str:
            return None

        value_str = value_str.strip()

        # Try numeric conversion
        try:
            if '.' in value_str:
                return float(value_str)
            else:
                return int(value_str)
        except ValueError:
            pass

        # Remove quotes for strings
        if ((value_str.startswith('"') and value_str.endswith('"')) or
            (value_str.startswith("'") and value_str.endswith("'"))):
            return value_str[1:-1]

        return value_str

    def _detect_scanner_type_enhanced(self, code: str, parameters: List[ExtractedParameter]) -> str:
        """Enhanced scanner type detection using code and extracted parameters"""
        code_lower = code.lower()
        confidence_scores = {}

        # Check each scanner type
        for scanner_type, indicators in self.scanner_indicators.items():
            score = 0.0

            # Check primary indicators
            for indicator in indicators['primary']:
                if indicator in code_lower:
                    score += 0.5

            # Check secondary indicators
            for indicator in indicators['secondary']:
                if indicator in code_lower:
                    score += 0.2
                # Also check in parameter names
                for param in parameters:
                    if indicator.lower() in param.name.lower():
                        score += 0.1

            confidence_scores[scanner_type] = score

        # Return the scanner type with highest confidence
        if confidence_scores:
            best_scanner = max(confidence_scores.items(), key=lambda x: x[1])
            if best_scanner[1] > 0.3:  # Minimum confidence threshold
                return best_scanner[0]

        # Fallback detection
        if 'async def main' in code and 'asyncio.run' in code:
            return 'sophisticated_async_scanner'
        elif any('atr' in param.name.lower() for param in parameters):
            return 'atr_based_scanner'
        else:
            return 'custom_scanner'

    def _calculate_enhanced_confidence(self, parameters: List[ExtractedParameter], scanner_type: str) -> float:
        """Calculate enhanced confidence score based on extraction quality"""
        if not parameters:
            return 0.0

        # Base confidence from individual parameters
        individual_confidences = [param.confidence for param in parameters]
        base_confidence = sum(individual_confidences) / len(individual_confidences)

        # Boost confidence based on complexity
        complexity_boost = 0.0
        advanced_count = sum(1 for p in parameters if p.complexity_level == 'advanced')
        if advanced_count > 0:
            complexity_boost = min(0.2, advanced_count * 0.05)

        # Boost confidence based on extraction method diversity
        methods = set(param.extraction_method for param in parameters)
        method_boost = min(0.15, len(methods) * 0.05)

        # Scanner type alignment boost
        scanner_boost = 0.1 if scanner_type != 'custom_scanner' else 0.0

        final_confidence = min(0.95, base_confidence + complexity_boost + method_boost + scanner_boost)
        return final_confidence

    def _generate_enhanced_suggestions(self, parameters: List[ExtractedParameter], scanner_type: str, missed_patterns: List[str]) -> List[str]:
        """Generate intelligent suggestions based on extraction results"""
        suggestions = []

        # Parameter-based suggestions
        if parameters:
            advanced_params = [p for p in parameters if p.complexity_level == 'advanced']
            if advanced_params:
                suggestions.append(f"Found {len(advanced_params)} complex parameters - consider validation")

            array_params = [p for p in parameters if p.type == 'array']
            if array_params:
                suggestions.append(f"Found {len(array_params)} scoring arrays - validate ranges")

        # Scanner-specific suggestions
        if scanner_type == 'lc_d2_scanner':
            suggestions.append("LC D2 scanner detected - verify ATR multiplier thresholds")
        elif scanner_type == 'atr_based_scanner':
            suggestions.append("ATR-based scanner - ensure volatility parameters are current")

        # Extraction quality suggestions
        extraction_methods = set(param.extraction_method for param in parameters)
        if len(extraction_methods) > 1:
            suggestions.append("Multi-method extraction successful - high confidence results")

        if missed_patterns:
            suggestions.append(f"Some patterns may need manual review: {len(missed_patterns)} edge cases")

        if not suggestions:
            suggestions.append("All parameters extracted successfully - ready for formatting")

        return suggestions

    def _deduplicate_and_enhance(self, parameters: List[ExtractedParameter]) -> List[ExtractedParameter]:
        """Remove duplicates and enhance parameter metadata"""
        # Group by name and line for deduplication
        param_groups = {}

        for param in parameters:
            key = (param.name.lower(), param.line)
            if key not in param_groups:
                param_groups[key] = []
            param_groups[key].append(param)

        # Select best parameter from each group
        unique_parameters = []
        for group in param_groups.values():
            # Sort by confidence and complexity
            best_param = max(group, key=lambda p: (p.confidence,
                                                  {'simple': 1, 'complex': 2, 'advanced': 3}[p.complexity_level]))

            # Enhance description if missing
            if not best_param.suggested_description:
                best_param.suggested_description = self._generate_parameter_description(
                    best_param.name, best_param.type
                )

            unique_parameters.append(best_param)

        return unique_parameters

    def _generate_parameter_description(self, name: str, param_type: str) -> str:
        """Generate intelligent description for a parameter"""
        name_lower = name.lower()

        # Specific parameter descriptions
        descriptions = {
            'atr_mult': 'ATR multiplier for volatility-based filtering',
            'volume_threshold': 'Minimum volume requirement for liquidity',
            'gap_percent': 'Gap percentage threshold for pattern detection',
            'trading_array': 'Array of trading parameter values',
            'default': 'Default fallback value for conditional logic'
        }

        if name_lower in descriptions:
            return descriptions[name_lower]

        # Pattern-based descriptions
        if 'atr' in name_lower:
            return f"Average True Range {param_type} parameter"
        elif 'volume' in name_lower:
            return f"Volume-related {param_type} parameter"
        elif 'score' in name_lower:
            return f"Scoring {param_type} for weighted evaluation"
        elif 'threshold' in name_lower:
            return f"Threshold {param_type} for filtering conditions"
        elif param_type == 'array':
            return f"Array parameter with multiple values"
        elif param_type == 'condition':
            return f"Complex condition parameter for multi-criteria filtering"
        else:
            return f"{param_type.capitalize()} parameter: {name}"

# Global instance
enhanced_parameter_extractor = EnhancedASTParameterExtractor()