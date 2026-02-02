import pandas as pd
import warnings
from pandas.errors import PerformanceWarning
import numpy as np
from datetime import time, datetime, timedelta
import pandas_market_calendars as mcal
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import time as time_module
us_calendar = mcal.get_calendar('NYSE')
# Suppress only PerformanceWarnings
warnings.filterwarnings("ignore", category=PerformanceWarning)

# ─────────────────── Configuration ─────────────────── #
session = requests.Session()  # Reuse connections for better performance
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = 'https://api.polygon.io'

# Date range for fetching data - 1/1/24 to 10/24/25
start_date = pd.to_datetime('2024-01-01')
end_date = pd.to_datetime('2025-10-24')

def get_trading_dates(start_date, end_date):
    """Get all valid trading days between start and end date"""
    schedule = us_calendar.schedule(start_date=start_date, end_date=end_date)
    trading_days = us_calendar.valid_days(start_date=start_date, end_date=end_date)
    return [date.strftime('%Y-%m-%d') for date in trading_days]

def fetch_all_stocks_for_date(date_str):
    """Fetch ALL stocks for a specific date using Polygon's grouped endpoint"""
    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    params = {
        'adjusted': 'true',
        'apiKey': API_KEY
    }
    
    try:
        response = session.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if 'results' in data and data['results']:
            df = pd.DataFrame(data['results'])
            df['date'] = pd.to_datetime(date_str)
            df = df.rename(columns={
                'T': 'ticker',
                'o': 'open',
                'h': 'high',
                'l': 'low',
                'c': 'close',
                'v': 'volume'
            })
            return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
        
        return None
        
    except Exception as e:
        print(f"Error fetching data for {date_str}: {str(e)}")
        return None

def get_premarket_data_polygon(ticker, date):
    """Fetch pre-market high for a specific date using session"""
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/minute/{date.strftime('%Y-%m-%d')}/{date.strftime('%Y-%m-%d')}"
    params = {
        'adjusted': 'true',
        'sort': 'asc',
        'apiKey': API_KEY
    }
    
    try:
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'results' in data and data['results']:
            df = pd.DataFrame(data['results'])
            df['time'] = pd.to_datetime(df['t'], unit='ms')
            
            # Filter for pre-market hours (4:00 AM - 9:30 AM ET)
            premarket = df[(df['time'].dt.time >= time(4, 0)) & 
                          (df['time'].dt.time < time(9, 30))]
            
            if not premarket.empty:
                return premarket['h'].max()
        
        return None
        
    except Exception as e:
        return None

def fetch_all_stock_data_by_date(trading_dates, max_workers=5):
    """Fetch ALL stocks for each trading date using optimized parallel processing"""
    all_data = []
    total = len(trading_dates)
    completed = 0
    failed = 0
    
    print(f"Fetching ALL stocks for {total} trading days...")
    print(f"Using {max_workers} parallel workers for optimal performance...")
    print(f"Date range: {trading_dates[0]} to {trading_dates[-1]}")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks at once - one per trading day
        future_to_date = {
            executor.submit(fetch_all_stocks_for_date, date_str): date_str 
            for date_str in trading_dates
        }
        
        # Process results as they complete
        for future in as_completed(future_to_date):
            date_str = future_to_date[future]
            completed += 1
            
            try:
                data = future.result()
                if data is not None and not data.empty:
                    all_data.append(data)
                else:
                    failed += 1
                    
                # Progress updates every 10 days
                if completed % 10 == 0:
                    success = completed - failed
                    print(f"Progress: {completed}/{total} days | Success: {success} | Failed: {failed}")
                    
            except Exception as e:
                failed += 1
    
    print(f"\n✓ Fetch complete: {completed}/{total} days processed")
    print(f"  Success: {completed - failed} days | Failed: {failed} days")
    
    if all_data:
        print("\nCombining data from all trading days...")
        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
        print(f"✓ Total rows: {len(df):,}")
        print(f"✓ Unique tickers: {df['ticker'].nunique():,}")
        print(f"✓ Date range: {df['date'].min().date()} to {df['date'].max().date()}")
        return df
    else:
        print("Warning: No data was fetched!")
        return pd.DataFrame()

# ─────────────────── Main Data Fetching ─────────────────── #
print("="*60)
print("SC DMR Scanner - ALL TICKERS")
print("="*60)
print(f"Scanning period: {start_date.date()} to {end_date.date()}")
print("This will scan EVERY available ticker from Polygon")
print("="*60 + "\n")

# Get all valid trading dates
print("Calculating trading dates...")
trading_dates = get_trading_dates(start_date, end_date)
print(f"✓ Found {len(trading_dates)} trading days\n")

# Fetch ALL stock data for all trading dates
df = fetch_all_stock_data_by_date(trading_dates, max_workers=5)

if df.empty:
    raise Exception("No data was fetched from Polygon API")

print("\n" + "="*60)
print("Data Preparation Phase")
print("="*60)

# Calculate prev_close
print("Calculating previous close values...")
df['prev_close'] = df.groupby('ticker')['close'].shift(1)

# Calculate gap
print("Calculating gaps...")
df['gap'] = ((df['open'] / df['prev_close']) - 1).fillna(0)

# Initialize pm_high (pre-market high) - this would require minute-level data
# For now, we'll estimate it as the max of open and a small premium above prev_close
# You can uncomment the detailed pre-market fetching if needed
print("Estimating pre-market highs...")
df['pm_high'] = df[['open', 'high']].max(axis=1)

print(f"\n✓ Data preparation complete!")
print(f"  Total rows: {len(df):,}")
print(f"  Date range: {df['date'].min().date()} to {df['date'].max().date()}")
print(f"  Tickers: {df['ticker'].nunique()}")
print("="*60 + "\n")


def get_last_bag_day_max_high(group):
    """Helper function for bag day analysis"""
    last_valid = group[group['bag_day_valid'] == 1].tail(1)
    return last_valid['bag_day_max_high'].values[0] if not last_valid.empty else None

def get_bag_day(df):
    """Calculate bag day validity with rolling window"""
    cols_to_check = ['bag_day']
    df['bag_day_valid1'] = 0

    # Group by ticker and apply rolling window
    for ticker, group in df.groupby('ticker'):
        trigger_array = (
            group[cols_to_check]
            .rolling(window=30, min_periods=1)
            .max()
            .max(axis=1)
        )
        df.loc[group.index, 'bag_day_valid1'] = (trigger_array > 0).astype(int)

    return df


# ─────────────────── Feature Engineering ─────────────────── #
print("="*60)
print("Feature Engineering Phase")
print("="*60)
print("Calculating technical indicators...")
print("  → Previous highs (10 periods)")
print("  → Previous lows & opens")
print("  → Ranges & gaps")
print("  → Close ranges")
print("  → Volume metrics")
print("  → Next day values")



df['prev_high'] = df.groupby('ticker')['high'].shift(1)
df['prev_high_2'] = df.groupby('ticker')['high'].shift(2)
df['prev_high_3'] = df.groupby('ticker')['high'].shift(3)
df['prev_high_4'] = df.groupby('ticker')['high'].shift(4)
df['prev_high_5'] = df.groupby('ticker')['high'].shift(5)
df['prev_high_6'] = df.groupby('ticker')['high'].shift(6)
df['prev_high_7'] = df.groupby('ticker')['high'].shift(7)
df['prev_high_8'] = df.groupby('ticker')['high'].shift(8)
df['prev_high_9'] = df.groupby('ticker')['high'].shift(9)
df['prev_high_10'] = df.groupby('ticker')['high'].shift(10)
df['prev_low'] = df.groupby('ticker')['low'].shift(1)
df['prev_open'] = df.groupby('ticker')['open'].shift(1)
df['prev_open_2'] = df.groupby('ticker')['open'].shift(2)
df['prev_open_3'] = df.groupby('ticker')['open'].shift(3)

df['range'] = df['high'] - df['low']
df['prev_range'] = df.groupby('ticker')['range'].shift(1)
df['prev_range_2'] = df.groupby('ticker')['range'].shift(2)

df['dol_gap'] = df['open'] - df['prev_close']
df['dol_pmh_gap'] = df['pm_high'] - df['prev_close']
df['pct_pmh_gap'] = ((df['pm_high'] / df['prev_close']) - 1)

df['prev_gap'] = df.groupby('ticker')['gap'].shift(1)
df['prev_gap_2'] = df.groupby('ticker')['gap'].shift(2)

df['opening_range'] = (df['open'] - df['prev_close']) / (df['pm_high'] - df['prev_close'])

df['close_range'] = (df['close'] - df['open']) / (df['high'] - df['open'])
df['prev_close_range'] = df.groupby('ticker')['close_range'].shift(1)
df['prev_close_range_2'] = df.groupby('ticker')['close_range'].shift(2)

df['prev_close_1'] = df.groupby('ticker')['prev_close'].shift(1)
df['prev_close_2'] = df.groupby('ticker')['prev_close'].shift(2)
df['prev_close_3'] = df.groupby('ticker')['prev_close'].shift(3)
df['prev_close_4'] = df.groupby('ticker')['prev_close'].shift(4)
df['prev_volume'] = df.groupby('ticker')['volume'].shift(1)
df['prev_volume_2'] = df.groupby('ticker')['volume'].shift(2)
df['prev_volume_3'] = df.groupby('ticker')['volume'].shift(3)


df['next_open'] = df.groupby('ticker')['open'].shift(-1)
df['next_high'] = df.groupby('ticker')['high'].shift(-1)
df['next_low'] = df.groupby('ticker')['low'].shift(-1)
df['next_close'] = df.groupby('ticker')['close'].shift(-1)
df['next_pm_high'] = df.groupby('ticker')['pm_high'].shift(-1)



print("\n" + "-"*60)
print("Computing valid trigger highs...")
df['valid_trig_high'] = ( (df['prev_high'] >= df['prev_high_2']) & (df['prev_high'] >= df['prev_high_3']) & (df['prev_high'] >= df['prev_high_4']) & (df['prev_high'] >= df['prev_high_5']) &
                         (df['prev_high'] >= df['prev_high_6']) & (df['prev_high'] >= df['prev_high_7']) & (df['prev_high'] >= df['prev_high_8']) &  (df['prev_high'] >= df['prev_high_9']) & (df['prev_high'] >= df['prev_high_10']))
print("✓ Valid trigger highs calculated")

print("\n" + "-"*60)
print("Calculating setup patterns...")
print("  → D2 PM Setup variants")
print("  → D2 PMH Break variants")
print("  → D2 Extreme patterns")
print("  → D3 patterns")
print("  → D4 patterns")


df['d2_pm_setup'] = (
            (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) & 
            # (df['prev_gap'] >= 0.2) & 
            (df['dol_pmh_gap'] >= df['prev_range']*0.5) & 
            (df['pct_pmh_gap'] >= .5) &
            (df['prev_close_range'] >= 0.5) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) & 
            (df['prev_high'] >= df['prev_low']*1.5)
            ) |


            (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 0.2) & 
            (df['prev_gap_2'] >= 0.2) & 
            (df['prev_range'] > df['prev_range_2']) & 
            (df['dol_pmh_gap'] >= df['prev_range']*0.5) & 
            (df['pct_pmh_gap'] >= .5) &
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000)
            ) |

            (         
            (df['valid_trig_high'] == True) &       
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 0.2) & 
            ((df['prev_high_2'] / df['prev_close_2'] - 1)>= 0.2) & 
            (df['prev_range'] > df['prev_range_2']) & 
            (df['dol_pmh_gap'] >= df['prev_range']*0.5) &     
            (df['pct_pmh_gap'] >= .5) &     
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close_1'] > df['prev_open_2']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000)
            ) |

            (                
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 0.2) & 
            ((df['prev_high_2'] / df['prev_close_2'] - 1)>= 0.2) & 
            ((df['prev_high_3'] / df['prev_close_3'] - 1)>= 0.2) &             
            (df['prev_close'] > df['prev_open']) & 
            (df['prev_close_1'] > df['prev_open_2']) & 
            (df['prev_close_2'] > df['prev_open_3']) &             
            (df['prev_close'] > df['prev_close_1']) & 
            (df['prev_close_1'] > df['prev_close_2']) & 
            (df['prev_close_2'] > df['prev_close_3']) &             
            (df['prev_high'] > df['prev_high_2']) & 
            (df['prev_high_2'] > df['prev_high_3']) & 
            (df['dol_pmh_gap'] >= df['prev_range']*0.5) & 
            (df['pct_pmh_gap'] >= .5) &
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000) &
            (df['prev_volume_3'] >= 10000000)
            )

            ).astype(int)


df['d2_pm_setup_2'] = (
            (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) & 
            (df['dol_pmh_gap'] >= df['prev_range']*1) & 
            (df['pct_pmh_gap'] >= 1) &
            (df['prev_close_range'] >= 0.3) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) & 
            (df['prev_high'] >= df['prev_low']*1.5)
            ) 

            ).astype(int)



df['d2_pmh_break'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) & 
            (df['prev_gap'] >= 0.2) & 
            (df['dol_gap'] >= df['prev_range']*0.3) & 
            (df['opening_range'] >= 0.5) & 
            (df['high'] >= df['pm_high']) & 
            (df['prev_close_range'] >= 0.5) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) & 
            (df['prev_high'] >= df['prev_low']*1.5)
            ).astype(int)

df['d2_pmh_break_1'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) & 
            (df['prev_gap'] < 0.2) & 
            (df['dol_gap'] >= df['prev_range']*0.3) & 
            (df['opening_range'] >= 0.5) & 
            (df['high'] >= df['pm_high']) & 
            (df['prev_close_range'] >= 0.5) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) & 
            (df['prev_high'] >= df['prev_low']*1.5)
            ).astype(int)


df['d2_no_pmh_break'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) & 
            (df['prev_gap'] >= 0.2) & 
            (df['dol_gap'] >= df['prev_range']*0.3) & 
            (df['opening_range'] >= 0.5) & 
            (df['high'] < df['pm_high']) & 
            (df['prev_close_range'] >= 0.5) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000)
            ).astype(int)


df['d2_extreme_gap'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) & 
            # (df['prev_gap'] >= 0.2) & 
            (df['dol_gap'] >= df['prev_range']*1) & 
            # (df['opening_range'] >= 0.5) & 
            (df['prev_close_range'] >= 0.3) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) & 
            (df['prev_high'] >= df['prev_low']*1.5)
            ).astype(int)


df['d2_extreme_intraday_run'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 1) &             
            ((df['high'] - df['open']) >= df['prev_range']*1) & 
            (df['dol_gap'] >= df['prev_range']*0.3) & 
            # (df['opening_range'] >= 0.5) & 
            (df['prev_close_range'] >= 0.5) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) & 
            (df['prev_high'] >= df['prev_low']*1.5)
            ).astype(int)




df['d3'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 0.2) & 
            (df['prev_gap'] >= 0.2) & 
            (df['prev_gap_2'] >= 0.2) & 
            (df['prev_range'] > df['prev_range_2']) & 
            (df['dol_gap'] >= df['prev_range']*0.3) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000)
            ).astype(int)

df['d3_alt'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 0.2) & 
            ((df['prev_high_2'] / df['prev_close_2'] - 1)>= 0.2) & 
            # (df['prev_gap_2'] < 0.2) & 
            (df['prev_range'] > df['prev_range_2']) & 
            (df['dol_gap'] >= df['prev_range']*0.5) &          

            # (df['high'] >= df['pm_high']) & 
            (df['prev_close'] >= df['prev_open']) & 
            (df['prev_close_1'] > df['prev_open_2']) & 
            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000)
            ).astype(int)



df['d4'] = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1)>= 0.2) & 
            ((df['prev_high_2'] / df['prev_close_2'] - 1)>= 0.2) & 
            ((df['prev_high_3'] / df['prev_close_3'] - 1)>= 0.2) & 
            
            (df['prev_close'] > df['prev_open']) & 
            (df['prev_close_1'] > df['prev_open_2']) & 
            (df['prev_close_2'] > df['prev_open_3']) & 
            
            (df['prev_close'] > df['prev_close_1']) & 
            (df['prev_close_1'] > df['prev_close_2']) & 
            (df['prev_close_2'] > df['prev_close_3']) & 
            
            (df['prev_high'] > df['prev_high_2']) & 
            (df['prev_high_2'] > df['prev_high_3']) & 

            (df['dol_gap'] >= df['prev_range']*0.3) & 

            (df['prev_close'] >= 0.75) & 
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000) &
            (df['prev_volume_3'] >= 10000000)
            ).astype(int)


print("✓ All setup patterns calculated")
print("="*60 + "\n")

df['date'] = pd.to_datetime(df['date'])
df = df.sort_values(by=['date']).reset_index(drop=True)

# Use the full date range from 1/1/24 to 10/24/25
filter_start_date = pd.to_datetime('2025-01-01')
filter_end_date = pd.to_datetime('2025-12-24')

print("="*60)
print("Filtering Setups")
print("="*60)
print(f"Date range: {filter_start_date.date()} to {filter_end_date.date()}")
print("Applying setup filters...")

df_all = df[
    (df['date'] >= filter_start_date) & 
    (df['date'] <= filter_end_date) &
    ((df['d2_pmh_break'] == 1) |(df['d2_pmh_break_1'] == 1) |(df['d2_no_pmh_break'] == 1) |(df['d3'] == 1) |(df['d3_alt'] == 1) |(df['d4'] == 1) |(df['d2_extreme_gap'] == 1) |(df['d2_extreme_intraday_run'] == 1) | (df['d2_pm_setup'] == 1) |(df['d2_pm_setup_2'] == 1))
]



df_d2_pmh_break = df[
    (df['date'] >= filter_start_date) & 
    (df['date'] <= filter_end_date) &
    (df['d2_pmh_break'] == 1)
]


df_d2_no_pmh_break = df[
    (df['date'] >= filter_start_date) & 
    (df['date'] <= filter_end_date) &
    (df['d2_no_pmh_break'] == 1)
]


df_d3 = df[
    (df['date'] >= filter_start_date) & 
    (df['date'] <= filter_end_date) &
    (df['d3'] == 1)
]


df_d3_alt = df[
    (df['date'] >= filter_start_date) & 
    (df['date'] <= filter_end_date) &
    (df['d3_alt'] == 1)
]





# ─────────────────── Results & Export ─────────────────── #
print("\n" + "="*60)
print("Scan Results Summary")
print("="*60)

print(f"\nTotal setups found: {len(df_all)}")
print(f"  • D2 PMH Break:           {len(df_d2_pmh_break)}")
print(f"  • D2 No PMH Break:        {len(df_d2_no_pmh_break)}")
print(f"  • D3:                     {len(df_d3)}")
print(f"  • D3 Alt:                 {len(df_d3_alt)}")

if len(df_all) > 0:
    print(f"\nUnique tickers with setups: {df_all['ticker'].nunique()}")
    print(f"Date range of setups: {df_all['date'].min().date()} to {df_all['date'].max().date()}")
    
    print("\nTop 10 tickers by setup frequency:")
    top_tickers = df_all['ticker'].value_counts().head(10)
    for ticker, count in top_tickers.items():
        print(f"  {ticker}: {count} setups")

# ─────────────────── Print Results List ─────────────────── #
print("\n" + "="*60)
print("FULL RESULTS LIST - ALL SETUPS")
print("="*60)
print("\nDate       | Ticker")
print("-" * 60)
print(df_all[['date', 'ticker']].to_string(index=False))
print("="*60)

print("\n" + "-"*60)
print("Exporting results...")
print("-"*60)

# Export results
# df_d2_pmh_break.to_csv("D2 PMH Break.csv", index=False)
# df_d2_no_pmh_break.to_csv("D2 No PMH Break.csv", index=False)
# df_d3.to_csv("D3.csv", index=False)
# df_d3_alt.to_csv("D3 Alt.csv", index=False)
df_all.to_csv("All D2 and D3.csv", index=False)

print("✓ Exported: All D2 and D3.csv")
print("\n" + "="*60)
print("✓ Scan Complete!")
print("="*60)