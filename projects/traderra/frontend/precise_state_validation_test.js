/**
 * Precise State Validation Test for Traderra
 * Uses browser automation to test actual state changes
 */

const { chromium } = require('playwright');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:6565',
  headless: false, // Set to true for CI
  timeout: 15000,
  screenshotPath: 'state-test-screenshots'
};

// Test sequences focusing on the YTD dollar stats issue
const CRITICAL_TESTS = [
  {
    id: 'ytd_dollar_stats_direct',
    name: 'YTD Dollar Statistics - Direct Navigation',
    description: 'Test YTD dollar mode on statistics page',
    steps: [
      { action: 'navigate', target: '/statistics' },
      { action: 'sendCommand', message: 'switch to dollars and show year to date' },
      { action: 'wait', duration: 3000 },
      { action: 'validate', checks: ['displayMode:dollar', 'dateRange:ytd'] }
    ]
  },
  {
    id: 'ytd_dollar_stats_via_api',
    name: 'YTD Dollar Statistics - Via API Command',
    description: 'Test full command: go to stats page in dollars and look at year to date',
    steps: [
      { action: 'navigate', target: '/' },
      { action: 'sendCommand', message: 'go to the stats page in dollars and look at year to date' },
      { action: 'wait', duration: 5000 },
      { action: 'validate', checks: ['page:statistics', 'displayMode:dollar', 'dateRange:ytd'] }
    ]
  },
  {
    id: 'dashboard_7d_r_mode',
    name: '7 Day R-Mode Dashboard',
    description: 'Test 7 day R-mode on dashboard',
    steps: [
      { action: 'navigate', target: '/dashboard' },
      { action: 'sendCommand', message: 'switch to R-mode and show 7 day' },
      { action: 'wait', duration: 3000 },
      { action: 'validate', checks: ['displayMode:r', 'dateRange:7d'] }
    ]
  },
  {
    id: 'multi_sequence_test',
    name: 'Multi-Command Sequence',
    description: 'Test complex multi-command sequence',
    steps: [
      { action: 'navigate', target: '/' },
      { action: 'sendCommand', message: 'go to dashboard in dollar mode' },
      { action: 'wait', duration: 3000 },
      { action: 'sendCommand', message: 'show 30 day data' },
      { action: 'wait', duration: 3000 },
      { action: 'sendCommand', message: 'switch to statistics page' },
      { action: 'wait', duration: 3000 },
      { action: 'sendCommand', message: 'show year to date in R-mode' },
      { action: 'wait', duration: 3000 },
      { action: 'validate', checks: ['page:statistics', 'displayMode:r', 'dateRange:ytd'] }
    ]
  }
];

class StateValidator {
  constructor(page) {
    this.page = page;
  }

  async validateDisplayMode(expectedMode) {
    console.log(`🔍 Validating display mode: ${expectedMode}`);

    try {
      // Multiple selector strategies
      const selectors = [
        `[data-testid="display-mode-${expectedMode}"][data-active="true"]`,
        `[data-mode="${expectedMode}"].active`,
        `.traderra-display-${expectedMode}.active`,
        `.traderra-display-active[data-mode="${expectedMode}"]`
      ];

      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`✅ Display mode ${expectedMode} found with selector: ${selector}`);
          return { success: true, method: selector };
        }
      }

      // Check for visual styling
      if (expectedMode === 'dollar') {
        const dollarButton = await this.page.$('button:has-text("$"), .display-mode-button:has-text("$")');
        if (dollarButton) {
          const classes = await dollarButton.getAttribute('class');
          const isActive = classes?.includes('active') || classes?.includes('selected');
          if (isActive) {
            console.log(`✅ Dollar button found as active via visual check`);
            return { success: true, method: 'visual-check' };
          }
        }
      }

      if (expectedMode === 'r') {
        const rButton = await this.page.$('button:has-text("R"), .display-mode-button:has-text("R")');
        if (rButton) {
          const classes = await rButton.getAttribute('class');
          const isActive = classes?.includes('active') || classes?.includes('selected');
          if (isActive) {
            console.log(`✅ R button found as active via visual check`);
            return { success: true, method: 'visual-check' };
          }
        }
      }

      console.log(`❌ Display mode ${expectedMode} not found as active`);
      return { success: false, error: `${expectedMode} mode not active` };

    } catch (error) {
      console.log(`💥 Error validating display mode: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async validateDateRange(expectedRange) {
    console.log(`🔍 Validating date range: ${expectedRange}`);

    try {
      // Wait for date selector to mount
      await this.page.waitForSelector('[data-testid="date-selector"], .traderra-date-selector', { timeout: 5000 });

      // Multiple selector strategies
      const selectors = [
        `[data-testid="date-range-${expectedRange}"][data-active="true"]`,
        `[data-range="${expectedRange}"][data-active="true"]`,
        `.traderra-date-btn[data-range="${expectedRange}"][data-active="true"]`
      ];

      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`✅ Date range ${expectedRange} found with selector: ${selector}`);
          return { success: true, method: selector };
        }
      }

      // Check all date buttons for active state
      const dateButtons = await this.page.$$('.traderra-date-btn, [data-testid*="date-range"]');
      for (const button of dateButtons) {
        const range = await button.getAttribute('data-range');
        const active = await button.getAttribute('data-active');
        const classes = await button.getAttribute('class');

        if (range === expectedRange && (active === 'true' || classes?.includes('active'))) {
          console.log(`✅ Date range ${expectedRange} found as active via button scan`);
          return { success: true, method: 'button-scan' };
        }
      }

      // Map common ranges to button text
      const rangeTextMap = {
        '7d': '7D',
        '30d': '30D',
        '90d': '90D',
        'ytd': 'YTD',
        'all': 'All'
      };

      const expectedText = rangeTextMap[expectedRange] || expectedRange;
      const textButton = await this.page.$(`button:has-text("${expectedText}").active, button:has-text("${expectedText}").selected`);
      if (textButton) {
        console.log(`✅ Date range ${expectedRange} found via text matching`);
        return { success: true, method: 'text-match' };
      }

      console.log(`❌ Date range ${expectedRange} not found as active`);
      return { success: false, error: `${expectedRange} range not active` };

    } catch (error) {
      console.log(`💥 Error validating date range: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async validatePage(expectedPage) {
    console.log(`🔍 Validating page: ${expectedPage}`);

    try {
      const url = this.page.url();
      const isCorrectPage = url.includes(`/${expectedPage}`) ||
                           (expectedPage === 'dashboard' && (url.endsWith('/dashboard') || url.endsWith('/')));

      if (!isCorrectPage) {
        console.log(`❌ Wrong page. Expected ${expectedPage}, got ${url}`);
        return { success: false, error: `Wrong page: ${url}` };
      }

      // Check for page-specific content
      let contentSelector;
      if (expectedPage === 'statistics') {
        contentSelector = '[data-testid="statistics-content"], .statistics-page, h1:has-text("Statistics")';
      } else if (expectedPage === 'dashboard') {
        contentSelector = '[data-testid="dashboard-content"], .main-dashboard, .dashboard-container';
      }

      if (contentSelector) {
        await this.page.waitForSelector(contentSelector, { timeout: 5000 });
        console.log(`✅ Page content found for ${expectedPage}`);
      }

      console.log(`✅ Page validation passed for ${expectedPage}`);
      return { success: true, url };

    } catch (error) {
      console.log(`💥 Error validating page: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

class StateTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async initialize() {
    console.log('🚀 Initializing browser for state testing...');
    this.browser = await chromium.launch({
      headless: TEST_CONFIG.headless,
      devtools: !TEST_CONFIG.headless
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });

    this.page = await context.newPage();

    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('🎯')) {
        console.log(`🌐 Browser: ${msg.text()}`);
      }
    });

    this.validator = new StateValidator(this.page);
  }

  async executeTest(test) {
    console.log(`\n🧪 Executing: ${test.name}`);
    console.log(`📝 ${test.description}`);

    const result = {
      id: test.id,
      name: test.name,
      startTime: Date.now(),
      steps: [],
      success: false
    };

    try {
      for (let i = 0; i < test.steps.length; i++) {
        const step = test.steps[i];
        console.log(`  Step ${i + 1}: ${step.action} ${step.target || step.message || ''}`);

        const stepResult = await this.executeStep(step, i);
        result.steps.push(stepResult);

        if (!stepResult.success && step.action === 'validate') {
          console.log(`  ❌ Step failed: ${stepResult.error}`);
          break;
        }
      }

      // Check if all validation steps passed
      const validationSteps = result.steps.filter(s => s.action === 'validate');
      const allValidationsPassed = validationSteps.every(s => s.success);

      result.success = allValidationsPassed;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

      console.log(`${result.success ? '✅' : '❌'} Test ${test.id}: ${result.success ? 'PASS' : 'FAIL'} (${result.duration}ms)`);

      // Take screenshot
      const screenshot = `${test.id}-${result.success ? 'pass' : 'fail'}-${Date.now()}.png`;
      await this.page.screenshot({ path: screenshot });
      result.screenshot = screenshot;

    } catch (error) {
      console.log(`💥 Test crashed: ${error.message}`);
      result.error = error.message;
      result.success = false;
    }

    this.results.push(result);
    return result;
  }

  async executeStep(step, stepIndex) {
    const stepResult = {
      action: step.action,
      startTime: Date.now(),
      success: true
    };

    try {
      switch (step.action) {
        case 'navigate':
          await this.page.goto(`${TEST_CONFIG.baseUrl}${step.target}`, { waitUntil: 'networkidle' });
          stepResult.url = this.page.url();
          break;

        case 'sendCommand':
          // Send command via CopilotKit API
          await this.page.evaluate((message) => {
            // Look for CopilotKit send message function or input
            const messageInput = document.querySelector('[data-testid="copilot-input"], .copilotkit-input, input[placeholder*="message"]');
            if (messageInput) {
              messageInput.value = message;
              messageInput.dispatchEvent(new Event('input', { bubbles: true }));

              // Find and click send button
              const sendBtn = document.querySelector('[data-testid="send-button"], .send-button, button[type="submit"]');
              if (sendBtn) {
                sendBtn.click();
              }
            } else {
              // Fallback: try to trigger via API directly
              fetch('/api/copilotkit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  operationName: 'generateCopilotResponse',
                  query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                    generateCopilotResponse(data: $data) {
                      messages { content }
                    }
                  }`,
                  variables: {
                    data: {
                      messages: [{ content: message, role: 'user' }]
                    }
                  }
                })
              });
            }
          }, step.message);

          stepResult.message = step.message;
          break;

        case 'wait':
          await this.page.waitForTimeout(step.duration);
          stepResult.duration = step.duration;
          break;

        case 'validate':
          const validationResults = {};

          for (const check of step.checks) {
            const [type, expected] = check.split(':');

            let validation;
            if (type === 'displayMode') {
              validation = await this.validator.validateDisplayMode(expected);
            } else if (type === 'dateRange') {
              validation = await this.validator.validateDateRange(expected);
            } else if (type === 'page') {
              validation = await this.validator.validatePage(expected);
            }

            validationResults[check] = validation;

            if (!validation.success) {
              stepResult.success = false;
              stepResult.error = `${check}: ${validation.error}`;
            }
          }

          stepResult.validations = validationResults;
          break;

        default:
          throw new Error(`Unknown step action: ${step.action}`);
      }

    } catch (error) {
      stepResult.success = false;
      stepResult.error = error.message;
    }

    stepResult.endTime = Date.now();
    stepResult.stepDuration = stepResult.endTime - stepResult.startTime;

    return stepResult;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  generateReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    console.log(`\n📊 PRECISE STATE VALIDATION REPORT`);
    console.log(`==================================================`);
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed/total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed/total) * 100).toFixed(1)}%)`);

    console.log(`\n📋 DETAILED RESULTS:`);
    this.results.forEach((result, i) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${i + 1}. ${status} - ${result.name} (${result.duration}ms)`);

      if (!result.success) {
        console.log(`   🔍 Error: ${result.error || 'Validation failed'}`);

        // Show specific validation failures
        const validationSteps = result.steps.filter(s => s.action === 'validate');
        validationSteps.forEach(step => {
          if (!step.success && step.validations) {
            Object.entries(step.validations).forEach(([check, validation]) => {
              if (!validation.success) {
                console.log(`   ❌ ${check}: ${validation.error}`);
              }
            });
          }
        });
      }

      if (result.screenshot) {
        console.log(`   📸 Screenshot: ${result.screenshot}`);
      }
    });

    // Analyze failure patterns
    this.analyzeFailures();

    return { total, passed, failed, passRate: (passed/total) * 100, results: this.results };
  }

  analyzeFailures() {
    const failures = this.results.filter(r => !r.success);

    if (failures.length === 0) {
      console.log(`\n🎉 No failures to analyze!`);
      return;
    }

    console.log(`\n🔍 FAILURE ANALYSIS:`);
    console.log(`============================`);

    const failureTypes = {};
    failures.forEach(failure => {
      const validationSteps = failure.steps.filter(s => s.action === 'validate' && !s.success);
      validationSteps.forEach(step => {
        if (step.validations) {
          Object.entries(step.validations).forEach(([check, validation]) => {
            if (!validation.success) {
              if (!failureTypes[check]) failureTypes[check] = [];
              failureTypes[check].push({
                test: failure.name,
                error: validation.error
              });
            }
          });
        }
      });
    });

    Object.entries(failureTypes).forEach(([check, failures]) => {
      console.log(`\n❌ ${check} failures (${failures.length}):`);
      failures.forEach(f => {
        console.log(`  - ${f.test}: ${f.error}`);
      });
    });

    // Most critical issue
    const mostCommonFailure = Object.entries(failureTypes).sort((a, b) => b[1].length - a[1].length)[0];
    if (mostCommonFailure) {
      console.log(`\n🎯 MOST CRITICAL ISSUE: ${mostCommonFailure[0]} (${mostCommonFailure[1].length} failures)`);
      console.log(`Recommendation: Focus on fixing ${mostCommonFailure[0]} state management first.`);
    }
  }
}

// Main execution
async function runPreciseStateTests() {
  const runner = new StateTestRunner();

  try {
    await runner.initialize();

    console.log(`🎯 Running ${CRITICAL_TESTS.length} critical state tests...`);

    for (const test of CRITICAL_TESTS) {
      await runner.executeTest(test);
      await runner.page.waitForTimeout(1000); // Brief pause between tests
    }

    const report = runner.generateReport();

    // Save report
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `state-validation-report-${timestamp}.json`;

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved: ${reportFile}`);

  } finally {
    await runner.cleanup();
  }
}

// Export for testing
module.exports = {
  runPreciseStateTests,
  StateTestRunner,
  StateValidator,
  CRITICAL_TESTS
};

// Auto-run if called directly
if (require.main === module) {
  runPreciseStateTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}