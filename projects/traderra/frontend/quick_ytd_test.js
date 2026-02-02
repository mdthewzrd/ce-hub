/**
 * Quick YTD Test - Single test to verify fixes
 */

const { chromium } = require('playwright');

async function quickYTDTest() {
  console.log('🧪 Quick YTD Test Starting...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to statistics page
    console.log('📍 Navigating to statistics page...');
    await page.goto('http://localhost:6565/statistics');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'ytd-test-before.png' });

    // Check if date selector is now visible with test IDs
    try {
      await page.waitForSelector('[data-testid="date-selector"]', { timeout: 5000 });
      console.log('✅ Date selector found with test ID!');
    } catch (e) {
      console.log('❌ Date selector still not found with test ID');
    }

    // Check if display mode toggle is visible with test IDs
    try {
      await page.waitForSelector('[data-testid="display-mode-toggle"]', { timeout: 5000 });
      console.log('✅ Display mode toggle found with test ID!');
    } catch (e) {
      console.log('❌ Display mode toggle still not found with test ID');
    }

    // Try to send a command via API
    console.log('📤 Sending YTD command via API...');
    await page.evaluate(async () => {
      const response = await fetch('/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'generateCopilotResponse',
          query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              messages { content }
            }
          }`,
          variables: {
            data: {
              messages: [{ content: 'switch to dollars and show year to date', role: 'user' }]
            }
          }
        })
      });

      const result = await response.json();
      console.log('🎯 API Response:', response.ok ? 'Success' : 'Failed');
      return result;
    });

    // Wait for potential state changes
    await page.waitForTimeout(3000);

    // Take screenshot of final state
    await page.screenshot({ path: 'ytd-test-after.png' });

    // Check for YTD button specifically
    try {
      const ytdButton = await page.$('[data-testid="date-range-ytd"], [data-testid="date-range-year"], button:has-text("YTD")');
      if (ytdButton) {
        const isActive = await ytdButton.getAttribute('data-active');
        console.log('📅 YTD button found, active:', isActive);
      } else {
        console.log('❌ YTD button not found');
      }
    } catch (e) {
      console.log('❌ Error checking YTD button:', e.message);
    }

    // Check display mode
    try {
      const dollarButton = await page.$('[data-testid="display-mode-dollar"]');
      if (dollarButton) {
        const isActive = await dollarButton.getAttribute('data-active');
        console.log('💰 Dollar button found, active:', isActive);
      } else {
        console.log('❌ Dollar button not found');
      }
    } catch (e) {
      console.log('❌ Error checking dollar button:', e.message);
    }

    console.log('✅ Test completed - check ytd-test-before.png and ytd-test-after.png');

  } catch (error) {
    console.log('💥 Test error:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  quickYTDTest().then(() => process.exit(0));
}

module.exports = { quickYTDTest };