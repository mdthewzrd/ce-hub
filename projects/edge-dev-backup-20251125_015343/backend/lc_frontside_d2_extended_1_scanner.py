import pandas as pd
import requests
import time
import numpy as np
import pandas_market_calendars as mcal
import aiohttp
import asyncio
import pandas as pd
from multiprocessing import Pool, cpu_count
from concurrent.futures import ProcessPoolExecutor
from tabulate import tabulate
import webbrowser
import plotly.graph_objects as go
import sys
from concurrent.futures import ThreadPoolExecutor
import dask
from dask.distributed import Client, as_completed
import dask.dataframe as dd
import datetime
import logging
import backoff

nyse = mcal.get_calendar('NYSE')
executor = ThreadPoolExecutor()

import warnings
warnings.filterwarnings("ignore")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

DATE = "2025-01-17"

# Replace with your Polygon API Key
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"

async def process_date(date, session):
    try:
        url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted=true&apiKey={API_KEY}"
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    return df
                else:
                    print(f"No results for {date}")
                    return pd.DataFrame()
            else:
                print(f"Failed to fetch data for {date}: {response.status}")
                return pd.DataFrame()
    except Exception as e:
        print(f"Error processing {date}: {e}")
        return pd.DataFrame()

def add_LC_patterns_lc_frontside_d2_extended_1(df):
    # Only add the lc_frontside_d2_extended_1 pattern
    df['lc_frontside_d2_extended_1'] = ((df['h'] >= df['h1']) &

                        (df['l'] >= df['l1']) &


                        (((df['high_pct_chg'] >= 1) & (df['c_ua'] >= 5) & (df['c_ua'] < 15) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=2.5)) |# & (df['gap_pct'] >=  .15)) |
                        ((df['high_pct_chg'] >= .5) & (df['c_ua'] >= 15) & (df['c_ua'] < 25) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=2)) |# & (df['gap_pct'] >=  .1)) |
                        ((df['high_pct_chg'] >= .3) & (df['c_ua'] >= 25) & (df['c_ua'] < 50) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=1.5)) |# & (df['gap_pct'] >=  .05)) |
                        ((df['high_pct_chg'] >= .2) & (df['c_ua'] >= 50) & (df['c_ua'] < 90) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=1)) |# & (df['gap_pct'] >=  .05)) |
                        ((df['high_pct_chg'] >= .15) & (df['c_ua'] >= 90) & (df['highest_high_5_dist_to_lowest_low_20_pct_1']>=0.75)))  & # & (df['gap_pct'] >=  .03))) &




                        (df['high_chg_atr'] >= 1.5) &
                        (df['c'] >= df['o']) &
                        (df['dist_h_9ema_atr'] >= 2) &
                        (df['dist_h_20ema_atr'] >= 3) &
                        (df['v_ua'] >= 10000000) &
                        (df['dol_v'] >= 500000000) &
                        (df['c_ua'] >= 5) &

                        # (df['dist_l_9ema_atr'] >= 1) &

                        (df['h_dist_to_highest_high_20_1_atr']>=1)&

                        (df['dol_v_cum5_1']>=500000000)&


                        ((df['h'] >= df['highest_high_20']) &
                        (df['ema9'] >= df['ema20']) &
                        (df['ema20'] >= df['ema50']))

                        ).astype(int)

    # Filter for only this pattern
    columns_to_check = ['lc_frontside_d2_extended_1']
    df2 = df[df[columns_to_check].any(axis=1)]
    return df2

def filter_lc_rows(df):
    return df[(df['lc_frontside_d2_extended_1'] == 1)]

async def fetch_intraday_data(session, ticker, start_date, end_date):
    url = f'https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/minute/{start_date}/{end_date}'
    params = {'apiKey': API_KEY}
    async with session.get(url, params=params) as response:
        if response.status == 200:
            data = await response.json()
            return pd.DataFrame(data['results'])
        else:
            print(f"Failed to fetch data for {ticker}: {response.status}")
            return pd.DataFrame()

def get_min_price_lc(df):
    ### LC Min Price
    df['lc_frontside_d2_extended_1_min_price'] = round((df['c'] + df['d1_range']*.5), 2)

    columns_to_check = ['lc_frontside_d2_extended_1']
    df['lowest_min_price'] = df.apply(lambda row: min([row[col + '_min_price'] for col in columns_to_check if row[col] == 1]), axis=1)

    for col in columns_to_check:
        min_price_col = f"{col}_min_price"
        min_pct_col = f"{col}_min_pct"
        df[min_pct_col] = round((df[min_price_col] / df['c'] - 1) * 100, 2)

    return df

async def fetch_intial_stock_list(session, date, adj):
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"
    async with session.get(url) as response:
        if response.status == 200:
            data = await response.json()
            if 'results' in data:
                df = pd.DataFrame(data['results'])
                df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                df.rename(columns={'T': 'ticker'}, inplace=True)
                return df

def compute_indicators1(df):
    # Sorting by 'ticker' and 'date' to respect chronological order for each ticker
    df = df.sort_values(by=['ticker', 'date'])

    # Calculating previous day's close
    df['pdc'] = df.groupby('ticker')['c'].shift(1)

    # Calculating ranges and true range
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = (df['h'] - df['pdc']).abs()
    df['low_pdc'] = (df['l'] - df['pdc']).abs()
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(window=14).mean())

    df['atr'] = df['atr'].shift(1)
    df['d1_range'] = abs(df['h'] - df['l'])

    # Shifting values for high, close, open, low, volume
    for i in range(1, 4):
        df[f'h{i}'] = df.groupby('ticker')['h'].shift(i).fillna(0)
        df[f'c{i}'] = df.groupby('ticker')['c'].shift(i).fillna(0)
        df[f'o{i}'] = df.groupby('ticker')['o'].shift(i).fillna(0)
        df[f'l{i}'] = df.groupby('ticker')['l'].shift(i).fillna(0)
        df[f'v{i}'] = df.groupby('ticker')['v'].shift(i).fillna(0)

    # Computing EMAs for different windows
    for window in [9, 20, 50, 200]:
        df[f'ema{window}'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=window).mean())

    # Calculating various percentage changes and distances
    df['high_chg'] = df['h'] - df['h1']
    df['high_chg_atr'] = df['high_chg'] / df['atr']

    df['dist_h_9ema'] = df['h'] - df['ema9']
    df['dist_h_9ema_atr'] = df['dist_h_9ema'] / df['atr']

    df['dist_h_20ema'] = df['h'] - df['ema20']
    df['dist_h_20ema_atr'] = df['dist_h_20ema'] / df['atr']

    df['close_range'] = (df['c'] - df['l']) / (df['h'] - df['l'])

    df['v_ua'] = df['v']
    df['dol_v'] = df['c'] * df['v']
    df['c_ua'] = df['c']

    # Calculate high percentage change
    df['high_pct_chg'] = ((df['h'] - df['h1']) / df['h1']) * 100
    df['high_pct_chg'] = df['high_pct_chg'].fillna(0)

    # Calculate highest highs over various periods
    for period in [5, 20]:
        df[f'highest_high_{period}'] = df.groupby('ticker')['h'].transform(lambda x: x.rolling(window=period).max().shift(1))

    # Calculate distance metrics
    df['highest_high_5_dist_to_lowest_low_20_pct_1'] = ((df['highest_high_5'] - df.groupby('ticker')['l'].transform(lambda x: x.rolling(window=20).min().shift(1))) / df.groupby('ticker')['l'].transform(lambda x: x.rolling(window=20).min().shift(1))) * 100
    df['highest_high_5_dist_to_lowest_low_20_pct_1'] = df['highest_high_5_dist_to_lowest_low_20_pct_1'].fillna(0)

    # Calculate distance to highest high 20 in ATR terms
    df['h_dist_to_highest_high_20_1_atr'] = (df['h'] - df['highest_high_20']) / df['atr']
    df['h_dist_to_highest_high_20_1_atr'] = df['h_dist_to_highest_high_20_1_atr'].fillna(0)

    # Calculate 5-day cumulative dollar volume
    df['dol_v_cum5_1'] = df.groupby('ticker')['dol_v'].transform(lambda x: x.rolling(window=5).sum().shift(1))
    df['dol_v_cum5_1'] = df['dol_v_cum5_1'].fillna(0)

    return df

def compute_indicators2(df):
    return df

async def main(start_date: str, end_date: str):
    """
    LC Frontside D2 Extended 1 Scanner

    Scans for stocks matching the lc_frontside_d2_extended_1 pattern with specific criteria:
    - High >= H1 and Low >= L1 (continuation pattern)
    - Complex market cap and volume-based criteria
    - ATR-based distance requirements from EMAs
    - Uptrend confirmation (EMA9 >= EMA20 >= EMA50)

    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format

    Returns:
        DataFrame with stocks matching the lc_frontside_d2_extended_1 pattern
    """

    # Generate date range for scanning
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)

    # Get trading days using NYSE calendar
    nyse_cal = mcal.get_calendar('NYSE')
    trading_days = nyse_cal.valid_days(start_date=start, end_date=end)
    date_strings = [day.strftime('%Y-%m-%d') for day in trading_days]

    async with aiohttp.ClientSession() as session:
        print(f"📊 Processing {len(date_strings)} trading days from {start_date} to {end_date}")

        # Fetch data for all dates
        tasks = [process_date(date, session) for date in date_strings]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Combine all daily data
        valid_results = [df for df in results if isinstance(df, pd.DataFrame) and not df.empty]

        if not valid_results:
            print("❌ No data retrieved for any dates")
            return pd.DataFrame()

        combined_df = pd.concat(valid_results, ignore_index=True)
        print(f"📈 Combined {len(combined_df)} total stock records")

        # Apply technical indicators
        print("🔍 Computing technical indicators...")
        df_with_indicators = compute_indicators1(combined_df)
        df_final = compute_indicators2(df_with_indicators)

        # Apply LC Frontside D2 Extended 1 pattern
        print("🎯 Applying LC Frontside D2 Extended 1 pattern...")
        df_lc = add_LC_patterns_lc_frontside_d2_extended_1(df_final)

        if df_lc.empty:
            print("❌ No stocks matched the LC Frontside D2 Extended 1 pattern")
            return df_lc

        # Filter for pattern matches
        df_filtered = filter_lc_rows(df_lc)

        # Add pricing information
        df_with_pricing = get_min_price_lc(df_filtered)

        print(f"✅ Found {len(df_with_pricing)} stocks matching LC Frontside D2 Extended 1 pattern")

        # Display summary
        if not df_with_pricing.empty:
            pattern_cols = [col for col in df_with_pricing.columns if col.startswith('lc_frontside_d2_extended_1') and col.endswith('_min_price')]
            summary_cols = ['ticker', 'date', 'c', 'v_ua', 'dol_v', 'lc_frontside_d2_extended_1'] + pattern_cols
            display_cols = [col for col in summary_cols if col in df_with_pricing.columns]

            print("\n📋 LC Frontside D2 Extended 1 Results:")
            print(df_with_pricing[display_cols].to_string(index=False))

        return df_with_pricing