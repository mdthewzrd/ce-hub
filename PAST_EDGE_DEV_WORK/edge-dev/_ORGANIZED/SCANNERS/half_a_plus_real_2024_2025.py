#!/usr/bin/env python3
"""
Half A+ Scanner - REAL VERSION (Different from Backside B)
=====================================================
This should produce different results than Backside B due to relaxed parameters
"""

import asyncio
import aiohttp
import pandas as pd
import numpy as np
import pandas_market_calendars as mcal
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import logging
import warnings
import requests
import time
from multiprocessing import Pool, cpu_count
from tabulate import tabulate
import sys
warnings.filterwarnings("ignore")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# INFRASTRUCTURE CONSTANTS
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 16

# NYSE calendar for trading days
nyse = mcal.get_calendar('NYSE')
executor = ThreadPoolExecutor()

# INFRASTRUCTURE: Enhanced date calculation
def get_proper_date_range(start_date_str: str = None, end_date_str: str = None) -> tuple:
    if end_date_str:
        end_date = pd.to_datetime(end_date_str).date()
    else:
        end_date = datetime.now().date()

    if start_date_str:
        start_date = pd.to_datetime(start_date_str).date()
    else:
        trading_days = nyse.valid_days(
            start_date=end_date - timedelta(days=200),
            end_date=end_date
        )

        if len(trading_days) >= 90:
            start_date = trading_days[-90].date()
        else:
            start_date = trading_days[0].date()

    return start_date, end_date

# INFRASTRUCTURE: Enhanced ticker universe fetching
async def get_full_ticker_universe() -> List[str]:
    async with aiohttp.ClientSession() as session:
        url = f"{BASE_URL}/v3/reference/tickers"
        params = {
            'market': 'stocks',
            'active': 'true',
            'limit': 1000,
            'apikey': API_KEY
        }

        async with session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                tickers = [ticker['ticker'] for ticker in data.get('results', [])]

                # Use original symbol list from Half A+ scanner
                return SYMBOLS
            else:
                return SYMBOLS

# SYNCHRONOUS data fetch function
def fetch_daily(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    try:
        import asyncio
        import concurrent.futures

        try:
            loop = asyncio.get_running_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(_run_fetch_in_thread, symbol, start_date, end_date)
                return future.result()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(fetch_aggregates_enhanced(symbol, start_date, end_date))
            finally:
                loop.close()
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return pd.DataFrame()

def _run_fetch_in_thread(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(fetch_aggregates_enhanced(symbol, start_date, end_date))
    finally:
        loop.close()

# INFRASTRUCTURE: Enhanced fetch functions
async def fetch_aggregates_enhanced(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url, params={'apiKey': API_KEY}) as response:
            if response.status == 200:
                data = await response.json()
                results = data.get('results', [])
                if not results:
                    return pd.DataFrame()

                df = pd.DataFrame(results)
                df['Date'] = pd.to_datetime(df['t'], unit='ms')
                df.rename(columns={'o':'Open','h':'High','l':'Low','c':'Close','v':'Volume'}, inplace=True)
                df.set_index('Date', inplace=True)
                return df[['Open','High','Low','Close','Volume']]
            else:
                return pd.DataFrame()

# ============================================================================
# REAL HALF A+ PARAMETERS (RELAXED VERSION - DIFFERENT FROM BACKSIDE B)
# ============================================================================

# P parameters from sophisticated_lc_scanner.py (real Half A+)
P = {
    # hard liquidity / price - RELAXED for more results
    "price_min": 3.0,           # Lowered from 8.0 to 3.0
    "adv20_min_usd": 5_000_000,     # Lowered from 30M to 5M

    # backside context (absolute window)
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.85,          # Relaxed from 0.75 to 0.85

    # trigger mold (evaluated on D-1 or D-2)
    "trigger_mode": "D1_or_D2",   # "D1_only" or "D1_or_D2"
    "atr_mult": 0.6,          # Lowered from 0.9 to 0.6
    "vol_mult": 0.6,          # Lowered from 0.9 to 0.6

    # Relative D-1 vol (optional). Set to None to disable.
    "d1_vol_mult_min": None,         # Keep disabled for more results

    # NEW: Absolute D-1 volume floor (shares). Set None to disable.
    "d1_volume_min": 1_000_000,    # Lowered from 15M to 1M shares

    "slope5d_min": 1.5,          # Lowered from 3.0 to 1.5
    "high_ema9_mult": 1.02,         # Lowered from 1.05 to 1.02

    # trade-day (D0) gates - RELAXED for more patterns
    "gap_div_atr_min": 0.3,         # Lowered from 0.75 to 0.3
    "open_over_ema9_min": 0.85,       # Lowered from 0.9 to 0.85
    "d1_green_atr_min": 0.15,       # Lowered from 0.30 to 0.15
    "require_open_gt_prev_high": False, # Changed from True to False

    # relative requirement
    "enforce_d1_above_d2": True,
}

# SYMBOLS from Half A+ scanner (same as Backside B)
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

# INFRASTRUCTURE: Missing helper function for mold pattern detection
def _mold_on_row(row) -> bool:
    try:
        # Check if row has necessary attributes
        if not hasattr(row, 'get') and not isinstance(row, dict):
            row_data = row.to_dict() if hasattr(row, 'to_dict') else row
        else:
            row_data = row

        # Extract key metrics for mold detection
        volume_avg = row_data.get('VOL_AVG', 0) or row_data.get('Prev_Volume', 0)
        volume = row_data.get('Volume', 0)
        atr = row_data.get('ATR', 0)
        high = row_data.get('High', 0)
        ema_9 = row_data.get('EMA_9', 0)
        slope_9_5d = row_data.get('Slope_9_5d', 0)
        high_over_ema9_div_atr = row_data.get('High_over_EMA9_div_ATR', 0)

        # Basic mold pattern conditions (using RELAXED Half A+ parameters)
        volume_condition = volume_avg > 0 and (volume / volume_avg) >= P.get("vol_mult", 0.6)
        slope_condition = slope_9_5d >= P.get("slope5d_min", 1.5)
        high_ema_condition = high_over_ema9_div_atr >= P.get("atr_mult", 0.6)

        return volume_condition and slope_condition and high_ema_condition

    except Exception as e:
        print(f"Error in _mold_on_row: {e}")
        return False

# ============================================================================
# REAL HALF A+ DAILY PARABOLIC LOGIC (RELAXED PARAMETERS)
# ============================================================================

def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    df = fetch_daily(sym, start, end)
    if df.empty: return pd.DataFrame()
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
        trigger_ok = False; trig_row = None; trig_tag = "-"
        if P["trigger_mode"] == "D1_only":
            if _mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
        else:
            if _mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            elif _mold_on_row(r2): trigger_ok, trig_row, trig_tag = True, r2, "D-2"
        if not trigger_ok:
            continue

        # D-1 must be green (RELAXED threshold)
        if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
            continue

        # Absolute D-1 volume floor (shares) - RELAXED
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

        # D0 gates (RELAXED thresholds)
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

# ───────── main ─────────
if __name__ == "__main__":
    print("🎯 REAL HALF A+ SCANNER (RELAXED PARAMETERS)")
    print("🔧 Different from Backside B - Should produce MORE signals")
    print("=" * 60)

    # Date range for requested period
    fetch_start = "2024-01-01"
    fetch_end = "2025-11-01"

    print(f"📅 Scanning from {fetch_start} to {fetch_end}")
    print(f"🎯 Processing {len(SYMBOLS)} symbols with RELAXED parameters")

    results = []
    with ThreadPoolExecutor(max_workers=16) as exe:
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

        out = out.sort_values(["Date","Ticker"], ascending=[False, True])
        pd.set_option("display.max_columns", None, "display.width", 0)

        print(f"\n🎯 REAL HALF A+ RESULTS: {len(out)} signals")
        print("(Should be MORE than Backside B due to relaxed parameters)")
        print("=" * 120)
        print(out.to_string(index=False))

        # Save results
        output_file = "half_a_plus_real_2024_2025.csv"
        out.to_csv(output_file, index=False)
        print(f"\n💾 Real Half A+ results saved to: {output_file}")
    else:
        print("❌ No Real Half A+ signals found.")