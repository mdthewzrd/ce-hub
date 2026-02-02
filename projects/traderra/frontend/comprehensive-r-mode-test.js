// Comprehensive R-Mode Test Script
// Open http://localhost:6565/dashboard-test and run this in the browser console

console.log('🚀 Starting Comprehensive R-Mode Quality Validation...');

// Helper functions
function logTest(testName) {
  console.log(`\n🧪 ${testName}`);
  console.log('─'.repeat(50));
}

function logPass(message) {
  console.log(`✅ PASS: ${message}`);
}

function logFail(message) {
  console.log(`❌ FAIL: ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  INFO: ${message}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test state tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

function addResult(passed, message) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    logPass(message);
  } else {
    testResults.failed++;
    logFail(message);
  }
}

// Core test functions
async function findDisplayModeButtons() {
  // Look for display mode buttons with aria-labels
  const buttons = Array.from(document.querySelectorAll('button[aria-label*="display mode"]'));

  const modes = {
    dollar: buttons.find(btn => btn.getAttribute('aria-label')?.includes('Dollar')),
    percent: buttons.find(btn => btn.getAttribute('aria-label')?.includes('Percentage')),
    r: buttons.find(btn => btn.getAttribute('aria-label')?.includes('Risk Multiple'))
  };

  logInfo(`Found display mode buttons: $ ${modes.dollar ? '✓' : '✗'}, % ${modes.percent ? '✓' : '✗'}, R ${modes.r ? '✓' : '✗'}`);
  return modes;
}

async function findGNButtons() {
  // Look for G/N buttons in PnL mode toggle
  const gButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent?.trim() === 'G' && btn.getAttribute('aria-label')?.includes('Gross')
  );

  const nButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent?.trim() === 'N' && btn.getAttribute('aria-label')?.includes('Net')
  );

  logInfo(`Found G/N buttons: G ${gButton ? '✓' : '✗'}, N ${nButton ? '✓' : '✗'}`);
  return { gross: gButton, net: nButton };
}

async function getPerformanceMetrics() {
  // Find Performance Overview section
  const perfHeader = Array.from(document.querySelectorAll('h2')).find(h =>
    h.textContent?.includes('Performance Overview')
  );

  if (!perfHeader) {
    logFail('Performance Overview section not found');
    return null;
  }

  // Find the metrics grid container
  const container = perfHeader.parentElement.parentElement;
  const metricCards = Array.from(container.querySelectorAll('.studio-surface'));

  const metrics = {};

  metricCards.forEach(card => {
    const titleEl = card.querySelector('.text-sm.studio-muted, .studio-muted');
    const valueEl = card.querySelector('.text-2xl.font-semibold, .font-semibold');

    if (titleEl && valueEl) {
      const title = titleEl.textContent?.trim();
      const value = valueEl.textContent?.trim();
      if (title && value) {
        metrics[title] = value;
      }
    }
  });

  return metrics;
}

function validateRModeFormat(value) {
  const pattern = /^-?\d+(\.\d+)?R$/;
  return pattern.test(value);
}

function validateDollarFormat(value) {
  const pattern = /^-?\$[\d,]+(\.\d{2})?$/;
  return pattern.test(value);
}

function validatePercentFormat(value) {
  const pattern = /^-?\d+(\.\d+)?%$/;
  return pattern.test(value);
}

// Main test sequence
async function runComprehensiveTests() {
  logTest('COMPREHENSIVE R-MODE QUALITY VALIDATION');

  // Wait for page to stabilize
  await wait(2000);

  // Test 1: Basic R-Mode Toggle Functionality
  logTest('Test 1: R-Mode Toggle Functionality');

  const displayButtons = await findDisplayModeButtons();

  addResult(!!displayButtons.r, 'R-mode button found');

  if (!displayButtons.r) {
    logFail('Cannot continue tests - R-mode button not found');
    return;
  }

  // Start in dollar mode for baseline
  if (displayButtons.dollar) {
    displayButtons.dollar.click();
    await wait(1000);
  }

  // Switch to R-mode
  displayButtons.r.click();
  await wait(1500);

  const rModeMetrics = await getPerformanceMetrics();
  addResult(!!rModeMetrics, 'Performance metrics extracted in R-mode');

  if (rModeMetrics) {
    const rModeFields = ['Total P&L', 'Expectancy', 'Max Drawdown', 'Avg Winner', 'Avg Loser'];

    rModeFields.forEach(field => {
      if (rModeMetrics[field]) {
        const isValid = validateRModeFormat(rModeMetrics[field]);
        addResult(isValid, `${field}: ${rModeMetrics[field]} has valid R-mode format`);
      } else {
        addResult(false, `${field} not found in metrics`);
      }
    });

    // Non-R fields should maintain their format
    if (rModeMetrics['Win Rate']) {
      const isPercent = validatePercentFormat(rModeMetrics['Win Rate']);
      addResult(isPercent, `Win Rate: ${rModeMetrics['Win Rate']} maintains percentage format`);
    }

    logInfo('R-mode metrics:', rModeMetrics);
  }

  // Test 2: G/N Toggle Integration with R-Mode
  logTest('Test 2: G/N Toggle Integration with R-Mode');

  const gnButtons = await findGNButtons();
  addResult(!!gnButtons.gross && !!gnButtons.net, 'G/N toggle buttons found');

  if (gnButtons.gross && gnButtons.net) {
    // Test Gross mode
    gnButtons.gross.click();
    await wait(1000);
    const grossMetrics = await getPerformanceMetrics();

    // Test Net mode
    gnButtons.net.click();
    await wait(1000);
    const netMetrics = await getPerformanceMetrics();

    if (grossMetrics && netMetrics) {
      const grossTotal = grossMetrics['Total P&L'];
      const netTotal = netMetrics['Total P&L'];

      addResult(validateRModeFormat(grossTotal), `Gross mode Total P&L: ${grossTotal} in R-mode format`);
      addResult(validateRModeFormat(netTotal), `Net mode Total P&L: ${netTotal} in R-mode format`);
      addResult(grossTotal !== netTotal, 'G/N toggle produces different values');

      logInfo(`Gross: ${grossTotal}, Net: ${netTotal}`);
    }
  }

  // Test 3: Date Range Filtering
  logTest('Test 3: Date Range Filtering with R-Mode');

  const dateRanges = ['7d', '30d', '90d', 'All'];
  const dateButtons = {};

  dateRanges.forEach(range => {
    dateButtons[range] = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent?.trim() === range
    );
  });

  let rangeTestsPassed = 0;

  for (const range of dateRanges) {
    if (dateButtons[range]) {
      dateButtons[range].click();
      await wait(1500);

      const metrics = await getPerformanceMetrics();
      if (metrics && metrics['Total P&L']) {
        const isValidRFormat = validateRModeFormat(metrics['Total P&L']);
        if (isValidRFormat) {
          rangeTestsPassed++;
          logInfo(`${range}: ${metrics['Total P&L']} ✓`);
        } else {
          logInfo(`${range}: ${metrics['Total P&L']} ✗`);
        }
      }
    }
  }

  addResult(rangeTestsPassed >= 2, `${rangeTestsPassed}/${dateRanges.length} date ranges maintain R-mode format`);

  // Test 4: Mode Switching Consistency
  logTest('Test 4: Mode Switching Consistency');

  const modes = [
    { name: 'Dollar', button: displayButtons.dollar, validator: validateDollarFormat },
    { name: 'Percent', button: displayButtons.percent, validator: validatePercentFormat },
    { name: 'R-mode', button: displayButtons.r, validator: validateRModeFormat }
  ];

  let modeSwitchingPassed = 0;

  for (const mode of modes) {
    if (mode.button) {
      mode.button.click();
      await wait(1000);

      const metrics = await getPerformanceMetrics();
      if (metrics && metrics['Total P&L']) {
        const isValid = mode.validator(metrics['Total P&L']);
        if (isValid) {
          modeSwitchingPassed++;
          logInfo(`${mode.name}: ${metrics['Total P&L']} ✓`);
        } else {
          logInfo(`${mode.name}: ${metrics['Total P&L']} ✗`);
        }
      }
    }
  }

  addResult(modeSwitchingPassed === 3, `${modeSwitchingPassed}/3 display modes work correctly`);

  // Test 5: Performance and Responsiveness
  logTest('Test 5: Performance and Responsiveness');

  // Test rapid switching
  if (displayButtons.r && displayButtons.dollar) {
    const startTime = Date.now();

    for (let i = 0; i < 3; i++) {
      displayButtons.dollar.click();
      await wait(100);
      displayButtons.r.click();
      await wait(100);
    }

    const totalTime = Date.now() - startTime;
    addResult(totalTime < 2000, `Rapid mode switching completed in ${totalTime}ms`);

    // Verify interface still works after rapid switching
    await wait(500);
    const finalMetrics = await getPerformanceMetrics();
    addResult(!!finalMetrics && validateRModeFormat(finalMetrics['Total P&L'] || ''), 'Interface functional after rapid switching');
  }

  // Final Results Summary
  logTest('TEST RESULTS SUMMARY');

  const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : '0.0';

  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - R-Mode functionality is working correctly!');
  } else if (testResults.passed > testResults.failed) {
    console.log('\n⚠️  MOSTLY WORKING - Some issues detected but core functionality works');
  } else {
    console.log('\n🚨 SIGNIFICANT ISSUES - R-Mode functionality needs attention');
  }

  return {
    passed: testResults.failed === 0,
    passRate: parseFloat(passRate),
    details: testResults
  };
}

// Execute the comprehensive test
runComprehensiveTests().then(results => {
  window.rModeTestResults = results;
  console.log('\n💾 Results saved to window.rModeTestResults');
}).catch(error => {
  console.error('❌ Test execution failed:', error);
});