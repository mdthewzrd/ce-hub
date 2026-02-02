#!/usr/bin/env node

/**
 * Quick Test for AppLayout Debug Logging
 */

const { chromium } = require('playwright');

async function quickTest() {
  console.log('🧪 Quick Test for AppLayout Debug Logs\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AppLayout') || text.includes('aiSidebarOpen')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for initial render...');
    await page.waitForTimeout(2000);

    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(1000);

      console.log('\n🖱️  Clicking toggle button again...');
      await button.click();
      await page.waitForTimeout(1000);

      console.log('\n🖱️  Clicking toggle button third time...');
      await button.click();
      await page.waitForTimeout(1000);
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

quickTest().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
