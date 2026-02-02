#!/usr/bin/env python3
"""
LC Multiscanner - Small Cap Focus with Parameter Integrity
========================================================
Realistic parameters for small-cap universe with proper parameter integrity
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

# ───────── LC MULTISCANNER PARAMETERS ─────────
P = {
    # Small cap liquidity/price requirements (adjusted for LC universe)
    "price_min": 3.0,               # Lower for LC stocks
    "adv20_min_usd": 5_000_000,      # Lower volume requirement for LC

    # Backside context (adjusted for LC volatility)
    "abs_lookback_days": 500,        # Shorter for LC momentum
    "abs_exclude_days": 5,           # Shorter exclusion
    "pos_abs_max": 0.85,             # More permissive for LC volatility

    # Trigger mold (adjusted for LC patterns)
    "trigger_mode": "D1_or_D2",      # More flexible for LC
    "atr_mult": 0.6,                 # Lower for higher volatility
    "vol_mult": 0.6,                 # Lower relative volume requirement

    # LC-specific volume filters
    "d1_volume_min": 3_000_000,      # Lower absolute volume for LC
    "d1_vol_mult_min": 1.2,         # Require relative volume spike
    "max_d1_volume": 30_000_000,     # Cap to exclude institutions

    # Momentum requirements (LC-appropriate)
    "slope5d_min": 2.0,              # Lower slope requirement
    "high_ema9_mult": 1.02,          # Minimal EMA requirement

    # Entry criteria (LC-appropriate)
    "gap_div_atr_min": 0.4,          # Lower gap requirement
    "open_over_ema9_min": 0.85,      # More permissive EMA requirement
    "d1_green_atr_min": 0.15,        # Lower green body requirement
    "require_open_gt_prev_high": False, # More permissive for LC

    # LC-specific filters
    "enforce_d1_above_d2": False,     # Remove for more LC signals
    "min_price_gap_pct": 0.3,        # Minimum percentage gap
    "max_market_cap_usd": 2_000_000_000,  # $2B max market cap
    "vol_spike_min": 1.5,            # Minimum volume spike ratio
}

# ───────── LC-FOCUSED SYMBOL UNIVERSE ─────────
# Focus on smaller cap, higher volatility stocks
SYMBOLS = [
    # Small/Mid Cap Tech & Software
    'TWLO','OKTA','ZS','CRWD','NET','DDOG','SNOW','PLTR','RIVN','LCID',
    'SOFI','UPST','AFRM','HOOD','AI','PATH','GTLB','CLOV','LMND','ROOT',
    'HUBS','MNDY','DUOL','SYNC','FVRR','CRSR','YALA','JFrog','DLTR',

    # Biotech & Healthcare (small/mid cap)
    'MRNA','NVAX','SNDL','ABCL','CRSP','NTLA','EDIT','PGEN','ARCT','RPRX',
    'BLUE','SGMO','DNA','GTHX','RGNX','KROS','INSM','REPL','MIRM','FTNV',
    'ALNY','BNTX','VIR','SRPT','IONS','AKBA','NBIX','CHRS','ARWR',

    # Crypto & Blockchain
    'COIN','MARA','RIOT','HUT','SOL-USD','BTC-USD','ETH-USD','ADA-USD',
    'DOT-USD','LINK-USD','MATIC-USD','AVAX-USD','ATOM-USD',

    # Speculative & Meme Stocks
    'AMC','GME','BB','BBBY','NOK','NAKD','SNDL','BNGO','SPCE','WISH',
    'TSLA','PLTR','RIVN','LCID','NKLA','WKHS','FSR','RIDE','GOEV','CHPT',

    # Clean Energy & EV (small cap)
    'NKLA','WKHS','FSR','RIDE','GOEV','CHPT','BLNK','EVGO','RIDE','LCID',
    'NIO','XPEV','LI','QS','FSR','HYLN','Plug','VLDR','AEVA','HIMS',

    # Retail & E-commerce (small cap)
    'CHWY','ETSY','LULU','PTON','CROX','ONON','TEVA','CERE','UARM',
    'FIZZ','BARK','PETQ','CHUY','PLAY','BJRI','TXRH','WING','LOCO',

    # Industrial & Energy (small cap)
    'CHK','SWN','HP','CVI','DKL','FANG','EQT','EOG','HP','COP',
    'SLB','HAL','OXY','PSX','VLO','MPC','PXD','BP','SG',

    # Cannabis & Speculative
    'CRON','TLRY','CGC','HEXO','ACB','CURLF','GRWG','CCHMF','AYRDF','MEDFF',

    # International ADRs (small cap)
    'BIDU','JD','PDD','BILI','TME','YY','NTES','IQ','VIPS','JOBS',
    'RENN','YIN','QFIN','SINA','FINV','STNE','NU','MELI','SE','BABA',

    # Financial Tech (small cap)
    'PYPL','SQ','SHOP','MELI','SE','BABA','JD','PDD','BIDU','MOMO',
    'VIPS','JOBS','RENN','YIN','QFIN','FINV','STNE','NU','MELI'
]

# Remove duplicates
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

        df = (pd.DataFrame(rows)
              .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
              .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
              .set_index("Date")[["Open","High","Low","Close","Volume"]]
              .sort_index())

        # Filter by price range for LC focus
        if not df.empty:
            close_price = df["Close"].iloc[-1]
            if close_price < P["price_min"] or close_price > 50:  # Upper cap for LC
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

    # EMAs
    m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
    m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()
    m["EMA_5"] = m["Close"].ewm(span=5, adjust=False).mean()

    # ATR
    hi_lo = m["High"] - m["Low"]
    hi_prev = (m["High"] - m["Close"].shift(1)).abs()
    lo_prev = (m["Low"] - m["Close"].shift(1)).abs()
    m["TR"] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m["ATR_raw"] = m["TR"].rolling(10, min_periods=10).mean()  # Shorter ATR
    m["ATR"] = m["ATR_raw"].shift(1)

    # Volume metrics
    m["VOL_AVG"] = m["Volume"].rolling(10, min_periods=10).mean().shift(1)
    m["VOL_AVG_20"] = m["Volume"].rolling(20, min_periods=20).mean().shift(1)
    m["Prev_Volume"] = m["Volume"].shift(1)
    m["ADV20_$"] = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

    # Momentum
    m["Slope_9_5d"] = (m["EMA_9"] - m["EMA_9"].shift(5)) / m["EMA_9"].shift(5) * 100
    m["Slope_5_3d"] = (m["EMA_5"] - m["EMA_5"].shift(3)) / m["EMA_5"].shift(3) * 100
    m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / m["ATR"]
    m["Price_Change_3d"] = (m["Close"] / m["Close"].shift(3) - 1) * 100

    # Gap and body
    m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
    m["Gap_over_ATR"] = m["Gap_abs"] / m["ATR"]
    m["Gap_pct"] = (m["Open"] / m["Close"].shift(1) - 1) * 100
    m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]
    m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

    # Previous values
    m["Prev_Close"] = m["Close"].shift(1)
    m["Prev_Open"] = m["Open"].shift(1)
    m["Prev_High"] = m["High"].shift(1)

    # LC-specific metrics
    m["Vol_Spike_Ratio"] = m["Volume"] / m["VOL_AVG_20"]
    m["High_Low_Range"] = (m["High"] / m["Low"] - 1) * 100

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

def _mold_on_row_lc(rx: pd.Series) -> bool:
    """LC mold criteria with parameter integrity"""
    if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
        return False

    # LC price and volume filters
    close_price = rx["Prev_Close"]
    if close_price < P["price_min"] or close_price > 50:  # Upper cap for LC
        return False
    if rx["ADV20_$"] < P["adv20_min_usd"]:
        return False

    # Volume spike requirement
    vol_avg = rx["VOL_AVG"]
    if pd.isna(vol_avg) or vol_avg <= 0:
        return False

    # Maximum volume filter to exclude institutions
    if P["max_d1_volume"] and pd.notna(rx["Volume"]) and rx["Volume"] > P["max_d1_volume"]:
        return False

    vol_sig = rx["Volume"]/vol_avg

    # LC mold checks (parameter integrity maintained)
    checks = [
        (rx["TR"] / rx["ATR"]) >= P["atr_mult"],
        vol_sig >= P["vol_mult"],
        rx["Slope_9_5d"] >= P["slope5d_min"],
        rx["High_over_EMA9_div_ATR"] >= P["high_ema9_mult"],
    ]

    return all(bool(x) and np.isfinite(x) for x in checks)

# ───────── CORE SCANNING LOGIC ─────────
def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan single symbol for LC multiscanner patterns"""
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

            # D-1 green requirement (LC-appropriate)
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= P["d1_green_atr_min"]):
                continue

            # LC volume requirements with integrity
            if P["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= P["d1_volume_min"]):
                    continue

            # Relative volume spike requirement
            if P["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= P["d1_vol_mult_min"]):
                    continue

            # Volume spike requirement
            if P["vol_spike_min"] and pd.notna(r1["Vol_Spike_Ratio"]) and r1["Vol_Spike_Ratio"] < P["vol_spike_min"]:
                continue

            # D-1 > D-2 (disabled for LC)
            if P["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 entry gates (LC-appropriate)
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

            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
                "Trigger": trig_tag,
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
                "Scanner_Type": "LC_Multiscanner",
            })

        return pd.DataFrame(rows)
    except Exception as e:
        print(f"Error scanning {sym}: {e}")
        return pd.DataFrame()

# ───────── MAIN EXECUTION ─────────
def main():
    print("🎯 LC MULTISCANNER - Small Cap Focus")
    print("🔧 Parameter Integrity for LC Universe")
    print("=" * 60)

    # Date range
    fetch_start = "2024-01-01"
    fetch_end = "2025-11-01"

    print(f"📅 Scanning from {PRINT_FROM} to {PRINT_TO}")
    print(f"🎯 Processing {len(SYMBOLS)} LC symbols...")

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

        print(f"\n🎯 LC MULTISCANNER RESULTS: {len(out)} signals found")
        print("=" * 120)
        print(out.to_string(index=False))

        # Save results
        output_file = "lc_multiscanner_final_2024_2025.csv"
        out.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")

    else:
        print("❌ No LC signals found.")

if __name__ == "__main__":
    main()