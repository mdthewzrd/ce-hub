#!/usr/bin/env node

/**
 * Test secondary navigation buttons
 */

const { chromium } = require('playwright');

async function testSecondaryNav() {
  console.log('🧪 Testing Secondary Navigation Buttons\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    // Check what secondary nav elements exist
    console.log('\n🔍 Finding secondary navigation elements:');
    const secondaryNavElements = await page.evaluate(() => {
      const results = [];

      // Find date range buttons
      const dateRangeButtons = document.querySelectorAll('[data-testid*="date"], button[data-range]');
      dateRangeButtons.forEach(btn => {
        results.push({
          type: 'date-range',
          text: btn.textContent?.trim(),
          testid: btn.getAttribute('data-testid'),
          range: btn.getAttribute('data-range'),
        });
      });

      // Find display mode buttons ($, R)
      const displayButtons = document.querySelectorAll('[data-mode-value], [data-testid*="display-mode"], button[id*="display-mode"]');
      displayButtons.forEach(btn => {
        results.push({
          type: 'display-mode',
          text: btn.textContent?.trim(),
          testid: btn.getAttribute('data-testid'),
          modeValue: btn.getAttribute('data-mode-value'),
          id: btn.id,
        });
      });

      return results;
    });
    console.log('  ', JSON.stringify(secondaryNavElements, null, 2));

    // Try clicking R button
    console.log('\n🖱️  Looking for R button to click...');
    const rButtonSelectors = [
      '#display-mode-r-button',
      '[data-testid="display-mode-r"]',
      '[data-mode-value="r"]',
      'button:has-text("R")',
    ];

    let rButton = null;
    let selectorUsed = null;

    for (const selector of rButtonSelectors) {
      try {
        rButton = await page.$(selector);
        if (rButton) {
          selectorUsed = selector;
          console.log(`  ✅ Found R button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Selector not found, try next
      }
    }

    if (rButton) {
      console.log('\n🖱️  Clicking R button...');
      await rButton.click();
      await page.waitForTimeout(500);

      // Check if something changed
      const afterClick = await page.evaluate(() => {
        const rButton = document.querySelector('#display-mode-r-button, [data-mode-value="r"]');
        return {
          rButtonExists: !!rButton,
          rButtonActive: rButton ? rButton.classList.contains('bg-primary') || rButton.classList.contains('bg-primary/10') : false,
        };
      });
      console.log('  After click:', JSON.stringify(afterClick, null, 2));
    } else {
      console.log('  ❌ Could not find R button!');
    }

    // Try date range buttons
    console.log('\n🖱️  Looking for date range buttons...');
    const dateRangeSelectors = [
      '[data-range="week"]',
      '[data-range="month"]',
      '[data-range="quarter"]',
      '[data-range="year"]',
      '[data-range="all"]',
    ];

    for (const selector of dateRangeSelectors) {
      const btn = await page.$(selector);
      if (btn) {
        const text = await btn.textContent();
        console.log(`  ✅ Found date button with selector "${selector}": "${text?.trim()}"`);
      }
    }

    console.log('\n✅ Test complete. Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testSecondaryNav().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
