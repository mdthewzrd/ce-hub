#!/usr/bin/env node

/**
 * Debug calendar stats rendering
 */

const { chromium } = require('playwright');

async function debugCalendarStats() {
  console.log('🧪 Debugging Calendar Stats\n');

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

    console.log('\n🔍 Inspecting first month card HTML:');
    const htmlDebug = await page.evaluate(() => {
      const firstCard = document.querySelector('button.studio-surface');

      if (!firstCard) {
        return { error: 'No month card found' };
      }

      // Get the inner HTML of the stats section
      const innerHTML = firstCard.innerHTML;

      // Get text content
      const textContent = firstCard.textContent;

      // Try to find stats with different selectors
      const allSpans = Array.from(firstCard.querySelectorAll('span')).map(span => ({
        text: span.textContent?.trim(),
        className: span.className
      }));

      return {
        innerHTMLSnippet: innerHTML.substring(0, 1500),
        textContentSnippet: textContent?.substring(0, 500),
        allSpans
      };
    });

    console.log('\n📄 Text Content:');
    console.log('  ', htmlDebug.textContentSnippet);

    console.log('\n🏷️  All Spans:');
    htmlDebug.allSpans.forEach((span, i) => {
      if (span.text) {
        console.log(`  [${i}] "${span.text}" (class: ${span.className})`);
      }
    });

    console.log('\n📋 HTML Snippet (first 1500 chars):');
    console.log(htmlDebug.innerHTMLSnippet);

    console.log('\n✅ Debug complete. Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugCalendarStats().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
