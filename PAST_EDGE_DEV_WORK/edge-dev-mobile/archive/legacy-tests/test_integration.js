const axios = require('axios');

// Expected results from user's CSV data
const expectedResults = {
  'SMCI': 1.87,
  'LUNM': 2.40,
  'FUTU': -1.00,
  'DJT': 8.29,
  // Add more tickers from the user's CSV as needed
};

async function testSystematicScanAPI() {
  console.log('🔍 Testing Systematic Scan API...');

  const scanPayload = {
    filters: {
      min_gap: 0.01,
      min_pm_vol: 1000000,
      min_prev_close: 5.0
    },
    scan_date: '2025-10-25',
    enable_progress: false  // Use non-streaming for testing
  };

  try {
    const response = await axios.post('http://localhost:3457/api/systematic/scan', scanPayload);

    if (response.data.success) {
      console.log(`✅ Scan completed successfully`);
      console.log(`📊 Found ${response.data.results.length} qualifying tickers`);

      // Log the first few results
      console.log('Sample scan results:');
      response.data.results.slice(0, 5).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.ticker} - Gap: ${result.gap?.toFixed(3)}, Volume: ${result.volume?.toLocaleString()}`);
      });

      return response.data.results;
    } else {
      console.error('❌ Scan failed:', response.data.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Scan API error:', error.response?.data || error.message);
    return [];
  }
}

async function testBacktestAPI(scanResults) {
  console.log('\n📈 Testing Backtest API...');

  const backtestPayload = {
    scan_results: scanResults,
    start_capital: 100000,
    risk_per_trade: 0.02  // 2% risk per trade
  };

  try {
    const response = await axios.post('http://localhost:3457/api/systematic/backtest', backtestPayload);

    if (response.data.success) {
      console.log(`✅ Backtest completed successfully`);
      console.log(`📊 Portfolio Stats:`, response.data.portfolio_stats);
      console.log(`🔢 Total Trades: ${response.data.all_trades?.length || 0}`);

      return response.data;
    } else {
      console.error('❌ Backtest failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Backtest API error:', error.response?.data || error.message);
    return null;
  }
}

function validateResults(backtestResults) {
  console.log('\n🔍 Validating Results Against Expected CSV Data...');

  if (!backtestResults || !backtestResults.ticker_results) {
    console.error('❌ No ticker results to validate');
    return false;
  }

  let matches = 0;
  let totalExpected = Object.keys(expectedResults).length;

  // Create a map of ticker results for easy lookup
  const tickerMap = {};
  backtestResults.ticker_results.forEach(result => {
    tickerMap[result.ticker] = result;
  });

  console.log('Expected vs Actual Results:');
  console.log('Ticker | Expected PnL | Actual PnL | Status');
  console.log('-------|-------------|------------|--------');

  for (const [ticker, expectedPnL] of Object.entries(expectedResults)) {
    const actualResult = tickerMap[ticker];

    if (actualResult) {
      const actualPnL = actualResult.total_pnl;
      const tolerance = 0.5; // Allow 50 cent tolerance
      const isMatch = Math.abs(actualPnL - expectedPnL) <= tolerance;

      if (isMatch) matches++;

      console.log(`${ticker.padEnd(6)} | ${expectedPnL.toString().padEnd(11)} | ${actualPnL.toFixed(2).padEnd(10)} | ${isMatch ? '✅' : '❌'}`);
    } else {
      console.log(`${ticker.padEnd(6)} | ${expectedPnL.toString().padEnd(11)} | Not Found  | ❌`);
    }
  }

  const matchPercentage = (matches / totalExpected) * 100;
  console.log(`\n📊 Validation Summary: ${matches}/${totalExpected} tickers matched (${matchPercentage.toFixed(1)}%)`);

  if (matchPercentage >= 80) {
    console.log('✅ Integration validation PASSED - Results closely match expected CSV data');
    return true;
  } else {
    console.log('❌ Integration validation FAILED - Results do not match expected CSV data');
    return false;
  }
}

async function runIntegrationTest() {
  console.log('🚀 Starting CE-Hub Integration Test\n');
  console.log('This test validates that:');
  console.log('1. LC D2 scan logic produces qualifying tickers');
  console.log('2. D3 backtest logic generates accurate PnL results');
  console.log('3. Results match the user\'s provided CSV data\n');

  // Step 1: Test systematic scan
  const scanResults = await testSystematicScanAPI();

  if (scanResults.length === 0) {
    console.error('❌ Integration test failed: No scan results');
    return;
  }

  // Step 2: Test backtest with scan results
  const backtestResults = await testBacktestAPI(scanResults);

  if (!backtestResults) {
    console.error('❌ Integration test failed: No backtest results');
    return;
  }

  // Step 3: Validate results
  const validationPassed = validateResults(backtestResults);

  console.log('\n' + '='.repeat(60));
  if (validationPassed) {
    console.log('🎉 INTEGRATION TEST PASSED!');
    console.log('✅ CE-Hub LC scanning and backtesting system is working correctly');
    console.log('✅ Results match the expected CSV data within tolerance');
  } else {
    console.log('❌ INTEGRATION TEST FAILED!');
    console.log('❌ Results do not match expected CSV data');
    console.log('ℹ️  This could be due to:');
    console.log('   - Different market data sources');
    console.log('   - Timing differences in data collection');
    console.log('   - Parameter variations in the algorithm');
  }
  console.log('='.repeat(60));
}

// Run the integration test
runIntegrationTest().catch(console.error);