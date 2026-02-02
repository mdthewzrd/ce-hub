#!/usr/bin/env python3
"""
Fix for broken pattern_assignments in V31 formatted scanners (v2)

The bug: Pattern logic has inconsistent column references.
The fix: Remove ALL df[' prefixes for df.eval() compatibility.
"""

import re

def fix_pattern_assignments(code: str) -> str:
    """
    Fix pattern_assignments by removing df[' prefix for df.eval() compatibility

    Args:
        code: The formatted scanner code with broken pattern_assignments

    Returns:
        Fixed code with correct pattern logic for df.eval()
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

    # Fix by removing ALL df[' prefixes and closing brackets
    # This is the correct format for df.eval()
    def fix_logic(match):
        logic = match.group(1)

        # Remove all df['...' and make them bare column names
        fixed_logic = re.sub(r"df\['([^']+)'\]", r'\1', logic)

        return fixed_logic

    # Apply the fix to each pattern's logic
    fixed_patterns = re.sub(
        r'"logic":\s*"([^"]*(?:h>|l>|c_>|o_>|v_>|high_|low_|close_|open_|gap_|high_pct_|pct_chg|dist_|ema_|highest_|lowest_|c_ua|l_ua|v_ua|dol_|range|rvol|atr|true_|close_|d1_|high_chg)[^"]*)"',
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
        output_file = input_file.replace('.py', '_fixed_v2.py')

    with open(output_file, 'w') as f:
        f.write(fixed_code)

    print(f"✅ Fixed scanner saved to: {output_file}")

    # Show what was fixed
    print("\n📊 Fixed patterns:")
    print("="*60)

    # Extract and display a sample of the fixed logic
    import re
    patterns = re.findall(r'"name":\s*"([^"]+)".*?"logic":\s*"([^"]{100,}?)"', fixed_code, re.DOTALL)
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
        output_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/Lc_D2_Scan_Oct_25_New_Ideas_Project_scanner_FIXED_V2.py'

    try:
        result_file = fix_formatted_scanner(input_file, output_file)
        print(f"\n✅ SUCCESS! Fixed scanner ready at: {result_file}")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
