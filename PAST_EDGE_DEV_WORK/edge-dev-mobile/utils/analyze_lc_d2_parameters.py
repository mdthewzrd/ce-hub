#!/usr/bin/env python3
"""
🔍 Analyze LC D2 Scanner Trading Parameters
Extract the actual trading parameters from conditional expressions instead of assignments
"""

import re
from collections import defaultdict

def extract_trading_parameters_from_conditionals(code):
    """
    Extract actual trading parameters from conditional expressions in scanner code
    """
    print("🔍 ANALYZING LC D2 TRADING PARAMETERS")
    print("=" * 80)

    # Dictionary to store parameters and their threshold values
    parameters = defaultdict(set)

    # Pattern 1: Direct threshold comparisons (e.g., atr_mult >= 3)
    print("\n📊 Pattern 1: Direct threshold comparisons")
    threshold_pattern = r'(\w+)\s*(>=|<=|>|<)\s*([\d.]+)'
    threshold_matches = re.findall(threshold_pattern, code)

    trading_keywords = {
        'atr_mult', 'ema_dev', 'rvol', 'gap', 'gap_atr', 'gap_atr1', 'gap_atr2',
        'parabolic_score', 'close_range', 'close_range1', 'high_pct_chg', 'high_pct_chg1', 'high_pct_chg2',
        'c_ua', 'c_ua1', 'v_ua', 'v_ua1', 'dol_v', 'dol_v1', 'high_chg_atr', 'high_chg_atr1',
        'dist_h_9ema_atr', 'dist_h_9ema_atr1', 'dist_h_20ema_atr', 'dist_h_50ema_atr'
    }

    for param_name, operator, value in threshold_matches:
        if param_name in trading_keywords:
            parameters[param_name].add(float(value))
            print(f"   Found: {param_name} {operator} {value}")

    # Pattern 2: Parenthetical threshold ranges (e.g., (atr_mult >= 2) & (atr_mult < 3))
    print("\n📊 Pattern 2: Parenthetical threshold ranges")
    range_pattern = r'\(\s*(\w+)\s*(>=|<=|>|<)\s*([\d.]+)\s*\)\s*&\s*\(\s*\1\s*(>=|<=|>|<)\s*([\d.]+)\s*\)'
    range_matches = re.findall(range_pattern, code)

    for param_name, op1, val1, op2, val2 in range_matches:
        if param_name in trading_keywords:
            parameters[param_name].add(float(val1))
            parameters[param_name].add(float(val2))
            print(f"   Found range: {param_name} between {val1} and {val2}")

    # Pattern 3: Multi-condition expressions in complex conditionals
    print("\n📊 Pattern 3: Complex multi-condition expressions")
    # Look for patterns like: (df['high_pct_chg1'] >= .5) & (df['c_ua1'] >= 5)
    complex_pattern = r"df\['(\w+)'\]\s*(>=|<=|>|<)\s*([\d.]+)"
    complex_matches = re.findall(complex_pattern, code)

    for param_name, operator, value in complex_matches:
        if param_name in trading_keywords:
            parameters[param_name].add(float(value))
            print(f"   Found complex: {param_name} {operator} {value}")

    print(f"\n📊 SUMMARY OF DETECTED TRADING PARAMETERS")
    print("=" * 60)

    # Create final parameter dictionary with meaningful names and values
    final_parameters = {}

    for param_name, values in parameters.items():
        sorted_values = sorted(list(values))

        if len(sorted_values) == 1:
            # Single threshold value
            final_parameters[f"{param_name}_threshold"] = sorted_values[0]
        else:
            # Multiple threshold values - use primary/max threshold
            final_parameters[f"{param_name}_max_threshold"] = max(sorted_values)
            final_parameters[f"{param_name}_min_threshold"] = min(sorted_values)

        print(f"📋 {param_name}: {sorted_values}")

    print(f"\n📊 FINAL PARAMETER EXTRACTION RESULT")
    print("=" * 60)
    for key, value in final_parameters.items():
        print(f"   {key}: {value}")

    return final_parameters

if __name__ == "__main__":
    # Load the LC D2 scanner file
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(code)} characters")
        parameters = extract_trading_parameters_from_conditionals(code)

        print(f"\n✅ Extracted {len(parameters)} meaningful trading parameters")
        print("These should replace the generic 'rolling_window' parameters in the frontend!")

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
    except Exception as e:
        print(f"❌ Error: {e}")