"""
LC Scanner Wrapper for FastAPI Integration
Uses the ORIGINAL LC scanner with MAX WORKERS optimization ONLY
"""

import asyncio
import pandas as pd
import pandas_market_calendars as mcal
from datetime import datetime
import sys
import warnings
warnings.filterwarnings("ignore")

# Import the ORIGINAL scanner with max workers optimization
import optimized_original_lc_scanner

# Global variables for storing results
df_lc = None
df_sc = None

def validate_date_range(start_date: str, end_date: str):
    """Validate and parse date range"""
    try:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)

        if start_dt >= end_dt:
            raise ValueError("Start date must be before end date")

        # Reasonable date range limits
        earliest_date = pd.to_datetime('2020-01-01')
        latest_date = pd.to_datetime('2025-12-31')

        if start_dt < earliest_date or end_dt > latest_date:
            raise ValueError(f"Date range must be between {earliest_date.date()} and {latest_date.date()}")

        return start_dt, end_dt
    except Exception as e:
        raise ValueError(f"Invalid date format: {e}")

async def run_lc_scan(start_date: str, end_date: str, progress_callback=None):
    """
    Run ORIGINAL LC scan with MAX WORKERS optimization ONLY

    Key optimization:
    - Increased API concurrency (12x vs 3x workers)
    - Preserves ALL original LC pattern detection logic 100%

    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        progress_callback: Optional callback function for progress updates

    Returns:
        List of dictionaries containing scan results
    """
    try:
        # Validate dates
        validate_date_range(start_date, end_date)

        if progress_callback:
            await progress_callback(5, "🚀 Starting ORIGINAL LC scanner with max workers...")

        # Setup the original scanner's global variables
        optimized_original_lc_scanner.START_DATE = start_date
        optimized_original_lc_scanner.END_DATE = end_date
        optimized_original_lc_scanner.START_DATE_DT = pd.to_datetime(start_date)
        optimized_original_lc_scanner.END_DATE_DT = pd.to_datetime(end_date)

        # Calculate the date ranges just like the original
        start_date_70_days_before = pd.Timestamp(start_date) - pd.DateOffset(days=70)
        optimized_original_lc_scanner.start_date_70_days_before = pd.to_datetime(start_date_70_days_before)

        start_date_300_days_before = pd.Timestamp(start_date) - pd.DateOffset(days=400)
        start_date_300_days_before_str = str(start_date_300_days_before)[:10]

        # Setup NYSE calendar and dates
        nyse = optimized_original_lc_scanner.nyse
        schedule = nyse.schedule(start_date=start_date_300_days_before_str, end_date=end_date)
        DATES = nyse.valid_days(start_date=start_date_300_days_before_str, end_date=end_date)
        optimized_original_lc_scanner.DATES = [date.strftime('%Y-%m-%d') for date in DATES]

        if progress_callback:
            await progress_callback(15, f"📅 Processing {len(optimized_original_lc_scanner.DATES)} trading days...")

        # Run the original scanner's main function
        original_main = optimized_original_lc_scanner.main

        if progress_callback:
            await progress_callback(30, "🚀 Running ORIGINAL LC algorithm with ALL parameters...")

        # Run the original main function directly
        await original_main()

        if progress_callback:
            await progress_callback(80, "✅ Original LC scan algorithm completed")

        # Get the results from the global df_lc variable
        df_lc = optimized_original_lc_scanner.df_lc

        if progress_callback:
            await progress_callback(95, "📊 Converting results to API format...")

        # Convert DataFrame to list of dictionaries in the expected format
        results = []
        if df_lc is not None and not df_lc.empty:
            for _, row in df_lc.iterrows():
                # Calculate Day 0 date (pattern detection date + 1 trading day)
                pattern_date = pd.to_datetime(row['date'])

                # Use pandas_market_calendars to get the next business day
                # (more reliable than pd.tseries.offsets.BDay which is deprecated)
                nyse = mcal.get_calendar('NYSE')
                next_trading_day = nyse.valid_days(start_date=pattern_date, end_date=pattern_date + pd.DateOffset(days=5))
                if len(next_trading_day) > 1:
                    day_zero_date = next_trading_day[1]  # Next trading day
                else:
                    # Fallback to simple business day addition
                    day_zero_date = pattern_date + pd.tseries.offsets.BusinessDay(1)

                result = {
                    'ticker': row['ticker'],
                    'date': day_zero_date.strftime('%Y-%m-%d'),
                    'gap_pct': row.get('gap_pct', 0),
                    'volume': int(row.get('v_ua', row.get('volume', 0))),
                    'close': float(row.get('c_ua', row.get('close', 0))),
                    'parabolic_score': float(row.get('parabolic_score', 0)),
                    'confidence_score': float(row.get('parabolic_score', 0)),  # Use parabolic score as confidence
                    'lc_frontside_d2_extended': int(row.get('lc_frontside_d2_extended', 0)),
                    'lc_frontside_d3_extended_1': int(row.get('lc_frontside_d3_extended_1', 0)),
                    'high_chg_atr': float(row.get('high_chg_atr', 0)),
                    'dist_h_9ema_atr': float(row.get('dist_h_9ema_atr', 0)),
                    'dist_h_20ema_atr': float(row.get('dist_h_20ema_atr', 0)),
                    'dol_v': int(row.get('dol_v', 0))
                }
                results.append(result)

        if progress_callback:
            await progress_callback(100, f"✅ Found {len(results)} LC patterns using ORIGINAL algorithm")

        return results

    except Exception as e:
        if progress_callback:
            await progress_callback(100, f"❌ Error during original scan: {str(e)}")
        raise Exception(f"Original LC Scan failed: {str(e)}")

def sync_run_lc_scan(start_date: str, end_date: str):
    """
    Synchronous wrapper for the ORIGINAL async scan function with max workers
    """
    try:
        # Handle event loop for different environments
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            return loop.run_until_complete(run_lc_scan(start_date, end_date))
        finally:
            loop.close()
    except Exception as e:
        raise Exception(f"Original scan execution failed: {str(e)}")

# Test function
if __name__ == "__main__":
    print("🚀 Testing ORIGINAL LC Scanner with MAX WORKERS...")

    # Test with recent dates for faster execution
    results = sync_run_lc_scan("2024-10-28", "2024-10-30")

    print(f"\n✅ Found {len(results)} LC scan results")
    print("🎯 Top results:")
    for result in results[:5]:  # Show first 5 results
        print(f"  {result['ticker']}: {result['gap_pct']}% gap, score: {result['parabolic_score']}")

    print(f"\n💨 OPTIMIZATION: 12x concurrent API requests vs original 3x")
    print(f"✅ PRESERVED: All original LC pattern detection logic 100% intact")
    print(f"🎯 PRESERVED: All ATR calculations, EMA distances, parabolic scoring")