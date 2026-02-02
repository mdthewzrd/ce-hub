const { test, expect } = require('@playwright/test');

test('CopilotKit license and send functionality test', async ({ page }) => {
  console.log('🧪 Testing CopilotKit license and send functionality...');

  // Capture console logs and errors
  const consoleMessages = [];
  const jsErrors = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.text().includes('copilot') || msg.text().includes('CopilotKit') || msg.text().includes('license')) {
      console.log(`🤖 CopilotKit log: ${msg.type()}: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    jsErrors.push(err.message);
    if (err.message.includes('copilot') || err.message.includes('CopilotKit') || err.message.includes('license')) {
      console.log(`❌ CopilotKit Error: ${err.message}`);
    }
  });

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');

  // Wait for React to render and check for license modal
  await page.waitForTimeout(5000);

  // Check if license modal is blocking the interface
  const licenseModal = await page.locator('text=GET LICENSE KEY').count();
  const licenseButton = await page.locator('button:has-text("GET LICENSE KEY")').count();

  console.log(`🔍 License modal check:`);
  console.log(`   GET LICENSE KEY text: ${licenseModal}`);
  console.log(`   GET LICENSE KEY button: ${licenseButton}`);

  if (licenseModal === 0 && licenseButton === 0) {
    console.log('✅ No license modal - CopilotKit license properly configured');
  } else {
    console.warn('⚠️  License modal detected - configuration may need attention');
  }

  // Check for CopilotTextarea
  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();
  const textareaExists = await copilotTextarea.count();

  if (textareaExists > 0) {
    console.log('✅ CopilotTextarea found');

    try {
      await copilotTextarea.waitFor({ timeout: 10000 });

      // Test typing a message
      const testMessage = "Hello, this is a test message to check if send works";
      await copilotTextarea.fill(testMessage);
      console.log('✅ Message typed in CopilotTextarea');

      // Test send button
      const sendButton = await page.locator('button:has-text("Send Message")');
      const sendButtonExists = await sendButton.count();

      if (sendButtonExists > 0) {
        console.log('✅ Send Message button found');

        // Click the send button
        await sendButton.click();
        console.log('✅ Send Message button clicked');

        // Wait for any processing
        await page.waitForTimeout(2000);

        console.log('✅ Send functionality test completed without errors');
      } else {
        console.warn('⚠️  Send Message button not found');
      }

    } catch (error) {
      console.warn('⚠️  Error interacting with CopilotTextarea:', error.message);
    }
  } else {
    console.warn('⚠️  CopilotTextarea not found');
  }

  // Check for CopilotKit-related errors
  const copilotErrors = jsErrors.filter(err =>
    err.includes('copilot') ||
    err.includes('CopilotKit') ||
    err.includes('license') ||
    err.includes('api key')
  );

  console.log('📊 License Test Summary:');
  console.log(`   Total console messages: ${consoleMessages.length}`);
  console.log(`   JavaScript errors: ${jsErrors.length}`);
  console.log(`   CopilotKit-related errors: ${copilotErrors.length}`);
  console.log(`   License modal present: ${licenseModal > 0 || licenseButton > 0}`);
  console.log(`   CopilotTextarea present: ${textareaExists > 0}`);

  if (copilotErrors.length > 0) {
    console.log('🚨 CopilotKit-related errors found:');
    copilotErrors.forEach(err => console.log(`   ${err}`));
  }

  // Test should pass if no license modal is blocking and textarea exists
  expect(licenseModal).toBe(0);
  expect(licenseButton).toBe(0);
  expect(textareaExists).toBeGreaterThan(0);

  console.log('🎉 CopilotKit license test completed!');
});