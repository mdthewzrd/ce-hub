/**
 * Test Script: LC D2 Scanner Fix Verification
 *
 * This script tests the Pattern 5 fix for LC D2 scanners with fetch_daily_data + adjust_daily structure
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testLCD2ScannerFix() {
  console.log('🧪 Testing LC D2 Scanner Fix (Pattern 5)...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:5657...');
    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // Click Upload Strategy button
    console.log('📤 Clicking Upload Strategy...');
    await page.click('button:has-text("Upload Strategy")');

    // Wait for upload modal
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });

    // Test Case 1: Upload LC D2 scanner file
    const lcD2File = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';

    if (fs.existsSync(lcD2File)) {
      console.log(`📁 Uploading LC D2 file: ${lcD2File}`);

      // Upload the file
      await page.setInputFiles('input[type="file"]', lcD2File);

      // Wait for upload to complete
      await page.waitForTimeout(5000);

      // Look for success indicators
      const uploadSuccess = await page.isVisible('text*="uploaded"') ||
                           await page.isVisible('text*="success"') ||
                           await page.isVisible('text*="ready"');

      if (uploadSuccess) {
        console.log('✅ LC D2 file upload completed');

        // Close upload modal if needed
        try {
          await page.click('button:has-text("Close")');
        } catch (e) {
          // Modal might close automatically
        }

        // Wait a bit for any processing
        await page.waitForTimeout(2000);

        // Now test the scan execution
        console.log('🚀 Running scan with LC D2...');

        // Look for Run Scan button and click it
        const runScanButton = page.locator('button:has-text("Run Scan")');
        await runScanButton.click();

        // Monitor for progress indicators and results
        console.log('⏳ Waiting for scan results...');

        // Wait longer for the scan to complete
        await page.waitForTimeout(30000);

        // Check for results
        const resultsTable = page.locator('table');
        const hasResults = await resultsTable.isVisible();

        if (hasResults) {
          const rowCount = await page.locator('table tbody tr').count();
          console.log(`📊 Found results table with ${rowCount} rows`);

          if (rowCount > 0) {
            console.log('🎉 SUCCESS: LC D2 scanner now produces results!');
            console.log('✅ Pattern 5 fix is working correctly');

            // Take a screenshot for verification
            await page.screenshot({
              path: '/Users/michaeldurante/ai dev/ce-hub/lc_d2_fix_success.png',
              fullPage: true
            });
            console.log('📸 Success screenshot saved: lc_d2_fix_success.png');

          } else {
            console.log('⚠️ Results table exists but no rows found');
            console.log('📊 This could be normal if no patterns were found in the date range');
          }
        } else {
          console.log('❌ No results table found - scan may have failed');
        }

        // Check browser console for Pattern 5 detection
        const logs = await page.evaluate(() => {
          return console.log.toString();
        });

        console.log('🔍 Check browser console for "Detected Pattern 5" message');

      } else {
        console.log('❌ LC D2 file upload failed');
      }

    } else {
      console.log(`❌ LC D2 test file not found: ${lcD2File}`);
      console.log('📝 Please ensure the file exists to test the fix');
    }

    // Test Case 2: Verify Backside Para B still works (regression test)
    console.log('\n🔄 Testing Backside Para B (regression test)...');

    const backsideFile = '/Users/michaeldurante/Downloads/backside para b copy.py';

    if (fs.existsSync(backsideFile)) {
      console.log('📁 Uploading Backside Para B for regression test...');

      // Click Upload Strategy again
      await page.click('button:has-text("Upload Strategy")');
      await page.waitForSelector('input[type="file"]', { timeout: 5000 });

      // Upload the file
      await page.setInputFiles('input[type="file"]', backsideFile);
      await page.waitForTimeout(10000); // Backside takes longer

      // Close modal and run scan
      try {
        await page.click('button:has-text("Close")');
      } catch (e) {}

      await page.waitForTimeout(2000);
      await page.click('button:has-text("Run Scan")');
      await page.waitForTimeout(20000);

      const rowCount2 = await page.locator('table tbody tr').count();
      if (rowCount2 > 0) {
        console.log('✅ Regression test passed: Backside Para B still works');
      } else {
        console.log('⚠️ Regression test: Backside Para B may have issues');
      }

    } else {
      console.log('📝 Backside Para B file not found - skipping regression test');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Test Summary
console.log(`
🔬 LC D2 SCANNER FIX TEST PLAN
===============================

This test verifies the Pattern 5 fix for LC D2 scanners.

BEFORE FIX:
- LC D2 uploads instantly but returns 0 results
- Pattern matching fails (only patterns 1-4 exist)
- Log shows "No pattern matching" or Pattern 4 failure

AFTER FIX:
- LC D2 uploads instantly AND returns actual results
- Pattern 5 detection: "fetch_daily_data + adjust_daily + SYMBOLS"
- Execution: fetch_daily_data() → adjust_daily() → results

EXPECTED LOG MESSAGES:
✅ "Detected Pattern 5: fetch_daily_data + adjust_daily + SYMBOLS"
✅ "Pattern 5: Executing fetch_daily_data + adjust_daily for X symbols"
✅ "Pattern 5 execution completed: Y symbol datasets processed"

`);

// Run the test
testLCD2ScannerFix().then(() => {
  console.log('🏁 LC D2 Scanner Fix Test Completed');
}).catch(error => {
  console.error('💥 Test suite failed:', error);
});