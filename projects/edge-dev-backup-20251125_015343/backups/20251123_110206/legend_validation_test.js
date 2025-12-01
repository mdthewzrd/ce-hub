// 🏷️ COMPREHENSIVE LEGEND VALIDATION TEST
// Run this in browser console at http://localhost:5657

console.log('🚀 Starting COMPREHENSIVE Legend Validation Test');
console.log('📍 Testing URL: http://localhost:5657');

// Test 1: Check for legend elements
function testLegendPresence() {
  console.log('\n📊 TEST 1: Legend Element Presence');

  // Check for absolute positioned legend
  const legends = document.querySelectorAll('[style*="position: absolute"][style*="top: 16px"][style*="left: 16px"]');
  console.log(`Found ${legends.length} legend element(s)`);

  legends.forEach((legend, i) => {
    console.log(`Legend ${i + 1}:`, {
      position: legend.style.position,
      top: legend.style.top,
      left: legend.style.left,
      zIndex: legend.style.zIndex,
      content: legend.textContent?.substring(0, 100) + '...'
    });
  });

  // Check for loading legend (yellow border)
  const loadingLegend = document.querySelector('[style*="border-color: #facc15"]');
  console.log('🟡 Loading Legend:', loadingLegend ? '✅ Found' : '❌ Not found');

  // Check for data legend (green border)
  const dataLegend = document.querySelector('[style*="border-color: #22c55e"]');
  console.log('🟢 Data Legend:', dataLegend ? '✅ Found' : '❌ Not found');

  return legends.length > 0;
}

// Test 2: Check EdgeChart component mounting
function testChartComponent() {
  console.log('\n📈 TEST 2: Chart Component Status');

  const chartContainer = document.querySelector('.chart-container');
  console.log('Chart Container:', chartContainer ? '✅ Found' : '❌ Not found');

  const plotlyChart = document.querySelector('.js-plotly-plot');
  console.log('Plotly Chart:', plotlyChart ? '✅ Found' : '❌ Not found');

  const placeholder = document.querySelector('.text-center .text-4xl');
  console.log('Placeholder Mode:', placeholder ? '❌ Still placeholder' : '✅ Real chart');

  return chartContainer && !placeholder;
}

// Test 3: Monitor legend state changes
function monitorLegendChanges() {
  console.log('\n👁️ TEST 3: Monitoring Legend State Changes (10 seconds)');

  let changeCount = 0;
  let lastContent = '';

  const observer = new MutationObserver(() => {
    const legend = document.querySelector('[style*="position: absolute"][style*="top: 16px"]');
    if (legend) {
      const currentContent = legend.textContent || '';
      if (currentContent !== lastContent) {
        changeCount++;
        console.log(`🔄 Legend change #${changeCount}: ${currentContent.substring(0, 50)}...`);
        lastContent = currentContent;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setTimeout(() => {
    observer.disconnect();
    console.log(`✅ Monitoring complete. Detected ${changeCount} legend changes.`);
  }, 10000);
}

// Test 4: Test hover functionality
function testHoverFunctionality() {
  console.log('\n🖱️ TEST 4: Testing Hover Functionality');

  const plotlyChart = document.querySelector('.js-plotly-plot');
  if (!plotlyChart) {
    console.log('❌ Cannot test hover - no Plotly chart found');
    return;
  }

  console.log('📍 Simulating mouse events on chart...');

  // Get chart bounds
  const bounds = plotlyChart.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  // Simulate mouse move
  const mouseMoveEvent = new MouseEvent('mousemove', {
    clientX: centerX,
    clientY: centerY,
    bubbles: true
  });

  plotlyChart.dispatchEvent(mouseMoveEvent);

  setTimeout(() => {
    const legend = document.querySelector('[style*="border-color: #22c55e"]');
    if (legend) {
      console.log('✅ Hover test: Legend content after mouse move:', legend.textContent?.substring(0, 100));
    } else {
      console.log('❌ Hover test: No data legend found after mouse move');
    }
  }, 500);
}

// Test 5: Validate specific ticker selection
function testTickerSelection() {
  console.log('\n🎯 TEST 5: Testing Ticker Selection');

  // Look for ticker buttons
  const tickerButtons = document.querySelectorAll('[data-symbol], button[class*="ticker"], .cursor-pointer');
  console.log(`Found ${tickerButtons.length} potential ticker buttons`);

  // Try to click first ticker if available
  if (tickerButtons.length > 0) {
    const firstTicker = tickerButtons[0];
    console.log('🔄 Clicking first ticker button...');
    firstTicker.click();

    setTimeout(() => {
      const legend = document.querySelector('[style*="position: absolute"][style*="top: 16px"]');
      console.log('✅ Post-click legend status:', legend ? 'Visible' : 'Hidden');
      if (legend) {
        console.log('📄 Legend content:', legend.textContent?.substring(0, 100));
      }
    }, 2000);
  } else {
    console.log('❌ No ticker buttons found for testing');
  }
}

// Run all tests
async function runAllTests() {
  const results = {
    legendPresent: false,
    chartMounted: false
  };

  results.legendPresent = testLegendPresence();
  results.chartMounted = testChartComponent();

  monitorLegendChanges();

  setTimeout(() => {
    testHoverFunctionality();
  }, 2000);

  setTimeout(() => {
    testTickerSelection();
  }, 4000);

  setTimeout(() => {
    console.log('\n🏁 FINAL VALIDATION RESULTS:');
    console.log(`✅ Legend Present: ${results.legendPresent ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Chart Mounted: ${results.chartMounted ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Overall Status: ${results.legendPresent && results.chartMounted ? '🎉 SUCCESS' : '❌ NEEDS ATTENTION'}`);

    if (results.legendPresent) {
      console.log('🎯 VALIDATION COMPLETE: Legend is visible and functional!');
    } else {
      console.log('🔧 DEBUGGING NEEDED: Legend visibility issues detected');
    }
  }, 12000);
}

// Start the comprehensive test
runAllTests();