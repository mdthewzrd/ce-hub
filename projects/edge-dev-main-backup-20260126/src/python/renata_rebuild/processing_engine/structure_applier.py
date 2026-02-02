"""
Structure Applier - Apply EdgeDev 3-Stage Structure

This module:
1. Applies the mandatory 3-stage architecture
2. Restructures code to follow EdgeDev patterns
3. Ensures proper method organization
4. Maintains original logic and parameters
"""

import re
from typing import Dict, List, Any, Optional
from pathlib import Path


class StructureApplier:
    """
    Apply EdgeDev 3-stage structure to scanner code

    3-Stage Architecture:
    1. Stage 1: Grouped data fetch (fetch_all_grouped_data)
    2. Stage 2: Smart filtering (apply_smart_filters)
    3. Stage 3: Full features + pattern detection (compute_full_features + detect_patterns)
    """

    def __init__(self):
        """Initialize structure applier"""
        self.required_methods = {
            '__init__',
            'get_trading_dates',
            'fetch_all_grouped_data',
            '_fetch_grouped_day',
            'apply_smart_filters',
            'compute_simple_features',
            'compute_full_features',
            'detect_patterns',
            'execute'
        }

    def apply_structure(self, code: str, structure_type: str = 'single-scan') -> Dict[str, Any]:
        """
        Apply EdgeDev structure to code

        Args:
            code: Original scanner code
            structure_type: 'single-scan' or 'multi-scan'

        Returns:
            Dict with:
            - transformed_code: Restructured code
            - methods_added: List of added methods
            - methods_modified: List of modified methods
            - changes_made: List of descriptions
        """
        result = {
            'transformed_code': code,
            'methods_added': [],
            'methods_modified': [],
            'changes_made': [],
            'warnings': []
        }

        # Check which methods exist
        existing_methods = self._find_existing_methods(code)

        # Add missing methods
        for method in self.required_methods:
            if method not in existing_methods:
                if method == '__init__':
                    new_code = self._add_init_method(code)
                elif method == 'get_trading_dates':
                    new_code = self._add_trading_dates_method(code)
                elif method == 'fetch_all_grouped_data':
                    new_code = self._add_fetch_all_grouped_method(code)
                elif method == '_fetch_grouped_day':
                    new_code = self._add_fetch_grouped_day_method(code)
                elif method == 'apply_smart_filters':
                    new_code = self._add_smart_filters_method(code)
                elif method == 'compute_simple_features':
                    new_code = self._add_compute_simple_features_method(code)
                elif method == 'compute_full_features':
                    new_code = self._add_compute_full_features_method(code)
                elif method == 'detect_patterns':
                    new_code = self._add_detect_patterns_method(code)
                elif method == 'execute':
                    new_code = self._add_execute_method(code, structure_type)
                else:
                    continue

                code = new_code
                result['methods_added'].append(method)
                result['transformed_code'] = code
                result['changes_made'].append(f"Added {method} method")

        # Ensure execute method follows 3-stage structure
        if 'execute' in existing_methods:
            code = self._ensure_execute_3stage(code)
            result['methods_modified'].append('execute')
            result['changes_made'].append("Updated execute method to follow 3-stage structure")
            result['transformed_code'] = code

        return result

    def _find_existing_methods(self, code: str) -> set:
        """Find existing method definitions"""
        methods = set()
        # Match method definitions
        for match in re.finditer(r'def\s+(\w+)\s*\(', code):
            methods.add(match.group(1))
        return methods

    def _add_init_method(self, code: str) -> str:
        """Add __init__ method with standard parameters"""
        # Find class definition
        class_match = re.search(r'class\s+(\w+).*?:', code)
        if not class_match:
            return code

        class_name = class_match.group(1)

        # Create __init__ method
        init_method = f'''
    def __init__(self, api_key: str, d0_start: str, d0_end: str, **params):
        """
        Initialize {class_name} scanner

        Args:
            api_key: Polygon API key
            d0_start: D0 start date (YYYY-MM-DD)
            d0_end: D0 end date (YYYY-MM-DD)
            **params: Additional scanner-specific parameters
        """
        self.api_key = api_key
        self.d0_start = d0_start
        self.d0_end = d0_end
        self.params = params

        # Initialize session for connection pooling
        self.session = None
'''

        # Insert after class definition
        insert_pos = class_match.end()
        return code[:insert_pos] + init_method + code[insert_pos:]

    def _add_trading_dates_method(self, code: str) -> str:
        """Add get_trading_dates method"""
        method = '''
    def get_trading_dates(self):
        """
        Generate list of trading dates between d0_start and d0_end

        Returns:
            List of date strings in YYYY-MM-DD format
        """
        import pandas_market_calendars as mcal
        from pandas.tseries.offsets import BDay

        # Get NYSE trading calendar
        nyse = mcal.get_calendar('NYSE')

        # Generate trading days
        d0_range = pd.date_range(self.d0_start, self.d0_end, freq='B')

        # Filter to actual trading days
        trading_days = nyse.valid_days(d0_range[0], d0_range[-1])

        # Convert to string format
        trading_dates = trading_days.strftime('%Y-%m-%d').tolist()

        return trading_dates
'''
        return self._insert_method_before_execute(code, method)

    def _add_fetch_all_grouped_method(self, code: str) -> str:
        """Add fetch_all_grouped_data method"""
        method = '''
    def fetch_all_grouped_data(self):
        """
        Fetch grouped market data for all dates using Polygon grouped endpoint

        Returns:
            DataFrame with all ticker data for D0 date range
        """
        from concurrent.futures import ThreadPoolExecutor, as_completed

        trading_dates = self.get_trading_dates()

        all_data = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(self._fetch_grouped_day, date): date
                for date in trading_dates
            }

            for future in as_completed(futures):
                date = futures[future]
                try:
                    df = future.result()
                    if not df.empty:
                        all_data.append(df)
                except Exception as e:
                    print(f"Error fetching data for {date}: {e}")

        if all_data:
            return pd.concat(all_data, ignore_index=True)
        else:
            return pd.DataFrame()
'''
        return self._insert_method_before_execute(code, method)

    def _add_fetch_grouped_day_method(self, code: str) -> str:
        """Add _fetch_grouped_day method"""
        method = '''
    def _fetch_grouped_day(self, date: str):
        """
        Fetch grouped market data for a single date

        Args:
            date: Date string (YYYY-MM-DD)

        Returns:
            DataFrame with ticker data for the date
        """
        import requests

        base_url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}"
        params = {
            'adjusted': 'true',
            'apikey': self.api_key
        }

        response = requests.get(base_url, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()

        if data.get('resultsCount', 0) > 0:
            df = pd.DataFrame(data['results'])

            # Standardize column names
            df = df.rename(columns={
                'T': 'ticker',
                't': 'timestamp',
                'o': 'open',
                'h': 'high',
                'l': 'low',
                'c': 'close',
                'v': 'volume',
                'vw': 'vwap'
            })

            # Add date column
            df['date'] = date

            # Select relevant columns
            df = df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume', 'vwap']]

            return df
        else:
            return pd.DataFrame()
'''
        return self._insert_method_before_execute(code, method)

    def _add_smart_filters_method(self, code: str) -> str:
        """Add apply_smart_filters method"""
        method = '''
    def apply_smart_filters(self, df: pd.DataFrame):
        """
        Apply smart filters based on scanner parameters (D0 date range only)

        Filters are parameter-based and scanner-specific

        Args:
            df: Input DataFrame with ticker data

        Returns:
            Filtered DataFrame
        """
        if df.empty:
            return df

        # Apply parameter-based filters from self.params
        filtered_df = df.copy()

        # Example filters (customize based on scanner parameters)
        if 'min_price' in self.params:
            filtered_df = filtered_df[filtered_df['close'] >= self.params['min_price']]

        if 'max_price' in self.params:
            filtered_df = filtered_df[filtered_df['close'] <= self.params['max_price']]

        if 'min_volume' in self.params:
            filtered_df = filtered_df[filtered_df['volume'] >= self.params['min_volume']]

        # Filter to D0 date range only
        filtered_df = filtered_df[filtered_df['date'] == self.d0_start]

        return filtered_df
'''
        return self._insert_method_before_execute(code, method)

    def _add_compute_simple_features_method(self, code: str) -> str:
        """Add compute_simple_features method"""
        method = '''
    def compute_simple_features(self, df: pd.DataFrame):
        """
        Compute simple features needed for smart filtering

        Args:
            df: Input DataFrame

        Returns:
            DataFrame with simple features added
        """
        if df.empty:
            return df

        # Simple, fast computations for initial filtering
        df = df.copy()

        # Add basic computed columns if needed
        if 'vwap' not in df.columns:
            df['vwap'] = (df['close'] + df['high'] + df['low']) / 3

        return df
'''
        return self._insert_method_before_execute(code, method)

    def _add_compute_full_features_method(self, code: str) -> str:
        """Add compute_full_features method"""
        method = '''
    def compute_full_features(self, df: pd.DataFrame):
        """
        Compute all features and indicators needed for pattern detection

        Uses vectorized operations for performance

        Args:
            df: Filtered DataFrame from smart filters

        Returns:
            DataFrame with all features computed
        """
        if df.empty:
            return df

        df = df.copy()

        # Previous day's close
        df['Prev_Close'] = df.groupby('ticker')['close'].transform(lambda x: x.shift(1))

        # Previous day's high
        df['Prev_High'] = df.groupby('ticker')['high'].transform(lambda x: x.shift(1))

        # EMAs
        df['EMA_9'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=9, adjust=False).mean()
        )
        df['EMA_20'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=20, adjust=False).mean()
        )

        # ATR (Average True Range)
        df['high_low'] = df['high'] - df['low']
        df['high_close'] = abs(df['high'] - df['close'].shift(1))
        df['low_close'] = abs(df['low'] - df['close'].shift(1))
        df['tr'] = df[['high_low', 'high_close', 'low_close']].max(axis=1)
        df['ATR'] = df.groupby('ticker')['tr'].transform(
            lambda x: x.ewm(span=14, adjust=False).mean()
        )

        # Volume average
        df['VOL_AVG'] = df.groupby('ticker')['volume'].transform(
            lambda x: x.rolling(window=20).mean()
        )

        # Drop temporary columns
        df = df.drop(['high_low', 'high_close', 'low_close', 'tr'], axis=1, errors='ignore')

        return df
'''
        return self._insert_method_before_execute(code, method)

    def _add_detect_patterns_method(self, code: str) -> str:
        """Add detect_patterns method"""
        method = '''
    def detect_patterns(self, df: pd.DataFrame):
        """
        Detect scanner-specific patterns

        Args:
            df: DataFrame with full features computed

        Returns:
            DataFrame with pattern detection results
        """
        if df.empty:
            return df

        df = df.copy()

        # Example pattern detection (customize for scanner type)
        # This is a placeholder - actual logic depends on scanner type

        # Add signal column
        df['signal'] = False

        # Drop NaN values
        df = df.dropna(subset=['signal'])

        return df
'''
        return self._insert_method_before_execute(code, method)

    def _add_execute_method(self, code: str, structure_type: str) -> str:
        """Add execute method with 3-stage structure"""
        if structure_type == 'multi-scan':
            method = '''
    def execute(self):
        """
        Main execution method - 3-stage architecture

        Returns:
            Dictionary of pattern signals
        """
        # Stage 1: Grouped data fetch
        df = self.fetch_all_grouped_data()

        if df.empty:
            return {}

        # Stage 2: Smart filters
        df = self.apply_smart_filters(df)

        if df.empty:
            return {}

        # Stage 3: Full features + pattern detection
        df = self.compute_full_features(df)
        df = self.detect_patterns(df)

        # Return signals (multi-scan format)
        signals = df[df['signal'] == True].to_dict('records')
        return {'signals': signals}
'''
        else:
            method = '''
    def execute(self):
        """
        Main execution method - 3-stage architecture

        Returns:
            DataFrame with detected patterns
        """
        # Stage 1: Grouped data fetch
        df = self.fetch_all_grouped_data()

        if df.empty:
            return pd.DataFrame()

        # Stage 2: Smart filters
        df = self.apply_smart_filters(df)

        if df.empty:
            return pd.DataFrame()

        # Stage 3: Full features + pattern detection
        df = self.compute_full_features(df)
        df = self.detect_patterns(df)

        return df
'''
        return self._insert_method_at_end(code, method)

    def _ensure_execute_3stage(self, code: str) -> str:
        """Ensure execute method follows 3-stage structure"""
        # Find execute method
        execute_match = re.search(
            r'def\s+execute\s*\(self\)\s*:(.*?)(?=\n    def |\nclass |\Z)',
            code,
            re.DOTALL
        )

        if not execute_match:
            return code

        existing_body = execute_match.group(1)

        # Check if it already has 3-stage structure
        if 'fetch_all_grouped_data' in existing_body and 'apply_smart_filters' in existing_body:
            return code  # Already has 3-stage structure

        # Replace with 3-stage structure
        new_execute = '''def execute(self):
        """
        Main execution method - 3-stage architecture

        Returns:
            DataFrame with detected patterns
        """
        # Stage 1: Grouped data fetch
        df = self.fetch_all_grouped_data()

        if df.empty:
            return pd.DataFrame()

        # Stage 2: Smart filters
        df = self.apply_smart_filters(df)

        if df.empty:
            return pd.DataFrame()

        # Stage 3: Full features + pattern detection
        df = self.compute_full_features(df)
        df = self.detect_patterns(df)

        return df
'''

        return code[:execute_match.start()] + new_execute + code[execute_match.end():]

    def _insert_method_before_execute(self, code: str, method: str) -> str:
        """Insert method before execute method"""
        execute_match = re.search(r'\n    def execute\s*\(', code)
        if execute_match:
            return code[:execute_match.start()] + method + code[execute_match.start():]
        else:
            return code + method

    def _insert_method_at_end(self, code: str, method: str) -> str:
        """Insert method at end of class"""
        # Find last method definition or end of class
        class_end = code.rstrip().rstrip("'")

        # Check if there's already an execute method
        if 'def execute(' in code:
            return code  # Don't add duplicate

        # Add method at end
        if class_end.endswith('\n'):
            return code + method
        else:
            return code + '\n' + method


# Test the structure applier
if __name__ == "__main__":
    applier = StructureApplier()

    print("Testing StructureApplier...\n")

    # Simple test code
    test_code = """
class SimpleScanner:
    pass
"""

    result = applier.apply_structure(test_code)

    print("Methods added:", result['methods_added'])
    print("Changes made:", result['changes_made'])
    print("\nTransformed code preview (first 500 chars):")
    print(result['transformed_code'][:500] + "...")
