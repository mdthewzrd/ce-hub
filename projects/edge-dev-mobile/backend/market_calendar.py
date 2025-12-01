"""
Market Calendar Module for Edge.dev Backend
Dynamic market calendar using pandas-market-calendars for accurate holiday detection
"""

from datetime import datetime, timedelta
from typing import List, Set
import pandas as pd
import pandas_market_calendars as mcal

# Initialize NYSE calendar for dynamic holiday detection
try:
    nyse = mcal.get_calendar('NYSE')
    MARKET_CALENDAR_AVAILABLE = True
except Exception as e:
    print(f"Warning: Could not initialize NYSE calendar: {e}")
    nyse = None
    MARKET_CALENDAR_AVAILABLE = False

# Fallback holidays in case pandas-market-calendars fails
FALLBACK_HOLIDAYS_2024_2025 = [
    '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
    '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
    '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25'
]

# Convert to set for fast lookup
ALL_HOLIDAYS: Set[str] = set(FALLBACK_HOLIDAYS_2024_2025)


def is_weekend(date) -> bool:
    """Check if a date is a weekend (Saturday or Sunday)"""
    if isinstance(date, str):
        date = datetime.strptime(date, "%Y-%m-%d")
    day_of_week = date.weekday()
    return day_of_week >= 5  # Saturday=5, Sunday=6


def is_market_holiday(date) -> bool:
    """Check if a date is a market holiday using dynamic NYSE calendar"""
    if isinstance(date, str):
        date_str = date
        try:
            check_date = pd.Timestamp(date_str).normalize()
        except:
            return date_str in ALL_HOLIDAYS  # Fallback to static list
    else:
        date_str = date.strftime("%Y-%m-%d")
        check_date = pd.Timestamp(date).normalize()

    # Use dynamic NYSE calendar if available
    if MARKET_CALENDAR_AVAILABLE and nyse is not None:
        try:
            # Get trading schedule for the specific date
            schedule = nyse.schedule(start_date=check_date, end_date=check_date)
            return len(schedule) == 0  # No trading session = holiday
        except Exception:
            pass  # Fall back to static holidays

    # Fallback to static holiday list
    return date_str in ALL_HOLIDAYS


def is_trading_day(date) -> bool:
    """Check if a date is a trading day (not weekend or holiday)"""
    return not is_weekend(date) and not is_market_holiday(date)


def get_trading_days_between(start_date, end_date) -> List[datetime]:
    """Get all trading days between start and end dates (inclusive)"""
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, "%Y-%m-%d")

    trading_days = []
    current_date = start_date

    while current_date <= end_date:
        if is_trading_day(current_date):
            trading_days.append(current_date)
        current_date += timedelta(days=1)

    return trading_days


def get_n_trading_days_ending_on(target_date, n_days: int) -> List[datetime]:
    """Get N trading days ending on target_date (inclusive)"""
    if isinstance(target_date, str):
        target_date = datetime.strptime(target_date, "%Y-%m-%d")

    # Start far enough back to ensure we get enough trading days
    start_search = target_date - timedelta(days=n_days * 2 + 10)  # Buffer for weekends/holidays

    # Get all trading days up to and including target date
    all_trading_days = get_trading_days_between(start_search, target_date)

    # Return the last N trading days (or all if fewer than N)
    return all_trading_days[-n_days:] if len(all_trading_days) >= n_days else all_trading_days


def filter_trading_days_only(timestamps) -> List:
    """Filter a list of timestamps to only include trading days"""
    filtered_data = []

    for timestamp in timestamps:
        # Handle different timestamp formats
        if isinstance(timestamp, str):
            # Try different formats
            try:
                if 'T' in timestamp:
                    date_part = timestamp.split('T')[0]
                else:
                    date_part = timestamp

                if is_trading_day(date_part):
                    filtered_data.append(timestamp)
            except:
                continue
        else:
            # Handle datetime objects or numeric timestamps
            try:
                if isinstance(timestamp, (int, float)):
                    dt = datetime.fromtimestamp(timestamp / 1000)  # Assume milliseconds
                else:
                    dt = timestamp

                if is_trading_day(dt):
                    filtered_data.append(timestamp)
            except:
                continue

    return filtered_data


def validate_chart_data_for_trading_days(chart_data: dict) -> dict:
    """Filter chart data to only include trading days"""
    if not chart_data or 'x' not in chart_data:
        return chart_data

    timestamps = chart_data['x']
    if not timestamps:
        return chart_data

    # Find indices of trading days
    valid_indices = []
    for i, timestamp in enumerate(timestamps):
        try:
            if isinstance(timestamp, str) and 'T' in timestamp:
                date_part = timestamp.split('T')[0]
            else:
                date_part = str(timestamp)[:10]  # First 10 chars should be date

            if is_trading_day(date_part):
                valid_indices.append(i)
        except:
            continue  # Skip invalid timestamps

    # Filter all arrays using valid indices
    filtered_data = {}
    for key, values in chart_data.items():
        if isinstance(values, list) and len(values) == len(timestamps):
            filtered_data[key] = [values[i] for i in valid_indices]
        else:
            filtered_data[key] = values

    return filtered_data


def debug_holiday_check(date_str: str) -> dict:
    """Debug function to check why a specific date might be filtered"""
    return {
        'date': date_str,
        'is_weekend': is_weekend(date_str),
        'is_holiday': is_market_holiday(date_str),
        'is_trading_day': is_trading_day(date_str),
        'weekday': datetime.strptime(date_str, "%Y-%m-%d").strftime('%A')
    }


if __name__ == "__main__":
    # Test the problematic date from the screenshot
    test_date = "2025-02-17"
    print("Testing Presidents' Day 2025:")
    print(debug_holiday_check(test_date))

    # Test surrounding dates
    for i in range(-2, 3):
        test_dt = datetime.strptime("2025-02-17", "%Y-%m-%d") + timedelta(days=i)
        test_str = test_dt.strftime("%Y-%m-%d")
        result = debug_holiday_check(test_str)
        print(f"{result['date']} ({result['weekday']}): Trading day = {result['is_trading_day']}")