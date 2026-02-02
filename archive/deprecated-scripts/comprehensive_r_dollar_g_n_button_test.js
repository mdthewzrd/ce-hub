/**
 * COMPREHENSIVE R, $, G, N BUTTON TEST
 * Test all four button types with direct context calls and button clicks
 * Validates both context state and visual state for full functionality
 */

const { chromium } = require('playwright');

async function comprehensiveButtonTest() {
  console.log('🧪 COMPREHENSIVE R, $, G, N BUTTON TEST - Testing all four button types');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const page = await browser.newPage();

    console.log('📍 Navigate to dashboard...');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(4000);

    // Test Results Tracking
    const results = {
      rButton: { contextTest: false, clickTest: false },
      dollarButton: { contextTest: false, clickTest: false },
      gButton: { contextTest: false, clickTest: false },
      nButton: { contextTest: false, clickTest: false }
    };

    console.log('📍 Starting comprehensive button tests...');

    // TEST 1: R BUTTON TESTS
    console.log('\n🎯 === R BUTTON TESTS ===');

    const rButtonTests = await page.evaluate(async () => {
      console.log('🔧 Testing R button functionality...');

      // Test 1A: Context function call
      let contextTestResult = false;
      if (window.displayModeContext && window.displayModeContext.setDisplayMode) {
        try {
          window.displayModeContext.setDisplayMode('r');
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check both context and visual state
          const contextState = window.displayModeContext.displayMode;
          const allButtons = Array.from(document.querySelectorAll('button'));
          const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
          const visualState = rBtn ? rBtn.classList.contains('bg-[#B8860B]') : false;

          contextTestResult = contextState === 'r' && visualState;
          console.log(`🎯 R Context Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${contextTestResult}`);
        } catch (error) {
          console.log('❌ R Context Test Error:', error.message);
        }
      }

      // Test 1B: Direct button click
      let clickTestResult = false;
      try {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const rBtn = allButtons.find(btn => btn.textContent?.trim() === 'R');
        if (rBtn) {
          rBtn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check results after click
          const contextState = window.displayModeContext ? window.displayModeContext.displayMode : 'unknown';
          const visualState = rBtn.classList.contains('bg-[#B8860B]');

          clickTestResult = contextState === 'r' && visualState;
          console.log(`🎯 R Click Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${clickTestResult}`);
        }
      } catch (error) {
        console.log('❌ R Click Test Error:', error.message);
      }

      return { contextTest: contextTestResult, clickTest: clickTestResult };
    });

    results.rButton = rButtonTests;
    console.log(`🎯 R Button Results: Context=${rButtonTests.contextTest ? '✅' : '❌'}, Click=${rButtonTests.clickTest ? '✅' : '❌'}`);

    // TEST 2: DOLLAR BUTTON TESTS
    console.log('\n💲 === $ BUTTON TESTS ===');

    const dollarButtonTests = await page.evaluate(async () => {
      console.log('🔧 Testing $ button functionality...');

      // Test 2A: Context function call
      let contextTestResult = false;
      if (window.displayModeContext && window.displayModeContext.setDisplayMode) {
        try {
          window.displayModeContext.setDisplayMode('dollar');
          await new Promise(resolve => setTimeout(resolve, 1000));

          const contextState = window.displayModeContext.displayMode;
          const allButtons = Array.from(document.querySelectorAll('button'));
          const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');
          const visualState = dollarBtn ? dollarBtn.classList.contains('bg-[#B8860B]') : false;

          contextTestResult = contextState === 'dollar' && visualState;
          console.log(`💲 $ Context Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${contextTestResult}`);
        } catch (error) {
          console.log('❌ $ Context Test Error:', error.message);
        }
      }

      // Test 2B: Direct button click
      let clickTestResult = false;
      try {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const dollarBtn = allButtons.find(btn => btn.textContent?.trim() === '$');
        if (dollarBtn) {
          dollarBtn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));

          const contextState = window.displayModeContext ? window.displayModeContext.displayMode : 'unknown';
          const visualState = dollarBtn.classList.contains('bg-[#B8860B]');

          clickTestResult = contextState === 'dollar' && visualState;
          console.log(`💲 $ Click Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${clickTestResult}`);
        }
      } catch (error) {
        console.log('❌ $ Click Test Error:', error.message);
      }

      return { contextTest: contextTestResult, clickTest: clickTestResult };
    });

    results.dollarButton = dollarButtonTests;
    console.log(`💲 $ Button Results: Context=${dollarButtonTests.contextTest ? '✅' : '❌'}, Click=${dollarButtonTests.clickTest ? '✅' : '❌'}`);

    // TEST 3: G BUTTON TESTS
    console.log('\n📊 === G BUTTON TESTS ===');

    const gButtonTests = await page.evaluate(async () => {
      console.log('🔧 Testing G button functionality...');

      // Test 3A: Context function call
      let contextTestResult = false;
      if (window.pnlModeContext && window.pnlModeContext.setMode) {
        try {
          window.pnlModeContext.setMode('gross');
          await new Promise(resolve => setTimeout(resolve, 1000));

          const contextState = window.pnlModeContext.mode;
          const allButtons = Array.from(document.querySelectorAll('button'));
          const gBtn = allButtons.find(btn => btn.textContent?.trim() === 'G');
          const visualState = gBtn ? gBtn.classList.contains('bg-[#B8860B]') : false;

          contextTestResult = contextState === 'gross' && visualState;
          console.log(`📊 G Context Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${contextTestResult}`);
        } catch (error) {
          console.log('❌ G Context Test Error:', error.message);
        }
      }

      // Test 3B: Direct button click
      let clickTestResult = false;
      try {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const gBtn = allButtons.find(btn => btn.textContent?.trim() === 'G');
        if (gBtn) {
          gBtn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));

          const contextState = window.pnlModeContext ? window.pnlModeContext.mode : 'unknown';
          const visualState = gBtn.classList.contains('bg-[#B8860B]');

          clickTestResult = contextState === 'gross' && visualState;
          console.log(`📊 G Click Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${clickTestResult}`);
        }
      } catch (error) {
        console.log('❌ G Click Test Error:', error.message);
      }

      return { contextTest: contextTestResult, clickTest: clickTestResult };
    });

    results.gButton = gButtonTests;
    console.log(`📊 G Button Results: Context=${gButtonTests.contextTest ? '✅' : '❌'}, Click=${gButtonTests.clickTest ? '✅' : '❌'}`);

    // TEST 4: N BUTTON TESTS
    console.log('\n📈 === N BUTTON TESTS ===');

    const nButtonTests = await page.evaluate(async () => {
      console.log('🔧 Testing N button functionality...');

      // Test 4A: Context function call
      let contextTestResult = false;
      if (window.pnlModeContext && window.pnlModeContext.setMode) {
        try {
          window.pnlModeContext.setMode('net');
          await new Promise(resolve => setTimeout(resolve, 1000));

          const contextState = window.pnlModeContext.mode;
          const allButtons = Array.from(document.querySelectorAll('button'));
          const nBtn = allButtons.find(btn => btn.textContent?.trim() === 'N');
          const visualState = nBtn ? nBtn.classList.contains('bg-[#B8860B]') : false;

          contextTestResult = contextState === 'net' && visualState;
          console.log(`📈 N Context Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${contextTestResult}`);
        } catch (error) {
          console.log('❌ N Context Test Error:', error.message);
        }
      }

      // Test 4B: Direct button click
      let clickTestResult = false;
      try {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const nBtn = allButtons.find(btn => btn.textContent?.trim() === 'N');
        if (nBtn) {
          nBtn.click();
          await new Promise(resolve => setTimeout(resolve, 1000));

          const contextState = window.pnlModeContext ? window.pnlModeContext.mode : 'unknown';
          const visualState = nBtn.classList.contains('bg-[#B8860B]');

          clickTestResult = contextState === 'net' && visualState;
          console.log(`📈 N Click Test - Context: ${contextState}, Visual: ${visualState}, Overall: ${clickTestResult}`);
        }
      } catch (error) {
        console.log('❌ N Click Test Error:', error.message);
      }

      return { contextTest: contextTestResult, clickTest: clickTestResult };
    });

    results.nButton = nButtonTests;
    console.log(`📈 N Button Results: Context=${nButtonTests.contextTest ? '✅' : '❌'}, Click=${nButtonTests.clickTest ? '✅' : '❌'}`);

    // FINAL RESULTS SUMMARY
    console.log('\n🏆 === COMPREHENSIVE BUTTON TEST RESULTS ===');
    console.log('=============================================');

    const buttonNames = ['R Button', '$ Button', 'G Button', 'N Button'];
    const buttonKeys = ['rButton', 'dollarButton', 'gButton', 'nButton'];
    let allPassed = true;

    buttonKeys.forEach((key, index) => {
      const result = results[key];
      const contextPass = result.contextTest ? '✅' : '❌';
      const clickPass = result.clickTest ? '✅' : '❌';
      const overallPass = result.contextTest && result.clickTest;

      console.log(`${buttonNames[index]}:`);
      console.log(`  Context Function: ${contextPass}`);
      console.log(`  Direct Click: ${clickPass}`);
      console.log(`  Overall: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);
      console.log('');

      if (!overallPass) allPassed = false;
    });

    const successRate = buttonKeys.reduce((acc, key) => {
      const result = results[key];
      return acc + (result.contextTest && result.clickTest ? 1 : 0);
    }, 0);

    console.log(`🎯 OVERALL SUCCESS RATE: ${successRate}/4 (${(successRate/4*100).toFixed(0)}%)`);
    console.log(`🎯 ALL BUTTONS WORKING: ${allPassed ? '✅ YES' : '❌ NO'}`);

    if (!allPassed) {
      console.log('\n🔍 FAILING BUTTONS:');
      buttonKeys.forEach((key, index) => {
        const result = results[key];
        if (!(result.contextTest && result.clickTest)) {
          console.log(`  - ${buttonNames[index]}: Context=${result.contextTest ? 'OK' : 'FAIL'}, Click=${result.clickTest ? 'OK' : 'FAIL'}`);
        }
      });
    }

    await page.screenshot({ path: 'comprehensive_button_test_results.png', fullPage: true });

    return allPassed;

  } catch (error) {
    console.error('💥 Comprehensive button test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

comprehensiveButtonTest().then(success => {
  console.log(`\n🏁 COMPREHENSIVE BUTTON TEST: ${success ? 'ALL BUTTONS WORKING ✅' : 'SOME BUTTONS FAILING ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});