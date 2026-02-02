#!/usr/bin/env python3
"""
Debug why BABA specifically doesn't meet the full backside B criteria
"""

import pandas as pd
import requests
import numpy as np
from datetime import datetime

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Add the exact same metrics as the scanner"""
    if df.empty:
        return df
    m = df.copy()
    try:
        m.index = m.index.tz_localize(None)
    except Exception:
        pass

    m["EMA_9"]  = m["Close"].ewm(span=9 , adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()

    hi_lo   = m["High"] - m["Low"]
    hi_prev = (m["High"] - m["Close"].shift(1)).abs()
    lo_prev = (m["Low"]  - m["Close"].shift(1)).abs()
    m["TR"]      = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(14, min_periods=14).mean()
    m["ATR"]     = m["ATR_raw"].shift(1)

    m["VOL_AVG"]     = m["Volume"].rolling(14, min_periods=14).mean().shift(1)
    m["Prev_Volume"] = m["Volume"].shift(1)
    m["ADV20_$"]     = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

    m["Slope_9_5d"]  = (m["EMA_9"] - m["EMA_9"].shift(5)) / m["EMA_9"].shift(5) * 100
    m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / m["ATR"]

    m["Gap_abs"]       = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_over_ATR"]  = m["Gap_abs"] / m["ATR"]
    m["Open_over_EMA9"]= m["Open"] / m["EMA_9"]

    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    m["Prev_Close"] = m["Close"].shift(1)
    m["Prev_Open"]  = m["Open"].shift(1)
    m["Prev_High"]  = m["High"].shift(1)
    return m

def analyze_baba_backside():
    """Analyze BABA for backside B patterns"""
    session = requests.Session()
    API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
    BASE_URL = "https://api.polygon.io"

    print("🔍 DETAILED BABA BACKSIDE B ANALYSIS")
    print("=" * 60)

    # Scanner parameters
    P = {
        "price_min": 8.0,
        "adv20_min_usd": 30_000_000,
        "d1_volume_min": 15_000_000,
        "atr_mult": .9,
        "vol_mult": 0.9,
        "d1_vol_mult_min": None,
        "slope5d_min": 3.0,
        "high_ema9_mult": 1.05,
        "gap_div_atr_min": .75,
        "open_over_ema9_min": .9,
        "d1_green_atr_min": 0.30,
        "require_open_gt_prev_high": True,
        "enforce_d1_above_d2": True,
    }

    # Fetch BABA data
    url = f"{BASE_URL}/v2/aggs/ticker/BABA/range/1/day/2025-01-01/2025-11-01"

    try:
        r = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
        rows = r.json().get("results", [])

        if not rows:
            print("❌ No data found for BABA")
            return

        # Create DataFrame
        df = (pd.DataFrame(rows)
                .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
                .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
                .set_index("Date")[["Open","High","Low","Close","Volume"]]
                .sort_index())

        m = add_daily_metrics(df)

        print(f"📊 Analyzing {len(m)} trading days for BABA")
        print(f"📅 Date range: {m.index.min().date()} to {m.index.max().date()}")

        hits = []

        for i in range(2, len(m)):
            d0 = m.index[i]
            r0 = m.iloc[i]       # D0 (trade day)
            r1 = m.iloc[i-1]     # D-1 (trigger day)
            r2 = m.iloc[i-2]     # D-2

            # Basic qualification checks
            if pd.isna(r1["Prev_Close"]) or pd.isna(r1["ADV20_$"]):
                continue
            if r1["Prev_Close"] < P["price_min"] or r1["ADV20_$"] < P["adv20_min_usd"]:
                continue
            if pd.isna(r1["VOL_AVG"]) or r1["VOL_AVG"] <= 0:
                continue

            # Volume criteria
            vol_sig = max(r1["Volume"]/r1["VOL_AVG"], r1["Prev_Volume"]/r1["VOL_AVG"])

            # Backside trigger criteria
            checks = [
                (r1["TR"] / r1["ATR"]) >= P["atr_mult"],
                vol_sig >= P["vol_mult"],
                r1["Slope_9_5d"] >= P["slope5d_min"],
                r1["High_over_EMA9_div_ATR"] >= P["high_ema9_mult"],
            ]

            if not all(bool(x) and np.isfinite(x) for x in checks):
                continue

            # D-1 must be green
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
                continue

            # Absolute D-1 volume floor
            if P["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= P["d1_volume_min"]):
                    continue

            # D-1 > D-2 requirement
            if P["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 trade day gates
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < P["gap_div_atr_min"]:
                continue
            if P["require_open_gt_prev_high"] and not (r0["Open"] > r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < P["open_over_ema9_min"]:
                continue

            # We have a hit!
            d1_vol_mult = (r1["Volume"]/r1["VOL_AVG"]) if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0) else np.nan

            hits.append({
                "Date": d0.strftime("%Y-%m-%d"),
                "Trigger": "D-1",
                "Gap/ATR": round(float(r0["Gap_over_ATR"]), 2),
                "Open>PrevHigh": bool(r0["Open"] > r1["High"]),
                "Open/EMA9": round(float(r0["Open_over_EMA9"]), 2),
                "D1Vol(shares)": int(r1["Volume"]),
                "D1Vol/Avg": round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else np.nan,
                "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 2),
                "Slope9_5d": round(float(r1["Slope_9_5d"]), 2) if pd.notna(r1["Slope_9_5d"]) else np.nan,
                "ADV20_$": round(float(r0["ADV20_$"])) if pd.notna(r0["ADV20_$"]) else np.nan,
                "TR/ATR": round(float(r1["TR"]/r1["ATR"]), 2),
                "VolSig": round(float(vol_sig), 2),
                "High-EMA9/ATR": round(float(r1["High_over_EMA9_div_ATR"]), 2),
                "D1>H(D-2)": bool(r1["High"] > r2["High"]),
                "D1Close>D2Close": bool(r1["Close"] > r2["Close"]),
            })

        print(f"\n🎯 BABA BACKSIDE B HITS: {len(hits)}")

        if hits:
            for hit in hits:
                print(f"\n📈 HIT: {hit['Date']}")
                print(f"   Gap/ATR: {hit['Gap/ATR']} (min: {P['gap_div_atr_min']})")
                print(f"   Open>PrevHigh: {hit['Open>PrevHigh']}")
                print(f"   Open/EMA9: {hit['Open/EMA9']} (min: {P['open_over_ema9_min']})")
                print(f"   D1 Volume: {hit['D1Vol(shares)']:,} (min: {P['d1_volume_min']:,})")
                print(f"   D1Vol/Avg: {hit['D1Vol/Avg']} (min: {P['vol_mult']})")
                print(f"   D1 Body/ATR: {hit['D1_Body/ATR']} (min: {P['d1_green_atr_min']})")
                print(f"   Slope9_5d: {hit['Slope9_5d']} (min: {P['slope5d_min']})")
                print(f"   ADV20: ${hit['ADV20_$']:,} (min: ${P['adv20_min_usd']:,})")
                print(f"   TR/ATR: {hit['TR/ATR']} (min: {P['atr_mult']})")
                print(f"   VolSig: {hit['VolSig']} (min: {P['vol_mult']})")
                print(f"   High-EMA9/ATR: {hit['High-EMA9/ATR']} (min: {P['high_ema9_mult']})")
        else:
            print("\n❌ BABA DID NOT TRIGGER - SHOWING CLOSEST CALLS...")

            # Show closest calls
            close_calls = []
            for i in range(2, min(50, len(m))):  # Check last 50 trading days
                r0 = m.iloc[i]
                r1 = m.iloc[i-1]

                if pd.isna(r1["ADV20_$"]) or r1["ADV20_$"] < P["adv20_min_usd"]:
                    continue

                vol_sig = max(r1["Volume"]/r1["VOL_AVG"], r1["Prev_Volume"]/r1["VOL_AVG"]) if pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 else 0

                close_calls.append({
                    "date": m.index[i].strftime("%Y-%m-%d"),
                    "gap_atr": r0["Gap_over_ATR"] if pd.notna(r0["Gap_over_ATR"]) else 0,
                    "vol_sig": vol_sig,
                    "slope": r1["Slope_9_5d"] if pd.notna(r1["Slope_9_5d"]) else 0,
                    "body_atr": r1["Body_over_ATR"] if pd.notna(r1["Body_over_ATR"]) else 0,
                })

            # Sort by gap and show top 5
            close_calls.sort(key=lambda x: x["gap_atr"], reverse=True)
            for call in close_calls[:5]:
                print(f"\n🔍 Close Call {call['date']}:")
                print(f"   Gap/ATR: {call['gap_atr']:.2f} (need: {P['gap_div_atr_min']})")
                print(f"   VolSig: {call['vol_sig']:.2f} (need: {P['vol_mult']})")
                print(f"   Slope: {call['slope']:.2f} (need: {P['slope5d_min']})")
                print(f"   Body/ATR: {call['body_atr']:.2f} (need: {P['d1_green_atr_min']})")

    except Exception as e:
        print(f"❌ Error analyzing BABA: {e}")

def main():
    analyze_baba_backside()

if __name__ == "__main__":
    main()