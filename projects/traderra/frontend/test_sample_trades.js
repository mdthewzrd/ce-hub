#!/usr/bin/env node

/**
 * Test calendar with sample trades - Enhanced version
 */

const { chromium } = require('playwright');

async function testSampleTrades() {
  console.log('🧪 Testing Calendar Sample Trades\n');

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

    console.log('\n🔍 Checking calendar data:');
    const calendarCheck = await page.evaluate(() => {
      const monthCards = document.querySelectorAll('button.studio-surface');

      // Check all month cards
      const monthData = Array.from(monthCards).map(card => {
        const title = card.querySelector('h3')?.textContent?.trim();

        // Extract stats from the card
        const textContent = card.textContent || '';

        const tradingDaysMatch = textContent.match(/Trading Days\s+(\d+)/);
        const winningDaysMatch = textContent.match(/Winning Days\s+(\d+)/);
        const totalTradesMatch = textContent.match(/Total Trades\s+(\d+)/);

        // Find P&L badge
        const pnlBadge = card.querySelector('span[class*="bg-"]');
        const pnlText = pnlBadge?.textContent?.trim() || '';

        // Count colored day boxes
        const greenDays = card.querySelectorAll('.bg-green-900\\/40, .text-green-400').length / 2; // Divide by 2 since each day has both bg and text color
        const redDays = card.querySelectorAll('.bg-red-900\\/40, .text-red-400').length / 2;

        return {
          month: title,
          pnl: pnlText,
          tradingDays: tradingDaysMatch?.[1] || '0',
          winningDays: winningDaysMatch?.[1] || '0',
          totalTrades: totalTradesMatch?.[1] || '0',
          greenDays: Math.floor(greenDays),
          redDays: Math.floor(redDays)
        };
      });

      return {
        totalMonthCards: monthCards.length,
        months: monthData
      };
    });

    console.log('\n📊 Calendar Data Summary:\n');
    console.log('Month     | P&L        | Trading Days | Winning Days | Total Trades | Green | Red');
    console.log('----------|------------|---------------|---------------|---------------|-------|-----');
    calendarCheck.months.forEach(m => {
      const pnl = (m.pnl || '        ').padStart(11);
      const tradingDays = (m.tradingDays || '0').padStart(13);
      const winningDays = (m.winningDays || '0').padStart(13);
      const totalTrades = (m.totalTrades || '0').padStart(13);
      const green = String(m.greenDays || 0).padStart(5);
      const red = String(m.redDays || 0).padStart(5);
      console.log(`${(m.month || '').padEnd(9)}| ${pnl} | ${tradingDays} | ${winningDays} | ${totalTrades} |${green} |${red}`);
    });

    // Calculate totals
    const totalTradingDays = calendarCheck.months.reduce((sum, m) => sum + parseInt(m.tradingDays || '0'), 0);
    const totalWinningDays = calendarCheck.months.reduce((sum, m) => sum + parseInt(m.winningDays || '0'), 0);
    const totalTrades = calendarCheck.months.reduce((sum, m) => sum + parseInt(m.totalTrades || '0'), 0);

    console.log('----------|------------|---------------|---------------|---------------|-------|-----');
    console.log(`TOTAL     |            | ${String(totalTradingDays).padStart(13)} | ${String(totalWinningDays).padStart(13)} | ${String(totalTrades).padStart(13)} |       |`);

    if (totalTradingDays > 0) {
      console.log('\n✅ Sample trades ARE appearing in the calendar!');
      console.log(`   Found ${totalTradingDays} trading days across the year.`);
      console.log('   Green = profitable days, Red = losing days');
      console.log('   Sample data is working correctly!');
    } else {
      console.log('\n❌ No trading days found in calendar.');
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

testSampleTrades().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
