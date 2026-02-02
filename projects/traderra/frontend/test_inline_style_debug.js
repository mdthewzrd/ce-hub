#!/usr/bin/env node

/**
 * Debug inline style application
 */

const { chromium } = require('playwright');

async function debugInlineStyles() {
  console.log('🧪 Debugging Inline Style Application\n');

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

    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    console.log('\n🔍 Checking main element style attribute:');
    const mainInfo = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return { error: 'No main element found' };

      const styles = window.getComputedStyle(main);
      const inlineStyle = main.getAttribute('style');

      return {
        inlineStyle: inlineStyle,
        marginRight_computed: styles.marginRight,
        display: styles.display,
        flex: styles.flex,
        width: styles.width,
      };
    });
    console.log('  ', JSON.stringify(mainInfo, null, 2));

    // Check if inline style is present
    if (mainInfo.inlineStyle && mainInfo.inlineStyle.includes('margin-right')) {
      console.log('✅ Inline style for margin-right is present!');
      console.log(`   Value: ${mainInfo.inlineStyle}`);
    } else {
      console.log('❌ Inline style for margin-right is NOT present!');
    }

    // Check if computed style matches inline
    if (mainInfo.marginRight_computed === '480px') {
      console.log('✅ Computed margin-right is 480px');
    } else {
      console.log(`❌ Computed margin-right is ${mainInfo.marginRight_computed}, expected 480px`);
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

debugInlineStyles().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
