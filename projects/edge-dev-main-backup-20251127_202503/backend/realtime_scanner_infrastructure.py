# Real-Time Trading Scanner Infrastructure

## WebSocket Connection Manager
```python
import asyncio
import websockets
import json
import logging
from typing import Dict, List, Callable, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class MarketData:
    symbol: str
    price: float
    volume: int
    timestamp: datetime
    exchange: str
    bid: Optional[float] = None
    ask: Optional[float] = None

class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.data_handlers: List[Callable[[MarketData], None]] = []
        self.reconnect_intervals = [1, 2, 4, 8, 16]  # Exponential backoff
        self.max_reconnect_attempts = 5

    async def connect_polygon_realtime(self, symbols: List[str], api_key: str):
        """Connect to Polygon.io real-time WebSocket"""
        url = "wss://socket.polygon.io/stocks"

        while True:
            try:
                async with websockets.connect(url) as websocket:
                    # Authenticate
                    auth_msg = {"action": "auth", "params": api_key}
                    await websocket.send(json.dumps(auth_msg))

                    # Subscribe to symbols
                    subscribe_msg = {
                        "action": "subscribe",
                        "params": f"T.{','.join(symbols)},Q.{','.join(symbols)}"
                    }
                    await websocket.send(json.dumps(subscribe_msg))

                    # Handle messages
                    async for message in websocket:
                        data = json.loads(message)
                        if data.get("ev") in ["T", "Q"]:
                            market_data = self._parse_polygon_message(data)
                            await self._process_market_data(market_data)

            except Exception as e:
                logging.error(f"WebSocket connection error: {e}")
                await asyncio.sleep(self._get_reconnect_delay())

    def _parse_polygon_message(self, data: dict) -> MarketData:
        """Parse Polygon WebSocket message into MarketData object"""
        return MarketData(
            symbol=data["sym"],
            price=float(data["p"]) if data.get("p") else None,
            volume=int(data["s"]) if data.get("s") else None,
            timestamp=datetime.fromtimestamp(data["t"] / 1000),
            exchange=data["x"],
            bid=float(data["bp"]) if data.get("bp") else None,
            ask=float(data["ap"]) if data.get("ap") else None
        )

    async def _process_market_data(self, data: MarketData):
        """Process incoming market data and notify handlers"""
        for handler in self.data_handlers:
            try:
                await handler(data)
            except Exception as e:
                logging.error(f"Error in data handler: {e}")
```

## Signal Detection Engine
```python
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

class SignalType(Enum):
    PRICE_BREAKOUT = "price_breakout"
    VOLUME_SPIKE = "volume_spike"
    RSI_OVERSOLD = "rsi_oversold"
    RSI_OVERBOUGHT = "rsi_overbought"
    MACD_CROSSOVER = "macd_crossover"
    BOLLINGER_SQUEEZE = "bollinger_squeeze"

@dataclass
class TradingSignal:
    symbol: str
    signal_type: SignalType
    strength: float  # 0.0 to 1.0
    price: float
    timestamp: datetime
    details: Dict

class RealTimeSignalDetector:
    def __init__(self, lookback_period: int = 100):
        self.lookback_period = lookback_period
        self.data_buffer: Dict[str, List[MarketData]] = {}
        self.indicators_cache: Dict[str, Dict] = {}

    async def process_market_data(self, data: MarketData) -> List[TradingSignal]:
        """Process new market data and detect signals"""
        # Update buffer
        if data.symbol not in self.data_buffer:
            self.data_buffer[data.symbol] = []

        self.data_buffer[data.symbol].append(data)

        # Keep only recent data
        if len(self.data_buffer[data.symbol]) > self.lookback_period:
            self.data_buffer[data.symbol] = self.data_buffer[data.symbol][-self.lookback_period:]

        # Detect signals
        signals = []

        if len(self.data_buffer[data.symbol]) >= 20:  # Minimum for indicators
            signals.extend(self._detect_price_signals(data.symbol))
            signals.extend(self._detect_volume_signals(data.symbol))
            signals.extend(self._detect_technical_signals(data.symbol))

        return signals

    def _detect_price_signals(self, symbol: str) -> List[TradingSignal]:
        """Detect price-based signals"""
        signals = []
        data_points = self.data_buffer[symbol]

        if len(data_points) < 20:
            return signals

        prices = [d.price for d in data_points if d.price]
        volumes = [d.volume for d in data_points if d.volume]

        # Volume spike detection
        if len(volumes) >= 20:
            current_volume = volumes[-1]
            avg_volume = np.mean(volumes[-20:-1])

            if current_volume > avg_volume * 3:  # 3x volume spike
                signals.append(TradingSignal(
                    symbol=symbol,
                    signal_type=SignalType.VOLUME_SPIKE,
                    strength=min(current_volume / avg_volume / 3, 1.0),
                    price=prices[-1],
                    timestamp=data_points[-1].timestamp,
                    details={
                        "current_volume": current_volume,
                        "avg_volume": avg_volume,
                        "multiplier": current_volume / avg_volume
                    }
                ))

        return signals

    def _detect_technical_signals(self, symbol: str) -> List[TradingSignal]:
        """Detect technical indicator-based signals"""
        signals = []
        data_points = self.data_buffer[symbol]

        if len(data_points) < 50:
            return signals

        # Convert to DataFrame for indicator calculation
        df = pd.DataFrame([
            {"price": d.price, "volume": d.volume, "timestamp": d.timestamp}
            for d in data_points if d.price
        ])

        if len(df) < 50:
            return signals

        # Calculate indicators
        df['sma_20'] = df['price'].rolling(20).mean()
        df['sma_50'] = df['price'].rolling(50).mean()
        df['rsi'] = self._calculate_rsi(df['price'], 14)
        df['volume_sma'] = df['volume'].rolling(20).mean()

        latest = df.iloc[-1]
        prev = df.iloc[-2]

        # RSI signals
        if latest['rsi'] < 30 and prev['rsi'] >= 30:
            signals.append(TradingSignal(
                symbol=symbol,
                signal_type=SignalType.RSI_OVERSOLD,
                strength=(30 - latest['rsi']) / 30,
                price=latest['price'],
                timestamp=data_points[-1].timestamp,
                details={"rsi": latest['rsi']}
            ))

        elif latest['rsi'] > 70 and prev['rsi'] <= 70:
            signals.append(TradingSignal(
                symbol=symbol,
                signal_type=SignalType.RSI_OVERBOUGHT,
                strength=(latest['rsi'] - 70) / 30,
                price=latest['price'],
                timestamp=data_points[-1].timestamp,
                details={"rsi": latest['rsi']}
            ))

        # SMA crossover
        if (latest['sma_20'] > latest['sma_50'] and
            prev['sma_20'] <= prev['sma_50']):
            signals.append(TradingSignal(
                symbol=symbol,
                signal_type=SignalType.PRICE_BREAKOUT,
                strength=0.7,
                price=latest['price'],
                timestamp=data_points[-1].timestamp,
                details={
                    "sma_20": latest['sma_20'],
                    "sma_50": latest['sma_50'],
                    "crossover_type": "golden"
                }
            ))

        return signals

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
```

## Discord Notification System
```python
import discord
from discord.ext import commands
import asyncio
import matplotlib.pyplot as plt
import io
import base64
from typing import List

class DiscordTradingBot(commands.Bot):
    def __init__(self, token: str, alert_channel_id: int):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)

        self.token = token
        self.alert_channel_id = alert_channel_id
        self.signal_queue: asyncio.Queue = asyncio.Queue()

    async def on_ready(self):
        print(f'{self.user} has connected to Discord!')
        # Start signal processing task
        asyncio.create_task(self._process_signals())

    async def send_trading_signal(self, signal: TradingSignal, chart_data: bytes = None):
        """Send trading signal to Discord channel"""
        channel = self.get_channel(self.alert_channel_id)
        if not channel:
            print(f"Channel {self.alert_channel_id} not found")
            return

        # Create embed
        embed = discord.Embed(
            title=f"🚨 {signal.signal_type.value.upper()} Signal",
            description=f"**{signal.symbol}**",
            color=self._get_signal_color(signal.signal_type),
            timestamp=signal.timestamp
        )

        embed.add_field(
            name="Signal Details",
            value=f"**Price:** ${signal.price:.2f}\n"
                  f"**Strength:** {signal.strength:.1%}\n"
                  f"**Type:** {signal.signal_type.value}",
            inline=False
        )

        # Add signal-specific details
        if signal.details:
            details_text = "\n".join([f"**{k}:** {v}" for k, v in signal.details.items()])
            embed.add_field(name="Technical Details", value=details_text, inline=False)

        embed.set_thumbnail(
            url=f"https://charts.stocksnap.io/api/chart?symbol={signal.symbol}&period=1D"
        )

        embed.set_footer(text="Real-Time Scanner | Edge Development")

        # Add chart if provided
        files = []
        if chart_data:
            file = discord.File(io.BytesIO(chart_data), "chart.png")
            files.append(file)
            embed.set_image(url="attachment://chart.png")

        # Send with mentions if high strength
        content = None
        if signal.strength > 0.8:
            content = "@everyone High confidence signal detected!"

        await channel.send(content=content, embed=embed, files=files)

    def _get_signal_color(self, signal_type: SignalType) -> discord.Color:
        """Get Discord embed color based on signal type"""
        colors = {
            SignalType.PRICE_BREAKOUT: discord.Color.blue(),
            SignalType.VOLUME_SPIKE: discord.Color.orange(),
            SignalType.RSI_OVERSOLD: discord.Color.green(),
            SignalType.RSI_OVERBOUGHT: discord.Color.red(),
            SignalType.MACD_CROSSOVER: discord.Color.purple(),
            SignalType.BOLLINGER_SQUEEZE: discord.Color.gold()
        }
        return colors.get(signal_type, discord.Color.blue())

    async def _process_signals(self):
        """Process signals from queue"""
        while True:
            try:
                signal = await self.signal_queue.get()
                await self.send_trading_signal(signal)
            except Exception as e:
                print(f"Error processing signal: {e}")

class RealTimeScannerSystem:
    def __init__(self, discord_token: str, discord_channel_id: int, polygon_api_key: str):
        self.websocket_manager = WebSocketManager()
        self.signal_detector = RealTimeSignalDetector()
        self.discord_bot = DiscordTradingBot(discord_token, discord_channel_id)

        self.symbols = []
        self.polygon_api_key = polygon_api_key
        self.is_running = False

    async def start_monitoring(self, symbols: List[str]):
        """Start real-time monitoring"""
        self.symbols = symbols
        self.is_running = True

        # Register signal detector as data handler
        self.websocket_manager.data_handlers.append(self._handle_market_data)

        # Start Discord bot
        asyncio.create_task(self.discord_bot.start(self.discord_bot.token))

        # Start WebSocket monitoring
        await self.websocket_manager.connect_polygon_realtime(symbols, self.polygon_api_key)

    async def _handle_market_data(self, data: MarketData):
        """Handle incoming market data"""
        # Detect signals
        signals = await self.signal_detector.process_market_data(data)

        # Queue signals for Discord notification
        for signal in signals:
            await self.discord_bot.signal_queue.put(signal)
```

## Production Deployment Configuration
```python
# config/realtime_scanner_config.py
import os
from typing import List

class RealTimeScannerConfig:
    # API Configuration
    POLYGON_API_KEY = os.getenv('POLYGON_API_KEY')
    DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    DISCORD_ALERT_CHANNEL_ID = int(os.getenv('DISCORD_ALERT_CHANNEL_ID'))

    # Scanner Configuration
    MONITORED_SYMBOLS = [
        'SPY', 'QQQ', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA',
        'NVDA', 'META', 'NFLX', 'AMD', 'INTC', 'BA', 'JPM'
    ]

    # Signal Detection Parameters
    VOLUME_SPIKE_MULTIPLIER = 3.0
    RSI_OVERSOLD_THRESHOLD = 30
    RSI_OVERBOUGHT_THRESHOLD = 70
    MIN_STRENGTH_FOR_ALERT = 0.6

    # System Configuration
    MAX_RECONNECT_ATTEMPTS = 5
    HEARTBEAT_INTERVAL = 30
    LOG_LEVEL = 'INFO'

# deployment/docker-compose.yml
version: '3.8'
services:
  realtime-scanner:
    build: .
    environment:
      - POLYGON_API_KEY=${POLYGON_API_KEY}
      - DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
      - DISCORD_ALERT_CHANNEL_ID=${DISCORD_ALERT_CHANNEL_ID}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - trading-network

  redis:
    image: redis:7-alpine
    networks:
      - trading-network

networks:
  trading-network:
    driver: bridge
```

This infrastructure provides a complete real-time scanning system with WebSocket data processing, signal detection, Discord notifications, and production deployment capabilities.