"""
Quick script to check trading history for backside scanner results
"""
import requests
import pandas as pd
from datetime import datetime, timedelta

# API key
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Tickers to check (from the valid results)
TICKERS = [
    "PATH", "ZETA", "QUBT", "RGTI", "OKLO", "IREN", "CONL", "TEM", "FLG",
    "SOXL", "BULL", "B", "CLSK", "TSLL", "TLRY", "INTC", "BMNR", "RKT",
    "CLF", "SBET", "USAR", "SOUN", "CNQ", "XOM", "GME", "AMD", "NVDL",
    "NVDX", "RUN", "ETHA", "LYFT", "TTD", "QID", "SH", "SOXS", "SPDN",
    "SQQQ", "TZA", "VXX", "MSTZ", "U", "SMCI", "RXRX", "TDOC", "BABA"
]

def check_ticker_history(ticker: str):
    """Check how many days of trading history a ticker has"""
    try:
        # Fetch all available data
        url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/2020-01-01/2025-12-22"
        params = {
            "apiKey": API_KEY,
            "adjusted": "true",
            "sort": "asc",
            "limit": 50000
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json().get("results", [])
        days_count = len(data)

        if days_count == 0:
            return None

        # Get first and last dates
        first_date = pd.to_datetime(data[0]["t"], unit="ms").strftime("%Y-%m-%d")
        last_date = pd.to_datetime(data[-1]["t"], unit="ms").strftime("%Y-%m-%d")

        # Check if it has 700 days
        has_700 = days_count >= 700
        has_400 = days_count >= 400
        has_300 = days_count >= 300

        return {
            "ticker": ticker,
            "days": days_count,
            "first_date": first_date,
            "last_date": last_date,
            "has_700": has_700,
            "has_400": has_400,
            "has_300": has_300
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}

def main():
    print("Checking trading history for backside scanner results...")
    print("=" * 80)

    results = []
    for ticker in TICKERS:
        result = check_ticker_history(ticker)
        results.append(result)

    # Sort by days count
    results.sort(key=lambda x: x.get("days", 0) if "error" not in x else 0)

    # Print results
    print(f"\n{'Ticker':<8} {'Days':<8} {'First Date':<12} {'Last Date':<12} {'>=700':<8} {'>=400':<8} {'>=300':<8}")
    print("-" * 80)

    below_700 = []
    for r in results:
        if "error" in r:
            print(f"{r['ticker']:<8} ERROR: {r['error']}")
        else:
            status_700 = "✅" if r['has_700'] else "❌"
            status_400 = "✅" if r['has_400'] else "❌"
            status_300 = "✅" if r['has_300'] else "❌"
            print(f"{r['ticker']:<8} {r['days']:<8} {r['first_date']:<12} {r['last_date']:<12} {status_700:<8} {status_400:<8} {status_300:<8}")

            if not r['has_700']:
                below_700.append(r)

    print("\n" + "=" * 80)
    print(f"Total tickers checked: {len(results)}")
    print(f"Tickers below 700 days: {len(below_700)}")

    if below_700:
        print("\n⚠️  TICKERS THAT WOULD BE FILTERED OUT BY 700-DAY CHECK:")
        for r in below_700:
            print(f"  - {r['ticker']}: {r['days']} days (from {r['first_date']})")

    # Find optimal threshold
    print("\n" + "=" * 80)
    print("THRESHOLD ANALYSIS:")
    for threshold in [200, 250, 300, 350, 400, 500, 600, 700]:
        count = sum(1 for r in results if "error" not in r and r['days'] >= threshold)
        print(f"  {threshold}-day minimum: {count}/{len(results)} tickers pass ({count/len(results)*100:.1f}%)")

if __name__ == "__main__":
    main()
