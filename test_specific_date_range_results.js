const { chromium } = require('playwright');

async function getBacksideBResults() {
  console.log('🎯 Getting backside B scanner results for 1/125 to 11/125...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to frontend
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find and click backside B project
    await page.waitForSelector('text=backside para b copy', { timeout: 10000 });
    await page.click('text=backside para b copy');
    await page.waitForTimeout(1000);

    // Look for date range inputs and set them
    const dateInputs = await page.locator('input[type="date"], input[placeholder*="date"], input[placeholder*="Date"]').count();

    if (dateInputs > 0) {
      console.log(`📅 Found ${dateInputs} date inputs, setting date range...`);

      // Set start date to 1/125 (January 1, 2025)
      const startDateInputs = await page.locator('input[type="date"], input[placeholder*="start"], input[placeholder*="from"]').all();
      if (startDateInputs.length > 0) {
        await startDateInputs[0].fill('2025-01-25');
        console.log('✅ Set start date to 2025-01-25');
      }

      // Set end date to 11/125 (November 1, 2025)
      const endDateInputs = await page.locator('input[type="date"], input[placeholder*="end"], input[placeholder*="to"]').all();
      if (endDateInputs.length > 0) {
        await endDateInputs[0].fill('2025-11-25');
        console.log('✅ Set end date to 2025-11-25');
      }
    } else {
      console.log('⚠️ No date input fields found, using default date range');
    }

    // Click Run Scan
    await page.waitForSelector('text=Run Scan', { timeout: 10000 });
    await page.click('text=Run Scan');
    console.log('🚀 Started scan execution...');

    // Wait for results
    console.log('⏳ Waiting for scan to complete...');

    // Wait up to 2 minutes for results
    let resultsFound = false;
    for (let i = 0; i < 240; i++) { // 240 * 0.5s = 120 seconds
      await page.waitForTimeout(500);

      const hasResults = await page.locator('tbody tr, [class*="row"], [class*="result"]').count() > 0 ||
                        await page.locator('table').count() > 0;

      if (hasResults) {
        resultsFound = true;
        break;
      }

      if (i % 20 === 0) {
        console.log(`⏳ Still waiting... ${i * 0.5}s elapsed`);
      }
    }

    if (!resultsFound) {
      console.log('⚠️ No results found after waiting');
      await browser.close();
      return { success: false, results: [] };
    }

    // Wait a bit more for results to fully render
    await page.waitForTimeout(3000);

    // Extract results from the table
    console.log('📊 Extracting results from table...');

    const results = await page.evaluate(() => {
      const tickerResults = [];

      // Look for table rows
      const rows = document.querySelectorAll('tbody tr, table tr, [class*="row"]');

      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td, th, [class*="cell"], [class*="column"]');
        if (cells.length > 0) {
          const rowText = row.textContent || '';

          // Try to extract ticker symbol (first cell or look for capital letters)
          let ticker = 'Unknown';
          let date = '';
          let volume = '';
          let gapPercent = '';
          let otherData = '';

          // Extract ticker from first cell or look for patterns
          const firstCell = cells[0]?.textContent?.trim();
          if (firstCell && /^[A-Z]{1,5}$/.test(firstCell)) {
            ticker = firstCell;
          }

          // Extract date (look for date patterns)
          const dateMatch = rowText.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/);
          if (dateMatch) {
            date = dateMatch[1];
          }

          // Extract volume (look for numbers with commas or K/M suffixes)
          const volumeMatch = rowText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?[KM]?)/);
          if (volumeMatch && !rowText.includes('2025')) { // Avoid matching dates
            volume = volumeMatch[1];
          }

          // Extract gap percentage
          const gapMatch = rowText.match(/([+-]?\d+\.?\d*%)/);
          if (gapMatch) {
            gapPercent = gapMatch[1];
          }

          // Get all significant text data
          otherData = rowText.replace(/\s+/g, ' ').trim();

          if (ticker !== 'Unknown' || otherData.length > 10) {
            tickerResults.push({
              index: index + 1,
              ticker,
              date,
              volume,
              gapPercent,
              otherData
            });
          }
        }
      });

      return tickerResults;
    });

    console.log(`\n📈 BACKSIDE B SCANNER RESULTS (1/125 - 11/125):`);
    console.log('=' .repeat(60));

    if (results.length === 0) {
      console.log('❌ No results found');
    } else {
      console.log(`Found ${results.length} results:\n`);

      results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.ticker.padEnd(6)} | ${result.date.padEnd(12)} | Vol: ${(result.volume || 'N/A').padEnd(10)} | Gap: ${(result.gapPercent || 'N/A').padEnd(8)} | ${result.otherData.substring(0, 60)}${result.otherData.length > 60 ? '...' : ''}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // Take screenshot for verification
    await page.screenshot({
      path: 'backside_b_results_screenshot.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved: backside_b_results_screenshot.png');

    await browser.close();

    return {
      success: true,
      results: results,
      count: results.length
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    await browser.close();
    return { success: false, error: error.message };
  }
}

getBacksideBResults()
  .then(result => {
    console.log('\n🏁 Results extraction completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Failed to get results:', error);
    process.exit(1);
  });