/**
 * CONTEXT DEBUG TEST - Debug why components aren't updating with context changes
 * Paste directly in browser console on localhost:6565/dashboard
 */

console.clear();
console.log('🔧 CONTEXT DEBUG TEST');
console.log('=======================');

// Test direct context manipulation and component updates
async function debugContextSync() {
  console.log('🔍 Debugging context synchronization...');

  // Check initial state
  console.log('\n📊 INITIAL STATE CHECK:');
  console.log('  URL:', window.location.pathname);
  console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
  console.log('  DisplayMode Context:', window.displayModeContext?.displayMode);

  // Check dropdown text - TraderViewDateSelector uses different test ID
  const dateDropdown = document.querySelector('[data-testid="date-selector"]');
  const dropdownText = dateDropdown?.textContent?.trim() || 'not-found';
  console.log('  Dropdown Text:', dropdownText);

  // Test direct context manipulation
  console.log('\n🧪 TESTING DIRECT CONTEXT MANIPULATION:');

  if (window.dateRangeContext?.setDateRange) {
    console.log('✅ Found setDateRange function');

    // Set to 90day directly
    console.log('🔧 Setting date range to 90day directly...');
    window.dateRangeContext.setDateRange('90day');

    // Check immediate context change
    setTimeout(() => {
      console.log('📊 CONTEXT AFTER DIRECT SET (200ms):');
      console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
      console.log('  Dropdown Text:', dateDropdown?.textContent?.trim());

      // Check if DateRangeSelector component re-rendered
      console.log('\n🔍 Checking component re-render logs...');
      console.log('Look for "🎯 DateRangeSelector: Component re-rendered" in console logs');
    }, 200);

    // Check after React re-render delay
    setTimeout(() => {
      console.log('\n📊 CONTEXT AFTER DELAY (800ms):');
      console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
      console.log('  Dropdown Text:', dateDropdown?.textContent?.trim());

      // Check if dropdown updated automatically
      const updatedText = dateDropdown?.textContent?.trim();
      const expectedText = '90 Days';

      if (updatedText?.includes(expectedText)) {
        console.log('✅ SUCCESS: Dropdown automatically updated to show:', updatedText);
      } else {
        console.log('❌ FAILURE: Dropdown still shows:', updatedText, '(expected to contain:', expectedText, ')');

        // Try to manually click the dropdown option
        console.log('🔧 Attempting manual dropdown click...');

        // Click dropdown to open
        dateDropdown?.click();

        setTimeout(() => {
          // Find and click the 90day option
          const option90 = document.querySelector('[data-testid="date-range-90day"]');
          if (option90) {
            console.log('✅ Found 90day option, clicking it...');
            option90.click();

            setTimeout(() => {
              console.log('\n📊 FINAL STATE AFTER MANUAL CLICK:');
              console.log('  DateRange Context:', window.dateRangeContext?.currentDateRange);
              console.log('  Dropdown Text:', dateDropdown?.textContent?.trim());
            }, 200);
          } else {
            console.log('❌ Could not find date-range-90day option');

            // Try to find by text content
            const allOptions = Array.from(document.querySelectorAll('[data-testid^="date-range-"]'));
            const option90ByText = allOptions.find(opt => opt.textContent?.includes('90 Days'));
            console.log('Found option by text:', !!option90ByText);

            if (option90ByText) {
              console.log('🔧 Clicking 90 Days option by text...');
              option90ByText.click();
            }
          }
        }, 200);
      }
    }, 800);

  } else {
    console.log('❌ setDateRange function not found');
  }

  // Test display mode too
  console.log('\n🧪 TESTING DISPLAY MODE:');

  if (window.displayModeContext?.setDisplayMode) {
    console.log('✅ Found setDisplayMode function');

    // Set to R directly
    console.log('🔧 Setting display mode to r directly...');
    window.displayModeContext.setDisplayMode('r');

    setTimeout(() => {
      console.log('\n📊 DISPLAY MODE AFTER SET (500ms):');
      console.log('  DisplayMode Context:', window.displayModeContext?.displayMode);

      // Check R button
      const rButton = document.querySelector('[data-testid="display-mode-r"]');
      if (rButton) {
        const computedStyle = window.getComputedStyle(rButton);
        const isActive = rButton.getAttribute('data-active') === 'true';
        const hasGoldBg = computedStyle.backgroundColor?.includes('B8860B');

        console.log('  R Button - Active:', isActive, 'Gold BG:', hasGoldBg);
        console.log('  R Button BG Color:', computedStyle.backgroundColor);
      }
    }, 500);

  } else {
    console.log('❌ setDisplayMode function not found');
  }
}

// Run the debug test
debugContextSync();

console.log('\n⏳ Debug test running... check console logs for component re-render messages');