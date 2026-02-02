const { chromium } = require('playwright');

async function testManualClickAutomatically() {
  console.log('🤖 Testing Manual Click Automatically to Debug the Issue');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    console.log('📝 PAGE CONSOLE:', msg.type(), msg.text());
  });

  // Enable network request logging
  page.on('request', request => {
    if (request.url().includes('/api/') || request.url().includes('execute')) {
      console.log('🌐 API REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || request.url().includes('execute')) {
      console.log('📡 API RESPONSE:', response.status(), response.url());
    }
  });

  try {
    console.log('🌐 Navigating to Edge Dev frontend...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Step 1: Click on the backside para b copy project
    console.log('🔍 Clicking on backside para b copy project...');

    const projectElement = await page.waitForSelector('text=backside para b copy', { timeout: 10000 });
    if (!projectElement) {
      throw new Error('Could not find backside para b copy project');
    }

    await projectElement.click();
    console.log('✅ Project clicked');
    await page.waitForTimeout(2000);

    // Step 2: Click Run Scan button
    console.log('🚀 Looking for and clicking Run Scan button...');

    const runScanButton = await page.waitForSelector('button:has-text("Run Scan")', { timeout: 10000 });
    if (!runScanButton) {
      throw new Error('Could not find Run Scan button');
    }

    console.log('✅ Run Scan button found, clicking now...');

    // Monitor for any immediate errors or network requests
    let clickTime = Date.now();

    await runScanButton.click();

    console.log('🔄 Click executed at:', new Date().toISOString());

    // Step 3: Watch for immediate responses (next 10 seconds)
    console.log('👀 Monitoring for immediate responses...');

    let scanStarted = false;
    let networkRequestsSeen = 0;

    for (let i = 0; i < 20; i++) { // 10 seconds of monitoring
      await page.waitForTimeout(500);

      // Check for any loading states
      const hasLoading = await page.locator('text=Loading, text=Scanning, text=Executing, [class*="loading"], [class*="spinner"]').count() > 0;

      if (hasLoading && !scanStarted) {
        console.log('✅ Scan loading state detected!');
        scanStarted = true;
      }

      // Check for any error messages
      const hasErrors = await page.locator('text=error, text=failed, text=Error, [class*="error"]').count() > 0;
      if (hasErrors) {
        console.log('❌ Error state detected!');
      }

      if (i % 4 === 0) {
        console.log(`⏳ Monitoring... ${i * 0.5}s elapsed, Loading: ${hasLoading}, Errors: ${hasErrors}`);
      }
    }

    // Step 4: Check final state
    console.log('\n📊 Final State Analysis:');

    const finalTableContent = await page.locator('tbody').textContent() || '';
    const tableRows = await page.locator('tbody tr').count();

    console.log(`Table rows: ${tableRows}`);
    console.log(`Table content length: ${finalTableContent.length}`);

    if (finalTableContent.length > 0) {
      console.log('Table content sample:', finalTableContent.substring(0, 200));
    }

    // Check for mock vs real data
    const pageText = await page.textContent('body');
    const hasMockData = pageText.includes('WOLF') || pageText.includes('ETHZ') || pageText.includes('ATNF');
    const hasRealData = pageText.includes('SOXL') || pageText.includes('INTC') || pageText.includes('XOM');

    console.log(`Has mock data: ${hasMockData}`);
    console.log(`Has real data: ${hasRealData}`);

    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `automatic_click_test_${timestamp}.png`,
      fullPage: true
    });

    console.log(`📸 Screenshot saved: automatic_click_test_${timestamp}.png`);

    await browser.close();

    // Determine result
    let success = false;
    let verdict = '';

    if (scanStarted) {
      if (hasRealData && !hasMockData) {
        verdict = '✅ SUCCESS: Scan started and real results displayed';
        success = true;
      } else if (hasMockData) {
        verdict = '⚠️ PARTIAL: Scan started but mock data displayed';
      } else {
        verdict = '⚠️ PARTIAL: Scan started but no clear results';
      }
    } else {
      if (hasRealData) {
        verdict = '🤔 UNCLEAR: No loading detected but real results present';
      } else {
        verdict = '❌ FAILED: No scan activity detected';
      }
    }

    console.log('\n🎯 AUTOMATIC CLICK TEST VERDICT:', verdict);

    return {
      success,
      verdict,
      scanStarted,
      hasMockData,
      hasRealData,
      tableRows,
      timeSinceClick: Date.now() - clickTime
    };

  } catch (error) {
    console.error('❌ Automatic click test failed:', error.message);
    await browser.close();
    throw error;
  }
}

// Run the test
testManualClickAutomatically()
  .then(result => {
    console.log('\n🏁 Automatic click test completed');
    if (result.success) {
      console.log('🎉 SUCCESS: Automated click worked properly!');
      console.log('   This suggests the issue may be with manual user interaction');
      console.log('   Possible causes: timing, mouse movement, or user expectations');
    } else {
      console.log('💥 FAILURE: Automated click also failed');
      console.log('   This confirms there is a real technical issue with the scan execution');
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Automatic click test failed:', error);
    process.exit(1);
  });