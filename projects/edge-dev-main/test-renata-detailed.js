/**
 * DETAILED RENATA POPUP TEST
 * Specific test for Renata chat functionality
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testRenataDetailed() {
  console.log('🤖 STARTING DETAILED RENATA TEST');

  const SCANNER_FILE_PATH = '/Users/michaeldurante/Downloads/backside para b copy.py';
  const FRONTEND_URL = 'http://localhost:5656';

  // Verify scanner file exists
  if (!fs.existsSync(SCANNER_FILE_PATH)) {
    throw new Error(`Scanner file not found: ${SCANNER_FILE_PATH}`);
  }

  const scannerContent = fs.readFileSync(SCANNER_FILE_PATH, 'utf8');
  console.log(`📄 SCANNER FILE: ${scannerContent.length} characters, ${path.basename(SCANNER_FILE_PATH)}`);

  // Create output directory
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }

  let browser;
  let page;

  try {
    // Launch browser with more debugging
    console.log('🌐 LAUNCHING BROWSER');
    browser = await chromium.launch({
      headless: false,
      slowMo: 500,
      devtools: true // Open devtools for debugging
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();

    // Enhanced console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' || type === 'warning') {
        console.log(`🚨 PAGE ${type.toUpperCase()}:`, text);
      } else if (text.includes('🚀') || text.includes('✅') || text.includes('❌') || text.includes('⚠️')) {
        console.log('💬 PAGE:', text);
      }
    });

    // Monitor network requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('renata') || url.includes('chat')) {
        console.log('📤 REQUEST:', request.method(), url);
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('renata') || url.includes('chat')) {
        console.log('📥 RESPONSE:', response.status(), url);
      }
    });

    // Step 1: Navigate to frontend and wait for full load
    console.log('📍 STEP 1: Navigate and load frontend');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(5000); // Wait for React to fully render

    // Check if Renata popup is visible
    console.log('🔍 STEP 2: Checking for Renata popup visibility');

    // Look for the Renata popup using specific selectors from the code
    const popupSelectors = [
      '.fixed[style*="bottom"]', // From the popup CSS positioning
      '[style*="left: 1rem"]',   // Specific left positioning
      '[style*="width: 400px"]', // Specific width
      '.rounded-2xl',           // Border radius from code
      'div:has-text("Renata")', // Text containing Renata
      'div:has-text("Trading Assistant")',
      '[class*="renata"]',
      '[data-testid*="renata"]',
      '.shadow-2xl'             // Shadow from the popup
    ];

    let renataPopup = null;
    let foundSelector = null;

    for (const selector of popupSelectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`🔍 CHECKING ${elements.length} elements for: ${selector}`);

        for (const element of elements) {
          try {
            const visible = await element.isVisible();
            if (visible) {
              const text = await element.textContent();
              const style = await element.getAttribute('style');
              const className = await element.getAttribute('class');

              console.log(`🎯 ELEMENT FOUND:`, {
                selector,
                text: text?.substring(0, 100),
                style: style?.substring(0, 100),
                className
              });

              // Check if this looks like Renata popup
              if (
                text?.includes('Renata') ||
                text?.includes('Trading Assistant') ||
                text?.includes('GLM 4.5') ||
                className?.includes('shadow-2xl') ||
                style?.includes('position: fixed')
              ) {
                renataPopup = element;
                foundSelector = selector;
                console.log(`✅ RENATA POPUP IDENTIFIED: ${selector}`);
                break;
              }
            }
          } catch (e) {
            // Continue checking
          }
        }

        if (renataPopup) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!renataPopup) {
      console.log('⚠️ NO RENATA POPUP FOUND, CHECKING IF HIDDEN');

      // Check if popup is on page but not visible
      const bodyContent = await page.content();
      if (bodyContent.includes('Renata') || bodyContent.includes('Trading Assistant')) {
        console.log('🔍 RENATA CONTENT FOUND IN HTML BUT NOT VISIBLE');

        // Try to make it visible by clicking potential trigger
        console.log('🖱️ TRYING TO TRIGGER POPUP');

        // Look for any clickable elements that might trigger the popup
        const clickableSelectors = [
          'button',
          '.message-circle',
          '.chat-icon',
          '[aria-label*="chat"]',
          '[onclick*="renata"]',
          '[onclick*="toggle"]'
        ];

        for (const selector of clickableSelectors) {
          try {
            const elements = await page.$$(selector);
            for (const element of elements) {
              try {
                const visible = await element.isVisible();
                const enabled = await element.isEnabled();
                if (visible && enabled) {
                  const text = await element.textContent();
                  console.log(`🖱️ CLICKING: ${selector} - ${text?.substring(0, 50)}`);
                  await element.click();
                  await page.waitForTimeout(2000);
                  break;
                }
              } catch (e) {
                // Continue
              }
            }
          } catch (e) {
            // Continue
          }
        }
      } else {
        console.log('❌ NO RENATA CONTENT FOUND ON PAGE');
      }
    }

    await page.screenshot({ path: 'test-results/renata-detailed-1-initial.png', fullPage: true });

    // Step 3: Try to interact with the popup or input area
    console.log('💬 STEP 3: Looking for input areas');

    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      'input[placeholder*="message"]',
      'input[placeholder*="chat"]',
      'input[placeholder*="Ask"]',
      '.chat-input',
      '.message-input',
      '[data-testid="chat-input"]'
    ];

    let chatInput = null;

    for (const selector of inputSelectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`🔍 CHECKING ${elements.length} inputs for: ${selector}`);

        for (const element of elements) {
          try {
            const visible = await element.isVisible();
            const enabled = await element.isEnabled();
            const placeholder = await element.getAttribute('placeholder');

            if (visible && enabled) {
              console.log(`✅ INPUT FOUND:`, {
                selector,
                placeholder,
                visible,
                enabled
              });

              chatInput = element;
              break;
            }
          } catch (e) {
            // Continue
          }
        }

        if (chatInput) break;
      } catch (e) {
        // Continue
      }
    }

    if (chatInput) {
      console.log('💬 STEP 4: Testing chat interaction');

      // Test basic input
      await chatInput.fill('Hello Renata');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);

      await page.screenshot({ path: 'test-results/renata-detailed-2-basic-chat.png', fullPage: true });

      // Test file upload by pasting file content
      console.log('📁 STEP 5: Testing file content upload');
      await chatInput.fill(`Here's my scanner file: ${path.basename(SCANNER_FILE_PATH)}\n\n${scannerContent.substring(0, 1000)}\n\n[File continues...]`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000); // Wait longer for file processing

      await page.screenshot({ path: 'test-results/renata-detailed-3-file-upload.png', fullPage: true });

      // Test formatting request
      console.log('🔧 STEP 6: Testing formatting request');
      await chatInput.fill('Please format this scanner for the trading system');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(15000); // Wait for AI processing

      await page.screenshot({ path: 'test-results/renata-detailed-4-format-request.png', fullPage: true });

      // Test project creation
      console.log('📂 STEP 7: Testing project creation');
      await chatInput.fill('Add this formatted scanner to my projects');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000);

      await page.screenshot({ path: 'test-results/renata-detailed-5-project-creation.png', fullPage: true });

    } else {
      console.log('❌ NO CHAT INPUT FOUND');
    }

    // Final documentation
    console.log('📝 STEP 8: Final analysis');
    await page.screenshot({ path: 'test-results/renata-detailed-6-final.png', fullPage: true });

    // Analyze page content
    const pageContent = await page.content();
    const contentAnalysis = {
      hasRenata: pageContent.includes('Renata'),
      hasTradingAssistant: pageContent.includes('Trading Assistant'),
      hasGLM45: pageContent.includes('GLM 4.5'),
      hasChatInput: !!chatInput,
      hasFileUpload: pageContent.includes('file') || pageContent.includes('upload'),
      contentLength: pageContent.length
    };

    console.log('📊 CONTENT ANALYSIS:', contentAnalysis);

    // Check for any error messages in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Create detailed report
    const detailedReport = {
      timestamp: new Date().toISOString(),
      testResults: {
        popupFound: !!renataPopup,
        popupSelector: foundSelector,
        chatInputFound: !!chatInput,
        interactionsAttempted: !!chatInput
      },
      contentAnalysis,
      errors: errors.slice(-10), // Last 10 errors
      screenshots: [
        'renata-detailed-1-initial.png',
        'renata-detailed-2-basic-chat.png',
        'renata-detailed-3-file-upload.png',
        'renata-detailed-4-format-request.png',
        'renata-detailed-5-project-creation.png',
        'renata-detailed-6-final.png'
      ]
    };

    fs.writeFileSync('test-results/renata-detailed-report.json', JSON.stringify(detailedReport, null, 2));
    console.log('💾 DETAILED REPORT SAVED');

    console.log('✅ RENATA DETAILED TEST COMPLETED');

    return detailedReport;

  } catch (error) {
    console.error('❌ RENATA DETAILED TEST FAILED:', error.message);

    if (page) {
      await page.screenshot({ path: 'test-results/renata-error.png', fullPage: true });
      console.log('📸 ERROR SCREENSHOT SAVED');
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
  testRenataDetailed()
    .then((report) => {
      console.log('🎉 TEST COMPLETED SUCCESSFULLY');
      console.log('📊 FINAL REPORT:', JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 TEST FAILED:', error);
      process.exit(1);
    });
}

module.exports = { testRenataDetailed };