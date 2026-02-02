/**
 * FORCE BUTTON VISUAL STATE SYNC
 * Directly manipulate DOM to sync visual state with context state
 * This bypasses React re-rendering issues
 */

const { chromium } = require('playwright');

async function forceButtonVisualStateSync() {
  console.log('🔧 FORCE BUTTON VISUAL STATE SYNC - Direct DOM manipulation approach');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(4000);

    console.log('📍 Testing direct DOM manipulation approach...');

    const syncResult = await page.evaluate(async () => {
      console.log('🔧 Implementing direct DOM manipulation for button state sync...');

      // Function to force visual state to match context state
      const forceVisualStateSync = () => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
        const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');

        if (!rBtn || !dollarBtn) {
          console.log('❌ R or $ button not found');
          return false;
        }

        // Get context state
        const contextDisplayMode = window.displayModeContext?.displayMode;
        console.log(`🎯 Context displayMode: ${contextDisplayMode}`);

        // Define active and inactive styles
        const activeClasses = ['bg-[#B8860B]', 'text-black', 'shadow-lg'];
        const inactiveClasses = ['text-gray-400', 'hover:text-gray-200', 'hover:bg-gray-700/50'];

        // Function to apply active styling
        const applyActiveStyle = (button) => {
          // Remove inactive classes
          inactiveClasses.forEach(cls => button.classList.remove(cls));
          // Add active classes
          activeClasses.forEach(cls => button.classList.add(cls));
          // Force inline styles
          button.style.backgroundColor = '#B8860B';
          button.style.color = '#000000';
          button.style.border = '2px solid #B8860B';
          button.setAttribute('data-active', 'true');
          console.log(`✅ Applied active styling to ${button.textContent?.trim()} button`);
        };

        // Function to apply inactive styling
        const applyInactiveStyle = (button) => {
          // Remove active classes
          activeClasses.forEach(cls => button.classList.remove(cls));
          // Add inactive classes
          inactiveClasses.forEach(cls => button.classList.add(cls));
          // Clear inline styles
          button.style.backgroundColor = '';
          button.style.color = '';
          button.style.border = '2px solid transparent';
          button.setAttribute('data-active', 'false');
          console.log(`🔧 Applied inactive styling to ${button.textContent?.trim()} button`);
        };

        // Apply styles based on context state
        if (contextDisplayMode === 'r') {
          applyActiveStyle(rBtn);
          applyInactiveStyle(dollarBtn);
        } else if (contextDisplayMode === 'dollar') {
          applyActiveStyle(dollarBtn);
          applyInactiveStyle(rBtn);
        }

        return true;
      };

      // Test 1: Set context to 'r' and force visual sync
      console.log('🔧 Test 1: Setting context to R and syncing visual state...');
      window.displayModeContext.setDisplayMode('r');
      await new Promise(resolve => setTimeout(resolve, 500));

      const syncSuccess1 = forceVisualStateSync();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validate result
      const allButtons1 = Array.from(document.querySelectorAll('button'));
      const rBtn1 = allButtons1.find(btn => btn.textContent?.trim() === 'R');
      const dollarBtn1 = allButtons1.find(btn => btn.textContent?.trim() === '$');

      const rTest = {
        contextState: window.displayModeContext.displayMode,
        rButtonActive: rBtn1 ? rBtn1.classList.contains('bg-[#B8860B]') : false,
        dollarButtonActive: dollarBtn1 ? dollarBtn1.classList.contains('bg-[#B8860B]') : false,
        rButtonBgColor: rBtn1 ? window.getComputedStyle(rBtn1).backgroundColor : 'none',
        success: syncSuccess1
      };

      console.log('🎯 R Test Result:', rTest);

      // Test 2: Set context to 'dollar' and force visual sync
      console.log('🔧 Test 2: Setting context to $ and syncing visual state...');
      window.displayModeContext.setDisplayMode('dollar');
      await new Promise(resolve => setTimeout(resolve, 500));

      const syncSuccess2 = forceVisualStateSync();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Validate result
      const allButtons2 = Array.from(document.querySelectorAll('button'));
      const rBtn2 = allButtons2.find(btn => btn.textContent?.trim() === 'R');
      const dollarBtn2 = allButtons2.find(btn => btn.textContent?.trim() === '$');

      const dollarTest = {
        contextState: window.displayModeContext.displayMode,
        rButtonActive: rBtn2 ? rBtn2.classList.contains('bg-[#B8860B]') : false,
        dollarButtonActive: dollarBtn2 ? dollarBtn2.classList.contains('bg-[#B8860B]') : false,
        dollarButtonBgColor: dollarBtn2 ? window.getComputedStyle(dollarBtn2).backgroundColor : 'none',
        success: syncSuccess2
      };

      console.log('🎯 Dollar Test Result:', dollarTest);

      // Test 3: Back to R mode
      console.log('🔧 Test 3: Back to R mode with visual sync...');
      window.displayModeContext.setDisplayMode('r');
      await new Promise(resolve => setTimeout(resolve, 500));

      const syncSuccess3 = forceVisualStateSync();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Final validation
      const allButtons3 = Array.from(document.querySelectorAll('button'));
      const rBtn3 = allButtons3.find(btn => btn.textContent?.trim() === 'R');

      const finalRTest = {
        contextState: window.displayModeContext.displayMode,
        rButtonActive: rBtn3 ? rBtn3.classList.contains('bg-[#B8860B]') : false,
        rButtonBgColor: rBtn3 ? window.getComputedStyle(rBtn3).backgroundColor : 'none',
        success: syncSuccess3
      };

      console.log('🎯 Final R Test Result:', finalRTest);

      return {
        rTest,
        dollarTest,
        finalRTest,
        overallSuccess: rTest.rButtonActive && dollarTest.dollarButtonActive && finalRTest.rButtonActive
      };
    });

    console.log('\n🎯 === FORCE VISUAL STATE SYNC RESULTS ===');
    console.log('==========================================');

    console.log('\n📊 R Mode Test:');
    console.log(`  Context State: ${syncResult.rTest.contextState}`);
    console.log(`  R Button Active: ${syncResult.rTest.rButtonActive ? '✅' : '❌'}`);
    console.log(`  $ Button Active: ${syncResult.rTest.dollarButtonActive ? '❌' : '✅'} (should be inactive)`);
    console.log(`  R Button BG Color: ${syncResult.rTest.rButtonBgColor}`);

    console.log('\n💲 Dollar Mode Test:');
    console.log(`  Context State: ${syncResult.dollarTest.contextState}`);
    console.log(`  R Button Active: ${syncResult.dollarTest.rButtonActive ? '❌' : '✅'} (should be inactive)`);
    console.log(`  $ Button Active: ${syncResult.dollarTest.dollarButtonActive ? '✅' : '❌'}`);
    console.log(`  $ Button BG Color: ${syncResult.dollarTest.dollarButtonBgColor}`);

    console.log('\n🎯 Final R Mode Test:');
    console.log(`  Context State: ${syncResult.finalRTest.contextState}`);
    console.log(`  R Button Active: ${syncResult.finalRTest.rButtonActive ? '✅' : '❌'}`);
    console.log(`  R Button BG Color: ${syncResult.finalRTest.rButtonBgColor}`);

    console.log(`\n🏆 OVERALL SUCCESS: ${syncResult.overallSuccess ? '✅' : '❌'}`);

    if (syncResult.overallSuccess) {
      console.log('\n🎯 CONCLUSION: Direct DOM manipulation approach WORKS!');
      console.log('💡 This approach can be integrated into the AI agent for reliable button state management');
    } else {
      console.log('\n🎯 CONCLUSION: Even direct DOM manipulation has issues');
      console.log('💡 Need to investigate deeper CSS or component structure issues');
    }

    await page.screenshot({ path: 'force_visual_state_sync_results.png', fullPage: true });

    return syncResult.overallSuccess;

  } catch (error) {
    console.error('💥 Force visual state sync error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

forceButtonVisualStateSync().then(success => {
  console.log(`\n🏁 FORCE VISUAL STATE SYNC: ${success ? 'DOM MANIPULATION WORKS ✅' : 'DOM MANIPULATION FAILED ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});