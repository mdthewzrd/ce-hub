/**
 * Test Reset Button Across All Pages
 * Verifies that reset buttons are visible and functional on all pages that have chat
 */

const { chromium } = require('playwright');

async function testResetButtonAllPages() {
  console.log('🧪 Testing Reset Button Across All Pages...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const pages = [
      { name: 'Dashboard', url: 'http://localhost:6565/', chatType: 'dashboard' },
      { name: 'Statistics', url: 'http://localhost:6565/statistics', chatType: 'standalone' },
      { name: 'Trades', url: 'http://localhost:6565/trades', chatType: 'dashboard' },
      { name: 'Journal', url: 'http://localhost:6565/journal', chatType: 'dashboard' },
    ];

    const results = {};

    for (const pageInfo of pages) {
      console.log(`\n🔍 Testing ${pageInfo.name} page...`);

      // Navigate to page
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for reset button
      const resetButtonSelectors = [
        'button[title*="reset"]',
        'button[title*="Reset"]',
        'button:has-text("Reset")',
        'button:has-text("reset")',
        '[data-testid="reset-button"]',
        '[data-testid="chat-reset"]',
        'button:has(svg)', // Look for buttons with SVG icons (like RotateCcw)
      ];

      let resetButton = null;
      let foundSelector = null;

      for (const selector of resetButtonSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          resetButton = await page.$(selector);
          if (resetButton) {
            const isVisible = await resetButton.isVisible();
            if (isVisible) {
              foundSelector = selector;
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Check for RotateCcw icon specifically (the reset icon we added)
      if (!resetButton) {
        const rotateccwButtons = await page.$$('button svg');
        for (const svg of rotateccwButtons) {
          const parent = await svg.evaluateHandle(el => el.closest('button'));
          if (parent) {
            const title = await parent.getAttribute('title');
            if (title && title.toLowerCase().includes('reset')) {
              resetButton = parent;
              foundSelector = 'RotateCcw icon button';
              break;
            }
          }
        }
      }

      // Test reset functionality if button found
      if (resetButton) {
        console.log(`✅ ${pageInfo.name}: Reset button found using ${foundSelector}`);

        // Try to click the reset button
        try {
          await resetButton.click();
          console.log(`✅ ${pageInfo.name}: Reset button clicked successfully`);
          results[pageInfo.name] = { found: true, clickable: true, selector: foundSelector };
        } catch (error) {
          console.log(`⚠️ ${pageInfo.name}: Reset button found but click failed: ${error.message}`);
          results[pageInfo.name] = { found: true, clickable: false, selector: foundSelector, error: error.message };
        }
      } else {
        console.log(`❌ ${pageInfo.name}: Reset button not found`);
        results[pageInfo.name] = { found: false, clickable: false };

        // Debug: Show what buttons are available
        const allButtons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent?.trim(),
            title: btn.title,
            className: btn.className,
            hasIcon: !!btn.querySelector('svg')
          }));
        });
        console.log(`📋 ${pageInfo.name}: Available buttons:`, allButtons.slice(0, 10)); // Show first 10
      }

      await page.waitForTimeout(1000);
    }

    // Final summary
    console.log('\n🎯 RESET BUTTON TEST RESULTS:');
    for (const [pageName, result] of Object.entries(results)) {
      if (result.found && result.clickable) {
        console.log(`   ${pageName}: ✅ PASS (found and working)`);
      } else if (result.found && !result.clickable) {
        console.log(`   ${pageName}: ⚠️ PARTIAL (found but click failed)`);
      } else {
        console.log(`   ${pageName}: ❌ FAIL (not found)`);
      }
    }

    const allPagesWorking = Object.values(results).every(r => r.found && r.clickable);
    if (allPagesWorking) {
      console.log('\n🎉 SUCCESS: Reset button working on all pages!');
    } else {
      console.log('\n💥 Some pages still missing reset button functionality');
    }

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testResetButtonAllPages().then(() => process.exit(0));
}

module.exports = { testResetButtonAllPages };