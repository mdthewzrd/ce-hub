#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');

async function testUploadWorkflow() {
  console.log('🚀 DIRECT BROWSER TEST: LC D2 Upload Workflow (FIXED)');
  console.log('=' * 60);

  let browser;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser so we can see what's happening
      slowMo: 500,     // Slow down actions for better visibility
      devtools: true   // Open devtools to see console
    });

    page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      console.log(`🌐 BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });

    // Enable error logging
    page.on('pageerror', error => {
      console.log(`❌ BROWSER ERROR:`, error.message);
    });

    // Navigate to localhost:5657
    console.log('📄 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', { waitUntil: 'networkidle' });

    // Wait for page to load completely
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give React time to render

    console.log('✅ Page loaded successfully');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test_step1_initial.png', fullPage: true });
    console.log('📸 Screenshot saved: test_step1_initial.png');

    // Step 1: Click the "Upload Strategy" button
    console.log('🎯 Step 1: Looking for Upload Strategy button...');

    const uploadButton = await page.locator('text=Upload Strategy').first();

    if (await uploadButton.isVisible()) {
      console.log('✅ Upload Strategy button found');

      await uploadButton.click();
      console.log('🔄 Clicked Upload Strategy button');

      // Wait for upload modal/section to appear
      await page.waitForTimeout(1000);

      // Take screenshot after clicking upload button
      await page.screenshot({ path: 'test_step2_upload_modal.png', fullPage: true });
      console.log('📸 Screenshot saved: test_step2_upload_modal.png');

      // Step 2: Look for file input in the upload modal/section
      console.log('🎯 Step 2: Looking for file input...');

      const fileInput = await page.locator('input[type="file"]').first();

      if (await fileInput.isVisible()) {
        console.log('✅ File input found');

        // Set the file - using the LC D2 file path
        const filePath = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

        console.log(`📁 Attempting to upload: ${filePath}`);
        await fileInput.setInputFiles(filePath);

        // Wait for processing to happen
        console.log('⏳ Waiting for file processing...');
        await page.waitForTimeout(5000); // Give it time to process

        // Take screenshot after upload
        await page.screenshot({ path: 'test_step3_after_upload.png', fullPage: true });
        console.log('📸 Screenshot saved: test_step3_after_upload.png');

        // Step 3: Look for analysis results
        console.log('🎯 Step 3: Looking for analysis results...');

        // Wait for any analysis text to appear
        await page.waitForTimeout(2000);

        // Check page content for parameters
        const pageContent = await page.textContent('body');
        console.log('📊 Checking for parameter detection...');

        const parameterMatches = pageContent.match(/(\d+)\s*parameters?\s*(detected|found|extracted)/i);

        if (parameterMatches) {
          console.log(`✅ SUCCESS: Found ${parameterMatches[1]} parameters detected!`);
        } else {
          console.log('⚠️ No parameter detection message found');
          console.log('📋 Page content sample:', pageContent.substring(0, 1000));
        }

        // Step 4: Look for Run Scan button and test it
        console.log('🎯 Step 4: Looking for Run Scan functionality...');

        const runScanSelectors = [
          'button:has-text("Run Scan")',
          'button:has-text("Start Scan")',
          'button:has-text("Execute")',
          '[data-testid="run-scan"]',
          '.run-scan-button'
        ];

        let runScanButton = null;

        for (const selector of runScanSelectors) {
          try {
            runScanButton = await page.locator(selector).first();
            if (await runScanButton.isVisible()) {
              console.log(`✅ Run Scan button found with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        if (runScanButton && await runScanButton.isVisible()) {
          console.log('🔄 Attempting to click Run Scan button...');

          // Take screenshot before clicking
          await page.screenshot({ path: 'test_step4_before_run_scan.png', fullPage: true });

          await runScanButton.click();
          console.log('✅ Clicked Run Scan button');

          // Wait for scan to start/complete
          await page.waitForTimeout(5000);

          // Take screenshot after clicking
          await page.screenshot({ path: 'test_step5_after_run_scan.png', fullPage: true });
          console.log('📸 Screenshot saved: test_step5_after_run_scan.png');

          // Check for scan status/results
          const afterScanContent = await page.textContent('body');
          console.log('📊 After scan click - checking for status changes...');

          if (afterScanContent.includes('running') || afterScanContent.includes('scanning') || afterScanContent.includes('progress')) {
            console.log('✅ SUCCESS: Scan appears to be running!');
          } else if (afterScanContent.includes('complete') || afterScanContent.includes('results') || afterScanContent.includes('finished')) {
            console.log('✅ SUCCESS: Scan completed!');
          } else {
            console.log('⚠️ Scan status unclear - checking for errors...');

            // Check browser console for errors
            console.log('🔍 Checking console for errors...');
          }

        } else {
          console.log('❌ Run Scan button not found');
          console.log('🔍 Available buttons on page:');

          const allButtons = await page.locator('button').all();
          for (let i = 0; i < allButtons.length; i++) {
            try {
              const buttonText = await allButtons[i].textContent();
              console.log(`   Button ${i + 1}: "${buttonText}"`);
            } catch (e) {
              console.log(`   Button ${i + 1}: [could not read text]`);
            }
          }
        }

      } else {
        console.log('❌ File input not found after clicking Upload Strategy');
        console.log('🔍 Looking for any input elements...');

        const allInputs = await page.locator('input').all();
        console.log(`Found ${allInputs.length} input elements`);

        for (let i = 0; i < allInputs.length; i++) {
          try {
            const inputType = await allInputs[i].getAttribute('type');
            const inputId = await allInputs[i].getAttribute('id');
            console.log(`   Input ${i + 1}: type="${inputType}", id="${inputId}"`);
          } catch (e) {
            console.log(`   Input ${i + 1}: [could not read attributes]`);
          }
        }
      }

    } else {
      console.log('❌ Upload Strategy button not found');
      console.log('🔍 Looking for any upload-related buttons...');

      const uploadElements = await page.locator('button').all();
      for (let i = 0; i < uploadElements.length; i++) {
        try {
          const buttonText = await uploadElements[i].textContent();
          if (buttonText.toLowerCase().includes('upload')) {
            console.log(`   Found upload button: "${buttonText}"`);
          }
        } catch (e) {
          // Continue
        }
      }
    }

    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 20 seconds for manual inspection...');
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('❌ Test failed:', error);

    // Take error screenshot
    if (page) {
      await page.screenshot({ path: 'test_error_state.png', fullPage: true });
      console.log('📸 Error screenshot saved: test_error_state.png');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testUploadWorkflow().then(() => {
  console.log('🎯 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});