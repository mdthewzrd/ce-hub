/**
 * Bulletproof Renata Chat System Test
 * Tests all functionality with the working interface
 */

const { chromium } = require('playwright');

class BulletproofRenataTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      multiCommand: { passed: 0, failed: 0, results: [] },
      patternMatching: { passed: 0, failed: 0, results: [] },
      stateChanges: { passed: 0, failed: 0, results: [] },
      errorHandling: { passed: 0, failed: 0, results: [] },
      uiSync: { passed: 0, failed: 0, results: [] }
    };
  }

  async init() {
    console.log('🚀 Initializing Bulletproof Renata Test...');
    this.browser = await chromium.launch({ headless: false, slowMo: 500 });
    this.page = await this.browser.newPage();

    // Capture console logs for debugging
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯') || text.includes('✅') || text.includes('❌') ||
          text.includes('🔍') || text.includes('📦') || text.includes('🚀') ||
          text.includes('🔄') || text.includes('📊')) {
        console.log('BROWSER:', text);
      }
    });

    // Navigate and open Renata
    await this.page.goto('http://localhost:6565/dashboard', { timeout: 10000 });
    await this.page.waitForTimeout(2000);

    // Find and click AI button
    const aiButton = await this.page.$('button[title*="AI"]');
    if (aiButton) {
      await aiButton.click();
      await this.page.waitForTimeout(2000);
      console.log('✅ Renata sidebar opened');
    } else {
      throw new Error('Could not find AI button');
    }
  }

  async sendCommand(command) {
    console.log(`\n📤 Sending: "${command}"`);

    try {
      // Find input field (we know it exists from interface test)
      const input = await this.page.$('input[data-testid="renata-chat-input"]');
      if (!input) {
        throw new Error('Chat input not found');
      }

      // Clear and fill input
      await input.fill('');
      await input.type(command, { delay: 50 });

      // Click send button
      const sendButton = await this.page.$('button[data-testid="renata-chat-send-button"]');
      if (sendButton) {
        await sendButton.click();
      } else {
        await input.press('Enter');
      }

      // Wait for response
      await this.page.waitForTimeout(3000);

      // Get response
      const response = await this.page.evaluate(() => {
        const messages = document.querySelectorAll('.space-y-4 > div');
        const assistantMessages = Array.from(messages).filter(el =>
          el.classList.contains('justify-start')
        );
        const lastMessage = assistantMessages[assistantMessages.length - 1];
        return lastMessage ? lastMessage.textContent?.trim() : '';
      });

      console.log(`📥 Response: "${response.substring(0, 100)}..."`);
      return response;

    } catch (error) {
      console.log(`❌ Command failed: ${error.message}`);
      return '';
    }
  }

  async getCurrentState() {
    return await this.page.evaluate(() => {
      return {
        url: window.location.pathname,
        dateRangeLabel: window.dateRangeContext?.currentDateRange?.label,
        dateRangeValue: window.dateRangeContext?.selectedRange,
        displayModeValue: window.displayModeContext?.displayMode
      };
    });
  }

  async testMultiCommandProcessing() {
    console.log('\n🧪 Testing Multi-command Processing...');

    const testCases = [
      {
        command: 'go to the dashboard and look at the last 90 days in R',
        expectedPage: '/dashboard',
        expectedDateRange: '90day',
        expectedDisplayMode: 'r'
      },
      {
        command: 'show me statistics in dollars for this month',
        expectedPage: '/statistics',
        expectedDateRange: 'month',
        expectedDisplayMode: 'dollar'
      },
      {
        command: 'take me to trades view with all time data in R mode',
        expectedPage: '/trades',
        expectedDateRange: 'all',
        expectedDisplayMode: 'r'
      }
    ];

    for (const testCase of testCases) {
      try {
        const beforeState = await this.getCurrentState();
        const response = await this.sendCommand(testCase.command);
        await this.page.waitForTimeout(2000);
        const afterState = await this.getCurrentState();

        const success = response.includes('✅') || response.includes('Perfect');
        const navigationCorrect = afterState.url === testCase.expectedPage;
        const dateRangeCorrect = afterState.dateRangeValue === testCase.expectedDateRange;
        const displayModeCorrect = afterState.displayModeValue === testCase.expectedDisplayMode;

        const allCorrect = success && navigationCorrect && dateRangeCorrect && displayModeCorrect;

        console.log(`📊 Results for: "${testCase.command}"`);
        console.log(`  Success response: ${success ? '✅' : '❌'}`);
        console.log(`  Navigation: ${navigationCorrect ? '✅' : '❌'} (${afterState.url})`);
        console.log(`  Date range: ${dateRangeCorrect ? '✅' : '❌'} (${afterState.dateRangeValue})`);
        console.log(`  Display mode: ${displayModeCorrect ? '✅' : '❌'} (${afterState.displayModeValue})`);

        if (allCorrect) {
          this.testResults.multiCommand.passed++;
        } else {
          this.testResults.multiCommand.failed++;
        }

        this.testResults.multiCommand.results.push({
          command: testCase.command,
          expected: testCase,
          actual: afterState,
          response,
          success: allCorrect
        });

      } catch (error) {
        console.log(`❌ Test error: ${error.message}`);
        this.testResults.multiCommand.failed++;
        this.testResults.multiCommand.results.push({
          command: testCase.command,
          error: error.message,
          success: false
        });
      }
    }
  }

  async testPatternMatching() {
    console.log('\n🧪 Testing Pattern Matching...');

    const patterns = [
      // Display modes
      { command: 'show in R', type: 'display', expected: 'r' },
      { command: 'switch to dollars', type: 'display', expected: 'dollar' },
      { command: 'view in percentages', type: 'display', expected: 'percent' },
      { command: 'in multiple of R', type: 'display', expected: 'r' },
      { command: 'actual amounts', type: 'display', expected: 'dollar' },

      // Date ranges
      { command: 'show last 90 days', type: 'date', expected: '90day' },
      { command: 'today only', type: 'date', expected: 'today' },
      { command: 'this week', type: 'date', expected: 'week' },
      { command: 'this month', type: 'date', expected: 'month' },
      { command: 'year to date', type: 'date', expected: 'year' },
      { command: 'all time', type: 'date', expected: 'all' },

      // Navigation
      { command: 'go to dashboard', type: 'navigation', expected: '/dashboard' },
      { command: 'show statistics', type: 'navigation', expected: '/statistics' },
      { command: 'view trades', type: 'navigation', expected: '/trades' },
      { command: 'open journal', type: 'navigation', expected: '/journal' }
    ];

    for (const pattern of patterns) {
      try {
        const beforeState = await this.getCurrentState();
        const response = await this.sendCommand(pattern.command);
        await this.page.waitForTimeout(2000);
        const afterState = await this.getCurrentState();

        const success = response.includes('✅') || response.includes('Perfect');
        let correct = false;

        switch (pattern.type) {
          case 'display':
            correct = afterState.displayModeValue === pattern.expected;
            break;
          case 'date':
            correct = afterState.dateRangeValue === pattern.expected;
            break;
          case 'navigation':
            correct = afterState.url === pattern.expected;
            break;
        }

        const passed = success && correct;

        console.log(`🔍 "${pattern.command}" (${pattern.type}): ${passed ? '✅' : '❌'}`);
        if (!correct) {
          console.log(`  Expected: ${pattern.expected}, Got: ${
            pattern.type === 'display' ? afterState.displayModeValue :
            pattern.type === 'date' ? afterState.dateRangeValue :
            afterState.url
          }`);
        }

        if (passed) {
          this.testResults.patternMatching.passed++;
        } else {
          this.testResults.patternMatching.failed++;
        }

        this.testResults.patternMatching.results.push({
          command: pattern.command,
          type: pattern.type,
          expected: pattern.expected,
          actual: afterState,
          success: passed
        });

      } catch (error) {
        console.log(`❌ Pattern test error: ${error.message}`);
        this.testResults.patternMatching.failed++;
      }
    }
  }

  async testStateChangeVerification() {
    console.log('\n🧪 Testing State Change Verification...');

    const stateChangeTests = [
      {
        name: 'Date range persistence',
        commands: ['show last 90 days', 'show today only', 'show this month']
      },
      {
        name: 'Display mode persistence',
        commands: ['switch to R mode', 'show in dollars', 'view in percentages']
      }
    ];

    for (const testGroup of stateChangeTests) {
      console.log(`\n🔍 Testing: ${testGroup.name}`);

      for (const command of testGroup.commands) {
        try {
          const beforeState = await this.getCurrentState();
          const response = await this.sendCommand(command);
          await this.page.waitForTimeout(2000);
          const afterState = await this.getCurrentState();

          const stateChanged = JSON.stringify(beforeState) !== JSON.stringify(afterState);
          const success = response.includes('✅') || response.includes('Perfect');

          const passed = stateChanged && success;

          console.log(`  "${command}": ${passed ? '✅' : '❌'} (state changed: ${stateChanged})`);

          if (passed) {
            this.testResults.stateChanges.passed++;
          } else {
            this.testResults.stateChanges.failed++;
          }

          this.testResults.stateChanges.results.push({
            command,
            beforeState,
            afterState,
            stateChanged,
            success: passed
          });

        } catch (error) {
          console.log(`❌ State change test error: ${error.message}`);
          this.testResults.stateChanges.failed++;
        }
      }
    }
  }

  async testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...');

    const errorCommands = [
      'do something random',
      'invalid command xyz',
      'go to dashboard and also go to statistics',
      'show in R and also in dollars',
      'change it',
      '',
      'r',
      'go'
    ];

    for (const command of errorCommands) {
      try {
        const response = await this.sendCommand(command);

        const graceful = response.includes('Sorry') ||
                        response.includes('couldn\'t') ||
                        response.includes('try again') ||
                        response.includes('understood') ||
                        response.includes('I understood') ||
                        response.length > 20; // Meaningful response

        console.log(`"${command}": ${graceful ? '✅' : '❌'}`);

        if (graceful) {
          this.testResults.errorHandling.passed++;
        } else {
          this.testResults.errorHandling.failed++;
        }

        this.testResults.errorHandling.results.push({
          command,
          response,
          graceful
        });

      } catch (error) {
        console.log(`❌ Error handling test error: ${error.message}`);
        this.testResults.errorHandling.failed++;
      }
    }
  }

  async testUISynchronization() {
    console.log('\n🧪 Testing UI Synchronization...');

    const syncCommands = [
      'show last 90 days',
      'show in R',
      'show in dollars',
      'show this month'
    ];

    for (const command of syncCommands) {
      try {
        await this.sendCommand(command);
        await this.page.waitForTimeout(3000);

        // Check if buttons are properly synchronized
        const buttonStates = await this.page.evaluate(() => {
          const dateButtons = Array.from(document.querySelectorAll('[data-testid^="date-range-"]'));
          const displayButtons = Array.from(document.querySelectorAll('[data-testid^="display-mode-"]'));

          return {
            dateButtons: dateButtons.map(btn => ({
              testId: btn.getAttribute('data-testid'),
              active: btn.getAttribute('data-active') === 'true',
              bgGold: btn.style.backgroundColor?.includes('B8860B') ||
                     getComputedStyle(btn).backgroundColor?.includes('B8860B')
            })),
            displayButtons: displayButtons.map(btn => ({
              testId: btn.getAttribute('data-testid'),
              active: btn.getAttribute('data-active') === 'true',
              bgGold: btn.style.backgroundColor?.includes('B8860B') ||
                     getComputedStyle(btn).backgroundColor?.includes('B8860B')
            }))
          };
        });

        const hasActiveButton = buttonStates.dateButtons.some(b => b.active || b.bgGold) ||
                               buttonStates.displayButtons.some(b => b.active || b.bgGold);

        console.log(`"${command}": ${hasActiveButton ? '✅' : '❌'} (buttons synced)`);

        if (hasActiveButton) {
          this.testResults.uiSync.passed++;
        } else {
          this.testResults.uiSync.failed++;
        }

        this.testResults.uiSync.results.push({
          command,
          buttonStates,
          hasActiveButton
        });

      } catch (error) {
        console.log(`❌ UI sync test error: ${error.message}`);
        this.testResults.uiSync.failed++;
      }
    }
  }

  generateReport() {
    console.log('\n📋 BULLETPROOF RENATA TEST REPORT');
    console.log('='.repeat(50));

    const categories = [
      { name: 'Multi-command Processing', results: this.testResults.multiCommand },
      { name: 'Pattern Matching', results: this.testResults.patternMatching },
      { name: 'State Changes', results: this.testResults.stateChanges },
      { name: 'Error Handling', results: this.testResults.errorHandling },
      { name: 'UI Synchronization', results: this.testResults.uiSync }
    ];

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    console.log('\n📊 CATEGORY RESULTS:');
    for (const category of categories) {
      const passed = category.results.passed;
      const failed = category.results.failed;
      const total = passed + failed;
      const rate = total > 0 ? ((passed/total)*100).toFixed(1) : '0.0';

      totalTests += total;
      totalPassed += passed;
      totalFailed += failed;

      console.log(`  ${category.name}: ${passed}/${total} (${rate}%)`);
      if (failed > 0) {
        console.log(`    ❌ ${failed} failed cases`);
      }
    }

    const overallRate = totalTests > 0 ? ((totalPassed/totalTests)*100).toFixed(1) : '0.0';

    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed} (${overallRate}%)`);
    console.log(`  Failed: ${totalFailed}`);

    // Production readiness assessment
    const criticalCategories = ['Multi-command Processing', 'State Changes', 'Pattern Matching'];
    const criticalPassed = criticalCategories.reduce((sum, cat) => {
      const catResults = categories.find(c => c.name === cat)?.results;
      return sum + (catResults?.passed || 0);
    }, 0);
    const criticalTotal = criticalCategories.reduce((sum, cat) => {
      const catResults = categories.find(c => c.name === cat)?.results;
      return sum + (catResults?.passed || 0) + (catResults?.failed || 0);
    }, 0);
    const criticalRate = criticalTotal > 0 ? (criticalPassed/criticalTotal) : 0;

    console.log(`\n🚀 PRODUCTION READINESS:`);
    if (criticalRate >= 0.95) {
      console.log('✅ BULLETPROOF - Ready for production!');
    } else if (criticalRate >= 0.85) {
      console.log('⚠️  MOSTLY READY - Minor issues to address');
    } else {
      console.log('❌ NOT READY - Significant issues found');
    }

    console.log(`\n📝 SUMMARY:`);
    console.log(`  Core functionality success rate: ${(criticalRate*100).toFixed(1)}%`);
    console.log(`  Overall system stability: ${overallRate}%`);
    console.log(`  Error handling robustness: ${((this.testResults.errorHandling.passed/(this.testResults.errorHandling.passed+this.testResults.errorHandling.failed))*100).toFixed(1)}%`);

    return {
      totalTests,
      totalPassed,
      totalFailed,
      overallRate: parseFloat(overallRate),
      criticalRate: criticalRate * 100,
      productionReady: criticalRate >= 0.95
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the test
async function runBulletproofTest() {
  const testSuite = new BulletproofRenataTest();

  try {
    await testSuite.init();

    await testSuite.testMultiCommandProcessing();
    await testSuite.testPatternMatching();
    await testSuite.testStateChangeVerification();
    await testSuite.testErrorHandling();
    await testSuite.testUISynchronization();

    const report = testSuite.generateReport();

    console.log('\n🎯 Test completed!');
    return report;

  } catch (error) {
    console.error('💥 Test failed:', error);
    return null;
  } finally {
    await testSuite.cleanup();
  }
}

if (require.main === module) {
  runBulletproofTest()
    .then(report => {
      if (report) {
        console.log(`\nFinal result: ${report.totalPassed}/${report.totalTests} passed (${report.overallRate.toFixed(1)}%)`);
        console.log(`Production ready: ${report.productionReady ? 'YES ✅' : 'NO ❌'}`);
        process.exit(report.productionReady ? 0 : 1);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

module.exports = { BulletproofRenataTest, runBulletproofTest };