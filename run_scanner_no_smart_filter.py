#!/usr/bin/env python3
"""
Run the smart filtering scanner but disable the smart filtering to get full universe
"""

import sys
import os
import subprocess
from pathlib import Path

def create_no_filter_scanner():
    """Create a version of the smart filtering scanner with filtering disabled"""
    smart_path = Path("/Users/michaeldurante/Downloads/formatted backside para b with smart filtering.py")

    # Read the smart filtering scanner
    with open(smart_path, 'r') as f:
        content = f.read()

    # Replace the smart filtering with a hardcoded large symbol list
    # First, find and replace the SYMBOLS assignment
    symbols_list = """SYMBOLS = [
    'AAPL','MSFT','GOOGL','AMZN','TSLA','META','NVDA','AMD','INTC','BABA','TSM','JPM','V','MA','HD','PG','JNJ',
    'UNH','PYPL','DIS','ADBE','CRM','NFLX','ACN','NVDA','CSCO','PEP','COST','CMCSA','NKE','ABT','T','TXN','CVX',
    'BA','WFC','IBM','GE','KO','XOM','CVS','MDT','TMO','ABNB','DHR','QCOM','HON','UPS','CAT','LIN','AMGN','SBUX',
    'PLD','LMT','LOW','RTX','SPGI','AMAT','NOW','ISRG','BLK','ICE','GS','MS','BKNG','ADI','AVGO','TXN','SNPS','REGN',
    'SYK','ELV','VRTX','ZTS','MMM','DE','CAT','GE','GE','HON','RTX','UPS','CAT','LMT','BA','NOC','GD','LDOS',
    'MU','AMD','INTC','NVDA','QCOM','TXN','ADI','AVGO','MRVL','LRCX','KLAC','ASML','TSM','UMC','SMCI','DELL','HPQ',
    'AAPL','MSFT','GOOGL','AMZN','META','TSLA','NVDA','NFLX','DIS','CMCSA','ROKU','SBUX','EBAY','PTON','ZM','DOCU',
    'SPOT','TWTR','SNAP','RBLX','PLTR','SNOW','CRWD','ZS','OKTA','NOW','DDOG','NET','SQ','PYPL','COIN','MSTR','RIOT',
    'MARA','GOOGL','GOOG','META','FB','AAPL','MSFT','AMZN','TSLA','NVDA','AMD','BABA','JD','PDD','BIDU','NIO','XPEV',
    'LI','TME','NTES','SNY','BIDU','BABA','JD','PDD','BILI','HUYA','YY','IQ','NIO','XPEV','LI','TME','VIPS','JOY',
    'DL','BIDU','BABA','JD','PDD','NTES','NIO','XPEV','LI','TME','VIPS','YY','HUYA','BILI','WB','FUTU','TIGR',
    'NIO','XPEV','LI','TME','VIPS','YY','HUYA','BILI','WB','FUTU','TIGR','QFIN','LUCKY','HZO','NQ','DQ',
    'BABA','JD','PDD','BIDU','NTES','TME','NIO','XPEV','LI','VIPS','YY','HUYA','BILI','WB','FUTU','TIGR',
    'SNAP','TWTR','FB','META','GOOGL','GOOG','AMZN','AAPL','MSFT','NFLX','DIS','CMCSA','ROKU','SBUX','EBAY',
    'PTON','ZM','DOCU','SPOT','SQ','PYPL','COIN','MSTR','RIOT','MARA','CRWD','ZS','OKTA','NOW','DDOG','NET'
]"""

    # Replace the smart filtering symbols assignment
    content = content.replace('SYMBOLS = get_enhanced_symbols()  # Universal market coverage (replaced hardcoded list)', symbols_list)

    # Modify date range
    content = content.replace('fetch_start = "2020-01-01"', 'fetch_start = "2025-01-01"')
    content = content.replace('fetch_end   = datetime.today().strftime("%Y-%m-%d")', 'fetch_end   = "2025-11-01"')

    # Write to temp file
    temp_path = Path("/Users/michaeldurante/ai dev/ce-hub/temp_no_filter_scanner.py")
    with open(temp_path, 'w') as f:
        f.write(content)

    return temp_path

def run_no_filter():
    """Run the scanner without smart filtering"""
    print("🏃 RUNNING BACKSIDE B SCANNER - NO SMART FILTERING")
    print("=" * 70)
    print("📅 Date Range: 1/1/25 - 11/1/25")
    print("🎯 Full Parameters: $8.00 min price, $30M min ADV, 15M min D-1 volume")
    print("📊 Symbol List: ~200 tickers (including BABA)")
    print("🚫 Smart Filtering: DISABLED")
    print()

    # Create modified scanner
    temp_scanner = create_no_filter_scanner()

    try:
        # Run the scanner
        result = subprocess.run([
            "python3", str(temp_scanner)
        ], capture_output=True, text=True, timeout=600)  # 10 minute timeout

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        if result.returncode == 0:
            print("\n✅ SCANNER COMPLETED SUCCESSFULLY")
        else:
            print(f"\n❌ SCANNER FAILED with return code {result.returncode}")

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        print("\n⏰ SCANNER TIMEOUT - taking too long")
        return False
    except Exception as e:
        print(f"\n❌ SCANNER ERROR: {e}")
        return False
    finally:
        # Clean up temp file
        if temp_scanner.exists():
            temp_scanner.unlink()

def main():
    """Main runner"""
    print("🧪 BACKSIDE B SCANNER TEST - NO SMART FILTERING")
    print("Proving that smart filtering is reducing the symbol universe too much")
    print("=" * 80)

    success = run_no_filter()

    print("\n" + "=" * 80)
    if success:
        print("🎉 SCANNER EXECUTION COMPLETED")
        print("This should show many more results, including BABA if it meets the criteria")
    else:
        print("❌ SCANNER EXECUTION FAILED")

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)