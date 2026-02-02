/**
 * FINAL TEST - Tests the complete system after UI sync fix
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 FINAL TEST - After UI Sync Fix');
console.log('=================================');

// Test the complete flow with the fixed UI synchronization
async function testCompleteSystem() {
  console.log('🚀 Testing complete Renata system...');

  // Check chat components
  const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
  const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

  if (!chatInput || !sendButton) {
    console.log('❌ Chat components not found');
    return;
  }

  console.log('✅ Chat components found');

  // Take initial snapshot
  const initialState = {
    url: window.location.pathname,
    dateRange: window.dateRangeContext?.currentDateRange,
    displayMode: window.displayModeContext?.displayMode,
    dollarButton: document.querySelector('[data-testid="display-mode-dollar"]')?.style.backgroundColor.includes('B8860B'),
    rButton: document.querySelector('[data-testid="display-mode-r"]')?.style.backgroundColor.includes('B8860B'),
    date90Button: document.querySelector('[data-testid="date-range-90day"]')?.style.backgroundColor.includes('B8860B')
  };

  console.log('📸 Initial State:');
  console.log('  URL:', initialState.url);
  console.log('  Date Range:', initialState.dateRange || 'not-found');
  console.log('  Display Mode:', initialState.displayMode || 'not-found');
  console.log('  Dollar Button Active:', initialState.dollarButton ? '✅' : '❌');
  console.log('  R Button Active:', initialState.rButton ? '✅' : '❌');
  console.log('  90d Button Active:', initialState.date90Button ? '✅' : '❌');

  // Test command
  console.log('\n🎯 Testing: "go to the dashboard and look at the last 90 days in R"');

  // Type and send command
  chatInput.focus();
  chatInput.value = "go to the dashboard and look at the last 90 days in R";
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));
  sendButton.click();

  console.log('✅ Command sent');

  // Wait for processing
  console.log('⏳ Processing command...');

  // Monitor changes for 10 seconds
  let checkCount = 0;
  const maxChecks = 10;

  return new Promise((resolve) => {
    const monitor = setInterval(() => {
      checkCount++;

      const currentState = {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange,
        displayMode: window.displayModeContext?.displayMode,
        dollarButton: document.querySelector('[data-testid="display-mode-dollar"]')?.style.backgroundColor.includes('B8860B'),
        rButton: document.querySelector('[data-testid="display-mode-r"]')?.style.backgroundColor.includes('B8860B'),
        date90Button: document.querySelector('[data-testid="date-range-90day"]')?.style.backgroundColor.includes('B8860B')
      };

      const changes = {
        navigation: currentState.url !== initialState.url,
        dateRangeContext: currentState.dateRange !== initialState.dateRange,
        displayModeContext: currentState.displayMode !== initialState.displayMode,
        dollarButtonVisual: currentState.dollarButton !== initialState.dollarButton,
        rButtonVisual: currentState.rButton !== initialState.rButton,
        date90ButtonVisual: currentState.date90Button !== initialState.date90Button
      };

      if (Object.values(changes).some(Boolean)) {
        console.log('\n🎯 CHANGES DETECTED:');
        if (changes.navigation) console.log(`  Navigation: ${initialState.url} → ${currentState.url} ✅`);
        if (changes.dateRangeContext) console.log(`  Date Range Context: ${initialState.dateRange} → ${currentState.dateRange} ✅`);
        if (changes.displayModeContext) console.log(`  Display Mode Context: ${initialState.displayMode} → ${currentState.displayMode} ✅`);
        if (changes.dollarButtonVisual) console.log(`  Dollar Button Visual: ${initialState.dollarButton ? 'active' : 'inactive'} → ${currentState.dollarButton ? 'active' : 'inactive'} ✅`);
        if (changes.rButtonVisual) console.log(`  R Button Visual: ${initialState.rButton ? 'active' : 'inactive'} → ${currentState.rButton ? 'active' : 'inactive'} ✅`);
        if (changes.date90ButtonVisual) console.log(`  90d Button Visual: ${initialState.date90Button ? 'active' : 'inactive'} → ${currentState.date90Button ? 'active' : 'inactive'} ✅`);
      }

      // Stop after max checks
      if (checkCount >= maxChecks) {
        clearInterval(monitor);

        console.log('\n📊 FINAL RESULTS:');
        console.log('  Final URL:', currentState.url);
        console.log('  Final Date Range:', currentState.dateRange || 'not-found');
        console.log('  Final Display Mode:', currentState.displayMode || 'not-found');
        console.log('  Final Dollar Button:', currentState.dollarButton ? 'active' : 'inactive');
        console.log('  Final R Button:', currentState.rButton ? 'active' : 'inactive');
        console.log('  Final 90d Button:', currentState.date90Button ? 'active' : 'inactive');

        // Success criteria
        const success = {
          navigation: currentState.url === '/dashboard',
          dateRangeContext: currentState.dateRange === '90day',
          displayModeContext: currentState.displayMode === 'r',
          rButtonVisual: currentState.rButton === true,
          date90ButtonVisual: currentState.date90Button === true
        };

        console.log('\n✅ SUCCESS CHECK:');
        console.log('  Navigation to dashboard:', success.navigation ? '✅ PASS' : '❌ FAIL');
        console.log('  Date Range context: 90day:', success.dateRangeContext ? '✅ PASS' : '❌ FAIL');
        console.log('  Display Mode context: r:', success.displayModeContext ? '✅ PASS' : '❌ FAIL');
        console.log('  R button visual (gold):', success.rButtonVisual ? '✅ PASS' : '❌ FAIL');
        console.log('  90d button visual (gold):', success.date90ButtonVisual ? '✅ PASS' : '❌ FAIL');

        const allPassed = Object.values(success).every(Boolean);
        console.log('\n🏆 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED! BULLETPROOF SYSTEM WORKING!' : '❌ SOME TESTS FAILED');

        if (allPassed) {
          console.log('\n🎉 SUCCESS! The bulletproof validation system is now working correctly.');
          console.log('✅ Context changes detected');
          console.log('✅ UI synchronization working');
          console.log('✅ Multi-command execution successful');
        } else {
          console.log('\n🔍 Remaining issues:');
          if (!success.navigation) console.log('  - Navigation not working');
          if (!success.dateRangeContext) console.log('  - Date range context not updating');
          if (!success.displayModeContext) console.log('  - Display mode context not updating');
          if (!success.rButtonVisual) console.log('  - R button not updating visually');
          if (!success.date90ButtonVisual) console.log('  - 90d button not updating visually');
        }

        resolve(allPassed);
      }
    }, 1000);
  });
}

// Run the test
testCompleteSystem().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log(success ? '🎉 BULLETPROOF SYSTEM VALIDATED!' : '⚠️  Issues remain to be fixed');
  console.log('='.repeat(50));
});

console.log('⏳ Running complete system test for 10 seconds...');