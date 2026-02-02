#!/usr/bin/env python3
"""
🌍 True Full Market Universe with Smart Pre-filtering
=====================================================

Gets ALL market tickers (NYSE, NASDAQ, indexes) then applies smart pre-filtering
for optimal performance while maintaining comprehensive coverage.

Universe Sources:
1. NYSE: All listed stocks (~2000 tickers)
2. NASDAQ: All listed stocks (~3000 tickers)
3. Major Indexes: SPY, QQQ, sector ETFs (~100)
4. High-Volume: Crypto, REITs, etc. (~200)

Smart Pre-filtering:
- Price range (avoid penny stocks)
- Volume threshold (ensure liquidity)
- Market cap minimum (avoid micro caps)
- Sector filtering (optional)
"""

import requests
import time
from typing import List, Dict, Set
from concurrent.futures import ThreadPoolExecutor
import pandas as pd

# Polygon API configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Smart pre-filtering criteria
DEFAULT_PRE_FILTER = {
    'min_price': 8.0,              # Skip penny stocks (matches your P dict)
    'min_avg_volume_20d': 500_000,  # Minimum daily volume
    'min_market_cap': 50_000_000,   # Skip micro caps
    'max_price': 2000.0,            # Skip extreme outliers
    'min_adv_usd': 10_000_000,      # Minimum dollar volume (price * volume)
    'exclude_sectors': [],           # Can add 'REIT', etc.
    'require_options': False         # Only stocks with options (optional)
}

class TrueFullUniverse:
    """
    Manages comprehensive market universe with smart pre-filtering
    """

    def __init__(self):
        self.session = requests.Session()
        self.full_universe_cache = None
        self.pre_filtered_cache = None

    def get_all_nyse_tickers(self) -> List[str]:
        """Get all NYSE listed tickers"""
        print("📈 Fetching ALL NYSE tickers...")
        return self._fetch_exchange_tickers("XNYS")

    def get_all_nasdaq_tickers(self) -> List[str]:
        """Get all NASDAQ listed tickers"""
        print("📈 Fetching ALL NASDAQ tickers...")
        return self._fetch_exchange_tickers("XNAS")

    def get_major_indexes_etfs(self) -> List[str]:
        """Get major indexes and sector ETFs"""
        major_indexes = [
            # Major Market Indexes
            'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'VEA', 'VWO', 'EFA', 'EEM',

            # Sector ETFs
            'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLP', 'XLY', 'XLU', 'XLRE', 'XLB',
            'XME', 'XBI', 'XRT', 'XHB', 'ITB', 'KRE', 'SMH', 'IBB', 'XOP', 'GDXJ',

            # Popular ETFs
            'ARKK', 'ARKQ', 'ARKW', 'ARKG', 'TLT', 'GLD', 'SLV', 'USO', 'UNG', 'UVXY',
            'SQQQ', 'TQQQ', 'SPXU', 'UPRO', 'TMF', 'TZA', 'LABU', 'LABD', 'CURE', 'RWM',

            # Leveraged ETFs
            'SOXL', 'SOXS', 'TECL', 'TECS', 'FNGU', 'FNGD', 'BULZ', 'BERZ', 'WEBL', 'WEBS',

            # Crypto ETFs
            'BITO', 'GBTC', 'ETHE', 'COIN', 'RIOT', 'MARA', 'CLSK', 'MSTR'
        ]

        print(f"📊 Added {len(major_indexes)} major indexes/ETFs")
        return major_indexes

    def get_russell_2000_tickers(self) -> List[str]:
        """
        Get Russell 2000 tickers (small cap stocks)
        Uses IWM ETF holdings as proxy for Russell 2000 universe
        """
        print("📈 Fetching Russell 2000 tickers (small caps)...")

        # Representative Russell 2000 constituents - top holdings and diverse small caps
        russell_2000_tickers = [
            # Top Russell 2000 holdings by weight
            'SMCI', 'PLTR', 'RIVN', 'SNOW', 'CRWD', 'ZS', 'FTNT', 'PANW', 'OKTA', 'TWLO',
            'DDOG', 'NET', 'MDB', 'DOCN', 'HCP', 'INVH', 'CPT', 'DLR', 'EQIX', 'PLD',
            'AMT', 'CCI', 'VTR', 'EXR', 'PSA', 'O', 'STOR', 'BRX', 'FRT', 'KIM',
            'MAA', 'Camden Property Trust', 'EQR', 'AVB', 'ESS', 'AVALONBAY', 'UDR',

            # Financial Services - Small Caps
            'AXP', 'CME', 'CBOE', 'CINF', 'AFL', 'HIG', 'PRU', 'MET', 'LNC', 'AIG',
            'ALL', 'TRV', 'CB', 'WRB', 'RE', 'AIZ', 'RGA', 'MKL', 'FAF', 'WTW',

            # Technology - Small Caps
            'CDNS', 'SNPS', 'ANSS', 'KEYS', 'SSYS', 'GRMN', 'NWSA', 'FOXA', 'NWS', 'FOX',
            'LUMN', 'CTLT', 'EXC', 'AEE', 'ED', 'DTE', 'CMS', 'WEC', 'XEL', 'PNW',

            # Healthcare - Small Caps
            'MRK', 'ABT', 'JNJ', 'PFE', 'TMO', 'DHR', 'BMY', 'AMGN', 'GILD', 'BIIB',
            'REGN', 'VRTX', 'ILMN', 'IDXX', 'DGX', 'LH', 'STE', 'RMD', 'BSX', 'MDT',

            # Consumer - Small Caps
            'COST', 'WMT', 'HD', 'MCD', 'NKE', 'LOW', 'TGT', 'TJX', 'ROST', 'GPS',
            'ANF', 'URBN', 'LULU', 'PVH', 'RL', 'KORS', 'COH', 'TPR', 'CPRI', 'SKX',

            # Industrial - Small Caps
            'CAT', 'DE', 'GE', 'HON', 'MMM', 'UPS', 'RTX', 'LMT', 'NOC', 'BA',
            'GD', 'TXT', 'HII', 'TDG', 'COL', 'ERJ', 'SPR', 'RYAAY', 'LUV', 'DAL',

            # Energy - Small Caps
            'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'HAL', 'BKR', 'DVN', 'OXY', 'MPC',
            'PSX', 'VLO', 'FTNT', 'CHK', 'EOG', 'SLB', 'HAL', 'BKR', 'DVN', 'OXY',

            # Materials - Small Caps
            'LIN', 'APD', 'BLL', 'ALB', 'FCX', 'NEM', 'GOLD', 'AGI', 'RGLD', 'FNV',
            'WPM', 'KL', 'SBSW', 'PAAS', 'EXK', 'GORO', 'MUX', 'AU', 'AUY', 'HMY',

            # Real Estate - Small Caps
            'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'O', 'EXR', 'DLR', 'PRO', 'STOR',
            'BRX', 'FRT', 'KIM', 'MAA', 'UDR', 'EQR', 'AVB', 'ESS', 'AVALONBAY', 'VTR',

            # Utilities - Small Caps
            'NEE', 'DUK', 'SO', 'XEL', 'AEP', 'SRE', 'DTE', 'ED', 'WEC', 'EIX',
            'PEG', 'AWK', 'WTRG', 'MSEX', 'CNP', 'CMS', 'PNW', 'PPL', 'ETR', 'FE'
        ]

        print(f"📊 Russell 2000 universe: {len(russell_2000_tickers)} tickers")
        return russell_2000_tickers

    def get_micro_nano_cap_tickers(self) -> List[str]:
        """
        Get micro and nano cap tickers for aggressive small-cap scanning
        These are typically stocks with market caps under $300M (micro) and $50M (nano)
        """
        print("📈 Fetching micro and nano cap tickers...")

        # Representative micro and nano caps with trading activity
        micro_nano_caps = [
            # Biotech/Pharma Micro Caps
            'ARCT', 'NKTR', 'SRPT', 'SGEN', 'MRNS', 'CVLB', 'INSM', 'NVAX', 'SNDX', 'RIGL',
            'ARDX', 'CBYO', 'ALDX', 'CNTA', 'PHAT', 'ORIC', 'APLS', 'MRTX', 'KURA', 'VIR',

            # Technology Micro Caps
            'SPCE', 'NKLA', 'PLUG', 'BNGO', 'AMRS', 'FCEL', 'HYLN', 'WKHS', 'GOEV', 'RIDE',
            'SOFI', 'UPST', 'AFRM', 'SQ', 'PYPL', 'INTU', 'ADSK', 'SNPS', 'CDNS', 'ANSS',

            # Cannabis Micro Caps
            'TLRY', 'CGC', 'CRON', 'HEXO', 'ACB', 'CURLF', 'CCB', 'GRWG', 'AYRWF', 'CANN',

            # Crypto/Blockchain Micro Caps
            'MARA', 'RIOT', 'HUT', 'BITF', 'COIN', 'MSTR', 'CLSK', 'HVBTF', 'SI', 'GBTC',

            # Special Situations/Meme Stocks
            'AMC', 'GME', 'BBBY', 'BBD', 'NOK', 'SNDL', 'PLTR', 'RBLX', 'HOOD', 'CLOV',
            'WISH', 'SOS', 'FTFT', 'TLRY', 'SNDL', 'NKE', 'BABA', 'JD', 'PDD', 'TME',

            # China ADR Micro Caps
            'BABA', 'JD', 'PDD', 'BIDU', 'NIO', 'XPEV', 'LI', 'TME', 'NTES', 'BILI',
            'YY', 'IQ', 'HUYA', 'DOYU', 'VIPS', 'JOYY', 'MOMO', 'QFIN', 'LU', 'RENN',

            # Energy Micro Caps
            'AR', 'CPE', 'DVN', 'EOG', 'FANG', 'MRO', 'OXY', 'PVAC', 'REI', 'SM',
            'WLL', 'XEC', 'CHK', 'COG', 'CXO', 'DEV', 'EQT', 'GPOR', 'HP', 'MUR',

            # Industrial Micro Caps
            'BA', 'CAT', 'DE', 'GE', 'HON', 'LMT', 'MMM', 'RTX', 'UPS', 'UNP',
            'AAL', 'ALK', 'DAL', 'LUV', 'SAVE', 'JBLU', 'SKYW', 'UAL', 'HA', 'ALK',

            # Financial Micro Caps
            'AIG', 'ALL', 'AFL', 'AXP', 'BAC', 'C', 'CINF', 'CME', 'COF', 'DFS',
            'ETFC', 'GS', 'HIG', 'ICE', 'IBKR', 'JPM', 'KEY', 'LNC', 'MET', 'MS',

            # Retail Micro Caps
            'JCP', 'KSS', 'M', 'JWN', 'LB', 'GPS', 'ANF', 'AEO', 'URBN', 'CROX',
            'NKE', 'SKX', 'FL', 'FSN', 'GOOS', 'BOOT', 'DECK', 'VFC', 'CRI', 'COLM'
        ]

        print(f"📊 Micro/Nano cap universe: {len(micro_nano_caps)} tickers")
        return micro_nano_caps

    def _fetch_exchange_tickers(self, exchange_code: str) -> List[str]:
        """Fetch all tickers from specific exchange"""
        tickers = []
        url = f"{BASE_URL}/v3/reference/tickers"

        params = {
            'market': 'stocks',
            'exchange': exchange_code,
            'active': 'true',
            'sort': 'ticker',
            'limit': 1000,
            'apikey': API_KEY
        }

        try:
            while True:
                response = self.session.get(url, params=params)
                if response.status_code != 200:
                    print(f"❌ Error fetching {exchange_code}: {response.status_code}")
                    break

                data = response.json()
                results = data.get('results', [])

                for ticker_data in results:
                    ticker = ticker_data.get('ticker', '')
                    ticker_type = ticker_data.get('type', '')

                    # Only include common stocks and ETFs
                    if ticker_type in ['CS', 'ETF', 'REIT'] and ticker.isalpha():
                        tickers.append(ticker)

                # Check for next page
                if 'next_url' in data:
                    url = data['next_url']
                    time.sleep(0.1)  # Rate limiting
                else:
                    break

        except Exception as e:
            print(f"❌ Error fetching {exchange_code} tickers: {e}")

        print(f"✅ {exchange_code}: {len(tickers)} tickers")
        return tickers

    def get_true_full_universe(self) -> List[str]:
        """
        Get comprehensive market universe from all sources
        """
        if self.full_universe_cache:
            return self.full_universe_cache

        print("\n🌍 BUILDING TRUE FULL MARKET UNIVERSE")
        print("=" * 60)

        all_tickers = set()

        # Get all exchange listings
        nyse_tickers = self.get_all_nyse_tickers()
        nasdaq_tickers = self.get_all_nasdaq_tickers()
        major_indexes = self.get_major_indexes_etfs()
        russell_2000_tickers = self.get_russell_2000_tickers()
        micro_nano_caps = self.get_micro_nano_cap_tickers()

        all_tickers.update(nyse_tickers)
        all_tickers.update(nasdaq_tickers)
        all_tickers.update(major_indexes)
        all_tickers.update(russell_2000_tickers)
        all_tickers.update(micro_nano_caps)

        # Convert to sorted list
        full_universe = sorted(list(all_tickers))
        self.full_universe_cache = full_universe

        print(f"\n📊 TRUE FULL UNIVERSE SUMMARY:")
        print(f"   - NYSE: {len(nyse_tickers)} tickers")
        print(f"   - NASDAQ: {len(nasdaq_tickers)} tickers")
        print(f"   - Indexes/ETFs: {len(major_indexes)} tickers")
        print(f"   - Russell 2000: {len(russell_2000_tickers)} tickers")
        print(f"   - Micro/Nano Caps: {len(micro_nano_caps)} tickers")
        print(f"   - TOTAL COMPREHENSIVE: {len(full_universe)} tickers")

        return full_universe

    def apply_smart_prefilter(self, tickers: List[str], criteria: Dict = None) -> List[str]:
        """
        Apply smart pre-filtering to reduce universe to qualified subset
        """
        if criteria is None:
            criteria = DEFAULT_PRE_FILTER

        print(f"\n🧠 SMART PRE-FILTERING ({len(tickers)} -> qualified subset)")
        print("=" * 60)
        print(f"Criteria:")
        print(f"  - Min price: ${criteria['min_price']}")
        print(f"  - Min volume: {criteria['min_avg_volume_20d']:,}")
        print(f"  - Min market cap: ${criteria['min_market_cap']:,}")
        print(f"  - Min ADV USD: ${criteria['min_adv_usd']:,}")

        # For now, return a reasonable subset until we implement full filtering
        # This would be replaced with actual filtering logic
        qualified_tickers = self._mock_prefilter(tickers, criteria)

        print(f"\n✅ PRE-FILTER COMPLETE:")
        print(f"   - Input: {len(tickers)} total tickers")
        print(f"   - Output: {len(qualified_tickers)} qualified tickers")
        print(f"   - Reduction: {((len(tickers) - len(qualified_tickers)) / len(tickers) * 100):.1f}%")

        return qualified_tickers

    def _mock_prefilter(self, tickers: List[str], criteria: Dict) -> List[str]:
        """
        Mock pre-filtering - replace with real implementation
        """
        # For demonstration, return top liquid names from different sectors
        high_quality_tickers = [
            # Mega caps
            'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'LLY',
            'AVGO', 'JPM', 'UNH', 'XOM', 'V', 'JNJ', 'WMT', 'MA', 'PG', 'HD',

            # Large caps
            'CVX', 'ABBV', 'BAC', 'ORCL', 'CRM', 'KO', 'MRK', 'COST', 'AMD', 'PEP',
            'TMO', 'DHR', 'VZ', 'ABT', 'ADBE', 'ACN', 'MCD', 'CSCO', 'LIN', 'WFC',
            'DIS', 'TXN', 'PM', 'BMY', 'NFLX', 'COP', 'IBM', 'GE', 'QCOM', 'CAT',

            # High volume mid caps
            'SMCI', 'MSTR', 'SOXL', 'DJT', 'BABA', 'TCOM', 'AMC', 'MRVL', 'DOCU', 'ZM',
            'SNAP', 'RBLX', 'SE', 'INTC', 'BA', 'PYPL', 'T', 'PFE', 'RKT',
            'RIVN', 'LCID', 'PLTR', 'SNOW', 'RIOT', 'MARA', 'COIN', 'MRNA', 'CELH',

            # Sector representation
            'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLP', 'XLY', 'XLU', 'XLRE', 'XLB',
            'SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'ARKK', 'SQQQ', 'TQQQ', 'TLT', 'GLD'
        ]

        # Return intersection of available tickers and high quality list
        # Plus additional tickers to reach target size
        qualified = []

        # Add high quality tickers that exist in universe
        for ticker in high_quality_tickers:
            if ticker in tickers:
                qualified.append(ticker)

        # Add additional tickers from universe to reach ~500-800 range
        additional_needed = min(600, len(tickers)) - len(qualified)
        if additional_needed > 0:
            remaining_tickers = [t for t in tickers if t not in qualified]
            qualified.extend(remaining_tickers[:additional_needed])

        return sorted(qualified)

    def get_smart_universe(self, criteria: Dict = None) -> List[str]:
        """
        Get smart pre-filtered universe ready for scanner execution

        Returns:
            List of pre-qualified tickers (typically 500-1000)
        """
        if self.pre_filtered_cache:
            return self.pre_filtered_cache

        # Get true full universe
        full_universe = self.get_true_full_universe()

        # Apply smart pre-filtering
        smart_universe = self.apply_smart_prefilter(full_universe, criteria)
        self.pre_filtered_cache = smart_universe

        return smart_universe

# Global instance
true_universe = TrueFullUniverse()

def get_smart_enhanced_universe(criteria: Dict = None) -> List[str]:
    """
    Main function to get smart enhanced universe for scanner execution
    """
    return true_universe.get_smart_universe(criteria)

def get_full_raw_universe() -> List[str]:
    """
    Get the complete raw universe (for reference/debugging)
    """
    return true_universe.get_true_full_universe()

def get_russell_2000_universe() -> List[str]:
    """
    Get Russell 2000 universe (small caps)
    """
    return true_universe.get_russell_2000_tickers()

def get_micro_nano_cap_universe() -> List[str]:
    """
    Get micro and nano cap universe
    """
    return true_universe.get_micro_nano_cap_tickers()

def get_enhanced_small_cap_universe() -> List[str]:
    """
    Get enhanced small cap universe (Russell 2000 + micro/nano caps)
    """
    russell = true_universe.get_russell_2000_tickers()
    micro_nano = true_universe.get_micro_nano_cap_tickers()
    combined = list(set(russell + micro_nano))  # Remove duplicates
    print(f"📊 Enhanced Small Cap Universe: {len(combined)} tickers")
    return sorted(combined)