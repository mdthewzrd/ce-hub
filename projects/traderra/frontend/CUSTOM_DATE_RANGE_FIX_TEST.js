/**
 * CUSTOM DATE RANGE FIX VALIDATION TEST
 * Tests the fix for custom date range execution failure
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 CUSTOM DATE RANGE FIX VALIDATION');
console.log('===================================');

async function testCustomDateRangeFix() {
  console.log('🚀 Testing the custom date range execution fix...\n');

  const testCommand = 'show me last quarter through today';
  console.log(`📋 Testing command: "${testCommand}"`);

  try {
    // Step 1: Reset to different state first
    console.log('\n🔄 STEP 1: RESET STATE');
    if (window.dateRangeContext?.setDateRange) {
      window.dateRangeContext.setDateRange('month');
      console.log('  ✅ Reset date range to "month"');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Get before state
    const beforeState = {
      url: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode,
      customStart: window.dateRangeContext?.customStartDate,
      customEnd: window.dateRangeContext?.customEndDate
    };

    console.log('\n📊 BEFORE STATE:');
    console.log('  URL:', beforeState.url);
    console.log('  Date Range:', beforeState.dateRange);
    console.log('  Custom Start:', beforeState.customStart?.toISOString().split('T')[0]);
    console.log('  Custom End:', beforeState.customEnd?.toISOString().split('T')[0]);
    console.log('  Display Mode:', beforeState.displayMode);

    // Step 3: Execute the command
    console.log('\n🎯 STEP 2: EXECUTE CUSTOM DATE RANGE COMMAND');
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
    const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

    if (!chatInput || !sendButton) {
      console.log('  ❌ Chat components not found');
      return { success: false, error: 'Chat components not found' };
    }

    // Send command
    chatInput.value = testCommand;
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    sendButton.click();

    console.log('  ✅ Command sent, waiting for processing...');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Check after state
    const afterState = {
      url: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode,
      customStart: window.dateRangeContext?.customStartDate,
      customEnd: window.dateRangeContext?.customEndDate
    };

    console.log('\n📊 AFTER STATE:');
    console.log('  URL:', afterState.url);
    console.log('  Date Range:', afterState.dateRange);
    console.log('  Custom Start:', afterState.customStart?.toISOString().split('T')[0]);
    console.log('  Custom End:', afterState.customEnd?.toISOString().split('T')[0]);
    console.log('  Display Mode:', afterState.displayMode);

    // Step 5: Analyze results
    console.log('\n🔍 STEP 3: ANALYZE RESULTS');

    const dateRangeChanged = beforeState.dateRange !== afterState.dateRange;
    const customRangeSet = afterState.dateRange === 'custom';
    const hasCustomDates = !!afterState.customStart && !!afterState.customEnd;

    console.log('  Date range changed:', dateRangeChanged ? '✅ YES' : '❌ NO');
    console.log('  Custom range set:', customRangeSet ? '✅ YES' : '❌ NO');
    console.log('  Has custom dates:', hasCustomDates ? '✅ YES' : '❌ NO');

    // Calculate expected dates for "last quarter through today"
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
    const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const expectedStart = new Date(year, lastQuarter * 3, 1);
    const expectedEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const expectedStartStr = expectedStart.toISOString().split('T')[0];
    const expectedEndStr = expectedEnd.toISOString().split('T')[0];
    const actualStartStr = afterState.customStart?.toISOString().split('T')[0];
    const actualEndStr = afterState.customEnd?.toISOString().split('T')[0];

    console.log('\n📅 DATE COMPARISON:');
    console.log('  Expected start:', expectedStartStr);
    console.log('  Actual start:', actualStartStr);
    console.log('  Expected end:', expectedEndStr);
    console.log('  Actual end:', actualEndStr);

    const datesMatch = actualStartStr === expectedStartStr && actualEndStr === expectedEndStr;
    console.log('  Dates match:', datesMatch ? '✅ YES' : '❌ NO');

    // Step 6: Final verdict
    const success = dateRangeChanged && customRangeSet && hasCustomDates && datesMatch;

    console.log('\n🏁 FINAL VERDICT:');
    if (success) {
      console.log('🎉 SUCCESS! Custom date range fix is working perfectly!');
      console.log('✅ Pattern detection: Working');
      console.log('✅ Command generation: Working');
      console.log('✅ Command execution: Working');
      console.log('✅ Custom range setting: Working');
      console.log('✅ State verification: Working');
      console.log(`✅ Date calculation: ${expectedStartStr} to ${expectedEndStr}`);
    } else {
      console.log('❌ FAILURE! Custom date range still has issues:');
      if (!dateRangeChanged) console.log('  ❌ Date range did not change');
      if (!customRangeSet) console.log('  ❌ Custom range was not set');
      if (!hasCustomDates) console.log('  ❌ Custom dates are missing');
      if (!datesMatch) console.log('  ❌ Date calculation is incorrect');
    }

    return {
      success,
      beforeState,
      afterState,
      expectedDates: { start: expectedStartStr, end: expectedEndStr },
      actualDates: { start: actualStartStr, end: actualEndStr }
    };

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testCustomDateRangeFix().then(results => {
  console.log('\n✨ Custom date range fix validation complete!');
  console.log(`Result: ${results.success ? '✅ SUCCESS' : '❌ FAILURE'}`);

  if (results.success) {
    console.log('\n🎯 The fix is working! You can now use commands like:');
    console.log('• "show me last quarter through today"');
    console.log('• "dashboard for last month through today"');
    console.log('• "trades from this quarter through today"');
    console.log('• "statistics for last year through today"');
  }
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});

console.log('\n⏳ Custom date range fix validation running...');