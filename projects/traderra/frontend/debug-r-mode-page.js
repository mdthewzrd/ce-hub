// Debug script to examine the actual page structure
// Run in browser console on http://localhost:6565/dashboard-test

console.log('🔍 Debugging R-Mode Page Structure...');

// Find all buttons on the page
console.log('\n📍 All Buttons on Page:');
const allButtons = Array.from(document.querySelectorAll('button'));
allButtons.forEach((btn, index) => {
  console.log(`${index}: "${btn.textContent?.trim()}" - Classes: ${btn.className}`);
});

// Find Performance Overview section
console.log('\n📍 Performance Overview Section:');
const perfOverview = document.querySelector('h2');
if (perfOverview && perfOverview.textContent?.includes('Performance Overview')) {
  console.log('✅ Performance Overview found');

  // Find the parent container
  const container = perfOverview.closest('div');
  if (container) {
    console.log('Container found, looking for metrics...');

    // Find all metric cards in the container
    const metricCards = container.querySelectorAll('.studio-surface, [class*="grid"] > div, [class*="p-4"]');
    console.log(`Found ${metricCards.length} potential metric cards`);

    metricCards.forEach((card, index) => {
      const title = card.querySelector('.text-sm, .studio-muted');
      const value = card.querySelector('.text-2xl, .font-semibold');

      if (title && value) {
        console.log(`Metric ${index}: ${title.textContent?.trim()} = ${value.textContent?.trim()}`);
      }
    });
  }
} else {
  console.log('❌ Performance Overview section not found');
}

// Look for display mode buttons specifically
console.log('\n📍 Display Mode Buttons:');
const displayModeButtons = allButtons.filter(btn => {
  const text = btn.textContent?.trim();
  return text === '$' || text === '%' || text === 'R';
});

displayModeButtons.forEach(btn => {
  console.log(`Display Mode Button: "${btn.textContent?.trim()}" - Active: ${btn.classList.contains('bg-blue') || btn.classList.contains('bg-primary') || btn.getAttribute('aria-pressed') === 'true'}`);
});

// Look for G/N buttons
console.log('\n📍 G/N Toggle Buttons:');
const gnButtons = allButtons.filter(btn => {
  const text = btn.textContent?.trim();
  return text === 'G' || text === 'N';
});

gnButtons.forEach(btn => {
  console.log(`G/N Button: "${btn.textContent?.trim()}" - Active: ${btn.classList.contains('bg-blue') || btn.classList.contains('bg-primary')}`);
});

// Check if R-mode is currently active
console.log('\n📍 Current Display Mode State:');
const activeDisplayButton = displayModeButtons.find(btn =>
  btn.classList.contains('bg-blue') ||
  btn.classList.contains('bg-primary') ||
  btn.getAttribute('aria-pressed') === 'true'
);

if (activeDisplayButton) {
  console.log(`Active display mode: ${activeDisplayButton.textContent?.trim()}`);
} else {
  console.log('No active display mode detected');
}

// Function to test R-mode clicking
window.testRMode = function() {
  console.log('\n🧪 Testing R-Mode Click...');

  const rButton = displayModeButtons.find(btn => btn.textContent?.trim() === 'R');
  if (rButton) {
    console.log('Clicking R-mode button...');
    rButton.click();

    setTimeout(() => {
      console.log('Checking metrics after R-mode click...');

      const perfSection = document.querySelector('h2');
      if (perfSection?.textContent?.includes('Performance Overview')) {
        const container = perfSection.closest('div');
        if (container) {
          const metricCards = container.querySelectorAll('.studio-surface, [class*="p-4"]');

          metricCards.forEach((card, index) => {
            const title = card.querySelector('.text-sm, .studio-muted');
            const value = card.querySelector('.text-2xl, .font-semibold');

            if (title && value) {
              const titleText = title.textContent?.trim();
              const valueText = value.textContent?.trim();
              console.log(`After R-mode - Metric ${index}: ${titleText} = ${valueText}`);

              // Check if it's R-multiple format
              if (valueText?.endsWith('R')) {
                console.log(`✅ Found R-multiple value: ${valueText}`);
              }
            }
          });
        }
      }
    }, 1000);
  } else {
    console.log('❌ R-mode button not found');
  }
};

console.log('\n💡 Run window.testRMode() to test R-mode functionality');

// Look for any existing R-multiple values
console.log('\n📍 Current R-Multiple Values:');
const allText = document.body.textContent || '';
const rMultipleMatches = allText.match(/\d+(\.\d+)?R/g);
if (rMultipleMatches) {
  console.log(`Found R-multiple values: ${rMultipleMatches.join(', ')}`);
} else {
  console.log('No R-multiple values found in current page');
}