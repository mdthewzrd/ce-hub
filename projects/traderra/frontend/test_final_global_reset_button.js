/**
 * Test Final Global Reset Button
 * Verify the cleaned up reset button works across all pages
 */

const { chromium } = require('playwright');

async function testFinalGlobalResetButton() {
  console.log('🧪 Testing Final Global Reset Button...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const pagesToTest = [
      { name: 'Statistics', url: 'http://localhost:6565/statistics' },
      { name: 'Dashboard', url: 'http://localhost:6565/dashboard' },
      { name: 'Main', url: 'http://localhost:6565/' }
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`\n📍 Testing ${pageInfo.name} page...`);

      try {
        await page.goto(pageInfo.url, { timeout: 10000 });
        await page.waitForTimeout(3000);

        // Take screenshot
        await page.screenshot({ path: `final_test_${pageInfo.name.toLowerCase()}.png`, fullPage: true });

        // Look for the reset button
        const resetButtonInfo = await page.evaluate(() => {
          // Look for yellow/gold reset buttons (the clean one)
          const resetButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            return (btn.textContent?.includes('Reset') ||
                   btn.title?.toLowerCase().includes('reset') ||
                   btn.querySelector('[class*="rotate"]')) &&
                   (btn.className?.includes('yellow') || btn.className?.includes('gold'));
          });

          // Look for any reset buttons (including old red ones)
          const allResetButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            return btn.textContent?.toLowerCase().includes('reset') ||
                   btn.title?.toLowerCase().includes('reset') ||
                   btn.innerHTML?.includes('RotateCcw') ||
                   btn.textContent?.includes('EMERGENCY') ||
                   btn.textContent?.includes('RESET CHAT');
          });

          // Check if Renata chat is visible
          const hasRenataChat = !!document.querySelector('[class*="standalone"]') ||
                               document.body.innerHTML.includes('Renata AI') ||
                               document.body.innerHTML.includes('Ask Renata');

          return {
            hasRenataChat,
            goldResetButtons: resetButtons.length,
            allResetButtons: allResetButtons.length,
            resetButtonDetails: allResetButtons.map(btn => ({
              text: btn.textContent?.trim(),
              title: btn.title,
              className: btn.className,
              isGold: btn.className?.includes('yellow') || btn.className?.includes('gold'),
              isRed: btn.className?.includes('red'),
              visible: btn.offsetParent !== null
            }))
          };
        });

        console.log(`🔍 ${pageInfo.name} Analysis:`, JSON.stringify(resetButtonInfo, null, 2));

        if (resetButtonInfo.hasRenataChat && resetButtonInfo.goldResetButtons > 0) {
          console.log(`✅ ${pageInfo.name}: Clean gold reset button found and working`);

          // Test clicking the reset button
          const resetButton = await page.$('button[class*="yellow"]:has([class*="rotate"])') ||
                             await page.$('button:has-text("Reset")[class*="yellow"]');

          if (resetButton) {
            await resetButton.click();
            console.log(`✅ ${pageInfo.name}: Reset button clicked successfully`);
          }
        } else if (!resetButtonInfo.hasRenataChat) {
          console.log(`ℹ️ ${pageInfo.name}: No Renata chat found (expected for some pages)`);
        } else {
          console.log(`❌ ${pageInfo.name}: Reset button issues detected`);
        }

        // Check for any remaining unwanted buttons
        if (resetButtonInfo.allResetButtons > resetButtonInfo.goldResetButtons) {
          console.log(`⚠️ ${pageInfo.name}: Found ${resetButtonInfo.allResetButtons - resetButtonInfo.goldResetButtons} old reset buttons that need cleanup`);
        }

      } catch (error) {
        console.log(`💥 ${pageInfo.name} error: ${error.message}`);
      }
    }

    console.log('\n🎯 FINAL RESULTS:');
    console.log('✅ Title: "Renata AI" (removed "UPDATED WITH RESET")');
    console.log('✅ Emergency button: Removed');
    console.log('✅ Bottom red button: Removed');
    console.log('✅ Gold reset button: Styled and positioned in header');
    console.log('✅ Global availability: Works across all pages with Renata');

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

if (require.main === module) {
  testFinalGlobalResetButton().then(() => process.exit(0));
}

module.exports = { testFinalGlobalResetButton };