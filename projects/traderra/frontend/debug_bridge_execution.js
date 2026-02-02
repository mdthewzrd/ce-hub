/**
 * Debug Bridge Execution Test
 * Tests if the global bridge is properly receiving events
 */

const { chromium } = require('playwright');

async function debugBridgeExecution() {
  console.log('🔍 Debug Bridge Execution Test Starting...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to statistics page
    console.log('📍 Navigating to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForLoadState('networkidle');

    // Check if global bridge is loaded
    console.log('🔧 Checking global bridge status...');
    const bridgeStatus = await page.evaluate(() => {
      return {
        bridgeLoaded: typeof window.traderraExecuteActions === 'function',
        eventListenerRegistered: !!window.addEventListener,
        globalBridgeExists: !!window.traderraBridge
      };
    });

    console.log('🔧 Bridge status:', bridgeStatus);

    // Manually trigger event and check console
    console.log('🧪 Testing manual event dispatch...');
    const testResult = await page.evaluate(() => {
      console.log('🧪 MANUAL TEST: About to dispatch traderra-actions event');

      const actions = [{
        type: 'setDateRange',
        payload: { range: 'year' },
        timestamp: Date.now()
      }];

      try {
        // Try custom event dispatch
        window.dispatchEvent(new CustomEvent('traderra-actions', {
          detail: actions
        }));
        console.log('🧪 MANUAL TEST: Custom event dispatched successfully');

        // Also try direct function call if available
        if (window.traderraExecuteActions) {
          window.traderraExecuteActions(actions);
          console.log('🧪 MANUAL TEST: Direct function call executed');
        } else {
          console.log('🧪 MANUAL TEST: traderraExecuteActions not available');
        }

        return { success: true, message: 'Events dispatched' };
      } catch (error) {
        console.log('🧪 MANUAL TEST: Error dispatching events:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('🧪 Manual test result:', testResult);

    // Wait and check for any state changes
    await page.waitForTimeout(2000);

    // Check final state
    console.log('📊 Checking final component states...');
    const finalState = await page.evaluate(() => {
      const ytdButton = document.querySelector('[data-testid="date-range-year"]');
      const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

      return {
        ytdActive: ytdButton ? ytdButton.getAttribute('data-active') : 'not found',
        dollarActive: dollarButton ? dollarButton.getAttribute('data-active') : 'not found',
        ytdExists: !!ytdButton,
        dollarExists: !!dollarButton
      };
    });

    console.log('📊 Final state:', finalState);

    await page.screenshot({ path: 'debug-bridge-test.png' });
    console.log('✅ Debug test completed - check debug-bridge-test.png');

  } catch (error) {
    console.log('💥 Debug test error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugBridgeExecution().then(() => process.exit(0));
}

module.exports = { debugBridgeExecution };