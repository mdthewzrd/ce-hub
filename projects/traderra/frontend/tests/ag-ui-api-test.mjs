/**
 * AG-UI API Test Suite
 *
 * Tests the AG-PI backend endpoint directly without browser.
 * Run with: node tests/ag-ui-api-test.mjs
 */

const FRONTEND_URL = 'http://localhost:6565';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:6500';
const AGUI_ENDPOINT = `${BACKEND_URL}/agui/chat`;

// ANSI color codes for terminal output
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

// Test results tracking
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

// Health check
async function testBackendHealth() {
  section('Backend Health Check');

  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'healthy') {
      recordTest('Backend is running', true, `Status: ${data.status}`);
      return true;
    } else {
      recordTest('Backend health check', false, `Status: ${response.status}`);
      return false;
    }
  } catch (err) {
    recordTest('Backend connection', false, err.message);
    return false;
  }
}

// AG-UI Chat Test
async function testAGUIChat(userMessage, expectedTool = null, expectedArgs = null) {
  try {
    const response = await fetch(AGUI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        context: {
          currentPage: 'ag-ui-test',
          dateRange: '30d',
          displayMode: 'dollar',
          pnlMode: 'net',
          accountSize: 50000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Check if we got tool_calls
    if (!data.tool_calls || data.tool_calls.length === 0) {
      return { success: false, error: 'No tool_calls returned', data };
    }

    const toolCall = data.tool_calls[0];

    // Validate expected tool
    if (expectedTool && toolCall.tool !== expectedTool) {
      return {
        success: false,
        error: `Expected tool "${expectedTool}", got "${toolCall.tool}"`,
        data,
      };
    }

    // Validate expected args (partial match)
    if (expectedArgs) {
      for (const [key, value] of Object.entries(expectedArgs)) {
        if (toolCall.args[key] !== value) {
          return {
            success: false,
            error: `Expected ${key}="${value}", got "${toolCall.args[key]}"`,
            data,
          };
        }
      }
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Navigation Tool Tests
async function testNavigationTools() {
  section('Navigation Tools');

  const tests = [
    {
      name: 'Navigate to trades',
      message: 'Navigate to the trades page',
      expectedTool: 'navigateToPage',
      expectedArgs: { page: 'trades' },
    },
    {
      name: 'Navigate to journal',
      message: 'Go to journal',
      expectedTool: 'navigateToPage',
      expectedArgs: { page: 'journal' },
    },
    {
      name: 'Navigate to dashboard',
      message: 'Take me to dashboard',
      expectedTool: 'navigateToPage',
      expectedArgs: { page: 'dashboard' },
    },
    {
      name: 'Navigate to analytics',
      message: 'Show me analytics',
      expectedTool: 'navigateToPage',
      expectedArgs: { page: 'analytics' },
    },
  ];

  for (const test of tests) {
    info(`Testing: ${test.message}`);
    const result = await testAGUIChat(test.message, test.expectedTool, test.expectedArgs);
    const toolCall = result.data?.tool_calls?.[0];
    recordTest(test.name, result.success, result.error || JSON.stringify({
      tool: toolCall?.tool,
      args: toolCall?.args
    }));
  }
}

// Display Tools Tests
async function testDisplayTools() {
  section('Display Tools');

  const tests = [
    {
      name: 'Set date range - 30 days',
      message: 'Show me the last 30 days',
      expectedTool: 'setDateRange',
      expectedArgs: { range: '30d' },
    },
    {
      name: 'Set date range - 90 days',
      message: 'I want to see 90 days of data',
      expectedTool: 'setDateRange',
      expectedArgs: { range: '90d' },
    },
    {
      name: 'Set date range - YTD',
      message: 'Show year to date',
      expectedTool: 'setDateRange',
      expectedArgs: { range: 'ytd' },
    },
    {
      name: 'Set display mode - percent',
      message: 'Change to percent mode',
      expectedTool: 'setDisplayMode',
      expectedArgs: { mode: 'percent' },
    },
    {
      name: 'Set display mode - dollar',
      message: 'Switch to dollar display',
      expectedTool: 'setDisplayMode',
      expectedArgs: { mode: 'dollar' },
    },
    {
      name: 'Set display mode - R-multiple',
      message: 'Show R-multiple values',
      expectedTool: 'setDisplayMode',
      expectedArgs: { mode: 'r-multiple' },
    },
  ];

  for (const test of tests) {
    info(`Testing: ${test.message}`);
    const result = await testAGUIChat(test.message, test.expectedTool, test.expectedArgs);
    const toolCall = result.data?.tool_calls?.[0];
    recordTest(test.name, result.success, result.error || JSON.stringify({
      tool: toolCall?.tool,
      args: toolCall?.args
    }));
  }
}

// Account Tools Tests
async function testAccountTools() {
  section('Account Tools');

  const tests = [
    {
      name: 'Set account size',
      message: 'Set my account size to $100,000',
      expectedTool: 'setAccountSize',
      expectedArgs: { size: 100000 },
    },
    {
      name: 'Set P&L mode - net',
      message: 'Use net P&L mode',
      expectedTool: 'setPnLMode',
      expectedArgs: { mode: 'net' },
    },
    {
      name: 'Set P&L mode - gross',
      message: 'Switch to gross P&L',
      expectedTool: 'setPnLMode',
      expectedArgs: { mode: 'gross' },
    },
  ];

  for (const test of tests) {
    info(`Testing: ${test.message}`);
    const result = await testAGUIChat(test.message, test.expectedTool, test.expectedArgs);
    const toolCall = result.data?.tool_calls?.[0];
    recordTest(test.name, result.success, result.error || JSON.stringify({
      tool: toolCall?.tool,
      args: toolCall?.args
    }));
  }
}

// Custom Date Range Tests
async function testCustomDateRange() {
  section('Custom Date Range');

  const tests = [
    {
      name: 'Custom date range - Dec 2024',
      message: 'Set custom date range from December 1, 2024 to December 31, 2024',
      expectedTool: 'setDateRange',
      expectedArgs: { range: 'custom' },
    },
    {
      name: 'Custom date range - Jan 2025',
      message: 'Show me data from Jan 1 2025 to Jan 31 2025',
      expectedTool: 'setDateRange',
      expectedArgs: { range: 'custom' },
    },
  ];

  for (const test of tests) {
    info(`Testing: ${test.message}`);
    const result = await testAGUIChat(test.message, test.expectedTool, test.expectedArgs);
    recordTest(test.name, result.success, result.error || JSON.stringify(result.data?.tool_calls?.[0]?.arguments));
  }
}

// Journal Tools Tests
async function testJournalTools() {
  section('Journal Tools');

  const tests = [
    {
      name: 'Create journal entry',
      message: 'Create a journal entry titled "Test Entry" with content "This is a test"',
      expectedTool: 'createJournalEntry',
      // We don't validate all args, just the tool name
    },
  ];

  for (const test of tests) {
    info(`Testing: ${test.message}`);
    const result = await testAGUIChat(test.message, test.expectedTool, test.expectedArgs);
    recordTest(test.name, result.success, result.error || JSON.stringify(result.data?.tool_calls?.[0]?.arguments));
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'bright');
  log('  AG-UI API Test Suite', 'bright');
  log('  Testing Backend AG-PI Integration', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const startTime = Date.now();

  // Health check first
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    error('\n❌ Backend is not running. Please start the backend first:');
    info('  cd backend && python main.py');
    process.exit(1);
  }

  // Run all test suites
  await testNavigationTools();
  await testDisplayTools();
  await testAccountTools();
  await testCustomDateRange();
  await testJournalTools();

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

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  error(`\n❌ Test suite error: ${err.message}`);
  process.exit(1);
});
