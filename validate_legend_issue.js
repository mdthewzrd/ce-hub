const puppeteer = require('puppeteer');

async function validateLegendIssue() {
  console.log('🔍 Starting Puppeteer validation of D+1 legend issue...');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.text());
  });

  try {
    console.log('📊 Navigating to scan page...');
    await page.goto('http://localhost:5665/scan');

    // Wait for page to load
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    console.log('✅ Page loaded successfully');

    // Wait for any historical data to load
    await page.waitForTimeout(3000);

    // Check if SPY is selected by default
    const selectedTicker = await page.evaluate(() => {
      return window.selectedTicker || null;
    });
    console.log(`📈 Selected ticker: ${selectedTicker}`);

    // Check dayOffset state
    const dayOffset = await page.evaluate(() => {
      const stateElement = document.querySelector('[data-day-offset]');
      return stateElement ? parseInt(stateElement.getAttribute('data-day-offset')) : null;
    });

    // If we can't get state directly, let's check the legend text
    const legendText = await page.evaluate(() => {
      const legendElement = document.querySelector('[data-testid="day-legend"]') ||
                          document.querySelector('.chart-legend') ||
                          document.querySelector('div[class*="Day"]') ||
                          document.querySelector('div:contains("Day")');
      return legendElement ? legendElement.textContent : null;
    });

    console.log(`🏷️  Legend text: ${legendText}`);

    // Look for the specific D+1 text in the page
    const pageContent = await page.content();
    const hasD1 = pageContent.includes('D+1');
    const hasD0 = pageContent.includes('Day 0');

    console.log(`🔍 Page content analysis:`);
    console.log(`   - Contains 'D+1': ${hasD1}`);
    console.log(`   - Contains 'Day 0': ${hasD0}`);

    // Take a screenshot
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/legend_debug_screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to legend_debug_screenshot.png');

    // Try to get the day navigation object
    const dayNavigationState = await page.evaluate(() => {
      // Try to access the React state from the window
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const reactFiber = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.find(
          r => r.component === 'div' && r.version
        );
        if (reactFiber) {
          console.log('Found React fiber, trying to get state...');
        }
      }
      return null;
    });

    console.log('🏁 Validation complete');

  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await browser.close();
  }
}

validateLegendIssue().catch(console.error);