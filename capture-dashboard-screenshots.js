#!/usr/bin/env node

/**
 * REAL DASHBOARD SCREENSHOT TEST
 * Takes screenshots of the entire Edge Dev dashboard workflow
 * Uploads backside B file, clicks Run Scan, and captures results
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureDashboardWorkflow() {
  console.log('🎸 REAL DASHBOARD SCREENSHOT TEST');
  console.log('Capturing visual proof of the complete workflow with results');
  console.log('File: /Users/michaeldurante/Downloads/backside para b copy.py\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 2000,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to Edge Dev dashboard
    console.log('🔍 Navigating to Edge Dev dashboard...');
    await page.goto('http://localhost:5656', { waitUntil: 'networkidle2' });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Take initial landing screenshot
    await page.screenshot({
      path: 'dashboard-screenshot-1-landing.png',
      fullPage: true
    });
    console.log('📸 Screenshot 1: Dashboard landing page saved');

    // Step 2: Look for project creation or upload functionality
    console.log('\n📁 Looking for project creation functionality...');

    // Try to find any existing projects first
    const existingProjects = await page.$$('.project-card, [data-project-id], .project-item');
    console.log(`Found ${existingProjects.length} existing projects`);

    if (existingProjects.length > 0) {
      console.log('✅ Found existing projects, checking if any have backside B...');

      // Check each project for backside B content
      let backsideProject = null;
      for (let i = 0; i < existingProjects.length; i++) {
        const projectText = await page.evaluate(el => el.textContent, existingProjects[i]);
        if (projectText.toLowerCase().includes('backside') || projectText.toLowerCase().includes('para b')) {
          backsideProject = existingProjects[i];
          console.log('✅ Found existing backside B project!');
          break;
        }
      }

      if (backsideProject) {
        // Click on the existing backside B project
        await backsideProject.click();
        await page.waitForTimeout(2000);

        // Take screenshot of selected project
        await page.screenshot({
          path: 'dashboard-screenshot-2-existing-project.png',
          fullPage: true
        });
        console.log('📸 Screenshot 2: Selected existing backside B project');
      }
    } else {
      console.log('⚠️ No existing projects found, need to create one...');

      // Look for create project button
      const createButtons = await page.$$('button');
      let createButton = null;

      for (const button of createButtons) {
        const buttonText = await page.evaluate(el => el.textContent, button);
        if (buttonText && (
          buttonText.toLowerCase().includes('create') ||
          buttonText.toLowerCase().includes('new') ||
          buttonText.toLowerCase().includes('add') ||
          buttonText.toLowerCase().includes('upload')
        )) {
          createButton = button;
          console.log(`✅ Found create button: "${buttonText.trim()}"`);
          break;
        }
      }

      if (createButton) {
        await createButton.click();
        await page.waitForTimeout(2000);

        // Look for file upload input
        const fileInputs = await page.$$('input[type="file"]');
        if (fileInputs.length > 0) {
          const filePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
          if (fs.existsSync(filePath)) {
            await fileInputs[0].uploadFile(filePath);
            console.log('✅ Uploaded backside B file');

            // Take screenshot after upload
            await page.screenshot({
              path: 'dashboard-screenshot-2-file-uploaded.png',
              fullPage: true
            });
            console.log('📸 Screenshot 2: File uploaded');
          }
        }
      }
    }

    // Step 3: Find and click Run Scan button
    console.log('\n🚀 Looking for Run Scan button...');

    // Look for Run Scan button specifically
    const allButtons = await page.$$('button');
    let runScanButton = null;

    for (const button of allButtons) {
      const buttonText = await page.evaluate(el => el.textContent, button);
      if (buttonText && (
        buttonText.toLowerCase().includes('run scan') ||
        buttonText.toLowerCase().includes('execute') ||
        buttonText.toLowerCase().includes('start scan') ||
        (buttonText.toLowerCase().includes('run') && buttonText.toLowerCase().includes('scan'))
      )) {
        runScanButton = button;
        console.log(`✅ Found Run Scan button: "${buttonText.trim()}"`);
        break;
      }
    }

    if (!runScanButton) {
      // Try to find any button with scan-related text
      for (const button of allButtons) {
        const buttonText = await page.evaluate(el => el.textContent, button);
        if (buttonText && buttonText.toLowerCase().includes('scan')) {
          runScanButton = button;
          console.log(`✅ Found scan button: "${buttonText.trim()}"`);
          break;
        }
      }
    }

    if (runScanButton) {
      // Take screenshot before clicking
      await page.screenshot({
        path: 'dashboard-screenshot-3-before-scan.png',
        fullPage: true
      });
      console.log('📸 Screenshot 3: Before clicking Run Scan');

      console.log('\n🎯 Clicking Run Scan button...');
      await runScanButton.click();

      // Wait for execution - this is where we should see real processing
      console.log('⏳ Waiting for scan execution (this should take time now)...');

      // Monitor for 60 seconds max to capture full execution
      let executionTime = 0;
      const maxWaitTime = 60000; // 60 seconds
      const startTime = Date.now();

      while (executionTime < maxWaitTime) {
        await page.waitForTimeout(5000); // Check every 5 seconds
        executionTime = Date.now() - startTime;

        console.log(`  ⏱️  ${executionTime/1000}s elapsed - monitoring execution...`);

        // Take intermediate screenshot
        await page.screenshot({
          path: `dashboard-screenshot-executing-${Math.floor(executionTime/1000)}s.png`,
          fullPage: true
        });

        // Check if results appear
        const results = await page.$$('.results, .result, [data-results], table, .scan-results, .signals, .patterns');
        if (results.length > 0) {
          console.log(`✅ Results detected after ${executionTime/1000}s!`);

          // Take final results screenshot
          await page.screenshot({
            path: 'dashboard-screenshot-4-results-found.png',
            fullPage: true
          });
          console.log('📸 Screenshot 4: RESULTS FOUND!');
          break;
        }

        // Check for completion messages
        const pageContent = await page.content();
        if (pageContent.toLowerCase().includes('completed') ||
            pageContent.toLowerCase().includes('finished') ||
            pageContent.toLowerCase().includes('scan complete')) {
          console.log(`✅ Scan completed after ${executionTime/1000}s`);

          // Take completion screenshot
          await page.screenshot({
            path: 'dashboard-screenshot-4-completed.png',
            fullPage: true
          });
          console.log('📸 Screenshot 4: Scan completed');
          break;
        }
      }

      if (executionTime >= maxWaitTime) {
        console.log('⚠️ Maximum wait time reached, taking final screenshot...');
        await page.screenshot({
          path: 'dashboard-screenshot-4-max-time.png',
          fullPage: true
        });
      }

    } else {
      console.log('❌ No Run Scan button found');

      // Take screenshot for debugging
      await page.screenshot({
        path: 'dashboard-screenshot-no-run-button.png',
        fullPage: true
      });
      console.log('📸 Debug screenshot saved');
    }

    // Step 4: Final analysis
    console.log('\n📊 Analyzing final state...');

    const finalContent = await page.content();
    const hasResults = finalContent.includes('results') || finalContent.includes('signals') || finalContent.includes('patterns');
    const hasLoading = finalContent.includes('loading') || finalContent.includes('scanning') || finalContent.includes('executing');
    const hasError = finalContent.includes('error') || finalContent.includes('failed');
    const hasCompleted = finalContent.includes('completed') || finalContent.includes('finished');

    console.log(`Final state analysis:`);
    console.log(`  - Has results: ${hasResults}`);
    console.log(`  - Still loading: ${hasLoading}`);
    console.log(`  - Has errors: ${hasError}`);
    console.log(`  - Has completed: ${hasCompleted}`);

    // Take final screenshot
    await page.screenshot({
      path: 'dashboard-screenshot-5-final-state.png',
      fullPage: true
    });
    console.log('📸 Screenshot 5: Final dashboard state');

    console.log('\n✅ DASHBOARD SCREENSHOT WORKFLOW COMPLETED!');
    console.log('📸 Screenshots saved for visual validation:');
    console.log('  1. dashboard-screenshot-1-landing.png - Initial dashboard');
    console.log('  2. dashboard-screenshot-2-*-upload.png - File upload');
    console.log('  3. dashboard-screenshot-3-before-scan.png - Before execution');
    console.log('  4. dashboard-screenshot-4-*-results.png - Results/completion');
    console.log('  5. dashboard-screenshot-5-final-state.png - Final state');
    console.log('  - dashboard-screenshot-executing-*.png - Execution progress');

    if (hasResults) {
      console.log('\n🎉 SUCCESS! Visual proof of results captured!');
      console.log('💡 The screenshots show the dashboard with actual scan results');
    } else {
      console.log('\n❌ No visual results found - execution may still be failing');
      console.log('💡 Check the execution progress screenshots for debugging');
    }

  } catch (error) {
    console.error('\n❌ Screenshot test failed:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({
        path: 'dashboard-screenshot-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved');
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

// Run the dashboard screenshot workflow
console.log('\n🚀 Starting dashboard screenshot workflow...\n');
captureDashboardWorkflow().catch(console.error);