const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugD0Legend() {
  console.log('🚀 Starting Puppeteer automation to debug D0 legend issue...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    console.log('📢 Browser Console:', msg.type(), msg.text());
  });

  try {
    console.log('📍 Navigating to localhost:5656...');
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Take a screenshot to see what's loaded
    await page.screenshot({ path: 'debug-d0-legend-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-d0-legend-initial.png');

    // Look for chart elements
    console.log('🔍 Looking for chart elements...');

    // Try to find the legend
    const legendExists = await page.evaluate(() => {
      const legendElements = document.querySelectorAll('[class*="legend"], [class*="ChartLegend"]');
      console.log('Found legend elements:', legendElements.length);

      // Look for any element with fixed positioning (likely our legend)
      const fixedElements = document.querySelectorAll('div[style*="position: absolute"]');
      console.log('Found fixed positioned elements:', fixedElements.length);

      // Get the text content of potential legend elements
      const texts = [];
      fixedElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && (text.includes('O:') || text.includes('H:') || text.includes('L:') || text.includes('C:'))) {
          texts.push(text);
          console.log('Legend text found:', text);
        }
      });

      return { legendCount: legendElements.length, fixedCount: fixedElements.length, texts };
    });

    console.log('Legend search results:', legendExists);

    // If we found chart elements, wait a bit more and check for hover
    if (legendExists.fixedCount > 0) {
      console.log('⏳ Waiting 5 seconds for any dynamic content...');
      await page.waitForTimeout(5000);

      // Try to hover over the chart area to see if legend updates
      const chartArea = await page.$('div[style*="width: 100%"][style*="height: 100%"]');
      if (chartArea) {
        console.log('🎯 Found chart area, attempting to hover...');
        await chartArea.hover();
        await page.waitForTimeout(2000);

        // Take screenshot after hover
        await page.screenshot({ path: 'debug-d0-legend-hover.png', fullPage: true });
        console.log('📸 Screenshot saved: debug-d0-legend-hover.png');
      }
    }

    // Check for any API requests that might show the data being loaded
    const responses = await page.evaluate(() => {
      // This won't work directly, but we can check the current page state
      return {
        url: window.location.href,
        title: document.title,
        bodyText: document.body?.innerText?.substring(0, 500) || ''
      };
    });

    console.log('Page state:', responses);

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    console.log('🔍 Debugging complete, keeping browser open for manual inspection...');
    // Don't close browser immediately so we can inspect manually
    // await browser.close();
  }
}

debugD0Legend().catch(console.error);