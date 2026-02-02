// EdgeChart Legend Validation Script
// Run this in browser console to check legend visibility

console.log('🔍 LEGEND VALIDATION TEST');

// Check if EdgeChart component is mounted
const chartContainer = document.querySelector('.chart-container');
console.log('📊 Chart Container:', chartContainer ? '✅ Found' : '❌ Not found');

// Check if ChartLegend is present
const legend = document.querySelector('.absolute.top-4.left-4.z-\\[100\\]');
console.log('🏷️ Chart Legend:', legend ? '✅ Found' : '❌ Not found');

if (legend) {
  console.log('📍 Legend position:', legend.style.position || 'default');
  console.log('📐 Legend bounds:', legend.getBoundingClientRect());
  console.log('👁️ Legend visibility:', getComputedStyle(legend).visibility);
  console.log('🎨 Legend display:', getComputedStyle(legend).display);
  console.log('🔢 Legend z-index:', getComputedStyle(legend).zIndex);
  console.log('📝 Legend content:', legend.textContent);
}

// Check for Plotly chart element
const plotlyChart = document.querySelector('.js-plotly-plot');
console.log('📈 Plotly Chart:', plotlyChart ? '✅ Found' : '❌ Not found');

// Check for EdgeChart placeholder vs real chart
const placeholder = document.querySelector('.text-center .text-4xl');
console.log('🎭 Placeholder detected:', placeholder ? '❌ Still showing placeholder' : '✅ Real chart');

// Check for any React errors
if (window.React) {
  console.log('⚛️ React version:', window.React.version || 'Available');
}

console.log('🏁 Validation complete');