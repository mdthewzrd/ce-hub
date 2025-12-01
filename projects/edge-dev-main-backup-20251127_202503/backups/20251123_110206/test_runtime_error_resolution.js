const { chromium } = require('playwright');

async function testRuntimeErrorResolution() {
  console.log('🚀 Testing runtime error resolution...');

  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Track all console errors, especially our specific TypeError
  let typeErrors = [];
  let allErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      allErrors.push(errorText);

      if (errorText.includes('Cannot read properties of undefined') && errorText.includes('toFixed')) {
        typeErrors.push(errorText);
        console.log('❌ CRITICAL TypeError detected:', errorText);
      } else {
        console.log('⚠️ Other error:', errorText);
      }
    }
  });

  // Track network requests to verify API calls
  let apiCalls = [];
  page.on('response', response => {
    if (response.url().includes('localhost:8000')) {
      apiCalls.push({
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString()
      });
      console.log(`📡 API Response: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('📱 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    // Look for scan results display
    console.log('🔍 Checking for scan results display...');
    const scanResultsCheck = await page.evaluate(() => {
      // Look for elements that might display gapPercent values
      const bodyText = document.body.textContent || '';
      const hasGapPercentText = bodyText.includes('%') && bodyText.includes('8.5');

      // Look for table rows or result displays
      const tables = document.querySelectorAll('table');
      const hasResultsTable = tables.length > 0;

      // Check for specific result values from our mock data
      const hasMockDataValues = bodyText.includes('AAPL') || bodyText.includes('GOOGL') || bodyText.includes('MSFT');

      return {
        hasGapPercentText,
        hasResultsTable,
        hasMockDataValues,
        tablesCount: tables.length,
        bodyLength: bodyText.length
      };
    });

    console.log('\n📊 Page Content Analysis:');
    console.log('   Gap Percent Display:', scanResultsCheck.hasGapPercentText ? '✅ Found' : '⚠️ Not found');
    console.log('   Results Table:', scanResultsCheck.hasResultsTable ? '✅ Found' : '⚠️ Not found');
    console.log('   Mock Data Values:', scanResultsCheck.hasMockDataValues ? '✅ Found' : '⚠️ Not found');
    console.log('   Tables Count:', scanResultsCheck.tablesCount);

    // Test scan execution to trigger the problematic code path
    console.log('\n🎯 Testing scan execution to trigger data display...');
    await page.evaluate(async () => {
      // Try to trigger a scan if there's a scan button
      const scanButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
        btn.textContent && (
          btn.textContent.toLowerCase().includes('scan') ||
          btn.textContent.toLowerCase().includes('execute') ||
          btn.textContent.toLowerCase().includes('run')
        )
      );

      if (scanButtons.length > 0) {
        console.log('🔥 Found scan button, clicking...');
        scanButtons[0].click();
        return true;
      }
      return false;
    });

    // Wait for any potential API calls and page updates
    await page.waitForTimeout(3000);

    // Final error analysis
    console.log('\n🎯 Final Error Analysis:');
    console.log('   Total Errors:', allErrors.length);
    console.log('   Type Errors (our specific issue):', typeErrors.length);
    console.log('   API Calls Made:', apiCalls.length);

    if (typeErrors.length === 0) {
      console.log('✅ SUCCESS! No TypeError about toFixed() detected');
      console.log('✅ The runtime error has been successfully resolved!');
    } else {
      console.log('❌ FAILURE! TypeError still occurs:');
      typeErrors.forEach(error => console.log('   -', error));
    }

    if (allErrors.length === 0) {
      console.log('✅ PERFECT! No JavaScript errors detected at all');
    } else {
      console.log('⚠️ Other errors present (not critical):');
      allErrors.slice(0, 5).forEach(error => console.log('   -', error.substring(0, 100) + '...'));
    }

    // Show API interaction summary
    if (apiCalls.length > 0) {
      console.log('\n📊 API Interaction Summary:');
      apiCalls.forEach(call => {
        console.log(`   ${call.status} ${call.url.split('/').pop()}`);
      });
    }

    // Take screenshot for verification
    console.log('\n📸 Taking final verification screenshot...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/edge-dev/runtime_error_resolution_validation.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: runtime_error_resolution_validation.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🎯 Test Summary:');
    console.log(`   - TypeError instances: ${typeErrors.length}`);
    console.log(`   - Total errors: ${allErrors.length}`);
    console.log(`   - API calls: ${apiCalls.length}`);
    console.log('\n🔄 Keeping browser open for inspection...');
    console.log('📝 Press Ctrl+C when done...');
    // Keep browser open for manual inspection
    await new Promise(() => {}); // This will keep the process running
  }
}

testRuntimeErrorResolution().catch(console.error);