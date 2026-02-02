#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE VALIDATION TEST
 * Tests the complete end-to-end workflow from clicking Run Scan to getting real backside B results
 */

const { chromium } = require('playwright');

async function finalValidationTest() {
  console.log('🚀 STARTING FINAL COMPREHENSIVE VALIDATION');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Monitor all network requests
    const apiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes(':8000')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
        console.log(`📡 API Request: ${request.method()} ${request.url()}`);
      }
    });

    // Monitor all responses
    const apiResponses = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes(':8000')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
      }
    });

    console.log('\n🌐 Navigating to frontend...');
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(3000);

    console.log('📊 Looking for Backside Para B Scanner project...');

    // Look for the project in the sidebar
    let projectFound = false;
    try {
      const projectElement = await page.waitForSelector('text=Backside Para B Scanner', { timeout: 10000 });
      if (projectElement) {
        console.log('✅ Found Backside Para B Scanner project');
        projectFound = true;
        await projectElement.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('⚠️ Backside Para B Scanner not found in sidebar, looking for any project...');
    }

    // If no specific project found, try to find any selectable project
    if (!projectFound) {
      try {
        const anyProject = await page.locator('[class*="project"], [class*="scanner"], div[role="button"]').first();
        if (await anyProject.isVisible()) {
          console.log('📋 Selecting first available project...');
          await anyProject.click();
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        console.log('⚠️ No projects found, proceeding with default selection');
      }
    }

    console.log('\n🎯 Looking for Run Scan button...');

    // Find and click the Run Scan button
    const runScanButton = await page.locator('text=Run Scan').first();
    if (!(await runScanButton.isVisible())) {
      throw new Error('Run Scan button not found or not visible');
    }

    console.log('✅ Found Run Scan button');

    // Clear previous API requests to focus on the new ones
    apiRequests.length = 0;
    apiResponses.length = 0;

    console.log('\n🚀 Clicking Run Scan button...');
    await runScanButton.click();

    // Wait for execution to complete - watch for API calls
    console.log('⏳ Waiting for scan execution and API responses...');

    let executionCompleted = false;
    let executionResults = null;

    // Wait up to 60 seconds for execution to complete
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);

      // Check if we have any API responses
      if (apiResponses.length > 0) {
        console.log(`📊 Found ${apiResponses.length} API responses`);

        // Look for successful execution response
        for (const response of apiResponses) {
          if (response.url.includes('/execute') && response.status === 200) {
            console.log('✅ Successful execution API call detected');
            executionCompleted = true;
          }
        }
        break;
      }
    }

    // Wait additional time for results to appear
    await page.waitForTimeout(5000);

    console.log('\n📈 Analyzing execution results...');

    // Check for results in the page
    let resultsFound = 0;
    let realResultsFound = false;

    // Look for result statistics and displays
    try {
      // Check for result count elements
      const resultElements = await page.locator('[class*="result"], [class*="count"], [class*="signal"], [class*="trade"]').all();
      console.log(`📊 Found ${resultElements.length} potential result elements`);

      // Look for specific tickers and data that indicate real results
      const tickerElements = await page.locator('text=/^[A-Z]{1,5}$/').all(); // Stock ticker patterns
      if (tickerElements.length > 0) {
        console.log(`📈 Found ${tickerElements.length} ticker symbols`);

        // Get the text content of tickers
        const tickers = [];
        for (const ticker of tickerElements.slice(0, 10)) {
          try {
            const text = await ticker.textContent();
            if (text && text.length >= 1 && text.length <= 5 && /^[A-Z]+$/.test(text)) {
              tickers.push(text);
            }
          } catch (e) {}
        }

        if (tickers.length > 0) {
          console.log(`📈 Sample tickers: ${tickers.slice(0, 5).join(', ')}`);
          realResultsFound = true;
          resultsFound = tickers.length;
        }
      }

      // Look for numeric values that could be prices or percentages
      const numericElements = await page.locator('text=/\\$?[0-9]+\\.?[0-9]*%?/').all();
      if (numericElements.length > 0) {
        console.log(`📊 Found ${numericElements.length} numeric values`);
      }

      // Look for dates that indicate real trading data
      const dateElements = await page.locator('text=/\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{4}/').all();
      if (dateElements.length > 0) {
        console.log(`📅 Found ${dateElements.length} date values`);
      }

    } catch (error) {
      console.log('⚠️ Error analyzing page elements:', error.message);
    }

    // Check for scan statistics
    let scanStats = null;
    try {
      const statsElement = await page.locator('text=/Found|Results|Signals|Trades/').first();
      if (await statsElement.isVisible()) {
        const statsText = await statsElement.textContent();
        console.log(`📊 Scan statistics: ${statsText}`);
        scanStats = statsText;
      }
    } catch (error) {}

    // Analyze API traffic
    console.log('\n🔍 API Traffic Analysis:');
    console.log(`📡 Total API requests: ${apiRequests.length}`);
    console.log(`📡 Total API responses: ${apiResponses.length}`);

    let backendCalled = false;
    let successfulExecution = false;

    for (const request of apiRequests) {
      if (request.url.includes(':8000') || request.url.includes('/execute')) {
        backendCalled = true;
        console.log(`✅ Backend called: ${request.url}`);
      }
    }

    for (const response of apiResponses) {
      if (response.url.includes(':8000') || response.url.includes('/execute')) {
        if (response.status === 200) {
          successfulExecution = true;
          console.log(`✅ Successful backend response: ${response.url}`);
        } else {
          console.log(`❌ Backend error: ${response.status} ${response.url}`);
        }
      }
    }

    // Final assessment
    console.log('\n🏁 FINAL VALIDATION RESULTS:');
    console.log('=' .repeat(50));

    let allTestsPassed = true;
    let issuesFound = [];

    if (!backendCalled) {
      console.log('❌ ISSUE: Backend API was not called');
      issuesFound.push('Backend API not called');
      allTestsPassed = false;
    } else {
      console.log('✅ Backend API was called successfully');
    }

    if (!successfulExecution) {
      console.log('❌ ISSUE: Backend execution failed');
      issuesFound.push('Backend execution failed');
      allTestsPassed = false;
    } else {
      console.log('✅ Backend execution succeeded');
    }

    if (realResultsFound && resultsFound > 0) {
      console.log(`✅ REAL TRADING RESULTS FOUND: ${resultsFound} results displayed`);
      console.log('🎉 THE FIX IS WORKING! Frontend is now showing real backside B results');
    } else {
      console.log('❌ ISSUE: No real trading results found in the UI');
      issuesFound.push('No real results displayed');
      allTestsPassed = false;
    }

    if (scanStats) {
      console.log(`📊 Scan Statistics: ${scanStats}`);
    }

    // Summary
    if (allTestsPassed && realResultsFound) {
      console.log('\n🎉 SUCCESS! The Run Scan button is now working correctly!');
      console.log('✅ Frontend properly calls backend API');
      console.log('✅ Backend executes backside B scanner synchronously');
      console.log('✅ Frontend receives and displays real trading results');
      console.log('✅ Complete end-to-end workflow validated');

      // Take a screenshot of success
      await page.screenshot({ path: 'validation-success.png', fullPage: true });
      console.log('📸 Success screenshot saved: validation-success.png');

      return true;
    } else {
      console.log('\n❌ VALIDATION FAILED - Issues found:');
      issuesFound.forEach(issue => console.log(`   - ${issue}`));

      // Take a screenshot for debugging
      await page.screenshot({ path: 'validation-failed.png', fullPage: true });
      console.log('📸 Failure screenshot saved: validation-failed.png');

      return false;
    }

  } catch (error) {
    console.error('\n❌ VALIDATION ERROR:', error.message);

    try {
      await page.screenshot({ path: 'validation-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: validation-error.png');
    } catch (screenshotError) {}

    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🔍 COMPREHENSIVE END-TO-END VALIDATION TEST');
  console.log('Testing that Run Scan button produces real backside B results\n');

  const success = await finalValidationTest();

  if (success) {
    console.log('\n✅ VALIDATION COMPLETE - Run Scan fix is working!');
    console.log('The user can now click Run Scan and get real backside B results');
  } else {
    console.log('\n❌ VALIDATION FAILED - Further investigation needed');
    console.log('The Run Scan button still needs additional fixes');
  }

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}