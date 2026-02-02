#!/usr/bin/env node

/**
 * Test date range filtering on calendar
 */

const { chromium } = require('playwright');

async function testDateRangeFiltering() {
  console.log('🧪 Testing Date Range Filtering on Calendar\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Calendar]') || text.includes('Filtered')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);

    // Test clicking different date range buttons
    const dateRanges = [
      { name: '7d', text: '7d' },
      { name: '30d', text: '30d' },
      { name: '90d', text: '90d' },
      { name: 'YTD', text: 'YTD' },
      { name: 'All', text: 'All' }
    ];

    for (const range of dateRanges) {
      console.log(`\n🔍 Testing ${range.name} filter:`);

      // Try multiple selector strategies
      const button = await page.locator(`button[data-range="${range.name}"]`).or(
        page.locator(`button[data-testid="date-range-${range.name}"]`)
      ).or(
        page.locator('button', { hasText: range.text })
      ).first();

      const count = await button.count();
      if (count > 0) {
        await button.click();
        await page.waitForTimeout(2000);

        const check = await page.evaluate(() => {
          const firstCard = document.querySelector('button.studio-surface');
          const spans = Array.from(firstCard?.querySelectorAll('span') || []);
          let tradingDays = '0';

          for (let i = 0; i < spans.length; i++) {
            const text = spans[i].textContent?.trim() || '';
            if (text === 'Trading Days' && spans[i + 1]) {
              tradingDays = spans[i + 1].textContent?.trim() || '0';
              break;
            }
          }

          return { tradingDays };
        });

        console.log(`   Trading Days: ${check.tradingDays}`);
      } else {
        console.log(`   Button not found for ${range.name}`);
      }
    }

    console.log('\n✅ Test complete. Keeping browser open for 3 seconds...');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testDateRangeFiltering().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
