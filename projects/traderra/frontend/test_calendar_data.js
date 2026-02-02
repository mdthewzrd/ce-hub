#!/usr/bin/env node

/**
 * Debug calendar trade data
 */

const { chromium } = require('playwright');

async function debugCalendarData() {
  console.log('🧪 Debugging Calendar Trade Data\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('trade') || text.includes('Trade') || text.includes('1760')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    console.log('\n🔍 Checking if trades are loaded:');
    const dataCheck = await page.evaluate(() => {
      // Check window for trade data
      const calendarDays = document.querySelectorAll('[class*="grid-cols-7"] > div');
      const monthCards = document.querySelectorAll('button.studio-surface');

      return {
        monthCardsCount: monthCards.length,
        hasCalendarGrid: calendarDays.length > 0,
        firstMonthCardHTML: monthCards[0]?.innerHTML.substring(0, 500),
        sampleDayBox: Array.from(calendarDays).slice(0, 5).map(el => ({
          className: el.className,
          textContent: el.textContent?.trim().substring(0, 50),
        })),
      };
    });
    console.log('  ', JSON.stringify(dataCheck, null, 2));

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

debugCalendarData().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
