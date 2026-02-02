const puppeteer = require('puppeteer');

async function debugLegendData() {
  console.log('🔍 Debugging Legend Data...');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Capture ALL console output to see the debug logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔍 DATE ANALYSIS:') || text.includes('🏷️ Showing data legend:') || text.includes('🔧 FORMAT DATETIME DEBUG:')) {
      console.log('🎯 FRONTEND DEBUG:', text);
    }
  });

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

    // Click on a scan result
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

    // Try to get the legend content directly
    console.log('🏷️ Extracting legend content...');
    const legendContent = await page.evaluate(() => {
      // Look for legend elements
      const legendElements = document.querySelectorAll('[class*="legend"], div[style*="backdrop-blur"], div[style*="rgba(0, 0, 0, 0.85)"]');

      for (let el of legendElements) {
        const text = el.textContent?.trim();
        if (text && (text.includes('O:') || text.includes('H:') || text.includes('2025') || text.includes('Jun'))) {
          return {
            text: text,
            html: el.innerHTML,
            element: el.tagName + (el.className ? '.' + el.className : '')
          };
        }
      }

      return { found: false };
    });

    console.log('📋 LEGEND CONTENT:', legendContent);

    console.log('✅ Debug complete - check console output for frontend debug logs');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugLegendData().catch(console.error);