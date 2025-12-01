"""
Production Trading Scanner Agent
Real-time market analysis and signal generation
"""

import asyncio
import aiohttp
import websockets
import redis
import pandas as pd
import numpy as np
import talib
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MarketData:
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: float

@dataclass
class TechnicalIndicators:
    symbol: str
    timestamp: datetime
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    bollinger_upper: Optional[float] = None
    bollinger_lower: Optional[float] = None
    atr: Optional[float] = None

@dataclass
class TradingSignal:
    symbol: str
    timestamp: datetime
    signal_type: str  # 'BUY', 'SELL', 'HOLD'
    strength: float  # 0-1
    indicators_used: List[str]
    price: float
    confidence: float  # 0-1
    metadata: Dict

class PolygonWebSocket:
    """Real-time Polygon.io WebSocket client"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.ws_url = f"wss://socket.polygon.io/stocks"
        self.websocket = None
        self.session = None
        self.callbacks = {}

    async def connect(self):
        """Establish WebSocket connection"""
        try:
            self.session = aiohttp.ClientSession()
            self.websocket = await self.session.ws_connect(self.ws_url)

            # Authentication
            auth_message = {"action": "auth", "params": self.api_key}
            await self.websocket.send_json(auth_message)

            auth_response = await self.websocket.receive_json()
            if auth_response[0].get('status') != 'connected':
                raise ConnectionError("Polygon authentication failed")

            logger.info("Connected to Polygon WebSocket")

        except Exception as e:
            logger.error(f"Failed to connect to Polygon: {e}")
            raise

    async def subscribe(self, symbols: List[str]):
        """Subscribe to real-time data for symbols"""
        if not self.websocket:
            await self.connect()

        subscribe_message = {
            "action": "subscribe",
            "params": ",".join([f"T.{symbol}" for symbol in symbols])
        }
        await self.websocket.send_json(subscribe_message)
        logger.info(f"Subscribed to {len(symbols)} symbols")

    async def receive_data(self) -> Optional[MarketData]:
        """Receive real-time market data"""
        if not self.websocket:
            return None

        try:
            message = await self.websocket.receive_json()
            if isinstance(message, list) and message:
                data = message[0]

                if data.get('ev') == 'T':  # Trade event
                    return MarketData(
                        symbol=data.get('sym'),
                        timestamp=datetime.fromtimestamp(data.get('t') / 1000),
                        open=0,  # Not available in trade data
                        high=0,
                        low=0,
                        close=data.get('p', 0),
                        volume=data.get('s', 0),
                        vwap=0
                    )
        except Exception as e:
            logger.error(f"Error receiving data: {e}")

        return None

class TechnicalAnalysisEngine:
    """Technical indicator calculations using TA-Lib"""

    def __init__(self):
        self.indicator_cache = {}

    def calculate_indicators(self, ohlcv_data: pd.DataFrame) -> TechnicalIndicators:
        """Calculate technical indicators for a symbol"""
        try:
            symbol = ohlcv_data['symbol'].iloc[0]
            close_prices = ohlcv_data['close'].values
            high_prices = ohlcv_data['high'].values
            low_prices = ohlcv_data['low'].values
            volumes = ohlcv_data['volume'].values

            # Moving averages
            sma_20 = talib.SMA(close_prices, timeperiod=20)[-1] if len(close_prices) >= 20 else None
            sma_50 = talib.SMA(close_prices, timeperiod=50)[-1] if len(close_prices) >= 50 else None
            ema_12 = talib.EMA(close_prices, timeperiod=12)[-1] if len(close_prices) >= 12 else None
            ema_26 = talib.EMA(close_prices, timeperiod=26)[-1] if len(close_prices) >= 26 else None

            # RSI
            rsi = talib.RSI(close_prices, timeperiod=14)[-1] if len(close_prices) >= 14 else None

            # MACD
            macd, macd_signal, _ = talib.MACD(close_prices)
            macd_val = macd[-1] if not np.isnan(macd[-1]) else None
            macd_sig = macd_signal[-1] if not np.isnan(macd_signal[-1]) else None

            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = talib.BBANDS(close_prices, timeperiod=20)
            bb_upper_val = bb_upper[-1] if not np.isnan(bb_upper[-1]) else None
            bb_lower_val = bb_lower[-1] if not np.isnan(bb_lower[-1]) else None

            # ATR
            atr = talib.ATR(high_prices, low_prices, close_prices, timeperiod=14)
            atr_val = atr[-1] if not np.isnan(atr[-1]) else None

            return TechnicalIndicators(
                symbol=symbol,
                timestamp=datetime.now(),
                sma_20=sma_20,
                sma_50=sma_50,
                ema_12=ema_12,
                ema_26=ema_26,
                rsi=rsi,
                macd=macd_val,
                macd_signal=macd_sig,
                bollinger_upper=bb_upper_val,
                bollinger_lower=bb_lower_val,
                atr=atr_val
            )

        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return TechnicalIndicators(symbol="", timestamp=datetime.now())

class SignalGenerator:
    """Generate trading signals based on technical indicators"""

    def __init__(self):
        self.signal_thresholds = {
            'rsi_oversold': 30,
            'rsi_overbought': 70,
            'macd_crossover_threshold': 0.001,
            'bollinger_width_threshold': 0.02
        }

    def generate_signals(self, indicators: TechnicalIndicators, current_price: float) -> List[TradingSignal]:
        """Generate trading signals from technical indicators"""
        signals = []

        # RSI signals
        if indicators.rsi:
            if indicators.rsi < self.signal_thresholds['rsi_oversold']:
                signals.append(TradingSignal(
                    symbol=indicators.symbol,
                    timestamp=indicators.timestamp,
                    signal_type='BUY',
                    strength=min(1.0, (self.signal_thresholds['rsi_oversold'] - indicators.rsi) / 20),
                    indicators_used=['RSI'],
                    price=current_price,
                    confidence=0.7,
                    metadata={'rsi_value': indicators.rsi, 'strategy': 'rsi_oversold'}
                ))
            elif indicators.rsi > self.signal_thresholds['rsi_overbought']:
                signals.append(TradingSignal(
                    symbol=indicators.symbol,
                    timestamp=indicators.timestamp,
                    signal_type='SELL',
                    strength=min(1.0, (indicators.rsi - self.signal_thresholds['rsi_overbought']) / 20),
                    indicators_used=['RSI'],
                    price=current_price,
                    confidence=0.7,
                    metadata={'rsi_value': indicators.rsi, 'strategy': 'rsi_overbought'}
                ))

        # MACD crossover signals
        if indicators.macd and indicators.macd_signal:
            if indicators.macd > indicators.macd_signal + self.signal_thresholds['macd_crossover_threshold']:
                signals.append(TradingSignal(
                    symbol=indicators.symbol,
                    timestamp=indicators.timestamp,
                    signal_type='BUY',
                    strength=0.6,
                    indicators_used=['MACD'],
                    price=current_price,
                    confidence=0.6,
                    metadata={'macd': indicators.macd, 'signal': indicators.macd_signal}
                ))
            elif indicators.macd < indicators.macd_signal - self.signal_thresholds['macd_crossover_threshold']:
                signals.append(TradingSignal(
                    symbol=indicators.symbol,
                    timestamp=indicators.timestamp,
                    signal_type='SELL',
                    strength=0.6,
                    indicators_used=['MACD'],
                    price=current_price,
                    confidence=0.6,
                    metadata={'macd': indicators.macd, 'signal': indicators.macd_signal}
                ))

        # Bollinger Bands signals
        if indicators.bollinger_upper and indicators.bollinger_lower:
            bb_width = (indicators.bollinger_upper - indicators.bollinger_lower) / indicators.bollinger_lower
            if current_price <= indicators.bollinger_lower and bb_width > self.signal_thresholds['bollinger_width_threshold']:
                signals.append(TradingSignal(
                    symbol=indicators.symbol,
                    timestamp=indicators.timestamp,
                    signal_type='BUY',
                    strength=0.5,
                    indicators_used=['Bollinger Bands'],
                    price=current_price,
                    confidence=0.5,
                    metadata={'bb_position': 'lower_band', 'bb_width': bb_width}
                ))
            elif current_price >= indicators.bollinger_upper and bb_width > self.signal_thresholds['bollinger_width_threshold']:
                signals.append(TradingSignal(
                    symbol=indicators.symbol,
                    timestamp=indicators.timestamp,
                    signal_type='SELL',
                    strength=0.5,
                    indicators_used=['Bollinger Bands'],
                    price=current_price,
                    confidence=0.5,
                    metadata={'bb_position': 'upper_band', 'bb_width': bb_width}
                ))

        return signals

class TradingScanner:
    """Main trading scanner agent"""

    def __init__(self, config: Dict):
        self.config = config
        self.polygon_ws = PolygonWebSocket(config['polygon_api_key'])
        self.redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        self.ta_engine = TechnicalAnalysisEngine()
        self.signal_generator = SignalGenerator()
        self.data_history = {}  # Store historical OHLCV data
        self.active_symbols = config.get('symbols', [])
        self.running = False

    async def initialize(self):
        """Initialize the scanner"""
        try:
            await self.polygon_ws.connect()
            await self.polygon_ws.subscribe(self.active_symbols)
            logger.info(f"Trading scanner initialized with {len(self.active_symbols)} symbols")
        except Exception as e:
            logger.error(f"Failed to initialize scanner: {e}")
            raise

    def load_historical_data(self, symbol: str, days: int = 100):
        """Load historical data from Polygon REST API or database"""
        # Implementation would fetch historical data
        # For now, create dummy data
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
        np.random.seed(42)

        base_price = 100
        returns = np.random.normal(0.001, 0.02, days)
        prices = [base_price]
        for ret in returns:
            prices.append(prices[-1] * (1 + ret))

        ohlcv_data = pd.DataFrame({
            'date': dates,
            'symbol': symbol,
            'open': prices[:-1],
            'high': [p * (1 + abs(np.random.normal(0, 0.01))) for p in prices[:-1]],
            'low': [p * (1 - abs(np.random.normal(0, 0.01))) for p in prices[:-1]],
            'close': prices[:-1],
            'volume': np.random.randint(100000, 1000000, days)
        })

        self.data_history[symbol] = ohlcv_data
        return ohlcv_data

    def update_data_history(self, market_data: MarketData):
        """Update historical data with new market data"""
        if market_data.symbol not in self.data_history:
            self.data_history[market_data.symbol] = self.load_historical_data(market_data.symbol)

        # Update the latest row with new data
        df = self.data_history[market_data.symbol]
        latest_idx = df.index[-1]

        df.at[latest_idx, 'close'] = market_data.close
        df.at[latest_idx, 'volume'] = market_data.volume
        df.at[latest_idx, 'high'] = max(df.at[latest_idx, 'high'], market_data.close)
        df.at[latest_idx, 'low'] = min(df.at[latest_idx, 'low'], market_data.close)

    async def process_market_data(self, market_data: MarketData):
        """Process incoming market data and generate signals"""
        try:
            # Update historical data
            self.update_data_history(market_data)

            # Calculate technical indicators
            ohlcv_data = self.data_history[market_data.symbol]
            indicators = self.ta_engine.calculate_indicators(ohlcv_data)

            # Generate signals
            signals = self.signal_generator.generate_signals(indicators, market_data.close)

            # Store signals in Redis for other agents
            for signal in signals:
                await self.store_signal(signal)

            # Cache latest indicators
            await self.cache_indicators(indicators)

        except Exception as e:
            logger.error(f"Error processing market data for {market_data.symbol}: {e}")

    async def store_signal(self, signal: TradingSignal):
        """Store trading signal in Redis"""
        try:
            signal_key = f"signals:{signal.symbol}:{signal.timestamp.isoformat()}"
            signal_data = {
                'symbol': signal.symbol,
                'timestamp': signal.timestamp.isoformat(),
                'signal_type': signal.signal_type,
                'strength': signal.strength,
                'indicators_used': ','.join(signal.indicators_used),
                'price': signal.price,
                'confidence': signal.confidence,
                'metadata': str(signal.metadata)
            }

            self.redis_client.setex(signal_key, 3600, str(signal_data))  # Expire after 1 hour

            # Also add to a list for recent signals
            self.redis_client.lpush(f"signals:recent:{signal.symbol}", str(signal_data))
            self.redis_client.ltrim(f"signals:recent:{signal.symbol}", 0, 99)  # Keep last 100 signals

            logger.info(f"Stored {signal.signal_type} signal for {signal.symbol} with strength {signal.strength:.2f}")

        except Exception as e:
            logger.error(f"Error storing signal: {e}")

    async def cache_indicators(self, indicators: TechnicalIndicators):
        """Cache technical indicators in Redis"""
        try:
            cache_key = f"indicators:{indicators.symbol}"
            indicators_data = {
                'symbol': indicators.symbol,
                'timestamp': indicators.timestamp.isoformat(),
                'sma_20': indicators.sma_20,
                'sma_50': indicators.sma_50,
                'ema_12': indicators.ema_12,
                'ema_26': indicators.ema_26,
                'rsi': indicators.rsi,
                'macd': indicators.macd,
                'macd_signal': indicators.macd_signal,
                'bollinger_upper': indicators.bollinger_upper,
                'bollinger_lower': indicators.bollinger_lower,
                'atr': indicators.atr
            }

            self.redis_client.setex(cache_key, 300, str(indicators_data))  # Expire after 5 minutes

        except Exception as e:
            logger.error(f"Error caching indicators: {e}")

    async def run_scanner(self):
        """Main scanner loop"""
        logger.info("Starting trading scanner...")
        self.running = True

        # Load historical data for all symbols
        for symbol in self.active_symbols:
            self.load_historical_data(symbol)

        while self.running:
            try:
                # Receive real-time data
                market_data = await self.polygon_ws.receive_data()

                if market_data:
                    await self.process_market_data(market_data)

                # Small delay to prevent CPU overload
                await asyncio.sleep(0.1)

            except KeyboardInterrupt:
                logger.info("Scanner stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in scanner loop: {e}")
                await asyncio.sleep(1)  # Brief pause before retrying

    async def stop_scanner(self):
        """Stop the scanner"""
        self.running = False
        if self.polygon_ws.websocket:
            await self.polygon_ws.websocket.close()
        if self.polygon_ws.session:
            await self.polygon_ws.session.close()
        logger.info("Trading scanner stopped")

# Configuration and execution
if __name__ == "__main__":
    config = {
        'polygon_api_key': 'your_polygon_api_key_here',
        'symbols': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC']
    }

    scanner = TradingScanner(config)

    try:
        asyncio.run(scanner.run_scanner())
    except KeyboardInterrupt:
        print("Shutting down scanner...")
    finally:
        asyncio.run(scanner.stop_scanner())