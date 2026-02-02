#!/usr/bin/env node

/**
 * Verify that classes are being applied correctly
 */

const { chromium } = require('playwright');

async function verifyClasses() {
  console.log('🧪 Verifying Class Changes\n');
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

    const checkClasses = async (label) => {
      return await page.evaluate((lbl) => {
        const topNav = document.querySelector('.fixed.top-0.left-0.z-50');
        const main = document.querySelector('main.flex-1');
        const sidebar = document.querySelector('.fixed.right-0.top-16');
        const button = document.querySelector('[data-testid="renata-ai-toggle-button"]');

        return {
          label: lbl,
          topNavClasses: topNav ? Array.from(topNav.classList).filter(c => c.includes('right-')) : null,
          mainMarginRight: main ? window.getComputedStyle(main).marginRight : null,
          sidebarExists: !!sidebar,
          sidebarStyles: sidebar ? {
            display: window.getComputedStyle(sidebar).display,
            visibility: window.getComputedStyle(sidebar).visibility,
            opacity: window.getComputedStyle(sidebar).opacity,
          } : null,
          buttonHasActiveBg: button ? button.classList.contains('bg-primary/10') : null,
        };
      }, label);
    };

    console.log('\n📊 Initial state:');
    let state = await checkClasses('Initial');
    console.log('  ', JSON.stringify(state, null, 2));

    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    await button.click();
    await page.waitForTimeout(500);

    state = await checkClasses('After first click');
    console.log('  ', JSON.stringify(state, null, 2));

    console.log('\n🖱️  Clicking toggle button again...');
    await button.click();
    await page.waitForTimeout(500);

    state = await checkClasses('After second click');
    console.log('  ', JSON.stringify(state, null, 2));

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

verifyClasses().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
