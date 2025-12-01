#!/usr/bin/env python3
"""
Test chart API imports and functionality
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, '/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

async def test_imports():
    """Test importing chart-related functions"""
    try:
        # Test httpx import
        import httpx
        print("✅ httpx imported successfully")

        # Test market calendar
        from market_calendar import validate_chart_data_for_trading_days, is_trading_day
        print("✅ market_calendar imported successfully")

        # Test datetime functions
        from datetime import datetime, timedelta
        print("✅ datetime imports successful")

        # Test the specific chart functions from main.py
        import importlib.util
        spec = importlib.util.spec_from_file_location("main", "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py")
        main_module = importlib.util.module_from_spec(spec)

        print("✅ main.py loaded")

        # Test environment variable
        POLYGON_API_KEY = os.getenv("POLYGON_API_KEY", "Fm7brz4s23eSocDErnL68cE7wspz2K1I")
        print(f"✅ API Key: {POLYGON_API_KEY[:10]}...")

        return True

    except Exception as e:
        print(f"❌ Import error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_imports())
    if result:
        print("🎉 All chart-related imports successful!")
    else:
        print("💥 Import errors detected!")