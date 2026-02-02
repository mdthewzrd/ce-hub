"""
🎯 SIMPLE GUARANTEED SIGNALS SCANNER V2
=========================================

This scanner is GUARANTEED to find signals for ANY date range.
Uses a simple pattern: First trading day of each month.

WHY THIS WILL ALWAYS WORK:
- Every month has a first trading day
- No complex calculations needed
- Works for any date range
- Guaranteed signals every single month
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime

class SimpleGuaranteedSignalsScanner:
    """
    Guaranteed Signals Scanner - Finds first trading day of each month
    This pattern ALWAYS exists in any date range
    """

    def __init__(self, start_date=None, end_date=None, symbols=None):
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

        # Allow custom symbols (default to SPY)
        self.symbols = symbols if symbols else ['SPY']

        # Allow custom date range (default to full year 2024)
        self.start_date = start_date if start_date else "2024-01-01"
        self.end_date = end_date if end_date else "2024-12-31"

        print("🎯 Simple Guaranteed Signals Scanner V2")
        print(f"📊 Scanning: {', '.join(self.symbols)}")
        print(f"📅 Date Range: {self.start_date} to {self.end_date}")
        print("📈 Strategy: First Trading Day of Each Month")

    def fetch_data(self, symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetch daily price data from Polygon"""
        print(f"📡 Fetching data for {symbol}...")

        url = f"{self.base_url}/v2/aggs/ticker/{symbol}/range/1/day/{start_date}/{end_date}"
        params = {
            "apiKey": self.api_key,
            "adjusted": "true",
            "sort": "asc",
            "limit": 50000
        }

        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json().get("results", [])
            if not data:
                print(f"⚠️  No data found for {symbol}")
                return pd.DataFrame()

            # Convert to DataFrame
            df = pd.DataFrame(data)
            df['Date'] = pd.to_datetime(df['t'], unit='ms')
            df = df.rename(columns={
                'o': 'Open',
                'h': 'High',
                'l': 'Low',
                'c': 'Close',
                'v': 'Volume'
            })
            df = df.set_index('Date')[['Open', 'High', 'Low', 'Close', 'Volume']]
            df = df.sort_index()

            print(f"✅ Fetched {len(df)} days of data for {symbol}")
            return df

        except Exception as e:
            print(f"❌ Error fetching data for {symbol}: {e}")
            return pd.DataFrame()

    def calculate_signals(self, df: pd.DataFrame, symbol: str) -> list:
        """
        Find first trading day of each month - GUARANTEED to exist
        """
        if df.empty:
            print(f"⚠️  No data for {symbol}")
            return []

        print(f"🔍 Finding first trading days for {symbol}...")

        # Filter to requested date range
        start_dt = pd.to_datetime(self.start_date)
        end_dt = pd.to_datetime(self.end_date)

        # Create a copy to avoid SettingWithCopyWarning
        df_filtered = df[(df.index >= start_dt) & (df.index <= end_dt)].copy()

        if df_filtered.empty:
            print(f"⚠️  No data in date range for {symbol}")
            return []

        # Find first trading day of each month - simpler approach
        df_filtered['YearMonth'] = df_filtered.index.to_period('M')

        # Get first day of each month
        first_days_indices = df_filtered.groupby('YearMonth').apply(lambda x: x.index[0])

        signals = []
        for idx in first_days_indices:
            if idx in df_filtered.index:
                row = df_filtered.loc[idx]

                signal = {
                    'symbol': symbol,
                    'ticker': symbol,
                    'date': idx.strftime('%Y-%m-%d'),
                    'signal_type': 'FIRST_TRADING_DAY',
                    'close_price': round(row['Close'], 2),
                    'open_price': round(row['Open'], 2),
                    'high': round(row['High'], 2),
                    'low': round(row['Low'], 2),
                    'volume': int(row['Volume']),
                    'strength': 'Guaranteed',
                    'entry_price': round(row['Open'], 2),
                    'target_price': round(row['Open'] * 1.02, 2),  # 2% target
                    'stop_loss': round(row['Open'] * 0.99, 2),     # 1% stop loss
                    'strategy': 'First_Trading_Day_Monthly'
                }
                signals.append(signal)

        print(f"✅ Found {len(signals)} first trading day signals for {symbol}")
        return signals

    def run_scan(self):
        """Execute the scan and return results"""
        print("\n" + "="*70)
        print("🎯 SIMPLE GUARANTEED SIGNALS SCAN V2")
        print("="*70)

        all_signals = []

        for symbol in self.symbols:
            # Fetch data (use extended range to ensure we get data)
            extended_start = (pd.to_datetime(self.start_date) - pd.Timedelta(days=10)).strftime('%Y-%m-%d')
            df = self.fetch_data(symbol, extended_start, self.end_date)

            if not df.empty:
                # Calculate signals
                signals = self.calculate_signals(df, symbol)
                all_signals.extend(signals)

                # Display signals
                if signals:
                    print(f"\n📊 {symbol} Signals:")
                    for i, signal in enumerate(signals, 1):
                        print(f"  {i}. {signal['date']}: "
                              f"Open ${signal['open_price']:.2f} | "
                              f"Close ${signal['close_price']:.2f} | "
                              f"Vol: {signal['volume']:,}")

        # Summary
        print("\n" + "="*70)
        print("📊 SCAN SUMMARY")
        print("="*70)
        print(f"Total Signals Found: {len(all_signals)}")

        if all_signals:
            print(f"Symbols Scanned: {len(self.symbols)}")
            print(f"Date Range: {self.start_date} to {self.end_date}")
            print(f"Strategy: First Trading Day of Each Month")

            # Display all signals
            print(f"\n🎯 ALL SIGNALS:")
            print("-"*70)
            for i, signal in enumerate(all_signals, 1):
                print(f"{i}. {signal['ticker']} - {signal['date']}")
                print(f"   Entry: ${signal['entry_price']:.2f} | "
                      f"Target: ${signal['target_price']:.2f} | "
                      f"Stop: ${signal['stop_loss']:.2f}")

        return all_signals


# Required: scan_symbol function (for compatibility with system)
def scan_symbol(symbol: str, start_date: str, end_date: str):
    """
    Scanner entry point for system integration
    """
    scanner = SimpleGuaranteedSignalsScanner(
        start_date=start_date,
        end_date=end_date,
        symbols=[symbol]
    )

    # Fetch data (use extended range)
    extended_start = (pd.to_datetime(start_date) - pd.Timedelta(days=10)).strftime('%Y-%m-%d')
    df = scanner.fetch_data(symbol, extended_start, end_date)

    if df.empty:
        return []

    # Calculate signals
    signals = scanner.calculate_signals(df, symbol)

    return signals


# Main execution
if __name__ == "__main__":
    import sys

    print("🚀 Starting Simple Guaranteed Signals Scanner V2...")

    # Parse command-line arguments
    start_date = None
    end_date = None
    symbols = None

    if len(sys.argv) >= 3:
        start_date = sys.argv[1]
        end_date = sys.argv[2]
        print(f"📅 Custom date range: {start_date} to {end_date}")

    if len(sys.argv) >= 4:
        symbols = sys.argv[3].split(',')
        print(f"📊 Custom symbols: {', '.join(symbols)}")

    # Initialize scanner with custom parameters
    scanner = SimpleGuaranteedSignalsScanner(
        start_date=start_date,
        end_date=end_date,
        symbols=symbols
    )

    signals = scanner.run_scan()

    if signals:
        print(f"\n✅ SUCCESS: Found {len(signals)} guaranteed signals!")
        print("🎯 This scanner is ready for backtest testing")
    else:
        print("\n⚠️  No signals found (check API connection)")

    print("\n" + "="*70)
    print("📋 USAGE EXAMPLES")
    print("="*70)
    print("# Default (2024 full year, SPY only):")
    print("python simple_guaranteed_signals_scanner_v2.py")
    print("")
    print("# Custom date range (Guaranteed 1 signal per month):")
    print("python simple_guaranteed_signals_scanner_v2.py 2024-01-01 2024-03-31")
    print("")
    print("# Multiple symbols:")
    print("python simple_guaranteed_signals_scanner_v2.py 2024-01-01 2024-12-31 SPY,QQQ,IWM")
    print("="*70)
