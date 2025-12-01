const { chromium } = require('playwright');

async function simpleRenataCheck() {
  console.log('🚀 Simple Renata visibility check...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting 5 seconds for full load...');
    await page.waitForTimeout(5000);

    // Simple text search for Renata
    console.log('🔍 Searching for "Renata" text on page...');
    const renataTextExists = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.toLowerCase().includes('renata');
    });

    console.log('📊 Result:');
    console.log('   Renata text found:', renataTextExists ? '✅ YES' : '❌ NO');

    // Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/simple_renata_check.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: simple_renata_check.png');

    // Get page title
    const title = await page.title();
    console.log('📄 Page title:', title);

    // Check if page loaded properly
    const bodyLength = await page.evaluate(() => document.body.innerHTML.length);
    console.log('📏 Page body length:', bodyLength, 'characters');

    if (bodyLength < 1000) {
      console.log('⚠️ WARNING: Page might not be loading properly');
    } else {
      console.log('✅ Page appears to be loading normally');
    }

    console.log('\n🎯 Summary:');
    if (renataTextExists) {
      console.log('✅ SUCCESS: Renata text found on the page');
    } else {
      console.log('❌ ISSUE: No Renata text found on the page');
      console.log('   This suggests the component might not be rendering properly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🔄 Keeping browser open for manual inspection...');
    console.log('📝 Check the screenshot and browser to see what\'s actually displayed');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

simpleRenataCheck().catch(console.error);