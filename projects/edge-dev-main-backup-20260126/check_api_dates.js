const puppeteer = require('puppeteer');

async function checkAPIDates() {
  console.log('🔍 Checking API dates...');

  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 30000
  });

  const page = await browser.newPage();

  // Intercept API calls to see what dates are being returned
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/api/chart-data')) {
      console.log('📡 API Request:', request.url());
    }
    request.continue();
  });

  page.on('response', response => {
    if (response.url().includes('/api/chart-data')) {
      console.log('📡 API Response:', response.url());
      response.json().then(data => {
        if (data.data && data.data.x) {
          console.log('📅 Date array length:', data.data.x.length);
          console.log('📅 First 3 dates:', data.data.x.slice(0, 3));
          console.log('📅 Last 3 dates:', data.data.x.slice(-3));
          console.log('📊 Data summary:', {
            ticker: data.ticker,
            timeframe: data.timeframe,
            bars: data.bars
          });
        }
      }).catch(err => console.log('Error parsing JSON:', err));
    }
  });

  // Capture console logs from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📅 Using scan result date') || text.includes('BASE DATE') || text.includes('🎯 Day 0 filtering')) {
      console.log('🔍', text);
    }
  });

  try {
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });

    // Wait for initial load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click Load button
    await page.evaluate(() => {
      const loadButton = Array.from(document.querySelectorAll('button, div[role="button"], div[class*="button"]'))
        .find(btn => btn.textContent && btn.textContent.includes('Load'));
      if (loadButton) loadButton.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Click on a scan result to trigger chart data fetch
    await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll('tr, td, div[onclick], [role="row"]'));
      const scanResult = results.find(el => {
        const text = el.textContent;
        return text && (text.includes('BABA') || text.includes('backside'));
      });
      if (scanResult) {
        console.log('Clicking scan result:', scanResult.textContent);
        scanResult.click();
      }
    });

    // Wait for API calls and data processing
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

checkAPIDates().catch(console.error);