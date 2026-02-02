/**
 * Simple Renata Interface Validation Test
 * First validates the interface is accessible before running functional tests
 */

const { chromium } = require('playwright');

async function testRenataInterface() {
  console.log('🧪 Starting Renata Interface Validation Test...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Step 1: Check if frontend is running
    console.log('📍 Step 1: Checking frontend accessibility...');
    await page.goto('http://localhost:6565/dashboard', { timeout: 10000 });
    console.log('✅ Frontend accessible');

    // Step 2: Look for Renata AI toggle/button
    console.log('📍 Step 2: Looking for Renata AI interface...');

    const possibleSelectors = [
      'button:has-text("AI")',
      'button[title*="AI"]',
      'button[aria-label*="AI"]',
      'button:has([class*="brain"])',
      'nav button',
      'header button',
      '[data-testid*="ai"]',
      '[class*="ai"]',
      'button'
    ];

    let aiButton = null;
    let pageContent = '';

    for (const selector of possibleSelectors) {
      try {
        const buttons = await page.$$(selector);
        console.log(`🔍 Testing selector "${selector}": found ${buttons.length} elements`);

        for (const button of buttons) {
          const text = await button.textContent();
          const innerHTML = await button.innerHTML();
          const className = await button.getAttribute('class');
          const title = await button.getAttribute('title');
          const ariaLabel = await button.getAttribute('aria-label');

          if (text || innerHTML || className || title || ariaLabel) {
            const searchText = (text + ' ' + innerHTML + ' ' + className + ' ' + title + ' ' + ariaLabel).toLowerCase();

            if (searchText.includes('ai') || searchText.includes('brain') || searchText.includes('renata')) {
              aiButton = button;
              console.log(`✅ Found potential AI button with selector: ${selector}`);
              console.log(`   Text: "${text}"`);
              console.log(`   Title: "${title}"`);
              console.log(`   Class: "${className}"`);
              break;
            }
          }
        }

        if (aiButton) break;
      } catch (e) {
        continue;
      }
    }

    // If no AI button found, check page content
    if (!aiButton) {
      pageContent = await page.content();
      const hasRenataContent = pageContent.toLowerCase().includes('renata') ||
                             pageContent.toLowerCase().includes('brain') ||
                             pageContent.toLowerCase().includes('ai');

      console.log('📄 Page content analysis:');
      console.log(`   Contains "renata": ${pageContent.toLowerCase().includes('renata')}`);
      console.log(`   Contains "brain": ${pageContent.toLowerCase().includes('brain')}`);
      console.log(`   Contains "ai": ${pageContent.toLowerCase().includes('ai')}`);

      if (!hasRenataContent) {
        console.log('❌ No Renata/AI content found on page');
        console.log('💡 Possible issues:');
        console.log('   - Renata component not properly integrated');
        console.log('   - Component conditionally rendered');
        console.log('   - Different page structure than expected');
        return { success: false, issue: 'No Renata interface found' };
      }
    }

    // Step 3: Try to open Renata interface
    console.log('📍 Step 3: Attempting to open Renata interface...');

    if (aiButton) {
      await aiButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ AI button clicked, waiting for interface to appear...');
    }

    // Step 4: Look for Renata chat interface
    console.log('📍 Step 4: Looking for Renata chat interface...');

    const chatSelectors = [
      'input[placeholder*="Renata"]',
      'input[placeholder*="ask"]',
      'input[data-testid*="chat"]',
      'input[data-testid*="renata"]',
      'textarea[placeholder*="ask"]',
      'input[type="text"]',
      'textarea'
    ];

    let chatInput = null;

    for (const selector of chatSelectors) {
      try {
        chatInput = await page.$(selector);
        if (chatInput) {
          const placeholder = await chatInput.getAttribute('placeholder');
          const testId = await chatInput.getAttribute('data-testid');
          const isVisible = await chatInput.isVisible();

          console.log(`🔍 Found potential chat input: ${selector}`);
          console.log(`   Placeholder: "${placeholder}"`);
          console.log(`   Test ID: "${testId}"`);
          console.log(`   Visible: ${isVisible}`);

          if (isVisible) {
            break;
          } else {
            chatInput = null;
          }
        }
      } catch (e) {
        continue;
      }
    }

    if (!chatInput) {
      // Check if sidebar opened but input is inside
      const sidebarSelectors = [
        '[class*="sidebar"]',
        '[class*="chat"]',
        '[class*="renata"]',
        '[class*="fixed"]',
        'aside'
      ];

      for (const selector of sidebarSelectors) {
        try {
          const sidebar = await page.$(selector);
          if (sidebar) {
            const isVisible = await sidebar.isVisible();
            if (isVisible) {
              console.log(`✅ Found visible sidebar: ${selector}`);

              // Look for input inside sidebar
              const inputInside = await sidebar.$('input, textarea');
              if (inputInside) {
                chatInput = inputInside;
                console.log('✅ Found chat input inside sidebar');
                break;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (!chatInput) {
      console.log('❌ No Renata chat input found');

      // Take screenshot for debugging
      await page.screenshot({ path: 'renata-interface-debug.png', fullPage: true });
      console.log('📸 Screenshot saved as "renata-interface-debug.png"');

      // Check page structure
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page body text preview:', bodyText.substring(0, 500));

      return {
        success: false,
        issue: 'Renata chat input not found',
        hasAIButton: !!aiButton,
        pageContent: pageContent.length > 0
      };
    }

    // Step 5: Test basic interaction
    console.log('📍 Step 5: Testing basic chat interaction...');

    try {
      await chatInput.fill('hello');
      console.log('✅ Successfully filled chat input');

      // Look for send button
      const sendSelectors = [
        'button[type="submit"]',
        'button:has-text("Send")',
        'button:has-text("submit")',
        'button[aria-label*="send"]',
        'button[title*="send"]',
        'form button'
      ];

      let sendButton = null;
      for (const selector of sendSelectors) {
        try {
          sendButton = await page.$(selector);
          if (sendButton && await sendButton.isVisible()) {
            console.log(`✅ Found send button: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (sendButton) {
        await sendButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Successfully clicked send button');
      } else {
        console.log('⚠️ Send button not found, trying Enter key');
        await chatInput.press('Enter');
        await page.waitForTimeout(3000);
      }

    } catch (error) {
      console.log('❌ Basic interaction failed:', error.message);
      return { success: false, issue: 'Chat interaction failed', error: error.message };
    }

    // Step 6: Check for response
    console.log('📍 Step 6: Checking for AI response...');

    const responseSelectors = [
      '.space-y-4 > div:last-child',
      '[class*="message"]',
      '[class*="chat"] > div:last-child',
      'div:last-child'
    ];

    let hasResponse = false;
    for (const selector of responseSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.length > 5) {
            console.log(`✅ Found response content: ${text.substring(0, 100)}...`);
            hasResponse = true;
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    console.log(`📊 Interface Test Results:`);
    console.log(`   Frontend accessible: ✅`);
    console.log(`   AI button found: ${aiButton ? '✅' : '⚠️'}`);
    console.log(`   Chat interface found: ${chatInput ? '✅' : '❌'}`);
    console.log(`   Basic interaction: ${sendButton ? '✅' : '⚠️'}`);
    console.log(`   Response received: ${hasResponse ? '✅' : '⚠️'}`);

    const overallSuccess = !!(chatInput); // At minimum, we need the chat input

    return {
      success: overallSuccess,
      hasAIButton: !!aiButton,
      hasChatInput: !!chatInput,
      hasResponse: hasResponse,
      interfaceWorking: overallSuccess
    };

  } catch (error) {
    console.log('💥 Interface test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testRenataInterface()
    .then(result => {
      console.log('\n🎯 Final Result:');
      if (result.success) {
        console.log('✅ Renata interface is accessible and working!');
        console.log('   Ready for functional testing');
        process.exit(0);
      } else {
        console.log('❌ Renata interface has issues:');
        console.log('   Issue:', result.issue || 'Unknown');
        if (result.error) console.log('   Error:', result.error);
        console.log('   Has AI button:', result.hasAIButton);
        console.log('   Has chat input:', result.hasChatInput);
        console.log('   Fix interface issues before running functional tests');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRenataInterface };