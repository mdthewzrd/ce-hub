#!/usr/bin/env node

// Test script for the fixed LC D2 scanner
async function testScannerFix() {
  console.log('🧪 Testing fixed LC D2 scanner...\n');

  const testData = {
    scan_date: "2024-10-25"
  };

  try {
    console.log('📡 Making API call to scanner...');
    const response = await fetch('http://localhost:5657/api/systematic/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('\n📊 SCANNER TEST RESULTS:');
    console.log('Success:', result.success);
    console.log('Results Count:', result.results?.length || 0);
    console.log('Message:', result.message);

    if (result.results && result.results.length > 0) {
      console.log('\n✅ FOUND QUALIFYING TICKERS:');
      result.results.forEach((ticker, index) => {
        console.log(`  ${index + 1}. ${ticker.ticker} - Score: ${ticker.parabolic_score}`);
      });
    } else {
      console.log('\n❌ NO RESULTS FOUND - Check debug logs for failures');
    }

    if (result.error) {
      console.error('\n🚨 ERROR:', result.error);
      console.error('Details:', result.details);
    }

  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testScannerFix().then(() => {
  console.log('\n✅ Scanner test completed');
}).catch(error => {
  console.error('🚨 Unexpected error:', error);
  process.exit(1);
});