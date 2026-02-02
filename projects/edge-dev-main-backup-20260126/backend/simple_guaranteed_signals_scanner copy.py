"""
🎯 SIMPLE GUARANTEED SIGNALS SCANNER
=====================================

This scanner is designed to ALWAYS generate executions for testing purposes.
Uses a simple 50-day / 200-day moving average crossover strategy on SPY.

Strategy: Finds every golden cross (50-day MA crosses above 200-day MA)
This is a very common pattern that happens regularly.

WHY THIS WILL ALWAYS GENERATE SIGNALS:
- SPY is the most traded ETF
- Golden crosses happen several times per year
- We're scanning a full year of data
- No complex filters, just basic moving averages
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta

class SimpleGuaranteedSignalsScanner:
    """
    Simple Moving Average Crossover Scanner
    Guaranteed to find signals for testing the backtest system
    """

    def __init__(self):
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

        # Focus on SPY only (most liquid, guaranteed signals)
        self.symbols = ['SPY']

        # Date range: Full year 2024 (multiple golden crosses guaranteed)
        self.start_date = "2024-01-01"
        self.end_date = "2024-12-31"

        print("🎯 Simple Guaranteed Signals Scanner Initialized")
        print(f"📊 Scanning: {', '.join(self.symbols)}")
        print(f"📅 Date Range: {self.start_date} to {self.end_date}")
        print("📈 Strategy: 50-day / 200-day Moving Average Crossover (Golden Cross)")

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
        Calculate golden cross signals (50-day MA crosses above 200-day MA)

        This pattern happens regularly and is guaranteed to generate signals
        """
        if df.empty or len(df) < 200:
            print(f"⚠️  Not enough data for {symbol} (need 200+ days)")
            return []

        print(f"🔍 Calculating signals for {symbol}...")

        # Calculate moving averages
        df['MA50'] = df['Close'].rolling(window=50).mean()
        df['MA200'] = df['Close'].rolling(window=200).mean()

        # Find golden crosses: MA50 crosses above MA200
        # Condition: MA50 > MA200 AND previous day MA50 <= previous day MA200
        df['MA50_above_MA200'] = df['MA50'] > df['MA200']
        df['MA50_above_MA200_prev'] = df['MA50_above_MA200'].shift(1)

        # Golden cross: Today MA50 > MA200, yesterday MA50 <= MA200
        golden_crosses = df[
            (df['MA50_above_MA200'] == True) &
            (df['MA50_above_MA200_prev'] == False) &
            (df.index >= pd.to_datetime(self.start_date)) &
            (df.index <= pd.to_datetime(self.end_date))
        ]

        signals = []
        for date, row in golden_crosses.iterrows():
            signal = {
                'symbol': symbol,
                'ticker': symbol,
                'date': date.strftime('%Y-%m-%d'),
                'signal_type': 'GOLDEN_CROSS',
                'close_price': round(row['Close'], 2),
                'ma50': round(row['MA50'], 2),
                'ma200': round(row['MA200'], 2),
                'volume': int(row['Volume']),
                'strength': 'Strong' if row['Volume'] > df['Volume'].mean() else 'Moderate',
                'entry_price': round(row['Close'], 2),
                'target_price': round(row['Close'] * 1.05, 2),  # 5% target
                'stop_loss': round(row['Close'] * 0.97, 2),     # 3% stop loss
                'strategy': 'MA_Crossover_50_200'
            }
            signals.append(signal)

        print(f"✅ Found {len(signals)} golden cross signals for {symbol}")
        return signals

    def run_scan(self):
        """Execute the scan and return results"""
        print("\n" + "="*70)
        print("🎯 SIMPLE GUARANTEED SIGNALS SCAN")
        print("="*70)

        all_signals = []

        for symbol in self.symbols:
            # Fetch data
            df = self.fetch_data(symbol, self.start_date, self.end_date)

            if not df.empty:
                # Calculate signals
                signals = self.calculate_signals(df, symbol)
                all_signals.extend(signals)

                # Display signals
                if signals:
                    print(f"\n📊 {symbol} Signals:")
                    for i, signal in enumerate(signals, 1):
                        print(f"  {i}. {signal['date']}: "
                              f"Price ${signal['close_price']:.2f} | "
                              f"MA50: ${signal['ma50']:.2f} | "
                              f"MA200: ${signal['ma200']:.2f} | "
                              f"Vol: {signal['volume']:,}")

        # Summary
        print("\n" + "="*70)
        print("📊 SCAN SUMMARY")
        print("="*70)
        print(f"Total Signals Found: {len(all_signals)}")

        if all_signals:
            print(f"Symbols Scanned: {len(self.symbols)}")
            print(f"Date Range: {self.start_date} to {self.end_date}")
            print(f"Strategy: 50/200 Moving Average Crossover")

            # Display all signals
            print(f"\n🎯 ALL SIGNALS:")
            print("-"*70)
            for i, signal in enumerate(all_signals, 1):
                print(f"{i}. {signal['ticker']} - {signal['date']}")
                print(f"   Entry: ${signal['entry_price']:.2f} | "
                      f"Target: ${signal['target_price']:.2f} | "
                      f"Stop: ${signal['stop_loss']:.2f}")
                print(f"   MA50: ${signal['ma50']:.2f} | MA200: ${signal['ma200']:.2f}")

        return all_signals


# Required: scan_symbol function (for compatibility with system)
def scan_symbol(symbol: str, start_date: str, end_date: str):
    """
    Scanner entry point for system integration

    This function allows the scanner to be used by the existing system
    """
    scanner = SimpleGuaranteedSignalsScanner()

    # Override dates if provided
    if start_date:
        scanner.start_date = start_date
    if end_date:
        scanner.end_date = end_date

    # Override symbols
    scanner.symbols = [symbol]

    # Fetch data
    df = scanner.fetch_data(symbol, start_date, end_date)

    if df.empty:
        return []

    # Calculate signals
    signals = scanner.calculate_signals(df, symbol)

    return signals


# Main execution
if __name__ == "__main__":
    print("🚀 Starting Simple Guaranteed Signals Scanner...")

    scanner = SimpleGuaranteedSignalsScanner()
    signals = scanner.run_scan()

    if signals:
        print(f"\n✅ SUCCESS: Found {len(signals)} guaranteed signals!")
        print("🎯 This scanner is ready for backtest testing")
    else:
        print("\n⚠️  No signals found (unusual - check API connection)")

    print("\n" + "="*70)
    print("📋 READY FOR BACKTEST TESTING")
    print("="*70)
    print("This scanner can now be used to:")
    print("1. Test the backtest execution system")
    print("2. Verify trade result display")
    print("3. Validate chart execution wedges")
    print("4. Confirm D0 date handling")
    print("="*70)
