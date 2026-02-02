/**
 * DEBUG FULL FLOW TEST - Test the complete Renata chat processing flow
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 DEBUG FULL FLOW TEST');
console.log('=========================');

async function debugFullFlow() {
  console.log('🚀 Debugging complete Renata chat flow...');

  // Step 1: Check initial state
  console.log('\n📊 STEP 1: INITIAL STATE');
  console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
  console.log('  DisplayMode Context:', window.displayModeContext?.displayMode);
  console.log('  Functions available:');
  console.log('    window.dateRangeContext?.setDateRange:', !!window.dateRangeContext?.setDateRange);
  console.log('    window.displayModeContext?.setDisplayMode:', !!window.displayModeContext?.setDisplayMode);

  // Step 2: Test manual context manipulation again
  console.log('\n🧪 STEP 2: MANUAL CONTEXT MANIPULATION');
  try {
    window.dateRangeContext?.setDateRange('90day');
    window.displayModeContext?.setDisplayMode('r');
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('  ✅ After manual set:');
    console.log('    Date Range:', window.dateRangeContext?.currentDateRange);
    console.log('    Display Mode:', window.displayModeContext?.displayMode);
  } catch (error) {
    console.log('  ❌ Manual manipulation failed:', error.message);
  }

  // Step 3: Test executeSingleCommand with exact parameters from your logs
  console.log('\n🔧 STEP 3: TEST EXECUTE SINGLE COMMAND');

  // Test date range with the exact parameters that should be generated
  console.log('  📅 Testing date range command...');
  try {
    const dateCommand = {
      action_type: 'date_range',
      parameters: { date_range: 'last_90_days' }  // This should map to '90day'
    };
    console.log('    Command:', dateCommand);

    const dateResult = await window.executeSingleCommand(dateCommand);
    console.log('    Result:', dateResult);

    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('    Context after:', window.dateRangeContext?.currentDateRange);

  } catch (error) {
    console.log('    ❌ Date command failed:', error.message);
    console.log('    Stack:', error.stack);
  }

  // Test display mode with exact parameters
  console.log('  🎨 Testing display mode command...');
  try {
    const displayCommand = {
      action_type: 'display_mode',
      parameters: { mode: 'r' }
    };
    console.log('    Command:', displayCommand);

    const displayResult = await window.executeSingleCommand(displayCommand);
    console.log('    Result:', displayResult);

    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('    Context after:', window.displayModeContext?.displayMode);

  } catch (error) {
    console.log('    ❌ Display command failed:', error.message);
    console.log('    Stack:', error.stack);
  }

  // Step 4: Simulate the actual chat command processing
  console.log('\n💬 STEP 4: SIMULATE CHAT COMMAND PROCESSING');
  console.log('  Simulating: "go to the dashboard and look at the last 90 days in R"');

  try {
    // Find chat components
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
    const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

    if (chatInput && sendButton) {
      console.log('    ✅ Chat components found');

      // Get state before
      const beforeUrl = window.location.pathname;
      const beforeDateRange = window.dateRangeContext?.currentDateRange;
      const beforeDisplayMode = window.displayModeContext?.displayMode;

      console.log('    📊 State before command:');
      console.log('      URL:', beforeUrl);
      console.log('      Date Range:', beforeDateRange);
      console.log('      Display Mode:', beforeDisplayMode);

      // Send the command
      console.log('    📤 Sending command...');
      chatInput.value = "go to the dashboard and look at the last 90 days in R";
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      // Wait for processing
      console.log('    ⏳ Processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check state after
      const afterUrl = window.location.pathname;
      const afterDateRange = window.dateRangeContext?.currentDateRange;
      const afterDisplayMode = window.displayModeContext?.displayMode;

      console.log('    📊 State after command:');
      console.log('      URL:', afterUrl);
      console.log('      Date Range:', afterDateRange);
      console.log('      Display Mode:', afterDisplayMode);

      // Analyze results
      console.log('    🎯 ANALYSIS:');
      console.log('      Navigation changed:', beforeUrl !== afterUrl ? '✅ YES' : '❌ NO');
      console.log('      Date range changed:', beforeDateRange !== afterDateRange ? '✅ YES' : '❌ NO');
      console.log('      Display mode changed:', beforeDisplayMode !== afterDisplayMode ? '✅ YES' : '❌ NO');

      console.log('    📊 SUCCESS METRICS:');
      console.log('      Navigation to dashboard:', afterUrl === '/dashboard' ? '✅ PASS' : '❌ FAIL');
      console.log('      Date range set to 90day:', afterDateRange === '90day' ? '✅ PASS' : '❌ FAIL');
      console.log('      Display mode set to r:', afterDisplayMode === 'r' ? '✅ PASS' : '❌ FAIL');

    } else {
      console.log('    ❌ Chat components not found');
    }

  } catch (error) {
    console.log('    ❌ Chat simulation failed:', error.message);
    console.log('    Stack:', error.stack);
  }

  // Step 5: Test UI synchronization
  console.log('\n🔄 STEP 5: TEST UI SYNCHRONIZATION');
  try {
    if (window.updateUIButtons) {
      console.log('    🔧 Calling updateUIButtons...');
      window.updateUIButtons();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check UI elements
      const dateDropdown = document.querySelector('[data-testid="date-selector"]');
      const rButton = document.querySelector('[data-testid="display-mode-r"]');

      console.log('    📊 UI Elements:');
      console.log('      Date dropdown text:', dateDropdown?.textContent?.trim());
      console.log('      R button active:', rButton?.getAttribute('data-active') === 'true');
      console.log('      R button gold:', rButton?.style?.backgroundColor?.includes('B8860B'));

    } else {
      console.log('    ❌ updateUIButtons not available');
    }
  } catch (error) {
    console.log('    ❌ UI sync test failed:', error.message);
  }

  console.log('\n🏁 FULL FLOW DEBUG COMPLETE');
  console.log('=========================');
}

// Run the debug test
debugFullFlow();

console.log('\n⏳ Full flow debug test running...');