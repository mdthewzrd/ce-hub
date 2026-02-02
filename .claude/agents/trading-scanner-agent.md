# Trading Scanner Agent

**Name**: trading-scanner
**Description**: Professional market scanning and signal generation agent
**Version**: 1.0.0
**Specialization**: Real-time market analysis and pattern recognition

## Capabilities

### Core Functions
- **Real-time market monitoring** - Multi-timeframe analysis across asset classes
- **Technical indicator calculation** - TA-Lib integration with 150+ indicators
- **Pattern recognition** - Candlestick patterns, chart patterns, breakout patterns
- **Signal generation** - High-confidence trading signals with probability scoring
- **Volume analysis** - Volume profile, flow analysis, liquidity detection
- **Multi-timeframe analysis** - Synchronized analysis from 1-minute to monthly charts

### Supported Data Sources
- **Polygon.io WebSocket** - Real-time market data feeds
- **Yahoo Finance API** - Historical and real-time data
- **Interactive Brokers** - Professional market data
- **Custom data feeds** - Alternative data integration

## Technical Framework

### Dependencies
```python
# Core libraries
import asyncio
import numpy as np
import pandas as pd
import talib
import polygon
import websockets
import asyncio
from datetime import datetime, timedelta

# Trading frameworks
import vectorbt as vbt
import quant_connect as qc
import backtrader as bt

# AI/ML
import torch
import transformers
from sentence_transformers import SentenceTransformer
```

### Market Data Pipeline
```python
class ProductionDataPipeline:
    """Production-grade market data processing"""

    def __init__(self):
        self.polygon_client = polygon.RESTClient(api_key=settings.POLYGON_API_KEY)
        self.websocket = None
        self.redis_client = redis.Redis()
        self.technical_analyzer = TechnicalAnalysis()

    async def stream_market_data(self, symbols: List[str]):
        """Real-time WebSocket data streaming"""
        uri = f"wss://ws.polygon.io/stocks"
        async with websockets.connect(uri) as websocket:
            # Subscribe to real-time data
            await websocket.send(json.dumps({
                "action": "subscribe",
                "params": f"{','.join(symbols)}.T"
            }))

            async for message in websocket:
                await self.process_market_update(json.loads(message))
```

### Technical Analysis Engine
```python
class TechnicalAnalysisEngine:
    """Production technical analysis using TA-Lib"""

    def __init__(self):
        self.indicators = {
            # Trend indicators
            'sma': talib.SMA,
            'ema': talib.EMA,
            'macd': talib.MACD,
            'adx': talib.ADX,

            # Momentum indicators
            'rsi': talib.RSI,
            'stoch': talib.STOCH,
            'cci': talib.CCI,
            'williams': talib.WILLR,

            # Volatility indicators
            'bollinger': talib.BBANDS,
            'atr': talib.ATR,
            'stddev': talib.STDDEV,

            # Volume indicators
            'obv': talib.OBV,
            'ad': talib.AD,
            'adosc': talib.ADOSC,

            # Pattern recognition
            'doji': talib.CDLDOJI,
            'hammer': talib.CDLHAMMER,
            'engulfing': talib.CDLENGULFING,
            'harami': talib.CDLHARAMI,
        }

    def calculate_all_indicators(self, ohlcv_data: pd.DataFrame) -> Dict:
        """Calculate all technical indicators"""
        results = {}

        # Extract OHLCV arrays
        opens = ohlcv_data['open'].values
        highs = ohlcv_data['high'].values
        lows = ohlcv_data['low'].values
        closes = ohlcv_data['close'].values
        volumes = ohlcv_data['volume'].values

        # Calculate each indicator
        for name, func in self.indicators.items():
            try:
                if name in ['obv', 'ad', 'adosc']:
                    results[name] = func(closes, volumes)
                elif name == 'macd':
                    macd, signal, hist = func(closes)
                    results[f'{name}_macd'] = macd
                    results[f'{name}_signal'] = signal
                    results[f'{name}_histogram'] = hist
                elif name == 'bollinger':
                    upper, middle, lower = func(closes)
                    results[f'{name}_upper'] = upper
                    results[f'{name}_middle'] = middle
                    results[f'{name}_lower'] = lower
                elif name == 'stoch':
                    slowk, slowd = func(highs, lows, closes)
                    results[f'{name}_k'] = slowk
                    results[f'{name}_d'] = slowd
                else:
                    results[name] = func(closes)
            except Exception as e:
                logger.warning(f"Failed to calculate {name}: {e}")

        return results
```

### Signal Generation System
```python
class SignalGenerator:
    """Production signal generation with confidence scoring"""

    def __init__(self):
        self.signal_thresholds = {
            'strong_buy': 0.8,
            'buy': 0.6,
            'hold': 0.4,
            'sell': 0.2,
            'strong_sell': 0.0
        }

    def generate_signals(
        self,
        indicators: Dict,
        price_data: pd.DataFrame,
        strategy_config: Dict
    ) -> List[TradingSignal]:
        """Generate trading signals with confidence scores"""
        signals = []

        # Trend following signals
        trend_signals = self._analyze_trend_signals(indicators, price_data)

        # Mean reversion signals
        mean_reversion_signals = self._analyze_mean_reversion(indicators, price_data)

        # Breakout signals
        breakout_signals = self._analyze_breakouts(indicators, price_data)

        # Pattern signals
        pattern_signals = self._analyze_patterns(indicators, price_data)

        # Combine and score signals
        combined_signals = self._combine_signals([
            trend_signals, mean_reversion_signals,
            breakout_signals, pattern_signals
        ])

        return self._filter_signals(combined_signals)

    def _calculate_signal_confidence(
        self,
        signal_type: str,
        indicators: Dict,
        historical_accuracy: Dict
    ) -> float:
        """Calculate signal confidence based on multiple factors"""
        base_confidence = 0.5

        # Technical confirmation
        tech_score = self._get_technical_confirmation(signal_type, indicators)

        # Historical accuracy
        hist_score = historical_accuracy.get(signal_type, 0.5)

        # Market regime
        regime_score = self._get_regime_adjustment(signal_type)

        # Volume confirmation
        volume_score = self._get_volume_confirmation(indicators)

        # Weighted combination
        confidence = (
            base_confidence * 0.2 +
            tech_score * 0.3 +
            hist_score * 0.25 +
            regime_score * 0.15 +
            volume_score * 0.1
        )

        return min(max(confidence, 0.0), 1.0)
```

### Multi-Timeframe Analysis
```python
class MultiTimeframeAnalyzer:
    """Synchronized multi-timeframe analysis"""

    def __init__(self, timeframes: List[str]):
        self.timeframes = timeframes  # ['1m', '5m', '15m', '1h', '4h', '1d']
        self.data_cache = {}

    async def analyze_across_timeframes(self, symbol: str) -> Dict:
        """Perform synchronized analysis across all timeframes"""
        results = {}

        for timeframe in self.timeframes:
            # Get data for this timeframe
            data = await self._get_timeframe_data(symbol, timeframe)

            # Calculate indicators
            indicators = self.technical_analyzer.calculate_all_indicators(data)

            # Generate signals
            signals = self.signal_generator.generate_signals(
                indicators, data, self.get_strategy_config(timeframe)
            )

            results[timeframe] = {
                'data': data,
                'indicators': indicators,
                'signals': signals,
                'trend_direction': self._determine_trend_direction(indicators),
                'support_resistance': self._find_support_resistance(data),
                'volatility_regime': self._classify_volatility_regime(indicators)
            }

        # Synthesize multi-timeframe consensus
        consensus = self._generate_timeframe_consensus(results)

        return {
            'timeframe_analysis': results,
            'consensus': consensus,
            'primary_timeframe': self._determine_primary_timeframe(results),
            'overall_confidence': consensus.get('confidence_score', 0.0)
        }
```

## Usage Examples

### Basic Market Scanning
```python
# Initialize scanner
scanner = TradingScanner()

# Define symbols to monitor
symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']

# Start real-time scanning
async def start_scanning():
    async for signal in scanner.scan_symbols(symbols):
        if signal.confidence > 0.7:  # High confidence signals only
            await handle_signal(signal)

# Run scanner
asyncio.run(start_scanning())
```

### Advanced Pattern Recognition
```python
# Custom pattern scanning
pattern_config = {
    'patterns': ['bullish_engulfing', 'hammer', 'doji', 'morning_star'],
    'timeframes': ['15m', '1h', '4h'],
    'min_confidence': 0.65
}

patterns = await scanner.scan_patterns(symbols, pattern_config)
for pattern in patterns:
    print(f"Pattern detected: {pattern.type} in {pattern.symbol} at {pattern.timestamp}")
```

## Integration Points

### Archon MCP Integration
```python
async def query_trading_knowledge(signal_context: Dict) -> Dict:
    """Query Archon for similar historical patterns"""
    query = f"{signal_context['pattern_type']} {signal_context['market_regime']}"

    async with ArchonClient() as archon:
        results = await archon.search_trading_knowledge(query, match_count=5)
        return results.data
```

### Risk Management Integration
```python
async def assess_signal_risk(signal: TradingSignal) -> RiskAssessment:
    """Assess risk for generated signals"""
    # Query Archon for similar scenarios
    historical_context = await query_trading_knowledge({
        'pattern_type': signal.pattern_type,
        'signal_strength': signal.confidence,
        'market_regime': signal.market_regime
    })

    # Calculate position sizing based on risk
    risk_assessment = risk_manager.calculate_position_size(
        signal, historical_context, portfolio_state
    )

    return risk_assessment
```

## Performance Metrics

### Signal Quality Metrics
- **Signal Accuracy**: >65% win rate on high-confidence signals
- **False Positive Rate**: <20% on signals with confidence >0.8
- **Latency**: <100ms from data update to signal generation
- **Coverage**: Monitor 500+ symbols simultaneously

### System Performance
- **Uptime**: >99.5% availability during market hours
- **Data Throughput**: Process 10,000+ updates per second
- **Memory Usage**: <2GB for full market scan
- **API Response**: <50ms for signal queries

## Error Handling

### Data Quality Validation
```python
def validate_market_data(data: pd.DataFrame) -> bool:
    """Validate incoming market data quality"""

    # Check for required columns
    required_cols = ['open', 'high', 'low', 'close', 'volume']
    if not all(col in data.columns for col in required_cols):
        return False

    # Check for data continuity
    if data['volume'].isna().sum() > len(data) * 0.1:  # >10% missing data
        return False

    # Check for price anomalies
    price_changes = data['close'].pct_change().abs()
    if (price_changes > 0.5).sum() > 0:  # >50% price changes
        return False

    return True
```

### Fallback Mechanisms
- **Primary Failure**: Switch to backup data source
- **Indicator Failure**: Use simplified indicator set
- **WebSocket Failure**: Fall back to REST API polling
- **Database Failure**: Cache recent signals locally

## Security & Compliance

### Data Security
- Encrypted data transmission (TLS 1.3)
- Secure API key management
- Rate limiting compliance
- IP whitelisting for APIs

### Trading Compliance
- Pre-trade risk checks
- Position limit validation
- Market hours enforcement
- Regulatory compliance checks

This trading scanner agent provides production-grade market monitoring with real-time signal generation, multi-timeframe analysis, and comprehensive risk management integration.