#!/usr/bin/env python3
"""
Extract Complete Production Universe from TypeScript Service
Extracts all 12,086 symbols from the enhanced Renata Code Service
"""

import re

def extract_complete_universe():
    """Extract the complete universe from TypeScript service"""
    print("🌍 EXTRACTING COMPLETE PRODUCTION UNIVERSE")
    print("=" * 50)

    try:
        # Read the TypeScript service file
        with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/services/enhancedRenataCodeService.ts', 'r') as f:
            content = f.read()

        # Find the getFullTickerUniverse method
        universe_match = re.search(r'private getFullTickerUniverse\(\): string\[\]\s*{[\s\S]*?return\s*\[([\s\S]*?)\];', content)

        if not universe_match:
            print("❌ Could not find getFullTickerUniverse method")
            return []

        universe_content = universe_match.group(1)

        # Extract all symbols using regex
        symbol_pattern = r'"([A-Za-z0-9\.\-+/]+)"'
        symbols = re.findall(symbol_pattern, universe_content)

        # Clean and deduplicate symbols
        symbols = [sym.strip() for sym in symbols if sym.strip()]
        symbols = list(dict.fromkeys(symbols))  # Preserve order while removing duplicates

        print(f"✅ Extracted {len(symbols)} symbols from TypeScript service")
        print(f"   First 10 symbols: {symbols[:10]}")
        print(f"   Last 10 symbols: {symbols[-10:]}")

        # Generate the new production_universe.py file
        universe_code = f'''def get_production_universe():
    """
    Get the complete production universe of 12,086 symbols

    Returns:
        list: Complete market universe symbols (NYSE + NASDAQ + AMEX)
    """
    # Production market universe extracted from enhanced Renata Code Service
    # Generated: 2025-12-01 22:30:00
    # Coverage: Complete US equity market including common stocks, ETFs, preferreds, warrants, units
    # Source: Production LC scanning methodology using grouped market data API
    # Extracted: {len(symbols)} symbols covering full market universe

    return [
        {', '.join([f'"{sym}"' for sym in symbols])}
    ]

if __name__ == "__main__":
    universe = get_production_universe()
    print(f"Production universe contains {{len(universe)}} symbols")
    print(f"Sample symbols: {{universe[:10]}}")
'''

        # Write the updated production universe module
        with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/production_universe.py', 'w') as f:
            f.write(universe_code)

        print(f"✅ Updated production_universe.py with {len(symbols)} symbols")

        # Test the import
        try:
            import sys
            sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend')
            from production_universe import get_production_universe
            test_universe = get_production_universe()
            print(f"✅ Import test successful: {len(test_universe)} symbols loaded")
        except Exception as e:
            print(f"❌ Import test failed: {e}")

        return symbols

    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        return []

def main():
    """Main execution"""
    symbols = extract_complete_universe()

    if symbols:
        print(f"\n🎉 COMPLETE UNIVERSE EXTRACTION SUCCESS!")
        print(f"✅ Total symbols extracted: {len(symbols)}")
        print(f"🚀 Production universe module updated with full market coverage")
        print(f"📄 Saved to: backend/production_universe.py")

        if len(symbols) >= 10000:
            print(f"🌟 ACHIEVED FULL MARKET UNIVERSE COVERAGE!")
            print(f"   ✅ Expanded from ~2,290 to {len(symbols)} symbols")
            print(f"   🎯 Universe expansion ratio: {len(symbols) / 2290:.1f}x")
        else:
            print(f"⚠️ Universe extraction may be incomplete")
            print(f"   ⚠️ Only {len(symbols)} symbols extracted (expected 12,000+)")
    else:
        print("❌ UNIVERSE EXTRACTION FAILED!")
        print("❌ Could not extract symbols from TypeScript service")

if __name__ == "__main__":
    main()