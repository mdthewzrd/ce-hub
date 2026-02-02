/**
 * UI SYNCHRONIZATION TEST - Tests the complete UI synchronization fix
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 UI SYNCHRONIZATION TEST');
console.log('==========================');

// Test the complete UI synchronization fix
async function testUISynchronization() {
  console.log('🚀 Testing UI synchronization after component structure fix...');

  // Check chat components
  const chatInput = document.querySelector('[data-testid="renata-chat-input"]');
  const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]');

  if (!chatInput || !sendButton) {
    console.log('❌ Chat components not found');
    return;
  }

  console.log('✅ Chat components found');

  // Function to test visual states
  const getVisualState = () => {
    // Test date range dropdown
    const dateDropdown = document.querySelector('[data-testid="date-range-selector"]');
    const dateDropdownText = dateDropdown?.textContent?.trim() || 'not-found';

    // Test display mode buttons
    const rButton = document.querySelector('[data-testid="display-mode-r"]');
    const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');

    const rButtonStyle = rButton ? {
      isActive: rButton.getAttribute('data-active') === 'true',
      backgroundColor: rButton.style.backgroundColor || window.getComputedStyle(rButton).backgroundColor,
      hasGold: rButton.style.backgroundColor?.includes('B8860B') || window.getComputedStyle(rButton).backgroundColor?.includes('B8860B'),
      textContent: rButton.textContent?.trim()
    } : null;

    const dollarButtonStyle = dollarButton ? {
      isActive: dollarButton.getAttribute('data-active') === 'true',
      backgroundColor: dollarButton.style.backgroundColor || window.getComputedStyle(dollarButton).backgroundColor,
      hasGold: dollarButton.style.backgroundColor?.includes('B8860B') || window.getComputedStyle(dollarButton).backgroundColor?.includes('B8860B'),
      textContent: dollarButton.textContent?.trim()
    } : null;

    return {
      url: window.location.pathname,
      dateRangeDropdownText: dateDropdownText,
      dateRangeContext: window.dateRangeContext?.currentDateRange,
      displayModeContext: window.displayModeContext?.displayMode,
      rButton: rButtonStyle,
      dollarButton: dollarButtonStyle
    };
  };

  // Take initial snapshot
  const initialVisualState = getVisualState();
  console.log('📸 Initial Visual State:');
  console.log('  URL:', initialVisualState.url);
  console.log('  Date Range Dropdown:', initialVisualState.dateRangeDropdownText);
  console.log('  Date Range Context:', initialVisualState.dateRangeContext || 'not-found');
  console.log('  Display Mode Context:', initialVisualState.displayModeContext || 'not-found');
  console.log('  R Button:', {
    found: !!initialVisualState.rButton,
    active: initialVisualState.rButton?.isActive,
    gold: initialVisualState.rButton?.hasGold,
    text: initialVisualState.rButton?.textContent
  });
  console.log('  Dollar Button:', {
    found: !!initialVisualState.dollarButton,
    active: initialVisualState.dollarButton?.isActive,
    gold: initialVisualState.dollarButton?.hasGold,
    text: initialVisualState.dollarButton?.textContent
  });

  // Test command
  console.log('\n🎯 Testing: "go to the dashboard and look at the last 90 days in R"');

  // Type and send command
  chatInput.focus();
  chatInput.value = "go to the dashboard and look at the last 90 days in R";
  chatInput.dispatchEvent(new Event('input', { bubbles: true }));
  sendButton.click();

  console.log('✅ Command sent');

  // Wait for processing and UI updates
  console.log('⏳ Processing command and waiting for UI synchronization...');

  // Monitor changes for 12 seconds (allowing for UI sync delays and React re-renders)
  let checkCount = 0;
  const maxChecks = 12;

  return new Promise((resolve) => {
    const monitor = setInterval(() => {
      checkCount++;
      const currentVisualState = getVisualState();

      const changes = {
        navigation: currentVisualState.url !== initialVisualState.url,
        dateRangeContext: currentVisualState.dateRangeContext !== initialVisualState.dateRangeContext,
        displayModeContext: currentVisualState.displayModeContext !== initialVisualState.displayModeContext,
        dateDropdownText: currentVisualState.dateRangeDropdownText !== initialVisualState.dateRangeDropdownText,
        rButtonActive: currentVisualState.rButton?.isActive !== initialVisualState.rButton?.isActive,
        rButtonGold: currentVisualState.rButton?.hasGold !== initialVisualState.rButton?.hasGold,
        dollarButtonActive: currentVisualState.dollarButton?.isActive !== initialVisualState.dollarButton?.isActive,
        dollarButtonGold: currentVisualState.dollarButton?.hasGold !== initialVisualState.dollarButton?.hasGold
      };

      if (Object.values(changes).some(Boolean)) {
        console.log('\n🎯 VISUAL CHANGES DETECTED:');
        if (changes.navigation) console.log(`  Navigation: ${initialVisualState.url} → ${currentVisualState.url} ✅`);
        if (changes.dateRangeContext) console.log(`  Date Range Context: ${initialVisualState.dateRangeContext} → ${currentVisualState.dateRangeContext} ✅`);
        if (changes.displayModeContext) console.log(`  Display Mode Context: ${initialVisualState.displayModeContext} → ${currentVisualState.displayModeContext} ✅`);
        if (changes.dateDropdownText) console.log(`  Date Dropdown: "${initialVisualState.dateRangeDropdownText}" → "${currentVisualState.dateRangeDropdownText}" ✅`);
        if (changes.rButtonActive) console.log(`  R Button Active: ${initialVisualState.rButton?.isActive} → ${currentVisualState.rButton?.isActive} ✅`);
        if (changes.rButtonGold) console.log(`  R Button Gold: ${initialVisualState.rButton?.hasGold} → ${currentVisualState.rButton?.hasGold} ✅`);
        if (changes.dollarButtonActive) console.log(`  Dollar Button Active: ${initialVisualState.dollarButton?.isActive} → ${currentVisualState.dollarButton?.isActive} ✅`);
        if (changes.dollarButtonGold) console.log(`  Dollar Button Gold: ${initialVisualState.dollarButton?.hasGold} → ${currentVisualState.dollarButton?.hasGold} ✅`);
      }

      // Stop after max checks
      if (checkCount >= maxChecks) {
        clearInterval(monitor);

        console.log('\n📊 FINAL VISUAL STATE:');
        console.log('  Final URL:', currentVisualState.url);
        console.log('  Final Date Range Context:', currentVisualState.dateRangeContext || 'not-found');
        console.log('  Final Display Mode Context:', currentVisualState.displayModeContext || 'not-found');
        console.log('  Final Date Dropdown Text:', currentVisualState.dateRangeDropdownText);
        console.log('  Final R Button:', {
          found: !!currentVisualState.rButton,
          active: currentVisualState.rButton?.isActive,
          gold: currentVisualState.rButton?.hasGold,
          backgroundColor: currentVisualState.rButton?.backgroundColor
        });
        console.log('  Final Dollar Button:', {
          found: !!currentVisualState.dollarButton,
          active: currentVisualState.dollarButton?.isActive,
          gold: currentVisualState.dollarButton?.hasGold,
          backgroundColor: currentVisualState.dollarButton?.backgroundColor
        });

        // Success criteria
        const success = {
          navigation: currentVisualState.url === '/dashboard',
          dateRangeContext: currentVisualState.dateRangeContext === '90day',
          displayModeContext: currentVisualState.displayModeContext === 'r',
          dateDropdownContains90Days: currentVisualState.dateRangeDropdownText?.includes('90 Days'),
          rButtonGold: currentVisualState.rButton?.hasGold === true,
          dollarButtonNotGold: currentVisualState.dollarButton?.hasGold !== true
        };

        console.log('\n✅ VISUAL SYNCHRONIZATION SUCCESS CHECK:');
        console.log('  Navigation to dashboard:', success.navigation ? '✅ PASS' : '❌ FAIL');
        console.log('  Date Range context: 90day:', success.dateRangeContext ? '✅ PASS' : '❌ FAIL');
        console.log('  Display Mode context: r:', success.displayModeContext ? '✅ PASS' : '❌ FAIL');
        console.log('  Date dropdown shows "90 Days":', success.dateDropdownContains90Days ? '✅ PASS' : '❌ FAIL');
        console.log('  R button visual (gold):', success.rButtonGold ? '✅ PASS' : '❌ FAIL');
        console.log('  Dollar button not gold:', success.dollarButtonNotGold ? '✅ PASS' : '❌ FAIL');

        const allPassed = Object.values(success).every(Boolean);
        console.log('\n🏆 OVERALL VISUAL SYNC RESULT:', allPassed ? '✅ ALL VISUAL TESTS PASSED!' : '❌ SOME VISUAL TESTS FAILED');

        if (allPassed) {
          console.log('\n🎉 SUCCESS! The UI synchronization fix is working correctly.');
          console.log('✅ Context changes detected');
          console.log('✅ UI synchronization working');
          console.log('✅ Visual button updates working');
          console.log('✅ Dropdown updates working');
        } else {
          console.log('\n🔍 Remaining visual synchronization issues:');
          if (!success.navigation) console.log('  - Navigation not working');
          if (!success.dateRangeContext) console.log('  - Date range context not updating');
          if (!success.displayModeContext) console.log('  - Display mode context not updating');
          if (!success.dateDropdownContains90Days) console.log('  - Date dropdown not reflecting context');
          if (!success.rButtonGold) console.log('  - R button not turning gold');
          if (!success.dollarButtonNotGold) console.log('  - Dollar button not turning off gold');
        }

        resolve(allPassed);
      }
    }, 1000);
  });
}

// Additional test to check if UI components have correct test IDs
const testComponentTestIds = () => {
  console.log('\n🔍 CHECKING COMPONENT TEST IDs:');

  const dateDropdown = document.querySelector('[data-testid="date-range-selector"]');
  console.log('  Date Range Dropdown:', !!dateDropdown ? '✅ Found with test-id' : '❌ Missing test-id');

  const rButton = document.querySelector('[data-testid="display-mode-r"]');
  console.log('  R Button:', !!rButton ? '✅ Found with test-id' : '❌ Missing test-id');

  const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]');
  console.log('  Dollar Button:', !!dollarButton ? '✅ Found with test-id' : '❌ Missing test-id');

  // Test date range options (these would only be visible when dropdown is open)
  const dateOptions = document.querySelectorAll('[data-testid^="date-range-"]');
  console.log('  Date Range Options Found:', dateOptions.length);
};

// Run the tests
testComponentTestIds();
testUISynchronization().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log(success ? '🎉 UI SYNCHRONIZATION VALIDATED!' : '⚠️ UI sync issues remain');
  console.log('='.repeat(50));
});

console.log('\n⏳ Running UI synchronization test for 8 seconds...');