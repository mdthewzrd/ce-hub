"""
Test smart filters are working correctly
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates')

from sc_dmr.formatted import UltraFastRenataSCDMRMultiScanner
from lc_d2.formatted import UltraFastRenataLCD2MultiScanner

print("="*80)
print("TESTING SMART FILTERS")
print("="*80)

# Test SC DMR
print("\n[SC DMR] Testing smart filters...")
sc_dmr = UltraFastRenataSCDMRMultiScanner()
sc_smart_params = sc_dmr._extract_smart_filter_params(sc_dmr.mass_params)

# Test with a known liquid ticker (AAPL)
print(f"Testing AAPL with params: {sc_smart_params}")
result = sc_dmr._apply_smart_filters("AAPL", sc_smart_params)
print(f"  Result: {'✅ PASS' if result else '❌ FAIL'}")

# Test with another ticker
result = sc_dmr._apply_smart_filters("NVDA", sc_smart_params)
print(f"  NVDA Result: {'✅ PASS' if result else '❌ FAIL'}")

# Test LC D2
print("\n[LC D2] Testing smart filters...")
lc_d2 = UltraFastRenataLCD2MultiScanner()
lc_smart_params = lc_d2._extract_smart_filter_params(lc_d2.mass_params)

# Test with a known large cap ticker (AAPL)
print(f"Testing AAPL with params: {lc_smart_params}")
result = lc_d2._apply_smart_filters("AAPL", lc_smart_params)
print(f"  Result: {'✅ PASS' if result else '❌ FAIL'}")

# Test with another large cap
result = lc_d2._apply_smart_filters("MSFT", lc_smart_params)
print(f"  MSFT Result: {'✅ PASS' if result else '❌ FAIL'}")

# Test with a smaller ticker that might not pass
result = lc_d2._apply_smart_filters("SLSN", lc_smart_params)
print(f"  SLSN Result: {'✅ PASS' if result else '❌ FAIL (expected - small cap)'}")

print("\n" + "="*80)
print("SMART FILTER TEST COMPLETE")
print("="*80)
