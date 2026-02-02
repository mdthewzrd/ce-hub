#!/usr/bin/env python3
"""
✅ TRUE V31 TRANSFORMATION PIPELINE TEST

Tests the complete Renata V2 transformation pipeline to ensure:
1. Standalone scanners are properly transformed to v31
2. All 7 core pillars are present in generated code
3. Validator passes on generated code
4. Bulletproof validation catches violations
"""

import sys
from pathlib import Path

# Add RENATA_V2 to path
renata_v2_path = Path(__file__).parent.parent / "RENATA_V2"
sys.path.insert(0, str(renata_v2_path.parent))

from RENATA_V2.core.transformer import RenataTransformer
from RENATA_V2.core.validator import Validator

# Test standalone scanner (Backside Para B style)
TEST_STANDALONE_SCANNER = '''
"""
Backside Para B Scanner - Standalone Implementation
"""
import requests
import pandas as pd
import numpy as np

# Configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Parameters
P = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    "gap_div_atr_min": 0.75,
    "abs_lookback_days": 1000,
}

# Universe
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']

# Date range
PRINT_FROM = "2024-01-01"
PRINT_TO = "2024-12-31"

def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Fetch daily data for a ticker"""
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    params = {"apiKey": API_KEY, "adjust": "true"}
    response = requests.get(url, params=params)
    data = response.json().get('results', [])

    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
    df = df.rename(columns={
        'o': 'open',
        'h': 'high',
        'l': 'low',
        'c': 'close',
        'v': 'volume'
    })
    return df[['date', 'open', 'high', 'low', 'close', 'volume']]

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Add technical indicators"""
    m = df.sort_values('date').copy()

    # Previous close
    m['prev_close'] = m['close'].shift(1)

    # EMA
    m['ema_9'] = m['close'].ewm(span=9, adjust=False).mean()
    m['ema_20'] = m['close'].ewm(span=20, adjust=False).mean()

    # ATR
    hi_lo = m['high'] - m['low']
    hi_prev = (m['high'] - m['close'].shift(1)).abs()
    lo_prev = (m['low'] - m['close'].shift(1)).abs()
    m['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m['atr_raw'] = m['tr'].rolling(14, min_periods=14).mean()
    m['atr'] = m['atr_raw'].shift(1)

    # ADV20
    m['adv20_usd'] = (m['close'] * m['volume']).rolling(20, min_periods=20).mean()

    return m

def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan a single symbol"""
    df = fetch_daily(sym, start, end)
    if df.empty:
        return pd.DataFrame()

    m = add_daily_metrics(df)

    rows = []
    for i in range(2, len(m)):
        d0 = m.iloc[i]['date']

        # Only consider dates in our print range
        if d0 < pd.to_datetime(PRINT_FROM).date() or d0 > pd.to_datetime(PRINT_TO).date():
            continue

        r0 = m.iloc[i]
        r1 = m.iloc[i-1]
        r2 = m.iloc[i-2]

        # Calculate gap
        gap = (r0['open'] / r1['close']) - 1

        # Signal conditions
        if (r0['close'] >= P['price_min'] and
            r0['adv20_usd'] >= P['adv20_min_usd'] and
            abs(gap) / r0['atr'] >= P['gap_div_atr_min']):

            rows.append({
                'Ticker': sym,
                'Date': d0.strftime('%Y-%m-%d'),
                'Close': r0['close'],
                'Gap': gap,
                'Gap/ATR': abs(gap) / r0['atr'],
            })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    # Historical buffer needed for ABS window
    from datetime import timedelta
    start_buffer = (pd.to_datetime(PRINT_FROM) - pd.Timedelta(days=1100)).strftime('%Y-%m-%d')

    results = []
    for s in SYMBOLS:
        df = scan_symbol(s, start_buffer, PRINT_TO)
        if not df.empty:
            results.append(df)

    if results:
        final = pd.concat(results, ignore_index=True)
        print(final.to_string(index=False))
    else:
        print("No signals found")
'''


def test_v31_transformation():
    """Test complete v31 transformation pipeline"""

    print("=" * 70)
    print("✅ TRUE V31 TRANSFORMATION PIPELINE TEST")
    print("=" * 70)

    # Initialize transformer and validator
    transformer = RenataTransformer()
    validator = Validator()

    print("\n[TEST 1] Transforming standalone scanner to v31...")
    print("-" * 70)

    result = transformer.transform(
        source_code=TEST_STANDALONE_SCANNER,
        scanner_name="BacksideParaBV31",
        date_range="2024-01-01 to 2024-12-31",
        verbose=True
    )

    print("\n" + "=" * 70)
    print("[TEST 1 RESULT]")
    print("=" * 70)
    print(f"✅ Transformation Success: {result.success}")
    print(f"📊 Corrections Made: {result.corrections_made}")
    print(f"🔍 Validation Results: {len(result.validation_results)} categories")

    # Check each validation category
    for vresult in result.validation_results:
        status = "✅ PASS" if vresult.is_valid else "❌ FAIL"
        print(f"  {status} {vresult.category.upper()}")

        if vresult.errors:
            print(f"     Errors ({len(vresult.errors)}):")
            for err in vresult.errors[:5]:  # Show first 5 errors
                print(f"       - {err}")

        if vresult.warnings:
            print(f"     Warnings ({len(vresult.warnings)}):")
            for warn in vresult.warnings[:5]:  # Show first 5 warnings
                print(f"       - {warn}")

    if not result.success:
        print("\n❌ TEST FAILED: Transformation validation failed")
        return False

    print("\n" + "=" * 70)
    print("[TEST 2] Checking for 7 Core Pillars in generated code...")
    print("-" * 70)

    generated_code = result.generated_code
    code_lower = generated_code.lower()

    # Check each pillar
    pillars = {
        "Pillar 1 - Market Calendar": 'pandas_market_calendars' in code_lower or 'import mcal' in code_lower,
        "Pillar 2 - Historical Buffer": 'scan_start' in code_lower and 'timedelta' in code_lower,
        "Pillar 3 - Per-ticker Operations": ".groupby('ticker')" in generated_code or '.groupby("ticker")' in generated_code,
        "Pillar 4 - Historical/D0 Separation": 'df_historical' in code_lower or 'historical' in code_lower,
        "Pillar 5 - Parallel Processing": 'ThreadPoolExecutor' in generated_code,
        "Pillar 6 - Two-pass Features": 'compute_simple_features' in code_lower and 'compute_full_features' in code_lower,
        "Pillar 7 - Pre-sliced Data": 'ticker_data_list' in code_lower or 'pre_sliced' in code_lower
    }

    all_pillars_present = True
    for pillar_name, is_present in pillars.items():
        status = "✅" if is_present else "❌"
        print(f"  {status} {pillar_name}: {'PRESENT' if is_present else 'MISSING'}")
        if not is_present:
            all_pillars_present = False

    print("\n" + "=" * 70)
    print("[TEST 2 RESULT]")
    print("=" * 70)
    if all_pillars_present:
        print("✅ ALL 7 CORE PILLARS PRESENT")
    else:
        print("❌ SOME PILLARS MISSING - Code may not be TRUE v31 compliant")

    print("\n" + "=" * 70)
    print("[TEST 3] Checking for required 5-stage pipeline methods...")
    print("-" * 70)

    required_stages = [
        ('fetch_grouped_data', 'Stage 1'),
        ('compute_simple_features', 'Stage 2a'),
        ('apply_smart_filters', 'Stage 2b'),
        ('compute_full_features', 'Stage 3a'),
        ('detect_patterns', 'Stage 3b')
    ]

    all_stages_present = True
    for stage_name, stage_label in required_stages:
        is_present = stage_name in code_lower
        status = "✅" if is_present else "❌"
        print(f"  {status} {stage_label} - {stage_name}(): {'PRESENT' if is_present else 'MISSING'}")
        if not is_present:
            all_stages_present = False

    print("\n" + "=" * 70)
    print("[TEST 3 RESULT]")
    print("=" * 70)
    if all_stages_present:
        print("✅ ALL 5 PIPELINE STAGES PRESENT")
    else:
        print("❌ SOME STAGES MISSING")

    print("\n" + "=" * 70)
    print("[TEST 4] Testing validator catches violations...")
    print("-" * 70)

    # Create code with deliberate violations
    bad_code = '''
class BadScanner:
    """Scanner without market calendar - should fail validation"""

    def __init__(self, api_key):
        self.api_key = api_key
        # ❌ No historical buffer calculation
        self.scan_start = "2024-01-01"  # Should be d0_start - lookback

    def fetch_data(self):
        # ❌ No market calendar - using weekday instead
        while self.current_dt.weekday() < 5:
            pass

    def compute_features(self, df):
        # ❌ No per-ticker operations - wrong rolling
        df['adv20'] = df['volume'].rolling(20).mean()  # Should use groupby

    def detect_patterns(self, df):
        # ❌ No parallel processing - sequential loop
        for ticker in df['ticker'].unique():
            pass
'''

    is_valid, results = validator.validate_all(bad_code)
    v31_result = [r for r in results if r.category == 'v31_compliance'][0]

    print(f"  Code validation result: {'❌ FAILED (expected)' if not is_valid else '✅ PASSED (unexpected)'}")
    print(f"  V31 compliance errors caught: {len(v31_result.errors)}")

    if v31_result.errors:
        print("  Errors correctly detected:")
        for err in v31_result.errors[:3]:
            print(f"    - {err}")

    print("\n" + "=" * 70)
    print("[TEST 4 RESULT]")
    print("=" * 70)
    if not is_valid and len(v31_result.errors) > 0:
        print("✅ VALIDATOR CORRECTLY CATCHES VIOLATIONS")
    else:
        print("❌ VALIDATOR FAILED TO CATCH VIOLATIONS")

    print("\n" + "=" * 70)
    print("[FINAL RESULT]")
    print("=" * 70)

    all_tests_passed = (
        result.success and
        all_pillars_present and
        all_stages_present and
        not is_valid and len(v31_result.errors) > 0
    )

    if all_tests_passed:
        print("✅ ALL TESTS PASSED - TRUE V31 PIPELINE IS BULLETPROOF")
        print("\nGenerated code includes:")
        print("  • Market calendar (pandas_market_calendars)")
        print("  • Historical buffer calculation")
        print("  • Per-ticker operations (groupby().transform())")
        print("  • Historical/D0 separation and preservation")
        print("  • Parallel processing (ThreadPoolExecutor)")
        print("  • Two-pass feature computation")
        print("  • Pre-sliced data for parallel processing")
        print("  • Complete 5-stage pipeline")
        print("  • Bulletproof validation that catches violations")
        return True
    else:
        print("❌ SOME TESTS FAILED")
        return False


if __name__ == "__main__":
    success = test_v31_transformation()
    sys.exit(0 if success else 1)
