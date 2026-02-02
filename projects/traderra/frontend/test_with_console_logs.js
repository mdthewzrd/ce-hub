#!/usr/bin/env node

/**
 * Test with console logs and data attributes
 */

const { chromium } = require('playwright');

async function testWithLogs() {
  console.log('🧪 Testing with Console Logs\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AppLayout')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    console.log('\n🔍 Checking main element data attributes:');
    const mainInfo = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return { error: 'No main element found' };

      return {
        dataSidebarOpen: main.getAttribute('data-sidebar-open'),
        dataMarginRight: main.getAttribute('data-margin-right'),
        inlineStyle: main.getAttribute('style'),
        marginRight_computed: window.getComputedStyle(main).marginRight,
      };
    });
    console.log('  ', JSON.stringify(mainInfo, null, 2));

    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);

      const afterClick = await page.evaluate(() => {
        const main = document.querySelector('main');
        return {
          dataSidebarOpen: main?.getAttribute('data-sidebar-open'),
          dataMarginRight: main?.getAttribute('data-margin-right'),
          inlineStyle: main?.getAttribute('style'),
          marginRight_computed: main ? window.getComputedStyle(main).marginRight : null,
        };
      });
      console.log('\n  After click:', JSON.stringify(afterClick, null, 2));
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

testWithLogs().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
