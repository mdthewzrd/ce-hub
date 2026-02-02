/**
 * STATE PERSISTENCE TEST
 * Tests the critical issue - does 7d button stay active after R mode toggle?
 */

const { chromium } = require('playwright');

async function statePersistenceTest() {
  console.log('🔍 State Persistence Test - Critical Visual State During Display Mode Changes');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1500
  });

  try {
    const page = await browser.newPage();

    // Capture relevant browser console logs
    page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('🗓️')) {
        console.log(`📺 BROWSER: ${msg.text()}`);
      }
    });

    console.log('📍 Step 1: Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    console.log('📍 Step 2: Take baseline screenshot...');
    await page.screenshot({ path: 'persistence_test_1_baseline.png', fullPage: true });

    console.log('📍 Step 3: Click 7d button to activate...');
    await page.click('button:has-text("7d")');
    await page.waitForTimeout(1500);

    // Check 7d button state after activation
    const step3State = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d');
      return {
        found: !!btn7d,
        hasGoldBg: btn7d?.classList.contains('bg-[#B8860B]') || false,
        hasActiveClass: btn7d?.classList.contains('traderra-date-active') || false,
        dataActive: btn7d?.getAttribute('data-active') === 'true',
        computedBg: btn7d ? window.getComputedStyle(btn7d).backgroundColor : 'none',
        inlineStyle: btn7d?.style.backgroundColor || 'none'
      };
    });

    console.log('📊 Step 3 - 7d button state after activation:');
    console.log(JSON.stringify(step3State, null, 2));

    await page.screenshot({ path: 'persistence_test_2_7d_activated.png', fullPage: true });

    const step3Success = step3State.hasGoldBg || step3State.hasActiveClass ||
                        step3State.dataActive || step3State.inlineStyle === 'rgb(184, 134, 11)';

    console.log(`📝 Step 3 Result: ${step3Success ? '✅ 7d properly activated' : '❌ 7d activation failed'}`);

    if (!step3Success) {
      console.log('💥 FAILURE: 7d button activation failed, aborting test');
      return false;
    }

    console.log('📍 Step 4: Click R button (CRITICAL TEST - will 7d stay active?)...');
    await page.click('button:has-text("R")');
    await page.waitForTimeout(2000);

    // Check BOTH 7d and R button states after R toggle
    const step4State = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d');
      const btnR = allButtons.find(btn => btn.textContent?.trim() === 'R');

      return {
        btn7d: {
          found: !!btn7d,
          hasGoldBg: btn7d?.classList.contains('bg-[#B8860B]') || false,
          hasActiveClass: btn7d?.classList.contains('traderra-date-active') || false,
          dataActive: btn7d?.getAttribute('data-active') === 'true',
          computedBg: btn7d ? window.getComputedStyle(btn7d).backgroundColor : 'none',
          inlineStyle: btn7d?.style.backgroundColor || 'none',
          allClasses: btn7d ? Array.from(btn7d.classList) : []
        },
        btnR: {
          found: !!btnR,
          hasGoldBg: btnR?.classList.contains('bg-[#B8860B]') || false,
          computedBg: btnR ? window.getComputedStyle(btnR).backgroundColor : 'none',
          inlineStyle: btnR?.style.backgroundColor || 'none',
          allClasses: btnR ? Array.from(btnR.classList) : []
        }
      };
    });

    console.log('📊 Step 4 - Button states after R mode toggle (CRITICAL):');
    console.log('7d button:', JSON.stringify(step4State.btn7d, null, 2));
    console.log('R button:', JSON.stringify(step4State.btnR, null, 2));

    await page.screenshot({ path: 'persistence_test_3_CRITICAL_after_r_toggle.png', fullPage: true });

    // Analyze critical persistence
    const step4_7dStillActive = step4State.btn7d.hasGoldBg || step4State.btn7d.hasActiveClass ||
                               step4State.btn7d.dataActive || step4State.btn7d.inlineStyle === 'rgb(184, 134, 11)';
    const step4_RActive = step4State.btnR.hasGoldBg || step4State.btnR.inlineStyle === 'rgb(184, 134, 11)';

    console.log('\\n🏆 CRITICAL TEST RESULTS');
    console.log('===========================');
    console.log(`Step 3 - 7d button activation: ${step3Success ? '✅' : '❌'}`);
    console.log(`Step 4 - 7d STILL active after R toggle: ${step4_7dStillActive ? '✅' : '❌'} (CRITICAL)`);
    console.log(`Step 4 - R button active: ${step4_RActive ? '✅' : '❌'}`);

    const overallSuccess = step3Success && step4_7dStillActive;

    if (overallSuccess) {
      console.log('\\n🎉 SUCCESS: Visual state persistence is working!');
      console.log('✅ 7d button maintained active state during display mode change');
      console.log('✅ This fixes the core issue that was breaking AI agent validation');
      return true;
    } else {
      console.log('\\n💥 FAILURE: Visual state persistence is still broken!');
      if (!step3Success) {
        console.log('❌ 7d button was not properly activated initially');
      }
      if (!step4_7dStillActive) {
        console.log('❌ 7d button lost active state during R mode toggle (CRITICAL ISSUE)');
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

statePersistenceTest().then(success => {
  console.log(`\\n🏁 FINAL RESULT: ${success ? 'STATE PERSISTENCE FIXED' : 'STATE PERSISTENCE STILL BROKEN'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});