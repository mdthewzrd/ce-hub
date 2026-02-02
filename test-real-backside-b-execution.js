const { chromium } = require('playwright');

async function testRealBacksideBExecution() {
  console.log('🧪 FINAL VALIDATION: Testing Real Backside B Scanner Execution on Frontend 5656');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
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

    await page.waitForTimeout(3000);

    // Step 2: Look for Run Scan button
    console.log('🔍 Looking for Run Scan button...');

    const runScanButton = await page.waitForSelector('button:has-text("Run Scan")', {
      timeout: 10000
    });

    if (!runScanButton) {
      throw new Error('Run Scan button not found');
    }

    console.log('✅ Found Run Scan button');

    // Step 3: Click Run Scan and wait for execution
    console.log('🚀 Clicking Run Scan button to execute backside B scanner...');

    // Clear any existing results first by checking initial state
    const initialTableContent = await page.locator('tbody').textContent();
    console.log('📊 Initial table content:', initialTableContent || 'EMPTY');

    await runScanButton.click();
    console.log('⏳ Scan execution started...');

    // Step 4: Wait for scan to complete and results to appear
    console.log('⏳ Waiting for scan completion and real results...');

    let scanCompleted = false;
    let realResultsFound = false;
    let realTickers = [];

    // Wait up to 4 minutes for real results
    for (let i = 0; i < 480; i++) { // 480 * 0.5s = 240 seconds = 4 minutes
      await page.waitForTimeout(500);

      // Check for loading states
      const hasLoading = await page.locator('text=Loading, text=Scanning, text=Executing, [class*="loading"], [class*="spinner"]').count() > 0;

      if (!hasLoading) {
        // Get table content to check for results
        const tableContent = await page.locator('tbody').textContent() || '';

        console.log(`🔍 Checking results at ${i * 0.5}s... Table content length: ${tableContent.length}`);

        if (tableContent.length > 0) {
          console.log('📊 Table content found:', tableContent.substring(0, 200));

          // Look for REAL backside B results (expected tickers)
          const expectedRealTickers = ['SOXL', 'INTC', 'XOM', 'AMD', 'SMCI', 'BABA', 'NVDA', 'TSLA'];
          const foundTickers = [];

          for (const ticker of expectedRealTickers) {
            if (tableContent.includes(ticker)) {
              foundTickers.push(ticker);
            }
          }

          // Check for mock data indicators (what we DON'T want to see)
          const mockDataIndicators = ['WOLF', 'ETHZ', 'ATNF', 'HOUR', 'THAR', 'BYND'];
          const hasMockData = mockDataIndicators.some(indicator => tableContent.includes(indicator));

          // Check for impossible percentages that were in mock data
          const hasImpossiblePercentages = tableContent.includes('+187.2%') ||
                                           tableContent.includes('+89.5%') ||
                                           tableContent.includes('-24699.7%') ||
                                           tableContent.includes('24392.1%');

          console.log(`📈 Found real tickers: ${foundTickers.join(', ')}`);
          console.log(`❌ Mock data detected: ${hasMockData}`);
          console.log(`🚫 Impossible percentages: ${hasImpossiblePercentages}`);

          if (foundTickers.length > 0 && !hasMockData && !hasImpossiblePercentages) {
            console.log('✅ REAL BACKSIDE B RESULTS DETECTED!');
            realTickers = foundTickers;
            realResultsFound = true;
            scanCompleted = true;
            break;
          } else if (hasMockData || hasImpossiblePercentages) {
            console.log('❌ MOCK DATA STILL APPEARING - Need further investigation');
            // Continue waiting to see if real results replace mock data
          }
        }
      }

      if (i % 20 === 0) {
        console.log(`⏳ Still waiting... ${i * 0.5}s elapsed`);
      }
    }

    // Wait a bit more for results to fully render
    await page.waitForTimeout(3000);

    // Step 5: Final analysis
    console.log('\n🔍 FINAL ANALYSIS:');
    console.log('==================');

    const finalTableContent = await page.locator('tbody').textContent() || '';
    const pageText = await page.textContent('body');

    // Count results
    const tableRows = await page.locator('tbody tr').count();
    console.log(`📊 Total table rows: ${tableRows}`);

    // Check for specific real backside B tickers
    const expectedRealTickers = ['SOXL', 'INTC', 'XOM', 'AMD', 'SMCI', 'BABA', 'NVDA', 'TSLA'];
    const foundRealTickers = expectedRealTickers.filter(ticker => pageText.includes(ticker));

    // Check for mock data (what we DON'T want)
    const mockDataIndicators = ['WOLF', 'ETHZ', 'ATNF', 'HOUR', 'THAR', 'BYND', 'MCVT'];
    const foundMockData = mockDataIndicators.filter(indicator => pageText.includes(indicator));

    // Check for impossible percentages
    const hasImpossiblePercentages = pageText.includes('+187.2%') ||
                                     pageText.includes('+89.5%') ||
                                     pageText.includes('-24699.7%') ||
                                     pageText.includes('24392.1%');

    console.log('\n📈 REAL RESULTS ANALYSIS:');
    console.log(`✅ Real backside B tickers found: ${foundRealTickers.join(', ')}`);
    console.log(`📊 Number of real tickers: ${foundRealTickers.length}`);

    console.log('\n❌ MOCK DATA ANALYSIS:');
    console.log(`🚫 Mock tickers found: ${foundMockData.join(', ')}`);
    console.log(`🚫 Number of mock tickers: ${foundMockData.length}`);
    console.log(`🚫 Impossible percentages: ${hasImpossiblePercentages}`);

    // Take screenshot for documentation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `real_backside_b_validation_${timestamp}.png`,
      fullPage: true
    });

    console.log(`\n📸 Screenshot saved: real_backside_b_validation_${timestamp}.png`);

    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    console.log('==================');

    let success = false;
    let verdict = '';

    if (foundRealTickers.length >= 3 && foundMockData.length === 0 && !hasImpossiblePercentages) {
      verdict = '✅ SUCCESS: Real backside B scanner results are displaying correctly!';
      console.log(verdict);
      console.log('   - Real trading tickers detected and displayed');
      console.log('   - No mock data contamination');
      console.log('   - Frontend execution workflow working properly');
      success = true;
    } else if (foundRealTickers.length > 0 && foundMockData.length === 0) {
      verdict = '⚠️ PARTIAL SUCCESS: Some real results found, but fewer than expected';
      console.log(verdict);
      console.log(`   - Found ${foundRealTickers.length} real tickers (expected 3-8)`);
      console.log('   - No mock data contamination');
      console.log('   - Scanner may have returned fewer results than normal');
      success = true;
    } else if (foundMockData.length > 0 || hasImpossiblePercentages) {
      verdict = '❌ FAILED: Mock data still appearing on frontend';
      console.log(verdict);
      console.log('   - Mock data contamination detected');
      console.log('   - Further investigation needed to find remaining mock data sources');
      success = false;
    } else if (foundRealTickers.length === 0 && tableRows === 0) {
      verdict = '⚠️ UNCLEAR: No results displayed (scan may have failed or returned empty)';
      console.log(verdict);
      console.log('   - Scan execution may have failed');
      console.log('   - Or scanner returned no results for the date range');
      success = false;
    } else {
      verdict = '⚠️ UNCLEAR: Unexpected result pattern';
      console.log(verdict);
      console.log('   - Results detected but pattern is unclear');
      console.log('   - Manual verification recommended');
      success = false;
    }

    await browser.close();

    console.log(`\n🏁 Real Backside B Validation completed: ${verdict}`);

    return {
      success,
      verdict,
      realTickers: foundRealTickers,
      mockTickers: foundMockData,
      tableRows,
      hasImpossiblePercentages,
      scanCompleted
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take error screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `real_backside_b_error_${timestamp}.png`,
      fullPage: true
    });

    await browser.close();
    throw error;
  }
}

// Run the test
testRealBacksideBExecution()
  .then(result => {
    console.log('\n🏁 Real Backside B execution test completed');
    if (result.success) {
      console.log('🎉 SUCCESS: Frontend is properly displaying real backside B scanner results!');
    } else {
      console.log('💥 FAILURE: Further work needed to ensure real results display correctly');
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Real Backside B execution test failed:', error);
    process.exit(1);
  });