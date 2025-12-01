"""
Backtest Generator Agent for AI-assisted backtest creation
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

from app.agents.base_agent import BaseAgent, AgentState
from app.models.schemas import AgentType, BacktestResponse
from app.core.config import settings

import json
import logging

logger = logging.getLogger(__name__)


class BacktestGeneratorState(AgentState):
    """Extended state for backtest generator agent"""
    generated_backtests: List[Dict[str, Any]] = []
    strategy_templates: Dict[str, Any] = {}
    performance_history: Dict[str, Any] = {}


class BacktestContext(BaseModel):
    """Context for backtest generation"""
    strategy_name: str
    strategy_description: str
    scan_parameters: Dict[str, Any]
    timeframe: str = "1D"
    market_conditions: str = "unknown"
    risk_parameters: Dict[str, Any] = {}


class BacktestGeneratorAgent(BaseAgent):
    """
    AI agent specialized in generating backtest configurations from strategy descriptions
    """

    def __init__(self):
        super().__init__(AgentType.BACKTEST_GENERATOR)
        self.state = BacktestGeneratorState()
        self.strategy_templates = self._load_strategy_templates()

    async def _setup_pydantic_agent(self):
        """Setup the PydanticAI agent for backtest generation"""

        self.pydantic_agent = Agent(
            model=self.model,
            deps_type=BacktestContext,
            result_type=BacktestResponse,
            system_prompt=self._get_system_prompt()
        )

        # Add tools for backtest generation
        @self.pydantic_agent.tool
        async def analyze_strategy(ctx: RunContext[BacktestContext], description: str) -> Dict[str, Any]:
            """Analyze strategy description to extract trading rules"""
            return await self._analyze_strategy_description(description)

        @self.pydantic_agent.tool
        async def generate_entry_rules(ctx: RunContext[BacktestContext], strategy_analysis: Dict[str, Any]) -> List[str]:
            """Generate entry conditions based on strategy analysis"""
            return await self._generate_entry_rules(strategy_analysis)

        @self.pydantic_agent.tool
        async def generate_exit_rules(ctx: RunContext[BacktestContext], strategy_analysis: Dict[str, Any]) -> List[str]:
            """Generate exit conditions based on strategy analysis"""
            return await self._generate_exit_rules(strategy_analysis)

        @self.pydantic_agent.tool
        async def create_risk_management(ctx: RunContext[BacktestContext], risk_params: Dict[str, Any]) -> Dict[str, Any]:
            """Create risk management rules"""
            return await self._create_risk_management(risk_params)

        @self.pydantic_agent.tool
        async def generate_backtest_code(ctx: RunContext[BacktestContext], rules: Dict[str, Any]) -> str:
            """Generate backtest implementation code"""
            return await self._generate_backtest_code(rules)

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the backtest generator"""
        return """
        You are Renata's backtest generation specialist, an AI expert in creating comprehensive backtest configurations.

        Your role is to:
        1. Analyze trading strategy descriptions
        2. Generate precise entry and exit rules
        3. Create appropriate risk management parameters
        4. Estimate expected performance metrics
        5. Provide complete backtest implementation code

        Backtest generation process:
        1. Parse strategy description for key elements
        2. Map to specific entry/exit conditions
        3. Define risk management rules
        4. Generate performance expectations
        5. Create executable backtest code

        Key focus areas:
        - Clear, testable entry and exit conditions
        - Robust risk management (stop loss, position sizing)
        - Realistic performance expectations
        - Market regime considerations
        - Transaction cost modeling
        - Drawdown management

        Code generation standards:
        - Use vectorbt or similar backtesting framework
        - Include proper position sizing
        - Add transaction costs and slippage
        - Implement risk management consistently
        - Generate comprehensive performance metrics

        Always provide:
        - Specific entry/exit rules with conditions
        - Risk management configuration
        - Expected performance ranges with confidence intervals
        - Complete backtest implementation
        - Assumptions and limitations clearly stated
        """

    def _load_strategy_templates(self) -> Dict[str, Any]:
        """Load strategy templates for different types"""
        return {
            "gap_reversal": {
                "description": "Trade gap reversals with volume confirmation",
                "entry_rules": [
                    "Gap down > 2% on high volume",
                    "Price recovers above previous close",
                    "Volume > 1.5x 20-day average"
                ],
                "exit_rules": [
                    "Price reaches gap fill level",
                    "Stop loss at 5% below entry",
                    "Hold maximum 3 trading days"
                ],
                "risk_management": {
                    "position_size": "2% of portfolio per trade",
                    "max_positions": 10,
                    "stop_loss": "5%",
                    "max_daily_loss": "10%"
                }
            },
            "momentum_breakout": {
                "description": "Trade momentum breakouts with trend following",
                "entry_rules": [
                    "Price breaks above 20-day high",
                    "Volume > 2x average",
                    "RSI between 50-80"
                ],
                "exit_rules": [
                    "Price breaks below 10-day low",
                    "Stop loss at 8% below entry",
                    "Take partial profit at 15% gain"
                ],
                "risk_management": {
                    "position_size": "1.5% of portfolio per trade",
                    "max_positions": 8,
                    "stop_loss": "8%",
                    "profit_target": "15%"
                }
            }
        }

    async def generate_backtest(
        self,
        strategy_description: str,
        scan_parameters: Dict[str, Any],
        strategy_name: str = "Custom Strategy",
        timeframe: str = "1D",
        market_conditions: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Generate backtest configuration from strategy description
        """
        await self._update_activity()

        try:
            context = BacktestContext(
                strategy_name=strategy_name,
                strategy_description=strategy_description,
                scan_parameters=scan_parameters,
                timeframe=timeframe,
                market_conditions=market_conditions
            )

            # Run the PydanticAI agent
            result = await self.pydantic_agent.run(
                f"Generate a complete backtest for: {strategy_description}",
                deps=context
            )

            # Store the generated backtest
            backtest_record = {
                "id": f"backtest_{len(self.state.generated_backtests) + 1}",
                "strategy_name": strategy_name,
                "description": strategy_description,
                "configuration": result.data.strategy_config,
                "created_at": datetime.utcnow().isoformat()
            }
            self.state.generated_backtests.append(backtest_record)

            return result.data.model_dump()

        except Exception as e:
            await self._handle_error(e, "backtest generation")
            raise

    async def _analyze_strategy_description(self, description: str) -> Dict[str, Any]:
        """Analyze strategy description to extract key components"""
        try:
            description_lower = description.lower()

            analysis = {
                "strategy_type": "custom",
                "timeframe": "intraday",
                "direction": "long",
                "indicators": [],
                "risk_factors": [],
                "market_regime": "any"
            }

            # Strategy type detection
            if any(word in description_lower for word in ["gap", "overnight"]):
                analysis["strategy_type"] = "gap_reversal"
            elif any(word in description_lower for word in ["breakout", "momentum"]):
                analysis["strategy_type"] = "momentum_breakout"
            elif any(word in description_lower for word in ["reversal", "mean"]):
                analysis["strategy_type"] = "mean_reversion"
            elif any(word in description_lower for word in ["trend", "following"]):
                analysis["strategy_type"] = "trend_following"

            # Direction detection
            if any(word in description_lower for word in ["short", "sell", "put"]):
                analysis["direction"] = "short"
            elif any(word in description_lower for word in ["long", "buy", "call"]):
                analysis["direction"] = "long"

            # Timeframe detection
            if any(word in description_lower for word in ["daily", "day", "eod"]):
                analysis["timeframe"] = "daily"
            elif any(word in description_lower for word in ["hourly", "hour"]):
                analysis["timeframe"] = "hourly"
            elif any(word in description_lower for word in ["minute", "intraday", "scalp"]):
                analysis["timeframe"] = "intraday"

            # Indicator detection
            if "rsi" in description_lower:
                analysis["indicators"].append("rsi")
            if "macd" in description_lower:
                analysis["indicators"].append("macd")
            if any(word in description_lower for word in ["moving average", "ma"]):
                analysis["indicators"].append("moving_average")
            if "volume" in description_lower:
                analysis["indicators"].append("volume")
            if any(word in description_lower for word in ["bollinger", "bands"]):
                analysis["indicators"].append("bollinger_bands")

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing strategy description: {e}")
            return {"error": str(e)}

    async def _generate_entry_rules(self, strategy_analysis: Dict[str, Any]) -> List[str]:
        """Generate entry rules based on strategy analysis"""
        try:
            strategy_type = strategy_analysis.get("strategy_type", "custom")
            indicators = strategy_analysis.get("indicators", [])
            direction = strategy_analysis.get("direction", "long")

            if strategy_type in self.strategy_templates:
                base_rules = self.strategy_templates[strategy_type]["entry_rules"].copy()
            else:
                base_rules = []

            # Add indicator-specific rules
            if "rsi" in indicators:
                if direction == "long":
                    base_rules.append("RSI > 50 and RSI < 80 (momentum without overbought)")
                else:
                    base_rules.append("RSI < 50 and RSI > 20 (weakness without oversold)")

            if "volume" in indicators:
                base_rules.append("Volume > 1.5x 20-day average (volume confirmation)")

            if "moving_average" in indicators:
                if direction == "long":
                    base_rules.append("Price > 20-day SMA (trend alignment)")
                else:
                    base_rules.append("Price < 20-day SMA (downtrend alignment)")

            return base_rules if base_rules else [
                "Price action confirms entry signal",
                "Volume supports the move",
                "Risk/reward ratio > 2:1"
            ]

        except Exception as e:
            logger.error(f"Error generating entry rules: {e}")
            return [f"Error: {str(e)}"]

    async def _generate_exit_rules(self, strategy_analysis: Dict[str, Any]) -> List[str]:
        """Generate exit rules based on strategy analysis"""
        try:
            strategy_type = strategy_analysis.get("strategy_type", "custom")
            timeframe = strategy_analysis.get("timeframe", "daily")

            if strategy_type in self.strategy_templates:
                base_rules = self.strategy_templates[strategy_type]["exit_rules"].copy()
            else:
                base_rules = []

            # Add timeframe-specific rules
            if timeframe == "intraday":
                base_rules.append("Close all positions at market close")
                base_rules.append("Maximum hold time: 4 hours")
            elif timeframe == "daily":
                base_rules.append("Maximum hold time: 5 trading days")
            elif timeframe == "weekly":
                base_rules.append("Maximum hold time: 4 weeks")

            # Add standard risk management exits
            if not any("stop" in rule.lower() for rule in base_rules):
                base_rules.append("Stop loss at 6% adverse move")

            if not any("profit" in rule.lower() for rule in base_rules):
                base_rules.append("Take profit at 12% favorable move")

            return base_rules if base_rules else [
                "Stop loss at 5% adverse move",
                "Take profit at 10% favorable move",
                "Exit on signal reversal"
            ]

        except Exception as e:
            logger.error(f"Error generating exit rules: {e}")
            return [f"Error: {str(e)}"]

    async def _create_risk_management(self, risk_params: Dict[str, Any]) -> Dict[str, Any]:
        """Create comprehensive risk management configuration"""
        try:
            # Default risk management parameters
            risk_config = {
                "position_sizing": {
                    "method": "fixed_percentage",
                    "percentage": risk_params.get("position_size", 2.0),
                    "max_position_value": risk_params.get("max_position", 50000),
                    "min_position_value": risk_params.get("min_position", 1000)
                },
                "stop_loss": {
                    "type": "percentage",
                    "value": risk_params.get("stop_loss", 5.0),
                    "trailing": risk_params.get("trailing_stop", False)
                },
                "take_profit": {
                    "type": "percentage",
                    "value": risk_params.get("take_profit", 12.0),
                    "partial_exits": risk_params.get("partial_exits", True)
                },
                "portfolio_limits": {
                    "max_positions": risk_params.get("max_positions", 10),
                    "max_daily_loss": risk_params.get("max_daily_loss", 5.0),
                    "max_sector_exposure": risk_params.get("max_sector", 25.0)
                },
                "transaction_costs": {
                    "commission": risk_params.get("commission", 0.005),
                    "slippage": risk_params.get("slippage", 0.001),
                    "market_impact": risk_params.get("market_impact", 0.0005)
                }
            }

            return risk_config

        except Exception as e:
            logger.error(f"Error creating risk management: {e}")
            return {"error": str(e)}

    async def _generate_backtest_code(self, rules: Dict[str, Any]) -> str:
        """Generate Python backtest implementation code"""
        try:
            code_template = '''
import pandas as pd
import numpy as np
import vectorbt as vbt
from datetime import datetime, timedelta

def run_strategy_backtest(data, start_date=None, end_date=None):
    """
    Complete backtest implementation for the strategy
    """

    # Data preparation
    if start_date:
        data = data[data.index >= start_date]
    if end_date:
        data = data[data.index <= end_date]

    # Initialize signals
    entries = pd.Series(False, index=data.index)
    exits = pd.Series(False, index=data.index)

    # Entry conditions
    for i in range(20, len(data)):  # Start after warmup period
        current = data.iloc[i]
        prev_data = data.iloc[max(0, i-20):i]

        # Entry logic (customize based on strategy)
        entry_signal = False

        # Volume confirmation
        avg_volume = prev_data['volume'].mean()
        volume_condition = current['volume'] > (avg_volume * 1.5)

        # Price action condition (example: gap up reversal)
        if i > 0:
            prev_close = data.iloc[i-1]['close']
            gap_pct = ((current['open'] - prev_close) / prev_close) * 100
            price_condition = gap_pct > 2.0 and current['close'] > current['open']
        else:
            price_condition = False

        # Combine conditions
        entry_signal = volume_condition and price_condition

        if entry_signal:
            entries.iloc[i] = True

    # Exit conditions
    for i in range(len(data)):
        if i > 0 and entries.iloc[i-1:i].any():  # If we entered recently
            current = data.iloc[i]
            entry_price = data.iloc[entries.iloc[max(0,i-5):i].idxmax()]['close']

            # Stop loss (5%)
            if current['low'] <= entry_price * 0.95:
                exits.iloc[i] = True

            # Take profit (12%)
            if current['high'] >= entry_price * 1.12:
                exits.iloc[i] = True

            # Time-based exit (5 days max)
            days_held = i - entries.iloc[max(0,i-5):i].idxmax()
            if days_held >= 5:
                exits.iloc[i] = True

    # Run backtest with vectorbt
    portfolio = vbt.Portfolio.from_signals(
        data['close'],
        entries,
        exits,
        init_cash=100000,
        fees=0.005,  # 0.5% transaction cost
        slippage=0.001  # 0.1% slippage
    )

    # Generate performance metrics
    performance = {
        'total_return': portfolio.total_return(),
        'sharpe_ratio': portfolio.sharpe_ratio(),
        'max_drawdown': portfolio.max_drawdown(),
        'win_rate': portfolio.trades.win_rate(),
        'total_trades': portfolio.trades.count(),
        'avg_trade_duration': portfolio.trades.duration.mean(),
        'profit_factor': portfolio.trades.profit_factor()
    }

    return portfolio, performance

# Usage example:
# portfolio, metrics = run_strategy_backtest(stock_data)
# print("Strategy Performance:", metrics)
'''

            return code_template

        except Exception as e:
            logger.error(f"Error generating backtest code: {e}")
            return f"# Error generating code: {str(e)}"

    async def _handle_backtest_generation_ws(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle backtest generation WebSocket messages"""
        try:
            strategy_name = data.get("strategy_name", "Custom Strategy")
            strategy_description = data.get("strategy_description", "")
            scan_parameters = data.get("scan_parameters", {})
            timeframe = data.get("timeframe", "1D")
            market_conditions = data.get("market_conditions", "unknown")

            result = await self.generate_backtest(
                strategy_description, scan_parameters, strategy_name, timeframe, market_conditions
            )

            return {
                "type": "backtest_generation",
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