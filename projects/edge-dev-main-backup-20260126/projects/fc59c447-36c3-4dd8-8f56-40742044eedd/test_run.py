import sys
sys.path.insert(0, '.')

# Set API key
import os
os.environ['POLYGON_API_KEY'] = 'Fm7brz4s23eSocDErnL68cE7wspz2K1I'

# Import the scanner
from scanner import backside_para_b_copy_3

# Test with small date range
print("🧪 Testing Backside Para B Scanner...")
print("=" * 60)

# Create scanner instance
scanner = backside_para_b_copy_3()

# Test fetch_grouped_daily
print("\n✅ Testing Stage 1: Fetch Grouped Data...")
try:
    from datetime import datetime, timedelta
    test_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    print(f"Fetching data for {test_date}...")
    
    result = scanner.fetch_grouped_data("2025-01-02", "2025-01-02")
    
    if not result.empty:
        print(f"✅ SUCCESS: Fetched {len(result)} records")
        print(f"Columns: {list(result.columns)}")
        print(f"Sample data:\n{result.head(3)}")
    else:
        print("⚠️  No data returned")
        
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
