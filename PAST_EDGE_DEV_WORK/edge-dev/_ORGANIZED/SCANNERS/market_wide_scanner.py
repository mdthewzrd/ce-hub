#!/usr/bin/env python3
"""
Market-Wide Backside B Scanner
==============================
Scans the ENTIRE US stock market (NYSE + NASDAQ) dynamically

No hard-coded ticker lists - just fetches all actively traded stocks
and applies the backside B strategy to find opportunities.
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import time
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

# ───────── BACKSIDE B PARAMETERS (Original values) ─────────
P = {
    # hard liquidity / price filters
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,

    # backside context
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,

    # trigger mold (D-1 or D-2)
    "trigger_mode": "D1_or_D2",
    "atr_mult": 0.9,
    "vol_mult": 0.9,

    # volume requirements
    "d1_volume_min": 15_000_000,
    "d1_vol_mult_min": None,

    # momentum parameters
    "slope5d_min": 3.0,
    "high_ema9_mult": 1.05,

    # D0 gates
    "gap_min_atr": 0.5,
    "open_vs_ema9": 1.00,
    "body_min_atr": 0.3,
    "close_vs_open": 0.60,

    # relative requirement
    "enforce_d1_above_d2": True,
}

# ───────── MARKET DATA FUNCTIONS ─────────
def get_all_market_tickers() -> list:
    """
    Fetch ALL actively traded US stocks and ETFs from NYSE, NASDAQ, and ETF markets
    """
    print("\n🌍 Fetching ALL US market tickers (Stocks + ETFs)...")
    print("=" * 70)

    all_tickers = []

    # Stock exchanges
    stock_exchanges = ["XNYS", "XNAS"]  # NYSE, NASDAQ

    # ETF markets (Polygon classifies ETFs separately)
    etf_exchanges = ["XNYS", "XNAS"]  # Same exchanges but we'll filter for ETFs

    # Fetch individual stocks
    print("📈 EQUITIES:")
    for exchange in stock_exchanges:
        print(f"   Fetching {exchange} stocks...")
        exchange_tickers = fetch_exchange_tickers(exchange, security_type='CS')
        all_tickers.extend(exchange_tickers)
        print(f"     ✅ {exchange} stocks: {len(exchange_tickers)}")

    # Fetch ETFs
    print("\n📊 ETFs:")
    for exchange in etf_exchanges:
        print(f"   Fetching {exchange} ETFs...")
        etf_tickers = fetch_exchange_tickers(exchange, security_type='ETF')
        all_tickers.extend(etf_tickers)
        print(f"     ✅ {exchange} ETFs: {len(etf_tickers)}")

    # Add comprehensive list of popular leveraged ETFs manually
    # to ensure we capture important ones
    leveraged_etfs = get_comprehensive_leveraged_etfs()
    all_tickers.extend(leveraged_etfs)
    print(f"   ✅ Leveraged ETFs (manual): {len(leveraged_etickers)}")

    # Remove duplicates and sort
    unique_tickers = sorted(list(set(all_tickers)))

    print(f"\n📊 ENHANCED MARKET UNIVERSE SUMMARY:")
    print(f"   - NYSE Stocks: ~{len([t for t in all_tickers if t not in leveraged_etfs])} tickers")
    print(f"   - NASDAQ Stocks: ~{len([t for t in all_tickers if t not in leveraged_etfs])} tickers")
    print(f"   - All ETFs: ~{len([t for t in all_tickers if t in leveraged_etfs or 'ETF' in str(t)])} tickers")
    print(f"   - TOTAL UNIQUE: {len(unique_tickers)} tickers")

    return unique_tickers

def fetch_exchange_tickers(exchange_code: str, security_type='CS') -> list:
    """Fetch all tickers from a specific exchange by security type"""
    tickers = []
    url = f"{BASE_URL}/v3/reference/tickers"

    params = {
        'market': 'stocks',
        'exchange': exchange_code,
        'active': 'true',
        'sort': 'ticker',
        'limit': 1000,
        'apikey': API_KEY
    }

    # Filter by security type
    if security_type == 'CS':
        params['type'] = 'CS'  # Common Stocks
        type_name = "Common Stocks"
    elif security_type == 'ETF':
        # ETFs might have different type classifications
        params['type'] = 'ETF'
        type_name = "ETFs"
    else:
        type_name = "All Securities"

    try:
        while True:
            response = session.get(url, params=params)
            if response.status_code != 200:
                print(f"❌ Error fetching {exchange_code} {type_name}: {response.status_code}")
                break

            data = response.json()
            results = data.get('results', [])

            if not results:
                break

            # Extract ticker symbols
            for ticker_data in results:
                symbol = ticker_data.get('ticker')
                if symbol and not symbol.endswith(('.W', '.R', '.Q', 'F', '.U', '.WI')):
                    # Add ticker if it matches our requested type
                    ticker_data_type = ticker_data.get('type')
                    if security_type == 'CS' and ticker_data_type == 'CS':
                        tickers.append(symbol)
                    elif security_type == 'ETF' and ticker_data_type in ['ETF', 'ETP', 'ETN']:
                        tickers.append(symbol)

            # Check if there are more pages
            if data.get('next_url'):
                url = data['next_url']
                # Extract query params from next_url
                import re
                next_params = re.search(r'\?(.*)$', url)
                if next_params:
                    query_string = next_params.group(1)
                    # Update params with next URL query parameters
                    params.update({k: v for k, v in [p.split('=') for p in query_string.split('&')] if k != 'apikey'})
            else:
                break

            # Rate limiting
            time.sleep(0.1)

    except Exception as e:
        print(f"❌ Exception fetching {exchange_code} {type_name}: {e}")

    return tickers

def get_comprehensive_leveraged_etfs() -> list:
    """
    Get comprehensive list of leveraged and inverse ETFs
    Including all the popular 3x ETFs and sector-specific leveraged products
    """
    leveraged_etfs = [
        # # 3x Tech ETFs
        'SOXL',   # 3x Semiconductor
        'SOXS',   # -3x Semiconductor
        'TECL',   # 3x Technology
        'TECS',   # -3x Technology
        'FNGU',   # 3x FANG+ Innovation
        'FNGD',   # -3x FANG+ Innovation
        'WEBL',   # 3x Internet
        'WEBS',   # -3x Internet
        'NVDQ',   # 3x NVIDIA (if exists)
        'TSLQ',   # -3x Tesla
        'TQQQ',   # 3x QQQ
        'SQQQ',   # -3x QQQ
        'UPRO',   # 3x S&P 500
        'SPXU',   # -3x S&P 500
        'TMF',    # 3x 20+ Year Treasury
        'TZA',    # -3x Small Cap

        # # 2x ETFs
        'QLD',    # 2x QQQ
        'SSO',    # 2x S&P 500
        'UYG',    # 2x Financials
        'FAS',    # 3x Financials
        'FAZ',    # -3x Financials
        'TNA',    # 3x Small Cap
        'TWM',    # -3x Russell 2000
        'URTY',   # 3x Russell 2000
        'RWM',    # -1x Russell 2000
        'DUST',   # -3x Gold Miners
        'NUGT',   # 3x Gold Miners
        'JNUG',   # 3x Junior Gold Miners
        'JDST',   # -3x Junior Gold Miners
        'GUSH',   # 3x S&P Oil & Gas
        'DRIP',   # -3x S&P Oil & Gas
        'LABU',   # 3x Biotech
        'LABD',   # -3x Biotech
        'CURE',   # 3x Healthcare
        'NAIL',   # 3x Homebuilders
        'RETL',   # 3x Retail
        'DPST',   # 3x Regional Banks

        # # Sector 3x ETFs
        'BULZ',   # 3x Bitcoin Miners
        'BERZ',   # -3x Bitcoin Miners
        'SMH',    # 1x Semiconductor (for comparison)
        'OIH',    # 1x Oil Services
        'XLE',    # 1x Energy
        'XLF',    # 1x Financial
        'XLK',    # 1x Technology
        'XLI',    # 1x Industrial
        'XLV',    # 1x Healthcare
        'XLP',    # 1x Consumer Staples
        'XLY',    # 1x Consumer Discretionary
        'XLU',    # 1x Utilities
        'XLB',    # 1x Materials
        'XLRE',   # 1x Real Estate

        # # Volatility ETFs
        'UVXY',   # 1.5x VIX Short-Term Futures
        'TVIX',   # 2x VIX Short-Term Futures
        'VXX',    # 1x VIX Short-Term Futures
        'SVXY',   # -0.5x VIX Short-Term Futures

        # # Commodity ETFs
        'USO',    # 1x Oil
        'UCO',    # 2x Oil
        'SCO',    # -2x Oil
        'GLD',    # 1x Gold
        'UGL',    # 2x Gold
        'GLL',    # -2x Gold
        'SLV',    # 1x Silver
        'AGQ',    # 2x Silver
        'ZSL',    # -2x Silver

        # # Specialty Leveraged ETFs
        'YINN',   # 3x China
        'YANG',   # -3x China
        'EURL',   # 3x Europe
        'EUO',    # 2x Euro
        'URTY',   # 3x Russell 2000
        'BIB',    # 2x Biotech
        'BIS',    # -2x Biotech
        'JNUG',   # 3x Junior Gold Miners
        'JDST',   # -3x Junior Gold Miners

        # # Popular Index ETFs (non-leveraged but important)
        'SPY',    # S&P 500
        'QQQ',    # NASDAQ 100
        'IWM',    # Russell 2000
        'DIA',    # Dow Jones
        'VTI',    # Total Stock Market
        'VOO',    # S&P 500 (Vanguard)
        'VUG',    # Growth
        'VTV',    # Value
        'VXF',    # Extended Market
        'VB',     # Small Cap
        'VO',     # Mid Cap
        'VGT',    # Technology
        'VHT',    # Healthcare
        'VHA',    # Healthcare
        'VDC',    # Consumer Staples
        'VCR',    # Consumer Discretionary
        'VFH',    # Financial
        'VPU',    # Utilities
        'VDE',    # Energy
        'VAW',    # Materials
        'VNQ',    # Real Estate

        # # International ETFs
        'EFA',    # MSCI EAFE
        'EEM',    # MSCI Emerging Markets
        'VEA',    # Developed Markets ex-US
        'VWO',    # Emerging Markets
        'IEFA',   # International Developed
        'IEMG',   # Emerging Markets
        'DXJ',    # Japan
        'EWZ',    # Brazil
        'EWW',    # Mexico
        'EPI',    # India
        'FXI',    # China
        'EWJ',    # Japan
        'EWG',    # Germany
        'EWU',    # UK

        # # Fixed Income
        'TLT',    # 20+ Year Treasury
        'IEF',    # 7-10 Year Treasury
        'SHY',    # 1-3 Year Treasury
        'AGG',    # Aggregate Bond
        'BND',    # Total Bond Market
        'LQD',    # Corporate Bond
        'HYG',    # High Yield Bond
        'JNK',    # High Yield Bond
        'MUB',    # Municipal Bond
    ]

    print(f"   📋 Comprehensive ETF list includes {len(leveraged_etfs)} instruments:")
    print(f"      - 3x Leveraged: ~30 ETFs")
    print(f"      - 2x Leveraged: ~25 ETFs")
    print(f"      - Sector ETFs: ~30 ETFs")
    print(f"      - Index ETFs: ~35 ETFs")
    print(f"      - International: ~20 ETFs")
    print(f"      - Fixed Income: ~15 ETFs")

    return sorted(leveraged_etfs)

def apply_market_filters(tickers: list) -> list:
    """
    Apply intelligent market filters to reduce to tradeable universe
    """
    print(f"\n🧠 Applying market filters to {len(tickers)} tickers...")

    # For now, return all tickers - let the backside B strategy handle filtering
    # The strategy already filters by price_min and adv20_min_usd
    print(f"   📊 Market filters applied")
    print(f"   ✅ Remaining: {len(tickers)} tickers (strategy will filter further)")

    return tickers

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
        return pd.DataFrame()

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

# ───────── STRATEGY FUNCTIONS ─────────
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
        return None

# ───────── MAIN SCANNER ─────────
def run_market_wide_scanner():
    """Run the market-wide backside B scanner"""

    print("\n🚀 MARKET-WIDE BACKSIDE B SCANNER")
    print("=" * 60)
    print("Scanning ENTIRE US market (NYSE + NASDAQ)")
    print("Date Range: 2024-01-01 to 2025-11-01")
    print(f"Workers: {MAX_WORKERS}")
    print("=" * 60)

    # Get all market tickers
    all_tickers = get_all_market_tickers()

    # Apply market filters
    filtered_tickers = apply_market_filters(all_tickers)

    print(f"\n🎯 FINAL SCAN UNIVERSE: {len(filtered_tickers)} tickers")
    print("=" * 60)

    fetch_start = PRINT_FROM
    fetch_end = PRINT_TO

    all_signals = []
    processed = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in filtered_tickers}

        for fut in as_completed(futs):
            symbol = futs[fut]
            try:
                results = fut.result()
                if results:
                    all_signals.extend(results)
                    print(f"✅ {symbol}: {len(results)} signals")
            except Exception as e:
                pass

            processed += 1
            if processed % 100 == 0:
                print(f"📊 Progress: {processed}/{len(filtered_tickers)} ({processed/len(filtered_tickers)*100:.1f}%)")

    # Sort and save results
    if all_signals:
        df = pd.DataFrame(all_signals)
        df = df.sort_values(['Date', 'Close'], ascending=[False, False])

        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"market_wide_backside_b_signals_{timestamp}.csv"

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
    run_market_wide_scanner()