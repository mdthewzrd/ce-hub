const { test, expect } = require('@playwright/test');

test('Simple CopilotKit initialization test', async ({ page }) => {
  console.log('🧪 Testing basic CopilotKit initialization...');

  // Capture all console messages
  const consoleMessages = [];
  const jsErrors = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.text().includes('copilot') || msg.text().includes('CopilotKit')) {
      console.log(`🤖 CopilotKit log: ${msg.type()}: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    jsErrors.push(err.message);
    if (err.message.includes('copilot') || err.message.includes('CopilotKit')) {
      console.log(`❌ CopilotKit Error: ${err.message}`);
    }
  });

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');

  // Wait longer for CopilotKit to initialize
  await page.waitForTimeout(5000);

  console.log('✅ Page loaded, checking CopilotKit status...');

  // Check for CopilotKit provider in the DOM
  const copilotProvider = await page.evaluate(() => {
    // Look for any elements with copilot in their attributes
    const elements = document.querySelectorAll('*');
    const copilotElements = [];

    elements.forEach(el => {
      const attrs = Array.from(el.attributes).map(attr => attr.name);
      const classes = el.className ? el.className.toString().toLowerCase() : '';

      if (attrs.some(attr => attr.includes('copilot')) ||
          classes.includes('copilot') ||
          el.tagName.toLowerCase().includes('copilot')) {
        copilotElements.push({
          tagName: el.tagName,
          attributes: attrs.filter(attr => attr.includes('copilot')),
          classes: classes
        });
      }
    });

    return copilotElements;
  });

  console.log(`🔍 CopilotKit elements found: ${copilotProvider.length}`);
  if (copilotProvider.length > 0) {
    console.log('   CopilotKit elements:', copilotProvider);
  }

  // Test API endpoint with a proper CopilotKit request
  try {
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/copilotkit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: 'test message'
              }
            ]
          })
        });

        return {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: await res.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log(`🌐 API test result:`, {
      status: response.status,
      copilotHeaders: Object.keys(response.headers).filter(h => h.includes('copilot'))
    });

    if (response.error) {
      console.log(`❌ API error: ${response.error}`);
    }

  } catch (error) {
    console.log(`❌ API test failed: ${error.message}`);
  }

  // Look for any textareas
  const allTextareas = await page.locator('textarea').all();
  console.log(`📝 Total textareas found: ${allTextareas.length}`);

  // Check for specific CopilotKit errors
  const copilotErrors = jsErrors.filter(err =>
    err.includes('copilot') ||
    err.includes('CopilotKit') ||
    err.includes('OpenAI') ||
    err.includes('runtime')
  );

  if (copilotErrors.length > 0) {
    console.log('🚨 CopilotKit-related errors:');
    copilotErrors.forEach(err => console.log(`   ${err}`));
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`   - Total console messages: ${consoleMessages.length}`);
  console.log(`   - JavaScript errors: ${jsErrors.length}`);
  console.log(`   - CopilotKit-related errors: ${copilotErrors.length}`);
  console.log(`   - CopilotKit DOM elements: ${copilotProvider.length}`);
  console.log(`   - Total textareas: ${allTextareas.length}`);
});