const { chromium } = require('playwright');

async function testFrontendRealResults() {
  console.log('🎭 Starting comprehensive frontend validation with Playwright...');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down actions
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to the frontend with proper wait
    console.log('🌐 Navigating to frontend...');
    await page.goto('http://localhost:5656', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to actually load content
    await page.waitForTimeout(3000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'frontend_initial_state.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: frontend_initial_state.png');

    // Step 2: Look for the backside B project
    console.log('🔍 Looking for backside B project...');

    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"], .project-card, .project-item, [class*="project"], [id*="project"]', {
      timeout: 10000
    }).catch(() => console.log('⚠️ Project cards not found with standard selectors'));

    // Try multiple selectors for projects
    const projectSelectors = [
      'text=backside para b copy',
      'text=backside',
      '[data-project-id="1764956201741"]',
      `text=1764956201741`,
      '[class*="backside"]',
      '[class*="scanner"]',
      '.card',
      '[role="button"]'
    ];

    let projectElement = null;
    for (const selector of projectSelectors) {
      try {
        console.log(`🔎 Trying selector: ${selector}`);
        projectElement = await page.waitForSelector(selector, { timeout: 5000 });
        if (projectElement) {
          console.log(`✅ Found project with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Selector not found: ${selector}`);
      }
    }

    if (!projectElement) {
      console.log('📄 Getting page content to debug...');
      const content = await page.content();
      console.log('Page content length:', content.length);

      // Look for any text containing "backside" or project IDs
      const textContent = await page.textContent('body');
      console.log('Page contains "backside":', textContent.includes('backside'));
      console.log('Page contains "1764956201741":', textContent.includes('1764956201741'));

      // Take screenshot of current state for debugging
      await page.screenshot({
        path: 'frontend_debug_state.png',
        fullPage: true
      });

      throw new Error('Could not find backside B project on the page');
    }

    // Step 3: Click on the project and wait for navigation
    console.log('🖱️ Clicking on backside B project...');
    await projectElement.click();

    // Wait for potential navigation or modal
    await page.waitForTimeout(2000);

    // Take screenshot after clicking project
    await page.screenshot({
      path: 'frontend_after_project_click.png',
      fullPage: true
    });

    // Step 4: Look for "Run Scan" or execute button
    console.log('🎯 Looking for Run Scan button...');

    const scanButtonSelectors = [
      'text=Run Scan',
      'text=Execute',
      'text=Start Scan',
      '[data-testid="run-scan"]',
      '[class*="run"]',
      '[class*="execute"]',
      '[class*="scan"]',
      'button',
      '[role="button"]'
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

    // Step 5: Click Run Scan and wait for execution
    console.log('🚀 Clicking Run Scan button...');
    await scanButton.click();

    // Wait for scan to start and complete
    console.log('⏳ Waiting for scan execution...');

    // Look for loading indicators
    const loadingSelectors = [
      'text=Loading',
      'text=Scanning',
      'text=Executing',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="progress"]'
    ];

    // Wait up to 60 seconds for scan completion
    let scanCompleted = false;
    for (let i = 0; i < 120; i++) { // 120 * 0.5s = 60 seconds
      await page.waitForTimeout(500);

      // Check for completion indicators
      const hasResults = await page.locator('text=results').count() > 0 ||
                        await page.locator('[class*="result"]').count() > 0 ||
                        await page.locator('[class*="table"]').count() > 0 ||
                        await page.locator('tbody').count() > 0 ||
                        await page.locator('[data-testid="results"]').count() > 0;

      if (hasResults) {
        console.log('✅ Scan appears to have completed - found results indicators');
        scanCompleted = true;
        break;
      }

      // Check for any completion messages
      const hasCompletionMessage = await page.locator('text=complete').count() > 0 ||
                                  await page.locator('text=finished').count() > 0 ||
                                  await page.locator('text=done').count() > 0;

      if (hasCompletionMessage) {
        console.log('✅ Scan appears to have completed - found completion message');
        scanCompleted = true;
        break;
      }

      if (i % 10 === 0) {
        console.log(`⏳ Still waiting... ${i * 0.5}s elapsed`);
      }
    }

    if (!scanCompleted) {
      console.log('⚠️ Scan completion not clearly detected, proceeding to check for results...');
    }

    // Step 6: Wait a bit more for results to fully load
    await page.waitForTimeout(3000);

    // Take screenshot of results
    await page.screenshot({
      path: 'frontend_scan_results.png',
      fullPage: true
    });
    console.log('📸 Screenshot taken: frontend_scan_results.png');

    // Step 7: Analyze the results displayed
    console.log('🔍 Analyzing displayed results...');

    // Get all text content to check for tickers
    const pageText = await page.textContent('body');

    // Check for mock data indicators (what we DON'T want to see)
    const hasMockData = pageText.includes('WOLF') &&
                      pageText.includes('ETHZ') &&
                      pageText.includes('ATNF') &&
                      (pageText.includes('+187.2%') || pageText.includes('+89.5%'));

    // Check for real results (what we DO want to see)
    const hasRealResults = pageText.includes('SOXL') ||
                          pageText.includes('INTC') ||
                          pageText.includes('XOM') ||
                          pageText.includes('AMD') ||
                          pageText.includes('SMCI') ||
                          pageText.includes('BABA');

    // Look for table rows with results
    const tableRows = await page.locator('tbody tr, [class*="row"], [data-testid*="result"]').count();
    const resultElements = await page.locator('[class*="result"], [data-testid*="result"]').count();

    console.log('📊 Results Analysis:');
    console.log(`   - Total table rows found: ${tableRows}`);
    console.log(`   - Result elements found: ${resultElements}`);
    console.log(`   - Has mock data (WOLF, ETHZ, ATNF): ${hasMockData}`);
    console.log(`   - Has real results (SOXL, INTC, etc.): ${hasRealResults}`);

    // Extract visible ticker symbols
    const tickerMatches = pageText.match(/\b([A-Z]{1,5})\b/g);
    if (tickerMatches) {
      const uniqueTickers = [...new Set(tickerMatches)].sort();
      console.log(`   - Ticker symbols found: ${uniqueTickers.slice(0, 20).join(', ')}${uniqueTickers.length > 20 ? '...' : ''}`);
    }

    // Final verdict
    console.log('\n🎯 FINAL VALIDATION RESULTS:');

    if (hasMockData) {
      console.log('❌ FAILED: Frontend is still displaying MOCK DATA');
      console.log('   - The fix did not work - mock data is still being shown');
      console.log('   - Check for other places where mock data might be set');
    } else if (hasRealResults) {
      console.log('✅ SUCCESS: Frontend is displaying REAL RESULTS');
      console.log('   - The mock data fix worked correctly');
      console.log('   - Real backside B scanner results are being displayed');
    } else if (tableRows > 0 || resultElements > 0) {
      console.log('⚠️ UNCLEAR: Frontend has results but could not identify if real or mock');
      console.log('   - Check the screenshots to manually verify');
    } else {
      console.log('⚠️ NO RESULTS: Frontend completed scan but no results are visible');
      console.log('   - Scan might have returned no results or results are not displayed');
    }

    // Take final screenshot for documentation
    await page.screenshot({
      path: 'frontend_final_validation.png',
      fullPage: true
    });

    console.log('\n📸 Screenshots saved:');
    console.log('   - frontend_initial_state.png');
    console.log('   - frontend_debug_state.png');
    console.log('   - frontend_after_project_click.png');
    console.log('   - frontend_scan_results.png');
    console.log('   - frontend_final_validation.png');

    return {
      success: hasRealResults && !hasMockData,
      hasMockData,
      hasRealResults,
      tableRows,
      resultElements
    };

  } catch (error) {
    console.error('❌ Error during frontend validation:', error.message);

    // Take error screenshot
    await page.screenshot({
      path: 'frontend_error_state.png',
      fullPage: true
    });

    throw error;

  } finally {
    await browser.close();
  }
}

// Run the validation
testFrontendRealResults()
  .then(result => {
    console.log('\n🏁 Frontend validation completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Frontend validation failed:', error);
    process.exit(1);
  });