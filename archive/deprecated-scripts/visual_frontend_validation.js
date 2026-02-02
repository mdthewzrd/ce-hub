/**
 * VISUAL FRONTEND VALIDATION SYSTEM
 *
 * This system takes screenshots of actual frontend state changes to validate
 * that Renata commands actually work in the browser, not just API responses.
 *
 * As requested by user: "I think it's best to use an actual visual screenshot
 * of what the window looks like this way. You can actually confirm all the
 * buttons are clicked, all the data looks as it's supposed to, and so on."
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class VisualFrontendValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.screenshotDir = './screenshots';
  }

  async initialize() {
    console.log('🚀 Initializing Visual Frontend Validation System');

    // Create screenshots directory
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Show browser so we can see what's happening
      slowMo: 1000 // Slow down actions for better visibility
    });

    this.page = await this.browser.newPage();

    // Set viewport for consistent screenshots
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    console.log('✅ Browser launched and ready for testing');
  }

  async navigateToApp() {
    console.log('🌐 Navigating to Traderra application...');
    await this.page.goto('http://localhost:6565');

    // Wait for page to fully load
    await this.page.waitForLoadState('networkidle');

    // Take initial screenshot
    await this.takeScreenshot('00_initial_page_load');

    console.log('✅ Application loaded successfully');
  }

  async sendRenataCommand(command, expectedResults, testName) {
    console.log(`\n🧪 Testing Command: "${command}"`);
    console.log(`   Expected: ${expectedResults.join(', ')}`);

    const testStart = Date.now();

    // Take before screenshot
    const beforeScreenshot = `${testName}_01_before`;
    await this.takeScreenshot(beforeScreenshot);

    // Find the chat input (this may need adjustment based on actual UI)
    const chatInput = await this.page.locator('input[placeholder*="message"], textarea[placeholder*="message"], input[type="text"]').first();

    if (await chatInput.count() === 0) {
      console.log('⚠️  Could not find chat input field');
      return this.recordTestResult(testName, command, false, 'Chat input not found', []);
    }

    // Send the command
    await chatInput.fill(command);
    await chatInput.press('Enter');

    // Wait for response (adjust timing as needed)
    await this.page.waitForTimeout(3000);

    // Take after screenshot
    const afterScreenshot = `${testName}_02_after_command`;
    await this.takeScreenshot(afterScreenshot);

    // Validate the results by checking actual UI state
    const validationResults = await this.validateUIState(expectedResults);

    // Take validation screenshot with annotations
    const validationScreenshot = `${testName}_03_validation`;
    await this.takeScreenshot(validationScreenshot);

    const testDuration = Date.now() - testStart;
    const success = validationResults.every(result => result.success);

    console.log(`   ⏱️  Test Duration: ${testDuration}ms`);
    console.log(`   📸 Screenshots: ${beforeScreenshot}, ${afterScreenshot}, ${validationScreenshot}`);
    console.log(`   ${success ? '✅' : '❌'} Result: ${success ? 'PASSED' : 'FAILED'}`);

    if (!success) {
      console.log('   🔍 Validation Details:');
      validationResults.forEach(result => {
        console.log(`      - ${result.check}: ${result.success ? '✅' : '❌'} ${result.message}`);
      });
    }

    return this.recordTestResult(testName, command, success, validationResults, [beforeScreenshot, afterScreenshot, validationScreenshot]);
  }

  async validateUIState(expectedResults) {
    const validations = [];

    for (const expected of expectedResults) {
      if (expected.type === 'navigation') {
        // Check if we're on the correct page
        const currentPage = await this.detectCurrentPage();
        const success = currentPage === expected.page;
        validations.push({
          check: `Navigate to ${expected.page}`,
          success,
          message: success ? `Correctly on ${expected.page} page` : `Expected ${expected.page}, but on ${currentPage}`
        });
      }

      else if (expected.type === 'display_mode') {
        // Check which display mode is active
        const currentMode = await this.detectDisplayMode();
        const success = currentMode === expected.mode;
        validations.push({
          check: `Set display mode to ${expected.mode}`,
          success,
          message: success ? `Correctly in ${expected.mode} mode` : `Expected ${expected.mode}, but in ${currentMode}`
        });
      }

      else if (expected.type === 'date_range') {
        // Check which date range is selected
        const currentRange = await this.detectDateRange();
        const success = currentRange === expected.range;
        validations.push({
          check: `Set date range to ${expected.range}`,
          success,
          message: success ? `Correctly set to ${expected.range}` : `Expected ${expected.range}, but set to ${currentRange}`
        });
      }
    }

    return validations;
  }

  async detectCurrentPage() {
    // Check URL and visible elements to determine current page
    const url = this.page.url();

    // Check for page-specific elements or URL patterns
    if (url.includes('/dashboard') || await this.page.locator('text="Dashboard"').count() > 0) {
      return 'dashboard';
    } else if (url.includes('/statistics') || await this.page.locator('text="Statistics"').count() > 0) {
      return 'statistics';
    } else if (url.includes('/trades') || await this.page.locator('text="Trades"').count() > 0) {
      return 'trades';
    } else if (url.includes('/journal') || await this.page.locator('text="Journal"').count() > 0) {
      return 'journal';
    } else if (url.includes('/analytics') || await this.page.locator('text="Analytics"').count() > 0) {
      return 'analytics';
    } else if (url.includes('/calendar') || await this.page.locator('text="Calendar"').count() > 0) {
      return 'calendar';
    }

    return 'unknown';
  }

  async detectDisplayMode() {
    // Check for active display mode buttons or indicators
    // This will need to be customized based on the actual UI

    // Look for active buttons or selected states
    if (await this.page.locator('button:has-text("$"), button:has-text("Dollar"), .active:has-text("$")').count() > 0) {
      return 'dollar';
    } else if (await this.page.locator('button:has-text("R"), button:has-text("R-multiple"), .active:has-text("R")').count() > 0) {
      return 'r';
    } else if (await this.page.locator('button:has-text("G"), button:has-text("Gross"), .active:has-text("Gross")').count() > 0) {
      return 'gross';
    } else if (await this.page.locator('button:has-text("N"), button:has-text("Net"), .active:has-text("Net")').count() > 0) {
      return 'net';
    }

    return 'unknown';
  }

  async detectDateRange() {
    // Check for active date range buttons or selectors
    // This will need to be customized based on the actual UI

    if (await this.page.locator('button:has-text("All Time"), .active:has-text("All Time")').count() > 0) {
      return 'all';
    } else if (await this.page.locator('button:has-text("Today"), .active:has-text("Today")').count() > 0) {
      return 'today';
    } else if (await this.page.locator('button:has-text("This Week"), .active:has-text("Week")').count() > 0) {
      return 'week';
    } else if (await this.page.locator('button:has-text("This Month"), .active:has-text("Month")').count() > 0) {
      return 'month';
    } else if (await this.page.locator('button:has-text("90"), .active:has-text("90")').count() > 0) {
      return '90day';
    }

    return 'unknown';
  }

  async takeScreenshot(name) {
    const filename = `${name}_${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: true
    });

    return filename;
  }

  recordTestResult(testName, command, success, validationResults, screenshots) {
    const result = {
      testName,
      command,
      success,
      validationResults,
      screenshots,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);
    return result;
  }

  async runUserFailingCommandsTest() {
    console.log('\n🔥 RUNNING USER\'S EXACT FAILING COMMANDS TEST');
    console.log('These are the specific commands that failed in the user\'s sequence\n');

    // Test 1: "Now can we look at net"
    await this.sendRenataCommand(
      "Now can we look at net",
      [{ type: 'display_mode', mode: 'net' }],
      'test_01_net_command'
    );

    // Test 2: "Can we look at the trades in R?"
    await this.sendRenataCommand(
      "Can we look at the trades in R?",
      [
        { type: 'navigation', page: 'trades' },
        { type: 'display_mode', mode: 'r' }
      ],
      'test_02_trades_in_r'
    );
  }

  async runCriticalValidationTest() {
    console.log('\n🎯 RUNNING CRITICAL VALIDATION TEST');
    console.log('Testing: "stats page in R over the last 90 days"');

    await this.sendRenataCommand(
      "stats page in R over the last 90 days",
      [
        { type: 'navigation', page: 'statistics' },
        { type: 'display_mode', mode: 'r' },
        { type: 'date_range', range: '90day' }
      ],
      'test_03_stats_r_90days'
    );
  }

  async runAdditionalEdgeCases() {
    console.log('\n🧪 RUNNING ADDITIONAL EDGE CASE TESTS');

    const tests = [
      {
        command: "go to dashboard in dollars for the past 90 days",
        expected: [
          { type: 'navigation', page: 'dashboard' },
          { type: 'display_mode', mode: 'dollar' },
          { type: 'date_range', range: '90day' }
        ],
        name: 'test_04_dashboard_dollars_90days'
      },
      {
        command: "show me trades in R mode for last 90 days",
        expected: [
          { type: 'navigation', page: 'trades' },
          { type: 'display_mode', mode: 'r' },
          { type: 'date_range', range: '90day' }
        ],
        name: 'test_05_trades_r_last_90'
      }
    ];

    for (const test of tests) {
      await this.sendRenataCommand(test.command, test.expected, test.name);
    }
  }

  async generateReport() {
    console.log('\n📋 GENERATING VISUAL VALIDATION REPORT');

    const report = {
      testSuite: 'Visual Frontend Validation',
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(t => t.success).length,
      failedTests: this.testResults.filter(t => !t.success).length,
      results: this.testResults
    };

    // Save JSON report
    const reportPath = path.join(this.screenshotDir, 'validation_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report for easy viewing
    await this.generateHTMLReport(report);

    return report;
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Frontend Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric.passed { border-left: 4px solid #22c55e; }
        .metric.failed { border-left: 4px solid #ef4444; }
        .test-result { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-result.passed { border-left: 4px solid #22c55e; }
        .test-result.failed { border-left: 4px solid #ef4444; }
        .command { font-family: monospace; background: #f0f0f0; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .screenshots { display: flex; gap: 10px; margin: 15px 0; }
        .screenshot { max-width: 300px; border: 2px solid #ddd; border-radius: 4px; }
        .validation-details { margin-top: 15px; }
        .validation-item { padding: 5px 0; border-bottom: 1px solid #eee; }
        .validation-item.passed { color: #22c55e; }
        .validation-item.failed { color: #ef4444; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Visual Frontend Validation Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>This report shows actual frontend screenshots to validate that Renata commands work correctly in the browser.</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.totalTests}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.passedTests}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.failedTests}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 2em; font-weight: bold;">${((report.passedTests / report.totalTests) * 100).toFixed(1)}%</div>
        </div>
    </div>

    ${report.results.map(result => `
        <div class="test-result ${result.success ? 'passed' : 'failed'}">
            <h3>${result.success ? '✅' : '❌'} ${result.testName}</h3>
            <div class="command">Command: "${result.command}"</div>

            <div class="screenshots">
                ${result.screenshots.map(screenshot => `
                    <div>
                        <img src="./${screenshot}" alt="${screenshot}" class="screenshot">
                        <div style="text-align: center; font-size: 0.8em; margin-top: 5px;">${screenshot}</div>
                    </div>
                `).join('')}
            </div>

            ${Array.isArray(result.validationResults) ? `
                <div class="validation-details">
                    <h4>Validation Details:</h4>
                    ${result.validationResults.map(validation => `
                        <div class="validation-item ${validation.success ? 'passed' : 'failed'}">
                            ${validation.success ? '✅' : '❌'} ${validation.check}: ${validation.message}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;

    const htmlPath = path.join(this.screenshotDir, 'validation_report.html');
    await fs.writeFile(htmlPath, htmlContent);

    console.log(`📋 HTML Report generated: ${htmlPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runVisualValidation() {
  const validator = new VisualFrontendValidator();

  try {
    await validator.initialize();
    await validator.navigateToApp();

    // Run all test suites
    await validator.runUserFailingCommandsTest();
    await validator.runCriticalValidationTest();
    await validator.runAdditionalEdgeCases();

    // Generate comprehensive report
    const report = await validator.generateReport();

    console.log('\n🏁 VISUAL VALIDATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.passedTests} (${((report.passedTests / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${report.failedTests}`);
    console.log(`\n📁 Screenshots and report saved in: ./screenshots/`);
    console.log(`📋 Open ./screenshots/validation_report.html to review results`);

    if (report.failedTests > 0) {
      console.log('\n❌ SOME TESTS FAILED - Review screenshots to see actual frontend state');
    } else {
      console.log('\n✅ ALL TESTS PASSED - Frontend validation successful!');
    }

  } catch (error) {
    console.error('💥 Visual validation failed:', error);
  } finally {
    await validator.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runVisualValidation();
}

module.exports = { VisualFrontendValidator };