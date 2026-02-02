const { chromium } = require('playwright');

async function debugManualScan() {
  console.log('🔍 DEBUGGING: Manual Scan Process');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    devtools: true // Enable devtools to see console errors
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
    if (response.url().includes('/api/') || response.url().includes('execute')) {
      console.log('📡 API RESPONSE:', response.status(), response.url());
    }
  });

  try {
    console.log('🌐 Navigating to Edge Dev frontend...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    // Step 1: Check if we can find any projects at all
    console.log('🔍 Checking for available projects...');

    const projectSelectors = [
      'text=backside para b copy',
      'text=backside',
      '[data-project-id]',
      '.project-item',
      '[class*="project"]'
    ];

    let foundProject = null;
    for (const selector of projectSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`✅ Found ${elements} projects with selector: ${selector}`);
          foundProject = selector;
          break;
        }
      } catch (e) {
        console.log(`❌ No projects found with selector: ${selector}`);
      }
    }

    if (!foundProject) {
      console.log('❌ No projects found. Checking page content...');
      const pageContent = await page.content();
      console.log('Page content length:', pageContent.length);

      // Look for any text containing "backside"
      if (pageContent.includes('backside')) {
        console.log('✅ Found "backside" in page content but no specific project elements');
      } else {
        console.log('❌ No "backside" text found in page content');
      }
    }

    // Step 2: Try to find and click the Run Scan button directly
    console.log('🔍 Looking for Run Scan button...');

    const scanButtonSelectors = [
      'button:has-text("Run Scan")',
      'text=Run Scan',
      'button[data-testid="run-scan"]',
      'button[class*="scan"]',
      '[data-action="run-scan"]'
    ];

    let scanButton = null;
    for (const selector of scanButtonSelectors) {
      try {
        const button = await page.waitForSelector(selector, { timeout: 5000 });
        if (button && await button.isVisible()) {
          console.log(`✅ Found Run Scan button: ${selector}`);
          scanButton = button;
          break;
        }
      } catch (e) {
        console.log(`❌ Run Scan button not found: ${selector}`);
      }
    }

    if (!scanButton) {
      console.log('❌ Could not find Run Scan button. Let\'s check all buttons...');
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons total:`);

      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const button = allButtons[i];
        try {
          const text = await button.textContent();
          console.log(`  Button ${i}: "${text}"`);
        } catch (e) {
          console.log(`  Button ${i}: Could not get text`);
        }
      }
    }

    // Step 3: Manual intervention point
    console.log('\n🎯 MANUAL INSTRUCTIONS:');
    console.log('========================');
    console.log('Please manually perform these steps and tell me what happens:');
    console.log('1. Look for any projects in the sidebar');
    console.log('2. Click on a project (like "backside para b copy")');
    console.log('3. Look for the "Run Scan" button');
    console.log('4. Click "Run Scan" and observe what happens');
    console.log('5. Check if there are any console errors (F12 -> Console)');
    console.log('6. Check if there are any network requests (F12 -> Network)');
    console.log('');
    console.log('Press ENTER in this terminal when you want to continue...');

    // Wait for user to perform manual steps
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('✅ Continuing with automated checks...');

    // Step 4: Check current page state
    console.log('📊 Checking current page state...');

    const tableRows = await page.locator('tbody tr').count();
    console.log(`Table rows found: ${tableRows}`);

    if (tableRows > 0) {
      const tableContent = await page.locator('tbody').textContent();
      console.log('Table content:', tableContent.substring(0, 200));
    }

    // Step 5: Check for any error indicators
    const errorSelectors = [
      '[class*="error"]',
      '[class*="loading"]',
      'text=error',
      'text=failed',
      'text=Loading',
      'text=Scanning'
    ];

    for (const selector of errorSelectors) {
      try {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          console.log(`⚠️ Found ${elements} elements with selector: ${selector}`);
        }
      } catch (e) {
        // Ignore
      }
    }

    await browser.close();

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await browser.close();
    throw error;
  }
}

// Run the debug script
debugManualScan()
  .then(() => {
    console.log('\n🏁 Debug session completed');
  })
  .catch(error => {
    console.error('\n💥 Debug session failed:', error);
    process.exit(1);
  });