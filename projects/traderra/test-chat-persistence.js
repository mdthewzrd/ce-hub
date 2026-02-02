/**
 * Test Chat Persistence Across Pages
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testChatPersistence() {
  console.log('🧪 Testing chat persistence across pages...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:6565/dashboard');
    await sleep(3000);

    // Step 1: Send a message on dashboard
    console.log('\n📝 Step 1: Sending message on dashboard...');
    await page.type('input[placeholder*="Chat with Renata"]', 'test message from dashboard');
    await page.click('button:not(:disabled)');
    await sleep(3000);

    // Step 2: Check if message is in chat
    const dashboardMessages = await page.evaluate(() => {
      const messages = document.querySelectorAll('[role="assistant"], [role="user"]');
      return Array.from(messages).map(m => m.textContent?.substring(0, 50) || '').join('\n');
    });
    console.log('📊 Dashboard messages:', dashboardMessages.length > 0 ? 'Messages found' : 'No messages');

    // Step 3: Navigate to statistics
    console.log('\n🧭 Step 3: Navigating to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await sleep(3000);

    // Step 4: Check if messages persist
    const statisticsMessages = await page.evaluate(() => {
      const messages = document.querySelectorAll('[role="assistant"], [role="user"]');
      return Array.from(messages).map(m => m.textContent?.substring(0, 50) || '').join('\n');
    });
    console.log('📊 Statistics messages:', statisticsMessages.length > 0 ? 'Messages persisting' : 'Messages lost');

    // Step 5: Go back to dashboard
    console.log('\n🏠 Step 5: Going back to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await sleep(2000);

    // Step 6: Check final state
    const finalMessages = await page.evaluate(() => {
      const messages = document.querySelectorAll('[role="assistant"], [role="user"]');
      return Array.from(messages).map(m => m.textContent?.substring(0, 50) || '').join('\n');
    });
    console.log('📊 Final dashboard messages:', finalMessages.length > 0 ? 'Messages still there' : 'Messages lost');

    // Take screenshots
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/chat_persistence_test.png`,
      fullPage: false
    });

    console.log('\n✅ Test completed! Check screenshots and console output.');

    // Result
    if (dashboardMessages.length > 0 && statisticsMessages.length === 0) {
      console.log('\n❌ CONFIRMED: Chat messages are lost when navigating to statistics page');
      console.log('🔧 CAUSE: Statistics page has its own chat instance instead of shared AppLayout');
      console.log('\n📝 FILES TO FIX:');
      console.log('  - src/app/statistics/page.tsx');
      console.log('  - src/app/settings/page.tsx');
      console.log('  - src/app/calendar/page.tsx');
      console.log('  - src/app/daily-summary/page.tsx');
      console.log('  - src/app/journal-enhanced/page.tsx');
      console.log('  - src/app/analytics/page.tsx');
    } else if (statisticsMessages.length > 0) {
      console.log('\n✅ SUCCESS: Chat messages persist across navigation!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testChatPersistence().catch(console.error);