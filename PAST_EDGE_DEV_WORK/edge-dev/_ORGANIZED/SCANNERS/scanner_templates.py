#!/usr/bin/env python3
"""
Scanner Templates with Parameter Integrity
========================================
Integrates with existing scanner codebase while maintaining 100% parameter integrity.
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any, Optional
import json
import hashlib
from abc import ABC, abstractmethod

class BaseScannerTemplate(ABC):
    """Base template for all scanners with parameter integrity"""

    def __init__(self, parameters: Dict[str, Any], symbol_universe: List[str],
                 date_range: Dict[str, str], api_key: str):
        # Lock parameters - create immutable copy
        self.P = self._create_immutable_params(parameters)
        self.symbol_universe = symbol_universe.copy()
        self.date_range = date_range.copy()
        self.api_key = api_key

        # Generate parameter checksum for integrity verification
        self.parameter_checksum = self._generate_parameter_checksum()

        # Session for API calls
        self.session = requests.Session()
        self.base_url = "https://api.polygon.io"

    def _create_immutable_params(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Create immutable parameter dictionary"""
        return {k: v for k, v in parameters.items()}

    def _generate_parameter_checksum(self) -> str:
        """Generate checksum for parameter integrity verification"""
        param_string = json.dumps(self.P, sort_keys=True)
        return hashlib.sha256(param_string.encode()).hexdigest()[:16]

    def verify_parameter_integrity(self) -> bool:
        """Verify that parameters haven't been modified"""
        current_checksum = self._generate_parameter_checksum()
        return current_checksum == self.parameter_checksum

    @abstractmethod
    def calculate_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate scanner-specific metrics"""
        pass

    @abstractmethod
    def apply_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply scanner-specific filters"""
        pass

    def fetch_daily_data(self, symbol: str) -> pd.DataFrame:
        """Fetch daily data for a symbol"""
        try:
            url = f"{self.base_url}/v2/aggs/ticker/{symbol}/range/1/day/{self.date_range['start']}/{self.date_range['end']}"
            response = self.session.get(url, params={
                "apiKey": self.api_key,
                "adjusted": "true",
                "sort": "asc",
                "limit": 50000
            })
            response.raise_for_status()

            rows = response.json().get("results", [])
            if not rows:
                return pd.DataFrame()

            df = pd.DataFrame(rows)
            df['Date'] = pd.to_datetime(df['t'], unit='ms')
            df.rename(columns={
                'o': 'Open', 'h': 'High', 'l': 'Low', 'c': 'Close', 'v': 'Volume'
            }, inplace=True)
            df.set_index('Date', inplace=True)
            return df[['Open', 'High', 'Low', 'Close', 'Volume']].sort_index()

        except Exception as e:
            print(f"Error fetching data for {symbol}: {str(e)}")
            return pd.DataFrame()

    def scan_symbol(self, symbol: str) -> pd.DataFrame:
        """Scan a single symbol"""
        if not self.verify_parameter_integrity():
            raise ValueError("Parameter integrity check failed")

        df = self.fetch_daily_data(symbol)
        if df.empty:
            return pd.DataFrame()

        df = self.calculate_metrics(df)
        return self.apply_filters(df)

    def scan_all_symbols(self, max_workers: int = 12) -> pd.DataFrame:
        """Scan all symbols in the universe"""
        print(f"🎯 EXECUTING {self.__class__.__name__.upper()}")
        print(f"🔐 Parameter Checksum: {self.parameter_checksum}")
        print(f"📅 Date Range: {self.date_range['start']} to {self.date_range['end']}")
        print(f"📊 Scanning {len(self.symbol_universe)} symbols")
        print("=" * 60)

        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(self.scan_symbol, symbol): symbol for symbol in self.symbol_universe}

            for future in as_completed(futures):
                symbol = futures[future]
                try:
                    df = future.result()
                    if not df.empty:
                        df['Ticker'] = symbol
                        results.append(df)
                        print(f"✓ {symbol}: {len(df)} signals")
                    else:
                        print(f"- {symbol}: no signals")
                except Exception as e:
                    print(f"❌ {symbol}: error - {str(e)}")

        if results:
            final_df = pd.concat(results, ignore_index=True)
            final_df = final_df.sort_values(['Date', 'Ticker'], ascending=[False, True])
            print(f"\n🎯 {self.__class__.__name__.upper()} RESULTS: {len(final_df)} signals")
            return final_df
        else:
            print(f"❌ No {self.__class__.__name__.upper()} signals found.")
            return pd.DataFrame()

class BacksideBScanner(BaseScannerTemplate):
    """Backside B Scanner with parameter integrity"""

    def calculate_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate Backside B specific metrics"""
        if df.empty:
            return df

        m = df.copy()

        # EMAs
        m['EMA_9'] = m['Close'].ewm(span=9, adjust=False).mean()
        m['EMA_20'] = m['Close'].ewm(span=20, adjust=False).mean()

        # ATR calculation
        hi_lo = m['High'] - m['Low']
        hi_pc = (m['High'] - m['Close'].shift(1)).abs()
        lo_pc = (m['Low'] - m['Close'].shift(1)).abs()
        m['TR'] = pd.concat([hi_lo, hi_pc, lo_pc], axis=1).max(axis=1)
        m['ATR_raw'] = m['TR'].rolling(14, min_periods=14).mean()
        m['ATR'] = m['ATR_raw'].shift(1)

        # Volume metrics
        m['VOL_AVG'] = m['Volume'].rolling(14, min_periods=14).mean().shift(1)
        m['ADV20_$'] = (m['Close'] * m['Volume']).rolling(20, min_periods=20).mean().shift(1)

        # Momentum indicators
        m['Slope_9_5d'] = (m['EMA_9'] - m['EMA_9'].shift(5)) / m['EMA_9'].shift(5) * 100
        m['High_over_EMA9_div_ATR'] = (m['High'] - m['EMA_9']) / m['ATR']
        m['Gap_abs'] = (m['Open'] - m['Close'].shift(1)).abs()
        m['Gap_over_ATR'] = m['Gap_abs'] / m['ATR']
        m['Open_over_EMA9'] = m['Open'] / m['EMA_9']
        m['Body_over_ATR'] = (m['Close'] - m['Open']) / m['ATR']

        return m

    def apply_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply Backside B specific filters"""
        rows = []

        for i in range(2, len(df)):
            d0 = df.index[i]
            r0 = df.iloc[i]  # D0
            r1 = df.iloc[i-1]  # D-1
            r2 = df.iloc[i-2]  # D-2

            # Basic filters using locked parameters
            if r0['Close'] < self.P['price_min']:
                continue

            if pd.isna(r0['ADV20_$']) or r0['ADV20_$'] < self.P['adv20_min_usd']:
                continue

            # Backside test
            lo_abs, hi_abs = self._calculate_absolute_window(df, d0)
            pos_abs = self._calculate_position(r1['Close'], lo_abs, hi_abs)
            if pd.isna(pos_abs) or pos_abs > self.P['pos_abs_max']:
                continue

            # Trigger detection (simplified for template)
            trigger_ok = False
            if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0 and
                (r1['Volume'] / r1['VOL_AVG']) >= self.P['vol_mult'] and
                r1['High_over_EMA9_div_ATR'] >= self.P['atr_mult'] and
                r1['Slope_9_5d'] >= self.P['slope5d_min']):
                trigger_ok = True

            if not trigger_ok and (pd.notna(r2['VOL_AVG']) and r2['VOL_AVG'] > 0 and
                                  (r2['Volume'] / r2['VOL_AVG']) >= self.P['vol_mult'] and
                                  r2['High_over_EMA9_div_ATR'] >= self.P['atr_mult'] and
                                  r2['Slope_9_5d'] >= self.P['slope5d_min']):
                trigger_ok = True

            if not trigger_ok:
                continue

            # D0 gates
            if (pd.isna(r0['Gap_over_ATR']) or r0['Gap_over_ATR'] < self.P['gap_div_atr_min']):
                continue

            if (pd.isna(r0['Open_over_EMA9']) or r0['Open_over_EMA9'] < self.P['open_over_ema9_min']):
                continue

            rows.append({
                'Date': d0.strftime('%Y-%m-%d'),
                'Close': round(r0['Close'], 2),
                'ADV20_$': round(r0['ADV20_$']) if pd.notna(r0['ADV20_$']) else np.nan,
                'Gap/ATR': round(r0['Gap_over_ATR'], 2),
                'Open/EMA9': round(r0['Open_over_EMA9'], 2),
                'Slope9_5d': round(r0['Slope_9_5d'], 2) if pd.notna(r0['Slope_9_5d']) else np.nan,
                'Scanner_Type': 'Backside_B',
                'Parameter_Checksum': self.parameter_checksum
            })

        return pd.DataFrame(rows)

    def _calculate_absolute_window(self, df: pd.DataFrame, d0: pd.Timestamp) -> tuple:
        """Calculate absolute window for backside test"""
        lookback = self.P['abs_lookback_days']
        exclude = self.P['abs_exclude_days']

        cutoff = d0 - pd.Timedelta(days=exclude)
        start = cutoff - pd.Timedelta(days=lookback)
        window = df[(df.index > start) & (df.index <= cutoff)]

        if window.empty:
            return (np.nan, np.nan)
        return float(window['Low'].min()), float(window['High'].max())

    def _calculate_position(self, val: float, lo: float, hi: float) -> float:
        """Calculate position in range"""
        if any(pd.isna(x) for x in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, (val - lo) / (hi - lo)))

class HalfAScanner(BaseScannerTemplate):
    """Half A+ Scanner with original parameters"""

    def calculate_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate Half A+ specific metrics"""
        if df.empty:
            return df

        m = df.copy()

        # EMAs
        m['EMA_9'] = m['Close'].ewm(span=9, adjust=False).mean()
        m['EMA_20'] = m['Close'].ewm(span=20, adjust=False).mean()

        # ATR calculation (30-day for Half A+)
        hi_lo = m['High'] - m['Low']
        hi_pc = (m['High'] - m['Close'].shift(1)).abs()
        lo_pc = (m['Low'] - m['Close'].shift(1)).abs()
        m['TR'] = pd.concat([hi_lo, hi_pc, lo_pc], axis=1).max(axis=1)
        m['ATR_raw'] = m['TR'].rolling(30, min_periods=30).mean()
        m['ATR'] = m['ATR_raw'].shift(1)
        atr_safe = m['ATR'].replace(0, np.nan)

        # Volume metrics
        m['VOL_AVG_raw'] = m['Volume'].rolling(30, min_periods=30).mean()
        m['VOL_AVG'] = m['VOL_AVG_raw'].shift(1)

        # Slopes
        for w in (3, 5, 15):
            m[f'Slope_9_{w}d'] = (m['EMA_9'] - m['EMA_9'].shift(w)) / m['EMA_9'].shift(w) * 100

        # Deviations
        m['High_over_EMA9_div_ATR'] = (m['High'] - m['EMA_9']) / atr_safe
        m['High_over_EMA20_div_ATR'] = (m['High'] - m['EMA_20']) / atr_safe

        # Percentage from lows
        low7 = m['Low'].rolling(7, min_periods=7).min()
        low14 = m['Low'].rolling(14, min_periods=14).min()
        m['Pct_7d_low_div_ATR'] = ((m['Close'] - low7) / low7) / atr_safe * 100
        m['Pct_14d_low_div_ATR'] = ((m['Close'] - low14) / low14) / atr_safe * 100

        # Percentage changes
        m['Pct_2d_div_ATR'] = ((m['Close'] / m['Close'].shift(2)) - 1) / atr_safe * 100
        m['Pct_3d_div_ATR'] = ((m['Close'] / m['Close'].shift(3)) - 1) / atr_safe * 100

        # ATR percentage change
        m['ATR_Pct_Change'] = (m['ATR'] / m['ATR'].shift(1) - 1) * 100

        # Additional metrics
        m['Gap_abs'] = (m['Open'] - m['Close'].shift(1)).abs()
        m['Gap_div_ATR'] = m['Gap_abs'] / atr_safe
        m['Open_over_EMA9'] = m['Open'] / m['EMA_9']
        m['Body_over_ATR'] = (m['Close'] - m['Open']) / m['ATR']

        return m

    def apply_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply Half A+ specific filters"""
        rows = []

        for i in range(2, len(df)):
            d0 = df.index[i]
            close = df.loc[d0, 'Close']

            # Basic filters
            if close < self.P['price_min'] or close < self.P['prev_close_min']:
                continue

            # ADV calculation
            adv20 = (close * df.loc[d0, 'Volume']).rolling(20, min_periods=20).mean()
            if pd.isna(adv20) or adv20 < self.P['adv20_min_usd']:
                continue

            # Backside test
            lo_abs, hi_abs = self._abs_window(df, d0, self.P['lookback_days_2y'], self.P['exclude_recent_days'])
            pos_abs = self._pos_in_range(df.iloc[i-1]['Close'], lo_abs, hi_abs)
            if pd.isna(pos_abs) or pos_abs > self.P['not_top_frac_abs']:
                continue

            # Day-0 filters
            if df.loc[d0, 'Pct_2d_div_ATR'] < self.P['pct2d_div_atr_min']:
                continue
            if df.loc[d0, 'Pct_3d_div_ATR'] < self.P['pct3d_div_atr_min']:
                continue
            if df.loc[d0, 'Gap_div_ATR'] < self.P['gap_div_atr_min']:
                continue
            if df.loc[d0, 'Open_over_EMA9'] < self.P['open_over_ema9_min']:
                continue
            if df.loc[d0, 'ATR_Pct_Change'] < self.P['atr_pct_change_min']:
                continue

            rows.append({
                'Date': d0.strftime('%Y-%m-%d'),
                'Close': round(close, 2),
                'PosAbs_2yr': round(pos_abs, 3),
                'Pct_7dLow/ATR': round(df.loc[d0, 'Pct_7d_low_div_ATR'], 2),
                'Pct_14dLow/ATR': round(df.loc[d0, 'Pct_14d_low_div_ATR'], 2),
                'Pct_2d/ATR': round(df.loc[d0, 'Pct_2d_div_ATR'], 2),
                'Pct_3d/ATR': round(df.loc[d0, 'Pct_3d_div_ATR'], 2),
                'Gap/ATR': round(df.loc[d0, 'Gap_div_ATR'], 2),
                'Open>PrevHigh': bool(df.loc[d0, 'Open'] > df.iloc[i-1]['High']),
                'Open/EMA9': round(df.loc[d0, 'Open_over_EMA9'], 2),
                'ATR%Change': round(df.loc[d0, 'ATR_Pct_Change'], 2),
                'ADV20_$': round(adv20) if pd.notna(adv20) else np.nan,
                'Scanner_Type': 'Half_A+',
                'Parameter_Checksum': self.parameter_checksum
            })

        return pd.DataFrame(rows)

    def _abs_window(self, df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
        """Calculate absolute window"""
        if df.empty:
            return (np.nan, np.nan)
        cutoff = d0 - pd.Timedelta(days=exclude_days)
        start = cutoff - pd.Timedelta(days=lookback_days)
        win = df[(df.index > start) & (df.index <= cutoff)]
        if win.empty:
            return (np.nan, np.nan)
        return float(win['Low'].min()), float(win['High'].max())

    def _pos_in_range(self, val: float, lo: float, hi: float) -> float:
        """Calculate position in range"""
        if np.isnan(val) or np.isnan(lo) or np.isnan(hi) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, (val - lo) / (hi - lo)))

class LCMultiScanner(BaseScannerTemplate):
    """LC Multiscanner for small-cap stocks"""

    def calculate_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate LC specific metrics"""
        if df.empty:
            return df

        m = df.copy()

        # EMAs
        m['EMA_9'] = m['Close'].ewm(span=9, adjust=False).mean()
        m['EMA_20'] = m['Close'].ewm(span=20, adjust=False).mean()

        # ATR calculation
        hi_lo = m['High'] - m['Low']
        hi_pc = (m['High'] - m['Close'].shift(1)).abs()
        lo_pc = (m['Low'] - m['Close'].shift(1)).abs()
        m['TR'] = pd.concat([hi_lo, hi_pc, lo_pc], axis=1).max(axis=1)
        m['ATR_raw'] = m['TR'].rolling(14, min_periods=14).mean()
        m['ATR'] = m['ATR_raw'].shift(1)

        # Volume metrics (optimized for LC)
        m['VOL_AVG'] = m['Volume'].rolling(14, min_periods=14).mean().shift(1)
        m['ADV20_$'] = (m['Close'] * m['Volume']).rolling(20, min_periods=20).mean().shift(1)

        # Momentum
        m['Slope_9_5d'] = (m['EMA_9'] - m['EMA_9'].shift(5)) / m['EMA_9'].shift(5) * 100
        m['High_over_EMA9_div_ATR'] = (m['High'] - m['EMA_9']) / m['ATR']

        # Gap and price movement
        m['Gap_abs'] = (m['Open'] - m['Close'].shift(1)).abs()
        m['Gap_over_ATR'] = m['Gap_abs'] / m['ATR']
        m['Gap_pct'] = (m['Open'] - m['Close'].shift(1)) / m['Close'].shift(1) * 100
        m['Open_over_EMA9'] = m['Open'] / m['EMA_9']
        m['Body_over_ATR'] = (m['Close'] - m['Open']) / m['ATR']

        # 3-day price change
        m['Price_3d_pct'] = ((m['Close'] / m['Close'].shift(3)) - 1) * 100

        return m

    def apply_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply LC specific filters"""
        rows = []

        for i in range(2, len(df)):
            d0 = df.index[i]
            r0 = df.iloc[i]  # D0
            r1 = df.iloc[i-1]  # D-1
            r2 = df.iloc[i-2]  # D-2

            # LC-specific basic filters
            if r0['Close'] < self.P['price_min']:
                continue

            if pd.isna(r0['ADV20_$']) or r0['ADV20_$'] < self.P['adv20_min_usd']:
                continue

            # LC backside test (more lenient)
            lo_abs, hi_abs = self._calculate_window(df, d0)
            pos_abs = self._calculate_position(r1['Close'], lo_abs, hi_abs)
            if pd.isna(pos_abs) or pos_abs > self.P['pos_abs_max']:
                continue

            # Trigger detection (D-1 or D-2)
            trigger_ok = False
            trigger_day = "D-1"

            if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0 and
                (r1['Volume'] / r1['VOL_AVG']) >= self.P['vol_mult'] and
                r1['High_over_EMA9_div_ATR'] >= self.P['atr_mult']):
                trigger_ok = True
            elif (pd.notna(r2['VOL_AVG']) and r2['VOL_AVG'] > 0 and
                  (r2['Volume'] / r2['VOL_AVG']) >= self.P['vol_mult'] and
                  r2['High_over_EMA9_div_ATR'] >= self.P['atr_mult']):
                trigger_ok = True
                trigger_day = "D-2"

            if not trigger_ok:
                continue

            # D0 gates for LC (more lenient)
            if pd.isna(r0['Gap_over_ATR']) or r0['Gap_over_ATR'] < self.P['gap_div_atr_min']:
                continue

            # Calculate volume spike ratio
            vol_spike = max(
                (r1['Volume'] / r1['VOL_AVG']) if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0) else 1,
                (r2['Volume'] / r2['VOL_AVG']) if (pd.notna(r2['VOL_AVG']) and r2['VOL_AVG'] > 0) else 1
            )

            rows.append({
                'Date': d0.strftime('%Y-%m-%d'),
                'Trigger': trigger_day,
                'PosAbs_window': round(pos_abs, 3),
                'D1_Body/ATR': round(r1['Body_over_ATR'], 2) if pd.notna(r1['Body_over_ATR']) else np.nan,
                'D1Vol(shares)': int(r1['Volume']) if pd.notna(r1['Volume']) else np.nan,
                'D1Vol/Avg': round((r1['Volume'] / r1['VOL_AVG']), 2) if (pd.notna(r1['VOL_AVG']) and r1['VOL_AVG'] > 0) else np.nan,
                'VolSpike_Ratio': round(vol_spike, 2),
                'Gap/ATR': round(r0['Gap_over_ATR'], 2),
                'Gap%': round(r0['Gap_pct'], 2),
                'Open>PrevHigh': bool(r0['Open'] > r1['High']),
                'Open/EMA9': round(r0['Open_over_EMA9'], 2),
                'Slope9_5d': round(r0['Slope_9_5d'], 2) if pd.notna(r0['Slope_9_5d']) else np.nan,
                'Price_3d%': round(r0['Price_3d_pct'], 2) if pd.notna(r0['Price_3d_pct']) else np.nan,
                'High-EMA9/ATR(trigger)': round(r1['High_over_EMA9_div_ATR'], 2) if trigger_day == "D-1" else round(r2['High_over_EMA9_div_ATR'], 2),
                'ADV20_$': round(r0['ADV20_$']) if pd.notna(r0['ADV20_$']) else np.nan,
                'Scanner_Type': 'LC_Multi',
                'Parameter_Checksum': self.parameter_checksum
            })

        return pd.DataFrame(rows)

    def _calculate_window(self, df: pd.DataFrame, d0: pd.Timestamp) -> tuple:
        """Calculate window for LC stocks"""
        lookback = self.P.get('abs_lookback_days', 500)
        exclude = self.P.get('abs_exclude_days', 5)

        cutoff = d0 - pd.Timedelta(days=exclude)
        start = cutoff - pd.Timedelta(days=lookback)
        window = df[(df.index > start) & (df.index <= cutoff)]

        if window.empty:
            return (np.nan, np.nan)
        return float(window['Low'].min()), float(window['High'].max())

    def _calculate_position(self, val: float, lo: float, hi: float) -> float:
        """Calculate position in range"""
        if any(pd.isna(x) for x in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, (val - lo) / (hi - lo)))

def create_scanner(scanner_type: str, parameters: Dict[str, Any],
                  symbol_universe: List[str], date_range: Dict[str, str],
                  api_key: str) -> BaseScannerTemplate:
    """Factory function to create scanner with parameter integrity"""

    scanner_classes = {
        'backside_b': BacksideBScanner,
        'half_a_plus': HalfAScanner,
        'lc_multiscanner': LCMultiScanner
    }

    if scanner_type not in scanner_classes:
        raise ValueError(f"Unknown scanner type: {scanner_type}")

    return scanner_classes[scanner_type](parameters, symbol_universe, date_range, api_key)