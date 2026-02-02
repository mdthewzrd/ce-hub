/**
 * DEBUG EXECUTION TEST - Isolate and test state change execution
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 DEBUG EXECUTION TEST');
console.log('==========================');

async function debugExecution() {
  console.log('🚀 Debugging state change execution...');

  // Check initial contexts
  console.log('\n📊 INITIAL CONTEXTS:');
  console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
  console.log('  DisplayMode Context:', window.displayModeContext?.displayMode);
  console.log('  URL:', window.location.pathname);

  // Test direct state manipulation first
  console.log('\n🧪 TESTING DIRECT STATE MANIPULATION:');

  // Test 1: Direct date range change
  if (window.dateRangeContext?.setDateRange) {
    console.log('  📅 Testing direct setDateRange("90day")...');
    try {
      window.dateRangeContext.setDateRange('90day');

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      const newDateRange = window.dateRangeContext.currentDateRange;
      console.log('  ✅ Date Range After Direct Set:', newDateRange);
      console.log('  📊 Success:', newDateRange === '90day' ? 'PASS' : 'FAIL');
    } catch (error) {
      console.log('  ❌ Direct setDateRange failed:', error.message);
    }
  }

  // Test 2: Direct display mode change
  if (window.displayModeContext?.setDisplayMode) {
    console.log('  🎨 Testing direct setDisplayMode("r")...');
    try {
      window.displayModeContext.setDisplayMode('r');

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      const newDisplayMode = window.displayModeContext.displayMode;
      console.log('  ✅ Display Mode After Direct Set:', newDisplayMode);
      console.log('  📊 Success:', newDisplayMode === 'r' ? 'PASS' : 'FAIL');
    } catch (error) {
      console.log('  ❌ Direct setDisplayMode failed:', error.message);
    }
  }

  // Test 3: Test executeSingleCommand function directly
  console.log('\n🔧 TESTING EXECUTE SINGLE COMMAND:');

  if (window.executeSingleCommand) {
    console.log('  ✅ executeSingleCommand function available');

    // Test date range command
    console.log('  📅 Testing executeSingleCommand for date range...');
    try {
      const dateCommand = {
        action_type: 'date_range',
        parameters: { date_range: 'last_90_days' }
      };

      console.log('  📤 Command:', dateCommand);
      const result = await window.executeSingleCommand(dateCommand);
      console.log('  📊 Result:', result);

      // Check if state changed
      await new Promise(resolve => setTimeout(resolve, 500));
      const actualDateRange = window.dateRangeContext?.currentDateRange;
      console.log('  🔍 Actual Date Range After Execution:', actualDateRange);

    } catch (error) {
      console.log('  ❌ executeSingleCommand date range failed:', error.message);
    }

    // Test display mode command
    console.log('  🎨 Testing executeSingleCommand for display mode...');
    try {
      const displayCommand = {
        action_type: 'display_mode',
        parameters: { mode: 'r' }
      };

      console.log('  📤 Command:', displayCommand);
      const result = await window.executeSingleCommand(displayCommand);
      console.log('  📊 Result:', result);

      // Check if state changed
      await new Promise(resolve => setTimeout(resolve, 500));
      const actualDisplayMode = window.displayModeContext?.displayMode;
      console.log('  🔍 Actual Display Mode After Execution:', actualDisplayMode);

    } catch (error) {
      console.log('  ❌ executeSingleCommand display mode failed:', error.message);
    }

  } else {
    console.log('  ❌ executeSingleCommand function not available');
  }

  // Test 4: Test verifyStateChange function directly
  console.log('\n🔍 TESTING VERIFICATION FUNCTION:');

  if (window.verifyStateChange) {
    console.log('  ✅ verifyStateChange function available');

    // Test date range verification
    console.log('  📅 Testing verifyStateChange for date range...');
    try {
      const dateCommand = {
        action_type: 'date_range',
        parameters: { date_range: '90day' }  // Use the mapped value
      };

      console.log('  📤 Verification Command:', dateCommand);
      const verification = await window.verifyStateChange(dateCommand);
      console.log('  📊 Verification Result:', verification);

    } catch (error) {
      console.log('  ❌ verifyStateChange date range failed:', error.message);
    }

  } else {
    console.log('  ❌ verifyStateChange function not available');
  }

  // Final state check
  console.log('\n📊 FINAL CONTEXTS:');
  console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
  console.log('  DisplayMode Context:', window.displayModeContext?.displayMode);
  console.log('  URL:', window.location.pathname);

  console.log('\n🎯 SUMMARY:');
  console.log('  Functions available:');
  console.log('    executeSingleCommand:', !!window.executeSingleCommand);
  console.log('    verifyStateChange:', !!window.verifyStateChange);
  console.log('    updateUIButtons:', !!window.updateUIButtons);
  console.log('  Contexts available:');
  console.log('    dateRangeContext:', !!window.dateRangeContext);
  console.log('    displayModeContext:', !!window.displayModeContext);
}

// Expose functions for testing
window.debugExecution = debugExecution;

// Run the debug test
debugExecution();

console.log('\n⏳ Debug execution test complete. Check results above.');