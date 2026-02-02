"""
RENATA FORMATTED BACKSIDE B SCANNER - DEMO VERSION
==================================================

Demo version using reduced universe to show complete 2-stage workflow.
Demonstrates the full process with correct parameters and logic.
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

class RenataDemoBacksideBScanner:
    """
    Demo version of Renata's 2-stage backside B scanner
    """

    def __init__(self):
        # Core API Configuration
        self.session = requests.Session()
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

        # === EXACT ORIGINAL BACKSIDE PARAMETERS (CORRECTED) ===
        self.params = {
            # Hard liquidity / price
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,  # $30 MILLION daily value (CORRECT!)

            # Backside context (absolute window)
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,

            # Trigger mold (evaluated on D-1 or D-2)
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_vol_mult_min": None,
            "d1_volume_min": 15_000_000,   # 15 MILLION shares (CORRECT!)

            "slope5d_min": 3.0,
            "high_ema9_mult": 1.05,

            # Trade-day (D0) gates
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.30,
            "require_open_gt_prev_high": True,

            # Relative requirement
            "enforce_d1_above_d2": True,
        }

        # D0 Range: The actual signal dates we want to find
        self.d0_start = "2025-01-01"
        self.d0_end = "2025-11-01"

        # Fetch Range: Historical data needed for calculations
        self.scan_start = "2023-08-01"
        self.scan_end = self.d0_end

        # Demo universe (reduced for quick demonstration)
        self.demo_universe = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'SMCI', 'PLTR',
            'SNOW', 'CRWD', 'ZS', 'NOW', 'TEAM', 'DDOG', 'CLOUD', 'SQ', 'SHOP', 'ZM',
            'SPY', 'QQQ', 'IWM', 'VTI', 'GLD', 'SLV', 'XLE', 'XLF', 'XLK', 'SOXL',
            'NVDL', 'TSLA', 'BTC', 'ETH', 'COIN', 'MARA', 'RIOT', 'HUT', 'IREN', 'CLSK'
        ]

        print("Renata Demo Backside B Scanner Initialized")
        print(f"Demo Universe: {len(self.demo_universe)} symbols")
        print(f"Parameters: adv20_min_usd=${self.params['adv20_min_usd']:,}, d1_volume_min={self.params['d1_volume_min']:,} shares")

    def fetch_daily_data(self, ticker: str, start: str, end: str) -> pd.DataFrame:
        """Original fetch function exactly as in backside para b copy.py"""
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
        r = self.session.get(url, params={"apiKey": self.api_key, "adjusted": "true", "sort":"asc", "limit":50000})
        r.raise_for_status()
        rows = r.json().get("results", [])
        if not rows:
            return pd.DataFrame()
        return (pd.DataFrame(rows)
                .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
                .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
                .set_index("Date")[["Open","High","Low","Close","Volume"]]
                .sort_index())

    def add_daily_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Original metrics function exactly as in backside para b copy.py"""
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

    def abs_top_window(self, df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
        """Original abs_top_window function exactly as in backside para b copy.py"""
        if df.empty:
            return (np.nan, np.nan)
        cutoff = d0 - pd.Timedelta(days=exclude_days)
        wstart = cutoff - pd.Timedelta(days=lookback_days)
        win = df[(df.index > wstart) & (df.index <= cutoff)]
        if win.empty:
            return (np.nan, np.nan)
        return float(win["Low"].min()), float(win["High"].max())

    def pos_between(self, val, lo, hi):
        """Original pos_between function exactly as in backside para b copy.py"""
        if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

    def _mold_on_row(self, rx: pd.Series) -> bool:
        """Original _mold_on_row function exactly as in backside para b copy.py"""
        if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
            return False
        if rx["Prev_Close"] < self.params["price_min"] or rx["ADV20_$"] < self.params["adv20_min_usd"]:
            return False
        vol_avg = rx["VOL_AVG"]
        if pd.isna(vol_avg) or vol_avg <= 0:
            return False
        vol_sig = max(rx["Volume"]/vol_avg, rx["Prev_Volume"]/vol_avg)
        checks = [
            (rx["TR"] / rx["ATR"]) >= self.params["atr_mult"],
            vol_sig >= self.params["vol_mult"],
            rx["Slope_9_5d"] >= self.params["slope5d_min"],
            rx["High_over_EMA9_div_ATR"] >= self.params["high_ema9_mult"],
        ]
        return all(bool(x) and np.isfinite(x) for x in checks)

    def scan_symbol_original_logic(self, sym: str, start: str, end: str) -> pd.DataFrame:
        """EXACT COPY from backside para b copy.py - scan_symbol function"""
        df = self.fetch_daily_data(sym, start, end)
        if df.empty:
            return pd.DataFrame()
        m = self.add_daily_metrics(df)

        rows = []
        for i in range(2, len(m)):
            d0 = m.index[i]
            r0 = m.iloc[i]       # D0
            r1 = m.iloc[i-1]     # D-1
            r2 = m.iloc[i-2]     # D-2

            # Backside vs D-1 close
            lo_abs, hi_abs = self.abs_top_window(m, d0, self.params["abs_lookback_days"], self.params["abs_exclude_days"])
            pos_abs_prev = self.pos_between(r1["Close"], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.params["pos_abs_max"]):
                continue

            # Choose trigger
            trigger_ok = False; trig_row = None; trig_tag = "-"
            if self.params["trigger_mode"] == "D1_only":
                if self._mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:
                if self._mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif self._mold_on_row(r2): trigger_ok, trig_row, trig_tag = True, r2, "D-2"
            if not trigger_ok:
                continue

            # D-1 must be green
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= self.params["d1_green_atr_min"]):
                continue

            # Absolute D-1 volume floor (shares)
            if self.params["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= self.params["d1_volume_min"]):
                    continue

            # Optional relative D-1 vol multiple
            if self.params["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= self.params["d1_vol_mult_min"]):
                    continue

            # D-1 > D-2 highs & close
            if self.params["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 gates
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < self.params["gap_div_atr_min"]:
                continue
            if self.params["require_open_gt_prev_high"] and not (r0["Open"] > r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < self.params["open_over_ema9_min"]:
                continue

            # Add result (Ticker and Date only as requested)
            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
            })

        return pd.DataFrame(rows)

    def run_demo_scan(self):
        """Run the demo 2-stage scanning process"""
        print(f"\n{'='*70}")
        print(f"RENATA DEMO BACKSIDE B SCANNER - 2-STAGE PROCESS")
        print(f"{'='*70}")
        print(f"Demo Universe: {len(self.demo_universe)} symbols")
        print(f"Signal Range: {self.d0_start} to {self.d0_end}")
        print(f"Data Fetch Range: {self.scan_start} to {self.scan_end}")
        print(f"Parameters: adv20_min_usd=${self.params['adv20_min_usd']:,}, d1_volume_min={self.params['d1_volume_min']:,}")

        print(f"\n{'='*70}")
        print("STAGE 1: DEMO MARKET UNIVERSE (Pre-selected)")
        print(f"{'='*70}")
        print(f"Using curated demo universe of {len(self.demo_universe)} high-quality symbols")
        print(f"Skipping smart filtering for demo purposes")

        print(f"\n{'='*70}")
        print("STAGE 2: ORIGINAL BACKSIDE PATTERN DETECTION")
        print(f"{'='*70}")

        all_results = []
        processed = 0
        signals_found = 0

        start_time = time.time()

        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_symbol = {
                executor.submit(self.scan_symbol_original_logic, symbol, self.scan_start, self.scan_end): symbol
                for symbol in self.demo_universe
            }

            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                processed += 1

                try:
                    results = future.result()
                    if not results.empty:
                        all_results.append(results)
                        signals_found += len(results)
                        print(f"✓ {symbol}: {len(results)} signals")
                    else:
                        print(f"- {symbol}: No signals")

                except Exception as e:
                    print(f"✗ {symbol}: Error - {str(e)[:50]}")

        elapsed = time.time() - start_time

        print(f"\nStage 2 Complete ({elapsed:.1f}s): Processed {processed} symbols")

        if all_results:
            final_results = pd.concat(all_results, ignore_index=True)

            # Convert date column for proper filtering
            final_results['Date'] = pd.to_datetime(final_results['Date'])

            # Apply date filtering for D0 range
            if self.d0_start:
                final_results = final_results[final_results["Date"] >= pd.to_datetime(self.d0_start)]
            if self.d0_end:
                final_results = final_results[final_results["Date"] <= pd.to_datetime(self.d0_end)]

            final_results = final_results.sort_values(["Date", "Ticker"], ascending=[False, True])

            # Display results in clean format
            print(f"\n{'='*70}")
            print("STAGE 3: RESULTS ANALYSIS - CLEAN OUTPUT")
            print(f"{'='*70}")
            print(f"\nBACKSIDE PARA B SIGNALS - CLEAN OUTPUT")
            print(f"{'='*50}")
            print("TICKER / DATE")

            for _, row in final_results.iterrows():
                print(f"{row['Ticker']} / {row['Date'].strftime('%Y-%m-%d')}")

            # Performance Analysis
            print(f"\n{'='*50}")
            print("DEMO PERFORMANCE ANALYSIS")
            print(f"{'='*50}")
            print(f"Total Signals: {len(final_results)}")
            print(f"Unique Tickers: {final_results['Ticker'].nunique()}")
            if len(final_results) > 0:
                print(f"Date Range: {final_results['Date'].min().strftime('%Y-%m-%d')} to {final_results['Date'].max().strftime('%Y-%m-%d')}")

            print(f"\nSignal Distribution by Ticker:")
            ticker_counts = final_results['Ticker'].value_counts()
            for ticker, count in ticker_counts.items():
                print(f"  {ticker}: {count} signals")

            print(f"\n{'='*70}")
            print(f"DEMO SCAN COMPLETE - Original 2-Stage Process Demonstrated")
            print(f"{'='*70}")
            print(f"Total Demo Time: {elapsed:.1f}s")
            print(f"Final Signals: {len(final_results)}")
            print(f"Process: Demo Universe → Pattern Detection → Clean Results")
            print(f"\nFull implementation processes 12,000+ tickers with smart filtering!")

            return final_results
        else:
            print(f"\n{'='*70}")
            print("DEMO COMPLETE - No signals found in demo universe")
            print("This demonstrates the complete 2-stage architecture")
            print("Full version processes much larger universe with smart filtering")
            print(f"{'='*70}")
            return pd.DataFrame()


def main():
    """Main execution function"""
    print("Starting Renata Demo Backside B Scanner...")
    print("This demonstrates the complete 2-stage process with reduced universe")
    print("Full version processes 12,000+ tickers with smart temporal filtering")

    scanner = RenataDemoBacksideBScanner()
    results = scanner.run_demo_scan()

    return results


if __name__ == "__main__":
    main()