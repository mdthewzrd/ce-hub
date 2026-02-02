"""
🎯 SIMPLE SPY SCALPING STRATEGY - FOR TESTING
============================================

Moving Average Crossover Strategy:
- Buy when 9-period EMA crosses above 21-period EMA
- Sell when 9-period EMA crosses below 21-period EMA
- Only trades during market hours (9:30 AM - 4:00 PM ET)
- Uses 15-minute timeframe for scalping

GUARANTEED to generate signals for testing!
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import sys

# Polygon API Configuration
API_KEY = "Fm7br4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

class SPYScalpingStrategy:
    """
    Simple Moving Average Crossover Strategy for SPY Scalping

    This is designed to generate LOTS of signals for testing the backtest system.
    """

    def __init__(self, start_date=None, end_date=None):
        self.api_key = API_KEY
        self.base_url = BASE_URL
        self.symbol = "SPY"

        # Default to last 3 months if no dates provided
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')

        self.start_date = start_date
        self.end_date = end_date

        # Strategy parameters
        self.fast_ema_period = 9
        self.slow_ema_period = 21
        self.timeframe = "15min"  # 15-minute bars for scalping

        print(f"🎯 SPY Scalping Strategy Initialized", file=sys.stderr)
        print(f"📅 Period: {start_date} to {end_date}", file=sys.stderr)
        print(f"⚡ Fast EMA: {self.fast_ema_period}, Slow EMA: {self.slow_ema_period}", file=sys.stderr)
        print(f"🕐 Timeframe: {self.timeframe}", file=sys.stderr)

    def fetch_intraday_data(self, start_date, end_date):
        """
        Fetch 15-minute intraday data from Polygon

        For Polygon free tier, we need to fetch day by day
        """
        print(f"📊 Fetching 15-minute data for {self.symbol}...", file=sys.stderr)

        all_data = []
        current_date = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')

        # Fetch data day by day (Polygon API limitation)
        days_fetched = 0
        while current_date <= end_dt:
            date_str = current_date.strftime('%Y-%m-%d')

            # Skip weekends
            if current_date.weekday() >= 5:
                current_date += timedelta(days=1)
                continue

            try:
                # Fetch 15-minute bars for this day
                url = f"{self.base_url}/v2/aggs/ticker/{self.symbol}/range/{self.timeframe}/{date_str}/{date_str}"
                params = {
                    "apiKey": self.api_key,
                    "adjusted": "true",
                    "sort": "asc",
                    "limit": 50000
                }

                response = requests.get(url, params=params, timeout=10)

                if response.ok:
                    data = response.json().get("results", [])
                    if data:
                        all_data.extend(data)
                        days_fetched += 1
                        if days_fetched % 10 == 0:
                            print(f"   Fetched {days_fetched} days so far...", file=sys.stderr)

            except Exception as e:
                print(f"⚠️ Error fetching {date_str}: {e}", file=sys.stderr)

            current_date += timedelta(days=1)

        if not all_data:
            print(f"❌ No data retrieved!", file=sys.stderr)
            return pd.DataFrame()

        print(f"✅ Retrieved {len(all_data)} 15-minute bars across {days_fetched} days", file=sys.stderr)

        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        df['datetime'] = pd.to_datetime(df['t'], unit='ms')
        df = df.rename(columns={
            'o': 'open',
            'h': 'high',
            'l': 'low',
            'c': 'close',
            'v': 'volume'
        })
        df = df.set_index('datetime')[['open', 'high', 'low', 'close', 'volume']]
        df = df.sort_index()

        return df

    def calculate_emas(self, df):
        """Calculate exponential moving averages"""
        df['ema_fast'] = df['close'].ewm(span=self.fast_ema_period, adjust=False).mean()
        df['ema_slow'] = df['close'].ewm(span=self.slow_ema_period, adjust=False).mean()
        return df

    def is_market_hour(self, dt):
        """Check if time is during market hours (9:30 AM - 4:00 PM ET)"""
        time = dt.time()
        return datetime.strptime("09:30", "%H:%M").time() <= time <= datetime.strptime("16:00", "%H:%M").time()

    def generate_signals(self, df):
        """
        Generate trading signals based on EMA crossovers

        Returns list of signals with entry/exit points
        """
        print(f"🔍 Scanning for EMA crossovers...", file=sys.stderr)

        if df.empty:
            print(f"❌ No data to scan!", file=sys.stderr)
            return []

        # Calculate EMAs
        df = self.calculate_emas(df)

        # Filter to market hours only
        df = df[df.index.map(self.is_market_hour)]

        if df.empty:
            print(f"❌ No market hours data!", file=sys.stderr)
            return []

        # Find crossovers
        signals = []
        prev_fast_above = None

        for i in range(1, len(df)):
            current = df.iloc[i]
            previous = df.iloc[i-1]

            # Check if we have valid EMA values
            if pd.isna(current['ema_fast']) or pd.isna(current['ema_slow']):
                continue
            if pd.isna(previous['ema_fast']) or pd.isna(previous['ema_slow']):
                continue

            # Current EMA relationship
            fast_above_now = current['ema_fast'] > current['ema_slow']

            # Previous EMA relationship (if available)
            if prev_fast_above is None:
                prev_fast_above = previous['ema_fast'] > previous['ema_slow']
                continue

            # Check for crossover
            if prev_fast_above and not fast_above_now:
                # Fast EMA crossed below Slow EMA -> SELL signal
                entry_price = current['close']
                signals.append({
                    'symbol': self.symbol,
                    'ticker': self.symbol,
                    'date': current.name.strftime('%Y-%m-%d'),
                    'time': current.name.strftime('%H:%M:%S'),
                    'datetime': current.name.strftime('%Y-%m-%d %H:%M:%S'),
                    'signal_type': 'SELL',
                    'action': 'sell',
                    'close_price': round(current['close'], 2),
                    'entry_price': round(entry_price, 2),
                    'target_price': round(entry_price * 0.98, 2),  # 2% down
                    'stop_loss': round(entry_price * 1.01, 2),   # 1% up
                    'ema_fast': round(current['ema_fast'], 2),
                    'ema_slow': round(current['ema_slow'], 2),
                    'volume': int(current['volume'])
                })
                print(f"   📉 SELL at {current.name} @ ${entry_price:.2f}", file=sys.stderr)

            elif not prev_fast_above and fast_above_now:
                # Fast EMA crossed above Slow EMA -> BUY signal
                entry_price = current['close']
                signals.append({
                    'symbol': self.symbol,
                    'ticker': self.symbol,
                    'date': current.name.strftime('%Y-%m-%d'),
                    'time': current.name.strftime('%H:%M:%S'),
                    'datetime': current.name.strftime('%Y-%m-%d %H:%M:%S'),
                    'signal_type': 'BUY',
                    'action': 'buy',
                    'close_price': round(current['close'], 2),
                    'entry_price': round(entry_price, 2),
                    'target_price': round(entry_price * 1.02, 2),  # 2% up
                    'stop_loss': round(entry_price * 0.99, 2),   # 1% down
                    'ema_fast': round(current['ema_fast'], 2),
                    'ema_slow': round(current['ema_slow'], 2),
                    'volume': int(current['volume'])
                })
                print(f"   📈 BUY at {current.name} @ ${entry_price:.2f}", file=sys.stderr)

            # Update previous state
            prev_fast_above = fast_above_now

        print(f"✅ Generated {len(signals)} trading signals!", file=sys.stderr)
        return signals

    def run_scan(self):
        """
        Run the complete scan strategy

        Returns:
            List of signal dictionaries
        """
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"🚀 STARTING SPY SCALPING SCAN", file=sys.stderr)
        print(f"{'='*60}\n", file=sys.stderr)

        # Fetch data
        df = self.fetch_intraday_data(self.start_date, self.end_date)

        if df.empty:
            print(f"❌ No data available for this period", file=sys.stderr)
            return []

        # Generate signals
        signals = self.generate_signals(df)

        print(f"\n{'='*60}", file=sys.stderr)
        print(f"📊 SCAN COMPLETE", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        print(f"Total Signals: {len(signals)}", file=sys.stderr)

        if signals:
            buy_signals = [s for s in signals if s['signal_type'] == 'BUY']
            sell_signals = [s for s in signals if s['signal_type'] == 'SELL']
            print(f"  BUY signals: {len(buy_signals)}", file=sys.stderr)
            print(f"  SELL signals: {len(sell_signals)}", file=sys.stderr)

        print(f"{'='*60}\n", file=sys.stderr)

        return signals


# Main execution
if __name__ == "__main__":
    # Get dates from command line or use defaults
    start_date = sys.argv[1] if len(sys.argv) >= 2 else "2024-01-01"
    end_date = sys.argv[2] if len(sys.argv) >= 3 else "2024-03-31"

    print(f"\n🎯 SIMPLE SPY SCALPING STRATEGY", file=sys.stderr)
    print(f"Moving Average Crossover (9/21 EMA)", file=sys.stderr)
    print(f"Timeframe: 15-minute", file=sys.stderr)
    print(f"Date Range: {start_date} to {end_date}\n", file=sys.stderr)

    # Run the strategy
    strategy = SPYScalpingStrategy(start_date=start_date, end_date=end_date)
    signals = strategy.run_scan()

    # Output results (will be captured by backend)
    print(f"\nTotal Signals Found: {len(signals)}")

    if signals:
        print("\nRecent Signals:")
        for signal in signals[-10:]:  # Show last 10 signals
            print(f"  {signal['date']} {signal['time']}: {signal['signal_type']} @ ${signal['entry_price']:.2f}")

    # Return as list for backend processing
    results = signals
