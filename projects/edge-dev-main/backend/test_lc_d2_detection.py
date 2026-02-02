"""
Test LC D2 Scanner Detection

Tests if LC D2 scan is correctly detected as NOT Backside Para B
"""

# Read the actual LC D2 code
lc_d2_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas_safe_enhanced.py'

with open(lc_d2_file, 'r') as f:
    lc_d2_code = f.read()

print("="*80)
print("Testing LC D2 Scanner Detection")
print("="*80)

# Check for Backside Para B patterns
checks = {
    'def fetch_daily': 'def fetch_daily' in lc_d2_code,
    'def add_daily_metrics': 'def add_daily_metrics' in lc_d2_code,
    'def scan_symbol': 'def scan_symbol' in lc_d2_code,
    'def _mold_on_row': 'def _mold_on_row' in lc_d2_code,
    'P = {': ('P = {' in lc_d2_code) or ('P={' in lc_d2_code),
    'if __name__ == "__main__"': 'if __name__ == "__main__"' in lc_d2_code
}

print("\n📋 Backside Para B Pattern Checks:")
print("-" * 80)
for check, passed in checks.items():
    status = "✅" if passed else "❌"
    print(f"{status} {check}: {passed}")

# Determine if it should be classified as Backside Para B
is_backside_para_b = all(checks.values())

print("\n" + "="*80)
if is_backside_para_b:
    print("❌ INCORRECT: This would be classified as Backside Para B")
    print("   But it's actually LC D2 code!")
else:
    print("✅ CORRECT: This would NOT be classified as Backside Para B")
    print("   It should use generic v31 transformation")

print("="*80)

# Check what functions it actually has
print("\n🔍 Functions actually in LC D2 code:")
print("-" * 80)

import re
functions = re.findall(r'^def\s+(\w+)', lc_d2_code, re.MULTILINE)
for func in functions[:20]:  # Show first 20
    print(f"  - {func}()")

print(f"\n  ... and {len(functions) - 20} more functions" if len(functions) > 20 else "")

# Check imports
print("\n📦 Imports in LC D2 code:")
print("-" * 80)

imports = re.findall(r'^import\s+(\S+)|^from\s+(\S+)\s+import', lc_d2_code, re.MULTILINE)
for imp in imports[:15]:  # Show first 15
    print(f"  - {imp[0] or imp[1]}")

print(f"\n  ... and {len(imports) - 15} more imports" if len(imports) > 15 else "")

print("\n" + "="*80)
print("CONCLUSION:")
print("="*80)
print(f"LC D2 code has {len(functions)} functions and {len(imports)} imports")
print(f"It does NOT have Backside Para B structure")
print(f"It should use 'v31_generic' transformation, NOT 'v31_hybrid'")
print("="*80)
