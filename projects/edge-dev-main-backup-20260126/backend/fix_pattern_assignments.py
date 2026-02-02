#!/usr/bin/env python3
"""
Fix for broken pattern_assignments in V31 formatted scanners

The bug: Pattern logic strings are missing 'df[' prefix, causing df.eval() to fail.
The fix: Restore proper DataFrame column references in pattern logic.
"""

import re

def fix_pattern_assignments(code: str) -> str:
    """
    Fix pattern_assignments by restoring df['col'] format

    Args:
        code: The formatted scanner code with broken pattern_assignments

    Returns:
        Fixed code with correct pattern logic
    """

    # Find the pattern_assignments section
    pattern_match = re.search(
        r'self\.pattern_assignments = \[(.*?)\]',
        code,
        re.DOTALL
    )

    if not pattern_match:
        print("No pattern_assignments found - nothing to fix")
        return code

    patterns_str = pattern_match.group(1)

    # Fix each pattern's logic by adding df[' around column references
    def fix_logic(match):
        logic = match.group(1)

        # List of column names that need df[' prefix
        # Based on the original scanner's indicator names
        columns_to_fix = [
            'h', 'h1', 'h2', 'h3',
            'l', 'l1', 'l2',
            'c', 'c1', 'c2', 'c3',
            'o', 'o1', 'o2',
            'v', 'v1', 'v2',
            'high', 'high1', 'high2', 'high3',
            'low', 'low1', 'low2',
            'close', 'close1', 'close2',
            'open', 'open1', 'open2',
            'ticker', 'date',
            'gap_pct', 'gap_pct1', 'gap_pct2',
            'gap_atr', 'gap_atr1', 'gap_atr2',
            'high_pct_chg', 'high_pct_chg1', 'high_pct_chg2',
            'pct_chg', 'pct_chg1',
            'high_chg', 'high_chg1', 'high_chg2',
            'high_chg_atr', 'high_chg_atr1', 'high_chg_atr2',
            'dist_h_9ema', 'dist_h_20ema', 'dist_h_50ema',
            'dist_h_9ema_atr', 'dist_h_20ema_atr',
            'dist_l_9ema', 'dist_l_20ema',
            'dist_l_9ema_atr',
            'ema9', 'ema20', 'ema50', 'ema200',
            'highest_high_5', 'highest_high_20',
            'highest_high_5_1', 'highest_high_20_1',
            'lowest_low_5', 'lowest_low_20', 'lowest_low_30',
            'lowest_low_20_1', 'lowest_low_20_2',
            'c_ua', 'c_ua1', 'l_ua', 'v_ua', 'v_ua1',
            'dol_v', 'dol_v1', 'dol_v_cum5_1',
            'h_dist_to_lowest_low_20_pct',
            'highest_high_5_dist_to_lowest_low_20_pct_1',
            'h_dist_to_highest_high_20_1_atr',
            'h_dist_to_highest_high_20_2_atr',
            'dist_h_9ema_atr1', 'dist_h_20ema_atr1',
            'close_range', 'close_range1', 'close_range2',
            'd1_range',
            'atr', 'true_range',
            'range', 'range1', 'range2',
            'rvol', 'rvol1',
        ]

        fixed_logic = logic
        for col in columns_to_fix:
            # Match: column_name followed by comparison or operator
            # Avoid double-fixing
            pattern = r'\b(' + col + r')\s*([><=!]+|\))'
            # Only fix if not already df['col'] format
            if not re.search(r'df\[\'' + col + r'\'\]', fixed_logic):
                fixed_logic = re.sub(
                    pattern,
                    r"df['\1']\2",
                    fixed_logic
                )

        return fixed_logic

    # Apply the fix to each pattern's logic
    fixed_patterns = re.sub(
        r'"logic":\s*"([^"]*(?:h>|l>|c_>|o_>|v_>|high_|low_|close_|open_|gap_|high_pct_|pct_chg|dist_|ema_|highest_|lowest_|c_ua|l_ua|v_ua|dol_|range|rvol|atr|true_|close_|d1_)[^"]*)"',
        lambda m: '"logic": "' + fix_logic(m) + '"',
        patterns_str,
        flags=re.DOTALL
    )

    # Replace the old pattern_assignments with the fixed version
    fixed_code = code[:pattern_match.start()] + 'self.pattern_assignments = [' + fixed_patterns + ']' + code[pattern_match.end():]

    return fixed_code


def fix_formatted_scanner(input_file: str, output_file: str = None):
    """
    Fix a formatted V31 scanner by correcting pattern_assignments

    Args:
        input_file: Path to the broken formatted scanner
        output_file: Path to save the fixed scanner (optional)
    """

    # Read the broken scanner
    with open(input_file, 'r') as f:
        code = f.read()

    print(f"Fixing pattern_assignments in {input_file}...")

    # Apply the fix
    fixed_code = fix_pattern_assignments(code)

    # Save the fixed code
    if output_file is None:
        output_file = input_file.replace('.py', '_fixed.py')

    with open(output_file, 'w') as f:
        f.write(fixed_code)

    print(f"✅ Fixed scanner saved to: {output_file}")

    # Show what was fixed
    print("\n📊 Fixed patterns:")
    print("="*60)

    # Extract and display a sample of the fixed logic
    import re
    patterns = re.findall(r'"name":\s*"([^"]+)".*?"logic":\s*"([^"]{100,}?)",', fixed_code, re.DOTALL)
    for i, (name, logic) in enumerate(patterns[:3], 1):
        print(f"\n{i}. {name}")
        print(f"   Logic preview: {logic[:150]}...")

    return output_file


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
    else:
        # Default to the user's file
        input_file = '/Users/michaeldurante/Downloads/Lc_D2_Scan_Oct_25_New_Ideas_Project_scanner (5).py'
        output_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/Lc_D2_Scan_Oct_25_New_Ideas_Project_scanner_FIXED.py'

    try:
        result_file = fix_formatted_scanner(input_file, output_file)
        print(f"\n✅ SUCCESS! Fixed scanner ready at: {result_file}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
