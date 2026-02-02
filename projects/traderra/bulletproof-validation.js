/**
 * Bulletproof Validation Suite for Traderra AI Journal
 * Tests all functionality including custom date ranges, navigation, and state changes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class BulletproofValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.screenshotsDir = 'traderra-screenshots';

    // Ensure screenshots directory exists
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  async init() {
    console.log('🚀 Initializing bulletproof validation suite...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--start-maximized']
    });
    this.page = await this.browser.newPage();

    // Enable comprehensive logging
    this.page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('🌐 Browser:', msg.text());
      } else if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      } else if (msg.type() === 'warning') {
        console.warn('⚠️ Browser Warning:', msg.text());
      }
    });

    // Track API requests
    this.page.on('response', response => {
      if (response.url().includes('/api/renata/chat')) {
        response.text().then(body => {
          try {
            const data = JSON.parse(body);
            if (data.ui_action) {
              console.log('📡 API UI Action:', data.ui_action);
            }
          } catch (e) {
            // Silent parse errors
          }
        });
      }
    });

    console.log('✅ Browser initialized');
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Browser cleanup complete');
  }

  async takeScreenshot(name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(this.screenshotsDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: false,
      quality: 90
    });

    console.log(`📸 Screenshot saved: ${filepath} - ${description}`);
    return filepath;
  }

  async navigateToPage(page) {
    const url = `http://localhost:6565/${page}`;
    console.log(`📍 Navigating to: ${url}`);

    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if page loaded successfully
    const pageTitle = await this.page.title();
    console.log(`📄 Page loaded: ${pageTitle}`);

    return true;
  }

  async waitForRenataInput() {
    try {
      console.log('🔍 Looking for Renata input...');
      // Wait for page to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try multiple selectors
      const selectors = [
        'input[placeholder*="Chat with Renata" i]',
        'input[placeholder*="Chat with Renata"]',
        'textarea[placeholder*="Chat with Renata" i]',
        'textarea[placeholder*="Chat with Renata"]',
        '[data-testid="renata-input"]',
        '.renata-input input',
        '.renata-input textarea'
      ];

      for (const selector of selectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          console.log(`✅ Found Renata input with selector: ${selector}`);
          return true;
        } catch (e) {
          // Try next selector
        }
      }

      // Debug: check page content
      const hasRenata = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea');
        const renataElements = Array.from(inputs).filter(el =>
          el.placeholder && el.placeholder.toLowerCase().includes('renata')
        );
        return renataElements.map(el => ({
          tag: el.tagName,
          placeholder: el.placeholder,
          id: el.id,
          className: el.className
        }));
      });

      console.log('❌ No Renata input found. Available inputs:', hasRenata);
      return false;
    } catch (error) {
      console.error('❌ Renata input not found:', error.message);
      return false;
    }
  }

  async sendRenataCommand(command) {
    console.log(`💬 Sending Renata command: "${command}"`);

    try {
      // Try the same selectors as waitForRenataInput
      const selectors = [
        'input[placeholder*="Chat with Renata" i]',
        'input[placeholder*="Chat with Renata"]',
        'textarea[placeholder*="Chat with Renata" i]',
        'textarea[placeholder*="Chat with Renata"]',
        '[data-testid="renata-input"]',
        '.renata-input input',
        '.renata-input textarea'
      ];

      for (const selector of selectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.type(command);
            await this.page.keyboard.press('Enter');
            console.log(`✅ Command sent using selector: ${selector}`);
            return true;
          }
        } catch (e) {
          // Try next selector
        }
      }

      console.error('❌ No valid Renata input element found');
      return false;
    } catch (error) {
      console.error('❌ Failed to send command:', error.message);
      return false;
    }
  }

  async waitForRenataResponse() {
    console.log('⏳ Waiting for Renata response...');

    try {
      // Wait for any response content to appear (message bubbles, loading states, etc.)
      await this.page.waitForFunction(() => {
        const messages = document.querySelectorAll('[class*="message"], [class*="chat"], [class*="assistant"], [class*="user"]');
        return messages.length > 0;
      }, { timeout: 5000 });

      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      console.error('❌ No response detected:', error.message);
      return false;
    }
  }

  async checkLocalStorage(expectedKey, description) {
    try {
      const value = await this.page.evaluate((key) => {
        const stored = localStorage.getItem(key);
        if (stored && stored.startsWith('{')) {
          return JSON.parse(stored);
        }
        return stored;
      }, expectedKey);

      console.log(`💾 ${description}:`, value);
      return value;
    } catch (error) {
      console.error(`❌ Error checking localStorage:`, error.message);
      return null;
    }
  }

  async testCustomDateRanges() {
    console.log('\n🗓️ Testing Custom Date Ranges...');

    const tests = [
      {
        name: 'from January 1st to January 31st 2024',
        command: 'from January 1st to January 31st 2024',
        expectedStart: '2024-01-01',
        expectedEnd: '2024-01-31'
      },
      {
        name: 'from 3/1/2024 to 3/31/2024',
        command: 'from 3/1/2024 to 3/31/2024',
        expectedStart: '2024-03-01',
        expectedEnd: '2024-03-31'
      },
      {
        name: 'from February 15 to March 15 2024',
        command: 'from February 15 to March 15 2024',
        expectedStart: '2024-02-15',
        expectedEnd: '2024-03-15'
      },
      {
        name: 'show me from December 1st to December 25th',
        command: 'show me from December 1st to December 25th',
        expectedStart: '2024-12-01',
        expectedEnd: '2024-12-25'
      },
      {
        name: 'between Jan 5 and Feb 10',
        command: 'between Jan 5 and Feb 10',
        expectedStart: '2025-01-05',
        expectedEnd: '2025-02-10'
      }
    ];

    let passedTests = 0;

    for (const test of tests) {
      console.log(`\n📅 Testing: ${test.name}`);

      // Clear previous date range
      await this.page.evaluate(() => {
        localStorage.removeItem('traderra_custom_date_range');
      });

      // Send command
      const success = await this.sendRenataCommand(test.command);
      if (!success) {
        console.log(`❌ Failed to send command`);
        continue;
      }

      // Wait for response
      await this.waitForRenataResponse();

      // Check localStorage
      const customDateRange = await this.checkLocalStorage('traderra_custom_date_range', `Custom date range`);

      if (customDateRange && customDateRange.start && customDateRange.end) {
        const actualStart = customDateRange.start.substring(0, 10);
        const actualEnd = customDateRange.end.substring(0, 10);

        const startMatch = actualStart === test.expectedStart;
        const endMatch = actualEnd === test.expectedEnd;

        if (startMatch && endMatch) {
          console.log(`✅ PASS: ${test.name}`);
          console.log(`   Expected: ${test.expectedStart} to ${test.expectedEnd}`);
          console.log(`   Actual:   ${actualStart} to ${actualEnd}`);
          passedTests++;
        } else {
          console.log(`❌ FAIL: ${test.name}`);
          console.log(`   Expected: ${test.expectedStart} to ${test.expectedEnd}`);
          console.log(`   Actual:   ${actualStart} to ${actualEnd}`);
        }
      } else {
        console.log(`❌ FAIL: ${test.name} - No custom date range found`);
      }

      await this.takeScreenshot(`custom-date-${test.name.replace(/\s+/g, '-')}`, test.name);
    }

    console.log(`\n📊 Custom Date Range Tests: ${passedTests}/${tests.length} passed`);
    this.testResults.push({
      category: 'Custom Date Ranges',
      passed: passedTests,
      total: tests.length,
      percentage: (passedTests / tests.length * 100).toFixed(1)
    });

    return passedTests === tests.length;
  }

  async testBasicDateRanges() {
    console.log('\n📅 Testing Basic Date Ranges...');

    const tests = [
      { command: 'yesterday', expected: 'yesterday' },
      { command: 'today', expected: 'today' },
      { command: 'last 7 days', expected: '7d' },
      { command: 'last 30 days', expected: '30d' },
      { command: 'last quarter', expected: 'last_quarter' },
      { command: 'this quarter', expected: 'quarter' },
      { command: 'ytd', expected: 'ytd' }
    ];

    let passedTests = 0;

    for (const test of tests) {
      console.log(`\n📅 Testing: "${test.command}"`);

      // Send command
      await this.sendRenataCommand(test.command);

      // Wait for response
      await this.waitForRenataResponse();

      // Check localStorage
      const dateRange = await this.checkLocalStorage('traderra_date_range', `Date range`);

      if (dateRange === test.expected) {
        console.log(`✅ PASS: "${test.command}" → ${dateRange}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: "${test.command}" → ${dateRange} (expected: ${test.expected})`);
      }
    }

    console.log(`\n📊 Basic Date Range Tests: ${passedTests}/${tests.length} passed`);
    this.testResults.push({
      category: 'Basic Date Ranges',
      passed: passedTests,
      total: tests.length,
      percentage: (passedTests / tests.length * 100).toFixed(1)
    });

    return passedTests === tests.length;
  }

  async testDisplayModes() {
    console.log('\n💰 Testing Display Mode Changes...');

    const tests = [
      { command: 'in dollars', expected: 'dollar' },
      { command: 'show in R', expected: 'r' },
      { command: 'switch to percent mode', expected: 'percent' },
      { command: 'change to R mode', expected: 'r' },
      { command: 'show in dollars', expected: 'dollar' }
    ];

    let passedTests = 0;

    for (const test of tests) {
      console.log(`\n💰 Testing: "${test.command}"`);

      // Send command
      await this.sendRenataCommand(test.command);

      // Wait for response
      await this.waitForRenataResponse();

      // Check localStorage
      const displayMode = await this.checkLocalStorage('traderra_display_mode', `Display mode`);

      if (displayMode === test.expected) {
        console.log(`✅ PASS: "${test.command}" → ${displayMode}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: "${test.command}" → ${displayMode} (expected: ${test.expected})`);
      }
    }

    console.log(`\n📊 Display Mode Tests: ${passedTests}/${tests.length} passed`);
    this.testResults.push({
      category: 'Display Modes',
      passed: passedTests,
      total: tests.length,
      percentage: (passedTests / tests.length * 100).toFixed(1)
    });

    return passedTests === tests.length;
  }

  async testNavigation() {
    console.log('\n🧭 Testing Navigation...');

    const tests = [
      { command: 'go to statistics page', expectedPage: 'statistics' },
      { command: 'take me to the dashboard', expectedPage: 'dashboard' },
      { command: 'navigate to journal', expectedPage: 'journal' },
      { command: 'show me the stats page', expectedPage: 'statistics' }
    ];

    let passedTests = 0;

    for (const test of tests) {
      console.log(`\n🧭 Testing: "${test.command}"`);

      // Send command
      await this.sendRenataCommand(test.command);

      // Wait for response and navigation
      await this.waitForRenataResponse();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check current URL
      const currentUrl = this.page.url();
      const isInPage = currentUrl.includes(test.expectedPage);

      if (isInPage) {
        console.log(`✅ PASS: "${test.command}" → ${test.expectedPage}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: "${test.command}" → ${currentUrl} (expected: /${test.expectedPage})`);
      }

      // Return to dashboard for next test
      if (!currentUrl.includes('dashboard')) {
        await this.navigateToPage('dashboard');
      }
    }

    console.log(`\n📊 Navigation Tests: ${passedTests}/${tests.length} passed`);
    this.testResults.push({
      category: 'Navigation',
      passed: passedTests,
      total: tests.length,
      percentage: (passedTests / tests.length * 100).toFixed(1)
    });

    return passedTests === tests.length;
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      summary: {
        totalTests: this.testResults.reduce((sum, result) => sum + result.total, 0),
        totalPassed: this.testResults.reduce((sum, result) => sum + result.passed, 0),
        overallPercentage: 0
      },
      results: this.testResults
    };

    report.summary.overallPercentage = (
      (report.summary.totalPassed / report.summary.totalTests * 100)
    ).toFixed(2);

    const reportPath = path.join(this.screenshotsDir, `validation-report-${timestamp.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📋 Validation Report Generated:');
    console.log(`📄 File: ${reportPath}`);
    console.log(`📊 Overall: ${report.summary.overallPercentage}% (${report.summary.totalPassed}/${report.summary.totalTests} tests passed)`);

    // Print detailed results
    for (const result of report.results) {
      const status = result.percentage >= 100 ? '✅' : '⚠️';
      console.log(`${status} ${result.category}: ${result.percentage}% (${result.passed}/${result.total} tests passed)`);
    }

    return report;
  }

  async runAllTests() {
    console.log('🎯 Starting Bulletproof Validation Suite...\n');

    try {
      // Initialize
      await this.init();

      // Navigate to dashboard where Renata chat is available
      await this.navigateToPage('dashboard');
      await this.waitForRenataInput();

      // Run all test suites
      const customDateRangeResult = await this.testCustomDateRanges();
      const basicDateRangeResult = await this.testBasicDateRanges();
      const displayModeResult = await this.testDisplayModes();
      const navigationResult = await this.testNavigation();

      // Generate comprehensive report
      const report = await this.generateReport();

      // Take final screenshot
      await this.takeScreenshot('validation-complete', 'Final validation state');

      console.log('\n🎯 Validation Complete!');
      return report.summary.overallPercentage >= 95; // Require 95% success rate

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  const validator = new BulletproofValidator();
  const success = await validator.runAllTests();

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}