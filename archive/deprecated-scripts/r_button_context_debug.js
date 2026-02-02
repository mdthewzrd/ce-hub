/**
 * R BUTTON CONTEXT DEBUG
 * Debug the DisplayModeContext state vs visual state for R buttons
 */

const { chromium } = require('playwright');

async function rButtonContextDebug() {
  console.log('🔍 R BUTTON CONTEXT DEBUG - Context State vs Visual State');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    console.log('📍 Testing R button context state vs visual state...');

    const beforeClick = await page.evaluate(() => {
      // Check context state via window object
      const hasDisplayModeContext = typeof window.displayModeContext !== 'undefined';
      const contextDisplayMode = hasDisplayModeContext ? window.displayModeContext.displayMode : 'unknown';

      // Check visual state
      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');
      const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return btn.classList.contains('bg-[#B8860B]') ||
               btn.classList.contains('traderra-date-active') ||
               btn.getAttribute('data-active') === 'true';
      };

      return {
        contextState: {
          hasContext: hasDisplayModeContext,
          displayMode: contextDisplayMode
        },
        visualState: {
          rButtonActive: checkButtonActive(rBtn),
          dollarButtonActive: checkButtonActive(dollarBtn),
          rButtonClasses: rBtn ? Array.from(rBtn.classList) : [],
          dollarButtonClasses: dollarBtn ? Array.from(dollarBtn.classList) : []
        }
      };
    });

    console.log('📊 BEFORE CLICK STATE:');
    console.log(JSON.stringify(beforeClick, null, 2));

    // Click R button
    console.log('📍 Clicking R button...');
    await page.click('button:has-text("R")');
    await page.waitForTimeout(1500);

    const afterClickR = await page.evaluate(() => {
      // Check context state
      const hasDisplayModeContext = typeof window.displayModeContext !== 'undefined';
      const contextDisplayMode = hasDisplayModeContext ? window.displayModeContext.displayMode : 'unknown';

      // Check visual state
      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');
      const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return btn.classList.contains('bg-[#B8860B]') ||
               btn.classList.contains('traderra-date-active') ||
               btn.getAttribute('data-active') === 'true';
      };

      return {
        contextState: {
          hasContext: hasDisplayModeContext,
          displayMode: contextDisplayMode
        },
        visualState: {
          rButtonActive: checkButtonActive(rBtn),
          dollarButtonActive: checkButtonActive(dollarBtn),
          rButtonClasses: rBtn ? Array.from(rBtn.classList) : [],
          dollarButtonClasses: dollarBtn ? Array.from(dollarBtn.classList) : []
        }
      };
    });

    console.log('📊 AFTER R CLICK STATE:');
    console.log(JSON.stringify(afterClickR, null, 2));

    // Click $ button for comparison
    console.log('📍 Clicking $ button for comparison...');
    await page.click('button:has-text("$")');
    await page.waitForTimeout(1500);

    const afterClickDollar = await page.evaluate(() => {
      // Check context state
      const hasDisplayModeContext = typeof window.displayModeContext !== 'undefined';
      const contextDisplayMode = hasDisplayModeContext ? window.displayModeContext.displayMode : 'unknown';

      // Check visual state
      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');
      const dollarBtn = allButtons.find(b => b.textContent?.trim() === '$');

      const checkButtonActive = (btn) => {
        if (!btn) return false;
        return btn.classList.contains('bg-[#B8860B]') ||
               btn.classList.contains('traderra-date-active') ||
               btn.getAttribute('data-active') === 'true';
      };

      return {
        contextState: {
          hasContext: hasDisplayModeContext,
          displayMode: contextDisplayMode
        },
        visualState: {
          rButtonActive: checkButtonActive(rBtn),
          dollarButtonActive: checkButtonActive(dollarBtn),
          rButtonClasses: rBtn ? Array.from(rBtn.classList) : [],
          dollarButtonClasses: dollarBtn ? Array.from(dollarBtn.classList) : []
        }
      };
    });

    console.log('📊 AFTER $ CLICK STATE:');
    console.log(JSON.stringify(afterClickDollar, null, 2));

    // Analysis
    console.log('\n🔍 ANALYSIS:');
    console.log('=============');

    const contextChangedR = beforeClick.contextState.displayMode !== afterClickR.contextState.displayMode;
    const visualChangedR = beforeClick.visualState.rButtonActive !== afterClickR.visualState.rButtonActive;

    const contextChangedDollar = afterClickR.contextState.displayMode !== afterClickDollar.contextState.displayMode;
    const visualChangedDollar = afterClickR.visualState.dollarButtonActive !== afterClickDollar.visualState.dollarButtonActive;

    console.log(`R Button Click:`);
    console.log(`  Context State Changed: ${contextChangedR}`);
    console.log(`  Visual State Changed: ${visualChangedR}`);
    console.log(`  Context matches expected (r): ${afterClickR.contextState.displayMode === 'r'}`);
    console.log(`  Visual matches expected (true): ${afterClickR.visualState.rButtonActive === true}`);

    console.log(`\n$ Button Click:`);
    console.log(`  Context State Changed: ${contextChangedDollar}`);
    console.log(`  Visual State Changed: ${visualChangedDollar}`);
    console.log(`  Context matches expected (dollar): ${afterClickDollar.contextState.displayMode === 'dollar'}`);
    console.log(`  Visual matches expected (true): ${afterClickDollar.visualState.dollarButtonActive === true}`);

    console.log('\n💡 ROOT CAUSE IDENTIFICATION:');
    console.log('===============================');

    if (contextChangedR && !visualChangedR) {
      console.log('❌ R Button: Context updates but visual state does not');
      console.log('💡 Issue: Component rendering or CSS styling problem');
    } else if (!contextChangedR && !visualChangedR) {
      console.log('❌ R Button: Neither context nor visual state updates');
      console.log('💡 Issue: Click handler not working or context provider not available');
    } else if (contextChangedR && visualChangedR) {
      console.log('✅ R Button: Both context and visual state update correctly');
      console.log('💡 Issue: Validation logic or timing problem');
    }

    if (contextChangedDollar && visualChangedDollar) {
      console.log('✅ $ Button: Both context and visual state update correctly');
    } else {
      console.log('❌ $ Button: Also has issues - this might be a systemic problem');
    }

    await page.screenshot({ path: 'r_button_context_debug.png', fullPage: true });

    return {
      rButtonWorking: contextChangedR && visualChangedR,
      dollarButtonWorking: contextChangedDollar && visualChangedDollar
    };

  } catch (error) {
    console.error('💥 R button context debug error:', error);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

rButtonContextDebug().then(result => {
  console.log(`\n🏁 R BUTTON DEBUG COMPLETE: ${JSON.stringify(result)}`);
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});