#!/usr/bin/env python3
"""
All Three Scanners Validation Test
==================================

This script will:
1. Run all three generated scanners
2. Combine the results
3. Compare against reference CSV
4. Identify discrepancies and potential issues
"""

import asyncio
import aiohttp
import json
import pandas as pd
from datetime import datetime, timedelta

async def test_all_three_scanners():
    """Run all three scanners and validate against reference data"""

    print("🔍 ALL THREE SCANNERS VALIDATION TEST")
    print("=" * 80)

    # Load reference data
    reference_file = "/Users/michaeldurante/Downloads/lc_backtest1 - Copy (2).csv"

    try:
        ref_df = pd.read_csv(reference_file)
        print(f"📊 Reference data loaded: {len(ref_df)} rows")
        print(f"📊 Date range: {ref_df['date'].min()} to {ref_df['date'].max()}")
        print(f"📊 Unique tickers: {ref_df['ticker'].nunique()}")
        print(f"📊 Sample tickers: {list(ref_df['ticker'].unique()[:10])}")

    except Exception as e:
        print(f"❌ Failed to load reference data: {e}")
        return

    async with aiohttp.ClientSession() as session:

        # Step 1: Get the generated scanners
        print(f"\n🚀 STEP 1: GET GENERATED SCANNERS")
        print("-" * 60)

        original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
        split_payload = {
            "code": original_code,
            "filename": "lc d2 scan - oct 25 new ideas (3).py"
        }

        async with session.post(ai_split_url, json=split_payload) as response:
            if response.status != 200:
                print(f"❌ Failed to get scanners: {response.status}")
                return

            split_result = await response.json()
            scanners = split_result.get('scanners', [])

            if len(scanners) != 3:
                print(f"⚠️  Expected 3 scanners, got {len(scanners)}")

            scanner_info = {}
            for i, scanner in enumerate(scanners, 1):
                name = scanner.get('scanner_name', f'Scanner_{i}')
                code = scanner.get('formatted_code', '')

                print(f"✅ Scanner {i}: {name} ({len(code):,} characters)")

                # Map to reference columns
                if 'd3_extended' in name:
                    ref_col = 'lc_frontside_d3_extended_1'
                elif 'd2_extended_pattern' in name and 'variant' not in name:
                    ref_col = 'lc_frontside_d2_extended'
                elif 'd2_variant' in name:
                    ref_col = 'lc_frontside_d2_extended_1'
                else:
                    ref_col = f'scanner_{i}'

                scanner_info[ref_col] = {
                    'name': name,
                    'code': code,
                    'scanner_id': i
                }

        # Step 2: Run each scanner on recent data
        print(f"\n🔍 STEP 2: RUN SCANNERS ON RECENT DATA")
        print("-" * 60)

        # Test on last 30 days for speed
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        all_results = {}

        for ref_col, info in scanner_info.items():
            print(f"\n📋 Running {info['name']}...")

            scan_url = "http://localhost:8000/api/scan"
            scan_payload = {
                "scanner_code": info['code'],
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "custom_symbols": None  # Use all symbols from scanner
            }

            try:
                async with session.post(scan_url, json=scan_payload) as scan_response:
                    if scan_response.status == 200:
                        scan_result = await scan_response.json()
                        results = scan_result.get('results', [])

                        print(f"   ✅ {len(results)} hits found")

                        # Convert to DataFrame
                        if results:
                            df = pd.DataFrame(results)
                            # Standardize column names
                            if 'Ticker' in df.columns:
                                df['ticker'] = df['Ticker']
                            if 'Date' in df.columns:
                                df['date'] = df['Date']

                            all_results[ref_col] = df[['ticker', 'date']].copy()

                            # Show sample results
                            print(f"   📊 Sample hits: {list(df['ticker'].unique()[:5])}")

                            # Check for large caps (this is the concern)
                            large_caps = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.A', 'JPM', 'JNJ']
                            large_cap_hits = df[df['ticker'].isin(large_caps)]
                            if not large_cap_hits.empty:
                                print(f"   ⚠️  LARGE CAP HITS: {list(large_cap_hits['ticker'].unique())}")

                        else:
                            all_results[ref_col] = pd.DataFrame(columns=['ticker', 'date'])
                            print(f"   📊 No hits found")
                    else:
                        error_text = await scan_response.text()
                        print(f"   ❌ Scanner failed: {scan_response.status}")
                        print(f"      Error: {error_text[:200]}")
                        all_results[ref_col] = pd.DataFrame(columns=['ticker', 'date'])

            except Exception as scan_error:
                print(f"   ❌ Scanner error: {scan_error}")
                all_results[ref_col] = pd.DataFrame(columns=['ticker', 'date'])

        # Step 3: Compare with reference data
        print(f"\n📊 STEP 3: COMPARE WITH REFERENCE DATA")
        print("-" * 60)

        # Filter reference data to recent period for comparison
        ref_df['date'] = pd.to_datetime(ref_df['date'])
        recent_ref = ref_df[ref_df['date'] >= start_date].copy()

        print(f"📊 Reference hits in test period: {len(recent_ref)} rows")
        print(f"📊 Reference tickers in test period: {list(recent_ref['ticker'].unique())}")

        # Compare each scanner
        for ref_col, results_df in all_results.items():
            if ref_col in recent_ref.columns:
                print(f"\n🔍 Comparing {ref_col}:")

                # Get expected hits from reference
                expected_hits = recent_ref[recent_ref[ref_col] == 1][['ticker', 'date']].copy()
                expected_hits['date'] = expected_hits['date'].dt.strftime('%Y-%m-%d')

                # Get actual hits from our scanner
                actual_hits = results_df.copy()
                if not actual_hits.empty:
                    actual_hits['date'] = pd.to_datetime(actual_hits['date']).dt.strftime('%Y-%m-%d')

                print(f"   📊 Expected hits: {len(expected_hits)}")
                print(f"   📊 Actual hits: {len(actual_hits)}")

                if len(expected_hits) > 0:
                    expected_tickers = set(expected_hits['ticker'].unique())
                    print(f"   📋 Expected tickers: {expected_tickers}")

                if len(actual_hits) > 0:
                    actual_tickers = set(actual_hits['ticker'].unique())
                    print(f"   📋 Actual tickers: {actual_tickers}")

                    # Find discrepancies
                    if len(expected_hits) > 0:
                        missing_tickers = expected_tickers - actual_tickers
                        extra_tickers = actual_tickers - expected_tickers

                        if missing_tickers:
                            print(f"   ❌ MISSING TICKERS: {missing_tickers}")

                        if extra_tickers:
                            print(f"   ⚠️  EXTRA TICKERS: {extra_tickers}")

                            # Check if extra tickers are large caps
                            large_caps_found = extra_tickers.intersection({'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'JNJ', 'KO', 'PEP', 'WMT', 'HD', 'UNH', 'V', 'MA'})
                            if large_caps_found:
                                print(f"   🚨 LARGE CAP FALSE POSITIVES: {large_caps_found}")

                        if not missing_tickers and not extra_tickers:
                            print(f"   ✅ Perfect ticker match!")

        # Step 4: Analysis and recommendations
        print(f"\n🔧 STEP 4: ANALYSIS & RECOMMENDATIONS")
        print("-" * 60)

        total_actual_hits = sum(len(df) for df in all_results.values())
        total_expected_hits = len(recent_ref[recent_ref[['lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_frontside_d2_extended_1']].sum(axis=1) > 0])

        print(f"📊 SUMMARY:")
        print(f"   Expected total hits: {total_expected_hits}")
        print(f"   Actual total hits: {total_actual_hits}")

        if total_actual_hits > total_expected_hits * 2:
            print(f"   🚨 SCANNERS TOO PERMISSIVE - Too many hits!")
            print(f"   🔧 Recommendation: Tighten parameters")
        elif total_actual_hits < total_expected_hits * 0.5:
            print(f"   🚨 SCANNERS TOO RESTRICTIVE - Too few hits!")
            print(f"   🔧 Recommendation: Loosen parameters")
        else:
            print(f"   ✅ Hit count looks reasonable")

        # Check for systematic issues
        print(f"\n🔍 POTENTIAL ISSUES:")

        # Check if we're getting any large caps
        all_tickers = set()
        for df in all_results.values():
            if not df.empty:
                all_tickers.update(df['ticker'].unique())

        large_caps = {'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'JNJ', 'KO', 'PEP', 'WMT', 'HD', 'UNH', 'V', 'MA', 'PG', 'DIS', 'VZ', 'INTC', 'IBM', 'GE'}
        found_large_caps = all_tickers.intersection(large_caps)

        if found_large_caps:
            print(f"   🚨 LARGE CAP CONTAMINATION: {found_large_caps}")
            print(f"   🔧 Issue: Price/volume filters may be too loose")
        else:
            print(f"   ✅ No large cap contamination detected")

        # Parameter recommendations
        print(f"\n🔧 PARAMETER TUNING RECOMMENDATIONS:")
        print(f"   1. Check price_min filter (should exclude large caps)")
        print(f"   2. Verify volume spike thresholds")
        print(f"   3. Validate ATR multipliers")
        print(f"   4. Review position sizing filters")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_all_three_scanners())