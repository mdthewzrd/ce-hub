#!/usr/bin/env node

/**
 * Manual test - Verify all buttons $ R G N work
 */

const { chromium } = require('playwright');

async function manualToggleButtonTest() {
  console.log('🧪 Manual Toggle Button Test ($ R G N)\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 500 // Slow down actions for visual verification
    });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    console.log('\n✅ Page loaded! You can now manually test the buttons:');
    console.log('   1. Click the $ button (should highlight when active)');
    console.log('   2. Click the R button (should highlight when active)');
    console.log('   3. Click the G button (should highlight when active)');
    console.log('   4. Click the N button (should highlight when active)');
    console.log('\n   The buttons are located at the top of the page next to "Trading Calendar"');

    // Let's also programmatically click each one to show they work
    console.log('\n🤖 Programmatic test:');

    const buttons = {
      dollar: null,
      r: null,
      g: null,
      n: null
    };

    // Find all buttons
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const id = await btn.getAttribute('id');

      if (text?.trim() === '$' || id === 'display-mode-dollar-button') {
        buttons.dollar = btn;
      }
      if (text?.trim() === 'R' || id === 'display-mode-r-button') {
        buttons.r = btn;
      }
      if (text?.trim() === 'G' || id === 'pnl-mode-gross-button') {
        buttons.g = btn;
      }
      if (text?.trim() === 'N' || id === 'pnl-mode-net-button') {
        buttons.n = btn;
      }
    }

    // Test each button
    const buttonOrder = ['dollar', 'r', 'g', 'n'];
    const labels = { dollar: '$', r: 'R', g: 'G', n: 'N' };

    for (const key of buttonOrder) {
      const btn = buttons[key];
      if (btn) {
        console.log(`\n   Clicking ${labels[key]} button...`);
        await btn.click();
        await page.waitForTimeout(1000);
        console.log(`   ✓ ${labels[key]} button clicked successfully`);
      } else {
        console.log(`   ✗ ${labels[key]} button not found`);
      }
    }

    console.log('\n✅ All buttons tested! Browser will stay open for 10 seconds...');
    console.log('   You can continue manually testing if needed.');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

manualToggleButtonTest().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
