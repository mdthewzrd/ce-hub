#!/usr/bin/env node

/**
 * Final test for calendar page
 */

const { chromium } = require('playwright');

async function testCalendar() {
  console.log('🧪 Final Calendar Page Test\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    const checkState = async (label) => {
      return await page.evaluate((lbl) => {
        const main = document.querySelector('main');
        const sidebar = document.querySelector('.fixed.right-0.top-16');
        const pageHeader = document.querySelector('.fixed.top-16.left-0.z-40');

        return {
          label: lbl,
          mainMarginRight: main ? window.getComputedStyle(main).marginRight : null,
          sidebarExists: !!sidebar,
          sidebarWidth: sidebar ? window.getComputedStyle(sidebar).width : null,
          pageHeaderMargin: pageHeader ? window.getComputedStyle(pageHeader).right : null,
        };
      }, label);
    };

    console.log('\n📊 Initial state:');
    let state = await checkState('Initial');
    console.log('  ', JSON.stringify(state, null, 2));

    console.log('\n🖱️  Clicking toggle button to close sidebar...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);

      state = await checkState('After closing');
      console.log('  ', JSON.stringify(state, null, 2));

      if (!state.sidebarExists && state.mainMarginRight === '0px') {
        console.log('\n✅ Sidebar closed successfully!');
      }

      console.log('\n🖱️  Clicking toggle button to open sidebar...');
      await button.click();
      await page.waitForTimeout(500);

      state = await checkState('After opening');
      console.log('  ', JSON.stringify(state, null, 2));

      if (state.sidebarExists && state.mainMarginRight === '480px') {
        console.log('\n✅ Sidebar opened successfully with proper margin!');
      }
    }

    console.log('\n✅ Test complete. Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testCalendar().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
