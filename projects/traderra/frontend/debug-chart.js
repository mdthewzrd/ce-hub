const { chromium } = require('playwright');

async function debugChart() {
  console.log('🚀 Starting Playwright debug session...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const page = await browser.newPage();

  try {
    console.log('📍 Navigating to localhost:6565...');
    await page.goto('http://localhost:6565');
    await page.waitForLoadState('networkidle');

    console.log('📍 Navigating to trades page...');
    await page.goto('http://localhost:6565/trades');
    await page.waitForLoadState('networkidle');

    console.log('📍 Looking for AAPL trade row...');
    const aaplRow = await page.locator('text=AAPL').first();
    await aaplRow.waitFor({ timeout: 10000 });

    console.log('📍 Clicking AAPL trade to open modal...');
    await aaplRow.click();

    console.log('📍 Waiting for modal to open...');
    await page.locator('text=AAPL Trade Details').waitFor({ timeout: 10000 });

    console.log('📍 Waiting for chart to load...');
    await page.waitForTimeout(5000); // Give chart time to load

    console.log('📍 Checking for Plotly chart...');
    const plotlyChart = await page.locator('.plotly').first();
    const chartExists = await plotlyChart.count() > 0;
    console.log(`📊 Plotly chart found: ${chartExists}`);

    if (chartExists) {
      console.log('📍 Checking for SVG elements (chart data)...');
      const svgElements = await page.locator('.plotly svg').count();
      console.log(`📊 SVG elements found: ${svgElements}`);

      console.log('📍 Checking for path elements (potential arrows)...');
      const pathElements = await page.locator('.plotly svg path').count();
      console.log(`📊 Path elements found: ${pathElements}`);

      console.log('📍 Checking console logs for chart debug info...');
      const logs = await page.evaluate(() => {
        return window.console._logs || [];
      });

      // Get console logs
      page.on('console', msg => {
        if (msg.text().includes('🎯') || msg.text().includes('📅') || msg.text().includes('📍')) {
          console.log(`CONSOLE: ${msg.text()}`);
        }
      });

      console.log('📍 Taking screenshot...');
      await page.screenshot({ path: 'chart-debug.png', fullPage: true });
    }

    console.log('📍 Checking browser console for errors...');
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    if (errors.length > 0) {
      console.log('❌ Browser errors found:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No browser errors detected');
    }

    console.log('📍 Debug session complete. Press any key to close...');
    await page.waitForTimeout(10000); // Keep open for manual inspection

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    await page.screenshot({ path: 'error-debug.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugChart().catch(console.error);