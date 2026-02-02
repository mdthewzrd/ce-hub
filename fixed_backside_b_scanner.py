#!/usr/bin/env python3
"""
FIXED BACKSIDE B SCANNER - Asyncio Event Loop Compatible
================================================================
Fixed to work with FastAPI backend by removing asyncio.run() conflicts
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

# INFRASTRUCTURE CONSTANTS (ENHANCED)
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"  # Preserved from original
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 16  # Enhanced threading

# NYSE calendar for trading days
nyse = mcal.get_calendar('NYSE')
executor = ThreadPoolExecutor()

# INFRASTRUCTURE: Enhanced date calculation (FIXED)
def get_proper_date_range(start_date_str: str = None, end_date_str: str = None) -> tuple:
    """
    INFRASTRUCTURE: Proper date calculation to avoid future dates
    """
    if end_date_str:
        end_date = pd.to_datetime(end_date_str).date()
    else:
        # Use today's date, not future dates (BUG FIX)
        end_date = datetime.now().date()

    if start_date_str:
        start_date = pd.to_datetime(start_date_str).date()
    else:
        # Calculate proper 90-day lookback (FIXED CALCULATION)
        trading_days = nyse.valid_days(
            start_date=end_date - timedelta(days=200),  # Get enough calendar days
            end_date=end_date
        )

        # Take last 90 trading days
        if len(trading_days) >= 90:
            start_date = trading_days[-90].date()
        else:
            start_date = trading_days[0].date()

    return start_date, end_date

# ============================================================================
# CORE SCANNER LOGIC (Simplified and working)
# ============================================================================

def scan_symbol(sym: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Simplified backside B scanner that finds basic gap patterns
    """
    df = fetch_daily_sync(sym, start_date, end_date)
    if df.empty:
        return pd.DataFrame()

    m = add_daily_metrics(df)

    rows = []
    for i in range(2, len(m)):
        d0 = m.index[i]
        r0 = m.iloc[i]       # D0
        r1 = m.iloc[i-1]     # D-1
        r2 = m.iloc[i-2]     # D-2

        # Basic gap criteria
        if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < 0.75:
            continue

        # Volume criteria
        if pd.isna(r1["Volume"]) or r1["Volume"] < 15_000_000:
            continue

        # D-1 must be green (basic check)
        if pd.isna(r1["Body_over_ATR"]) or r1["Body_over_ATR"] < 0.30:
            continue

        # Gap up requirement
        if r0["Open"] <= r1["High"]:
            continue

        rows.append({
            "Ticker": sym,
            "Date": d0.strftime("%Y-%m-%d"),
            "Gap/ATR": round(float(r0["Gap_over_ATR"]), 2),
            "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 2),
            "D1Vol(shares)": int(r1["Volume"]) if pd.notna(r1["Volume"]) else 0,
            "Open/EMA9": round(float(r0["Open_over_EMA9"]), 2) if pd.notna(r0["Open_over_EMA9"]) else 0,
            "Open>PrevHigh": bool(r0["Open"] > r1["High"]),
        })

    return pd.DataFrame(rows)

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Add technical indicators to dataframe"""
    if df.empty:
        return df

    m = df.copy()
    try:
        m.index = m.index.tz_localize(None)
    except Exception:
        pass

    # Basic moving averages
    m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()

    # ATR calculation
    hi_lo = m["High"] - m["Low"]
    hi_prev = (m["High"] - m["Close"].shift(1)).abs()
    lo_prev = (m["Low"] - m["Close"].shift(1)).abs()
    m["TR"] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(14, min_periods=14).mean()
    m["ATR"] = m["ATR_raw"].shift(1)

    # Volume metrics
    m["VOL_AVG"] = m["Volume"].rolling(14, min_periods=14).mean().shift(1)
    m["ADV20_$"] = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

    # Derived metrics
    m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_over_ATR"] = m["Gap_abs"] / m["ATR"]
    m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]
    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    return m

def fetch_daily_sync(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Synchronous fetch for compatibility with event loop
    """
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"

    try:
        response = requests.get(url, params={'apiKey': API_KEY, 'limit': 5000}, timeout=30)
        if response.status_code == 200:
            data = response.json()
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
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return pd.DataFrame()

# ============================================================================
# MAIN SCAN FUNCTION (Event Loop Compatible)
# ============================================================================

async def run_backside_b_scan(start_date: str = None, end_date: str = None) -> List[Dict]:
    """
    Main scan function that works within existing event loops
    """
    # Get date range
    start_date, end_date = get_proper_date_range(start_date, end_date)

    # Use limited symbol set for testing
    symbols = [
        'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
        'NFLX','SNAP','RBLX','META','SE','NVDA','AAPL','MSFT','GOOGL','AMZN','TSLA',
        'AMD','INTC','BA','PYPL','QCOM','ORCL','KO','PEP','ABBV','JNJ','CRM','BAC',
        'JPM','WMT','CVX','XOM','COP','RTX','SPGI','GS','HD','LOW','COST','UNH','NKE',
        'LMT','HON','CAT','LIN','ADBE','AVGO','TXN','ACN','UPS','BLK','PM','ELV','VRTX',
        'ZTS','NOW','ISRG','PLD','MS','MDT','WM','GE','IBM','BKNG','FDX','ADP','EQIX'
    ]

    print(f"🎯 Scanning {len(symbols)} symbols from {start_date} to {end_date}")

    results = []

    # Process symbols sequentially to avoid overwhelming API
    for i, symbol in enumerate(symbols):
        try:
            df = fetch_daily_sync(symbol, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
            if not df.empty:
                scan_results = scan_symbol(symbol, start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
                if not scan_results.empty:
                    for _, row in scan_results.iterrows():
                        results.append({
                            'ticker': row['Ticker'],
                            'date': row['Date'],
                            'gap_percent': row['Gap/ATR'],
                            'volume': row['D1Vol(shares)'],
                            'body_atr': row['D1_Body/ATR']
                        })

            if i % 20 == 0:
                print(f"Processed {i}/{len(symbols)} - Found {len(results)} patterns")

        except Exception as e:
            continue

    print(f"🎯 Scan complete! Found {len(results)} patterns")
    return results

# ============================================================================
# COMPATIBILITY ENTRY POINTS
# ============================================================================

async def main_async():
    """Async entry point"""
    return await run_backside_b_scan()

def main_sync():
    """Synchronous entry point for backend execution"""
    try:
        # Check if we're in an async context
        loop = asyncio.get_running_loop()
        # We're in an async context, create a task
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(asyncio.run, main_async())
            return future.result()
    except RuntimeError:
        # No running loop, safe to use asyncio.run()
        return asyncio.run(main_async())

if __name__ == "__main__":
    print("🎯 Testing Fixed Backside B Scanner (Event Loop Compatible)")

    # Test compatibility check
    try:
        loop = asyncio.get_running_loop()
        print("✅ Running in existing event loop - using compatible execution")
        results = main_sync()
    except RuntimeError:
        print("✅ No running event loop - using direct asyncio.run()")
        results = asyncio.run(main_async())

    print(f"\n🎯 Found {len(results)} patterns")

    if results:
        print("\n📊 Top results:")
        for i, result in enumerate(results[:10], 1):
            print(f"  {i:2d}. {result['ticker']:>6} | {result['date']} | Gap: {result['gap_percent']:.1%} | Vol: {result['volume']:,}")

    print("\n✅ FIXED: Event loop compatible")