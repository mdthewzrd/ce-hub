#!/usr/bin/env node

/**
 * Test calendar with real trades (signed in)
 */

const { chromium } = require('playwright');

async function testCalendarWithTrades() {
  console.log('🧪 Testing Calendar with Real Trades\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Calendar]') || text.includes('Detected') || text.includes('Using')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for trades to load...');
    await page.waitForTimeout(5000);

    console.log('\n🔍 Checking calendar state:');
    const check = await page.evaluate(() => {
      const monthCards = document.querySelectorAll('button.studio-surface');
      const firstCard = monthCards[0];

      // Parse first card data
      const spans = Array.from(firstCard?.querySelectorAll('span') || []);
      let tradingDays = '0';
      let winningDays = '0';
      let totalTrades = '0';
      let monthName = '';
      let pnl = '';

      for (let i = 0; i < spans.length; i++) {
        const text = spans[i].textContent?.trim() || '';
        if (text === 'Trading Days' && spans[i + 1]) {
          tradingDays = spans[i + 1].textContent?.trim() || '0';
        }
        if (text === 'Winning Days' && spans[i + 1]) {
          winningDays = spans[i + 1].textContent?.trim() || '0';
        }
        if (text === 'Total Trades' && spans[i + 1]) {
          totalTrades = spans[i + 1].textContent?.trim() || '0';
        }
      }

      const titleEl = firstCard?.querySelector('h3');
      monthName = titleEl?.textContent?.trim() || '';

      const pnlBadge = firstCard?.querySelector('span[class*="bg-"]');
      pnl = pnlBadge?.textContent?.trim() || '';

      return {
        monthCardsCount: monthCards.length,
        firstMonth: monthName,
        tradingDays,
        winningDays,
        totalTrades,
        pnl,
        hasData: tradingDays !== '0'
      };
    });

    console.log('  ', JSON.stringify(check, null, 2));

    if (check.hasData) {
      console.log('\n✅ Calendar is showing trade data!');
      console.log(`   ${check.firstMonth}: ${check.tradingDays} trading days, ${check.winningDays} winning days`);
      console.log(`   P&L: ${check.pnl}`);
    } else {
      console.log('\n❌ Calendar is not showing trade data.');
      console.log('   The year may not match your trades.');
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

testCalendarWithTrades().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
