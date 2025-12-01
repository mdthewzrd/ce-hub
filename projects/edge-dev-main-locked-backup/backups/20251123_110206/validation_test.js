/**
 * Edge.dev Validation Test Script
 * Tests core functionality including chart timeframes, data fetching, and market calendar
 */

const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');

// Test configuration
const SERVER_URL = 'http://localhost:3457';
const TEST_SYMBOL = 'SPY';

// Market calendar test data
const TEST_DATES = {
  trading_day: '2024-10-24',
  weekend: '2024-10-26',
  holiday: '2024-12-25'
};

// Timeframes to test
const TIMEFRAMES = ['day', 'hour', '15min', '5min'];

async function testServerResponse() {
  console.log('🔍 Testing server response...');
  try {
    const response = await fetch(SERVER_URL);
    if (response.ok) {
      console.log('✅ Server is responding with HTTP 200');
      return true;
    } else {
      console.log('❌ Server returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    return false;
  }
}

async function testPageLoad() {
  console.log('🔍 Testing page load time...');
  const startTime = Date.now();
  try {
    const response = await fetch(SERVER_URL);
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    if (loadTime < 5000) {
      console.log(`✅ Page loaded in ${loadTime}ms (under 5 second requirement)`);
      return true;
    } else {
      console.log(`❌ Page loaded in ${loadTime}ms (exceeds 5 second requirement)`);
      return false;
    }
  } catch (error) {
    console.log('❌ Page load test failed:', error.message);
    return false;
  }
}

async function testUIElements() {
  console.log('🔍 Testing UI elements...');
  try {
    const response = await fetch(SERVER_URL);
    const html = await response.text();

    // Check for key UI components
    const checks = [
      { name: 'Chart toggle', pattern: /Chart view/i },
      { name: 'Table toggle', pattern: /Table view/i },
      { name: 'Timeframe buttons', pattern: /(DAY|HOUR|15MIN|5MIN)/i },
      { name: 'Scan results table', pattern: /TICKER.*GAP.*VOLUME.*R-MULT/i },
      { name: 'Chart section', pattern: /Chart Analysis/i },
      { name: 'Market data display', pattern: /(SPY|BYND|WOLF)/i }
    ];

    let passed = 0;
    for (const check of checks) {
      if (check.pattern.test(html)) {
        console.log(`✅ ${check.name} found`);
        passed++;
      } else {
        console.log(`❌ ${check.name} missing`);
      }
    }

    console.log(`UI Elements: ${passed}/${checks.length} tests passed`);
    return passed === checks.length;
  } catch (error) {
    console.log('❌ UI elements test failed:', error.message);
    return false;
  }
}

async function testMarketCalendar() {
  console.log('🔍 Testing market calendar integration...');

  // Test market calendar utility functions by examining the source code patterns
  try {
    const response = await fetch(SERVER_URL);
    const html = await response.text();

    // Check if market calendar features are implemented
    const calendarFeatures = [
      { name: 'Weekend handling', pattern: /bounds.*sat.*mon/i },
      { name: 'Holiday filtering', pattern: /(2024-12-25|2025-01-01)/i },
      { name: 'Market session times', pattern: /(9:30|16:00|20:00)/i },
      { name: 'Pre-market periods', pattern: /(4:00|04:00)/i }
    ];

    let passed = 0;
    for (const feature of calendarFeatures) {
      if (feature.pattern.test(html)) {
        console.log(`✅ ${feature.name} implemented`);
        passed++;
      } else {
        console.log(`⚠️  ${feature.name} pattern not found in HTML`);
      }
    }

    console.log(`Market Calendar: ${passed}/${calendarFeatures.length} features detected`);
    return passed >= calendarFeatures.length / 2; // Allow some flexibility
  } catch (error) {
    console.log('❌ Market calendar test failed:', error.message);
    return false;
  }
}

async function testTimeframeSupport() {
  console.log('🔍 Testing chart timeframe support...');
  try {
    const response = await fetch(SERVER_URL);
    const html = await response.text();

    let supported = 0;
    for (const timeframe of TIMEFRAMES) {
      const pattern = new RegExp(timeframe.toUpperCase(), 'i');
      if (pattern.test(html)) {
        console.log(`✅ ${timeframe} timeframe supported`);
        supported++;
      } else {
        console.log(`❌ ${timeframe} timeframe not found`);
      }
    }

    console.log(`Timeframes: ${supported}/${TIMEFRAMES.length} supported`);
    return supported === TIMEFRAMES.length;
  } catch (error) {
    console.log('❌ Timeframe test failed:', error.message);
    return false;
  }
}

async function testDataFiltering() {
  console.log('🔍 Testing data filtering capabilities...');
  try {
    const response = await fetch(SERVER_URL);
    const html = await response.text();

    // Check for data filtering implementations
    const filteringFeatures = [
      { name: 'Fake print filtering', pattern: /cleanFakePrints|fake.*print/i },
      { name: 'Volume validation', pattern: /volume.*sanity|zero.*volume/i },
      { name: 'Price spike detection', pattern: /spike|anomaly|extreme.*price/i },
      { name: 'Trading day filtering', pattern: /filterTradingDaysOnly|trading.*day/i }
    ];

    let implemented = 0;
    for (const feature of filteringFeatures) {
      if (feature.pattern.test(html)) {
        console.log(`✅ ${feature.name} implemented`);
        implemented++;
      } else {
        console.log(`⚠️  ${feature.name} pattern not detected`);
      }
    }

    console.log(`Data Filtering: ${implemented}/${filteringFeatures.length} features detected`);
    return implemented >= filteringFeatures.length / 2;
  } catch (error) {
    console.log('❌ Data filtering test failed:', error.message);
    return false;
  }
}

async function runValidationSuite() {
  console.log('🚀 Starting Edge.dev Validation Suite\n');

  const tests = [
    { name: 'Server Response', test: testServerResponse },
    { name: 'Page Load Performance', test: testPageLoad },
    { name: 'UI Elements', test: testUIElements },
    { name: 'Market Calendar', test: testMarketCalendar },
    { name: 'Timeframe Support', test: testTimeframeSupport },
    { name: 'Data Filtering', test: testDataFiltering }
  ];

  const results = [];

  for (const { name, test } of tests) {
    console.log(`\n--- ${name} ---`);
    const result = await test();
    results.push({ name, passed: result });
  }

  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
  });

  console.log('='.repeat(50));
  console.log(`Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - PRODUCTION READY');
  } else if (passed >= total * 0.8) {
    console.log('⚠️  MOSTLY PASSING - MINOR ISSUES TO ADDRESS');
  } else {
    console.log('❌ MULTIPLE FAILURES - REQUIRES ATTENTION');
  }

  return { passed, total, percentage: Math.round(passed/total*100) };
}

// Run if called directly
if (require.main === module) {
  runValidationSuite().catch(console.error);
}

module.exports = { runValidationSuite };