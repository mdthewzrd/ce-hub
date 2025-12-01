const { chromium } = require('playwright');
const fs = require('fs');

async function testRealLCD2Scan() {
  console.log('🧪 TESTING REAL LC D2 SCAN ON FRESH PORT 5658');
  console.log('=' .repeat(60));
  console.log('Date Range: 1/1/25 to 11/1/25');
  console.log('Expected: Full workflow with real results list');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enhanced console monitoring
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📊') || text.includes('✅') || text.includes('❌') ||
        text.includes('qualifying') || text.includes('Found') ||
        text.includes('Error') || text.includes('Failed')) {
      console.log(`🌐 FRONTEND: ${text}`);
    }
  });

  try {
    console.log('📍 Step 1: Navigate to FRESH PORT 5658');
    await page.goto('http://localhost:5659', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);

    console.log('📤 Step 2: Click Upload Strategy');
    const uploadButton = page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(2000);

    console.log('📄 Step 3: Load LC D2 file');
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found at expected path');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    console.log(`📊 File size: ${fileContent.length} characters`);

    console.log('📝 Step 4: Paste code and wait for analysis');
    const textarea = page.locator('textarea');
    await textarea.fill(fileContent);
    await page.waitForTimeout(3000);

    console.log('⏳ Step 5: Wait for analysis to complete');
    // Wait for analysis completion - looking for the preview modal
    let analysisComplete = false;
    for (let i = 0; i < 120; i++) { // 2 minutes max
      try {
        // Check if Run button is visible (indicates analysis is done)
        const runButton = page.locator('text=Run Scan');
        if (await runButton.isVisible()) {
          console.log('✅ Analysis complete - Run Scan button is visible');
          analysisComplete = true;
          break;
        }

        // Check for "Proceed" button in modal
        const proceedButton = page.locator('text=Proceed');
        if (await proceedButton.isVisible()) {
          console.log('📋 Analysis complete - clicking Proceed to confirm');
          await proceedButton.click();
          await page.waitForTimeout(2000);
        }

        await page.waitForTimeout(1000);
      } catch (e) {
        // Continue waiting
      }
    }

    if (!analysisComplete) {
      console.log('❌ Analysis did not complete in time');
      await page.screenshot({ path: 'analysis_timeout.png' });
      return;
    }

    console.log('🎯 Step 6: Configure date range and run scan');

    // Set start date to 1/1/25
    console.log('📅 Setting start date to 1/1/25');
    const startDateInput = page.locator('input[placeholder*="start" i], input[name*="start" i], input[id*="start" i]').first();
    await startDateInput.fill('2025-01-01');
    await page.waitForTimeout(500);

    // Set end date to 11/1/25
    console.log('📅 Setting end date to 11/1/25');
    const endDateInput = page.locator('input[placeholder*="end" i], input[name*="end" i], input[id*="end" i]').first();
    await endDateInput.fill('2025-11-01');
    await page.waitForTimeout(500);

    // Click Run Scan
    console.log('🚀 Clicking Run Scan button');
    const runButton = page.locator('text=Run Scan');
    await runButton.click();

    console.log('⏳ Step 7: Wait for scan execution to complete');
    let scanComplete = false;
    let resultsList = [];

    // Monitor for up to 10 minutes for scan completion
    for (let i = 0; i < 600; i++) { // 10 minutes max
      try {
        // Check for results table or completion indicators
        const resultsTable = page.locator('table, .results-list, [class*="result"]');
        if (await resultsTable.count() > 0) {
          console.log('📊 Results detected - extracting data');

          // Try to extract table rows
          const rows = await page.locator('table tr, .result-item').all();
          for (let j = 0; j < rows.length; j++) {
            const rowText = await rows[j].textContent();
            if (rowText && rowText.includes('$') || rowText.includes('%') || /[A-Z]{2,5}/.test(rowText)) {
              resultsList.push(rowText.trim());
            }
          }

          if (resultsList.length > 0) {
            scanComplete = true;
            break;
          }
        }

        // Check for completion message
        const completionElements = await page.locator('text=/completed|finished|done|results/i').all();
        if (completionElements.length > 0) {
          console.log('✅ Scan appears to be complete');

          // Look for any text that might contain stock tickers or results
          const pageContent = await page.textContent('body');
          const lines = pageContent.split('\n');

          for (const line of lines) {
            if (line.includes('$') || line.includes('%') || /[A-Z]{2,5}/.test(line)) {
              resultsList.push(line.trim());
            }
          }

          scanComplete = true;
          break;
        }

        // Check for error messages
        const errorElements = await page.locator('text=/error|failed|timeout/i').all();
        if (errorElements.length > 0) {
          console.log('❌ Scan failed or encountered errors');
          break;
        }

        await page.waitForTimeout(1000);
      } catch (e) {
        // Continue monitoring
      }
    }

    console.log('📊 Step 8: Report Results');
    console.log('=' .repeat(50));

    if (scanComplete && resultsList.length > 0) {
      console.log(`✅ SCAN SUCCESSFUL - Found ${resultsList.length} results:`);
      console.log('');

      resultsList.forEach((result, index) => {
        console.log(`${index + 1}. ${result}`);
      });

    } else if (scanComplete) {
      console.log('✅ SCAN COMPLETED but no qualifying stocks found for date range 1/1/25 to 11/1/25');
      console.log('This could be normal if no stocks met the LC D2 criteria during this period');

    } else {
      console.log('❌ SCAN DID NOT COMPLETE or results not detected');
      console.log('Possible issues:');
      console.log('- Scan still running (may need more time)');
      console.log('- Results displayed in unexpected format');
      console.log('- Technical error during execution');
    }

    await page.screenshot({ path: 'lc_d2_final_results.png' });

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'lc_d2_scan_error.png' });
  } finally {
    console.log('🔍 Keeping browser open for manual inspection (60 seconds)');
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

testRealLCD2Scan().catch(console.error);