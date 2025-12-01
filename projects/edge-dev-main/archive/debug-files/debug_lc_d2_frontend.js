const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugLCD2Frontend() {
  console.log('🔍 DEBUGGING LC D2 FRONTEND ANALYSIS FAILURE');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`🌐 BROWSER: ${msg.text()}`);
  });

  // Enable network monitoring
  page.on('response', response => {
    if (response.url().includes('format') || response.url().includes('scan')) {
      console.log(`📡 NETWORK: ${response.status()} ${response.url()}`);
      console.log(`   ⏱️  Response time: ${response.headers()['x-response-time'] || 'unknown'}`);
    }
  });

  // Monitor JavaScript errors
  page.on('pageerror', error => {
    console.log(`❌ JS ERROR: ${error.message}`);
  });

  try {
    console.log('📍 Navigating to localhost:5657...');
    await page.goto('http://localhost:5657', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully');

    // Wait for page to be ready
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('🔍 Looking for upload button...');

    // Try to find upload button with different selectors
    const uploadSelectors = [
      'text=Upload Strategy',
      'text=Enhanced Strategy Upload',
      '[data-testid="upload-button"]',
      'button:has-text("Upload")',
      'button[type="button"]:has-text("Upload")'
    ];

    let uploadButton = null;
    for (const selector of uploadSelectors) {
      try {
        uploadButton = await page.locator(selector).first();
        if (await uploadButton.isVisible()) {
          console.log(`✅ Found upload button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`⚠️  Selector failed: ${selector}`);
      }
    }

    if (!uploadButton || !(await uploadButton.isVisible())) {
      console.log('❌ Upload button not found, looking for alternative...');
      await page.screenshot({ path: 'debug_no_upload_button.png' });

      // Try clicking any button to see what happens
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Found ${allButtons.length} buttons on page`);

      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        const text = await allButtons[i].textContent();
        console.log(`   Button ${i}: "${text}"`);
      }

      return;
    }

    console.log('📤 Clicking upload button...');
    await uploadButton.click();
    await page.waitForTimeout(1000);

    console.log('📄 Preparing to upload LC D2 file...');

    // Check if file exists
    const lcD2Path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py';
    if (!fs.existsSync(lcD2Path)) {
      console.log('❌ LC D2 file not found at expected path');
      return;
    }

    const fileContent = fs.readFileSync(lcD2Path, 'utf8');
    console.log(`📊 File size: ${fileContent.length} characters`);

    // Look for file input or drag area
    console.log('🔍 Looking for file upload area...');

    try {
      // Try file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        console.log('✅ Found file input, uploading file...');
        await fileInput.setInputFiles(lcD2Path);
      } else {
        // Try textarea for paste
        const textarea = page.locator('textarea');
        if (await textarea.isVisible()) {
          console.log('✅ Found textarea, pasting code...');
          await textarea.fill(fileContent);
        } else {
          console.log('❌ No file input or textarea found');
          await page.screenshot({ path: 'debug_no_input.png' });
          return;
        }
      }
    } catch (error) {
      console.log(`❌ Upload failed: ${error.message}`);
      return;
    }

    console.log('⏳ Waiting for analysis to start...');
    await page.waitForTimeout(2000);

    // Monitor for analysis progress
    let analysisStarted = false;
    let analysisProgress = 0;
    let lastProgressMessage = '';

    // Check for analysis progress indicators
    const progressSelectors = [
      '[data-testid="analysis-progress"]',
      'text=/Analyzing|Analysis|Progress/',
      '.progress-bar',
      'text=/\\d+%/'
    ];

    console.log('📊 Monitoring analysis progress...');

    // Wait up to 60 seconds for analysis
    for (let i = 0; i < 120; i++) { // 2 minutes total
      try {
        // Check for progress indicators
        for (const selector of progressSelectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              const text = await element.textContent();
              if (text !== lastProgressMessage) {
                console.log(`📊 ANALYSIS PROGRESS: ${text}`);
                lastProgressMessage = text;
                analysisStarted = true;
              }
            }
          } catch (e) {
            // Selector not found, continue
          }
        }

        // Check for error messages
        const errorSelectors = [
          'text=/Error|Failed|Timeout/',
          '.error',
          '[role="alert"]'
        ];

        for (const selector of errorSelectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              const text = await element.textContent();
              console.log(`❌ ERROR DETECTED: ${text}`);
              await page.screenshot({ path: 'debug_analysis_error.png' });
              return;
            }
          } catch (e) {
            // Selector not found, continue
          }
        }

        // Check if analysis completed
        const successSelectors = [
          'text=/Complete|Finished|Success/',
          'button:has-text("Run")',
          'button:has-text("Execute")'
        ];

        for (const selector of successSelectors) {
          try {
            const element = page.locator(selector);
            if (await element.isVisible()) {
              console.log(`✅ ANALYSIS COMPLETED - found: ${selector}`);
              await page.screenshot({ path: 'debug_analysis_complete.png' });

              // Try to click run button
              if (selector.includes('Run') || selector.includes('Execute')) {
                console.log('🚀 Attempting to click run button...');
                await element.click();
                await page.waitForTimeout(3000);
                console.log('✅ Run button clicked');
              }

              return;
            }
          } catch (e) {
            // Selector not found, continue
          }
        }

        await page.waitForTimeout(500);

        if (i % 10 === 0) {
          console.log(`⏳ Analysis monitoring... ${i/2}s elapsed`);
        }

      } catch (error) {
        console.log(`⚠️  Monitoring error: ${error.message}`);
      }
    }

    if (!analysisStarted) {
      console.log('❌ Analysis never started!');
      await page.screenshot({ path: 'debug_analysis_never_started.png' });
    } else {
      console.log('⚠️  Analysis started but seems to have stalled');
      await page.screenshot({ path: 'debug_analysis_stalled.png' });
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'debug_test_failed.png' });
  } finally {
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ path: 'debug_final_state.png' });

    console.log('🔍 Getting page content for debugging...');
    const content = await page.content();
    fs.writeFileSync('debug_page_content.html', content);

    // Don't close browser for manual inspection
    console.log('🔍 Browser left open for manual inspection');
    console.log('   Press Ctrl+C to close when done');

    // Wait indefinitely
    await page.waitForTimeout(300000); // 5 minutes
    await browser.close();
  }
}

debugLCD2Frontend().catch(console.error);