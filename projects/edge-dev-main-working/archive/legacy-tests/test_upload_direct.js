#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');

async function testUploadWorkflow() {
  console.log('🚀 DIRECT BROWSER TEST: LC D2 Upload Workflow');
  console.log('=' * 60);

  let browser;
  let page;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser so we can see what's happening
      slowMo: 1000,    // Slow down actions for better visibility
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

    console.log('✅ Page loaded successfully');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test_initial_state.png', fullPage: true });
    console.log('📸 Screenshot saved: test_initial_state.png');

    // Look for upload section
    const uploadSection = await page.locator('[data-testid="upload-section"], .upload-section, input[type="file"]').first();

    if (await uploadSection.isVisible()) {
      console.log('✅ Upload section found');

      // Check if we can find the file input
      const fileInput = await page.locator('input[type="file"]').first();

      if (await fileInput.isVisible()) {
        console.log('✅ File input found');

        // Set the file - using the LC D2 file path
        const filePath = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

        console.log(`📁 Attempting to upload: ${filePath}`);
        await fileInput.setInputFiles(filePath);

        // Wait for any processing to happen
        await page.waitForTimeout(2000);

        // Take screenshot after upload
        await page.screenshot({ path: 'test_after_upload.png', fullPage: true });
        console.log('📸 Screenshot saved: test_after_upload.png');

        // Look for parameters or analysis results
        const analysisSection = await page.locator('[data-testid="analysis-section"], .analysis, .parameters').first();

        if (await analysisSection.isVisible()) {
          console.log('✅ Analysis section appeared');

          // Look for parameter count
          const parameterText = await page.textContent('body');
          const parameterMatch = parameterText.match(/(\d+)\s*parameters?/i);

          if (parameterMatch) {
            console.log(`📊 Found ${parameterMatch[1]} parameters`);
          }

          // Look for Run Scan button
          const runScanButton = await page.locator('button:has-text("Run Scan"), button:has-text("Start"), button:has-text("Execute")').first();

          if (await runScanButton.isVisible()) {
            console.log('✅ Run Scan button found');

            // Take screenshot before clicking
            await page.screenshot({ path: 'test_before_run_scan.png', fullPage: true });

            console.log('🔄 Clicking Run Scan button...');
            await runScanButton.click();

            // Wait for scan to start/complete
            await page.waitForTimeout(3000);

            // Take screenshot after clicking
            await page.screenshot({ path: 'test_after_run_scan.png', fullPage: true });
            console.log('📸 Screenshot saved: test_after_run_scan.png');

            // Check if scan is running or completed
            const scanStatus = await page.textContent('body');
            console.log('📊 Current page content (scan status check):', scanStatus.substring(0, 500));

          } else {
            console.log('❌ Run Scan button not found');
          }

        } else {
          console.log('❌ Analysis section not found after upload');
        }

      } else {
        console.log('❌ File input not visible');
      }

    } else {
      console.log('❌ Upload section not found');
    }

    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);
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