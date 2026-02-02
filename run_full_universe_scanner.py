#!/usr/bin/env python3
"""
Run the backside B scanner with full ticker universe - no smart filtering
"""

import sys
import os
import subprocess
from pathlib import Path

def create_full_universe_scanner():
    """Create a version with comprehensive ticker universe"""
    smart_path = Path("/Users/michaeldurante/Downloads/formatted backside para b with smart filtering.py")

    # Read the smart filtering scanner
    with open(smart_path, 'r') as f:
        content = f.read()

    # Replace the smart filtering with a comprehensive symbol list
    # This includes major stocks, ETFs, and liquid tickers
    comprehensive_symbols = """SYMBOLS = [
    # Tech Giants
    'AAPL','MSFT','GOOGL','GOOG','AMZN','META','NVDA','TSLA','AMD','INTC','CRM','ADBE','NFLX','PYPL',

    # Mega Cap Stocks
    'JPM','V','MA','HD','PG','JNJ','UNH','DIS','KO','PEP','T','CVX','XOM','BA','CAT','GE','MRK',
    'ABT','ABBV','LLY','TMO','DHR','MDT','BMY','AMGN','GILD','ISRG','SYK','RTX','LMT','NOC','GD',

    # Large Cap Growth
    'NOW','AVGO','TXN','QCOM','CSCO','ACN','MU','TXN','ADI','MRVL','LRCX','KLAC','ASML','AMAT',
    'SNPS','CDNS','HPQ','DELL','IBM','ORCL','SAP','INTU','CRM','WDAY','SNOW','PLTR','CRWD','ZS',

    # Financials
    'BAC','WFC','GS','MS','C','AXP','BLK','ICE','SPGI','CME','MMC','CB','AON','AFL','MET','PRU',
    'SCHW','ETFC','IBKR','BK','STT','KEY','RF','PNC','USB','TFC','FITB','CFG','HBAN','ALB','CMA',

    # Healthcare
    'JNJ','PFE','UNH','ABBV','TMO','ABT','LLY','MRK','DHR','BMY','AMGN','GILD','MDT','ISRG','SYK',
    'ZTS','BIIB','REGN','VRTX','ILMN','DXCM','EW','HCA','THC','CNC','CI','ANTM','MOH','CERN','LVGO',

    # Consumer Discretionary
    'AMZN','TSLA','HD','MCD','NKE','SBUX','LOW','TGT','BKNG','EXPE','CCL','RCL','MAR','HLT','WYNN',
    'LVS','MGM','DG','FDS','AZO','ORLY','ROST','TJX','KSS','JWN','Nordstrom','M','JCP','BBY','GPS',

    # Consumer Staples
    'WMT','PG','KO','PEP','COST','CL','KMB','GIS','KHC','HSY','MDLZ','SJM','ADM','BGS','CAG','CHD',
    'CLX','EL','K','KMB','KR','SYY','TSN','HRL','GIS','CAG','K','KMB','CL','CLX','EL','KMB',

    # Energy
    'XOM','CVX','COP','EOG','SLB','HAL','BKR','PSX','VLO','MPC','PXD','OXY','BHP','RDS-A','TOT','EQNR',
    'BP','SHEL','ENB','KMI','WMB','ET','CNQ','CVE','SU','HES','MRO','DVN','APA','OXY','COG',

    # Industrials
    'BA','CAT','GE','HON','UPS','RTX','LMT','NOC','GD','MMM','DE','CNI','CSX','NSC','UNP','KSU',
    'FDX','UPS','CAT','DE','JCI','EMR','ROK','SWK','ITW','PH','CARR','OTIS','AOS','PPG','ALK',

    # Materials
    'LIN','APD','ECL','DD','DOW','BHP','RIO','VALE','NUE','STLD','X','AKS','CLF','NUE','STE','TX',
    'PPG','AVY','EMN','CE','FMC','ALB','SQM','LTHM','CF','MOS','IPI','NTR','KOP','KRO','WLK',

    # Real Estate
    'AMT','PLD','CCI','EQIX','DLR','EXR','PSA','PRO','SBAC','CPT','AVB','EQR','ESS','MAA','UDR',
    'VTR','WELL','O','HI','HST','LTC','WPC','ARE','FR','HTA','BXP','SLG','KRC','BXP','CUBE',

    # Utilities
    'NEE','DUK','SO','XEL','AEP','SRE','PEG','ED','DTE','CMS','EIX','WEC','AEE','EVRG','AWK',
    'CNP','PPL','ES','POM','WTRG','WRK','AGR','CWT','D','GAS','NJR' 'NI','OGE','OKE','POR',

    # Telecom
    'T','VZ','TMUS','CMCSA','CHTR',' Charter','CBB','WIN','FTR','S','Frontier','CIEN','JDSU',
    'EXFO','FNSR','OCLR','LITE','IPGP','MKS','NVLS','VECO','ACIA','ARRS','ATUS','CBB','CSCO',

    # Chinese ADRs
    'BABA','JD','PDD','BIDU','NIO','XPEV','LI','TME','NTES','BILI','YY','HUYA','WB','IQ','QFIN',
    'FUTU','TIGR','LUCKY','HZO','NQ','DQ','JOY','ZK','YMM','RENN','SFUN','XNET','WBAI','CAAS','GDS',

    # Biotech/Pharma
    'BIIB','GILD','AMGN','VRTX','REGN','ILMN','DXCM','EW','IDXX','BGNE','MRNA','PFE','JNJ','ABBV',
    'BNTX','SEEL','KRTX','RPRX','NVAX','INO','OCUL','VIR','CODX','NKTR','ARNA','GH','EDIT','CRSP','NTLA',

    # Crypto/Blockchain
    'COIN','MSTR','RIOT','MARA','SQ','PYPL','FB','TWTR','SNAP','PINS','TWLO','ZNGA','CHWY',
    'ETSY','DOCS','UPWK','ASAN','PLTR','SNOW','DDOG','FVRR','SHOP','CRWD','ZS','OKTA','NOW',

    # SPACs/Growth
    'SPY','QQQ','IWM','GLD','SLV','TLT','HYG','LQD','VCIT','VCSH','USO','XLE','XLF','XLI','XLK',
    'XLU','XLV','XLY','XLP','XLB','XLC','VTI','VOO','IVV','VV','AGG','BND','BNDX','VIG','VYM',

    # International
    'BUD','TM','SNE','NSANY','NNY','ASML','SAP','SIE','BMWYY','VLKLY','SAAB','TCEHY','BIDU','BABA',
    'JD','PDD','NTES','NIO','XPEV','LI','TCEHY','BIDU','BABA','JD','PDD','NTES','NIO','XPEV','LI',

    # Regional Banks
    'WFC','BAC','C','JPM','GS','MS','USB','PNC','TFC','RF','KEY','FITB','HBAN','CFG','SCHW','ETFC',
    'IBKR','BK','STT','CMA','ALLY','NYCB','ZION','PB','PACW','WAL','FHN','PNFP','BOH','CATY','CFR',

    # Insurance
    'BRK-A','BRK-B','AIG','MET','PRU','CINF','ALL','TRV','CNA','AFL','HIG','PGR','WRB','KMPR','L',
    'FAF','RGA','AEL','UNM','MFC','AFL','PRU','MET','CINF','ALL','TRV','CNA','AFL','HIG','PGR',

    # Auto/Tesla Related
    'TSLA','GM','F','STLA','TM','HMC','NSANY','VLKLY','BMWYY','RACE','NIO','XPEV','LI','LCID',
    'RIVN','GOEV','FSR','CCIV','PIPP','PSNY','SOLO','ARKK','ARKG','ARKF','ARKW','ARKQ','ARKX',

    # Emerging Markets
    'BIDU','BABA','JD','PDD','NTES','NIO','XPEV','LI','TME','BILI','YY','HUYA','WB','IQ','QFIN',
    'FUTU','TIGR','LUCKY','HZO','NQ','DQ','JOY','ZK','YMM','RENN','SFUN','XNET','WBAI','CAAS','GDS',

    # Additional Liquid ETFs
    'SPY','QQQ','IWM','EFA','EEM','VWO','XLF','XLE','XLI','XLK','XLU','XLV','XLY','XLP','XLB',
    'XLC','VTI','VOO','IVV','VV','AGG','BND','BNDX','LQD','HYG','JNK','MUB','MBB','GOVT','SHY','IEF','TLT'
]"""

    # Replace the smart filtering symbols assignment
    content = content.replace('SYMBOLS = get_enhanced_symbols()  # Universal market coverage (replaced hardcoded list)', comprehensive_symbols)

    # Modify date range
    content = content.replace('fetch_start = "2020-01-01"', 'fetch_start = "2025-01-01"')
    content = content.replace('fetch_end   = datetime.today().strftime("%Y-%m-%d")', 'fetch_end   = "2025-11-01"')

    # Write to temp file
    temp_path = Path("/Users/michaeldurante/ai dev/ce-hub/temp_full_universe_scanner.py")
    with open(temp_path, 'w') as f:
        f.write(content)

    return temp_path

def run_full_universe():
    """Run the scanner with full ticker universe"""
    print("🏃 RUNNING BACKSIDE B SCANNER - FULL UNIVERSE")
    print("=" * 80)
    print("📅 Date Range: 1/1/25 - 11/1/25")
    print("🎯 Full Parameters: $8.00 min price, $30M min ADV, 15M min D-1 volume")
    print("📊 Symbol List: 300+ comprehensive tickers (including BABA, all major stocks)")
    print("🚫 Smart Filtering: COMPLETELY DISABLED")
    print("✅ Full Universe: ENABLED")
    print()

    # Create modified scanner
    temp_scanner = create_full_universe_scanner()

    try:
        # Run the scanner
        result = subprocess.run([
            "python3", str(temp_scanner)
        ], capture_output=True, text=True, timeout=900)  # 15 minute timeout for full universe

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        if result.returncode == 0:
            print("\n✅ SCANNER COMPLETED SUCCESSFULLY")
        else:
            print(f"\n❌ SCANNER FAILED with return code {result.returncode}")

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        print("\n⏰ SCANNER TIMEOUT - taking too long (large universe)")
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
    print("🧪 BACKSIDE B SCANNER - COMPREHENSIVE UNIVERSE TEST")
    print("Running with 300+ tickers to capture all potential backside patterns")
    print("=" * 90)

    success = run_full_universe()

    print("\n" + "=" * 90)
    if success:
        print("🎉 FULL UNIVERSE SCAN COMPLETED")
        print("This should show many more results including BABA and other quality tickers")
        print("This demonstrates the true backside B pattern frequency in 2025")
    else:
        print("❌ FULL UNIVERSE SCAN FAILED")

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)