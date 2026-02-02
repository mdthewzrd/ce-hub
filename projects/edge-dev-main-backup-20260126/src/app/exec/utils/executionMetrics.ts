/**
 * Execution Metrics
 * Calculates comprehensive performance statistics for trading strategies
 */

interface Trade {
  id: string;
  symbol: string;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  shares: number;
  pnl?: number;
  rPnl?: number;
  status: 'open' | 'closed';
}

interface DailyPnL {
  date: string;
  pnl: number;
  rPnl: number;
  cumulativePnL: number;
  cumulativeRPnL: number;
  tradeCount: number;
}

interface MetricsResult {
  // Trade Statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  lossRate: number;

  // P&L Statistics
  totalPnL: number;
  totalRPnL: number;
  avgWin: number;
  avgLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
  avgAllPercent: number;
  avgWinLossRatio: number;

  // Risk Metrics
  maxDrawdown: number;
  maxDrawdownPercent: number;
  calmarRatio: number;
  sharpeRatio: number;
  profitFactor: number;

  // Advanced Metrics
  expectedValue: number;
  kelly: number;
  edge: number;
  rsquared: number;
  correlation: number;

  // Daily Statistics
  bestDay: number;
  worstDay: number;
  maxDrawdownPerDay: number;
  bestDate: string;
  worstDate: string;
  worstDrawdownDate: string;

  // Monthly Statistics
  monthlyStats: any[];
  dailyStats: DailyPnL[];

  // Additional Metrics
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // Time-based metrics
  avgTradeHoldTime: number;
  avgWinHoldTime: number;
  avgLossHoldTime: number;
}

export class ExecutionMetrics {
  private startCapital: number;
  private riskFreeRate: number;

  constructor(startCapital: number = 10000, riskFreeRate: number = 0.025) {
    this.startCapital = startCapital;
    this.riskFreeRate = riskFreeRate;
  }

  public calculateMetrics(trades: Trade[]): MetricsResult {
    const closedTrades = trades.filter(t => t.status === 'closed' && t.pnl !== undefined);

    if (closedTrades.length === 0) {
      return this.getEmptyMetrics();
    }

    // Basic trade statistics
    const tradeStats = this.calculateTradeStats(closedTrades);

    // Daily P&L analysis
    const dailyStats = this.calculateDailyStats(closedTrades);

    // Risk and performance metrics
    const riskMetrics = this.calculateRiskMetrics(closedTrades, dailyStats);

    // Time-based analysis
    const timeMetrics = this.calculateTimeMetrics(closedTrades);

    // Advanced statistical measures
    const advancedMetrics = this.calculateAdvancedMetrics(closedTrades);

    // Monthly aggregation
    const monthlyStats = this.calculateMonthlyStats(dailyStats);

    // Provide default values for all required MetricsResult properties
    const defaultMetrics: MetricsResult = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalPnL: 0,
      totalRPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      avgWinPercent: 0,
      avgLossPercent: 0,
      avgAllPercent: 0,
      avgWinLossRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      calmarRatio: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      expectedValue: 0,
      kelly: 0,
      edge: 0,
      rsquared: 0,
      correlation: 0,
      bestDay: 0,
      worstDay: 0,
      maxDrawdownPerDay: 0,
      bestDate: '',
      worstDate: '',
      worstDrawdownDate: '',
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgTradeHoldTime: 0,
      avgWinHoldTime: 0,
      avgLossHoldTime: 0,
      monthlyStats,
      dailyStats
    };

    return {
      ...defaultMetrics,
      ...tradeStats,
      ...riskMetrics,
      ...timeMetrics,
      ...advancedMetrics,
      monthlyStats,
      dailyStats
    };
  }

  private calculateTradeStats(trades: Trade[]): Partial<MetricsResult> {
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);

    const totalTrades = trades.length;
    const winningCount = winningTrades.length;
    const losingCount = losingTrades.length;

    const winRate = totalTrades > 0 ? winningCount / totalTrades : 0;
    const lossRate = totalTrades > 0 ? losingCount / totalTrades : 0;

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalRPnL = trades.reduce((sum, t) => sum + (t.rPnl || 0), 0);

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.rPnl || 0), 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + (t.rPnl || 0), 0) / losingTrades.length
      : 0;

    const avgWinLossRatio = Math.abs(avgLoss) > 0 ? Math.abs(avgWin) / Math.abs(avgLoss) : Infinity;

    // Calculate percentage returns
    const avgWinPercent = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + ((t.exitPrice! - t.entryPrice) / t.entryPrice), 0) / winningTrades.length
      : 0;

    const avgLossPercent = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + ((t.exitPrice! - t.entryPrice) / t.entryPrice), 0) / losingTrades.length
      : 0;

    const avgAllPercent = trades.length > 0
      ? trades.reduce((sum, t) => sum + ((t.exitPrice! - t.entryPrice) / t.entryPrice), 0) / trades.length
      : 0;

    return {
      totalTrades,
      winningTrades: winningCount,
      losingTrades: losingCount,
      winRate,
      lossRate,
      totalPnL,
      totalRPnL,
      avgWin,
      avgLoss,
      avgWinPercent: avgWinPercent * 100,
      avgLossPercent: avgLossPercent * 100,
      avgAllPercent: avgAllPercent * 100,
      avgWinLossRatio
    };
  }

  private calculateDailyStats(trades: Trade[]): DailyPnL[] {
    const dailyMap = new Map<string, { pnl: number; rPnl: number; count: number }>();

    trades.forEach(trade => {
      const date = trade.exitTime ? new Date(trade.exitTime).toISOString().split('T')[0] : '';
      if (!date) return;

      const existing = dailyMap.get(date) || { pnl: 0, rPnl: 0, count: 0 };
      existing.pnl += trade.pnl || 0;
      existing.rPnl += trade.rPnl || 0;
      existing.count += 1;
      dailyMap.set(date, existing);
    });

    const dailyStats: DailyPnL[] = [];
    let cumulativePnL = 0;
    let cumulativeRPnL = 0;

    // Sort by date
    const sortedDates = Array.from(dailyMap.keys()).sort();

    sortedDates.forEach(date => {
      const data = dailyMap.get(date)!;
      cumulativePnL += data.pnl;
      cumulativeRPnL += data.rPnl;

      dailyStats.push({
        date,
        pnl: data.pnl,
        rPnl: data.rPnl,
        cumulativePnL,
        cumulativeRPnL,
        tradeCount: data.count
      });
    });

    return dailyStats;
  }

  private calculateRiskMetrics(trades: Trade[], dailyStats: DailyPnL[]): Partial<MetricsResult> {
    // Maximum drawdown calculation
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = this.startCapital;

    dailyStats.forEach(day => {
      const currentValue = this.startCapital + day.cumulativePnL;
      if (currentValue > peak) {
        peak = currentValue;
      } else {
        const drawdown = peak - currentValue;
        const drawdownPercent = (drawdown / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          maxDrawdownPercent = drawdownPercent;
        }
      }
    });

    // Calculate returns for Sharpe ratio
    const returns = dailyStats.map(day => day.rPnl);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    const sharpeRatio = volatility > 0 ? (avgReturn - this.riskFreeRate / 252) / volatility : 0;

    // Calmar ratio (annual return / max drawdown)
    const totalDays = dailyStats.length;
    const totalReturn = dailyStats.length > 0 ? dailyStats[dailyStats.length - 1].cumulativeRPnL : 0;
    const annualizedReturn = totalDays > 0 ? (totalReturn / totalDays) * 252 : 0;
    const calmarRatio = maxDrawdownPercent > 0 ? annualizedReturn / maxDrawdownPercent : 0;

    // Profit factor
    const grossProfit = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;

    // Best and worst days
    const dailyPnLs = dailyStats.map(d => d.rPnl);
    const bestDay = Math.max(...dailyPnLs);
    const worstDay = Math.min(...dailyPnLs);
    const maxDrawdownPerDay = Math.min(...dailyStats.map(d => d.rPnl));

    const bestDate = dailyStats.find(d => d.rPnl === bestDay)?.date || '';
    const worstDate = dailyStats.find(d => d.rPnl === worstDay)?.date || '';
    const worstDrawdownDate = dailyStats.find(d => d.rPnl === maxDrawdownPerDay)?.date || '';

    return {
      maxDrawdown,
      maxDrawdownPercent,
      calmarRatio,
      sharpeRatio,
      profitFactor,
      bestDay,
      worstDay,
      maxDrawdownPerDay,
      bestDate,
      worstDate,
      worstDrawdownDate,
      totalReturn: totalReturn,
      annualizedReturn,
      volatility: volatility * Math.sqrt(252) // Annualized
    };
  }

  private calculateTimeMetrics(trades: Trade[]): Partial<MetricsResult> {
    const completedTrades = trades.filter(t => t.exitTime);

    if (completedTrades.length === 0) {
      return {
        avgTradeHoldTime: 0,
        avgWinHoldTime: 0,
        avgLossHoldTime: 0
      };
    }

    const holdTimes = completedTrades.map(t => {
      const entryTime = new Date(t.entryTime).getTime();
      const exitTime = new Date(t.exitTime!).getTime();
      return (exitTime - entryTime) / (1000 * 60 * 60); // Hours
    });

    const winTrades = completedTrades.filter(t => (t.pnl || 0) > 0);
    const lossTrades = completedTrades.filter(t => (t.pnl || 0) < 0);

    const winHoldTimes = winTrades.map(t => {
      const entryTime = new Date(t.entryTime).getTime();
      const exitTime = new Date(t.exitTime!).getTime();
      return (exitTime - entryTime) / (1000 * 60 * 60);
    });

    const lossHoldTimes = lossTrades.map(t => {
      const entryTime = new Date(t.entryTime).getTime();
      const exitTime = new Date(t.exitTime!).getTime();
      return (exitTime - entryTime) / (1000 * 60 * 60);
    });

    const avgTradeHoldTime = holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
    const avgWinHoldTime = winHoldTimes.length > 0 ? winHoldTimes.reduce((a, b) => a + b, 0) / winHoldTimes.length : 0;
    const avgLossHoldTime = lossHoldTimes.length > 0 ? lossHoldTimes.reduce((a, b) => a + b, 0) / lossHoldTimes.length : 0;

    return {
      avgTradeHoldTime,
      avgWinHoldTime,
      avgLossHoldTime
    };
  }

  private calculateAdvancedMetrics(trades: Trade[]): Partial<MetricsResult> {
    if (trades.length === 0) {
      return {
        expectedValue: 0,
        kelly: 0,
        edge: 0,
        rsquared: 0,
        correlation: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0
      };
    }

    const winTrades = trades.filter(t => (t.pnl || 0) > 0);
    const lossTrades = trades.filter(t => (t.pnl || 0) < 0);

    const winRate = winTrades.length / trades.length;
    const lossRate = lossTrades.length / trades.length;

    const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.rPnl || 0), 0) / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? lossTrades.reduce((sum, t) => sum + (t.rPnl || 0), 0) / lossTrades.length : 0;

    const avgWinLossRatio = Math.abs(avgLoss) > 0 ? Math.abs(avgWin) / Math.abs(avgLoss) : Infinity;

    // Expected value
    const expectedValue = (winRate * avgWin) + (lossRate * avgLoss);

    // Kelly criterion
    const kelly = avgWinLossRatio !== Infinity ? winRate - (lossRate / avgWinLossRatio) : 0;

    // Edge
    const edge = (1 + avgWinLossRatio) * winRate - 1;

    // R-squared calculation
    const rPnLs = trades.map(t => t.rPnl || 0);
    const meanRPnL = rPnLs.reduce((a, b) => a + b, 0) / rPnLs.length;
    const tss = rPnLs.reduce((sum, val) => sum + Math.pow(val - meanRPnL, 2), 0);
    const rss = rPnLs.reduce((sum, val) => sum + Math.pow(val - meanRPnL, 2), 0);
    const rsquared = tss !== 0 ? 1 - (rss / tss) : 0;

    // Correlation (simplified - between first and second half of trades)
    const midPoint = Math.floor(trades.length / 2);
    const firstHalf = trades.slice(0, midPoint).map(t => t.rPnl || 0);
    const secondHalf = trades.slice(midPoint).map(t => t.rPnl || 0);

    let correlation = 0;
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const minLength = Math.min(firstHalf.length, secondHalf.length);
      correlation = this.calculateCorrelation(firstHalf.slice(0, minLength), secondHalf.slice(0, minLength));
    }

    // Consecutive wins/losses
    const { maxWins, maxLosses } = this.calculateConsecutiveResults(trades);

    return {
      expectedValue,
      kelly,
      edge,
      rsquared,
      correlation,
      maxConsecutiveWins: maxWins,
      maxConsecutiveLosses: maxLosses
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length === 0 || y.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateConsecutiveResults(trades: Trade[]): { maxWins: number; maxLosses: number } {
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    trades.forEach(trade => {
      const pnl = trade.pnl || 0;

      if (pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else if (pnl < 0) {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    });

    return { maxWins, maxLosses };
  }

  private calculateMonthlyStats(dailyStats: DailyPnL[]): any[] {
    const monthlyMap = new Map<string, DailyPnL[]>();

    dailyStats.forEach(day => {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, []);
      }
      monthlyMap.get(monthKey)!.push(day);
    });

    return Array.from(monthlyMap.entries()).map(([month, days]) => {
      const winDays = days.filter(d => d.rPnl > 0);
      const lossDays = days.filter(d => d.rPnl < 0);

      const winRate = days.length > 0 ? winDays.length / days.length : 0;
      const lossRate = days.length > 0 ? lossDays.length / days.length : 0;
      const avgWinDay = winDays.length > 0 ? winDays.reduce((sum, d) => sum + d.rPnl, 0) / winDays.length : 0;
      const avgLossDay = lossDays.length > 0 ? lossDays.reduce((sum, d) => sum + d.rPnl, 0) / lossDays.length : 0;
      const totalPnL = days.reduce((sum, d) => sum + d.rPnl, 0);
      const avgWinLossRatio = Math.abs(avgLossDay) > 0 ? Math.abs(avgWinDay) / Math.abs(avgLossDay) : Infinity;
      const ev = (winRate * avgWinDay) + (lossRate * avgLossDay);
      const edge = (1 + avgWinLossRatio) * winRate - 1;
      const kelly = avgWinLossRatio !== Infinity ? winRate - (lossRate / avgWinLossRatio) : 0;

      return {
        month,
        winRate,
        lossRate,
        avgWinDay,
        avgLossDay,
        avgWinLossRatio,
        totalPnL,
        edge,
        ev,
        kelly
      };
    });
  }

  private getEmptyMetrics(): MetricsResult {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalPnL: 0,
      totalRPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      avgWinPercent: 0,
      avgLossPercent: 0,
      avgAllPercent: 0,
      avgWinLossRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      calmarRatio: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      expectedValue: 0,
      kelly: 0,
      edge: 0,
      rsquared: 0,
      correlation: 0,
      bestDay: 0,
      worstDay: 0,
      maxDrawdownPerDay: 0,
      bestDate: '',
      worstDate: '',
      worstDrawdownDate: '',
      monthlyStats: [],
      dailyStats: [],
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgTradeHoldTime: 0,
      avgWinHoldTime: 0,
      avgLossHoldTime: 0
    };
  }
}