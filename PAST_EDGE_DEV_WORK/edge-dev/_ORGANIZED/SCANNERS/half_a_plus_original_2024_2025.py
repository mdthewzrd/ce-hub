# scan_backside_daily.py
# Backside Daily Para — daily-only scan (no intraday/dev-bands)
# Uses your P thresholds (1000-day absolute range w/ last 10d excluded).

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# ───── knobs (your values, with 1000-day lookback) ─────
P = {
    # hard excludes
    "price_min": 8.0,
    "adv20_min_usd": 15_000_000,

    # daily mold (softer than A+)
    "atr_mult": 2,
    "vol_mult": 2.5,
    "slope3d_min": 7,
    "slope5d_min": 12.0,
    "slope15d_min": 16,
    "high_ema9_mult": 4,   # (High-EMA9)/ATR
    "high_ema20_mult": 6,   # (High-EMA20)/ATR
    "pct7d_low_div_atr_min": 6,
    "pct14d_low_div_atr_min": 9,
    "gap_div_atr_min": 1.25,
    "open_over_ema9_min": 1.1,
    "atr_pct_change_min": 0.25,
    "prev_close_min": 10.0,
    "pct2d_div_atr_min": 4,
    "pct3d_div_atr_min": 3,

    # backside: NOT near the top over a long window
    "lookback_days_2y": 1000,   # ← as requested
    "exclude_recent_days": 10,     # exclude last N days from range calc
    "not_top_frac_abs": 0.75,   # require position <= 0.75

    # optional extras (off by default)
    "require_open_gt_prev_high": False,
    "require_green_prev": False,

    # pivot sensitivity (for future use; ABS test used here)
    "pivot_left": 3,
    "pivot_right": 3,
}

# ───────── data fetch ─────────
def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    r = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
    r.raise_for_status()
    rows = r.json().get("results", [])
    if not rows:
        return pd.DataFrame()
    return (
        pd.DataFrame(rows)
          .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms"))
          .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
          .set_index("Date")[["Open","High","Low","Close","Volume"]]
          .sort_index()
    )

# ───────── metrics (daily) ─────────
def compute_core_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df.copy()
    m = df.copy()

    # EMAs
    m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()

    # ATR(30), shifted as "known"
    hi_lo = m["High"] - m["Low"]
    hi_pc = (m["High"] - m["Close"].shift(1)).abs()
    lo_pc = (m["Low"] - m["Close"].shift(1)).abs()
    m["TR"] = pd.concat([hi_lo, hi_pc, lo_pc], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(30, min_periods=30).mean()
    m["ATR"] = m["ATR_raw"].shift(1)
    atr_safe = m["ATR"].replace(0, np.nan)

    # Volume baselines
    m["VOL_AVG_raw"] = m["Volume"].rolling(30, min_periods=30).mean()
    m["VOL_AVG"] = m["VOL_AVG_raw"].shift(1)
    m["Prev_Volume"] = m["Volume"].shift(1)

    # Slopes (EMA9)
    for w in (3, 5, 15):
        m[f"Slope_9_{w}d"] = (m["EMA_9"] - m["EMA_9"].shift(w)) / m["EMA_9"].shift(w) * 100

    # Dev vs EMAs (÷ ATR)
    m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / atr_safe
    m["High_over_EMA20_div_ATR"] = (m["High"] - m["EMA_20"]) / atr_safe

    # % from recent lows
    low7 = m["Low"].rolling(7, min_periods=7).min()
    low14 = m["Low"].rolling(14, min_periods=14).min()
    m["Pct_7d_low_div_ATR"] = ((m["Close"] - low7) / low7) / atr_safe * 100
    m["Pct_14d_low_div_ATR"] = ((m["Close"] - low14) / low14) / atr_safe * 100

    # % changes
    m["Pct_2d_div_ATR"] = ((m["Close"] / m["Close"].shift(2)) - 1) / atr_safe * 100
    m["Pct_3d_div_ATR"] = ((m["Close"] / m["Close"].shift(3)) - 1) / atr_safe * 100

    # ATR pct change
    m["ATR_Pct_Change"] = (m["ATR"] / m["ATR"].shift(1) - 1) * 100

    # Additional metrics needed for Half A+ scanner
    # Gap calculation
    m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_div_ATR"] = m["Gap_abs"] / atr_safe

    # Open over EMA9
    m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]

    # Body over ATR (for green day detection)
    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    return m

# ───────── helpers ─────────
def abs_window(df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
    """Return (low, high) of absolute window, excluding recent days."""
    if df.empty:
        return (np.nan, np.nan)
    cutoff = d0 - pd.Timedelta(days=exclude_days)
    start = cutoff - pd.Timedelta(days=lookback_days)
    win = df[(df.index > start) & (df.index <= cutoff)]
    if win.empty:
        return (np.nan, np.nan)
    return float(win["Low"].min()), float(win["High"].max())

def pos_in_range(val: float, lo: float, hi: float) -> float:
    """Return 0-1 position; NaN if invalid range."""
    if np.isnan(val) or np.isnan(lo) or np.isnan(hi) or hi <= lo:
        return np.nan
    return max(0.0, min(1.0, (val - lo) / (hi - lo)))

# ───────── backside daily scan ─────────
def scan_symbol(tkr: str, start: str, end: str) -> pd.DataFrame:
    df = fetch_daily(tkr, start, end)
    if df.empty:
        return pd.DataFrame()
    m = compute_core_metrics(df)

    rows = []
    for i in range(2, len(m)):
        d0 = m.index[i]
        close = m.loc[d0, "Close"]

        # hard excludes
        if close < P["price_min"] or close < P["prev_close_min"]:
            continue

        # Daily baselines for filtering
        # Calculate ADV20 using the proper method from the dataframe
        adv20_series = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean()
        adv20 = adv20_series.loc[d0] if d0 in adv20_series.index else np.nan
        if pd.isna(adv20) or adv20 < P["adv20_min_usd"]:
            continue

        # Backside test (not near absolute top)
        lo_abs, hi_abs = abs_window(m, d0, P["lookback_days_2y"], P["exclude_recent_days"])
        pos_abs = pos_in_range(m.iloc[i-1]["Close"], lo_abs, hi_abs)
        if pd.isna(pos_abs) or pos_abs > P["not_top_frac_abs"]:
            continue

        # Day-0 filters (same as your uploaded scanner)
        if m.loc[d0, "Pct_2d_div_ATR"] < P["pct2d_div_atr_min"]:
            continue
        if m.loc[d0, "Pct_3d_div_ATR"] < P["pct3d_div_atr_min"]:
            continue
        if m.loc[d0, "Gap_div_ATR"] < P["gap_div_atr_min"]:
            continue
        if P["require_open_gt_prev_high"] and not (m.loc[d0, "Open"] > m.iloc[i-1]["High"]):
            continue
        if m.loc[d0, "Open_over_EMA9"] < P["open_over_ema9_min"]:
            continue
        if m.loc[d0, "ATR_Pct_Change"] < P["atr_pct_change_min"]:
            continue

        rows.append({
            "Ticker": tkr,
            "Date": d0.strftime("%Y-%m-%d"),
            "Close": round(close, 2),
            "PosAbs_2yr": round(pos_abs, 3),
            "Pct_7dLow/ATR": round(m.loc[d0, "Pct_7d_low_div_ATR"], 2),
            "Pct_14dLow/ATR": round(m.loc[d0, "Pct_14d_low_div_ATR"], 2),
            "Pct_2d/ATR": round(m.loc[d0, "Pct_2d_div_ATR"], 2),
            "Pct_3d/ATR": round(m.loc[d0, "Pct_3d_div_ATR"], 2),
            "Gap/ATR": round(m.loc[d0, "Gap_div_ATR"], 2),
            "Open>PrevHigh": bool(m.loc[d0, "Open"] > m.iloc[i-1]["High"]),
            "Open/EMA9": round(m.loc[d0, "Open_over_EMA9"], 2),
            "ATR%Change": round(m.loc[d0, "ATR_Pct_Change"], 2),
            "ADV20_$": round(adv20) if pd.notna(adv20) else np.nan,
            "Scanner_Type": "Backside_Daily_Original",
        })

    return pd.DataFrame(rows)

# ───────── main ─────────
if __name__ == "__main__":
    print("🎯 BACKSIDE DAILY - ORIGINAL A+ PARAMETERS")
    print("🔧 100% Parameter Integrity from /Downloads/backside para A+ copy.py")
    print("=" * 60)

    # Symbol universe - using same as other scanners for consistency
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

    # Date range for requested period
    fetch_start = "2024-01-01"
    fetch_end = "2025-11-01"

    print(f"📅 Scanning from {fetch_start} to {fetch_end}")
    print(f"🎯 Processing {len(SYMBOLS)} symbols with ORIGINAL parameters")

    results = []
    with ThreadPoolExecutor(max_workers=12) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in SYMBOLS}
        for fut in futs:
            sym = futs[fut]
            df = fut.result()
            if df is not None and not df.empty:
                results.append(df)
                print(f"✓ {sym}: {len(df)} signals")
            else:
                print(f"- {sym}: no signals")

    if results:
        out = pd.concat(results, ignore_index=True)

        # Apply date filtering
        out = out[pd.to_datetime(out["Date"]) >= pd.to_datetime("2024-01-01")]
        out = out[pd.to_datetime(out["Date"]) <= pd.to_datetime("2025-11-01")]

        out = out.sort_values(["Date", "Ticker"], ascending=[False, True])
        pd.set_option("display.max_columns", None, "display.width", 0)

        print(f"\n🎯 BACKSIDE DAILY ORIGINAL RESULTS: {len(out)} signals")
        print("=" * 100)
        print(out.to_string(index=False))

        # Save results
        output_file = "backside_daily_original_2024_2025.csv"
        out.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")
    else:
        print("❌ No Backside Daily signals found.")