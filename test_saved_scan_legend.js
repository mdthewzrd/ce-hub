const puppeteer = require('puppeteer');

async function testSavedScanLegend() {
  console.log('🔍 Testing saved scan legend issue...');

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

    // Wait for page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Look for saved scans
    console.log('🔍 Looking for saved scans...');

    // Check if there are any saved scans loaded
    const savedScansCount = await page.evaluate(() => {
      const scanElements = document.querySelectorAll('[data-scan-id], .scan-item, .saved-scan');
      return scanElements.length;
    });

    console.log(`📁 Found ${savedScansCount} saved scan elements`);

    if (savedScansCount > 0) {
      // Try to click on the first saved scan
      const scanClicked = await page.evaluate(() => {
        const firstScan = document.querySelector('[data-scan-id], .scan-item, .saved-scan');
        if (firstScan) {
          firstScan.click();
          return true;
        }
        return false;
      });

      if (scanClicked) {
        console.log('✅ Clicked on first saved scan');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check what the legend shows now
        const legendText = await page.evaluate(() => {
          const legendElement = document.querySelector('div[class*="Day"], [data-testid*="day"], .chart-legend');
          return legendElement ? legendElement.textContent : null;
        });

        console.log(`🏷️ Legend after clicking saved scan: ${legendText}`);
      }
    }

    // Take a screenshot
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/saved_scan_legend_debug.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved to saved_scan_legend_debug.png');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testSavedScanLegend().catch(console.error);