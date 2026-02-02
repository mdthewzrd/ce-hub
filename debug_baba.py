#!/usr/bin/env python3
"""
Debug why BABA is not showing up in results
"""

import pandas as pd
import requests
from datetime import datetime

def fetch_baba_data():
    """Fetch BABA data to see if it should be hitting"""
    session = requests.Session()
    API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
    BASE_URL = "https://api.polygon.io"

    print("🔍 DEBUGGING BABA")
    print("=" * 40)

    # Fetch BABA data from 1/1/25 to 11/1/25
    url = f"{BASE_URL}/v2/aggs/ticker/BABA/range/1/day/2025-01-01/2025-11-01"
    print(f"📡 Fetching: {url}")

    try:
        r = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
        print(f"📊 Status Code: {r.status_code}")

        if r.status_code != 200:
            print(f"❌ API Error: {r.text}")
            return None

        rows = r.json().get("results", [])
        print(f"📈 Data Points Found: {len(rows)}")

        if not rows:
            print("❌ No data found for BABA in 2025")
            return None

        # Create DataFrame
        df = (pd.DataFrame(rows)
                .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
                .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
                .set_index("Date")[["Open","High","Low","Close","Volume"]]
                .sort_index())

        print(f"📅 Date Range: {df.index.min().date()} to {df.index.max().date()}")
        print(f"💰 Price Range: ${df['Close'].min():.2f} - ${df['Close'].max():.2f}")

        # Calculate ADV20
        df['ADV20_$'] = (df["Close"] * df["Volume"]).rolling(20, min_periods=20).mean()
        print(f"📊 Recent ADV20: ${df['ADV20_$'].iloc[-1]:,.0f}")

        # Check if BABA meets basic criteria
        min_price = 8.0
        min_adv = 30_000_000

        latest_close = df['Close'].iloc[-1]
        latest_adv = df['ADV20_$'].iloc[-1]

        print(f"\n🎯 BABA QUALIFICATION CHECK:")
        print(f"   Price ${latest_close:.2f} > ${min_price:.2f}: {'✅' if latest_close >= min_price else '❌'}")
        print(f"   ADV20 ${latest_adv:,.0f} > ${min_adv:,.0f}: {'✅' if latest_adv >= min_adv else '❌'}")

        # Check for any potential backside patterns
        print(f"\n🔍 Checking for backside patterns...")

        # Add basic indicators
        df['EMA_9'] = df['Close'].ewm(span=9).mean()
        df['Gap'] = df['Open'] - df['Close'].shift(1)
        df['Prev_High'] = df['High'].shift(1)

        # Look for significant gaps up
        large_gaps = df[df['Gap'] > df['Close'] * 0.05]  # 5%+ gaps
        print(f"   Found {len(large_gaps)} significant gap-up days")

        if len(large_gaps) > 0:
            print("   Recent gap-up dates:")
            for date, row in large_gaps.tail(3).iterrows():
                print(f"     {date.strftime('%Y-%m-%d')}: Gap {row['Gap']/row['Close']*100:.1f}%")

        return df

    except Exception as e:
        print(f"❌ Error fetching BABA: {e}")
        return None

def main():
    """Main debug function"""
    df = fetch_baba_data()

    if df is not None:
        print("\n✅ BABA data analysis complete")
        print("This shows whether BABA should be appearing in backside scans")
    else:
        print("\n❌ Could not analyze BABA data")

if __name__ == "__main__":
    main()