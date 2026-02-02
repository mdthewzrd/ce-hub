/**
 * TRADERERA AI JOURNAL - COMPREHENSIVE RENATA VALIDATION SUITE
 *
 * This suite tests all Renata AI chat functionality including:
 * - Command parsing and recognition
 * - State changes (display mode, date range, navigation)
 * - AI mode switching (analyst, coach, mentor)
 * - UI updates and visual confirmation
 * - Error handling and recovery
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:6565';
const SCREENSHOT_DIR = './traderra-validation-screenshots';
const TEST_RESULTS_FILE = './traderra-validation-results.json';

// Test commands to validate
const TEST_COMMANDS = [
  {
    name: 'Display Mode - R Multiple',
    command: 'switch to r',
    expectedStateChange: 'display_mode',
    expectedMode: 'r',
    description: 'Should switch display mode to R-multiples'
  },
  {
    name: 'Display Mode - In R',
    command: 'show me year to date in r',
    expectedStateChange: ['display_mode', 'date_range'],
    expectedMode: 'r',
    expectedRange: 'ytd',
    description: 'Should switch to R-multiples AND set YTD date range'
  },
  {
    name: 'Display Mode - Dollars',
    command: 'switch to dollars',
    expectedStateChange: 'display_mode',
    expectedMode: 'dollar',
    description: 'Should switch display mode to dollars'
  },
  {
    name: 'Display Mode - Percentage',
    command: 'show in percent',
    expectedStateChange: 'display_mode',
    expectedMode: 'percent',
    description: 'Should switch display mode to percentage'
  },
  {
    name: 'Date Range - Year to Date',
    command: 'year to date',
    expectedStateChange: 'date_range',
    expectedRange: 'ytd',
    description: 'Should set date range to YTD'
  },
  {
    name: 'Date Range - YTD',
    command: 'show YTD',
    expectedStateChange: 'date_range',
    expectedRange: 'ytd',
    description: 'Should set date range to YTD (alternative command)'
  },
  {
    name: 'Date Range - Last 3 Months',
    command: 'last 3 months',
    expectedStateChange: 'date_range',
    expectedRange: 'last3months',
    description: 'Should set date range to last 3 months'
  },
  {
    name: 'Navigation - Dashboard',
    command: 'go to dashboard',
    expectedStateChange: 'navigation',
    expectedPage: 'dashboard',
    description: 'Should navigate to dashboard'
  },
  {
    name: 'Navigation - Journal',
    command: 'journal',
    expectedStateChange: 'navigation',
    expectedPage: 'journal',
    description: 'Should navigate to journal'
  },
  {
    name: 'Navigation - Stats',
    command: 'show stats',
    expectedStateChange: 'navigation',
    expectedPage: 'stats',
    description: 'Should navigate to statistics'
  },
  {
    name: 'AI Mode - Analyst',
    command: 'use analyst mode',
    expectedStateChange: 'ai_mode',
    expectedAiMode: 'analyst',
    description: 'Should switch to analyst mode'
  },
  {
    name: 'AI Mode - Coach',
    command: 'coach mode',
    expectedStateChange: 'ai_mode',
    expectedAiMode: 'coach',
    description: 'Should switch to coach mode'
  },
  {
    name: 'AI Mode - Mentor',
    command: 'switch to mentor mode',
    expectedStateChange: 'ai_mode',
    expectedAiMode: 'mentor',
    description: 'Should switch to mentor mode'
  },
  {
    name: 'Complex Command - Combined',
    command: 'show YTD in R analyst mode',
    expectedStateChange: ['display_mode', 'date_range', 'ai_mode'],
    expectedMode: 'r',
    expectedRange: 'ytd',
    expectedAiMode: 'analyst',
    description: 'Should do all three: switch to R, set YTD, enable analyst mode'
  }
];

class TraderraValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      summary: { total: 0, passed: 0, failed: 0 },
      tests: []
    };
  }

  async init() {
    console.log('🚀 Initializing Traderra Validation Suite...');

    // Create screenshots directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Set to true for CI/CD
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1400, height: 900 });

    console.log('✅ Browser initialized');
  }

  async navigateToApp() {
    console.log(`📍 Navigating to ${BASE_URL}...`);

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });

      // Wait for app to load
      await this.page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });

      // Take initial screenshot
      await this.takeScreenshot('01-initial-load');

      console.log('✅ Traderra app loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load Traderra app:', error);
      return false;
    }
  }

  async locateRenataChat() {
    console.log('🔍 Locating Renata chat interface...');

    try {
      // Look for chat input (multiple possible selectors)
      const chatSelectors = [
        '[data-testid="renata-chat-input"]',
        'input[placeholder*="Renata"]',
        'textarea[placeholder*="chat"]',
        '.renata-chat-input',
        'input[type="text"]',
        'textarea'
      ];

      let chatInput = null;
      for (const selector of chatSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          chatInput = await this.page.$(selector);
          if (chatInput) {
            console.log(`✅ Found chat input: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }

      if (!chatInput) {
        throw new Error('Chat input not found');
      }

      return chatInput;
    } catch (error) {
      console.error('❌ Failed to locate Renata chat:', error);
      return null;
    }
  }

  async sendCommand(command) {
    console.log(`💬 Sending command: "${command}"`);

    try {
      const chatInput = await this.locateRenataChat();
      if (!chatInput) {
        return { success: false, error: 'Chat input not found' };
      }

      // Clear input and type command
      await chatInput.clear();
      await chatInput.type(command, { delay: 100 });

      // Take screenshot before sending
      await this.takeScreenshot(`before-${command.replace(/[^a-z0-9]/gi, '-')}`);

      // Look for send button
      const sendSelectors = [
        'button[type="submit"]',
        'button[aria-label*="send"]',
        'button[aria-label*="Send"]',
        '.send-button',
        '[data-testid="send-button"]'
      ];

      let sendButton = null;
      for (const selector of sendSelectors) {
        sendButton = await this.page.$(selector);
        if (sendButton) break;
      }

      if (sendButton) {
        await sendButton.click();
      } else {
        // Try pressing Enter
        await chatInput.press('Enter');
      }

      console.log('✅ Command sent');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to send command:', error);
      return { success: false, error: error.message };
    }
  }

  async waitForResponse(maxWaitTime = 8000) {
    console.log('⏳ Waiting for Renata response...');

    try {
      // Wait for response indicators
      const responseSelectors = [
        '[data-testid="renata-response"]',
        '.renata-response',
        '.ai-message',
        '.chat-response',
        '.message-content'
      ];

      let response = null;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        for (const selector of responseSelectors) {
          try {
            const elements = await this.page.$$(selector);
            if (elements.length > 0) {
              const lastElement = elements[elements.length - 1];
              const text = await lastElement.textContent();
              if (text && text.trim().length > 0) {
                response = text.trim();
                console.log(`✅ Response received: ${response.substring(0, 100)}...`);
                return { success: true, response };
              }
            }
          } catch (e) {
            // Continue checking
          }
        }

        await this.page.waitForTimeout(500);
      }

      throw new Error('Response timeout');

    } catch (error) {
      console.error('❌ Failed to get response:', error);
      return { success: false, error: error.message };
    }
  }

  async validateStateChange(testCase, commandResult, responseResult) {
    console.log(`🔍 Validating state changes for: ${testCase.name}`);

    const validation = {
      displayModeChanged: false,
      dateRangeChanged: false,
      navigationSucceeded: false,
      aiModeChanged: false,
      uiUpdatesVisible: false
    };

    try {
      // Check for display mode changes
      if (testCase.expectedStateChange.includes('display_mode') || testCase.expectedStateChange === 'display_mode') {
        // Look for R-mode indicators
        const rIndicators = [
          'R-multiple',
          'R multiple',
          'R‑multiple',
          'Mode: R',
          'displaying in R'
        ];

        const dollarIndicators = [
          'Dollar',
          '$',
          'Mode: $',
          'displaying in $'
        ];

        const percentIndicators = [
          'Percent',
          '%',
          'Mode: %',
          'displaying in %'
        ];

        const pageText = await this.page.textContent('body');

        if (testCase.expectedMode === 'r' && rIndicators.some(indicator => pageText.includes(indicator))) {
          validation.displayModeChanged = true;
          console.log('✅ R-multiple mode detected');
        } else if (testCase.expectedMode === 'dollar' && dollarIndicators.some(indicator => pageText.includes(indicator))) {
          validation.displayModeChanged = true;
          console.log('✅ Dollar mode detected');
        } else if (testCase.expectedMode === 'percent' && percentIndicators.some(indicator => pageText.includes(indicator))) {
          validation.displayModeChanged = true;
          console.log('✅ Percent mode detected');
        }
      }

      // Check for date range changes
      if (testCase.expectedStateChange.includes('date_range') || testCase.expectedStateChange === 'date_range') {
        const dateIndicators = {
          'ytd': ['Year to Date', 'YTD', 'year-to-date', 'This Year'],
          'last3months': ['Last 3 months', '3 months', 'Past 3 months'],
          'last6months': ['Last 6 months', '6 months', 'Past 6 months'],
          'thismonth': ['This Month', 'Month to Date'],
          'lastmonth': ['Last Month', 'Previous Month']
        };

        const pageText = await this.page.textContent('body');
        const expectedIndicators = dateIndicators[testCase.expectedRange] || [];

        if (expectedIndicators.some(indicator => pageText.includes(indicator))) {
          validation.dateRangeChanged = true;
          console.log(`✅ Date range ${testCase.expectedRange} detected`);
        }
      }

      // Check for navigation
      if (testCase.expectedStateChange.includes('navigation') || testCase.expectedStateChange === 'navigation') {
        const currentUrl = this.page.url();
        if (currentUrl.includes(testCase.expectedPage)) {
          validation.navigationSucceeded = true;
          console.log(`✅ Navigation to ${testCase.expectedPage} successful`);
        }
      }

      // Check for AI mode changes (would need to check response content or UI indicators)
      if (testCase.expectedStateChange.includes('ai_mode') || testCase.expectedStateChange === 'ai_mode') {
        // This would require checking the response for AI mode confirmation
        if (responseResult.success && responseResult.response) {
          const responseText = responseResult.response.toLowerCase();
          if (testCase.expectedAiMode === 'analyst' && responseText.includes('analyst')) {
            validation.aiModeChanged = true;
            console.log('✅ Analyst mode confirmed');
          } else if (testCase.expectedAiMode === 'coach' && responseText.includes('coach')) {
            validation.aiModeChanged = true;
            console.log('✅ Coach mode confirmed');
          } else if (testCase.expectedAiMode === 'mentor' && responseText.includes('mentor')) {
            validation.aiModeChanged = true;
            console.log('✅ Mentor mode confirmed');
          }
        }
      }

      // General UI update check (did anything change?)
      validation.uiUpdatesVisible = Object.values(validation).some(v => v === true);

      return validation;

    } catch (error) {
      console.error('❌ Error validating state changes:', error);
      return validation;
    }
  }

  async takeScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}-${name}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);

      await this.page.screenshot({
        path: filepath,
        fullPage: true
      });

      console.log(`📸 Screenshot saved: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error);
      return null;
    }
  }

  async runTest(testCase) {
    console.log(`\n🧪 Running test: ${testCase.name}`);
    console.log(`📝 Command: "${testCase.command}"`);
    console.log(`📋 Description: ${testCase.description}`);

    const testResult = {
      name: testCase.name,
      command: testCase.command,
      description: testCase.description,
      timestamp: new Date().toISOString(),
      success: false,
      commandSent: false,
      responseReceived: false,
      stateChangeValidated: false,
      validation: {},
      screenshots: [],
      errors: []
    };

    try {
      // Step 1: Send command
      const commandResult = await this.sendCommand(testCase.command);
      testResult.commandSent = commandResult.success;
      if (!commandResult.success) {
        testResult.errors.push(`Command failed: ${commandResult.error}`);
      }

      // Step 2: Wait for response
      const responseResult = await this.waitForResponse();
      testResult.responseReceived = responseResult.success;
      if (!responseResult.success) {
        testResult.errors.push(`Response failed: ${responseResult.error}`);
      }

      // Step 3: Wait a bit for UI updates
      await this.page.waitForTimeout(2000);

      // Step 4: Take "after" screenshot
      const afterScreenshot = await this.takeScreenshot(`after-${testCase.name.replace(/[^a-z0-9]/gi, '-')}`);
      if (afterScreenshot) {
        testResult.screenshots.push(afterScreenshot);
      }

      // Step 5: Validate state changes
      const validation = await this.validateStateChange(testCase, commandResult, responseResult);
      testResult.validation = validation;
      testResult.stateChangeValidated = validation.uiUpdatesVisible;

      // Step 6: Determine overall success
      testResult.success = testResult.commandSent && testResult.responseReceived && testResult.stateChangeValidated;

      console.log(testResult.success ? '✅ TEST PASSED' : '❌ TEST FAILED');

    } catch (error) {
      console.error(`❌ Test error: ${error.message}`);
      testResult.errors.push(error.message);
    }

    return testResult;
  }

  async runAllTests() {
    console.log('\n🎯 Starting comprehensive Renata validation...');

    this.results.summary.total = TEST_COMMANDS.length;

    for (const testCase of TEST_COMMANDS) {
      const result = await this.runTest(testCase);
      this.results.tests.push(result);

      if (result.success) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }

      // Wait between tests
      await this.page.waitForTimeout(1000);
    }

    console.log(`\n📊 Test Suite Complete:`);
    console.log(`   Total: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    console.log(`   Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);
  }

  async generateReport() {
    console.log('\n📄 Generating validation report...');

    const report = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      environment: {
        baseUrl: BASE_URL,
        browser: 'chromium',
        userAgent: await this.page.evaluate(() => navigator.userAgent)
      },
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(report, null, 2));
    console.log(`📊 Results saved to: ${TEST_RESULTS_FILE}`);

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownFile = TEST_RESULTS_FILE.replace('.json', '.md');
    fs.writeFileSync(markdownFile, markdownReport);
    console.log(`📝 Markdown report saved to: ${markdownFile}`);

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.tests.filter(test => !test.success);

    if (failedTests.length === 0) {
      recommendations.push('🎉 All tests passed! Renata state changes are working correctly.');
    } else {
      recommendations.push(`⚠️ ${failedTests.length} tests failed. Review the following issues:`);

      failedTests.forEach(test => {
        if (!test.commandSent) {
          recommendations.push(`- Fix command sending for "${test.name}"`);
        }
        if (!test.responseReceived) {
          recommendations.push(`- Fix response handling for "${test.name}"`);
        }
        if (!test.stateChangeValidated) {
          recommendations.push(`- Fix state changes for "${test.name}" - UI not updating`);
        }
      });
    }

    return recommendations;
  }

  generateMarkdownReport(report) {
    return `# TRADERERA AI JOURNAL - RENATA VALIDATION REPORT

Generated: ${report.generatedAt}

## Executive Summary

- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Success Rate**: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%

## Test Results

| Test Name | Command | Status | Issues |
|-----------|---------|---------|---------|
${report.tests.map(test => {
  const status = test.success ? '✅ PASSED' : '❌ FAILED';
  const issues = test.errors.join('; ') || 'None';
  return `| ${test.name} | \`${test.command}\` | ${status} | ${issues} |`;
}).join('\n')}

## Recommendations

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## Screenshots

All screenshots are saved in: \`${SCREENSHOT_DIR}\`

## Environment

- **Base URL**: ${report.environment.baseUrl}
- **Browser**: ${report.environment.browser}
- **Timestamp**: ${report.generatedAt}
`;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');

    if (this.page) {
      await this.page.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    console.log('✅ Cleanup complete');
  }
}

// Main execution
async function runValidation() {
  const validator = new TraderraValidator();

  try {
    await validator.init();

    const appLoaded = await validator.navigateToApp();
    if (!appLoaded) {
      console.error('❌ Failed to load Traderra app. Aborting validation.');
      process.exit(1);
    }

    await validator.runAllTests();
    const report = await validator.generateReport();

    console.log('\n🎉 Traderra validation complete!');

  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await validator.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runValidation().catch(console.error);
}

module.exports = { TraderraValidator, TEST_COMMANDS };