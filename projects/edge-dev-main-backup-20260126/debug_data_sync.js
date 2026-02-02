const puppeteer = require('puppeteer');

async function debugDataSync() {
  console.log('🔍 Debugging Chart vs Legend Data Synchronization...');

  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 30000
  });

  const page = await browser.newPage();

  // Intercept API calls
  page.on('response', response => {
    if (response.url().includes('/api/chart-data')) {
      response.json().then(data => {
        if (data.data && data.data.x) {
          console.log('📊 API DATA SUMMARY:');
          console.log('- Total bars returned:', data.data.x.length);
          console.log('- First date:', data.data.x[0]);
          console.log('- Last date:', data.data.x[data.data.x.length - 1]);
          console.log('- Day 0 target date check:', data.data.x.slice(-3)); // Last 3 dates
        }
      }).catch(() => {});
    }
  });

  try {
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });

    // Wait and click load
    await new Promise(resolve => setTimeout(resolve, 3000));
    await page.evaluate(() => {
      const loadButton = Array.from(document.querySelectorAll('button, div[role="button"], div[class*="button"]'))
        .find(btn => btn.textContent && btn.textContent.includes('Load'));
      if (loadButton) loadButton.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click scan result
    await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('tr, td, div[onclick], [role="row"]'));
      const scanResult = results.find(el => {
        const text = el.textContent;
        return text && (text.includes('BABA') || text.includes('backside'));
      });
      if (scanResult) scanResult.click();
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check what data the chart component actually has
    const chartDataInfo = await page.evaluate(() => {
      // Find React component data by looking for chart data in the DOM
      const plotlyElements = document.querySelectorAll('.plotly, [data-plotly]');

      if (plotlyElements.length > 0) {
        // Try to get data from the first plotly element
        const plotlyElement = plotlyElements[0];

        return {
          foundElements: plotlyElements.length,
          elementClasses: Array.from(plotlyElement.classList),
          elementId: plotlyElement.id,
          hasData: plotlyElement.hasAttribute('data-plotly')
        };
      }

      return { foundElements: 0 };
    });

    console.log('📈 CHART DATA INFO:', chartDataInfo);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugDataSync().catch(console.error);