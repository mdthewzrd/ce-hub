#!/usr/bin/env node

/**
 * Capture Browser Console Errors
 * Navigate to the real frontend and capture all console errors
 */

const { chromium } = require('playwright');

async function captureConsoleErrors() {
  console.log('🔍 Capturing Browser Console Errors from http://localhost:5665/scan\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      consoleMessages.push({
        type,
        text,
        timestamp: new Date().toISOString()
      });

      // Print in real-time
      const icon = {
        'error': '❌',
        'warning': '⚠️ ',
        'info': 'ℹ️ ',
        'log': '📝'
      }[type] || '•';

      console.log(`${icon} [${type.toUpperCase()}] ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`💥 PAGE ERROR: ${error.message}`);
      consoleMessages.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Capture network failures
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`🌐 NETWORK ${response.status()}: ${response.url()}`);
        consoleMessages.push({
          type: 'network',
          status: response.status(),
          url: response.url(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Navigate to scan page
    console.log('\n📍 Navigating to http://localhost:5665/scan');
    console.log('='.repeat(70));

    try {
      await page.goto('http://localhost:5665/scan', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    } catch (navError) {
      console.log(`\n❌ Navigation failed: ${navError.message}`);
      consoleMessages.push({
        type: 'navigation-failed',
        text: navError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Wait for page to settle
    console.log('\n⏳ Waiting 5 seconds for page to settle...\n');
    await page.waitForTimeout(5000);

    // Get page content
    const pageContent = await page.content();
    const hasContent = pageContent.length > 1000;
    const hasReactRoot = pageContent.includes('__next');

    console.log('\n' + '='.repeat(70));
    console.log('📊 Page Analysis');
    console.log('='.repeat(70));
    console.log(`Content length: ${pageContent.length} bytes`);
    console.log(`Has React root: ${hasReactRoot ? '✅' : '❌'}`);
    console.log(`Has meaningful content: ${hasContent ? '✅' : '❌'}`);

    // Check for error indicators in HTML
    const errorIndicators = [
      'error',
      'failed',
      'cannot',
      'undefined',
      'Module not found',
      'Failed to fetch'
    ];

    const foundErrors = [];
    for (const indicator of errorIndicators) {
      if (pageContent.toLowerCase().includes(indicator)) {
        // Count occurrences
        const regex = new RegExp(indicator, 'gi');
        const matches = pageContent.match(regex);
        if (matches && matches.length > 5) {
          foundErrors.push(`${indicator}: ${matches.length} occurrences`);
        }
      }
    }

    if (foundErrors.length > 0) {
      console.log('\n⚠️  Potential errors in page content:');
      foundErrors.forEach(err => console.log(`  • ${err}`));
    }

    // Summary of console messages
    console.log('\n' + '='.repeat(70));
    console.log('📋 Console Message Summary');
    console.log('='.repeat(70));

    const errors = consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    const networkErrors = consoleMessages.filter(m => m.type === 'network' && m.status >= 500);

    console.log(`\nErrors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Network Errors: ${networkErrors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.text}`);
        if (err.stack) {
          console.log(`   ${err.stack.split('\n').slice(0, 3).join('\n   ')}`);
        }
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      networkErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.status} - ${err.url}`);
      });
    }

    // Take screenshot
    await page.screenshot({ path: 'current_page_state.png', fullPage: true });
    console.log('\n📸 Screenshot saved: current_page_state.png');

    // Keep browser open for manual inspection
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 10 seconds for manual inspection');
    console.log('='.repeat(70));
    console.log('Check the browser window and console (F12) for additional errors\n');

    await page.waitForTimeout(10000);

    // Final verdict
    console.log('\n' + '='.repeat(70));
    console.log('🎯 Diagnosis Complete');
    console.log('='.repeat(70));

    if (errors.length > 0 || networkErrors.length > 0) {
      console.log('\n❌ Page has errors that need to be fixed');
      console.log('\nMost likely issues:');
      console.log('1. Next.js needs restart after dependency installation');
      console.log('2. Missing peer dependencies');
      console.log('3. Component compilation errors');
      console.log('4. Backend server (port 5666) not running');
      console.log('\nNext steps:');
      console.log('1. Stop Next.js server (Ctrl+C)');
      console.log('2. Run: npm run dev');
      console.log('3. Check terminal for build errors');
      console.log('4. Verify backend is running on port 5666');
      return false;
    } else if (!hasReactRoot) {
      console.log('\n❌ Page did not render React properly');
      console.log('Next.js may not be running correctly');
      return false;
    } else {
      console.log('\n✅ Page loaded without errors!');
      console.log('The issue may have been resolved by restarting');
      return true;
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error);

    if (page) {
      await page.screenshot({ path: 'error_screenshot.png' });
      console.log('📸 Error screenshot saved: error_screenshot.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
captureConsoleErrors().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
