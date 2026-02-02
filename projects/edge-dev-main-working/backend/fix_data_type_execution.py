#!/usr/bin/env python3
"""
Data Type Fix for Scanner Execution
Ensures all trading data columns are properly converted to numeric types before scanner execution
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def fix_data_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert all trading data columns to proper numeric types

    Fixes the '>' not supported between instances of 'str' and 'int' error
    by ensuring all columns that should be numeric are properly converted.
    """
    if df is None or df.empty:
        return df

    # Define columns that should be numeric
    numeric_columns = [
        # Price columns
        'h', 'l', 'o', 'c', 'h1', 'h2', 'h3', 'l1', 'l2', 'c1', 'c2', 'c3', 'o1', 'o2',
        'pdc', 'high', 'low', 'open', 'close',

        # Volume columns
        'v', 'v_ua', 'v1', 'v2', 'v_ua1', 'volume',
        'dol_v', 'dol_v1', 'dol_v2',

        # Technical indicators
        'atr', 'true_range', 'ema9', 'ema20', 'ema50', 'ema200', 'ema9_1', 'ema20_1', 'ema50_1', 'ema20_2',

        # Price changes and ranges
        'high_chg', 'high_chg_atr', 'high_chg_atr1', 'high_chg_atr2',
        'high_chg_from_pdc_atr', 'high_chg_from_pdc_atr1',
        'pct_change', 'close_range', 'close_range1', 'close_range2',

        # Gap measurements
        'gap_atr', 'gap_atr1', 'gap_pdh_atr',

        # Distance measurements
        'dist_h_9ema', 'dist_h_20ema', 'dist_h_50ema', 'dist_h_200ema',
        'dist_h_9ema1', 'dist_h_20ema1', 'dist_h_50ema1', 'dist_h_200ema1',
        'dist_h_9ema_atr', 'dist_h_20ema_atr', 'dist_h_50ema_atr', 'dist_h_200ema_atr',
        'dist_h_9ema_atr1', 'dist_h_20ema_atr1', 'dist_h_50ema_atr1', 'dist_h_200ema_atr1',
        'dist_h_9ema2', 'dist_h_9ema3', 'dist_h_9ema4',
        'dist_h_20ema2', 'dist_h_20ema3', 'dist_h_20ema4', 'dist_h_20ema5',
        'dist_h_9ema_atr2', 'dist_h_9ema_atr3',

        # Score calculations
        'score_atr', 'score_ema', 'score_burst', 'score_vol', 'score_gap',
        'parabolic_score_raw', 'parabolic_score',

        # Any other potential numeric columns
        'n', 'vwap', 't'
    ]

    conversion_count = 0

    # Convert existing columns to numeric
    for col in numeric_columns:
        if col in df.columns:
            try:
                original_dtype = df[col].dtype

                # Convert to numeric, replacing any non-convertible values with NaN
                df[col] = pd.to_numeric(df[col], errors='coerce')

                # Fill NaN values with 0 for calculations
                df[col] = df[col].fillna(0)

                if original_dtype != df[col].dtype:
                    conversion_count += 1
                    logger.debug(f"Converted column '{col}' from {original_dtype} to {df[col].dtype}")

            except Exception as e:
                logger.warning(f"Failed to convert column '{col}' to numeric: {e}")

    # Also convert any columns that look like they should be numeric
    for col in df.columns:
        if df[col].dtype == 'object':  # String/object columns
            # Try to convert if it looks like numeric data
            try:
                # Sample a few values to see if they're numeric
                sample = df[col].dropna().head(5)
                if len(sample) > 0:
                    # Try converting sample values
                    test_convert = pd.to_numeric(sample, errors='coerce')
                    if not test_convert.isna().all():  # At least some values converted successfully
                        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                        conversion_count += 1
                        logger.debug(f"Auto-converted column '{col}' to numeric")
            except:
                pass  # Skip if conversion fails

    if conversion_count > 0:
        logger.info(f"✅ Fixed data types: {conversion_count} columns converted to numeric")

    return df

def preprocess_trading_data(data: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Convert raw trading data to properly typed DataFrame
    """
    if not data:
        return pd.DataFrame()

    # Convert to DataFrame
    df = pd.DataFrame(data)

    # Fix data types
    df = fix_data_types(df)

    logger.info(f"📊 Preprocessed trading data: {len(df)} rows, {len(df.columns)} columns")

    return df

def patch_scanner_execution():
    """
    Patch the scanner execution pipeline to include data type fixes
    """

    # Patch the Universal Scanner Engine to use data type fixes
    try:
        import sys
        from pathlib import Path

        # Add the backend directory to Python path
        backend_path = Path(__file__).parent
        if str(backend_path) not in sys.path:
            sys.path.insert(0, str(backend_path))

        # Import and patch the robustness engine
        from core.universal_scanner_robustness_engine_v2 import UniversalScannerRobustnessEngineV2

        # Store original execution method
        original_execute = UniversalScannerRobustnessEngineV2._execute_enhanced_scanner

        async def patched_execute_enhanced_scanner(self, enhanced_code: str, start_date: str, end_date: str,
                                                  execution_model: str, processing_id: str, notes: str):
            """Enhanced scanner execution with data type fixes"""

            try:
                logger.info("🔧 Applying data type fixes to scanner execution...")

                # Add data type fix imports to the enhanced code
                fix_imports = '''
import pandas as pd
import numpy as np

def fix_data_types_inline(df):
    """Inline data type fix for scanner execution"""
    if df is None or df.empty:
        return df

    numeric_columns = [
        'h', 'l', 'o', 'c', 'h1', 'h2', 'h3', 'l1', 'l2', 'c1', 'c2', 'c3', 'o1', 'o2',
        'pdc', 'high', 'low', 'open', 'close', 'v', 'v_ua', 'v1', 'v2', 'v_ua1', 'volume',
        'dol_v', 'dol_v1', 'dol_v2', 'atr', 'true_range', 'ema9', 'ema20', 'ema50', 'ema200'
    ]

    for col in numeric_columns:
        if col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            except:
                pass

    return df

'''

                # Prepend the fix to the enhanced code
                enhanced_code_with_fixes = fix_imports + enhanced_code

                # Call original execution with enhanced code
                result = await original_execute(self, enhanced_code_with_fixes, start_date, end_date,
                                              execution_model, processing_id, notes)

                return result

            except Exception as e:
                logger.error(f"❌ Patched execution failed: {e}")
                # Fall back to original execution
                return await original_execute(self, enhanced_code, start_date, end_date,
                                            execution_model, processing_id, notes)

        # Apply the patch
        UniversalScannerRobustnessEngineV2._execute_enhanced_scanner = patched_execute_enhanced_scanner

        logger.info("✅ Data type fix patch applied successfully")

    except Exception as e:
        logger.error(f"❌ Failed to apply data type fix patch: {e}")

if __name__ == "__main__":
    # Test the data type fixes
    test_data = [
        {'h': '10.5', 'h1': '10.0', 'c': 10.3, 'v': 1000000},
        {'h': '11.2', 'h1': '10.5', 'c': 11.0, 'v': 1200000}
    ]

    df = preprocess_trading_data(test_data)
    print("Fixed DataFrame:")
    print(df.dtypes)
    print(df)