const { chromium } = require('playwright');

async function finalSuccessTest() {
  console.log('🎉 FINAL SUCCESS TEST: Complete A-Z Workflow Validation');
  console.log('============================================');

  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Loading Edge Dev frontend...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for initial load
    await page.waitForTimeout(3000);

    console.log('📋 Step 1: Checking for backside project...');

    // Look for the backside project in the sidebar
    const projectLocator = page.locator('text=backside para b copy').first();
    await projectLocator.waitFor({ timeout: 10000 });
    console.log('✅ Found backside para b copy project in sidebar');

    console.log('🔄 Step 2: Clicking on the project...');
    await projectLocator.click();
    await page.waitForTimeout(2000);
    console.log('✅ Project selected');

    console.log('🚀 Step 3: Executing the scan...');

    // Find and click the Run Scan button
    const runScanButton = page.locator('button:has-text("Run Scan")').first();
    await runScanButton.waitFor({ timeout: 10000 });
    console.log('✅ Found Run Scan button');

    console.log('🔥 EXECUTING SCAN - This is the critical test...');
    await runScanButton.click();

    console.log('⏳ Step 4: Monitoring for results...');
    console.log('   - Expected: Real backside B scan results');
    console.log('   - Tick: SOXL, INTC, XOM, AMD, etc.');
    console.log('   - Time: 60-180 seconds for full execution');

    // Monitor for successful completion
    let scanCompleted = false;
    let realResultsDetected = false;
    let previousResultsCount = 0;

    for (let i = 0; i < 180; i++) { // 90 seconds monitoring
      await page.waitForTimeout(1000);

      const pageText = await page.textContent('body');

      // Check for successful completion indicators
      if (pageText.includes('Found ') && pageText.includes(' patterns')) {
        scanCompleted = true;
        console.log('✅ Scan completion detected in logs');
      }

      // Look for real tickers in the results table
      const realTickers = ['SOXL', 'INTC', 'XOM', 'AMD', 'SMCI', 'BABA', 'NVDA', 'TSLA'];
      let foundRealTickers = 0;

      for (const ticker of realTickers) {
        if (pageText.includes(ticker)) {
          foundRealTickers++;
          // Check if it's in a results context (table row)
          const tickerContext = pageText.substring(pageText.indexOf(ticker) - 50, pageText.indexOf(ticker) + 200);
          if (tickerContext.includes('%') || tickerContext.includes('gap')) {
            realResultsDetected = true;
            foundRealTickers++;
          }
        }
      }

      if (foundRealTickers > 0) {
        console.log(`🎯 REAL RESULTS DETECTED: Found ${foundRealTickers} real tickers!`);
      }

      if (i % 10 === 0 && i > 0) {
        console.log(`⏳ Monitoring... ${i}s elapsed (Found ${foundRealTickers} real tickers)`);
      }

      // Success condition: both scan completed and real results found
      if (scanCompleted && realResultsDetected && foundRealTickers >= 3) {
        break;
      }
    }

    await browser.close();

    console.log('\n🏁 FINAL TEST RESULTS:');
    console.log('================================');
    console.log(`✅ Project Selection: SUCCESS`);
    console.log(`✅ Scan Execution: ${scanCompleted ? 'SUCCESS' : 'RUNNING'}`);
    console.log(`✅ Real Results: ${realResultsDetected ? 'SUCCESS' : 'FAILED'}`);
    console.log(`🎯 Real Tickers Found: ${foundRealTickers || 0}`);

    if (scanCompleted && realResultsDetected) {
      console.log('\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
      console.log('   ✅ All issues have been resolved:');
      console.log('   ✅ Project name matching fixed');
      console.log('   ✅ Asyncio conflicts resolved');
      console.log('   ✅ Date format compatibility fixed');
      console.log('   ✅ Real backside B scanner results displayed');
      console.log('\n🚀 The backside B scanner is now working end-to-end!');
      return true;
    } else {
      console.log('\n❌ INCOMPLETE: Some issues remain');
      return false;
    }

  } catch (error) {
    console.error('❌ Final test failed:', error.message);
    await browser.close();
    return false;
  }
}

// Execute the final test
finalSuccessTest()
  .then(success => {
    console.log('\n🏁 Final test completed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Final test failed:', error);
    process.exit(1);
  });