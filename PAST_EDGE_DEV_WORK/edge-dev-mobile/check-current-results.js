const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // Take screenshot of current state
    await page.screenshot({
      path: 'current-scan-results.png',
      fullPage: true
    });

    // Get current scan results
    const tickers = await page.$$eval('tr td:first-child', tds =>
      tds.map(td => td.textContent.trim()).filter(text => text && text !== 'TICKER')
    );

    console.log('Current scan results:', tickers);
    console.log('Screenshot saved: current-scan-results.png');

    // Check if we see the new API results (SMCI, LUNM, DJT, FUTU)
    const newApiTickers = ['SMCI', 'LUNM', 'DJT', 'FUTU'];
    const hasNewResults = newApiTickers.some(ticker => tickers.includes(ticker));

    if (hasNewResults) {
      console.log('✅ SUCCESS: Found new API results in the scan table!');
    } else {
      console.log('❓ Status: Still showing original mock data');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
})();