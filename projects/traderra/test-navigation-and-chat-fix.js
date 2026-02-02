/**
 * Comprehensive test for chat persistence and date range execution during navigation
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testNavigationAndChatFix() {
  console.log('🧪 Testing navigation and chat persistence fixes...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Monitor console for execution flow
    const executionLog = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('⚡') || text.includes('🧭') || text.includes('📅') || text.includes('📋') || text.includes('🎯')) {
        executionLog.push(text);
        console.log('EXECUTION:', text);
      }
    });

    // Step 1: Start on stats page
    console.log('\n📍 Step 1: Starting on stats page...');
    await page.goto('http://localhost:6565/stats');
    await sleep(3000);

    // Check initial state
    const initialMessages = await page.evaluate(() => {
      const messages = document.querySelectorAll('[class*="message"]');
      return messages.length;
    });
    console.log(`Initial messages on stats page: ${initialMessages}`);

    // Step 2: Send the compound command
    console.log('\n💬 Step 2: Sending "go to dashboard and look at All of 2025"...');

    // Find and type the command
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.select();
        textarea.value = 'go to dashboard and look at All of 2025';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await sleep(1000);

    // Click send button
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('send')) {
          btn.click();
          break;
        }
      }
    });

    // Wait for execution
    console.log('\n⏳ Step 3: Waiting for command execution...');
    await sleep(6000);

    // Step 4: Check if we navigated to dashboard
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    const navigatedToDashboard = currentUrl.includes('/dashboard');
    console.log(`Navigation successful: ${navigatedToDashboard ? '✅ Yes' : '❌ No'}`);

    // Step 5: Check if messages are preserved
    const finalMessages = await page.evaluate(() => {
      const messages = document.querySelectorAll('[class*="message"], [class*="chat"]');
      return messages.length;
    });
    console.log(`Messages after navigation: ${finalMessages}`);
    const messagesPreserved = finalMessages > initialMessages;
    console.log(`Messages preserved: ${messagesPreserved ? '✅ Yes' : '❌ No'}`);

    // Step 6: Check execution order
    console.log('\n📊 Execution Analysis:');
    console.log(`Total execution events: ${executionLog.length}`);

    const nonNavigationActions = executionLog.filter(log => log.includes('⚡'));
    const navigationActions = executionLog.filter(log => log.includes('🧭'));

    console.log(`Non-navigation actions: ${nonNavigationActions.length}`);
    console.log(`Navigation actions: ${navigationActions.length}`);

    const correctOrder = nonNavigationActions.length > 0 &&
                        navigationActions.length > 0 &&
                        executionLog.indexOf(nonNavigationActions[0]) < executionLog.indexOf(navigationActions[0]);

    console.log(`Correct execution order (non-navigation first): ${correctOrder ? '✅ Yes' : '❌ No'}`);

    // Step 7: Check localStorage for state persistence
    const localStorageState = await page.evaluate(() => {
      const chatPrefs = localStorage.getItem('traderra_chat_preferences');
      const conversations = localStorage.getItem('traderra_conversations');
      const dateRange = localStorage.getItem('traderra_date_range');
      const customRange = localStorage.getItem('traderra_custom_date_range');

      return {
        chatPreferences: chatPrefs ? JSON.parse(chatPrefs) : null,
        conversations: conversations ? JSON.parse(conversations) : null,
        dateRange: dateRange,
        customRange: customRange ? JSON.parse(customRange) : null
      };
    });

    console.log('\n💾 LocalStorage State:');
    console.log(`Chat preferences saved: ${localStorageState.chatPreferences ? '✅ Yes' : '❌ No'}`);
    console.log(`Conversations saved: ${localStorageState.conversations ? '✅ Yes' : '❌ No'}`);
    console.log(`Date range: ${localStorageState.dateRange}`);
    console.log(`Custom range:`, localStorageState.customRange);

    // Check if custom range was set for 2025
    const customRangeCorrect = localStorageState.customRange &&
                             localStorageState.customRange.start.includes('2025-01-01') &&
                             localStorageState.customRange.end.includes('2025-12-31');

    console.log(`Custom date range set correctly: ${customRangeCorrect ? '✅ Yes' : '❌ No'}`);

    // Take final screenshot
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/navigation_chat_fix_result.png`,
      fullPage: false
    });

    // Final assessment
    const allFixesWorking = navigatedToDashboard &&
                          messagesPreserved &&
                          correctOrder &&
                          customRangeCorrect;

    console.log('\n🎯 FINAL RESULTS:');
    console.log(`✅ Navigation working: ${navigatedToDashboard}`);
    console.log(`✅ Chat persistence working: ${messagesPreserved}`);
    console.log(`✅ Correct execution order: ${correctOrder}`);
    console.log(`✅ Date range change working: ${customRangeCorrect}`);
    console.log(`\n🏆 OVERALL SUCCESS: ${allFixesWorking ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testNavigationAndChatFix().catch(console.error);