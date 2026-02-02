/**
 * CALENDAR STATE VERIFICATION SCRIPT
 *
 * This script verifies whether the calendar state management is working correctly
 * by checking for the presence of event listeners and the global bridge.
 *
 * HOW TO USE:
 * 1. Open Traderra in your browser
 * 2. Navigate to the landing page (/)
 * 3. Open DevTools Console (F12)
 * 4. Paste this entire script and press Enter
 * 5. Read the diagnostic output
 */

(function verifyCalendarState() {
  console.log('🔍 CALENDAR STATE DIAGNOSTIC STARTING...\n');

  const results = {
    globalBridgeExists: false,
    actionBridgeExists: false,
    traderraExecuteActionsExists: false,
    dateRangeContextExists: false,
    currentPage: window.location.pathname,
    issues: [],
    recommendations: []
  };

  // 1. Check if TraderraActionBridge exists
  console.log('1️⃣ Checking TraderraActionBridge...');
  if (window.TraderraActionBridge) {
    results.actionBridgeExists = true;
    const instance = window.TraderraActionBridge.getInstance();
    console.log('   ✅ TraderraActionBridge exists');
    console.log('   📊 Listeners registered:', instance.listeners?.length || 0);
    console.log('   📋 Pending actions:', instance.getPendingActions?.().length || 0);
  } else {
    results.actionBridgeExists = false;
    console.log('   ❌ TraderraActionBridge NOT found');
    results.issues.push('TraderraActionBridge not loaded');
  }

  // 2. Check if traderraExecuteActions function exists
  console.log('\n2️⃣ Checking traderraExecuteActions function...');
  if (typeof window.traderraExecuteActions === 'function') {
    results.traderraExecuteActionsExists = true;
    console.log('   ✅ traderraExecuteActions function exists');
  } else {
    results.traderraExecuteActionsExists = false;
    console.log('   ❌ traderraExecuteActions function NOT found');
    results.issues.push('Global execute function not available');
  }

  // 3. Check if DateRangeContext is exposed
  console.log('\n3️⃣ Checking DateRangeContext exposure...');
  if (window.dateRangeContext) {
    results.dateRangeContextExists = true;
    console.log('   ✅ DateRangeContext exposed to window');
    console.log('   📅 Current selectedRange:', window.dateRangeContext.selectedRange);
    console.log('   📊 Current dateRange:', window.dateRangeContext.dateRange);
  } else {
    results.dateRangeContextExists = false;
    console.log('   ⚠️  DateRangeContext NOT exposed (may be normal)');
  }

  // 4. Check for event listeners
  console.log('\n4️⃣ Testing event listener chain...');

  // Test if 'traderra-actions' event would be caught
  let actionEventCaught = false;
  const actionListener = (e) => {
    actionEventCaught = true;
    console.log('   ✅ traderra-actions event was caught!');
  };

  window.addEventListener('traderra-actions', actionListener);
  window.dispatchEvent(new CustomEvent('traderra-actions', { detail: [] }));

  setTimeout(() => {
    if (!actionEventCaught) {
      console.log('   ⚠️  traderra-actions event dispatched but no logs (bridge may not process empty arrays)');
    }
    window.removeEventListener('traderra-actions', actionListener);
  }, 100);

  // Test if 'traderra-context-update' event would be caught
  let contextEventCaught = false;
  const contextListener = (e) => {
    contextEventCaught = true;
    console.log('   ✅ traderra-context-update event listener is active!');
  };

  window.addEventListener('traderra-context-update', contextListener);
  window.dispatchEvent(new CustomEvent('traderra-context-update', {
    detail: { type: 'test', value: 'test' }
  }));

  setTimeout(() => {
    if (!contextEventCaught) {
      console.log('   ❌ traderra-context-update event NOT caught - DateRangeContext may not be listening');
      results.issues.push('Context update events not being received');
    }
    window.removeEventListener('traderra-context-update', contextListener);
  }, 100);

  // 5. Check button elements
  console.log('\n5️⃣ Checking calendar button elements...');
  const buttons = document.querySelectorAll('[data-range]');
  if (buttons.length > 0) {
    console.log(`   ✅ Found ${buttons.length} calendar buttons`);

    buttons.forEach(btn => {
      const range = btn.getAttribute('data-range');
      const isActive = btn.getAttribute('data-active') === 'true';
      const hasActiveClass = btn.classList.contains('traderra-date-active');

      if (isActive && !hasActiveClass) {
        console.log(`   ⚠️  Button "${range}" marked active but missing CSS class`);
        results.issues.push(`Visual state mismatch on ${range} button`);
      } else if (isActive) {
        console.log(`   ✅ Button "${range}" is active`);
      }
    });
  } else {
    console.log('   ⚠️  No calendar buttons found on this page');
  }

  // 6. Simulate a calendar action
  console.log('\n6️⃣ Simulating calendar state change...');
  console.log('   🧪 Testing: Switch to "7d" (week) range');

  const beforeState = window.dateRangeContext?.selectedRange || 'unknown';
  console.log('   📍 State before:', beforeState);

  // Simulate what the API does
  const testAction = {
    type: 'setDateRange',
    payload: { range: 'week' },
    timestamp: Date.now(),
    id: `test_${Date.now()}`
  };

  console.log('   🚀 Dispatching traderra-actions event...');
  window.dispatchEvent(new CustomEvent('traderra-actions', {
    detail: [testAction]
  }));

  // Also try the execute function
  if (window.traderraExecuteActions) {
    console.log('   🚀 Calling traderraExecuteActions...');
    window.traderraExecuteActions([testAction]);
  }

  setTimeout(() => {
    const afterState = window.dateRangeContext?.selectedRange || 'unknown';
    console.log('   📍 State after:', afterState);

    if (beforeState !== afterState && afterState === 'week') {
      console.log('   ✅ State changed successfully!');
    } else if (beforeState === 'week') {
      console.log('   ℹ️  State was already "week"');
    } else {
      console.log('   ❌ State did NOT change - this confirms the issue');
      results.issues.push('State changes not applying');
      results.recommendations.push('Add import in layout.tsx: import \'@/lib/global-traderra-bridge\'');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log(`📍 Current Page: ${results.currentPage}`);
    console.log(`✅ TraderraActionBridge: ${results.actionBridgeExists ? 'Loaded' : 'NOT LOADED ❌'}`);
    console.log(`✅ Execute Function: ${results.traderraExecuteActionsExists ? 'Available' : 'NOT AVAILABLE ❌'}`);
    console.log(`✅ DateRangeContext: ${results.dateRangeContextExists ? 'Exposed' : 'Not exposed ⚠️'}`);

    if (results.issues.length > 0) {
      console.log('\n🚨 ISSUES DETECTED:');
      results.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No critical issues detected');
    }

    if (results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      results.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    // Page-specific diagnosis
    console.log('\n📄 PAGE-SPECIFIC DIAGNOSIS:');
    if (results.currentPage === '/') {
      if (!results.actionBridgeExists || !results.traderraExecuteActionsExists) {
        console.log('   ❌ ISSUE CONFIRMED: Global bridge not loaded on landing page');
        console.log('   🔧 FIX: Add this to /src/app/layout.tsx:');
        console.log('      import \'@/lib/global-traderra-bridge\'');
        console.log('   📍 Location: After line 14 (after ChatProvider import)');
      } else {
        console.log('   ✅ Global bridge appears to be loaded correctly');
      }
    } else if (results.currentPage.startsWith('/dashboard')) {
      console.log('   ℹ️  Dashboard page should have bridge imported');
      if (results.actionBridgeExists && results.traderraExecuteActionsExists) {
        console.log('   ✅ Bridge is loaded as expected');
      } else {
        console.log('   ⚠️  Bridge not loaded - unexpected for dashboard page');
      }
    } else {
      console.log(`   ℹ️  Unknown page: ${results.currentPage}`);
      console.log('   ℹ️  Bridge may or may not be expected here');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔍 Diagnostic complete!');
    console.log('='.repeat(60));

    // Return results for programmatic use
    return results;
  }, 500);
})();

console.log('⏳ Running diagnostics... (will complete in ~500ms)\n');
