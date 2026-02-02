import pandas as pd
import warnings
from pandas.errors import PerformanceWarning
import numpy as np
from datetime import time 
import pandas_market_calendars as mcal
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from concurrent.futures import ThreadPoolExecutor, wait
us_calendar = mcal.get_calendar('NYSE')
# Suppress only PerformanceWarnings
warnings.filterwarnings("ignore", category=PerformanceWarning)

API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

FILENAME = "D:/TRADING/Backtesting/filtered/20_plus/temp/data_2019_current_temp.feather"
df = pd.read_feather(FILENAME)

start_date = pd.to_datetime('2025-09-01')
# start_date = pd.to_datetime('2023-01-01')
end_date = pd.to_datetime('2025-11-15')
df = df[
    (df['date'] >= start_date) & 
    (df['date'] <= end_date)
]


def get_last_bag_day_max_high(group):
    last_valid = group[group['bag_day_valid'] == 1].tail(1)
    return last_valid['bag_day_max_high'].values[0] if not last_valid.empty else None

def get_bag_day(df):
    # ]

    cols_to_check = ['bag_day']

    # Initialize the new column with zeros
    df['bag_day_valid1'] = 0

    # Group by ticker and apply rolling window
    for ticker, group in df.groupby('ticker'):
        # Create a temporary array to store results for this group
        trigger_array = (
            group[cols_to_check]  # Select the relevant columns
            .rolling(window=30, min_periods=1)  # Rolling window of 30 rows
            .max()  # Find max value within the window
            .max(axis=1)  # Check across all columns
        )

        
        # If any column has a 1 in the rolling window, mark the row
        df.loc[group.index, 'bag_day_valid1'] = (trigger_array > 0).astype(int)

    return df



df['prev_high'] = df.groupby('ticker')['high'].shift(1)

df['trig_day'] = ((df['pm_high'] / df['prev_close'] - 1>= .5) & 
                # (df['open'] >= ((df['pm_high'] - df['prev_close']) * 0.5 +  df['prev_close'])) & 
                (df['gap'] >= 0.5) & 
                (df['open'] / df['prev_high'] - 1>= .3) & 
                (df['pm_vol'] >= 5000000) & 
                (df['prev_close'] >= 0.75)).astype(int)

df['prev_close_1'] = df.groupby('ticker')['prev_close'].shift(1)
df['prev_volume'] = df.groupby('ticker')['volume'].shift(1)

df['d2'] = ((df['prev_close'] / df['prev_close_1'] - 1>= .3) & 
                (df['prev_volume'] >= 10000000)).astype(int)

def get_previous_trading_day(current_date, n=7):
    idx = trading_days.get_loc(current_date)
    return trading_days[max(0, idx - n)]


df['date'] = pd.to_datetime(df['date'])
start_date = df['date'].min() - pd.Timedelta(days=500)
end_date = df['date'].max() + pd.Timedelta(days=30)
schedule = us_calendar.schedule(start_date=start_date, end_date=end_date)
trading_days = schedule.index

df['date_minus_30'] = df['date'].apply(lambda x: get_previous_trading_day(x, n=31))
df['date_minus_2'] = df['date'].apply(lambda x: get_previous_trading_day(x, n=2))
df['date_minus_1'] = df['date'].apply(lambda x: get_previous_trading_day(x, n=1))
df['date_minus_100'] = df['date'].apply(lambda x: get_previous_trading_day(x, n=400))


df = df.sort_values(by=['date']).reset_index(drop=True)
start_date = pd.to_datetime('2025-01-01')
end_date = pd.to_datetime('2026-01-01')
df_trig_day = df[
    (df['date'] >= start_date) & 
    (df['date'] <= end_date) &
    (df['trig_day'] == 1)  #&
    # (df['ticker'] == "BETS") 
]




def fetch_daily_data(ticker, start_date, end_date, adjusted):
    # url = f'https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}&sort=asc&limit=5000'
    url = f'https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}?adjusted={adjusted}&sort=asc&limit=5000&apiKey={API_KEY}'
    # params = {
    #     'apiKey': API_KEY,
    #     'adjusted': adjusted
    # }
    # # Send request to Polygon API
    # response = requests.get(url, params=params)
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if 'results' in data:
            return pd.DataFrame(data['results'])
    else:
        print(f"Error fetching data for {ticker}: {response.status_code}")
    return pd.DataFrame()


def adjust_daily(df):
    df['date'] = pd.to_datetime(df['t'], unit='ms')
    df['date'] = df['date'].dt.date          
    df['pdc'] = df['c'].shift(1)
    # df['ema50'] = df['c'].ewm(span=50, adjust=False).mean().fillna(0)
    # df['ema100'] = df['c'].ewm(span=100, adjust=False).mean().fillna(0)
    df['ema200'] = df['c'].ewm(span=200, adjust=False).mean().fillna(0)
    return df

def fetch_and_process_data(ticker, start_date, end_date, adjusted):
    data = fetch_daily_data(ticker, start_date, end_date, adjusted)
    # print(ticker, start_date, end_date, adjusted)
    # print(data)
    adjusted_data = adjust_daily(data)
    if adjusted == "false":
        adjusted_data.rename(columns={col: col + '_ua' if col not in ['date'] else col for col in adjusted_data.columns}, inplace=True)
    return adjusted_data

df_trig_day['ema_valid'] = 0

for i, row in df_trig_day.iterrows():

    try:
        #'''
        date = str(row['date'])[:10]
        date_minus_100 = str(row['date_minus_100'])[:10]
        date_minus_100 = "2018-01-01"
        date_minus_1 = str(row['date_minus_1'])[:10]
        ticker = row['ticker']
        print(date, ticker)

        adjusted = "true"
        daily_data = fetch_daily_data(ticker, date_minus_100, date_minus_1, adjusted)
        daily_data_a = adjust_daily(daily_data)

        #'''

        '''
        date = str(row['date'])[:10]
        date_minus_30 = str(row['date_minus_100'])[:10]
        date_minus_1 = str(row['date_minus_1'])[:10]
        date_minus_2 = str(row['date_minus_2'])[:10]
        ticker = row['ticker']
        print(date, ticker)
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(fetch_and_process_data, ticker, date_minus_30, date_minus_2, "true"),
                executor.submit(fetch_and_process_data, ticker, date_minus_30, date_minus_2, "false"),
                executor.submit(fetch_and_process_data, ticker, date, date, "true"),
                executor.submit(fetch_and_process_data, ticker, date, date, "false")
            ]

            # Wait for all futures to complete
            wait(futures)

        # Extract results knowing the order
        daily_data_a = futures[0].result()
        daily_data_ua = futures[1].result()
        df_daily_trig_a = futures[2].result()
        df_daily_trig_ua = futures[3].result()


        # print(daily_data_a)
        # print(daily_data_ua)
        #'''

        c = daily_data_a['c'].iloc[-1]
        # ema50 = daily_data_a['ema50'].iloc[-1]
        # ema100 = daily_data_a['ema100'].iloc[-1]
        ema200 = daily_data_a['ema200'].iloc[-1]


        if c<=ema200*0.8 and len(daily_data_a)>=200:

            mc_url = f'https://api.polygon.io/v3/reference/tickers/{ticker}?date={date_minus_1}&apiKey=690tDzu9ibAcZZmQyqXSJNDImi_AtMp1'
            response = requests.get(mc_url)
            data = response.json()
            try:
                market_cap = data['results']['market_cap']
                market_cap = market_cap/1000000
                try:
                    os = data['results']['weighted_shares_outstanding']
                    url_c = f'https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{date_minus_1}/{date_minus_1}?adjusted=false&sort=asc&limit=50&apiKey={API_KEY}'
                    response = requests.get(url_c)
                    data = response.json()
                    close_ua = data['results']['c']
                    market_cap = os * c
                    market_cap = market_cap/1000000

                except:
                    market_cap = "error"
            except:
                market_cap = "error"
            

            # print(date, ticker, ema50, c)
                                
            df_trig_day.loc[i, 'ema_valid'] = 1
            df_trig_day.loc[i, 'market_cap'] = market_cap

        else:
            df_trig_day.loc[i, 'ema_valid'] = 0

    except:
        print(date, ticker, "failed")
        df_trig_day.loc[i, 'ema_valid'] = 0




df_trig_day = df_trig_day[
    # (df_trig_day['ema_valid'] == 1) &
    (df_trig_day['d2'] == 0) 
]


print(df_trig_day)

df_trig_day.to_csv("D1 Gap.csv")