# Standardized LC D2 Scanner
# Compatible with Universal Scanner Engine
# Original: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py

import pandas as pd
import numpy as np
import requests
from datetime import datetime
from typing import List, Dict, Any
import warnings

warnings.filterwarnings("ignore")

# ───────── Global Config ─────────
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"
session = requests.Session()

# ───────── Required by Universal Scanner Engine ─────────
SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'SHOP', 'SQ',
    'MSTR', 'SMCI', 'DJT', 'BABA', 'TCOM', 'AMC', 'SOXL', 'MRVL',
    'TGT', 'DOCU', 'ZM', 'DIS', 'SNAP', 'RBLX', 'SE', 'BA',
    'QCOM', 'KO', 'PEP', 'ABBV', 'JNJ', 'BAC', 'JPM', 'WMT',
    'CVX', 'XOM', 'COP', 'RTX', 'SPGI', 'GS', 'HD', 'LOW',
    'COST', 'UNH', 'NKE', 'LMT', 'HON', 'CAT', 'LIN', 'AVGO',
    'TXN', 'ACN', 'UPS', 'BLK', 'PM', 'ELV', 'VRTX', 'ZTS',
    'NOW', 'ISRG', 'PLD', 'MS', 'MDT', 'WM', 'GE', 'IBM',
    'BKNG', 'FDX', 'ADP', 'EQIX', 'DHR', 'SNPS', 'REGN', 'SYK',
    'TMO', 'CVS', 'INTU', 'SCHW', 'CI', 'APD', 'SO', 'MMC',
    'ICE', 'FIS', 'ADI', 'CSX', 'LRCX', 'GILD', 'RIVN', 'PLTR',
    'SNOW', 'SPY', 'QQQ', 'IWM', 'RIOT', 'MARA', 'COIN', 'MRNA',
    'CELH', 'UPST', 'AFRM', 'DKNG', 'GME', 'UVXY', 'SBET', 'TIGR'
]

# ───────── Original Data Fetching and Processing Functions ─────────
def fetch_daily_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch daily market data from Polygon API"""
    try:
        url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
        params = {"apiKey": API_KEY, "adjusted": "true", "sort": "asc", "limit": 50000}
        response = session.get(url, params=params)
        response.raise_for_status()

        data = response.json().get("results", [])
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
        df.rename(columns={'T': 'ticker', 'o': 'o', 'h': 'h', 'l': 'l', 'c': 'c', 'v': 'v'}, inplace=True)

        # Add unadjusted versions (simulated for standardization)
        for col in ['c', 'h', 'l', 'o', 'v']:
            df[f'{col}_ua'] = df[col]

        return df.sort_values('date')

    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return pd.DataFrame()

def adjust_daily(df: pd.DataFrame) -> pd.DataFrame:
    """Apply all technical indicators and calculations from original LC code"""
    if df.empty:
        return df

    df = df.copy()

    # Basic calculations
    df['pdc'] = df['c'].shift(1)
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = abs(df['h'] - df['pdc'])
    df['low_pdc'] = abs(df['l'] - df['pdc'])
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df['true_range'].rolling(window=14).mean()
    df.drop(['high_low', 'high_pdc', 'low_pdc'], axis=1, inplace=True, errors='ignore')

    # Shifted values
    for i in range(1, 4):
        df[f'h{i}'] = df['h'].shift(i)
        df[f'c{i}'] = df['c'].shift(i)
        df[f'o{i}'] = df['o'].shift(i)
        df[f'l{i}'] = df['l'].shift(i)
        df[f'v{i}'] = df['v'].shift(i)
        if f'v_ua{i}' not in df.columns:
            df[f'v_ua{i}'] = df[f'v{i}']

    # Dollar volume
    df['dol_v'] = df['c'] * df['v']
    for i in range(1, 6):
        df[f'dol_v{i}'] = df['dol_v'].shift(i)

    # Close range
    df['close_range'] = (df['c'] - df['l'])/(df['h'] - df['l'])
    df['close_range1'] = df['close_range'].shift(1)
    df['close_range2'] = df['close_range'].shift(2)

    # Gap calculations
    df['gap_atr'] = ((df['o'] - df['pdc'])/df['atr'])
    df['gap_atr1'] = ((df['o1'] - df['c2'])/df['atr'])
    df['gap_atr2'] = df['gap_atr1'].shift(1)

    # High change calculations
    df['high_chg'] = (df['h'] - df['o'])
    df['high_chg_atr'] = ((df['h'] - df['o'])/df['atr'])
    df['high_chg_atr1'] = ((df['h1'] - df['o1'])/df['atr'])
    df['high_chg_atr2'] = ((df['h2'] - df['o2'])/df['atr'])

    # Percentage changes
    df['pct_change'] = round(((df['c'] / df['c1']) - 1)*100, 2)
    df['gap_pct'] = (df['o'] / df['pdc']) - 1
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1
    df['high_pct_chg1'] = df['high_pct_chg'].shift(1)
    df['high_pct_chg2'] = df['high_pct_chg'].shift(2)

    # EMAs
    for span in [9, 20, 50, 200]:
        df[f'ema{span}'] = df['c'].ewm(span=span, adjust=False).mean().fillna(0)
        df[f'ema{span}_1'] = df[f'ema{span}'].shift(1)

    # EMA distances
    for span in [9, 20, 50, 200]:
        df[f'dist_h_{span}ema'] = (df['h'] - df[f'ema{span}'])
        df[f'dist_h_{span}ema_atr'] = df[f'dist_h_{span}ema'] / df['atr']
        df[f'dist_h_{span}ema_atr1'] = df[f'dist_h_{span}ema_atr'].shift(1)

        df[f'dist_l_{span}ema'] = (df['l'] - df[f'ema{span}'])
        df[f'dist_l_{span}ema_atr'] = df[f'dist_l_{span}ema'] / df['atr']

    # Rolling windows for highs and lows
    for window in [5, 20, 50, 100, 250]:
        df[f'lowest_low_{window}'] = df['l'].rolling(window=window, min_periods=1).min()
        df[f'highest_high_{window}'] = df['h'].rolling(window=window, min_periods=1).max()
        df[f'highest_high_{window}_1'] = df[f'highest_high_{window}'].shift(1)

    # Distance calculations
    df['h_dist_to_lowest_low_20_atr'] = (df['h'] - df['lowest_low_20']) / df['atr']
    df['h_dist_to_lowest_low_5_atr'] = (df['h'] - df['lowest_low_5']) / df['atr']
    df['h_dist_to_highest_high_20_1_atr'] = (df['h'] - df['highest_high_20_1']) / df['atr']
    df['h_dist_to_lowest_low_20_pct'] = (df['h'] / df['lowest_low_20']) - 1

    # Cumulative dollar volume
    df['dol_v_cum5_1'] = df['dol_v1'] + df['dol_v2'] + df['dol_v3'] + df['dol_v4'] + df['dol_v5']

    # RVOL calculation (missing from original)
    df['avg5_vol'] = df['v'].rolling(window=5).mean()
    df['rvol'] = df['v'] / df['avg5_vol']
    df['rvol1'] = df['rvol'].shift(1)

    return df.fillna(0)

def check_high_lvl_filter_lc(df: pd.DataFrame) -> pd.DataFrame:
    """
    Original LC filtering logic with parabolic scoring system
    """
    if df.empty:
        return df

    # Apply original scoring system
    atr_mult = df.get('high_chg_atr1', 0.0)
    df['score_atr'] = np.select(
        [
            atr_mult >= 3,
            (atr_mult >= 2) & (atr_mult < 3),
            (atr_mult >= 1) & (atr_mult < 2),
            (atr_mult >= 0.5) & (atr_mult < 1),
        ],
        [20, 18, 15, 12],
        default=0
    )

    # EMA Distance score
    ema_dev = np.where(df.get('dist_h_9ema_atr1', np.nan).astype(float) > 0,
                    df['dist_h_9ema_atr1'],
                    df.get('dist_9ema_atr1', 0.0))

    df['score_ema'] = np.select(
        [
            ema_dev >= 4.0,
            (ema_dev >= 3.0) & (ema_dev < 4.0),
            (ema_dev >= 2.0) & (ema_dev < 3.0),
            (ema_dev >= 1.0) & (ema_dev < 2.0),
        ],
        [30, 25, 20, 15],
        default=0
    )

    # Multi-Day Burst score
    has_c2 = 'c2' in df.columns
    has_c3 = 'c3' in df.columns

    up1 = ((df['c1'] > df['c2'])&(df['c1'] > df['o1'])&(df['h1'] > df['h2'])).astype(int) if has_c2 else 0
    up2 = ((df['c2'] > df['c3'])&(df['c2'] > df['o2'])&(df['h2'] > df['h3'])).astype(int) if (has_c2 and has_c3) else 0
    up_streak3 = up1 + up2

    # Range expansion
    rng_today = df.get('range1', 0.0)
    rng_yday  = df.get('range2', 0.0)
    rng_yday_atr = df.get('high_chg_atr2', 0.0)
    range_exp1 = ((rng_today > rng_yday) & (rng_yday_atr>=0.5)).astype(int)
    range_exp_count = range_exp1

    # Gap today
    has_gap = (df.get('gap_atr1', 0.0) >= 0.3).astype(int)

    df['score_burst'] = np.select(
        [
            (up_streak3 >= 2) & (range_exp_count >= 1) & (has_gap == 1),
            (up_streak3 >= 2) & (range_exp_count >= 1),
            (up_streak3 >= 2),
            (up_streak3 == 1) & (range_exp_count >= 1) & (has_gap == 1),
            (up_streak3 == 1),
        ],
        [20, 17.5, 15, 12.5, 10],
        default=10
    )

    # Volume score
    rvol = df.get('rvol1', 0.0)
    if hasattr(rvol, 'astype'):
        rvol = rvol.astype(float)
    else:
        rvol = float(rvol) if pd.notna(rvol) else 0.0

    df['score_vol'] = np.select(
        [
            rvol >= 2,
            (rvol >= 1.5) & (rvol < 2),
            (rvol >= 1) & (rvol < 1.5),
            (rvol >= 0.5) & (rvol < 1),
        ],
        [10, 8, 5, 2],
        default=0
    )

    # Gap score
    gap = df.get('gap_atr1', 0.0)
    df['score_gap'] = np.select(
        [
            gap >= 0.5,
            (gap >= 0.3) & (gap < 0.5),
            (gap >= 0.1) & (gap < 0.3),
        ],
        [15, 10, 5],
        default=0
    )

    # Calculate total score
    df['parabolic_score_raw'] = (
        df['score_atr'] + df['score_ema'] + df['score_burst'] +
        df['score_vol'] + df['score_gap']
    )
    df['parabolic_score'] = df['parabolic_score_raw'].clip(upper=100)

    # Apply LC frontside filters
    df['lc_frontside_d3_extended_1'] = ((df['h'] >= df['h1']) &
                        (df['h1'] >= df['h2']) &

                        (df['l'] >= df['l1']) &
                        (df['l1'] >= df['l2']) &

                        (((df['high_pct_chg1'] >= .3) & (df['high_pct_chg'] >= .3) & (df['c_ua'] >= 5) & (df['c_ua'] < 15) & (df['h_dist_to_lowest_low_20_pct']>=2.5)) |
                        ((df['high_pct_chg1'] >= .2) & (df['high_pct_chg'] >= .2) & (df['c_ua'] >= 15) & (df['c_ua'] < 25) & (df['h_dist_to_lowest_low_20_pct']>=2)) |
                        ((df['high_pct_chg1'] >= .1) & (df['high_pct_chg'] >= .1) & (df['c_ua'] >= 25) & (df['c_ua'] < 50) & (df['h_dist_to_lowest_low_20_pct']>=1.5)) |
                        ((df['high_pct_chg1'] >= .07) & (df['high_pct_chg'] >= .07) & (df['c_ua'] >= 50) & (df['c_ua'] < 90) & (df['h_dist_to_lowest_low_20_pct']>=1)) |
                        ((df['high_pct_chg1'] >= .05) & (df['high_pct_chg'] >= .05) & (df['c_ua'] >= 90) & (df['h_dist_to_lowest_low_20_pct']>=0.75)))  &

                        (df['high_chg_atr1'] >= 0.7) &
                        (df['c1'] >= df['o1']) &
                        (df['dist_h_9ema_atr1'] >= 1.5) &
                        (df['dist_h_20ema_atr1'] >= 2) &

                        (df['high_chg_atr'] >= 1) &
                        (df['c'] >= df['o']) &
                        (df['dist_h_9ema_atr'] >= 1.5) &
                        (df['dist_h_20ema_atr'] >= 2) &
                        (df['v_ua'] >= 10000000) &
                        (df['dol_v'] >= 500000000) &
                        (df['v_ua1'] >= 10000000) &
                        (df['dol_v1'] >= 100000000) &
                        (df['c_ua'] >= 5) &

                        ((df['high_chg_atr'] >= 1) | (df['high_chg_atr1'] >= 1))&

                        (df['h_dist_to_highest_high_20_1_atr']>=2.5)&

                        ((df['h'] >= df['highest_high_20']) &
                        (df['ema9'] >= df['ema20']) &
                        (df['ema20'] >= df['ema50']))

                        ).astype(int)

    df['lc_frontside_d2_extended'] = ((df['h'] >= df['h1']) &
                        (df['l'] >= df['l1']) &

                        (((df['high_pct_chg'] >= .5) & (df['c_ua'] >= 5) & (df['c_ua'] < 15)) |
                        ((df['high_pct_chg'] >= .3) & (df['c_ua'] >= 15) & (df['c_ua'] < 25)) |
                        ((df['high_pct_chg'] >= .2) & (df['c_ua'] >= 25) & (df['c_ua'] < 50)) |
                        ((df['high_pct_chg'] >= .15) & (df['c_ua'] >= 50) & (df['c_ua'] < 90)) |
                        ((df['high_pct_chg'] >= .1) & (df['c_ua'] >= 90)))  &

                        (df['high_chg_atr'] >= 1.5) &
                        (df['c'] >= df['o']) &
                        (df['dist_h_9ema_atr'] >= 2) &
                        (df['dist_h_20ema_atr'] >= 3) &
                        (df['v_ua'] >= 10000000) &
                        (df['dol_v'] >= 500000000) &
                        (df['c_ua'] >= 5) &

                        (df['dist_l_9ema_atr'] >= 1) &

                        (df['h_dist_to_highest_high_20_1_atr']>=1)&

                        (df['dol_v_cum5_1']>=500000000)&

                        ((df['h'] >= df['highest_high_20']) &
                        (df['ema9'] >= df['ema20']) &
                        (df['ema20'] >= df['ema50']))

                        ).astype(int)

    df['lc_frontside_d2_extended_1'] = ((df['h'] >= df['h1']) &
                        (df['l'] >= df['l1']) &

                        (((df['high_pct_chg'] >= 1) & (df['c_ua'] >= 5) & (df['c_ua'] < 15)) |
                        ((df['high_pct_chg'] >= .5) & (df['c_ua'] >= 15) & (df['c_ua'] < 25)) |
                        ((df['high_pct_chg'] >= .3) & (df['c_ua'] >= 25) & (df['c_ua'] < 50)) |
                        ((df['high_pct_chg'] >= .2) & (df['c_ua'] >= 50) & (df['c_ua'] < 90)) |
                        ((df['high_pct_chg'] >= .15) & (df['c_ua'] >= 90)))  &

                        (df['high_chg_atr'] >= 1.5) &
                        (df['c'] >= df['o']) &
                        (df['dist_h_9ema_atr'] >= 2) &
                        (df['dist_h_20ema_atr'] >= 3) &
                        (df['v_ua'] >= 10000000) &
                        (df['dol_v'] >= 500000000) &
                        (df['c_ua'] >= 5) &

                        (df['h_dist_to_highest_high_20_1_atr']>=1)&

                        (df['dol_v_cum5_1']>=500000000)&

                        ((df['h'] >= df['highest_high_20']) &
                        (df['ema9'] >= df['ema20']) &
                        (df['ema20'] >= df['ema50']))

                        ).astype(int)

    # Filter to rows that match any LC criteria
    columns_to_check = ['lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_frontside_d2_extended_1']
    df2 = df[df[columns_to_check].any(axis=1)]

    return df2

def filter_lc_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Final filtering for LC rows"""
    return df[(df['lc_frontside_d3_extended_1'] == 1) |
              (df['lc_frontside_d2_extended'] == 1) |
              (df['lc_frontside_d2_extended_1'] == 1)]

# ───────── Universal Scanner Engine Compatible Function ─────────
def scan_symbol(symbol: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    🎯 STANDARDIZED SCAN_SYMBOL FUNCTION

    Compatible with Universal Scanner Engine
    Maintains original LC D2 sophisticated filtering logic
    """
    try:
        # Fetch data
        df = fetch_daily_data(symbol, start_date, end_date)
        if df.empty:
            return []

        # Add ticker column
        df['ticker'] = symbol

        # Apply original LC processing
        df_processed = adjust_daily(df)
        if df_processed.empty:
            return []

        # Apply LC filtering
        df_lc = check_high_lvl_filter_lc(df_processed)
        if df_lc.empty:
            return []

        df_filtered = filter_lc_rows(df_lc)
        if df_filtered.empty:
            return []

        results = []

        # Convert to standardized format
        for idx, row in df_filtered.iterrows():
            # Determine which LC pattern matched
            pattern_matches = []
            if row.get('lc_frontside_d3_extended_1', 0) == 1:
                pattern_matches.append('lc_frontside_d3_extended_1')
            if row.get('lc_frontside_d2_extended', 0) == 1:
                pattern_matches.append('lc_frontside_d2_extended')
            if row.get('lc_frontside_d2_extended_1', 0) == 1:
                pattern_matches.append('lc_frontside_d2_extended_1')

            # ✅ STANDARDIZED RESULT FORMAT for Universal Scanner Engine
            result = {
                'symbol': symbol,
                'ticker': symbol,
                'date': str(row.get('date', '')),
                'scanner_type': 'lc_d2',

                # Core metrics (standardized field names)
                'gap_percent': round(float(row.get('gap_atr', 0)), 2),
                'volume_ratio': round(float(row.get('dol_v', 0) / max(row.get('dol_v1', 1), 1)), 2),
                'signal_strength': 'Strong' if row.get('parabolic_score', 0) >= 75 else 'Moderate',
                'entry_price': round(float(row.get('c', 0)), 2),
                'target_price': round(float(row.get('c', 0) * 1.10), 2),  # 10% target

                # Original detailed metrics (preserved)
                'parabolic_score': round(float(row.get('parabolic_score', 0)), 2),
                'score_atr': round(float(row.get('score_atr', 0)), 2),
                'score_ema': round(float(row.get('score_ema', 0)), 2),
                'score_burst': round(float(row.get('score_burst', 0)), 2),
                'score_vol': round(float(row.get('score_vol', 0)), 2),
                'score_gap': round(float(row.get('score_gap', 0)), 2),
                'lc_patterns': pattern_matches,
                'high_chg_atr': round(float(row.get('high_chg_atr', 0)), 2),
                'high_chg_atr1': round(float(row.get('high_chg_atr1', 0)), 2),
                'dist_h_9ema_atr': round(float(row.get('dist_h_9ema_atr', 0)), 2),
                'dist_h_20ema_atr': round(float(row.get('dist_h_20ema_atr', 0)), 2),
                'high_pct_chg': round(float(row.get('high_pct_chg', 0)), 4),
                'high_pct_chg1': round(float(row.get('high_pct_chg1', 0)), 4),
                'gap_atr': round(float(row.get('gap_atr', 0)), 2),
                'close_range': round(float(row.get('close_range', 0)), 2),
                'close_range1': round(float(row.get('close_range1', 0)), 2),
                'dollar_volume': int(row.get('dol_v', 0)),
                'dollar_volume_1': int(row.get('dol_v1', 0)),
                'volume_ua': int(row.get('v_ua', 0)),
                'volume_ua1': int(row.get('v_ua1', 0)),
                'price_ua': round(float(row.get('c_ua', 0)), 2),
                'h_dist_to_lowest_low_20_pct': round(float(row.get('h_dist_to_lowest_low_20_pct', 0)), 2),
                'h_dist_to_highest_high_20_1_atr': round(float(row.get('h_dist_to_highest_high_20_1_atr', 0)), 2),
                'ema_alignment': bool((row.get('ema9', 0) >= row.get('ema20', 0)) and
                                    (row.get('ema20', 0) >= row.get('ema50', 0))),
                'new_high': bool(row.get('h', 0) >= row.get('highest_high_20', 0)),
            }

            results.append(result)

        return results

    except Exception as e:
        print(f"Error scanning {symbol}: {str(e)}")
        return []

# ───────── Scanner Configuration ─────────
SCANNER_CONFIG = {
    'name': 'Standardized LC D2 Scanner',
    'description': 'Sophisticated parabolic momentum scanner with LC-style filtering - standardized',
    'timeframe': 'Daily',
    'original_path': '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py',
    'standardized': True,
    'universal_compatible': True,
    'market_wide': True
}

# ───────── Test Entry Point ─────────
if __name__ == "__main__":
    print("🎯 Standardized LC D2 Scanner - Test Mode")
    print(f"Configured to scan {len(SYMBOLS)} symbols")

    # Test with a few symbols
    test_symbols = ['AAPL', 'MSFT', 'GOOGL']
    start_date = "2024-01-01"
    end_date = datetime.date.today().strftime("%Y-%m-%d")

    for symbol in test_symbols:
        results = scan_symbol(symbol, start_date, end_date)
        print(f"\n{symbol}: {len(results)} results found")
        if results:
            print(f"  Latest: {results[-1]}")