/**
 * Comprehensive Test: Scan Results and Chart Functionality
 * Tests the complete workflow: Upload -> Scan -> Results -> Chart Display
 */

const { chromium } = require('playwright');

async function testScanAndChartWorkflow() {
  console.log('🧪 Starting Scan Results & Chart Functionality Test...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // 1. Navigate to the application
    console.log('📍 Navigating to http://localhost:5657...');
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // 2. Check if page loads correctly
    console.log('🔍 Checking page load...');
    const title = await page.title();
    console.log(`✅ Page loaded: ${title}`);

    // 3. Look for scan results table
    console.log('📊 Looking for scan results table...');
    const scanTable = await page.locator('table.studio-table').first();
    const tableExists = await scanTable.isVisible({ timeout: 5000 }).catch(() => false);

    if (tableExists) {
      console.log('✅ Scan results table found');

      // Check if there are any results
      const tableRows = await page.locator('table.studio-table tbody tr').count();
      console.log(`📋 Found ${tableRows} result rows`);

      if (tableRows > 0) {
        console.log('🎯 Testing row click functionality...');

        // Click on the first result
        const firstRow = page.locator('table.studio-table tbody tr').first();
        const tickerText = await firstRow.locator('td').first().textContent();
        console.log(`🎯 Clicking on ticker: ${tickerText}`);

        await firstRow.click();

        // Wait for chart loading
        await page.waitForTimeout(2000);

        // Check if chart appears
        const chartSection = page.locator('[data-testid="chart-section"], .chart-container').first();
        const chartExists = await chartSection.isVisible({ timeout: 10000 }).catch(() => false);

        if (chartExists) {
          console.log('✅ Chart section found after clicking');
        } else {
          console.log('❌ Chart not found after clicking row');

          // Look for loading indicators
          const loadingIndicator = await page.locator('text="Loading"').isVisible({ timeout: 2000 }).catch(() => false);
          if (loadingIndicator) {
            console.log('⏳ Chart loading detected, waiting longer...');
            await page.waitForTimeout(10000);
          }
        }

        // Check for Plotly chart specifically
        const plotlyChart = await page.locator('.plotly').isVisible({ timeout: 5000 }).catch(() => false);
        if (plotlyChart) {
          console.log('✅ Plotly chart found and rendered');
        } else {
          console.log('❌ Plotly chart not rendered');
        }

      } else {
        console.log('⚠️ No scan results found in table - need to run a scan first');

        // Try to trigger a scan
        console.log('🚀 Attempting to run a scan...');
        const runScanButton = await page.locator('button:has-text("Run Scan"), button:has-text("▶️ Run Scan")').first();
        const scanButtonExists = await runScanButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (scanButtonExists) {
          console.log('🎯 Found scan button, clicking...');
          await runScanButton.click();

          // Wait for scan results
          console.log('⏳ Waiting for scan results...');
          await page.waitForTimeout(15000);

          // Check results again
          const newTableRows = await page.locator('table.studio-table tbody tr').count();
          console.log(`📋 After scan: Found ${newTableRows} result rows`);

          if (newTableRows > 0) {
            console.log('✅ Scan produced results, testing chart functionality...');
            const firstRow = page.locator('table.studio-table tbody tr').first();
            await firstRow.click();
            await page.waitForTimeout(3000);

            const plotlyChart = await page.locator('.plotly').isVisible({ timeout: 10000 }).catch(() => false);
            if (plotlyChart) {
              console.log('✅ Chart functionality working after scan!');
            } else {
              console.log('❌ Chart still not working after scan');
            }
          }
        } else {
          console.log('❌ Run scan button not found');
        }
      }
    } else {
      console.log('❌ Scan results table not found');
    }

    // 4. Check console errors
    console.log('🔍 Checking for JavaScript errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ JS Error: ${msg.text()}`);
      }
    });

    // 5. Check network requests
    console.log('🌐 Monitoring network requests...');
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`❌ HTTP Error: ${response.status()} ${response.url()}`);
      }
    });

    // Take a screenshot for debugging
    await page.screenshot({ path: '/Users/michaeldurante/ai dev/ce-hub/scan_chart_test_screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: scan_chart_test_screenshot.png');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testScanAndChartWorkflow().then(() => {
  console.log('🏁 Test completed');
}).catch(error => {
  console.error('💥 Test suite failed:', error);
});