"""
Data Loader for Edge Dev Platform

Provides centralized data fetching functionality for scanners.
"""

import pandas as pd
import numpy as np
import glob
import os
from pathlib import Path
from typing import List, Optional
from datetime import datetime


def fetch_all_grouped_data(
    tickers: Optional[List[str]] = None,
    start: str = None,
    end: str = None
) -> pd.DataFrame:
    """
    Fetch historical data for multiple tickers from local JSON files

    This function loads data from the platform's local data directory.

    Args:
        tickers: List of ticker symbols (None = all available tickers)
        start: Start date (YYYY-MM-DD format)
        end: End date (YYYY-MM-DD format)

    Returns:
        DataFrame with columns: [ticker, date, open, high, low, close, volume]

    Example:
        # Fetch all tickers for 2024
        df = fetch_all_grouped_data(
            tickers=None,
            start="2024-01-01",
            end="2024-12-31"
        )

        # Fetch specific tickers
        df = fetch_all_grouped_data(
            tickers=["AAPL", "MSFT", "GOOGL"],
            start="2024-01-01",
            end="2024-12-31"
        )
    """
    print(f"📊 Loading data from local files...")

    # Get the backend directory (data files are in the parent of universal_scanner_engine)
    backend_dir = Path(__file__).parent.parent.parent

    # Find all available data files
    data_files = list(backend_dir.glob("*_data.json"))

    if not data_files:
        print(f"❌ No data files found in {backend_dir}")
        return pd.DataFrame()

    print(f"📁 Found {len(data_files)} data files")

    # Extract ticker symbols from filenames
    available_tickers = [f.stem.replace("_data", "") for f in data_files]

    # Filter to requested tickers
    if tickers is not None:
        tickers = [t.upper() for t in tickers]
        available_tickers = [t for t in available_tickers if t in tickers]
        if not available_tickers:
            print(f"❌ No data available for requested tickers: {tickers}")
            return pd.DataFrame()

    print(f"📈 Loading data for {len(available_tickers)} tickers...")

    # Load data from files
    all_data = []
    for ticker in available_tickers:
        file_path = backend_dir / f"{ticker}_data.json"

        if not file_path.exists():
            continue

        try:
            # Read JSON file
            df_ticker = pd.read_json(file_path)

            # Map Polygon API columns to standard format
            # Polygon format: {v, vw, o, c, h, l, t, n}
            # Expected format: {ticker, date, open, high, low, close, volume}
            column_mapping = {
                'v': 'volume',
                'o': 'open',
                'c': 'close',
                'h': 'high',
                'l': 'low'
            }

            # Check if data is in Polygon API format
            if all(col in df_ticker.columns for col in ['v', 'o', 'c', 'h', 'l']):
                df_ticker = df_ticker.rename(columns=column_mapping)

                # Convert timestamp to date (Polygon uses milliseconds)
                if 't' in df_ticker.columns:
                    df_ticker['date'] = pd.to_datetime(df_ticker['t'], unit='ms').dt.strftime('%Y-%m-%d')
                    df_ticker = df_ticker.drop(columns=['t'])
                else:
                    print(f"⚠️  Skipping {ticker}: missing timestamp column")
                    continue

                # Drop unnecessary columns
                df_ticker = df_ticker.drop(columns=['vw', 'n'], errors='ignore')

            # Add ticker column
            df_ticker['ticker'] = ticker

            # Ensure required columns exist
            required_cols = ['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']
            if not all(col in df_ticker.columns for col in required_cols):
                print(f"⚠️  Skipping {ticker}: missing required columns")
                print(f"   Available columns: {list(df_ticker.columns)}")
                continue

            # Filter by date range if specified
            if start or end:
                df_ticker['date'] = pd.to_datetime(df_ticker['date'])

                if start:
                    df_ticker = df_ticker[df_ticker['date'] >= start]

                if end:
                    df_ticker = df_ticker[df_ticker['date'] <= end]

            # Select only required columns
            required_cols = ['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']
            df_ticker = df_ticker[required_cols]

            if not df_ticker.empty:
                all_data.append(df_ticker)

        except Exception as e:
            print(f"⚠️  Error loading {ticker}: {e}")
            continue

    if not all_data:
        print("❌ No data loaded")
        return pd.DataFrame()

    # Combine all data
    df = pd.concat(all_data, ignore_index=True)

    # Sort by ticker and date
    df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

    # Convert date back to string format
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')

    print(f"✅ Loaded {len(df):,} rows for {df['ticker'].nunique()} tickers")
    print(f"📅 Date range: {df['date'].min()} to {df['date'].max()}")

    return df


def get_available_tickers() -> List[str]:
    """
    Get list of all available tickers from local data files

    Returns:
        List of ticker symbols
    """
    backend_dir = Path(__file__).parent.parent.parent
    data_files = list(backend_dir.glob("*_data.json"))

    tickers = [f.stem.replace("_data", "") for f in data_files]
    return sorted(tickers)


if __name__ == "__main__":
    # Test the data loader
    print("Testing data loader...")
    print(f"Available tickers: {get_available_tickers()}")

    df = fetch_all_grouped_data(
        tickers=["AAPL", "MSFT", "TSLA"],
        start="2024-01-01",
        end="2024-01-31"
    )

    if not df.empty:
        print(f"\n📊 Sample data:")
        print(df.head(10))
        print(f"\n📊 Shape: {df.shape}")
    else:
        print("\n❌ No data loaded")
