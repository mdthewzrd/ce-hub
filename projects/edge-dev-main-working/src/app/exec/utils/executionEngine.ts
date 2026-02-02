/**
 * Execution Engine
 * Handles real-time strategy execution, trade management, and data processing
 */

import { fetchPolygonData, PolygonBar } from '@/utils/polygonData';

interface MarketData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

interface Position {
  id: string;
  symbol: string;
  entryTime: string;
  entryPrice: number;
  shares: number;
  entryReason: string;
  unrealizedPnL: number;
  stopLoss: number;
  takeProfit: number;
}

interface ExecutionTrade {
  id: string;
  symbol: string;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  shares: number;
  pnl?: number;
  entryReason: string;
  exitReason?: string;
  rPnl?: number;
  status: 'open' | 'closed';
}

interface Strategy {
  id: string;
  name: string;
  entryLogic: Function;
  exitLogic: Function;
  riskManagement: {
    stopLossPercent: number;
    takeProfitPercent: number;
    maxPositionSize: number;
  };
  timeframe: string;
  requiredIndicators: string[];
}

interface ExecutionEngineConfig {
  onTradeUpdate: (trade: ExecutionTrade) => void;
  onMetricsUpdate: (metrics: any) => void;
  onChartUpdate: (chartData: any[]) => void;
  onError?: (error: string) => void;
}

export class ExecutionEngine {
  private isRunning: boolean = false;
  private strategy: Strategy | null = null;
  private symbol: string = '';
  private currentPositions: Map<string, Position> = new Map();
  private marketData: MarketData[] = [];
  private indicators: any = {};
  private config: ExecutionEngineConfig;
  private dataUpdateInterval: NodeJS.Timeout | null = null;
  private executionInterval: NodeJS.Timeout | null = null;

  // Risk management
  private readonly MAX_POSITIONS = 3;
  private readonly MAX_DAILY_LOSS = 1000; // $1000 max daily loss
  private dailyPnL: number = 0;

  constructor(config: ExecutionEngineConfig) {
    this.config = config;
  }

  public async start(strategy: Strategy, symbol: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Execution engine is already running');
    }

    this.strategy = strategy;
    this.symbol = symbol;
    this.isRunning = true;
    this.dailyPnL = 0;

    try {
      // Initialize with historical data
      await this.loadHistoricalData();

      // Calculate initial indicators
      this.updateIndicators();

      // Start real-time data feed
      this.startDataFeed();

      // Start execution loop
      this.startExecutionLoop();

      console.log(`Execution engine started for ${symbol} with strategy ${strategy.name}`);
    } catch (error) {
      this.isRunning = false;
      throw new Error(`Failed to start execution engine: ${error}`);
    }
  }

  public stop(): void {
    this.isRunning = false;

    if (this.dataUpdateInterval) {
      clearInterval(this.dataUpdateInterval);
      this.dataUpdateInterval = null;
    }

    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }

    // Close all open positions
    this.closeAllPositions('manual_stop');

    console.log('Execution engine stopped');
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      const data = await fetchPolygonData(this.symbol, this.strategy!.timeframe, 5);

      if (!data || data.length === 0) {
        throw new Error(`No historical data available for ${this.symbol}`);
      }

      this.marketData = data.map((bar: PolygonBar) => ({
        timestamp: new Date(bar.t).toISOString(),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        vwap: (bar.h + bar.l + bar.c) / 3 // Calculate typical price as VWAP approximation
      }));

      console.log(`Loaded ${this.marketData.length} historical bars for ${this.symbol}`);
    } catch (error) {
      console.error('Failed to load historical data:', error);
      throw error;
    }
  }

  private startDataFeed(): void {
    // In production, this would connect to a WebSocket feed
    // For now, we'll simulate with periodic API calls
    this.dataUpdateInterval = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.updateMarketData();
        this.updateIndicators();
        this.config.onChartUpdate(this.getChartData());
      } catch (error) {
        console.error('Data feed error:', error);
        this.config.onError?.(`Data feed error: ${error}`);
      }
    }, 30000); // Update every 30 seconds (in production would be real-time)
  }

  private async updateMarketData(): Promise<void> {
    try {
      // Get fresh data (last 1 day to get latest bars)
      const recentData = await fetchPolygonData(this.symbol, this.strategy!.timeframe, 1);

      if (recentData && recentData.length > 0) {
        const latestBar = recentData[recentData.length - 1];
        const newData: MarketData = {
          timestamp: new Date(latestBar.t).toISOString(),
          open: latestBar.o,
          high: latestBar.h,
          low: latestBar.l,
          close: latestBar.c,
          volume: latestBar.v,
          vwap: (latestBar.h + latestBar.l + latestBar.c) / 3
        };

        // Add to market data if it's a new bar
        const lastTimestamp = this.marketData.length > 0 ? this.marketData[this.marketData.length - 1].timestamp : '';
        if (newData.timestamp !== lastTimestamp) {
          this.marketData.push(newData);

          // Keep only last 1000 bars to manage memory
          if (this.marketData.length > 1000) {
            this.marketData = this.marketData.slice(-1000);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update market data:', error);
    }
  }

  private updateIndicators(): void {
    if (this.marketData.length < 50) return; // Need enough data for indicators

    const closes = this.marketData.map(d => d.close);
    const highs = this.marketData.map(d => d.high);
    const lows = this.marketData.map(d => d.low);
    const volumes = this.marketData.map(d => d.volume);

    // Calculate EMAs
    this.indicators.ema9 = this.calculateEMA(closes, 9);
    this.indicators.ema20 = this.calculateEMA(closes, 20);
    this.indicators.ema50 = this.calculateEMA(closes, 50);

    // Calculate RSI
    this.indicators.rsi = this.calculateRSI(closes, 14);

    // Calculate average volume
    this.indicators.avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

    // Calculate VWAP
    this.indicators.vwap = this.calculateVWAP();

    // Calculate ATR
    this.indicators.atr = this.calculateATR(highs, lows, closes, 14);

    // Previous high/low for breakout detection
    this.indicators.prevHigh = Math.max(...highs.slice(-20, -1));
    this.indicators.prevLow = Math.min(...lows.slice(-20, -1));
  }

  private calculateEMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateRSI(data: number[], period: number): number {
    if (data.length < period + 1) return 50; // Default neutral

    const changes = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i] - data[i - 1]);
    }

    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateVWAP(): number {
    const recentData = this.marketData.slice(-50); // Last 50 bars
    let totalVolume = 0;
    let totalVolumePrice = 0;

    recentData.forEach(bar => {
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;
      totalVolumePrice += typicalPrice * bar.volume;
      totalVolume += bar.volume;
    });

    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }

  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length < period + 1) return 0;

    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  private startExecutionLoop(): void {
    this.executionInterval = setInterval(() => {
      if (!this.isRunning || !this.strategy) return;

      try {
        this.processExecution();
      } catch (error) {
        console.error('Execution loop error:', error);
        this.config.onError?.(`Execution error: ${error}`);
      }
    }, 5000); // Check every 5 seconds
  }

  private processExecution(): void {
    if (this.marketData.length < 50) return; // Not enough data

    const currentMarketData = this.marketData[this.marketData.length - 1];
    const currentTime = new Date().toISOString();

    // Check exit conditions for existing positions
    this.checkExitConditions(currentMarketData, currentTime);

    // Check entry conditions if we can open new positions
    if (this.canOpenNewPosition()) {
      this.checkEntryConditions(currentMarketData, currentTime);
    }

    // Update position metrics
    this.updatePositionMetrics(currentMarketData);

    // Update overall metrics
    this.updateMetrics();
  }

  private checkEntryConditions(marketData: MarketData, currentTime: string): void {
    try {
      const shouldEnter = this.strategy!.entryLogic(marketData, this.indicators, currentTime);

      if (shouldEnter) {
        this.openPosition(marketData, currentTime, 'strategy_signal');
      }
    } catch (error) {
      console.error('Entry condition check failed:', error);
    }
  }

  private checkExitConditions(marketData: MarketData, currentTime: string): void {
    this.currentPositions.forEach((position, positionId) => {
      try {
        const exitResult = this.strategy!.exitLogic(marketData, this.indicators, {
          entryPrice: position.entryPrice,
          shares: position.shares,
          unrealizedPnL: position.unrealizedPnL
        });

        if (exitResult.exit) {
          this.closePosition(positionId, marketData.close, currentTime, exitResult.reason);
        }
      } catch (error) {
        console.error('Exit condition check failed:', error);
        // Force close position on error
        this.closePosition(positionId, marketData.close, currentTime, 'error');
      }
    });
  }

  private canOpenNewPosition(): boolean {
    return this.currentPositions.size < this.MAX_POSITIONS &&
           this.dailyPnL > -this.MAX_DAILY_LOSS &&
           this.isMarketHours();
  }

  private isMarketHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Simple market hours check (9:30 AM - 4:00 PM ET, Monday-Friday)
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  }

  private openPosition(marketData: MarketData, currentTime: string, reason: string): void {
    const positionId = `pos_${Date.now()}`;
    const shares = Math.floor(this.strategy!.riskManagement.maxPositionSize / marketData.close);

    if (shares <= 0) return;

    const stopLoss = marketData.close * (1 - this.strategy!.riskManagement.stopLossPercent / 100);
    const takeProfit = marketData.close * (1 + this.strategy!.riskManagement.takeProfitPercent / 100);

    const position: Position = {
      id: positionId,
      symbol: this.symbol,
      entryTime: currentTime,
      entryPrice: marketData.close,
      shares,
      entryReason: reason,
      unrealizedPnL: 0,
      stopLoss,
      takeProfit
    };

    this.currentPositions.set(positionId, position);

    // Create trade record
    const trade: ExecutionTrade = {
      id: positionId,
      symbol: this.symbol,
      entryTime: currentTime,
      entryPrice: marketData.close,
      shares,
      entryReason: reason,
      status: 'open'
    };

    this.config.onTradeUpdate(trade);
    console.log(`Opened position: ${shares} shares of ${this.symbol} at $${marketData.close}`);
  }

  private closePosition(positionId: string, exitPrice: number, exitTime: string, reason: string): void {
    const position = this.currentPositions.get(positionId);
    if (!position) return;

    const pnl = (exitPrice - position.entryPrice) * position.shares;
    const rPnl = (pnl / 1000); // Risk-adjusted PnL (R multiples)

    this.dailyPnL += pnl;
    this.currentPositions.delete(positionId);

    // Create completed trade record
    const trade: ExecutionTrade = {
      id: positionId,
      symbol: this.symbol,
      entryTime: position.entryTime,
      exitTime,
      entryPrice: position.entryPrice,
      exitPrice,
      shares: position.shares,
      pnl,
      entryReason: position.entryReason,
      exitReason: reason,
      rPnl,
      status: 'closed'
    };

    this.config.onTradeUpdate(trade);
    console.log(`Closed position: ${position.shares} shares of ${this.symbol} at $${exitPrice}, P&L: $${pnl.toFixed(2)}`);
  }

  private closeAllPositions(reason: string): void {
    const currentPrice = this.marketData.length > 0 ? this.marketData[this.marketData.length - 1].close : 0;
    const currentTime = new Date().toISOString();

    this.currentPositions.forEach((position, positionId) => {
      this.closePosition(positionId, currentPrice, currentTime, reason);
    });
  }

  private updatePositionMetrics(marketData: MarketData): void {
    this.currentPositions.forEach((position) => {
      position.unrealizedPnL = (marketData.close - position.entryPrice) * position.shares;
    });
  }

  private updateMetrics(): void {
    // Calculate and send metrics update
    const metrics = {
      openPositions: this.currentPositions.size,
      dailyPnL: this.dailyPnL,
      totalUnrealizedPnL: Array.from(this.currentPositions.values())
        .reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
      lastUpdate: new Date().toISOString()
    };

    this.config.onMetricsUpdate(metrics);
  }

  private getChartData(): any[] {
    return this.marketData.map(bar => ({
      time: bar.timestamp,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume
    }));
  }

  // Public methods for external access
  public getStatus(): any {
    return {
      isRunning: this.isRunning,
      symbol: this.symbol,
      strategyName: this.strategy?.name || '',
      openPositions: this.currentPositions.size,
      dailyPnL: this.dailyPnL
    };
  }

  public getPositions(): Position[] {
    return Array.from(this.currentPositions.values());
  }

  public getCurrentIndicators(): any {
    return { ...this.indicators };
  }
}