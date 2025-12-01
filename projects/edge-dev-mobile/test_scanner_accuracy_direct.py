#!/usr/bin/env python3
"""
Direct Scanner Accuracy Validation
==================================

This validates scanner accuracy against reference CSV using the exact
working API endpoints seen in backend logs.
"""

import asyncio
import aiohttp
import json
import pandas as pd
from datetime import datetime, timedelta

async def test_scanner_accuracy():
    """Direct test of scanner accuracy against reference data"""

    print("🔍 DIRECT SCANNER ACCURACY VALIDATION")
    print("=" * 70)

    # Load reference data
    reference_file = "/Users/michaeldurante/Downloads/lc_backtest1 - Copy (2).csv"

    try:
        ref_df = pd.read_csv(reference_file)
        print(f"📊 Reference data loaded: {len(ref_df)} rows")
        print(f"📊 Expected tickers: {sorted(list(ref_df['ticker'].unique()))}")
        print(f"📊 Date range: {ref_df['date'].min()} to {ref_df['date'].max()}")

        # Large caps that should NOT be caught by LC scanners
        large_caps = {
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM', 'JNJ',
            'KO', 'PEP', 'WMT', 'HD', 'UNH', 'V', 'MA', 'PG', 'DIS', 'VZ', 'INTC',
            'IBM', 'GE', 'BAC', 'XOM', 'CVX', 'WFC', 'TMO', 'LLY', 'ABBV'
        }

    except Exception as e:
        print(f"❌ Failed to load reference data: {e}")
        return

    async with aiohttp.ClientSession() as session:

        print(f"\n🚀 STEP 1: GET GENERATED SCANNERS")
        print("-" * 50)

        # Load original multi-scanner file
        original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        # Split into individual scanners
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
            print(f"✅ Generated {len(scanners)} scanners")

        print(f"\n🔍 STEP 2: TEST SCANNER ACCURACY")
        print("-" * 50)

        # Test date range from reference data
        ref_df['date'] = pd.to_datetime(ref_df['date'])
        start_date = ref_df['date'].min().strftime("%Y-%m-%d")
        end_date = ref_df['date'].max().strftime("%Y-%m-%d")
        print(f"📅 Testing date range: {start_date} to {end_date}")

        all_results = []

        for i, scanner in enumerate(scanners, 1):
            scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
            formatted_code = scanner.get('formatted_code', '')

            print(f"\n📋 Testing Scanner {i}: {scanner_name}")

            # Use the exact API format that works (from backend logs)
            execute_url = "http://localhost:8000/api/scan/execute"
            execute_payload = {
                "scanner_code": formatted_code,
                "start_date": start_date,
                "end_date": end_date,
                "use_real_scan": True,
                "sophisticated_mode": True
            }

            try:
                async with session.post(execute_url, json=execute_payload) as scan_response:
                    if scan_response.status == 200:
                        scan_result = await scan_response.json()
                        scan_id = scan_result.get('scan_id')

                        if scan_id:
                            print(f"   🚀 Scan initiated: {scan_id}")

                            # Poll for results (like frontend does)
                            status_url = f"http://localhost:8000/api/scan/status/{scan_id}"
                            max_polls = 60  # 5 minutes max

                            for poll in range(max_polls):
                                await asyncio.sleep(5)  # Wait 5 seconds between polls

                                async with session.get(status_url) as status_response:
                                    if status_response.status == 200:
                                        status_result = await status_response.json()
                                        status_val = status_result.get('status')
                                        progress = status_result.get('progress_percent', 0)

                                        print(f"   ⏳ Poll {poll+1}: Status={status_val}, Progress={progress}%")

                                        if status_val == 'completed':
                                            results = status_result.get('results', [])
                                            print(f"   ✅ Completed: {len(results)} results")

                                            # Parse results
                                            if results:
                                                df = pd.DataFrame(results)

                                                # Handle different column naming
                                                if 'Ticker' in df.columns:
                                                    df['ticker'] = df['Ticker']
                                                if 'Date' in df.columns:
                                                    df['date'] = df['Date']

                                                # Store with scanner info
                                                for _, row in df.iterrows():
                                                    all_results.append({
                                                        'scanner': scanner_name,
                                                        'ticker': row.get('ticker', row.get('Ticker', 'unknown')),
                                                        'date': row.get('date', row.get('Date', 'unknown'))
                                                    })

                                                # Show sample results
                                                unique_tickers = df['ticker'].unique() if 'ticker' in df.columns else df.get('Ticker', []).unique()
                                                print(f"   📊 Tickers found: {sorted(list(unique_tickers))}")

                                                # Check for large cap contamination
                                                large_cap_hits = set(unique_tickers).intersection(large_caps)
                                                if large_cap_hits:
                                                    print(f"   🚨 LARGE CAP CONTAMINATION: {large_cap_hits}")
                                                else:
                                                    print(f"   ✅ No large cap contamination")
                                            break

                                        elif status_val == 'error':
                                            print(f"   ❌ Scan failed: {status_result.get('message', 'Unknown error')}")
                                            break
                                    else:
                                        print(f"   ❌ Status check failed: {status_response.status}")
                                        break
                            else:
                                print(f"   ⏰ Scan timed out after {max_polls} polls")
                        else:
                            print(f"   ❌ No scan_id returned")
                    else:
                        error_text = await scan_response.text()
                        print(f"   ❌ Scan request failed: {scan_response.status}")
                        print(f"      Error: {error_text[:200]}")

            except Exception as e:
                print(f"   ❌ Scanner error: {e}")

        print(f"\n📊 STEP 3: ACCURACY ANALYSIS")
        print("-" * 50)

        if all_results:
            # Create combined results DataFrame
            results_df = pd.DataFrame(all_results)

            # Get all unique tickers found by our scanners
            found_tickers = set(results_df['ticker'].unique())
            expected_tickers = set(ref_df['ticker'].unique())

            print(f"📊 SUMMARY:")
            print(f"   Expected tickers: {len(expected_tickers)}")
            print(f"   Found tickers: {len(found_tickers)}")
            print(f"   Total scan results: {len(results_df)}")

            # Analysis
            correct_tickers = found_tickers.intersection(expected_tickers)
            missing_tickers = expected_tickers - found_tickers
            extra_tickers = found_tickers - expected_tickers

            print(f"\n🎯 ACCURACY ANALYSIS:")
            print(f"   ✅ Correct tickers found: {len(correct_tickers)} / {len(expected_tickers)}")
            print(f"   📋 Correct: {sorted(list(correct_tickers))}")

            if missing_tickers:
                print(f"   ❌ Missing tickers: {len(missing_tickers)}")
                print(f"   📋 Missing: {sorted(list(missing_tickers))}")

            if extra_tickers:
                print(f"   ⚠️  Extra tickers: {len(extra_tickers)}")
                print(f"   📋 Extra: {sorted(list(extra_tickers))}")

                # Check if extra tickers are large caps (contamination)
                extra_large_caps = extra_tickers.intersection(large_caps)
                if extra_large_caps:
                    print(f"   🚨 LARGE CAP CONTAMINATION: {extra_large_caps}")
                    print(f"   🔧 URGENT: Scanners catching large caps - parameters too loose!")
                else:
                    print(f"   ✅ No large cap contamination in extra tickers")

            # Calculate accuracy percentage
            if expected_tickers:
                accuracy_pct = len(correct_tickers) / len(expected_tickers) * 100
                print(f"\n🎯 ACCURACY SCORE: {accuracy_pct:.1f}%")

                if accuracy_pct >= 80:
                    print(f"   ✅ Scanner accuracy is GOOD")
                elif accuracy_pct >= 60:
                    print(f"   ⚠️  Scanner accuracy is MODERATE")
                else:
                    print(f"   🚨 Scanner accuracy is LOW - needs tuning")
        else:
            print(f"❌ No results found - check scanner execution")

        print(f"\n🔧 RECOMMENDATIONS:")
        if all_results:
            if 'extra_large_caps' in locals() and extra_large_caps:
                print(f"   🚨 CRITICAL: Tighten price_min and market cap filters")
                print(f"   🔧 Reduce volume spike thresholds")
                print(f"   🔧 Increase ATR multiplier requirements")
            else:
                print(f"   ✅ Parameter integrity looks good")
                print(f"   📊 Scanner selectivity appears appropriate")
        else:
            print(f"   🔧 Check scanner execution and API endpoints")

if __name__ == "__main__":
    asyncio.run(test_scanner_accuracy())