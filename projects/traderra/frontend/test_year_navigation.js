#!/usr/bin/env node

/**
 * Test year navigation on calendar
 */

const { chromium } = require('playwright');

async function testYearNavigation() {
  console.log('🧪 Testing Year Navigation on Calendar\n');

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

    console.log('\n⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);

    // Get initial year
    const initialYear = await page.evaluate(() => {
      const yearSpan = Array.from(document.querySelectorAll('span')).find(el =>
        el.textContent && /^\d{4}$/.test(el.textContent.trim()) && parseInt(el.textContent) > 2000 && parseInt(el.textContent) < 2100
      );
      return yearSpan ? parseInt(yearSpan.textContent) : null;
    });

    console.log('\n📊 Initial year:', initialYear);

    if (!initialYear) {
      console.log('❌ Could not find year display');
      return;
    }

    // Find previous year button
    const prevButton = await page.locator('button').filter(async btn => {
      const text = await btn.textContent();
      return text && text.includes('◀') && await btn.isVisible();
    }).or(
      page.locator('button[title="Previous year"]')
    ).or(
      page.locator('button').filter(async btn => {
        const hasChevron = await btn.$('svg');
        return hasChevron !== null;
      })
    ).first();

    const prevCount = await prevButton.count();
    console.log('\n🔍 Found previous year buttons:', prevCount);

    // Try to find and click previous year button
    const buttons = await page.$$('button');
    let prevYearButton = null;
    let nextYearButton = null;

    for (const btn of buttons) {
      const title = await btn.getAttribute('title');
      const text = await btn.textContent();

      if (title === 'Previous year' || (text && text.includes('◀'))) {
        prevYearButton = btn;
      }
      if (title === 'Next year' || (text && text.includes('▶'))) {
        nextYearButton = btn;
      }
    }

    if (prevYearButton) {
      console.log('\n🔍 Clicking Previous Year button...');
      await prevYearButton.click();

      // Wait for React to update the DOM
      await page.waitForTimeout(2000);

      const newYear = await page.evaluate(() => {
        const yearSpan = Array.from(document.querySelectorAll('span')).find(el =>
          el.textContent && /^\d{4}$/.test(el.textContent.trim()) && parseInt(el.textContent) > 2000 && parseInt(el.textContent) < 2100
        );
        return yearSpan ? parseInt(yearSpan.textContent) : null;
      });

      console.log('   Year after clicking Previous:', newYear);

      if (newYear === initialYear - 1) {
        console.log('   ✅ PASS: Year navigation is working!');
      } else {
        console.log('   ⚠️  Expected:', initialYear - 1, 'but got:', newYear);
      }

      // Find the button again as DOM may have changed
      const buttons2 = await page.$$('button');
      let prevYearButton2 = null;

      for (const btn of buttons2) {
        const title = await btn.getAttribute('title');
        if (title === 'Previous year') {
          prevYearButton2 = btn;
          break;
        }
      }

      if (prevYearButton2) {
        // Click again to verify it continues working
        console.log('\n🔍 Clicking Previous Year button again...');
        await prevYearButton2.click();

        // Wait for React to update
        await page.waitForTimeout(2000);

        const thirdYear = await page.evaluate(() => {
          const yearSpan = Array.from(document.querySelectorAll('span')).find(el =>
            el.textContent && /^\d{4}$/.test(el.textContent.trim()) && parseInt(el.textContent) > 2000 && parseInt(el.textContent) < 2100
          );
          return yearSpan ? parseInt(yearSpan.textContent) : null;
        });

        console.log('   Year after clicking Previous again:', thirdYear);

        if (thirdYear === newYear - 1) {
          console.log('   ✅ PASS: Year navigation continues to work!');
        } else {
          console.log('   ⚠️  Expected:', newYear - 1, 'but got:', thirdYear);
        }
      }
    } else {
      console.log('\n⚠️  Previous year button not found');
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

testYearNavigation().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
