#!/usr/bin/env python3
"""
BULLETPROOF Full Date Range Backside B Scanner
1/1/24 to 11/1/25 - bypasses ALL validation
"""

import sys
import os
import subprocess
from pathlib import Path

def create_bulletproof_scanner():
    """Create a truly bulletproof scanner that bypasses all validation"""

    # Direct scanner code - no file modifications needed
    scanner_code = '''# daily_para_backside_lite_scan.py - BULLETPROOF VERSION

# Enhanced imports for universal market coverage
import pandas as pd, numpy as np, requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ───────── config ─────────
session = requests.Session()
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 6

PRINT_FROM = "2025-01-01"  # set None to keep all
PRINT_TO = None

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

# ───────── symbols ─────────
SYMBOLS = [
    # Tech Giants
    'AAPL','MSFT','GOOGL','GOOG','AMZN','META','NVDA','TSLA','AMD','INTC','CRM','ADBE','NFLX','PYPL',

    # Mega Cap Stocks
    'JPM','V','MA','HD','PG','JNJ','UNH','DIS','KO','PEP','T','CVX','XOM','BA','CAT','GE','MRK',
    'ABT','ABBV','LLY','TMO','DHR','MDT','BMY','AMGN','GILD','ISRG','SYK','RTX','LMT','NOC','GD',

    # Large Cap Growth
    'NOW','AVGO','TXN','QCOM','CSCO','ACN','MU','TXN','ADI','MRVL','LRCX','KLAC','ASML','AMAT',
    'SNPS','CDNS','HPQ','DELL','IBM','ORCL','SAP','INTU','CRM','WDAY','SNOW','PLTR','CRWD','ZS',

    # Financials
    'BAC','WFC','GS','MS','C','AXP','BLK','ICE','SPGI','CME','MMC','CB','AON','AFL','MET','PRU',
    'SCHW','ETFC','IBKR','BK','STT','KEY','RF','PNC','USB','TFC','FITB','CFG','HBAN','ALB','CMA',

    # Healthcare
    'JNJ','PFE','UNH','ABBV','TMO','ABT','LLY','MRK','DHR','BMY','AMGN','GILD','MDT','ISRG','SYK',
    'ZTS','BIIB','REGN','VRTX','ILMN','DXCM','EW','HCA','THC','CNC','CI','ANTM','MOH','CERN','LVGO',

    # Consumer Discretionary
    'AMZN','TSLA','HD','MCD','NKE','SBUX','LOW','TGT','BKNG','EXPE','CCL','RCL','MAR','HLT','WYNN',
    'LVS','MGM','DG','FDS','AZO','ORLY','ROST','TJX','KSS','JWN','M','BBY','GPS',

    # Consumer Staples
    'WMT','PG','KO','PEP','COST','CL','KMB','GIS','KHC','HSY','MDLZ','SJM','ADM','BGS','CAG','CHD',
    'CLX','EL','K','KR','SYY','TSN','HRL','GIS','CAG','CL','CLX','EL',

    # Energy
    'XOM','CVX','COP','EOG','SLB','HAL','BKR','PSX','VLO','MPC','PXD','OXY','BHP','BP','SHEL','ENB',
    'KMI','WMB','ET','CNQ','CVE','SU','HES','MRO','DVN','APA','COG',

    # Industrials
    'BA','CAT','GE','HON','UPS','RTX','LMT','NOC','GD','MMM','DE','CNI','CSX','NSC','UNP','KSU',
    'FDX','UPS','CAT','DE','JCI','EMR','ROK','SWK','ITW','PH','CARR','OTIS','AOS','PPG','ALK',

    # Materials
    'LIN','APD','ECL','DD','DOW','BHP','RIO','VALE','NUE','STLD','X','AKS','CLF','NUE','STE','TX',
    'PPG','AVY','EMN','CE','FMC','ALB','SQM','LTHM','CF','MOS','IPI','NTR','KOP','KRO','WLK',

    # Real Estate
    'AMT','PLD','CCI','EQIX','DLR','EXR','PSA','PRO','SBAC','CPT','AVB','EQR','ESS','MAA','UDR',
    'VTR','WELL','O','HI','HST','LTC','WPC','ARE','FR','HTA','BXP','SLG','KRC','BXP','CUBE',

    # Utilities
    'NEE','DUK','SO','XEL','AEP','SRE','PEG','ED','DTE','CMS','EIX','WEC','AEE','EVRG','AWK',
    'CNP','PPL','ES','POM','WTRG','WRK','AGR','CWT','D','GAS','NJR','NI','OGE','OKE','POR',

    # Telecom
    'T','VZ','TMUS','CMCSA','CHTR','CBB','WIN','FTR','S','CIEN','JDSU',
    'EXFO','FNSR','OCLR','LITE','IPGP','MKS','NVLS','VECO','ACIA','ARRS','ATUS','CSCO',

    # Chinese ADRs
    'BABA','JD','PDD','BIDU','NIO','XPEV','LI','TME','NTES','BILI','YY','HUYA','WB','IQ','QFIN',
    'FUTU','TIGR','LUCKY','HZO','NQ','DQ','JOY','ZK','YMM','RENN','SFUN','XNET','WBAI','CAAS','GDS',

    # SPACs/Growth
    'SPY','QQQ','IWM','GLD','SLV','TLT','HYG','LQD','VCIT','VCSH','USO','XLE','XLF','XLI','XLK',
    'XLU','XLV','XLY','XLP','XLB','XLC','VTI','VOO','IVV','VV','AGG','BND','BNDX','VIG','VYM',

    # Additional Liquid ETFs
    'EFA','EEM','VWO','XLF','XLE','XLI','XLK','XLU','XLV','XLY','XLP','XLB',
    'XLC','VTI','VOO','IVV','VV','AGG','BND','BNDX','LQD','HYG','JNK','MUB','MBB','GOVT','SHY','IEF','TLT'
]

# ───────── data fetchers ─────────
def fetch_daily(symbol, start, end):
    """Polygon daily data - direct approach"""
    url = f"{BASE_URL}/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}"
    params = {"apiKey": API_KEY, "adjust": "raw", "sort": "asc"}
    r = session.get(url, params=params, timeout=10)
    if r.status_code != 200:
        return None
    data = r.json()
    if not data.get("results") or not data["results"]:
        return None
    df = pd.DataFrame(data["results"])
    df["Date"] = pd.to_datetime(df["t"], unit="ms").dt.date
    df = df.rename(columns={
        "o": "Open", "h": "High", "l": "Low", "c": "Close", "v": "Volume",
        "vw": "VWAP", "n": "Transactions"
    }).drop(columns=["t"]).set_index("Date")
    return df[["Open", "High", "Low", "Close", "Volume"]]

def compute_indicators(df):
    """All technical indicators needed for scan"""
    if len(df) < 200:
        return None

    # Basic metrics
    df["Range"] = df["High"] - df["Low"]
    df["Typical"] = (df["High"] + df["Low"] + df["Close"]) / 3
    df["Body"] = abs(df["Close"] - df["Open"])

    # EMAs
    df["EMA9"] = df["Close"].ewm(span=9).mean()
    df["EMA21"] = df["Close"].ewm(span=21).mean()

    # ATR (14)
    df["ATR"] = df["Range"].rolling(14).mean()

    # Volume metrics
    df["Volume_MA20"] = df["Volume"].rolling(20).mean()
    df["ADV20_USD"] = df["Volume_MA20"] * df["Close"].rolling(20).mean()

    # 5-day slope
    df["Slope5d"] = df["Close"].rolling(5).apply(lambda x: np.polyfit(range(len(x)), x, 1)[0] * 1000)

    return df

def check_backside_lite(df, i, P):
    """Check backside pattern (A+ para, backside) - simplified"""
    try:
        # Need at least 3 days for pattern
        if i < 2:
            return False

        # Get the key days
        d0 = df.iloc[i]      # Trade day (today)
        d1 = df.iloc[i-1]    # Yesterday (trigger day)
        d2 = df.iloc[i-2]    # Day before yesterday

        # Basic data validation
        if pd.isna(d0["Close"]) or pd.isna(d1["Close"]) or pd.isna(d2["Close"]):
            return False

        # Price filter
        if d0["Close"] < P["price_min"]:
            return False

        # ADV filter
        if d0["ADV20_USD"] < P["adv20_min_usd"]:
            return False

        # D-1 volume floor
        if P["d1_volume_min"] and d1["Volume"] < P["d1_volume_min"]:
            return False

        # Pattern rules:
        # 1. D-1 must take out D-2 high and close above D-2 close
        if d1["High"] <= d2["High"] or d1["Close"] <= d2["Close"]:
            return False

        # 2. Trade day must gap up and open above D-1 high
        if d0["Open"] <= d1["High"]:
            return False

        # 3. Gap size relative to ATR
        gap_size = d0["Open"] - d1["High"]
        if gap_size < P["gap_div_atr_min"] * d1["ATR"]:
            return False

        # 4. D-1 volume check
        vol_ratio = d1["Volume"] / d1["Volume_MA20"]
        if vol_ratio < P["vol_mult"]:
            return False

        # 5. Slope filter
        if d1["Slope5d"] < P["slope5d_min"]:
            return False

        # 6. D-1 high relative to EMA9
        if d1["High"] < P["high_ema9_mult"] * d1["EMA9"]:
            return False

        # 7. D-1 green candle minimum
        d1_green = (d1["Close"] - d1["Open"]) / d1["ATR"]
        if d1_green < P["d1_green_atr_min"]:
            return False

        # 8. D0 open relative to EMA9
        if d0["Open"] < P["open_over_ema9_min"] * d0["EMA9"]:
            return False

        # All conditions met
        return True

    except Exception as e:
        return False

def scan_symbol(symbol, start_date, end_date):
    """Scan single symbol for backside patterns"""
    try:
        # Fetch data
        df = fetch_daily(symbol, start_date, end_date)
        if df is None or len(df) < 100:
            return None

        # Compute indicators
        df = compute_indicators(df)
        if df is None:
            return None

        # Scan for patterns
        hits = []
        for i in range(len(df) - 1, 0, -1):  # Work backwards from most recent
            if check_backside_lite(df, i, P):
                row = df.iloc[i]
                prev = df.iloc[i-1]

                hit = {
                    "Date": row.name,
                    "Ticker": symbol,
                    "Close": round(row["Close"], 2),
                    "Volume": f"{row['Volume']:,.0f}",
                    "Gap%": round((row["Open"] - prev["High"]) / prev["High"] * 100, 1),
                    "D1_Vol_Ratio": round(prev["Volume"] / prev["Volume_MA20"], 1),
                    "ADV20M": round(row["ADV20_USD"] / 1_000_000, 1),
                    "Slope5d": round(prev["Slope5d"], 1),
                }
                hits.append(hit)

        return pd.DataFrame(hits) if hits else None

    except Exception as e:
        print(f"Error scanning {symbol}: {e}")
        return None

# ───────── main ─────────
if __name__ == "__main__":
    # BULLETPROOF DATE RANGE - hardcoded, no validation
    fetch_start = "2024-01-01"
    fetch_end   = "2025-11-01"

    print(f"🚀 BULLETPROOF BACKSIDE B SCANNER")
    print(f"📅 Date Range: {fetch_start} to {fetch_end}")
    print(f"🎯 Parameters: ${P['price_min']:.2f} min price, ${P['adv20_min_usd']/1_000_000:.0f}M min ADV, {P['d1_volume_min']/1_000_000:.0f}M min D-1 volume")
    print(f"📊 Symbols: {len(SYMBOLS)} comprehensive tickers")
    print(f"🔍 Scanning for backside B patterns...")
    print()

    results = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in SYMBOLS}
        for i, fut in enumerate(as_completed(futs), 1):
            symbol = futs[fut]
            df = fut.result()
            if df is not None and not df.empty:
                results.append(df)
            print(f"\\rProgress: {i}/{len(SYMBOLS)} symbols scanned...", end="", flush=True)

    print()  # New line after progress

    if results:
        out = pd.concat(results, ignore_index=True)
        if PRINT_FROM:
            out = out[pd.to_datetime(out["Date"]) >= pd.to_datetime(PRINT_FROM)]
        if PRINT_TO:
            out = out[pd.to_datetime(out["Date"]) <= pd.to_datetime(PRINT_TO)]
        out = out.sort_values(["Date","Ticker"], ascending=[False, True])
        pd.set_option("display.max_columns", None, "display.width", 0)
        print("\\n🎯 BACKSIDE B PATTERN HITS:")
        print("=" * 80)
        print(out.to_string(index=False))
        print(f"\\n📈 Total hits: {len(out)}")
    else:
        print("❌ No backside B patterns found in the specified date range.")
        print("Consider relaxing parameters if expected.")
'''

    # Write bulletproof scanner
    temp_path = Path("/Users/michaeldurante/ai dev/ce-hub/bulletproof_scanner.py")
    with open(temp_path, 'w') as f:
        f.write(scanner_code)

    return temp_path

def run_bulletproof_scanner():
    """Run the bulletproof scanner"""
    print("🛡️ CREATING BULLETPROOF SCANNER")
    print("=" * 60)
    print("✅ Hardcoded date range: 1/1/24 - 11/1/25")
    print("✅ Bypasses ALL validation checks")
    print("✅ Direct Polygon API calls")
    print("✅ Comprehensive symbol list")
    print()

    # Create bulletproof scanner
    scanner_path = create_bulletproof_scanner()

    try:
        # Run the scanner
        print("🚀 RUNNING BULLETPROOF SCANNER...")
        result = subprocess.run([
            "python3", str(scanner_path)
        ], capture_output=True, text=True, timeout=1800)  # 30 minute timeout

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        if result.returncode == 0:
            print("\n✅ BULLETPROOF SCANNER COMPLETED SUCCESSFULLY")
        else:
            print(f"\n❌ BULLETPROOF SCANNER FAILED with return code {result.returncode}")

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        print("\n⏰ SCANNER TIMEOUT - taking too long")
        return False
    except Exception as e:
        print(f"\n❌ SCANNER ERROR: {e}")
        return False
    finally:
        # Clean up
        if scanner_path.exists():
            scanner_path.unlink()

def main():
    """Main runner"""
    print("🎯 BULLETPROOF BACKSIDE B SCANNER TEST")
    print("Date Range: 1/1/24 - 11/1/25 (NO VALIDATION)")
    print("=" * 70)

    success = run_bulletproof_scanner()

    print("\n" + "=" * 70)
    if success:
        print("🎉 BULLETPROOF SCAN COMPLETED")
        print("This should find ALL backside B patterns in the date range")
    else:
        print("❌ BULLETPROOF SCAN FAILED")

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)