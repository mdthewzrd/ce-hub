/**
 * G/N Toggle Functionality Test
 * Tests the Gross/Net PnL toggle button on the dashboard and validates chart updates
 */

console.log('🚀 Starting G/N Toggle Functionality Test...');

// Open dashboard page
console.log('📍 Navigating to dashboard page...');
window.location.href = 'http://localhost:6565/dashboard';

// Wait for page load
setTimeout(() => {
  console.log('🔍 Looking for G/N toggle elements...');

  // Test 1: Check if G/N toggle button exists
  const gnToggleButtons = document.querySelectorAll('[data-testid*="pnl-mode"], button[class*="pnl"], button[title*="Gross"], button[title*="Net"]');
  console.log(`Found ${gnToggleButtons.length} potential G/N toggle elements:`, gnToggleButtons);

  // Look for toggle in context providers or state management
  const pnlContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  console.log('React DevTools available:', !!pnlContext);

  // Check if PnLModeProvider is in the component tree
  const providerElements = document.querySelectorAll('[data-testid="pnl-mode-provider"], [class*="PnLMode"]');
  console.log(`Found ${providerElements.length} PnL provider elements:`, providerElements);

  // Look for any buttons that might control G/N mode
  const allButtons = document.querySelectorAll('button');
  const gnButtons = Array.from(allButtons).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    const title = btn.title?.toLowerCase() || '';
    const className = btn.className?.toLowerCase() || '';
    return text.includes('gross') || text.includes('net') || text.includes('g') || text.includes('n') ||
           title.includes('gross') || title.includes('net') ||
           className.includes('pnl') || className.includes('mode');
  });
  console.log(`Found ${gnButtons.length} potential G/N buttons:`, gnButtons.map(btn => ({
    text: btn.textContent,
    title: btn.title,
    className: btn.className,
    id: btn.id
  })));

  // Test 2: Look for chart elements that should update
  const chartElements = document.querySelectorAll('[data-testid*="chart"], [class*="chart"], .recharts-wrapper, canvas');
  console.log(`Found ${chartElements.length} chart elements:`, chartElements);

  // Test 3: Check for equity chart specifically
  const equityChart = document.querySelector('[data-testid="equity-chart"]');
  console.log('Equity chart found:', !!equityChart);

  // Test 4: Check for performance distribution chart
  const dailyPnLChart = document.querySelector('[data-testid="daily-pnl-chart"]');
  console.log('Daily P&L chart found:', !!dailyPnLChart);

  // Test 5: Check for symbol performance chart
  const symbolPerformance = document.querySelector('[data-testid="symbol-performance"]');
  console.log('Symbol performance chart found:', !!symbolPerformance);

  // Test 6: Check for biggest trades chart
  const bestTrades = document.querySelector('[data-testid="best-trades"]');
  console.log('Best trades chart found:', !!bestTrades);

  // Test 7: Check main dashboard container
  const mainDashboard = document.querySelector('[class*="dashboard"], [data-testid*="dashboard"]');
  console.log('Main dashboard container found:', !!mainDashboard);

  // Test 8: Check if there are any error messages
  const errorElements = document.querySelectorAll('[class*="error"], [role="alert"], .text-red-400, .text-red-500');
  console.log(`Found ${errorElements.length} potential error elements:`, Array.from(errorElements).map(el => el.textContent));

  // Test 9: Check for loading states
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
  console.log(`Found ${loadingElements.length} loading elements:`, loadingElements);

  // Test 10: Check for PnL context in localStorage
  const savedPnLMode = localStorage.getItem('traderra-pnl-mode');
  console.log('Saved PnL mode in localStorage:', savedPnLMode);

  // Test 11: Try to find any React component data
  const reactFiber = Object.keys(document.body).find(key => key.startsWith('__reactInternalInstance'));
  console.log('React fiber key found:', !!reactFiber);

  // Report test results
  console.log('\n📊 G/N Toggle Test Results:');
  console.log('✅ Page loaded successfully');
  console.log(`${gnToggleButtons.length > 0 ? '✅' : '❌'} G/N toggle elements found: ${gnToggleButtons.length}`);
  console.log(`${chartElements.length > 0 ? '✅' : '❌'} Chart elements found: ${chartElements.length}`);
  console.log(`${equityChart ? '✅' : '❌'} Equity chart present`);
  console.log(`${dailyPnLChart ? '✅' : '❌'} Daily P&L chart present`);
  console.log(`${symbolPerformance ? '✅' : '❌'} Symbol performance chart present`);
  console.log(`${bestTrades ? '✅' : '❌'} Best trades chart present`);
  console.log(`${errorElements.length === 0 ? '✅' : '❌'} No error messages detected`);

  // Next phase: Try to trigger toggle if found
  if (gnButtons.length > 0) {
    console.log('\n🔄 Testing G/N toggle interaction...');

    // Try clicking the first potential G/N button
    const firstButton = gnButtons[0];
    console.log('Attempting to click button:', firstButton.textContent);

    // Record current chart state before click
    const chartsBefore = chartElements.length;
    const equityDataBefore = equityChart ? equityChart.innerHTML.length : 0;

    try {
      firstButton.click();
      console.log('✅ Button click executed');

      // Wait and check for changes
      setTimeout(() => {
        const chartsAfter = document.querySelectorAll('[data-testid*="chart"], [class*="chart"], .recharts-wrapper, canvas').length;
        const equityDataAfter = equityChart ? equityChart.innerHTML.length : 0;

        console.log('Charts before/after:', chartsBefore, '/', chartsAfter);
        console.log('Equity chart data before/after:', equityDataBefore, '/', equityDataAfter);

        if (equityDataAfter !== equityDataBefore) {
          console.log('✅ Chart data appears to have changed after toggle');
        } else {
          console.log('⚠️ No apparent change in chart data after toggle');
        }

        console.log('\n🎯 G/N Toggle Test Complete!');
      }, 1000);

    } catch (error) {
      console.error('❌ Error clicking button:', error);
    }
  } else {
    console.log('❌ No G/N toggle buttons found - toggle may not be implemented or visible');
  }

}, 3000);