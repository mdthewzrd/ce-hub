const { chromium } = require('playwright');

async function testFixedNameMatching() {
  console.log('🔧 TESTING: Fixed project name matching');

  const browser = await chromium.launch({ headless: true, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.text().includes('Using project ID:') || msg.text().includes('Scan completed successfully')) {
        console.log('✅', msg.text());
      }
    });

    console.log('🌐 Navigating to Edge Dev frontend...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log('🚀 Testing "Run Scan" with fixed name matching...');

    // Click on the backside project
    const projectElement = await page.waitForSelector('text=backside para b copy', { timeout: 10000 });
    if (!projectElement) {
      throw new Error('Could not find backside para b copy project');
    }

    await projectElement.click();
    await page.waitForTimeout(1000);

    // Click Run Scan button
    const runScanButton = await page.waitForSelector('button:has-text("Run Scan")', { timeout: 10000 });
    if (!runScanButton) {
      throw new Error('Could not find Run Scan button');
    }

    console.log('🔄 Clicking Run Scan button with fixed logic...');

    await runScanButton.click();

    // Monitor for successful project detection
    let projectDetected = false;
    let scanStarted = false;

    for (let i = 0; i < 60; i++) { // 30 seconds monitoring
      await page.waitForTimeout(500);

      const pageText = await page.textContent('body');

      // Check for project detection success messages
      if (pageText.includes('Using project ID: 1765041068338')) {
        projectDetected = true;
        console.log('✅ Project successfully detected with correct ID!');
      }

      if (pageText.includes('Scan completed successfully')) {
        scanStarted = true;
        console.log('✅ Scan execution detected!');
      }

      if (i % 10 === 0) {
        console.log(`⏳ Monitoring... ${i * 0.5}s elapsed`);
      }

      if (projectDetected && scanStarted) {
        break;
      }
    }

    await browser.close();

    console.log('\n🎯 FIXED NAME MATCHING TEST RESULTS:');
    console.log('=====================================');
    console.log(`✅ Project Detection: ${projectDetected ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Scan Execution: ${scanStarted ? 'SUCCESS' : 'FAILED'}`);

    if (projectDetected && scanStarted) {
      console.log('\n🎉 SUCCESS: Fixed name matching works!');
      console.log('   - Frontend now finds "backside para b copy Scanner" project');
      console.log('   - Scanner execution should work properly');
    } else {
      console.log('\n❌ FAILURE: Fix did not resolve the issue');
    }

    return { projectDetected, scanStarted };

  } catch (error) {
    console.error('❌ Fixed name matching test failed:', error.message);
    await browser.close();
    throw error;
  }
}

// Run the test
testFixedNameMatching()
  .then(result => {
    console.log('\n🏁 Fixed name matching test completed');
    if (result.projectDetected && result.scanStarted) {
      console.log('🎉 The fix should resolve the manual click issue!');
    }
    process.exit((result.projectDetected && result.scanStarted) ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Fixed name matching test failed:', error);
    process.exit(1);
  });