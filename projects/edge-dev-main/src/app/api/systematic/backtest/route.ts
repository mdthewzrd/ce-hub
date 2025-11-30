import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface BacktestRequest {
  scan_results: Array<{
    date: string;
    ticker: string;
    gap: number;
    pm_vol: number;
    prev_close: number;
    lc_frontside_d2_extended: boolean;
    lc_frontside_d3_extended_1: boolean;
    parabolic_score: number;
    atr: number;
  }>;
  start_capital?: number;
  risk_per_trade?: number;
}

// Function to run the actual Python backtest script
const runPythonBacktest = async (scanResults: any[], startCapital: number = 100000, riskPerTrade: number = 0.01): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      // Create CSV data for the Python script
      const csvData = scanResults.map(result => ({
        date: result.date,
        ticker: result.ticker,
        gap: result.gap,
        pm_vol: result.pm_vol,
        prev_close: result.prev_close,
        lc_frontside_d2_extended: result.lc_frontside_d2_extended ? 1 : 0,
        lc_frontside_d3_extended_1: result.lc_frontside_d3_extended_1 ? 1 : 0,
        parabolic_score: result.parabolic_score,
        atr: result.atr,
        close: result.prev_close * (1 + result.gap),
        volume: result.pm_vol
      }));

      // Create temporary CSV file
      const tempDir = os.tmpdir();
      const csvFilePath = path.join(tempDir, `backtest_data_${Date.now()}.csv`);

      // Write CSV headers and data
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => Object.values(row).join(','));
      const csvContent = [headers, ...rows].join('\n');

      fs.writeFileSync(csvFilePath, csvContent);

      // Path to the Python script
      const scriptPath = path.join(process.cwd(), 'src', 'utils', 'backtest_script.py');

      console.log(`🔥 Running backtest on ${scanResults.length} tickers using Python script: ${scriptPath}`);

      // Execute Python script
      const pythonProcess = spawn('python3', [scriptPath, csvFilePath]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          // Clean up temp file
          fs.unlinkSync(csvFilePath);

          if (code !== 0) {
            console.error('Python script error:', stderr);
            reject(new Error(`Python script failed with code ${code}: ${stderr}`));
            return;
          }

          // Parse JSON output from Python script
          const results = JSON.parse(stdout);
          resolve(results);

        } catch (error) {
          console.error('Error parsing Python output:', error);
          console.error('Raw stdout:', stdout);
          console.error('Raw stderr:', stderr);
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });

      pythonProcess.on('error', (error) => {
        // Clean up temp file on error
        try {
          fs.unlinkSync(csvFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
        reject(new Error(`Failed to start Python process: ${error}`));
      });

    } catch (error) {
      reject(new Error(`Setup error: ${error}`));
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scan_results, start_capital = 100000, risk_per_trade = 0.01 } = body;

    console.log(`  Starting backtest with ${scan_results.length} tickers from systematic scan`);
    console.log(`💰 Parameters: Start Capital: $${start_capital.toLocaleString()}, Risk per Trade: ${(risk_per_trade * 100)}%`);

    // Run the Python backtest script
    const results = await runPythonBacktest(scan_results, start_capital, risk_per_trade);

    if (!results.success) {
      return NextResponse.json({
        success: false,
        error: results.error || 'Backtest failed',
        results: {}
      }, { status: 500 });
    }

    // Format response for frontend
    const response = {
      success: true,
      message: `Backtest completed successfully! Processed ${results.summary.total_trades} trades with ${results.summary.total_return_r.toFixed(2)}R total return.`,
      summary: {
        total_trades: results.summary.total_trades,
        winners: results.summary.winners,
        losers: results.summary.losers,
        win_rate: results.summary.win_rate,
        total_return_r: results.summary.total_return_r,
        total_return_pct: results.summary.total_return_pct,
        avg_win_r: results.summary.avg_win_r,
        avg_loss_r: results.summary.avg_loss_r,
        profit_factor: results.summary.profit_factor,
        expected_value: results.summary.expected_value,
        edge: results.summary.edge,
        kelly_criterion: results.summary.kelly_criterion
      },
      trades: results.trades,
      metadata: {
        start_capital: start_capital,
        risk_per_trade_dollars: start_capital * risk_per_trade,
        risk_percentage: risk_per_trade * 100,
        backtest_date: new Date().toISOString(),
        python_script_used: true
      }
    };

    console.log(`  Backtest completed: ${response.summary.total_trades} trades, ${response.summary.win_rate}% win rate, ${response.summary.total_return_r.toFixed(2)}R return`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Backtest API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during backtest',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}