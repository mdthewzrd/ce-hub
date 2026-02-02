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

# Replace with your Polygon API Key
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"

def adjust_daily(df):
    # df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['t'], unit='ms')
    df['date'] = df['date'].dt.date
    df['pdc'] = df['c'].shift(1)
    df['high_low'] = df['h'] - df['l']  # High - Low
    df['high_pdc'] = abs(df['h'] - df['pdc'])  # High - Previous Day Close
    df['low_pdc'] = abs(df['l'] - df['pdc'])  # Low - Previous Day Close
    # True Range (TR) is the max of high-low, high-pdc, low-pdc
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    # Calculate the ATR (using a 14-day rolling window)
    df['atr'] = df['true_range'].rolling(window=14).mean()
    # Drop intermediate columns for clean output
    df.drop(['high_low', 'high_pdc', 'low_pdc'], axis=1, inplace=True)

    df['h1'] = df['h'].shift(1)
    df['h2'] = df['h'].shift(2)
    df['h3'] = df['h'].shift(3)

    df['c1'] = df['c'].shift(1)
    df['c2'] = df['c'].shift(2)
    df['c3'] = df['c'].shift(3)

    df['o1'] = df['o'].shift(1)
    df['o2'] = df['o'].shift(2)

    df['l1'] = df['l'].shift(1)
    df['l2'] = df['l'].shift(2)

    df['v_ua1'] = df['v_ua'].shift(1)
    df['v1'] = df['v'].shift(1)
    df['v2'] = df['v'].shift(2)

    df['dol_v'] = (df['c'] * df['v'])
    df['dol_v1'] = df['dol_v'].shift(1)
    df['dol_v2'] = df['dol_v'].shift(2)

    df['close_range'] = (df['c'] - df['l'])/(df['h'] - df['l'])
    df['close_range1'] = df['close_range'].shift(1)
    df['close_range2'] = df['close_range'].shift(2)

    df['gap_atr'] = ((df['o'] - df['pdc'])/df['atr'])
    df['gap_atr1'] = ((df['o1'] - df['c2'])/df['atr'])

    df['gap_pdh_atr'] = ((df['o'] - df['h1'])/df['atr'])

    df['high_chg'] = (df['h'] - df['o'])
    df['high_chg_atr'] = ((df['h'] - df['o'])/df['atr'])
    df['high_chg_atr1'] = ((df['h1'] - df['o1'])/df['atr'])
    df['high_chg_atr2'] = ((df['h2'] - df['o2'])/df['atr'])

    df['high_chg_from_pdc_atr'] = ((df['h'] - df['c1'])/df['atr'])
    df['high_chg_from_pdc_atr1'] = ((df['h1'] - df['c2'])/df['atr'])

    df['pct_change'] = round(((df['c'] / df['c1']) - 1)*100, 2)

    df['ema9'] = df['c'].ewm(span=9, adjust=False).mean().fillna(0)
    df['ema20'] = df['c'].ewm(span=20, adjust=False).mean().fillna(0)
    df['ema50'] = df['c'].ewm(span=50, adjust=False).mean().fillna(0)
    df['ema200'] = df['c'].ewm(span=200, adjust=False).mean().fillna(0)

    df['ema20_2'] = df['ema20'].shift(2)

    df['ema9_1'] = df['ema9'].shift(1)
    df['ema20_1'] = df['ema20'].shift(1)
    df['ema50_1'] = df['ema50'].shift(1)

    df['dist_h_9ema'] = (df['h'] - df['ema9'])
    df['dist_h_20ema'] = (df['h'] - df['ema20'])
    df['dist_h_50ema'] = (df['h'] - df['ema50'])
    df['dist_h_200ema'] = (df['h'] - df['ema200'])

    df['dist_h_9ema1'] = df['dist_h_9ema'].shift(1)
    df['dist_h_20ema1'] = df['dist_h_20ema'].shift(1)
    df['dist_h_50ema1'] = df['dist_h_50ema'].shift(1)
    df['dist_h_200ema1'] = df['dist_h_200ema'].shift(1)

    df['dist_h_9ema_atr'] = df['dist_h_9ema'] /df['atr']
    df['dist_h_20ema_atr'] = df['dist_h_20ema'] /df['atr']
    df['dist_h_50ema_atr'] = df['dist_h_50ema'] /df['atr']
    df['dist_h_200ema_atr'] = df['dist_h_200ema'] /df['atr']

    df['dist_h_9ema_atr1'] = df['dist_h_9ema1'] /df['atr']
    df['dist_h_20ema_atr1'] = df['dist_h_20ema1'] /df['atr']
    df['dist_h_50ema_atr1'] = df['dist_h_50ema1'] /df['atr']
    df['dist_h_200ema_atr1'] = df['dist_h_200ema1'] /df['atr']

    df['dist_h_9ema2'] = df['dist_h_9ema'].shift(2)
    df['dist_h_9ema3'] = df['dist_h_9ema'].shift(3)
    df['dist_h_9ema4'] = df['dist_h_9ema'].shift(4)

    df['dist_h_20ema2'] = df['dist_h_20ema'].shift(2)
    df['dist_h_20ema3'] = df['dist_h_20ema'].shift(3)
    df['dist_h_20ema4'] = df['dist_h_20ema'].shift(4)
    df['dist_h_20ema5'] = df['dist_h_20ema'].shift(5)

    df['dist_h_9ema_atr2'] = df['dist_h_9ema2'] /df['atr']
    df['dist_h_9ema_atr3'] = df['dist_h_9ema3'] /df['atr']
    df['dist_h_9ema_atr4'] = df['dist_h_9ema4'] /df['atr']

    df['dist_h_20ema_atr2'] = df['dist_h_20ema2'] /df['atr']
    df['dist_h_20ema_atr3'] = df['dist_h_20ema3'] /df['atr']
    df['dist_h_20ema_atr4'] = df['dist_h_20ema4'] /df['atr']

    df['lowest_low_20'] = df['l'].rolling(window=20, min_periods=1).min()
    df['lowest_low_20_2'] = df['lowest_low_20'].shift(2)
    df['h_dist_to_lowest_low_20_atr'] = ((df['h'] - df['lowest_low_20'])/df['atr'])

    df['lowest_low_30'] = df['l'].rolling(window=30, min_periods=1).min()
    df['lowest_low_30_1'] = df['lowest_low_30'].shift(1)

    df['h_dist_to_lowest_low_30'] = (df['h'] - df['lowest_low_30'])

    df['lowest_low_5'] = df['l'].rolling(window=5, min_periods=1).min()
    df['h_dist_to_lowest_low_5_atr'] = ((df['h'] - df['lowest_low_5'])/df['atr'])

    df['highest_high_100'] = df['h'].rolling(window=100).max()
    df['highest_high_100_1'] = df['highest_high_100'].shift(1)

    df['highest_high_250'] = df['h'].rolling(window=250, min_periods=1).max()
    df['highest_high_250_1'] = df['highest_high_250'].shift(1)

    df['highest_high_5'] = df['h'].rolling(window=5, min_periods=1).max()

    df['highest_high_50'] = df['h'].rolling(window=50, min_periods=1).max()
    df['highest_high_50_1'] = df['highest_high_50'].shift(1)
    df['highest_high_50_4'] = df['highest_high_50'].shift(4)

    df['highest_high_20'] = df['h'].rolling(window=20, min_periods=1).max()
    df['highest_high_20_2'] = df['highest_high_20'].shift(2)

    df['highest_high_100'] = df['h'].rolling(window=100, min_periods=1).max()
    df['highest_high_100_4'] = df['highest_high_100'].shift(4)

    return df

def adjust_intraday(df):
    df['date_time']=pd.to_datetime(df['t']*1000000).dt.tz_localize('UTC')
    df['date_time']=df['date_time'].dt.tz_convert('US/Eastern')

    df['date_time'] = df['date_time'].dt.strftime('%Y-%m-%d %H:%M:%S')
    df['date_time'] = pd.to_datetime(df['date_time'])

    df['time'] = pd.to_datetime(df['date_time']).dt.time
    df['date'] = pd.to_datetime(df['date_time']).dt.date

    df['time_int'] = df['date_time'].dt.hour * 100 + df['date_time'].dt.minute
    df['date_int'] = df['date_time'].dt.strftime('%Y%m%d').astype(int)

    df['date_time_int'] = df['date_int'].astype(str) + '.' + df['time_int'].astype(str)
    df['date_time_int'] = df['date_time_int'].astype(float)

    df['v_sum'] = df.groupby('date')['v'].cumsum()

    df['hod_all'] = df.groupby(df['date'])['h'].cummax().fillna(0)

    return df

def check_high_lvl_filter_lc(df):
    """
    🔧 SINGLE SCANNER: LC Frontside D3 Extended 1 Only
    """
    # Only calculate the lc_frontside_d3_extended_1 pattern
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

                        (df['h_dist_to_highest_high_20_2_atr']>=2.5)&

                        ((df['h'] >= df['highest_high_20']) &
                        (df['ema9'] >= df['ema20']) &
                        (df['ema20'] >= df['ema50']))

                        ).astype(int)

    # Filter to only rows that match this pattern
    columns_to_check = ['lc_frontside_d3_extended_1']
    df2 = df[df[columns_to_check].any(axis=1)]
    return df2

def filter_lc_rows(df):
    # Only filter for the lc_frontside_d3_extended_1 pattern
    return df[df['lc_frontside_d3_extended_1'] == 1]

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

    # Dollar volume calculations and shifts
    df['dol_v'] = df['c'] * df['v']
    df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)
    df['dol_v2'] = df.groupby('ticker')['dol_v'].shift(2)
    df['dol_v3'] = df.groupby('ticker')['dol_v'].shift(3)
    df['dol_v4'] = df.groupby('ticker')['dol_v'].shift(4)
    df['dol_v5'] = df.groupby('ticker')['dol_v'].shift(5)

    df['dol_v_cum5_1'] = df['dol_v1'] + df['dol_v2'] + df['dol_v3'] + df['dol_v3'] + df['dol_v5']

    # Close range calculations and shifts
    df['close_range'] = (df['c'] - df['l']) / (df['h'] - df['o'])
    df['close_range1'] = df.groupby('ticker')['close_range'].shift(1)
    df['close_range2'] = df.groupby('ticker')['close_range'].shift(2)

    # Days Range
    df['range'] = (df['h'] - df['l'])
    df['range1'] = df.groupby('ticker')['range'].shift(1)
    df['range2'] = df.groupby('ticker')['range'].shift(2)

    # Gap metrics related to ATR
    df['gap_pct'] = (df['o'] / df['pdc']) - 1
    df['gap_pct1'] = df.groupby('ticker')['gap_pct'].shift(1)
    df['gap_pct2'] = df.groupby('ticker')['gap_pct'].shift(2)
    df['gap_atr'] = ((df['o'] - df['pdc']) / df['atr'])
    df['gap_atr1'] = ((df['o1'] - df['c2']) / df['atr'])
    df['gap_atr2'] = ((df['o2'] - df['c3']) / df['atr'])
    df['gap_pdh_atr'] = ((df['o'] - df['h1']) / df['atr'])

    # High change metrics normalized by ATR
    df['pct_chg'] = (df['c'] / df['c1']) - 1
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1
    df['pct_chg1'] = df.groupby('ticker')['pct_chg'].shift(1)
    df['high_pct_chg1'] = df.groupby('ticker')['high_pct_chg'].shift(1)
    df['high_pct_chg2'] = df.groupby('ticker')['high_pct_chg'].shift(2)

    df['high_chg'] = df['h'] - df['o']
    df['high_chg1'] = df['h1'] - df['o1']
    df['high_chg_atr'] = df['high_chg'] / df['atr']
    df['high_chg_atr1'] = ((df['h1'] - df['o1']) / df['atr'])
    df['high_chg_atr2'] = ((df['h2'] - df['o2']) / df['atr'])

    # High change from previous day close normalized by ATR
    df['high_chg_from_pdc_atr'] = ((df['h'] - df['c1']) / df['atr'])
    df['high_chg_from_pdc_atr1'] = ((df['h1'] - df['c2']) / df['atr'])

    # Percentage change in close price from the previous day
    df['pct_change'] = ((df['c'] / df['c1'] - 1) * 100).round(2)

    df['avg5_vol'] = df['v'].rolling(window=5).mean()
    df['rvol'] = df['v'] / df['avg5_vol']
    df['rvol1'] = df.groupby('ticker')['rvol'].shift(1)

    # Calculating EMAs
    for period in [9, 20, 50, 200]:
        df[f'ema{period}'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=period, adjust=False).mean().fillna(0))
        df[f'dist_h_{period}ema'] = df['h'] - df[f'ema{period}']
        df[f'dist_h_{period}ema_atr'] = df[f'dist_h_{period}ema'] / df['atr']

        df[f'dist_l_{period}ema'] = df['l'] - df[f'ema{period}']
        df[f'dist_l_{period}ema_atr'] = df[f'dist_l_{period}ema'] / df['atr']

        # Apply shifts to the calculated distances and normalize again by ATR
        for dist in range(1, 5):
            df[f'dist_h_{period}ema{dist}'] = df.groupby('ticker')[f'dist_h_{period}ema'].shift(dist)
            df[f'dist_h_{period}ema_atr{dist}'] = df[f'dist_h_{period}ema{dist}'] / df['atr']

            df[f'dist_l_{period}ema{dist}'] = df.groupby('ticker')[f'dist_l_{period}ema'].shift(dist)
            df[f'dist_l_{period}ema_atr{dist}'] = df[f'dist_l_{period}ema{dist}'] / df['atr']

    # Calculate rolling maximums and minimums
    for window in [5, 20, 50, 100, 250]:
        df[f'lowest_low_{window}'] = df.groupby('ticker')['l'].transform(lambda x: x.rolling(window=window, min_periods=1).min())
        df[f'highest_high_{window}'] = df.groupby('ticker')['h'].transform(lambda x: x.rolling(window=window, min_periods=1).max())

        # Shifting previous highs for selected windows
        for dist in range(1, 5):
            df[f'highest_high_{window}_{dist}'] = df.groupby('ticker')[f'highest_high_{window}'].shift(dist)

    # Calculate rolling minimums for the low prices with shifts
    df['lowest_low_30'] = df.groupby('ticker')['l'].transform(lambda x: x.rolling(window=30, min_periods=1).min())
    df['lowest_low_30_1'] = df.groupby('ticker')['lowest_low_30'].shift(1)

    # Calculate rolling maximums for high prices with multiple shifts
    df['highest_high_100_1'] = df.groupby('ticker')['highest_high_100'].shift(1)
    df['highest_high_100_4'] = df.groupby('ticker')['highest_high_100'].shift(4)
    df['highest_high_250_1'] = df.groupby('ticker')['highest_high_250'].shift(1)
    df['lowest_low_20_1'] = df.groupby('ticker')['lowest_low_20'].shift(1)
    df['lowest_low_20_2'] = df.groupby('ticker')['lowest_low_20'].shift(2)
    df['highest_high_20_1'] = df.groupby('ticker')['highest_high_20'].shift(1)
    df['highest_high_20_2'] = df.groupby('ticker')['highest_high_20'].shift(2)
    df['highest_high_5_1'] = df.groupby('ticker')['highest_high_5'].shift(1)

    # Assuming l_ua is a predefined column in your DataFrame
    df['lowest_low_20_ua'] = df.groupby('ticker')['l_ua'].transform(lambda x: x.rolling(window=20, min_periods=1).min())

    # Calculate distances from the lowest lows normalized by ATR
    df['h_dist_to_lowest_low_30'] = (df['h'] - df['lowest_low_30'])
    df['h_dist_to_lowest_low_30_atr'] = (df['h'] - df['lowest_low_30']) / df['atr']
    df['h_dist_to_lowest_low_20_atr'] = (df['h'] - df['lowest_low_20']) / df['atr']
    df['h_dist_to_lowest_low_5_atr'] = (df['h'] - df['lowest_low_5']) / df['atr']
    df['h_dist_to_highest_high_20_1_atr'] = (df['h'] - df['highest_high_20_1']) / df['atr']
    df['h_dist_to_highest_high_20_2_atr'] = (df['h'] - df['highest_high_20_2']) / df['atr']
    df['highest_high_5_dist_to_lowest_low_20_pct_1'] = (df['highest_high_5_1'] / df['lowest_low_20_1']) - 1
    df['h_dist_to_lowest_low_20_pct'] = (df['h'] / df['lowest_low_20']) - 1

    # Shifting EMAs
    df['ema20_2'] = df.groupby('ticker')['ema20'].shift(2)

    df['ema9_1'] = df['ema9'].shift(1)
    df['ema20_1'] = df['ema20'].shift(1)
    df['ema50_1'] = df['ema50'].shift(1)

    df['v_ua1'] = df.groupby('ticker')['v_ua'].shift(1)
    df['v_ua2'] = df.groupby('ticker')['v_ua'].shift(2)

    df['c_ua1'] = df['c_ua'].shift(1)

    # Drop intermediate columns
    columns_to_drop = ['high_low', 'high_pdc', 'low_pdc']
    df.drop(columns=columns_to_drop, inplace=True, errors='ignore')

    return df

async def main(start_date: str, end_date: str):
    """
    🔧 LC FRONTSIDE D3 EXTENDED 1 SCANNER
    Single pattern scanner focused only on lc_frontside_d3_extended_1
    """
    print(f"🎯 LC Frontside D3 Extended 1 Scanner executing with date range: {start_date} to {end_date}")

    # Convert dates from the parameters
    START_DATE_DT = pd.to_datetime(start_date)
    END_DATE_DT = pd.to_datetime(end_date)

    start_date_70_days_before = pd.Timestamp(start_date) - pd.DateOffset(days=70)
    start_date_70_days_before = pd.to_datetime(start_date_70_days_before)

    start_date_300_days_before = pd.Timestamp(start_date) - pd.DateOffset(days=400)
    start_date_300_days_before = str(start_date_300_days_before)[:10]

    schedule = nyse.schedule(start_date=start_date_300_days_before, end_date=end_date)
    DATES = nyse.valid_days(start_date=start_date_300_days_before, end_date=end_date)
    DATES = [date.strftime('%Y-%m-%d') for date in nyse.valid_days(start_date=start_date_300_days_before, end_date=end_date)]

    # Get Main List (Adjusted data)
    all_results = []
    adj = "true"
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_intial_stock_list(session, date, adj) for date in DATES]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_results = []
        retry_tasks = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                retry_tasks.append(fetch_intial_stock_list(session, DATES[i], adj))
            else:
                all_results.append(result)

        if retry_tasks:
            retry_results = await asyncio.gather(*retry_tasks, return_exceptions=True)
            for retry_result in retry_results:
                if not isinstance(retry_result, Exception):
                    all_results.append(retry_result)
                else:
                    print(f"Failed after retry: {retry_result}")

    df_a = pd.concat(all_results, ignore_index=True)
    all_results = []

    # Get Main List (Unadjusted data)
    adj = "false"
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_intial_stock_list(session, date, adj) for date in DATES]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_results = []
        retry_tasks = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                retry_tasks.append(fetch_intial_stock_list(session, DATES[i], adj))
            else:
                all_results.append(result)

        if retry_tasks:
            retry_results = await asyncio.gather(*retry_tasks, return_exceptions=True)
            for retry_result in retry_results:
                if not isinstance(retry_result, Exception):
                    all_results.append(retry_result)
                else:
                    print(f"Failed after retry: {retry_result}")

    df_ua = pd.concat(all_results, ignore_index=True)
    df_ua.rename(columns={col: col + '_ua' if col not in ['date', 'ticker'] else col for col in df_ua.columns}, inplace=True)

    print("done 1")

    # Merge adjusted and unadjusted data
    df = pd.merge(df_a, df_ua, on=['date', 'ticker'], how='inner')
    df = df.drop(columns=['vw', 't', 'n', 'vw_ua', 't_ua', 'n_ua'])
    df = df.sort_values(by='date')
    df['date'] = pd.to_datetime(df['date'])

    print("done 2")

    df = df.select_dtypes(include=['floating']).round(2).join(df.select_dtypes(exclude=['floating']))
    df = compute_indicators1(df)
    df = df.sort_values(by='date')
    df = df.select_dtypes(include=['floating']).round(2).join(df.select_dtypes(exclude=['floating']))

    print("done 3")

    # Apply the LC Frontside D3 Extended 1 filter
    df_lc = check_high_lvl_filter_lc(df)
    df_lc = filter_lc_rows(df_lc)

    print("done 4")

    # Filter by the provided date range
    df_lc = df_lc[(df_lc['date'] >= START_DATE_DT) & (df_lc['date'] <= END_DATE_DT)]
    df_lc = df_lc.reset_index(drop=True)

    # Output the final results
    print(f"🎯 LC Frontside D3 Extended 1 Scanner Results:")
    print(df_lc[['date', 'ticker']])

    # Return results as list of dictionaries for the API
    return df_lc[['date', 'ticker', 'lc_frontside_d3_extended_1']].to_dict('records')