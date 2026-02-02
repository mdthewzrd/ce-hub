"""
Test Renata V2 Bug Detection Direct Test

This script tests the bug fixing logic directly without initializing the transformer
"""
import re

def _fix_common_indicator_bugs(indicator_code: str) -> str:
    """
    Fix common bugs and errors in indicator computation code

    This method detects and fixes:
    1. Copy-paste errors (e.g., dol_v3 repeated instead of dol_v4)
    2. Missing column dependencies
    3. Common typos in variable names
    """
    if not indicator_code:
        return indicator_code

    print(f"      🔍 Scanning for common bugs...")

    fixed_code = indicator_code
    fixes_applied = []

    # Fix 1: dol_v_cum5_1 copy-paste error - MORE ROBUST PATTERN
    # Matches: df['dol_v_cum5_1'] = ... + df['dol_v3'] + df['dol_v3'] + ...
    dol_v_patterns = [
        r"dol_v_cum5_1.*?dol_v1.*?dol_v2.*?dol_v3.*?\+.*?dol_v3",
        r"df\[['\"]dol_v_cum5_1['\"]\].*?df\[['\"]dol_v3['\"]\].*?\+.*?df\[['\"]dol_v3['\"]\]",
    ]

    for pattern in dol_v_patterns:
        if re.search(pattern, fixed_code, re.DOTALL):
            print(f"      🔧 Found dol_v_cum5_1 bug pattern!")
            # Fix by replacing the second occurrence of dol_v3 with dol_v4
            fixed_code = re.sub(
                r"(df\[['\"]dol_v3['\"]\])\s*\+\s*(df\[['\"]dol_v3['\"]\])",
                r"\1 + df['dol_v4']",
                fixed_code,
                count=1
            )
            fixes_applied.append("Fixed dol_v_cum5_1 copy-paste error (dol_v3→dol_v4)")
            break

    # Fix 2: Check for other repeated column patterns
    all_columns = re.findall(r"df\[['\"](\w+)['\"]\]", fixed_code)
    seen_pairs = set()

    for i in range(len(all_columns) - 1):
        col1 = all_columns[i]
        col2 = all_columns[i + 1]
        pair = (col1, col2)

        if pair in seen_pairs:
            # Found a repeated pattern
            num_match = re.search(r'(\D+)(\d+)', col1)
            if num_match and col1 == col2:
                base = num_match.group(1)
                num = int(num_match.group(2))
                next_col = f"{base}{num + 1}"

                pattern_to_fix = rf"df\[['\"]{re.escape(col1)}['\"]\]\s*\+\s*df\[['\"]{re.escape(col2)}['\"]\]"
                replacement = rf"df['{col1}'] + df['{next_col}']"

                if pattern_to_fix in fixed_code:
                    fixed_code = re.sub(pattern_to_fix, replacement, fixed_code, count=1)
                    fixes_applied.append(f"Fixed repeated column pattern ({col1}→{next_col})")

        seen_pairs.add(pair)

    # Fix 3: Validate column creation order
    if "c_ua" in fixed_code and "l_ua" in fixed_code:
        try:
            c_ua_pos = fixed_code.index("c_ua")
            l_ua_pos = fixed_code.index("l_ua")
            if c_ua_pos < l_ua_pos:
                if "df['l_ua'] = df['l']" not in fixed_code:
                    fixes_applied.append("Warning: c_ua used before l_ua initialization (handled by template)")
        except ValueError:
            pass

    if fixes_applied:
        print(f"      ✅ Applied {len(fixes_applied)} fixes:")
        for fix in fixes_applied:
            print(f"         • {fix}")
    else:
        print(f"      ℹ️  No common bugs found")

    return fixed_code


# Test with the buggy code
print("=" * 80)
print("Testing Bug Detection and Fixing Logic")
print("=" * 80)

buggy_code = """
    df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)
    df['dol_v2'] = df.groupby('ticker')['dol_v'].shift(2)
    df['dol_v3'] = df.groupby('ticker')['dol_v'].shift(3)
    df['dol_v4'] = df.groupby('ticker')['dol_v'].shift(4)
    df['dol_v5'] = df.groupby('ticker')['dol_v'].shift(5)

    df['dol_v_cum5_1'] = df['dol_v1'] + df['dol_v2'] + df['dol_v3'] + df['dol_v3'] + df['dol_v5']
"""

print("\n📝 Original buggy code:")
print("   " + "-" * 70)
for line in buggy_code.strip().split('\n'):
    print(f"   {line}")
print("   " + "-" * 70)

# Apply the bug fix
print("\n🔧 Applying bug fixes...")
fixed_code = _fix_common_indicator_bugs(buggy_code)

print("\n✅ Fixed code:")
print("   " + "-" * 70)
for line in fixed_code.strip().split('\n'):
    print(f"   {line}")
print("   " + "-" * 70)

# Check if the bug was fixed
if "df['dol_v3'] + df['dol_v4']" in fixed_code:
    print("\n🎉 SUCCESS: Bug was fixed!")
    print("   • dol_v3 + dol_v3 → dol_v3 + dol_v4")
elif "df['dol_v3'] + df['dol_v3']" in fixed_code:
    print("\n❌ FAILURE: Bug still exists!")
else:
    print("\n⚠️  WARNING: Unexpected result")

print("\n" + "=" * 80)
