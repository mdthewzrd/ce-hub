/**
 * COMPREHENSIVE CUSTOM DATE RANGE TEST
 * Tests the new sophisticated natural date parsing functionality
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🗓️ COMPREHENSIVE CUSTOM DATE RANGE TEST');
console.log('======================================');

async function testCustomDateRanges() {
  console.log('🚀 Testing sophisticated custom date range recognition...\n');

  const testCommands = [
    // Complex range expressions that should now work
    'show me last quarter through today',
    'dashboard for january through march',
    'trades from july to the end of august',
    'statistics for march through june',
    'journal from october to december 2024',
    'Q1 2024 data',
    'first half of the year',
    'second quarter through today',
    'last 3 months in R',
    'ytd through today',
    'march 15 to april 20',
    '15th of january to 13th of march',
    'january 2024 to march 2024',
    '2024-01-15 to 2024-03-13'
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

      // Send command
      chatInput.value = command;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check after state
      const afterState = {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange,
        displayMode: window.displayModeContext?.displayMode
      };

      // Check for custom date range indicators
      const hasCustomDateRange = window.dateRangeContext?.currentDateRange === 'custom';
      const dateRangeChanged = beforeState.dateRange !== afterState.dateRange;

      console.log(`  📊 Before: ${beforeState.dateRange} -> After: ${afterState.dateRange}`);
      console.log(`  🎯 Custom range detected: ${hasCustomDateRange}`);
      console.log(`  ✨ Date range changed: ${dateRangeChanged}`);

      if (dateRangeChanged || hasCustomDateRange) {
        console.log(`  ✅ PASS: Date range processing succeeded`);
        passedTests++;
        results.push({ command, status: 'PASS', dateRangeChanged, customRange: hasCustomDateRange });
      } else {
        console.log(`  ⚠️  PARTIAL: Command processed but no date range change detected`);
        results.push({ command, status: 'PARTIAL', reason: 'No date range change detected' });
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
    const icon = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${icon} ${index + 1}. "${result.command}" - ${result.status}`);
    if (result.reason) console.log(`    Reason: ${result.reason}`);
    if (result.customRange) console.log(`    Custom range: ${result.customRange}`);
  });

  // Categorize results
  const passed = results.filter(r => r.status === 'PASS').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const failed = results.filter(r => r.status === 'ERROR' || r.status === 'FAIL').length;

  console.log('\n🎯 PERFORMANCE ANALYSIS:');
  console.log(`✅ Full Success: ${passed} commands`);
  console.log(`⚠️ Partial Success: ${partial} commands`);
  console.log(`❌ Failed: ${failed} commands`);

  const successRate = (passedTests / totalTests) * 100;
  if (successRate >= 80) {
    console.log('\n🎉 EXCELLENT! Custom date range recognition is working very well!');
  } else if (successRate >= 60) {
    console.log('\n✅ GOOD! Custom date range recognition is mostly working.');
  } else {
    console.log('\n⚠️ NEEDS WORK: Custom date range recognition needs improvement.');
  }

  console.log('\n💡 EXPECTED CAPABILITIES:');
  console.log('The system should now understand complex date expressions like:');
  console.log('• "last quarter through today"');
  console.log('• "january through march"');
  console.log('• "Q1 2024 data"');
  console.log('• "first half of the year"');
  console.log('• "march 15 to april 20"');
  console.log('• "2024-01-15 to 2024-03-13"');

  return { total: totalTests, passed: passedTests, successRate, results };
}

// Run the comprehensive test
testCustomDateRanges().then(results => {
  console.log('\n✨ Comprehensive custom date range testing complete!');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});

console.log('\n⏳ Comprehensive custom date range test running...');