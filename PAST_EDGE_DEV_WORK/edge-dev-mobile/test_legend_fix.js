/**
 * Chart Legend Fix Validation Test
 *
 * This test verifies that the TradingView-style legend is now visible
 * and functioning correctly after removing debug code.
 *
 * Run in browser console after page loads:
 * node test_legend_fix.js (or copy/paste into browser console)
 */

console.log('🔍 CHART LEGEND FIX VALIDATION TEST 🔍');
console.log('=====================================\n');

// Test 1: Check if EdgeChart component is rendering
console.log('TEST 1: EdgeChart Component Rendering');
console.log('--------------------------------------');
const edgeCharts = document.querySelectorAll('[class*="EdgeChart"]');
if (edgeCharts.length > 0) {
  console.log('✅ EdgeChart components found:', edgeCharts.length);
} else {
  console.log('⚠️  No EdgeChart components found - checking for chart containers');
  const chartContainers = document.querySelectorAll('.chart-container, [class*="chart"]');
  console.log('   Chart containers found:', chartContainers.length);
}
console.log('');

// Test 2: Check for legend element
console.log('TEST 2: Legend Element Detection');
console.log('---------------------------------');
const legends = document.querySelectorAll('[class*="absolute"][class*="top-4"][class*="left-4"]');
if (legends.length > 0) {
  console.log('✅ Legend elements found:', legends.length);
  legends.forEach((legend, index) => {
    console.log(`   Legend ${index + 1}:`, {
      visible: legend.offsetHeight > 0,
      position: window.getComputedStyle(legend).position,
      zIndex: window.getComputedStyle(legend).zIndex,
      text: legend.textContent?.substring(0, 100) || 'No text'
    });
  });
} else {
  console.log('❌ No legend elements found');
  console.log('   Searching for any absolute positioned elements...');
  const absoluteElements = document.querySelectorAll('[class*="absolute"]');
  console.log('   Absolute positioned elements found:', absoluteElements.length);
}
console.log('');

// Test 3: Check for debug elements (should be removed)
console.log('TEST 3: Debug Element Removal Check');
console.log('------------------------------------');
const redDebugBanners = document.querySelectorAll('[class*="bg-red-500"]');
const purpleDebugBoxes = document.querySelectorAll('[class*="bg-purple-600"]');
const yellowBorders = document.querySelectorAll('[class*="border-yellow-300"]');

if (redDebugBanners.length === 0) {
  console.log('✅ No red debug banners found (correctly removed)');
} else {
  console.log('❌ Red debug banners still present:', redDebugBanners.length);
}

if (purpleDebugBoxes.length === 0) {
  console.log('✅ No purple debug boxes found (correctly removed)');
} else {
  console.log('❌ Purple debug boxes still present:', purpleDebugBoxes.length);
}
console.log('');

// Test 4: Check for Plotly chart
console.log('TEST 4: Plotly Chart Detection');
console.log('-------------------------------');
const plotlyElements = document.querySelectorAll('.js-plotly-plot, [data-plotly]');
if (plotlyElements.length > 0) {
  console.log('✅ Plotly charts found:', plotlyElements.length);
  plotlyElements.forEach((plot, index) => {
    const plotDiv = plot;
    if (plotDiv._fullLayout) {
      console.log(`   Chart ${index + 1}:`, {
        hasData: plotDiv.data?.length > 0,
        dataPoints: plotDiv.data?.[0]?.x?.length || 0,
        hovermode: plotDiv._fullLayout.hovermode,
        showspikes: plotDiv._fullLayout.xaxis?.showspikes
      });
    }
  });
} else {
  console.log('❌ No Plotly charts found');
}
console.log('');

// Test 5: Look for OHLCV data in page
console.log('TEST 5: OHLCV Data Presence');
console.log('----------------------------');
const pageText = document.body.textContent || '';
const hasOHLC = /O:\s*[\d.]+\s*H:\s*[\d.]+\s*L:\s*[\d.]+\s*C:\s*[\d.]+/i.test(pageText);
if (hasOHLC) {
  console.log('✅ OHLCV legend format detected in page');
  const match = pageText.match(/O:\s*[\d.]+\s*H:\s*[\d.]+\s*L:\s*[\d.]+\s*C:\s*[\d.]+/i);
  if (match) {
    console.log('   Legend text:', match[0]);
  }
} else {
  console.log('⚠️  OHLCV format not detected - legend may not be visible yet');
  console.log('   This could mean:');
  console.log('   - No ticker is selected');
  console.log('   - Data is still loading');
  console.log('   - Component hasn\'t rendered yet');
}
console.log('');

// Test 6: React DevTools check
console.log('TEST 6: React Component State');
console.log('------------------------------');
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('✅ React DevTools available');
  console.log('   Open React DevTools and look for:');
  console.log('   - EdgeChart component');
  console.log('   - hoveredIndex state (should be null or number)');
  console.log('   - ChartLegend child component');
} else {
  console.log('⚠️  React DevTools not detected');
  console.log('   Install React DevTools browser extension for detailed inspection');
}
console.log('');

// Test 7: Console logs check
console.log('TEST 7: Expected Console Logs');
console.log('------------------------------');
console.log('When you hover over the chart, you should see:');
console.log('   "🎯🎯🎯 REACT onHover EVENT FIRED! 🎯🎯🎯"');
console.log('   "✅ Got pointIndex directly: [number]"');
console.log('   "🎯 Legend updating to bar [index]: [date] (Close: [price])"');
console.log('');

// Summary
console.log('');
console.log('==========================================');
console.log('VALIDATION TEST SUMMARY');
console.log('==========================================');
console.log('');
console.log('MANUAL VERIFICATION STEPS:');
console.log('1. Select a ticker from the scan results (e.g., SPY)');
console.log('2. Look for legend in top-left corner of chart');
console.log('3. Hover over candlesticks');
console.log('4. Verify legend updates in real-time');
console.log('5. Move mouse away from chart');
console.log('6. Verify legend shows most recent candle');
console.log('');
console.log('EXPECTED LEGEND FORMAT:');
console.log('SPY Nov 19 O:123.45 H:124.00 L:123.00 C:123.80 V:1.2M | +1.23 (+1.01%)');
console.log('');
console.log('If legend is not visible:');
console.log('1. Check that a ticker is selected');
console.log('2. Verify data is loaded (check console for "Data points:" messages)');
console.log('3. Refresh the page');
console.log('4. Check browser console for errors');
console.log('');
console.log('==========================================');
