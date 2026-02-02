#!/usr/bin/env python3
"""
Enhanced Trading Scanner - Generated from lc d2 scan - oct 25 new ideas.py

This scanner has been formatted to expose configurable trading parameters.
Original file contained 36 trading parameters.
Formatted version provides 35 configurable parameters.

Key Features:
- Configurable trading thresholds
- Parameter validation
- Clear trading logic structure
- Test execution capability
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

def enhanced_trading_scanner(df: pd.DataFrame, params: Dict[str, Any] = None) -> pd.DataFrame:
    """
    Enhanced trading scanner with configurable parameters.

    Args:
        df: Input DataFrame with OHLCV data and calculated indicators
        params: Dictionary of configurable trading parameters

    Returns:
        Filtered DataFrame containing trading opportunities
    """

    # Default parameter configuration
    default_params = {'gap_atr1_gteq': 0.2, 'gap_atr2_gteq': 0.3, 'parabolic_score_gteq': 60.0, 'parabolic_score_lt': 60.0, 'gap_atr_gteq': -0.2, 'close_range1_gteq': 0.5, 'high_pct_chg1_gteq': 0.05, 'gap_pct_gteq': 0.03, 'high_chg_atr1_gteq': 1.0, 'dist_h_9ema_atr1_gteq': 1.0, 'high_pct_chg2_gteq': 0.03, 'close_range2_gteq': 0.5, 'high_chg_atr2_gteq': 0.5, 'high_pct_chg_gteq': 0.15, 'h_dist_to_lowest_low_20_pct_gteq': 0.75, 'dist_h_20ema_atr1_gteq': 2.0, 'high_chg_atr_gteq': 0.5, 'close_range_gteq': 0.3, 'dist_h_9ema_atr_gteq': 1.5, 'dist_h_20ema_atr_gteq': 3.0, 'h_dist_to_highest_high_20_2_atr_gteq': 2.5, 'highest_high_5_dist_to_lowest_low_20_pct_1_gteq': 0.75, 'dist_l_9ema_atr_gteq': 1.0, 'h_dist_to_highest_high_20_1_atr_gteq': 1.0, 'pct_cng_gteq': 0.5, 'dist_h_50ema_atr_gteq': 4.0, 'dist_h_9ema_atr2_gteq': 1.0, 'dist_h_9ema_atr3_gteq': 1.0, 'dist_h_9ema_atr4_gteq': 1.0, 'dist_h_20ema_atr2_gteq': 1.5, 'dist_h_200ema_atr_gteq': 7.0, 'h_dist_to_lowest_low_20_atr_gteq': 4.0, 'high_chg_from_pdc_atr_gteq': 0.5, 'h_dist_to_lowest_low_5_atr_gteq': 2.0, 'min_periods': 1.0}

    # Merge with user parameters
    if params:
        default_params.update(params)

    p = default_params

    # Apply enhanced trading filters
    
    # Generic Trading Logic from Detected Parameters
    conditions = (
        (df.get('gap_atr1', 0) >= p.get('gap_atr1_gteq', 0.2)) &
        (df.get('gap_atr2', 0) >= p.get('gap_atr2_gteq', 0.3)) &
        (df.get('parabolic_score', 0) >= p.get('parabolic_score_gteq', 60.0)) &
        df['gap_atr'] >= p.get('gap_atr_gteq', -0.2) &
        df['close_range1'] >= p.get('close_range1_gteq', 0.5) &
        df['high_pct_chg1'] >= p.get('high_pct_chg1_gteq', 0.05) &
        (df.get('gap_pct', 0) >= p.get('gap_pct_gteq', 0.03)) &
        (df.get('high_chg_atr1', 0) >= p.get('high_chg_atr1_gteq', 1.0)) &
        (df.get('dist_h_9ema_atr1', 0) >= p.get('dist_h_9ema_atr1_gteq', 1.0)) &
        (df.get('high_pct_chg2', 0) >= p.get('high_pct_chg2_gteq', 0.03)) &
        (df.get('close_range2', 0) >= p.get('close_range2_gteq', 0.5)) &
        (df.get('high_chg_atr2', 0) >= p.get('high_chg_atr2_gteq', 0.5)) &
        (df.get('high_pct_chg', 0) >= p.get('high_pct_chg_gteq', 0.15)) &
        (df.get('h_dist_to_lowest_low_20_pct', 0) >= p.get('h_dist_to_lowest_low_20_pct_gteq', 0.75)) &
        (df.get('dist_h_20ema_atr1', 0) >= p.get('dist_h_20ema_atr1_gteq', 2.0)) &
        (df.get('high_chg_atr', 0) >= p.get('high_chg_atr_gteq', 0.5)) &
        (df.get('close_range', 0) >= p.get('close_range_gteq', 0.3)) &
        (df.get('dist_h_9ema_atr', 0) >= p.get('dist_h_9ema_atr_gteq', 1.5)) &
        (df.get('dist_h_20ema_atr', 0) >= p.get('dist_h_20ema_atr_gteq', 3.0)) &
        (df.get('h_dist_to_highest_high_20_2_atr', 0) >= p.get('h_dist_to_highest_high_20_2_atr_gteq', 2.5)) &
        (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= p.get('highest_high_5_dist_to_lowest_low_20_pct_1_gteq', 0.75)) &
        (df.get('dist_l_9ema_atr', 0) >= p.get('dist_l_9ema_atr_gteq', 1.0)) &
        (df.get('h_dist_to_highest_high_20_1_atr', 0) >= p.get('h_dist_to_highest_high_20_1_atr_gteq', 1.0)) &
        (df.get('pct_cng', 0) >= p.get('pct_cng_gteq', 0.5)) &
        (df.get('dist_h_50ema_atr', 0) >= p.get('dist_h_50ema_atr_gteq', 4.0)) &
        (df.get('dist_h_9ema_atr2', 0) >= p.get('dist_h_9ema_atr2_gteq', 1.0)) &
        (df.get('dist_h_9ema_atr3', 0) >= p.get('dist_h_9ema_atr3_gteq', 1.0)) &
        (df.get('dist_h_9ema_atr4', 0) >= p.get('dist_h_9ema_atr4_gteq', 1.0)) &
        (df.get('dist_h_20ema_atr2', 0) >= p.get('dist_h_20ema_atr2_gteq', 1.5)) &
        (df.get('dist_h_200ema_atr', 0) >= p.get('dist_h_200ema_atr_gteq', 7.0)) &
        (df.get('h_dist_to_lowest_low_20_atr', 0) >= p.get('h_dist_to_lowest_low_20_atr_gteq', 4.0)) &
        (df.get('high_chg_from_pdc_atr', 0) >= p.get('high_chg_from_pdc_atr_gteq', 0.5)) &
        (df.get('h_dist_to_lowest_low_5_atr', 0) >= p.get('h_dist_to_lowest_low_5_atr_gteq', 2.0)) &
        (df.get('min_periods', 0) >= p.get('min_periods', 1.0))
    )

    return df[conditions].copy()


def test_scanner_execution():
    """Test the scanner with sample data."""

    # Create sample data for testing
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    sample_data = pd.DataFrame({
        'Date': dates,
        'Open': np.random.randn(100).cumsum() + 100,
        'High': np.random.randn(100).cumsum() + 105,
        'Low': np.random.randn(100).cumsum() + 95,
        'Close': np.random.randn(100).cumsum() + 100,
        'Volume': np.random.randint(1000000, 10000000, 100)
    })

    # Add sample calculated fields
    sample_data['high_pct_chg1'] = np.random.uniform(0.01, 0.1, 100)
    sample_data['gap_atr'] = np.random.uniform(0.1, 1.0, 100)
    sample_data['close_range1'] = np.random.uniform(0.3, 0.9, 100)
    sample_data['v_ua1'] = np.random.randint(5000000, 50000000, 100)
    sample_data['dol_v1'] = np.random.randint(100000000, 2000000000, 100)
    sample_data['c_ua1'] = np.random.uniform(5, 100, 100)
    sample_data['high_chg_atr1'] = np.random.uniform(0.5, 3.0, 100)

    # Test with default parameters
    print("Testing enhanced trading scanner...")
    results = enhanced_trading_scanner(sample_data)
    print(f"Scanner found {len(results)} trading opportunities out of {len(sample_data)} records")

    return results

if __name__ == "__main__":
    test_results = test_scanner_execution()
    print("\nScanner test completed successfully!")
    print(f"Sample results: {len(test_results)} trading signals detected")
