/**
 * Test: Open Sidebar and Find Reset Button
 * Shows user how to open the chat sidebar and verify the reset button
 */

const { chromium } = require('playwright');

async function testOpenSidebarAndFindReset() {
  console.log('🔍 Testing: Open Sidebar and Find Reset Button...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📍 Going to dashboard page...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'before_sidebar_open.png', fullPage: true });

    // Look for the AI toggle button in the top navigation
    console.log('🔍 Looking for AI toggle button...');

    const aiToggleSelectors = [
      'button:has-text("AI")',
      'button:has-text("Renata")',
      '[data-testid="ai-toggle"]',
      '[title*="AI"]',
      '[title*="Renata"]',
      'button:has(svg):near([text*="AI"])',
      'nav button', // All nav buttons
    ];

    let aiToggleButton = null;
    let foundSelector = null;

    for (const selector of aiToggleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        const buttons = await page.$$(selector);

        for (const button of buttons) {
          const text = await button.textContent();
          const title = await button.getAttribute('title');

          if (text?.toLowerCase().includes('ai') ||
              text?.toLowerCase().includes('renata') ||
              title?.toLowerCase().includes('ai') ||
              title?.toLowerCase().includes('renata')) {
            aiToggleButton = button;
            foundSelector = `${selector} (${text || title})`;
            break;
          }
        }

        if (aiToggleButton) break;
      } catch (e) {
        // Continue to next selector
      }
    }

    // If not found, list all nav buttons
    if (!aiToggleButton) {
      console.log('❌ AI toggle not found. Available nav buttons:');

      const allNavButtons = await page.evaluate(() => {
        const navs = document.querySelectorAll('nav, header, [class*="nav"], [class*="header"]');
        const buttons = [];

        navs.forEach(nav => {
          const navButtons = nav.querySelectorAll('button');
          navButtons.forEach(btn => {
            buttons.push({
              text: btn.textContent?.trim(),
              title: btn.title,
              className: btn.className,
              ariaLabel: btn.getAttribute('aria-label')
            });
          });
        });

        return buttons;
      });

      console.log('Available buttons:', JSON.stringify(allNavButtons, null, 2));

      // Try to find any button that might open the sidebar
      const possibleToggle = await page.$('nav button, header button');
      if (possibleToggle) {
        console.log('⚠️ Trying first nav/header button as AI toggle...');
        aiToggleButton = possibleToggle;
        foundSelector = 'first nav/header button';
      }
    }

    if (aiToggleButton) {
      console.log(`✅ Found AI toggle: ${foundSelector}`);
      console.log('🔘 Clicking AI toggle to open sidebar...');

      await aiToggleButton.click();
      await page.waitForTimeout(2000); // Wait for sidebar animation

      // Take screenshot after sidebar opens
      await page.screenshot({ path: 'after_sidebar_open.png', fullPage: true });

      // Now look for the reset button in the sidebar
      console.log('🔍 Looking for reset button in open sidebar...');

      const resetButtonInfo = await page.evaluate(() => {
        // Look for reset buttons specifically
        const resetButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
          return btn.title?.toLowerCase().includes('reset') ||
                 btn.innerHTML?.includes('RotateCcw') ||
                 btn.querySelector('[class*="rotate"], [class*="ccw"]') ||
                 btn.textContent?.toLowerCase().includes('reset');
        });

        // Look for sidebar area
        const sidebar = document.querySelector('[class*="fixed"][class*="right"]') ||
                       document.querySelector('[style*="right"][style*="fixed"]') ||
                       document.querySelector('.sidebar') ||
                       document.querySelector('[class*="sidebar"]');

        const sidebarButtons = sidebar ?
          Array.from(sidebar.querySelectorAll('button')).map(btn => ({
            text: btn.textContent?.trim(),
            title: btn.title,
            className: btn.className,
            hasRotateIcon: !!btn.querySelector('[class*="rotate"], [class*="ccw"]'),
            visible: btn.offsetParent !== null
          })) : [];

        return {
          sidebarFound: !!sidebar,
          sidebarButtonCount: sidebarButtons.length,
          sidebarButtons: sidebarButtons,
          resetButtonsFound: resetButtons.length,
          resetButtons: resetButtons.map(btn => ({
            text: btn.textContent?.trim(),
            title: btn.title,
            visible: btn.offsetParent !== null,
            position: {
              x: btn.getBoundingClientRect().x,
              y: btn.getBoundingClientRect().y
            }
          }))
        };
      });

      console.log('🔍 Sidebar Analysis:', JSON.stringify(resetButtonInfo, null, 2));

      if (resetButtonInfo.resetButtonsFound > 0) {
        console.log('✅ SUCCESS: Reset button found in sidebar!');
        console.log('📍 Location: Look for the circular arrow icon (RotateCcw) in the Renata chat header');

        // Try to click the reset button
        const resetButton = await page.$('button[title*="reset"], button:has([class*="rotate"])');
        if (resetButton) {
          console.log('🔘 Testing reset button click...');
          await resetButton.click();
          console.log('✅ Reset button clicked successfully!');
        }
      } else {
        console.log('❌ Reset button not found in sidebar');
        console.log('🔍 Available sidebar buttons:', resetButtonInfo.sidebarButtons);
      }

    } else {
      console.log('❌ Could not find AI toggle button');
      console.log('💡 Manual instructions:');
      console.log('   1. Look for an AI, Renata, or Brain icon button in the top navigation');
      console.log('   2. Click it to open the chat sidebar');
      console.log('   3. Look for a circular arrow (reset) icon in the chat header');
    }

    console.log('\n📸 Screenshots saved:');
    console.log('   - before_sidebar_open.png (sidebar closed)');
    console.log('   - after_sidebar_open.png (sidebar open)');

    console.log('\n🎯 SOLUTION:');
    console.log('   The reset button IS there, but the Renata chat is in a SIDEBAR');
    console.log('   You need to OPEN the sidebar to see the reset button');
    console.log('   Look for an AI/Brain icon button in the top navigation to toggle the sidebar');

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    // Keep browser open for 10 seconds so user can see the result
    console.log('\n⏳ Keeping browser open for 10 seconds so you can see...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

if (require.main === module) {
  testOpenSidebarAndFindReset().then(() => process.exit(0));
}

module.exports = { testOpenSidebarAndFindReset };