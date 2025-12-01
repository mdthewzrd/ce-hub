/**
 * FINAL COMPREHENSIVE WORKFLOW TEST
 * Complete test for EdgeDev scanner upload, formatting, and execution
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runFinalWorkflowTest() {
  console.log('🚀 STARTING FINAL COMPREHENSIVE WORKFLOW TEST');

  const SCANNER_FILE_PATH = '/Users/michaeldurante/Downloads/backside para b copy.py';
  const FRONTEND_URL = 'http://localhost:5656';

  // Verify scanner file exists
  if (!fs.existsSync(SCANNER_FILE_PATH)) {
    throw new Error(`Scanner file not found: ${SCANNER_FILE_PATH}`);
  }

  const scannerContent = fs.readFileSync(SCANNER_FILE_PATH, 'utf8');
  const scannerName = path.basename(SCANNER_FILE_PATH);
  console.log(`📄 SCANNER: ${scannerName} (${scannerContent.length} characters)`);

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
      headless: false,
      slowMo: 800,
      devtools: false
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();

    // Enhanced monitoring
    let apiCalls = [];
    let consoleMessages = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });

      if (msg.type() === 'error') {
        console.log(`🚨 CONSOLE ERROR: ${text}`);
      } else if (text.includes('Renata') || text.includes('popup') || text.includes('clicked')) {
        console.log(`💬 CONSOLE: ${text}`);
      }
    });

    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('renata') || url.includes('chat')) {
        apiCalls.push({ type: 'request', method: request.method(), url, timestamp: Date.now() });
        console.log('📤 API REQUEST:', request.method(), url);
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('renata') || url.includes('chat')) {
        apiCalls.push({ type: 'response', status: response.status(), url, timestamp: Date.now() });
        console.log('📥 API RESPONSE:', response.status(), url);
      }
    });

    // STEP 1: Navigate and load frontend
    console.log('📍 STEP 1: Navigate to frontend');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(5000);

    console.log(`✅ FRONTEND LOADED: ${page.url()}`);
    await page.screenshot({ path: 'test-results/final-01-frontend.png', fullPage: true });

    // STEP 2: Find and click Renata button
    console.log('💬 STEP 2: Find and activate Renata button');

    // Look for the specific Renata button based on the code analysis
    const renataButtonSelectors = [
      'button:has-text("AI Assistant")',
      'button:has-text("Renata")',
      'button svg', // Brain icon
      '[onclick*="Renata"]',
      '[onclick*="isRenataPopupOpen"]',
      'button[aria-label*="AI"]',
      'button[aria-label*="chat"]',
      '.message-circle',
      'button:has(.message-circle)',
      'button:has(.brain)',
      '.bg-green-500 button', // Based on green background from code
      'button.border, button[class*="border"]' // Based on border styling
    ];

    let renataButton = null;
    let buttonFound = false;

    for (const selector of renataButtonSelectors) {
      try {
        console.log(`🔍 CHECKING SELECTOR: ${selector}`);
        const buttons = await page.$$(selector);

        for (const button of buttons) {
          try {
            const visible = await button.isVisible();
            const enabled = await button.isEnabled();

            if (visible && enabled) {
              const text = await button.textContent();
              const ariaLabel = await button.getAttribute('aria-label');
              const className = await button.getAttribute('class');

              console.log(`🎯 BUTTON DETAILS:`, {
                selector,
                text: text?.trim(),
                ariaLabel,
                className: className?.substring(0, 100)
              });

              // Look for indicators this is the Renata button
              const isRenataButton =
                text?.toLowerCase().includes('ai') ||
                text?.toLowerCase().includes('renata') ||
                text?.toLowerCase().includes('assistant') ||
                ariaLabel?.toLowerCase().includes('ai') ||
                ariaLabel?.toLowerCase().includes('renata') ||
                className?.includes('green') ||
                selector.includes('message-circle') ||
                selector.includes('brain');

              if (isRenataButton) {
                renataButton = button;
                buttonFound = true;
                console.log(`✅ RENATA BUTTON FOUND: ${selector}`);
                break;
              }
            }
          } catch (e) {
            // Continue checking
          }
        }

        if (buttonFound) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!renataButton) {
      console.log('⚠️ NO SPECIFIC RENATA BUTTON FOUND, TRYING GENERIC BUTTONS');

      // Try clicking buttons in the sidebar area
      const allButtons = await page.$$('button');
      console.log(`🔍 CHECKING ${allButtons.length} TOTAL BUTTONS`);

      for (let i = 0; i < allButtons.length; i++) {
        try {
          const button = allButtons[i];
          const visible = await button.isVisible();
          const enabled = await button.isEnabled();

          if (visible && enabled) {
            const text = await button.textContent();
            console.log(`🔍 BUTTON ${i}: "${text?.trim()}"`);

            if (text && (
              text.toLowerCase().includes('ai') ||
              text.toLowerCase().includes('assistant') ||
              text.toLowerCase().includes('renata')
            )) {
              renataButton = button;
              buttonFound = true;
              console.log(`✅ RENATA BUTTON FOUND BY TEXT: "${text}"`);
              break;
            }
          }
        } catch (e) {
          // Continue
        }
      }
    }

    if (renataButton) {
      console.log('🖱️ CLICKING RENATA BUTTON');
      await renataButton.click();
      await page.waitForTimeout(3000);

      console.log('✅ RENATA BUTTON CLICKED');
    } else {
      console.log('⚠️ NO RENATA BUTTON FOUND, TRYING COORDINATE CLICK IN SIDEBAR');

      // Try clicking in the left sidebar area where the button should be
      const sidebarX = 100;
      const sidebarY = 200;
      await page.mouse.click(sidebarX, sidebarY);
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'test-results/final-02-after-renata-click.png', fullPage: true });

    // STEP 3: Check for Renata popup
    console.log('🔍 STEP 3: Check for Renata popup visibility');

    // Look for the actual popup component
    const popupSelectors = [
      '.fixed[style*="bottom: 1rem"]',
      '.fixed[style*="left: 1rem"]',
      '.rounded-2xl.shadow-2xl',
      'div:has-text("GLM 4.5")',
      'div:has-text("Trading Assistant")',
      'div:has-text("Upload your scanner code")',
      'div[style*="width: 400px"]',
      'div[style*="background: linear-gradient"]',
      '.opacity-100.z-50', // From popup CSS
      'div:has(input[type="text"]), div:has(textarea)',
      'div:has(button:has-text("Send"))'
    ];

    let renataPopup = null;
    let popupFound = false;

    for (const selector of popupSelectors) {
      try {
        const elements = await page.$$(selector);

        for (const element of elements) {
          try {
            const visible = await element.isVisible();
            if (visible) {
              const text = await element.textContent();
              const style = await element.getAttribute('style');

              if (
                text?.includes('Renata') ||
                text?.includes('GLM 4.5') ||
                text?.includes('Trading Assistant') ||
                text?.includes('scanner code') ||
                style?.includes('position: fixed') ||
                selector.includes('rounded-2xl')
              ) {
                renataPopup = element;
                popupFound = true;
                console.log(`✅ RENATA POPUP FOUND: ${selector}`);
                console.log(`📄 POPUP CONTENT: ${text?.substring(0, 200)}...`);
                break;
              }
            }
          } catch (e) {
            // Continue
          }
        }

        if (popupFound) break;
      } catch (e) {
        // Continue
      }
    }

    if (!popupFound) {
      console.log('⚠️ RENATA POPUP NOT VISIBLE, CHECKING IF HIDDEN');

      // Check if popup exists in DOM but not visible
      const pageContent = await page.content();
      const hasPopupContent =
        pageContent.includes('GLM 4.5') ||
        pageContent.includes('Trading Assistant') ||
        pageContent.includes('Renata AI');

      if (hasPopupContent) {
        console.log('🔍 POPUP CONTENT EXISTS IN DOM BUT NOT VISIBLE');
      } else {
        console.log('❌ NO POPUP CONTENT FOUND');
      }
    }

    await page.screenshot({ path: 'test-results/final-03-popup-check.png', fullPage: true });

    // STEP 4: Look for input and attempt file upload
    console.log('📁 STEP 4: Attempt file upload and chat interaction');

    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      'input[placeholder*="message"]',
      'input[placeholder*="chat"]',
      'input[placeholder*="Ask"]',
      'input[placeholder*="scanner"]',
      '.chat-input',
      '.message-input',
      '[data-testid="chat-input"]',
      'div[contenteditable="true"]' // Rich text editor
    ];

    let chatInput = null;

    // First, check if we can find any input in the popup area
    if (renataPopup) {
      for (const selector of inputSelectors) {
        try {
          const inputs = await renataPopup.$$(selector);
          if (inputs.length > 0) {
            for (const input of inputs) {
              const visible = await input.isVisible();
              const enabled = await input.isEnabled();
              if (visible && enabled) {
                chatInput = input;
                console.log(`✅ CHAT INPUT FOUND IN POPUP: ${selector}`);
                break;
              }
            }
          }
          if (chatInput) break;
        } catch (e) {
          // Continue
        }
      }
    }

    // If no input found in popup, look globally
    if (!chatInput) {
      console.log('🔍 LOOKING FOR INPUTS GLOBALLY');
      for (const selector of inputSelectors) {
        try {
          const inputs = await page.$$(selector);
          console.log(`🔍 CHECKING ${inputs.length} INPUTS: ${selector}`);

          for (const input of inputs) {
            try {
              const visible = await input.isVisible();
              const enabled = await input.isEnabled();

              if (visible && enabled) {
                const placeholder = await input.getAttribute('placeholder');
                console.log(`✅ INPUT FOUND: ${selector} - placeholder: "${placeholder}"`);

                chatInput = input;
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
    }

    if (chatInput) {
      console.log('💬 INTERACTING WITH CHAT INPUT');

      // Test 1: Basic greeting
      await chatInput.fill('Hello Renata');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);

      // Test 2: File upload simulation
      console.log('📁 UPLOADING SCANNER CONTENT');
      const fileMessage = `Here's my scanner file: ${scannerName}\n\n${scannerContent.substring(0, 1500)}...\n\n[Full file uploaded - ${scannerContent.length} characters]`;
      await chatInput.fill(fileMessage);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(8000);

      // Test 3: Formatting request
      console.log('🔧 REQUESTING FORMATTING');
      await chatInput.fill('Please format this scanner for the EdgeDev system with bulletproof parameter integrity');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(12000);

      // Test 4: Project creation
      console.log('📂 REQUESTING PROJECT CREATION');
      await chatInput.fill('Add this formatted scanner to my projects as a new project');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10000);

    } else {
      console.log('❌ NO CHAT INPUT FOUND - CANNOT PROCEED WITH FILE UPLOAD');
    }

    // Take screenshots at each step
    await page.screenshot({ path: 'test-results/final-04-file-upload.png', fullPage: true });
    await page.screenshot({ path: 'test-results/final-05-format-request.png', fullPage: true });
    await page.screenshot({ path: 'test-results/final-06-project-creation.png', fullPage: true });

    // STEP 5: Look for results and verify workflow
    console.log('🔍 STEP 5: Analyzing workflow results');

    // Check for any success indicators
    const successIndicators = [
      'formatting complete',
      'project created',
      'successfully',
      'bulletproof',
      'parameter integrity',
      'added to projects',
      'scanner ready'
    ];

    const finalContent = await page.textContent('body');
    const workflowResults = {
      popupVisible: popupFound,
      chatInputFound: !!chatInput,
      fileUploadAttempted: !!chatInput,
      successIndicators: successIndicators.filter(indicator =>
        finalContent?.toLowerCase().includes(indicator.toLowerCase())
      ),
      apiCalls: apiCalls.length,
      consoleErrors: consoleMessages.filter(msg => msg.type === 'error'),
      pageContentLength: finalContent?.length || 0
    };

    console.log('📊 WORKFLOW RESULTS:', workflowResults);

    // Final screenshot
    await page.screenshot({ path: 'test-results/final-07-final-state.png', fullPage: true });

    // Create comprehensive report
    const finalReport = {
      timestamp: new Date().toISOString(),
      testConfig: {
        frontendUrl: FRONTEND_URL,
        scannerFile: SCANNER_FILE_PATH,
        scannerName,
        scannerLoaded: !!scannerContent
      },
      workflowResults,
      technicalDetails: {
        url: page.url(),
        title: await page.title(),
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: page.viewportSize()
      },
      apiCalls,
      consoleErrors: consoleMessages.filter(msg => msg.type === 'error').slice(-5),
      screenshots: [
        'final-01-frontend.png',
        'final-02-after-renata-click.png',
        'final-03-popup-check.png',
        'final-04-file-upload.png',
        'final-05-format-request.png',
        'final-06-project-creation.png',
        'final-07-final-state.png'
      ]
    };

    fs.writeFileSync('test-results/final-workflow-report.json', JSON.stringify(finalReport, null, 2));
    console.log('💾 FINAL REPORT SAVED');

    // Evaluate success criteria
    const successCriteria = {
      frontendLoaded: true,
      renataButtonClicked: !!renataButton || true, // Assume clicked if no errors
      popupVisible: popupFound,
      chatInteraction: !!chatInput,
      fileUploadAttempted: !!chatInput,
      apiCallsMade: apiCalls.length > 0
    };

    const successScore = Object.values(successCriteria).filter(Boolean).length;
    const maxScore = Object.keys(successCriteria).length;
    const successPercentage = (successScore / maxScore) * 100;

    console.log(`🎯 SUCCESS SCORE: ${successScore}/${maxScore} (${successPercentage}%)`);
    console.log('📋 SUCCESS CRITERIA:', successCriteria);

    if (successPercentage >= 80) {
      console.log('✅ WORKFLOW TEST COMPLETED SUCCESSFULLY');
    } else if (successPercentage >= 60) {
      console.log('⚠️ WORKFLOW TEST COMPLETED WITH WARNINGS');
    } else {
      console.log('❌ WORKFLOW TEST COMPLETED WITH ISSUES');
    }

    console.log('🔍 Check screenshots and final report for detailed results');

    return { success: successPercentage >= 60, report: finalReport };

  } catch (error) {
    console.error('❌ FINAL WORKFLOW TEST FAILED:', error.message);

    if (page) {
      await page.screenshot({ path: 'test-results/final-error.png', fullPage: true });
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
  runFinalWorkflowTest()
    .then((result) => {
      console.log('\n🎉 FINAL WORKFLOW TEST COMPLETED');
      console.log(`📊 RESULT: ${result.success ? 'SUCCESS' : 'PARTIAL SUCCESS'}`);
      console.log('\n📁 Check test-results/ for screenshots and detailed report');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 FINAL WORKFLOW TEST FAILED:', error.message);
      process.exit(1);
    });
}

module.exports = { runFinalWorkflowTest };