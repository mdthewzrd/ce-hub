/**
 * UI SELECTOR FINDER
 *
 * This script will help us find the correct UI selectors for:
 * - Chat input field
 * - Display mode buttons
 * - Date range controls
 * - Page navigation elements
 */

const { chromium } = require('playwright');

async function findUISelectors() {
  console.log('🔍 FINDING UI SELECTORS FOR VISUAL TESTING');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('🌐 Navigating to http://localhost:6565...');
    await page.goto('http://localhost:6565');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial page
    await page.screenshot({ path: 'ui_exploration_initial.png' });

    console.log('\n🔍 SEARCHING FOR CHAT INPUT FIELD...');
    const chatInputSelectors = [
      'input[placeholder*="message"]',
      'input[placeholder*="chat"]',
      'input[placeholder*="type"]',
      'input[placeholder*="ask"]',
      'input[placeholder*="renata"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="chat"]',
      'input[type="text"]',
      'textarea',
      '[data-testid*="chat"]',
      '[data-testid*="input"]',
      '.chat-input',
      '#chat-input',
      '[role="textbox"]'
    ];

    for (const selector of chatInputSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`✅ Found ${elements} element(s) with selector: ${selector}`);

        // Take screenshot highlighting this element
        await page.locator(selector).first().highlight();
        await page.screenshot({ path: `input_found_${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
      }
    }

    console.log('\n🔍 SEARCHING FOR DISPLAY MODE BUTTONS...');
    const displayModeSelectors = [
      'button:has-text("$")',
      'button:has-text("Dollar")',
      'button:has-text("R")',
      'button:has-text("Gross")',
      'button:has-text("Net")',
      '[data-testid*="dollar"]',
      '[data-testid*="display"]',
      '[data-testid*="mode"]',
      '.display-mode',
      '.mode-button'
    ];

    for (const selector of displayModeSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`✅ Found ${elements} display element(s) with selector: ${selector}`);

        // Highlight and screenshot
        await page.locator(selector).first().highlight();
        await page.screenshot({ path: `display_found_${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
      }
    }

    console.log('\n🔍 SEARCHING FOR DATE RANGE CONTROLS...');
    const dateRangeSelectors = [
      'button:has-text("All Time")',
      'button:has-text("Today")',
      'button:has-text("Week")',
      'button:has-text("Month")',
      'button:has-text("90")',
      '[data-testid*="date"]',
      '[data-testid*="range"]',
      '.date-range',
      '.date-selector'
    ];

    for (const selector of dateRangeSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`✅ Found ${elements} date element(s) with selector: ${selector}`);

        // Highlight and screenshot
        await page.locator(selector).first().highlight();
        await page.screenshot({ path: `date_found_${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png` });
      }
    }

    console.log('\n🔍 SEARCHING FOR PAGE NAVIGATION...');
    const navSelectors = [
      'a:has-text("Dashboard")',
      'a:has-text("Statistics")',
      'a:has-text("Trades")',
      'button:has-text("Dashboard")',
      'button:has-text("Statistics")',
      'button:has-text("Trades")',
      '[data-testid*="nav"]',
      '.nav-link',
      '.navigation'
    ];

    for (const selector of navSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`✅ Found ${elements} nav element(s) with selector: ${selector}`);
      }
    }

    console.log('\n📊 EXPLORING FULL PAGE ELEMENTS...');
    // Get all text content to understand the page structure
    const allText = await page.textContent('body');
    const words = allText.toLowerCase().split(/\s+/).slice(0, 50);
    console.log('First 50 words on page:', words.join(' '));

    // Get all buttons
    const buttons = await page.locator('button').count();
    console.log(`Total buttons found: ${buttons}`);

    for (let i = 0; i < Math.min(buttons, 10); i++) {
      const buttonText = await page.locator('button').nth(i).textContent();
      console.log(`Button ${i}: "${buttonText}"`);
    }

    // Get all inputs
    const inputs = await page.locator('input').count();
    console.log(`Total inputs found: ${inputs}`);

    for (let i = 0; i < Math.min(inputs, 5); i++) {
      const inputType = await page.locator('input').nth(i).getAttribute('type');
      const inputPlaceholder = await page.locator('input').nth(i).getAttribute('placeholder');
      console.log(`Input ${i}: type="${inputType}" placeholder="${inputPlaceholder}"`);
    }

    // Take final screenshot
    await page.screenshot({ path: 'ui_exploration_final.png', fullPage: true });

    console.log('\n✅ UI EXPLORATION COMPLETE');
    console.log('Screenshots saved:');
    console.log('- ui_exploration_initial.png');
    console.log('- ui_exploration_final.png');
    console.log('- Plus any element-specific screenshots');

  } catch (error) {
    console.error('❌ Error during UI exploration:', error);
  } finally {
    await browser.close();
  }
}

findUISelectors();