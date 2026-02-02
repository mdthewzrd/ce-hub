#!/usr/bin/env node

/**
 * Test Calendar Page Layout and Sidebar Fixes
 */

const { chromium } = require('playwright');

async function testCalendarFixes() {
  console.log('🧪 Testing Calendar Page Layout & Sidebar Fixes\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);

    // Check initial state
    const checkLayout = async (label) => {
      return await page.evaluate((lbl) => {
        const appLayout = document.querySelector('[class*="studio-bg"]');
        const topNav = document.querySelector('.fixed.top-0.left-0.z-50');
        const pageHeader = document.querySelector('.fixed.top-16.left-0.z-40');
        const main = document.querySelector('main.flex-1');
        const sidebar = document.querySelector('.fixed.right-0.top-16');
        const renataChat = document.querySelector('.fixed.right-0.top-16 .standalone-renata-chat, .standalone-renata-chat');

        const sidebarExists = !!sidebar;
        const hasRenataChat = !!renataChat;
        const sidebarStyles = sidebar ? {
          display: window.getComputedStyle(sidebar).display,
          visibility: window.getComputedStyle(sidebar).visibility,
          width: window.getComputedStyle(sidebar).width,
          right: window.getComputedStyle(sidebar).right,
          overflow: window.getComputedStyle(sidebar).overflow,
        } : null;

        const mainMarginRight = main ? window.getComputedStyle(main).marginRight : null;
        const topNavRight = topNav ? {
          classes: Array.from(topNav.classList).filter(c => c.includes('right-')),
          style: window.getComputedStyle(topNav).right
        } : null;

        return {
          label: lbl,
          hasAppLayout: !!appLayout,
          sidebarExists,
          hasRenataChat,
          sidebarStyles,
          mainMarginRight,
          topNavRight,
          pageHeaderExists: !!pageHeader,
        };
      }, label);
    };

    console.log('\n📊 Initial state (sidebar should be open):');
    let state = await checkLayout('Initial');
    console.log('  ', JSON.stringify(state, null, 2));

    // Check if sidebar is cut off
    if (state.sidebarExists) {
      const sidebarVisible = state.sidebarStyles.display !== 'none' &&
                            state.sidebarStyles.visibility !== 'hidden' &&
                            state.sidebarStyles.overflow !== 'hidden';

      if (!sidebarVisible) {
        console.log('⚠️  WARNING: Sidebar appears to be cut off or hidden!');
      } else {
        console.log('✅ Sidebar appears to be fully visible');
      }
    }

    // Test toggle button
    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      await button.click();
      await page.waitForTimeout(500);

      state = await checkLayout('After first click');
      console.log('  ', JSON.stringify(state, null, 2));

      if (!state.sidebarExists) {
        console.log('✅ Sidebar closed successfully');
      } else {
        console.log('⚠️  WARNING: Sidebar still visible after closing');
      }

      console.log('\n🖱️  Clicking toggle button again...');
      await button.click();
      await page.waitForTimeout(500);

      state = await checkLayout('After second click');
      console.log('  ', JSON.stringify(state, null, 2));

      if (state.sidebarExists && state.hasRenataChat) {
        console.log('✅ Sidebar reopened successfully with Renata Chat');
      } else if (state.sidebarExists && !state.hasRenataChat) {
        console.log('⚠️  WARNING: Sidebar exists but Renata Chat component missing');
      } else {
        console.log('⚠️  WARNING: Sidebar did not reopen');
      }
    } else {
      console.log('❌ ERROR: Toggle button not found!');
    }

    console.log('\n✅ Test complete. Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testCalendarFixes().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
