/**
 * SIMPLE DEBUG TEST - Check what's actually happening
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔍 SIMPLE DEBUG TEST');
console.log('====================');

async function simpleDebugTest() {
  console.log('🚀 Debugging the custom date range execution step by step...\n');

  try {
    // Step 1: Check if contexts are available
    console.log('📊 STEP 1: CHECK CONTEXTS');
    console.log('  window.dateRangeContext available:', !!window.dateRangeContext);
    console.log('  setDateRange available:', !!window.dateRangeContext?.setDateRange);
    console.log('  setCustomRange available:', !!window.dateRangeContext?.setCustomRange);
    console.log('  currentDateRange:', window.dateRangeContext?.currentDateRange);

    // Step 2: Manually call setCustomRange to see if it works
    console.log('\n🔧 STEP 2: TEST setCustomRange DIRECTLY');
    if (window.dateRangeContext?.setCustomRange) {
      const testStart = new Date('2024-01-01');
      const testEnd = new Date('2024-03-31');

      console.log('  Before setCustomRange:', {
        currentDateRange: window.dateRangeContext.currentDateRange,
        customStart: window.dateRangeContext.customStartDate?.toISOString().split('T')[0],
        customEnd: window.dateRangeContext.customEndDate?.toISOString().split('T')[0]
      });

      window.dateRangeContext.setCustomRange(testStart, testEnd);

      console.log('  After setCustomRange:', {
        currentDateRange: window.dateRangeContext.currentDateRange,
        customStart: window.dateRangeContext.customStartDate?.toISOString().split('T')[0],
        customEnd: window.dateRangeContext.customEndDate?.toISOString().split('T')[0]
      });

      console.log('  ✅ setCustomRange works directly');
    } else {
      console.log('  ❌ setCustomRange not available');
      return;
    }

    // Step 3: Reset and test through chat
    console.log('\n🔄 STEP 3: RESET AND TEST THROUGH CHAT');

    // Reset
    window.dateRangeContext.setDateRange('month');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const beforeState = {
      dateRange: window.dateRangeContext.currentDateRange,
      customStart: window.dateRangeContext.customStartDate?.toISOString().split('T')[0],
      customEnd: window.dateRangeContext.customEndDate?.toISOString().split('T')[0]
    };

    console.log('  Before chat command:', beforeState);

    // Send chat command
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
    const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

    if (chatInput && sendButton) {
      console.log('  ✅ Chat components found');
      console.log('  Sending command: "show me last quarter through today"');

      chatInput.value = "show me last quarter through today";
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendButton.click();

      console.log('  ⏳ Waiting for processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const afterState = {
        dateRange: window.dateRangeContext.currentDateRange,
        customStart: window.dateRangeContext.customStartDate?.toISOString().split('T')[0],
        customEnd: window.dateRangeContext.customEndDate?.toISOString().split('T')[0]
      };

      console.log('  After chat command:', afterState);

      const changed = JSON.stringify(beforeState) !== JSON.stringify(afterState);
      console.log('  State changed:', changed ? '✅ YES' : '❌ NO');

      if (!changed) {
        console.log('\n❌ DIAGNOSIS: The chat command is not triggering setCustomRange');
        console.log('  This means the issue is in the command processing, not setCustomRange itself');
      } else {
        console.log('\n✅ SUCCESS: State changed through chat command');
      }

    } else {
      console.log('  ❌ Chat components not found');
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the debug test
simpleDebugTest().then(() => {
  console.log('\n✨ Debug test complete!');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});

console.log('\n⏳ Debug test running...');