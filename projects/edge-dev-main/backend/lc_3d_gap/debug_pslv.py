"""
Debug script to test LC 3D Gap with PSLV specifically
PSLV should have a signal on 2025-12-26 according to validation CSV
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import pandas_market_calendars as mcal
import requests

class SimpleLC3DGapDebug:
    """Simplified version for debugging"""

    def __init__(self):
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.us_calendar = mcal.get_calendar('NYSE')

    def fetch_ticker_data(self, ticker, start_date, end_date):
        """Fetch data for a single ticker"""
        url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
        params = {
            "adjusted": "true",
            "apiKey": self.api_key
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json().get('results', [])
            if data:
                df = pd.DataFrame(data)
                df['date'] = pd.to_datetime(df['t'], unit='ms').dt.strftime('%Y-%m-%d')
                df = df.rename(columns={'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'})
                df = df[['date', 'open', 'high', 'low', 'close', 'volume']]
                return df.sort_values('date').reset_index(drop=True)
        return None

    def calculate_atr(self, df, period=14):
        """Calculate ATR"""
        high = df['high']
        low = df['low']
        prev_close = df['close'].shift(1)

        hi_lo = high - low
        hi_cp = abs(high - prev_close)
        lo_cp = abs(low - prev_close)

        tr = pd.concat([hi_lo, hi_cp, lo_cp], axis=1).max(axis=1)
        atr = tr.rolling(window=period, min_periods=period).mean()
        return atr

    def calculate_ema(self, series, period):
        """Calculate EMA"""
        return series.ewm(span=period, adjust=False).mean()

    def check_pslv_signal(self):
        """Check if PSLV on 2025-12-26 meets LC 3D Gap conditions"""
        # Get 705 days of data
        end_date = datetime(2025, 12, 26)
        start_date = end_date - timedelta(days=705)

        print(f"Fetching PSLV data from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

        df = self.fetch_ticker_data('PSLV', start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))

        if df is None or len(df) < 93:
            print(f"ERROR: Not enough data. Got {len(df) if df is not None else 0} rows")
            return

        print(f"Got {len(df)} rows of data")

        # Calculate indicators
        df['EMA_10'] = self.calculate_ema(df['close'], 10)
        df['EMA_30'] = self.calculate_ema(df['close'], 30)
        df['ATR'] = self.calculate_atr(df)

        # Find the row for 2025-12-26
        target_date = '2025-12-26'
        target_idx = df[df['date'] == target_date].index

        if len(target_idx) == 0:
            print(f"ERROR: {target_date} not found in data")
            print(f"Date range: {df['date'].min()} to {df['date'].max()}")
            return

        i = target_idx[0]
        print(f"\nFound {target_date} at index {i}")

        # Check if we have enough data before this row
        if i < 93:
            print(f"ERROR: Not enough historical data (need 93 rows, have {i})")
            return

        # Day -1 is at i-1, Day -2 is at i-2, etc.
        # Day 0 (today) is at index i
        # Day -1 (yesterday) is at index i-1
        # Day -14 is at index i-14

        r_1 = df.iloc[i-1]  # Day -1
        atr_day_1 = r_1['ATR']

        print(f"\nDay -1 ({df.iloc[i-1]['date']}):")
        print(f"  Close: ${r_1['close']:.2f}")
        print(f"  Volume: {r_1['volume']:,}")
        print(f"  ATR: {atr_day_1:.4f}")
        print(f"  EMA_10: {r_1['EMA_10']:.2f}")
        print(f"  EMA_30: {r_1['EMA_30']:.2f}")

        # Day -14 average EMA distance
        # In original: historical_data[:-14] then takes last 14 days
        # At index i, day -14 is at i-14
        # We need the 14 days BEFORE day -14, which is indices (i-28) to (i-14)
        ema10_slice = df['EMA_10'].iloc[i-28:i-14]
        ema30_slice = df['EMA_30'].iloc[i-28:i-14]
        highs_slice = df['high'].iloc[i-28:i-14]

        print(f"\nDay -14 calculation (indices {i-28} to {i-14}):")
        print(f"  Slice length: {len(ema10_slice)}")

        # Calculate average EMA distance for last 14 days
        day_14_avg_ema10 = 0
        day_14_avg_ema30 = 0
        for j in range(14):
            pos = -(j + 1)  # -1, -2, ..., -14
            high = highs_slice.iloc[pos]
            ema10_val = ema10_slice.iloc[pos]
            ema30_val = ema30_slice.iloc[pos]
            dist10 = (high - ema10_val) / atr_day_1
            dist30 = (high - ema30_val) / atr_day_1
            day_14_avg_ema10 += dist10
            day_14_avg_ema30 += dist30

        day_14_avg_ema10 /= 14
        day_14_avg_ema30 /= 14

        print(f"  Day_14_Avg_EMA10: {day_14_avg_ema10:.4f} (need >= 0.25)")
        print(f"  Day_14_Avg_EMA30: {day_14_avg_ema30:.4f} (need >= 0.5)")

        # Calculate all remaining conditions
        r_2 = df.iloc[i-2]  # Day -2
        r0 = df.iloc[i]  # Day 0

        # Day -7 average
        ema10_slice_7 = df['EMA_10'].iloc[i-21:i-14]
        ema30_slice_7 = df['EMA_30'].iloc[i-21:i-14]
        highs_7 = df['high'].iloc[i-21:i-14]

        day_7_avg_ema10 = 0
        day_7_avg_ema30 = 0
        for j in range(7):
            pos = -(j + 1)
            high = highs_7.iloc[pos]
            ema10_val = ema10_slice_7.iloc[pos]
            ema30_val = ema30_slice_7.iloc[pos]
            day_7_avg_ema10 += (high - ema10_val) / atr_day_1
            day_7_avg_ema30 += (high - ema30_val) / atr_day_1
        day_7_avg_ema10 /= 7
        day_7_avg_ema30 /= 7

        # Day -3 average
        ema10_slice_3 = df['EMA_10'].iloc[i-17:i-14]
        ema30_slice_3 = df['EMA_30'].iloc[i-17:i-14]
        highs_3 = df['high'].iloc[i-17:i-14]

        day_3_avg_ema10 = 0
        day_3_avg_ema30 = 0
        for j in range(3):
            pos = -(j + 1)
            high = highs_3.iloc[pos]
            ema10_val = ema10_slice_3.iloc[pos]
            ema30_val = ema30_slice_3.iloc[pos]
            day_3_avg_ema10 += (high - ema10_val) / atr_day_1
            day_3_avg_ema30 += (high - ema30_val) / atr_day_1
        day_3_avg_ema10 /= 3
        day_3_avg_ema30 /= 3

        # Day -2 EMA distances
        day_2_ema10_dist = (r_2['high'] - r_2['EMA_10']) / atr_day_1
        day_2_ema30_dist = (r_2['high'] - r_2['EMA_30']) / atr_day_1

        # Day -1 EMA distances
        day_1_ema10_dist = (r_1['high'] - r_1['EMA_10']) / atr_day_1
        day_1_ema30_dist = (r_1['high'] - r_1['EMA_30']) / atr_day_1

        # Swing high calculation (day -5 to -65)
        swing_highs_data = df['high'].iloc[i-65:i-2].values
        swing_highs = []
        for j in range(1, len(swing_highs_data) - 1):
            if swing_highs_data[j] > swing_highs_data[j-1] and swing_highs_data[j] > swing_highs_data[j+1]:
                swing_highs.append(swing_highs_data[j])
        highest_swing_high = max(swing_highs) if swing_highs else None
        day_1_high_vs_swing = (r_1['high'] - highest_swing_high) / atr_day_1 if highest_swing_high else None

        # Day 0 gap calculations
        day_0_gap = (r0['open'] - r_1['close']) / atr_day_1
        day_0_open_minus_d1_high = (r0['open'] - r_1['high']) / atr_day_1

        # Check all 15 conditions
        conditions = {
            "Day -14 Avg EMA10 >= 0.25": day_14_avg_ema10 >= 0.25,
            "Day -14 Avg EMA30 >= 0.5": day_14_avg_ema30 >= 0.5,
            "Day -7 Avg EMA10 >= 0.25": day_7_avg_ema10 >= 0.25,
            "Day -7 Avg EMA30 >= 0.75": day_7_avg_ema30 >= 0.75,
            "Day -3 Avg EMA10 >= 0.5": day_3_avg_ema10 >= 0.5,
            "Day -3 Avg EMA30 >= 1.0": day_3_avg_ema30 >= 1.0,
            "Day -2 EMA10 >= 1.0": day_2_ema10_dist >= 1.0,
            "Day -2 EMA30 >= 2.0": day_2_ema30_dist >= 2.0,
            "Day -1 EMA10 >= 1.5": day_1_ema10_dist >= 1.5,
            "Day -1 EMA30 >= 3.0": day_1_ema30_dist >= 3.0,
            "Day -1 Volume >= 7M": r_1['volume'] >= 7_000_000,
            "Day -1 Close >= $20": r_1['close'] >= 20,
            "Day -1 High >= Swing High": day_1_high_vs_swing >= 1.0 if day_1_high_vs_swing else False,
            "Day 0 Gap >= 0.5": day_0_gap >= 0.5,
            "Day 0 Open - D-1 High >= 0.1": day_0_open_minus_d1_high >= 0.1,
        }

        print(f"\nAll calculated values:")
        print(f"  Day_14_Avg_EMA10: {day_14_avg_ema10:.4f} (need >= 0.25)")
        print(f"  Day_14_Avg_EMA30: {day_14_avg_ema30:.4f} (need >= 0.5)")
        print(f"  Day_7_Avg_EMA10: {day_7_avg_ema10:.4f} (need >= 0.25)")
        print(f"  Day_7_Avg_EMA30: {day_7_avg_ema30:.4f} (need >= 0.75)")
        print(f"  Day_3_Avg_EMA10: {day_3_avg_ema10:.4f} (need >= 0.5)")
        print(f"  Day_3_Avg_EMA30: {day_3_avg_ema30:.4f} (need >= 1.0)")
        print(f"  Day_2_EMA10_Dist: {day_2_ema10_dist:.4f} (need >= 1.0)")
        print(f"  Day_2_EMA30_Dist: {day_2_ema30_dist:.4f} (need >= 2.0)")
        print(f"  Day_1_EMA10_Dist: {day_1_ema10_dist:.4f} (need >= 1.5)")
        print(f"  Day_1_EMA30_Dist: {day_1_ema30_dist:.4f} (need >= 3.0)")
        print(f"  Day_1_Volume: {r_1['volume']:,.0f} (need >= 7,000,000)")
        print(f"  Day_1_Close: ${r_1['close']:.2f} (need >= $20)")
        print(f"  Day_1_High_vs_Swing: {day_1_high_vs_swing:.4f} (need >= 1.0)" if day_1_high_vs_swing else "  Day_1_High_vs_Swing: N/A (need >= 1.0)")
        print(f"  Day_0_Gap: {day_0_gap:.4f} (need >= 0.5)")
        print(f"  Day_0_Open_Minus_D1_High: {day_0_open_minus_d1_high:.4f} (need >= 0.1)")

        print(f"\nConditions check:")
        for name, passed in conditions.items():
            status = "✓" if passed else "✗"
            print(f"  {status} {name}")

        all_passed = all(conditions.values())
        print(f"\nAll checked conditions passed: {all_passed}")

if __name__ == "__main__":
    debug = SimpleLC3DGapDebug()
    debug.check_pslv_signal()
