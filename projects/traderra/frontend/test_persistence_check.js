#!/usr/bin/env node

/**
 * Test that calendar data persists (doesn't disappear)
 */

const { chromium } = require('playwright');

async function testPersistence() {
  console.log('🧪 Testing Calendar Data Persistence\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Calendar]') || text.includes('Generating')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Checking data immediately after load...');
    await page.waitForTimeout(1000);

    const immediateCheck = await page.evaluate(() => {
      const firstMonth = document.querySelector('button.studio-surface');

      // Parse from spans
      const spans = Array.from(firstMonth?.querySelectorAll('span') || []);
      let tradingDays = '0';

      for (let i = 0; i < spans.length; i++) {
        const text = spans[i].textContent?.trim() || '';
        if (text === 'Trading Days' && spans[i + 1]) {
          tradingDays = spans[i + 1].textContent?.trim() || '0';
          break;
        }
      }

      return {
        tradingDays,
        hasData: tradingDays !== '0'
      };
    });

    console.log('  Immediate check:', immediateCheck);

    console.log('\n⏳ Waiting 5 seconds to check persistence...');
    await page.waitForTimeout(5000);

    const laterCheck = await page.evaluate(() => {
      const firstMonth = document.querySelector('button.studio-surface');

      // Parse from spans instead of text content
      const spans = Array.from(firstMonth?.querySelectorAll('span') || []);
      let tradingDays = '0';
      let winningDays = '0';
      let totalTrades = '0';

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

      return {
        tradingDays,
        winningDays,
        totalTrades,
        hasData: tradingDays !== '0'
      };
    });

    console.log('  After 5 seconds:', laterCheck);

    if (laterCheck.tradingDays && parseInt(laterCheck.tradingDays) > 0) {
      console.log('\n✅ SUCCESS! Data is persisting correctly!');
      console.log(`   Trading Days: ${laterCheck.tradingDays}`);
      console.log(`   Winning Days: ${laterCheck.winningDays}`);
      console.log(`   Total Trades: ${laterCheck.totalTrades}`);
      console.log('\n   The calendar data is NOT disappearing.');
    } else {
      console.log('\n❌ Data disappeared after initial load.');
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

testPersistence().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
