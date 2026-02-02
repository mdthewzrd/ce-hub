const puppeteer = require('puppeteer');

async function testRenataFunctionality() {
  console.log('🚀 Starting browser test for Renata functionality...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Enable console log capture from browser
    page.on('console', msg => {
      console.log('🌐 Browser Console:', msg.text());
    });

    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    // Navigate to Traderra with cache bypass
    console.log('📍 Navigating to Traderra...');
    await page.goto('http://localhost:6565?t=' + Date.now(), {
      waitUntil: 'networkidle2'
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if Renata chat component is loaded
    console.log('🔍 Checking for Renata chat component...');
    const chatComponent = await page.$('[data-testid="renata-chat"], .renata-chat, [class*="renata"], [class*="chat"]');

    if (chatComponent) {
      console.log('✅ Renata chat component found!');
    } else {
      console.log('❌ Renata chat component not found, looking for input field...');
    }

    // Look for any input field that might be the chat input
    const chatInput = await page.$('input[placeholder*="Ask"], input[placeholder*="chat"], textarea[placeholder*="Ask"], textarea[placeholder*="chat"]');

    if (chatInput) {
      console.log('✅ Chat input found!');

      // Test message
      const testMessage = "Switch to R-multiple mode and show last 90 days";
      console.log('📝 Sending test message:', testMessage);

      // Type the message
      await chatInput.type(testMessage);
      await page.waitForTimeout(1000);

      // Look for send button
      const sendButton = await page.$('button:has([class*="send"]), button:has-text("Send"), button[aria-label*="send"], button[type="submit"]');

      if (sendButton) {
        console.log('📤 Send button found, clicking...');
        await sendButton.click();

        // Wait for response
        await page.waitForTimeout(10000);

        console.log('⏱️ Waiting for AI response...');

        // Check for any changes in the page
        const responseElement = await page.$('[class*="message"], [class*="response"], [class*="assistant"]');
        if (responseElement) {
          console.log('✅ Response detected on page');
          const responseText = await responseElement.textContent();
          console.log('📄 Response text:', responseText?.substring(0, 200) + '...');
        }

      } else {
        console.log('❌ Send button not found');

        // Try pressing Enter as alternative
        console.log('⌨️ Trying Enter key...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(10000);
      }

    } else {
      console.log('❌ Chat input not found');

      // Let's take a screenshot to see what's on the page
      await page.screenshot({ path: '/Users/michaeldurante/ai dev/ce-hub/traderra_page_debug.png', fullPage: true });
      console.log('📸 Screenshot saved to traderra_page_debug.png');

      // Get page HTML to analyze structure
      const pageHTML = await page.content();
      console.log('📄 Page HTML length:', pageHTML.length);

      // Look for any chat-related elements
      const chatElements = await page.$$eval('*', elements =>
        elements.filter(el =>
          el.textContent &&
          el.textContent.toLowerCase().includes('renata') ||
          el.className && el.className.toLowerCase().includes('chat') ||
          el.placeholder && el.placeholder.toLowerCase().includes('ask')
        ).map(el => ({
          tag: el.tagName,
          className: el.className,
          placeholder: el.placeholder,
          textContent: el.textContent?.substring(0, 100)
        }))
      );

      console.log('🔍 Chat-related elements found:', chatElements.length);
      chatElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tag} - ${el.className} - ${el.placeholder} - ${el.textContent}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      console.log('🔚 Closing browser...');
      await browser.close();
    }
  }
}

testRenataFunctionality();