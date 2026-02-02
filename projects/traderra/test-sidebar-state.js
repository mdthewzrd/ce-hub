/**
 * Simple test to verify sidebar state management
 */

const puppeteer = require('puppeteer');

async function testSidebarState() {
  console.log('🔍 Testing sidebar state management...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to dashboard
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await sleep(3000);

    // Check the actual React state via the window object
    const reactState = await page.evaluate(() => {
      // Try to access the React component state by looking for data attributes or state
      const appElement = document.querySelector('[data-testid="app-layout"]') || document.querySelector('body');

      // Check if sidebar element exists
      const sidebarElement = document.querySelector('.fixed.right-0.top-16.bottom-0');

      // Check for any elements that would indicate sidebar is rendered
      const chatElements = document.querySelectorAll('[class*="chat"], [class*="renata"], [class*="sidebar"]');

      // Check localStorage
      const chatPrefs = localStorage.getItem('traderra_chat_preferences');

      return {
        sidebarExists: !!sidebarElement,
        sidebarVisible: sidebarElement ? sidebarElement.offsetParent !== null : false,
        chatElementsCount: chatElements.length,
        chatPreferences: chatPrefs ? JSON.parse(chatPrefs) : null,
        bodyClasses: document.body.className,
        allFixedElements: document.querySelectorAll('.fixed').length
      };
    });

    console.log('🔍 React State Analysis:');
    console.log('Sidebar element exists:', reactState.sidebarExists ? '✅ Yes' : '❌ No');
    console.log('Sidebar element visible:', reactState.sidebarVisible ? '✅ Yes' : '❌ No');
    console.log('Chat-related elements found:', reactState.chatElementsCount);
    console.log('Chat preferences in localStorage:', reactState.chatPreferences);
    console.log('Fixed positioning elements:', reactState.allFixedElements);

    // Take screenshot for visual verification
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/sidebar_state_debug.png`,
      fullPage: false
    });

    console.log('\n📸 Screenshot saved: sidebar_state_debug.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testSidebarState().catch(console.error);