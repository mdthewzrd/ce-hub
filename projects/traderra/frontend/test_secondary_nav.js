#!/usr/bin/env node

/**
 * Test Secondary Navigation Buttons and Renata Sidebar
 * Investigate issues with date range, $, R buttons and Renata sidebar
 */

const { chromium } = require('playwright');

async function testSecondaryNavAndRenata() {
  console.log('🧪 Testing Secondary Navigation and Renata Sidebar\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`  📝 ${text}`);
    });

    // Navigate to the trades page
    console.log('\n📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'traderra_initial_state.png' });
    console.log('📸 Screenshot saved: traderra_initial_state.png');

    // Test 1: Check if secondary nav elements are present
    console.log('\n🔍 TEST 1: Checking for secondary nav elements...');

    const secondaryNavChecks = [
      { name: 'Date range buttons', selectors: ['[data-testid="date-range-7d"]', '[data-testid="date-range-30d"]', '[data-testid="date-range-90day"]', '[data-range="7d"]', '[data-range="30d"]'] },
      { name: 'Calendar button', selectors: ['button[aria-label*="Calendar"]', 'button:has([data-lucide="calendar"])', '.traderra-date-btn:has-text("")'] },
      { name: 'Display Mode Toggle ($ button)', selectors: ['#display-mode-dollar-button', '[data-testid="display-mode-dollar"]', '[data-mode-value="dollar"]'] },
      { name: 'Display Mode Toggle (R button)', selectors: ['#display-mode-r-button', '[data-testid="display-mode-r"]', '[data-mode-value="r"]'] },
    ];

    for (const check of secondaryNavChecks) {
      let found = false;
      for (const selector of check.selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              console.log(`  ✅ FOUND ${check.name}: ${selector}`);
              found = true;
              break;
            }
          }
        } catch (e) {
          // Try next selector
        }
      }
      if (!found) {
        console.log(`  ❌ NOT FOUND: ${check.name}`);
      }
    }

    // Test 2: Try clicking the R button
    console.log('\n🔍 TEST 2: Clicking the R button...');

    const rButtonSelectors = [
      '#display-mode-r-button',
      '[data-testid="display-mode-r"]',
      '[data-mode-value="r"]',
      'button:has-text("R")'
    ];

    let rButton = null;
    for (const selector of rButtonSelectors) {
      try {
        rButton = await page.$(selector);
        if (rButton) {
          const isVisible = await rButton.isVisible();
          if (isVisible) {
            console.log(`  ✅ Found R button with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (rButton) {
      console.log('  🖱️  Clicking R button...');
      await rButton.click();
      await page.waitForTimeout(1000);

      // Check if sidebar state changed
      const sidebarVisible = await page.$('.fixed.right-0.top-16');
      console.log(`  📊 Sidebar visible after click: ${sidebarVisible ? 'YES' : 'NO'}`);

      await page.screenshot({ path: 'traderra_after_r_click.png' });
      console.log('  📸 Screenshot saved: traderra_after_r_click.png');
    } else {
      console.log('  ❌ R button not found');
    }

    // Test 3: Check Renata toggle button
    console.log('\n🔍 TEST 3: Checking Renata toggle button...');

    const renataSelectors = [
      '[data-testid="renata-ai-toggle-button"]',
      '[data-renata="true"]',
      'button:has-text("Renata")'
    ];

    let renataButton = null;
    for (const selector of renataSelectors) {
      try {
        renataButton = await page.$(selector);
        if (renataButton) {
          const isVisible = await renataButton.isVisible();
          if (isVisible) {
            console.log(`  ✅ Found Renata toggle button: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (renataButton) {
      console.log('  🖱️  Clicking Renata toggle button...');
      await renataButton.click();
      await page.waitForTimeout(2000);

      // Check if sidebar opened
      const sidebarVisible = await page.$('.fixed.right-0.top-16');
      console.log(`  📊 Sidebar visible after Renata click: ${sidebarVisible ? 'YES' : 'NO'}`);

      await page.screenshot({ path: 'traderra_after_renata_click.png' });
      console.log('  📸 Screenshot saved: traderra_after_renata_click.png');

      // Try clicking again to close
      console.log('  🖱️  Clicking Renata toggle button again to close...');
      await renataButton.click();
      await page.waitForTimeout(2000);

      const sidebarStillVisible = await page.$('.fixed.right-0.top-16');
      console.log(`  📊 Sidebar visible after second click: ${sidebarStillVisible ? 'YES' : 'NO'}`);

      // Try opening again
      console.log('  🖱️  Clicking Renata toggle button again to reopen...');
      await renataButton.click();
      await page.waitForTimeout(2000);

      const sidebarReopened = await page.$('.fixed.right-0.top-16');
      console.log(`  📊 Sidebar visible after third click: ${sidebarReopened ? 'YES' : 'NO'}`);
    } else {
      console.log('  ❌ Renata toggle button not found');
    }

    // Test 4: Check for console errors
    console.log('\n🔍 TEST 4: Checking for errors...');

    // Get page HTML to analyze structure
    const pageContent = await page.content();
    const hasDateSelector = pageContent.includes('traderview-date-selector') || pageContent.includes('date-selector');
    const hasDisplayMode = pageContent.includes('display-mode-toggle') || pageContent.includes('display-mode');
    const hasRenata = pageContent.includes('renata') || pageContent.includes('Renata');

    console.log(`  📊 Date selector in HTML: ${hasDateSelector ? 'YES' : 'NO'}`);
    console.log(`  📊 Display mode toggle in HTML: ${hasDisplayMode ? 'YES' : 'NO'}`);
    console.log(`  📊 Renata in HTML: ${hasRenata ? 'YES' : 'NO'}`);

    // Keep browser open for manual inspection
    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 30 seconds for manual verification');
    console.log('='.repeat(70));
    console.log('\nPlease check manually:');
    console.log('1. Are the date range buttons (7d, 30d, 90d, YTD, All) visible?');
    console.log('2. Is the calendar button visible?');
    console.log('3. Are the $ and R buttons visible?');
    console.log('4. Do clicking these buttons work?');
    console.log('5. Does the Renata sidebar open/close correctly?');
    console.log('6. Check browser console (F12) for errors');

    await page.waitForTimeout(30000);

    console.log('\n' + '='.repeat(70));
    console.log('🎯 Test Complete');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (page) {
      await page.screenshot({ path: 'traderra_test_error.png' });
      console.log('📸 Error screenshot saved: traderra_test_error.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testSecondaryNavAndRenata().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
