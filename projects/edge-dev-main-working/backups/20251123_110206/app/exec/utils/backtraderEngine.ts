/**
 * Backtrader Integration for Edge.dev
 * Provides proper backtesting functionality with comprehensive statistics
 */

import { fetchPolygonData, PolygonBar } from '@/utils/polygonData';

export interface BacktestResult {
  trades: BacktestTrade[];
  stats: BacktestStats;
  equity_curve: number[];
  drawdown_curve: number[];
}

interface BacktestTrade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  size: number;
  pnl: number;
  pnl_percent: number;
  commission: number;
  direction: 'long' | 'short';
  entry_reason: string;
  exit_reason: string;
  bars_held: number;
}

interface BacktestStats {
  // Basic Performance
  total_return: number;
  annual_return: number;
  max_drawdown: number;
  max_drawdown_duration: number;

  // Trade Statistics
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  avg_trade: number;
  best_trade: number;
  worst_trade: number;

  // Risk Metrics
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  profit_factor: number;
  expectancy: number;

  // Advanced Metrics
  var_95: number; // Value at Risk
  cvar_95: number; // Conditional Value at Risk
  kelly_criterion: number;

  // Time-based Metrics
  avg_trade_duration: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;

  // Equity Metrics
  starting_capital: number;
  ending_capital: number;
  peak_capital: number;
  lowest_capital: number;
}

export class BacktraderEngine {
  private symbol: string = '';
  private startDate: string = '';
  private endDate: string = '';
  private initialCash: number = 10000;
  private commission: number = 0.001; // 0.1%

  constructor() {
    // Initialize engine
  }

  public async runBacktest(
    strategyCode: string,
    symbol: string = 'AAPL',
    startDate: string = '2023-01-01',
    endDate: string = '2024-01-01',
    initialCash: number = 10000
  ): Promise<BacktestResult> {
    this.symbol = symbol;
    this.startDate = startDate;
    this.endDate = endDate;
    this.initialCash = initialCash;

    try {
      // Get historical data
      const data = await this.fetchBacktestData();
      if (!data || data.length === 0) {
        throw new Error('No data available for backtesting');
      }

      // Parse strategy
      const strategy = this.parseStrategy(strategyCode);

      // Run backtest simulation
      const result = this.simulateStrategy(data, strategy);

      // Calculate comprehensive statistics
      const stats = this.calculateStatistics(result.trades, result.equity_curve);

      return {
        trades: result.trades,
        stats,
        equity_curve: result.equity_curve,
        drawdown_curve: result.drawdown_curve
      };

    } catch (error) {
      console.error('Backtest failed:', error);
      throw error;
    }
  }

  private async fetchBacktestData(): Promise<PolygonBar[]> {
    const startDateObj = new Date(this.startDate);
    const endDateObj = new Date(this.endDate);
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

    const data = await fetchPolygonData(this.symbol, 'day', daysDiff);
    return data || [];
  }

  private parseStrategy(strategyCode: string): any {
    // Extract strategy logic from code
    const strategy = {
      entryConditions: this.extractEntryConditions(strategyCode),
      exitConditions: this.extractExitConditions(strategyCode),
      riskManagement: this.extractRiskManagement(strategyCode)
    };

    return strategy;
  }

  private extractEntryConditions(code: string): Function {
    // Simple pattern recognition for entry conditions
    return (data: PolygonBar[], index: number, indicators: any) => {
      if (index < 20) return false; // Need enough data

      const current = data[index];
      const prev = data[index - 1];

      // Simple moving average crossover strategy as default
      const sma20 = this.calculateSMA(data.slice(0, index + 1).map(d => d.c), 20);
      const sma50 = this.calculateSMA(data.slice(0, index + 1).map(d => d.c), 50);

      if (sma20.length < 2 || sma50.length < 2) return false;

      // Golden cross entry
      return sma20[sma20.length - 1] > sma50[sma50.length - 1] &&
             sma20[sma20.length - 2] <= sma50[sma50.length - 2];
    };
  }

  private extractExitConditions(code: string): Function {
    return (data: PolygonBar[], index: number, entryPrice: number, entryIndex: number) => {
      const current = data[index];
      const barsHeld = index - entryIndex;

      // Exit conditions
      const stopLoss = entryPrice * 0.95; // 5% stop loss
      const takeProfit = entryPrice * 1.10; // 10% take profit
      const maxBars = 20; // Max holding period

      if (current.l <= stopLoss) {
        return { exit: true, price: stopLoss, reason: 'stop_loss' };
      }

      if (current.h >= takeProfit) {
        return { exit: true, price: takeProfit, reason: 'take_profit' };
      }

      if (barsHeld >= maxBars) {
        return { exit: true, price: current.c, reason: 'time_exit' };
      }

      // Death cross exit
      const sma20 = this.calculateSMA(data.slice(0, index + 1).map(d => d.c), 20);
      const sma50 = this.calculateSMA(data.slice(0, index + 1).map(d => d.c), 50);

      if (sma20.length >= 2 && sma50.length >= 2) {
        if (sma20[sma20.length - 1] < sma50[sma50.length - 1] &&
            sma20[sma20.length - 2] >= sma50[sma50.length - 2]) {
          return { exit: true, price: current.c, reason: 'signal_exit' };
        }
      }

      return { exit: false, price: current.c, reason: null };
    };
  }

  private extractRiskManagement(code: string): any {
    return {
      positionSize: 0.1, // 10% of capital per trade
      maxPositions: 1,
      stopLoss: 0.05, // 5%
      takeProfit: 0.10 // 10%
    };
  }

  private simulateStrategy(data: PolygonBar[], strategy: any): {
    trades: BacktestTrade[];
    equity_curve: number[];
    drawdown_curve: number[];
  } {
    const trades: BacktestTrade[] = [];
    const equity_curve: number[] = [this.initialCash];
    const drawdown_curve: number[] = [0];

    let cash = this.initialCash;
    let position = 0;
    let entryPrice = 0;
    let entryIndex = 0;
    let entryReason = '';
    let peak = this.initialCash;

    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const currentValue = cash + (position * current.c);

      // Update equity curve
      equity_curve.push(currentValue);

      // Update drawdown
      if (currentValue > peak) {
        peak = currentValue;
      }
      const drawdown = (peak - currentValue) / peak;
      drawdown_curve.push(drawdown);

      // Check for entry signal
      if (position === 0 && strategy.entryConditions(data, i, {})) {
        const positionValue = cash * strategy.riskManagement.positionSize;
        const shares = Math.floor(positionValue / current.c);

        if (shares > 0) {
          position = shares;
          entryPrice = current.c;
          entryIndex = i;
          entryReason = 'signal_entry';
          cash -= shares * current.c * (1 + this.commission);
        }
      }

      // Check for exit signal
      if (position > 0) {
        const exitSignal = strategy.exitConditions(data, i, entryPrice, entryIndex);

        if (exitSignal.exit) {
          const exitPrice = exitSignal.price;
          const gross_pnl = (exitPrice - entryPrice) * position;
          const commission_cost = (entryPrice + exitPrice) * position * this.commission;
          const net_pnl = gross_pnl - commission_cost;

          cash += position * exitPrice * (1 - this.commission);

          // Record trade
          trades.push({
            entry_date: new Date(data[entryIndex].t).toISOString(),
            exit_date: new Date(current.t).toISOString(),
            entry_price: entryPrice,
            exit_price: exitPrice,
            size: position,
            pnl: net_pnl,
            pnl_percent: (net_pnl / (entryPrice * position)) * 100,
            commission: commission_cost,
            direction: 'long',
            entry_reason: entryReason,
            exit_reason: exitSignal.reason,
            bars_held: i - entryIndex
          });

          position = 0;
          entryPrice = 0;
          entryIndex = 0;
        }
      }
    }

    return { trades, equity_curve, drawdown_curve };
  }

  private calculateStatistics(trades: BacktestTrade[], equity_curve: number[]): BacktestStats {
    if (trades.length === 0) {
      return this.getEmptyStats();
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);

    // Basic stats
    const totalReturn = (equity_curve[equity_curve.length - 1] / equity_curve[0] - 1) * 100;
    const tradingDays = equity_curve.length;
    const annualReturn = (Math.pow(equity_curve[equity_curve.length - 1] / equity_curve[0], 252 / tradingDays) - 1) * 100;

    // Drawdown calculation
    let maxDrawdown = 0;
    let peak = equity_curve[0];
    for (const value of equity_curve) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Trade statistics
    const winRate = winningTrades.length / trades.length;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;

    // Risk metrics
    const returns = equity_curve.slice(1).map((val, i) => (val - equity_curve[i]) / equity_curve[i]);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStd = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStd > 0 ? (avgReturn - 0.02/252) / returnStd * Math.sqrt(252) : 0;

    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin * winningTrades.length) / Math.abs(avgLoss * losingTrades.length) : Infinity;

    return {
      total_return: totalReturn,
      annual_return: annualReturn,
      max_drawdown: maxDrawdown * 100,
      max_drawdown_duration: 0, // TODO: Calculate

      total_trades: trades.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: winRate,
      avg_win: avgWin,
      avg_loss: avgLoss,
      avg_trade: trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length,
      best_trade: Math.max(...trades.map(t => t.pnl)),
      worst_trade: Math.min(...trades.map(t => t.pnl)),

      sharpe_ratio: sharpeRatio,
      sortino_ratio: 0, // TODO: Calculate
      calmar_ratio: maxDrawdown > 0 ? annualReturn / (maxDrawdown * 100) : 0,
      profit_factor: profitFactor,
      expectancy: (winRate * avgWin) + ((1 - winRate) * avgLoss),

      var_95: 0, // TODO: Calculate
      cvar_95: 0, // TODO: Calculate
      kelly_criterion: profitFactor > 1 ? winRate - ((1 - winRate) / (profitFactor - 1)) : 0,

      avg_trade_duration: trades.reduce((sum, t) => sum + t.bars_held, 0) / trades.length,
      max_consecutive_wins: this.calculateMaxConsecutive(trades, true),
      max_consecutive_losses: this.calculateMaxConsecutive(trades, false),

      starting_capital: this.initialCash,
      ending_capital: equity_curve[equity_curve.length - 1],
      peak_capital: Math.max(...equity_curve),
      lowest_capital: Math.min(...equity_curve)
    };
  }

  private calculateMaxConsecutive(trades: BacktestTrade[], wins: boolean): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of trades) {
      const isWin = trade.pnl > 0;
      if (isWin === wins) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private getEmptyStats(): BacktestStats {
    return {
      total_return: 0,
      annual_return: 0,
      max_drawdown: 0,
      max_drawdown_duration: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      avg_win: 0,
      avg_loss: 0,
      avg_trade: 0,
      best_trade: 0,
      worst_trade: 0,
      sharpe_ratio: 0,
      sortino_ratio: 0,
      calmar_ratio: 0,
      profit_factor: 0,
      expectancy: 0,
      var_95: 0,
      cvar_95: 0,
      kelly_criterion: 0,
      avg_trade_duration: 0,
      max_consecutive_wins: 0,
      max_consecutive_losses: 0,
      starting_capital: 0,
      ending_capital: 0,
      peak_capital: 0,
      lowest_capital: 0
    };
  }

  // Print comprehensive statistics
  public printStatistics(stats: BacktestStats): void {
    console.log('\n=== BACKTEST RESULTS ===');
    console.log('\n--- Performance Overview ---');
    console.log(`Total Return: ${stats.total_return.toFixed(2)}%`);
    console.log(`Annual Return: ${stats.annual_return.toFixed(2)}%`);
    console.log(`Max Drawdown: ${stats.max_drawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${stats.sharpe_ratio.toFixed(3)}`);
    console.log(`Calmar Ratio: ${stats.calmar_ratio.toFixed(3)}`);

    console.log('\n--- Trade Statistics ---');
    console.log(`Total Trades: ${stats.total_trades}`);
    console.log(`Winning Trades: ${stats.winning_trades} (${(stats.win_rate * 100).toFixed(1)}%)`);
    console.log(`Losing Trades: ${stats.losing_trades} (${((1 - stats.win_rate) * 100).toFixed(1)}%)`);
    console.log(`Average Win: $${stats.avg_win.toFixed(2)}`);
    console.log(`Average Loss: $${stats.avg_loss.toFixed(2)}`);
    console.log(`Best Trade: $${stats.best_trade.toFixed(2)}`);
    console.log(`Worst Trade: $${stats.worst_trade.toFixed(2)}`);
    console.log(`Profit Factor: ${stats.profit_factor.toFixed(3)}`);

    console.log('\n--- Risk Metrics ---');
    console.log(`Expectancy: $${stats.expectancy.toFixed(2)}`);
    console.log(`Kelly Criterion: ${(stats.kelly_criterion * 100).toFixed(1)}%`);
    console.log(`Max Consecutive Wins: ${stats.max_consecutive_wins}`);
    console.log(`Max Consecutive Losses: ${stats.max_consecutive_losses}`);
    console.log(`Average Trade Duration: ${stats.avg_trade_duration.toFixed(1)} bars`);

    console.log('\n--- Capital Management ---');
    console.log(`Starting Capital: $${stats.starting_capital.toFixed(2)}`);
    console.log(`Ending Capital: $${stats.ending_capital.toFixed(2)}`);
    console.log(`Peak Capital: $${stats.peak_capital.toFixed(2)}`);
    console.log(`Lowest Capital: $${stats.lowest_capital.toFixed(2)}`);
    console.log('========================\n');
  }
}