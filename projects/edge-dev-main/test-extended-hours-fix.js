const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Testing extended hours fix at localhost:5657...');

  try {
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // Switch to Chart view if not already there
    await page.click('button:has-text("Chart")');
    await page.waitForTimeout(2000);

    // Test 5-minute timeframe (should now show 4am-8am data)
    console.log('Testing 5MIN timeframe with extended hours...');
    await page.click('button:has-text("5MIN")');
    await page.waitForTimeout(3000);

    // Take screenshot of 5-minute chart
    await page.screenshot({
      path: 'extended-hours-5min-test.png',
      fullPage: true
    });

    console.log('5-minute extended hours test screenshot saved');

    // Test hourly timeframe
    console.log('Testing HOUR timeframe with extended hours...');
    await page.click('button:has-text("HOUR")');
    await page.waitForTimeout(3000);

    // Take screenshot of hourly chart
    await page.screenshot({
      path: 'extended-hours-hour-test.png',
      fullPage: true
    });

    console.log('Hourly extended hours test screenshot saved');

  } catch (error) {
    console.error('Error testing extended hours:', error.message);
  }

  await browser.close();
})();