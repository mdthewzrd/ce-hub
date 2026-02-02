#!/usr/bin/env node

/**
 * Inspect actual DOM structure
 */

const { chromium } = require('playwright');

async function inspectDOM() {
  console.log('🧪 Inspecting DOM Structure\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AppLayout')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    console.log('\n🔍 Full DOM structure:');
    const domStructure = await page.evaluate(() => {
      const body = document.body;
      let current = body;
      let depth = 0;
      const maxDepth = 10;
      const result = [];

      function traverse(element, depth) {
        if (depth > maxDepth) return;
        if (element.tagName === 'MAIN') {
          result.push({
            depth,
            tag: element.tagName,
            className: element.className,
            id: element.id,
            attributes: Array.from(element.attributes).map(a => ({ name: a.name, value: a.value })),
            style: element.getAttribute('style'),
            parent: element.parentElement?.className,
          });
        }
        Array.from(element.children).forEach(child => traverse(child, depth + 1));
      }

      traverse(body, 0);
      return result;
    });
    console.log('  ', JSON.stringify(domStructure, null, 2));

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

inspectDOM().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
