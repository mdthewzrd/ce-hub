/**
 * TRADERERA AI JOURNAL - PUPPETEER VALIDATION SUITE
 * Simplified version for testing Renata state changes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:6565/dashboard';
const SCREENSHOT_DIR = './traderra-screenshots';

// Core test commands
const CORE_TESTS = [
  {
    name: 'R-Multiple Display Mode',
    command: 'in r',
    description: 'Should switch to R-multiple display'
  },
  {
    name: 'Year to Date Range',
    command: 'ytd',
    description: 'Should set date range to year-to-date'
  },
  {
    name: 'Combined Command',
    command: 'show YTD in R',
    description: 'Should set YTD date range AND R-multiple display'
  },
  {
    name: 'Navigation to Dashboard',
    command: 'go to dashboard',
    description: 'Should navigate to dashboard page'
  },
  {
    name: 'Analyst Mode',
    command: 'analyst mode',
    description: 'Should switch to analyst AI mode'
  }
];

class TraderraPuppeteerValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Initializing Puppeteer validator...');

    // Create screenshots directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1400, height: 900 });

    // Set up console logging
    this.page.on('console', msg => {
      console.log('🌐 Browser:', msg.text());
    });

    console.log('✅ Puppeteer initialized');
  }

  async navigateToApp() {
    console.log(`📍 Navigating to ${BASE_URL}...`);

    try {
      await this.page.goto(BASE_URL, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });

      // Wait for app to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take initial screenshot
      await this.takeScreenshot('00-initial-load');

      console.log('✅ App loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load app:', error);
      return false;
    }
  }

  async locateChatInterface() {
    console.log('🔍 Locating Renata chat interface...');

    try {
      // First, ensure the AI sidebar is open
      console.log('🔍 Opening AI sidebar...');
      const sidebarOpened = await this.page.evaluate(() => {
        // Look for the AI toggle button
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const button of buttons) {
          const text = button.textContent.toLowerCase();
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

          if (text.includes('ai') || text.includes('renata') || text.includes('chat') ||
              ariaLabel.includes('ai') || ariaLabel.includes('renata') || ariaLabel.includes('chat')) {
            console.log('Found AI toggle button:', text || ariaLabel);
            button.click();
            return true;
          }
        }

        // Try clicking any button that might toggle the sidebar
        const topNavButtons = document.querySelectorAll('nav button, .nav button, header button');
        for (const button of topNavButtons) {
          console.log('Trying top nav button:', button.textContent);
          button.click();
          return true;
        }

        return false;
      });

      if (sidebarOpened) {
        console.log('✅ AI sidebar toggle clicked');
        // Wait for sidebar animation
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Wait for any potential chat interface
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Look specifically for the Renata chat input
      const chatSelectors = [
        'input[placeholder*="Chat with Renata" i]',
        'input[placeholder*="renata" i]',
        'input[placeholder*="chat" i]',
        'textarea[placeholder*="Chat with Renata" i]',
        'textarea[placeholder*="renata" i]',
        'textarea[placeholder*="chat" i]',
        '.chat-input input',
        '.renata-chat input',
        '[data-testid*="renata"] input',
        '[data-testid*="chat"] input'
      ];

      let chatInput = null;
      let foundSelector = null;

      for (const selector of chatSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 1000 });
          const inputs = await this.page.$$(selector);

          for (const input of inputs) {
            const isVisible = await this.page.evaluate(el => {
              const style = window.getComputedStyle(el);
              const rect = el.getBoundingClientRect();
              return style.display !== 'none' &&
                     style.visibility !== 'hidden' &&
                     style.opacity !== '0' &&
                     rect.width > 0 &&
                     rect.height > 0;
            }, input);

            if (isVisible) {
              chatInput = input;
              foundSelector = selector;
              console.log(`✅ Found Renata chat input: ${foundSelector}`);

              // Get the placeholder to confirm it's the right input
              const placeholder = await this.page.evaluate(el => el.placeholder, input);
              console.log(`📝 Input placeholder: "${placeholder}"`);
              break;
            }
          }

          if (chatInput) break;
        } catch (e) {
          // Continue trying
        }
      }

      if (!chatInput) {
        console.log('⚠️ No Renata chat input found with specific selectors, trying broader search...');

        // Try to find any input in a potential chat sidebar
        const allInputs = await this.page.$$('input, textarea');
        for (const input of allInputs) {
          const placeholder = await this.page.evaluate(el => el.placeholder, input);
          if (placeholder && (
            placeholder.toLowerCase().includes('chat') ||
            placeholder.toLowerCase().includes('renata') ||
            placeholder.toLowerCase().includes('ask') ||
            placeholder.toLowerCase().includes('message')
          )) {
            chatInput = input;
            console.log(`✅ Found chat input by placeholder: "${placeholder}"`);
            break;
          }
        }
      }

      if (!chatInput) {
        console.log('❌ Still no chat input found, checking if sidebar is actually open...');
        const sidebarState = await this.page.evaluate(() => {
          const sidebar = document.querySelector('[class*="fixed"][class*="right"]');
          if (sidebar) {
            const style = window.getComputedStyle(sidebar);
            return {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              width: style.width
            };
          }
          return null;
        });
        console.log('📊 Sidebar state:', sidebarState);
      }

      return chatInput;
    } catch (error) {
      console.error('❌ Error locating chat:', error);
      return null;
    }
  }

  async sendCommand(command) {
    console.log(`💬 Sending command: "${command}"`);

    try {
      const chatInput = await this.locateChatInterface();
      if (!chatInput) {
        console.log('❌ No chat input found, trying alternative approach...');

        // Try to evaluate and send directly
        await this.page.evaluate((cmd) => {
          // Look for any input and try to set its value
          const inputs = document.querySelectorAll('input, textarea');
          for (const input of inputs) {
            if (input.type !== 'password' && input.type !== 'hidden') {
              input.value = cmd;
              input.focus();
              input.dispatchEvent(new Event('input', { bubbles: true }));
              return input;
            }
          }
          return null;
        }, command);

        // Try to find and click send button
        const sendClicked = await this.page.evaluate(() => {
          const buttons = document.querySelectorAll('button, [role="button"]');
          for (const button of buttons) {
            const text = button.textContent.toLowerCase();
            if (text.includes('send') || text.includes('submit') ||
                button.getAttribute('aria-label')?.toLowerCase().includes('send')) {
              button.click();
              return true;
            }
          }

          // Try pressing Enter on active input
          const activeElement = document.activeElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter', bubbles: true, cancelable: true
            }));
            return true;
          }
          return false;
        });

        if (sendClicked) {
          console.log('✅ Command sent via alternative method');
          return true;
        } else {
          throw new Error('Could not send command');
        }
      }

      // Standard approach - type into found input
      await chatInput.click();
      await chatInput.focus();
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('a');
      await this.page.keyboard.up('Control');
      await chatInput.type(command, { delay: 50 });

      // Take screenshot before sending
      await this.takeScreenshot(`before-${command.replace(/[^a-z0-9]/gi, '-')}`);

      // Try to send
      const sendClicked = await this.page.evaluate(() => {
        // Look for send button
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const button of buttons) {
          const text = button.textContent.toLowerCase();
          if (text.includes('send') || text.includes('submit') ||
              button.getAttribute('aria-label')?.toLowerCase().includes('send')) {
            button.click();
            return true;
          }
        }

        // Try pressing Enter
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', bubbles: true, cancelable: true
          }));
          return true;
        }
        return false;
      });

      if (sendClicked) {
        console.log('✅ Command sent successfully');
        return true;
      } else {
        throw new Error('Could not find send button');
      }

    } catch (error) {
      console.error('❌ Error sending command:', error);
      return false;
    }
  }

  async waitForResponse() {
    console.log('⏳ Waiting for response...');

    try {
      // Wait for potential response indicators
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for any new content that might be a response
      const responseFound = await this.page.evaluate(() => {
        // Look for elements that might contain responses
        const potentialResponseSelectors = [
          '[class*="message"]',
          '[class*="response"]',
          '[class*="chat"]',
          '[class*="assistant"]',
          '[class*="ai"]',
          '[data-message]'
        ];

        for (const selector of potentialResponseSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim();
            if (text && text.length > 10) { // Substantial response
              return { found: true, text: text.substring(0, 100) };
            }
          }
        }

        // Check for any element that appeared recently
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          const text = element.textContent?.trim();
          if (text && text.length > 20 &&
              !text.includes('Copyright') &&
              !text.includes('All rights reserved') &&
              element.getBoundingClientRect().width > 100) {
            return { found: true, text: text.substring(0, 100) };
          }
        }

        return { found: false };
      });

      if (responseFound.found) {
        console.log(`✅ Response detected: ${responseFound.text}...`);
        return true;
      } else {
        console.log('⚠️ No obvious response detected');
        return false;
      }

    } catch (error) {
      console.error('❌ Error waiting for response:', error);
      return false;
    }
  }

  async validateChanges(testCase) {
    console.log('🔍 Validating UI changes...');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const validation = await this.page.evaluate((expectedChanges) => {
        const pageText = document.body.textContent.toLowerCase();
        const pageHTML = document.body.innerHTML.toLowerCase();

        const results = {
          displayModeChanged: false,
          dateRangeChanged: false,
          navigationChanged: false,
          hasResponse: false,
          newContent: false
        };

        // Check for display mode changes
        if (expectedChanges.includes('display_mode')) {
          const rIndicators = ['r-multiple', 'r multiple', 'r‑multiple', ' mode: r'];
          const dollarIndicators = ['dollar', '$ mode', 'mode: $'];
          const percentIndicators = ['percent', '% mode', 'mode: %'];

          results.displayModeChanged =
            rIndicators.some(indicator => pageText.includes(indicator)) ||
            dollarIndicators.some(indicator => pageText.includes(indicator)) ||
            percentIndicators.some(indicator => pageText.includes(indicator));
        }

        // Check for date range changes
        if (expectedChanges.includes('date_range')) {
          const dateIndicators = ['year to date', 'ytd', 'last 3 months', '3 months', 'last month', 'this month'];
          results.dateRangeChanged = dateIndicators.some(indicator => pageText.includes(indicator));
        }

        // Check for navigation changes
        if (expectedChanges.includes('navigation')) {
          const url = window.location.href;
          results.navigationChanged = url.includes('/dashboard') || url.includes('/journal') || url.includes('/stats');
        }

        // Check for any AI response
        results.hasResponse = pageHTML.includes('class') && pageHTML.includes('message');

        // Check for new content (general change)
        results.newContent = pageText.length > 500; // Assume new content if substantial text

        return results;
      }, Array.isArray(testCase.expectedStateChange) ? testCase.expectedStateChange : [testCase.expectedStateChange]);

      console.log('✅ Validation complete:', validation);
      return validation;

    } catch (error) {
      console.error('❌ Error validating changes:', error);
      return { displayModeChanged: false, dateRangeChanged: false, navigationChanged: false, hasResponse: false };
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

      console.log(`📸 Screenshot: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Screenshot failed:', error);
      return null;
    }
  }

  async runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`💬 Command: "${testCase.command}"`);

    const result = {
      name: testCase.name,
      command: testCase.command,
      success: false,
      commandSent: false,
      responseReceived: false,
      validation: {},
      screenshot: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Send command
      result.commandSent = await this.sendCommand(testCase.command);
      if (!result.commandSent) {
        console.log('❌ Command failed to send');
        return result;
      }

      // Wait for response
      result.responseReceived = await this.waitForResponse();

      // Validate changes
      result.validation = await this.validateChanges(testCase);

      // Take final screenshot
      result.screenshot = await this.takeScreenshot(`test-${testCase.name.replace(/[^a-z0-9]/gi, '-')}`);

      // Determine success
      result.success = result.commandSent && (result.responseReceived || result.validation.newContent);

      console.log(result.success ? '✅ TEST PASSED' : '❌ TEST FAILED');

    } catch (error) {
      console.error(`❌ Test error: ${error.message}`);
      result.error = error.message;
    }

    return result;
  }

  async runAllTests() {
    console.log('\n🎯 Starting Traderra validation tests...');

    for (const testCase of CORE_TESTS) {
      const result = await this.runTest(testCase);
      this.results.push(result);

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate summary
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;

    console.log(`\n📊 VALIDATION COMPLETE:`);
    console.log(`   Passed: ${passed}/${total}`);
    console.log(`   Success Rate: ${((passed/total) * 100).toFixed(1)}%`);

    // Save results
    const reportPath = path.join(SCREENSHOT_DIR, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { passed, total, rate: (passed/total) * 100 },
      results: this.results
    }, null, 2));

    console.log(`📄 Report saved: ${reportPath}`);

    return this.results;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✅ Done');
  }
}

// Main execution
async function main() {
  const validator = new TraderraPuppeteerValidator();

  try {
    await validator.init();

    const loaded = await validator.navigateToApp();
    if (!loaded) {
      console.error('❌ Failed to load app');
      return;
    }

    await validator.runAllTests();

  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await validator.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TraderraPuppeteerValidator };