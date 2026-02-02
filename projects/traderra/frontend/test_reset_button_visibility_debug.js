/**
 * Debug Reset Button Visibility
 * Specific test to see exactly what the user sees in the Renata chat header
 */

const { chromium } = require('playwright');

async function testResetButtonVisibilityDebug() {
  console.log('🔍 Debugging Reset Button Visibility...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Test on main dashboard page first
    console.log('📍 Testing DASHBOARD page (main page)...');
    await page.goto('http://localhost:6565/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug_dashboard_chat_header.png', fullPage: true });

    // Detailed inspection of Renata chat area
    const chatHeaderInfo = await page.evaluate(() => {
      // Look for chat components
      const chatContainers = document.querySelectorAll('[class*="chat"], [class*="renata"]');
      const brainIcons = document.querySelectorAll('svg[class*="Brain"], [class*="brain"]');

      // Look for any buttons in chat areas
      const chatButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const parent = btn.closest('[class*="chat"], [class*="renata"]');
        return !!parent;
      });

      // Look specifically for reset-related buttons
      const resetButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        return btn.title?.toLowerCase().includes('reset') ||
               btn.innerHTML?.includes('RotateCcw') ||
               btn.querySelector('[class*="rotate"], [class*="ccw"]') ||
               btn.getAttribute('title')?.includes('reset');
      });

      // Look for RotateCcw icons specifically
      const rotateCcwIcons = document.querySelectorAll('[class*="rotate"], [class*="ccw"], [data-icon*="rotate"]');

      return {
        chatContainersFound: chatContainers.length,
        brainIconsFound: brainIcons.length,
        chatButtonsFound: chatButtons.length,
        resetButtonsFound: resetButtons.length,
        rotateCcwIconsFound: rotateCcwIcons.length,
        chatButtons: chatButtons.map(btn => ({
          text: btn.textContent?.trim(),
          title: btn.title,
          className: btn.className,
          innerHTML: btn.innerHTML.substring(0, 100) // First 100 chars
        })),
        resetButtons: resetButtons.map(btn => ({
          text: btn.textContent?.trim(),
          title: btn.title,
          className: btn.className,
          visible: btn.offsetParent !== null,
          boundingRect: btn.getBoundingClientRect()
        }))
      };
    });

    console.log('🔍 DASHBOARD Chat Header Analysis:', JSON.stringify(chatHeaderInfo, null, 2));

    // Test on statistics page
    console.log('\n📍 Testing STATISTICS page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'debug_statistics_chat_header.png', fullPage: true });

    const statsHeaderInfo = await page.evaluate(() => {
      // Look for standalone chat vs regular chat
      const standaloneChats = document.querySelectorAll('[class*="standalone"]');
      const regularChats = document.querySelectorAll('[class*="chat"]:not([class*="standalone"])');

      // Look for reset buttons on stats page
      const resetButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        return btn.title?.toLowerCase().includes('reset') ||
               btn.innerHTML?.includes('RotateCcw') ||
               btn.querySelector('[class*="rotate"], [class*="ccw"]');
      });

      // Look for any brain icons with buttons nearby
      const brainAreas = Array.from(document.querySelectorAll('svg, [class*="brain"]')).map(brain => {
        const parent = brain.closest('div');
        if (parent) {
          const nearbyButtons = parent.querySelectorAll('button');
          return {
            brainElement: brain.tagName,
            parentClass: parent.className,
            nearbyButtonCount: nearbyButtons.length,
            buttons: Array.from(nearbyButtons).map(btn => ({
              text: btn.textContent?.trim(),
              title: btn.title,
              hasRotateIcon: !!btn.querySelector('[class*="rotate"], [class*="ccw"]')
            }))
          };
        }
        return null;
      }).filter(Boolean);

      return {
        standaloneChatsFound: standaloneChats.length,
        regularChatsFound: regularChats.length,
        resetButtonsFound: resetButtons.length,
        brainAreasWithButtons: brainAreas.length,
        brainAreas: brainAreas,
        resetButtons: resetButtons.map(btn => ({
          text: btn.textContent?.trim(),
          title: btn.title,
          visible: btn.offsetParent !== null
        }))
      };
    });

    console.log('🔍 STATISTICS Chat Header Analysis:', JSON.stringify(statsHeaderInfo, null, 2));

    // Look for common issues
    console.log('\n🔧 POTENTIAL ISSUES:');

    if (chatHeaderInfo.resetButtonsFound === 0) {
      console.log('❌ No reset buttons found on dashboard - button may not be rendered');
    }

    if (statsHeaderInfo.resetButtonsFound === 0) {
      console.log('❌ No reset buttons found on statistics - button may not be rendered');
    }

    if (chatHeaderInfo.chatButtonsFound === 0) {
      console.log('❌ No chat buttons found at all on dashboard - chat component may not be loaded');
    }

    // Test if the component files are actually being used
    const componentCheck = await page.evaluate(() => {
      // Check for specific class names that would indicate our components are loaded
      const dashboardChatClasses = [
        'studio-border', 'studio-text', 'studio-muted', 'renata'
      ];

      const standaloneClasses = [
        'standalone', 'bg-background', 'border-border'
      ];

      return {
        dashboardChatIndicators: dashboardChatClasses.some(cls =>
          document.querySelector(`[class*="${cls}"]`)
        ),
        standaloneChatIndicators: standaloneClasses.some(cls =>
          document.querySelector(`[class*="${cls}"]`)
        ),
        hasReactComponents: !!document.querySelector('[data-reactroot], [data-react-helmet]')
      };
    });

    console.log('🔧 Component Loading Check:', componentCheck);

    console.log('\n📸 Screenshots saved:');
    console.log('   - debug_dashboard_chat_header.png');
    console.log('   - debug_statistics_chat_header.png');

  } catch (error) {
    console.log('💥 Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testResetButtonVisibilityDebug().then(() => process.exit(0));
}

module.exports = { testResetButtonVisibilityDebug };