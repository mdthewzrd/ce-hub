"""
Debug validation to see why no signals are passing
"""
import pandas as pd
import requests
from dotenv import load_dotenv
import os
from pandas_market_calendars import get_calendar

load_dotenv()

API_KEY = os.getenv('POLYGON_API_KEY')
BASE_URL = "https://api.polygon.io"
us_calendar = get_calendar('XNYS')

# Load signals
signals = pd.read_csv('lc_d2_results.csv')
print(f"Total signals: {len(signals)}")
print(f"\nFirst 5 signals:")
print(signals.head(5).to_string(index=False))

# Get trading dates map
def get_trading_dates_map(start_date, end_date):
    schedule = us_calendar.schedule(
        start_date=(pd.to_datetime(start_date) - pd.Timedelta(days=30)),
        end_date=(pd.to_datetime(end_date) + pd.Timedelta(days=30))
    )
    trading_days = us_calendar.valid_days(
        start_date=(pd.to_datetime(start_date) - pd.Timedelta(days=30)),
        end_date=(pd.to_datetime(end_date) + pd.Timedelta(days=30))
    )
    trading_days_list = trading_days.tolist()
    trading_days_map = {day.date(): idx for idx, day in enumerate(trading_days_list)}
    return trading_days_list, trading_days_map

def get_date_offsets(date, trading_days_list, trading_days_map):
    if date not in trading_days_map:
        return None, None, None
    idx = trading_days_map[date]
    date_plus_1 = trading_days_list[idx + 1] if idx + 1 < len(trading_days_list) else None
    date_minus_4 = trading_days_list[idx - 4] if idx - 4 >= 0 else None
    return date_plus_1, date_minus_4

# Get first signal for testing
first_signal = signals.iloc[0]
ticker = first_signal['Ticker']
signal_date = pd.to_datetime(first_signal['Date']).date()

print(f"\n{'='*70}")
print(f"Testing first signal: {ticker} on {signal_date}")
print(f"Pattern: {first_signal['Scanner_Label']}")
print(f"{'='*70}")

# Get daily data for this ticker
start_str = (signal_date - pd.Timedelta(days=30)).strftime('%Y-%m-%d')
end_str = (signal_date + pd.Timedelta(days=5)).strftime('%Y-%m-%d')

url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_str}/{end_str}"
params = {"adjusted": "true", "apiKey": API_KEY}

response = requests.get(url, params=params, timeout=30)
if response.status_code == 200:
    data = response.json()
    if 'results' in data and data['results']:
        df_daily = pd.DataFrame(data['results'])
        df_daily['datetime'] = pd.to_datetime(df_daily['t'], unit='ms')
        df_daily['date'] = df_daily['datetime'].dt.date

        # Find the signal day
        signal_row = df_daily[df_daily['date'] == signal_date]
        if not signal_row.empty:
            close = signal_row.iloc[0]['c']
            high = signal_row.iloc[0]['h']
            low = signal_row.iloc[0]['l']
            range_val = high - low

            print(f"Signal day data:")
            print(f"  Close: {close}")
            print(f"  High: {high}")
            print(f"  Low: {low}")
            print(f"  Range: {range_val}")

            # Determine multiplier
            pattern = first_signal['Scanner_Label']
            if 'd2_extended' in pattern.lower() and 'd3_extended' not in pattern.lower():
                multiplier = 0.5
            else:
                multiplier = 0.3

            min_price = close + range_val * multiplier
            print(f"\nMin price calculation:")
            print(f"  Multiplier: {multiplier}")
            print(f"  Min price: {min_price}")
            print(f"  Formula: {close} + {range_val} * {multiplier} = {min_price}")

            # Get trading dates
            trading_days_list, trading_days_map = get_trading_dates_map(start_str, end_str)
            date_plus_1, date_minus_4 = get_date_offsets(signal_date, trading_days_list, trading_days_map)

            print(f"\nNext trading day: {date_plus_1}")

            if date_plus_1:
                # Fetch intraday data
                intraday_start = (date_minus_4 if date_minus_4 else signal_date).strftime('%Y-%m-%d')
                intraday_end = (date_plus_1 if date_plus_1 else signal_date).strftime('%Y-%m-%d')

                url_intraday = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/30/minute/{intraday_start}/{intraday_end}"
                response_intraday = requests.get(url_intraday, params=params, timeout=30)

                if response_intraday.status_code == 200:
                    intraday_data = response_intraday.json()
                    if 'results' in intraday_data and intraday_data['results']:
                        df_intraday = pd.DataFrame(intraday_data['results'])
                        df_intraday['datetime'] = pd.to_datetime(df_intraday['t'], unit='ms')
                        df_intraday['date'] = df_intraday['datetime'].dt.date
                        df_intraday['time_int'] = df_intraday['datetime'].dt.hour * 100 + df_intraday['datetime'].dt.minute

                        # Get next day's open
                        next_day_df = df_intraday[df_intraday['date'] == date_plus_1]
                        if not next_day_df.empty:
                            next_open = next_day_df.iloc[0]['o']
                            print(f"\nNext day open: {next_open}")
                            print(f"Validation: {next_open} >= {min_price} ? {next_open >= min_price}")

                            # Check PM liquidity
                            pm_df = df_intraday[df_intraday['time_int'] <= 900].copy()
                            if not pm_df.empty:
                                pm_vol = pm_df.groupby('date').agg({
                                    'v': 'sum',
                                    'o': 'last'
                                }).reset_index()
                                pm_vol.columns = ['date', 'pm_vol', 'pm_open']
                                pm_vol['pm_dol_vol'] = pm_vol['pm_vol'] * pm_vol['pm_open']

                                pm_vol_before = pm_vol[pm_vol['date'] < signal_date]
                                if not pm_vol_before.empty:
                                    avg_pm_dol_vol = pm_vol_before['pm_dol_vol'].mean()
                                    print(f"\nPM liquidity (5-day avg): ${avg_pm_dol_vol:,.0f}")
                                    print(f"Validation: ${avg_pm_dol_vol:,.0f} >= $10,000,000 ? {avg_pm_dol_vol >= 10_000_000}")
                                else:
                                    print("\nNo PM data available before signal date")
else:
    print(f"Failed to fetch data for {ticker}")

print(f"\n{'='*70}")
print("Testing a few more signals...")
print(f"{'='*70}")

for idx, row in signals.head(5).iterrows():
    ticker = row['Ticker']
    signal_date = pd.to_datetime(row['Date']).date()

    # Get daily data
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_str}/{end_str}"
    response = requests.get(url, params=params, timeout=30)

    if response.status_code == 200:
        data = response.json()
        if 'results' in data and data['results']:
            df_daily = pd.DataFrame(data['results'])
            df_daily['datetime'] = pd.to_datetime(df_daily['t'], unit='ms')
            df_daily['date'] = df_daily['datetime'].dt.date

            signal_row = df_daily[df_daily['date'] == signal_date]
            if not signal_row.empty:
                close = signal_row.iloc[0]['c']
                high = signal_row.iloc[0]['h']
                low = signal_row.iloc[0]['l']
                range_val = high - low

                pattern = row['Scanner_Label']
                if 'd2_extended' in pattern.lower() and 'd3_extended' not in pattern.lower():
                    multiplier = 0.5
                else:
                    multiplier = 0.3

                min_price = close + range_val * multiplier
                print(f"\n{ticker} | {signal_date} | {pattern[:50]}...")
                print(f"  Close: {close:.2f}, Range: {range_val:.2f}, Min Price: {min_price:.2f}")
