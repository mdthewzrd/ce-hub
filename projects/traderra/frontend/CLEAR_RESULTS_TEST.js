/**
 * CLEAR RESULTS TEST - Easy to read PASS/FAIL results
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 CLEAR RESULTS TEST');
console.log('=====================');

async function clearResultsTest() {
  console.log('🚀 Running test with clear PASS/FAIL results...\n');

  let totalTests = 0;
  let passedTests = 0;

  const test = (name, condition) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ ${name}: PASS`);
    } else {
      console.log(`❌ ${name}: FAIL`);
    }
  };

  // Test 1: Check if contexts are available
  console.log('📊 STEP 1: CONTEXT AVAILABILITY');
  test('DateRangeContext available', !!window.dateRangeContext);
  test('DisplayModeContext available', !!window.displayModeContext);
  test('setDateRange function available', !!window.dateRangeContext?.setDateRange);
  test('setDisplayMode function available', !!window.displayModeContext?.setDisplayMode);
  test('executeSingleCommand available', !!window.executeSingleCommand);

  // Test 2: Reset state to different values
  console.log('\n🔄 STEP 2: STATE RESET');
  try {
    // Reset to different starting values
    window.dateRangeContext?.setDateRange('month');
    window.displayModeContext?.setDisplayMode('dollar');

    // Navigate to different page
    window.location.href = '/trades';

    // Wait for changes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify reset worked
    const afterReset = {
      url: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode
    };

    test('Reset to trades page', afterReset.url === '/trades');
    test('Reset to month date range', afterReset.dateRange === 'month');
    test('Reset to dollar display mode', afterReset.displayMode === 'dollar');

    console.log('   Reset state:', afterReset);

  } catch (error) {
    console.log('❌ State reset failed:', error.message);
    test('State reset successful', false);
  }

  // Test 3: Execute target command
  console.log('\n🎯 STEP 3: EXECUTE TARGET COMMAND');
  console.log('   Command: "go to the dashboard and look at the last 90 days in R"');

  try {
    // Get before state
    const beforeState = {
      url: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode
    };

    // Find and use chat
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
    const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

    if (chatInput && sendButton) {
      // Send command
      chatInput.value = "go to the dashboard and look at the last 90 days in R";
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check after state
      const afterState = {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange,
        displayMode: window.displayModeContext?.displayMode
      };

      console.log('   Before:', beforeState);
      console.log('   After:', afterState);

      // Test each change
      test('Navigation changed', beforeState.url !== afterState.url);
      test('Date range changed', beforeState.dateRange !== afterState.dateRange);
      test('Display mode changed', beforeState.displayMode !== afterState.displayMode);

      // Test target values
      test('Navigated to dashboard', afterState.url === '/dashboard');
      test('Date range set to 90day', afterState.dateRange === '90day');
      test('Display mode set to r', afterState.displayMode === 'r');

    } else {
      console.log('❌ Chat components not found');
      test('Chat components available', false);
    }

  } catch (error) {
    console.log('❌ Command execution failed:', error.message);
    test('Command execution successful', false);
  }

  // Test 4: UI synchronization
  console.log('\n🔄 STEP 4: UI SYNCHRONIZATION');
  try {
    if (window.updateUIButtons) {
      window.updateUIButtons();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check visual elements
      const dateDropdown = document.querySelector('[data-testid="date-selector"]');
      const rButton = document.querySelector('[data-testid="display-mode-r"]');
      const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

      const has90DayText = dateDropdown?.textContent?.includes('90');
      const rButtonActive = rButton?.getAttribute('data-active') === 'true';
      const dollarButtonNotActive = dollarButton?.getAttribute('data-active') !== 'true';

      test('Date dropdown shows 90 day', has90DayText);
      test('R button is active', rButtonActive);
      test('Dollar button not active', dollarButtonNotActive);

      console.log('   UI State:');
      console.log('     Date dropdown:', dateDropdown?.textContent?.trim());
      console.log('     R button active:', rButtonActive);
      console.log('     Dollar button active:', dollarButton?.getAttribute('data-active') === 'true');

    } else {
      console.log('❌ updateUIButtons not available');
      test('updateUIButtons available', false);
    }
  } catch (error) {
    console.log('❌ UI sync test failed:', error.message);
    test('UI synchronization successful', false);
  }

  // Final results
  console.log('\n🏁 FINAL RESULTS');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  const successRate = (passedTests / totalTests) * 100;
  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED! System is working perfectly!');
  } else if (successRate >= 80) {
    console.log('\n✅ MOSTLY WORKING! Minor issues remain.');
  } else if (successRate >= 60) {
    console.log('\n⚠️ PARTIALLY WORKING! Significant issues remain.');
  } else {
    console.log('\n❌ MAJOR ISSUES! System needs more work.');
  }

  return { total: totalTests, passed: passedTests, successRate };
}

// Run the test
clearResultsTest().then(results => {
  console.log('\n✨ Test completed. Review the results above.');
});