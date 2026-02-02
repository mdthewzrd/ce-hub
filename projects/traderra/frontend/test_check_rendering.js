#!/usr/bin/env node

/**
 * Check if calendar is rendering
 */

const { chromium } = require('playwright');

async function checkRendering() {
  console.log('🧪 Checking Calendar Rendering\n');

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
    await page.waitForTimeout(3000);

    console.log('\n🔍 Checking rendering:');
    const check = await page.evaluate(() => {
      const body = document.body;

      return {
        title: document.title,
        hasMonthCards: document.querySelectorAll('button.studio-surface').length > 0,
        monthCardsCount: document.querySelectorAll('button.studio-surface').length,
        bodyTextPreview: body.textContent?.substring(0, 300),
        hasReact: typeof window !== 'undefined' && '__NEXT_DATA__' in window,
        nextData: window['__NEXT_DATA__'] ? 'present' : 'missing'
      };
    });

    console.log('  ', JSON.stringify(check, null, 2));

    console.log('\n✅ Check complete. Keeping browser open for 3 seconds...');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkRendering().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
