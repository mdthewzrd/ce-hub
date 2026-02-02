const puppeteer = require('puppeteer');
const path = require('path');

async function debugRenataChat() {
  console.log('🚀 Starting Renata Chat Debug Test with Puppeteer');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    devtools: true,  // Open devtools
    defaultViewport: { width: 1920, height: 1080 }
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      console.log(`🌐 Browser Console [${msg.type()}]: ${msg.text()}`);
    });

    page.on('response', response => {
      if (response.url().includes('/api/renata/chat')) {
        console.log(`🔍 API Response: ${response.status()} ${response.url()}`);
      }
    });

    console.log('📖 Navigating to Traderra...');
    await page.goto('http://localhost:6565', { waitUntil: 'networkidle0' });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🤖 Looking for Renata chat...');

    // Check if Renata sidebar is open
    const isRenataOpen = await page.evaluate(() => {
      const renataSidebar = document.querySelector('[class*="fixed right-0 top-16"]');
      return renataSidebar && window.getComputedStyle(renataSidebar).display !== 'none';
    });

    console.log(`📊 Renata sidebar open: ${isRenataOpen}`);

    if (!isRenataOpen) {
      console.log('🔓 Opening Renata sidebar...');
      await page.click('[aria-label*="AI"]'); // Try to find AI toggle button
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check mode selector
    const currentMode = await page.evaluate(() => {
      const modeSelector = document.querySelector('select');
      return modeSelector ? modeSelector.value : 'not found';
    });

    console.log(`🎯 Current Renata mode: ${currentMode}`);

    // If not in renata mode, switch to it
    if (currentMode !== 'renata') {
      console.log('🔄 Switching to Renata mode...');
      await page.select('select', 'renata');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test messages
    const testMessages = [
      'hello',
      'hey there',
      'how are you doing?',
      'can you help me with trading strategies?',
      'what do you think about the market today?',
      'tell me about risk management',
      'i had a bad trade today',
      'show me my performance'  // This should actually trigger stats
    ];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📤 Test ${i + 1}: Sending "${message}"`);

      try {
        // Find input field
        const inputSelector = 'input[placeholder*="Chat"], input[type="text"]';
        await page.waitForSelector(inputSelector, { timeout: 5000 });

        // Clear input and type message
        await page.click(inputSelector);
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.type(inputSelector, message);

        // Send message
        await page.keyboard.press('Enter');

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get the last assistant message
        const lastResponse = await page.evaluate(() => {
          const messages = document.querySelectorAll('[class*="assistant"], [class*="ai"]');
          const lastMsg = messages[messages.length - 1];
          return lastMsg ? lastMsg.textContent.trim() : 'no response found';
        });

        console.log(`📥 Response: "${lastResponse}"`);

        // Check if it's the generic filtered response
        const isGenericResponse = lastResponse.includes("I'm Renata, your AI assistant") &&
                                lastResponse.includes("What would you like to explore together?");

        if (isGenericResponse) {
          console.log('⚠️  Generic filtered response detected');
        } else {
          console.log('✅ Contextual response received');
        }

        // Take screenshot
        const screenshotName = `renata_test_${i + 1}_${message.replace(/\s+/g, '_')}.png`;
        await page.screenshot({ path: screenshotName, fullPage: false });
        console.log(`📸 Screenshot saved: ${screenshotName}`);

      } catch (error) {
        console.error(`❌ Error with message "${message}":`, error.message);
      }

      // Wait between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Test completed. Keeping browser open for manual inspection...');

    // Keep browser open for 30 seconds for manual inspection
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Check if Traderra is running first
async function checkTraderraRunning() {
  try {
    const response = await fetch('http://localhost:6565');
    return response.status === 200;
  } catch (error) {
    console.error('❌ Traderra is not running on http://localhost:6565');
    console.log('Please start Traderra first: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const isRunning = await checkTraderraRunning();
  if (!isRunning) {
    process.exit(1);
  }

  await debugRenataChat();
}

main().catch(console.error);