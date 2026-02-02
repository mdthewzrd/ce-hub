const puppeteer = require('puppeteer');
const fs = require('fs');

async function runVisualValidation() {
  console.log('📸 STARTING VISUAL VALIDATION WITH SCREENSHOTS...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  const results = {
    screenshots: [],
    consoleLogs: [],
    apiCalls: [],
    elementStates: []
  };

  try {
    // Capture all console output
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      results.consoleLogs.push(logEntry);
      console.log(`🌐 [${logEntry.type}]: ${logEntry.text}`);
    });

    page.on('response', response => {
      if (response.url().includes('/api/renata/chat')) {
        results.apiCalls.push({
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString()
        });
        console.log(`📡 API Call: ${response.status()} ${response.url()}`);
      }
    });

    // Step 1: Navigate to Traderra
    console.log('\n1️⃣ Navigating to Traderra...');
    await page.goto('http://localhost:6565?v=' + Date.now(), {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/screenshots/01_initial_load.png',
      fullPage: true
    });
    results.screenshots.push('01_initial_load.png');
    console.log('📸 Screenshot: Initial page load');

    await page.waitForTimeout(3000);

    // Step 2: Look for Renata chat component
    console.log('\n2️⃣ Looking for Renata chat component...');

    const chatSelectors = [
      'input[placeholder*="Ask"]',
      'input[placeholder*="chat"]',
      'textarea[placeholder*="Ask"]',
      '[class*="chat"]',
      '[class*="renata"]'
    ];

    let chatInput = null;
    for (const selector of chatSelectors) {
      try {
        chatInput = await page.$(selector);
        if (chatInput) {
          console.log(`✅ Found chat input with selector: ${selector}`);
          results.elementStates.push({
            element: 'chat_input',
            found: true,
            selector: selector
          });
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!chatInput) {
      console.log('❌ Chat input not found, taking diagnostic screenshot...');
      await page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/screenshots/02_no_chat_found.png',
        fullPage: true
      });
      results.screenshots.push('02_no_chat_found.png');

      // Get page HTML for analysis
      const pageHTML = await page.content();
      fs.writeFileSync('/Users/michaeldurante/ai dev/ce-hub/screenshots/page_content.html', pageHTML);
      console.log('📄 Page content saved for analysis');
      return results;
    }

    // Step 3: Test multi-command message
    console.log('\n3️⃣ Testing multi-command message...');

    const testMessage = "Switch to R-multiple mode and show last 90 days";
    console.log(`💬 Sending: "${testMessage}"`);

    await chatInput.type(testMessage);
    await page.waitForTimeout(1000);

    // Screenshot before sending
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/screenshots/03_message_typed.png',
      fullPage: true
    });
    results.screenshots.push('03_message_typed.png');

    // Find and click send button
    const sendSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      '[class*="send"]',
      'button'
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      try {
        if (selector.includes('has-text')) {
          sendButton = await page.$(selector);
        } else {
          sendButton = await page.$(selector);
        }
        if (sendButton) {
          console.log(`✅ Found send button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (sendButton) {
      await sendButton.click();
      console.log('📤 Send button clicked');
    } else {
      console.log('⌨️ Send button not found, trying Enter key...');
      await page.keyboard.press('Enter');
    }

    // Wait for response
    console.log('⏱️ Waiting for AI response...');
    await page.waitForTimeout(8000);

    // Take screenshot after response
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/screenshots/04_after_response.png',
      fullPage: true
    });
    results.screenshots.push('04_after_response.png');

    // Step 4: Check for command execution evidence
    console.log('\n4️⃣ Analyzing command execution...');

    const commandEvidence = await page.evaluate(() => {
      // Look for any command execution evidence
      const evidence = {
        commandLogs: [],
        stateChanges: [],
        uiUpdates: []
      };

      // Check for command execution logs
      if (window.console) {
        evidence.commandLogs = Array.from(console.logs).filter(log =>
          log.text && (log.text.includes('navigationCommands') ||
                     log.text.includes('Executing') ||
                     log.text.includes('command'))
        );
      }

      // Check for state changes in the UI
      const displayButtons = document.querySelectorAll('[class*="mode"], [class*="display"]');
      displayButtons.forEach(btn => {
        if (btn.textContent && (btn.textContent.includes('R') || btn.textContent.includes('$'))) {
          evidence.uiUpdates.push({
            element: 'display_mode_button',
            text: btn.textContent.trim(),
            active: btn.classList.contains('active') || btn.getAttribute('aria-pressed') === 'true'
          });
        }
      });

      return evidence;
    });

    results.elementStates.push({
      element: 'command_execution',
      evidence: commandEvidence
    });

    // Step 5: Final state analysis
    console.log('\n5️⃣ Final state analysis...');
    await page.screenshot({
      path: '/Users/michaeldurante/ai dev/ce-hub/screenshots/05_final_state.png',
      fullPage: true
    });
    results.screenshots.push('05_final_state.png');

    // Save comprehensive results
    fs.writeFileSync('/Users/michaeldurante/ai dev/ce-hub/screenshots/validation_results.json', JSON.stringify(results, null, 2));

    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(`📸 Screenshots taken: ${results.screenshots.length}`);
    console.log(`🌐 Console logs captured: ${results.consoleLogs.length}`);
    console.log(`📡 API calls detected: ${results.apiCalls.length}`);
    console.log(`🎯 Element states analyzed: ${results.elementStates.length}`);

    results.screenshots.forEach((shot, i) => {
      console.log(`  ${i + 1}. ${shot}`);
    });

    return results;

  } catch (error) {
    console.error('❌ Validation failed:', error);

    // Take error screenshot
    try {
      await page.screenshot({
        path: '/Users/michaeldurante/ai dev/ce-hub/screenshots/error_state.png',
        fullPage: true
      });
      results.screenshots.push('error_state.png');
    } catch (screenshotError) {
      console.log('Could not take error screenshot');
    }

    results.error = error.message;
    return results;

  } finally {
    await browser.close();
    console.log('\n🔚 Browser closed, validation complete');
  }
}

// Ensure screenshots directory exists
if (!fs.existsSync('/Users/michaeldurante/ai dev/ce-hub/screenshots')) {
  fs.mkdirSync('/Users/michaeldurante/ai dev/ce-hub/screenshots', { recursive: true });
}

// Run the validation
runVisualValidation().then(results => {
  console.log('\n✅ VISUAL VALIDATION COMPLETE');
  console.log('📁 Results saved to: /Users/michaeldurante/ai dev/ce-hub/screenshots/');
}).catch(error => {
  console.error('❌ Validation failed:', error);
});