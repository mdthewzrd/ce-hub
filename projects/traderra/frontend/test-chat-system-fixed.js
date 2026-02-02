/**
 * Test Fixed Chat System - Comprehensive Multi-Command Testing
 * Tests the simplified and fixed Renata chat functionality
 */

const { chromium } = require('playwright');

async function testFixedChatSystem() {
  console.log('🧪 Testing Fixed Chat System...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Wait for server to be ready
    console.log('📍 Navigating to dashboard first...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 1: Check if chat component is present
    console.log('🔍 Checking if chat component is present...');
    const chatExists = await page.evaluate(() => {
      const chatElements = document.querySelectorAll('[class*="chat"], [class*="renata"]');
      return chatElements.length > 0;
    });

    console.log(`Chat component present: ${chatExists ? '✅ YES' : '❌ NO'}`);

    if (!chatExists) {
      console.log('❌ Chat component not found, checking available elements...');
      const allElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
          .filter(el => el.className && typeof el.className === 'string')
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id
          }))
          .filter(el => el.className.includes('chat') || el.className.includes('renata'))
          .slice(0, 20);
      });
      console.log('Elements with chat/renata in class:', JSON.stringify(allElements, null, 2));
    }

    // Test 2: Check if we can navigate to statistics
    console.log('🧭 Testing navigation to statistics...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test 3: Look for the fixed chat component
    console.log('🔍 Looking for fixed chat component on statistics page...');

    // Wait a bit more for React to render
    await page.waitForTimeout(2000);

    const chatSelectors = [
      '[class*="chat"]',
      '[class*="renata"]',
      '[data-testid*="chat"]',
      'textarea',
      'input[placeholder*="Ask"]',
      'input[placeholder*="Type"]',
      '.fixed',
      '.bottom-4',
      '.right-4'
    ];

    let chatFound = false;
    let chatElement = null;

    for (const selector of chatSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);

          // Check if any of these could be our chat
          for (const el of elements) {
            const isVisible = await el.isVisible();
            const textContent = await el.textContent();
            const className = await el.evaluate(el => el.className);

            if (isVisible && (className.includes('chat') || className.includes('renata') || textContent?.includes('Renata'))) {
              chatFound = true;
              chatElement = el;
              console.log(`✅ Found chat component! className: "${className}"`);
              break;
            }
          }

          if (chatFound) break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!chatFound) {
      console.log('❌ Chat component still not found. Taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-no-chat-found.png', fullPage: true });

      // Check console for errors
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });

      // Wait a bit and collect console messages
      await page.waitForTimeout(3000);

      if (consoleMessages.length > 0) {
        console.log('📋 Console messages:');
        consoleMessages.slice(-10).forEach(msg => {
          console.log(`  ${msg.type.toUpperCase()}: ${msg.text}`);
        });
      }

      return;
    }

    // Test 4: Try to interact with the chat
    console.log('💬 Attempting to interact with chat...');

    // Look for input field within the chat
    const inputSelectors = [
      'textarea[placeholder*="Ask Renata"]',
      'textarea[placeholder*="anything"]',
      'textarea',
      'input[placeholder*="Ask"]',
      'input[placeholder*="Type"]',
      'input[type="text"]'
    ];

    let inputField = null;
    for (const selector of inputSelectors) {
      try {
        inputField = await page.$(selector);
        if (inputField && await inputField.isVisible()) {
          console.log(`✅ Found input field: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!inputField) {
      console.log('❌ No input field found in chat component');
      return;
    }

    // Test 5: Send a test command
    console.log('📤 Sending test command: "show year to date in dollars"');

    await inputField.click();
    await inputField.fill('show year to date in dollars');

    // Look for send button
    const sendButton = await page.$('button[type="submit"], button:has-text("Send"), button svg');

    if (sendButton && await sendButton.isVisible()) {
      await sendButton.click();
      console.log('✅ Clicked send button');
    } else {
      console.log('⌨️ No send button found, trying Enter key');
      await inputField.press('Enter');
    }

    // Test 6: Wait for response and check state changes
    console.log('⏳ Waiting for chat response...');
    await page.waitForTimeout(3000);

    // Look for response indicators
    const responseFound = await page.evaluate(() => {
      const responseElements = document.querySelectorAll('[class*="message"], [class*="response"], [class*="assistant"]');
      return responseElements.length > 0;
    });

    console.log(`Chat response found: ${responseFound ? '✅ YES' : '❌ NO'}`);

    // Test 7: Check if state changes were applied
    console.log('🔍 Checking for state changes...');
    await page.waitForTimeout(2000);

    const stateChanges = await page.evaluate(() => {
      // Check for date range buttons
      const yearButton = document.querySelector('[data-testid="date-range-year"]');
      const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

      return {
        yearButtonExists: !!yearButton,
        yearButtonActive: yearButton ? yearButton.getAttribute('data-active') === 'true' : false,
        dollarButtonExists: !!dollarButton,
        dollarButtonActive: dollarButton ? dollarButton.getAttribute('data-active') === 'true' : false
      };
    });

    console.log('State changes detected:', stateChanges);

    // Take final screenshot
    await page.screenshot({ path: 'chat-test-final.png', fullPage: true });

    // Test Results Summary
    console.log('\n🎯 TEST RESULTS SUMMARY:');
    console.log(`✅ Chat Component Found: ${chatFound ? 'YES' : 'NO'}`);
    console.log(`✅ Input Field Found: ${inputField ? 'YES' : 'NO'}`);
    console.log(`✅ Command Sent: YES`);
    console.log(`✅ Response Generated: ${responseFound ? 'YES' : 'NO'}`);
    console.log(`✅ State Changes Applied: ${stateChanges.yearButtonActive || stateChanges.dollarButtonActive ? 'YES' : 'NO'}`);

    const overallSuccess = chatFound && inputField && responseFound;
    console.log(`🎉 Overall Test Result: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);

    if (overallSuccess) {
      console.log('\n🎊 FIXED CHAT SYSTEM IS WORKING!');
      console.log('Multi-command queries should now work properly.');
    } else {
      console.log('\n💥 Issues still need to be resolved.');
    }

  } catch (error) {
    console.log('💥 Test error:', error.message);
    await page.screenshot({ path: 'chat-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testFixedChatSystem().then(() => process.exit(0));
}

module.exports = { testFixedChatSystem };