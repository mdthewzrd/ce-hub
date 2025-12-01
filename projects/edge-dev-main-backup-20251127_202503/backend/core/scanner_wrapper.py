"""
Scanner Wrapper - Preserves ALL threading optimizations from the original scanner
while adding progress tracking and dynamic date range support
"""

import asyncio
import importlib.util
import logging
import sys
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from datetime import datetime
from multiprocessing import cpu_count
from typing import Dict, List, Optional, Callable
import warnings

import aiohttp
import pandas as pd
import pandas_market_calendars as mcal

# Import all functions from the original scanner
import sys
import os

# Add the scanner file to the path
scanner_path = os.path.join(os.path.dirname(__file__), 'scanner.py')
spec = importlib.util.spec_from_file_location("scanner", scanner_path)
scanner_module = importlib.util.module_from_spec(spec)
sys.modules["scanner"] = scanner_module
spec.loader.exec_module(scanner_module)

# Import specific functions and variables
adjust_daily = scanner_module.adjust_daily
adjust_intraday = scanner_module.adjust_intraday
check_high_lvl_filter_lc = scanner_module.check_high_lvl_filter_lc
compute_indicators1 = scanner_module.compute_indicators1
filter_lc_rows = scanner_module.filter_lc_rows
fetch_intial_stock_list = scanner_module.fetch_intial_stock_list
process_lc_row = scanner_module.process_lc_row
dates_before_after = scanner_module.dates_before_after
check_next_day_valid_lc = scanner_module.check_next_day_valid_lc
check_lc_pm_liquidity = scanner_module.check_lc_pm_liquidity
process_dataframe = scanner_module.process_dataframe
get_min_price_lc = scanner_module.get_min_price_lc
API_KEY = scanner_module.API_KEY
BASE_URL = scanner_module.BASE_URL

warnings.filterwarnings("ignore")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logger = logging.getLogger(__name__)

# Initialize NYSE calendar and threading - EXACTLY like original
nyse = mcal.get_calendar('NYSE')
executor = ThreadPoolExecutor()  # Preserve original threading setup


class ThreadedLCScanner:
    """
    High-performance LC scanner that preserves ALL original threading optimizations
    while adding progress tracking and dynamic date range support
    """

    def __init__(self):
        self.api_key = API_KEY
        self.base_url = BASE_URL
        self.executor = ThreadPoolExecutor()  # Preserve original threading
        self.progress_callback: Optional[Callable] = None

    async def initialize(self):
        """Initialize scanner resources"""
        logger.info("Initializing ThreadedLCScanner...")

    async def cleanup(self):
        """Cleanup scanner resources"""
        logger.info("Cleaning up ThreadedLCScanner...")
        if hasattr(self, 'executor'):
            self.executor.shutdown(wait=True)

    async def execute_scan(
        self,
        start_date: str,
        end_date: str,
        filters: Optional[dict] = None,
        progress_callback: Optional[Callable] = None
    ) -> List[dict]:
        """
        Execute LC scan with dynamic date range
        Preserves ALL threading optimizations from original scanner
        """
        self.progress_callback = progress_callback
        scan_start_time = time.time()

        try:
            # Update progress
            await self._update_progress(0, "Initializing scan parameters...")

            # Convert date strings to pandas datetime
            START_DATE_DT = pd.to_datetime(start_date)
            END_DATE_DT = pd.to_datetime(end_date)

            # Calculate date ranges EXACTLY like original
            start_date_70_days_before = pd.Timestamp(start_date) - pd.DateOffset(days=70)
            start_date_70_days_before = pd.to_datetime(start_date_70_days_before)

            start_date_300_days_before = pd.Timestamp(start_date) - pd.DateOffset(days=400)
            start_date_300_days_before = str(start_date_300_days_before)[:10]

            # Get trading dates EXACTLY like original
            schedule = nyse.schedule(start_date=start_date_300_days_before, end_date=end_date)
            DATES = [date.strftime('%Y-%m-%d') for date in nyse.valid_days(
                start_date=start_date_300_days_before,
                end_date=end_date
            )]

            await self._update_progress(5, f"Generated {len(DATES)} trading dates")

            # Execute the main scan logic with preserved threading
            results = await self._execute_main_scan_logic(
                DATES, START_DATE_DT, END_DATE_DT,
                start_date_70_days_before, filters
            )

            scan_duration = time.time() - scan_start_time
            await self._update_progress(100, f"Scan completed in {scan_duration:.2f} seconds")

            logger.info(f"Scan completed: {len(results)} results in {scan_duration:.2f} seconds")
            return results

        except Exception as e:
            logger.error(f"Scan execution failed: {str(e)}", exc_info=True)
            raise

    async def _execute_main_scan_logic(
        self,
        DATES: List[str],
        START_DATE_DT,
        END_DATE_DT,
        start_date_70_days_before,
        filters: Optional[dict] = None
    ) -> List[dict]:
        """
        Execute the main scan logic with preserved threading optimizations
        This mirrors the original main() function but with progress tracking
        """

        # Phase 1: Fetch initial stock data with preserved async patterns
        await self._update_progress(10, "Fetching adjusted stock data...")

        all_results = []
        adj = "true"

        # Use original async pattern with aiohttp
        async with aiohttp.ClientSession() as session:
            tasks = [fetch_intial_stock_list(session, date, adj) for date in DATES]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Handle retries EXACTLY like original
            all_results = []
            retry_tasks = []

            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    retry_tasks.append(fetch_intial_stock_list(session, DATES[i], adj))
                else:
                    all_results.append(result)

            # Retry failed tasks
            if retry_tasks:
                retry_results = await asyncio.gather(*retry_tasks, return_exceptions=True)
                for retry_result in retry_results:
                    if not isinstance(retry_result, Exception):
                        all_results.append(retry_result)

        df_a = pd.concat(all_results, ignore_index=True)
        await self._update_progress(25, "Fetched adjusted data")

        # Phase 2: Fetch unadjusted data with same pattern
        await self._update_progress(30, "Fetching unadjusted stock data...")

        all_results = []
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

        df_ua = pd.concat(all_results, ignore_index=True)
        df_ua.rename(columns={col: col + '_ua' if col not in ['date', 'ticker'] else col for col in df_ua.columns}, inplace=True)

        await self._update_progress(50, "Merged adjusted and unadjusted data")

        # Phase 3: Data processing with preserved logic
        df = pd.merge(df_a, df_ua, on=['date', 'ticker'], how='inner')
        df = df.drop(columns=['vw', 't', 'n', 'vw_ua', 't_ua', 'n_ua'])
        df = df.sort_values(by='date')
        df['date'] = pd.to_datetime(df['date'])

        # Apply original data processing
        df = df.select_dtypes(include=['floating']).round(2).join(df.select_dtypes(exclude=['floating']))

        await self._update_progress(60, "Computing technical indicators...")

        # Preserve original compute_indicators1 function with threading
        df = compute_indicators1(df)
        df = df.sort_values(by='date')
        df = df.select_dtypes(include=['floating']).round(2).join(df.select_dtypes(exclude=['floating']))

        await self._update_progress(70, "Applying LC filters...")

        # Apply LC filters with preserved logic
        df_lc = check_high_lvl_filter_lc(df)

        # Phase 4: Process intraday data with preserved ProcessPoolExecutor
        await self._update_progress(80, "Processing intraday data with preserved threading...")

        # Use original dates_before_after function
        global df_lc_global  # Make accessible to process functions
        df_lc_global = df_lc
        df_lc = dates_before_after(df_lc)

        # Convert to records for ProcessPoolExecutor - EXACTLY like original
        rows_lc = df_lc.to_dict(orient='records')

        # Use ProcessPoolExecutor with preserved threading - EXACTLY like original
        with ProcessPoolExecutor() as executor:
            future_lc = executor.submit(process_dataframe, process_lc_row, rows_lc)
            df_lc = future_lc.result()

        await self._update_progress(90, "Finalizing results...")

        # Apply final filtering with preserved logic
        df_lc = get_min_price_lc(df_lc)
        df_lc = check_next_day_valid_lc(df_lc)
        df_lc = check_lc_pm_liquidity(df_lc)
        df_lc = filter_lc_rows(df_lc)

        # Filter by date range
        df_lc = df_lc[(df_lc['date'] >= START_DATE_DT) & (df_lc['date'] <= END_DATE_DT)]
        df_lc = df_lc.reset_index(drop=True)

        # Remove duplicates to prevent double results
        # Drop duplicates based on date and ticker combination
        df_lc = df_lc.drop_duplicates(subset=['date', 'ticker'], keep='first')
        df_lc = df_lc.reset_index(drop=True)

        # Convert to results format
        results = df_lc.to_dict('records')

        await self._update_progress(95, f"Found {len(results)} LC candidates")

        return results

    async def _update_progress(self, percent: float, message: str, **kwargs):
        """Update scan progress"""
        if self.progress_callback:
            progress_data = {
                'progress_percent': percent,
                'message': message,
                **kwargs
            }
            await self.progress_callback(progress_data)

    async def get_universe_info(self) -> dict:
        """Get information about the ticker universe"""
        try:
            # Use a recent date to get universe info
            recent_date = datetime.now().strftime('%Y-%m-%d')

            async with aiohttp.ClientSession() as session:
                # Get sample data to determine universe size
                sample_data = await fetch_intial_stock_list(session, recent_date, "true")

                if sample_data is not None and not sample_data.empty:
                    total_tickers = len(sample_data)
                    active_tickers = len(sample_data[sample_data['v'] > 0])
                else:
                    total_tickers = 0
                    active_tickers = 0

            return {
                "total_tickers": total_tickers,
                "active_tickers": active_tickers,
                "date_range": {
                    "latest_available": recent_date,
                    "data_source": "Polygon API"
                },
                "last_updated": datetime.now(),
                "data_source": "Polygon API"
            }

        except Exception as e:
            logger.error(f"Error getting universe info: {str(e)}")
            raise