#!/usr/bin/env python3
"""
Enhanced Backside B Scanner - Russell 2000 + Micro/Nano Caps
===========================================================
Extended version with comprehensive small-cap universe coverage

Features:
- Russell 2000 tickers (IWM holdings proxy)
- Micro and nano cap tickers
- Enhanced universe for small-cap opportunities
- Original backside B parameters preserved
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
import sys
from pathlib import Path
warnings.filterwarnings("ignore")

# Add the projects path to import the universe functions
sys.path.append(str(Path(__file__).parent.parent / "projects" / "edge-dev-main" / "backend"))

from true_full_universe import (
    get_russell_2000_universe,
    get_micro_nano_cap_universe,
    get_enhanced_small_cap_universe
)

# ───────── CONFIGURATION ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 8

# DATE RANGE: 1/1/24 - 11/1/25
PRINT_FROM = "2024-01-01"
PRINT_TO = "2025-11-01"

# ───────── BACKSIDE B PARAMETERS (Original values preserved) ─────────
P = {
    # hard liquidity / price (original values)
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # backside context (absolute window)
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,

    # trigger mold (evaluated on D-1 or D-2)
    "trigger_mode": "D1_or_D2",
    "atr_mult": 0.9,
    "vol_mult": 0.9,

    # Absolute D-1 volume floor
    "d1_volume_min": 15_000_000,
    "d1_vol_mult_min": None,

    # momentum parameters
    "slope5d_min": 3.0,
    "high_ema9_mult": 1.05,

    # trade-day (D0) gates
    "gap_min_atr": 0.5,
    "open_vs_ema9": 1.00,
    "body_min_atr": 0.3,
    "close_vs_open": 0.60,

    # relative requirement
    "enforce_d1_above_d2": True,
}

# ───────── SYMBOL UNIVERSE OPTIONS ─────────
def get_symbol_universe(universe_type="enhanced_small_cap"):
    """
    Get symbol universe based on specified type

    Args:
        universe_type: Options:
            - "original" - Original 71 tickers
            - "russell_2000" - Russell 2000 tickers
            - "micro_nano" - Micro and nano caps
            - "enhanced_small_cap" - Russell 2000 + micro/nano caps (recommended)

    Returns:
        List of ticker symbols
    """

    # Original universe for comparison
    original_symbols = [
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

    print(f"\n🎯 SELECTED UNIVERSE TYPE: {universe_type}")
    print("=" * 50)

    if universe_type == "original":
        print(f"📊 Original universe: {len(original_symbols)} tickers")
        return original_symbols
    elif universe_type == "russell_2000":
        symbols = get_russell_2000_universe()
        return symbols
    elif universe_type == "micro_nano":
        symbols = get_micro_nano_cap_universe()
        return symbols
    elif universe_type == "enhanced_small_cap":
        symbols = get_enhanced_small_cap_universe()
        return symbols
    else:
        print(f"❌ Unknown universe type: {universe_type}")
        print("Defaulting to enhanced small cap universe...")
        return get_enhanced_small_cap_universe()

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
    """Check if row meets mold criteria"""
    if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
        return False

    # hard gates
    if (rx["Close"] < P["price_min"] or
        rx["ADV20_$"] < P["adv20_min_usd"] or
        rx["Prev_Volume"] < P["d1_volume_min"]):
        return False

    # trigger mold: ATR and Volume
    atr_ok = (rx["High"] - rx["Low"]) >= (P["atr_mult"] * rx["ATR"])
    vol_ok = rx["Prev_Volume"] >= (P["vol_mult"] * rx["VOL_AVG"])

    return (atr_ok and vol_ok and
            rx["Slope_9_5d"] >= P["slope5d_min"] and
            rx["High_over_EMA9_div_ATR"] >= P["high_ema9_mult"])

def _gates_on_row(rx: pd.Series) -> bool:
    """Check if row meets D0 gates"""
    return (rx["Gap_over_ATR"] >= P["gap_min_atr"] and
            rx["Open_over_EMA9"] >= P["open_vs_ema9"] and
            rx["Body_over_ATR"] >= P["body_min_atr"] and
            (rx["Close"] - rx["Open"]) / abs(rx["Close"] - rx["Open"]) >= P["close_vs_open"])

def scan_symbol(symbol: str, start: str, end: str):
    """Scan individual symbol for backside B signals"""
    try:
        data = fetch_daily(symbol, start, end)
        if data.empty:
            return None

        df = add_daily_metrics(data)
        if df.empty or len(df) < 100:
            return None

        results = []
        for i, (d0, row) in enumerate(df.iterrows()):
            if i < 50:  # Skip early days for indicator stability
                continue

            # Look for D-1 or D-2 trigger
            trigger_dates = []
            for offset in [1, 2]:
                if i - offset >= 0:
                    prev_row = df.iloc[i - offset]
                    if _mold_on_row(prev_row):
                        trigger_dates.append(i - offset)

            if not trigger_dates:
                continue

            # D0 gates
            if not _gates_on_row(row):
                continue

            # Absolute context
            abs_low, abs_high = abs_top_window(df, d0, P["abs_lookback_days"], P["abs_exclude_days"])
            if pd.isna(abs_low) or pd.isna(abs_high):
                continue

            abs_pos = pos_between(row["Close"], abs_low, abs_high)
            if pd.isna(abs_pos) or abs_pos > P["pos_abs_max"]:
                continue

            # Get latest trigger (D-1 or D-2)
            latest_trigger = max(trigger_dates)
            trigger_row = df.iloc[latest_trigger]

            result = {
                "Date": d0.strftime("%Y-%m-%d"),
                "Ticker": symbol,
                "Close": round(row["Close"], 2),
                "Volume": int(row["Volume"]),
                "Gap_ATR": round(row["Gap_over_ATR"], 3),
                "Body_ATR": round(row["Body_over_ATR"], 3),
                "High_EMA9_ATR": round(trigger_row["High_over_EMA9_div_ATR"], 3),
                "Slope5d": round(trigger_row["Slope_9_5d"], 2),
                "ADV20_$": round(row["ADV20_$"], 0),
                "Abs_Pos": round(abs_pos, 3),
                "Trigger_Day": "D-1" if latest_trigger == i - 1 else "D-2"
            }
            results.append(result)

        return results

    except Exception as e:
        print(f"Error scanning {symbol}: {e}")
        return None

# ───────── MAIN SCANNER ─────────
def run_enhanced_scanner(universe_type="enhanced_small_cap", output_file=None):
    """
    Run the enhanced backside B scanner with specified universe

    Args:
        universe_type: Type of symbol universe to use
        output_file: Optional output filename (auto-generated if None)
    """

    # Get symbol universe
    SYMBOLS = get_symbol_universe(universe_type)

    print(f"\n🚀 ENHANCED BACKSIDE B SCANNER")
    print("=" * 60)
    print(f"Universe: {universe_type}")
    print(f"Symbols: {len(SYMBOLS)}")
    print(f"Date Range: {PRINT_FROM} to {PRINT_TO}")
    print(f"Workers: {MAX_WORKERS}")
    print("=" * 60)

    fetch_start = PRINT_FROM
    fetch_end = PRINT_TO

    all_signals = []
    processed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in SYMBOLS}

        for fut in as_completed(futs):
            symbol = futs[fut]
            try:
                results = fut.result()
                if results:
                    all_signals.extend(results)
                    print(f"✅ {symbol}: {len(results)} signals")
                else:
                    print(f"   {symbol}: No signals")
            except Exception as e:
                print(f"❌ {symbol}: Error - {e}")

            processed += 1
            if processed % 10 == 0:
                print(f"📊 Progress: {processed}/{len(SYMBOLS)} ({processed/len(SYMBOLS)*100:.1f}%)")

    # Sort and save results
    if all_signals:
        df = pd.DataFrame(all_signals)
        df = df.sort_values(['Date', 'Close'], ascending=[False, False])

        # Generate output filename if not provided
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"enhanced_backside_b_{universe_type}_{timestamp}.csv"

        df.to_csv(output_file, index=False)

        print(f"\n🎉 SCAN COMPLETE!")
        print(f"   Total Signals: {len(df)}")
        print(f"   Unique Tickers: {df['Ticker'].nunique()}")
        print(f"   Date Range: {df['Date'].min()} to {df['Date'].max()}")
        print(f"   Output: {output_file}")

        # Show top 10 signals
        print(f"\n🔥 TOP 10 SIGNALS:")
        print(df.head(10)[['Date', 'Ticker', 'Close', 'ADV20_$', 'Abs_Pos']].to_string(index=False))

        return df
    else:
        print("\n❌ NO SIGNALS FOUND")
        return None

# ───────── CLI INTERFACE ─────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Enhanced Backside B Scanner')
    parser.add_argument('--universe',
                       choices=['original', 'russell_2000', 'micro_nano', 'enhanced_small_cap'],
                       default='enhanced_small_cap',
                       help='Symbol universe to scan')
    parser.add_argument('--output', help='Output CSV filename')

    args = parser.parse_args()

    run_enhanced_scanner(universe_type=args.universe, output_file=args.output)