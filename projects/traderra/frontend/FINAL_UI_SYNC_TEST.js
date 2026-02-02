/**
 * FINAL UI SYNCHRONIZATION TEST - Tests the corrected updateUIButtons fix
 * This test validates that the UI synchronization now works with the correct test IDs
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 FINAL UI SYNCHRONIZATION TEST');
console.log('===================================');

async function testFinalUISynchronization() {
  console.log('🚀 Testing final UI synchronization with corrected TraderViewDateSelector test IDs...');

  // Check initial state
  const getVisualState = () => {
    // Test the correct TraderViewDateSelector test IDs
    const dateDropdown = document.querySelector('[data-testid="date-selector"]');
    const dateDropdownText = dateDropdown?.textContent?.trim() || 'not-found';

    // Test individual date buttons (these should exist in TraderViewDateSelector)
    const date90Button = document.querySelector('[data-testid="date-range-90day"]');
    const dateYearButton = document.querySelector('[data-testid="date-range-year"]');

    // Test display mode buttons
    const rButton = document.querySelector('[data-testid="display-mode-r"]');
    const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

    return {
      url: window.location.pathname,
      dateRangeDropdownText: dateDropdownText,
      dateRangeContext: window.dateRangeContext?.currentDateRange,
      displayModeContext: window.displayModeContext?.displayMode,
      // Visual states
      date90ButtonActive: date90Button?.getAttribute('data-active') === 'true',
      date90ButtonGold: date90Button?.style?.backgroundColor?.includes('B8860B'),
      dateYearButtonActive: dateYearButton?.getAttribute('data-active') === 'true',
      rButtonActive: rButton?.getAttribute('data-active') === 'true',
      rButtonGold: rButton?.style?.backgroundColor?.includes('B8860B'),
      dollarButtonActive: dollarButton?.getAttribute('data-active') === 'true',
      dollarButtonGold: dollarButton?.style?.backgroundColor?.includes('B8860B'),
      // Component existence
      foundDateDropdown: !!dateDropdown,
      foundDate90Button: !!date90Button,
      foundRButton: !!rButton,
      foundDollarButton: !!dollarButton
    };
  };

  // Take initial snapshot
  const initialState = getVisualState();
  console.log('📸 Initial Visual State:');
  console.log('  URL:', initialState.url);
  console.log('  Date Range Dropdown:', initialState.dateRangeDropdownText);
  console.log('  Date Range Context:', initialState.dateRangeContext);
  console.log('  Display Mode Context:', initialState.displayModeContext);
  console.log('  Components Found:', {
    dateDropdown: initialState.foundDateDropdown,
    date90Button: initialState.foundDate90Button,
    rButton: initialState.foundRButton,
    dollarButton: initialState.foundDollarButton
  });

  // Test the updateUIButtons function directly with the corrected test IDs
  console.log('\n🧪 TESTING CORRECTED updateUIButtons FUNCTION:');

  // First, let's test the function directly
  if (window.updateUIButtons) {
    console.log('✅ Found updateUIButtons function');

    // Set up test state
    window.dateRangeContext = {
      currentDateRange: '90day',
      setSelectedRange: (range) => console.log('setSelectedRange called with:', range)
    };

    window.displayModeContext = {
      displayMode: 'r',
      setDisplayMode: (mode) => console.log('setDisplayMode called with:', mode)
    };

    console.log('🔧 Calling updateUIButtons with test state...');
    window.updateUIButtons();

    // Wait for visual updates
    setTimeout(() => {
      const afterUpdateState = getVisualState();
      console.log('\n📊 State After updateUIButtons:');
      console.log('  Date Range Context:', afterUpdateState.dateRangeContext);
      console.log('  Display Mode Context:', afterUpdateState.displayModeContext);
      console.log('  Date 90 Button Active:', afterUpdateState.date90ButtonActive);
      console.log('  Date 90 Button Gold:', afterUpdateState.date90ButtonGold);
      console.log('  R Button Active:', afterUpdateState.rButtonActive);
      console.log('  R Button Gold:', afterUpdateState.rButtonGold);

      // Test if buttons are properly highlighted
      const success = {
        date90ButtonHighlighted: afterUpdateState.date90ButtonActive || afterUpdateState.date90ButtonGold,
        rButtonHighlighted: afterUpdateState.rButtonActive || afterUpdateState.rButtonGold,
        dollarButtonNotHighlighted: !afterUpdateState.dollarButtonActive && !afterUpdateState.dollarButtonGold
      };

      console.log('\n✅ VISUAL HIGHLIGHTING SUCCESS CHECK:');
      console.log('  90-day button highlighted:', success.date90ButtonHighlighted ? '✅ PASS' : '❌ FAIL');
      console.log('  R button highlighted:', success.rButtonHighlighted ? '✅ PASS' : '❌ FAIL');
      console.log('  Dollar button not highlighted:', success.dollarButtonNotHighlighted ? '✅ PASS' : '❌ FAIL');

      const allVisualPassed = Object.values(success).every(Boolean);
      console.log('\n🏆 OVERALL VISUAL SYNC RESULT:', allVisualPassed ? '✅ ALL VISUAL TESTS PASSED!' : '❌ SOME VISUAL TESTS FAILED');

      if (allVisualPassed) {
        console.log('\n🎉 SUCCESS! The corrected updateUIButtons function is working properly.');
        console.log('✅ Test IDs are now correct');
        console.log('✅ Visual button highlighting working');
        console.log('✅ UI synchronization fixed');
      } else {
        console.log('\n🔍 Issues remaining with corrected function:');
        if (!success.date90ButtonHighlighted) console.log('  - 90-day button still not highlighting');
        if (!success.rButtonHighlighted) console.log('  - R button still not highlighting');
        if (!success.dollarButtonNotHighlighted) console.log('  - Dollar button still not turning off');
      }
    }, 500);

  } else {
    console.log('❌ updateUIButtons function not found on window object');
    console.log('🔍 Checking if function exists in standalone-renata-chat component...');

    // Try to access the function through the React component
    const chatComponent = document.querySelector('[data-testid="standalone-renata-chat"]');
    if (chatComponent) {
      console.log('✅ Found chat component, but updateUIButtons not exposed to window');
    } else {
      console.log('❌ Chat component not found');
    }
  }
}

// Run the test
testFinalUISynchronization();

console.log('\n⏳ Final UI synchronization test running...');