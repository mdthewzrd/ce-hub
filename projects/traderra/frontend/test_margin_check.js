#!/usr/bin/env node

/**
 * Test Main Content Margin
 * Check if the margin adjustment is working when sidebar toggles
 */

const { chromium } = require('playwright');

async function testMarginCheck() {
  console.log('🧪 Testing Main Content Margin\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('\n📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check initial state
    const checkState = async (label) => {
      console.log(`\n${label}:`);
      const state = await page.evaluate(() => {
        const sidebar = document.querySelector('.fixed.right-0.top-16');
        const main = document.querySelector('main.flex-1');
        const button = document.querySelector('[data-testid="renata-ai-toggle-button"]');

        return {
          sidebarExists: !!sidebar,
          sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : null,
          sidebarVisibility: sidebar ? window.getComputedStyle(sidebar).visibility : null,
          sidebarOpacity: sidebar ? window.getComputedStyle(sidebar).opacity : null,
          mainClasses: main ? Array.from(main.classList) : null,
          mainMarginRight: main ? window.getComputedStyle(main).marginRight : null,
          buttonClasses: button ? Array.from(button.classList) : null,
          buttonHasActiveBg: button ? button.classList.contains('bg-primary/10') : null,
          localStorageIsSidebarOpen: (() => {
            try {
              const prefs = JSON.parse(localStorage.getItem('traderra_chat_preferences') || '{}');
              return prefs.isSidebarOpen;
            } catch (e) { return null; }
          })(),
        };
      });
      console.log('  ', JSON.stringify(state, null, 2));
      return state;
    };

    const initialState = await checkState('Initial State');

    // Click toggle button
    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);
      const afterFirstClick = await checkState('After First Click');

      // Click again
      console.log('\n🖱️  Clicking toggle button again...');
      await button.click();
      await page.waitForTimeout(500);
      const afterSecondClick = await checkState('After Second Click');

      // Analysis
      console.log('\n📊 Analysis:');
      console.log(`  Main margin changed: ${initialState.mainMarginRight} -> ${afterFirstClick.mainMarginRight} -> ${afterSecondClick.mainMarginRight}`);
      console.log(`  Sidebar exists throughout: ${initialState.sidebarExists} -> ${afterFirstClick.sidebarExists} -> ${afterSecondClick.sidebarExists}`);
      console.log(`  Button bg changed: ${initialState.buttonHasActiveBg} -> ${afterFirstClick.buttonHasActiveBg} -> ${afterSecondClick.buttonHasActiveBg}`);
      console.log(`  localStorage changed: ${initialState.localStorageIsSidebarOpen} -> ${afterFirstClick.localStorageIsSidebarOpen} -> ${afterSecondClick.localStorageIsSidebarOpen}`);

      // Check if condition is being evaluated
      console.log('\n🔍 Checking React condition...');
      const conditionCheck = await page.evaluate(() => {
        // Find elements that would indicate different states
        const topNav = document.querySelector('.fixed.top-0.left-0.z-50');
        const topNavClasses = topNav ? Array.from(topNav.classList) : [];

        return {
          topNavHasRight480: topNavClasses.some(c => c.includes('right-\\[480px')),
          topNavHasRight0: topNavClasses.some(c => c.includes('right-0')),
          topNavClasses: topNavClasses,
        };
      });
      console.log('  ', JSON.stringify(conditionCheck, null, 2));
    }

    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 20 seconds');
    console.log('='.repeat(70));
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testMarginCheck().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
