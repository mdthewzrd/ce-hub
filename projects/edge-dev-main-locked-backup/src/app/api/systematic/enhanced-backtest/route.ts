import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface EnhancedBacktestRequest {
  scan_results: Array<{
    date: string;
    ticker: string;
    gap: number;
    pm_vol?: number;
    prev_close: number;
    atr: number;
    parabolic_score?: number;
    lc_frontside_d2_extended?: boolean;
    lc_frontside_d3_extended_1?: boolean;
    [key: string]: any; // Allow additional scan signals
  }>;
  config?: {
    start_capital?: number;
    risk_per_trade_dollars?: number;
    risk_percentage?: number;
    engine_type?: 'simple' | 'enhanced';
    exit_strategies?: {
      lc_momentum?: {
        profit_target_atr?: number;
        stop_loss_atr?: number;
        trailing_stop_atr?: number;
        time_exit_minutes?: number;
        volume_exit_threshold?: number;
      };
      parabolic?: {
        profit_target_atr?: number;
        stop_loss_atr?: number;
        trailing_stop_atr?: number;
        time_exit_minutes?: number;
        momentum_exit_threshold?: number;
      };
    };
  };
}

interface BacktestResponse {
  success: boolean;
  trades: Array<{
    ticker: string;
    date: string;
    entry_price: number;
    exit_price: number;
    entry_time: string;
    exit_time: string;
    shares: number;
    gross_pnl: number;
    net_pnl: number;
    pnl_pct: number;
    r_multiple: number;
    holding_time_minutes: number;
    entry_reason: string;
    exit_reason: string;
    strategy_type: string;
    [key: string]: any;
  }>;
  summary: {
    total_trades: number;
    winners: number;
    losers: number;
    win_rate: number;
    avg_winner_r: number;
    avg_loser_r: number;
    profit_factor: number;
    expectancy: number;
    kelly_criterion: number;
    total_return_r: number;
    total_return_pct: number;
    sharpe_ratio: number;
    max_drawdown: number;
    avg_holding_time_hours: number;
    strategy_breakdown: any;
    exit_reasons: any;
    largest_winner: number;
    largest_loser: number;
  };
  metadata: {
    total_processed: number;
    successful_trades: number;
    failed_trades: number;
    success_rate: number;
    engine_version: string;
    backtest_timestamp: string;
    config_used: any;
  };
}

// Function to run the enhanced Python backtest engine
const runEnhancedBacktest = async (
  scanResults: any[],
  config: any = {}
): Promise<BacktestResponse | { success: false; error: string }> => {
  return new Promise((resolve, reject) => {
    try {
      // Prepare data for the enhanced engine
      const backtestData = {
        scan_results: scanResults,
        config: {
          start_capital: config.start_capital || 100000,
          risk_per_trade_dollars: config.risk_per_trade_dollars || 1000,
          risk_percentage: config.risk_percentage || 0.01,
          ...config
        }
      };

      // Create temporary JSON file for the enhanced engine
      const tempDir = os.tmpdir();
      const dataFilePath = path.join(tempDir, `enhanced_backtest_${Date.now()}.json`);

      fs.writeFileSync(dataFilePath, JSON.stringify(backtestData, null, 2));

      // Path to the enhanced Python script
      const scriptPath = path.join(process.cwd(), 'src', 'utils', 'enhanced_backtest_engine.py');

      console.log(`🚀 Running ENHANCED backtest on ${scanResults.length} tickers`);
      console.log(`📊 Engine: ${config.engine_type || 'enhanced'}`);
      console.log(`💰 Config:`, {
        start_capital: backtestData.config.start_capital,
        risk_per_trade: backtestData.config.risk_per_trade_dollars,
        risk_pct: (backtestData.config.risk_percentage * 100).toFixed(1) + '%'
      });

      // Execute enhanced Python script
      const pythonProcess = spawn('python3', [scriptPath, dataFilePath]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Log progress to console
        const lines = data.toString().split('\n');
        lines.forEach((line: string) => {
          if (line.trim() && (line.includes('📊') || line.includes(' ') || line.includes('❌'))) {
            console.log(`[Enhanced Engine]: ${line.trim()}`);
          }
        });
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          // Clean up temp file
          fs.unlinkSync(dataFilePath);

          if (code !== 0) {
            console.error('Enhanced Python script error:', stderr);
            reject(new Error(`Enhanced backtest failed with code ${code}: ${stderr}`));
            return;
          }

          // Parse JSON output from enhanced Python script
          const results = JSON.parse(stdout);

          if (!results.success) {
            reject(new Error(results.error || 'Enhanced backtest execution failed'));
            return;
          }

          console.log(`  Enhanced backtest completed:`);
          console.log(`   📈 ${results.summary.total_trades} trades, ${results.summary.win_rate}% win rate`);
          console.log(`   💰 ${results.summary.total_return_r}R total return`);
          console.log(`   📊 Kelly: ${results.summary.kelly_criterion}, Sharpe: ${results.summary.sharpe_ratio}`);

          resolve(results);

        } catch (error) {
          console.error('Error parsing enhanced backtest output:', error);
          console.error('Raw stdout:', stdout);
          console.error('Raw stderr:', stderr);
          reject(new Error(`Failed to parse enhanced backtest output: ${error}`));
        }
      });

      pythonProcess.on('error', (error) => {
        // Clean up temp file on error
        try {
          fs.unlinkSync(dataFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to start enhanced backtest process: ${error}`));
      });

    } catch (error) {
      reject(new Error(`Enhanced backtest setup error: ${error}`));
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const body: EnhancedBacktestRequest = await request.json();
    const { scan_results, config = {} } = body;

    // Validate input
    if (!scan_results || !Array.isArray(scan_results) || scan_results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'scan_results array is required and cannot be empty',
        details: 'Please provide an array of scan results to backtest'
      }, { status: 400 });
    }

    // Validate required fields in scan results
    const requiredFields = ['date', 'ticker', 'prev_close', 'atr'];
    for (const result of scan_results) {
      for (const field of requiredFields) {
        if (!(field in result)) {
          return NextResponse.json({
            success: false,
            error: `Missing required field '${field}' in scan results`,
            details: `Each scan result must include: ${requiredFields.join(', ')}`
          }, { status: 400 });
        }
      }
    }

    console.log(`  Starting ENHANCED backtest with ${scan_results.length} trades`);
    console.log(`🔧 Engine Configuration:`, {
      engine_type: config.engine_type || 'enhanced',
      start_capital: config.start_capital || 100000,
      risk_per_trade: config.risk_per_trade_dollars || 1000,
      custom_exit_strategies: Object.keys(config.exit_strategies || {}).length > 0
    });

    // Run the enhanced backtest
    const results = await runEnhancedBacktest(scan_results, config);

    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: 'error' in results ? results.error : 'Enhanced backtest failed',
        details: 'The enhanced backtesting engine encountered an error'
      }, { status: 500 });
    }

    // Format comprehensive response
    const response = {
      success: true,
      message: `Enhanced backtest completed! Processed ${results.summary.total_trades} trades with ${results.summary.total_return_r.toFixed(2)}R total return (${results.summary.total_return_pct.toFixed(2)}%).`,
      trades: results.trades,
      summary: results.summary,
      metadata: {
        ...results.metadata,
        config_used: {
          start_capital: config.start_capital || 100000,
          risk_per_trade_dollars: config.risk_per_trade_dollars || 1000,
          risk_percentage: config.risk_percentage || 0.01,
          engine_type: 'enhanced',
          api_version: '2.0'
        }
      },
      insights: {
        performance_grade: getPerformanceGrade(results.summary),
        key_metrics: {
          expectancy: `${results.summary.expectancy.toFixed(3)}R per trade`,
          kelly_position_size: `${(results.summary.kelly_criterion * 100).toFixed(1)}% of capital`,
          risk_adjusted_return: `Sharpe ratio: ${results.summary.sharpe_ratio.toFixed(3)}`,
          max_consecutive_risk: `Max drawdown: ${results.summary.max_drawdown.toFixed(2)}R`
        },
        strategy_performance: results.summary.strategy_breakdown,
        exit_analysis: results.summary.exit_reasons,
        recommendations: generateRecommendations(results.summary)
      }
    };

    console.log(`  Enhanced backtest completed successfully:`);
    console.log(`   📊 Total Return: ${response.summary.total_return_r}R (${response.summary.total_return_pct}%)`);
    console.log(`     Win Rate: ${response.summary.win_rate}%`);
    console.log(`   📈 Performance Grade: ${response.insights.performance_grade}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Enhanced Backtest API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during enhanced backtest',
      details: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Please check your scan results format and try again'
    }, { status: 500 });
  }
}

// Helper function to grade performance
function getPerformanceGrade(summary: any): string {
  const expectancy = summary.expectancy;
  const winRate = summary.win_rate / 100;
  const profitFactor = summary.profit_factor;
  const sharpeRatio = summary.sharpe_ratio;

  let score = 0;

  // Expectancy scoring (40% of grade)
  if (expectancy > 0.5) score += 40;
  else if (expectancy > 0.3) score += 30;
  else if (expectancy > 0.1) score += 20;
  else if (expectancy > 0) score += 10;

  // Win rate scoring (20% of grade)
  if (winRate > 0.6) score += 20;
  else if (winRate > 0.5) score += 15;
  else if (winRate > 0.4) score += 10;
  else if (winRate > 0.3) score += 5;

  // Profit factor scoring (20% of grade)
  if (profitFactor > 2.0) score += 20;
  else if (profitFactor > 1.5) score += 15;
  else if (profitFactor > 1.2) score += 10;
  else if (profitFactor > 1.0) score += 5;

  // Sharpe ratio scoring (20% of grade)
  if (sharpeRatio > 2.0) score += 20;
  else if (sharpeRatio > 1.5) score += 15;
  else if (sharpeRatio > 1.0) score += 10;
  else if (sharpeRatio > 0.5) score += 5;

  if (score >= 85) return 'A+ (Excellent)';
  else if (score >= 75) return 'A (Very Good)';
  else if (score >= 65) return 'B+ (Good)';
  else if (score >= 55) return 'B (Above Average)';
  else if (score >= 45) return 'C+ (Average)';
  else if (score >= 35) return 'C (Below Average)';
  else if (score >= 25) return 'D (Poor)';
  else return 'F (Very Poor)';
}

// Helper function to generate recommendations
function generateRecommendations(summary: any): string[] {
  const recommendations = [];

  if (summary.win_rate < 40) {
    recommendations.push('Consider tightening entry criteria to improve win rate');
  }

  if (summary.profit_factor < 1.2) {
    recommendations.push('Review exit strategies - profit factor suggests poor risk/reward');
  }

  if (summary.max_drawdown < -3) {
    recommendations.push('High drawdown detected - consider reducing position size');
  }

  if (summary.kelly_criterion > 0.25) {
    recommendations.push('Kelly criterion suggests reducing position size for optimal growth');
  }

  if (summary.sharpe_ratio < 1.0) {
    recommendations.push('Low risk-adjusted returns - consider strategy refinement');
  }

  if (summary.expectancy < 0.1) {
    recommendations.push('Low expectancy per trade - strategy may not be profitable long-term');
  }

  if (recommendations.length === 0) {
    recommendations.push('Strong performance metrics - consider live testing with small size');
  }

  return recommendations;
}