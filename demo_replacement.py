#!/usr/bin/env python3
"""
Demo: How to replace hardcoded symbols with universal market coverage
"""

# BEFORE: Hardcoded symbols (limited to ~100 tickers)
SYMBOLS = [
    'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
    'NFLX','SNAP','RBLX','META','SE','NVDA','AAPL','MSFT','GOOGL','AMZN','TSLA',
    'AMD','INTC','BA','PYPL','QCOM','ORCL','KO','PEP','ABBV','JNJ','CRM','BAC',
    'JPM','WMT','CVX','XOM','COP','RTX','SPGI','GS','HD','LOW','COST','UNH','NKE',
    'LMT','HON','CAT','LIN','ADBE','AVGO','TXN','ACN','UPS','BLK','PM','ELV','VRTX',
    'ZTS','NOW','ISRG','PLD','MS','MDT','WM','GE','IBM','BKNG','FDX','ADP','EQIX',
    'DHR','SNPS','REGN','SYK','TMO','CVS','INTU','SCHW','CI','APD','SO','MMC','ICE',
    'FIS','ADI','CSX','LRCX','GILD','RIVN','PLTR','SNOW','SPY','QQQ','IWM','RIOT',
    'MARA','COIN','MRNA','CELH','UPST','AFRM','DKNG'
]
print(f"📊 BEFORE: {len(SYMBOLS)} hardcoded symbols")

# AFTER: Universal market coverage (thousands of tickers)
import aiohttp
import asyncio
from datetime import datetime, timedelta

async def fetch_market_universe():
    """Fetch ALL market tickers - this replaces the hardcoded list"""
    API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
    all_tickers = set()

    # Get recent trading days
    end_date = datetime.now()
    dates = []
    for i in range(5):
        date = end_date - timedelta(days=i)
        if date.weekday() < 5:
            dates.append(date.strftime("%Y-%m-%d"))
        if len(dates) >= 3:
            break

    print(f"🔍 Fetching universe for: {dates}")

    async with aiohttp.ClientSession() as session:
        tasks = []
        for date in dates:
            url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted=true&apiKey={API_KEY}"
            tasks.append(session.get(url))

        responses = await asyncio.gather(*tasks)
        for response in responses:
            if response.status == 200:
                data = await response.json()
                for ticker_data in data.get("results", []):
                    symbol = ticker_data.get("T")
                    if symbol and ticker_data.get("c", 0) > 1.0:  # Exclude penny stocks
                        all_tickers.add(symbol)

    universe = sorted(list(all_tickers))
    print(f"📊 AFTER: {len(universe)} universe tickers")
    return universe

# Usage: Replace the hardcoded SYMBOLS with:
# SYMBOLS = asyncio.run(fetch_market_universe())

if __name__ == "__main__":
    print("🚀 Demo: Universal Market Coverage vs Hardcoded Symbols")
    print("=" * 60)
    print()
    print("REPLACEMENT NEEDED:")
    print("  Change: SYMBOLS = ['AAPL', 'MSFT', ...]  # 100 symbols")
    print("  To:     SYMBOLS = asyncio.run(fetch_market_universe())  # 5000+ symbols")
    print()
    print("🎯 This gives you COMPLETE market coverage instead of a limited sample!")