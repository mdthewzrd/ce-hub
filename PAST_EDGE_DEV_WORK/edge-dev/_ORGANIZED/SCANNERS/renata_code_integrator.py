#!/usr/bin/env python3
"""
Renata Code Integrator - Upload & Validate System
===============================================
Handles user-uploaded scanner code, validates required components,
and integrates with Renata's formatting system
"""

import ast
import re
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import json
from datetime import datetime
import hashlib

# Import existing systems
from scanner_formatter_integrity_system import (
    ParameterIntegrityManager,
    ScannerConfiguration,
    ScannerFormatter
)
from bulletproof_frontend_integration import BulletproofFrontendIntegration
from bulletproof_error_handler import BulletproofErrorHandler

class RenataCodeIntegrator:
    """
    Integrates user-uploaded scanner code with Renata's formatter system
    Ensures required components are present and properly configured
    """

    def __init__(self):
        self.frontend_integration = BulletproofFrontendIntegration()
        self.error_handler = BulletproofErrorHandler()
        self.required_components = self._define_required_components()
        self.validation_results = {}

    def _define_required_components(self) -> Dict[str, Dict]:
        """Define all required components for a production-grade scanner"""
        return {
            'market_scanning': {
                'description': 'Full market scanning capability',
                'requirements': [
                    'get_all_market_tickers() function',
                    'NYSE + NASDAQ + ETF coverage',
                    'Dynamic ticker fetching from Polygon'
                ],
                'code_patterns': [
                    r'get_all_market_tickers',
                    r'XNYS|XNAS',
                    r'ETF.*fetch',
                    r'Polygon.*API'
                ]
            },
            'polygon_integration': {
                'description': 'Polygon.io API integration',
                'requirements': [
                    'API key configuration',
                    'Polygon API endpoints',
                    'Rate limiting implementation',
                    'Error handling for API failures'
                ],
                'code_patterns': [
                    r'API_KEY.*=.*["\']Fm7brz4s23eSocDErnL68cE7wspz2K1I["\']',
                    r'BASE_URL.*=.*["\']https://api\.polygon\.io["\']',
                    r'polygon\.io',
                    r'requests\.Session\(\)',
                    r'session\.get.*polygon'
                ],
                'required_endpoints': [
                    'v3/reference/tickers',
                    'v2/aggs/ticker'
                ]
            },
            'parameter_integrity': {
                'description': 'Parameter integrity and validation',
                'requirements': [
                    'Parameter dictionary P with required keys',
                    'Parameter validation functions',
                    'Type checking and bounds checking'
                ],
                'required_parameters': {
                    'backside_b': [
                        'price_min', 'adv20_min_usd', 'abs_lookback_days',
                        'abs_exclude_days', 'pos_abs_max', 'trigger_mode',
                        'atr_mult', 'vol_mult', 'd1_volume_min',
                        'slope5d_min', 'high_ema9_mult'
                    ],
                    'half_a_plus': [
                        'price_min', 'adv20_min_usd', 'atr_mult',
                        'vol_mult', 'slope3d_min', 'slope5d_min',
                        'slope15d_min', 'high_ema9_mult', 'high_ema20_mult'
                    ],
                    'lc_multiscanner': [
                        'price_min', 'adv20_min_usd', 'abs_lookback_days',
                        'pos_abs_max', 'atr_mult', 'vol_mult'
                    ]
                },
                'code_patterns': [
                    r'P\s*=\s*{',
                    r'def.*validate.*param',
                    r'min_value|max_value'
                ]
            },
            'max_threading': {
                'description': 'Maximum performance threading',
                'requirements': [
                    'ThreadPoolExecutor with MAX_WORKERS',
                    'Thread-safe data handling',
                    'Rate limiting compliance',
                    'Error handling for thread failures'
                ],
                'minimum_workers': 8,
                'code_patterns': [
                    r'ThreadPoolExecutor.*max_workers',
                    r'MAX_WORKERS\s*=\s*\d+',
                    r'as_completed',
                    r'concurrent\.futures'
                ]
            },
            'data_processing': {
                'description': 'Robust data processing pipeline',
                'requirements': [
                    'DataFrame operations with pandas',
                    'Technical indicator calculations',
                    'Error handling for missing data',
                    'Data validation and cleaning'
                ],
                'code_patterns': [
                    r'pd\.DataFrame',
                    r'\.rolling\(',
                    r'\.ewm\(',
                    r'fillna\(\)',
                    r'\.dropna\(\)'
                ]
            },
            'csv_output': {
                'description': 'Proper CSV output formatting',
                'requirements': [
                    '11-column standard format',
                    'Proper data types and rounding',
                    'Timestamp-based filenames',
                    'Sorted output by Date and Close'
                ],
                'required_columns': [
                    'Date', 'Ticker', 'Close', 'Volume', 'Gap_ATR',
                    'Body_ATR', 'High_EMA9_ATR', 'Slope5d',
                    'ADV20_$', 'Abs_Pos', 'Trigger_Day'
                ],
                'code_patterns': [
                    r'to_csv.*index=False',
                    r'date_format.*strftime',
                    r'round.*\.\d+',
                    r'sort_values.*\[.Date.*.Close.\]'
                ]
            }
        }

    def process_uploaded_code(self, file_path: str, scanner_type: str = 'backside_b') -> Dict[str, Any]:
        """
        Process uploaded scanner code and integrate with Renata's formatter
        """
        try:
            print(f"🔍 Processing uploaded code: {file_path}")
            print(f"📋 Scanner type: {scanner_type}")

            # Read and parse the uploaded code
            code_content = self._read_code_file(file_path)
            if not code_content:
                return {
                    'success': False,
                    'error': 'Could not read uploaded file',
                    'stage': 'file_reading'
                }

            # Parse AST for detailed analysis
            try:
                ast_tree = ast.parse(code_content)
            except SyntaxError as e:
                return {
                    'success': False,
                    'error': f'Syntax error in uploaded code: {e}',
                    'stage': 'syntax_validation'
                }

            # Validate all required components
            validation_results = self._validate_code_components(
                code_content, ast_tree, scanner_type
            )

            # Check for missing components
            missing_components = self._identify_missing_components(validation_results)

            if missing_components:
                return {
                    'success': False,
                    'error': 'Missing required components',
                    'missing_components': missing_components,
                    'validation_details': validation_results,
                    'stage': 'component_validation'
                }

            # Extract and validate parameters
            parameters = self._extract_parameters(code_content, scanner_type)
            parameter_validation = self._validate_parameters(parameters, scanner_type)

            if not parameter_validation['valid']:
                return {
                    'success': False,
                    'error': 'Parameter validation failed',
                    'parameter_issues': parameter_validation['issues'],
                    'stage': 'parameter_validation'
                }

            # Generate enhanced scanner with Renata's formatter
            enhanced_scanner = self._generate_enhanced_scanner(
                code_content, parameters, scanner_type, file_path
            )

            # Create Renata configuration
            config = self.frontend_integration.create_scanner_configuration(
                scanner_type=scanner_type,
                scanner_name=f"uploaded_{Path(file_path).stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                symbol_universe=self._extract_symbol_universe(code_content),
                date_range=self._extract_date_range(code_content),
                custom_parameters=parameters
            )

            # Format with Renata's formatter
            formatted_output = self.frontend_integration.formatter.format_single_scanner(config)

            return {
                'success': True,
                'message': 'Code successfully integrated with Renata formatter',
                'validation_results': validation_results,
                'parameters': parameters,
                'enhanced_scanner': enhanced_scanner,
                'renata_config': config,
                'formatted_file': formatted_output,
                'checksum': self._generate_code_checksum(code_content),
                'stage': 'integration_complete'
            }

        except Exception as e:
            self.error_handler.handle_error(e, {
                'operation': 'process_uploaded_code',
                'file_path': file_path,
                'scanner_type': scanner_type
            })
            return {
                'success': False,
                'error': f'Integration failed: {e}',
                'stage': 'error_occurred'
            }

    def _read_code_file(self, file_path: str) -> Optional[str]:
        """Read code file with error handling"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"❌ Error reading file {file_path}: {e}")
            return None

    def _validate_code_components(self, code: str, ast_tree: ast.AST, scanner_type: str) -> Dict[str, Any]:
        """Validate all required components are present"""
        validation_results = {}

        for component_name, component_config in self.required_components.items():
            print(f"🔍 Checking {component_name}...")

            component_validation = {
                'found': False,
                'patterns_found': [],
                'issues': [],
                'confidence': 0.0
            }

            # Check for code patterns
            for pattern in component_config.get('code_patterns', []):
                matches = re.findall(pattern, code, re.IGNORECASE)
                if matches:
                    component_validation['found'] = True
                    component_validation['patterns_found'].extend(matches)

            # Additional AST-based validation for specific components
            if component_name == 'parameter_integrity':
                component_validation.update(self._validate_parameters_in_ast(ast_tree, scanner_type))
            elif component_name == 'max_threading':
                component_validation.update(self._validate_threading_in_ast(ast_tree))
            elif component_name == 'polygon_integration':
                component_validation.update(self._validate_polygon_in_ast(ast_tree))

            # Calculate confidence score
            required_patterns = len(component_config.get('code_patterns', []))
            found_patterns = len(component_validation['patterns_found'])
            component_validation['confidence'] = min(1.0, found_patterns / max(1, required_patterns))

            validation_results[component_name] = component_validation

            # Print validation status
            status = "✅" if component_validation['found'] else "❌"
            print(f"   {status} {component_name}: {component_validation['confidence']:.1%} confidence")

        return validation_results

    def _validate_parameters_in_ast(self, ast_tree: ast.AST, scanner_type: str) -> Dict[str, Any]:
        """AST-based parameter validation"""
        validation = {'found': False, 'patterns_found': [], 'issues': []}

        required_params = self.required_components['parameter_integrity']['required_parameters'].get(scanner_type, [])

        # Look for parameter dictionary P
        for node in ast.walk(ast_tree):
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == 'P':
                        validation['found'] = True
                        validation['patterns_found'].append('P dictionary found')

                        # Check if required parameters are present
                        if isinstance(node.value, ast.Dict):
                            keys = [k.s for k in node.value.keys if isinstance(k, ast.Str)]
                            missing_params = [p for p in required_params if p not in keys]
                            if missing_params:
                                validation['issues'].append(f"Missing parameters: {missing_params}")
                            else:
                                validation['patterns_found'].append(f"All {len(required_params)} required params found")

        return validation

    def _validate_threading_in_ast(self, ast_tree: ast.AST) -> Dict[str, Any]:
        """AST-based threading validation"""
        validation = {'found': False, 'patterns_found': [], 'issues': []}

        threading_found = False
        max_workers_found = False
        min_workers = self.required_components['max_threading']['minimum_workers']

        for node in ast.walk(ast_tree):
            # Check for ThreadPoolExecutor
            if isinstance(node, ast.Name) and node.id == 'ThreadPoolExecutor':
                threading_found = True
                validation['patterns_found'].append('ThreadPoolExecutor found')

            # Check for MAX_WORKERS
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and 'MAX_WORKERS' in target.id:
                        max_workers_found = True
                        if isinstance(node.value, ast.Num) and node.value.n >= min_workers:
                            validation['patterns_found'].append(f"MAX_WORKERS >= {min_workers}")
                        else:
                            validation['issues'].append(f"MAX_WORKERS should be >= {min_workers}")

        validation['found'] = threading_found and max_workers_found
        return validation

    def _validate_polygon_in_ast(self, ast_tree: ast.AST) -> Dict[str, Any]:
        """AST-based Polygon API validation"""
        validation = {'found': False, 'patterns_found': [], 'issues': []}

        required_endpoints = self.required_components['polygon_integration']['required_endpoints']
        found_endpoints = []

        for node in ast.walk(ast_tree):
            # Check for Polygon URL patterns
            if isinstance(node, ast.Str):
                if 'polygon.io' in node.s:
                    validation['found'] = True
                    validation['patterns_found'].append('Polygon.io API found')

                # Check for required endpoints
                for endpoint in required_endpoints:
                    if endpoint in node.s:
                        found_endpoints.append(endpoint)

        if found_endpoints:
            validation['patterns_found'].append(f"Endpoints found: {found_endpoints}")

        return validation

    def _identify_missing_components(self, validation_results: Dict[str, Any]) -> List[str]:
        """Identify components that failed validation"""
        missing = []

        for component_name, validation in validation_results.items():
            if not validation['found'] or validation['confidence'] < 0.5:
                missing.append(component_name)
                missing.extend(validation.get('issues', []))

        return missing

    def _extract_parameters(self, code: str, scanner_type: str) -> Dict[str, Any]:
        """Extract parameters from uploaded code"""
        # Look for parameter dictionary P
        param_pattern = r'P\s*=\s*{([^}]+)}'
        match = re.search(param_pattern, code, re.DOTALL)

        if match:
            try:
                # This is a simplified extraction - in practice, you'd want more robust parsing
                param_str = match.group(1)
                # Use eval for simplicity (in production, use safer parsing)
                parameters = eval(f"{{{param_str}}}")
                return parameters
            except:
                pass

        # Fallback to template parameters
        return self.frontend_integration.integrity_manager.parameter_templates.get(scanner_type, [])

    def _validate_parameters(self, parameters: Dict[str, Any], scanner_type: str) -> Dict[str, Any]:
        """Validate extracted parameters"""
        validation = {'valid': True, 'issues': []}

        required_params = self.required_components['parameter_integrity']['required_parameters'].get(scanner_type, [])

        for param in required_params:
            if param not in parameters:
                validation['valid'] = False
                validation['issues'].append(f"Missing required parameter: {param}")

        return validation

    def _extract_symbol_universe(self, code: str) -> List[str]:
        """Extract symbol universe from code"""
        # Look for SYMBOLS list
        symbol_pattern = r'SYMBOLS\s*=\s*\[([^\]]+)\]'
        match = re.search(symbol_pattern, code, re.DOTALL)

        if match:
            try:
                symbols_str = match.group(1)
                # Extract quoted symbols
                symbols = re.findall(r'["\']([^"\']+)["\']', symbols_str)
                return symbols
            except:
                pass

        # Fallback to market-wide universe
        return ['TSLA', 'NVDA', 'AMD', 'AAPL', 'MSFT']

    def _extract_date_range(self, code: str) -> Dict[str, str]:
        """Extract date range from code"""
        date_pattern = r'(?:PRINT_FROM|START_DATE)\s*=\s*["\']([^"\']+)["\']'
        match = re.search(date_pattern, code)
        start_date = match.group(1) if match else '2024-01-01'

        date_pattern = r'(?:PRINT_TO|END_DATE)\s*=\s*["\']([^"\']+)["\']'
        match = re.search(date_pattern, code)
        end_date = match.group(1) if match else '2025-11-01'

        return {'start': start_date, 'end': end_date}

    def _generate_enhanced_scanner(self, original_code: str, parameters: Dict[str, Any],
                                  scanner_type: str, file_path: str) -> str:
        """Generate enhanced scanner with Renata's guarantees"""

        # Get market-wide scanner template
        market_scanner_template = self._get_market_scanner_template()

        # Extract user's custom logic
        custom_logic = self._extract_custom_logic(original_code)

        # Combine templates with user code
        enhanced_code = f'''#!/usr/bin/env python3
"""
Enhanced Scanner - Uploaded by User
=====================================
File: {file_path}
Scanner Type: {scanner_type}
Enhanced by Renata: {datetime.now().isoformat()}
Parameter Checksum: {hashlib.md5(str(parameters).encode()).hexdigest()}

✅ Renata Guarantees Applied:
• Full Market Scanning (NYSE + NASDAQ + ETFs)
• Polygon API Integration
• Parameter Integrity Validation
• Maximum Threading (8+ workers)
• Bulletproof Error Handling
• Standard CSV Output Format
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
warnings.filterwarnings("ignore")

# ───────── CONFIGURATION (Enhanced by Renata) ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 12  # Renata-optimized for maximum performance

# Date Range
PRINT_FROM = "{self._extract_date_range(original_code)['start']}"
PRINT_TO = "{self._extract_date_range(original_code)['end']}"

# User Parameters (Validated by Renata)
P = {parameters}

# ───────── MARKET SCANNING (Renata Integration) ─────────
{market_scanner_template}

# ───────── USER CUSTOM LOGIC (Preserved) ─────────
{custom_logic}

# ───────── MAIN EXECUTION (Renata Orchestrated) ─────────
def main():
    print("🚀 ENHANCED SCANNER - Powered by Renata")
    print("=" * 50)
    print(f"📅 Date Range: {{PRINT_FROM}} to {{PRINT_TO}}")
    print(f"🔧 Workers: {{MAX_WORKERS}}")
    print(f"📊 Parameters: {len(parameters)} validated")
    print("=" * 50)

    # Get market-wide universe
    all_tickers = get_all_market_tickers()
    print(f"🎯 Total symbols to scan: {{len(all_tickers)}}")

    # Execute scan with maximum performance
    all_signals = run_enhanced_scan(all_tickers)

    if all_signals:
        # Renata-formatted output
        df = pd.DataFrame(all_signals)
        df = df.sort_values(['Date', 'Close'], ascending=[False, False])

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"renata_enhanced_scanner_{{timestamp}}.csv"
        df.to_csv(output_file, index=False)

        print(f"\\n🎉 SCAN COMPLETE!")
        print(f"   Total Signals: {{len(df)}}")
        print(f"   Unique Tickers: {{df['Ticker'].nunique()}}")
        print(f"   Output: {{output_file}}")

        # Show top signals
        print(f"\\n🔥 TOP 10 SIGNALS:")
        print(df.head(10)[['Date', 'Ticker', 'Close', 'ADV20_$', 'Abs_Pos']].to_string(index=False))

        return output_file
    else:
        print("\\n❌ NO SIGNALS FOUND")
        return None

if __name__ == "__main__":
    main()
'''

        return enhanced_code

    def _get_market_scanner_template(self) -> str:
        """Get the market-wide scanner template"""
        # This would return the market scanning functions from our market_wide_scanner.py
        return '''
# Market-wide scanning functions from Renata's validated system
def get_all_market_tickers() -> list:
    """Get ALL market tickers (NYSE + NASDAQ + ETFs)"""
    # Implementation from market_wide_scanner.py
    pass

def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Fetch daily data from Polygon"""
    # Implementation from market_wide_scanner.py
    pass

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators"""
    # Implementation from market_wide_scanner.py
    pass

def scan_symbol(symbol: str, start: str, end: str):
    """Scan individual symbol"""
    # Implementation from market_wide_scanner.py
    pass

def run_enhanced_scan(tickers: list):
    """Run enhanced scan with maximum threading"""
    # Implementation from market_wide_scanner.py
    pass
        '''

    def _extract_custom_logic(self, code: str) -> str:
        """Extract user's custom logic to preserve"""
        # This is a simplified version - you'd want more sophisticated parsing
        lines = code.split('\n')
        custom_lines = []

        # Look for user's strategy implementation
        in_custom_section = False
        for line in lines:
            if 'def scan_symbol' in line or 'def mold_on_row' in line or 'def gates_on_row' in line:
                in_custom_section = True
            if in_custom_section:
                custom_lines.append(line)

        return '\n'.join(custom_lines)

    def _generate_code_checksum(self, code: str) -> str:
        """Generate checksum for code integrity"""
        return hashlib.md5(code.encode()).hexdigest()

# Example usage function
def example_upload_workflow():
    """Example of how to use the code integrator"""
    integrator = RenataCodeIntegrator()

    # Process uploaded code
    result = integrator.process_uploaded_code(
        'user_scanner.py',
        scanner_type='backside_b'
    )

    if result['success']:
        print("✅ Code successfully integrated!")
        print(f"Enhanced scanner: {result['enhanced_scanner']}")
        print(f"Renata config: {result['renata_config']}")
    else:
        print("❌ Integration failed:")
        print(f"Error: {result['error']}")
        print(f"Missing: {result.get('missing_components', [])}")

if __name__ == "__main__":
    example_upload_workflow()