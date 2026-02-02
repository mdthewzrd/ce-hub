#!/usr/bin/env python3
"""
🎯 Extract Core Scan Filters
Extract only the actual trading filters used in the scanner logic, not technical indicators
"""

import re

def extract_core_scan_filters(code):
    """
    Extract the core scan filters - the actual trading criteria used to screen stocks
    """
    print("🎯 EXTRACTING CORE SCAN FILTERS")
    print("=" * 60)

    # Define the core scan filter keywords (actual trading logic, not technical indicators)
    core_filter_keywords = {
        'atr_mult', 'ema_dev', 'rvol', 'gap', 'gap_atr', 'parabolic_score',
        'close_range', 'high_pct_chg', 'c_ua', 'v_ua', 'dol_v'
    }

    scan_filters = {}

    # Pattern 1: Direct filter conditions (variable >= value)
    print("🔍 Looking for direct filter conditions...")
    direct_pattern = r'(\w+)\s*(>=|<=|>|<)\s*([\d.]+)'
    direct_matches = re.findall(direct_pattern, code)

    for param_name, operator, value in direct_matches:
        if param_name in core_filter_keywords:
            filter_key = f"{param_name}_{operator.replace('>=', 'min').replace('<=', 'max').replace('>', 'above').replace('<', 'below')}"
            scan_filters[filter_key] = float(value)

    # Pattern 2: DataFrame column filters (df['param'] >= value)
    print("🔍 Looking for DataFrame column filters...")
    df_pattern = r"df\['(\w+)'\]\s*(>=|<=|>|<)\s*([\d.]+)"
    df_matches = re.findall(df_pattern, code)

    for param_name, operator, value in df_matches:
        if param_name in core_filter_keywords:
            filter_key = f"{param_name}_{operator.replace('>=', 'min').replace('<=', 'max').replace('>', 'above').replace('<', 'below')}"
            scan_filters[filter_key] = float(value)

    # Pattern 3: Conditional range filters (value >= X) & (value < Y)
    print("🔍 Looking for range filters...")
    range_pattern = r'(\w+)\s*>=\s*([\d.]+)[^<]*<\s*([\d.]+)'
    range_matches = re.findall(range_pattern, code)

    for param_name, min_val, max_val in range_matches:
        if param_name in core_filter_keywords:
            scan_filters[f"{param_name}_range_min"] = float(min_val)
            scan_filters[f"{param_name}_range_max"] = float(max_val)

    # Remove duplicates and keep only the most significant filters
    core_filters = {}

    # Group by parameter name and keep key thresholds
    param_groups = {}
    for filter_key, value in scan_filters.items():
        param_base = filter_key.split('_')[0]  # Get base parameter name (atr_mult, rvol, etc.)
        if param_base not in param_groups:
            param_groups[param_base] = []
        param_groups[param_base].append((filter_key, value))

    # For each parameter, keep the most significant filter
    for param_base, filters in param_groups.items():
        if len(filters) == 1:
            # Single filter - keep it
            filter_key, value = filters[0]
            core_filters[filter_key] = value
        else:
            # Multiple filters - keep the primary one (usually the minimum threshold)
            min_filters = [f for f in filters if 'min' in f[0] or '>=' in f[0]]
            if min_filters:
                filter_key, value = min_filters[0]
                core_filters[f"{param_base}_filter"] = value
            else:
                # Fallback to first filter
                filter_key, value = filters[0]
                core_filters[filter_key] = value

    print(f"\n🎯 CORE SCAN FILTERS FOUND:")
    print("-" * 40)

    if core_filters:
        for filter_name, threshold in sorted(core_filters.items()):
            print(f"   📊 {filter_name}: {threshold}")
    else:
        print("   ❌ No core scan filters detected")

    print(f"\n📊 Total Core Filters: {len(core_filters)}")
    return core_filters

if __name__ == "__main__":
    # Load the LC D2 scanner file
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Analyzing: lc d2 scan - oct 25 new ideas.py")
        print(f"📄 File size: {len(code)} characters\n")

        filters = extract_core_scan_filters(code)

        if filters:
            print(f"\n✅ SUCCESS: Extracted {len(filters)} core scan filters")
            print("These are the actual trading criteria the scanner uses to screen stocks.")
        else:
            print(f"\n❌ No core scan filters found")
            print("The scanner might use a different pattern for defining filters.")

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
    except Exception as e:
        print(f"❌ Error: {e}")