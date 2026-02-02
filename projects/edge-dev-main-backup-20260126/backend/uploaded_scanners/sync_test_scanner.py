"""
Simple Sync Test Scanner - No Async
"""

# Required date variables
START_DATE = "2024-01-01"
END_DATE = "2024-12-31"

# Global results variable - defined before execution
results = []

def main():
    """Main function - populates global results"""
    global results

    results = [
        {
            'ticker': 'AAPL',
            'date': '2024-12-15',
            'gap': 0.05,
            'open': 180.50,
            'close': 182.30,
            'volume': 50000000,
            'pm_vol': 40000000,
            'score': 5.0
        },
        {
            'ticker': 'TSLA',
            'date': '2024-12-16',
            'gap': 0.08,
            'open': 250.00,
            'close': 255.50,
            'volume': 75000000,
            'pm_vol': 60000000,
            'score': 8.0
        },
        {
            'ticker': 'NVDA',
            'date': '2024-12-17',
            'gap': 0.06,
            'open': 480.00,
            'close': 490.20,
            'volume': 60000000,
            'pm_vol': 50000000,
            'score': 6.0
        }
    ]

    print(f"🔍 Test scanner - returning {len(results)} hardcoded results")
    return results

if __name__ == "__main__":
    main()
