#!/usr/bin/env python3
"""
Quick test version of the LC scanner to debug issues
"""

import pandas as pd
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta

# Configuration
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"

# Test with a single recent date
TEST_DATE = "2025-01-31"

async def fetch_test_stock_list(session, date, adj):
    """Fetch stock data for a specific date"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"
    print(f"Fetching data for {date}...")

    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    print(f"Found {len(df)} stocks for {date}")
                    return df
                else:
                    print(f"No results in response for {date}")
                    return pd.DataFrame()
            else:
                print(f"HTTP {response.status} for {date}")
                return pd.DataFrame()
    except Exception as e:
        print(f"Error fetching {date}: {e}")
        return pd.DataFrame()

def apply_basic_filter(df):
    """Apply basic filters to find potential candidates"""
    print(f"Applying filters to {len(df)} stocks...")

    # Basic volume and price filters
    filtered = df[
        (df['c'] >= 5.0) &  # Close price >= $5
        (df['v'] >= 1000000) &  # Volume >= 1M
        (df['c'] > df['o']) &  # Closed higher than opened
        ((df['h'] - df['l']) / df['l'] >= 0.02)  # Range >= 2%
    ].copy()

    print(f"After basic filters: {len(filtered)} stocks")

    # Calculate some basic metrics
    filtered['pct_change'] = ((filtered['c'] / filtered['o']) - 1) * 100
    filtered['range_pct'] = ((filtered['h'] - filtered['l']) / filtered['l']) * 100
    filtered['dollar_volume'] = filtered['c'] * filtered['v']

    # Sort by dollar volume descending
    filtered = filtered.sort_values('dollar_volume', ascending=False)

    return filtered

async def main():
    """Main test function"""
    print("🔍 Running Quick Scanner Test")
    print(f"📅 Testing date: {TEST_DATE}")

    async with aiohttp.ClientSession() as session:
        # Fetch adjusted data
        df_adj = await fetch_test_stock_list(session, TEST_DATE, "true")

        if df_adj.empty:
            print("❌ No data retrieved - check API key or date")
            return

        # Apply basic filters
        candidates = apply_basic_filter(df_adj)

        if candidates.empty:
            print("❌ No candidates found after filtering")
            return

        # Display top candidates
        print(f"\n🎯 Top {min(20, len(candidates))} Candidates:")
        print("-" * 80)

        for i, (_, row) in enumerate(candidates.head(20).iterrows()):
            print(f"{i+1:2d}. {row['ticker']:6s} | ${row['c']:7.2f} | "
                  f"{row['pct_change']:+6.2f}% | Vol: {row['v']:>10,.0f} | "
                  f"Range: {row['range_pct']:5.2f}%")

        # Save results
        output_file = "/Users/michaeldurante/ai dev/ce-hub/test_scan_results.csv"
        candidates.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")

        # Test for some of the known tickers mentioned
        known_tickers = ['QNTM', 'OKLO', 'AQST', 'HIMS', 'SMCI', 'TSLQ', 'MLGO', 'UVIX', 'CEP', 'ASST', 'CRNW', 'SBET', 'SRM', 'NKTR', 'BMNR', 'RKLB', 'THAR', 'SATS', 'QURE', 'BKNG', 'RGTI', 'UAMY', 'USAR', 'CRML', 'QWM', 'AQMS', 'TMQ']

        found_known = candidates[candidates['ticker'].isin(known_tickers)]
        if not found_known.empty:
            print(f"\n✅ Found {len(found_known)} known tickers in results:")
            for _, row in found_known.iterrows():
                print(f"   {row['ticker']:6s} | ${row['c']:7.2f} | {row['pct_change']:+6.2f}%")
        else:
            print(f"\n⚠️  None of the known tickers found in results for {TEST_DATE}")
            print("   This might be normal if they didn't meet criteria on this date")

if __name__ == "__main__":
    asyncio.run(main())