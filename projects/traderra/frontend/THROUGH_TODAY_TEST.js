/**
 * THROUGH TODAY TEST - Validates the new "X through today" functionality
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🗓️ THROUGH TODAY FUNCTIONALITY TEST');
console.log('=====================================');

async function testThroughTodayPatterns() {
  console.log('🚀 Testing "X through today" date range patterns...\n');

  const testCommands = [
    'show me last quarter through today',
    'dashboard for last month through today',
    'trades from this quarter through today',
    'statistics for last year through today',
    'journal for ytd through today'
  ];

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  for (const command of testCommands) {
    totalTests++;
    console.log(`📋 Test ${totalTests}: "${command}"`);

    try {
      // Find chat components
      const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
      const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

      if (!chatInput || !sendButton) {
        console.log('  ❌ Chat components not found');
        results.push({ command, status: 'FAIL', reason: 'Chat components not found' });
        continue;
      }

      // Get before state
      const beforeState = {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange,
        displayMode: window.displayModeContext?.displayMode
      };

      console.log(`  📊 Before: ${beforeState.dateRange}`);

      // Send command
      chatInput.value = command;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Check after state
      const afterState = {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange,
        displayMode: window.displayModeContext?.displayMode
      };

      console.log(`  📊 After: ${afterState.dateRange}`);

      const dateRangeChanged = beforeState.dateRange !== afterState.dateRange;
      const hasCustomDateRange = afterState.dateRange === 'custom';

      console.log(`  ✨ Date range changed: ${dateRangeChanged}`);
      console.log(`  🎯 Custom range detected: ${hasCustomDateRange}`);

      // Check for success
      const success = dateRangeChanged && (hasCustomDateRange ||
        (afterState.dateRange && afterState.dateRange !== beforeState.dateRange));

      if (success) {
        console.log(`  ✅ PASS: "Through today" date range processing succeeded`);
        passedTests++;
        results.push({
          command,
          status: 'PASS',
          dateRangeChanged,
          customRange: hasCustomDateRange,
          beforeRange: beforeState.dateRange,
          afterRange: afterState.dateRange
        });
      } else {
        console.log(`  ❌ FAIL: No date range change detected`);
        results.push({
          command,
          status: 'FAIL',
          reason: 'No date range change detected',
          beforeRange: beforeState.dateRange,
          afterRange: afterState.dateRange
        });
      }

    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      results.push({ command, status: 'ERROR', reason: error.message });
    }

    console.log(''); // Add spacing between tests
  }

  // Final results summary
  console.log('📈 FINAL RESULTS');
  console.log('================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  console.log('\n📊 DETAILED RESULTS:');
  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. "${result.command}" - ${result.status}`);
    if (result.reason) console.log(`    Reason: ${result.reason}`);
    if (result.beforeRange && result.afterRange) {
      console.log(`    Date range: ${result.beforeRange} → ${result.afterRange}`);
    }
    if (result.customRange) console.log(`    Custom range: ✅`);
  });

  // Success analysis
  const successRate = (passedTests / totalTests) * 100;
  if (successRate >= 80) {
    console.log('\n🎉 EXCELLENT! "Through today" functionality is working very well!');
  } else if (successRate >= 60) {
    console.log('\n✅ GOOD! "Through today" functionality is mostly working.');
  } else if (successRate >= 40) {
    console.log('\n⚠️ PARTIAL! "Through today" functionality needs some improvement.');
  } else {
    console.log('\n❌ NEEDS WORK! "Through today" functionality has major issues.');
  }

  console.log('\n💡 EXPECTED BEHAVIOR:');
  console.log('Each command should:');
  console.log('• Detect "through today" pattern');
  console.log('• Extract base period (last quarter, last month, etc.)');
  console.log('• Create custom date range from base period start to today');
  console.log('• Execute the date range change');
  console.log('• Update the UI with new date range');

  return { total: totalTests, passed: passedTests, successRate, results };
}

// Quick verification helper
function verifyDateRangeChange(description, testCommand) {
  console.log(`\n🔍 Quick Verification: ${description}`);
  console.log(`Command: "${testCommand}"`);

  const before = window.dateRangeContext?.currentDateRange;
  console.log(`Before: ${before}`);

  const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
  const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

  if (chatInput && sendButton) {
    chatInput.value = testCommand;
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    sendButton.click();

    setTimeout(() => {
      const after = window.dateRangeContext?.currentDateRange;
      console.log(`After: ${after}`);
      console.log(`Changed: ${before !== after ? '✅ YES' : '❌ NO'}`);
    }, 3000);
  }
}

// Run the comprehensive test
testThroughTodayPatterns().then(results => {
  console.log('\n✨ "Through today" functionality testing complete!');

  // Quick verification for the main test case
  console.log('\n🎯 Running quick verification for main test case...');
  verifyDateRangeChange('Main Test Case', 'show me last quarter through today');

}).catch(error => {
  console.error('💥 Test execution failed:', error);
});

console.log('\n⏳ "Through today" functionality test running...');