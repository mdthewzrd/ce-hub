#!/usr/bin/env node

/**
 * Debug Calendar Page - Check Main Classes and Context
 */

const { chromium } = require('playwright');

async function debugCalendar() {
  console.log('🧪 Debugging Calendar Page\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`  📝 ${text}`);
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    console.log('\n🔍 Inspecting main element and its classes:');
    const mainInfo = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return { error: 'No main element found' };

      const styles = window.getComputedStyle(main);
      const allClasses = Array.from(main.classList);

      return {
        tagName: main.tagName,
        className: main.className,
        allClasses: allClasses,
        marginRight: styles.marginRight,
        marginLeft: styles.marginLeft,
        width: styles.width,
        flex: styles.flex,
        flexShrink: styles.flexShrink,
        flexGrow: styles.flexGrow,
      };
    });
    console.log('  ', JSON.stringify(mainInfo, null, 2));

    console.log('\n🔍 Checking computed styles for main with mr-[480px]:');
    const marginCheck = await page.evaluate(() => {
      // Create a test element with the mr-[480px] class
      const testDiv = document.createElement('div');
      testDiv.className = 'mr-[480px]';
      testDiv.style.visibility = 'hidden';
      document.body.appendChild(testDiv);

      const computedStyle = window.getComputedStyle(testDiv);
      const result = {
        marginRight: computedStyle.marginRight,
        testPassed: computedStyle.marginRight === '480px'
      };

      document.body.removeChild(testDiv);
      return result;
    });
    console.log('  ', JSON.stringify(marginCheck, null, 2));

    console.log('\n🔍 Checking AppLayout render state:');
    const appLayoutInfo = await page.evaluate(() => {
      // Find elements with studio-bg class (should be the AppLayout wrapper)
      const appLayout = document.querySelector('[class*="studio-bg"]');
      const main = document.querySelector('main');
      const sidebar = document.querySelector('.fixed.right-0.top-16');

      return {
        appLayoutExists: !!appLayout,
        mainClasses: main ? Array.from(main.classList) : null,
        sidebarExists: !!sidebar,
        sidebarRight: sidebar ? window.getComputedStyle(sidebar).right : null,
        sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : null,
      };
    });
    console.log('  ', JSON.stringify(appLayoutInfo, null, 2));

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

debugCalendar().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
