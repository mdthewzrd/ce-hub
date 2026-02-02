// R-Mode Manual Validation Script
// Run this in browser console on http://localhost:6565/dashboard-test

console.log('🔍 Starting R-Mode Quality Validation...');

// Helper functions for validation
function logHeader(message) {
  console.log(`\n🧪 ${message}`);
  console.log('='.repeat(50));
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Validation functions
function findDisplayModeButtons() {
  // Find display mode toggle buttons (looking for $ % R buttons)
  const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent.trim();
    return text === '$' || text === '%' || text === 'R';
  });

  return {
    dollar: buttons.find(btn => btn.textContent.trim() === '$'),
    percent: buttons.find(btn => btn.textContent.trim() === '%'),
    r: buttons.find(btn => btn.textContent.trim() === 'R')
  };
}

function findGNToggleButtons() {
  // Find G/N toggle buttons
  const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent.trim();
    return text === 'G' || text === 'N';
  });

  return {
    gross: buttons.find(btn => btn.textContent.trim() === 'G'),
    net: buttons.find(btn => btn.textContent.trim() === 'N')
  };
}

function findDateRangeButtons() {
  const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
    const text = btn.textContent.trim();
    return ['7d', '30d', '90d', 'All'].includes(text);
  });

  return {
    sevenDay: buttons.find(btn => btn.textContent.trim() === '7d'),
    thirtyDay: buttons.find(btn => btn.textContent.trim() === '30d'),
    ninetyDay: buttons.find(btn => btn.textContent.trim() === '90d'),
    all: buttons.find(btn => btn.textContent.trim() === 'All')
  };
}

function extractPerformanceMetrics() {
  // Find Performance Overview section
  const performanceSection = Array.from(document.querySelectorAll('h2')).find(h =>
    h.textContent.includes('Performance Overview')
  );

  if (!performanceSection) {
    logError('Performance Overview section not found');
    return null;
  }

  // Find metric cards in the performance section
  const metricsContainer = performanceSection.closest('div').querySelector('.grid');
  if (!metricsContainer) {
    logError('Metrics grid not found');
    return null;
  }

  const metricCards = Array.from(metricsContainer.querySelectorAll('.studio-surface, [class*="p-4"]'));
  const metrics = {};

  metricCards.forEach(card => {
    const titleElement = card.querySelector('.text-sm, .studio-muted');
    const valueElement = card.querySelector('.text-2xl, .font-semibold');

    if (titleElement && valueElement) {
      const title = titleElement.textContent.trim();
      const value = valueElement.textContent.trim();
      metrics[title] = value;
    }
  });

  return metrics;
}

function validateRModeFormat(value) {
  const rModePattern = /^-?\d+(\.\d+)?R$/;
  return rModePattern.test(value);
}

function validateDollarFormat(value) {
  const dollarPattern = /^-?\$[\d,]+(\.\d{2})?$/;
  return dollarPattern.test(value);
}

function validatePercentFormat(value) {
  const percentPattern = /^-?\d+(\.\d+)?%$/;
  return percentPattern.test(value);
}

// Main validation sequence
async function runRModeValidation() {
  logHeader('R-Mode Comprehensive Quality Validation');

  // Wait for page to load
  await wait(2000);

  // 1. Test R-Mode Toggle Functionality
  logHeader('TEST 1: R-Mode Toggle Functionality');

  const displayModeButtons = findDisplayModeButtons();
  if (!displayModeButtons.r) {
    logError('R-mode button not found');
    return;
  }

  logInfo('Found display mode buttons:');
  logInfo(`$ button: ${displayModeButtons.dollar ? '✓' : '✗'}`);
  logInfo(`% button: ${displayModeButtons.percent ? '✓' : '✗'}`);
  logInfo(`R button: ${displayModeButtons.r ? '✓' : '✗'}`);

  // Start in dollar mode
  if (displayModeButtons.dollar) {
    displayModeButtons.dollar.click();
    await wait(1000);
    const dollarMetrics = extractPerformanceMetrics();
    logInfo('Dollar mode metrics captured:', dollarMetrics);
  }

  // Switch to R-mode
  displayModeButtons.r.click();
  await wait(1000);
  const rModeMetrics = extractPerformanceMetrics();

  if (!rModeMetrics) {
    logError('Failed to extract R-mode metrics');
    return;
  }

  logInfo('R-mode metrics captured:', rModeMetrics);

  // Validate R-mode formatting
  let rModeFormatValid = true;
  const rModeFields = ['Total P&L', 'Expectancy', 'Max Drawdown', 'Avg Winner', 'Avg Loser'];

  rModeFields.forEach(field => {
    if (rModeMetrics[field]) {
      const isValidRFormat = validateRModeFormat(rModeMetrics[field]);
      if (isValidRFormat) {
        logSuccess(`${field}: ${rModeMetrics[field]} - Valid R-mode format`);
      } else {
        logError(`${field}: ${rModeMetrics[field]} - Invalid R-mode format`);
        rModeFormatValid = false;
      }
    }
  });

  if (rModeFormatValid) {
    logSuccess('R-mode toggle functionality validated - all relevant metrics show R-mode format');
  }

  // 2. Test G/N Toggle Integration with R-Mode
  logHeader('TEST 2: G/N Toggle Integration with R-Mode');

  const gnButtons = findGNToggleButtons();
  if (!gnButtons.gross || !gnButtons.net) {
    logError('G/N toggle buttons not found');
    return;
  }

  // Test Gross mode with R-mode
  gnButtons.gross.click();
  await wait(1000);
  const grossRMetrics = extractPerformanceMetrics();
  logInfo('Gross R-mode metrics:', grossRMetrics);

  // Test Net mode with R-mode
  gnButtons.net.click();
  await wait(1000);
  const netRMetrics = extractPerformanceMetrics();
  logInfo('Net R-mode metrics:', netRMetrics);

  // Compare Total P&L values
  if (grossRMetrics['Total P&L'] && netRMetrics['Total P&L']) {
    const grossTotal = parseFloat(grossRMetrics['Total P&L'].replace('R', ''));
    const netTotal = parseFloat(netRMetrics['Total P&L'].replace('R', ''));

    if (grossTotal !== netTotal) {
      logSuccess(`G/N toggle affects R-mode calculations: Gross=${grossTotal}R, Net=${netTotal}R`);
    } else {
      logError('G/N toggle appears to have no effect on R-mode calculations');
    }

    // Validate both formats are R-mode
    if (validateRModeFormat(grossRMetrics['Total P&L']) && validateRModeFormat(netRMetrics['Total P&L'])) {
      logSuccess('Both Gross and Net modes maintain R-mode formatting');
    } else {
      logError('R-mode formatting not maintained across G/N toggle');
    }
  }

  // 3. Test Date Range Filtering with R-Mode
  logHeader('TEST 3: Date Range Filtering with R-Mode');

  const dateButtons = findDateRangeButtons();
  const dateRanges = ['7d', '30d', '90d', 'All'];
  const metricsByRange = {};

  for (const range of dateRanges) {
    const button = dateButtons[range.replace('d', 'Day').replace('All', 'all')];
    if (button) {
      button.click();
      await wait(1500); // Allow time for data filtering
      const metrics = extractPerformanceMetrics();
      metricsByRange[range] = metrics;

      if (metrics['Total P&L'] && validateRModeFormat(metrics['Total P&L'])) {
        logSuccess(`${range} range: ${metrics['Total P&L']} - R-mode format maintained`);
      } else {
        logError(`${range} range: R-mode format not maintained`);
      }
    }
  }

  // Check if metrics change across date ranges
  const totalPnLValues = Object.values(metricsByRange).map(m => m['Total P&L']).filter(Boolean);
  const uniqueValues = new Set(totalPnLValues);

  if (uniqueValues.size > 1) {
    logSuccess('Date range filtering affects R-mode metrics (values change across ranges)');
  } else {
    logError('Date range filtering may not be working (all values identical)');
  }

  // 4. Test Data Consistency
  logHeader('TEST 4: Data Consistency Validation');

  // Test mode switching consistency
  const modes = [
    { name: 'Dollar', button: displayModeButtons.dollar, validator: validateDollarFormat },
    { name: 'Percent', button: displayModeButtons.percent, validator: validatePercentFormat },
    { name: 'R-mode', button: displayModeButtons.r, validator: validateRModeFormat }
  ];

  for (const mode of modes) {
    if (mode.button) {
      mode.button.click();
      await wait(800);
      const metrics = extractPerformanceMetrics();

      if (metrics['Total P&L']) {
        const isValidFormat = mode.validator(metrics['Total P&L']);
        if (isValidFormat) {
          logSuccess(`${mode.name}: ${metrics['Total P&L']} - Correct format`);
        } else {
          logError(`${mode.name}: ${metrics['Total P&L']} - Incorrect format`);
        }
      }
    }
  }

  // 5. Test Performance Metrics
  logHeader('TEST 5: Performance and Responsiveness');

  const startTime = Date.now();
  displayModeButtons.r.click();
  await wait(500);
  const rModeTime = Date.now() - startTime;

  const gnStartTime = Date.now();
  gnButtons.gross.click();
  await wait(100);
  gnButtons.net.click();
  const gnToggleTime = Date.now() - gnStartTime;

  logInfo(`R-mode switch time: ${rModeTime}ms`);
  logInfo(`G/N toggle time: ${gnToggleTime}ms`);

  if (rModeTime < 2000) {
    logSuccess('R-mode switch performance acceptable (<2s)');
  } else {
    logError('R-mode switch performance slow (>2s)');
  }

  if (gnToggleTime < 1000) {
    logSuccess('G/N toggle performance acceptable (<1s)');
  } else {
    logError('G/N toggle performance slow (>1s)');
  }

  logHeader('🎉 R-Mode Validation Complete');
  logInfo('Review the results above to verify R-mode functionality');
}

// Run the validation
runRModeValidation().catch(error => {
  logError(`Validation failed: ${error.message}`);
});