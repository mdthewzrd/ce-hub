/**
 * Comprehensive Renata Chat System Testing Suite
 * Tests all command types, pattern matching, state changes, and edge cases
 */

const { chromium } = require('playwright');

class ComprehensiveRenataTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      multiCommand: { passed: 0, failed: 0, results: [] },
      patternMatching: { passed: 0, failed: 0, results: [] },
      stateChanges: { passed: 0, failed: 0, results: [] },
      errorHandling: { passed: 0, failed: 0, results: [] },
      edgeCases: { passed: 0, failed: 0, results: [] },
      apiIntegration: { passed: 0, failed: 0, results: [] }
    };
  }

  async init() {
    console.log('🚀 Initializing Comprehensive Renata Test Suite...');
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1000 // Slow down for better observation
    });
    this.page = await this.browser.newPage();

    // Set up console logging to capture debug info
    this.page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('✅') ||
          msg.text().includes('❌') || msg.text().includes('🔍') ||
          msg.text().includes('📦') || msg.text().includes('🚀')) {
        console.log('BROWSER:', msg.text());
      }
    });

    // Navigate to dashboard
    await this.page.goto('http://localhost:6565/dashboard', { timeout: 15000 });
    await this.page.waitForTimeout(3000);

    // Open Renata sidebar
    await this.openRenataSidebar();
  }

  async openRenataSidebar() {
    console.log('🔍 Opening Renata sidebar...');

    const selectors = [
      'button:has-text("AI")',
      'button[title*="AI"]',
      'button[aria-label*="AI"]',
      'button:has([class*="brain"])',
      'nav button',
      'header button'
    ];

    for (const selector of selectors) {
      try {
        const buttons = await this.page.$$(selector);
        for (const button of buttons) {
          const text = await button.textContent();
          const innerHTML = await button.innerHTML();

          if (innerHTML.includes('brain') || innerHTML.includes('Brain') ||
              text?.toLowerCase().includes('ai')) {
            await button.click();
            await this.page.waitForTimeout(2000);
            console.log('✅ Renata sidebar opened');
            return;
          }
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error('Could not find Renata AI toggle button');
  }

  async sendCommand(command) {
    console.log(`📤 Sending command: "${command}"`);

    // Find the input field
    const inputSelector = 'input[data-testid="renata-chat-input"], input[placeholder*="Ask Renata"]';
    await this.page.waitForSelector(inputSelector, { timeout: 5000 });

    // Clear input and type command
    await this.page.fill(inputSelector, '');
    await this.page.type(inputSelector, command);

    // Click send button
    const sendSelector = 'button[data-testid="renata-chat-send-button"], button[type="submit"]';
    await this.page.click(sendSelector);

    // Wait for response
    await this.page.waitForTimeout(3000);

    // Get the last assistant message
    const messages = await this.page.$$eval('.space-y-4 > div', elements =>
      elements.map(el => {
        const isUser = el.classList.contains('justify-end');
        const textContent = el.textContent?.trim();
        return { isUser, textContent };
      })
    );

    // Find the last assistant message
    const assistantMessages = messages.filter(m => !m.isUser);
    return assistantMessages[assistantMessages.length - 1]?.textContent || '';
  }

  async getCurrentState() {
    return await this.page.evaluate(() => {
      return {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange?.label,
        displayMode: window.displayModeContext?.displayMode,
        dateRangeValue: window.dateRangeContext?.selectedRange,
        displayModeValue: window.displayModeContext?.displayMode
      };
    });
  }

  // Test 1: Multi-command Processing
  async testMultiCommandProcessing() {
    console.log('\n🧪 Testing Multi-command Processing...');

    const testCases = [
      {
        command: 'go to the dashboard and look at the last 90 days in R',
        expectedActions: ['navigation', 'date_range', 'display_mode'],
        expectedPage: '/dashboard',
        expectedDateRange: '90day',
        expectedDisplayMode: 'r'
      },
      {
        command: 'show me statistics in dollars for this month',
        expectedActions: ['navigation', 'date_range', 'display_mode'],
        expectedPage: '/statistics',
        expectedDateRange: 'month',
        expectedDisplayMode: 'dollar'
      },
      {
        command: 'take me to trades view with all time data in R mode',
        expectedActions: ['navigation', 'date_range', 'display_mode'],
        expectedPage: '/trades',
        expectedDateRange: 'all',
        expectedDisplayMode: 'r'
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`\n🔍 Testing: "${testCase.command}"`);

        const initialState = await this.getCurrentState();
        const response = await this.sendCommand(testCase.command);
        await this.page.waitForTimeout(2000); // Wait for state changes
        const finalState = await this.getCurrentState();

        console.log('📊 Initial state:', initialState);
        console.log('📊 Final state:', finalState);
        console.log('📤 Response:', response);

        const results = {
          command: testCase.command,
          expected: testCase,
          actual: finalState,
          response,
          navigationCorrect: finalState.url === testCase.expectedPage,
          dateRangeCorrect: finalState.dateRangeValue === testCase.expectedDateRange,
          displayModeCorrect: finalState.displayModeValue === testCase.expectedDisplayMode,
          hasSuccessResponse: response.includes('✅') || response.includes('Perfect')
        };

        const allPassed = results.navigationCorrect &&
                          results.dateRangeCorrect &&
                          results.displayModeCorrect &&
                          results.hasSuccessResponse;

        if (allPassed) {
          console.log('✅ Multi-command test PASSED');
          this.testResults.multiCommand.passed++;
        } else {
          console.log('❌ Multi-command test FAILED');
          console.log('  Navigation:', results.navigationCorrect ? '✅' : '❌');
          console.log('  Date range:', results.dateRangeCorrect ? '✅' : '❌');
          console.log('  Display mode:', results.displayModeCorrect ? '✅' : '❌');
          console.log('  Response success:', results.hasSuccessResponse ? '✅' : '❌');
          this.testResults.multiCommand.failed++;
        }

        this.testResults.multiCommand.results.push(results);

      } catch (error) {
        console.log(`❌ Multi-command test ERROR: ${error.message}`);
        this.testResults.multiCommand.failed++;
        this.testResults.multiCommand.results.push({
          command: testCase.command,
          error: error.message,
          passed: false
        });
      }
    }
  }

  // Test 2: Pattern Matching Coverage
  async testPatternMatching() {
    console.log('\n🧪 Testing Pattern Matching Coverage...');

    const patternTests = [
      // Display mode patterns
      { command: 'show in R', expectedMode: 'r', category: 'display_mode' },
      { command: 'switch to dollars', expectedMode: 'dollar', category: 'display_mode' },
      { command: 'view in percentage', expectedMode: 'percent', category: 'display_mode' },
      { command: 'in multiple of R', expectedMode: 'r', category: 'display_mode' },
      { command: 'actual amounts', expectedMode: 'dollar', category: 'display_mode' },
      { command: 'show percentages', expectedMode: 'percent', category: 'display_mode' },

      // Date range patterns
      { command: 'today only', expectedRange: 'today', category: 'date_range' },
      { command: 'this week', expectedRange: 'week', category: 'date_range' },
      { command: 'last 90 days', expectedRange: '90day', category: 'date_range' },
      { command: 'past 90 days', expectedRange: '90day', category: 'date_range' },
      { command: 'year to date', expectedRange: 'year', category: 'date_range' },
      { command: 'ytd', expectedRange: 'year', category: 'date_range' },
      { command: 'all time', expectedRange: 'all', category: 'date_range' },
      { command: 'this month', expectedRange: 'month', category: 'date_range' },
      { command: 'last month', expectedRange: 'lastMonth', category: 'date_range' },

      // Navigation patterns
      { command: 'go to dashboard', expectedPage: '/dashboard', category: 'navigation' },
      { command: 'show statistics', expectedPage: '/statistics', category: 'navigation' },
      { command: 'view trades', expectedPage: '/trades', category: 'navigation' },
      { command: 'open journal', expectedPage: '/journal', category: 'navigation' },
      { command: 'main page', expectedPage: '/dashboard', category: 'navigation' },
      { command: 'stats', expectedPage: '/statistics', category: 'navigation' }
    ];

    for (const test of patternTests) {
      try {
        console.log(`🔍 Testing pattern: "${test.command}" (${test.category})`);

        const initialState = await this.getCurrentState();
        const response = await this.sendCommand(test.command);
        await this.page.waitForTimeout(2000);
        const finalState = await this.getCurrentState();

        let passed = false;
        switch (test.category) {
          case 'display_mode':
            passed = finalState.displayModeValue === test.expectedMode;
            break;
          case 'date_range':
            passed = finalState.dateRangeValue === test.expectedRange;
            break;
          case 'navigation':
            passed = finalState.url === test.expectedPage;
            break;
        }

        const result = {
          command: test.command,
          category: test.category,
          expected: test,
          actual: finalState,
          passed,
          response
        };

        if (passed) {
          console.log('✅ Pattern match PASSED');
          this.testResults.patternMatching.passed++;
        } else {
          console.log('❌ Pattern match FAILED');
          console.log(`  Expected ${test.category}:`, test['expected' + test.category.charAt(0).toUpperCase() + test.category.slice(1)]);
          console.log(`  Actual:`, finalState);
          this.testResults.patternMatching.failed++;
        }

        this.testResults.patternMatching.results.push(result);

      } catch (error) {
        console.log(`❌ Pattern test ERROR: ${error.message}`);
        this.testResults.patternMatching.failed++;
        this.testResults.patternMatching.results.push({
          command: test.command,
          error: error.message,
          passed: false
        });
      }
    }
  }

  // Test 3: State Change Verification
  async testStateChangeVerification() {
    console.log('\n🧪 Testing State Change Verification...');

    const stateTests = [
      {
        name: 'Date range change persistence',
        actions: [
          { command: 'show last 90 days', verifyState: true },
          { command: 'show today only', verifyState: true },
          { command: 'show this month', verifyState: true }
        ]
      },
      {
        name: 'Display mode change persistence',
        actions: [
          { command: 'switch to R mode', verifyState: true },
          { command: 'show in dollars', verifyState: true },
          { command: 'view in percentages', verifyState: true }
        ]
      },
      {
        name: 'Combined state changes',
        actions: [
          { command: 'go to statistics in R for last 90 days', verifyState: true },
          { command: 'dashboard in dollars for this month', verifyState: true }
        ]
      }
    ];

    for (const testGroup of stateTests) {
      console.log(`\n🔍 Testing: ${testGroup.name}`);

      try {
        for (const action of testGroup.actions) {
          const beforeState = await this.getCurrentState();
          const response = await this.sendCommand(action.command);
          await this.page.waitForTimeout(3000); // Wait for React updates
          const afterState = await this.getCurrentState();

          // Verify state actually changed
          const stateChanged = JSON.stringify(beforeState) !== JSON.stringify(afterState);
          const hasSuccessResponse = response.includes('✅') || response.includes('Perfect');

          const result = {
            command: action.command,
            beforeState,
            afterState,
            stateChanged,
            hasSuccessResponse,
            passed: stateChanged && hasSuccessResponse
          };

          if (result.passed) {
            console.log(`✅ State change verified: "${action.command}"`);
            this.testResults.stateChanges.passed++;
          } else {
            console.log(`❌ State change failed: "${action.command}"`);
            console.log(`  State changed: ${result.stateChanged ? '✅' : '❌'}`);
            console.log(`  Success response: ${result.hasSuccessResponse ? '✅' : '❌'}`);
            this.testResults.stateChanges.failed++;
          }

          this.testResults.stateChanges.results.push(result);
        }
      } catch (error) {
        console.log(`❌ State change test ERROR: ${error.message}`);
        this.testResults.stateChanges.failed++;
      }
    }
  }

  // Test 4: Error Handling
  async testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...');

    const errorTests = [
      {
        name: 'Invalid command',
        commands: ['do something random', 'invalid command xyz', 'blah blah blah']
      },
      {
        name: 'Conflicting commands',
        commands: ['go to dashboard and also go to statistics', 'show in R and also in dollars']
      },
      {
        name: 'Ambiguous commands',
        commands: ['change it', 'show different', 'move somewhere']
      },
      {
        name: 'Edge case phrases',
        commands: ['', '   ', 'r', 'go', 'show', 'in']
      }
    ];

    for (const errorTest of errorTests) {
      console.log(`\n🔍 Testing: ${errorTest.name}`);

      for (const command of errorTest.commands) {
        try {
          console.log(`📤 Testing error case: "${command}"`);

          const response = await this.sendCommand(command);

          // Check for graceful error handling
          const hasErrorResponse = response.includes('Sorry') ||
                                  response.includes('couldn\'t') ||
                                  response.includes('try again') ||
                                  response.includes('I understood') ||
                                  response.includes('not sure');

          const graceful = hasErrorResponse || response.length > 10; // Meaningful response

          const result = {
            command,
            response,
            graceful,
            passed: graceful
          };

          if (result.passed) {
            console.log(`✅ Error handled gracefully for: "${command}"`);
            this.testResults.errorHandling.passed++;
          } else {
            console.log(`❌ Poor error handling for: "${command}"`);
            console.log(`  Response: "${response}"`);
            this.testResults.errorHandling.failed++;
          }

          this.testResults.errorHandling.results.push(result);

        } catch (error) {
          console.log(`❌ Error test ERROR: ${error.message}`);
          this.testResults.errorHandling.failed++;
        }
      }
    }
  }

  // Test 5: API Integration (Backend fallback)
  async testAPIIntegration() {
    console.log('\n🧪 Testing API Integration and Fallback...');

    try {
      // Test if backend API is accessible
      const apiHealth = await this.page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:6500/health');
          return { status: response.status, ok: response.ok };
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log('🔍 Backend API health:', apiHealth);

      if (apiHealth.ok) {
        // Test with backend available
        const response = await this.sendCommand('show me last 90 days in R mode');
        const usesAI = response.includes('AI') || response.includes('intelligent');

        this.testResults.apiIntegration.results.push({
          test: 'Backend Available',
          status: 'success',
          usesAI,
          response
        });

        if (usesAI) {
          console.log('✅ Backend AI integration working');
          this.testResults.apiIntegration.passed++;
        } else {
          console.log('⚠️ Backend available but not being used');
          this.testResults.apiIntegration.failed++;
        }
      } else {
        // Test fallback behavior when backend is down
        console.log('⚠️ Backend not available, testing fallback...');

        const fallbackCommands = [
          'show last 90 days in R',
          'go to statistics in dollars',
          'show this month data'
        ];

        for (const command of fallbackCommands) {
          const response = await this.sendCommand(command);
          const usesFallback = response.includes('✅') ||
                              response.includes('Perfect') ||
                              response.includes('I\'ve');

          if (usesFallback) {
            console.log(`✅ Fallback working for: "${command}"`);
            this.testResults.apiIntegration.passed++;
          } else {
            console.log(`❌ Fallback failed for: "${command}"`);
            this.testResults.apiIntegration.failed++;
          }

          this.testResults.apiIntegration.results.push({
            test: 'Fallback',
            command,
            usesFallback,
            response
          });
        }
      }
    } catch (error) {
      console.log(`❌ API integration test ERROR: ${error.message}`);
      this.testResults.apiIntegration.failed++;
    }
  }

  // Test 6: UI Synchronization
  async testUISynchronization() {
    console.log('\n🧪 Testing UI Synchronization...');

    try {
      // Test button state synchronization
      const testCommands = [
        'show last 90 days',  // Should highlight 90day button
        'show in R',         // Should highlight R button
        'show in dollars',   // Should highlight $ button
        'show this month'    // Should highlight month button
      ];

      for (const command of testCommands) {
        console.log(`🔍 Testing UI sync for: "${command}"`);

        await this.sendCommand(command);
        await this.page.waitForTimeout(3000);

        // Check button states
        const buttonStates = await this.page.evaluate(() => {
          const dateButtons = Array.from(document.querySelectorAll('[data-testid^="date-range-"]'));
          const displayButtons = Array.from(document.querySelectorAll('[data-testid^="display-mode-"]'));

          return {
            dateButtons: dateButtons.map(btn => ({
              testId: btn.getAttribute('data-testid'),
              active: btn.getAttribute('data-active') === 'true',
              bgColor: btn.style.backgroundColor
            })),
            displayButtons: displayButtons.map(btn => ({
              testId: btn.getAttribute('data-testid'),
              active: btn.getAttribute('data-active') === 'true',
              bgColor: btn.style.backgroundColor
            }))
          };
        });

        console.log('📊 Button states:', JSON.stringify(buttonStates, null, 2));

        // Check if appropriate buttons are active
        const hasActiveDateButton = buttonStates.dateButtons.some(btn => btn.active);
        const hasActiveDisplayButton = buttonStates.displayButtons.some(btn => btn.active);

        const syncWorking = hasActiveDateButton || hasActiveDisplayButton;

        if (syncWorking) {
          console.log(`✅ UI synchronization working for: "${command}"`);
          this.testResults.edgeCases.passed++;
        } else {
          console.log(`❌ UI synchronization failed for: "${command}"`);
          this.testResults.edgeCases.failed++;
        }

        this.testResults.edgeCases.results.push({
          command,
          buttonStates,
          syncWorking
        });
      }
    } catch (error) {
      console.log(`❌ UI sync test ERROR: ${error.message}`);
      this.testResults.edgeCases.failed++;
    }
  }

  async generateReport() {
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(50));

    const totalTests = Object.values(this.testResults).reduce((sum, category) =>
      sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(this.testResults).reduce((sum, category) =>
      sum + category.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, category) =>
      sum + category.failed, 0);

    console.log(`\n📊 OVERALL RESULTS:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
    console.log(`  Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`);

    console.log(`\n📋 CATEGORY BREAKDOWN:`);

    const categories = {
      'Multi-command Processing': this.testResults.multiCommand,
      'Pattern Matching': this.testResults.patternMatching,
      'State Changes': this.testResults.stateChanges,
      'Error Handling': this.testResults.errorHandling,
      'API Integration': this.testResults.apiIntegration,
      'UI Synchronization': this.testResults.edgeCases
    };

    for (const [name, results] of Object.entries(categories)) {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed/total)*100).toFixed(1) : '0.0';
      console.log(`  ${name}: ${results.passed}/${total} (${passRate}%)`);

      if (results.failed > 0) {
        console.log(`    ❌ Failed cases: ${results.failed}`);
      }
    }

    // Detailed failure analysis
    console.log(`\n🔍 DETAILED FAILURE ANALYSIS:`);
    let hasFailures = false;

    for (const [category, results] of Object.entries(categories)) {
      if (results.failed > 0) {
        hasFailures = true;
        console.log(`\n❌ ${category} Failures:`);

        const failedTests = results.results.filter(r => r.error || r.passed === false);
        for (const failed of failedTests) {
          if (failed.error) {
            console.log(`  • "${failed.command}" - ERROR: ${failed.error}`);
          } else if (failed.expected && failed.actual) {
            console.log(`  • "${failed.command}" - STATE MISMATCH`);
            console.log(`    Expected: ${JSON.stringify(failed.expected)}`);
            console.log(`    Actual: ${JSON.stringify(failed.actual)}`);
          } else {
            console.log(`  • "${failed.command || failed.test}" - FAILED`);
          }
        }
      }
    }

    if (!hasFailures) {
      console.log('🎉 NO FAILURES DETECTED!');
    }

    // Production readiness assessment
    console.log(`\n🚀 PRODUCTION READINESS ASSESSMENT:`);

    const criticalCategories = ['Multi-command Processing', 'State Changes', 'Pattern Matching'];
    const criticalPassed = criticalCategories.reduce((sum, cat) =>
      sum + categories[cat].passed, 0);
    const criticalTotal = criticalCategories.reduce((sum, cat) =>
      sum + categories[cat].passed + categories[cat].failed, 0);
    const criticalRate = criticalTotal > 0 ? (criticalPassed/criticalTotal) : 0;

    if (criticalRate >= 0.95) {
      console.log('✅ PRODUCTION READY - Core functionality bulletproof');
    } else if (criticalRate >= 0.85) {
      console.log('⚠️  MOSTLY READY - Minor issues to address');
    } else {
      console.log('❌ NOT READY - Significant issues found');
    }

    console.log(`\n📝 RECOMMENDATIONS:`);

    if (this.testResults.multiCommand.failed > 0) {
      console.log('• Fix multi-command processing logic');
    }
    if (this.testResults.stateChanges.failed > 0) {
      console.log('• Improve state synchronization and verification');
    }
    if (this.testResults.patternMatching.failed > 0) {
      console.log('• Expand pattern matching for better recognition');
    }
    if (this.testResults.errorHandling.failed > 0) {
      console.log('• Enhance error handling and user feedback');
    }
    if (this.testResults.apiIntegration.failed > 0) {
      console.log('• Ensure robust fallback mechanisms');
    }
    if (this.testResults.edgeCases.failed > 0) {
      console.log('• Improve UI synchronization and edge case handling');
    }

    if (totalFailed === 0) {
      console.log('🎉 All tests passed! System is bulletproof.');
    }

    return {
      totalTests,
      totalPassed,
      totalFailed,
      passRate: (totalPassed/totalTests)*100,
      criticalRate: criticalRate*100,
      productionReady: criticalRate >= 0.95
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main test runner
async function runComprehensiveTests() {
  const testSuite = new ComprehensiveRenataTest();

  try {
    await testSuite.init();

    await testSuite.testMultiCommandProcessing();
    await testSuite.testPatternMatching();
    await testSuite.testStateChangeVerification();
    await testSuite.testErrorHandling();
    await testSuite.testAPIIntegration();
    await testSuite.testUISynchronization();

    const report = await testSuite.generateReport();

    console.log('\n🎯 Test suite completed!');
    return report;

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return null;
  } finally {
    await testSuite.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests()
    .then(report => {
      if (report) {
        console.log(`\nFinal result: ${report.totalPassed}/${report.totalTests} passed (${report.passRate.toFixed(1)}%)`);
        console.log(`Production ready: ${report.productionReady ? 'YES ✅' : 'NO ❌'}`);
        process.exit(report.productionReady ? 0 : 1);
      } else {
        console.log('Test execution failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}

module.exports = { ComprehensiveRenataTest, runComprehensiveTests };