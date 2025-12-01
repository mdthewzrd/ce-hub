#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');

async function testCompleteUploadWorkflow() {
  console.log('🚀 COMPLETE UPLOAD WORKFLOW TEST');
  console.log('=' * 60);

  let browser;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser
      slowMo: 1000,    // Slow down actions
      devtools: true   // Open devtools
    });

    page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`🌐 BROWSER [${msg.type()}]:`, msg.text());
      }
    });

    // Enable error logging
    page.on('pageerror', error => {
      console.log(`❌ BROWSER ERROR:`, error.message);
    });

    // Navigate to localhost:5657
    console.log('📄 Step 1: Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded successfully');

    // Step 2: Click Upload Strategy button
    console.log('📤 Step 2: Clicking Upload Strategy button...');
    const uploadButton = await page.locator('text=Upload Strategy').first();
    await uploadButton.click();
    await page.waitForTimeout(1000);

    console.log('✅ Upload modal opened');

    // Step 3: Upload file to the drag & drop area
    console.log('📁 Step 3: Uploading file...');

    // Find the hidden file input and upload to it
    const fileInput = await page.locator('input[type="file"]').first();
    const filePath = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    console.log(`📁 Uploading: ${filePath}`);
    await fileInput.setInputFiles(filePath);

    // Wait for processing
    console.log('⏳ Waiting for file processing...');
    await page.waitForTimeout(8000); // Give it more time to process

    // Take screenshot after upload
    await page.screenshot({ path: 'test_after_upload_processing.png', fullPage: true });
    console.log('📸 Screenshot saved: test_after_upload_processing.png');

    // Step 4: Check for analysis results
    console.log('🔍 Step 4: Checking for analysis results...');

    // Wait for any loading to complete
    await page.waitForTimeout(2000);

    // Check page content for analysis indicators
    const pageContent = await page.textContent('body');

    // Look for parameter detection
    const parameterMatch = pageContent.match(/(\d+)\s*parameters?\s*(detected|found|extracted)/i);
    if (parameterMatch) {
      console.log(`✅ SUCCESS: Found ${parameterMatch[1]} parameters detected!`);
    }

    // Look for scanner type detection
    const scannerMatch = pageContent.match(/scanner\s*type[:\s]*([^\n]+)/i);
    if (scannerMatch) {
      console.log(`🎯 Scanner type: ${scannerMatch[1]}`);
    }

    // Look for analysis section
    if (pageContent.includes('Analysis') || pageContent.includes('parameters') || pageContent.includes('trading')) {
      console.log('✅ Analysis section appears to be present');
    }

    // Step 5: Look for and test Run Scan button
    console.log('🎯 Step 5: Looking for Run Scan functionality...');

    // Try multiple selectors for the run scan button
    const runScanSelectors = [
      'button:has-text("Run Scan")',
      'button:has-text("Start Scan")',
      'button:has-text("Execute")',
      'button:has-text("Start")',
      'button:has-text("Run")',
      '.run-scan',
      '[data-testid*="scan"]'
    ];

    let runScanButton = null;
    let foundSelector = null;

    for (const selector of runScanSelectors) {
      try {
        runScanButton = await page.locator(selector).first();
        if (await runScanButton.isVisible()) {
          foundSelector = selector;
          console.log(`✅ Run Scan button found: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (runScanButton && foundSelector) {
      console.log('🔄 Attempting to click Run Scan button...');

      // Take screenshot before clicking
      await page.screenshot({ path: 'test_before_run_scan_click.png', fullPage: true });

      // Get button text to confirm
      const buttonText = await runScanButton.textContent();
      console.log(`📋 Button text: "${buttonText}"`);

      // Click the button
      await runScanButton.click();
      console.log('✅ Clicked Run Scan button');

      // Wait for response
      await page.waitForTimeout(5000);

      // Take screenshot after clicking
      await page.screenshot({ path: 'test_after_run_scan_click.png', fullPage: true });
      console.log('📸 Screenshot saved: test_after_run_scan_click.png');

      // Check for scan status
      const afterScanContent = await page.textContent('body');

      // Look for scan indicators
      if (afterScanContent.includes('running') || afterScanContent.includes('scanning') || afterScanContent.includes('progress')) {
        console.log('✅ SUCCESS: Scan appears to be running!');
      } else if (afterScanContent.includes('complete') || afterScanContent.includes('results') || afterScanContent.includes('finished')) {
        console.log('✅ SUCCESS: Scan completed!');
      } else {
        console.log('⚠️ Checking for scan status changes...');

        // Compare before and after content
        const contentChanged = pageContent !== afterScanContent;
        console.log(`📊 Content changed after click: ${contentChanged}`);

        if (contentChanged) {
          console.log('✅ Page content changed - scan may have started');
        } else {
          console.log('❌ No content change detected - scan may not have started');
        }
      }

    } else {
      console.log('❌ Run Scan button not found');
      console.log('🔍 Available buttons on page:');

      const allButtons = await page.locator('button').all();
      for (let i = 0; i < allButtons.length; i++) {
        try {
          const buttonText = await allButtons[i].textContent();
          const isVisible = await allButtons[i].isVisible();
          console.log(`   Button ${i + 1}: "${buttonText}" (visible: ${isVisible})`);
        } catch (e) {
          console.log(`   Button ${i + 1}: [could not read]`);
        }
      }
    }

    // Final analysis
    console.log('\n📊 FINAL ANALYSIS:');
    console.log('=' * 40);

    // Take final screenshot
    await page.screenshot({ path: 'test_final_state.png', fullPage: true });
    console.log('📸 Final screenshot saved: test_final_state.png');

    // Keep browser open for inspection
    console.log('🔍 Browser staying open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);

    if (page) {
      await page.screenshot({ path: 'test_error_screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testCompleteUploadWorkflow().then(() => {
  console.log('🎯 Complete workflow test finished');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});