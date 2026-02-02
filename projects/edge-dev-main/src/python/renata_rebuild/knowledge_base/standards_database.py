"""
Standards Database - EdgeDev Standardization Rules

This module defines ALL mandatory EdgeDev standardizations:
- Grouped endpoint (full market scanning)
- Thread pooling (parallel processing)
- Polygon API integration
- Smart filtering (parameter-based)
- Vectorized operations
- Connection pooling
- Date range configuration
"""

from typing import Dict, List, Any
import ast


class StandardsDatabase:
    """
    Database of EdgeDev mandatory standardizations

    These are the RULES that all formatted code MUST follow:
    1. Grouped Endpoint: Use Polygon grouped endpoint
    2. Thread Pooling: Parallel processing for speed
    3. Polygon API: Integration with user's API key
    4. Smart Filtering: Parameter-based, D0 date range only
    5. Vectorized Operations: No slow loops
    6. Connection Pooling: requests.Session
    7. Date Range Configuration: Configurable via __init__
    """

    def __init__(self):
        """Initialize standards database"""
        self.mandatory_standardizations = self._define_mandatory_standardizations()
        self.column_naming_standards = self._define_column_naming_standards()
        self.code_pattern_standards = self._define_code_pattern_standards()
        self.validation_rules = self._define_validation_rules()

    def _define_mandatory_standardizations(self) -> Dict[str, Dict[str, Any]]:
        """
        Define all mandatory EdgeDev standardizations

        Each standardization has:
        - name: Human-readable name
        - description: What it is and why it's required
        - check_pattern: How to detect if code has it
        - implementation_pattern: How to add it if missing
        """
        return {
            'grouped_endpoint': {
                'name': 'Grouped Endpoint (Full Market Scanning)',
                'description': 'Use Polygon grouped endpoint to fetch all tickers at once (1 API call per day, not per ticker)',
                'check_patterns': [
                    r'fetch_all_grouped_data',
                    r'/v2/aggs/grouped/locale/us/market/stocks/',
                ],
                'required': True,
                'implementation': self._get_grouped_endpoint_implementation(),
            },

            'thread_pooling': {
                'name': 'Thread Pooling (Parallel Processing)',
                'description': 'Use ThreadPoolExecutor for parallel data fetching and pattern detection',
                'check_patterns': [
                    r'ThreadPoolExecutor',
                    r'stage1_workers',
                    r'stage3_workers',
                ],
                'required': True,
                'implementation': self._get_thread_pooling_implementation(),
            },

            'polygon_api': {
                'name': 'Polygon API Integration',
                'description': 'Use user\'s Polygon API key for all API calls',
                'check_patterns': [
                    r'self\.api_key',
                    r'apiKey.*self\.api_key',
                ],
                'required': True,
                'implementation': self._get_polygon_api_implementation(),
            },

            'smart_filtering': {
                'name': 'Smart Filtering (Parameter-Based)',
                'description': 'Apply smart filters based on scanner\'s OWN parameters, only to D0 date range',
                'check_patterns': [
                    r'apply_smart_filters',
                    r'self\.params\[',
                ],
                'required': True,
                'implementation': self._get_smart_filtering_implementation(),
            },

            'vectorized_operations': {
                'name': 'Vectorized Operations',
                'description': 'Use vectorized DataFrame operations (groupby().transform()), not row-by-row loops',
                'check_patterns': [
                    r'\.transform\(',
                    r'groupby',
                ],
                'forbidden_patterns': [
                    r'\.iterrows\(\)',
                    r'for .* in .*\.itertuples\(\)',
                ],
                'required': True,
                'implementation': self._get_vectorized_operations_implementation(),
            },

            'connection_pooling': {
                'name': 'Connection Pooling',
                'description': 'Use requests.Session with HTTPAdapter for connection pooling',
                'check_patterns': [
                    r'requests\.Session\(\)',
                    r'HTTPAdapter',
                    r'pool_connections',
                ],
                'required': True,
                'implementation': self._get_connection_pooling_implementation(),
            },

            'date_range_config': {
                'name': 'Date Range Configuration',
                'description': 'Accept d0_start and d0_end as __init__ parameters, calculate historical range automatically',
                'check_patterns': [
                    r'def __init__.*d0_start.*d0_end',
                    r'self\.d0_start',
                    r'self\.d0_end',
                ],
                'required': True,
                'implementation': self._get_date_range_config_implementation(),
            },
        }

    def _define_column_naming_standards(self) -> Dict[str, str]:
        """
        Define EdgeDev column naming standards

        These column names MUST be used (not c, o, h, l, v, etc.)
        """
        return {
            # Basic OHLCV
            'ticker': 'ticker',
            'date': 'date',
            'open': 'open',
            'high': 'high',
            'low': 'low',
            'close': 'close',
            'volume': 'volume',

            # Previous day values (use Prev_ prefix)
            'Prev_Close': 'Prev_Close',
            'Prev_Open': 'Prev_Open',
            'Prev_High': 'Prev_High',
            'Prev_Low': 'Prev_Low',
            'Prev_Volume': 'Prev_Volume',
            'Prev2_High': 'Prev2_High',
            'Prev2_Close': 'Prev2_Close',

            # Indicators (use CAPS with underscores)
            'EMA_9': 'EMA_9',
            'EMA_20': 'EMA_20',
            'ATR': 'ATR',
            'ATR_raw': 'ATR_raw',
            'TR': 'TR',
            'VOL_AVG': 'VOL_AVG',
            'ADV20_$': 'ADV20_$',

            # Slope calculations
            'Slope_9_5d': 'Slope_9_5d',
            'Slope_9_3d': 'Slope_9_3d',
            'Slope_9_15d': 'Slope_9_15d',

            # Computed metrics
            'High_over_EMA9_div_ATR': 'High_over_EMA9_div_ATR',
            'High_over_EMA20_div_ATR': 'High_over_EMA20_div_ATR',
            'Gap_abs': 'Gap_abs',
            'Gap_over_ATR': 'Gap_over_ATR',
            'Open_over_EMA9': 'Open_over_EMA9',
            'Open_over_EMA20': 'Open_over_EMA20',
            'Body_over_ATR': 'Body_over_ATR',

            # Additional metrics
            'price_range': 'price_range',
            'dollar_volume': 'dollar_volume',
        }

    def _define_code_pattern_standards(self) -> Dict[str, Any]:
        """
        Define EdgeDev code pattern standards

        These are the CORRECT and INCORRECT patterns
        """
        return {
            'grouped_endpoint': {
                'correct': [
                    'url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"',
                ],
                'incorrect': [
                    'url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"',
                ],
                'reason': 'Grouped endpoint is 100x faster (1 API call per day vs per ticker)',
            },

            'vectorized_operations': {
                'correct': [
                    "df['EMA_9'] = df.groupby('ticker')['close'].transform(lambda x: x.ewm(span=9).mean())",
                ],
                'incorrect': [
                    "for idx, row in df.iterrows():",
                    "for ticker in df['ticker'].unique():",
                ],
                'reason': 'Vectorized operations are 100x faster than row-by-row loops',
            },

            'smart_filtering': {
                'correct': [
                    "df_output_filtered = df_output_range[df_output_range['prev_close'] >= self.params['price_min']]",
                ],
                'incorrect': [
                    "df = df[df['close'] > 10]",  # Arbitrary value not from scanner params
                ],
                'reason': 'Smart filters MUST be based on scanner\'s own parameters',
            },
        }

    def _define_validation_rules(self) -> List[Dict[str, Any]]:
        """
        Define validation rules for checking code

        These rules are used by OutputValidator
        """
        return [
            {
                'name': 'has_grouped_endpoint',
                'description': 'Code must use grouped endpoint',
                'check': lambda code: 'fetch_all_grouped_data' in code,
                'required': True,
            },
            {
                'name': 'has_smart_filters',
                'description': 'Code must have smart filters',
                'check': lambda code: 'apply_smart_filters' in code,
                'required': True,
            },
            {
                'name': 'has_parallel_processing',
                'description': 'Code must use ThreadPoolExecutor',
                'check': lambda code: 'ThreadPoolExecutor' in code,
                'required': True,
            },
            {
                'name': 'uses_vectorized',
                'description': 'Code must use vectorized operations',
                'check': lambda code: '.transform(' in code and 'groupby' in code,
                'required': True,
            },
            {
                'name': 'no_slow_loops',
                'description': 'Code must not use iterrows loops',
                'check': lambda code: '.iterrows()' not in code,
                'required': True,
            },
            {
                'name': 'has_connection_pooling',
                'description': 'Code must use requests.Session',
                'check': lambda code: 'requests.Session()' in code,
                'required': True,
            },
            {
                'name': 'column_naming',
                'description': 'Code must use EdgeDev column names',
                'check': lambda code: all(col in code for col in ['EMA_9', 'ATR', 'Prev_High']),
                'required': True,
            },
            {
                'name': 'params_preserved',
                'description': 'Code must preserve original parameters',
                'check': lambda code: 'self.params' in code,
                'required': True,
            },
        ]

    # Implementation patterns (how to add missing standardizations)

    def _get_grouped_endpoint_implementation(self) -> str:
        """Return grouped endpoint implementation pattern"""
        return '''
def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
    """
    Stage 1: Fetch ALL data for ALL tickers using grouped endpoint

    One API call per trading day, returns all tickers that traded that day.
    """
    all_data = []

    with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
        future_to_date = {
            executor.submit(self._fetch_grouped_day, date_str): date_str
            for date_str in trading_dates
        }

        for future in as_completed(future_to_date):
            try:
                data = future.result()
                if data is not None and not data.empty:
                    all_data.append(data)
            except Exception:
                pass

    return pd.concat(all_data, ignore_index=True) if all_data else pd.DataFrame()

def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
    """Fetch ALL tickers that traded on a specific date"""
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    params = {"apiKey": self.api_key, "adjusted": "true"}

    response = self.session.get(url, params=params, timeout=30)

    if response.status_code != 200:
        return None

    data = response.json()
    if 'results' not in data or not data['results']:
        return None

    df = pd.DataFrame(data['results'])
    df['date'] = pd.to_datetime(date_str)
    df = df.rename(columns={
        'T': 'ticker',
        'o': 'open',
        'h': 'high',
        'l': 'low',
        'c': 'close',
        'v': 'volume'
    })

    return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]
'''

    def _get_thread_pooling_implementation(self) -> str:
        """Return thread pooling implementation pattern"""
        return '''
# Worker configuration
self.stage1_workers = 5  # Parallel fetching of grouped data
self.stage3_workers = 10  # Parallel processing of pattern detection

# Stage 1: Parallel data fetching
with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
    futures = [executor.submit(self._fetch_grouped_day, date) for date in dates]

# Stage 3: Parallel pattern detection
with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
    futures = [executor.submit(self.process_ticker, data) for data in ticker_data]
'''

    def _get_polygon_api_implementation(self) -> str:
        """Return Polygon API integration pattern"""
        return '''
def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
    self.api_key = api_key
    self.base_url = "https://api.polygon.io"

    # Use API key in all requests
    params = {"apiKey": self.api_key, "adjusted": "true"}
'''

    def _get_smart_filtering_implementation(self) -> str:
        """Return smart filtering implementation pattern"""
        return '''
def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
    """
    Stage 2: Smart filters based on scanner's OWN parameters

    CRITICAL: Filters MUST be based on self.params
    CRITICAL: Filters ONLY apply to D0 date range
    """
    # Separate data
    df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
    df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

    # Apply smart filters (using scanner's parameters)
    df_output_filtered = df_output_range[
        (df_output_range['prev_close'] >= self.params['price_min']) &
        (df_output_range['ADV20_$'] >= self.params['adv20_min_usd'])
    ].copy()

    # Get tickers with valid D0 dates
    tickers_with_valid_d0 = df_output_filtered['ticker'].unique()

    # Return all data for those tickers
    return df[df['ticker'].isin(tickers_with_valid_d0)]
'''

    def _get_vectorized_operations_implementation(self) -> str:
        """Return vectorized operations implementation pattern"""
        return '''
# CORRECT: Vectorized DataFrame operations
df['EMA_9'] = df.groupby('ticker')['close'].transform(
    lambda x: x.ewm(span=9, adjust=False).mean()
)

# CORRECT: Vectorized ABS window
cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
win = ticker_df.loc[mask]

# INCORRECT: Row-by-row loop
# for idx, row in df.iterrows():  # ❌ SLOW
#     row['EMA_9'] = calculate(...)  # ❌ SLOW
'''

    def _get_connection_pooling_implementation(self) -> str:
        """Return connection pooling implementation pattern"""
        return '''
def __init__(self, ...):
    # Setup session with connection pooling
    self.session = requests.Session()
    self.session.mount('https://', requests.adapters.HTTPAdapter(
        pool_connections=100,
        pool_maxsize=100,
        max_retries=2,
        pool_block=False
    ))
'''

    def _get_date_range_config_implementation(self) -> str:
        """Return date range configuration implementation pattern"""
        return '''
def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
    # Default date range
    self.DEFAULT_D0_START = "2025-01-01"
    self.DEFAULT_D0_END = "2025-12-31"

    # Use command-line args if provided, else defaults
    self.d0_start = d0_start or self.DEFAULT_D0_START
    self.d0_end = d0_end or self.DEFAULT_D0_END

    # Calculate historical data range
    lookback_buffer = self.params.get('abs_lookback_days', 1000) + 50
    scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
    self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
    self.scan_end = self.d0_end
'''

    # Public API methods

    def get_mandatory_standardizations(self) -> Dict[str, Dict[str, Any]]:
        """Get all mandatory standardizations"""
        return self.mandatory_standardizations

    def get_column_naming_standards(self) -> Dict[str, str]:
        """Get column naming standards"""
        return self.column_naming_standards

    def get_code_pattern_standards(self) -> Dict[str, Any]:
        """Get code pattern standards"""
        return self.code_pattern_standards

    def get_validation_rules(self) -> List[Dict[str, Any]]:
        """Get all validation rules"""
        return self.validation_rules

    def check_standardization(self, code: str, standardization_name: str) -> bool:
        """
        Check if code has a specific standardization

        Args:
            code: Python code to check
            standardization_name: Name of standardization to check

        Returns:
            True if code has the standardization, False otherwise
        """
        if standardization_name not in self.mandatory_standardizations:
            return False

        standard = self.mandatory_standardizations[standardization_name]

        # Check if any pattern matches
        for pattern in standard['check_patterns']:
            import re
            if re.search(pattern, code):
                return True

        return False

    def check_all_standardizations(self, code: str) -> Dict[str, bool]:
        """
        Check if code has all mandatory standardizations

        Args:
            code: Python code to check

        Returns:
            Dict with standardization name and boolean value
        """
        results = {}

        for name, standard in self.mandatory_standardizations.items():
            results[name] = self.check_standardization(code, name)

        return results

    def get_missing_standardizations(self, code: str) -> List[str]:
        """
        Get list of missing standardizations

        Args:
            code: Python code to check

        Returns:
            List of standardization names that are missing
        """
        missing = []

        for name, standard in self.mandatory_standardizations.items():
            if standard['required'] and not self.check_standardization(code, name):
                missing.append(name)

        return missing

    def validate_code(self, code: str) -> Dict[str, Any]:
        """
        Validate code against all EdgeDev standards

        Args:
            code: Python code to validate

        Returns:
            Dict with validation results
        """
        results = {
            'passed': True,
            'errors': [],
            'warnings': [],
            'standardizations': {},
            'validation_checks': {},
        }

        # Check each mandatory standardization
        for name, standard in self.mandatory_standardizations.items():
            has_it = self.check_standardization(code, name)
            results['standardizations'][name] = has_it

            if standard['required'] and not has_it:
                results['passed'] = False
                results['errors'].append(f"Missing required standardization: {name}")

        # Run validation rules
        for rule in self.validation_rules:
            try:
                passed = rule['check'](code)
                results['validation_checks'][rule['name']] = passed

                if rule['required'] and not passed:
                    results['passed'] = False
                    results['errors'].append(f"Validation check failed: {rule['description']}")

            except Exception as e:
                results['warnings'].append(f"Validation check '{rule['name']}' failed: {e}")

        return results


# Test the database
if __name__ == "__main__":
    print("=" * 70)
    print("STANDARDS DATABASE - TEST")
    print("=" * 70)

    db = StandardsDatabase()

    print("\n📋 Mandatory Standardizations:")
    for name in db.get_mandatory_standardizations().keys():
        print(f"  - {name}")

    print(f"\n📊 Total: {len(db.get_mandatory_standardizations())} standardizations")
    print(f"📊 Total: {len(db.get_validation_rules())} validation rules")

    # Test with sample code
    test_code = '''
def __init__(self, api_key: str):
    self.api_key = api_key
    self.base_url = "https://api.polygon.io"
    self.session = requests.Session()
'''

    print("\n" + "=" * 70)
    print("VALIDATION TEST")
    print("=" * 70)

    results = db.validate_code(test_code)

    print(f"\nPassed: {results['passed']}")
    print(f"Errors: {len(results['errors'])}")
    print(f"Warnings: {len(results['warnings'])}")

    if results['errors']:
        print("\n❌ Errors:")
        for error in results['errors']:
            print(f"  - {error}")

    if results['warnings']:
        print("\n⚠️  Warnings:")
        for warning in results['warnings']:
            print(f"  - {warning}")
