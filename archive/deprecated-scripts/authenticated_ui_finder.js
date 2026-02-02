/**
 * AUTHENTICATED UI FINDER
 *
 * Navigate to dashboard/authenticated area and find actual Renata chat interface
 */

const { chromium } = require('playwright');

async function findAuthenticatedUI() {
  console.log('🔍 FINDING AUTHENTICATED UI (RENATA CHAT)');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('🌐 Starting at http://localhost:6565...');
    await page.goto('http://localhost:6565');
    await page.waitForLoadState('networkidle');

    // Try common dashboard routes
    const dashboardRoutes = [
      '/dashboard',
      '/app',
      '/trades',
      '/statistics',
      '/journal',
      '/analytics'
    ];

    for (const route of dashboardRoutes) {
      console.log(`\n🔄 Trying route: ${route}`);

      try {
        await page.goto(`http://localhost:6565${route}`);
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({ path: `route_${route.replace('/', '')}_screenshot.png` });

        // Check for chat interface
        const chatSelectors = [
          'input[placeholder*="message"]',
          'input[placeholder*="chat"]',
          'input[placeholder*="renata"]',
          'textarea[placeholder*="message"]',
          '[data-testid*="chat"]',
          '.copilot', // CopilotKit specific
          '.chat-input'
        ];

        let foundChat = false;
        for (const selector of chatSelectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`✅ FOUND CHAT on ${route}! Selector: ${selector} (${count} elements)`);
            foundChat = true;

            // Highlight and screenshot the chat element
            await page.locator(selector).first().highlight();
            await page.screenshot({ path: `chat_found_${route.replace('/', '')}.png` });
          }
        }

        // Check for display mode buttons on this route
        const displayButtons = await page.locator('button:has-text("$"), button:has-text("R"), button:has-text("Net")').count();
        if (displayButtons > 0) {
          console.log(`✅ Found ${displayButtons} display mode buttons on ${route}`);
        }

        // Check for date controls
        const dateControls = await page.locator('button:has-text("90"), button:has-text("All Time"), button:has-text("Today")').count();
        if (dateControls > 0) {
          console.log(`✅ Found ${dateControls} date controls on ${route}`);
        }

        // Get page text to understand content
        const pageText = await page.textContent('body');
        const firstWords = pageText.toLowerCase().split(/\s+/).slice(0, 20).join(' ');
        console.log(`📝 Page content: ${firstWords}...`);

        if (foundChat) {
          console.log(`🎯 BEST ROUTE FOUND: ${route} has chat interface!`);

          // Try a quick test command
          const chatInput = page.locator(chatSelectors.find(async s => await page.locator(s).count() > 0)).first();

          if (chatInput) {
            console.log('🧪 Testing quick command...');
            await chatInput.fill('Go to dashboard');
            await chatInput.press('Enter');
            await page.waitForTimeout(2000);

            await page.screenshot({ path: `test_command_${route.replace('/', '')}.png` });
            console.log('✅ Test command sent successfully!');
          }
        }

      } catch (error) {
        console.log(`❌ Route ${route} failed: ${error.message}`);
      }
    }

    // Final comprehensive screenshot
    await page.screenshot({ path: 'final_authenticated_exploration.png', fullPage: true });

    console.log('\n✅ AUTHENTICATED UI EXPLORATION COMPLETE');

  } catch (error) {
    console.error('❌ Error during authenticated UI exploration:', error);
  } finally {
    await browser.close();
  }
}

findAuthenticatedUI();