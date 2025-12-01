/**
 * Test Scenarios for Human-in-the-Loop Formatter
 *
 * This component provides realistic test cases including problematic scanners
 * like LC D2 and SC DMR that demonstrate the system's capabilities.
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

export const testScenarios = {
  lc_d2_scanner: {
    name: "LC D2 Scanner (Complex)",
    description: "Sophisticated LC scanner with complex multi-condition logic",
    difficulty: "High",
    code: `"""
LC D2 Scanner - Complex Multi-Condition Pattern Detection
This scanner uses sophisticated logic for late continuation patterns
"""

import asyncio
import aiohttp
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging

# CRITICAL PARAMETERS - DO NOT MODIFY WITHOUT UNDERSTANDING IMPACT
PREV_CLOSE_MIN = 5.0  # Minimum previous close price
VOLUME_THRESHOLD = 1000000  # Minimum volume for liquidity
GAP_PERCENT_MIN = 2.5  # Minimum gap percentage
LC_FRONTSIDE_THRESHOLD = 0.8  # LC frontside signal threshold
LC_BACKSIDE_THRESHOLD = 0.6  # LC backside signal threshold
ATR_MULTIPLIER = 2.0  # ATR-based volatility filter
SLOPE_3D_MIN = 0.15  # 3-day slope minimum for momentum
MAX_PRICE_DEVIATION = 0.05  # Maximum price deviation tolerance

class LCPatternDetector:
    def __init__(self, config_params):
        self.prev_close_min = config_params.get('prev_close_min', PREV_CLOSE_MIN)
        self.volume_threshold = config_params.get('volume_threshold', VOLUME_THRESHOLD)
        self.gap_percent_min = config_params.get('gap_percent_min', GAP_PERCENT_MIN)
        self.lc_frontside_threshold = config_params.get('lc_frontside_threshold', LC_FRONTSIDE_THRESHOLD)
        self.lc_backside_threshold = config_params.get('lc_backside_threshold', LC_BACKSIDE_THRESHOLD)
        self.atr_multiplier = config_params.get('atr_multiplier', ATR_MULTIPLIER)
        self.slope_3d_min = config_params.get('slope_3d_min', SLOPE_3D_MIN)
        self.max_price_deviation = config_params.get('max_price_deviation', MAX_PRICE_DEVIATION)

        self.logger = logging.getLogger(__name__)

    async def scan_ticker(self, ticker: str, start_date: str, end_date: str) -> List[Dict]:
        """
        Scan a single ticker for LC D2 patterns with sophisticated detection logic
        """
        try:
            # Get comprehensive stock data
            df = await self._get_stock_data(ticker, start_date, end_date)

            if df is None or len(df) < 10:
                return []

            # Apply multi-stage filtering pipeline
            df_filtered = self._apply_primary_filters(df)
            df_patterns = self._detect_lc_patterns(df_filtered)
            df_validated = self._validate_pattern_quality(df_patterns)

            # Convert to results format
            results = []
            for _, row in df_validated.iterrows():
                result = {
                    'ticker': ticker,
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'prev_close': round(row['prev_close'], 2),
                    'open': round(row['open'], 2),
                    'high': round(row['high'], 2),
                    'low': round(row['low'], 2),
                    'close': round(row['close'], 2),
                    'volume': int(row['volume']),
                    'gap_percent': round(row['gap_percent'], 2),
                    'lc_frontside_d2_extended': row['lc_frontside_d2_extended'],
                    'lc_backside_signal': round(row['lc_backside_signal'], 3),
                    'atr_validated': row['atr_validated'],
                    'slope_3d': round(row['slope_3d'], 3),
                    'pattern_confidence': round(row['pattern_confidence'], 3),
                    'liquidity_score': round(row['liquidity_score'], 2)
                }
                results.append(result)

            self.logger.info(f"LC D2 scan complete for {ticker}: {len(results)} patterns found")
            return results

        except Exception as e:
            self.logger.error(f"LC D2 scan failed for {ticker}: {str(e)}")
            return []

    def _apply_primary_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply primary filtering criteria"""
        # Price filter
        df_price = df[df['prev_close'] >= self.prev_close_min].copy()

        # Volume filter with dynamic threshold
        volume_threshold_dynamic = max(self.volume_threshold, df_price['volume'].median() * 1.5)
        df_volume = df_price[df_price['volume'] >= volume_threshold_dynamic].copy()

        # Calculate gap percentage
        df_volume['gap_percent'] = ((df_volume['open'] - df_volume['prev_close']) / df_volume['prev_close']) * 100
        df_gap = df_volume[df_volume['gap_percent'] >= self.gap_percent_min].copy()

        return df_gap

    def _detect_lc_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect LC patterns using sophisticated algorithms"""
        if len(df) == 0:
            return df

        df = df.copy()

        # Calculate ATR for volatility validation
        df['tr'] = np.maximum(df['high'] - df['low'],
                             np.maximum(abs(df['high'] - df['prev_close']),
                                       abs(df['low'] - df['prev_close'])))
        df['atr_14'] = df['tr'].rolling(window=14, min_periods=1).mean()

        # LC frontside detection (complex multi-factor analysis)
        df['price_momentum'] = (df['close'] - df['open']) / df['open']
        df['volume_momentum'] = df['volume'] / df['volume'].rolling(window=5, min_periods=1).mean()
        df['lc_frontside_raw'] = (df['price_momentum'] * 0.4 +
                                 np.log(df['volume_momentum']) * 0.3 +
                                 (df['gap_percent'] / 10) * 0.3)

        # LC backside signal calculation
        df['price_stability'] = 1 - (abs(df['close'] - df['open']) / df['open'])
        df['volume_consistency'] = 1 - abs(df['volume'] - df['volume'].rolling(window=3, min_periods=1).mean()) / df['volume']
        df['lc_backside_signal'] = (df['price_stability'] * 0.6 + df['volume_consistency'] * 0.4)

        # Binary LC frontside classification
        lc_threshold_dynamic = max(self.lc_frontside_threshold, df['lc_frontside_raw'].quantile(0.7))
        df['lc_frontside_d2_extended'] = (df['lc_frontside_raw'] >= lc_threshold_dynamic).astype(int)

        # ATR validation
        df['atr_validated'] = (df['tr'] <= df['atr_14'] * self.atr_multiplier).astype(int)

        return df[df['lc_frontside_d2_extended'] == 1]

    def _validate_pattern_quality(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate pattern quality using advanced metrics"""
        if len(df) == 0:
            return df

        df = df.copy()

        # Calculate 3-day price slope
        df['slope_3d'] = df['close'].diff(3) / 3
        df_slope = df[df['slope_3d'] >= self.slope_3d_min].copy()

        # Pattern confidence scoring
        df_slope['pattern_confidence'] = (
            df_slope['lc_frontside_raw'] * 0.3 +
            df_slope['lc_backside_signal'] * 0.2 +
            (df_slope['atr_validated']) * 0.2 +
            np.minimum(df_slope['slope_3d'] / 0.5, 1) * 0.3
        )

        # Liquidity scoring
        df_slope['liquidity_score'] = np.log(df_slope['volume']) * (df_slope['close'] / 100)

        # Final quality filter
        df_quality = df_slope[
            (df_slope['pattern_confidence'] >= 0.6) &
            (df_slope['lc_backside_signal'] >= self.lc_backside_threshold) &
            (df_slope['atr_validated'] == 1)
        ].copy()

        return df_quality

    async def _get_stock_data(self, ticker: str, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
        """Get stock data with error handling"""
        try:
            # This would connect to your data source (Polygon, Alpha Vantage, etc.)
            # For demo purposes, return mock data structure
            dates = pd.date_range(start=start_date, end=end_date, freq='D')
            dates = dates[dates.weekday < 5]  # Business days only

            # Generate realistic mock data
            np.random.seed(hash(ticker) % 2**32)
            base_price = 50 + hash(ticker) % 200

            data = []
            for i, date in enumerate(dates):
                if i == 0:
                    prev_close = base_price
                else:
                    prev_close = data[i-1]['close']

                # Simulate realistic price movements
                volatility = 0.02 + (hash(ticker + str(i)) % 100) / 10000
                gap = np.random.normal(0, 0.01)

                open_price = prev_close * (1 + gap)
                high = open_price * (1 + abs(np.random.normal(0, volatility)))
                low = open_price * (1 - abs(np.random.normal(0, volatility)))
                close = low + (high - low) * np.random.random()
                volume = int(np.random.lognormal(14, 0.5))

                data.append({
                    'date': date,
                    'prev_close': prev_close,
                    'open': open_price,
                    'high': max(open_price, high, close),
                    'low': min(open_price, low, close),
                    'close': close,
                    'volume': volume
                })

            return pd.DataFrame(data)

        except Exception as e:
            self.logger.error(f"Data retrieval failed for {ticker}: {str(e)}")
            return None

async def main():
    """Main execution function with comprehensive error handling"""
    config = {
        'prev_close_min': PREV_CLOSE_MIN,
        'volume_threshold': VOLUME_THRESHOLD,
        'gap_percent_min': GAP_PERCENT_MIN,
        'lc_frontside_threshold': LC_FRONTSIDE_THRESHOLD,
        'lc_backside_threshold': LC_BACKSIDE_THRESHOLD,
        'atr_multiplier': ATR_MULTIPLIER,
        'slope_3d_min': SLOPE_3D_MIN,
        'max_price_deviation': MAX_PRICE_DEVIATION
    }

    detector = LCPatternDetector(config)
    all_results = []

    # Define ticker universe
    tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']
    start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')

    # Process tickers with concurrent execution
    semaphore = asyncio.Semaphore(5)  # Limit concurrent requests

    async def scan_with_semaphore(ticker):
        async with semaphore:
            return await detector.scan_ticker(ticker, start_date, end_date)

    tasks = [scan_with_semaphore(ticker) for ticker in tickers]
    results_list = await asyncio.gather(*tasks, return_exceptions=True)

    # Aggregate results
    for ticker, results in zip(tickers, results_list):
        if isinstance(results, Exception):
            logging.error(f"Ticker {ticker} failed: {results}")
        else:
            all_results.extend(results)

    print(f"LC D2 Scanner completed. Found {len(all_results)} patterns across {len(tickers)} tickers.")
    return all_results

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
`
  },

  sc_dmr_scanner: {
    name: "SC DMR Scanner (High Complexity)",
    description: "SC DMR scanner with intricate parameter relationships",
    difficulty: "Very High",
    code: `"""
SC DMR (Swing Continuation - Daily Mean Reversion) Scanner
Complex parameter interdependencies and sophisticated pattern recognition
"""

import pandas as pd
import numpy as np
import talib
from datetime import datetime, timedelta
from scipy import stats
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# SOPHISTICATED PARAMETER SET - INTERDEPENDENT CONFIGURATIONS
DMR_BASE_PERIOD = 20  # Base calculation period
DMR_SENSITIVITY = 1.5  # Mean reversion sensitivity multiplier
VOLUME_PERCENTILE = 75  # Volume percentile for unusual activity
PRICE_MOMENTUM_WINDOW = 5  # Price momentum calculation window
MEAN_REVERSION_THRESHOLD = 2.0  # Standard deviations for mean reversion
LIQUIDITY_MIN_DOLLAR_VOLUME = 10000000  # Minimum dollar volume
RSI_OVERSOLD = 30  # RSI oversold threshold
RSI_OVERBOUGHT = 70  # RSI overbought threshold
VOLATILITY_PERCENTILE = 60  # Volatility percentile filter
TREND_CONFIRMATION_PERIOD = 10  # Trend confirmation lookback
SWING_MAGNITUDE_MIN = 0.03  # Minimum swing magnitude (3%)
PATTERN_CONFIDENCE_MIN = 0.65  # Minimum pattern confidence score

class SCDMRAnalyzer:
    def __init__(self, symbol_universe, analysis_config=None):
        # Configuration with complex interdependencies
        self.config = analysis_config or self._get_default_config()
        self.symbol_universe = symbol_universe
        self.scaler = StandardScaler()

        # Derived parameters (calculated from base parameters)
        self.volume_ma_period = max(int(DMR_BASE_PERIOD * 1.5), 10)
        self.price_deviation_period = int(DMR_BASE_PERIOD * 0.75)
        self.volatility_window = max(int(DMR_BASE_PERIOD * 2), 30)
        self.correlation_window = min(int(DMR_BASE_PERIOD * 3), 60)

        # Dynamic thresholds (adjust based on market conditions)
        self.dynamic_rsi_oversold = RSI_OVERSOLD - (DMR_SENSITIVITY * 5)
        self.dynamic_rsi_overbought = RSI_OVERBOUGHT + (DMR_SENSITIVITY * 5)
        self.dynamic_volume_threshold = VOLUME_PERCENTILE + (DMR_SENSITIVITY * 10)

    def _get_default_config(self):
        return {
            'dmr_base_period': DMR_BASE_PERIOD,
            'dmr_sensitivity': DMR_SENSITIVITY,
            'volume_percentile': VOLUME_PERCENTILE,
            'price_momentum_window': PRICE_MOMENTUM_WINDOW,
            'mean_reversion_threshold': MEAN_REVERSION_THRESHOLD,
            'liquidity_min_dollar_volume': LIQUIDITY_MIN_DOLLAR_VOLUME,
            'rsi_oversold': RSI_OVERSOLD,
            'rsi_overbought': RSI_OVERBOUGHT,
            'volatility_percentile': VOLATILITY_PERCENTILE,
            'trend_confirmation_period': TREND_CONFIRMATION_PERIOD,
            'swing_magnitude_min': SWING_MAGNITUDE_MIN,
            'pattern_confidence_min': PATTERN_CONFIDENCE_MIN
        }

    def analyze_symbol(self, symbol_data, symbol):
        """
        Comprehensive SC DMR analysis with multi-factor scoring
        """
        try:
            df = symbol_data.copy()

            # Ensure minimum data requirements
            if len(df) < max(self.volatility_window, self.correlation_window):
                return []

            # Phase 1: Core technical indicators
            df = self._calculate_technical_indicators(df)

            # Phase 2: Mean reversion analysis
            df = self._analyze_mean_reversion_patterns(df)

            # Phase 3: Volume and liquidity analysis
            df = self._analyze_volume_patterns(df)

            # Phase 4: Swing pattern detection
            df = self._detect_swing_patterns(df)

            # Phase 5: Multi-factor scoring and filtering
            df = self._calculate_composite_scores(df)

            # Phase 6: Final pattern validation
            valid_patterns = self._validate_sc_dmr_patterns(df)

            # Format results
            results = []
            for _, row in valid_patterns.iterrows():
                result = {
                    'symbol': symbol,
                    'date': row['date'].strftime('%Y-%m-%d'),
                    'open': round(row['open'], 2),
                    'high': round(row['high'], 2),
                    'low': round(row['low'], 2),
                    'close': round(row['close'], 2),
                    'volume': int(row['volume']),
                    'dollar_volume': int(row['dollar_volume']),

                    # SC DMR specific metrics
                    'mean_reversion_score': round(row['mean_reversion_score'], 3),
                    'swing_magnitude': round(row['swing_magnitude'], 3),
                    'volume_surge_ratio': round(row['volume_surge_ratio'], 2),
                    'rsi_divergence': round(row['rsi_divergence'], 3),
                    'volatility_percentile': round(row['volatility_percentile'], 1),
                    'trend_strength': round(row['trend_strength'], 3),
                    'liquidity_score': round(row['liquidity_score'], 2),
                    'pattern_confidence': round(row['pattern_confidence'], 3),
                    'composite_score': round(row['composite_score'], 3),

                    # Binary indicators
                    'is_oversold_bounce': int(row['is_oversold_bounce']),
                    'is_volume_confirmed': int(row['is_volume_confirmed']),
                    'is_trend_aligned': int(row['is_trend_aligned']),
                    'sc_dmr_qualified': int(row['sc_dmr_qualified'])
                }
                results.append(result)

            return results

        except Exception as e:
            print(f"SC DMR analysis failed for {symbol}: {str(e)}")
            return []

    def _calculate_technical_indicators(self, df):
        """Calculate comprehensive technical indicators"""
        df = df.copy()

        # Price-based indicators
        df['sma_20'] = talib.SMA(df['close'], timeperiod=self.config['dmr_base_period'])
        df['ema_12'] = talib.EMA(df['close'], timeperiod=12)
        df['ema_26'] = talib.EMA(df['close'], timeperiod=26)

        # Bollinger Bands with dynamic sensitivity
        bb_period = int(self.config['dmr_base_period'] * self.config['dmr_sensitivity'])
        df['bb_upper'], df['bb_middle'], df['bb_lower'] = talib.BBANDS(
            df['close'], timeperiod=bb_period, nbdevup=2, nbdevdn=2
        )

        # RSI with custom parameters
        df['rsi'] = talib.RSI(df['close'], timeperiod=14)
        df['rsi_ma'] = df['rsi'].rolling(window=5).mean()

        # MACD
        df['macd'], df['macd_signal'], df['macd_histogram'] = talib.MACD(df['close'])

        # Average True Range
        df['atr'] = talib.ATR(df['high'], df['low'], df['close'], timeperiod=14)
        df['atr_percent'] = df['atr'] / df['close'] * 100

        # Stochastic Oscillator
        df['stoch_k'], df['stoch_d'] = talib.STOCH(df['high'], df['low'], df['close'])

        return df

    def _analyze_mean_reversion_patterns(self, df):
        """Analyze mean reversion patterns with sophisticated logic"""
        df = df.copy()

        # Price deviation from moving averages
        df['price_dev_sma'] = (df['close'] - df['sma_20']) / df['sma_20'] * 100
        df['price_dev_ema'] = (df['close'] - df['ema_12']) / df['ema_12'] * 100

        # Bollinger Band position
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
        df['bb_squeeze'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']

        # Z-score calculation for mean reversion
        price_window = self.config['dmr_base_period']
        df['price_zscore'] = (df['close'] - df['close'].rolling(price_window).mean()) / df['close'].rolling(price_window).std()

        # Mean reversion scoring (complex multi-factor)
        df['mean_reversion_score'] = (
            np.abs(df['price_zscore']) * 0.3 +
            (1 - df['bb_position']).clip(0, 1) * 0.25 +  # Favor lower BB position
            (100 - df['rsi']).clip(0, 100) / 100 * 0.25 +  # Favor low RSI
            np.abs(df['price_dev_sma']).clip(0, 20) / 20 * 0.2  # Price deviation factor
        )

        return df

    def _analyze_volume_patterns(self, df):
        """Comprehensive volume analysis"""
        df = df.copy()

        # Volume statistics
        df['volume_ma'] = df['volume'].rolling(window=self.volume_ma_period).mean()
        df['volume_std'] = df['volume'].rolling(window=self.volume_ma_period).std()
        df['volume_zscore'] = (df['volume'] - df['volume_ma']) / df['volume_std']

        # Dollar volume
        df['dollar_volume'] = df['close'] * df['volume']
        df['dollar_volume_ma'] = df['dollar_volume'].rolling(window=self.volume_ma_period).mean()

        # Volume surge detection
        df['volume_surge_ratio'] = df['volume'] / df['volume_ma']
        df['is_volume_surge'] = df['volume_surge_ratio'] >= 1.5

        # Volume-price trend analysis
        df['vpt'] = (df['volume'] * ((df['close'] - df['close'].shift(1)) / df['close'].shift(1))).cumsum()
        df['vpt_ma'] = df['vpt'].rolling(window=10).mean()
        df['vpt_trend'] = df['vpt'] - df['vpt_ma']

        # Volume percentile (dynamic threshold)
        volume_window = min(len(df), 252)  # 1 year of data
        df['volume_percentile'] = df['volume'].rolling(window=volume_window, min_periods=20).rank(pct=True) * 100

        return df

    def _detect_swing_patterns(self, df):
        """Detect swing patterns with complex logic"""
        df = df.copy()

        # Swing high/low detection
        swing_window = self.config['price_momentum_window']
        df['is_swing_high'] = (
            (df['high'] == df['high'].rolling(swing_window*2+1, center=True).max()) &
            (df['high'] > df['high'].shift(swing_window)) &
            (df['high'] > df['high'].shift(-swing_window))
        )

        df['is_swing_low'] = (
            (df['low'] == df['low'].rolling(swing_window*2+1, center=True).min()) &
            (df['low'] < df['low'].shift(swing_window)) &
            (df['low'] < df['low'].shift(-swing_window))
        )

        # Calculate swing magnitude
        df['swing_high_price'] = df['high'].where(df['is_swing_high']).fillna(method='ffill')
        df['swing_low_price'] = df['low'].where(df['is_swing_low']).fillna(method='ffill')
        df['swing_magnitude'] = abs(df['swing_high_price'] - df['swing_low_price']) / df['close']

        # Trend strength calculation
        trend_period = self.config['trend_confirmation_period']
        df['price_momentum'] = (df['close'] - df['close'].shift(trend_period)) / df['close'].shift(trend_period)
        df['trend_strength'] = df['price_momentum'].rolling(window=5).mean()

        return df

    def _calculate_composite_scores(self, df):
        """Calculate composite scoring for pattern validation"""
        df = df.copy()

        # Volatility percentile
        volatility_window = self.volatility_window
        df['volatility'] = df['atr_percent'].rolling(window=volatility_window).std()
        df['volatility_percentile'] = df['volatility'].rolling(window=volatility_window).rank(pct=True) * 100

        # RSI divergence detection
        df['rsi_divergence'] = abs(df['rsi'] - df['rsi_ma'])

        # Liquidity scoring
        min_dollar_vol = self.config['liquidity_min_dollar_volume']
        df['liquidity_score'] = np.minimum(df['dollar_volume'] / min_dollar_vol, 3.0)

        # Pattern confidence (multi-factor composite)
        df['pattern_confidence'] = (
            df['mean_reversion_score'] * 0.25 +
            np.minimum(df['volume_surge_ratio'], 3) / 3 * 0.20 +
            df['liquidity_score'] / 3 * 0.15 +
            (100 - abs(df['rsi'] - 50)) / 50 * 0.15 +  # RSI middle deviation
            np.minimum(df['swing_magnitude'], 0.1) / 0.1 * 0.15 +
            (1 - abs(df['bb_position'] - 0.2)) * 0.10  # Favor 20% BB position
        )

        # Composite score (final ranking metric)
        df['composite_score'] = (
            df['pattern_confidence'] * 0.4 +
            df['mean_reversion_score'] * 0.3 +
            np.minimum(df['volume_percentile'], 95) / 95 * 0.2 +
            df['liquidity_score'] / 3 * 0.1
        )

        return df

    def _validate_sc_dmr_patterns(self, df):
        """Final validation with strict criteria"""
        df = df.copy()

        # Binary classification flags
        df['is_oversold_bounce'] = (
            (df['rsi'] <= self.dynamic_rsi_oversold) &
            (df['bb_position'] <= 0.2) &
            (df['price_zscore'] <= -self.config['mean_reversion_threshold'])
        )

        df['is_volume_confirmed'] = (
            (df['volume_percentile'] >= self.dynamic_volume_threshold) &
            (df['dollar_volume'] >= self.config['liquidity_min_dollar_volume'])
        )

        df['is_trend_aligned'] = (
            (df['trend_strength'] < 0) &  # Downtrend for mean reversion opportunity
            (df['swing_magnitude'] >= self.config['swing_magnitude_min'])
        )

        # Final SC DMR qualification
        df['sc_dmr_qualified'] = (
            df['is_oversold_bounce'] &
            df['is_volume_confirmed'] &
            df['is_trend_aligned'] &
            (df['pattern_confidence'] >= self.config['pattern_confidence_min']) &
            (df['volatility_percentile'] >= self.config['volatility_percentile']) &
            (df['volatility_percentile'] <= 90)  # Not too volatile
        )

        return df[df['sc_dmr_qualified'] == True]

def run_sc_dmr_scan(symbol_list, start_date, end_date):
    """Main execution function for SC DMR scanner"""

    analyzer = SCDMRAnalyzer(symbol_list)
    all_results = []

    print(f"Starting SC DMR scan for {len(symbol_list)} symbols...")

    for symbol in symbol_list:
        try:
            # In real implementation, this would fetch actual market data
            symbol_data = generate_mock_data(symbol, start_date, end_date)

            if symbol_data is not None and len(symbol_data) > 0:
                results = analyzer.analyze_symbol(symbol_data, symbol)
                all_results.extend(results)
                print(f"SC DMR analysis complete for {symbol}: {len(results)} patterns found")

        except Exception as e:
            print(f"Error analyzing {symbol}: {str(e)}")
            continue

    print(f"SC DMR scan completed. Total patterns found: {len(all_results)}")
    return all_results

def generate_mock_data(symbol, start_date, end_date):
    """Generate realistic mock data for testing"""
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    dates = dates[dates.weekday < 5]  # Business days only

    # Generate realistic OHLCV data
    np.random.seed(hash(symbol) % 2**32)
    base_price = 20 + hash(symbol) % 180

    data = []
    for i, date in enumerate(dates):
        if i == 0:
            prev_close = base_price
        else:
            prev_close = data[i-1]['close']

        # Simulate realistic price movements with volatility clustering
        volatility = 0.015 + (hash(symbol + str(i)) % 100) / 5000
        gap = np.random.normal(0, 0.005)

        open_price = prev_close * (1 + gap)

        # Intraday movement
        high_mult = 1 + abs(np.random.normal(0, volatility))
        low_mult = 1 - abs(np.random.normal(0, volatility))

        high = open_price * high_mult
        low = open_price * low_mult

        # Close price within high/low range
        close_ratio = np.random.beta(2, 2)  # Bias toward middle
        close = low + (high - low) * close_ratio

        # Volume with log-normal distribution
        base_volume = 1000000 + hash(symbol) % 5000000
        volume = int(np.random.lognormal(np.log(base_volume), 0.3))

        data.append({
            'date': date,
            'open': open_price,
            'high': max(open_price, high, close),
            'low': min(open_price, low, close),
            'close': close,
            'volume': volume
        })

    return pd.DataFrame(data)

if __name__ == "__main__":
    # Example usage
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'CRM', 'ADBE']
    start_date = (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d')
    end_date = datetime.now().strftime('%Y-%m-%d')

    results = run_sc_dmr_scan(symbols, start_date, end_date)

    if results:
        # Display summary statistics
        df_results = pd.DataFrame(results)
        print(f"\\nSC DMR Scan Summary:")
        print(f"Total patterns: {len(df_results)}")
        print(f"Average composite score: {df_results['composite_score'].mean():.3f}")
        print(f"Average pattern confidence: {df_results['pattern_confidence'].mean():.3f}")

        # Top patterns
        top_patterns = df_results.nlargest(5, 'composite_score')
        print(f"\\nTop 5 SC DMR patterns:")
        for _, row in top_patterns.iterrows():
            print(f"{row['symbol']} ({row['date']}): Score {row['composite_score']:.3f}, Confidence {row['pattern_confidence']:.3f}")
    else:
        print("No SC DMR patterns found.")
`
  },

  simple_gap_scanner: {
    name: "Simple Gap Scanner (Easy)",
    description: "Basic gap scanner for testing parameter discovery",
    difficulty: "Low",
    code: `# Simple Gap Scanner
import pandas as pd

# Basic parameters
min_gap_percent = 2.0
min_volume = 500000
min_price = 10.0

def scan_gaps(ticker_list, start_date, end_date):
    results = []

    for ticker in ticker_list:
        # Get data (placeholder)
        data = get_stock_data(ticker, start_date, end_date)

        # Calculate gap
        data['gap_percent'] = ((data['open'] - data['prev_close']) / data['prev_close']) * 100

        # Apply filters
        filtered = data[
            (data['gap_percent'] >= min_gap_percent) &
            (data['volume'] >= min_volume) &
            (data['prev_close'] >= min_price)
        ]

        for _, row in filtered.iterrows():
            results.append({
                'ticker': ticker,
                'date': row['date'],
                'gap_percent': row['gap_percent'],
                'volume': row['volume'],
                'price': row['close']
            })

    return results

def main():
    tickers = ['AAPL', 'MSFT', 'GOOGL']
    results = scan_gaps(tickers, '2024-01-01', '2024-12-31')
    print(f"Found {len(results)} gap patterns")
    return results

if __name__ == "__main__":
    main()`
  }
};

interface TestScenariosProps {
  onLoadScenario: (code: string) => void;
  className?: string;
}

const TestScenarios: React.FC<TestScenariosProps> = ({ onLoadScenario, className }) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const handleLoadScenario = (scenarioKey: string) => {
    const scenario = testScenarios[scenarioKey as keyof typeof testScenarios];
    if (scenario) {
      onLoadScenario(scenario.code);
      setSelectedScenario(scenarioKey);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Very High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`test-scenarios ${className}`}>
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Test Scenarios</h3>
          <p className="text-gray-600">
            Try these real-world scanner examples to test the human-in-the-loop formatting system.
            Each scenario demonstrates different aspects of collaborative formatting.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(testScenarios).map(([key, scenario]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium">{scenario.name}</h4>
                  <Badge className={getDifficultyColor(scenario.difficulty)}>
                    {scenario.difficulty}
                  </Badge>
                </div>
                <Button
                  onClick={() => handleLoadScenario(key)}
                  variant={selectedScenario === key ? "default" : "outline"}
                  size="sm"
                >
                  {selectedScenario === key ? "Loaded" : "Load"}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>

              {/* Code Preview */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  Preview code ({scenario.code.length} characters)
                </summary>
                <pre className="bg-gray-100 p-2 mt-2 rounded text-xs overflow-x-auto max-h-32">
                  {scenario.code.substring(0, 500)}...
                </pre>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Testing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Start with the Simple Gap Scanner to understand the workflow</li>
            <li>• Try LC D2 Scanner to see complex parameter discovery in action</li>
            <li>• Use SC DMR Scanner to test handling of highly interdependent parameters</li>
            <li>• Compare results with traditional formatting to see the differences</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default TestScenarios;