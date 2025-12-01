"""
Main Trading Agent for pattern analysis and general trading workflows
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.base_agent import BaseAgent, AgentState
from app.models.schemas import AgentType, PatternAnalysisResponse
from app.core.config import settings

import yfinance as yf
import pandas as pd
import numpy as np
import ta
import logging

logger = logging.getLogger(__name__)


class TradingAgentState(AgentState):
    """Extended state for trading agent"""
    market_data_cache: Dict[str, Any] = {}
    pattern_cache: Dict[str, Any] = {}
    last_analysis_time: Optional[datetime] = None
    active_patterns: List[str] = []


class MarketContext(BaseModel):
    """Market context for trading decisions"""
    timeframe: str
    market_conditions: str
    volume_threshold: float
    historical_data: Dict[str, Any] = {}
    current_patterns: List[str] = []


class TradingAgent(BaseAgent):
    """
    Main trading agent for pattern analysis and market intelligence
    """

    def __init__(self):
        super().__init__(AgentType.TRADING_AGENT)
        self.state = TradingAgentState()
        self.market_data_cache = {}
        self.pattern_templates = self._load_pattern_templates()

    async def _setup_pydantic_agent(self):
        """Setup the PydanticAI agent for trading analysis"""

        # Define the trading agent with system prompts
        self.pydantic_agent = Agent(
            model=self.model,
            deps_type=MarketContext,
            result_type=PatternAnalysisResponse,
            system_prompt=self._get_system_prompt()
        )

        # Add tools for market analysis
        @self.pydantic_agent.tool
        async def get_market_data(ctx: RunContext[MarketContext], symbol: str, period: str = "1y") -> Dict[str, Any]:
            """Get historical market data for analysis"""
            try:
                return await self._fetch_market_data(symbol, period)
            except Exception as e:
                logger.error(f"Error fetching market data for {symbol}: {e}")
                return {"error": str(e)}

        @self.pydantic_agent.tool
        async def calculate_technical_indicators(ctx: RunContext[MarketContext], data: Dict[str, Any]) -> Dict[str, Any]:
            """Calculate technical indicators for pattern analysis"""
            try:
                return await self._calculate_indicators(data)
            except Exception as e:
                logger.error(f"Error calculating indicators: {e}")
                return {"error": str(e)}

        @self.pydantic_agent.tool
        async def identify_patterns(ctx: RunContext[MarketContext], indicators: Dict[str, Any]) -> List[Dict[str, Any]]:
            """Identify chart patterns and trading signals"""
            try:
                return await self._identify_patterns(indicators)
            except Exception as e:
                logger.error(f"Error identifying patterns: {e}")
                return [{"error": str(e)}]

        @self.pydantic_agent.tool
        async def assess_market_sentiment(ctx: RunContext[MarketContext], market_data: Dict[str, Any]) -> Dict[str, Any]:
            """Assess overall market sentiment and trend"""
            try:
                return await self._assess_market_sentiment(market_data)
            except Exception as e:
                logger.error(f"Error assessing market sentiment: {e}")
                return {"error": str(e)}

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the trading agent"""
        return """
        You are Renata, an expert trading analyst and pattern recognition specialist for Edge.dev.

        Your role is to analyze market patterns, identify trading opportunities, and provide actionable insights.

        Key responsibilities:
        1. Analyze market data and identify significant patterns
        2. Assess market sentiment and trend direction
        3. Identify potential trading opportunities with risk assessment
        4. Provide clear explanations of your analysis and recommendations

        Analysis approach:
        - Use multiple timeframes for confirmation
        - Consider volume patterns and momentum indicators
        - Look for confluence of technical signals
        - Assess risk/reward ratios for opportunities
        - Provide confidence levels for all assessments

        Communication style:
        - Clear, concise, and professional
        - Data-driven recommendations
        - Explain reasoning behind conclusions
        - Highlight both opportunities and risks

        Always provide structured analysis with:
        - Pattern identification with confidence levels
        - Market sentiment assessment
        - Specific trading opportunities
        - Risk factors and considerations
        - Clear recommendations with rationale
        """

    def _load_pattern_templates(self) -> Dict[str, Any]:
        """Load pattern recognition templates"""
        return {
            "gap_up": {
                "conditions": ["gap > 2%", "volume > avg_volume * 1.5"],
                "confidence_threshold": 0.7,
                "risk_factors": ["gap_fill_probability", "market_sentiment"]
            },
            "breakout": {
                "conditions": ["price > resistance", "volume > avg_volume * 2.0"],
                "confidence_threshold": 0.8,
                "risk_factors": ["false_breakout_risk", "overall_trend"]
            },
            "reversal": {
                "conditions": ["rsi < 30 or rsi > 70", "divergence_present"],
                "confidence_threshold": 0.6,
                "risk_factors": ["trend_strength", "support_resistance_levels"]
            }
        }

    async def analyze_patterns(
        self,
        timeframe: str = "1D",
        market_conditions: str = "unknown",
        volume_threshold: float = 1000000
    ) -> Dict[str, Any]:
        """
        Main pattern analysis method
        """
        await self._update_activity()

        try:
            # Create market context
            context = MarketContext(
                timeframe=timeframe,
                market_conditions=market_conditions,
                volume_threshold=volume_threshold
            )

            # Run the PydanticAI agent
            result = await self.pydantic_agent.run(
                f"Analyze current market patterns for timeframe {timeframe} with market conditions: {market_conditions}",
                deps=context
            )

            # Update performance metrics
            self.state.performance_metrics['last_analysis_confidence'] = getattr(result.data, 'confidence_score', 0.0)
            self.state.last_analysis_time = datetime.utcnow()

            return result.data.model_dump()

        except Exception as e:
            await self._handle_error(e, "pattern analysis")
            raise

    async def _fetch_market_data(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """Fetch market data from Yahoo Finance"""
        try:
            # Check cache first
            cache_key = f"{symbol}_{period}"
            if cache_key in self.market_data_cache:
                cached_data = self.market_data_cache[cache_key]
                # Check if cache is still valid (5 minutes)
                if (datetime.utcnow() - cached_data["timestamp"]).seconds < 300:
                    return cached_data["data"]

            # Fetch fresh data
            ticker = yf.Ticker(symbol)
            hist_data = ticker.history(period=period)

            if hist_data.empty:
                return {"error": f"No data available for {symbol}"}

            # Convert to JSON-serializable format
            data = {
                "symbol": symbol,
                "period": period,
                "data": {
                    "dates": hist_data.index.strftime('%Y-%m-%d').tolist(),
                    "open": hist_data['Open'].tolist(),
                    "high": hist_data['High'].tolist(),
                    "low": hist_data['Low'].tolist(),
                    "close": hist_data['Close'].tolist(),
                    "volume": hist_data['Volume'].tolist()
                },
                "current_price": float(hist_data['Close'].iloc[-1]),
                "price_change": float(hist_data['Close'].iloc[-1] - hist_data['Close'].iloc[-2]),
                "volume_avg": float(hist_data['Volume'].mean()),
                "timestamp": datetime.utcnow().isoformat()
            }

            # Cache the data
            self.market_data_cache[cache_key] = {
                "data": data,
                "timestamp": datetime.utcnow()
            }

            return data

        except Exception as e:
            logger.error(f"Error fetching market data for {symbol}: {e}")
            return {"error": str(e)}

    async def _calculate_indicators(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate technical indicators"""
        try:
            if "error" in market_data:
                return market_data

            # Convert data to pandas DataFrame
            df = pd.DataFrame({
                'open': market_data['data']['open'],
                'high': market_data['data']['high'],
                'low': market_data['data']['low'],
                'close': market_data['data']['close'],
                'volume': market_data['data']['volume']
            })

            indicators = {}

            # Moving averages
            indicators['sma_20'] = ta.trend.sma_indicator(df['close'], window=20).tolist()
            indicators['sma_50'] = ta.trend.sma_indicator(df['close'], window=50).tolist()
            indicators['ema_12'] = ta.trend.ema_indicator(df['close'], window=12).tolist()
            indicators['ema_26'] = ta.trend.ema_indicator(df['close'], window=26).tolist()

            # Momentum indicators
            indicators['rsi'] = ta.momentum.rsi(df['close'], window=14).tolist()
            indicators['macd'] = ta.trend.macd(df['close']).tolist()
            indicators['macd_signal'] = ta.trend.macd_signal(df['close']).tolist()

            # Volume indicators
            indicators['volume_sma'] = ta.volume.volume_sma(df['close'], df['volume'], window=20).tolist()
            indicators['obv'] = ta.volume.on_balance_volume(df['close'], df['volume']).tolist()

            # Volatility indicators
            indicators['bbands_upper'] = ta.volatility.bollinger_hband(df['close']).tolist()
            indicators['bbands_lower'] = ta.volatility.bollinger_lband(df['close']).tolist()
            indicators['atr'] = ta.volatility.average_true_range(df['high'], df['low'], df['close']).tolist()

            return {
                "indicators": indicators,
                "current_values": {
                    "price": float(df['close'].iloc[-1]),
                    "rsi": float(indicators['rsi'][-1]) if indicators['rsi'][-1] is not None else None,
                    "macd": float(indicators['macd'][-1]) if indicators['macd'][-1] is not None else None,
                    "volume_ratio": float(df['volume'].iloc[-1] / df['volume'].mean()),
                    "atr": float(indicators['atr'][-1]) if indicators['atr'][-1] is not None else None
                }
            }

        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            return {"error": str(e)}

    async def _identify_patterns(self, indicator_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify trading patterns from technical indicators"""
        try:
            if "error" in indicator_data:
                return [indicator_data]

            patterns = []
            current = indicator_data.get("current_values", {})

            # RSI patterns
            rsi = current.get("rsi")
            if rsi:
                if rsi < 30:
                    patterns.append({
                        "pattern": "oversold",
                        "type": "reversal_signal",
                        "confidence": min(0.9, (30 - rsi) / 20),
                        "description": f"RSI indicates oversold conditions at {rsi:.2f}"
                    })
                elif rsi > 70:
                    patterns.append({
                        "pattern": "overbought",
                        "type": "reversal_signal",
                        "confidence": min(0.9, (rsi - 70) / 20),
                        "description": f"RSI indicates overbought conditions at {rsi:.2f}"
                    })

            # Volume patterns
            volume_ratio = current.get("volume_ratio", 1.0)
            if volume_ratio > 2.0:
                patterns.append({
                    "pattern": "high_volume",
                    "type": "momentum_signal",
                    "confidence": min(0.9, (volume_ratio - 1) / 3),
                    "description": f"Unusual volume activity: {volume_ratio:.2f}x normal"
                })

            # MACD patterns
            macd = current.get("macd")
            if macd:
                # Simple MACD signal
                if macd > 0:
                    patterns.append({
                        "pattern": "macd_bullish",
                        "type": "trend_signal",
                        "confidence": 0.6,
                        "description": "MACD above zero line suggests bullish momentum"
                    })
                else:
                    patterns.append({
                        "pattern": "macd_bearish",
                        "type": "trend_signal",
                        "confidence": 0.6,
                        "description": "MACD below zero line suggests bearish momentum"
                    })

            return patterns

        except Exception as e:
            logger.error(f"Error identifying patterns: {e}")
            return [{"error": str(e)}]

    async def _assess_market_sentiment(self, market_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall market sentiment"""
        try:
            if "error" in market_data:
                return market_data

            price_change = market_data.get("price_change", 0)
            current_price = market_data.get("current_price", 0)
            volume_ratio = market_data.get("volume_avg", 1)

            # Calculate sentiment score
            sentiment_score = 0.0

            # Price movement contribution
            if current_price > 0:
                price_pct_change = (price_change / current_price) * 100
                sentiment_score += np.tanh(price_pct_change / 2) * 0.4

            # Volume contribution
            if volume_ratio > 1.2:
                sentiment_score += 0.3
            elif volume_ratio < 0.8:
                sentiment_score -= 0.2

            # Determine sentiment category
            if sentiment_score > 0.3:
                sentiment = "bullish"
            elif sentiment_score < -0.3:
                sentiment = "bearish"
            else:
                sentiment = "neutral"

            return {
                "sentiment": sentiment,
                "sentiment_score": float(sentiment_score),
                "confidence": min(0.9, abs(sentiment_score)),
                "factors": {
                    "price_change_pct": float(price_change / current_price * 100) if current_price > 0 else 0,
                    "volume_activity": "high" if volume_ratio > 1.5 else "normal" if volume_ratio > 0.8 else "low",
                    "momentum": "positive" if sentiment_score > 0 else "negative"
                }
            }

        except Exception as e:
            logger.error(f"Error assessing market sentiment: {e}")
            return {"error": str(e)}

    async def _handle_pattern_analysis_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern analysis WebSocket messages"""
        try:
            timeframe = data.get("timeframe", "1D")
            market_conditions = data.get("market_conditions", "unknown")
            volume_threshold = data.get("volume_threshold", 1000000)

            result = await self.analyze_patterns(timeframe, market_conditions, volume_threshold)

            return {
                "type": "pattern_analysis",
                "data": result,
                "agent": self.agent_type.value,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "type": "error",
                "message": str(e),
                "agent": self.agent_type.value
            }