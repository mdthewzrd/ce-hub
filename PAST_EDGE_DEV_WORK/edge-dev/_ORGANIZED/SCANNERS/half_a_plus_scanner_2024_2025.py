#!/usr/bin/env python3
"""
Half A+ Scanner - Formatted for 1/1/24 - 11/1/25
================================================
Relaxed version of A+ parameters for more signal generation
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
warnings.filterwarnings("ignore")

# ───────── CONFIGURATION ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 8

# DATE RANGE: 1/1/24 - 11/1/25
PRINT_FROM = "2024-01-01"
PRINT_TO = "2025-11-01"

# ───────── HALF A+ PARAMETERS (RELAXED) ─────────
P = {
    # hard liquidity / price (relaxed for more signals)
    "price_min": 5.0,              # Lowered from 8.0
    "adv20_min_usd": 10_000_000,   # Lowered from 30M

    # backside context (slightly relaxed)
    "abs_lookback_days": 800,      # Reduced from 1000
    "abs_exclude_days": 7,         # Reduced from 10
    "pos_abs_max": 0.80,           # Relaxed from 0.75

    # trigger mold (relaxed criteria)
    "trigger_mode": "D1_or_D2",    # More flexible than D1_only
    "atr_mult": 0.7,               # Lowered from 0.9
    "vol_mult": 0.7,               # Lowered from 0.9

    # Absolute D-1 volume floor (reduced)
    "d1_volume_min": 8_000_000,    # Lowered from 15M
    "d1_vol_mult_min": None,       # Keep disabled

    # momentum parameters (relaxed)
    "slope5d_min": 2.0,            # Lowered from 3.0
    "high_ema9_mult": 1.03,        # Lowered from 1.05

    # trade-day (D0) gates (relaxed)
    "gap_div_atr_min": 0.5,        # Lowered from 0.75
    "open_over_ema9_min": 0.85,    # Lowered from 0.9
    "d1_green_atr_min": 0.20,      # Lowered from 0.30
    "require_open_gt_prev_high": False, # Relaxed from True

    # relative requirement
    "enforce_d1_above_d2": True,   # Keep this for quality
}

# ───────── EXPANDED SYMBOL UNIVERSE ─────────
SYMBOLS = [
    # Tech Giants
    'AAPL','MSFT','GOOGL','GOOG','AMZN','TSLA','META','NVDA','AMD','INTC',

    # Semiconductor & AI
    'SMCI','MRVL','AVGO','TXN','QCOM','ADI','MU','NXPI','LRCX','KLAC',

    # Enterprise Software
    'ADBE','CRM','NOW','INTU','SNPS','CDNS','FTNT','PANW','OKTA','ZS',

    # E-commerce & Digital
    'BABA','SE','MELI','SHOP','SQ','PYPL','FIS','GPN','V','MA',

    # Healthcare & Biotech
    'JNJ','UNH','PFE','ABBV','MRK','TMO','ABT','DHR','MDT','SYK',
    'ISRG','GILD','REGN','VRTX','BIIB','BMY','AMGN','AZN','LLY','NVAX',

    # Financials
    'JPM','BAC','WFC','GS','MS','C','AXP','BLK','SCHW','ICE','SPGI',

    # Consumer & Retail
    'WMT','COST','HD','LOW','TGT','NKE','DIS','NFLX','KO','PEP','MCD',
    'SBUX','TJX','ROST','AZO','HD','LOW',

    # Industrial & Defense
    'BA','GE','CAT','HON','RTX','LMT','UPS','FDX','MMM','DE','CMI',

    # Energy & Materials
    'XOM','CVX','COP','SLB','HAL','OXY','EOG','PSX','VLO','MPC',

    # Communication & Telecom
    'VZ','T','CMCSA','NFLX','DIS','CHTR','TMUS','T','VOD',

    # REITs & Real Estate
    'AMT','PLD','PRO','EQIX','DLR','EXR','CCI','SBAC','WELL','AVB',

    # Crypto & Blockchain
    'COIN','MARA','RIOT','SQ','PYPL','MSTR','BKNG','RIOT',

    # SPACs & Special Purpose
    'DKNG','RBLX','SNAP','TWLO','ZM','DOCU','PLTR','RIVN','LCID',
    'SOFI','UPST','AFRM','HOOD','AI','SNDL','BNGO','SPCE',

    # ETFs & Index Products
    'SPY','QQQ','IWM','DIA','VTI','VOO','GLD','SLV','TLT','SHY',
    'SOXL','TQQQ','SQQQ','TECL','FAS','FAZ','URE','DRV','LABU','LABD',

    # International ADRs
    'BABA','JD','PDD','BIDU','NIO','TCEHY','BILI','TME','YY','NTES',
    'SAMSUNG','TSM','ASML','NOK','ERIC','SNE','MUFG','SMFG',

    # Biotech & Pharma
    'MRNA','PFE','JNJ','ABT','TMO','ABBV','VRTX','GILD','REGN','BIIB',

    # Growth Stocks
    'NFLX','ROKU','ZM','DOCU','SNAP','PINS','TWLO','SQ','PYPL','MELI',
    'SE','SPOT','ETSY','CRWD','ZS','OKTA','DDOG','NET','SNOW','PLTR',

    # Special Situations
    'DJT','AMC','GME','BB','BBBY','NOK','NAKD','SNDL','AMZN','AAPL',
    'TSLA','NVDA','AMD','PLTR','GME','AMC','BB','NOK'
]

# Remove duplicates while preserving order
SYMBOLS = list(dict.fromkeys(SYMBOLS))

# ───────── DATA FETCHING ─────────
def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Fetch daily price data from Polygon API"""
    try:
        url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
        r = session.get(url, params={"apiKey": API_KEY, "adjusted":"true", "sort":"asc", "limit":50000})
        r.raise_for_status()
        rows = r.json().get("results", [])
        if not rows:
            return pd.DataFrame()

        return (pd.DataFrame(rows)
                .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
                .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
                .set_index("Date")[["Open","High","Low","Close","Volume"]]
                .sort_index())
    except Exception as e:
        print(f"Error fetching {tkr}: {e}")
        return pd.DataFrame()

# ───────── TECHNICAL METRICS ─────────
def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators"""
    if df.empty:
        return df
    m = df.copy()
    try:
        m.index = m.index.tz_localize(None)
    except Exception:
        pass

    # EMAs
    m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()

    # ATR
    hi_lo = m["High"] - m["Low"]
    hi_prev = (m["High"] - m["Close"].shift(1)).abs()
    lo_prev = (m["Low"] - m["Close"].shift(1)).abs()
    m["TR"] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(14, min_periods=14).mean()
    m["ATR"] = m["ATR_raw"].shift(1)

    # Volume metrics
    m["VOL_AVG"] = m["Volume"].rolling(14, min_periods=14).mean().shift(1)
    m["Prev_Volume"] = m["Volume"].shift(1)
    m["ADV20_$"] = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

    # Momentum
    m["Slope_9_5d"] = (m["EMA_9"] - m["EMA_9"].shift(5)) / m["EMA_9"].shift(5) * 100
    m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / m["ATR"]

    # Gap and body
    m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_over_ATR"] = m["Gap_abs"] / m["ATR"]
    m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]
    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    # Previous values
    m["Prev_Close"] = m["Close"].shift(1)
    m["Prev_Open"] = m["Open"].shift(1)
    m["Prev_High"] = m["High"].shift(1)

    return m

# ───────── HELPER FUNCTIONS ─────────
def abs_top_window(df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
    """Find absolute high/low in lookback window"""
    if df.empty:
        return (np.nan, np.nan)
    cutoff = d0 - pd.Timedelta(days=exclude_days)
    wstart = cutoff - pd.Timedelta(days=lookback_days)
    win = df[(df.index > wstart) & (df.index <= cutoff)]
    if win.empty:
        return (np.nan, np.nan)
    return float(win["Low"].min()), float(win["High"].max())

def pos_between(val, lo, hi):
    """Calculate position within range"""
    if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
        return np.nan
    return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

def _mold_on_row(rx: pd.Series) -> bool:
    """Check if row meets relaxed mold criteria"""
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

# ───────── CORE SCANNING LOGIC ─────────
def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan single symbol for Half A+ patterns"""
    try:
        df = fetch_daily(sym, start, end)
        if df.empty:
            return pd.DataFrame()
        m = add_daily_metrics(df)

        rows = []
        for i in range(2, len(m)):
            d0 = m.index[i]      # Current day (D0)
            r0 = m.iloc[i]       # D0 data
            r1 = m.iloc[i-1]     # D-1 data
            r2 = m.iloc[i-2]     # D-2 data

            # Backside context check
            lo_abs, hi_abs = abs_top_window(m, d0, P["abs_lookback_days"], P["abs_exclude_days"])
            pos_abs_prev = pos_between(r1["Close"], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= P["pos_abs_max"]):
                continue

            # Trigger validation (more flexible)
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

            # D-1 must be green (relaxed)
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
                continue

            # Volume requirements (relaxed)
            if P["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= P["d1_volume_min"]):
                    continue

            if P["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= P["d1_vol_mult_min"]):
                    continue

            # D-1 > D-2 requirement (kept for quality)
            if P["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 entry gates (relaxed)
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < P["gap_div_atr_min"]:
                continue
            if P["require_open_gt_prev_high"] and not (r0["Open"] > r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < P["open_over_ema9_min"]:
                continue

            # Calculate metrics
            d1_vol_mult = (r1["Volume"]/r1["VOL_AVG"]) if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0) else np.nan
            volsig_max = (max(r1["Volume"]/r1["VOL_AVG"], r2["Volume"]/r2["VOL_AVG"])
                         if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0 and pd.notna(r2["VOL_AVG"]) and r2["VOL_AVG"]>0)
                         else np.nan)

            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
                "Trigger": trig_tag,
                "PosAbs_window": round(float(pos_abs_prev), 3),
                "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 2),
                "D1Vol(shares)": int(r1["Volume"]) if pd.notna(r1["Volume"]) else np.nan,
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
                "Scanner_Type": "Half_A+",
            })

        return pd.DataFrame(rows)
    except Exception as e:
        print(f"Error scanning {sym}: {e}")
        return pd.DataFrame()

# ───────── MAIN EXECUTION ─────────
def main():
    print("🎯 HALF A+ SCANNER - 1/1/24 to 11/1/25")
    print("🔧 Relaxed Parameters for More Signals")
    print("=" * 60)

    # Date range
    fetch_start = "2024-01-01"
    fetch_end = "2025-11-01"

    print(f"📅 Scanning from {PRINT_FROM} to {PRINT_TO}")
    print(f"🎯 Processing {len(SYMBOLS)} symbols...")
    print(f"🔧 Using relaxed parameters for more signal generation")

    results = []
    processed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in SYMBOLS}
        for fut in as_completed(futs):
            sym = futs[fut]
            df = fut.result()
            if df is not None and not df.empty:
                results.append(df)
                print(f"✓ {sym}: {len(df)} signals")
            else:
                print(f"- {sym}: no signals")

            processed += 1
            if processed % 20 == 0:
                print(f"📊 Progress: {processed}/{len(SYMBOLS)} ({processed/len(SYMBOLS)*100:.1f}%)")

    if results:
        out = pd.concat(results, ignore_index=True)

        # Apply date filtering
        if PRINT_FROM:
            out = out[pd.to_datetime(out["Date"]) >= pd.to_datetime(PRINT_FROM)]
        if PRINT_TO:
            out = out[pd.to_datetime(out["Date"]) <= pd.to_datetime(PRINT_TO)]

        out = out.sort_values(["Date","Ticker"], ascending=[False, True])
        pd.set_option("display.max_columns", None, "display.width", 0)

        print(f"\n🎯 HALF A+ RESULTS: {len(out)} signals found")
        print("=" * 100)
        print(out.to_string(index=False))

        # Save results
        output_file = "half_a_plus_results_2024_2025.csv"
        out.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")

    else:
        print("❌ No HALF A+ signals found.")

if __name__ == "__main__":
    main()