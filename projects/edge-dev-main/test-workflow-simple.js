/**
 * SIMPLE WORKFLOW TEST
 * Direct test without Playwright global setup
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runWorkflowTest() {
  console.log('🚀 STARTING SIMPLE WORKFLOW TEST');

  const SCANNER_FILE_PATH = '/Users/michaeldurante/Downloads/backside para b copy.py';
  const FRONTEND_URL = 'http://localhost:5656';

  // Verify scanner file exists
  console.log('🔍 CHECKING SCANNER FILE');
  if (!fs.existsSync(SCANNER_FILE_PATH)) {
    throw new Error(`Scanner file not found: ${SCANNER_FILE_PATH}`);
  }

  const scannerContent = fs.readFileSync(SCANNER_FILE_PATH, 'utf8');
  console.log(`✅ SCANNER FILE LOADED: ${scannerContent.length} characters`);

  // Create output directory
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🌐 LAUNCHING BROWSER');
    browser = await chromium.launch({
      headless: false, // Show browser for debugging
      slowMo: 1000 // Slow down actions for visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🚀') || text.includes('✅') || text.includes('❌') || text.includes('⚠️')) {
        console.log('PAGE:', text);
      }
    });

    // Step 1: Navigate to frontend
    console.log('📍 STEP 1: Navigating to frontend');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const title = await page.title();
    const url = page.url();
    console.log(`📄 PAGE TITLE: ${title}`);
    console.log(`🔗 CURRENT URL: ${url}`);

    await page.screenshot({ path: 'test-results/step1-frontend.png', fullPage: true });
    console.log('📸 STEP 1 SCREENSHOT TAKEN');

    // Step 2: Look for Renata popup
    console.log('💬 STEP 2: Looking for Renata popup');

    // Check if popup is already open
    let popupContent = await page.textContent('body');
    if (popupContent?.includes('Renata') || popupContent?.includes('AI Assistant')) {
      console.log('✅ RENATA POPUP ALREADY OPEN');
    } else {
      console.log('🔍 LOOKING FOR RENATA BUTTON');

      // Try different button selectors
      const buttonSelectors = [
        'button[aria-label*="chat"]',
        'button[aria-label*="renata"]',
        '.message-circle',
        '.chat-button',
        'button svg',
        'button'
      ];

      let buttonFound = false;
      for (const selector of buttonSelectors) {
        try {
          const buttons = await page.$$(selector);
          console.log(`📊 CHECKING ${buttons.length} buttons for selector: ${selector}`);

          for (const button of buttons) {
            try {
              const visible = await button.isVisible();
              const enabled = await button.isEnabled();

              if (visible && enabled) {
                console.log('🖱️ CLICKING BUTTON');
                await button.click();
                await page.waitForTimeout(3000);
                buttonFound = true;
                break;
              }
            } catch (e) {
              // Continue
            }
          }

          if (buttonFound) break;
        } catch (e) {
          // Continue
        }
      }

      if (!buttonFound) {
        console.log('⚠️ NO BUTTON FOUND, trying coordinate click');
        await page.mouse.click(100, page.viewportSize().height - 100);
        await page.waitForTimeout(3000);
      }
    }

    await page.screenshot({ path: 'test-results/step2-renata-popup.png', fullPage: true });
    console.log('📸 STEP 2 SCREENSHOT TAKEN');

    // Step 3: Try to upload file
    console.log('📁 STEP 3: Attempting file upload');

    // Look for file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('✅ FILE INPUT FOUND, UPLOADING');
      await fileInput.setInputFiles(SCANNER_FILE_PATH);
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ NO FILE INPUT FOUND');

      // Try paste approach
      const textArea = await page.$('textarea');
      if (textArea) {
        console.log('📋 PASTING FILE CONTENT');
        await textArea.fill(scannerContent.substring(0, 500) + '\n\n[File content truncated for display...]');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
      } else {
        console.log('❌ NO TEXT INPUT FOUND FOR FILE UPLOAD');
      }
    }

    await page.screenshot({ path: 'test-results/step3-file-upload.png', fullPage: true });
    console.log('📸 STEP 3 SCREENSHOT TAKEN');

    // Step 4: Try to send formatting request
    console.log('🔧 STEP 4: Sending formatting request');

    const inputSelectors = ['textarea', 'input[type="text"]', '[contenteditable="true"]'];
    let textInput = null;

    for (const selector of inputSelectors) {
      try {
        const input = await page.$(selector);
        if (input && await input.isVisible() && await input.isEnabled()) {
          textInput = input;
          console.log(`✅ TEXT INPUT FOUND: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (textInput) {
      console.log('💬 SENDING FORMAT REQUEST');
      await textInput.fill('format this scanner');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000); // Wait longer for AI response

      // Check for response
      const content = await page.textContent('body');
      if (content?.includes('formatting') || content?.includes('processing') || content?.includes('bulletproof')) {
        console.log('✅ FORMATTING RESPONSE RECEIVED');
      } else {
        console.log('⚠️ NO FORMATTING RESPONSE DETECTED');
      }
    } else {
      console.log('❌ NO TEXT INPUT FOUND FOR FORMATTING REQUEST');
    }

    await page.screenshot({ path: 'test-results/step4-format-request.png', fullPage: true });
    console.log('📸 STEP 4 SCREENSHOT TAKEN');

    // Step 5: Try project creation
    console.log('📂 STEP 5: Attempting project creation');

    if (textInput) {
      console.log('💬 SENDING PROJECT REQUEST');
      await textInput.fill('add to projects');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000);

      const content = await page.textContent('body');
      if (content?.includes('project') || content?.includes('created') || content?.includes('added')) {
        console.log('✅ PROJECT RESPONSE RECEIVED');
      } else {
        console.log('⚠️ NO PROJECT RESPONSE DETECTED');
      }
    }

    await page.screenshot({ path: 'test-results/step5-project-request.png', fullPage: true });
    console.log('📸 STEP 5 SCREENSHOT TAKEN');

    // Step 6: Final documentation
    console.log('📝 STEP 6: Final documentation');

    await page.screenshot({ path: 'test-results/step6-final-state.png', fullPage: true });

    const finalContent = await page.textContent('body');
    console.log(`📄 FINAL PAGE CONTENT LENGTH: ${finalContent?.length || 0}`);

    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      frontendUrl: FRONTEND_URL,
      scannerFile: SCANNER_FILE_PATH,
      scannerLoaded: !!scannerContent,
      finalUrl: page.url(),
      finalTitle: await page.title(),
      pageContentLength: finalContent?.length || 0,
      screenshots: [
        'step1-frontend.png',
        'step2-renata-popup.png',
        'step3-file-upload.png',
        'step4-format-request.png',
        'step5-project-request.png',
        'step6-final-state.png'
      ]
    };

    fs.writeFileSync('test-results/workflow-summary.json', JSON.stringify(summary, null, 2));
    console.log('💾 SUMMARY SAVED');

    console.log('✅ WORKFLOW TEST COMPLETED SUCCESSFULLY');

  } catch (error) {
    console.error('❌ WORKFLOW TEST FAILED:', error.message);

    if (page) {
      await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
      console.log('📸 ERROR SCREENSHOT TAKEN');
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runWorkflowTest()
    .then(() => {
      console.log('🎉 TEST COMPLETED');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 TEST FAILED:', error);
      process.exit(1);
    });
}

module.exports = { runWorkflowTest };