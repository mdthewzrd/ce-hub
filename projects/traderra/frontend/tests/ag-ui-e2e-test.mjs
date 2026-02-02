/**
 * AG-UI End-to-End Browser Test Suite
 *
 * Tests the full AG-UI flow including frontend tool execution.
 * Requires Playwright to be installed.
 *
 * Run with: node tests/ag-ui-e2e-test.mjs
 */

import { chromium } from 'playwright';

const FRONTEND_URL = 'http://localhost:6565';
const TEST_PAGE = `${FRONTEND_URL}/ag-ui-test`;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

function section(message) {
  log(`\n${colors.bright}${colors.blue}═══ ${message} ═══${colors.reset}\n`);
}

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    success(name);
    if (details) console.log(`  ${details}`);
  } else {
    results.failed++;
    error(name);
    if (details) console.log(`  ${details}`);
  }
}

// Test helper to wait for condition
async function waitForCondition(page, condition, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

// Test navigation tool
async function testNavigateTool(page) {
  section('Navigation Tool Test');

  try {
    // Wait for page selector
    await page.waitForSelector('select[value="dashboard"]', { timeout: 5000 });

    // Select trades page
    await page.selectOption('select[value="dashboard"]', 'trades');
    info('Selected "trades" from dropdown');

    // Click test button
    await page.click('button:has-text("Test Navigate")');
    info('Clicked "Test Navigate" button');

    // Wait for success message
    const success = await waitForCondition(page, async () => {
      const result = await page.evaluate(() => {
        const results = (window as any).testResults || {};
        return results.navigateToPage?.success === true;
      });
      return success;
    });

    if (success) {
      recordTest('Navigate to trades', true);
    } else {
      recordTest('Navigate to trades', false, 'Timeout waiting for success message');
    }
  } catch (err) {
    recordTest('Navigate to trades', false, err.message);
  }
}

// Test date range tool
async function testDateRangeTool(page) {
  section('Date Range Tool Test');

  try {
    // Select 30d option
    await page.selectOption('select', '30d');
    info('Selected "30d" from dropdown');

    // Click test button
    await page.click('button:has-text("Test Set Date Range")');
    info('Clicked "Test Set Date Range" button');

    // Wait for success and verify localStorage
    const success = await waitForCondition(page, async () => {
      const localStorageValue = await page.evaluate(() => {
        return localStorage.getItem('dateRange');
      });
      return localStorageValue === '30d';
    });

    if (success) {
      recordTest('Set date range to 30d', true);
    } else {
      recordTest('Set date range to 30d', false, 'localStorage not updated');
    }
  } catch (err) {
    recordTest('Set date range to 30d', false, err.message);
  }
}

// Test display mode tool
async function testDisplayModeTool(page) {
  section('Display Mode Tool Test');

  try {
    // Find the display mode select (third select on page)
    const selects = await page.$$('select');
    const displayModeSelect = selects[2]; // 0 = page, 1 = date range, 2 = display mode

    await displayModeSelect.selectOption('percent');
    info('Selected "percent" from dropdown');

    // Click test button
    await page.click('button:has-text("Test Set Display Mode")');
    info('Clicked "Test Set Display Mode" button');

    // Verify localStorage
    const success = await waitForCondition(page, async () => {
      const localStorageValue = await page.evaluate(() => {
        return localStorage.getItem('displayMode');
      });
      return localStorageValue === 'percent';
    });

    if (success) {
      recordTest('Set display mode to percent', true);
    } else {
      recordTest('Set display mode to percent', false, 'localStorage not updated');
    }
  } catch (err) {
    recordTest('Set display mode to percent', false, err.message);
  }
}

// Test account size tool
async function testAccountSizeTool(page) {
  section('Account Size Tool Test');

  try {
    // Find account size input
    const accountInput = page.locator('input[placeholder="Account size"]').first();
    await accountInput.fill('100000');
    info('Entered account size: 100000');

    // Click test button
    await page.click('button:has-text("Test Set Account Size")');
    info('Clicked "Test Set Account Size" button');

    // Verify localStorage
    const success = await waitForCondition(page, async () => {
      const localStorageValue = await page.evaluate(() => {
        return localStorage.getItem('accountSize');
      });
      return localStorageValue === '100000';
    });

    if (success) {
      recordTest('Set account size to $100,000', true);
    } else {
      recordTest('Set account size to $100,000', false, 'localStorage not updated');
    }
  } catch (err) {
    recordTest('Set account size to $100,000', false, err.message);
  }
}

// Test AG-UI Chat integration
async function testAGUIChat(page) {
  section('AG-UI Chat Integration Test');

  try {
    // Click the quick test button for "Navigate to trades"
    await page.click('button:has-text("Navigate to trades")');
    info('Clicked "Navigate to trades" quick test button');

    // Wait for backend response
    const success = await waitForCondition(page, async () => {
      const chatResponse = await page.evaluate(() => {
        return (window as any).chatResponse;
      });
      return chatResponse && chatResponse.tool_calls && chatResponse.tool_calls.length > 0;
    });

    if (success) {
      const response = await page.evaluate(() => (window as any).chatResponse);
      const toolCall = response.tool_calls[0];

      if (toolCall.name === 'navigateToPage' && toolCall.arguments.page === 'trades') {
        recordTest('AG-UI Chat - Navigate command', true, JSON.stringify(toolCall));
      } else {
        recordTest('AG-UI Chat - Navigate command', false, `Unexpected tool call: ${JSON.stringify(toolCall)}`);
      }
    } else {
      recordTest('AG-UI Chat - Navigate command', false, 'No tool calls received');
    }
  } catch (err) {
    recordTest('AG-UI Chat - Navigate command', false, err.message);
  }
}

// Test date range selector GUI
async function testDateRangeSelectorGUI(page) {
  section('Date Range Selector GUI Test');

  try {
    // Click the date range selector button
    await page.click('[data-testid="date-range-selector"]');
    info('Opened date range selector dropdown');

    // Wait for dropdown to appear
    await page.waitForSelector('.absolute.top-full', { state: 'visible' });
    success('Dropdown is visible');

    // Click "Custom Range"
    await page.click('[data-testid="date-range-custom"]');
    info('Clicked "Custom Range"');

    // Wait for custom calendar to appear
    await page.waitForSelector('text=Custom Range', { state: 'visible' });
    success('Custom range calendar is visible');

    recordTest('Date Range Selector GUI', true, 'Calendar UI displayed correctly');
  } catch (err) {
    recordTest('Date Range Selector GUI', false, err.message);
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('  AG-UI End-to-End Test Suite', 'bright');
  log('  Testing Frontend Tool Execution', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const startTime = Date.now();
  let browser;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 100, // Slow down actions for visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        info(`Browser console error: ${msg.text()}`);
      }
    });

    // Navigate to test page
    info(`Navigating to ${TEST_PAGE}`);
    await page.goto(TEST_PAGE, { waitUntil: 'networkidle' });

    // Expose test results to window for testing
    await page.addInitScript(() => {
      (window as any).testResults = {};
    });

    // Run all tests
    await testNavigateTool(page);
    await page.goto(TEST_PAGE, { waitUntil: 'networkidle' }); // Refresh between tests

    await testDateRangeTool(page);
    await page.goto(TEST_PAGE, { waitUntil: 'networkidle' });

    await testDisplayModeTool(page);
    await page.goto(TEST_PAGE, { waitUntil: 'networkidle' });

    await testAccountSizeTool(page);
    await page.goto(TEST_PAGE, { waitUntil: 'networkidle' });

    await testAGUIChat(page);
    await page.goto(TEST_PAGE, { waitUntil: 'networkidle' });

    await testDateRangeSelectorGUI(page);

    await browser.close();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    section('Test Summary');
    log(`Total Tests: ${results.passed + results.failed}`, 'bright');
    success(`Passed: ${results.passed}`);
    if (results.failed > 0) {
      error(`Failed: ${results.failed}`);
    }
    log(`Duration: ${duration}s\n`);

    // List failed tests
    if (results.failed > 0) {
      log('\nFailed Tests:', 'red');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          log(`  ✗ ${t.name}`, 'red');
          if (t.details) log(`    ${t.details}`, 'yellow');
        });
      log('');
    }

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (err) {
    error(`\n❌ Test suite error: ${err.message}`);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(err => {
  error(`\n❌ Fatal error: ${err.message}`);
  process.exit(1);
});
