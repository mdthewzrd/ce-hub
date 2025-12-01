#!/usr/bin/env python3
"""
Scanner Contamination Test
==========================

Quick test to check if scanners are catching large caps they shouldn't
"""

import asyncio
import aiohttp
import json
import pandas as pd
from datetime import datetime, timedelta

async def test_scanner_contamination():
    """Test if scanners are catching large caps inappropriately"""

    print("🚨 SCANNER CONTAMINATION TEST")
    print("=" * 60)

    # Load reference data to see what we SHOULD be getting
    try:
        ref_df = pd.read_csv("/Users/michaeldurante/Downloads/lc_backtest1 - Copy (2).csv")
        expected_tickers = set(ref_df['ticker'].unique())
        print(f"📊 Expected tickers from reference: {len(expected_tickers)}")
        print(f"📋 Sample expected: {list(expected_tickers)[:10]}")
    except Exception as e:
        print(f"❌ Could not load reference: {e}")
        expected_tickers = set()

    # Define large caps that should NOT appear
    large_caps = {
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'JNJ',
        'KO', 'PEP', 'WMT', 'HD', 'UNH', 'V', 'MA', 'PG', 'DIS', 'VZ', 'INTC',
        'IBM', 'GE', 'BAC', 'XOM', 'CVX', 'WFC', 'TMO', 'LLY', 'ABBV'
    }

    async with aiohttp.ClientSession() as session:

        # Get the generated scanners
        print(f"\n🔍 GETTING SCANNERS...")

        original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
        split_payload = {"code": original_code, "filename": "lc d2 scan - oct 25 new ideas (3).py"}

        async with session.post(ai_split_url, json=split_payload) as response:
            if response.status != 200:
                print(f"❌ Failed to get scanners: {response.status}")
                return

            split_result = await response.json()
            scanners = split_result.get('scanners', [])
            print(f"✅ Got {len(scanners)} scanners")

        # Test each scanner on recent data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=14)  # Last 2 weeks for quick test

        contamination_found = False
        all_tickers_found = set()

        for i, scanner in enumerate(scanners, 1):
            name = scanner.get('scanner_name', f'Scanner_{i}')
            code = scanner.get('formatted_code', '')

            print(f"\n📋 Testing {name}...")

            scan_url = "http://localhost:8000/api/scan"
            scan_payload = {
                "scanner_code": code,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            }

            try:
                async with session.post(scan_url, json=scan_payload) as scan_response:
                    if scan_response.status == 200:
                        scan_result = await scan_response.json()
                        results = scan_result.get('results', [])

                        if results:
                            df = pd.DataFrame(results)

                            # Get ticker column (handle different naming)
                            ticker_col = 'Ticker' if 'Ticker' in df.columns else 'ticker'
                            tickers = set(df[ticker_col].unique())
                            all_tickers_found.update(tickers)

                            print(f"   📊 {len(results)} hits, {len(tickers)} unique tickers")

                            # Check for large cap contamination
                            large_cap_contamination = tickers.intersection(large_caps)
                            if large_cap_contamination:
                                print(f"   🚨 LARGE CAP CONTAMINATION: {large_cap_contamination}")
                                contamination_found = True

                            # Check for unexpected tickers (not in reference)
                            if expected_tickers:
                                unexpected = tickers - expected_tickers - large_caps
                                if unexpected:
                                    print(f"   ⚠️  Unexpected tickers: {list(unexpected)[:5]}")
                                    if len(unexpected) > 5:
                                        print(f"       ... and {len(unexpected) - 5} more")

                            # Show sample of what we got
                            print(f"   📋 Sample tickers: {list(tickers)[:5]}")
                        else:
                            print(f"   📊 No hits found")

                    elif scan_response.status == 404:
                        print(f"   ⚠️  Scan endpoint not available (404)")
                    else:
                        error = await scan_response.text()
                        print(f"   ❌ Scan failed: {scan_response.status}")
                        print(f"       Error: {error[:100]}")

            except Exception as e:
                print(f"   ❌ Scanner error: {e}")

        # Summary
        print(f"\n" + "=" * 60)
        print(f"🔍 CONTAMINATION TEST RESULTS")
        print(f"=" * 60)

        print(f"📊 Total unique tickers found: {len(all_tickers_found)}")

        large_cap_found = all_tickers_found.intersection(large_caps)
        if large_cap_found:
            print(f"🚨 LARGE CAP CONTAMINATION DETECTED: {large_cap_found}")
            print(f"   Issue: Scanners are too permissive")
            contamination_found = True
        else:
            print(f"✅ No large cap contamination detected")

        if expected_tickers:
            expected_found = all_tickers_found.intersection(expected_tickers)
            print(f"✅ Expected tickers found: {len(expected_found)} / {len(expected_tickers)}")

            missing = expected_tickers - all_tickers_found
            if missing:
                print(f"❌ Missing expected tickers: {list(missing)[:5]}")
                if len(missing) > 5:
                    print(f"   ... and {len(missing) - 5} more")

        # Recommendations
        print(f"\n🔧 RECOMMENDATIONS:")
        if contamination_found:
            print(f"   1. 🚨 URGENT: Tighten price filters to exclude large caps")
            print(f"   2. 🔧 Review volume spike thresholds")
            print(f"   3. 🔧 Validate ATR multipliers")
            print(f"   4. 🔧 Check market cap filters")
        else:
            print(f"   ✅ Contamination levels look acceptable")

        return not contamination_found

if __name__ == "__main__":
    asyncio.run(test_scanner_contamination())