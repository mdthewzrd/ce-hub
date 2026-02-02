/**
 * DIRECT CONTEXT FUNCTION TEST
 * Test calling setDisplayMode directly via window.displayModeContext
 */

const { chromium } = require('playwright');

async function directContextFunctionTest() {
  console.log('🔧 DIRECT CONTEXT FUNCTION TEST - Testing setDisplayMode directly');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    console.log('📍 Testing direct context function calls...');

    const testResult = await page.evaluate(async () => {
      console.log('🔧 Testing direct setDisplayMode function calls...');

      // Check initial state
      const initialState = {
        hasContext: typeof window.displayModeContext !== 'undefined',
        contextDisplayMode: window.displayModeContext ? window.displayModeContext.displayMode : 'unknown',
        contextSetFunction: window.displayModeContext ? typeof window.displayModeContext.setDisplayMode : 'undefined'
      };

      console.log('📊 Initial state:', initialState);

      if (!window.displayModeContext) {
        return {
          error: 'Context not available',
          initialState
        };
      }

      if (typeof window.displayModeContext.setDisplayMode !== 'function') {
        return {
          error: 'setDisplayMode is not a function',
          initialState
        };
      }

      // Test 1: Call setDisplayMode('r') directly
      console.log('🔧 Test 1: Calling window.displayModeContext.setDisplayMode("r")...');
      try {
        window.displayModeContext.setDisplayMode('r');
        console.log('✅ setDisplayMode("r") called without error');
      } catch (error) {
        console.log('❌ setDisplayMode("r") error:', error.message);
        return {
          error: 'setDisplayMode("r") threw error: ' + error.message,
          initialState
        };
      }

      // Wait for potential state update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check state after R call
      const afterRState = {
        contextDisplayMode: window.displayModeContext.displayMode,
        visualRActive: (() => {
          const allButtons = Array.from(document.querySelectorAll('button'));
          const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');
          return rBtn ? rBtn.classList.contains('bg-[#B8860B]') : false;
        })()
      };

      console.log('📊 After R call:', afterRState);

      // Test 2: Call setDisplayMode('dollar') directly
      console.log('🔧 Test 2: Calling window.displayModeContext.setDisplayMode("dollar")...');
      try {
        window.displayModeContext.setDisplayMode('dollar');
        console.log('✅ setDisplayMode("dollar") called without error');
      } catch (error) {
        console.log('❌ setDisplayMode("dollar") error:', error.message);
        return {
          error: 'setDisplayMode("dollar") threw error: ' + error.message,
          initialState,
          afterRState
        };
      }

      // Wait for potential state update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check final state
      const finalState = {
        contextDisplayMode: window.displayModeContext.displayMode,
        visualDollarActive: (() => {
          const allButtons = Array.from(document.querySelectorAll('button'));
          const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');
          return dollarBtn ? dollarBtn.classList.contains('bg-[#B8860B]') : false;
        })()
      };

      console.log('📊 Final state:', finalState);

      return {
        success: true,
        initialState,
        afterRState,
        finalState,
        tests: {
          contextFunctionWorks: true,
          rModeContextUpdated: afterRState.contextDisplayMode === 'r',
          rModeVisualUpdated: afterRState.visualRActive,
          dollarModeContextUpdated: finalState.contextDisplayMode === 'dollar',
          dollarModeVisualUpdated: finalState.visualDollarActive
        }
      };
    });

    console.log('\n🏆 DIRECT CONTEXT FUNCTION TEST RESULTS');
    console.log('==========================================');

    if (testResult.error) {
      console.log(`❌ Error: ${testResult.error}`);
      return false;
    }

    console.log(`✅ Context Available: ${testResult.initialState.hasContext}`);
    console.log(`✅ setDisplayMode Function Available: ${testResult.initialState.contextSetFunction === 'function'}`);
    console.log(`\n📊 Test Results:`);
    console.log(`   R Mode Context Update: ${testResult.tests.rModeContextUpdated ? '✅' : '❌'}`);
    console.log(`   R Mode Visual Update: ${testResult.tests.rModeVisualUpdated ? '✅' : '❌'}`);
    console.log(`   $ Mode Context Update: ${testResult.tests.dollarModeContextUpdated ? '✅' : '❌'}`);
    console.log(`   $ Mode Visual Update: ${testResult.tests.dollarModeVisualUpdated ? '✅' : '❌'}`);

    const allPass = testResult.tests.rModeContextUpdated &&
                   testResult.tests.rModeVisualUpdated &&
                   testResult.tests.dollarModeContextUpdated &&
                   testResult.tests.dollarModeVisualUpdated;

    console.log(`\n🎯 OVERALL RESULT: ${allPass ? 'DIRECT CONTEXT CALLS WORK ✅' : 'DIRECT CONTEXT CALLS HAVE ISSUES ❌'}`);

    if (!allPass) {
      console.log('\n🔍 DIAGNOSIS:');
      if (testResult.tests.rModeContextUpdated && !testResult.tests.rModeVisualUpdated) {
        console.log('   - Context state updates but visual state does not');
        console.log('   - Issue: Component rendering or CSS styling problem');
      } else if (!testResult.tests.rModeContextUpdated) {
        console.log('   - Context state does not update');
        console.log('   - Issue: setDisplayMode function or context state management problem');
      }
    }

    await page.screenshot({ path: 'direct_context_test_result.png', fullPage: true });

    return allPass;

  } catch (error) {
    console.error('💥 Direct context test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

directContextFunctionTest().then(success => {
  console.log(`\n🏁 DIRECT CONTEXT TEST: ${success ? 'CONTEXT FUNCTIONS WORKING' : 'CONTEXT FUNCTIONS FAILING'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});