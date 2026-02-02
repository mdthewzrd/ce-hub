"""
Test Renata V2 Bug Detection and Fixing

This script tests if Renata V2 correctly detects and fixes the dol_v_cum5_1 bug
"""
import sys
from pathlib import Path

# Add RENATA_V2 to path
renata_v2_path = Path(__file__).parent.parent / "RENATA_V2"
sys.path.insert(0, str(renata_v2_path.parent))

from RENATA_V2.core.transformer import RenataTransformer

# Read the original scanner with the bug
original_scanner_path = Path("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py")

print("=" * 80)
print("Testing Renata V2 Bug Detection and Fixing")
print("=" * 80)

with open(original_scanner_path, 'r') as f:
    source_code = f.read()

# Check if the bug exists in the original
print("\n1️⃣ Checking original scanner for bugs...")
if "df['dol_v3'] + df['dol_v3']" in source_code:
    print("   ✅ BUG FOUND: dol_v3 + dol_v3 copy-paste error exists in original")
else:
    print("   ❌ BUG NOT FOUND: Original doesn't have the expected bug")

# Initialize Renata V2 transformer
print("\n2️⃣ Initializing Renata V2 transformer...")
transformer = RenataTransformer()

# Test the bug fixing method directly
print("\n3️⃣ Testing _fix_common_indicator_bugs method...")

# Extract a snippet with the bug
buggy_code = """
    df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)
    df['dol_v2'] = df.groupby('ticker')['dol_v'].shift(2)
    df['dol_v3'] = df.groupby('ticker')['dol_v'].shift(3)
    df['dol_v4'] = df.groupby('ticker')['dol_v'].shift(4)
    df['dol_v5'] = df.groupby('ticker')['dol_v'].shift(5)

    df['dol_v_cum5_1'] = df['dol_v1'] + df['dol_v2'] + df['dol_v3'] + df['dol_v3'] + df['dol_v5']
"""

print("   Original buggy code:")
print("   " + "-" * 70)
for line in buggy_code.strip().split('\n'):
    print(f"   {line}")
print("   " + "-" * 70)

# Apply the bug fix
fixed_code = transformer._fix_common_indicator_bugs(buggy_code)

print("\n   Fixed code:")
print("   " + "-" * 70)
for line in fixed_code.strip().split('\n'):
    print(f"   {line}")
print("   " + "-" * 70)

# Check if the bug was fixed
if "df['dol_v3'] + df['dol_v4']" in fixed_code:
    print("\n   ✅ SUCCESS: Bug was fixed! dol_v3 + dol_v3 → dol_v3 + dol_v4")
elif "df['dol_v3'] + df['dol_v3']" in fixed_code:
    print("\n   ❌ FAILURE: Bug still exists! dol_v3 + dol_v3 not fixed")
else:
    print("\n   ⚠️  WARNING: Unexpected result - bug pattern changed")

print("\n" + "=" * 80)
print("Test Complete")
print("=" * 80)
