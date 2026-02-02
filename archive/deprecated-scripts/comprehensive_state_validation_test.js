/**
 * COMPREHENSIVE STATE VALIDATION TEST
 * Tests all fixes for Traderra state management and AI agent validation
 *
 * Fixes being tested:
 * 1. Visual state persistence during display mode changes
 * 2. AI agent command detection reliability
 * 3. CSS class-based state detection
 * 4. Compound command execution accuracy
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class StateValidationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.screenshots = [];
    this.testStartTime = Date.now();
  }

  async setup() {
    this.browser = await chromium.launch({
      headless: false, // Show browser for visual confirmation
      slowMo: 1000 // Slow down actions for observation
    });
    this.page = await this.browser.newPage();
    await this.page.goto('http://localhost:6565/dashboard');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(3000); // Allow full load
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(name) {
    const timestamp = Date.now();
    const filename = `test_${timestamp}_${name}.png`;
    await this.page.screenshot({
      path: filename,
      fullPage: true
    });
    this.screenshots.push(filename);
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async checkVisualState() {
    // Check visual state of all buttons
    const state = await this.page.evaluate(() => {
      // Date range buttons
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d');
      const btn30d = allButtons.find(btn => btn.textContent?.trim() === '30d');
      const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d');
      const btnAll = allButtons.find(btn => btn.textContent?.trim() === 'All');

      // Display mode buttons
      const dollarBtn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]');
      const rBtn = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return {
          hasGoldBg: btn.classList.contains('bg-[#B8860B]'),
          hasActiveClass: btn.classList.contains('traderra-date-active'),
          dataActive: btn.getAttribute('data-active') === 'true',
          computedBg: window.getComputedStyle(btn).backgroundColor,
          isVisuallyActive: window.getComputedStyle(btn).backgroundColor.includes('184, 134, 11') ||
                           window.getComputedStyle(btn).backgroundColor.includes('rgb(184, 134, 11)') ||
                           btn.classList.contains('bg-[#B8860B]') ||
                           btn.classList.contains('traderra-date-active')
        };
      };

      return {
        dateButtons: {
          '7d': checkButtonActive(btn7d),
          '30d': checkButtonActive(btn30d),
          '90d': checkButtonActive(btn90d),
          'All': checkButtonActive(btnAll)
        },
        displayButtons: {
          '$': checkButtonActive(dollarBtn),
          'R': checkButtonActive(rBtn)
        }
      };
    });

    return state;
  }

  async sendChatMessage(message) {
    console.log(`💬 Sending message: "${message}"`);

    // Find chat input and send message
    await this.page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    const chatInput = await this.page.locator('textarea').or(this.page.locator('input[type="text"]')).first();

    await chatInput.fill(message);
    await this.page.keyboard.press('Enter');

    // Wait for response and processing
    await this.page.waitForTimeout(4000);
  }

  async testSingleCommand(testName, command, expectedState) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`📝 Command: "${command}"`);

    const beforeScreenshot = await this.takeScreenshot(`${testName}_before`);
    const beforeState = await this.checkVisualState();

    await this.sendChatMessage(command);

    const afterScreenshot = await this.takeScreenshot(`${testName}_after`);
    const afterState = await this.checkVisualState();

    // Validate expected state
    let success = true;
    let errors = [];

    // Check date range expectations
    if (expectedState.dateRange) {
      const expectedButton = afterState.dateButtons[expectedState.dateRange];
      if (!expectedButton || !expectedButton.isVisuallyActive) {
        success = false;
        errors.push(`Expected ${expectedState.dateRange} button to be active, but it's not visually active`);
      }
    }

    // Check display mode expectations
    if (expectedState.displayMode) {
      const expectedButton = afterState.displayButtons[expectedState.displayMode];
      if (!expectedButton || !expectedButton.isVisuallyActive) {
        success = false;
        errors.push(`Expected ${expectedState.displayMode} display mode to be active, but it's not visually active`);
      }
    }

    const result = {
      testName,
      command,
      success,
      errors,
      beforeState,
      afterState,
      beforeScreenshot,
      afterScreenshot,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);

    if (success) {
      console.log(`✅ ${testName}: PASSED`);
    } else {
      console.log(`❌ ${testName}: FAILED`);
      errors.forEach(error => console.log(`   - ${error}`));
    }

    return result;
  }

  async testCompoundCommand(testName, command, expectedStates) {
    console.log(`\n🧪 Testing Compound: ${testName}`);
    console.log(`📝 Command: "${command}"`);

    const beforeScreenshot = await this.takeScreenshot(`${testName}_before`);
    const beforeState = await this.checkVisualState();

    await this.sendChatMessage(command);

    const afterScreenshot = await this.takeScreenshot(`${testName}_after`);
    const afterState = await this.checkVisualState();

    let success = true;
    let errors = [];

    // Check all expected states
    expectedStates.forEach((expected, index) => {
      if (expected.dateRange) {
        const expectedButton = afterState.dateButtons[expected.dateRange];
        if (!expectedButton || !expectedButton.isVisuallyActive) {
          success = false;
          errors.push(`Action ${index + 1}: Expected ${expected.dateRange} button to be active, but it's not visually active`);
        }
      }

      if (expected.displayMode) {
        const expectedButton = afterState.displayButtons[expected.displayMode];
        if (!expectedButton || !expectedButton.isVisuallyActive) {
          success = false;
          errors.push(`Action ${index + 1}: Expected ${expected.displayMode} display mode to be active, but it's not visually active`);
        }
      }
    });

    const result = {
      testName,
      command,
      success,
      errors,
      beforeState,
      afterState,
      beforeScreenshot,
      afterScreenshot,
      timestamp: new Date().toISOString(),
      isCompound: true
    };

    this.results.push(result);

    if (success) {
      console.log(`✅ ${testName}: PASSED`);
    } else {
      console.log(`❌ ${testName}: FAILED`);
      errors.forEach(error => console.log(`   - ${error}`));
    }

    return result;
  }

  async testVisualStatePersistence() {
    console.log(`\n🔍 CRITICAL TEST: Visual State Persistence During Display Mode Changes`);

    // Step 1: Select date range
    console.log(`Step 1: Select 7d date range`);
    await this.page.getByRole('button', { name: '7d' }).click();
    await this.page.waitForTimeout(1000);
    const step1Screenshot = await this.takeScreenshot('persistence_step1_7d_selected');
    const step1State = await this.checkVisualState();

    // Step 2: Toggle to R mode (critical test)
    console.log(`Step 2: Toggle to R display mode - CRITICAL TEST`);
    await this.page.getByRole('button', { name: 'R' }).or(this.page.getByRole('button', { name: /risk multiple/i })).first().click();
    await this.page.waitForTimeout(1000);
    const step2Screenshot = await this.takeScreenshot('persistence_step2_R_mode_CRITICAL');
    const step2State = await this.checkVisualState();

    // Step 3: Toggle back to $ mode
    console.log(`Step 3: Toggle back to $ display mode`);
    await this.page.getByRole('button', { name: '$' }).or(this.page.getByRole('button', { name: /dollar/i })).first().click();
    await this.page.waitForTimeout(1000);
    const step3Screenshot = await this.takeScreenshot('persistence_step3_dollar_mode');
    const step3State = await this.checkVisualState();

    // Validate persistence
    const step1_7dActive = step1State.dateButtons['7d']?.isVisuallyActive;
    const step2_7dActive = step2State.dateButtons['7d']?.isVisuallyActive; // CRITICAL
    const step3_7dActive = step3State.dateButtons['7d']?.isVisuallyActive;

    const step2_RActive = step2State.displayButtons['R']?.isVisuallyActive;
    const step3_DollarActive = step3State.displayButtons['$']?.isVisuallyActive;

    const persistenceTest = {
      testName: 'CRITICAL: Visual State Persistence',
      success: step1_7dActive && step2_7dActive && step3_7dActive && step2_RActive && step3_DollarActive,
      details: {
        step1_7dActive,
        step2_7dActive: step2_7dActive, // This is the critical test
        step3_7dActive,
        step2_RActive,
        step3_DollarActive
      },
      screenshots: [step1Screenshot, step2Screenshot, step3Screenshot],
      timestamp: new Date().toISOString()
    };

    this.results.push(persistenceTest);

    if (persistenceTest.success) {
      console.log(`✅ CRITICAL TEST: Visual State Persistence - PASSED`);
      console.log(`   🎯 7d button remained active through ALL display mode changes`);
    } else {
      console.log(`❌ CRITICAL TEST: Visual State Persistence - FAILED`);
      if (!step2_7dActive) {
        console.log(`   💥 CRITICAL FAILURE: 7d button lost active state during R mode toggle`);
      }
    }

    return persistenceTest;
  }

  async runComprehensiveTests() {
    console.log(`🚀 COMPREHENSIVE STATE VALIDATION TEST SUITE`);
    console.log(`================================================`);

    try {
      await this.setup();

      // PHASE 1: Visual State Persistence (Most Critical)
      console.log(`\n📍 PHASE 1: Visual State Persistence Test`);
      await this.testVisualStatePersistence();

      // PHASE 2: Single Commands (20 variations)
      console.log(`\n📍 PHASE 2: Single Commands (20 variations)`);

      const singleCommandTests = [
        // Date Range Variations
        { name: 'Date_7d_Basic', command: '7d', expected: { dateRange: '7d' } },
        { name: 'Date_7d_Text', command: 'show 7 days', expected: { dateRange: '7d' } },
        { name: 'Date_7d_Week', command: 'this week', expected: { dateRange: '7d' } },
        { name: 'Date_30d_Basic', command: '30d', expected: { dateRange: '30d' } },
        { name: 'Date_30d_Text', command: 'last 30 days', expected: { dateRange: '30d' } },
        { name: 'Date_90d_Basic', command: '90d', expected: { dateRange: '90d' } },
        { name: 'Date_90d_Text', command: 'last 90 days', expected: { dateRange: '90d' } },
        { name: 'Date_All_Basic', command: 'all time', expected: { dateRange: 'All' } },
        { name: 'Date_All_Text', command: 'show all data', expected: { dateRange: 'All' } },

        // Display Mode Variations
        { name: 'Display_Dollar_Basic', command: 'switch to dollars', expected: { displayMode: '$' } },
        { name: 'Display_Dollar_Short', command: '$', expected: { displayMode: '$' } },
        { name: 'Display_Dollar_Text', command: 'show in dollar format', expected: { displayMode: '$' } },
        { name: 'Display_R_Basic', command: 'switch to R', expected: { displayMode: 'R' } },
        { name: 'Display_R_Text', command: 'risk multiple view', expected: { displayMode: 'R' } },
        { name: 'Display_R_Full', command: 'show in R-multiple', expected: { displayMode: 'R' } },

        // Navigation with State
        { name: 'Nav_Stats_7d', command: 'go to stats for 7 days', expected: { dateRange: '7d' } },
        { name: 'Nav_Stats_Dollar', command: 'show stats in dollars', expected: { displayMode: '$' } },
        { name: 'Nav_Dashboard_90d', command: 'dashboard for 90 days', expected: { dateRange: '90d' } },
        { name: 'Nav_Dashboard_R', command: 'dashboard in R view', expected: { displayMode: 'R' } },
        { name: 'Nav_Journal_All', command: 'journal all time', expected: { dateRange: 'All' } }
      ];

      for (const test of singleCommandTests) {
        await this.testSingleCommand(test.name, test.command, test.expected);
        await this.page.waitForTimeout(2000); // Wait between tests
      }

      // PHASE 3: Compound Commands (10 variations)
      console.log(`\n📍 PHASE 3: Compound Commands (10 variations)`);

      const compoundCommandTests = [
        {
          name: 'Compound_Stats_All_R',
          command: 'show stats all time in R',
          expected: [{ dateRange: 'All' }, { displayMode: 'R' }]
        },
        {
          name: 'Compound_Dashboard_90d_Dollar',
          command: 'go to dashboard 90 days in dollars',
          expected: [{ dateRange: '90d' }, { displayMode: '$' }]
        },
        {
          name: 'Compound_Journal_Week_R',
          command: 'journal this week in R-multiple',
          expected: [{ dateRange: '7d' }, { displayMode: 'R' }]
        },
        {
          name: 'Compound_Stats_30d_Dollar',
          command: 'statistics for 30 days dollar view',
          expected: [{ dateRange: '30d' }, { displayMode: '$' }]
        },
        {
          name: 'Compound_All_Dollar_Stats',
          command: 'all time dollar stats',
          expected: [{ dateRange: 'All' }, { displayMode: '$' }]
        },
        {
          name: 'Compound_90d_R_Dashboard',
          command: '90 days R dashboard',
          expected: [{ dateRange: '90d' }, { displayMode: 'R' }]
        },
        {
          name: 'Compound_Week_Dollar_Performance',
          command: 'week dollar performance',
          expected: [{ dateRange: '7d' }, { displayMode: '$' }]
        },
        {
          name: 'Compound_Month_R_Analysis',
          command: 'month R analysis',
          expected: [{ dateRange: '30d' }, { displayMode: 'R' }]
        },
        {
          name: 'Compound_Natural_All_Dollar',
          command: 'can you please show me all my data in dollar format',
          expected: [{ dateRange: 'All' }, { displayMode: '$' }]
        },
        {
          name: 'Compound_Natural_90d_R',
          command: 'I want to see the last 90 days in risk multiple view',
          expected: [{ dateRange: '90d' }, { displayMode: 'R' }]
        }
      ];

      for (const test of compoundCommandTests) {
        await this.testCompoundCommand(test.name, test.command, test.expected);
        await this.page.waitForTimeout(2000); // Wait between tests
      }

      // PHASE 4: Generate Results Report
      await this.generateReport();

    } catch (error) {
      console.error(`💥 Test Suite Error:`, error);
    } finally {
      await this.teardown();
    }
  }

  async generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.testStartTime,
        totalTests,
        passedTests,
        failedTests,
        successRate: `${successRate}%`
      },
      criticalTest: this.results.find(r => r.testName?.includes('Visual State Persistence')),
      singleCommandResults: this.results.filter(r => !r.isCompound && !r.testName?.includes('Persistence')),
      compoundCommandResults: this.results.filter(r => r.isCompound),
      screenshots: this.screenshots,
      detailedResults: this.results
    };

    const reportPath = `comprehensive_test_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 COMPREHENSIVE TEST RESULTS`);
    console.log(`===============================`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Report saved: ${reportPath}`);
    console.log(`Screenshots: ${this.screenshots.length} files`);

    if (successRate >= 95) {
      console.log(`\n🎉 EXCELLENT: ${successRate}% success rate - System is working properly!`);
    } else if (successRate >= 80) {
      console.log(`\n⚠️  GOOD: ${successRate}% success rate - Some improvements needed`);
    } else {
      console.log(`\n❌ NEEDS WORK: ${successRate}% success rate - Significant issues remain`);
    }

    // Show critical test result
    const criticalTest = report.criticalTest;
    if (criticalTest) {
      if (criticalTest.success) {
        console.log(`✅ CRITICAL: Visual State Persistence - WORKING`);
      } else {
        console.log(`❌ CRITICAL: Visual State Persistence - BROKEN`);
        console.log(`   This is the root cause of AI agent validation failures`);
      }
    }

    return report;
  }
}

// Run the tests
async function main() {
  const tester = new StateValidationTester();
  await tester.runComprehensiveTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { StateValidationTester };