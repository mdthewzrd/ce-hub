"""
Simple Test Scanner - Sets results variable directly
"""

from datetime import datetime, timedelta

# Simple test results
results = [
    {
        'ticker': 'AAPL',
        'date': '2024-12-15',
        'gap': 0.05,
        'volume': 50000000,
        'signal': 'Test Signal'
    },
    {
        'ticker': 'TSLA',
        'date': '2024-12-16',
        'gap': 0.08,
        'volume': 75000000,
        'signal': 'Test Signal'
    },
    {
        'ticker': 'NVDA',
        'date': '2024-12-17',
        'gap': 0.06,
        'volume': 60000000,
        'signal': 'Test Signal'
    }
]

print("=" * 80)
print(f"{'Ticker':<8} {'Date':<12} {'Gap %':<10} {'Volume':<15}")
print("=" * 80)

for r in results:
    print(f"{r['ticker']:<8} {r['date']:<12} {r['gap']*100:<10.1f} {r['volume']:<15,}")

print("=" * 80)
print(f"✅ Test scanner executed - {len(results)} results")
