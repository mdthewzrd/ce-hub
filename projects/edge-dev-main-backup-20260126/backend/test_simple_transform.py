#!/usr/bin/env python3
"""Simple test to see generated code"""
import sys
from pathlib import Path

renata_v2_path = Path(__file__).parent.parent / "RENATA_V2"
sys.path.insert(0, str(renata_v2_path.parent))

# Proper standalone scanner test code (with all indicators)
TEST_CODE = '''
"""
Backside Para B Scanner - Standalone Implementation
"""
import requests
import pandas as pd
import numpy as np

# Configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Parameters
P = {
    "price_min": 8.0,
    "adv20_min_usd": 30_000_000,
    "gap_div_atr_min": 0.75,
    "abs_lookback_days": 1000,
}

# Universe
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']

# Date range
PRINT_FROM = "2024-01-01"
PRINT_TO = "2024-12-31"

def fetch_daily(tkr: str, start: str, end: str) -> pd.DataFrame:
    """Fetch daily data for a ticker"""
    url = f"{BASE_URL}/v2/aggs/ticker/{tkr}/range/1/day/{start}/{end}"
    params = {"apiKey": API_KEY, "adjust": "true"}
    response = requests.get(url, params=params)
    data = response.json().get('results', [])

    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
    df = df.rename(columns={
        'o': 'open',
        'h': 'high',
        'l': 'low',
        'c': 'close',
        'v': 'volume'
    })
    return df[['date', 'open', 'high', 'low', 'close', 'volume']]

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Add technical indicators"""
    m = df.sort_values('date').copy()

    # Previous close
    m['prev_close'] = m['close'].shift(1)

    # EMA
    m['ema_9'] = m['close'].ewm(span=9, adjust=False).mean()
    m['ema_20'] = m['close'].ewm(span=20, adjust=False).mean()

    # ATR
    hi_lo = m['high'] - m['low']
    hi_prev = (m['high'] - m['close'].shift(1)).abs()
    lo_prev = (m['low'] - m['close'].shift(1)).abs()
    m['tr'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m['atr_raw'] = m['tr'].rolling(14, min_periods=14).mean()
    m['atr'] = m['atr_raw'].shift(1)

    # ADV20
    m['adv20_usd'] = (m['close'] * m['volume']).rolling(20, min_periods=20).mean()

    return m

def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan a single symbol"""
    df = fetch_daily(sym, start, end)
    if df.empty:
        return pd.DataFrame()

    m = add_daily_metrics(df)

    rows = []
    for i in range(2, len(m)):
        d0 = m.iloc[i]['date']

        # Only consider dates in our print range
        if d0 < pd.to_datetime(PRINT_FROM).date() or d0 > pd.to_datetime(PRINT_TO).date():
            continue

        r0 = m.iloc[i]
        r1 = m.iloc[i-1]
        r2 = m.iloc[i-2]

        # Calculate gap
        gap = (r0['open'] / r1['close']) - 1

        # Signal conditions
        if (r0['close'] >= P['price_min'] and
            r0['adv20_usd'] >= P['adv20_min_usd'] and
            abs(gap) / r0['atr'] >= P['gap_div_atr_min']):

            rows.append({
                'Ticker': sym,
                'Date': d0.strftime('%Y-%m-%d'),
                'Close': r0['close'],
                'Gap': gap,
                'Gap/ATR': abs(gap) / r0['atr'],
            })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    # Historical buffer needed for ABS window
    from datetime import timedelta
    start_buffer = (pd.to_datetime(PRINT_FROM) - pd.Timedelta(days=1100)).strftime('%Y-%m-%d')

    results = []
    for s in SYMBOLS:
        df = scan_symbol(s, start_buffer, PRINT_TO)
        if not df.empty:
            results.append(df)

    if results:
        final = pd.concat(results, ignore_index=True)
        print(final.to_string(index=False))
    else:
        print("No signals found")
'''

print("Testing transformation...")
print("=" * 70)

from RENATA_V2.core.transformer import RenataTransformer

transformer = RenataTransformer()
result = transformer.transform(
    source_code=TEST_CODE,
    scanner_name="BacksideParaBV31",
    date_range="2024-01-01 to 2024-12-31",
    verbose=True
)

# Save generated code to file for inspection
output_path = Path("/tmp/generated_v31_code.py")
with open(output_path, 'w') as f:
    f.write(result.generated_code or "")

print(f"\nGenerated code saved to: {output_path}")
print(f"Code length: {len(result.generated_code) if result.generated_code else 0} characters")

# Try to compile and show syntax errors
if result.generated_code:
    try:
        compile(result.generated_code, '<string>', 'exec')
        print("✅ Generated code compiles successfully!")
    except SyntaxError as e:
        print(f"❌ Syntax error at line {e.lineno}: {e.msg}")
        if e.text:
            print(f"   Code: {e.text.strip()}")

        # Show context around error
        lines = result.generated_code.split('\n')
        start = max(0, e.lineno - 3)
        end = min(len(lines), e.lineno + 2)
        print("\nContext:")
        for i in range(start, end):
            marker = " >>> " if i == e.lineno - 1 else "     "
            print(f"{marker}{i+1:4d}: {lines[i]}")
