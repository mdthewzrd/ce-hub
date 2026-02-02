/**
 * Test Renata AI State Changes
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRenataCommands() {
  console.log('🧪 Testing Renata AI state changes...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:6565/dashboard');
    await sleep(3000);

    // Test commands
    const testCommands = [
      'change the date range to last 30 days',
      'show me year to date data',
      'go to the statistics page',
      'change to risk multiple view',
      'show me this week only',
      'go to journal page',
      'change to analyst mode'
    ];

    for (let i = 0; i < testCommands.length; i++) {
      const command = testCommands[i];
      console.log(`\n📝 Testing command: "${command}"`);

      // Find the chat input and send command
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder="Chat with Renata..."]');
        if (input) {
          input.value = '';
          return true;
        }
        return false;
      });

      await sleep(500);

      // Type the command
      await page.type('input[placeholder="Chat with Renata..."]', command);
      await sleep(1000);

      // Send the message
      await page.click('button:not(:disabled)');
      console.log('✅ Message sent');

      // Wait for response
      await sleep(5000);

      // Check for UI state changes
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      // Check date range if not navigation
      if (!command.includes('go to') && !command.includes('navigate')) {
        const dateRange = await page.evaluate(() => {
          const activeDate = document.querySelector('.traderra-date-btn.bg-\\[\\#B8860B\\]');
          return activeDate ? activeDate.textContent.trim() : 'Unknown';
        });
        console.log(`📅 Active date range: ${dateRange}`);
      }

      // Check display mode
      const displayMode = await page.evaluate(() => {
        const activeBtn = document.querySelector('[data-testid="display-mode-dollar"][data-active="true"]');
        return activeBtn ? 'Dollar' : 'Risk';
      });
      console.log(`💰 Display mode: ${displayMode}`);

      // Screenshot for verification
      await page.screenshot({
        path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/renata_test_${i + 1}.png`,
        fullPage: false
      });
    }

    console.log('\n✅ All commands tested! Check screenshots for verification.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testRenataCommands().catch(console.error);