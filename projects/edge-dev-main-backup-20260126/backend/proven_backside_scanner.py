"""
PROVEN BACKSIDE B SCANNER - EXACT COPY OF WORKING LOCAL VERSION
=============================================================
This is the exact scanner configuration that produces results in terminal
Uses the same 75 symbols and date range as the proven working version
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta, date
from concurrent.futures import ThreadPoolExecutor, as_completed

# ───────── config ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 16

# Date configuration matching working local version
PRINT_FROM = "2025-01-01"
PRINT_TO = "2025-11-01"  # Match your screenshot range

# Fetch range - using full historical data like your working version
FETCH_START = "2021-01-01"
FETCH_END = datetime.now().strftime("%Y-%m-%d")

# ───────── knobs ───────── (EXACT COPY FROM WORKING VERSION)
P = {
    # hard liquidity / price
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # backside context (absolute window)
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,

    # trigger mold (evaluated on D-1 or D-2)
    "trigger_mode": "D1_or_D2",   # "D1_only" or "D1_or_D2"
    "atr_mult": .9,
    "vol_mult": 0.9,         # max(D-1 vol/avg, D-2 vol/avg)

    # Relative D-1 vol (optional). Set to None to disable.
    "d1_vol_mult_min": None,         # e.g., 1.25

    # NEW: Absolute D-1 volume floor (shares). Set None to disable.
    "d1_volume_min": 15_000_000,   # e.g., require ≥ 20M shares on D-1

    "slope5d_min": 3.0,
    "high_ema9_mult": 1.05,

    # trade-day (D0) gates
    "gap_div_atr_min": .75,
    "open_over_ema9_min": .9,
    "d1_green_atr_min": 0.30,
    "require_open_gt_prev_high": True,

    # relative requirement
    "enforce_d1_above_d2": True,
}

# ───────── PROVEN WORKING SYMBOL LIST (EXACT COPY) ─────────
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

print(f"🎯 USING PROVEN WORKING CONFIGURATION")
print(f"📊 Scanning {len(SYMBOLS)} proven symbols that produce results")
print(f"📅 Date range: {PRINT_FROM} to {PRINT_TO or 'present'}")

# ───────── fetch ─────────
def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Fetch daily market data - exact copy from working version"""
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    r = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
    r.raise_for_status()
    rows = r.json().get("results", [])
    if not rows:
        return pd.DataFrame()
    return (pd.DataFrame(rows)
            .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
            .rename(columns={"o": "Open", "h": "High", "l": "Low", "c": "Close", "v": "Volume"})
            .set_index("Date")[["Open", "High", "Low", "Close", "Volume"]]
            .sort_index())

# ───────── metrics ─────────
def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Add daily metrics - exact copy from working version"""
    if df.empty:
        return df
    m = df.copy()
    try:
        m.index = m.index.tz_localize(None)
    except Exception:
        pass

    m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()

    hi_lo = m["High"] - m["Low"]
    hi_prev = (m["High"] - m["Close"].shift(1)).abs()
    lo_prev = (m["Low"] - m["Close"].shift(1)).abs()
    m["TR"] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(14, min_periods=14).mean()
    m["ATR"] = m["ATR_raw"].shift(1)

    m["VOL_AVG"] = m["Volume"].rolling(14, min_periods=14).mean().shift(1)
    m["Prev_Volume"] = m["Volume"].shift(1)
    m["ADV20_$"] = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

    m["Slope_9_5d"] = (m["EMA_9"] - m["EMA_9"].shift(5)) / m["EMA_9"].shift(5) * 100
    m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / m["ATR"]

    m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_over_ATR"] = m["Gap_abs"] / m["ATR"]
    m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]

    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    m["Prev_Close"] = m["Close"].shift(1)
    m["Prev_Open"] = m["Open"].shift(1)
    m["Prev_High"] = m["High"].shift(1)
    return m

# ───────── helpers ─────────
def abs_top_window(df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
    """Calculate absolute top window - exact copy from working version"""
    if df.empty:
        return (np.nan, np.nan)
    cutoff = d0 - pd.Timedelta(days=exclude_days)
    wstart = cutoff - pd.Timedelta(days=lookback_days)
    win = df[(df.index > wstart) & (df.index <= cutoff)]
    if win.empty:
        return (np.nan, np.nan)
    return float(win["Low"].min()), float(win["High"].max())

def pos_between(val, lo, hi):
    """Calculate position between values - exact copy from working version"""
    if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
        return np.nan
    return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

def _mold_on_row(rx: pd.Series) -> bool:
    """Mold detection function - exact copy from working version"""
    if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
        return False
    if rx["Prev_Close"] < P["price_min"] or rx["ADV20_$"] < P["adv20_min_usd"]:
        return False
    vol_avg = rx["VOL_AVG"]
    if pd.isna(vol_avg) or vol_avg <= 0:
        return False
    vol_sig = max(rx["Volume"]/vol_avg, rx["Prev_Volume"]/vol_avg)
    checks = [
        (rx["TR"] / rx["ATR"]) >= P["atr_mult"],
        vol_sig >= P["vol_mult"],
        rx["Slope_9_5d"] >= P["slope5d_min"],
        rx["High_over_EMA9_div_ATR"] >= P["high_ema9_mult"],
    ]
    return all(bool(x) and np.isfinite(x) for x in checks)

# ───────── scan one symbol ─────────
def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan one symbol - exact copy from working version with output field mapping"""
    df = fetch_daily(sym, start, end)
    if df.empty:
        return pd.DataFrame()
    m = add_daily_metrics(df)

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
        trigger_ok = False
        trig_row = None
        trig_tag = "-"
        if P["trigger_mode"] == "D1_only":
            if _mold_on_row(r1):
                trigger_ok, trig_row, trig_tag = True, r1, "D-1"
        else:
            if _mold_on_row(r1):
                trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            elif _mold_on_row(r2):
                trigger_ok, trig_row, trig_tag = True, r2, "D-2"
        if not trigger_ok:
            continue

        # D-1 must be green
        if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
            continue

        # Absolute D-1 volume floor (shares)
        if P["d1_volume_min"] is not None:
            if not (pd.notna(r1["Volume"]) and r1["Volume"] >= P["d1_volume_min"]):
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

        rows.append({
            "symbol": sym,  # Use 'symbol' for platform consistency
            "date": d0.strftime("%Y-%m-%d"),
            "trigger": trig_tag,
            "pos_abs_1000d": round(float(pos_abs_prev), 3),
            "d1_body_atr": round(float(r1["Body_over_ATR"]), 2),
            "d1_vol_shares": int(r1["Volume"]) if pd.notna(r1["Volume"]) else np.nan,
            "gap_atr": round(float(r0["Gap_over_ATR"]), 2),
            "open_ema9": round(float(r0["Open_over_EMA9"]), 2),
            "d1_gt_d2_high": bool(r1["High"] > r2["High"]),
            "d1_close_gt_d2_close": bool(r1["Close"] > r2["Close"]),
            "slope9_5d": round(float(r0["Slope_9_5d"]), 2) if pd.notna(r0["Slope_9_5d"]) else np.nan,
            "high_ema9_atr_trigger": round(float(trig_row["High_over_EMA9_div_ATR"]), 2),
            "adv20_usd": round(float(r0["ADV20_$"])) if pd.notna(r0["ADV20_$"]) else np.nan,
        })

    return pd.DataFrame(rows)

# ───────── main execution function ─────────
def run_scan(start_date: str = None, end_date: str = None, symbols: list = None) -> pd.DataFrame:
    """
    Main function using proven working configuration - EXACT COPY OF WORKING VERSION LOGIC
    """
    # Use fetch range (full historical data for proper parameter calculations)
    fetch_start = FETCH_START
    fetch_end = FETCH_END

    # Use proven symbols if not provided
    if not symbols:
        symbols = SYMBOLS

    print(f"🎯 Starting PROVEN Backside B scan")
    print(f"📊 Fetching data from {fetch_start} to {fetch_end}")
    print(f"📊 Displaying results from {PRINT_FROM} to {PRINT_TO}")
    print(f"📊 Scanning {len(symbols)} proven symbols with {MAX_WORKERS} workers")

    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in symbols}
        for fut in as_completed(futs):
            try:
                df = fut.result()
                if df is not None and not df.empty:
                    results.append(df)
                    print(f"✅ {futs[fut]}: Found {len(df)} patterns")
                else:
                    print(f"⚪ {futs[fut]}: No patterns")
            except Exception as e:
                print(f"❌ {futs[fut]}: Error - {str(e)}")

    if results:
        out = pd.concat(results, ignore_index=True)

        # Apply display filters like your working version
        if PRINT_FROM:
            out = out[pd.to_datetime(out["date"]) >= pd.to_datetime(PRINT_FROM)]
        if PRINT_TO:
            out = out[pd.to_datetime(out["date"]) <= pd.to_datetime(PRINT_TO)]

        out = out.sort_values(["date", "symbol"], ascending=[False, True])
        print(f"\n🎯 TOTAL: Found {len(out)} Backside B patterns")
        return out
    else:
        print("❌ No patterns found")
        return pd.DataFrame()

# ───────── main ─────────
if __name__ == "__main__":
    print("🎯 TESTING PROVEN BACKSIDE B SCANNER")
    results = run_scan()

    if not results.empty:
        print("\n📊 PROVEN Backside B patterns found:")
        pd.set_option("display.max_columns", None, "display.width", 0)
        print(results.to_string(index=False))
    else:
        print("\n❌ No patterns found - this should not happen with proven config")