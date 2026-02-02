/**
 * COMPREHENSIVE 100% SUCCESS VALIDATION TEST
 * Tests multiple scenarios to ensure complete success across all user requirements
 */

const { chromium } = require('playwright');

async function comprehensive100PercentTest() {
  console.log('🎯 COMPREHENSIVE 100% SUCCESS TEST - Multiple Scenario Validation');
  console.log('Testing: single commands, compound commands, state persistence, visual accuracy');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200
  });

  try {
    const page = await browser.newPage();

    // Capture relevant logs
    page.on('console', msg => {
      if (msg.text().includes('🎯') || msg.text().includes('🗓️')) {
        console.log(`📺 BROWSER: ${msg.text()}`);
      }
    });

    const testResults = [];
    let overallSuccess = true;

    console.log('📍 SCENARIO 1: Basic Date Button Activation Test');
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);

    // Test each date button individually
    const dateButtons = [
      { label: '7d', value: 'week' },
      { label: '30d', value: 'month' },
      { label: '90d', value: '90day' },
      { label: 'All', value: 'all' }
    ];

    for (const btn of dateButtons) {
      console.log(`📍 Testing ${btn.label} button activation...`);
      await page.click(`button:has-text("${btn.label}")`);
      await page.waitForTimeout(1000);

      const state = await page.evaluate((label) => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const targetBtn = allButtons.find(b => b.textContent?.trim() === label);
        return {
          found: !!targetBtn,
          hasGoldBg: targetBtn?.classList.contains('bg-[#B8860B]') || false,
          hasActiveClass: targetBtn?.classList.contains('traderra-date-active') || false,
          dataActive: targetBtn?.getAttribute('data-active') === 'true',
          computedBg: targetBtn ? window.getComputedStyle(targetBtn).backgroundColor : 'none'
        };
      }, btn.label);

      const success = state.hasGoldBg || state.hasActiveClass || state.dataActive || state.computedBg === 'rgb(184, 134, 11)';
      testResults.push({ test: `${btn.label} button activation`, success });
      console.log(`📊 ${btn.label} button: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!success) overallSuccess = false;
    }

    console.log('\\n📍 SCENARIO 2: Critical State Persistence During Display Mode Changes');

    // Test state persistence for each button
    for (const btn of dateButtons) {
      console.log(`📍 Testing ${btn.label} state persistence during R toggle...`);

      // Activate the button
      await page.click(`button:has-text("${btn.label}")`);
      await page.waitForTimeout(500);

      // Toggle R mode
      await page.click('button:has-text("R")');
      await page.waitForTimeout(500);

      // Check if button is still active
      const persistenceState = await page.evaluate((label) => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const targetBtn = allButtons.find(b => b.textContent?.trim() === label);
        return {
          hasGoldBg: targetBtn?.classList.contains('bg-[#B8860B]') || false,
          hasActiveClass: targetBtn?.classList.contains('traderra-date-active') || false,
          dataActive: targetBtn?.getAttribute('data-active') === 'true',
          computedBg: targetBtn ? window.getComputedStyle(targetBtn).backgroundColor : 'none'
        };
      }, btn.label);

      const persistence = persistenceState.hasGoldBg || persistenceState.hasActiveClass ||
                         persistenceState.dataActive || persistenceState.computedBg === 'rgb(184, 134, 11)';

      testResults.push({ test: `${btn.label} state persistence`, success: persistence });
      console.log(`📊 ${btn.label} persistence: ${persistence ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!persistence) overallSuccess = false;

      // Toggle back to G mode for next test
      await page.click('button:has-text("G")');
      await page.waitForTimeout(500);
    }

    console.log('\\n📍 SCENARIO 3: Rapid Sequential Button Clicks');

    // Test rapid clicking between different buttons
    const clickSequence = ['7d', '30d', '7d', '90d', '7d'];
    for (const btnLabel of clickSequence) {
      await page.click(`button:has-text("${btnLabel}")`);
      await page.waitForTimeout(300);
    }

    // Verify final state (should be 7d active)
    const finalState = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const btn7d = allButtons.find(b => b.textContent?.trim() === '7d');
      return {
        hasGoldBg: btn7d?.classList.contains('bg-[#B8860B]') || false,
        hasActiveClass: btn7d?.classList.contains('traderra-date-active') || false,
        dataActive: btn7d?.getAttribute('data-active') === 'true'
      };
    });

    const rapidSuccess = finalState.hasGoldBg || finalState.hasActiveClass || finalState.dataActive;
    testResults.push({ test: 'Rapid sequential clicks', success: rapidSuccess });
    console.log(`📊 Rapid clicks: ${rapidSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (!rapidSuccess) overallSuccess = false;

    console.log('\\n📍 SCENARIO 4: Compound Commands Simulation');

    // Simulate AI agent compound commands
    const compoundTests = [
      { sequence: ['7d', 'R'], description: 'Show 7d in R mode' },
      { sequence: ['30d', 'G'], description: 'Show 30d in G mode' },
      { sequence: ['90d', 'R', 'G'], description: 'Show 90d, toggle R, back to G' }
    ];

    for (const test of compoundTests) {
      console.log(`📍 Testing compound command: ${test.description}`);

      for (const action of test.sequence) {
        await page.click(`button:has-text("${action}")`);
        await page.waitForTimeout(400);
      }

      // Verify the date button is still active
      const expectedDateBtn = test.sequence.find(action => ['7d', '30d', '90d', 'All'].includes(action));
      const compoundState = await page.evaluate((label) => {
        const allButtons = Array.from(document.querySelectorAll('button'));
        const targetBtn = allButtons.find(b => b.textContent?.trim() === label);
        return {
          hasGoldBg: targetBtn?.classList.contains('bg-[#B8860B]') || false,
          hasActiveClass: targetBtn?.classList.contains('traderra-date-active') || false,
          dataActive: targetBtn?.getAttribute('data-active') === 'true'
        };
      }, expectedDateBtn);

      const compoundSuccess = compoundState.hasGoldBg || compoundState.hasActiveClass || compoundState.dataActive;
      testResults.push({ test: `Compound: ${test.description}`, success: compoundSuccess });
      console.log(`📊 ${test.description}: ${compoundSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!compoundSuccess) overallSuccess = false;
    }

    // Take final screenshot
    await page.screenshot({ path: 'comprehensive_test_final_state.png', fullPage: true });

    // Calculate success rate
    const totalTests = testResults.length;
    const successfulTests = testResults.filter(r => r.success).length;
    const successRate = (successfulTests / totalTests * 100).toFixed(1);

    console.log('\\n🏆 COMPREHENSIVE TEST RESULTS');
    console.log('================================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Successful: ${successfulTests}`);
    console.log(`Failed: ${totalTests - successfulTests}`);
    console.log(`Success Rate: ${successRate}%`);

    console.log('\\nDetailed Results:');
    testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.success ? '✅' : '❌'}`);
    });

    if (overallSuccess && successRate === '100.0') {
      console.log('\\n🎉 COMPLETE SUCCESS: 100% SUCCESS RATE ACHIEVED!');
      console.log('✅ All button activations working correctly');
      console.log('✅ Visual state persistence during display mode changes working');
      console.log('✅ Rapid sequential operations working');
      console.log('✅ Compound commands working correctly');
      console.log('✅ AI agent validation system should now work perfectly');
      return true;
    } else {
      console.log(`\\n⚠️  PARTIAL SUCCESS: ${successRate}% success rate`);
      const failures = testResults.filter(r => !r.success);
      console.log('❌ Failed tests:');
      failures.forEach(failure => console.log(`   - ${failure.test}`));
      return false;
    }

  } catch (error) {
    console.error('💥 Comprehensive test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

comprehensive100PercentTest().then(success => {
  console.log(`\\n🏁 FINAL RESULT: ${success ? '100% SUCCESS ACHIEVED' : 'ADDITIONAL WORK NEEDED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});