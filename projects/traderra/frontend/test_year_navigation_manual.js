#!/usr/bin/env node

/**
 * Test year navigation - manual verification with console logs
 */

const { chromium } = require('playwright');

async function testYearNavigationManual() {
  console.log('🧪 Testing Year Navigation (Manual Verification)\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`  📝 ${text}`);
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for initial load...');
    await page.waitForTimeout(5000);

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

    // Find and click previous year button
    console.log('\n🔍 Finding Previous Year button...');
    const buttons = await page.$$('button');

    for (const btn of buttons) {
      const title = await btn.getAttribute('title');
      if (title === 'Previous year') {
        console.log('\n🖱️  Clicking Previous Year button...');
        await btn.click();
        break;
      }
    }

    // Wait for React to update
    console.log('\n⏳ Waiting for React to update...');
    await page.waitForTimeout(3000);

    const newYear = await page.evaluate(() => {
      const yearSpan = Array.from(document.querySelectorAll('span')).find(el =>
        el.textContent && /^\d{4}$/.test(el.textContent.trim()) && parseInt(el.textContent) > 2000 && parseInt(el.textContent) < 2100
      );
      return yearSpan ? parseInt(yearSpan.textContent) : null;
    });

    console.log('\n📊 Year after clicking Previous:', newYear);

    if (newYear !== initialYear) {
      console.log('\n✅ SUCCESS: Year navigation is working!');
      console.log(`   Changed from ${initialYear} to ${newYear}`);

      // Try clicking again
      const buttons2 = await page.$$('button');
      for (const btn of buttons2) {
        const title = await btn.getAttribute('title');
        if (title === 'Previous year') {
          console.log('\n🖱️  Clicking Previous Year button again...');
          await btn.click();
          break;
        }
      }

      await page.waitForTimeout(3000);

      const thirdYear = await page.evaluate(() => {
        const yearSpan = Array.from(document.querySelectorAll('span')).find(el =>
          el.textContent && /^\d{4}$/.test(el.textContent.trim()) && parseInt(el.textContent) > 2000 && parseInt(el.textContent) < 2100
        );
        return yearSpan ? parseInt(yearSpan.textContent) : null;
      });

      console.log('\n📊 Year after clicking Previous again:', thirdYear);

      if (thirdYear !== newYear) {
        console.log('\n✅ SUCCESS: Year navigation continues to work!');
        console.log(`   Changed from ${newYear} to ${thirdYear}`);
      }
    } else {
      console.log('\n⚠️  Year did not change after clicking');
    }

    console.log('\n✅ Test complete. Browser will stay open for manual verification...');
    console.log('   You can manually click the year navigation buttons to verify.');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testYearNavigationManual().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
