/**
 * DEBUG DISPLAY MODE CONTEXT STATE MANAGEMENT
 * Check if the context properly handles 'r' value or reverts it
 */

const { chromium } = require('playwright');

async function debugDisplayModeContextState() {
  console.log('🔍 DEBUG DISPLAY MODE CONTEXT STATE - Checking context state management');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(4000);

    console.log('📍 Starting context state management investigation...');

    const investigation = await page.evaluate(async () => {
      console.log('🔧 Testing DisplayModeContext state management...');

      const results = {
        contextAvailable: false,
        initialState: null,
        stateChanges: [],
        localStorage: null,
        finalState: null
      };

      if (!window.displayModeContext) {
        return { error: 'DisplayModeContext not available on window object' };
      }

      results.contextAvailable = true;

      // STEP 1: Record initial state
      results.initialState = {
        displayMode: window.displayModeContext.displayMode,
        timestamp: Date.now()
      };
      console.log('🔧 Initial state:', results.initialState);

      // STEP 2: Check localStorage
      try {
        results.localStorage = {
          beforeChange: localStorage.getItem('traderra_display_mode'),
          timestamp: Date.now()
        };
        console.log('🔧 Initial localStorage:', results.localStorage.beforeChange);
      } catch (e) {
        results.localStorage = { error: e.message };
      }

      // STEP 3: Monitor state changes over time
      const monitorState = () => ({
        displayMode: window.displayModeContext.displayMode,
        timestamp: Date.now()
      });

      // Record state before change
      results.stateChanges.push({
        action: 'BEFORE_CHANGE',
        state: monitorState()
      });

      // STEP 4: Set to 'r' and monitor state every 100ms for 3 seconds
      console.log('🔧 Setting displayMode to "r"...');
      window.displayModeContext.setDisplayMode('r');
      results.stateChanges.push({
        action: 'IMMEDIATELY_AFTER_CALL',
        state: monitorState()
      });

      // Monitor state changes over time to see if it reverts
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentState = monitorState();
        results.stateChanges.push({
          action: `AFTER_${(i + 1) * 100}MS`,
          state: currentState
        });
      }

      // STEP 5: Check localStorage after change
      try {
        results.localStorage.afterChange = localStorage.getItem('traderra_display_mode');
        console.log('🔧 Final localStorage:', results.localStorage.afterChange);
      } catch (e) {
        results.localStorage.afterError = e.message;
      }

      // STEP 6: Final state
      results.finalState = monitorState();

      return results;
    });

    console.log('\n🔬 === CONTEXT STATE MANAGEMENT RESULTS ===');
    console.log('==========================================');

    if (investigation.error) {
      console.log(`❌ Error: ${investigation.error}`);
      return false;
    }

    console.log(`\n📊 Context Available: ${investigation.contextAvailable ? '✅' : '❌'}`);
    console.log(`📊 Initial State: ${investigation.initialState.displayMode}`);
    console.log(`📊 Final State: ${investigation.finalState.displayMode}`);

    console.log('\n💾 LocalStorage:');
    console.log(`  Before Change: ${investigation.localStorage.beforeChange}`);
    console.log(`  After Change: ${investigation.localStorage.afterChange}`);

    console.log('\n📈 State Changes Timeline:');
    investigation.stateChanges.forEach((change, index) => {
      if (index === 0 || change.state.displayMode !== investigation.stateChanges[index - 1].state.displayMode) {
        console.log(`  ${change.action}: ${change.state.displayMode}`);
      }
    });

    // Analysis
    const stateStable = investigation.finalState.displayMode === 'r';
    const stateReverted = investigation.stateChanges.some(change =>
      change.state.displayMode === 'r' &&
      investigation.finalState.displayMode !== 'r'
    );

    console.log('\n🔍 ANALYSIS:');
    if (stateStable) {
      console.log('  ✅ State remains stable as "r" - Context state management is working');
      console.log('  💡 Issue is likely in component re-rendering, not context state');
    } else if (stateReverted) {
      console.log('  ❌ State reverted from "r" to something else - Context state management issue');
      console.log('  💡 Context is not properly maintaining the "r" state');
    } else {
      console.log('  ❌ State never changed to "r" - setDisplayMode call failed');
      console.log('  💡 setDisplayMode function is not working for "r" value');
    }

    await page.screenshot({ path: 'displaymode_context_debug.png', fullPage: true });

    return stateStable;

  } catch (error) {
    console.error('💥 Context debug error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

debugDisplayModeContextState().then(success => {
  console.log(`\n🏁 CONTEXT STATE MANAGEMENT DEBUG: ${success ? 'CONTEXT WORKING ✅' : 'CONTEXT ISSUES ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});