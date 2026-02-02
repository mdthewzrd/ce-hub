"""
LC Scanner Wrapper for FastAPI Integration - 90 Day Range
Uses the enhanced 90-day scanner with automatic date range calculation
"""

import asyncio
import pandas as pd
import pandas_market_calendars as mcal
from datetime import datetime, timedelta
import sys
import warnings
warnings.filterwarnings("ignore")

# Import our 90-day scanner
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from standalone_optimized_lc_scanner_90day import OptimizedLCScanner90Day, run_optimized_lc_scan_90day

def validate_date_range(start_date: str, end_date: str):
    """Validate and parse date range - enhanced for 90-day scanning"""
    try:
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)

        if start_dt >= end_dt:
            raise ValueError("Start date must be before end date")

        # Calculate max 90-day range
        max_range_days = (end_dt - start_dt).days
        if max_range_days > 120:  # Allow slightly more than 90 trading days
            raise ValueError(f"Date range too large. Maximum 90 trading days supported. Current range: {max_range_days} calendar days")

        # Reasonable date range limits
        earliest_date = pd.to_datetime('2020-01-01')
        latest_date = pd.to_datetime('2025-12-31')

        if start_dt < earliest_date or end_dt > latest_date:
            raise ValueError(f"Date range must be between {earliest_date.date()} and {latest_date.date()}")

        return start_dt, end_dt
    except Exception as e:
        raise ValueError(f"Invalid date format: {e}")

async def run_lc_scan_90day(start_date: str = None, end_date: str = None, progress_callback=None):
    """
    Run enhanced LC scan with 90-day automatic range calculation

    Key features:
    - Automatic 90-trading-day lookback if no dates provided
    - Enhanced pattern detection aligned with reference Python code
    - Maximum API concurrency optimization
    - Full technical indicator calculation over 90-day period

    Args:
        start_date: Start date in YYYY-MM-DD format (optional - auto-calculated if not provided)
        end_date: End date in YYYY-MM-DD format (optional - defaults to today)
        progress_callback: Optional callback function for progress updates

    Returns:
        List of dictionaries containing enhanced scan results
    """
    try:
        # If no dates provided, use automatic 90-day calculation
        if not end_date:
            end_date = datetime.now().date().strftime('%Y-%m-%d')

        if not start_date:
            # Use automatic 90-day calculation
            scanner_temp = OptimizedLCScanner90Day()
            start_date = scanner_temp.start_date.strftime('%Y-%m-%d')
            print(f"🔄 Using automatic 90-day range: {start_date} to {end_date}")
        else:
            # Validate provided dates
            validate_date_range(start_date, end_date)

        if progress_callback:
            await progress_callback(5, "🚀 Starting enhanced 90-day LC scanner...")

        # Create scanner instance
        scanner = OptimizedLCScanner90Day(max_workers=16)

        # Override dates if provided
        if start_date and end_date:
            scanner.start_date = pd.to_datetime(start_date).date()
            scanner.end_date = pd.to_datetime(end_date).date()

        if progress_callback:
            await progress_callback(10, f"📅 Analyzing {scanner.lookback_days}-day period: {scanner.start_date} to {scanner.end_date}")

        # Step 1: Get trading days
        if progress_callback:
            await progress_callback(15, "📅 Calculating trading days...")

        trading_days = await scanner.get_trading_days()

        if progress_callback:
            await progress_callback(20, f"✅ Found {len(trading_days)} trading days")

        # Step 2: Get universe
        if progress_callback:
            await progress_callback(25, "📊 Getting stock universe...")

        initial_tickers = await scanner.step_1_get_universe()

        if progress_callback:
            await progress_callback(35, f"✅ Initial universe: {len(initial_tickers)} tickers")

        # Step 3: Pre-filter
        if progress_callback:
            await progress_callback(40, "🔍 Pre-filtering by volume and price...")

        filtered_tickers = await scanner.step_2_pre_filter_volume_price(initial_tickers, trading_days)

        if progress_callback:
            await progress_callback(50, f"✅ After filtering: {len(filtered_tickers)} tickers")

        # Step 4: Fetch OHLCV data
        if progress_callback:
            await progress_callback(55, "📈 Fetching OHLCV data with max concurrency...")

        # Process all filtered tickers for comprehensive scanning
        data_dict = await scanner.step_3_fetch_ohlcv_data(filtered_tickers, trading_days)

        if progress_callback:
            await progress_callback(70, f"✅ Fetched data for {len(data_dict)} tickers")

        # Step 5: Calculate indicators
        if progress_callback:
            await progress_callback(75, "🧮 Calculating technical indicators...")

        data_with_indicators = scanner.step_4_calculate_technical_indicators(data_dict)

        if progress_callback:
            await progress_callback(85, f"✅ Calculated indicators for {len(data_with_indicators)} tickers")

        # Step 6: Detect patterns
        if progress_callback:
            await progress_callback(90, "🎯 Detecting LC patterns...")

        lc_results = scanner.step_5_detect_lc_patterns(data_with_indicators)

        if progress_callback:
            await progress_callback(95, "📊 Converting results to API format...")

        # Convert results to expected API format
        api_results = []
        for result in lc_results:
            # Calculate Day 0 date (pattern detection date + 1 trading day)
            pattern_date = pd.to_datetime(result['date'])

            # Use pandas_market_calendars to get the next business day
            nyse = mcal.get_calendar('NYSE')
            next_trading_days = nyse.valid_days(
                start_date=pattern_date,
                end_date=pattern_date + pd.DateOffset(days=5)
            )
            if len(next_trading_days) > 1:
                day_zero_date = next_trading_days[1]  # Next trading day
            else:
                # Fallback to simple business day addition
                day_zero_date = pattern_date + pd.tseries.offsets.BusinessDay(1)

            api_result = {
                'ticker': result['ticker'],
                'date': day_zero_date.strftime('%Y-%m-%d'),
                'pattern_date': result['date'],  # Original pattern detection date
                'gap_pct': result['gap_pct'],
                'volume': result['volume'],
                'close': result['close'],
                'parabolic_score': result['parabolic_score'],
                'confidence_score': result['confidence_score'],
                'volume_ratio': result['volume_ratio'],
                'atr': result['atr'],
                'high_change_atr': result.get('high_change_atr', 0),
                'close_range': result.get('close_range', 0),
                'ema_distance_20': result.get('ema_distance_20', 0),
                # LC-specific fields from enhanced detection
                'lc_frontside_d2_extended': result['lc_frontside_d2_extended'],
                'lc_frontside_d3_extended_1': result['lc_frontside_d3_extended_1'],
                # Analysis metadata
                'analysis_period_days': len(trading_days),
                'scanner_version': '90day_enhanced'
            }
            api_results.append(api_result)

        if progress_callback:
            await progress_callback(100, f"✅ Found {len(api_results)} LC patterns in 90-day analysis")

        return api_results

    except Exception as e:
        if progress_callback:
            await progress_callback(100, f"❌ Error during 90-day scan: {str(e)}")
        raise Exception(f"90-day LC Scan failed: {str(e)}")

def sync_run_lc_scan_90day(start_date: str = None, end_date: str = None):
    """
    Synchronous wrapper for the enhanced 90-day async scan function
    """
    try:
        # Handle event loop for different environments
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            return loop.run_until_complete(run_lc_scan_90day(start_date, end_date))
        finally:
            loop.close()
    except Exception as e:
        raise Exception(f"90-day scan execution failed: {str(e)}")

# Backward compatibility functions
def run_lc_scan(start_date: str, end_date: str, progress_callback=None):
    """Backward compatibility wrapper"""
    return run_lc_scan_90day(start_date, end_date, progress_callback)

def sync_run_lc_scan(start_date: str, end_date: str):
    """Backward compatibility wrapper"""
    return sync_run_lc_scan_90day(start_date, end_date)

# Test function
if __name__ == "__main__":
    print("🚀 Testing Enhanced 90-Day LC Scanner...")

    # Test with automatic 90-day range (no dates provided)
    print("\n📅 Testing automatic 90-day range calculation...")
    results = sync_run_lc_scan_90day()

    print(f"\n✅ Found {len(results)} LC scan results in 90-day analysis")

    if results:
        print("🎯 Top results:")
        for i, result in enumerate(results[:10], 1):  # Show first 10 results
            lc_type = "D2" if result['lc_frontside_d2_extended'] else "D3"
            print(f"  {i:2d}. {result['ticker']:>6} | {result['pattern_date']} | {lc_type} | "
                  f"Gap: {result['gap_pct']:>6.1f}% | Score: {result['parabolic_score']:>6.1f} | "
                  f"Conf: {result['confidence_score']:>5.1f}%")

        print(f"\n📊 Analysis Period: {results[0]['analysis_period_days']} trading days")
        print(f"🔄 Scanner Version: {results[0]['scanner_version']}")
    else:
        print("🔍 No LC patterns found in 90-day period")

    print(f"\n💨 ENHANCEMENT: Automatic 90-day lookback calculation")
    print(f"🎯 ENHANCEMENT: Enhanced pattern detection with multiple criteria")
    print(f"⚡ ENHANCEMENT: Maximum API concurrency (16 workers)")
    print(f"📊 ENHANCEMENT: Comprehensive technical indicator analysis")