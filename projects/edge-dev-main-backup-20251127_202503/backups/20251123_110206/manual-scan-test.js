const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`CONSOLE: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`ERROR: ${error.message}`);
  });

  try {
    console.log('🌐 Opening localhost:5657...');
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    console.log('⏳ Waiting 3 seconds for page to fully load...');
    await page.waitForTimeout(3000);

    // Find and click the Run Scan button
    console.log('🔍 Looking for Run Scan button...');
    const button = await page.locator('button:has-text("Run Scan")').first();

    if (await button.isVisible()) {
      console.log('✅ Found Run Scan button, clicking...');
      await button.click();

      console.log('⏳ Waiting 10 seconds for scan to complete...');
      await page.waitForTimeout(10000);

      console.log('📸 Taking final screenshot...');
      await page.screenshot({ path: 'manual-scan-result.png', fullPage: true });

      console.log('✅ Test completed! Check console logs above and manual-scan-result.png');
    } else {
      console.log('❌ Run Scan button not found');
      await page.screenshot({ path: 'button-not-found.png', fullPage: true });
    }

    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();
})();