#!/usr/bin/env python3
"""
Debug script to test chart API functionality
"""
import os
import asyncio
import httpx
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY", "Fm7brz4s23eSocDErnL68cE7wspz2K1I")
POLYGON_BASE_URL = "https://api.polygon.io"

async def test_polygon_api():
    """Test direct Polygon API connection"""
    ticker = "SPY"
    timeframe = "5min"
    target_date = "2024-11-15"

    # Convert timeframe to Polygon API format
    multiplier, timespan = 5, 'minute'

    # Calculate date range
    target_dt = datetime.strptime(target_date, "%Y-%m-%d")
    start_date = target_dt - timedelta(days=2)

    start_str = start_date.strftime("%Y-%m-%d")
    end_str = target_date

    url = f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{start_str}/{end_str}"

    params = {
        'apikey': POLYGON_API_KEY,
        'adjusted': 'true',
        'sort': 'asc',
        'limit': 50000
    }

    logger.info(f"Testing Polygon API with URL: {url}")
    logger.info(f"API Key: {POLYGON_API_KEY[:10]}...")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            logger.info(f"Response status: {response.status_code}")

            if response.status_code != 200:
                logger.error(f"HTTP Error: {response.status_code}")
                logger.error(f"Response text: {response.text}")
                return None

            data = response.json()
            logger.info(f"Response keys: {list(data.keys())}")

            if 'results' in data and data['results']:
                results = data['results']
                logger.info(f"Found {len(results)} data points")
                logger.info(f"Sample data point: {results[0]}")

                # Check price ranges
                prices = [bar['c'] for bar in results]
                logger.info(f"Price range: ${min(prices):.2f} - ${max(prices):.2f}")

                return data
            else:
                logger.warning(f"No results found in response: {data}")
                return None

    except Exception as e:
        logger.error(f"Error making request: {str(e)}")
        return None

async def test_chart_data_conversion():
    """Test data conversion to chart format"""
    data = await test_polygon_api()

    if not data or 'results' not in data:
        logger.error("No data to convert")
        return

    bars = data['results']

    # Convert to chart format
    chart_data = {
        'x': [datetime.fromtimestamp(bar['t'] / 1000).isoformat() for bar in bars],
        'open': [bar['o'] for bar in bars],
        'high': [bar['h'] for bar in bars],
        'low': [bar['l'] for bar in bars],
        'close': [bar['c'] for bar in bars],
        'volume': [bar['v'] for bar in bars]
    }

    logger.info(f"Converted chart data:")
    logger.info(f"- Data points: {len(chart_data['x'])}")
    logger.info(f"- Date range: {chart_data['x'][0]} to {chart_data['x'][-1]}")
    logger.info(f"- Price range: ${min(chart_data['close']):.2f} - ${max(chart_data['close']):.2f}")

    # Check for proper scaling
    if min(chart_data['close']) < 10:
        logger.warning(f"⚠️ LOW PRICES DETECTED! Min close: ${min(chart_data['close']):.2f}")
        logger.warning("This suggests data scaling issues")

    return chart_data

async def main():
    """Main debug function"""
    logger.info("🔍 Starting Chart API Debug...")

    # Test 1: Direct API connection
    logger.info("\n📊 Test 1: Direct Polygon API connection")
    await test_polygon_api()

    # Test 2: Data conversion
    logger.info("\n🔄 Test 2: Data conversion to chart format")
    await test_chart_data_conversion()

    logger.info("\n✅ Debug complete!")

if __name__ == "__main__":
    asyncio.run(main())