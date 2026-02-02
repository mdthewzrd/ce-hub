/**
 * DIRECT CONTEXT TEST - Paste directly in browser console
 * This bypasses the chat system and tests the contexts directly
 */

console.clear();
console.log('🔧 DIRECT CONTEXT TEST');
console.log('=======================');

// Test if we can manually change the contexts
console.log('📊 Testing direct context manipulation...');

// Test DateRange context
if (window.dateRangeContext) {
  console.log('✅ DateRangeContext found');
  console.log('Current date range:', window.dateRangeContext.currentDateRange);

  try {
    window.dateRangeContext.setDateRange('90day');
    setTimeout(() => {
      console.log('After setting to 90day:', window.dateRangeContext.currentDateRange);

      if (window.dateRangeContext.currentDateRange === '90day') {
        console.log('✅ DateRangeContext MANUAL TEST PASSED');
      } else {
        console.log('❌ DateRangeContext MANUAL TEST FAILED');
      }
    }, 500);
  } catch (error) {
    console.log('❌ DateRangeContext error:', error.message);
  }
} else {
  console.log('❌ DateRangeContext not found');
}

// Test DisplayMode context
if (window.displayModeContext) {
  console.log('✅ DisplayModeContext found');
  console.log('Current display mode:', window.displayModeContext.displayMode);

  try {
    window.displayModeContext.setDisplayMode('r');
    setTimeout(() => {
      console.log('After setting to r:', window.displayModeContext.displayMode);

      if (window.displayModeContext.displayMode === 'r') {
        console.log('✅ DisplayModeContext MANUAL TEST PASSED');
      } else {
        console.log('❌ DisplayModeContext MANUAL TEST FAILED');
      }
    }, 1000);
  } catch (error) {
    console.log('❌ DisplayModeContext error:', error.message);
  }
} else {
  console.log('❌ DisplayModeContext not found');
}

// Test visual button states
console.log('\n🎨 Testing visual button states...');

const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');
const rButton = document.querySelector('[data-testid="display-mode-r"]');

console.log('Dollar button found:', !!dollarButton);
console.log('R button found:', !!rButton);

if (dollarButton && rButton) {
  console.log('Dollar button active (gold):', dollarButton.style.backgroundColor.includes('B8860B'));
  console.log('R button active (gold):', rButton.style.backgroundColor.includes('B8860B'));
}

// Check action bridge
console.log('\n⚙️ Testing action bridge...');
if (window.traderraExecuteActions) {
  console.log('✅ Action bridge found');

  // Test direct action execution
  window.traderraExecuteActions([
    { action_type: 'display_mode', parameters: { mode: 'r' } },
    { action_type: 'date_range', parameters: { date_range: '90day' } }
  ]).then(results => {
    console.log('📊 Action bridge results:', results);

    setTimeout(() => {
      console.log('\n🔍 FINAL STATE CHECK:');
      console.log('Date Range:', window.dateRangeContext?.currentDateRange);
      console.log('Display Mode:', window.displayModeContext?.displayMode);
      console.log('R Button Active:', rButton?.style.backgroundColor.includes('B8860B'));

      const success = {
        dateRange: window.dateRangeContext?.currentDateRange === '90day',
        displayMode: window.displayModeContext?.displayMode === 'r',
        visualButton: rButton?.style.backgroundColor.includes('B8860B')
      };

      console.log('\n🏆 DIRECT TEST RESULTS:');
      console.log('Date Range Change:', success.dateRange ? '✅ PASS' : '❌ FAIL');
      console.log('Display Mode Change:', success.displayMode ? '✅ PASS' : '❌ FAIL');
      console.log('Visual Button Change:', success.visualButton ? '✅ PASS' : '❌ FAIL');

      const allPassed = Object.values(success).every(Boolean);
      console.log('OVERALL:', allPassed ? '✅ ALL DIRECT TESTS PASSED!' : '❌ SOME DIRECT TESTS FAILED');

      if (!allPassed) {
        console.log('\n🔍 ISSUE DIAGNOSIS:');
        if (!success.dateRange) console.log('  - DateRangeContext not responding to changes');
        if (!success.displayMode) console.log('  - DisplayModeContext not responding to changes');
        if (!success.visualButton) console.log('  - UI buttons not updating with context changes');
      }
    }, 1000);

  }).catch(error => {
    console.log('❌ Action bridge error:', error);
  });
} else {
  console.log('❌ Action bridge not found');
}

console.log('\n💡 This test bypasses Renata chat and tests the underlying systems directly');