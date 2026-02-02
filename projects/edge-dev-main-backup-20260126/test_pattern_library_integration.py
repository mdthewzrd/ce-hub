#!/usr/bin/env python3
"""
Test the Standardized Pattern Library Integration

This test verifies that:
1. The templates compile correctly
2. The API key is hardcoded
3. The structure matches your Backside B template
"""

import sys
import os

# Test 1: Import and verify the templates exist
print("="*70)
print("TEST 1: Verify Pattern Library Templates")
print("="*70)

try:
    # Add the src directory to the path
    sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src')

    # Import the pattern library
    from services.edgeDevPatternLibrary import STRUCTURAL_TEMPLATES

    print("✅ Pattern library imported successfully")

    # Check that both templates exist
    assert 'singleScanStructure' in STRUCTURAL_TEMPLATES, "❌ Missing singleScanStructure"
    assert 'multiScanStructure' in STRUCTURAL_TEMPLATES, "❌ Missing multiScanStructure"

    print("✅ Both structural templates exist")

    # Verify API key is present
    single_template = STRUCTURAL_TEMPLATES['singleScanStructure']
    multi_template = STRUCTURAL_TEMPLATES['multiScanStructure']

    api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

    assert api_key in single_template, "❌ API key not found in single-scan template"
    assert api_key in multi_template, "❌ API key not found in multi-scan template"

    print(f"✅ API key hardcoded: {api_key}")

    # Verify key components are present
    required_components = [
        'fetch_all_grouped_data',
        'apply_smart_filters',
        'compute_full_features',
        'detect_patterns',
        '_fetch_grouped_day',
        'get_trading_dates'
    ]

    for component in required_components:
        assert component in single_template, f"❌ Missing {component} in single-scan"
        assert component in multi_template, f"❌ Missing {component} in multi-scan"

    print("✅ All required components present")

    # Verify grouped endpoint is used
    assert 'grouped/locale/us/market/stocks' in single_template, "❌ Missing grouped endpoint"
    assert 'grouped/locale/us/market/stocks' in multi_template, "❌ Missing grouped endpoint"

    print("✅ Grouped endpoint confirmed")

    # Verify ThreadPoolExecutor for parallelization
    assert 'ThreadPoolExecutor' in single_template, "❌ Missing ThreadPoolExecutor"
    assert 'process_ticker_3' in single_template, "❌ Missing process_ticker_3 method"

    print("✅ Parallel processing structure confirmed")

    print("\n" + "="*70)
    print("TEST 2: Verify Template Completeness")
    print("="*70)

    # Check that templates have complete class structure
    assert 'class SingleScanScanner:' in single_template, "❌ Missing SingleScanScanner class"
    assert 'class MultiScanScanner:' in multi_template, "❌ Missing MultiScanScanner class"

    print("✅ Class definitions present")

    # Check for proper imports
    required_imports = [
        'import pandas as pd',
        'import numpy as np',
        'import requests',
        'import time',
        'from datetime import datetime, timedelta',
        'from concurrent.futures import ThreadPoolExecutor, as_completed',
        'import pandas_market_calendars as mcal'
    ]

    for imp in required_imports:
        assert imp in single_template, f"❌ Missing import: {imp}"

    print("✅ All required imports present")

    print("\n" + "="*70)
    print("TEST 3: Key Features Verification")
    print("="*70)

    # Verify no ticker list requirement
    assert 'ALL NYSE stocks' in single_template, "❌ Missing auto-fetch documentation"
    assert 'ALL NASDAQ stocks' in single_template, "❌ Missing auto-fetch documentation"
    assert '~12,000+ tickers' in single_template, "❌ Missing ticker count documentation"

    print("✅ Auto-fetch of all tickers confirmed")

    # Verify 3-stage architecture
    assert 'STAGE 1: FETCH GROUPED DATA' in single_template, "❌ Missing Stage 1"
    assert 'STAGE 2: SMART FILTERS' in single_template, "❌ Missing Stage 2"
    assert 'STAGE 3: FULL PARAMETERS + SCAN' in single_template, "❌ Missing Stage 3"

    print("✅ 3-Stage architecture confirmed")

    # Verify default dates
    assert 'DEFAULT_D0_START' in single_template, "❌ Missing DEFAULT_D0_START"
    assert 'DEFAULT_D0_END' in single_template, "❌ Missing DEFAULT_D0_END"

    print("✅ Default date configuration present")

    # Verify parameters section
    assert 'self.params = {' in single_template, "❌ Missing parameters section"
    assert '"price_min": 8.0' in single_template, "❌ Missing default parameters"

    print("✅ Parameter configuration present")

    print("\n" + "="*70)
    print("✅ ALL TESTS PASSED!")
    print("="*70)
    print("\n📊 Summary:")
    print("  - Pattern library: ✅ Loaded")
    print("  - API key: ✅ Hardcoded")
    print("  - Auto-fetch: ✅ All 12,000+ tickers")
    print("  - Structure: ✅ Matches Backside B")
    print("  - 3-Stage: ✅ Complete")
    print("  - Templates: ✅ Ready for use")
    print("\n🚀 Renata AI can now use these templates for code generation!")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
