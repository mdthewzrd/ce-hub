#!/usr/bin/env node

/**
 * Compare Calendar vs Trades pages
 */

const { chromium } = require('playwright');

async function comparePages() {
  console.log('🧪 Comparing Calendar vs Trades Pages\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    const checkState = async (label) => {
      return await page.evaluate((lbl) => {
        const main = document.querySelector('main');
        const sidebar = document.querySelector('.fixed.right-0.top-16');
        const topNav = document.querySelector('.fixed.top-0.left-0.z-50');

        return {
          label: lbl,
          mainMarginRight: main ? window.getComputedStyle(main).marginRight : null,
          sidebarExists: !!sidebar,
          sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : null,
          topNavRightClasses: topNav ? Array.from(topNav.classList).filter(c => c.includes('right-')) : null,
        };
      }, label);
    };

    // Test trades page first
    console.log('📍 Testing /trades page:');
    await page.goto('http://localhost:6565/trades', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    let state = await checkState('trades - initial');
    console.log('  ', JSON.stringify(state, null, 2));

    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);

      state = await checkState('trades - after click');
      console.log('  ', JSON.stringify(state, null, 2));

      await button.click();
      await page.waitForTimeout(500);

      state = await checkState('trades - after second click');
      console.log('  ', JSON.stringify(state, null, 2));
    }

    // Now test calendar page
    console.log('\n📍 Testing /calendar page:');
    await page.goto('http://localhost:6565/calendar', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    state = await checkState('calendar - initial');
    console.log('  ', JSON.stringify(state, null, 2));

    const calButton = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (calButton) {
      await calButton.click();
      await page.waitForTimeout(500);

      state = await checkState('calendar - after click');
      console.log('  ', JSON.stringify(state, null, 2));
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

comparePages().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
