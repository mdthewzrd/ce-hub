/**
 * DEBUG R BUTTON SPECIFIC ISSUE
 * Deep dive into why R button fails while $ button works perfectly
 */

const { chromium } = require('playwright');

async function debugRButtonSpecific() {
  console.log('🔍 DEBUG R BUTTON SPECIFIC - Deep investigation into R button failure');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(4000);

    console.log('📍 Starting R button specific investigation...');

    const investigation = await page.evaluate(async () => {
      console.log('🔧 Investigating R button vs $ button behavior...');

      const results = {
        initialState: null,
        dollarTestResult: null,
        rTestResult: null,
        componentStructure: null,
        contextDifferences: null
      };

      // STEP 1: Check initial state and context availability
      results.initialState = {
        displayModeContext: typeof window.displayModeContext,
        currentDisplayMode: window.displayModeContext ? window.displayModeContext.displayMode : 'undefined',
        setDisplayModeFunction: window.displayModeContext ? typeof window.displayModeContext.setDisplayMode : 'undefined',
        buttonsFound: {
          r: !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.trim() === 'R'),
          dollar: !!Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.trim() === '$')
        }
      };

      console.log('🎯 Initial state:', results.initialState);

      // STEP 2: Test $ button functionality (known working)
      console.log('💲 Testing $ button (control test)...');
      try {
        const beforeDollar = window.displayModeContext.displayMode;
        window.displayModeContext.setDisplayMode('dollar');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const afterDollar = window.displayModeContext.displayMode;

        const allButtons = Array.from(document.querySelectorAll('button'));
        const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');
        const dollarVisual = dollarBtn ? {
          classList: Array.from(dollarBtn.classList),
          hasActiveClass: dollarBtn.classList.contains('bg-[#B8860B]'),
          computedStyles: window.getComputedStyle(dollarBtn),
          dataAttributes: {
            active: dollarBtn.getAttribute('data-active'),
            displayMode: dollarBtn.getAttribute('data-display-mode')
          }
        } : null;

        results.dollarTestResult = {
          beforeContext: beforeDollar,
          afterContext: afterDollar,
          contextChanged: beforeDollar !== afterDollar,
          visualState: dollarVisual,
          success: afterDollar === 'dollar' && dollarVisual?.hasActiveClass
        };

        console.log('💲 $ Button test result:', results.dollarTestResult.success);
      } catch (error) {
        results.dollarTestResult = { error: error.message };
        console.log('❌ $ Button test error:', error.message);
      }

      // STEP 3: Test R button functionality (known failing)
      console.log('🎯 Testing R button (investigation)...');
      try {
        const beforeR = window.displayModeContext.displayMode;
        console.log('🔧 Before R call, displayMode:', beforeR);

        window.displayModeContext.setDisplayMode('r');
        console.log('🔧 Called setDisplayMode(\"r\")');

        await new Promise(resolve => setTimeout(resolve, 1500));
        const afterR = window.displayModeContext.displayMode;
        console.log('🔧 After R call, displayMode:', afterR);

        const allButtons = Array.from(document.querySelectorAll('button'));
        const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
        console.log('🔧 Found R button:', !!rBtn);

        const rVisual = rBtn ? {
          classList: Array.from(rBtn.classList),
          hasActiveClass: rBtn.classList.contains('bg-[#B8860B]'),
          computedStyles: {
            backgroundColor: window.getComputedStyle(rBtn).backgroundColor,
            color: window.getComputedStyle(rBtn).color
          },
          dataAttributes: {
            active: rBtn.getAttribute('data-active'),
            displayMode: rBtn.getAttribute('data-display-mode')
          },
          parentClasses: rBtn.parentElement ? Array.from(rBtn.parentElement.classList) : []
        } : null;

        console.log('🔧 R button visual state:', rVisual);

        results.rTestResult = {
          beforeContext: beforeR,
          afterContext: afterR,
          contextChanged: beforeR !== afterR,
          visualState: rVisual,
          success: afterR === 'r' && rVisual?.hasActiveClass
        };

        console.log('🎯 R Button test result:', results.rTestResult.success);
        console.log('🎯 Context changed:', results.rTestResult.contextChanged);
        console.log('🎯 Visual active:', rVisual?.hasActiveClass);

      } catch (error) {
        results.rTestResult = { error: error.message };
        console.log('❌ R Button test error:', error.message);
      }

      // STEP 4: Analyze component structure differences
      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
      const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');

      results.componentStructure = {
        rButton: rBtn ? {
          outerHTML: rBtn.outerHTML,
          onClick: rBtn.onclick ? 'has onclick' : 'no onclick',
          parentHTML: rBtn.parentElement?.outerHTML.substring(0, 200) + '...'
        } : null,
        dollarButton: dollarBtn ? {
          outerHTML: dollarBtn.outerHTML,
          onClick: dollarBtn.onclick ? 'has onclick' : 'no onclick',
          parentHTML: dollarBtn.parentElement?.outerHTML.substring(0, 200) + '...'
        } : null
      };

      // STEP 5: Check for context differences or state management issues
      results.contextDifferences = {
        validDisplayModes: ['dollar', 'r'],
        currentMode: window.displayModeContext?.displayMode,
        contextUpdates: 'Will test direct calls...',
        localStorage: (() => {
          try {
            return localStorage.getItem('traderra_display_mode');
          } catch (e) {
            return 'Error reading localStorage';
          }
        })()
      };

      return results;
    });

    console.log('\n🔬 === R BUTTON INVESTIGATION RESULTS ===');
    console.log('========================================');

    console.log('\n📊 Initial State:');
    console.log(`  Display Mode Context: ${investigation.initialState.displayModeContext}`);
    console.log(`  Current Display Mode: ${investigation.initialState.currentDisplayMode}`);
    console.log(`  setDisplayMode Function: ${investigation.initialState.setDisplayModeFunction}`);
    console.log(`  R Button Found: ${investigation.initialState.buttonsFound.r ? '✅' : '❌'}`);
    console.log(`  $ Button Found: ${investigation.initialState.buttonsFound.dollar ? '✅' : '❌'}`);

    console.log('\n💲 $ Button Test (Control):');
    if (investigation.dollarTestResult.error) {
      console.log(`  ❌ Error: ${investigation.dollarTestResult.error}`);
    } else {
      console.log(`  Context Update: ${investigation.dollarTestResult.contextChanged ? '✅' : '❌'}`);
      console.log(`  Visual Active: ${investigation.dollarTestResult.visualState?.hasActiveClass ? '✅' : '❌'}`);
      console.log(`  Overall Success: ${investigation.dollarTestResult.success ? '✅' : '❌'}`);
    }

    console.log('\n🎯 R Button Test (Investigation):');
    if (investigation.rTestResult.error) {
      console.log(`  ❌ Error: ${investigation.rTestResult.error}`);
    } else {
      console.log(`  Before Context: ${investigation.rTestResult.beforeContext}`);
      console.log(`  After Context: ${investigation.rTestResult.afterContext}`);
      console.log(`  Context Update: ${investigation.rTestResult.contextChanged ? '✅' : '❌'}`);
      console.log(`  Visual Active: ${investigation.rTestResult.visualState?.hasActiveClass ? '✅' : '❌'}`);
      console.log(`  Overall Success: ${investigation.rTestResult.success ? '✅' : '❌'}`);

      if (investigation.rTestResult.visualState) {
        console.log(`  R Button Classes: [${investigation.rTestResult.visualState.classList.join(', ')}]`);
        console.log(`  Background Color: ${investigation.rTestResult.visualState.computedStyles.backgroundColor}`);
        console.log(`  Data Active: ${investigation.rTestResult.visualState.dataAttributes.active}`);
      }
    }

    console.log('\n🎯 DIAGNOSIS:');
    const dollarWorks = investigation.dollarTestResult.success;
    const rWorks = investigation.rTestResult.success;
    const contextChanges = investigation.rTestResult.contextChanged;

    if (dollarWorks && !rWorks) {
      if (!contextChanges) {
        console.log('  🔍 ISSUE: R context state is not updating when setDisplayMode(\"r\") is called');
        console.log('  💡 LIKELY CAUSE: Invalid value \"r\" or context state management issue');
      } else {
        console.log('  🔍 ISSUE: R context updates but component does not re-render with correct visual state');
        console.log('  💡 LIKELY CAUSE: Component re-rendering or CSS styling issue for R mode');
      }
    }

    await page.screenshot({ path: 'r_button_specific_debug.png', fullPage: true });

    return { dollarWorks, rWorks, contextChanges };

  } catch (error) {
    console.error('💥 R button debug error:', error);
    return { dollarWorks: false, rWorks: false, contextChanges: false };
  } finally {
    await browser.close();
  }
}

debugRButtonSpecific().then(({ dollarWorks, rWorks, contextChanges }) => {
  console.log(`\n🏁 R BUTTON SPECIFIC DEBUG COMPLETE`);
  console.log(`  $ Button Works: ${dollarWorks ? '✅' : '❌'}`);
  console.log(`  R Button Works: ${rWorks ? '✅' : '❌'}`);
  console.log(`  R Context Changes: ${contextChanges ? '✅' : '❌'}`);

  if (dollarWorks && !rWorks) {
    console.log('\n🎯 CONCLUSION: R button has specific issues compared to $ button');
  }

  process.exit(rWorks ? 0 : 1);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});