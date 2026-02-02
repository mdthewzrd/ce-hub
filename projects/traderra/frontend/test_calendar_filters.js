#!/usr/bin/env node

/**
 * Verify calendar page has filter buttons and proper spacing
 */

const { chromium } = require('playwright');

async function verifyCalendarPage() {
  console.log('🧪 Verifying Calendar Page Fixes\n');

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
    await page.waitForTimeout(2000);

    console.log('\n🔍 Checking for filter buttons:');
    const filterCheck = await page.evaluate(() => {
      const results = {
        displayModeToggle: !!document.querySelector('[data-testid="display-mode-toggle"]'),
        dateSelector: !!document.querySelector('[data-testid="date-selector"]'),
        dateButtons: {
          week: !!document.querySelector('[data-range="week"]'),
          month: !!document.querySelector('[data-range="month"]'),
          year: !!document.querySelector('[data-range="year"]'),
          all: !!document.querySelector('[data-range="all"]'),
        },
        dollarButton: !!document.querySelector('#display-mode-dollar-button'),
        rButton: !!document.querySelector('#display-mode-r-button'),
        viewModeToggle: {
          year: Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === 'Year'),
          month: Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === 'Month'),
        },
      };
      return results;
    });
    console.log('  ', JSON.stringify(filterCheck, null, 2));

    const allPresent = Object.values(filterCheck.dateButtons).every(v => v === true) &&
                        filterCheck.displayModeToggle &&
                        filterCheck.dateSelector &&
                        filterCheck.dollarButton &&
                        filterCheck.rButton;

    if (allPresent) {
      console.log('\n✅ All filter buttons are present!');
    } else {
      console.log('\n❌ Some filter buttons are missing!');
    }

    console.log('\n🔍 Checking spacing:');
    const spacingCheck = await page.evaluate(() => {
      const container = document.querySelector('.overflow-y-auto');
      if (!container) return { error: 'Container not found' };

      const styles = window.getComputedStyle(container);
      return {
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        className: container.className,
      };
    });
    console.log('  ', JSON.stringify(spacingCheck, null, 2));

    console.log('\n✅ Verification complete. Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

verifyCalendarPage().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
