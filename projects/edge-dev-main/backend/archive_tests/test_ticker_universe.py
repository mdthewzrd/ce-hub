"""
Test that SC DMR and LC D2 fetch the full 12,000+ ticker universe from Polygon
"""

import sys
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates')

from sc_dmr.formatted import UltraFastRenataSCDMRMultiScanner
from lc_d2.formatted import UltraFastRenataLCD2MultiScanner

print("="*80)
print("TESTING POLYGON SNAPSHOT ENDPOINT - 12,000+ TICKER UNIVERSE")
print("="*80)

# Test SC DMR
print("\n[SC DMR] Fetching ticker universe from Polygon...")
sc_dmr = UltraFastRenataSCDMRMultiScanner()
sc_tickers = sc_dmr._fetch_market_universe()

if sc_tickers:
    print(f"  ✅ Fetched {len(sc_tickers):,} tickers from Polygon snapshot")
    print(f"  📊 Sample tickers: {sc_tickers[:10]}")
else:
    print(f"  ❌ Failed to fetch from Polygon")
    print(f"  🔄 Would fallback to {len(sc_dmr.default_tickers)} default tickers")

# Test LC D2
print("\n[LC D2] Fetching ticker universe from Polygon...")
lc_d2 = UltraFastRenataLCD2MultiScanner()
lc_tickers = lc_d2._fetch_market_universe()

if lc_tickers:
    print(f"  ✅ Fetched {len(lc_tickers):,} tickers from Polygon snapshot")
    print(f"  📊 Sample tickers: {lc_tickers[:10]}")
else:
    print(f"  ❌ Failed to fetch from Polygon")
    print(f"  🔄 Would fallback to {len(lc_d2.default_tickers)} default tickers")

# Verify 12,000+ tickers
print("\n" + "="*80)
if sc_tickers and len(sc_tickers) >= 10000:
    print(f"✅ SC DMR: Full ticker universe ({len(sc_tickers):,} tickers)")
elif sc_tickers:
    print(f"⚠️  SC DMR: Reduced ticker universe ({len(sc_tickers):,} tickers)")
else:
    print(f"❌ SC DMR: Using fallback default list")

if lc_tickers and len(lc_tickers) >= 10000:
    print(f"✅ LC D2: Full ticker universe ({len(lc_tickers):,} tickers)")
elif lc_tickers:
    print(f"⚠️  LC D2: Reduced ticker universe ({len(lc_tickers):,} tickers)")
else:
    print(f"❌ LC D2: Using fallback default list")
print("="*80)
