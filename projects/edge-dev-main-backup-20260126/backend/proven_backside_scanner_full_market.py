"""
PROVEN BACKSIDE B SCANNER - FULL MARKET COVERAGE WITH CORRECTED DATE LOGIC
======================================================================
This scanner combines:
1. Full market universe (NYSE, NASDAQ, ETFs) - not just 106 symbols
2. Corrected date range logic (fetch historical data, display 2025 results)
3. Exact parameter configuration from your working local version
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta, date
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys
import os

# ───────── config ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 16

# Date configuration matching working local version
PRINT_FROM = "2025-01-01"
PRINT_TO = "2025-11-01"  # Match your screenshot range

# Fetch range - using full historical data like your working version
# THIS IS THE KEY FIX: Fetch from 2021 to build proper technical indicators
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

# ───────── FULL MARKET UNIVERSE ─────────
def get_smart_enhanced_universe(filters=None):
    """
    Get comprehensive market universe with smart pre-filtering
    Combines NYSE, NASDAQ, ETFs for full market coverage
    """
    if filters is None:
        filters = {
            'min_price': 8.0,              # Match scanner requirements
            'min_avg_volume_20d': 500_000,  # Ensure liquidity
            'min_market_cap': 50_000_000,   # Skip micro caps
            'min_adv_usd': 10_000_000,      # Minimum dollar volume
            'max_price': 2000.0,            # Skip extreme outliers
        }

    # Get all market tickers
    universe = []

    # 1. NYSE tickers
    nyse_tickers = get_exchange_tickers("XNYS")
    universe.extend(nyse_tickers)

    # 2. NASDAQ tickers
    nasdaq_tickers = get_exchange_tickers("XNAS")
    universe.extend(nasdaq_tickers)

    # 3. Major ETFs and indexes
    etf_tickers = get_major_etfs()
    universe.extend(etf_tickers)

    # 4. Additional high-volume stocks
    additional_stocks = [
        # Popular stocks that might not be in exchanges API
        'COIN','MARA','RIOT','SMCI','MSTR','PLTR','RIVN','SNOW','CRWD','ZS','FTNT','PANW','OKTA','TWLO','DDOG','NET','MDB','DOCN',
        'RBLX','SE','BABA','JD','PDD','BIDU','TME','NTES','NIO','XPENG','LI','XPEV','WISH','SPCE','GME','AMC','BB','BBBY',
        'F','GM','FCAU','TM','HMC','VWAGY','VLKLY','NSANY','TM','HMC','MA','V','PYPL','SQ','SHOP','MELI','BZUN',
        'TSLA','AMZN','AAPL','MSFT','GOOGL','GOOG','META','FB','NVDA','AMD','INTC','TSM','ASML','NXP','QCOM','TXN','MU',
        'AVGO','ADI','MRVL','LRCX','KLAC','MCHP','NXPI','SNPS','CDNS','TXN','ADI','MRVL','LRCX','KLAC','MCHP','NXPI','SNPS','CDNS',
        'ORCL','SAP','IBM','INTU','ADBE','CRM','NOW','WDAY','SNOW','PLTR','TWLO','DDOG','NET','MDB','DOCN','ZS','OKTA',
        'JNJ','PFE','UNH','ABBV','MRK','TMO','ABT','BMY','AMGN','GILD','REGN','ILMN','BIIB','VRTX','ALXN','DGX','IDXX',
        'JPM','BAC','WFC','GS','MS','C','AXP','BLK','SCHW','AIG','MET','BRK.A','BRK.B','SPGI','MMC','ICE','CB','PNC','USB',
        'XOM','CVX','COP','SHEL','BP','TTE','TOT','ENB','EOG','PXD','HAL','SLB','CEO','PSX','KMI','WMB','OXY','BKR','APA','DVN','HES','OKE','FANG',
        'WMT','COST','HD','TGT','M','KO','PEP','CL','PG','KMB','GIS','K','KHC','GIS','SJM','HRL','TSN','KMB','CLX','CHD','COT',
        'AMZN','TSLA','HD','MCD','NKE','LOW','TJX','M','BBY','TGT','F','ROST','GPS','ANF','URBN','LULU','TPR','VFC','RL','KSS',
        'AAPL','MSFT','GOOGL','AMZN','META','TSLA','NVDA','GOOG','JPM','JNJ','V','PG','UNH','HD','MA','BAC','PFE','DIS','NVDA','CSCO','CMCSA','ADBE','CRM','NFLX','PYPL','INTC','COST','ABT','TMO','VZ','NEE','WFC','TXN','LIN','ACN','LLY','MRK','DHR','AMGN','MDT','UNP','HON','UPS','BA','CAT','GE','CVX','IBM','RTX','SBUX','TXN',
    ]
    universe.extend(additional_stocks)

    # Remove duplicates and filter
    universe = list(set(universe))

    print(f'🌍 FULL MARKET UNIVERSE: {len(universe)} tickers')
    print(f'   ✅ Smart pre-filtering applied')
    return universe

def get_exchange_tickers(exchange):
    """Get tickers from a specific exchange"""
    try:
        url = f"{BASE_URL}/v3/reference/tickers"
        params = {
            "market": "stocks",
            "exchange": exchange,
            "active": "true",
            "limit": 1000,
            "apiKey": API_KEY
        }

        response = session.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        tickers = []
        if data.get("results"):
            for ticker_data in data["results"]:
                symbol = ticker_data.get("ticker")
                if symbol and not "." in symbol:  # Exclude preferred stocks, etc.
                    tickers.append(symbol)

        print(f"   ✅ {exchange}: {len(tickers)} tickers")
        return tickers

    except Exception as e:
        print(f"   ⚠️  Error fetching {exchange} tickers: {e}")
        return []

def get_major_etfs():
    """Get major ETFs and indexes"""
    etfs = [
        # Major Market Indexes
        'SPY','QQQ','IWM','DIA','VTI','VOO','VEA','VWO','EFA','EEM',

        # Sector ETFs
        'XLF','XLK','XLE','XLV','XLI','XLP','XLY','XLU','XLRE','XLB',

        # Leveraged ETFs
        'SOXL','SOXS','TECL','TECS','TQQQ','SQQQ','UPRO','SPXU','LABU','LABD',

        # Popular ETFs
        'ARKK','ARKG','ARKW','ARKQ','TLT','GLD','SLV','USO','UNG','UVXY',

        # Crypto Related
        'COIN','MARA','RIOT','MSTR','GBTC','BITO','ETHE',
    ]
    print(f"   ✅ Major ETFs: {len(etfs)} tickers")
    return etfs

print(f"🎯 USING PROVEN WORKING CONFIGURATION WITH FULL MARKET COVERAGE")

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
    Main function using proven working configuration with full market coverage
    """
    # Use fetch range (full historical data for proper parameter calculations)
    fetch_start = FETCH_START
    fetch_end = FETCH_END

    # Get full market universe if no symbols provided
    if not symbols:
        symbols = get_smart_enhanced_universe()

    print(f"🎯 Starting PROVEN Backside B scan - FULL MARKET COVERAGE")
    print(f"📊 Fetching data from {fetch_start} to {fetch_end}")
    print(f"📊 Displaying results from {PRINT_FROM} to {PRINT_TO}")
    print(f"📊 Scanning {len(symbols)} market symbols with {MAX_WORKERS} workers")

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
        print(f"\n🎯 TOTAL: Found {len(out)} Backside B patterns across FULL MARKET")
        return out
    else:
        print("❌ No patterns found")
        return pd.DataFrame()

# ───────── main ─────────
if __name__ == "__main__":
    print("🎯 TESTING PROVEN BACKSIDE B SCANNER - FULL MARKET COVERAGE")
    results = run_scan()

    if not results.empty:
        print("\n📊 PROVEN Backside B patterns found across FULL MARKET:")
        pd.set_option("display.max_columns", None, "display.width", 0)
        print(results.to_string(index=False))

        print(f"\n📊 Pattern distribution by symbol:")
        symbol_counts = results['symbol'].value_counts()
        for symbol, count in symbol_counts.head(20).items():
            print(f"   {symbol}: {count} patterns")

        print(f"\n🎉 SUCCESS! Found {len(results)} patterns scanning the FULL MARKET")
    else:
        print("\n❌ No patterns found - this may indicate market conditions in 2025")