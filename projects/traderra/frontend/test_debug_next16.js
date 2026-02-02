#!/usr/bin/env node

/**
 * Debug Next.js 16 calendar issue
 */

const { chromium } = require('playwright');

async function debugIssue() {
  console.log('🧪 Debugging Next.js 16 Calendar Issue\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture ALL console messages and errors
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        console.log(`  ❌ ERROR: ${text}`);
      } else if (type === 'warning') {
        console.log(`  ⚠️  WARNING: ${text}`);
      } else if (text.includes('[Calendar]') || text.includes('useTrades') || text.includes('sample')) {
        console.log(`  📝 ${text}`);
      }
    });

    // Also catch page errors
    page.on('pageerror', error => {
      console.log(`  🚨 PAGE ERROR: ${error.message}`);
      console.log(`     Stack: ${error.stack}`);
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting 5 seconds for errors to appear...');
    await page.waitForTimeout(5000);

    console.log('\n🔍 Checking page state:');
    const pageState = await page.evaluate(() => {
      // Check if React is working
      const hasReact = typeof React !== 'undefined' || typeof window !== 'undefined' && window.React;

      // Check for any error elements
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');

      // Check calendar
      const monthCards = document.querySelectorAll('button.studio-surface');

      return {
        hasReact,
        errorCount: errorElements.length,
        monthCardsCount: monthCards.length,
        firstCardHTML: monthCards[0]?.innerHTML?.substring(0, 500),
        bodyText: document.body.textContent?.substring(0, 500)
      };
    });

    console.log('  ', JSON.stringify(pageState, null, 2));

    console.log('\n✅ Debug complete. Keeping browser open for 3 seconds...');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugIssue().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
