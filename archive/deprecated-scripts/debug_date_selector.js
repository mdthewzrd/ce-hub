/**
 * DEBUG DATE SELECTOR TEST
 * Focused test to debug why date buttons aren't activating
 */

const { chromium } = require('playwright');

async function debugDateSelector() {
  console.log('🔬 Debug Date Selector - Investigating Button Activation');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 2000 // Very slow for observation
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('DateSelector') || msg.text().includes('🎯')) {
        console.log(`📺 BROWSER: ${msg.text()}`);
      }
    });

    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // Wait for all initialization

    // Check initial state
    console.log('📍 Checking initial state...');
    const initialState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const dateButtons = ['7d', '30d', '90d', 'All'].map(label => {
        const btn = allButtons.find(b => b.textContent?.trim() === label);
        return {
          label,
          found: !!btn,
          classes: btn ? Array.from(btn.classList) : [],
          dataActive: btn?.getAttribute('data-active'),
          computedBg: btn ? window.getComputedStyle(btn).backgroundColor : 'none'
        };
      });

      return { dateButtons };
    });

    console.log('📊 Initial button states:');
    initialState.dateButtons.forEach(btn => {
      console.log(`  ${btn.label}: found=${btn.found}, dataActive=${btn.dataActive}, classes=[${btn.classes.join(', ')}]`);
    });

    // Test 7d button click
    console.log('📍 Clicking 7d button...');
    await page.click('button:has-text("7d")');
    await page.waitForTimeout(2000); // Wait for state update

    // Check state after 7d click
    const afterClickState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const dateButtons = ['7d', '30d', '90d', 'All'].map(label => {
        const btn = allButtons.find(b => b.textContent?.trim() === label);
        return {
          label,
          found: !!btn,
          classes: btn ? Array.from(btn.classList) : [],
          dataActive: btn?.getAttribute('data-active'),
          computedBg: btn ? window.getComputedStyle(btn).backgroundColor : 'none',
          hasActiveClass: btn ? btn.classList.contains('traderra-date-active') : false,
          hasGoldBg: btn ? btn.classList.contains('bg-[#B8860B]') : false
        };
      });

      return { dateButtons };
    });

    console.log('📊 Button states after 7d click:');
    afterClickState.dateButtons.forEach(btn => {
      console.log(`  ${btn.label}: dataActive=${btn.dataActive}, hasActiveClass=${btn.hasActiveClass}, hasGoldBg=${btn.hasGoldBg}`);
      console.log(`    classes=[${btn.classes.join(', ')}]`);
    });

    // Check if 7d is truly active
    const btn7d = afterClickState.dateButtons.find(b => b.label === '7d');
    const isActive = btn7d?.hasActiveClass || btn7d?.hasGoldBg || btn7d?.dataActive === 'true';

    if (isActive) {
      console.log('✅ SUCCESS: 7d button is properly activated');
    } else {
      console.log('❌ FAILURE: 7d button is not activated');
      console.log('🔍 Debugging context state...');

      // Check context state
      const contextState = await page.evaluate(() => {
        // Try to access React DevTools or any global state
        if (window.React) {
          return 'React is available';
        }
        return 'No direct context access available';
      });

      console.log('📊 Context state:', contextState);
    }

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'debug_date_selector_result.png', fullPage: true });
    console.log('📸 Screenshot saved: debug_date_selector_result.png');

  } catch (error) {
    console.error('💥 Debug error:', error);
  } finally {
    await browser.close();
  }
}

debugDateSelector().catch(console.error);