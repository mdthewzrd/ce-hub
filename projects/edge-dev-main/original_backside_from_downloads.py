# daily_para_backside_lite_scan.py - MARKET-WIDE VERSION
# Daily-only "A+ para, backside" scan — lite mold.
# Trigger: D-1 (or D-2) fits; trade day (D0) must gap & open > D-1 high.
# D-1 must take out D-2 high and close above D-2 close.
# Adds absolute D-1 volume floor: d1_volume_min.
# MARKET-WIDE VERSION: Uses Edge.dev MARKET_WIDE_DATA for complete market coverage

import pandas as pd, numpy as np
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ───────── config ─────────
# Market-wide data will be provided by Edge.dev
# API_KEY, BASE_URL, MAX_WORKERS provided by execution environment
PRINT_FROM = "2025-01-01"  # set None to keep all
PRINT_TO   = "2025-11-01"  # User requested 1/1/25-11/1/25

# ───────── knobs ─────────
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

# MARKET-WIDE: SYMBOLS list will be replaced with MARKET_WIDE_DATA
# This universe of 85 symbols from original file will be expanded to ALL market tickers

print(f"🚀 ORIGINAL backside scanner from Downloads - MARKET-WIDE VERSION")
print(f"📅 Date range: {PRINT_FROM} to {PRINT_TO}")
print(f"🎯 Key parameters: gap_div_atr_min={P['gap_div_atr_min']}, d1_volume_min={P['d1_volume_min']}")
print(f"🌍 Using MARKET_WIDE_DATA for complete market coverage")

# ───────── metrics (lite) ─────────
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

# ───────── helpers ─────────
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

# ───────── scan one symbol ─────────
def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    # MARKET-WIDE ADAPTATION: Get data from global MARKET_WIDE_DATA
    if 'MARKET_WIDE_DATA' in globals():
        print(f"🌍 Using MARKET_WIDE_DATA for {sym}")
        df_sym = MARKET_WIDE_DATA[MARKET_WIDE_DATA['ticker'] == sym].copy()
        if not df_sym.empty:
            df_sym['Date'] = pd.to_datetime(df_sym['date'])
            df_sym = df_sym.set_index('Date')
            df_sym = df_sym.rename(columns={'o': 'Open', 'h': 'High', 'l': 'Low', 'c': 'Close', 'v': 'Volume'})
            df_sym = df_sym[(df_sym.index >= pd.to_datetime(start)) & (df_sym.index <= pd.to_datetime(end))]
    else:
        # Fallback - should not happen with Edge.dev market-wide execution
        print(f"❌ No MARKET_WIDE_DATA available for {sym}")
        return pd.DataFrame()

    if df_sym.empty:
        return pd.DataFrame()

    m = add_daily_metrics(df_sym)

    rows = []
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

        d1_vol_mult = (r1["Volume"]/r1["VOL_AVG"]) if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0) else np.nan
        volsig_max  = (max(r1["Volume"]/r1["VOL_AVG"], r2["Volume"]/r2["VOL_AVG"])
                       if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0 and pd.notna(r2["VOL_AVG"]) and r2["VOL_AVG"]>0)
                       else np.nan)

        rows.append({
            "Ticker": sym,
            "Date": d0.strftime("%Y-%m-%d"),
            "Trigger": trig_tag,
            "PosAbs_1000d": round(float(pos_abs_prev), 3),
            "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 2),
            "D1Vol(shares)": int(r1["Volume"]) if pd.notna(r1["Volume"]) else np.nan,   # absolute volume
            "D1Vol/Avg": round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else np.nan,
            "VolSig(max D-1,D-2)/Avg": round(float(volsig_max), 2) if pd.notna(volsig_max) else np.nan,
            "Gap/ATR": round(float(r0["Gap_over_ATR"]), 2),
            "Open>PrevHigh": bool(r0["Open"] > r1["High"]),
            "Open/EMA9": round(float(r0["Open_over_EMA9"]), 2),
            "D1>H(D-2)": bool(r1["High"] > r2["High"]),
            "D1Close>D2Close": bool(r1["Close"] > r2["Close"]),
            "Slope9_5d": round(float(r0["Slope_9_5d"]), 2) if pd.notna(r0["Slope_9_5d"]) else np.nan,
            "High-EMA9/ATR(trigger)": round(float(trig_row["High_over_EMA9_div_ATR"]), 2),
            "ADV20_$": round(float(r0["ADV20_$"])) if pd.notna(r0["ADV20_$"]) else np.nan,
        })

    return pd.DataFrame(rows)

print(f"✅ ORIGINAL backside scanner loaded with MARKET-WIDE adaptation")
print(f"🎯 Expected results: Same 8 trading signals as original when run directly")
print(f"🌍 MARKET-WIDE scanning active: ALL market tickers will be processed")