/**
 * QUICK TEST - Paste directly in browser console on localhost:6565/dashboard
 * This will test the Renata chat command execution immediately
 */

console.clear();
console.log('🧪 QUICK RENATA TEST');
console.log('=====================');

// Check if we're on the right page
if (!window.location.pathname.includes('/dashboard')) {
  console.log('❌ Not on dashboard. Navigate to localhost:6565/dashboard first');
} else {
  console.log('✅ On dashboard page');
}

// Check chat components
const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

if (!chatInput || !sendButton) {
  console.log('❌ Chat components not found');
} else {
  console.log('✅ Chat components found');
}

// Check contexts
console.log('📊 Context Status:');
console.log('  DateRange Context:', !!window.dateRangeContext);
console.log('  DisplayMode Context:', !!window.displayModeContext);

if (window.dateRangeContext) {
  console.log('  Current Date Range:', window.dateRangeContext.currentDateRange);
}
if (window.displayModeContext) {
  console.log('  Current Display Mode:', window.displayModeContext.displayMode);
}

// Take initial state snapshot
const initialState = {
  url: window.location.pathname,
  dateRange: window.dateRangeContext?.currentDateRange,
  displayMode: window.displayModeContext?.displayMode,
  activeDisplayButton: document.querySelector('[data-testid="display-mode-dollar"]')?.style.backgroundColor.includes('B8860B') ? 'dollar' :
                      document.querySelector('[data-testid="display-mode-r"]')?.style.backgroundColor.includes('B8860B') ? 'r' : 'unknown'
};

console.log('📸 INITIAL STATE:');
console.log('  URL:', initialState.url);
console.log('  Date Range:', initialState.dateRange || 'not-found');
console.log('  Display Mode:', initialState.displayMode || 'not-found');
console.log('  Active Button:', initialState.activeDisplayButton);

// Test the command
console.log('\n🚀 TESTING COMMAND: "go to the dashboard and look at the last 90 days in R"');

if (chatInput && sendButton) {
  // Type and send the command
  chatInput.focus();
  chatInput.value = "go to the dashboard and look at the last 90 days in R";
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));

  console.log('✅ Command typed');

  // Click send
  sendButton.click();
  console.log('✅ Send clicked');

  // Monitor for changes
  let checkCount = 0;
  const maxChecks = 8; // Check for 8 seconds

  const stateMonitor = setInterval(() => {
    checkCount++;

    const currentState = {
      url: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode,
      activeDisplayButton: document.querySelector('[data-testid="display-mode-dollar"]')?.style.backgroundColor.includes('B8860B') ? 'dollar' :
                          document.querySelector('[data-testid="display-mode-r"]')?.style.backgroundColor.includes('B8860B') ? 'r' : 'unknown'
    };

    // Check for changes
    const changes = {
      navigation: currentState.url !== initialState.url,
      dateRange: currentState.dateRange !== initialState.dateRange,
      displayMode: currentState.displayMode !== initialState.displayMode,
      visualButton: currentState.activeDisplayButton !== initialState.activeDisplayButton
    };

    if (Object.values(changes).some(Boolean)) {
      console.log('\n🎯 STATE CHANGES DETECTED:');
      if (changes.navigation) {
        console.log(`  Navigation: ${initialState.url} → ${currentState.url} ✅`);
      }
      if (changes.dateRange) {
        console.log(`  Date Range: ${initialState.dateRange} → ${currentState.dateRange} ✅`);
      }
      if (changes.displayMode) {
        console.log(`  Display Mode: ${initialState.displayMode} → ${currentState.displayMode} ✅`);
      }
      if (changes.visualButton) {
        console.log(`  Visual Button: ${initialState.activeDisplayButton} → ${currentState.activeDisplayButton} ✅`);
      }
    }

    // Stop after max checks
    if (checkCount >= maxChecks) {
      clearInterval(stateMonitor);

      console.log('\n📊 FINAL RESULTS:');
      console.log('  Final URL:', currentState.url);
      console.log('  Final Date Range:', currentState.dateRange || 'not-found');
      console.log('  Final Display Mode:', currentState.displayMode || 'not-found');
      console.log('  Final Active Button:', currentState.activeDisplayButton);

      // Success criteria
      const success = {
        navigation: currentState.url === '/dashboard',
        dateRange: currentState.dateRange === '90day',
        displayMode: currentState.displayMode === 'r',
        visualButton: currentState.activeDisplayButton === 'r'
      };

      console.log('\n✅ SUCCESS CHECK:');
      console.log('  Navigation to dashboard:', success.navigation ? '✅ PASS' : '❌ FAIL');
      console.log('  Date range changed to 90day:', success.dateRange ? '✅ PASS' : '❌ FAIL');
      console.log('  Display mode changed to r:', success.displayMode ? '✅ PASS' : '❌ FAIL');
      console.log('  Visual button shows R:', success.visualButton ? '✅ PASS' : '❌ FAIL');

      const allPassed = Object.values(success).every(Boolean);
      console.log('\n🏆 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');

      if (!allPassed) {
        console.log('\n🔍 TROUBLESHOOTING:');
        if (!success.navigation) console.log('  - Navigation not working');
        if (!success.dateRange) console.log('  - Date range not changing');
        if (!success.displayMode) console.log('  - Display mode context not updating');
        if (!success.visualButton) console.log('  - Visual button state not updating');
      }
    }
  }, 1000);

  console.log('⏳ Monitoring for changes for 8 seconds...');

} else {
  console.log('❌ Cannot test - chat components not available');
}

console.log('\n💡 If you see "Sorry, I encountered an error", check the server logs for Prisma/import issues');