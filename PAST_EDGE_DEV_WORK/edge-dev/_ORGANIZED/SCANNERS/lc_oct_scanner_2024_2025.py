#!/usr/bin/env python3
"""
LC October Scanner - Formatted for 1/1/24 - 11/1/25
=================================================
Low Cap / October momentum scanner with aggressive parameters
Focuses on smaller cap stocks with October seasonal momentum patterns
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
MAX_WORKERS = 10

# DATE RANGE: 1/1/24 - 11/1/25
PRINT_FROM = "2024-01-01"
PRINT_TO = "2025-11-01"

# ───────── LC OCT PARAMETERS (AGGRESSIVE) ─────────
P = {
    # More aggressive price/volume criteria for LC stocks
    "price_min": 1.0,               # Very low minimum for penny stocks
    "price_max": 50.0,              # Upper bound to focus on smaller caps
    "adv20_min_usd": 1_000_000,     # Much lower volume requirement
    "adv20_max_usd": 500_000_000,   # Exclude mega caps

    # Lookback for momentum context
    "abs_lookback_days": 60,        # Shorter lookback for recent momentum
    "abs_exclude_days": 3,          # Exclude recent days for context
    "pos_abs_max": 0.90,            # More permissive position requirements

    # October-specific triggers
    "trigger_mode": "D1_only",      # More conservative trigger
    "atr_mult": 0.4,                # Lower for more volatile LC stocks
    "vol_mult": 0.4,                # Lower volume requirement

    # LC-specific volume filters
    "d1_volume_min": 500_000,       # Much lower absolute volume
    "d1_vol_mult_min": 1.5,         # Require relative volume spike
    "max_d1_volume": 50_000_000,    # Cap to exclude institutions

    # Momentum requirements (adapted for LC)
    "slope5d_min": 1.0,             # Minimal slope requirement
    "high_ema9_mult": 1.01,         # Very minimal EMA requirement

    # Entry criteria (aggressive)
    "gap_div_atr_min": 0.2,         # Lower gap requirement
    "open_over_ema9_min": 0.80,     # More permissive EMA requirement
    "d1_green_atr_min": 0.10,       # Lower green body requirement
    "require_open_gt_prev_high": False, # Very permissive

    # LC-specific filters
    "enforce_d1_above_d2": False,   # Remove for more signals
    "min_price_gap_pct": 0.5,       # Minimum percentage gap
    "max_market_cap_usd": 5_000_000_000,  # $5B max market cap
}

# ───────── LC-FOCUSED SYMBOL UNIVERSE ─────────
# Focus on smaller cap stocks, biotech, tech, and speculative names
SYMBOLS = [
    # Biotech & Pharma (small/mid cap)
    'MRNA','NVAX','SNDL','ABCL','CRSP','NTLA','EDIT','PGEN','ARCT','RPRX',
    'BLUE','SGMO','DNA','GTHX','RGNX','KROS','INSM','REPL','MIRM','FTNV',
    'ALNY','BNTX','VIR','NVAX','SRPT','IONS','AKBA','NBIX','CHRS','ARWR',

    # Tech & Software (small cap)
    'TWLO','OKTA','ZS','CRWD','NET','DDOG','SNOW','PLTR','RIVN','LCID',
    'SOFI','UPST','AFRM','HOOD','AI','PATH','GTLB','CLOV','LMND','ROOT',
    'HUBS','MNDY','DUOL','FVRR','CRSR','YALA','JFrog','DLTR','LPRO','SYNC',

    # Crypto & Blockchain
    'COIN','MARA','RIOT','HUT','SOL-USD','BTC-USD','ETH-USD','ADA-USD',
    'DOT-USD','LINK-USD','MATIC-USD','AVAX-USD','ATOM-USD','FTT-USD',

    # Meme & Speculative
    'AMC','GME','BB','BBBY','NOK','NAKD','SNDL','BNGO','SPCE','WISH',
    'TSLA','PLTR','RIVN','LCID','NKLA','WKHS','FSR','RIDE','GOEV','CHPT',

    # Clean Energy & EV
    'NKLA','WKHS','FSR','RIDE','GOEV','CHPT','BLNK','EVGO','RIDE','LCID',
    'NIO','XPEV','LI','QS','FSR','HYLN','Plug','VLDR','AEVA','HIMS',

    # SPACs & Special Purpose
    'IPOA','IPOB','IPOC','IPOD','IPOE','IPOF','CCIV','PTON','DKNG','RBLX',
    'OPEN','CLOV','SPCE','WISH','VIAC','DISCA','FOXA','TME','PDD','BIDU',

    # Industrials (small cap)
    'SPCE','RKLY','ASTR','MAXR','MVIS','KOSS','GME','AMC','BB','NOK',
    'TRCH','ALPP','MIFI','RYCEY','BA','GE','F','GM','TSLA','LCID',

    # Cannabis
    'CRON','TLRY','CGC','HEXO','ACB','CURLF','GRWG','CCHMF','AYRDF','MEDFF',

    # International ADRs (small cap)
    'BIDU','JD','PDD','BILI','TME','YY','NTES','IQ','VIPS','JOBS',
    'RENN','YIN','QFIN','SINA','SOHU','NIO','XPEV','LI','EDU','TME',

    # Financial Tech (small cap)
    'SOFI','UPST','SQ','PYPL','MELI','SE','BABA','JD','PDD','BIDU',
    'MOMO','VIPS','JOBS','RENN','YIN','QFIN','FINV','STNE','NU','MELI',

    # Retail E-commerce (small cap)
    'CHWY','ETSY','LULU','PTON','CROX','ONON','DECK','TEVA','CERE','UARM',
    'FIZZ','BARK','PETQ','CHUY','PLAY','BJRI','TXRH','WING','SG','LOCO',

    # Energy (small cap)
    'CHK','SWN','HP','CVI','DKL','FANG','EQT','EOG','XOM','CVX',
    'COP','SLB','HAL','OXY','PSX','VLO','MPC','PXD','OXY','BP'

]

# Remove duplicates and add some small cap ETFs
SYMBOLS = list(dict.fromkeys(SYMBOLS + [
    'IWM','IJR','IJT','IWC','SCHC','SAA','SCHA','SCHB','SCHX','VOOG',
    'VB','VBK','VIOG','VIOV','VXF','SLY','SLYG','SLYV','SLYU','VTI'
]))

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

        df = (pd.DataFrame(rows)
              .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
              .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
              .set_index("Date")[["Open","High","Low","Close","Volume"]]
              .sort_index())

        # Filter by price range for LC focus
        if not df.empty:
            close_price = df["Close"].iloc[-1]
            if close_price < P["price_min"] or close_price > P["price_max"]:
                return pd.DataFrame()

        return df
    except Exception as e:
        return pd.DataFrame()

# ───────── TECHNICAL METRICS ─────────
def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators for LC stocks"""
    if df.empty:
        return df
    m = df.copy()
    try:
        m.index = m.index.tz_localize(None)
    except Exception:
        pass

    # Shorter EMAs for more responsive signals
    m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()
    m["EMA_5"] = m["Close"].ewm(span=5, adjust=False).mean()  # Additional EMA

    # ATR calculation
    hi_lo = m["High"] - m["Low"]
    hi_prev = (m["High"] - m["Close"].shift(1)).abs()
    lo_prev = (m["Low"] - m["Close"].shift(1)).abs()
    m["TR"] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(10, min_periods=10).mean()  # Shorter ATR
    m["ATR"] = m["ATR_raw"].shift(1)

    # Volume metrics with shorter lookback
    m["VOL_AVG"] = m["Volume"].rolling(10, min_periods=10).mean().shift(1)
    m["VOL_AVG_20"] = m["Volume"].rolling(20, min_periods=20).mean().shift(1)
    m["Prev_Volume"] = m["Volume"].shift(1)
    m["ADV20_$"] = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

    # Momentum indicators
    m["Slope_9_5d"] = (m["EMA_9"] - m["EMA_9"].shift(5)) / m["EMA_9"].shift(5) * 100
    m["Slope_5_3d"] = (m["EMA_5"] - m["EMA_5"].shift(3)) / m["EMA_5"].shift(3) * 100
    m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / m["ATR"]
    m["Price_Change_3d"] = (m["Close"] / m["Close"].shift(3) - 1) * 100

    # Gap and body calculations
    m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_over_ATR"] = m["Gap_abs"] / m["ATR"]
    m["Gap_pct"] = (m["Open"] / m["Close"].shift(1) - 1) * 100
    m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]
    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    # Previous values
    m["Prev_Close"] = m["Close"].shift(1)
    m["Prev_Open"] = m["Open"].shift(1)
    m["Prev_High"] = m["High"].shift(1)

    # Additional LC-specific metrics
    m["Vol_Spike_Ratio"] = m["Volume"] / m["VOL_AVG_20"]
    m["High_Low_Range"] = (m["High"] / m["Low"] - 1) * 100

    return m

# ───────── HELPER FUNCTIONS ─────────
def abs_top_window(df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
    """Find absolute high/low in shorter lookback window"""
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

def _mold_on_row_lc(rx: pd.Series) -> bool:
    """LC-specific mold criteria - more permissive"""
    if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
        return False

    # LC price and volume filters
    close_price = rx["Prev_Close"]
    if close_price < P["price_min"] or close_price > P["price_max"]:
        return False
    if rx["ADV20_$"] < P["adv20_min_usd"] or rx["ADV20_$"] > P["adv20_max_usd"]:
        return False

    # Volume spike requirement
    vol_avg = rx["VOL_AVG"]
    if pd.isna(vol_avg) or vol_avg <= 0:
        return False

    # Maximum volume filter to exclude institutions
    if P["max_d1_volume"] and pd.notna(rx["Volume"]) and rx["Volume"] > P["max_d1_volume"]:
        return False

    vol_sig = rx["Volume"]/vol_avg

    # LC mold checks (more permissive)
    checks = [
        (rx["TR"] / rx["ATR"]) >= P["atr_mult"],
        vol_sig >= P["vol_mult"],
        rx["Slope_9_5d"] >= P["slope5d_min"],
        rx["High_over_EMA9_div_ATR"] >= P["high_ema9_mult"],
    ]

    return all(bool(x) and np.isfinite(x) for x in checks)

# ───────── CORE SCANNING LOGIC ─────────
def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan single symbol for LC October patterns"""
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

            # LC backside context check
            lo_abs, hi_abs = abs_top_window(m, d0, P["abs_lookback_days"], P["abs_exclude_days"])
            pos_abs_prev = pos_between(r1["Close"], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= P["pos_abs_max"]):
                continue

            # LC trigger validation
            trigger_ok = False
            trig_row = None
            trig_tag = "-"

            if P["trigger_mode"] == "D1_only":
                if _mold_on_row_lc(r1):
                    trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:
                if _mold_on_row_lc(r1):
                    trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif _mold_on_row_lc(r2):
                    trigger_ok, trig_row, trig_tag = True, r2, "D-2"

            if not trigger_ok:
                continue

            # D-1 green requirement (very relaxed)
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
                continue

            # LC volume requirements
            if P["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= P["d1_volume_min"]):
                    continue

            # Relative volume spike requirement
            if P["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= P["d1_vol_mult_min"]):
                    continue

            # D-1 > D-2 (disabled for LC)
            if P["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 entry gates (aggressive)
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < P["gap_div_atr_min"]:
                continue

            # Minimum percentage gap requirement
            if pd.isna(r0["Gap_pct"]) or abs(r0["Gap_pct"]) < P["min_price_gap_pct"]:
                continue

            if P["require_open_gt_prev_high"] and not (r0["Open"] > r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < P["open_over_ema9_min"]:
                continue

            # Calculate LC-specific metrics
            d1_vol_mult = (r1["Volume"]/r1["VOL_AVG"]) if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0) else np.nan
            volsig_max = (max(r1["Volume"]/r1["VOL_AVG"], r2["Volume"]/r2["VOL_AVG"])
                         if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0 and pd.notna(r2["VOL_AVG"]) and r2["VOL_AVG"]>0)
                         else np.nan)

            # October indicator (for seasonal bias)
            is_october = d0.month == 10

            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
                "Trigger": trig_tag,
                "October": is_october,
                "PosAbs_window": round(float(pos_abs_prev), 3),
                "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 3),
                "D1Vol(shares)": int(r1["Volume"]) if pd.notna(r1["Volume"]) else np.nan,
                "D1Vol/Avg": round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else np.nan,
                "VolSpike_Ratio": round(float(r1["Vol_Spike_Ratio"]), 2) if pd.notna(r1["Vol_Spike_Ratio"]) else np.nan,
                "Gap/ATR": round(float(r0["Gap_over_ATR"]), 3),
                "Gap%": round(float(r0["Gap_pct"]), 2) if pd.notna(r0["Gap_pct"]) else np.nan,
                "Open>PrevHigh": bool(r0["Open"] > r1["High"]),
                "Open/EMA9": round(float(r0["Open_over_EMA9"]), 3),
                "Slope9_5d": round(float(r0["Slope_9_5d"]), 2) if pd.notna(r0["Slope_9_5d"]) else np.nan,
                "Price_3d%": round(float(r0["Price_Change_3d"]), 2) if pd.notna(r0["Price_Change_3d"]) else np.nan,
                "High-EMA9/ATR(trigger)": round(float(trig_row["High_over_EMA9_div_ATR"]), 3),
                "ADV20_$": round(float(r0["ADV20_$"])) if pd.notna(r0["ADV20_$"]) else np.nan,
                "Range%": round(float(r0["High_Low_Range"]), 2) if pd.notna(r0["High_Low_Range"]) else np.nan,
                "Scanner_Type": "LC_Oct",
            })

        return pd.DataFrame(rows)
    except Exception as e:
        print(f"Error scanning {sym}: {e}")
        return pd.DataFrame()

# ───────── MAIN EXECUTION ─────────
def main():
    print("🎯 LC OCTOBER SCANNER - 1/1/24 to 11/1/25")
    print("🔥 Focus on Small/Mid Cap & October Momentum")
    print("=" * 60)

    # Date range
    fetch_start = "2024-01-01"
    fetch_end = "2025-11-01"

    print(f"📅 Scanning from {PRINT_FROM} to {PRINT_TO}")
    print(f"🎯 Processing {len(SYMBOLS)} LC symbols...")
    print(f"🔧 Using aggressive LC parameters with October bias")

    results = []
    processed = 0
    october_signals = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futs = {exe.submit(scan_symbol, s, fetch_start, fetch_end): s for s in SYMBOLS}
        for fut in as_completed(futs):
            sym = futs[fut]
            df = fut.result()
            if df is not None and not df.empty:
                results.append(df)
                print(f"✓ {sym}: {len(df)} signals")
                if df["October"].any():
                    october_signals += len(df[df["October"] == True])
            else:
                print(f"- {sym}: no signals")

            processed += 1
            if processed % 25 == 0:
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

        print(f"\n🎯 LC OCTOBER RESULTS: {len(out)} total signals found")
        print(f"🎃 October-specific signals: {october_signals}")
        print("=" * 120)
        print(out.to_string(index=False))

        # Separate October signals
        oct_out = out[out["October"] == True]
        if not oct_out.empty:
            print(f"\n🎃 OCTOBER MOMENTUM SIGNALS ({len(oct_out)}):")
            print("=" * 120)
            print(oct_out.to_string(index=False))

            oct_output_file = "lc_october_signals_2024_2025.csv"
            oct_out.to_csv(oct_output_file, index=False)
            print(f"\n💾 October signals saved to: {oct_output_file}")

        # Save all results
        output_file = "lc_oct_all_signals_2024_2025.csv"
        out.to_csv(output_file, index=False)
        print(f"💾 All LC signals saved to: {output_file}")

    else:
        print("❌ No LC October signals found.")

if __name__ == "__main__":
    main()