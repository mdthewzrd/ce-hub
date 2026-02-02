# Standardized Backside Para B Scanner
# Compatible with Universal Scanner Engine
# Original: /Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py

import pandas as pd
import numpy as np
import requests
from datetime import datetime, date
from typing import List, Dict, Any

# ───────── Global Config ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# ───────── Required by Universal Scanner Engine ─────────
SYMBOLS = [
    'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
    'NFLX','SNAP','RBLX','META','SE','NVDA','AAPL','MSFT','GOOGL','AMZN','TSLA',
    'AMD','INTC','BA','PYPL','QCOM','ORCL','KO','PEP','ABBV','JNJ','CRM','BAC',
    'JPM','WMT','CVX','XOM','COP','RTX','SPGI','GS','HD','LOW','COST','UNH','NKE',
    'LMT','HON','CAT','LIN','ADBE','AVGO','TXN','ACN','UPS','BLK','PM','ELV','VRTX',
    'ZTS','NOW','ISRG','PLD','MS','MDT','WM','GE','IBM','BKNG','FDX','ADP','EQIX',
    'DHR','SNPS','REGN','SYK','TMO','CVS','INTU','SCHW','CI','APD','SO','MMC','ICE',
    'FIS','ADI','CSX','LRCX','GILD','RIVN','PLTR','SNOW','SPY','QQQ','IWM','RIOT',
    'MARA','COIN','MRNA','CELH','UPST','AFRM','DKNG'
]

# ───────── Original Scanner Parameters ─────────
P = {
    # hard liquidity / price
    "price_min"        : 8.0,
    "adv20_min_usd"    : 30_000_000,

    # backside context (absolute window)
    "abs_lookback_days": 1000,
    "abs_exclude_days" : 10,
    "pos_abs_max"      : 0.75,

    # trigger mold (evaluated on D-1 or D-2)
    "trigger_mode"     : "D1_or_D2",   # "D1_only" or "D1_or_D2"
    "atr_mult"         : .9,
    "vol_mult"         : 0.9,         # max(D-1 vol/avg, D-2 vol/avg)

    # Relative D-1 vol (optional). Set to None to disable.
    "d1_vol_mult_min"  : None,         # e.g., 1.25

    # NEW: Absolute D-1 volume floor (shares). Set None to disable.
    "d1_volume_min"    : 15_000_000,   # e.g., require ≥ 20M shares on D-1

    "slope5d_min"      : 3.0,
    "high_ema9_mult"   : 1.05,

    # trade-day (D0) gates
    "gap_div_atr_min"   : .75,
    "open_over_ema9_min": .9,
    "d1_green_atr_min"  : 0.30,
    "require_open_gt_prev_high": True,

    # relative requirement
    "enforce_d1_above_d2": True,
}

# ───────── Original Functions ─────────
def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    r   = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
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

# ───────── Universal Scanner Engine Compatible Function ─────────
def scan_symbol(symbol: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    🎯 STANDARDIZED SCAN_SYMBOL FUNCTION

    Compatible with Universal Scanner Engine
    Maintains original Backside Para B logic
    """
    try:
        # Fetch data using original function
        df = fetch_daily(symbol, start_date, end_date)
        if df.empty:
            return []

        # Add original metrics
        m = add_daily_metrics(df)
        if len(m) < 3:  # Need at least 3 rows for D-2, D-1, D0 analysis
            return []

        results = []

        # Original scanning logic (adapted for single symbol)
        for i in range(2, len(m)):
            d0 = m.index[i]
            r0 = m.iloc[i]       # D0
            r1 = m.iloc[i-1]     # D-1
            r2 = m.iloc[i-2]     # D-2

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

            # Calculate additional metrics for result
            d1_vol_mult = (r1["Volume"]/r1["VOL_AVG"]) if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0) else np.nan
            volsig_max  = (max(r1["Volume"]/r1["VOL_AVG"], r2["Volume"]/r2["VOL_AVG"])
                           if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0 and pd.notna(r2["VOL_AVG"]) and r2["VOL_AVG"]>0)
                           else np.nan)

            # ✅ STANDARDIZED RESULT FORMAT for Universal Scanner Engine
            result = {
                'symbol': symbol,
                'ticker': symbol,  # Required field for Universal Scanner Engine
                'date': d0.strftime("%Y-%m-%d"),
                'scanner_type': 'backside_para_b',

                # Core metrics (standardized field names)
                'gap_percent': round(float(r0["Gap_over_ATR"]), 2),
                'volume_ratio': round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else None,
                'signal_strength': 'Strong' if r0["Gap_over_ATR"] > 1.0 else 'Moderate',
                'entry_price': round(float(r0["Open"]), 2),
                'target_price': round(float(r0["Open"] * 1.05), 2),  # 5% target

                # Original detailed metrics (preserved)
                'trigger': trig_tag,
                'pos_abs_1000d': round(float(pos_abs_prev), 3),
                'd1_body_atr': round(float(r1["Body_over_ATR"]), 2),
                'd1_volume_shares': int(r1["Volume"]) if pd.notna(r1["Volume"]) else None,
                'd1_vol_avg_ratio': round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else None,
                'vol_sig_max': round(float(volsig_max), 2) if pd.notna(volsig_max) else None,
                'gap_atr': round(float(r0["Gap_over_ATR"]), 2),
                'open_prev_high': bool(r0["Open"] > r1["High"]),
                'open_ema9_ratio': round(float(r0["Open_over_EMA9"]), 2),
                'd1_above_d2_high': bool(r1["High"] > r2["High"]),
                'd1_close_above_d2': bool(r1["Close"] > r2["Close"]),
                'slope_9_5d': round(float(r0["Slope_9_5d"]), 2) if pd.notna(r0["Slope_9_5d"]) else None,
                'high_ema9_atr_trigger': round(float(trig_row["High_over_EMA9_div_ATR"]), 2),
                'adv20_usd': round(float(r0["ADV20_$"])) if pd.notna(r0["ADV20_$"]) else None,
            }

            results.append(result)

        return results

    except Exception as e:
        print(f"Error scanning {symbol}: {str(e)}")
        return []

# ───────── Scanner Configuration ─────────
SCANNER_CONFIG = {
    'name': 'Standardized Backside Para B Scanner',
    'description': 'Daily-only "A+ para, backside" scan - lite mold with institutional standardization',
    'timeframe': 'Daily',
    'original_path': '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py',
    'standardized': True,
    'universal_compatible': True
}

# ───────── Test Entry Point ─────────
if __name__ == "__main__":
    print("🎯 Standardized Backside Para B Scanner - Test Mode")
    print(f"Configured to scan {len(SYMBOLS)} symbols")

    # Test with a few symbols
    test_symbols = ['AAPL', 'MSFT', 'GOOGL']
    start_date = "2020-01-01"
    end_date = date.today().strftime("%Y-%m-%d")

    for symbol in test_symbols:
        results = scan_symbol(symbol, start_date, end_date)
        print(f"\n{symbol}: {len(results)} results found")
        if results:
            print(f"  Latest: {results[-1]}")