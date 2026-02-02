#!/usr/bin/env node

/**
 * Test script for Enhanced Backtesting Engine
 * Demonstrates the new real intraday data integration
 *
 * Usage: node test_enhanced_backtest.js
 */

const fs = require('fs');
const path = require('path');

// Example scan results for testing
const testScanResults = [
  {
    ticker: 'NVDA',
    date: '2024-11-13',
    gap: 0.015,  // 1.5% gap
    prev_close: 145.50,
    atr: 4.2,
    parabolic_score: 75,
    lc_frontside_d2_extended: true,
    pm_vol: 25000000,
    high_chg_atr: 2.1,
    dist_h_9ema_atr: 2.5,
    dist_h_20ema_atr: 3.2
  },
  {
    ticker: 'TSLA',
    date: '2024-11-13',
    gap: 0.025,  // 2.5% gap
    prev_close: 350.00,
    atr: 8.5,
    parabolic_score: 45,
    lc_frontside_d3_extended_1: true,
    pm_vol: 45000000,
    high_chg_atr: 1.8,
    dist_h_9ema_atr: 2.0,
    dist_h_20ema_atr: 2.8
  },
  {
    ticker: 'SMCI',
    date: '2024-11-13',
    gap: 0.035,  // 3.5% gap
    prev_close: 25.75,
    atr: 2.1,
    parabolic_score: 85,
    lc_frontside_d2_extended: true,
    pm_vol: 35000000,
    high_chg_atr: 3.2,
    dist_h_9ema_atr: 3.5,
    dist_h_20ema_atr: 4.1
  }
];

// Enhanced backtest configuration
const testConfig = {
  start_capital: 100000,
  risk_per_trade_dollars: 1000,
  risk_percentage: 0.01,
  engine_type: 'enhanced',
  exit_strategies: {
    lc_momentum: {
      profit_target_atr: 2.0,    // Take profit at 2x ATR
      stop_loss_atr: 0.8,        // Stop loss at 0.8x ATR
      trailing_stop_atr: 0.5,    // Trailing stop at 0.5x ATR
      time_exit_minutes: 240,    // 4 hour max hold time
      volume_exit_threshold: 0.3  // Exit if volume drops below 30%
    },
    parabolic: {
      profit_target_atr: 3.0,    // Higher target for parabolic moves
      stop_loss_atr: 1.0,        // Wider stop for volatility
      trailing_stop_atr: 0.8,    // Tighter trailing for momentum
      time_exit_minutes: 180,    // 3 hour max for momentum plays
      momentum_exit_threshold: 0.5
    }
  }
};

async function testEnhancedBacktest() {
  console.log('🚀 Testing Enhanced Backtesting Engine');
  console.log('=====================================\n');

  try {
    // Test the API endpoint
    const response = await fetch('http://localhost:5657/api/systematic/enhanced-backtest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scan_results: testScanResults,
        config: testConfig
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Enhanced Backtest Completed Successfully!\n');

      // Display summary results
      console.log('📊 PERFORMANCE SUMMARY');
      console.log('=====================');
      console.log(`Total Trades: ${result.summary.total_trades}`);
      console.log(`Win Rate: ${result.summary.win_rate}%`);
      console.log(`Total Return: ${result.summary.total_return_r}R (${result.summary.total_return_pct}%)`);
      console.log(`Profit Factor: ${result.summary.profit_factor}`);
      console.log(`Expectancy: ${result.summary.expectancy}R per trade`);
      console.log(`Kelly Criterion: ${(result.summary.kelly_criterion * 100).toFixed(1)}%`);
      console.log(`Sharpe Ratio: ${result.summary.sharpe_ratio}`);
      console.log(`Max Drawdown: ${result.summary.max_drawdown}R`);
      console.log(`Avg Hold Time: ${result.summary.avg_holding_time_hours} hours\n`);

      // Display performance grade
      console.log('🎯 PERFORMANCE ANALYSIS');
      console.log('======================');
      console.log(`Grade: ${result.insights.performance_grade}`);
      console.log('\nKey Metrics:');
      Object.entries(result.insights.key_metrics).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      // Display recommendations
      console.log('\n💡 RECOMMENDATIONS');
      console.log('=================');
      result.insights.recommendations.forEach(rec => {
        console.log(`• ${rec}`);
      });

      // Display individual trades
      console.log('\n📋 INDIVIDUAL TRADES');
      console.log('==================');
      result.trades.forEach((trade, i) => {
        console.log(`${i+1}. ${trade.ticker} (${trade.strategy_type})`);
        console.log(`   Entry: $${trade.entry_price} → Exit: $${trade.exit_price}`);
        console.log(`   Return: ${(trade.pnl_pct * 100).toFixed(2)}% (${trade.r_multiple.toFixed(2)}R)`);
        console.log(`   Reason: ${trade.exit_reason}`);
        console.log(`   Hold Time: ${(trade.holding_time_minutes / 60).toFixed(1)} hours\n`);
      });

      // Display exit reason analysis
      console.log('🎯 EXIT ANALYSIS');
      console.log('===============');
      Object.entries(result.insights.exit_analysis).forEach(([reason, count]) => {
        console.log(`${reason}: ${count} trades`);
      });

    } else {
      console.error('❌ Backtest Failed:', result.error);
      console.error('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   cd /path/to/edge-dev');
      console.log('   npm run dev');
    }
  }
}

async function testPythonEngineDirectly() {
  console.log('\n🐍 Testing Python Engine Directly');
  console.log('=================================\n');

  const { spawn } = require('child_process');
  const os = require('os');

  try {
    // Create test data file
    const testData = {
      scan_results: testScanResults,
      config: testConfig
    };

    const tempFile = path.join(os.tmpdir(), `test_backtest_${Date.now()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(testData, null, 2));

    const scriptPath = path.join(__dirname, 'src', 'utils', 'enhanced_backtest_engine.py');

    console.log(`📂 Data file: ${tempFile}`);
    console.log(`🐍 Script path: ${scriptPath}`);
    console.log('⏳ Running enhanced backtest engine...\n');

    const pythonProcess = spawn('python3', [scriptPath, tempFile]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      // Show real-time progress
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(line);
        }
      });
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      // Clean up
      fs.unlinkSync(tempFile);

      if (code === 0) {
        console.log('\n✅ Python engine test completed successfully!');
      } else {
        console.error(`❌ Python engine failed with code ${code}`);
        if (stderr) {
          console.error('Error details:', stderr);
        }
      }
    });

  } catch (error) {
    console.error('❌ Direct Python test failed:', error.message);
  }
}

// Main test execution
async function runTests() {
  console.log('🧪 Enhanced Backtesting Engine Test Suite');
  console.log('==========================================\n');

  // Test 1: API endpoint (requires server running)
  await testEnhancedBacktest();

  // Test 2: Python engine directly
  await testPythonEngineDirectly();
}

// Command line options
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--api-only')) {
    testEnhancedBacktest();
  } else if (args.includes('--python-only')) {
    testPythonEngineDirectly();
  } else {
    runTests();
  }
}

module.exports = {
  testEnhancedBacktest,
  testPythonEngineDirectly,
  testScanResults,
  testConfig
};