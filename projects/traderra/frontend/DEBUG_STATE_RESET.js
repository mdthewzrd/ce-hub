/**
 * DEBUG STATE RESET TEST - Reset state first, then test changes
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 DEBUG STATE RESET TEST');
console.log('===========================');

async function debugStateReset() {
  console.log('🚀 Testing with proper state reset...');

  // Step 1: Reset to known different state first
  console.log('\n🔄 STEP 1: RESET STATE TO DIFFERENT VALUES');
  try {
    // Reset to different values so we can see changes
    console.log('  📅 Resetting date range to "month"...');
    window.dateRangeContext?.setDateRange('month');

    console.log('  🎨 Resetting display mode to "dollar"...');
    window.displayModeContext?.setDisplayMode('dollar');

    console.log('  🧭 Resetting to trades page...');
    await new Promise(resolve => {
      window.location.href = '/trades';
      setTimeout(resolve, 1000);
    });

    // Wait for all changes to apply
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('  ✅ State reset complete');
    console.log('    Current URL:', window.location.pathname);
    console.log('    Date Range:', window.dateRangeContext?.currentDateRange);
    console.log('    Display Mode:', window.displayModeContext?.displayMode);

  } catch (error) {
    console.log('  ❌ State reset failed:', error.message);
  }

  // Step 2: Now test the target command
  console.log('\n🎯 STEP 2: TEST TARGET COMMAND');
  console.log('  Testing: "go to the dashboard and look at the last 90 days in R"');

  try {
    // Record before state
    const beforeState = {
      url: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode
    };

    console.log('  📊 State before command:', beforeState);

    // Find and use chat
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
    const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

    if (chatInput && sendButton) {
      console.log('  ✅ Chat components found, sending command...');

      // Send the command
      chatInput.value = "go to the dashboard and look at the last 90 days in R";
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      console.log('  ⏳ Command sent, waiting for processing...');
      await new Promise(resolve => setTimeout(resolve, 4000)); // Wait longer for processing

      // Check after state
      const afterState = {
        url: window.location.pathname,
        dateRange: window.dateRangeContext?.currentDateRange,
        displayMode: window.displayModeContext?.displayMode
      };

      console.log('  📊 State after command:', afterState);

      // Analyze what changed
      const changes = {
        navigation: beforeState.url !== afterState.url,
        dateRange: beforeState.dateRange !== afterState.dateRange,
        displayMode: beforeState.displayMode !== afterState.displayMode
      };

      console.log('  🎯 CHANGES DETECTED:');
      console.log('    Navigation changed:', changes.navigation ? '✅ YES' : '❌ NO');
      console.log('    Date range changed:', changes.dateRange ? '✅ YES' : '❌ NO');
      console.log('    Display mode changed:', changes.displayMode ? '✅ YES' : '❌ NO');

      // Test success criteria
      const success = {
        navigation: afterState.url === '/dashboard',
        dateRange: afterState.dateRange === '90day',
        displayMode: afterState.displayMode === 'r'
      };

      console.log('  📊 SUCCESS TEST:');
      console.log('    Navigation to dashboard:', success.navigation ? '✅ PASS' : '❌ FAIL');
      console.log('    Date range set to 90day:', success.dateRange ? '✅ PASS' : '❌ FAIL');
      console.log('    Display mode set to r:', success.displayMode ? '✅ PASS' : '❌ FAIL');

      const allPassed = Object.values(success).every(Boolean);
      console.log('\n  🏆 OVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');

      // Step 3: Test UI synchronization
      console.log('\n🔄 STEP 3: TEST UI SYNCHRONIZATION');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (window.updateUIButtons) {
        console.log('  🔧 Running updateUIButtons...');
        window.updateUIButtons();

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check visual state
        const dateDropdown = document.querySelector('[data-testid="date-selector"]');
        const rButton = document.querySelector('[data-testid="display-mode-r"]');
        const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

        console.log('  🎨 VISUAL STATE:');
        console.log('    Date dropdown text:', dateDropdown?.textContent?.trim());
        console.log('    R button active:', rButton?.getAttribute('data-active') === 'true');
        console.log('    R button gold:', rButton?.style?.backgroundColor?.includes('B8860B'));
        console.log('    Dollar button active:', dollarButton?.getAttribute('data-active') === 'true');

        const uiSyncWorking =
          dateDropdown?.textContent?.includes('90') ||
          rButton?.getAttribute('data-active') === 'true' ||
          rButton?.style?.backgroundColor?.includes('B8860B');

        console.log('  UI Sync Working:', uiSyncWorking ? '✅ YES' : '❌ NO');

      } else {
        console.log('  ❌ updateUIButtons not available');
      }

    } else {
      console.log('  ❌ Chat components not found');
    }

  } catch (error) {
    console.log('  ❌ Command test failed:', error.message);
    console.log('  Stack:', error.stack);
  }

  console.log('\n🏁 STATE RESET TEST COMPLETE');
  console.log('=============================');
}

// Run the test
debugStateReset();

console.log('\n⏳ State reset test running...');