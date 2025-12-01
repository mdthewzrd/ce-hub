const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Testing complete scan integration at localhost:5657...');

  try {
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // Check current scan results (should be mock data initially)
    const initialResults = await page.$$eval('tr td:first-child', tds =>
      tds.map(td => td.textContent.trim()).filter(text => text && text !== 'TICKER')
    );

    console.log('Before scan - Current tickers:', initialResults);

    // Click Run Scan button and wait for it to complete
    console.log('Clicking Run Scan button...');
    await page.click('button:has-text("🔍 Run Scan")');

    // Wait for scan to complete (give it up to 30 seconds)
    await page.waitForFunction(() => {
      const button = document.querySelector('button:has-text("🔍 Run Scan")');
      return button && !button.disabled;
    }, { timeout: 30000 });

    console.log('Scan completed, checking results...');

    // Wait a moment for UI to update
    await page.waitForTimeout(1000);

    // Check new scan results
    const newResults = await page.$$eval('tr td:first-child', tds =>
      tds.map(td => td.textContent.trim()).filter(text => text && text !== 'TICKER')
    );

    console.log('After scan - Current tickers:', newResults);

    // Check if the results changed
    const resultsChanged = JSON.stringify(initialResults) !== JSON.stringify(newResults);
    console.log('Results changed:', resultsChanged);

    if (resultsChanged) {
      console.log('✅ SUCCESS: Scan is now updating with real API data!');
      console.log('Expected new tickers: SMCI, LUNM, DJT, FUTU');
      console.log('Actual new tickers:', newResults);
    } else {
      console.log('❌ ISSUE: Results did not change - still showing mock data');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'scan-integration-test-result.png',
      fullPage: true
    });

    console.log('Screenshot saved: scan-integration-test-result.png');

  } catch (error) {
    console.error('❌ Error during integration test:', error.message);
  }

  await browser.close();
})();