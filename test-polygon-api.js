const fetch = require('node-fetch');

async function testPolygonAPI() {
  console.log('🔍 TESTING POLYGON API ACCESS');
  console.log('==============================');

  const API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I";
  const BASE_URL = "https://api.polygon.io";

  // Test fetching AAPL data for recent dates
  const symbol = "AAPL";
  const endDate = "2025-11-01";
  const startDate = "2025-10-01";

  console.log(`📊 Testing ${symbol} from ${startDate} to ${endDate}`);

  try {
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}`;
    console.log(`🚀 Requesting: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {},
      params: {
        apiKey: API_KEY,
        limit: 5000
      },
      timeout: 30000
    });

    console.log(`📡 Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      const results = data.results || [];

      console.log(`✅ Success! Retrieved ${results.length} data points`);

      if (results.length > 0) {
        console.log('📈 Sample data:');
        const sample = results.slice(0, 3);
        sample.forEach((row, i) => {
          const date = new Date(row.t);
          console.log(`  ${i+1}. ${date.toISOString().split('T')[0]}: O=${row.o} H=${row.h} L=${row.l} C=${row.c} V=${row.v.toLocaleString()}`);
        });

        // Check if we have enough data for scanning
        console.log(`\n🎯 Data Analysis:`);
        console.log(`  - Total days: ${results.length}`);
        console.log(`  - Date range: ${new Date(results[0].t).toISOString().split('T')[0]} to ${new Date(results[results.length-1].t).toISOString().split('T')[0]}`);

        // Basic gap check
        let gapsFound = 0;
        for (let i = 1; i < results.length; i++) {
          const prev = results[i-1];
          const curr = results[i];
          const gap = (curr.o - prev.c) / prev.c;
          if (Math.abs(gap) > 0.01) { // 1% gap
            gapsFound++;
          }
        }
        console.log(`  - Days with >1% gaps: ${gapsFound}`);

        return { success: true, dataPoints: results.length, gapsFound };
      } else {
        console.log('❌ No data returned');
        return { success: false, error: 'No data' };
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status}`);
      console.log(`Error details: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

  } catch (error) {
    console.error('💥 Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test multiple symbols
async function testMultipleSymbols() {
  console.log('\n🎯 TESTING MULTIPLE SYMBOLS');
  console.log('==========================');

  const symbols = ['AAPL', 'NVDA', 'TSLA', 'SOXL', 'INTC'];
  const results = {};

  for (const symbol of symbols) {
    console.log(`\n🔍 Testing ${symbol}...`);
    const result = await testSymbolData(symbol);
    results[symbol] = result;

    if (result.success) {
      console.log(`✅ ${symbol}: ${result.dataPoints} days, ${result.gapsFound} gaps`);
    } else {
      console.log(`❌ ${symbol}: ${result.error}`);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('============');
  let successCount = 0;
  for (const [symbol, result] of Object.entries(results)) {
    if (result.success) successCount++;
    console.log(`${symbol}: ${result.success ? '✅' : '❌'} ${result.success ? `${result.dataPoints} days` : result.error}`);
  }

  console.log(`\n🎯 Overall: ${successCount}/${symbols.length} symbols successful`);

  return successCount === symbols.length;
}

async function testSymbolData(symbol) {
  const API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I";
  const BASE_URL = "https://api.polygon.io";
  const endDate = "2025-11-01";
  const startDate = "2025-10-01";

  try {
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}`;
    const response = await fetch(`${url}?apiKey=${API_KEY}&limit=5000`, { timeout: 10000 });

    if (response.ok) {
      const data = await response.json();
      const results = data.results || [];

      let gapsFound = 0;
      for (let i = 1; i < results.length; i++) {
        const prev = results[i-1];
        const curr = results[i];
        const gap = (curr.o - prev.c) / prev.c;
        if (Math.abs(gap) > 0.01) {
          gapsFound++;
        }
      }

      return { success: true, dataPoints: results.length, gapsFound };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Execute tests
testPolygonAPI()
  .then(result => {
    console.log('\n🏁 Single symbol test completed');
    return testMultipleSymbols();
  })
  .then(allSuccess => {
    if (allSuccess) {
      console.log('\n✅ ALL TESTS PASSED - Polygon API is working correctly');
      console.log('🔍 The issue is NOT with API access - must be in scanner logic or criteria');
    } else {
      console.log('\n❌ SOME TESTS FAILED - Polygon API access issues detected');
      console.log('🔧 This could explain why the scanner returns 0 results');
    }
    process.exit(allSuccess ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });