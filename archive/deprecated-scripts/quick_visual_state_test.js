/**
 * QUICK VISUAL STATE TEST
 * Simple test to verify the critical visual state persistence fix
 */

const { chromium } = require('playwright');

async function quickVisualStateTest() {
  console.log('🔍 Quick Visual State Test - Testing Critical Fix');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📍 Taking baseline screenshot...');
    await page.screenshot({ path: 'quick_test_1_baseline.png', fullPage: true });

    // Step 1: Click 7d button
    console.log('📍 Step 1: Clicking 7d button...');
    try {
      await page.getByRole('button', { name: '7d' }).click();
      await page.waitForTimeout(1000);
      console.log('✅ Successfully clicked 7d button');
    } catch (error) {
      console.log('❌ Failed to click 7d button:', error.message);
      // Try alternative selector
      await page.click('button:has-text("7d")');
      console.log('✅ Clicked 7d button using alternative selector');
    }

    await page.screenshot({ path: 'quick_test_2_7d_selected.png', fullPage: true });

    // Check if 7d is active
    const state1 = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d');

      if (!btn7d) return { found: false };

      return {
        found: true,
        hasGoldBg: btn7d.classList.contains('bg-[#B8860B]'),
        hasActiveClass: btn7d.classList.contains('traderra-date-active'),
        dataActive: btn7d.getAttribute('data-active') === 'true',
        computedBg: window.getComputedStyle(btn7d).backgroundColor,
        allClasses: Array.from(btn7d.classList)
      };
    });

    console.log('📊 State after 7d selection:', JSON.stringify(state1, null, 2));

    // Step 2: Click R button (CRITICAL TEST)
    console.log('📍 Step 2: Clicking R button - CRITICAL TEST...');
    try {
      await page.getByRole('button', { name: 'R' }).click();
      await page.waitForTimeout(1000);
      console.log('✅ Successfully clicked R button');
    } catch (error) {
      console.log('❌ Failed to click R button, trying alternative selector');
      try {
        await page.click('button:has-text("R")');
        console.log('✅ Clicked R button using alternative selector');
      } catch (error2) {
        console.log('❌ Failed to click R button with alternative selector:', error2.message);
      }
    }

    await page.screenshot({ path: 'quick_test_3_CRITICAL_r_mode.png', fullPage: true });

    // Check if 7d is STILL active (CRITICAL)
    const state2 = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d');

      if (!btn7d) return { found: false };

      return {
        found: true,
        hasGoldBg: btn7d.classList.contains('bg-[#B8860B]'),
        hasActiveClass: btn7d.classList.contains('traderra-date-active'),
        dataActive: btn7d.getAttribute('data-active') === 'true',
        computedBg: window.getComputedStyle(btn7d).backgroundColor,
        allClasses: Array.from(btn7d.classList),

        // Also check R button
        rButton: (() => {
          const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
          if (!rBtn) return { found: false };
          return {
            found: true,
            hasGoldBg: rBtn.classList.contains('bg-[#B8860B]'),
            computedBg: window.getComputedStyle(rBtn).backgroundColor,
            allClasses: Array.from(rBtn.classList)
          };
        })()
      };
    });

    console.log('📊 State after R mode toggle (CRITICAL):', JSON.stringify(state2, null, 2));

    // Analyze results
    const step1_7dActive = state1.hasGoldBg || state1.hasActiveClass || state1.dataActive;
    const step2_7dActive = state2.hasGoldBg || state2.hasActiveClass || state2.dataActive;
    const step2_RActive = state2.rButton?.hasGoldBg;

    console.log('\n📈 TEST RESULTS');
    console.log('================');
    console.log(`Step 1 - 7d button active: ${step1_7dActive ? '✅' : '❌'}`);
    console.log(`Step 2 - 7d button STILL active: ${step2_7dActive ? '✅' : '❌'} (CRITICAL)`);
    console.log(`Step 2 - R button active: ${step2_RActive ? '✅' : '❌'}`);

    if (step1_7dActive && step2_7dActive) {
      console.log('\n🎉 SUCCESS: Visual state persistence is working!');
      console.log('✅ 7d button maintained active state during display mode change');
      return true;
    } else {
      console.log('\n💥 FAILURE: Visual state persistence is broken!');
      if (!step1_7dActive) {
        console.log('❌ 7d button was not properly activated initially');
      }
      if (!step2_7dActive) {
        console.log('❌ 7d button lost active state during R mode toggle');
      }
      return false;
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
quickVisualStateTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});