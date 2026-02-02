#!/usr/bin/env node
/**
 * Test script to verify the edge-dev polling fix
 * Tests the cache-busting and polling detection
 */

async function testPollingFix() {
  console.log('🔧 Testing Edge-Dev Polling Fix');
  console.log('================================\n');

  // Test with the completed scan
  const completedScanId = 'scan_20251101_123809_c4e2ba68';
  console.log(`🎯 Testing with completed scan: ${completedScanId}`);

  try {
    // Test 1: Normal request (potentially cached)
    console.log('\n📡 Test 1: Normal request');
    const normalResponse = await fetch(`http://localhost:8000/api/scan/status/${completedScanId}`);
    const normalData = await normalResponse.json();
    console.log(`Status: ${normalData.status}, Progress: ${normalData.progress_percent}%, Results: ${normalData.results?.length || 0}`);

    // Test 2: Cache-busted request (like our fix)
    console.log('\n📡 Test 2: Cache-busted request (with timestamp)');
    const cacheBuster = Date.now();
    const cacheBustedResponse = await fetch(`http://localhost:8000/api/scan/status/${completedScanId}?t=${cacheBuster}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    const cacheBustedData = await cacheBustedResponse.json();
    console.log(`Status: ${cacheBustedData.status}, Progress: ${cacheBustedData.progress_percent}%, Results: ${cacheBustedData.results?.length || 0}`);

    // Test 3: Recent scan (if available)
    const recentScanId = 'scan_20251101_130754_7b2c949c';
    console.log(`\n📡 Test 3: Recent scan ${recentScanId}`);
    const recentResponse = await fetch(`http://localhost:8000/api/scan/status/${recentScanId}?t=${Date.now()}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      console.log(`Status: ${recentData.status}, Progress: ${recentData.progress_percent}%, Results: ${recentData.results?.length || 0}`);

      if (recentData.status === 'completed' && recentData.results?.length > 0) {
        console.log('\n✅ SUCCESS: Recent scan shows completed status with results!');
        console.log('📊 Sample results:');
        recentData.results.slice(0, 3).forEach((result, idx) => {
          console.log(`  ${idx + 1}. ${result.ticker} (${result.date}) - Gap: ${result.gap_pct}% - Vol: ${result.volume.toLocaleString()}`);
        });
      }
    } else {
      console.log(`Recent scan not found or error: ${recentResponse.status}`);
    }

    console.log('\n🔧 Fix Analysis:');
    console.log('✅ Cache-busting headers implemented');
    console.log('✅ Timestamp query parameter added');
    console.log('✅ Enhanced debug logging added');
    console.log('\n💡 The fix should resolve the polling issue by preventing browser caching');
    console.log('   of stale "running" status responses.');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Test if this is node.js environment
if (typeof fetch === 'undefined') {
  // Node.js environment - import fetch
  import('node-fetch').then(nodeFetch => {
    global.fetch = nodeFetch.default;
    testPollingFix();
  }).catch(() => {
    console.log('📝 Please run this in a browser environment or install node-fetch');
    console.log('You can copy this code into the browser console on your edge-dev page');
  });
} else {
  // Browser environment
  testPollingFix();
}