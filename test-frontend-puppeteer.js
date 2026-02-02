#!/usr/bin/env node

/**
 * REAL FRONTEND PUPPETEER VALIDATION TEST
 * Tests the complete user experience using the actual browser interface
 * This simulates what the user actually does: visit the site, upload file, click Run Scan
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testRealFrontendWorkflow() {
  console.log('🎯 REAL FRONTEND PUPPETEER VALIDATION TEST');
  console.log('Testing: Complete user experience with real browser automation');
  console.log('File: /Users/michaeldurante/Downloads/backside para b copy.py\n');

  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to the frontend
    console.log('🔍 Navigating to frontend...');
    await page.goto('http://localhost:5656');
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Frontend loaded successfully');

    // Step 2: Look for the upload area or project creation
    console.log('\n📁 Looking for upload functionality...');

    // Take a screenshot to see what's actually visible
    await page.screenshot({
      path: 'puppeteer-screenshot-1-landing.png',
      fullPage: true
    });
    console.log('📸 Saved landing page screenshot');

    // Look for any upload buttons or file input elements
    const uploadElements = await page.$$('input[type="file"]');
    const projectButtons = await page.$$('button');
    const runScanButtons = await page.$$('button');

    console.log(`Found ${uploadElements.length} file input elements`);
    console.log(`Found ${projectButtons.length} buttons total`);
    console.log(`Found ${runScanButtons.length} potential Run Scan buttons`);

    // Look for text content that indicates upload functionality
    const pageContent = await page.content();
    const hasUpload = pageContent.includes('upload') || pageContent.includes('Upload') || pageContent.includes('file');
    const hasProject = pageContent.includes('project') || pageContent.includes('Project');
    const hasScan = pageContent.includes('scan') || pageContent.includes('Scan') || pageContent.includes('Run Scan');

    console.log(`Page content analysis:`);
    console.log(`  - Upload related: ${hasUpload}`);
    console.log(`  - Project related: ${hasProject}`);
    console.log(`  - Scan related: ${hasScan}`);

    // Try to find and interact with upload functionality
    if (uploadElements.length > 0) {
      console.log('\n📤 Found file input, attempting to upload backside B...');

      const filePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
      if (fs.existsSync(filePath)) {
        await uploadElements[0].uploadFile(filePath);
        console.log('✅ File uploaded successfully');

        // Wait for any processing or UI changes
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: 'puppeteer-screenshot-2-after-upload.png',
          fullPage: true
        });
        console.log('📸 Saved after-upload screenshot');
      } else {
        console.log('❌ File not found:', filePath);
      }
    } else {
      console.log('\n⚠️ No file input elements found - may need to navigate to upload page');
    }

    // Step 3: Look for Run Scan button
    console.log('\n🚀 Looking for Run Scan button...');

    const runScanTexts = ['Run Scan', 'run scan', 'Execute', 'execute', 'Start Scan'];
    let runScanButton = null;

    for (const text of runScanTexts) {
      const buttons = await page.$$eval('button', (buttons, searchText) => {
        return buttons.filter(btn => btn.textContent.toLowerCase().includes(searchText.toLowerCase()));
      }, text);

      if (buttons.length > 0) {
        runScanButton = buttons[0];
        console.log(`✅ Found Run Scan button with text: ${text}`);
        break;
      }
    }

    if (!runScanButton) {
      // Look for any clickable element that might be the run scan button
      const clickableElements = await page.$$('button, [role="button"], .btn, [onclick]');
      console.log(`Found ${clickableElements.length} clickable elements`);

      // Check each one for relevant text
      for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
        const text = await page.evaluate(el => el.textContent, clickableElements[i]);
        if (text && (text.toLowerCase().includes('run') || text.toLowerCase().includes('scan') || text.toLowerCase().includes('execute'))) {
          runScanButton = clickableElements[i];
          console.log(`✅ Found potential Run Scan button: "${text.trim()}"`);
          break;
        }
      }
    }

    if (runScanButton) {
      console.log('\n🎯 Clicking Run Scan button...');

      // Before clicking, take a screenshot
      await page.screenshot({
        path: 'puppeteer-screenshot-3-before-click.png',
        fullPage: true
      });

      await runScanButton.click();
      console.log('✅ Run Scan button clicked');

      // Wait for execution - this should show the full scanning process
      console.log('⏳ Waiting for scan execution (30 seconds max)...');

      let executionTime = 0;
      const maxWaitTime = 30000; // 30 seconds
      const startTime = Date.now();

      while (executionTime < maxWaitTime) {
        await page.waitForTimeout(2000);
        executionTime = Date.now() - startTime;

        // Check if button state changed
        const currentText = await page.evaluate(el => el.textContent || el.getAttribute('aria-label') || el.classList.toString(), runScanButton);
        console.log(`  ⏱️  ${executionTime/1000}s elapsed - Button state: "${currentText}"`);

        // Check if results appear
        const results = await page.$$('.results, .result, [data-results], table, .scan-results');
        if (results.length > 0) {
          console.log(`✅ Results detected after ${executionTime/1000}s`);
          break;
        }
      }

      // After execution, take final screenshot
      await page.screenshot({
        path: 'puppeteer-screenshot-4-after-execution.png',
        fullPage: true
      });
      console.log('📸 Saved after-execution screenshot');

    } else {
      console.log('\n❌ No Run Scan button found in the interface');
    }

    // Step 4: Check final state
    console.log('\n📊 Checking final state...');

    const finalContent = await page.content();
    const hasResults = finalContent.includes('results') || finalContent.includes('signals') || finalContent.includes('patterns');
    const hasLoading = finalContent.includes('loading') || finalContent.includes('scanning') || finalContent.includes('executing');
    const hasError = finalContent.includes('error') || finalContent.includes('failed') || finalContent.includes('Error');

    console.log(`Final state analysis:`);
    console.log(`  - Has results: ${hasResults}`);
    console.log(`  - Still loading: ${hasLoading}`);
    console.log(`  - Has errors: ${hasError}`);

    // Look for any text indicating scan completion or failure
    const completionIndicators = [
      'scan complete', 'completed', 'finished', 'done', 'results found',
      'scan failed', 'error occurred', 'timeout', 'no results'
    ];

    for (const indicator of completionIndicators) {
      if (finalContent.toLowerCase().includes(indicator)) {
        console.log(`  ✅ Found completion indicator: "${indicator}"`);
      }
    }

    console.log('\n✅ REAL FRONTEND VALIDATION COMPLETED!');
    console.log('📸 Screenshots saved in current directory for review');

  } catch (error) {
    console.error('\n❌ Puppeteer test failed:', error.message);
    console.error('Stack:', error.stack);

    // Take error screenshot
    try {
      await page.screenshot({
        path: 'puppeteer-screenshot-error.png',
        fullPage: true
      });
      console.log('📸 Saved error screenshot');
    } catch (screenshotError) {
      console.log('Could not save error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

// Check if file exists before starting
const filePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
if (!fs.existsSync(filePath)) {
  console.log('❌ ERROR: File not found:', filePath);
  console.log('Please ensure the backside para b copy.py file is in your Downloads folder');
  process.exit(1);
}

console.log('✅ Found backside B file:', filePath);
console.log(`📄 File size: ${fs.statSync(filePath).size} bytes`);

// Run the real frontend validation
console.log('\n🚀 Starting real frontend validation with Puppeteer...\n');
testRealFrontendWorkflow().catch(console.error);