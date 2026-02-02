#!/usr/bin/env node
/**
 * Debug script to test the edge-dev frontend/backend result flow
 * This simulates the exact polling and result processing logic
 */

const scanId = 'scan_20251101_123809_c4e2ba68';

async function testBackendPolling() {
  console.log('🔍 Testing backend polling for scan:', scanId);

  try {
    const response = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

    if (!response.ok) {
      console.error('❌ Backend request failed:', response.status);
      return;
    }

    const statusData = await response.json();
    console.log('📊 Raw backend response:', JSON.stringify(statusData, null, 2));

    const { status, progress_percent, message, results, total_found } = statusData;

    console.log('\n📋 Key Fields:');
    console.log('- Status:', status);
    console.log('- Progress:', progress_percent);
    console.log('- Message:', message);
    console.log('- Results count:', results?.length || 0);
    console.log('- Total found:', total_found);

    if (results && results.length > 0) {
      console.log('\n🎯 Testing Result Mapping (First Result):');
      const firstResult = results[0];
      console.log('Raw result:', JSON.stringify(firstResult, null, 2));

      // Simulate frontend mapping logic
      const mappedResult = {
        ticker: firstResult.ticker,
        date: firstResult.date,
        gapPercent: firstResult.gap_pct || 0,
        volume: firstResult.volume || firstResult.v_ua || 0,
        score: firstResult.confidence_score || firstResult.parabolic_score || 0,
        gap_pct: firstResult.gap_pct || 0,
        v_ua: firstResult.volume || firstResult.v_ua || 0,
        confidence_score: firstResult.confidence_score || firstResult.parabolic_score || 0
      };

      console.log('\n✅ Mapped result:', JSON.stringify(mappedResult, null, 2));

      // Test if all required fields exist
      const requiredFields = ['ticker', 'date', 'gapPercent', 'volume', 'score'];
      const missingFields = requiredFields.filter(field =>
        mappedResult[field] === undefined || mappedResult[field] === null
      );

      if (missingFields.length === 0) {
        console.log('\n✅ All required fields present and mapped correctly');
      } else {
        console.log('\n❌ Missing required fields:', missingFields);
      }

      // Test the complete array mapping
      const formattedResults = results.map((result) => ({
        ticker: result.ticker,
        date: result.date,
        gapPercent: result.gap_pct || 0,
        volume: result.volume || result.v_ua || 0,
        score: result.confidence_score || result.parabolic_score || 0,
        gap_pct: result.gap_pct || 0,
        v_ua: result.volume || result.v_ua || 0,
        confidence_score: result.confidence_score || result.parabolic_score || 0
      }));

      console.log(`\n📊 Successfully mapped ${formattedResults.length} results`);
      console.log('Sample mapped results (first 3):');
      formattedResults.slice(0, 3).forEach((result, idx) => {
        console.log(`  ${idx + 1}. ${result.ticker} (${result.date}) - Gap: ${result.gapPercent}% - Vol: ${result.volume}`);
      });

    } else {
      console.log('\n❌ No results found in response');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Test if this is node.js environment
if (typeof fetch === 'undefined') {
  // Node.js environment - import fetch
  import('node-fetch').then(nodeFetch => {
    global.fetch = nodeFetch.default;
    testBackendPolling();
  }).catch(() => {
    console.log('📝 Please run this in a browser environment or install node-fetch');
    console.log('You can copy this code into the browser console on your edge-dev page');
  });
} else {
  // Browser environment
  testBackendPolling();
}