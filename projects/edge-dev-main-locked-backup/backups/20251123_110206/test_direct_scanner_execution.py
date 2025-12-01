#!/usr/bin/env python3
"""
Test the scanner code directly to verify it produces results
"""
import pandas as pd, numpy as np, requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Use the working API key
API_KEY = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"  # Working API key from test
BASE_URL = "https://api.polygon.io"
session = requests.Session()

# Test with just a few symbols for speed
SYMBOLS = ['AAPL', 'MSFT', 'BABA', 'AMD', 'NVDA']

# Scanner parameters from Backside Para B
P = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,
    "trigger_mode": "D1_or_D2",
    "atr_mult": .9,
    "vol_mult": 0.9,
    "d1_vol_mult_min": None,
    "d1_volume_min": 15_000_000,
    "slope5d_min": 3.0,
    "high_ema9_mult": 1.05,
    "gap_div_atr_min": .75,
    "open_over_ema9_min": .9,
    "d1_green_atr_min": 0.30,
    "require_open_gt_prev_high": True,
    "enforce_d1_above_d2": True,
}

def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    r = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
    r.raise_for_status()
    rows = r.json().get("results", [])
    if not rows: return pd.DataFrame()
    return (pd.DataFrame(rows)
            .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
            .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
            .set_index("Date")[["Open","High","Low","Close","Volume"]]
            .sort_index())

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty: return df
    m = df.copy()
    try: m.index = m.index.tz_localize(None)
    except Exception: pass

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

def abs_top_window(df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
    if df.empty: return (np.nan, np.nan)
    cutoff = d0 - pd.Timedelta(days=exclude_days)
    wstart = cutoff - pd.Timedelta(days=lookback_days)
    win = df[(df.index > wstart) & (df.index <= cutoff)]
    if win.empty: return (np.nan, np.nan)
    return float(win["Low"].min()), float(win["High"].max())

def pos_between(val, lo, hi):
    if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo: return np.nan
    return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

def _mold_on_row(rx: pd.Series) -> bool:
    if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
        return False
    if rx["Prev_Close"] < P["price_min"] or rx["ADV20_$"] < P["adv20_min_usd"]:
        return False
    vol_avg = rx["VOL_AVG"]
    if pd.isna(vol_avg) or vol_avg <= 0: return False
    vol_sig = max(rx["Volume"]/vol_avg, rx["Prev_Volume"]/vol_avg)
    checks = [
        (rx["TR"] / rx["ATR"]) >= P["atr_mult"],
        vol_sig                 >= P["vol_mult"],
        rx["Slope_9_5d"]        >= P["slope5d_min"],
        rx["High_over_EMA9_div_ATR"] >= P["high_ema9_mult"],
    ]
    return all(bool(x) and np.isfinite(x) for x in checks)

def scan_symbol(sym: str) -> pd.DataFrame:
    print(f"🔍 Scanning {sym}...")
    try:
        df = fetch_daily(sym, "2020-01-01", "2025-11-06")
        if df.empty:
            print(f"   ⚠️ No data for {sym}")
            return pd.DataFrame()

        m = add_daily_metrics(df)
        rows = []

        for i in range(2, len(m)):
            d0 = m.index[i]
            r0 = m.iloc[i]       # D0
            r1 = m.iloc[i-1]     # D-1
            r2 = m.iloc[i-2]     # D-2

            # Only check 2025 dates
            if d0.year != 2025:
                continue

            # Backside vs D-1 close
            lo_abs, hi_abs = abs_top_window(m, d0, P["abs_lookback_days"], P["abs_exclude_days"])
            pos_abs_prev = pos_between(r1["Close"], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= P["pos_abs_max"]):
                continue

            # Choose trigger
            trigger_ok = False; trig_row = None; trig_tag = "-"
            if P["trigger_mode"] == "D1_only":
                if _mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:
                if _mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif _mold_on_row(r2): trigger_ok, trig_row, trig_tag = True, r2, "D-2"
            if not trigger_ok:
                continue

            # D-1 must be green
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
                continue

            # Absolute D-1 volume floor (shares)
            if P["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= P["d1_volume_min"]):
                    continue

            # Optional relative D-1 vol multiple
            if P["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= P["d1_vol_mult_min"]):
                    continue

            # D-1 > D-2 highs & close
            if P["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 gates
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < P["gap_div_atr_min"]:
                continue
            if P["require_open_gt_prev_high"] and not (r0["Open"] > r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < P["open_over_ema9_min"]:
                continue

            # Found a match!
            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
                "Trigger": trig_tag,
                "PosAbs_1000d": round(float(pos_abs_prev), 3),
                "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 2),
                "Gap/ATR": round(float(r0["Gap_over_ATR"]), 2),
            })

        result_df = pd.DataFrame(rows)
        if not result_df.empty:
            print(f"   ✅ Found {len(result_df)} hits for {sym}")
        else:
            print(f"   ❌ No hits for {sym}")
        return result_df

    except Exception as e:
        print(f"   ❌ Error scanning {sym}: {e}")
        return pd.DataFrame()

def main():
    print("🚀 Testing Backside Para B scanner directly...")
    print(f"🔧 API Key: {API_KEY[:8]}...")
    print(f"📊 Testing {len(SYMBOLS)} symbols")
    print()

    # Run scanner on symbols
    results = []
    for sym in SYMBOLS:
        df = scan_symbol(sym)
        if not df.empty:
            results.append(df)

    if results:
        # This creates the 'out' variable that should be found
        out = pd.concat(results, ignore_index=True)
        out = out.sort_values(["Date","Ticker"], ascending=[False, True])

        print("\n🎯 RESULTS FOUND!")
        print(f"📊 Total results: {len(out)}")
        print(out.to_string(index=False))
        print(f"\n✅ Scanner works! Results are stored in 'out' variable")

        # Test variable extraction like the system does
        exec_globals = {'__name__': '__main__', 'out': out}
        result_vars = ['results', 'df', 'data', 'output', 'matches', 'found_stocks', 'out']

        print("\n🔍 Testing variable extraction:")
        for var_name in result_vars:
            if var_name in exec_globals and exec_globals[var_name] is not None:
                var_data = exec_globals[var_name]
                print(f"   ✅ Found variable '{var_name}': {type(var_data)} with {len(var_data) if hasattr(var_data, '__len__') else 'N/A'} items")
                if hasattr(var_data, 'to_dict'):
                    return var_data.to_dict('records')
                elif isinstance(var_data, list):
                    return var_data

        return []
    else:
        print("❌ No results found")
        return []

if __name__ == "__main__":
    main()