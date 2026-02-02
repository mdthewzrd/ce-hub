"""
Test script to validate that Renata now generates code with vectorized filtering pattern
"""
import requests
import json

# Read the messy Backside B code
with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backside_b_MESSY_TEST.py', 'r') as f:
    messy_code = f.read()

print("=" * 80)
print("TESTING RENATA WITH UPDATED VECTORIZED FILTERING PROMPT")
print("=" * 80)
print()

# Call the Renata formatting API
url = "http://localhost:5665/api/renata/chat"
payload = {
    "message": f"""Format this code to use vectorized filtering:

```python
{messy_code}
```

DO NOT execute. DO NOT run scans. Just FORMAT the code with these patterns:
1. Vectorized filtering: mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
2. 3-stage architecture
3. Parallel workers

Please format this scanner code only."""
}

print("Sending request to Renata API...")
print()

try:
    response = requests.post(url, json=payload, timeout=120)
    response.raise_for_status()

    result = response.json()

    # Extract the generated code
    if "message" in result:
        generated_code = result["message"]
    elif "data" in result and "formattedCode" in result["data"]:
        generated_code = result["data"]["formattedCode"]
    elif "data" in result and "code" in result["data"]:
        generated_code = result["data"]["code"]
    else:
        print("❌ Unexpected response format:")
        print(json.dumps(result, indent=2))
        exit(1)

    # Save the generated code
    with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backside_b_VECTORIZED_TEST_OUTPUT.py', 'w') as f:
        f.write(generated_code)

    print("✅ Generated code saved to: backside_b_VECTORIZED_TEST_OUTPUT.py")
    print()

    # Check for vectorized filtering pattern
    print("=" * 80)
    print("VALIDATING GENERATED CODE")
    print("=" * 80)
    print()

    checks = {
        "Vectorized filtering pattern": False,
        "ABS window calculation": False,
        "3-stage architecture": False,
        "Parallel workers": False,
        "Grouped endpoint": False
    }

    # Check for vectorized filtering (more flexible matching)
    has_vectorized_filtering = (
        "mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)" in generated_code or
        "mask = (ticker_df[\"date\"] > wstart) & (ticker_df[\"date\"] <= cutoff)" in generated_code or
        ("mask = (ticker_df['date'] > wstart)" in generated_code and "ticker_df.loc[mask]" in generated_code)
    )

    if has_vectorized_filtering:
        checks["Vectorized filtering pattern"] = True
        print("✅ PASS: Vectorized filtering pattern found")
    else:
        print("❌ FAIL: Vectorized filtering pattern NOT found")
        print("   Expected: mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)")

    # Check for ABS window calculation (more flexible matching)
    has_abs_window = (
        "cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])" in generated_code or
        "cutoff = d0 - pd.Timedelta(days=self.params[\"abs_exclude_days\"])" in generated_code or
        "cutoff = d0 - pd.Timedelta(days=self.backside_params['abs_exclude_days'])" in generated_code or
        "cutoff = d0 - pd.Timedelta(days=self.backside_params[\"abs_exclude_days\"])" in generated_code
    )

    if has_abs_window:
        checks["ABS window calculation"] = True
        print("✅ PASS: ABS window calculation found")
    else:
        print("❌ FAIL: ABS window calculation NOT found")

    # Check for 3-stage architecture (multiple naming conventions)
    has_3stage = (
        ("compute_simple_features" in generated_code and "compute_full_features" in generated_code) or
        ("add_simple_features" in generated_code and "add_full_features" in generated_code) or
        ("STAGE 1:" in generated_code and "STAGE 2A:" in generated_code and "STAGE 3A:" in generated_code)
    )

    if has_3stage:
        checks["3-stage architecture"] = True
        print("✅ PASS: 3-stage architecture found")
    else:
        print("❌ FAIL: 3-stage architecture NOT found")

    # Check for parallel workers
    if "stage1_workers" in generated_code or "stage3_workers" in generated_code:
        checks["Parallel workers"] = True
        print("✅ PASS: Parallel workers found")
    else:
        print("❌ FAIL: Parallel workers NOT found")

    # Check for grouped endpoint
    if "/v2/aggs/grouped/locale/us/market/stocks/" in generated_code:
        checks["Grouped endpoint"] = True
        print("✅ PASS: Grouped endpoint found")
    else:
        print("❌ FAIL: Grouped endpoint NOT found")

    print()
    print("=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    print()

    total = len(checks)
    passed = sum(checks.values())
    failed = total - passed

    for check, result in checks.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {check}")

    print()
    print(f"Total: {passed}/{total} checks passed")

    if passed == total:
        print()
        print("🎉 SUCCESS: All checks passed!")
        print()
        print("Next step: Run full year test to validate performance (~30 minutes, ~47 signals)")
    else:
        print()
        print(f"⚠️  WARNING: {failed} checks failed")
        print()
        print("The generated code may not match template performance.")

except requests.exceptions.RequestException as e:
    print(f"❌ Error calling Renata API: {e}")
    print()
    print("Make sure the development server is running on port 5665")
    exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
