/**
 * REAL FRONTEND TEST
 *
 * Tests actual Renata commands on the real dashboard (/trades route)
 * with visual validation of state changes
 */

const { chromium } = require('playwright');

class RealFrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.screenshotDir = './real_test_screenshots';
  }

  async initialize() {
    console.log('🚀 INITIALIZING REAL FRONTEND TEST');

    // Create screenshots directory
    await require('fs').promises.mkdir(this.screenshotDir, { recursive: true }).catch(() => {});

    // Launch browser
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1000
    });

    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });

    console.log('✅ Browser launched');
  }

  async navigateToTrades() {
    console.log('🌐 Navigating to /trades dashboard...');
    await this.page.goto('http://localhost:6565/trades');
    await this.page.waitForLoadState('networkidle');

    // Take initial screenshot
    await this.page.screenshot({ path: `${this.screenshotDir}/01_trades_initial.png` });

    console.log('✅ Trades dashboard loaded');
  }

  async findRenataChat() {
    console.log('🔍 Looking for Renata chat interface...');

    const chatSelectors = [
      '[placeholder*="message"]',
      '[placeholder*="chat"]',
      '[placeholder*="renata"]',
      'textarea',
      'input[type="text"]',
      '.copilot-input',
      '[data-testid*="chat"]',
      '[aria-label*="message"]',
      '[aria-label*="chat"]'
    ];

    for (const selector of chatSelectors) {
      const count = await this.page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found chat interface: ${selector} (${count} elements)`);

        // Highlight and screenshot
        await this.page.locator(selector).first().highlight();
        await this.page.screenshot({ path: `${this.screenshotDir}/02_chat_found.png` });

        return selector;
      }
    }

    console.log('❌ Chat interface not found, checking for Renata button/trigger...');

    // Look for Renata trigger buttons
    const renataSelectors = [
      'button:has-text("renata")',
      'button:has-text("Renata")',
      'button:has-text("chat")',
      'button:has-text("Chat")',
      '[data-testid*="renata"]',
      '.renata-trigger'
    ];

    for (const selector of renataSelectors) {
      const count = await this.page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found Renata trigger: ${selector}`);

        // Click to open chat
        await this.page.locator(selector).first().click();
        await this.page.waitForTimeout(2000);

        await this.page.screenshot({ path: `${this.screenshotDir}/03_renata_opened.png` });

        // Now look for chat input again
        return await this.findRenataChat();
      }
    }

    return null;
  }

  async testCommand(command, expectedActions, testName) {
    console.log(`\n🧪 TESTING: "${command}"`);

    // Take before screenshot
    await this.page.screenshot({ path: `${this.screenshotDir}/${testName}_before.png` });

    // Find chat input
    const chatSelector = await this.findRenataChat();
    if (!chatSelector) {
      console.log('❌ No chat interface found');
      return { success: false, error: 'No chat interface' };
    }

    try {
      // Send command
      const chatInput = this.page.locator(chatSelector).first();
      await chatInput.fill(command);
      await chatInput.press('Enter');

      console.log('✅ Command sent, waiting for response...');
      await this.page.waitForTimeout(3000);

      // Take after screenshot
      await this.page.screenshot({ path: `${this.screenshotDir}/${testName}_after.png` });

      // Validate the results
      const validationResults = await this.validateState(expectedActions);

      // Take final validation screenshot
      await this.page.screenshot({ path: `${this.screenshotDir}/${testName}_final.png` });

      const success = validationResults.every(v => v.success);
      console.log(`${success ? '✅' : '❌'} Test Result: ${success ? 'PASSED' : 'FAILED'}`);

      if (!success) {
        validationResults.forEach(v => {
          console.log(`   ${v.success ? '✅' : '❌'} ${v.check}: ${v.message}`);
        });
      }

      return { success, validationResults, command, testName };

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async validateState(expectedActions) {
    const validations = [];

    for (const action of expectedActions) {
      if (action.type === 'navigation') {
        const currentUrl = this.page.url();
        const success = currentUrl.includes(`/${action.page}`);
        validations.push({
          check: `Navigate to ${action.page}`,
          success,
          message: success ? `On ${action.page} page` : `Expected ${action.page}, on ${currentUrl}`
        });
      }

      else if (action.type === 'display_mode') {
        // Check for active display mode button
        let success = false;
        let message = '';

        const modeSelectors = {
          'dollar': ['button:has-text("$")', '[data-active="true"]:has-text("$")'],
          'r': ['button:has-text("R")', '[data-active="true"]:has-text("R")'],
          'net': ['button:has-text("Net")', 'button:has-text("N")'],
          'gross': ['button:has-text("Gross")', 'button:has-text("G")']
        };

        const selectors = modeSelectors[action.mode] || [];
        for (const selector of selectors) {
          const count = await this.page.locator(selector).count();
          if (count > 0) {
            success = true;
            message = `Found ${action.mode} button active`;
            break;
          }
        }

        if (!success) {
          message = `No active ${action.mode} button found`;
        }

        validations.push({
          check: `Set display mode to ${action.mode}`,
          success,
          message
        });
      }

      else if (action.type === 'date_range') {
        // Check for active date range
        let success = false;
        let message = '';

        const dateSelectors = {
          'all': ['button:has-text("All Time")', 'button:has-text("All")'],
          'today': ['button:has-text("Today")'],
          'week': ['button:has-text("Week")', 'button:has-text("7d")'],
          'month': ['button:has-text("Month")', 'button:has-text("30d")'],
          '90day': ['button:has-text("90")', 'button:has-text("90d")']
        };

        const selectors = dateSelectors[action.range] || [];
        for (const selector of selectors) {
          const count = await this.page.locator(selector).count();
          if (count > 0) {
            success = true;
            message = `Found ${action.range} date range active`;
            break;
          }
        }

        if (!success) {
          message = `No active ${action.range} date range found`;
        }

        validations.push({
          check: `Set date range to ${action.range}`,
          success,
          message
        });
      }
    }

    return validations;
  }

  async runQuickTests() {
    console.log('\n🎯 RUNNING QUICK REAL FRONTEND TESTS');

    const tests = [
      {
        name: 'simple_nav',
        command: 'Go to dashboard',
        expected: [{ type: 'navigation', page: 'dashboard' }]
      },
      {
        name: 'display_mode',
        command: 'Now can we look at net',
        expected: [{ type: 'display_mode', mode: 'net' }]
      },
      {
        name: 'trades_r',
        command: 'Can we look at the trades in R?',
        expected: [
          { type: 'navigation', page: 'trades' },
          { type: 'display_mode', mode: 'r' }
        ]
      }
    ];

    let totalTests = 0;
    let passedTests = 0;

    for (const test of tests) {
      totalTests++;
      const result = await this.testCommand(test.command, test.expected, test.name);
      if (result.success) {
        passedTests++;
      }
      this.testResults.push(result);
    }

    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n🏁 QUICK TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    console.log(`📁 Screenshots saved in: ${this.screenshotDir}/`);

    return { successRate, passedTests, totalTests, results: this.testResults };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function runRealTest() {
  const tester = new RealFrontendTester();

  try {
    await tester.initialize();
    await tester.navigateToTrades();

    const results = await tester.runQuickTests();

    console.log('\n📊 FINAL SUMMARY:');
    console.log(`Current Success Rate: ${results.successRate}%`);

    if (results.successRate < 100) {
      console.log('\n🔧 AREAS FOR IMPROVEMENT:');
      results.results.forEach(result => {
        if (!result.success) {
          console.log(`❌ ${result.command}: ${result.error || 'Failed validation'}`);
        }
      });
    }

    return results;

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

runRealTest();