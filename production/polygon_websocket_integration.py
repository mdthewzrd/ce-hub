"""
Production Polygon.io WebSocket Integration

Real-time market data streaming with professional-grade error handling,
reconnection logic, and data processing pipeline.

This replaces all mock implementations with production Polygon.io integration.
"""

import asyncio
import json
import logging
import websockets
import aiohttp
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import threading
import queue
import time
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Polygon WebSocket message types"""
    TRADE = "T"
    QUOTE = "Q"
    AGGREGATE = "A"
    IMBALANCE = "I"
    HALT = "H"
    ERROR = "error"
    STATUS = "status"

@dataclass
class TradeData:
    """Real-time trade data structure"""
    symbol: str
    price: float
    size: int
    timestamp: datetime
    exchange: str
    conditions: List[str]
    id: str
    tape: str

@dataclass
class QuoteData:
    """Real-time quote data structure"""
    symbol: str
    bid_price: float
    ask_price: float
    bid_size: int
    ask_size: int
    timestamp: datetime
    exchange: str
    conditions: List[str]

@dataclass
class AggregateData:
    """Real-time aggregate (OHLCV) data"""
    symbol: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    vwap: float
    timestamp: datetime
    otc: bool

class PolygonWebSocketClient:
    """
    Production-grade Polygon.io WebSocket client

    Features:
    - Automatic reconnection with exponential backoff
    - Data validation and cleaning
    - Real-time processing pipeline
    - Performance monitoring
    - Comprehensive error handling
    """

    def __init__(
        self,
        api_key: str,
        reconnect_attempts: int = 10,
        heartbeat_interval: int = 30,
        max_queue_size: int = 10000
    ):
        self.api_key = api_key
        self.reconnect_attempts = reconnect_attempts
        self.heartbeat_interval = heartbeat_interval
        self.max_queue_size = max_queue_size

        # WebSocket connection
        self.ws = None
        self.ws_url = f"wss://ws.polygon.io/stocks"

        # State management
        self.is_connected = False
        self.is_subscribed = False
        self.reconnect_count = 0

        # Data processing
        self.data_queue = asyncio.Queue(maxsize=max_queue_size)
        self.subscribers: Dict[str, List[Callable]] = {}

        # Performance monitoring
        self.message_count = 0
        self.connection_time = None
        self.last_message_time = None

        # Thread safety
        self._lock = asyncio.Lock()

    async def connect(self) -> bool:
        """
        Establish WebSocket connection to Polygon.io

        Returns:
            bool: Connection success status
        """
        try:
            # Close existing connection if any
            if self.ws:
                await self.ws.close()

            # Establish new connection
            auth_url = f"{self.ws_url}?apikey={self.api_key}"

            logger.info(f"Connecting to Polygon WebSocket: {self.ws_url}")
            self.ws = await websockets.connect(
                auth_url,
                ping_interval=20,
                ping_timeout=10,
                close_timeout=10
            )

            # Wait for authentication confirmation
            auth_message = await self.ws.recv()
            auth_data = json.loads(auth_message)

            if auth_data.get('status') == 'connected':
                self.is_connected = True
                self.connection_time = datetime.now(timezone.utc)
                self.reconnect_count = 0

                logger.info("Successfully connected to Polygon WebSocket")

                # Start message processing tasks
                asyncio.create_task(self._message_processor())
                asyncio.create_task(self._heartbeat_monitor())

                return True
            else:
                logger.error(f"Authentication failed: {auth_data}")
                return False

        except Exception as e:
            logger.error(f"Connection failed: {e}")
            return False

    async def disconnect(self):
        """Cleanly disconnect from WebSocket"""
        try:
            self.is_connected = False
            self.is_subscribed = False

            if self.ws:
                await self.ws.close()
                logger.info("Disconnected from Polygon WebSocket")
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")

    async def subscribe(
        self,
        symbols: List[str],
        message_types: List[MessageType] = None
    ) -> bool:
        """
        Subscribe to real-time data for specified symbols

        Args:
            symbols: List of stock symbols
            message_types: Types of messages to subscribe to

        Returns:
            bool: Subscription success status
        """
        if not self.is_connected:
            logger.error("Must be connected before subscribing")
            return False

        if message_types is None:
            message_types = [MessageType.TRADE, MessageType.QUOTE]

        try:
            # Build subscription parameters
            params = []
            for symbol in symbols:
                for msg_type in message_types:
                    params.append(f"{symbol}.{msg_type.value}")

            # Send subscription message
            subscribe_message = {
                "action": "subscribe",
                "params": ",".join(params)
            }

            await self.ws.send(json.dumps(subscribe_message))

            # Wait for confirmation
            response = await self.ws.recv()
            response_data = json.loads(response)

            if response_data.get('status') == 'auth_success':
                self.is_subscribed = True
                logger.info(f"Successfully subscribed to {len(symbols)} symbols")
                return True
            else:
                logger.error(f"Subscription failed: {response_data}")
                return False

        except Exception as e:
            logger.error(f"Subscription error: {e}")
            return False

    async def unsubscribe(self, symbols: List[str] = None) -> bool:
        """
        Unsubscribe from real-time data

        Args:
            symbols: List of symbols to unsubscribe from (None for all)

        Returns:
            bool: Unsubscription success status
        """
        if not self.is_connected or not self.is_subscribed:
            return True

        try:
            if symbols:
                # Unsubscribe specific symbols
                params = ",".join([f"{symbol}.*" for symbol in symbols])
                unsubscribe_message = {
                    "action": "unsubscribe",
                    "params": params
                }
            else:
                # Unsubscribe from all
                unsubscribe_message = {"action": "unsubscribe"}

            await self.ws.send(json.dumps(unsubscribe_message))
            self.is_subscribed = False

            logger.info("Successfully unsubscribed")
            return True

        except Exception as e:
            logger.error(f"Unsubscription error: {e}")
            return False

    def add_subscriber(self, event_type: str, callback: Callable):
        """
        Add callback for specific message types

        Args:
            event_type: 'trade', 'quote', 'aggregate', 'error'
            callback: Async callback function
        """
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []

        self.subscribers[event_type].append(callback)
        logger.info(f"Added subscriber for {event_type} events")

    def remove_subscriber(self, event_type: str, callback: Callable):
        """Remove callback for specific message types"""
        if event_type in self.subscribers:
            try:
                self.subscribers[event_type].remove(callback)
                logger.info(f"Removed subscriber for {event_type} events")
            except ValueError:
                pass

    async def _message_processor(self):
        """Process incoming WebSocket messages"""
        try:
            async for message in self.ws:
                try:
                    # Parse message
                    data = json.loads(message)

                    # Update monitoring
                    self.message_count += 1
                    self.last_message_time = datetime.now(timezone.utc)

                    # Handle different message types
                    if isinstance(data, list):
                        # Multiple messages
                        for msg in data:
                            await self._process_single_message(msg)
                    else:
                        # Single message
                        await self._process_single_message(data)

                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error: {e}")
                except Exception as e:
                    logger.error(f"Message processing error: {e}")

        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
            await self._handle_disconnect()
        except Exception as e:
            logger.error(f"Message processor error: {e}")
            await self._handle_disconnect()

    async def _process_single_message(self, data: Dict):
        """Process a single WebSocket message"""
        try:
            # Handle system messages
            if data.get('ev') == 'status':
                await self._notify_subscribers('status', data)
                return

            msg_type = data.get('ev')

            # Route based on message type
            if msg_type == MessageType.TRADE.value:
                trade = self._parse_trade_data(data)
                if trade:
                    await self._notify_subscribers('trade', trade)
                    await self._queue_data('trade', trade)

            elif msg_type == MessageType.QUOTE.value:
                quote = self._parse_quote_data(data)
                if quote:
                    await self._notify_subscribers('quote', quote)
                    await self._queue_data('quote', quote)

            elif msg_type == MessageType.AGGREGATE.value:
                aggregate = self._parse_aggregate_data(data)
                if aggregate:
                    await self._notify_subscribers('aggregate', aggregate)
                    await self._queue_data('aggregate', aggregate)

            elif msg_type == 'error':
                await self._notify_subscribers('error', data)
                logger.error(f"Polygon error: {data}")

        except Exception as e:
            logger.error(f"Single message processing error: {e}")

    def _parse_trade_data(self, data: Dict) -> Optional[TradeData]:
        """Parse trade message into TradeData object"""
        try:
            return TradeData(
                symbol=data['sym'],
                price=float(data['p']),
                size=int(data['s']),
                timestamp=datetime.fromtimestamp(data['t'] / 1000, timezone.utc),
                exchange=data['x'],
                conditions=data.get('c', []),
                id=data.get('i', ''),
                tape=data.get['tape', 'unknown']
            )
        except (KeyError, ValueError) as e:
            logger.error(f"Trade data parsing error: {e}")
            return None

    def _parse_quote_data(self, data: Dict) -> Optional[QuoteData]:
        """Parse quote message into QuoteData object"""
        try:
            return QuoteData(
                symbol=data['sym'],
                bid_price=float(data['bp']),
                ask_price=float(data['ap']),
                bid_size=int(data['bs']),
                ask_size=int(data['as']),
                timestamp=datetime.fromtimestamp(data['t'] / 1000, timezone.utc),
                exchange=data['x'],
                conditions=data.get('c', [])
            )
        except (KeyError, ValueError) as e:
            logger.error(f"Quote data parsing error: {e}")
            return None

    def _parse_aggregate_data(self, data: Dict) -> Optional[AggregateData]:
        """Parse aggregate message into AggregateData object"""
        try:
            return AggregateData(
                symbol=data['sym'],
                open=float(data['o']),
                high=float(data['h']),
                low=float(data['l']),
                close=float(data['c']),
                volume=int(data['v']),
                vwap=float(data['vw']),
                timestamp=datetime.fromtimestamp(data['t'] / 1000, timezone.utc),
                otc=data.get('otc', False)
            )
        except (KeyError, ValueError) as e:
            logger.error(f"Aggregate data parsing error: {e}")
            return None

    async def _notify_subscribers(self, event_type: str, data: Any):
        """Notify all subscribers of an event"""
        if event_type in self.subscribers:
            for callback in self.subscribers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(callback):
                        await callback(data)
                    else:
                        callback(data)
                except Exception as e:
                    logger.error(f"Subscriber callback error: {e}")

    async def _queue_data(self, data_type: str, data: Any):
        """Queue data for processing"""
        try:
            if not self.data_queue.full():
                await self.data_queue.put((data_type, data, datetime.now(timezone.utc)))
            else:
                logger.warning("Data queue is full, dropping message")
        except Exception as e:
            logger.error(f"Data queuing error: {e}")

    async def _heartbeat_monitor(self):
        """Monitor connection health and send heartbeats"""
        while self.is_connected:
            try:
                await asyncio.sleep(self.heartbeat_interval)

                # Check for recent activity
                if self.last_message_time:
                    time_since_last = (datetime.now(timezone.utc) - self.last_message_time).seconds

                    if time_since_last > self.heartbeat_interval * 2:
                        logger.warning("No recent messages, connection may be stale")
                        await self._handle_disconnect()
                        return

            except Exception as e:
                logger.error(f"Heartbeat monitor error: {e}")

    async def _handle_disconnect(self):
        """Handle WebSocket disconnection and attempt reconnection"""
        self.is_connected = False
        self.is_subscribed = False

        logger.warning("Handling disconnection, attempting reconnect")

        for attempt in range(self.reconnect_attempts):
            try:
                # Exponential backoff
                wait_time = min(2 ** attempt, 30)
                await asyncio.sleep(wait_time)

                logger.info(f"Reconnection attempt {attempt + 1}/{self.reconnect_attempts}")

                if await self.connect():
                    logger.info("Successfully reconnected")
                    return True

            except Exception as e:
                logger.error(f"Reconnection attempt {attempt + 1} failed: {e}")

        logger.error("Max reconnection attempts reached")
        return False

    def get_status(self) -> Dict:
        """Get current connection status and statistics"""
        uptime = None
        if self.connection_time:
            uptime = (datetime.now(timezone.utc) - self.connection_time).total_seconds()

        return {
            'connected': self.is_connected,
            'subscribed': self.is_subscribed,
            'reconnect_count': self.reconnect_count,
            'message_count': self.message_count,
            'uptime_seconds': uptime,
            'last_message_time': self.last_message_time,
            'queue_size': self.data_queue.qsize() if not self.data_queue.empty() else 0
        }

class RealTimeDataProcessor:
    """
    Real-time data processing and analysis pipeline

    Processes incoming market data and generates trading signals
    """

    def __init__(self, polygon_client: PolygonWebSocketClient):
        self.polygon_client = polygon_client
        self.symbol_data: Dict[str, pd.DataFrame] = {}
        self.technical_indicators = {}

        # Subscribe to real-time data
        self.polygon_client.add_subscriber('trade', self._process_trade)
        self.polygon_client.add_subscriber('quote', self._process_quote)
        self.polygon_client.add_subscriber('aggregate', self._process_aggregate)

    async def _process_trade(self, trade: TradeData):
        """Process real-time trade data"""
        try:
            # Update symbol data
            if trade.symbol not in self.symbol_data:
                self._initialize_symbol_data(trade.symbol)

            # Add new trade to historical data
            new_row = pd.DataFrame({
                'price': [trade.price],
                'volume': [trade.size],
                'timestamp': [trade.timestamp]
            })

            self.symbol_data[trade.symbol] = pd.concat([
                self.symbol_data[trade.symbol], new_row
            ], ignore_index=True)

            # Keep only recent data (last 1000 trades)
            if len(self.symbol_data[trade.symbol]) > 1000:
                self.symbol_data[trade.symbol] = self.symbol_data[trade.symbol].tail(1000)

            # Calculate technical indicators
            await self._update_indicators(trade.symbol)

            # Generate trading signals
            signals = await self._generate_signals(trade.symbol)

            if signals:
                logger.info(f"Generated signals for {trade.symbol}: {signals}")

        except Exception as e:
            logger.error(f"Trade processing error: {e}")

    async def _process_quote(self, quote: QuoteData):
        """Process real-time quote data"""
        try:
            # Calculate bid-ask spread
            spread = quote.ask_price - quote.bid_price
            spread_pct = (spread / quote.bid_price) * 100

            # Store quote data
            if quote.symbol not in self.symbol_data:
                self._initialize_symbol_data(quote.symbol)

            # Update bid-ask data
            self.symbol_data[quote.symbol].loc[
                self.symbol_data[quote.symbol].index[-1],
                ['bid_price', 'ask_price', 'bid_size', 'ask_size', 'spread', 'spread_pct']
            ] = [quote.bid_price, quote.ask_price, quote.bid_size, quote.ask_size, spread, spread_pct]

        except Exception as e:
            logger.error(f"Quote processing error: {e}")

    async def _process_aggregate(self, aggregate: AggregateData):
        """Process real-time aggregate (OHLCV) data"""
        try:
            # Update OHLCV data
            if aggregate.symbol not in self.symbol_data:
                self._initialize_symbol_data(aggregate.symbol)

            # Add OHLCV data
            new_row = pd.DataFrame({
                'open': [aggregate.open],
                'high': [aggregate.high],
                'low': [aggregate.low],
                'close': [aggregate.close],
                'volume': [aggregate.volume],
                'vwap': [aggregate.vwap],
                'timestamp': [aggregate.timestamp]
            })

            self.symbol_data[aggregate.symbol] = pd.concat([
                self.symbol_data[aggregate.symbol], new_row
            ], ignore_index=True)

            # Keep only recent data (last 500 bars)
            if len(self.symbol_data[aggregate.symbol]) > 500:
                self.symbol_data[aggregate.symbol] = self.symbol_data[aggregate.symbol].tail(500)

        except Exception as e:
            logger.error(f"Aggregate processing error: {e}")

    def _initialize_symbol_data(self, symbol: str):
        """Initialize data structure for a symbol"""
        self.symbol_data[symbol] = pd.DataFrame(columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume', 'vwap',
            'bid_price', 'ask_price', 'bid_size', 'ask_size', 'spread', 'spread_pct'
        ])

    async def _update_indicators(self, symbol: str):
        """Update technical indicators for a symbol"""
        try:
            data = self.symbol_data[symbol]

            if len(data) < 20:  # Need minimum data for indicators
                return

            # Calculate moving averages
            data['sma_20'] = data['close'].rolling(window=20).mean()
            data['sma_50'] = data['close'].rolling(window=50).mean()

            # Calculate RSI
            delta = data['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            data['rsi'] = 100 - (100 / (1 + rs))

            # Calculate Bollinger Bands
            sma = data['close'].rolling(window=20).mean()
            std = data['close'].rolling(window=20).std()
            data['bb_upper'] = sma + (std * 2)
            data['bb_lower'] = sma - (std * 2)

            # Store indicators
            self.technical_indicators[symbol] = {
                'sma_20': data['sma_20'].iloc[-1] if not pd.isna(data['sma_20'].iloc[-1]) else None,
                'sma_50': data['sma_50'].iloc[-1] if not pd.isna(data['sma_50'].iloc[-1]) else None,
                'rsi': data['rsi'].iloc[-1] if not pd.isna(data['rsi'].iloc[-1]) else None,
                'bb_upper': data['bb_upper'].iloc[-1] if not pd.isna(data['bb_upper'].iloc[-1]) else None,
                'bb_lower': data['bb_lower'].iloc[-1] if not pd.isna(data['bb_lower'].iloc[-1]) else None,
                'current_price': data['close'].iloc[-1],
                'volume': data['volume'].iloc[-1]
            }

        except Exception as e:
            logger.error(f"Indicator update error for {symbol}: {e}")

    async def _generate_signals(self, symbol: str) -> List[Dict]:
        """Generate trading signals based on indicators"""
        signals = []

        try:
            if symbol not in self.technical_indicators:
                return signals

            indicators = self.technical_indicators[symbol]

            # Moving average crossover signal
            if indicators['sma_20'] and indicators['sma_50']:
                if indicators['sma_20'] > indicators['sma_50']:
                    if indicators['current_price'] > indicators['sma_20']:
                        signals.append({
                            'type': 'MA_CROSSOVER_BUY',
                            'symbol': symbol,
                            'confidence': 0.7,
                            'reasoning': 'Price above both SMAs with bullish crossover'
                        })
                else:
                    if indicators['current_price'] < indicators['sma_20']:
                        signals.append({
                            'type': 'MA_CROSSOVER_SELL',
                            'symbol': symbol,
                            'confidence': 0.7,
                            'reasoning': 'Price below both SMAs with bearish crossover'
                        })

            # RSI signals
            if indicators['rsi']:
                if indicators['rsi'] < 30:
                    signals.append({
                        'type': 'RSI_OVERSOLD',
                        'symbol': symbol,
                        'confidence': 0.6,
                        'reasoning': f'RSI oversold at {indicators["rsi"]:.2f}'
                    })
                elif indicators['rsi'] > 70:
                    signals.append({
                        'type': 'RSI_OVERBOUGHT',
                        'symbol': symbol,
                        'confidence': 0.6,
                        'reasoning': f'RSI overbought at {indicators["rsi"]:.2f}'
                    })

            # Bollinger Band signals
            if all([indicators['bb_upper'], indicators['bb_lower'], indicators['current_price']]):
                if indicators['current_price'] > indicators['bb_upper']:
                    signals.append({
                        'type': 'BB_BREAKOUT_ABOVE',
                        'symbol': symbol,
                        'confidence': 0.5,
                        'reasoning': 'Price broke above upper Bollinger Band'
                    })
                elif indicators['current_price'] < indicators['bb_lower']:
                    signals.append({
                        'type': 'BB_BREAKOUT_BELOW',
                        'symbol': symbol,
                        'confidence': 0.5,
                        'reasoning': 'Price broke below lower Bollinger Band'
                    })

        except Exception as e:
            logger.error(f"Signal generation error for {symbol}: {e}")

        return signals

    def get_symbol_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """Get historical data for a symbol"""
        return self.symbol_data.get(symbol)

    def get_indicators(self, symbol: str) -> Optional[Dict]:
        """Get current indicators for a symbol"""
        return self.technical_indicators.get(symbol)

async def main():
    """Example usage of Polygon WebSocket integration"""

    # Configuration
    API_KEY = "YOUR_POLYGON_API_KEY"  # Replace with actual API key
    SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]

    # Initialize client
    client = PolygonWebSocketClient(api_key=API_KEY)

    # Initialize data processor
    processor = RealTimeDataProcessor(client)

    try:
        # Connect to WebSocket
        if await client.connect():
            # Subscribe to symbols
            await client.subscribe(SYMBOLS, [MessageType.TRADE, MessageType.QUOTE])

            # Monitor connection
            while True:
                status = client.get_status()
                print(f"Status: {status}")
                await asyncio.sleep(30)

        else:
            print("Failed to connect to Polygon WebSocket")

    except KeyboardInterrupt:
        print("Disconnecting...")
        await client.disconnect()
    except Exception as e:
        print(f"Error: {e}")
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())