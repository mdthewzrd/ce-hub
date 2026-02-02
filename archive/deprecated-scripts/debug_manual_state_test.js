/**
 * DEBUG MANUAL STATE TEST
 * Test if we can manually trigger setDateRange and setDisplayMode functions
 */

const { chromium } = require('playwright');

async function debugManualStateTest() {
  console.log('🔧 MANUAL STATE DEBUG TEST');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    // Navigate to statistics page
    console.log('📍 Navigate to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForTimeout(3000);

    // Capture all console logs
    page.on('console', msg => {
      console.log(`🌐 Browser: ${msg.text()}`);
    });

    console.log('📍 Test manual state changes...');

    // Test if we can access the context functions
    const contextTest = await page.evaluate(async () => {
      console.log('🔧 Testing context function access...');

      // Check if window objects are available
      const hasDateRangeContext = typeof window.dateRangeContext !== 'undefined';
      const hasDisplayModeContext = typeof window.displayModeContext !== 'undefined';

      console.log(`DateRangeContext available: ${hasDateRangeContext}`);
      console.log(`DisplayModeContext available: ${hasDisplayModeContext}`);

      // Try to manually trigger state changes
      if (hasDateRangeContext && window.dateRangeContext.setDateRange) {
        console.log('🔧 Attempting manual setDateRange(90day)...');
        try {
          window.dateRangeContext.setDateRange('90day');
          console.log('✅ setDateRange executed without error');
        } catch (error) {
          console.log('❌ setDateRange error:', error.message);
        }
      } else {
        console.log('❌ dateRangeContext.setDateRange not available');
      }

      if (hasDisplayModeContext && window.displayModeContext.setDisplayMode) {
        console.log('🔧 Attempting manual setDisplayMode(r)...');
        try {
          window.displayModeContext.setDisplayMode('r');
          console.log('✅ setDisplayMode executed without error');
        } catch (error) {
          console.log('❌ setDisplayMode error:', error.message);
        }
      } else {
        console.log('❌ displayModeContext.setDisplayMode not available');
      }

      // Check if React DevTools or similar are available
      const hasReact = typeof window.React !== 'undefined';
      const hasReactDOM = typeof window.ReactDOM !== 'undefined';

      return {
        hasDateRangeContext,
        hasDisplayModeContext,
        hasReact,
        hasReactDOM,
        windowKeys: Object.keys(window).filter(key =>
          key.toLowerCase().includes('context') ||
          key.toLowerCase().includes('date') ||
          key.toLowerCase().includes('display')
        )
      };
    });

    console.log('\n🔍 Context Test Results:');
    console.log(JSON.stringify(contextTest, null, 2));

    // Wait a bit and check final state
    await page.waitForTimeout(3000);

    const finalState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));

      const btn90d = allButtons.find(b => b.textContent?.trim() === '90d');
      const btnAll = allButtons.find(b => b.textContent?.trim() === 'All');
      const btnR = allButtons.find(b => b.textContent?.trim() === 'R');
      const btnDollar = allButtons.find(b => b.textContent?.trim() === '$');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return btn.classList.contains('bg-[#B8860B]') ||
               btn.classList.contains('traderra-date-active') ||
               btn.getAttribute('data-active') === 'true';
      };

      return {
        '90d': checkButtonActive(btn90d),
        'All': checkButtonActive(btnAll),
        'R': checkButtonActive(btnR),
        'Dollar': checkButtonActive(btnDollar)
      };
    });

    console.log('\n📊 Final Button States:');
    console.log(`  90d: ${finalState['90d']}`);
    console.log(`  All: ${finalState['All']}`);
    console.log(`  R: ${finalState['R']}`);
    console.log(`  Dollar: ${finalState['Dollar']}`);

    // Try clicking the buttons directly
    console.log('\n📍 Testing direct button clicks...');

    // Click 90d button
    try {
      await page.click('button:has-text("90d")');
      await page.waitForTimeout(1000);
      console.log('✅ 90d button clicked');
    } catch (error) {
      console.log('❌ 90d button click failed:', error.message);
    }

    // Click R button
    try {
      await page.click('button:has-text("R")');
      await page.waitForTimeout(1000);
      console.log('✅ R button clicked');
    } catch (error) {
      console.log('❌ R button click failed:', error.message);
    }

    // Check final state after manual clicks
    const afterClickState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));

      const btn90d = allButtons.find(b => b.textContent?.trim() === '90d');
      const btnAll = allButtons.find(b => b.textContent?.trim() === 'All');
      const btnR = allButtons.find(b => b.textContent?.trim() === 'R');
      const btnDollar = allButtons.find(b => b.textContent?.trim() === '$');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return btn.classList.contains('bg-[#B8860B]') ||
               btn.classList.contains('traderra-date-active') ||
               btn.getAttribute('data-active') === 'true';
      };

      return {
        '90d': checkButtonActive(btn90d),
        'All': checkButtonActive(btnAll),
        'R': checkButtonActive(btnR),
        'Dollar': checkButtonActive(btnDollar)
      };
    });

    console.log('\n📊 After Manual Clicks:');
    console.log(`  90d: ${afterClickState['90d']}`);
    console.log(`  All: ${afterClickState['All']}`);
    console.log(`  R: ${afterClickState['R']}`);
    console.log(`  Dollar: ${afterClickState['Dollar']}`);

    const manualSuccess = afterClickState['90d'] && afterClickState['R'];
    console.log(`\n🎯 Manual Click Success: ${manualSuccess ? '✅' : '❌'}`);

    await page.screenshot({ path: 'manual_state_debug.png', fullPage: true });

    return manualSuccess;

  } catch (error) {
    console.error('💥 Debug test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

debugManualStateTest().then(success => {
  console.log(`\n🏁 MANUAL STATE DEBUG: ${success ? 'BUTTONS WORK MANUALLY' : 'BUTTONS ISSUE IDENTIFIED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});