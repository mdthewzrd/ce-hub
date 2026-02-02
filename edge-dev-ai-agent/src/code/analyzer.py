"""
Result Analyzer

Analyzes and formats execution results from backtests and scanner runs.
"""

import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass


@dataclass
class PerformanceMetrics:
    """Performance metrics from a backtest."""
    total_return: float
    cagr: float
    max_drawdown: float
    sharpe_ratio: float
    win_rate: float
    profit_factor: float
    avg_r_multiple: float
    total_trades: int
    avg_trade_duration: float

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "total_return": self.total_return,
            "cagr": self.cagr,
            "max_drawdown": self.max_drawdown,
            "sharpe_ratio": self.sharpe_ratio,
            "win_rate": self.win_rate,
            "profit_factor": self.profit_factor,
            "avg_r_multiple": self.avg_r_multiple,
            "total_trades": self.total_trades,
            "avg_trade_duration": self.avg_trade_duration,
        }


@dataclass
class Trade:
    """A single trade from execution results."""
    ticker: str
    entry_date: str
    exit_date: Optional[str]
    entry_price: float
    exit_price: Optional[float]
    return_pct: float
    r_multiple: float
    outcome: str  # 'win' or 'loss'


class ResultAnalyzer:
    """Analyzes execution results and generates insights."""

    def __init__(self):
        """Initialize result analyzer."""
        pass

    def parse_signals(self, signals: List[Dict[str, Any]]) -> List[Trade]:
        """Parse signals from scanner execution.

        Args:
            signals: Raw signals from execution

        Returns:
            List of Trade objects
        """
        trades = []

        for signal in signals:
            # Extract trade info
            # Adjust based on actual EdgeDev response format
            trades.append(Trade(
                ticker=signal.get("ticker", "UNKNOWN"),
                entry_date=signal.get("entry_date", ""),
                exit_date=signal.get("exit_date"),
                entry_price=signal.get("entry_price", 0),
                exit_price=signal.get("exit_price"),
                return_pct=signal.get("return_pct", 0),
                r_multiple=signal.get("r_multiple", 0),
                outcome="win" if signal.get("return_pct", 0) > 0 else "loss",
            ))

        return trades

    def calculate_metrics(self, trades: List[Trade]) -> PerformanceMetrics:
        """Calculate performance metrics from trades.

        Args:
            trades: List of trades

        Returns:
            PerformanceMetrics object
        """
        if not trades:
            return PerformanceMetrics(
                total_return=0,
                cagr=0,
                max_drawdown=0,
                sharpe_ratio=0,
                win_rate=0,
                profit_factor=0,
                avg_r_multiple=0,
                total_trades=0,
                avg_trade_duration=0,
            )

        # Basic calculations
        returns = [t.return_pct for t in trades]
        wins = [t for t in trades if t.outcome == "win"]
        losses = [t for t in trades if t.outcome == "loss"]

        # Win rate
        win_rate = len(wins) / len(trades) if trades else 0

        # Profit factor
        total_wins = sum(t.return_pct for t in wins) if wins else 0
        total_losses = abs(sum(t.return_pct for t in losses)) if losses else 1
        profit_factor = total_wins / total_losses if total_losses > 0 else 0

        # Average R multiple
        avg_r = sum(t.r_multiple for t in trades) / len(trades) if trades else 0

        # Total return
        total_return = sum(returns)

        # Max drawdown (simplified)
        cumulative = pd.Series(returns).cumsum()
        running_max = cumulative.cummax()
        drawdown = running_max - cumulative
        max_drawdown = drawdown.max() if len(drawdown) > 0 else 0

        # Other metrics (simplified)
        cagr = total_return  # Simplified
        sharpe = total_return / (drawdown.std() if len(drawdown) > 0 else 1)  # Simplified

        return PerformanceMetrics(
            total_return=total_return,
            cagr=cagr,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe,
            win_rate=win_rate,
            profit_factor=profit_factor,
            avg_r_multiple=avg_r,
            total_trades=len(trades),
            avg_trade_duration=0,  # Would need actual durations
        )

    def format_results(self, metrics: PerformanceMetrics, trades: List[Trade]) -> str:
        """Format results for presentation.

        Args:
            metrics: Performance metrics
            trades: List of trades

        Returns:
            Formatted markdown report
        """
        output = "## Execution Results\n\n"

        # Metrics table
        output += "### Performance Metrics\n\n"
        output += "| Metric | Value |\n"
        output += "|--------|-------|\n"
        output += f"| Total Return | {metrics.total_return:.2%} |\n"
        output += f"| CAGR | {metrics.cagr:.2%} |\n"
        output += f"| Max Drawdown | {metrics.max_drawdown:.2%} |\n"
        output += f"| Sharpe Ratio | {metrics.sharpe_ratio:.2f} |\n"
        output += f"| Win Rate | {metrics.win_rate:.1%} |\n"
        output += f"| Profit Factor | {metrics.profit_factor:.2f} |\n"
        output += f"| Avg R:Multiple | {metrics.avg_r_multiple:.2f}R |\n"
        output += f"| Total Trades | {metrics.total_trades} |\n\n"

        # Recent trades
        output += "### Recent Trades\n\n"
        output += "| Ticker | Entry Date | Return | R:Multiple | Outcome |\n"
        output += "|-------|-----------|--------|------------|----------|\n"

        for trade in trades[-10:]:  # Last 10 trades
            outcome_emoji = "✅" if trade.outcome == "win" else "❌"
            output += f"| {trade.ticker} | {trade.entry_date} | {trade.return_pct:+.2%} | {trade.r_multiple:.2f}R | {outcome_emoji} |\n"

        return output

    def assess_edge(self, metrics: PerformanceMetrics) -> Dict[str, Any]:
        """Assess if strategy has genuine statistical edge.

        Args:
            metrics: Performance metrics

        Returns:
            Edge assessment dict
        """
        has_edge = True
        reasons = []

        # Check win rate vs R multiple
        if metrics.win_rate < 0.35 and metrics.avg_r_multiple < 1.5:
            has_edge = False
            reasons.append("Low win rate with low R-multiple suggests no edge")

        # Check profit factor
        if metrics.profit_factor < 1.3:
            has_edge = False
            reasons.append("Profit factor below 1.3 indicates thin or no edge")

        # Check Sharpe ratio
        if metrics.sharpe_ratio < 0.5:
            has_edge = False
            reasons.append("Sharpe ratio below 0.5 suggests poor risk-adjusted returns")

        # Check trade count
        if metrics.total_trades < 30:
            reasons.append("Low trade count - results may not be statistically significant")

        return {
            "has_edge": has_edge,
            "confidence": "high" if has_edge and metrics.total_trades >= 100 else "medium",
            "reasons": reasons if not has_edge else [],
            "strengths": self._identify_strengths(metrics),
        }

    def _identify_strengths(self, metrics: PerformanceMetrics) -> List[str]:
        """Identify strengths of the strategy."""
        strengths = []

        if metrics.win_rate > 0.45:
            strengths.append("Solid win rate")

        if metrics.avg_r_multiple > 2.0:
            strengths.append("Strong R-multiple (winners are large)")

        if metrics.profit_factor > 2.0:
            strengths.append("Excellent profit factor")

        if metrics.max_drawdown < 0.15:
            strengths.append("Controlled drawdown")

        if metrics.sharpe_ratio > 1.5:
            strengths.append("Good risk-adjusted returns")

        return strengths
