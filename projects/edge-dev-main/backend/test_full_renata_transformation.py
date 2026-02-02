"""
Full Renata V2 Transformation Test

This script tests the complete transformation pipeline with the original LC D2 scanner
"""
import requests
import json
from pathlib import Path

# Read the original scanner
original_scanner_path = Path("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py")

print("=" * 80)
print("Testing Full Renata V2 Transformation Pipeline")
print("=" * 80)

with open(original_scanner_path, 'r') as f:
    source_code = f.read()

print(f"\n📂 Original scanner: {original_scanner_path.name}")
print(f"📏 Code size: {len(source_code)} characters")

# Check for bugs in original
print("\n1️⃣ Checking original scanner for known bugs...")
bugs_found = []

if "df['dol_v3'] + df['dol_v3']" in source_code:
    bugs_found.append("dol_v_cum5_1 copy-paste error (dol_v3 + dol_v3)")

if "df['v_ua'] = df['v']" in source_code:
    bugs_found.append("Duplicate v_ua column creation")

if "df['c_ua'] = df.groupby" in source_code:
    bugs_found.append("Duplicate c_ua column creation")

if bugs_found:
    print(f"   ✅ Found {len(bugs_found)} bugs in original:")
    for bug in bugs_found:
        print(f"      • {bug}")
else:
    print("   ℹ️  No known bugs found")

# Prepare transformation request
print("\n2️⃣ Preparing transformation request...")
request_payload = {
    "source_code": source_code,
    "scanner_name": "LC_D2_Scan_Fixed",
    "date_range": "2024-01-01 to 2024-12-31",
    "verbose": True
}

print(f"   📝 Scanner name: LC_D2_Scan_Fixed")
print(f"   📅 Date range: 2024-01-01 to 2024-12-31")

# Call Renata V2 API
print("\n3️⃣ Calling Renata V2 transformation API...")
print(f"   🔗 POST http://localhost:5666/api/renata_v2/transform")

try:
    response = requests.post(
        "http://localhost:5666/api/renata_v2/transform",
        json=request_payload,
        timeout=120  # 2 minute timeout
    )

    print(f"   📡 Response status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()

        print("\n✅ Transformation successful!")
        print(f"   📊 Success: {result['success']}")
        print(f"   🔧 Corrections made: {result.get('corrections_made', 0)}")

        # Check generated code
        generated_code = result.get('generated_code', '')

        print(f"\n4️⃣ Analyzing generated code...")
        print(f"   📏 Generated code size: {len(generated_code)} characters")

        # Check if bugs were fixed
        print("\n5️⃣ Verifying bug fixes...")

        verification_results = []

        # Check 1: dol_v_cum5_1 fix
        if "df['dol_v3'] + df['dol_v4']" in generated_code:
            verification_results.append(("dol_v_cum5_1 fix", "✅ FIXED"))
        elif "df['dol_v3'] + df['dol_v3']" in generated_code:
            verification_results.append(("dol_v_cum5_1 fix", "❌ STILL BROKEN"))
        else:
            verification_results.append(("dol_v_cum5_1 fix", "⚠️  NOT FOUND"))

        # Check 2: Duplicate column creation removed
        compute_indicators_section = generated_code
        if 'def compute_indicators1' in generated_code:
            # Extract the function
            start = generated_code.index("def compute_indicators1")
            # Find the next def or end of class
            next_def = generated_code.find("\n    def ", start + 1)
            if next_def == -1:
                next_def = len(generated_code)
            compute_indicators_section = generated_code[start:next_def]

        # Check for duplicate column creation in the function
        if "df['v_ua'] = df['v']" in compute_indicators_section:
            verification_results.append(("Duplicate v_ua removed", "❌ STILL PRESENT"))
        else:
            verification_results.append(("Duplicate v_ua removed", "✅ REMOVED"))

        if "df['c_ua'] = df.groupby" in compute_indicators_section:
            verification_results.append(("Duplicate c_ua removed", "❌ STILL PRESENT"))
        else:
            verification_results.append(("Duplicate c_ua removed", "✅ REMOVED"))

        # Check 3: v31 structure
        if "def fetch_grouped_data" in generated_code:
            verification_results.append(("v31 structure", "✅ PRESENT"))
        else:
            verification_results.append(("v31 structure", "❌ MISSING"))

        if "def run_pattern_detection" in generated_code:
            verification_results.append(("Pattern detection method", "✅ PRESENT"))
        else:
            verification_results.append(("Pattern detection method", "❌ MISSING"))

        # Print verification results
        for check, status in verification_results:
            print(f"   {status} {check}")

        # Save generated code to file
        output_path = Path("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/LC_D2_Scan_Fixed.py")
        with open(output_path, 'w') as f:
            f.write(generated_code)

        print(f"\n💾 Saved generated code to: {output_path}")

        # Final summary
        print("\n" + "=" * 80)
        print("TRANSFORMATION SUMMARY")
        print("=" * 80)

        all_fixed = all("✅" in status for _, status in verification_results)

        if all_fixed:
            print("🎉 ALL CHECKS PASSED!")
            print("   The generated code should work correctly.")
        else:
            print("⚠️  SOME ISSUES DETECTED")
            print("   Please review the verification results above.")

    else:
        print(f"\n❌ Transformation failed!")
        print(f"   Status code: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"   Error: {error_detail.get('detail', 'Unknown error')}")
        except:
            print(f"   Error: {response.text}")

except requests.exceptions.Timeout:
    print("\n⏱️  Request timed out after 120 seconds")
    print("   The transformation may take longer than expected")

except requests.exceptions.ConnectionError:
    print("\n🔌 Connection error - is the backend running?")
    print("   Try: cd backend && python main.py")

except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
