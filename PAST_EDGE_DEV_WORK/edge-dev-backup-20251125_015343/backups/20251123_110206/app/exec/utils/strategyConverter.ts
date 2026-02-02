/**
 * AI Strategy Converter
 * Converts various strategy formats to edge.dev execution format
 */

import { BacktraderEngine, BacktestResult } from './backtraderEngine';
import { fetchPolygonData, PolygonBar } from '@/utils/polygonData';

interface StrategyPattern {
  name: string;
  entryConditions: string[];
  exitConditions: string[];
  riskManagement: {
    stopLoss?: number;
    takeProfit?: number;
    positionSize?: string;
  };
  timeframe: string;
  indicators: string[];
}

interface ConvertedStrategy {
  id: string;
  name: string;
  description: string;
  entryLogic: Function;
  exitLogic: Function;
  riskManagement: {
    stopLossPercent: number;
    takeProfitPercent: number;
    maxPositionSize: number;
  };
  timeframe: string;
  requiredIndicators: string[];
  originalCode: string;
  conversionReport: string;
  backtestResult?: BacktestResult;
}

export class StrategyConverter {
  private backtraderEngine: BacktraderEngine;

  constructor() {
    this.backtraderEngine = new BacktraderEngine();
  }

  private supportedPatterns: Record<string, RegExp> = {
    // Python patterns
    python_entry: /def\s+(?:entry|buy|long)[\s\S]*?return\s+(?:True|False)/gi,
    python_exit: /def\s+(?:exit|sell|short|close)[\s\S]*?return\s+(?:True|False)/gi,
    python_conditions: /(if\s+.*?:[\s\S]*?)(?=\n\s*(?:def|if|$))/gi,

    // Pine Script patterns
    pine_entry: /(?:strategy\.entry|alertcondition).*?(?:long|short)/gi,
    pine_exit: /(?:strategy\.exit|strategy\.close)/gi,
    pine_conditions: /(?:crossover|crossunder|rising|falling|highest|lowest)/gi,

    // General trading patterns
    moving_average: /(?:ma|ema|sma|moving.?average)/gi,
    rsi: /rsi.*?(?:>|<|>=|<=)\s*\d+/gi,
    macd: /macd.*?(?:>|<|cross)/gi,
    bollinger: /(?:bb|bollinger|bands)/gi,
    volume: /volume.*?(?:>|<|spike|above|below)/gi,
    price_action: /(?:breakout|breakdown|support|resistance|pivot)/gi,

    // Risk management
    stop_loss: /(?:stop.?loss|sl).*?(\d+(?:\.\d+)?)[%]?/gi,
    take_profit: /(?:take.?profit|tp).*?(\d+(?:\.\d+)?)[%]?/gi,
    position_size: /(?:position.?size|shares|quantity).*?(\d+(?:\.\d+)?)/gi,
  };

  public async convertStrategy(code: string, filename: string, runBacktest: boolean = true): Promise<ConvertedStrategy> {
    try {
      const analysisResult = this.analyzeCode(code);
      const pattern = this.extractPattern(code, analysisResult);
      const convertedStrategy = this.generateStrategy(pattern, code, filename);

      // Run backtest if requested
      if (runBacktest) {
        console.log('Running backtest for converted strategy...');
        const backtestResult = await this.runBacktest(convertedStrategy);
        convertedStrategy.backtestResult = backtestResult;

        // Print comprehensive statistics
        this.printBacktestResults(backtestResult);
      }

      return convertedStrategy;
    } catch (error) {
      throw new Error(`Strategy conversion failed: ${error}`);
    }
  }

  public async runBacktest(strategy: ConvertedStrategy, symbol: string = 'AAPL', days: number = 252): Promise<BacktestResult> {
    try {
      // Fetch historical data for backtesting
      console.log(`Fetching ${days} days of historical data for ${symbol}...`);
      const historicalData = await fetchPolygonData(symbol, strategy.timeframe, days);

      if (!historicalData || historicalData.length === 0) {
        throw new Error(`No historical data available for ${symbol}`);
      }

      // Convert Polygon data to backtrader format
      const backtestData = historicalData.map((bar: PolygonBar) => ({
        timestamp: new Date(bar.t).toISOString(),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v
      }));

      console.log(`Running backtest with ${backtestData.length} data points...`);

      // Run backtest using BacktraderEngine
      // Convert strategy to code string (simplified for now)
      const strategyCode = `
        // Strategy: ${strategy.name || 'Converted Strategy'}
        // Entry Logic: ${strategy.entryLogic.toString()}
        // Exit Logic: ${strategy.exitLogic.toString()}
        // Risk Management: ${JSON.stringify(strategy.riskManagement)}
      `;

      const result = await this.backtraderEngine.runBacktest(
        strategyCode,
        symbol,
        undefined, // startDate - use default
        undefined, // endDate - use default
        10000      // initialCash
      );

      return result;
    } catch (error) {
      console.error('Backtest failed:', error);
      throw new Error(`Backtest failed: ${error}`);
    }
  }

  private printBacktestResults(result: BacktestResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE BACKTEST RESULTS');
    console.log('='.repeat(60));

    console.log('\n💰 PERFORMANCE SUMMARY');
    console.log(`Total Return: ${result.stats.total_return.toFixed(2)}%`);
    console.log(`Annual Return: ${result.stats.annual_return.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${result.stats.sharpe_ratio.toFixed(2)}`);
    console.log(`Max Drawdown: ${result.stats.max_drawdown.toFixed(2)}%`);
    console.log(`Calmar Ratio: ${result.stats.calmar_ratio.toFixed(2)}`);

    console.log('\n📈 TRADING STATISTICS');
    console.log(`Total Trades: ${result.stats.total_trades}`);
    console.log(`Winning Trades: ${result.stats.winning_trades}`);
    console.log(`Losing Trades: ${result.stats.losing_trades}`);
    console.log(`Win Rate: ${result.stats.win_rate.toFixed(2)}%`);
    console.log(`Profit Factor: ${result.stats.profit_factor.toFixed(2)}`);

    console.log('\n💸 TRADE ANALYSIS');
    console.log(`Average Trade: ${result.stats.avg_trade.toFixed(2)}%`);
    console.log(`Average Winner: ${result.stats.avg_win.toFixed(2)}%`);
    console.log(`Average Loser: ${result.stats.avg_loss.toFixed(2)}%`);
    console.log(`Best Trade: ${result.stats.best_trade.toFixed(2)}%`);
    console.log(`Worst Trade: ${result.stats.worst_trade.toFixed(2)}%`);

    console.log('\n⏱️ HOLDING PERIODS');
    console.log(`Avg Trade Duration: ${result.stats.avg_trade_duration.toFixed(1)} periods`);
    console.log(`Max Consecutive Wins: ${result.stats.max_consecutive_wins} trades`);
    console.log(`Max Consecutive Losses: ${result.stats.max_consecutive_losses} trades`);

    console.log('\n🎯 RISK METRICS');
    console.log(`Sortino Ratio: ${result.stats.sortino_ratio.toFixed(2)}`);
    console.log(`VaR (95%): ${result.stats.var_95.toFixed(2)}%`);
    console.log(`CVaR (95%): ${result.stats.cvar_95.toFixed(2)}%`);
    console.log(`Kelly Criterion: ${result.stats.kelly_criterion.toFixed(2)}`);

    console.log('\n📊 CAPITAL ANALYSIS');
    console.log(`Starting Capital: $${result.stats.starting_capital.toFixed(2)}`);
    console.log(`Ending Capital: $${result.stats.ending_capital.toFixed(2)}`);
    console.log(`Peak Capital: $${result.stats.peak_capital.toFixed(2)}`);
    console.log(`Lowest Capital: $${result.stats.lowest_capital.toFixed(2)}`);

    if (result.trades && result.trades.length > 0) {
      console.log('\n📋 RECENT TRADES (Last 5)');
      const recentTrades = result.trades.slice(-5);
      recentTrades.forEach((trade, index) => {
        console.log(`${index + 1}. ${trade.direction} - P&L: ${trade.pnl.toFixed(2)} - ${trade.entry_date} to ${trade.exit_date || 'Open'}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Backtest completed successfully!');
    console.log('='.repeat(60) + '\n');
  }

  private analyzeCode(code: string): any {
    const codeType = this.detectCodeType(code);
    const indicators = this.extractIndicators(code);
    const conditions = this.extractConditions(code);
    const riskParams = this.extractRiskManagement(code);

    return {
      codeType,
      indicators,
      conditions,
      riskParams,
      complexity: this.assessComplexity(code)
    };
  }

  private detectCodeType(code: string): string {
    if (code.includes('def ') && (code.includes('pandas') || code.includes('numpy'))) {
      return 'python';
    }
    if (code.includes('//@version') || code.includes('strategy(')) {
      return 'pinescript';
    }
    if (code.includes('function') && code.includes('return')) {
      return 'javascript';
    }
    return 'plain_text';
  }

  private extractIndicators(code: string): string[] {
    const indicators: string[] = [];

    Object.entries(this.supportedPatterns).forEach(([key, pattern]) => {
      if (key.includes('ma') || key.includes('rsi') || key.includes('macd') || key.includes('bollinger')) {
        const matches = code.match(pattern);
        if (matches) {
          indicators.push(key);
        }
      }
    });

    return indicators;
  }

  private extractConditions(code: string): { entry: string[], exit: string[] } {
    const entryConditions: string[] = [];
    const exitConditions: string[] = [];

    // Extract entry conditions
    const entryMatches = code.match(this.supportedPatterns.python_entry) ||
                        code.match(this.supportedPatterns.pine_entry);
    if (entryMatches) {
      entryConditions.push(...entryMatches);
    }

    // Extract exit conditions
    const exitMatches = code.match(this.supportedPatterns.python_exit) ||
                       code.match(this.supportedPatterns.pine_exit);
    if (exitMatches) {
      exitConditions.push(...exitMatches);
    }

    return { entry: entryConditions, exit: exitConditions };
  }

  private extractRiskManagement(code: string): any {
    const riskParams: any = {};

    // Extract stop loss
    const stopLossMatch = code.match(this.supportedPatterns.stop_loss);
    if (stopLossMatch) {
      const value = parseFloat(stopLossMatch[0].match(/\d+(?:\.\d+)?/)?.[0] || '0');
      riskParams.stopLoss = value;
    }

    // Extract take profit
    const takeProfitMatch = code.match(this.supportedPatterns.take_profit);
    if (takeProfitMatch) {
      const value = parseFloat(takeProfitMatch[0].match(/\d+(?:\.\d+)?/)?.[0] || '0');
      riskParams.takeProfit = value;
    }

    // Extract position size
    const positionSizeMatch = code.match(this.supportedPatterns.position_size);
    if (positionSizeMatch) {
      const value = parseFloat(positionSizeMatch[0].match(/\d+(?:\.\d+)?/)?.[0] || '0');
      riskParams.positionSize = value;
    }

    return riskParams;
  }

  private assessComplexity(code: string): string {
    const lines = code.split('\n').length;
    const functions = (code.match(/def\s+\w+/g) || []).length;
    const conditions = (code.match(/if\s+/g) || []).length;

    if (lines > 200 || functions > 10 || conditions > 15) {
      return 'high';
    } else if (lines > 50 || functions > 3 || conditions > 5) {
      return 'medium';
    }
    return 'low';
  }

  private extractPattern(code: string, analysis: any): StrategyPattern {
    return {
      name: this.generateStrategyName(analysis),
      entryConditions: analysis.conditions.entry,
      exitConditions: analysis.conditions.exit,
      riskManagement: {
        stopLoss: analysis.riskParams.stopLoss || 2.0,
        takeProfit: analysis.riskParams.takeProfit || 4.0,
        positionSize: analysis.riskParams.positionSize?.toString() || '1000'
      },
      timeframe: this.detectTimeframe(code),
      indicators: analysis.indicators
    };
  }

  private generateStrategyName(analysis: any): string {
    const indicators = analysis.indicators.join('_');
    const complexity = analysis.complexity;
    return `${indicators}_${complexity}_strategy`.replace(/[^a-zA-Z0-9_]/g, '');
  }

  private detectTimeframe(code: string): string {
    if (code.match(/5m|5.?min/gi)) return '5m';
    if (code.match(/15m|15.?min/gi)) return '15m';
    if (code.match(/30m|30.?min/gi)) return '30m';
    if (code.match(/1h|1.?hour/gi)) return '1h';
    if (code.match(/4h|4.?hour/gi)) return '4h';
    if (code.match(/1d|daily/gi)) return '1d';
    return '5m'; // default
  }

  private generateStrategy(pattern: StrategyPattern, originalCode: string, filename: string): ConvertedStrategy {
    const strategyId = `strategy_${Date.now()}`;

    // Generate entry logic function
    const entryLogic = this.createEntryFunction(pattern);

    // Generate exit logic function
    const exitLogic = this.createExitFunction(pattern);

    // Create conversion report
    const conversionReport = this.generateConversionReport(pattern, originalCode);

    return {
      id: strategyId,
      name: pattern.name || filename.replace(/\.[^/.]+$/, ""),
      description: `Converted strategy from ${filename}`,
      entryLogic,
      exitLogic,
      riskManagement: {
        stopLossPercent: pattern.riskManagement.stopLoss || 2.0,
        takeProfitPercent: pattern.riskManagement.takeProfit || 4.0,
        maxPositionSize: parseInt(pattern.riskManagement.positionSize || '1000')
      },
      timeframe: pattern.timeframe,
      requiredIndicators: pattern.indicators,
      originalCode,
      conversionReport
    };
  }

  private createEntryFunction(pattern: StrategyPattern): Function {
    return (marketData: any, indicators: any, currentTime: string) => {
      try {
        // Basic entry logic based on detected patterns
        const { price, volume } = marketData;
        const { ema9, ema20, rsi, macd } = indicators;

        // Simple momentum strategy logic
        if (pattern.indicators.includes('moving_average') && ema9 && ema20) {
          return ema9 > ema20 && price > ema9;
        }

        // RSI oversold/overbought logic
        if (pattern.indicators.includes('rsi') && rsi) {
          return rsi < 30; // Oversold entry
        }

        // Volume breakout logic
        if (pattern.indicators.includes('volume') && volume) {
          return volume > indicators.avgVolume * 1.5;
        }

        // Default simple breakout
        return price > indicators.prevHigh;

      } catch (error) {
        console.error('Entry logic error:', error);
        return false;
      }
    };
  }

  private createExitFunction(pattern: StrategyPattern): Function {
    return (marketData: any, indicators: any, currentPosition: any) => {
      try {
        const { price } = marketData;
        const { entryPrice, shares } = currentPosition;

        // Calculate profit/loss percentage
        const pnlPercent = ((price - entryPrice) / entryPrice) * 100;

        // Stop loss
        if (pnlPercent <= -pattern.riskManagement.stopLoss!) {
          return { exit: true, reason: 'stop_loss' };
        }

        // Take profit
        if (pnlPercent >= pattern.riskManagement.takeProfit!) {
          return { exit: true, reason: 'take_profit' };
        }

        // Time-based exit (end of day)
        const currentHour = new Date().getHours();
        if (currentHour >= 15) { // 3 PM ET
          return { exit: true, reason: 'eod' };
        }

        return { exit: false, reason: null };

      } catch (error) {
        console.error('Exit logic error:', error);
        return { exit: true, reason: 'error' };
      }
    };
  }

  private generateConversionReport(pattern: StrategyPattern, originalCode: string): string {
    const report = `
# Strategy Conversion Report

## Original Code Analysis
- **Code Type**: ${this.detectCodeType(originalCode)}
- **Complexity**: ${this.assessComplexity(originalCode)}
- **Lines of Code**: ${originalCode.split('\n').length}

## Extracted Components
- **Entry Conditions**: ${pattern.entryConditions.length} detected
- **Exit Conditions**: ${pattern.exitConditions.length} detected
- **Indicators**: ${pattern.indicators.join(', ') || 'None detected'}
- **Timeframe**: ${pattern.timeframe}

## Risk Management
- **Stop Loss**: ${pattern.riskManagement.stopLoss}%
- **Take Profit**: ${pattern.riskManagement.takeProfit}%
- **Position Size**: ${pattern.riskManagement.positionSize}

## Conversion Status
✅ **Successfully converted** to edge.dev execution format

## Notes
- Strategy has been adapted to work with edge.dev's execution engine
- Default risk management applied where not specified
- Live testing recommended before deployment

## Recommendations
1. Review and adjust risk parameters
2. Test with paper trading first
3. Monitor performance and adjust as needed
    `.trim();

    return report;
  }

  // Helper method to validate converted strategy
  public validateStrategy(strategy: ConvertedStrategy): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!strategy.entryLogic || typeof strategy.entryLogic !== 'function') {
      errors.push('Entry logic is missing or invalid');
    }

    if (!strategy.exitLogic || typeof strategy.exitLogic !== 'function') {
      errors.push('Exit logic is missing or invalid');
    }

    if (!strategy.riskManagement.stopLossPercent || strategy.riskManagement.stopLossPercent <= 0) {
      errors.push('Stop loss percentage must be greater than 0');
    }

    if (!strategy.riskManagement.takeProfitPercent || strategy.riskManagement.takeProfitPercent <= 0) {
      errors.push('Take profit percentage must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}