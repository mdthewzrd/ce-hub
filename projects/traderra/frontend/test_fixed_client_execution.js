/**
 * Test Fixed Client Script Execution
 * Verifies that client scripts now execute from API responses
 */

const { chromium } = require('playwright');

async function testFixedClientExecution() {
  console.log('🧪 Testing Fixed Client Script Execution...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the main page with chat
    console.log('📍 Navigating to main page...');
    await page.goto('http://localhost:6565/');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'test-fix-before.png' });

    // Send a YTD command through the chat
    console.log('💬 Sending YTD command through chat...');

    // Find and fill chat input
    await page.waitForSelector('textarea[placeholder*="Type a message"], input[placeholder*="Type a message"], .chat-input', { timeout: 10000 });

    const chatInput = await page.$('textarea[placeholder*="Type a message"]') ||
                     await page.$('input[placeholder*="Type a message"]') ||
                     await page.$('.chat-input');

    if (chatInput) {
      await chatInput.fill('switch to dollars and show year to date');

      // Find and click send button
      const sendButton = await page.$('button[type="submit"], .send-button, button:has-text("Send")') ||
                        await page.$('button[aria-label*="send"], button[title*="send"]');

      if (sendButton) {
        await sendButton.click();
        console.log('✅ Chat message sent successfully');
      } else {
        // Try pressing Enter as fallback
        await chatInput.press('Enter');
        console.log('✅ Chat message sent via Enter key');
      }
    } else {
      console.log('❌ Chat input not found');
      return;
    }

    // Wait for processing and script execution
    console.log('⏳ Waiting for response and script execution...');
    await page.waitForTimeout(5000);

    // Take final screenshot
    await page.screenshot({ path: 'test-fix-after.png' });

    // Check if we're now on statistics page
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Check component states
    const finalState = await page.evaluate(() => {
      const ytdButton = document.querySelector('[data-testid="date-range-year"]');
      const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

      return {
        url: window.location.href,
        ytdActive: ytdButton ? ytdButton.getAttribute('data-active') === 'true' : 'not found',
        dollarActive: dollarButton ? dollarButton.getAttribute('data-active') === 'true' : 'not found',
        ytdExists: !!ytdButton,
        dollarExists: !!dollarButton
      };
    });

    console.log('📊 Final state check:');
    console.log('   URL:', finalState.url);
    console.log('   YTD Active:', finalState.ytdActive);
    console.log('   Dollar Active:', finalState.dollarActive);
    console.log('   YTD Exists:', finalState.ytdExists);
    console.log('   Dollar Exists:', finalState.dollarExists);

    // Success criteria
    const isOnStatsPage = finalState.url.includes('/statistics');
    const isYtdActive = finalState.ytdActive === true;
    const isDollarActive = finalState.dollarActive === true;

    console.log('\n🎯 TEST RESULTS:');
    console.log('   Navigation to Stats:', isOnStatsPage ? '✅ PASS' : '❌ FAIL');
    console.log('   YTD Mode Activated:', isYtdActive ? '✅ PASS' : '❌ FAIL');
    console.log('   Dollar Mode Activated:', isDollarActive ? '✅ PASS' : '❌ FAIL');

    const overallSuccess = isOnStatsPage && isYtdActive && isDollarActive;
    console.log('   Overall Test:', overallSuccess ? '✅ PASS' : '❌ FAIL');

    if (overallSuccess) {
      console.log('\n🎉 CLIENT SCRIPT EXECUTION FIX SUCCESSFUL!');
    } else {
      console.log('\n💥 Client script execution still has issues');
    }

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testFixedClientExecution().then(() => process.exit(0));
}

module.exports = { testFixedClientExecution };