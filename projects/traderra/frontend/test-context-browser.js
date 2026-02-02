/**
 * Browser-based Context Integration Test for Traderra Renata Chat
 * This script should be run in the browser console on localhost:6565
 *
 * To use:
 * 1. Open localhost:6565 in your browser
 * 2. Open browser console (F12)
 * 3. Paste and run this script
 */

function testContextIntegration() {
  console.log('🔍 TESTING CONTEXT INTEGRATION');
  console.log('===============================');

  // Test 1: Check if React contexts are globally available
  console.log('\n📋 Test 1: Global Context Availability');

  const contextChecks = {
    'window.dateRangeContext': typeof window.dateRangeContext !== 'undefined',
    'window.displayModeContext': typeof window.displayModeContext !== 'undefined',
    'window.TraderraActionBridge': typeof window.TraderraActionBridge !== 'undefined',
    'window.traderraExecuteActions': typeof window.traderraExecuteActions !== 'undefined'
  };

  Object.entries(contextChecks).forEach(([context, available]) => {
    console.log(`  ${available ? '✅' : '❌'} ${context}: ${available ? 'AVAILABLE' : 'NOT FOUND'}`);
  });

  // Test 2: Check current context values
  console.log('\n📊 Test 2: Current Context Values');

  if (window.dateRangeContext) {
    console.log(`  📅 DateRange: ${window.dateRangeContext.currentDateRange || 'undefined'}`);
    if (typeof window.dateRangeContext.getDateRange === 'function') {
      console.log(`  📅 getDateRange(): ${window.dateRangeContext.getDateRange()}`);
    }
  }

  if (window.displayModeContext) {
    console.log(`  🎭 DisplayMode: ${window.displayModeContext.displayMode || 'undefined'}`);
    if (typeof window.displayModeContext.getDisplayMode === 'function') {
      console.log(`  🎭 getDisplayMode(): ${window.displayModeContext.getDisplayMode()}`);
    }
  }

  // Test 3: Simulate state changes
  console.log('\n🔄 Test 3: Context State Change Simulation');

  const testChanges = async () => {
    const initialDateRange = window.dateRangeContext?.currentDateRange;
    const initialDisplayMode = window.displayModeContext?.displayMode;

    console.log(`  📍 Initial state: DateRange=${initialDateRange}, DisplayMode=${initialDisplayMode}`);

    // Test date range change
    if (window.dateRangeContext && typeof window.dateRangeContext.setDateRange === 'function') {
      console.log('  🔄 Testing setDateRange("90day")...');
      try {
        window.dateRangeContext.setDateRange('90day');
        await new Promise(resolve => setTimeout(resolve, 100));
        const newDateRange = window.dateRangeContext.currentDateRange;
        console.log(`  ✅ DateRange changed to: ${newDateRange}`);
      } catch (error) {
        console.log(`  ❌ DateRange change failed: ${error.message}`);
      }
    }

    // Test display mode change
    if (window.displayModeContext && typeof window.displayModeContext.setDisplayMode === 'function') {
      console.log('  🔄 Testing setDisplayMode("r")...');
      try {
        window.displayModeContext.setDisplayMode('r');
        await new Promise(resolve => setTimeout(resolve, 100));
        const newDisplayMode = window.displayModeContext.displayMode;
        console.log(`  ✅ DisplayMode changed to: ${newDisplayMode}`);
      } catch (error) {
        console.log(`  ❌ DisplayMode change failed: ${error.message}`);
      }
    }

    // Final state check
    console.log(`  📍 Final state: DateRange=${window.dateRangeContext?.currentDateRange}, DisplayMode=${window.displayModeContext?.displayMode}`);
  };

  return testChanges();
}

function testActionExecutionFlow() {
  console.log('\n🚀 Test 4: Action Execution Flow');

  // Test the TraderraActionBridge
  if (window.TraderraActionBridge) {
    console.log('  ✅ TraderraActionBridge available');

    const bridge = window.TraderraActionBridge.getInstance();

    // Test adding a listener
    const testListener = (action) => {
      console.log(`  🔔 Action received: ${action.type} with payload:`, action.payload);
    };

    bridge.addListener(testListener);
    console.log('  ✅ Added test listener');

    // Test adding an action
    const testAction = {
      type: 'setDisplayMode',
      payload: { mode: 'dollar' },
      timestamp: Date.now(),
      id: 'test-' + Date.now()
    };

    console.log('  🔄 Adding test action...');
    bridge.addAction(testAction);

    // Clean up
    setTimeout(() => {
      bridge.removeListener(testListener);
      console.log('  🧹 Removed test listener');
    }, 1000);

  } else {
    console.log('  ❌ TraderraActionBridge not available');
  }
}

function testUIElementSync() {
  console.log('\n🖼️  Test 5: UI Element Synchronization');

  // Check for UI elements that should sync with context
  const uiSelectors = [
    '[data-testid*="date-range"]',
    '[data-testid*="display-mode"]',
    'button[onclick*="setDateRange"]',
    'button[onclick*="setDisplayMode"]'
  ];

  uiSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`  🖱️  Found ${elements.length} elements matching: ${selector}`);
  });

  // Look for common date range buttons
  const dateButtons = document.querySelectorAll('button');
  const dateRangeButtons = Array.from(dateButtons).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('today') || text.includes('week') || text.includes('month') || text.includes('90') || text.includes('all');
  });

  console.log(`  📅 Found ${dateRangeButtons.length} date range buttons`);
  dateRangeButtons.forEach((btn, index) => {
    console.log(`    ${index + 1}. "${btn.textContent?.trim()}"`);
  });

  // Look for display mode buttons
  const displayModeButtons = Array.from(dateButtons).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    return text.includes('dollar') || text.includes('r') || text.includes('$') || text.includes('percent');
  });

  console.log(`  🎭 Found ${displayModeButtons.length} display mode buttons`);
  displayModeButtons.forEach((btn, index) => {
    console.log(`    ${index + 1}. "${btn.textContent?.trim()}"`);
  });
}

function testMultiCommandExecution() {
  console.log('\n🎯 Test 6: Multi-Command Execution Simulation');

  // Simulate the multi-command sequence that would be triggered by the API
  const testCommands = [
    { type: 'navigateToPage', payload: { page: 'dashboard' } },
    { type: 'setDateRange', payload: { range: '90day' } },
    { type: 'setDisplayMode', payload: { mode: 'r' } }
  ];

  console.log(`  📦 Testing ${testCommands.length} commands...`);

  // Execute commands with delays
  testCommands.forEach((command, index) => {
    setTimeout(() => {
      console.log(`  🔄 Executing command ${index + 1}: ${command.type}`);

      if (window.traderraExecuteActions) {
        window.traderraExecuteActions([command]);
      } else if (window.TraderraActionBridge) {
        const bridge = window.TraderraActionBridge.getInstance();
        bridge.addAction({
          ...command,
          timestamp: Date.now(),
          id: `test-${index}-${Date.now()}`
        });
      } else {
        console.log(`  ⚠️  No execution mechanism available for: ${command.type}`);
      }
    }, index * 200); // 200ms delay between commands
  });

  // Check final state after all commands
  setTimeout(() => {
    console.log('\n📊 Final State Check:');
    console.log(`  📍 URL: ${window.location.pathname}`);
    console.log(`  📅 DateRange: ${window.dateRangeContext?.currentDateRange || 'unknown'}`);
    console.log(`  🎭 DisplayMode: ${window.displayModeContext?.displayMode || 'unknown'}`);
  }, testCommands.length * 200 + 500);
}

// Main test execution
async function runAllTests() {
  console.log('🚀 TRADERRA RENATA CHAT CONTEXT INTEGRATION TEST');
  console.log('===================================================');
  console.log('This test validates that React contexts are properly');
  console.log('integrated with the multi-command execution system.');
  console.log('');

  try {
    await testContextIntegration();
    testActionExecutionFlow();
    testUIElementSync();
    testMultiCommandExecution();

    console.log('\n🎉 CONTEXT INTEGRATION TEST COMPLETED');
    console.log('====================================');
    console.log('✅ Check results above for integration status');
    console.log('✅ All tests should show "AVAILABLE" and successful changes');

  } catch (error) {
    console.error('\n❌ CONTEXT INTEGRATION TEST FAILED:', error);
  }
}

// Make the test function available and run it
window.testContextIntegration = runAllTests;
console.log('💡 Run testContextIntegration() to test context integration');

// Auto-run if desired
// runAllTests();