#!/usr/bin/env node

/**
 * Check trade date ranges
 */

const { chromium } = require('playwright');

async function checkTradeDates() {
  console.log('🧪 Checking Trade Date Ranges\n');

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

    console.log('\n⏳ Waiting for trades to load...');
    await page.waitForTimeout(3000);

    console.log('\n🔍 Checking trade dates:');
    const dateInfo = await page.evaluate(() => {
      // Get trade dates from window or make an API call
      const sampleDates = [];

      // Try to get some sample data
      const tableRows = document.querySelectorAll('table tbody tr');
      if (tableRows.length > 0) {
        Array.from(tableRows).slice(0, 10).forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const dateCell = cells[0];
            sampleDates.push(dateCell.textContent?.trim());
          }
        });
      }

      return {
        sampleDates: sampleDates,
        tableRowsCount: tableRows.length,
      };
    });
    console.log('  ', JSON.stringify(dateInfo, null, 2));

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

checkTradeDates().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
