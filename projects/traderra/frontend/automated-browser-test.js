/**
 * Automated Browser Test Runner
 * Uses Playwright to run our validation tests and provide real results
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runAutomatedBrowserTest() {
  console.log('🚀 STARTING AUTOMATED BROWSER TEST')
  console.log('===================================')

  let browser;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser for debugging
      slowMo: 500 // Slow down for visibility
    });

    page = await browser.newPage();

    // Navigate to localhost:6565
    console.log('📍 Navigating to localhost:6565...')
    await page.goto('http://localhost:6565');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if page loaded successfully
    const pageTitle = await page.title();
    console.log(`📄 Page loaded: "${pageTitle}"`);

    // Check if we need to sign in
    const signInButton = await page.$('[data-testid="sign-in-button"]');
    if (signInButton) {
      console.log('🔐 Sign-in required - skipping for now (focus on chat functionality)');
    }

    // Look for chat input
    console.log('🔍 Looking for chat components...')
    const chatInput = await page.waitForSelector('[data-testid="renata-chat-input"]', { timeout: 10000 });
    const sendButton = await page.waitForSelector('[data-testid="renata-chat-send-button"]', { timeout: 5000 });

    if (!chatInput || !sendButton) {
      console.error('❌ Chat components not found');
      return false;
    }

    console.log('✅ Chat components found');

    // Load and execute visual test
    console.log('📋 Loading visual verification test...');
    const visualTestCode = fs.readFileSync('./simple-visual-test.js', 'utf8');

    // Execute the visual test in browser context
    await page.evaluate(visualTestCode);

    console.log('🧪 Running visual verification test...');
    const visualTestResults = await page.evaluate(async () => {
      try {
        // Set up a promise to capture results
        return new Promise((resolve) => {
          // Override console.log to capture output
          const originalLog = console.log;
          const logs = [];

          console.log = function(...args) {
            logs.push(args.join(' '));
            originalLog.apply(console, args);
          };

          // Run the test
          window.runVisualVerificationTest();

          // Wait for results to be stored
          setTimeout(() => {
            console.log = originalLog; // Restore original console.log
            resolve({
              logs: logs,
              results: window.visualVerificationResults
            });
          }, 8000); // Wait 8 seconds for test to complete
        });
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('📊 VISUAL TEST RESULTS:');
    if (visualTestResults.error) {
      console.error('❌ Visual test failed:', visualTestResults.error);
    } else {
      // Print captured logs
      visualTestResults.logs.forEach(log => console.log(log));

      // Print final results
      if (visualTestResults.results) {
        console.log('\n🎯 FINAL VERDICT:');
        console.log(`Success: ${visualTestResults.results.success ? '✅ YES' : '❌ NO'}`);

        if (visualTestResults.results.changes) {
          console.log('Changes detected:');
          console.log(`  Navigation: ${visualTestResults.results.changes.navigation ? '✅' : '❌'}`);
          console.log(`  Display mode: ${visualTestResults.results.changes.displayMode ? '✅' : '❌'}`);
          console.log(`  Date range: ${visualTestResults.results.changes.dateRange ? '✅' : '❌'}`);
        }
      }
    }

    // Now test with comprehensive test
    console.log('\n📋 Loading comprehensive validation test...');
    const comprehensiveTestCode = fs.readFileSync('./REAL_VALIDATION_TEST.js', 'utf8');

    await page.evaluate(comprehensiveTestCode);

    console.log('🧪 Running comprehensive validation test...');
    const comprehensiveTestResults = await page.evaluate(async () => {
      try {
        return new Promise((resolve) => {
          const originalLog = console.log;
          const logs = [];

          console.log = function(...args) {
            logs.push(args.join(' '));
            originalLog.apply(console, args);
          };

          window.runRealValidationTest();

          setTimeout(() => {
            console.log = originalLog;
            resolve({
              logs: logs,
              results: window.realValidationTestResults
            });
          }, 10000); // Wait 10 seconds for comprehensive test
        });
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    if (comprehensiveTestResults.error) {
      console.error('❌ Comprehensive test failed:', comprehensiveTestResults.error);
    } else {
      comprehensiveTestResults.logs.forEach(log => console.log(log));

      if (comprehensiveTestResults.results) {
        console.log('\n🎯 COMPREHENSIVE TEST FINAL VERDICT:');
        console.log(`Overall Result: ${comprehensiveTestResults.results.results.passCount}/${comprehensiveTestResults.results.results.totalCount} tests passed`);
      }
    }

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: test-results-screenshot.png');

    return true;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return false;
  } finally {
    // Keep browser open for 5 seconds for inspection
    if (browser) {
      console.log('\n⏳ Keeping browser open for 5 seconds for inspection...');
      await page.waitForTimeout(5000);
      await browser.close();
    }
  }
}

// Run the test
runAutomatedBrowserTest().then(success => {
  console.log(`\n🏆 Automated browser test ${success ? 'completed successfully' : 'failed'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});