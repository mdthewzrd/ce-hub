'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Shield, Calculator, Activity } from 'lucide-react';

interface ExecutionStatsProps {
  metrics: any;
}

const ExecutionStats: React.FC<ExecutionStatsProps> = ({ metrics }) => {
  // Format numbers for display
  const formatNumber = (value: number, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) return '0.00';
    return value.toFixed(decimals);
  };

  const formatPercent = (value: number, decimals: number = 1): string => {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const formatCurrency = (value: number): string => {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  // Calculate display values
  const stats = useMemo(() => {
    if (!metrics || Object.keys(metrics).length === 0) {
      return {
        winRate: 0,
        profitFactor: 0,
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        avgWinLossRatio: 0,
        totalTrades: 0,
        calmarRatio: 0,
        expectedValue: 0,
        kelly: 0,
        volatility: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        avgTradeHoldTime: 0
      };
    }

    return {
      winRate: metrics.winRate || 0,
      profitFactor: metrics.profitFactor || 0,
      totalReturn: metrics.totalReturn || 0,
      sharpeRatio: metrics.sharpeRatio || 0,
      maxDrawdown: metrics.maxDrawdownPercent || 0,
      avgWinLossRatio: metrics.avgWinLossRatio || 0,
      totalTrades: metrics.totalTrades || 0,
      calmarRatio: metrics.calmarRatio || 0,
      expectedValue: metrics.expectedValue || 0,
      kelly: metrics.kelly || 0,
      volatility: metrics.volatility || 0,
      maxConsecutiveWins: metrics.maxConsecutiveWins || 0,
      maxConsecutiveLosses: metrics.maxConsecutiveLosses || 0,
      avgTradeHoldTime: metrics.avgTradeHoldTime || 0
    };
  }, [metrics]);

  // Determine color based on value using Traderra colors
  const getColorClass = (value: number, threshold: number = 0, reverse: boolean = false): string => {
    if (reverse) {
      return value <= threshold ? 'profit-text' : 'loss-text';
    }
    return value >= threshold ? 'profit-text' : 'loss-text';
  };

  const getWinRateColor = (winRate: number): string => {
    if (winRate >= 0.6) return 'profit-text';
    if (winRate >= 0.5) return 'text-primary';
    return 'loss-text';
  };

  const getProfitFactorColor = (pf: number): string => {
    if (pf >= 2.0) return 'profit-text';
    if (pf >= 1.5) return 'text-primary';
    if (pf >= 1.0) return 'studio-accent';
    return 'loss-text';
  };

  const getSharpeColor = (sharpe: number): string => {
    if (sharpe >= 1.5) return 'profit-text';
    if (sharpe >= 1.0) return 'text-primary';
    if (sharpe >= 0.5) return 'studio-accent';
    return 'loss-text';
  };

  const statCards = [
    {
      title: 'Win Rate',
      value: formatPercent(stats.winRate),
      icon: Target,
      color: getWinRateColor(stats.winRate),
      description: 'Percentage of winning trades'
    },
    {
      title: 'Profit Factor',
      value: formatNumber(stats.profitFactor),
      icon: TrendingUp,
      color: getProfitFactorColor(stats.profitFactor),
      description: 'Gross profit / Gross loss'
    },
    {
      title: 'Sharpe Ratio',
      value: formatNumber(stats.sharpeRatio),
      icon: Activity,
      color: getSharpeColor(stats.sharpeRatio),
      description: 'Risk-adjusted returns'
    },
    {
      title: 'Max Drawdown',
      value: formatPercent(stats.maxDrawdown / 100),
      icon: TrendingDown,
      color: getColorClass(stats.maxDrawdown, 10, true),
      description: 'Maximum peak-to-trough decline'
    },
    {
      title: 'Win/Loss Ratio',
      value: formatNumber(stats.avgWinLossRatio),
      icon: Shield,
      color: getColorClass(stats.avgWinLossRatio, 1),
      description: 'Average win / Average loss'
    },
    {
      title: 'Total Return',
      value: formatPercent(stats.totalReturn / 100),
      icon: Calculator,
      color: getColorClass(stats.totalReturn, 0),
      description: 'Overall return percentage'
    }
  ];

  const advancedStats = [
    { label: 'Calmar Ratio', value: formatNumber(stats.calmarRatio), good: stats.calmarRatio >= 0.5 },
    { label: 'Expected Value', value: formatNumber(stats.expectedValue), good: stats.expectedValue > 0 },
    { label: 'Kelly %', value: formatPercent(stats.kelly), good: stats.kelly > 0 && stats.kelly < 0.25 },
    { label: 'Volatility', value: formatPercent(stats.volatility / 100), good: stats.volatility < 20 },
    { label: 'Consecutive Wins', value: stats.maxConsecutiveWins.toString(), good: stats.maxConsecutiveWins >= 3 },
    { label: 'Consecutive Losses', value: stats.maxConsecutiveLosses.toString(), good: stats.maxConsecutiveLosses <= 3 },
    { label: 'Avg Hold Time', value: `${formatNumber(stats.avgTradeHoldTime, 1)}h`, good: stats.avgTradeHoldTime > 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Main Performance Metrics */}
      <div className="studio-card">
        <div className="section-header">
          <Activity className="section-icon text-primary" />
          <h2 className="section-title studio-text">Performance Metrics</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="metric-tile">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-4 w-4 studio-muted" />
                <span className={`text-lg font-bold number-font ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <div className="text-sm studio-text font-medium">{stat.title}</div>
              <div className="text-xs studio-muted mt-1">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Statistics */}
      <div className="studio-card">
        <div className="section-header">
          <Calculator className="section-icon text-primary" />
          <h2 className="section-title studio-text">Advanced Statistics</h2>
        </div>
        <div className="space-y-3">
          {advancedStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b studio-border last:border-b-0">
              <span className="text-sm studio-muted">{stat.label}</span>
              <span className={`text-sm font-medium number-font ${
                stat.good ? 'profit-text' : 'loss-text'
              }`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Activity Summary */}
      <div className="studio-card">
        <div className="section-header">
          <Target className="section-icon text-primary" />
          <h2 className="section-title studio-text">Trading Activity</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold number-font studio-text">{stats.totalTrades}</div>
              <div className="text-sm studio-muted">Total Trades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold number-font text-primary">
                {metrics.winningTrades || 0}
              </div>
              <div className="text-sm studio-muted">Winning Trades</div>
            </div>
          </div>

          {/* Win/Loss Progress Bar */}
          {stats.totalTrades > 0 && (
            <div className="space-y-2">
              <div className="text-sm studio-muted">Win/Loss Distribution</div>
              <div className="w-full studio-surface rounded-full h-3 overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-[var(--trading-profit)] transition-all duration-300"
                    style={{ width: `${stats.winRate * 100}%` }}
                  />
                  <div
                    className="bg-[var(--trading-loss)] transition-all duration-300"
                    style={{ width: `${(1 - stats.winRate) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs studio-muted">
                <span className="number-font">Wins: {formatPercent(stats.winRate)}</span>
                <span className="number-font">Losses: {formatPercent(1 - stats.winRate)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="studio-card">
        <div className="section-header">
          <Shield className="section-icon text-primary" />
          <h2 className="section-title studio-text">Risk Assessment</h2>
        </div>
        <div className="space-y-4">
          {/* Risk Score */}
          <div className="text-center">
            <div className="text-lg font-medium studio-text mb-2">Risk Score</div>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke="var(--studio-border)"
                  strokeWidth="3"
                />
                <path
                  d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                  fill="none"
                  stroke={stats.maxDrawdown <= 10 ? 'var(--trading-profit)' : stats.maxDrawdown <= 20 ? 'var(--primary)' : 'var(--trading-loss)'}
                  strokeWidth="3"
                  strokeDasharray={`${Math.min(stats.maxDrawdown * 3, 100)}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold studio-text">
                  {stats.maxDrawdown <= 10 ? 'LOW' : stats.maxDrawdown <= 20 ? 'MED' : 'HIGH'}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="studio-muted">Max DD</div>
              <div className={`font-medium number-font ${getColorClass(stats.maxDrawdown, 10, true)}`}>
                {formatPercent(stats.maxDrawdown / 100)}
              </div>
            </div>
            <div className="text-center">
              <div className="studio-muted">Volatility</div>
              <div className={`font-medium number-font ${getColorClass(stats.volatility, 20, true)}`}>
                {formatPercent(stats.volatility / 100)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionStats;