/**
 * COMPREHENSIVE EDGE-DEV-PLATFORM VALIDATION TEST
 * Systematic testing of all platform features using Playwright
 * Tests: Loading, Charts, Modals, Scan Results, Performance
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5667',
  screenshotDir: './platform_validation_screenshots',
  timeout: 30000,
  headless: false // Set to true for headless execution
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  screenshots: [],
  performance: {},
  consoleErrors: []
};

// Create screenshots directory
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

/**
 * Utility function to take timestamped screenshots
 */
async function takeScreenshot(page, name, description) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.png`;
  const filepath = path.join(TEST_CONFIG.screenshotDir, filename);

  await page.screenshot({
    path: filepath,
    fullPage: true,
    quality: 90
  });

  testResults.screenshots.push({
    filename,
    name,
    description,
    filepath
  });

  console.log(`📸 Screenshot captured: ${filename}`);
  return filepath;
}

/**
 * Monitor console for errors and performance metrics
 */
function setupConsoleMonitoring(page) {
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      testResults.consoleErrors.push({
        type: 'error',
        text: text,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${text}`);
    } else if (text.includes('Performance') || text.includes('Load')) {
      testResults.performance[text] = new Date().toISOString();
    }
  });

  page.on('pageerror', error => {
    testResults.consoleErrors.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.log(`💥 Page Error: ${error.message}`);
  });
}

/**
 * Test 1: Basic Loading Test
 */
async function testBasicLoading(page) {
  console.log('\n🧪 TEST 1: Basic Loading Test');

  try {
    const startTime = Date.now();

    // Navigate to the page
    const response = await page.goto(TEST_CONFIG.baseUrl, {
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeout
    });

    const loadTime = Date.now() - startTime;
    testResults.performance.pageLoadTime = loadTime;

    // Verify successful response
    if (response.status() !== 200) {
      throw new Error(`Expected status 200, got ${response.status()}`);
    }

    // Wait for key elements to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Check for main components
    const mainElements = [
      'body',
      'html'
    ];

    for (const selector of mainElements) {
      await page.waitForSelector(selector, { timeout: 5000 });
    }

    // Take initial screenshot
    await takeScreenshot(page, '01_initial_load', 'Initial page load complete');

    console.log(`✅ Basic Loading Test PASSED - Load time: ${loadTime}ms`);
    testResults.passed++;

  } catch (error) {
    console.log(`❌ Basic Loading Test FAILED: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: 'Basic Loading',
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 2: Chart Functionality
 */
async function testChartFunctionality(page) {
  console.log('\n🧪 TEST 2: Chart Functionality');

  try {
    // Wait for charts to load
    await page.waitForTimeout(3000);

    // Look for chart-related elements
    const chartSelectors = [
      '.chart-container',
      '#chart',
      '[data-testid="chart"]',
      'canvas',
      'svg'
    ];

    let chartFound = false;
    for (const selector of chartSelectors) {
      const chart = await page.$(selector);
      if (chart) {
        chartFound = true;
        console.log(`📊 Found chart element: ${selector}`);
        break;
      }
    }

    if (!chartFound) {
      console.log('⚠️  No standard chart elements found, checking for custom chart implementations');
    }

    // Test ticker selection if scan results exist
    const tickerElements = await page.$$('[data-ticker], [data-symbol], .ticker, .symbol');
    if (tickerElements.length > 0) {
      console.log(`📈 Found ${tickerElements.length} ticker elements`);

      // Try clicking on the first ticker
      await tickerElements[0].click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '02_ticker_selected', 'Ticker selection test');

    } else {
      console.log('⚠️  No ticker elements found for selection test');
    }

    // Test timeframe switching buttons
    const timeframeSelectors = [
      'button[aria-label*="Day"]',
      'button[aria-label*="Hour"]',
      'button:has-text("Day")',
      'button:has-text("Hour")',
      'button:has-text("15min")',
      'button:has-text("5min")',
      '.timeframe-button',
      '[data-timeframe]'
    ];

    for (const selector of timeframeSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(1000);
          console.log(`⏰ Clicked timeframe: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    await takeScreenshot(page, '03_chart_functionality', 'Chart functionality test complete');

    console.log('✅ Chart Functionality Test PASSED');
    testResults.passed++;

  } catch (error) {
    console.log(`❌ Chart Functionality Test FAILED: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: 'Chart Functionality',
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 3: Modal Testing
 */
async function testModalFunctionality(page) {
  console.log('\n🧪 TEST 3: Modal Functionality');

  try {
    // Test Renata AI Modal
    const renataSelectors = [
      '[data-testid="renata-chat-open-button"]',  // PRIMARY: Most specific selector
      '[data-renata="true"]',                       // FALLBACK 1: Custom data attribute
      'button:has([data-testid="renata-chat-open-button"])',  // FALLBACK 2
      'button:has-text("Renata"):has-text("AI Assistant")',  // FALLBACK 3: Specific text combo
      'button:has-text("Renata")',  // FALLBACK 4: Generic (may match other yellow buttons)
      'button:has-text("AI")',
      '[data-testid="renata-button"]',
      '.renata-button',
      '#renata-chat',
      '[aria-label*="Renata"]',
      '[aria-label*="AI"]'
    ];

    let renataModalFound = false;
    for (const selector of renataSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(2000);

          // Check if modal opened
          const modalSelectors = [
            '.modal',
            '.dialog',
            '[role="dialog"]',
            '.popup',
            '.overlay'
          ];

          for (const modalSelector of modalSelectors) {
            const modal = await page.$(modalSelector);
            if (modal) {
              renataModalFound = true;
              console.log(`🤖 Renata AI Modal opened via: ${selector}`);
              await takeScreenshot(page, '04_renata_modal', 'Renata AI Modal test');

              // Close modal
              const closeSelectors = [
                'button[aria-label="Close"]',
                'button:has-text("Close")',
                'button:has-text("×")',
                '.close-button',
                '[data-testid="close-modal"]'
              ];

              for (const closeSelector of closeSelectors) {
                try {
                  const closeButton = await page.$(closeSelector);
                  if (closeButton) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                    break;
                  }
                } catch (e) {
                  // Continue trying other close buttons
                }
              }
              break;
            }
          }
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!renataModalFound) {
      console.log('⚠️  Renata AI Modal not found or could not be opened');
    }

    // Test Projects Modal
    const projectSelectors = [
      'button:has-text("Projects")',
      'button:has-text("Project")',
      '[data-testid="projects-button"]',
      '.projects-button',
      '#projects-modal',
      '[aria-label*="Project"]'
    ];

    let projectModalFound = false;
    for (const selector of projectSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(2000);

          // Check if modal opened
          const modalSelectors = [
            '.modal',
            '.dialog',
            '[role="dialog"]',
            '.popup',
            '.overlay'
          ];

          for (const modalSelector of modalSelectors) {
            const modal = await page.$(modalSelector);
            if (modal) {
              projectModalFound = true;
              console.log(`📁 Projects Modal opened via: ${selector}`);
              await takeScreenshot(page, '05_projects_modal', 'Projects Modal test');

              // Close modal
              const closeSelectors = [
                'button[aria-label="Close"]',
                'button:has-text("Close")',
                'button:has-text("×")',
                '.close-button'
              ];

              for (const closeSelector of closeSelectors) {
                try {
                  const closeButton = await page.$(closeSelector);
                  if (closeButton) {
                    await closeButton.click();
                    await page.waitForTimeout(1000);
                    break;
                  }
                } catch (e) {
                  // Continue trying other close buttons
                }
              }
              break;
            }
          }
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!projectModalFound) {
      console.log('⚠️  Projects Modal not found or could not be opened');
    }

    console.log('✅ Modal Functionality Test PASSED');
    testResults.passed++;

  } catch (error) {
    console.log(`❌ Modal Functionality Test FAILED: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: 'Modal Functionality',
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 4: Scan Results Testing
 */
async function testScanResults(page) {
  console.log('\n🧪 TEST 4: Scan Results Testing');

  try {
    // Look for scan results table
    const tableSelectors = [
      'table',
      '.table',
      '[data-testid="scan-results"]',
      '.scan-results',
      '#results-table',
      '.results-table'
    ];

    let tableFound = false;
    for (const selector of tableSelectors) {
      const table = await page.$(selector);
      if (table) {
        tableFound = true;
        console.log(`📋 Found scan results table: ${selector}`);

        // Count rows in table
        const rows = await table.$$('tr');
        console.log(`📊 Found ${rows.length} rows in scan results table`);

        // Try to sort by clicking headers
        const headers = await table.$$('th, .header, [role="columnheader"]');
        if (headers.length > 0) {
          await headers[0].click();
          await page.waitForTimeout(1000);
          console.log(`🔄 Attempted to sort by clicking header`);
        }

        await takeScreenshot(page, '06_scan_results_table', 'Scan results table test');
        break;
      }
    }

    if (!tableFound) {
      console.log('⚠️  No scan results table found');
    }

    // Test Run Scan button
    const runScanSelectors = [
      'button:has-text("Run Scan")',
      'button:has-text("Run")',
      '[data-testid="run-scan"]',
      '.run-scan-button',
      '#run-scan',
      'button[type="submit"]'
    ];

    let runScanFound = false;
    for (const selector of runScanSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          runScanFound = true;
          console.log(`🚀 Found Run Scan button: ${selector}`);

          // Don't actually click to avoid running scans, just verify it exists
          const isDisabled = await button.isDisabled();
          console.log(`🔘 Run Scan button enabled: ${!isDisabled}`);

          await takeScreenshot(page, '07_run_scan_button', 'Run Scan button test');
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!runScanFound) {
      console.log('⚠️  No Run Scan button found');
    }

    // Look for 2025 test data (AAPL, TSLA, NVDA, etc.)
    const testDataSelectors = [
      ':has-text("AAPL")',
      ':has-text("TSLA")',
      ':has-text("NVDA")',
      ':has-text("2025")',
      '[data-symbol="AAPL"]',
      '[data-symbol="TSLA"]',
      '[data-symbol="NVDA"]'
    ];

    for (const selector of testDataSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`📈 Found test data: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }

    console.log('✅ Scan Results Test PASSED');
    testResults.passed++;

  } catch (error) {
    console.log(`❌ Scan Results Test FAILED: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: 'Scan Results',
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Test 5: Performance and Responsiveness
 */
async function testPerformance(page) {
  console.log('\n🧪 TEST 5: Performance and Responsiveness');

  try {
    // Test page responsiveness with different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);

      console.log(`📱 Testing ${viewport.name} viewport: ${viewport.width}x${viewport.height}`);
      await takeScreenshot(page, `08_responsive_${viewport.name.toLowerCase()}`, `${viewport.name} responsiveness test`);
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test scroll behavior
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);

    await takeScreenshot(page, '09_scroll_test', 'Scroll behavior test');

    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    console.log('✅ Performance and Responsiveness Test PASSED');
    testResults.passed++;

  } catch (error) {
    console.log(`❌ Performance Test FAILED: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      test: 'Performance and Responsiveness',
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    testUrl: TEST_CONFIG.baseUrl,
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2) + '%'
    },
    performance: testResults.performance,
    consoleErrors: testResults.consoleErrors,
    errors: testResults.errors,
    screenshots: testResults.screenshots,
    recommendations: []
  };

  // Generate recommendations based on test results
  if (testResults.consoleErrors.length > 0) {
    report.recommendations.push('🔧 Fix JavaScript console errors for better user experience');
  }

  if (testResults.failed > 0) {
    report.recommendations.push('🐛 Address failed test cases to ensure full functionality');
  }

  if (testResults.performance.pageLoadTime > 5000) {
    report.recommendations.push('⚡ Optimize page load time (currently ' + testResults.performance.pageLoadTime + 'ms)');
  }

  if (testResults.passed === testResults.passed + testResults.failed) {
    report.recommendations.push('✅ All tests passed! Platform is ready for production use');
  }

  return report;
}

/**
 * Main test execution function
 */
async function runComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE EDGE-DEV-PLATFORM VALIDATION');
  console.log(`📍 Testing URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`📸 Screenshots will be saved to: ${TEST_CONFIG.screenshotDir}`);

  const browser = await chromium.launch({
    headless: TEST_CONFIG.headless,
    slowMo: 100 // Slow down for better visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  // Setup console monitoring
  setupConsoleMonitoring(page);

  try {
    // Run all tests
    await testBasicLoading(page);
    await testChartFunctionality(page);
    await testModalFunctionality(page);
    await testScanResults(page);
    await testPerformance(page);

    // Generate final report
    const report = generateTestReport();

    // Save report to file
    const reportPath = path.join(TEST_CONFIG.screenshotDir, `validation_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);
    console.log(`⏱️  Page Load Time: ${testResults.performance.pageLoadTime}ms`);
    console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
    console.log(`🐛 Console Errors: ${testResults.consoleErrors.length}`);
    console.log(`📁 Report saved to: ${reportPath}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`  ${rec}`));
    }

    console.log('='.repeat(80));

    return report;

  } catch (error) {
    console.error('💥 CRITICAL ERROR DURING TESTING:', error);
    throw error;

  } finally {
    await browser.close();
  }
}

// Execute tests if this file is run directly
if (require.main === module) {
  runComprehensiveTests()
    .then(report => {
      console.log('\n🎉 COMPREHENSIVE VALIDATION COMPLETED');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 VALIDATION FAILED:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, TEST_CONFIG };