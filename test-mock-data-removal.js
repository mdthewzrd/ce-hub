const { chromium } = require('playwright');

async function testMockDataRemoval() {
  console.log('🧪 Testing Mock Data Removal - Validating Frontend Shows Real Results');

  const browser = await chromium.launch({
    headless: false, // Show browser for visual verification
    slowMo: 500 // Slower for better visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to frontend
    console.log('🌐 Navigating to Edge Dev frontend...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Step 2: Find and click backside B project
    console.log('🔍 Looking for backside B project...');

    const projectSelectors = [
      'text=backside para b copy',
      '[data-project-id="1764956201741"]',
      'text=backside',
      '[class*="backside"]'
    ];

    let projectElement = null;
    for (const selector of projectSelectors) {
      try {
        projectElement = await page.waitForSelector(selector, { timeout: 5000 });
        if (projectElement) {
          console.log(`✅ Found project with: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Selector not found: ${selector}`);
      }
    }

    if (!projectElement) {
      throw new Error('Could not find backside B project');
    }

    await projectElement.click();
    await page.waitForTimeout(2000);

    // Step 3: Look for Run Scan button and execute
    console.log('🚀 Looking for Run Scan button...');

    const scanButtonSelectors = [
      'text=Run Scan',
      'button:has-text("Run Scan")',
      '[data-testid="run-scan"]',
      'button'
    ];

    let scanButton = null;
    for (const selector of scanButtonSelectors) {
      try {
        scanButton = await page.waitForSelector(selector, { timeout: 3000 });
        if (scanButton && await scanButton.isVisible()) {
          console.log(`✅ Found scan button: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Scan button not found: ${selector}`);
      }
    }

    if (!scanButton) {
      throw new Error('Could not find Run Scan button');
    }

    await scanButton.click();
    console.log('🔄 Scan execution started...');

    // Step 4: Wait for scan to complete (up to 3 minutes)
    console.log('⏳ Waiting for scan completion...');

    let scanCompleted = false;
    let resultsFound = false;

    for (let i = 0; i < 360; i++) { // 360 * 0.5s = 180 seconds = 3 minutes
      await page.waitForTimeout(500);

      // Check for loading states
      const hasLoading = await page.locator('text=Loading, text=Scanning, text=Executing, [class*="loading"], [class*="spinner"]').count() > 0;

      if (!hasLoading) {
        // Check for results indicators
        const hasResults = await page.locator('tbody tr, table tr, [class*="result"], [class*="row"]').count() > 0;

        if (hasResults) {
          console.log('✅ Results detected!');
          resultsFound = true;
          scanCompleted = true;
          break;
        }
      }

      if (i % 20 === 0) {
        console.log(`⏳ Still waiting... ${i * 0.5}s elapsed`);
      }
    }

    if (!scanCompleted) {
      console.log('⚠️ Scan completion not clearly detected, proceeding to check for results...');
    }

    // Wait a bit more for results to fully render
    await page.waitForTimeout(3000);

    // Step 5: Analyze results for mock vs real data
    console.log('🔍 Analyzing scan results...');

    const pageText = await page.textContent('body');

    // CRITICAL TEST: Check for mock data indicators (what we DON'T want to see)
    const mockDataIndicators = [
      'WOLF',
      'ETHZ',
      'ATNF',
      'HOUR',
      'THAR',
      'BYND',
      'MCVT',
      'SUTG',
      'VKTX',
      'INMB',
      'CTXR',
      'BBIG'
    ];

    const hasMockData = mockDataIndicators.some(indicator => pageText.includes(indicator));

    // Check for impossible percentages that were in mock data
    const hasImpossiblePercentages = pageText.includes('+187.2%') ||
                                     pageText.includes('+89.5%') ||
                                     pageText.includes('-24699.7%') ||
                                     pageText.includes('24392.1%');

    // Check for impossible dates that were in mock data
    const hasImpossibleDates = pageText.includes('2469') ||
                              pageText.includes('10/23/2469');

    // EXPECTED: Check for real backside B results (what we DO want to see)
    const expectedRealTickers = [
      'SOXL',
      'INTC',
      'XOM',
      'AMD',
      'SMCI',
      'BABA',
      'NVDA',
      'TSLA'
    ];

    const hasRealResults = expectedRealTickers.some(ticker => pageText.includes(ticker));

    // Get table rows for detailed analysis
    const tableRows = await page.locator('tbody tr, table tr').count();

    console.log('\n📊 RESULTS ANALYSIS:');
    console.log('========================');
    console.log(`Total table rows found: ${tableRows}`);
    console.log(`Has mock data tickers: ${hasMockData}`);
    console.log(`Has impossible percentages: ${hasImpossiblePercentages}`);
    console.log(`Has impossible dates: ${hasImpossibleDates}`);
    console.log(`Has real backside B tickers: ${hasRealResults}`);

    if (hasMockData) {
      console.log('\n❌ MOCK DATA DETECTED:');
      mockDataIndicators.forEach(indicator => {
        if (pageText.includes(indicator)) {
          console.log(`   - Found: ${indicator}`);
        }
      });
    }

    if (hasRealResults) {
      console.log('\n✅ REAL RESULTS DETECTED:');
      expectedRealTickers.forEach(ticker => {
        if (pageText.includes(ticker)) {
          console.log(`   - Found: ${ticker}`);
        }
      });
    }

    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    console.log('==================');

    let verdict = '';
    let success = false;

    if (hasMockData || hasImpossiblePercentages || hasImpossibleDates) {
      verdict = '❌ FAILED: Frontend is still displaying MOCK DATA';
      console.log(verdict);
      console.log('   - Mock data removal did not work completely');
      console.log('   - Need to find remaining mock data sources');
      success = false;
    } else if (hasRealResults && tableRows > 0) {
      verdict = '✅ SUCCESS: Frontend is displaying REAL RESULTS';
      console.log(verdict);
      console.log('   - Mock data has been successfully removed');
      console.log('   - Real backside B scanner results are being displayed');
      success = true;
    } else if (tableRows === 0) {
      verdict = '⚠️ UNCLEAR: No results displayed (may be empty or loading)';
      console.log(verdict);
      console.log('   - Scan may have returned no results');
      console.log('   - Or results are still loading/not displayed');
      success = false;
    } else {
      verdict = '⚠️ UNCLEAR: Results displayed but could not identify content';
      console.log(verdict);
      console.log('   - Need manual verification of results');
      success = false;
    }

    // Take screenshots for documentation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    await page.screenshot({
      path: `mock_data_removal_test_${timestamp}.png`,
      fullPage: true
    });

    console.log(`\n📸 Screenshot saved: mock_data_removal_test_${timestamp}.png`);

    await browser.close();

    console.log(`\n🏁 Test completed: ${verdict}`);

    return {
      success,
      verdict,
      hasMockData,
      hasRealResults,
      tableRows,
      pageTextLength: pageText.length
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take error screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `mock_data_removal_test_error_${timestamp}.png`,
      fullPage: true
    });

    await browser.close();
    throw error;
  }
}

// Run the test
testMockDataRemoval()
  .then(result => {
    console.log('\n🏁 Mock data removal test completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Mock data removal test failed:', error);
    process.exit(1);
  });