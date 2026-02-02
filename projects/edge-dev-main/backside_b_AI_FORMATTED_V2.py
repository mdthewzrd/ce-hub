import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional

class BacksideBMessy:
    """Backside B Scanner - Messy Version for AI Testing
    This is a DELIBERATELY poorly formatted version to test Renata's ability
    to understand code structure and apply proper formatting.
    """
    
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner with date range"""
        self.session = requests.Session()
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        
        # Connection pooling for performance
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=2,
            pool_block=False
        ))
        
        # Backside B parameters - MUST be defined before use in calculations
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_vol_mult_min": None,
            "d1_volume_min": 15_000_000,
            "slope5d_min": 3.0,
            "high_ema9_mult": 1.05,
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.30,
            "require_open_gt_prev_high": True,
            "enforce_d1_above_d2": True,
        }

        # Calculate historical data range for pattern detection
        self.d0_start = d0_start
        self.d0_end = d0_end
        lookback_buffer = self.params['abs_lookback_days'] + 50  # Add buffer
        
        # Calculate scan_start to include historical data
        if lookback_buffer > 0:
            scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
            self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
            print(f"📊 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
            print(f"📊 Historical Data Range: {self.scan_start} to {self.d0_end}")
        else:
            self.scan_start = self.d0_start
            
        self.scan_end = self.d0_end
        
        # NYSE trading calendar
        nyse = mcal.get_calendar('NYSE')
        self.trading_dates = nyse.schedule(start_date=self.scan_start, end_date=self.scan_end).index.strftime('%Y-%m-%d').tolist()

        # Parallel workers configuration
        self.stage1_workers = 5
        self.stage3_workers = 10

    def fetch_grouped_data(self) -> pd.DataFrame:
        """Stage 1: Fetch all tickers for all trading dates using grouped endpoint"""
        print(f"🚀 Fetching data for {len(self.trading_dates)} trading days...")
        
        all_data = []
        failed = 0
        
        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            future_to_date = {
                executor.submit(self._fetch_grouped_day, date_str): date_str
                for date_str in self.trading_dates
            }
            
            for future in as_completed(future_to_date):
                date_str = future_to_date[future]
                try:
                    data = future.result()
                    if data is None or data.empty:
                        failed += 1
                        continue
                    all_data.append(data)
                except Exception as e:
                    print(f"❌ Error processing {date_str}: {e}")
                    failed += 1
        
        if failed > 0:
            print(f"⚠️ Failed to fetch {failed} days")
            
        if not all_data:
            return pd.DataFrame()
            
        df = pd.concat(all_data, ignore_index=True)
        print(f"📊 Fetched {len(df)} records across {len(all_data)} days")
        return df
    
    def _fetch_grouped_day(self, date_str: str) -> pd.DataFrame:
        """Fetch all tickers for a single day using grouped endpoint"""
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
        try:
            response = self.session.get(url, params={
                "apiKey": self.api_key,
                "adjust": "true"
            }, timeout=30)
            response.raise_for_status()
            
            data = response.json().get("results", [])
            if not data:
                return pd.DataFrame()
                
            df = pd.DataFrame(data)
            df = df.rename(columns={
                'T': 'ticker',
                'v': 'volume',
                'o': 'open',
                'c': 'close',
                'h': 'high',
                'l': 'low',
                't': 'timestamp',
            })
            
            df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.strftime('%Y-%m-%d')
            df = df.dropna(subset=['close', 'volume'])
            return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
            
        except Exception as e:
            print(f"Error fetching {date_str}: {e}")
            return pd.DataFrame()
    
    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2a: Compute SIMPLE features for efficient filtering"""
        if df.empty:
            return df
            
        df = df.copy()
        
        # Compute prev_close (shifted close)
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        
        # Compute ADV20 (20-day average dollar volume)
        df['dollar_volume'] = df['close'] * df['volume']
        df['ADV20_$'] = df.groupby('ticker')['dollar_volume'].rolling(20, min_periods=1).mean().reset_index(0, drop=True).shift(1)
        
        # Compute price range
        df['price_range'] = df['high'] - df['low']
        
        return df
    
    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2b: Apply smart filters to reduce dataset by 99%"""
        if df.empty:
            return df
            
        # Filter for D0 date range only for output
        d0_mask = (df['date'] >= self.d0_start) & (df['date'] <= self.d0_end)
        
        # Apply simple filters for D0 dates
        d0_filtered = df[d0_mask].copy()
        d0_filtered = d0_filtered[
            (d0_filtered['prev_close'] >= self.params["price_min"]) &
            (d0_filtered['ADV20_$'] >= self.params["adv20_min_usd"])
        ]
        
        # Get unique tickers that passed D0 filters
        passing_tickers = d0_filtered['ticker'].unique()
        
        # Keep historical data for passing tickers
        filtered_df = df[df['ticker'].isin(passing_tickers)].copy()
        print(f"🎯 Filtered from {len(df)} to {len(filtered_df)} rows ({len(passing_tickers)} tickers)")
        
        return filtered_df
    
    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3a: Compute FULL features for pattern detection"""
        if df.empty:
            return df
            
        df = df.copy()
        
        # Compute EMAs
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
        df['EMA_9'] = df.groupby('ticker')['close'].ewm(span=9, adjust=False).mean().reset_index(0, drop=True)
        df['EMA_20'] = df.groupby('ticker')['close'].ewm(span=20, adjust=False).mean().reset_index(0, drop=True)
        
        # Compute ATR
        df['tr'] = np.maximum(
            df['high'] - df['low'],
            np.abs(df['high'] - df.groupby('ticker')['close'].shift(1)),
            np.abs(df['low'] - df.groupby('ticker')['close'].shift(1))
        )
        df['ATR_raw'] = df.groupby('ticker')['tr'].rolling(14, min_periods=14).mean().reset_index(0, drop=True)
        df['ATR'] = df.groupby('ticker')['ATR_raw'].shift(1)
        
        # Compute volume metrics
        df['VOL_AVG'] = df.groupby('ticker')['volume'].rolling(14, min_periods=14).mean().reset_index(0, drop=True).shift(1)
        
        # Compute slope metrics
        df['Slope_9_5d'] = (df['EMA_9'] - df.groupby('ticker')['EMA_9'].shift(5)) / df.groupby('ticker')['EMA_9'].shift(5) * 100
        
        # Compute gap metrics
        df['Gap_abs'] = (df['open'] - df.groupby('ticker')['close'].shift(1)).abs()
        df['Gap_over_ATR'] = df['Gap_abs'] / df['ATR']
        
        # Compute other metrics
        df['Open_over_EMA9'] = df['open'] / df['EMA_9']
        df['High_over_EMA9_div_ATR'] = (df['high'] - df['EMA_9']) / df['ATR']
        df['Body_over_ATR'] = (df['close'] - df['open']).abs() / df['ATR']
        df['Prev_Close'] = df.groupby('ticker')['close'].shift(1)
        df['Prev_Open'] = df.groupby('ticker')['open'].shift(1)
        df['Prev_High'] = df.groupby('ticker')['high'].shift(1)
        df['Prev_Volume'] = df.groupby('ticker')['volume'].shift(1)

        return df

    
    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3b: Detect patterns with parallel processing"""
        if df.empty:
            return pd.DataFrame()
            
        # Get unique tickers for parallel processing
        unique_tickers = df['ticker'].unique()
        print(f"🔍 Detecting patterns for {len(unique_tickers)} tickers...")
        
        all_results = []
        
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            future_to_ticker = {
                executor.submit(self._process_ticker, df[df['ticker'] == ticker]): ticker
                for ticker in unique_tickers
            }
            
            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                try:
                    results = future.result()
                    if not results.empty:
                        all_results.append(results)
                except Exception as e:
                    print(f"❌ Error processing {ticker}: {e}")
        
        if not all_results:
            return pd.DataFrame()
            
        final_results = pd.concat(all_results, ignore_index=True)
        print(f"✅ Found {len(final_results)} signals")
        return final_results
    
    def _process_ticker(self, ticker_df: pd.DataFrame) -> pd.DataFrame:
        """Process a single ticker for pattern detection"""
        if len(ticker_df) < 3:
            return pd.DataFrame()
            
        results = []
        ticker_df = ticker_df.sort_values('date').reset_index(drop=True)
        
        for i in range(2, len(ticker_df)):
            d0 = ticker_df.iloc[i]
            r0 = ticker_df.iloc[i]
            r1 = ticker_df.iloc[i-1]
            r2 = ticker_df.iloc[i-2]
            
            # Check if D0 is in our target range
            if not (self.d0_start <= d0['date'] <= self.d0_end):
                continue
                
            # ABS top window calculation
            lo_abs, hi_abs = self._abs_top_window(
                ticker_df, 
                d0['date'], 
                self.params['abs_lookback_days'], 
                self.params['abs_exclude_days']
            )
            
            pos_abs_prev = self._pos_between(r1['close'], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.params['pos_abs_max']):
                continue
                
            trigger_ok = False
            trig_row = None
            trig_tag = "-"
            
            if self.params['trigger_mode'] == "D1_only":
                if self._check_trigger(r1): 
                    trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:  # D1_or_D2
                if self._check_trigger(r1): 
                    trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif self._check_trigger(r2): 
                    trigger_ok, trig_row, trig_tag = True, r2, "D-2"
                    
            if not trigger_ok:
                continue
                
            if not (pd.notna(r1['Body_over_ATR']) and r1['Body_over_ATR'] >= self.params['d1_green_atr_min']):
                continue
                
            if self.params['d1_volume_min'] is not None:
                if not (pd.notna(r1['volume']) and r1['volume'] >= self.params['d1_volume_min']):
                    continue
                    
            if self.params['d1_vol_mult_min'] is not None:
                vol_sig = max(r1['volume'] / r1['VOL_AVG'], r2['volume'] / r2['VOL_AVG']) if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0) else np.nan
                if not (pd.notna(vol_sig) and vol_sig >= self.params['d1_vol_mult_min']):
                    continue
                    
            if self.params['enforce_d1_above_d2']:
                if not (pd.notna(r1['high']) and pd.notna(r2['high']) and r1['high'] > r2['high']
                        and pd.notna(r1['close']) and pd.notna(r2['close']) and r1['close'] > r2['close']):
                    continue
                    
            if self.params['require_open_gt_prev_high'] and not (r0['open'] > r1['high']):
                continue
                
            if pd.notna(r0['Gap_over_ATR']) or r0['Gap_over_ATR'] < self.params['gap_div_atr_min']:
                continue
                
            if pd.notna(r0['Open_over_EMA9']) or r0['Open_over_EMA9'] < self.params['open_over_ema9_min']:
                continue
                
            d1_vol_mult = (r1['volume'] / r1['VOL_AVG']) if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0) else np.nan
            vol_sig_max = (max(r1['volume'] / r1['VOL_AVG'], r2['volume'] / r2['VOL_AVG']) 
                          if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0 and pd.notna(r2['VOL_AVG']) and r2['VOL_AVG'] > 0) 
                          else np.nan)
                          
            results.append({
                "Ticker": r0['ticker'],
                "Date": d0['date'],
                "Trigger": trig_tag,
                "PosAbs_1000d": round(float(pos_abs_prev), 3),
                "D1_Body/ATR": round(float(r1['Body_over_ATR']), 2),
                "D1Vol(shares)": int(r1['volume']) if pd.notna(r1['volume']) else np.nan,
                "D1Vol/Avg": round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else np.nan,
                "VolSig(max D-1,D-2)/Avg": round(float(vol_sig_max), 2) if pd.notna(vol_sig_max) else np.nan,
                "Gap/ATR": round(float(r0['Gap_over_ATR']), 2),
                "Open>PrevHigh": bool(r0['open'] > r1['high']),
                "Open/EMA9": round(float(r0['Open_over_EMA9']), 2),
                "D1>H(D-2)": bool(r1['high'] > r2['high']),
                "D1Close>D2Close": bool(r1['close'] > r2['close']),
                "Slope_9_5d": round(float(r0['Slope_9_5d']), 2) if pd.notna(r0['Slope_9_5d']) else np.nan,
                "High-EMA9/ATR(trigger)": round(float(trig_row['High_over_EMA9_div_ATR']), 2) if pd.notna(trig_row.get('High_over_EMA9_div_ATR')) else np.nan,
                "ADV20_$": round(float(r0['ADV20_$'])) if pd.notna(r0['ADV20_$']) else np.nan,
            })
            
        return pd.DataFrame(results)
    
    def _abs_top_window(self, df, d0, lookback_days, exclude_days):
        """Calculate ABS top window"""
        if df.empty:
            return (np.nan, np.nan)

        cutoff = pd.to_datetime(d0) - pd.Timedelta(days=exclude_days)
        wstart = cutoff - pd.Timedelta(days=lookback_days)

        # Use 'date' column instead of index (index is integer, not datetime)
        win = df[(pd.to_datetime(df['date']) > wstart) & (pd.to_datetime(df['date']) < cutoff)]
        if win.empty:
            return (np.nan, np.nan)

        return float(win['low'].min()), float(win['high'].max())
    
    def _pos_between(self, val, lo, hi):
        """Calculate position between values"""
        if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, float((val - lo) / (hi - lo))))
    
    def _check_trigger(self, rx):
        """Check if row meets trigger criteria"""
        if pd.isna(rx.get('Prev_Close')) or pd.isna(rx.get('ADV20_$')):
            return False
        if rx['Prev_Close'] < self.params["price_min"] or rx['ADV20_$'] < self.params["adv20_min_usd"]:
            return False
            
        vol_avg = rx.get('VOL_AVG')
        if pd.isna(vol_avg) or vol_avg <= 0:
            return False
            
        vol_sig = max(rx['volume'] / vol_avg, rx.get('Prev_Volume', 0) / vol_avg)
        checks = [
            (rx['tr'] / rx['ATR']) >= self.params['atr_mult'] if pd.notna(rx.get('tr')) and pd.notna(rx.get('ATR')) else False,
            vol_sig >= self.params['vol_mult'] if pd.notna(vol_sig) else False,
            rx['Slope_9_5d'] >= self.params['slope5d_min'] if pd.notna(rx.get('Slope_9_5d')) else False,
            rx['High_over_EMA9_div_ATR'] >= self.params['high_ema9_mult'] if pd.notna(rx.get('High_over_EMA9_div_ATR')) else False,
        ]
        
        return all(bool(x) and np.isfinite(x) for x in checks)
    
    def run_scan(self):
        """Main execution method"""
        print("🚀 Starting Backside B Messy scan...")
        
        # Stage 1: Fetch grouped data
        stage1_data = self.fetch_grouped_data()
        if stage1_data.empty:
            print("❌ No data fetched")
            return pd.DataFrame()
        
        # Stage 2a: Compute SIMPLE features
        stage2a_data = self.compute_simple_features(stage1_data)
        
        # Stage 2b: Apply smart filters
        stage2_data = self.apply_smart_filters(stage2a_data)
        
        # Stage 3a: Compute FULL features
        stage3a_data = self.compute_full_features(stage2_data)
        
        # Stage 3b: Detect patterns
        stage3_results = self.detect_patterns(stage3a_data)
        
        return stage3_results

def main():
    scanner = BacksideBMessy(
        api_key="Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        d0_start="2025-01-01",
        d0_end="2025-11-01"
    )
    
    test_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA']
    print("Testing MESSY Backside B scanner...")
    print("This code has terrible formatting but works!")
    
    results = scanner.run_scan()
    
    if not results.empty:
        print(f"\nFound {len(results)} signals!")
        print(results[["Ticker", "Date", "Gap/ATR", "D1Vol/Avg"]])
    else:
        print("\nNo signals found")
        
    return results

if __name__ == "__main__":
    main()