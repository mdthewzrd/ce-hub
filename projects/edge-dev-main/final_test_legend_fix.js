const puppeteer = require('puppeteer');

async function finalTestLegendFix() {
  console.log('🔍 Final Test: D0 Legend Fix...');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click Load button
    console.log('📂 Clicking Load button...');
    await page.evaluate(() => {
      const loadButton = Array.from(document.querySelectorAll('button, div[role="button"], div[class*="button"]'))
        .find(btn => btn.textContent && btn.textContent.includes('Load'));
      if (loadButton) loadButton.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click on a scan result (should be June 2025 data)
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

    // Wait for API call and chart update
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get the legend content and check the date
    console.log('🏷️ Extracting legend content...');
    const legendInfo = await page.evaluate(() => {
      // Look for the legend element
      const legendElements = document.querySelectorAll('[style*="rgba(0, 0, 0, 0.85)"], [style*="backdrop-blur"], div[class*="legend"]');

      for (let el of legendElements) {
        const text = el.textContent?.trim();
        if (text && (text.includes('O:') || text.includes('H:') || text.includes('Jun') || text.includes('2025'))) {
          return {
            text: text,
            element: el.tagName + (el.className ? '.' + el.className : ''),
            style: el.getAttribute('style')
          };
        }
      }

      return { found: false, message: 'No legend element found' };
    });

    console.log('📋 LEGEND INFO:', legendInfo);

    // Check if the legend shows the correct date (June 11, 2025)
    if (legendInfo.found === false) {
      console.log('❌ Legend element not found');
    } else if (legendInfo.text.includes('Jun 11, 2025')) {
      console.log('✅ SUCCESS! Legend shows correct D0 date: Jun 11, 2025');
    } else if (legendInfo.text.includes('Jun 12, 2025')) {
      console.log('❌ ISSUE: Legend still shows Jun 12, 2025 instead of Jun 11, 2025');
    } else {
      console.log('🤔 UNCLEAR: Legend text:', legendInfo.text);
    }

    console.log('✅ Final test complete - check legend date in browser');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

finalTestLegendFix().catch(console.error);