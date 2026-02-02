const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Testing scan functionality fix at localhost:5657...');

  try {
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // Take screenshot before scan
    await page.screenshot({
      path: 'before-scan-test.png',
      fullPage: true
    });

    console.log('Clicking Run Scan button...');

    // Click the Run Scan button
    await page.click('button:has-text("Run Scan")');

    // Wait for the scan to start (button should show "Running...")
    await page.waitForSelector('button:has-text("Running...")', { timeout: 5000 });
    console.log('Scan started - button shows "Running..."');

    // Wait for the scan to complete (button should show "Run Scan" again)
    await page.waitForSelector('button:has-text("Run Scan")', { timeout: 30000 });
    console.log('Scan completed - button returned to "Run Scan"');

    // Wait a moment for UI to update
    await page.waitForTimeout(2000);

    // Take screenshot after scan
    await page.screenshot({
      path: 'after-scan-test.png',
      fullPage: true
    });

    console.log('✅ Scan test completed successfully');
    console.log('Screenshots saved: before-scan-test.png and after-scan-test.png');

  } catch (error) {
    console.error('❌ Error testing scan:', error.message);
  }

  await browser.close();
})();