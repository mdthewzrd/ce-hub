const puppeteer = require('puppeteer');

async function validateD0LegendFix() {
  console.log('🔍 Validating D0 Legend Fix...');

  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 30000
  });

  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎯 D0 BAR INDEX') || text.includes('🔍 D0 DEBUG:') || text.includes('TARGET DATE') || text.includes('D0 BAR FOUND')) {
      console.log('🔍', text);
    }
  });

  try {
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded');

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click Load button to access scans
    console.log('📂 Clicking Load button...');
    await page.evaluate(() => {
      const loadButton = Array.from(document.querySelectorAll('button, div[role="button"], div[class*="button"]'))
        .find(btn => btn.textContent && btn.textContent.includes('Load'));
      if (loadButton) loadButton.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click on a backside scan result
    console.log('📊 Clicking scan result...');
    await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('tr, td, div[onclick], [role="row"]'));
      const scanResult = results.find(el => {
        const text = el.textContent;
        return text && (text.includes('BABA') || text.includes('backside') || text.includes('Jun'));
      });
      if (scanResult) {
        console.log('Found scan result:', scanResult.textContent);
        scanResult.click();
      }
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check the legend content
    console.log('🏷️ Checking legend content...');
    const legendInfo = await page.evaluate(() => {
      // Look for legend elements
      const legendElements = document.querySelectorAll('div[class*="legend"], .bg-black\\/80, [style*="backdrop-blur"]');
      const results = [];

      legendElements.forEach((el, index) => {
        const text = el.textContent?.trim();
        if (text && (text.includes('O:') || text.includes('H:') || text.includes('2025'))) {
          results.push({
            index,
            text: text.substring(0, 200), // Limit length
            element: el.tagName + (el.className ? '.' + el.className : '')
          });
        }
      });

      return results;
    });

    console.log('📋 Legend Information:', legendInfo);

    // Take screenshot for verification
    await page.screenshot({ path: 'legend-validation.png', fullPage: false });
    console.log('📸 Screenshot saved: legend-validation.png');

  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await browser.close();
    console.log('✅ Validation complete');
  }
}

validateD0LegendFix().catch(console.error);