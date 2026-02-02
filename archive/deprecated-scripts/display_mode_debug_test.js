/**
 * DISPLAY MODE DEBUG TEST
 * Debug the R/G button validation logic to fix the test suite
 */

const { chromium } = require('playwright');

async function displayModeDebugTest() {
  console.log('🔧 DISPLAY MODE DEBUG TEST - Investigating R/G button validation');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    console.log('📍 Investigating R button...');

    // Click R button and inspect its state
    await page.click('button:has-text("R")');
    await page.waitForTimeout(1000);

    const rButtonState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const rBtn = allButtons.find(b => b.textContent?.trim() === 'R');

      return {
        found: !!rBtn,
        textContent: rBtn?.textContent,
        classes: rBtn ? Array.from(rBtn.classList) : [],
        dataActive: rBtn?.getAttribute('data-active'),
        style: rBtn ? {
          backgroundColor: rBtn.style.backgroundColor || 'none',
          color: rBtn.style.color || 'none'
        } : {},
        computedStyle: rBtn ? {
          backgroundColor: window.getComputedStyle(rBtn).backgroundColor,
          color: window.getComputedStyle(rBtn).color
        } : {},
        // Check all possible active indicators
        hasActiveIndicators: {
          bgGold: rBtn?.classList.contains('bg-[#B8860B]'),
          traderraDateActive: rBtn?.classList.contains('traderra-date-active'),
          dataActiveTrue: rBtn?.getAttribute('data-active') === 'true',
          inlineStyle: rBtn?.style.backgroundColor === 'rgb(184, 134, 11)'
        }
      };
    });

    console.log('📊 R Button State After Click:');
    console.log(JSON.stringify(rButtonState, null, 2));

    console.log('\n📍 Investigating G button...');

    // Click G button and inspect its state
    await page.click('button:has-text("G")');
    await page.waitForTimeout(1000);

    const gButtonState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const gBtn = allButtons.find(b => b.textContent?.trim() === 'G');

      return {
        found: !!gBtn,
        textContent: gBtn?.textContent,
        classes: gBtn ? Array.from(gBtn.classList) : [],
        dataActive: gBtn?.getAttribute('data-active'),
        style: gBtn ? {
          backgroundColor: gBtn.style.backgroundColor || 'none',
          color: gBtn.style.color || 'none'
        } : {},
        computedStyle: gBtn ? {
          backgroundColor: window.getComputedStyle(gBtn).backgroundColor,
          color: window.getComputedStyle(gBtn).color
        } : {},
        // Check all possible active indicators
        hasActiveIndicators: {
          bgGold: gBtn?.classList.contains('bg-[#B8860B]'),
          traderraDateActive: gBtn?.classList.contains('traderra-date-active'),
          dataActiveTrue: gBtn?.getAttribute('data-active') === 'true',
          inlineStyle: gBtn?.style.backgroundColor === 'rgb(184, 134, 11)'
        }
      };
    });

    console.log('📊 G Button State After Click:');
    console.log(JSON.stringify(gButtonState, null, 2));

    console.log('\n📍 Comparing with Date Range Button (7d) for reference...');

    // Click 7d button to compare
    await page.click('button:has-text("7d")');
    await page.waitForTimeout(1000);

    const dateButtonState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(b => b.textContent?.trim() === '7d');

      return {
        found: !!btn7d,
        textContent: btn7d?.textContent,
        classes: btn7d ? Array.from(btn7d.classList) : [],
        dataActive: btn7d?.getAttribute('data-active'),
        style: btn7d ? {
          backgroundColor: btn7d.style.backgroundColor || 'none',
          color: btn7d.style.color || 'none'
        } : {},
        computedStyle: btn7d ? {
          backgroundColor: window.getComputedStyle(btn7d).backgroundColor,
          color: window.getComputedStyle(btn7d).color
        } : {},
        // Check all possible active indicators
        hasActiveIndicators: {
          bgGold: btn7d?.classList.contains('bg-[#B8860B]'),
          traderraDateActive: btn7d?.classList.contains('traderra-date-active'),
          dataActiveTrue: btn7d?.getAttribute('data-active') === 'true',
          inlineStyle: btn7d?.style.backgroundColor === 'rgb(184, 134, 11)'
        }
      };
    });

    console.log('📊 7d Date Button State After Click (Working Reference):');
    console.log(JSON.stringify(dateButtonState, null, 2));

    // Analysis
    console.log('\n🔍 ANALYSIS:');
    console.log('===========');

    const rActive = rButtonState.hasActiveIndicators.bgGold ||
                    rButtonState.hasActiveIndicators.traderraDateActive ||
                    rButtonState.hasActiveIndicators.dataActiveTrue ||
                    rButtonState.hasActiveIndicators.inlineStyle;

    const gActive = gButtonState.hasActiveIndicators.bgGold ||
                    gButtonState.hasActiveIndicators.traderraDateActive ||
                    gButtonState.hasActiveIndicators.dataActiveTrue ||
                    gButtonState.hasActiveIndicators.inlineStyle;

    const dateActive = dateButtonState.hasActiveIndicators.bgGold ||
                       dateButtonState.hasActiveIndicators.traderraDateActive ||
                       dateButtonState.hasActiveIndicators.dataActiveTrue ||
                       dateButtonState.hasActiveIndicators.inlineStyle;

    console.log(`R Button Active (by current test logic): ${rActive}`);
    console.log(`G Button Active (by current test logic): ${gActive}`);
    console.log(`7d Date Button Active (working reference): ${dateActive}`);

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');

    if (!rActive && !gActive) {
      console.log('❌ Both R and G buttons appear inactive with current validation logic');
      console.log('💡 Display mode buttons likely use different styling than date buttons');
      console.log('💡 Need to update validation logic for display mode buttons');
    } else if (!rActive && gActive) {
      console.log('⚠️  Only G button validation working, R button validation broken');
      console.log('💡 R button might use different active state mechanism');
    } else if (rActive && gActive) {
      console.log('⚠️  Both buttons appear active - this might indicate validation timing issue');
      console.log('💡 Buttons might not maintain persistent active state like date buttons');
    }

    // Suggest proper validation logic
    console.log('\n🛠️  SUGGESTED VALIDATION FIX:');
    console.log('==============================');
    console.log('// For display mode buttons, validation should be:');
    console.log('// 1. Check if button exists and is clickable');
    console.log('// 2. Display mode buttons may not maintain visual active state');
    console.log('// 3. Validation should focus on functionality rather than styling');
    console.log('// 4. Or check display mode context state instead of button state');

    await page.screenshot({ path: 'display_mode_debug_analysis.png', fullPage: true });

    return {
      rButtonActive: rActive,
      gButtonActive: gActive,
      dateButtonActive: dateActive
    };

  } catch (error) {
    console.error('💥 Debug test error:', error);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

displayModeDebugTest().then(result => {
  console.log(`\n🏁 DEBUG COMPLETE: ${JSON.stringify(result)}`);
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug test failed:', error);
  process.exit(1);
});