import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional

class BacksideBScanner:
    """Backside B Scanner using 3-stage grouped endpoint architecture for full market scanning"""

    def __init__(self, api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I", 
                 d0_start: str = "2020-01-01", 
                 d0_end: str = "2025-11-01"):
        """Initialize scanner with date range and API configuration"""
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        
        # Date ranges
        self.d0_start = d0_start
        self.d0_end = d0_end
        
        # Session with connection pooling
        self.session = requests.Session()
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=2,
            pool_block=False
        ))
        
        # Worker configuration
        self.stage1_workers = 5
        self.stage3_workers = 10
        
        # Parameters dictionary with specific names
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30000000,
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_vol_mult_min": None,
            "d1_volume_min": 15000000,
            "slope5d_min": 3.0,
            "high_ema9_mult": 1.05,
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.30,
            "require_open_gt_prev_high": True,
            "enforce_d1_above_d2": True,
        }
        
        # Create trading calendar
        nyse = mcal.get_calendar('NYSE')
        self.trading_dates = nyse.schedule(start_date=d0_start, end_date=d0_end).index.strftime('%Y-%m-%d').tolist()

    def run_scan(self):
        """Main execution method following 3-stage architecture"""
        print("🚀 Starting Backside B scan...")
        
        # Stage 1: Fetch grouped data (all tickers for all dates)
        stage1_data = self.fetch_grouped_data()
        if stage1_data.empty:
            print("❌ No data fetched")
            return []
        
        print(f"📊 Stage 1 complete: {len(stage1_data)} records fetched")
        
        # Stage 2: Apply smart filters (reduce dataset by 99%)
        stage2_data = self._apply_smart_filters(stage1_data)
        if stage2_data.empty:
            print("❌ No data passed filters")
            return []
            
        print(f"📈 Stage 2 complete: {len(stage2_data)} records after filtering")
        
        # Stage 3: Detect patterns
        stage3_results = self.detect_patterns(stage2_data)
        
        print(f"✅ Scan complete: Found {len(stage3_results)} signals")
        return stage3_results

    def fetch_grouped_data(self) -> pd.DataFrame:
        """Stage 1: Fetch all tickers for all trading days using grouped endpoint"""
        all_data = []
        failed = 0
        completed = 0
        
        print(f"📥 Fetching data for {len(self.trading_dates)} trading days...")
        
        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            future_to_date = {
                executor.submit(self._fetch_grouped_day, date_str): date_str
                for date_str in self.trading_dates
            }
            
            for future in as_completed(future_to_date):
                date_str = future_to_date[future]
                try:
                    data = future.result()
                    if data is not None and not data.empty:
                        all_data.append(data)
                    completed += 1
                    
                    if completed % 50 == 0:
                        print(f"📥 Progress: {completed}/{len(self.trading_dates)} days processed")
                        
                except Exception as e:
                    print(f"❌ Error processing {date_str}: {e}")
                    failed += 1
                    
        print(f"📥 Stage 1 complete: {completed} successful, {failed} failed")
        
        if not all_data:
            return pd.DataFrame()
            
        # Combine all data
        df = pd.concat(all_data, ignore_index=True)
        
        # Standardize column names and data types
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
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
        
        return df

    def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
        """Fetch all tickers for a single day using grouped endpoint"""
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
        response = self.session.get(url, params={'apiKey': self.api_key})
        
        if response.status_code != 200:
            return None
            
        data = response.json()
        if 'results' not in data:
            return None
            
        df = pd.DataFrame(data['results'])
        return df

    def _apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2: Reduce dataset by 99% using smart filters"""
        if df.empty:
            return df
            
        # Calculate basic metrics needed for filtering
        df['dollar_value'] = df['close'] * df['volume']
        
        # Apply filters
        filtered = df[
            (df['close'] >= self.params['price_min']) &
            (df['volume'] > 0) &
            (df['dollar_value'] > 1000000)  # Minimum dollar value filter
        ].copy()
        
        return filtered.reset_index(drop=True)

    def detect_patterns(self, df: pd.DataFrame) -> List[Dict]:
        """Stage 3: Apply pattern detection logic with parallel processing"""
        if df.empty:
            return []
            
        # Get unique tickers
        unique_tickers = df['ticker'].unique().tolist()
        print(f"🔍 Detecting patterns for {len(unique_tickers)} unique tickers...")
        
        all_results = []
        completed = 0
        
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            future_to_ticker = {
                executor.submit(self._process_ticker, ticker, df[df['ticker'] == ticker].copy()): ticker
                for ticker in unique_tickers
            }
            
            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                try:
                    results = future.result()
                    if results:
                        all_results.extend(results)
                    completed += 1
                    
                    if completed % 100 == 0:
                        print(f"🔍 Progress: {completed}/{len(unique_tickers)} tickers processed")
                        
                except Exception as e:
                    print(f"❌ Error processing {ticker}: {e}")
                    
        return all_results

    def _process_ticker(self, ticker: str, df: pd.DataFrame) -> List[Dict]:
        """Process a single ticker for pattern detection"""
        if len(df) < 20:  # Need minimum data for calculations
            return []
            
        # Add technical indicators
        df = self._add_metrics(df)
        
        results = []
        for i in range(2, len(df)):
            d0_idx = df.index[i]
            d0_date = df.loc[d0_idx, 'date']
            
            # Get current and previous rows
            r0 = df.loc[d0_idx]
            r1 = df.loc[df.index[i-1]]
            r2 = df.loc[df.index[i-2]]
            
            # Absolute position window calculation
            lo_abs, hi_abs = self._abs_top_window(df, d0_date, 
                                                self.params['abs_lookback_days'], 
                                                self.params['abs_exclude_days'])
            
            pos_abs_prev = self._pos_between(r1['close'], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.params['pos_abs_max']):
                continue
                
            # Trigger check
            trigger_ok = False
            trig_row = None
            trig_tag = "-"
            
            if self.params['trigger_mode'] == "D1_only":
                if self._check_trigger(r1): 
                    trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:
                if self._check_trigger(r1): 
                    trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif self._check_trigger(r2): 
                    trigger_ok, trig_row, trig_tag = True, r2, "D-2"
                    
            if not trigger_ok:
                continue
                
            # Additional checks
            if not (pd.notna(r1['body_over_atr']) and r1['body_over_atr'] >= self.params['d1_green_atr_min']):
                continue
                
            if self.params['d1_volume_min'] is not None:
                if not (pd.notna(r1['volume']) and r1['volume'] >= self.params['d1_volume_min']):
                    continue
                    
            if self.params['d1_vol_mult_min'] is not None:
                if not (pd.notna(r1['vol_avg']) and r1['vol_avg'] > 0 and 
                       (r1['volume']/r1['vol_avg']) >= self.params['d1_vol_mult_min']):
                    continue
                    
            if self.params['enforce_d1_above_d2']:
                if not (pd.notna(r1['high']) and pd.notna(r2['high']) and r1['high'] > r2['high'] and
                       pd.notna(r1['close']) and pd.notna(r2['close']) and r1['close'] > r2['close']):
                    continue
                    
            if pd.isna(r0['gap_over_atr']) or r0['gap_over_atr'] < self.params['gap_div_atr_min']:
                continue
                
            if self.params['require_open_gt_prev_high'] and not (r0['open'] > r1['high']):
                continue
                
            if pd.isna(r0['open_over_ema9']) or r0['open_over_ema9'] < self.params['open_over_ema9_min']:
                continue
                
            # Calculate additional metrics for output
            d1_vol_mult = (r1['volume']/r1['vol_avg']) if (pd.notna(r1['vol_avg']) and r1['vol_avg'] > 0) else np.nan
            
            volsig_max = np.nan
            if (pd.notna(r1['vol_avg']) and r1['vol_avg'] > 0 and 
                pd.notna(r2['vol_avg']) and r2['vol_avg'] > 0):
                volsig_max = max(r1['volume']/r1['vol_avg'], r2['volume']/r2['vol_avg'])
                
            results.append({
                'ticker': ticker,
                'date': d0_date,
                'close': float(r0['close']),
                'volume': int(r1['volume']),
                'confidence': self._calculate_confidence(r0, r1, r2, trig_row),
                'trigger': trig_tag,
                'pos_abs_1000d': round(float(pos_abs_prev), 3),
                'd1_body_atr': round(float(r1['body_over_atr']), 2),
                'd1_vol_shares': int(r1['volume']),
                'd1_vol_avg': round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else None,
                'vol_sig_max': round(float(volsig_max), 2) if pd.notna(volsig_max) else None,
                'gap_atr': round(float(r0['gap_over_atr']), 2),
                'open_gt_prev_high': bool(r0['open'] > r1['high']),
                'open_ema9': round(float(r0['open_over_ema9']), 2),
                'd1_high_gt_d2': bool(r1['high'] > r2['high']),
                'd1_close_gt_d2': bool(r1['close'] > r2['close']),
                'slope9_5d': round(float(r0['slope_9_5d']), 2) if pd.notna(r0['slope_9_5d']) else None,
                'high_ema9_atr_trigger': round(float(trig_row['high_over_ema9_div_atr']), 2),
                'adv20_usd': round(float(r0['adv20_dollar'])) if pd.notna(r0['adv20_dollar']) else None,
            })
            
        return results

    def _add_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators to dataframe"""
        if df.empty:
            return df
            
        df = df.copy()
        
        # EMA calculations
        df['ema_9'] = df['close'].ewm(span=9, adjust=False).mean()
        df['ema_20'] = df['close'].ewm(span=20, adjust=False).mean()
        
        # True Range and ATR
        hi_lo = df['high'] - df['low']
        hi_prev = (df['high'] - df['close'].shift(1)).abs()
        lo_prev = (df['low'] - df['close'].shift(1)).abs()
        df['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
        df['atr_raw'] = df['tr'].rolling(14, min_periods=14).mean()
        df['atr'] = df['atr_raw'].shift(1)
        
        # Volume metrics
        df['vol_avg'] = df['volume'].rolling(14, min_periods=14).mean().shift(1)
        df['prev_volume'] = df['volume'].shift(1)
        df['adv20_dollar'] = (df['close'] * df['volume']).rolling(20, min_periods=20).mean().shift(1)
        
        # Slope calculation
        df['slope_9_5d'] = (df['ema_9'] - df['ema_9'].shift(5)) / df['ema_9'].shift(5) * 100
        
        # Price pattern metrics
        df['high_over_ema9_div_atr'] = (df['high'] - df['ema_9']) / df['atr']
        df['gap_abs'] = (df['open'] - df['close'].shift(1)).abs()
        df['gap_over_atr'] = df['gap_abs'] / df['atr']
        df['open_over_ema9'] = df['open'] / df['ema_9']
        df['body_over_atr'] = (df['close'] - df['open']) / df['atr']
        
        # Previous values
        df['prev_close'] = df['close'].shift(1)
        df['prev_open'] = df['open'].shift(1)
        df['prev_high'] = df['high'].shift(1)
        
        return df

    def _abs_top_window(self, df: pd.DataFrame, d0_date: str, lookback_days: int, exclude_days: int) -> tuple:
        """Calculate absolute top window for position calculation"""
        if df.empty:
            return (np.nan, np.nan)
            
        d0 = pd.to_datetime(d0_date)
        cutoff = d0 - pd.Timedelta(days=exclude_days)
        wstart = cutoff - pd.Timedelta(days=lookback_days)
        
        # Filter data within window
        mask = (pd.to_datetime(df['date']) > wstart) & (pd.to_datetime(df['date']) <= cutoff)
        win = df[mask]
        
        if win.empty:
            return (np.nan, np.nan)
            
        return float(win['low'].min()), float(win['high'].max())

    def _pos_between(self, val: float, lo: float, hi: float) -> float:
        """Calculate position between low and high values"""
        if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

    def _check_trigger(self, row: pd.Series) -> bool:
        """Check if a row meets trigger conditions"""
        if pd.isna(row.get('prev_close')) or pd.isna(row.get('adv20_dollar')):
            return False
            
        if row['prev_close'] < self.params['price_min'] or row['adv20_dollar'] < self.params['adv20_min_usd']:
            return False
            
        vol_avg = row['vol_avg']
        if pd.isna(vol_avg) or vol_avg <= 0:
            return False
            
        vol_sig = max(row['volume']/vol_avg, row['prev_volume']/vol_avg)
        checks = [
            (row['tr']/row['atr']) >= self.params['atr_mult'],
            vol_sig >= self.params['vol_mult'],
            row['slope_9_5d'] >= self.params['slope5d_min'],
            row['high_over_ema9_div_atr'] >= self.params['high_ema9_mult'],
        ]
        
        return all(bool(x) and np.isfinite(x) for x in checks)

    def _calculate_confidence(self, r0: pd.Series, r1: pd.Series, r2: pd.Series, trig_row: pd.Series) -> float:
        """Calculate confidence score for signal"""
        # Simple confidence based on multiple factors
        factors = []
        
        # Gap strength
        if pd.notna(r0['gap_over_atr']):
            factors.append(min(r0['gap_over_atr'] / 2.0, 1.0))
            
        # Volume confirmation
        if pd.notna(r1['vol_avg']) and r1['vol_avg'] > 0:
            vol_ratio = r1['volume'] / r1['vol_avg']
            factors.append(min(vol_ratio / 3.0, 1.0))
            
        # Price action
        if pd.notna(r1['body_over_atr']):
            factors.append(min(abs(r1['body_over_atr']) / 2.0, 1.0))
            
        if not factors:
            return 0.5
            
        return float(np.mean(factors))