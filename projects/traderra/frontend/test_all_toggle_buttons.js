#!/usr/bin/env node

/**
 * Test all toggle buttons: $, R, G, N
 */

const { chromium } = require('playwright');

async function testAllToggleButtons() {
  console.log('🧪 Testing All Toggle Buttons ($, R, G, N)\n');

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔧') || text.includes('FLAT') || text.includes('Clicking')) {
        console.log(`  📝 ${text}`);
      }
    });

    console.log('📍 Navigating to http://localhost:6565/calendar');
    await page.goto('http://localhost:6565/calendar', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for initial load...');
    await page.waitForTimeout(3000);

    // Find all toggle buttons
    console.log('\n🔍 Looking for toggle buttons...');

    const buttonTests = [
      { label: '$', selectors: ['button[data-display-mode="dollar"]', 'button:has-text("$")'] },
      { label: 'R', selectors: ['button[data-display-mode="r"]', 'button:has-text("R")'] },
      { label: 'G', selectors: ['#pnl-mode-gross-button', 'button:has-text("G")'] },
      { label: 'N', selectors: ['#pnl-mode-net-button', 'button:has-text("N")'] }
    ];

    for (const test of buttonTests) {
      console.log(`\n🔍 Testing ${test.label} button:`);

      let buttons = [];
      for (const selector of test.selectors) {
        const found = await page.$$(selector);
        if (found.length > 0) {
          buttons = found;
          break;
        }
      }
      if (buttons.length > 0) {
        const button = buttons[0];
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();

        console.log(`   Button found: ${isVisible ? 'Visible' : 'Hidden'}, ${isEnabled ? 'Enabled' : 'Disabled'}`);

        if (isVisible && isEnabled) {
          // Get current active state
          const isActiveBefore = await button.evaluate(el => {
            return el.classList.contains('bg-[#B8860B]') ||
                   el.style.backgroundColor === 'rgb(184, 134, 11)' ||
                   el.getAttribute('data-active') === 'true';
          });

          console.log(`   Active before click: ${isActiveBefore}`);

          // Click the button
          await button.click();
          await page.waitForTimeout(500);

          // Check if state changed
          const isActiveAfter = await button.evaluate(el => {
            return el.classList.contains('bg-[#B8860B]') ||
                   el.style.backgroundColor === 'rgb(184, 134, 11)' ||
                   el.getAttribute('data-active') === 'true';
          });

          console.log(`   Active after click: ${isActiveAfter}`);

          if (isActiveAfter) {
            console.log(`   ✅ ${test.label} button is working!`);
          } else {
            console.log(`   ⚠️  ${test.label} button may not be working correctly`);
          }
        }
      } else {
        console.log(`   ❌ ${test.label} button not found`);
      }
    }

    // Count all toggle buttons found
    const allButtons = await page.evaluate(() => {
      const toggles = document.querySelectorAll('button[id*="mode"], button[data-display-mode], button[data-testid*="mode"]');
      return Array.from(toggles).map(btn => ({
        text: btn.textContent?.trim(),
        id: btn.id,
        dataDisplayMode: btn.getAttribute('data-display-mode'),
        dataTestid: btn.getAttribute('data-testid')
      }));
    });

    console.log('\n📊 All toggle buttons found on page:');
    allButtons.forEach(btn => {
      console.log(`   - "${btn.text}" (id: ${btn.id || 'none'}, mode: ${btn.dataDisplayMode || btn.dataTestid || 'none'})`);
    });

    console.log('\n✅ Test complete. Browser will stay open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAllToggleButtons().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
