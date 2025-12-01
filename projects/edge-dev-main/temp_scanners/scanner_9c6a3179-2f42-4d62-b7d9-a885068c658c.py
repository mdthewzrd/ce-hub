
# MARKET-WIDE SCANNING CONFIGURATION (Required for ALL scanners)
import json
import sys
import pandas as pd
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta

# Essential configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
PRINT_FROM = "2025-01-01"
PRINT_TO = "2025-11-01"

# MARKET-WIDE DATA FETCHING - Fetches ALL stocks dynamically (no symbol lists)
async def fetch_market_data(date, adjusted="true"):
    """Fetch ALL market data for a specific date using Polygon grouped API"""
    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adjusted}&apiKey={API_KEY}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    return df
    return pd.DataFrame()

def get_all_market_data():
    """Get complete market data for date range - THIS REPLACES SYMBOLS LISTS"""
    print(f"🚀 Fetching MARKET-WIDE data from {PRINT_FROM} to {PRINT_TO}")

    # Generate date range
    dates = pd.date_range(start=PRINT_FROM, end=PRINT_TO, freq='D')
    dates = [d.strftime('%Y-%m-%d') for d in dates]

    # Fetch ALL market data
    all_data = []
    for date in dates:
        try:
            df = asyncio.run(fetch_market_data(date))
            if not df.empty:
                all_data.append(df)
                print(f"✅ Fetched {len(df)} symbols for {date}")
        except Exception as e:
            print(f"❌ Error fetching {date}: {e}")

    if not all_data:
        raise Exception("No market data fetched")

    # Combine all data
    df = pd.concat(all_data, ignore_index=True)
    print(f"📊 MARKET-WIDE: {len(df)} data points across {df['ticker'].nunique()} unique tickers")

    # Sort by ticker and date for proper time series analysis
    df = df.sort_values(['ticker', 'date'])

    # Filter by requested date range
    df = df[(pd.to_datetime(df['date']) >= pd.to_datetime(PRINT_FROM)) &
           (pd.to_datetime(df['date']) <= pd.to_datetime(PRINT_TO))]

    return df

# SMART FILTERING: Intelligently filter market universe for performance
def apply_smart_filters(df):
    """Apply intelligent filters to reduce universe while preserving trading signals"""
    print(f"🧠 Applying smart filters to {len(df)} market data points...")

    # Basic quality filters - remove junk data
    df = df.dropna(subset=['o', 'h', 'l', 'c', 'v'])  # Remove rows with missing OHLCV
    df = df[df['v'] > 0]  # Remove zero-volume data
    df = df[df['c'] >= 1.0]  # Remove penny stocks and below

    # Liquidity filter - keep only liquid stocks (reduces universe significantly)
    avg_dollar_volume = (df['c'] * df['v']).groupby(df['ticker']).transform('mean')
    liquid_threshold = 1_000_000  # $1M average daily volume
    liquid_tickers = avg_dollar_volume >= liquid_threshold
    df = df[liquid_tickers]

    # Price range filter - focus on tradeable price range
    df = df[(df['c'] >= 5.0) & (df['c'] <= 1000.0)]

    # Volatility filter - keep stocks with reasonable price movement
    price_change_pct = abs(df['c'] - df['o']) / df['o']
    df = df[price_change_pct <= 0.50]  # Remove extreme >50% daily moves (likely data errors)

    filtered_tickers = df['ticker'].nunique()
    original_points = len(df)

    print(f"✅ Smart filtering complete:")
    print(f"   📊 Unique tickers: {filtered_tickers}")
    print(f"   📈 Data points: {original_points}")
    print(f"   🎯 Focus on high-quality, liquid stocks")

    return df

# CRITICAL: Create global MARKET_WIDE_DATA for scanners to use
RAW_MARKET_DATA = get_all_market_data()
MARKET_WIDE_DATA = apply_smart_filters(RAW_MARKET_DATA)
print(f"🌍 SMART-FILTERED MARKET-WIDE scanning active: {len(MARKET_WIDE_DATA)} market data points loaded")

# Helper function for scanners to get market data
def get_market_wide_data():
    """Return complete market data - scanners should use this instead of SYMBOLS lists"""
    return MARKET_WIDE_DATA

# Override any SYMBOLS variable in user code with market-wide approach
if 'SYMBOLS' in globals():
    print("⚠️  Replaced hardcoded SYMBOLS with MARKET-WIDE data")
    del SYMBOLS


# Import required libraries for execution wrapper
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Helper function to safely convert numpy types to Python native types
def safe_convert(value):
    import numpy as np
    if hasattr(value, 'item'):
        return value.item()
    elif hasattr(value, 'astype'):
        return float(value)
    elif isinstance(value, np.ndarray):
        return value.tolist()
    elif isinstance(value, (np.int64, np.int32, np.float64, np.float32)):
        return float(value)
    elif isinstance(value, (np.bool_, bool)):
        return bool(value)
    return value

# User's scanner code - MARKET-WIDE data is available as MARKET_WIDE_DATA

# FULL MARKET COVERAGE - Polygon API Configuration
POLYGON_API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io/v2"

# MARKET UNIVERSE - Complete Coverage
MARKET_UNIVERSE = {
    'nyse': true,
    'nasdaq': true,
    'etfs': true,
    'small_cap': true,
    'micro_cap': true,
    'nano_cap': true,
    'total_symbols': 20000
}

# MAXIMUM THREADING CONFIGURATION
MAX_WORKERS = 12
CHUNK_SIZE = 100

def get_comprehensive_market_symbols():
    """Get ALL market symbols - NYSE + NASDAQ + ETFs + Small/Micro/Nano Caps"""
    all_symbols = []

    # NYSE symbols
    if MARKET_UNIVERSE['nyse']:
        nyse_url = f"{BASE_URL}/reference/tickers?market=stocks&exchange=XNYS&limit=1000&apiKey={POLYGON_API_KEY}"
        response = requests.get(nyse_url)
        if response.status_code == 200:
            nyse_data = response.json()
            all_symbols.extend([result['ticker'] for result in nyse_data.get('results', [])])

    # NASDAQ symbols
    if MARKET_UNIVERSE['nasdaq']:
        nasdaq_url = f"{BASE_URL}/reference/tickers?market=stocks&exchange=XNAS&limit=1000&apiKey={POLYGON_API_KEY}"
        response = requests.get(nasdaq_url)
        if response.status_code == 200:
            nasdaq_data = response.json()
            all_symbols.extend([result['ticker'] for result in nasdaq_data.get('results', [])])

    # ETF symbols
    if MARKET_UNIVERSE['etfs']:
        etf_url = f"{BASE_URL}/reference/tickers?type=ETF&market=stocks&limit=1000&apiKey={POLYGON_API_KEY}"
        response = requests.get(etf_url)
        if response.status_code == 200:
            etf_data = response.json()
            all_symbols.extend([result['ticker'] for result in etf_data.get('results', [])])

    return all_symbols

def process_with_max_threading(symbols, scan_function):
    """Process symbols with MAXIMUM threading for optimal performance"""
    results = []

    # Create optimal chunks
    chunks = [symbols[i:i + CHUNK_SIZE] for i in range(0, len(symbols), CHUNK_SIZE)]

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all chunks for parallel processing
        future_to_chunk = {executor.submit(scan_function, chunk): chunk for chunk in chunks}

        # Collect results as they complete
        for future in as_completed(future_to_chunk):
            try:
                chunk_results = future.result()
                results.extend(chunk_results)
            except Exception as e:
                print(f"Chunk processing error: {e}")

    return results


import requests
import os
# daily_para_backside_lite_scan.py
# Daily-only "A+ para, backside" scan — lite mold.
# Trigger: D-1 (or D-2) fits; trade day (D0) must gap & open > D-1 high.
# D-1 must take out D-2 high and close above D-2 close.
# Adds absolute D-1 volume floor: d1_volume_min.

import pandas as pd, numpy as np, requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ───────── config ─────────
session  = requests.Session()
API_KEY  = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 6

PRINT_FROM = "2025-01-01"  # set None to keep all
PRINT_TO   = None

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

# ───────── universe ─────────
SYMBOLS = get_comprehensive_market_symbols()

# ───────── fetch ─────────
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
    df = fetch_daily(sym, start, end)
    if df.empty: return pd.DataFrame()
    m  = add_daily_metrics(df)

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

# ───────── main ─────────
if __name__ == "__main__":
    fetch_start = "2020-01-01"
    fetch_end   = datetime.today().strftime("%Y-%m-%d")

    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in SYMBOLS}
        for fut in as_completed(futs):
            df = fut.result()
            if df is not None and not df.empty:
                results.append(df)

    if results:
        out = pd.concat(results, ignore_index=True)
        if PRINT_FROM:
            out = out[pd.to_datetime(out["Date"]) >= pd.to_datetime(PRINT_FROM)]
        if PRINT_TO:
            out = out[pd.to_datetime(out["Date"]) <= pd.to_datetime(PRINT_TO)]
        out = out.sort_values(["Date","Ticker"], ascending=[False, True])
        pd.set_option("display.max_columns", None, "display.width", 0)
        print("\nBackside A+ (lite) — trade-day hits:\n")
        print(out.to_string(index=False))
    else:
        print("No hits. Consider relaxing high_ema9_mult / gap_div_atr_min / d1_volume_min.")

print("🌍 MARKET-WIDE execution: User code loaded with complete market data")

# MARKET-WIDE execution wrapper
if __name__ == "__main__":
    try:
        print(f"🚀 Starting MARKET-WIDE scanner execution from {PRINT_FROM} to {PRINT_TO}")
        print(f"📊 Processing {len(MARKET_WIDE_DATA)} market data points across {MARKET_WIDE_DATA['ticker'].nunique()} tickers")

        results = []

        # MARKET-WIDE SCANNING LOGIC
        if 'scan_symbol' in globals():
            # Traditional scanner approach - iterate through all tickers in market data
            print("🔧 Using symbol-by-symbol MARKET-WIDE scanning")

            def execute_scan_symbol(sym):
                try:
                    df_sym = MARKET_WIDE_DATA[MARKET_WIDE_DATA['ticker'] == sym].copy()
                    if not df_sym.empty:
                        # Convert data format to match traditional scanner expectations
                        df_sym['Date'] = pd.to_datetime(df_sym['date'])
                        df_sym = df_sym.set_index('Date')
                        df_sym = df_sym.rename(columns={'o': 'Open', 'h': 'High', 'l': 'Low', 'c': 'Close', 'v': 'Volume'})

                        # Call user's scan function
                        result_df = globals()['scan_symbol'](sym, PRINT_FROM, PRINT_TO)
                        if result_df is not None and not result_df.empty:
                            return result_df
                except Exception as e:
                    print(f"❌ Error scanning {sym}: {e}")
                return None

            # Process all unique tickers from market data
            all_tickers = sorted(MARKET_WIDE_DATA['ticker'].unique())
            print(f"🌍 Processing {len(all_tickers)} tickers from MARKET-WIDE data")

            # Batch processing for performance
            batch_size = 100
            max_workers = 6

            for i in range(0, len(all_tickers), batch_size):
                batch_tickers = all_tickers[i:i+batch_size]
                print("📊 Batch {}: Processing {} tickers".format(i//batch_size + 1, len(batch_tickers)))

                batch_results = []
                with ThreadPoolExecutor(max_workers=max_workers) as executor:
                    futures = {executor.submit(execute_scan_symbol, sym): sym for sym in batch_tickers}
                    for future in as_completed(futures):
                        try:
                            df = future.result()
                            if df is not None and not df.empty:
                                batch_results.append(df)
                        except Exception as e:
                            print(f"❌ Batch error: {e}")

                if batch_results:
                    results.extend(batch_results)
                    print(f"✅ Batch complete: {len(batch_results)} results")

        else:
            # Market-wide scanner approach - user processes MARKET_WIDE_DATA directly
            print("🔧 Using MARKET-WIDE data processing approach")

            # User code should process MARKET_WIDE_DATA directly
            # Look for results in global scope after user code execution
            for var_name, var_value in globals().items():
                if var_name not in ['MARKET_WIDE_DATA', 'results'] and hasattr(var_value, '__iter__'):
                    try:
                        if hasattr(var_value, '__len__') and len(var_value) > 0:
                            # Convert DataFrames or lists of results
                            import pandas as pd
                            if isinstance(var_value, pd.DataFrame) and not var_value.empty:
                                results.append(var_value)
                            elif isinstance(var_value, list):
                                for item in var_value:
                                    if isinstance(item, pd.DataFrame) and not item.empty:
                                        results.append(item)
                    except:
                        continue

        print(f"✅ MARKET-WIDE scan completed: Found results across {len(results)} data sets")

        # Convert results to our expected format
        signals = []
        if results:
            # Combine all result DataFrames
            import pandas as pd
            try:
                out = pd.concat(results, ignore_index=True)

                # Convert date columns properly
                if 'Date' in out.columns:
                    out['Date'] = pd.to_datetime(out['Date'])
                    if PRINT_FROM:
                        out = out[out['Date'] >= pd.to_datetime(PRINT_FROM)]
                    if PRINT_TO:
                        out = out[out['Date'] <= pd.to_datetime(PRINT_TO)]

                # Convert each row to our signal format
                for _, row in out.iterrows():
                    signal = {
                        'ticker': safe_convert(row.get('Ticker', row.get('ticker', ''))),
                        'date': str(row.get('Date', row.get('date', ''))),
                        'trigger': safe_convert(row.get('Trigger', row.get('trigger', ''))),
                        'pos_abs': safe_convert(row.get('PosAbs_1000d', 0)),
                        'gap_atr': safe_convert(row.get('Gap/ATR', 0)),
                        'volume': int(safe_convert(row.get('D1Vol(shares)', row.get('Volume', row.get('volume', 0))))),
                        'volume_avg_ratio': safe_convert(row.get('D1Vol/Avg', 0)),
                        'open_prev_high': bool(row.get('Open>PrevHigh', False)),
                        'slope_5d': safe_convert(row.get('Slope9_5d', 0)),
                        'score': round(float(safe_convert(row.get('Gap/ATR', 0))), 2)
                    }
                    signals.append(signal)
            except Exception as e:
                print(f"❌ Error combining results: {e}")
                # Fallback: just return raw results
                for result_set in results:
                    if hasattr(result_set, 'to_dict'):
                        for _, row in result_set.iterrows():
                            signal = {'ticker': '', 'date': '', 'gap_atr': 0}
                            for col, val in row.items():
                                if col.lower() in ['ticker', 'symbol']:
                                    signal['ticker'] = str(val)
                                elif col.lower() in ['date']:
                                    signal['date'] = str(val)
                                elif 'gap' in col.lower() and 'atr' in col.lower():
                                    signal['gap_atr'] = float(val)
                                    signal['score'] = round(float(val), 2)
                            signals.append(signal)

        print(f"✅ MARKET-WIDE scan completed: Found {len(signals)} trading opportunities")

        # Output in JSON format for Edge.dev
        symbols_scanned_count = MARKET_WIDE_DATA['ticker'].nunique() if 'MARKET_WIDE_DATA' in globals() else 'market-wide'
        result = {
            'success': True,
            'results': signals,
            'total_signals': len(signals),
            'symbols_scanned': symbols_scanned_count,
            'execution_time': datetime.now().isoformat(),
            'message': f'MARKET-WIDE execution completed across {symbols_scanned_count} symbols'
        }

        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'execution_time': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
      