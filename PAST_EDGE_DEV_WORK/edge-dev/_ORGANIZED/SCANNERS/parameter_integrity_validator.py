#!/usr/bin/env python3
"""
Parameter Integrity Validator
=============================
Bulletproof parameter validation and checksum verification system.
Ensures 100% parameter integrity across all scanner operations.
"""

import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from pathlib import Path
import sqlite3
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class IntegrityReport:
    """Comprehensive integrity verification report"""
    scanner_name: str
    timestamp: str
    parameter_checksum: str
    config_checksum: str
    is_valid: bool
    validation_errors: List[str]
    warnings: List[str]
    parameter_count: int
    symbol_count: int
    date_range: Dict[str, str]
    scanner_type: str

class ParameterIntegrityValidator:
    """Bulletproof parameter integrity validator"""

    def __init__(self, db_path: str = "parameter_integrity.db"):
        self.db_path = db_path
        self.validation_rules = self._load_validation_rules()
        self._initialize_database()

    def _initialize_database(self):
        """Initialize SQLite database for integrity tracking"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS integrity_checks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scanner_name TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    parameter_checksum TEXT NOT NULL,
                    config_checksum TEXT NOT NULL,
                    is_valid BOOLEAN NOT NULL,
                    validation_errors TEXT,
                    warnings TEXT,
                    parameter_count INTEGER,
                    symbol_count INTEGER,
                    date_range_start TEXT,
                    date_range_end TEXT,
                    scanner_type TEXT
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS parameter_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scanner_name TEXT NOT NULL,
                    parameter_name TEXT NOT NULL,
                    old_value TEXT,
                    new_value TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    checksum TEXT NOT NULL
                )
            """)

    def _load_validation_rules(self) -> Dict[str, Dict]:
        """Load comprehensive validation rules"""
        return {
            'backside_b': {
                'required_params': [
                    'price_min', 'adv20_min_usd', 'abs_lookback_days', 'abs_exclude_days',
                    'pos_abs_max', 'trigger_mode', 'atr_mult', 'vol_mult', 'd1_volume_min',
                    'slope5d_min', 'high_ema9_mult', 'gap_div_atr_min',
                    'open_over_ema9_min', 'd1_green_atr_min'
                ],
                'param_ranges': {
                    'price_min': {'min': 0.1, 'max': 1000.0},
                    'adv20_min_usd': {'min': 1000000, 'max': 1000000000},
                    'abs_lookback_days': {'min': 100, 'max': 2000},
                    'abs_exclude_days': {'min': 0, 'max': 30},
                    'pos_abs_max': {'min': 0.0, 'max': 1.0},
                    'atr_mult': {'min': 0.1, 'max': 5.0},
                    'vol_mult': {'min': 0.1, 'max': 5.0},
                    'd1_volume_min': {'min': 100000, 'max': 100000000},
                    'slope5d_min': {'min': 0.0, 'max': 50.0},
                    'high_ema9_mult': {'min': 1.0, 'max': 2.0},
                    'gap_div_atr_min': {'min': 0.1, 'max': 5.0},
                    'open_over_ema9_min': {'min': 0.8, 'max': 1.5},
                    'd1_green_atr_min': {'min': 0.0, 'max': 2.0}
                },
                'string_constraints': {
                    'trigger_mode': {'allowed_values': ['D1_only', 'D1_or_D2']}
                }
            },
            'half_a_plus': {
                'required_params': [
                    'price_min', 'adv20_min_usd', 'atr_mult', 'vol_mult', 'slope3d_min',
                    'slope5d_min', 'slope15d_min', 'high_ema9_mult', 'high_ema20_mult',
                    'pct7d_low_div_atr_min', 'pct14d_low_div_atr_min', 'gap_div_atr_min',
                    'open_over_ema9_min', 'atr_pct_change_min', 'prev_close_min',
                    'pct2d_div_atr_min', 'pct3d_div_atr_min', 'lookback_days_2y',
                    'exclude_recent_days', 'not_top_frac_abs'
                ],
                'param_ranges': {
                    'price_min': {'min': 0.1, 'max': 1000.0},
                    'adv20_min_usd': {'min': 1000000, 'max': 1000000000},
                    'atr_mult': {'min': 0.1, 'max': 10.0},
                    'vol_mult': {'min': 0.1, 'max': 10.0},
                    'slope3d_min': {'min': 0.0, 'max': 100.0},
                    'slope5d_min': {'min': 0.0, 'max': 100.0},
                    'slope15d_min': {'min': 0.0, 'max': 100.0},
                    'high_ema9_mult': {'min': 1.0, 'max': 15.0},
                    'high_ema20_mult': {'min': 1.0, 'max': 20.0},
                    'pct7d_low_div_atr_min': {'min': 0.0, 'max': 100.0},
                    'pct14d_low_div_atr_min': {'min': 0.0, 'max': 100.0},
                    'gap_div_atr_min': {'min': 0.1, 'max': 5.0},
                    'open_over_ema9_min': {'min': 0.8, 'max': 2.0},
                    'atr_pct_change_min': {'min': 0.0, 'max': 10.0},
                    'prev_close_min': {'min': 1.0, 'max': 1000.0},
                    'pct2d_div_atr_min': {'min': 0.0, 'max': 100.0},
                    'pct3d_div_atr_min': {'min': 0.0, 'max': 100.0},
                    'lookback_days_2y': {'min': 100, 'max': 2000},
                    'exclude_recent_days': {'min': 0, 'max': 30},
                    'not_top_frac_abs': {'min': 0.0, 'max': 1.0}
                }
            },
            'lc_multiscanner': {
                'required_params': [
                    'price_min', 'adv20_min_usd', 'abs_lookback_days', 'pos_abs_max',
                    'atr_mult', 'vol_mult', 'gap_div_atr_min', 'slope5d_min', 'd1_volume_min'
                ],
                'param_ranges': {
                    'price_min': {'min': 0.1, 'max': 100.0},
                    'adv20_min_usd': {'min': 500000, 'max': 50000000},
                    'abs_lookback_days': {'min': 100, 'max': 1000},
                    'pos_abs_max': {'min': 0.0, 'max': 1.0},
                    'atr_mult': {'min': 0.1, 'max': 3.0},
                    'vol_mult': {'min': 0.1, 'max': 3.0},
                    'gap_div_atr_min': {'min': 0.1, 'max': 3.0},
                    'slope5d_min': {'min': 0.0, 'max': 20.0},
                    'd1_volume_min': {'min': 100000, 'max': 10000000}
                }
            }
        }

    def generate_parameter_checksum(self, parameters: Dict[str, Any], scanner_type: str) -> str:
        """Generate bulletproof parameter checksum"""
        # Sort parameters for consistent hashing
        sorted_params = json.dumps(parameters, sort_keys=True, ensure_ascii=True)

        # Include scanner type in checksum
        checksum_input = f"{scanner_type}:{sorted_params}"

        # Generate SHA-256 hash and return first 16 characters
        return hashlib.sha256(checksum_input.encode('utf-8')).hexdigest()[:16]

    def generate_config_checksum(self, scanner_name: str, scanner_type: str,
                                parameters: Dict[str, Any], symbol_universe: List[str],
                                date_range: Dict[str, str]) -> str:
        """Generate comprehensive configuration checksum"""
        config_data = {
            'name': scanner_name,
            'type': scanner_type,
            'parameters': parameters,
            'symbol_count': len(symbol_universe),
            'date_start': date_range.get('start', ''),
            'date_end': date_range.get('end', '')
        }

        config_string = json.dumps(config_data, sort_keys=True, ensure_ascii=True)
        return hashlib.sha256(config_string.encode('utf-8')).hexdigest()

    def validate_parameters(self, parameters: Dict[str, Any], scanner_type: str) -> Tuple[bool, List[str], List[str]]:
        """Comprehensive parameter validation"""
        errors = []
        warnings = []

        if scanner_type not in self.validation_rules:
            errors.append(f"Unknown scanner type: {scanner_type}")
            return False, errors, warnings

        rules = self.validation_rules[scanner_type]

        # Check required parameters
        required_params = rules.get('required_params', [])
        missing_params = [param for param in required_params if param not in parameters]
        if missing_params:
            errors.append(f"Missing required parameters: {', '.join(missing_params)}")

        # Validate parameter ranges
        param_ranges = rules.get('param_ranges', {})
        for param_name, param_value in parameters.items():
            if param_name in param_ranges:
                range_rules = param_ranges[param_name]

                # Type checking
                if isinstance(param_value, (int, float)):
                    if 'min' in range_rules and param_value < range_rules['min']:
                        errors.append(f"{param_name}: Value {param_value} below minimum {range_rules['min']}")
                    if 'max' in range_rules and param_value > range_rules['max']:
                        errors.append(f"{param_name}: Value {param_value} above maximum {range_rules['max']}")
                else:
                    warnings.append(f"{param_name}: Expected numeric value, got {type(param_value).__name__}")

        # Validate string constraints
        string_constraints = rules.get('string_constraints', {})
        for param_name, param_value in parameters.items():
            if param_name in string_constraints:
                constraints = string_constraints[param_name]
                if 'allowed_values' in constraints:
                    if param_value not in constraints['allowed_values']:
                        errors.append(f"{param_name}: Value '{param_value}' not in allowed values {constraints['allowed_values']}")

        # Check for unexpected parameters
        known_params = set(required_params + list(param_ranges.keys()) + list(string_constraints.keys()))
        unexpected_params = [param for param in parameters if param not in known_params]
        if unexpected_params:
            warnings.append(f"Unexpected parameters: {', '.join(unexpected_params)}")

        return len(errors) == 0, errors, warnings

    def verify_integrity(self, scanner_name: str, scanner_type: str,
                        parameters: Dict[str, Any], symbol_universe: List[str],
                        date_range: Dict[str, str]) -> IntegrityReport:
        """Comprehensive integrity verification"""
        timestamp = datetime.now().isoformat()

        # Generate checksums
        param_checksum = self.generate_parameter_checksum(parameters, scanner_type)
        config_checksum = self.generate_config_checksum(
            scanner_name, scanner_type, parameters, symbol_universe, date_range
        )

        # Validate parameters
        is_valid, errors, warnings = self.validate_parameters(parameters, scanner_type)

        # Create report
        report = IntegrityReport(
            scanner_name=scanner_name,
            timestamp=timestamp,
            parameter_checksum=param_checksum,
            config_checksum=config_checksum,
            is_valid=is_valid,
            validation_errors=errors,
            warnings=warnings,
            parameter_count=len(parameters),
            symbol_count=len(symbol_universe),
            date_range=date_range,
            scanner_type=scanner_type
        )

        # Store in database
        self._store_integrity_report(report)

        logger.info(f"Integrity verification completed for {scanner_name}")
        logger.info(f"Valid: {is_valid}, Errors: {len(errors)}, Warnings: {len(warnings)}")
        logger.info(f"Parameter Checksum: {param_checksum}")
        logger.info(f"Config Checksum: {config_checksum}")

        return report

    def _store_integrity_report(self, report: IntegrityReport):
        """Store integrity report in database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO integrity_checks (
                    scanner_name, timestamp, parameter_checksum, config_checksum,
                    is_valid, validation_errors, warnings, parameter_count,
                    symbol_count, date_range_start, date_range_end, scanner_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report.scanner_name,
                report.timestamp,
                report.parameter_checksum,
                report.config_checksum,
                report.is_valid,
                json.dumps(report.validation_errors),
                json.dumps(report.warnings),
                report.parameter_count,
                report.symbol_count,
                report.date_range.get('start', ''),
                report.date_range.get('end', ''),
                report.scanner_type
            ))

    def check_parameter_history(self, scanner_name: str, parameter_name: str) -> List[Dict]:
        """Check parameter change history"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT old_value, new_value, timestamp, checksum
                FROM parameter_history
                WHERE scanner_name = ? AND parameter_name = ?
                ORDER BY timestamp DESC
                LIMIT 10
            """, (scanner_name, parameter_name))

            return [
                {
                    'old_value': row[0],
                    'new_value': row[1],
                    'timestamp': row[2],
                    'checksum': row[3]
                }
                for row in cursor.fetchall()
            ]

    def get_integrity_history(self, scanner_name: str = None, limit: int = 50) -> List[Dict]:
        """Get integrity check history"""
        query = """
            SELECT scanner_name, timestamp, parameter_checksum, config_checksum,
                   is_valid, validation_errors, warnings, parameter_count,
                   symbol_count, date_range_start, date_range_end, scanner_type
            FROM integrity_checks
        """
        params = []

        if scanner_name:
            query += " WHERE scanner_name = ?"
            params.append(scanner_name)

        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)

            return [
                {
                    'scanner_name': row[0],
                    'timestamp': row[1],
                    'parameter_checksum': row[2],
                    'config_checksum': row[3],
                    'is_valid': bool(row[4]),
                    'validation_errors': json.loads(row[5]) if row[5] else [],
                    'warnings': json.loads(row[6]) if row[6] else [],
                    'parameter_count': row[7],
                    'symbol_count': row[8],
                    'date_range_start': row[9],
                    'date_range_end': row[10],
                    'scanner_type': row[11]
                }
                for row in cursor.fetchall()
            ]

    def export_integrity_report(self, scanner_name: str, output_file: str = None) -> str:
        """Export comprehensive integrity report"""
        history = self.get_integrity_history(scanner_name)

        report_data = {
            'scanner_name': scanner_name,
            'generated_at': datetime.now().isoformat(),
            'total_checks': len(history),
            'checks': history
        }

        if output_file is None:
            output_file = f"integrity_report_{scanner_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(output_file, 'w') as f:
            json.dump(report_data, f, indent=2)

        logger.info(f"Integrity report exported to {output_file}")
        return output_file

# Global validator instance
_validator = None

def get_integrity_validator() -> ParameterIntegrityValidator:
    """Get global validator instance"""
    global _validator
    if _validator is None:
        _validator = ParameterIntegrityValidator()
    return _validator

def verify_scanner_integrity(scanner_name: str, scanner_type: str,
                            parameters: Dict[str, Any], symbol_universe: List[str],
                            date_range: Dict[str, str]) -> IntegrityReport:
    """Convenience function for scanner integrity verification"""
    validator = get_integrity_validator()
    return validator.verify_integrity(scanner_name, scanner_type, parameters, symbol_universe, date_range)

if __name__ == "__main__":
    # Example usage
    validator = ParameterIntegrityValidator()

    # Test Backside B parameters
    backside_b_params = {
        'price_min': 8.0,
        'adv20_min_usd': 30_000_000,
        'abs_lookback_days': 1000,
        'pos_abs_max': 0.75,
        'gap_div_atr_min': 0.75
    }

    symbols = ['TSLA', 'NVDA', 'AMD']
    date_range = {'start': '2024-01-01', 'end': '2025-11-01'}

    report = validator.verify_integrity(
        'backside_b_test', 'backside_b',
        backside_b_params, symbols, date_range
    )

    print(f"Integrity check result: {report.is_valid}")
    if not report.is_valid:
        print("Errors:", report.validation_errors)
    if report.warnings:
        print("Warnings:", report.warnings)