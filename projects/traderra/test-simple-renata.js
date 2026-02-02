/**
 * Simple Renata AI Test - Works with existing browser session
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRenataInExistingBrowser() {
  console.log('🧪 Testing Renata AI with existing browser session...');

  // Connect to existing Chrome browser instead of launching new one
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--user-data-dir=/Users/michaeldurante/Library/Application Support/Google/Chrome']
  });

  try {
    const page = await browser.newPage();

    // Go to dashboard
    console.log('📊 Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await sleep(3000);

    // Check if signed in
    const signedIn = await page.evaluate(() => {
      return !document.body.textContent.includes('Sign in') &&
             document.querySelector('[placeholder*="Chat with Renata"]');
    });

    if (!signedIn) {
      console.log('❌ Not signed in - trying sign-in page...');
      await page.goto('http://localhost:6565/sign-in');
      await sleep(3000);
      console.log('🔐 Please sign in manually in the browser window...');
      await sleep(10000); // Give time to sign in manually
    } else {
      console.log('✅ Already signed in!');
    }

    // Back to dashboard
    await page.goto('http://localhost:6565/dashboard');
    await sleep(2000);

    // Test simple commands
    const commands = [
      'change date range to 30 days',
      'go to statistics page',
      'show me year to date'
    ];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n📝 Testing: "${command}"`);

      // Find and click chat input
      await page.waitForSelector('input[placeholder*="Chat with Renata"]', { timeout: 5000 });

      // Clear input and type command
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Chat with Renata"]');
        if (input) {
          input.value = '';
          input.focus();
        }
      });

      await sleep(500);
      await page.type('input[placeholder*="Chat with Renata"]', command);
      await sleep(1000);

      // Send message
      const sendButton = await page.$('button:not(:disabled)');
      if (sendButton) {
        await sendButton.click();
        console.log('✅ Message sent');
      }

      // Wait for response and state change
      await sleep(4000);

      // Check current state
      const currentUrl = page.url();
      console.log(`📍 URL: ${currentUrl}`);

      // Check date range
      const dateRange = await page.evaluate(() => {
        const activeDate = document.querySelector('.traderra-date-btn.bg-\\[\\#B8860B\\]');
        return activeDate ? activeDate.textContent.trim() : 'Not found';
      });
      console.log(`📅 Date range: ${dateRange}`);

      // Screenshot
      await page.screenshot({
        path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/renata_test_${i + 1}.png`,
        fullPage: false
      });
    }

    console.log('\n✅ Tests completed! Check screenshots for results.');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Don't close browser - let user continue testing
    console.log('🌐 Browser left open for manual testing');
  }
}

testRenataInExistingBrowser().catch(console.error);