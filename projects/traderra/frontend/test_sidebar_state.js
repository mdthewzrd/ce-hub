#!/usr/bin/env node

/**
 * Detailed Test for Renata Sidebar State
 * Check if the toggle button is actually working and if state is updating
 */

const { chromium } = require('playwright');

async function testSidebarState() {
  console.log('🧪 Detailed Sidebar State Test\n');
  console.log('='.repeat(70));

  let browser;
  let page;

  try {
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (text.includes('sidebar') || text.includes('Sidebar') || text.includes('toggle') || text.includes('state')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('\n📍 Navigating to http://localhost:6565/trades');
    await page.goto('http://localhost:6565/trades', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check initial sidebar state
    console.log('\n🔍 Checking initial sidebar state...');

    // Check if sidebar element exists
    const sidebarExists = await page.$('.fixed.right-0.top-16') !== null;
    console.log(`  Sidebar element exists: ${sidebarExists ? 'YES' : 'NO'}`);

    // Check if sidebar is visible (not just exists in DOM)
    const sidebarVisible = await page.evaluate(() => {
      const sidebar = document.querySelector('.fixed.right-0.top-16');
      if (!sidebar) return false;
      const style = window.getComputedStyle(sidebar);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    console.log(`  Sidebar is visible: ${sidebarVisible ? 'YES' : 'NO'}`);

    // Check the toggle button state
    const buttonActive = await page.evaluate(() => {
      const button = document.querySelector('[data-testid="renata-ai-toggle-button"]');
      if (!button) return null;
      const classList = Array.from(button.classList);
      return {
        text: button.textContent,
        classList: classList,
        hasPrimaryBg: classList.some(c => c.includes('bg-primary')),
        hasStudioMuted: classList.some(c => c.includes('studio-muted')),
      };
    });
    console.log(`  Toggle button state:`, buttonActive);

    // Check localStorage for sidebar state
    const localStorageState = await page.evaluate(() => {
      try {
        const prefs = localStorage.getItem('traderra_chat_preferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          return parsed.isSidebarOpen;
        }
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
      return null;
    });
    console.log(`  localStorage isSidebarOpen: ${localStorageState}`);

    // Check React context state (by inspecting __REACT__ internals)
    const reactState = await page.evaluate(() => {
      const sidebarElement = document.querySelector('.fixed.right-0.top-16');
      if (!sidebarElement) return null;

      // Try to get React Fiber node
      const fiberKey = Object.keys(sidebarElement).find(key => key.startsWith('__reactFiber'));
      if (!fiberKey) return null;

      const fiber = sidebarElement[fiberKey];
      return {
        hasFiber: !!fiber,
        fiberType: fiber?.type?.name || fiber?.elementType?.name || 'unknown',
      };
    });
    console.log(`  React fiber info:`, reactState);

    // Now try clicking the toggle button
    console.log('\n🖱️  Clicking toggle button...');
    const button = await page.$('[data-testid="renata-ai-toggle-button"]');
    if (button) {
      // Record state before click
      const beforeState = {
        sidebarExists: await page.$('.fixed.right-0.top-16') !== null,
        localStorage: await page.evaluate(() => {
          try {
            const prefs = JSON.parse(localStorage.getItem('traderra_chat_preferences') || '{}');
            return prefs.isSidebarOpen;
          } catch (e) { return null; }
        }),
      };
      console.log('  State before click:', beforeState);

      await button.click();
      await page.waitForTimeout(500);

      // Check state after click
      const afterState = {
        sidebarExists: await page.$('.fixed.right-0.top-16') !== null,
        sidebarVisible: await page.evaluate(() => {
          const sidebar = document.querySelector('.fixed.right-0.top-16');
          if (!sidebar) return false;
          const style = window.getComputedStyle(sidebar);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }),
        localStorage: await page.evaluate(() => {
          try {
            const prefs = JSON.parse(localStorage.getItem('traderra_chat_preferences') || '{}');
            return prefs.isSidebarOpen;
          } catch (e) { return null; }
        }),
        buttonClass: await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="renata-ai-toggle-button"]');
          return btn ? Array.from(btn.classList) : null;
        }),
      };
      console.log('  State after click:', afterState);

      await page.screenshot({ path: 'sidebar_after_first_click.png' });

      // Click again
      console.log('\n🖱️  Clicking toggle button again...');
      await button.click();
      await page.waitForTimeout(500);

      const afterSecondClick = {
        sidebarExists: await page.$('.fixed.right-0.top-16') !== null,
        sidebarVisible: await page.evaluate(() => {
          const sidebar = document.querySelector('.fixed.right-0.top-16');
          if (!sidebar) return false;
          const style = window.getComputedStyle(sidebar);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }),
      };
      console.log('  State after second click:', afterSecondClick);

      await page.screenshot({ path: 'sidebar_after_second_click.png' });
    }

    // Check for errors
    console.log('\n🔍 Checking for errors...');
    const errors = consoleMessages.filter(m => m.type === 'error');
    if (errors.length > 0) {
      console.log(`  Found ${errors.length} console errors:`);
      errors.slice(0, 10).forEach(err => console.log(`    - ${err.text}`));
    } else {
      console.log('  No console errors found');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🔍 Keeping browser open for 20 seconds for manual inspection');
    console.log('='.repeat(70));
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);

    if (page) {
      await page.screenshot({ path: 'sidebar_test_error.png' });
      console.log('📸 Error screenshot saved: sidebar_test_error.png');
    }

    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run test
testSidebarState().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
