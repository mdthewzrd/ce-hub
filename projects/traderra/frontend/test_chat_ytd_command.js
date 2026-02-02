/**
 * Test Chat YTD Command End-to-End
 * Tests the actual chat interface on statistics page for YTD commands
 */

const { chromium } = require('playwright');

async function testChatYtdCommand() {
  console.log('🧪 Testing Chat YTD Command End-to-End...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to statistics page where StandaloneRenataChat is available
    console.log('📍 Navigating to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForLoadState('networkidle');

    // Wait for page to fully load and take initial screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'chat-ytd-before.png' });

    // Check initial state
    const initialState = await page.evaluate(() => {
      const ytdButton = document.querySelector('[data-testid="date-range-year"]');
      const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

      return {
        ytdActive: ytdButton ? ytdButton.getAttribute('data-active') === 'true' : false,
        dollarActive: dollarButton ? dollarButton.getAttribute('data-active') === 'true' : false,
        ytdExists: !!ytdButton,
        dollarExists: !!dollarButton
      };
    });

    console.log('📊 Initial state:', initialState);

    // Find the chat input - try multiple selectors for the standalone chat
    console.log('🔍 Looking for chat input...');
    await page.waitForTimeout(1000);

    const chatInputSelectors = [
      'textarea[placeholder*="Type a message"]',
      'textarea[placeholder*="Ask Renata"]',
      'textarea[placeholder*="Chat"]',
      'input[placeholder*="Type a message"]',
      'input[placeholder*="Ask"]',
      '.chat-input',
      '[data-testid="chat-input"]',
      'textarea'
    ];

    let chatInput = null;
    for (const selector of chatInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        chatInput = await page.$(selector);
        if (chatInput) {
          console.log(`✅ Found chat input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ Selector ${selector} not found`);
      }
    }

    if (!chatInput) {
      console.log('❌ No chat input found. Available textareas and inputs:');
      const allInputs = await page.evaluate(() => {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        const inputs = Array.from(document.querySelectorAll('input'));
        return {
          textareas: textareas.map(t => ({
            placeholder: t.placeholder,
            className: t.className,
            id: t.id
          })),
          inputs: inputs.map(i => ({
            placeholder: i.placeholder,
            type: i.type,
            className: i.className,
            id: i.id
          }))
        };
      });
      console.log('Available inputs:', JSON.stringify(allInputs, null, 2));
      return;
    }

    // Clear any existing text and type the YTD command
    console.log('💬 Sending YTD command: "switch to dollars and show year to date"');
    await chatInput.click();
    await chatInput.fill('switch to dollars and show year to date');

    // Find and click send button
    const sendButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Send")',
      'button[aria-label*="send"]',
      'button[title*="send"]',
      '.send-button',
      '[data-testid="send-button"]'
    ];

    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      try {
        sendButton = await page.$(selector);
        if (sendButton) {
          const isVisible = await sendButton.isVisible();
          if (isVisible) {
            console.log(`✅ Found send button with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (sendButton) {
      await sendButton.click();
      console.log('✅ Clicked send button');
    } else {
      // Try Enter key as fallback
      console.log('⌨️ No send button found, trying Enter key');
      await chatInput.press('Enter');
    }

    // Wait for processing and observe changes
    console.log('⏳ Waiting for command processing...');
    await page.waitForTimeout(3000);

    // Check if we can see chat processing
    const chatActivity = await page.evaluate(() => {
      const chatElements = Array.from(document.querySelectorAll('.chat, [class*="chat"], [class*="message"]'));
      return {
        chatElementsFound: chatElements.length,
        hasUserMessage: !!document.querySelector('[class*="user"], [role="user"]'),
        hasAssistantMessage: !!document.querySelector('[class*="assistant"], [role="assistant"]'),
        loadingIndicator: !!document.querySelector('[class*="loading"], [class*="spinner"]')
      };
    });

    console.log('💬 Chat activity:', chatActivity);

    // Wait a bit more for any state changes to propagate
    await page.waitForTimeout(5000);

    // Take final screenshot
    await page.screenshot({ path: 'chat-ytd-after.png' });

    // Check final state
    const finalState = await page.evaluate(() => {
      const ytdButton = document.querySelector('[data-testid="date-range-year"]');
      const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

      return {
        url: window.location.href,
        ytdActive: ytdButton ? ytdButton.getAttribute('data-active') === 'true' : false,
        dollarActive: dollarButton ? dollarButton.getAttribute('data-active') === 'true' : false,
        ytdExists: !!ytdButton,
        dollarExists: !!dollarButton
      };
    });

    console.log('📊 Final state:', finalState);

    // Compare states
    const ytdChanged = finalState.ytdActive !== initialState.ytdActive;
    const dollarChanged = finalState.dollarActive !== initialState.dollarActive;

    console.log('\n🎯 TEST RESULTS:');
    console.log('   YTD State Change:', ytdChanged ? '✅ CHANGED' : '❌ NO CHANGE');
    console.log('   Dollar State Change:', dollarChanged ? '✅ CHANGED' : '❌ NO CHANGE');
    console.log('   YTD Now Active:', finalState.ytdActive ? '✅ TRUE' : '❌ FALSE');
    console.log('   Dollar Now Active:', finalState.dollarActive ? '✅ TRUE' : '❌ FALSE');

    const success = finalState.ytdActive && finalState.dollarActive;
    console.log('   Overall Test:', success ? '✅ PASS' : '❌ FAIL');

    if (success) {
      console.log('\n🎉 YTD CHAT COMMAND WORKING PERFECTLY!');
    } else {
      console.log('\n💥 Chat command still has issues - check logs for errors');
    }

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testChatYtdCommand().then(() => process.exit(0));
}

module.exports = { testChatYtdCommand };