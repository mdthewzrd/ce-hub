/**
 * Automated Browser Testing for Extended Conversation Tests
 * Uses Playwright to navigate to the application and run comprehensive testing
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class AutomatedTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
    this.testResults = [];
    this.screenshots = [];
    this.testSessionId = `test-${Date.now()}`;
  }

  async initialize() {
    console.log('🚀 Initializing automated test runner...');

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Set to false for debugging
      slowMo: 100, // Slow down for better visibility
      viewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    // Create context
    this.context = await this.browser.newContext({
      recordVideo: {
        dir: `test-results/videos/${this.testSessionId}`,
        size: { width: 1920, height: 1080 }
      }
    });

    // Create page
    this.page = await this.context.newPage();

    // Set up console logging
    this.page.on('console', msg => {
      console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
      this.testResults.push({
        type: 'console',
        timestamp: new Date().toISOString(),
        level: msg.type(),
        message: msg.text()
      });
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      console.error('PAGE ERROR:', error);
      this.testResults.push({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
    });

    console.log('✅ Browser initialized successfully');
  }

  async navigateToApplication() {
    console.log('📍 Navigating to Traderra application...');

    try {
      await this.page.goto('http://localhost:5657', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for page to fully load
      await this.page.waitForLoadState('networkidle');

      console.log('✅ Application loaded successfully');

      // Capture initial screenshot
      await this.captureScreenshot('initial-page-load');

    } catch (error) {
      console.error('❌ Failed to navigate to application:', error);
      throw error;
    }
  }

  async loadTestingFrameworks() {
    console.log('📚 Loading testing frameworks...');

    // Load the extended conversation tests
    try {
      const extendedTestScript = fs.readFileSync(
        path.join(__dirname, 'extended-conversation-tests.js'),
        'utf8'
      );

      await this.page.evaluate(extendedTestScript);
      console.log('✅ Extended conversation tests loaded');

    } catch (error) {
      console.error('❌ Failed to load extended conversation tests:', error);
      throw error;
    }

    // Load the comprehensive testing runner
    try {
      const runnerScript = fs.readFileSync(
        path.join(__dirname, 'run-comprehensive-testing.js'),
        'utf8'
      );

      await this.page.evaluate(runnerScript);
      console.log('✅ Comprehensive testing runner loaded');

    } catch (error) {
      console.error('❌ Failed to load comprehensive testing runner:', error);
      throw error;
    }

    // Wait for scripts to initialize
    await this.page.waitForTimeout(2000);
  }

  async waitForChatAvailability() {
    console.log('💬 Waiting for Renata chat availability...');

    try {
      // Wait for page to be fully loaded
      await this.page.waitForLoadState('networkidle');

      // Look for chat toggle button
      const chatButton = await this.page.waitForSelector(
        'button[aria-label*="Chat"], button[data-testid*="chat"], button:has([data-lucide="message-circle"]), button:has([data-lucide="bot"]), .chat-toggle-btn, #chat-toggle',
        { timeout: 15000 }
      );

      if (chatButton) {
        console.log('✅ Chat button found');
        await this.captureScreenshot('chat-button-found');
      }

    } catch (error) {
      console.log('⚠️ Chat button not immediately found, trying alternative approach...');

      // Try to find any button that might open chat
      const allButtons = await this.page.$$('button');
      for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        if ((text && (text.toLowerCase().includes('chat') || text.toLowerCase().includes('renata') || text.toLowerCase().includes('ai'))) ||
            (ariaLabel && (ariaLabel.toLowerCase().includes('chat') || ariaLabel.toLowerCase().includes('renata') || ariaLabel.toLowerCase().includes('ai')))) {

          console.log(`✅ Found potential chat button: "${text}" or aria-label: "${ariaLabel}"`);
          await this.captureScreenshot('potential-chat-button-found');
          break;
        }
      }
    }

    // Additional wait for any dynamic content
    await this.page.waitForTimeout(3000);
  }

  async openRenataChat() {
    console.log('💬 Opening Renata chat sidebar...');

    try {
      // Try multiple selectors for the chat button
      const chatSelectors = [
        'button[aria-label*="Chat"]',
        'button[data-testid*="chat"]',
        'button:has([data-lucide="message-circle"])',
        'button:has([data-lucide="bot"])',
        '.chat-toggle-btn',
        '#chat-toggle',
        '[class*="chat"][class*="toggle"]',
        'button[class*="renata"]'
      ];

      let chatButton = null;

      for (const selector of chatSelectors) {
        try {
          chatButton = await this.page.$(selector);
          if (chatButton) {
            console.log(`✅ Found chat button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // If still not found, try text-based search
      if (!chatButton) {
        const allButtons = await this.page.$$('button');
        for (const button of allButtons) {
          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');

          if ((text && (text.toLowerCase().includes('chat') || text.toLowerCase().includes('renata'))) ||
              (ariaLabel && (ariaLabel.toLowerCase().includes('chat') || ariaLabel.toLowerCase().includes('renata')))) {
            chatButton = button;
            console.log(`✅ Found chat button via text/aria-label: "${text}"`);
            break;
          }
        }
      }

      if (!chatButton) {
        // Check if chat is already open
        const chatPanel = await this.page.$('[class*="chat"][class*="panel"], .chat-sidebar, #chat-panel');
        if (chatPanel) {
          const isVisible = await chatPanel.isVisible();
          if (isVisible) {
            console.log('✅ Renata chat is already open');
            await this.captureScreenshot('chat-already-open');
            return;
          }
        }

        throw new Error('Chat button not found - Renata chat may not be available');
      }

      // Check if chat is already open
      const chatPanel = await this.page.$('[class*="chat"][class*="panel"], .chat-sidebar, #chat-panel');
      if (chatPanel) {
        const isVisible = await chatPanel.isVisible();
        if (isVisible) {
          console.log('✅ Renata chat is already open');
          return;
        }
      }

      // Click to open chat
      console.log('🖱️ Clicking chat button...');
      await chatButton.click();

      // Wait for chat panel to appear
      await this.page.waitForSelector(
        '[class*="chat"][class*="panel"], .chat-sidebar, #chat-panel',
        { timeout: 5000, state: 'visible' }
      );

      console.log('✅ Renata chat sidebar opened successfully');
      await this.captureScreenshot('chat-opened');

      // Wait for chat to fully initialize
      await this.page.waitForTimeout(2000);

    } catch (error) {
      console.error('❌ Failed to open Renata chat:', error);
      // Don't throw here - we can still try other tests
      console.log('⚠️ Continuing without chat panel...');
    }
  }

  async runExtendedConversationTests() {
    console.log('🧪 Running extended conversation tests...');

    try {
      // Execute the comprehensive testing suite
      const testResults = await this.page.evaluate(async () => {
        try {
          return await window.runComprehensiveTests();
        } catch (error) {
          console.error('Error running tests:', error);
          return { error: error.message };
        }
      });

      console.log('✅ Extended conversation tests completed');

      // Capture final state
      await this.captureScreenshot('test-completion');

      // Get the comprehensive report
      const report = await this.page.evaluate(() => {
        return window.comprehensiveTestReport || null;
      });

      if (report) {
        console.log(`📊 Overall Success Rate: ${report.testResults?.overallSuccessRate || 'N/A'}%`);
        console.log(`📸 Screenshots captured: ${report.evidence?.screenshots?.length || 0}`);

        // Save the report
        this.saveTestReport(report);
      }

      return report;

    } catch (error) {
      console.error('❌ Extended conversation tests failed:', error);
      await this.captureScreenshot('test-error');
      throw error;
    }
  }

  async captureScreenshot(name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${this.testSessionId}-${name}-${timestamp}.png`;
      const filepath = path.join(__dirname, 'test-results', 'screenshots', filename);

      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await this.page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });

      this.screenshots.push({
        name: filename,
        path: filepath,
        timestamp: new Date().toISOString(),
        description: name
      });

      console.log(`📸 Screenshot captured: ${filename}`);

    } catch (error) {
      console.error('❌ Failed to capture screenshot:', error);
    }
  }

  saveTestReport(report) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${this.testSessionId}-report-${timestamp}.json`;
      const filepath = path.join(__dirname, 'test-results', 'reports', filename);

      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Add metadata
      const fullReport = {
        ...report,
        automationMetadata: {
          sessionId: this.testSessionId,
          timestamp: new Date().toISOString(),
          screenshots: this.screenshots,
          testResults: this.testResults,
          browserInfo: {
            userAgent: this.page.context().browser().version(),
            viewport: this.page.viewportSize()
          }
        }
      };

      fs.writeFileSync(filepath, JSON.stringify(fullReport, null, 2));
      console.log(`📄 Test report saved: ${filename}`);

      return filepath;

    } catch (error) {
      console.error('❌ Failed to save test report:', error);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test resources...');

    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async runFullTestSuite() {
    const startTime = Date.now();

    try {
      console.log('🚀 Starting comprehensive automated testing suite...');
      console.log(`🆔 Session ID: ${this.testSessionId}`);

      await this.initialize();
      await this.navigateToApplication();
      await this.loadTestingFrameworks();
      await this.waitForChatAvailability();
      await this.openRenataChat();
      const report = await this.runExtendedConversationTests();

      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Full test suite completed in ${duration}s`);

      return report;

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await this.captureScreenshot('suite-error');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use
module.exports = AutomatedTestRunner;

// Run if called directly
if (require.main === module) {
  async function main() {
    const runner = new AutomatedTestRunner();

    try {
      const report = await runner.runFullTestSuite();
      console.log('\n🎉 Test Suite Completed Successfully!');
      console.log(`📊 Report:`, report?.testResults ? {
        successRate: report.testResults.overallSuccessRate,
        totalSteps: report.testResults.totalSteps,
        successfulSteps: report.testResults.totalSuccessful
      } : 'No report generated');

    } catch (error) {
      console.error('\n💥 Test Suite Failed:', error.message);
      process.exit(1);
    }
  }

  main();
}