const { test, expect } = require('@playwright/test');

test('Comprehensive CopilotKit Message Functionality Test', async ({ page }) => {
  console.log('🧪 Testing comprehensive CopilotKit message functionality...');

  // Capture console logs for debugging
  const consoleMessages = [];
  const jsErrors = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.text().includes('🔥 General message received') ||
        msg.text().includes('copilot') ||
        msg.text().includes('CopilotKit') ||
        msg.text().includes('send_general_message')) {
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
  console.log('✅ Page loaded');

  // Wait for React components to fully initialize
  await page.waitForTimeout(5000);

  // ────── PHASE 1: Verify CopilotTextarea Exists ──────
  console.log('📝 Phase 1: Verifying CopilotTextarea...');

  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();
  const textareaExists = await copilotTextarea.count();

  expect(textareaExists).toBeGreaterThan(0);
  console.log('✅ CopilotTextarea found');

  // ────── PHASE 2: Test Simple Message Sending ──────
  console.log('💬 Phase 2: Testing simple message sending...');

  try {
    await copilotTextarea.waitFor({ timeout: 10000 });

    // Test message 1: Help command
    const helpMessage = "help";
    await copilotTextarea.fill(helpMessage);
    console.log(`✅ Typed message: "${helpMessage}"`);

    // Trigger submission by Enter key
    await copilotTextarea.press('Enter');
    console.log('✅ Pressed Enter to send message');

    // Wait for response processing
    await page.waitForTimeout(3000);

    // Check for response in UI or console
    const hasResponse = consoleMessages.some(msg =>
      msg.includes('🔥 General message received') ||
      msg.includes('send_general_message')
    );

    if (hasResponse) {
      console.log('✅ Message processing detected in console');
    }

  } catch (error) {
    console.warn('⚠️  Error during message sending:', error.message);
  }

  // ────── PHASE 3: Test Send Button Functionality ──────
  console.log('🔘 Phase 3: Testing Send Message button...');

  const sendButton = await page.locator('button:has-text("Send Message")');
  const sendButtonExists = await sendButton.count();

  if (sendButtonExists > 0) {
    console.log('✅ Send Message button found');

    try {
      // Clear and type new message
      await copilotTextarea.clear();
      const statusMessage = "status";
      await copilotTextarea.fill(statusMessage);
      console.log(`✅ Typed message: "${statusMessage}"`);

      // Click send button
      await sendButton.click();
      console.log('✅ Send Message button clicked');

      // Wait for processing
      await page.waitForTimeout(3000);

      // Verify message was processed
      const buttonResponse = consoleMessages.some(msg =>
        msg.includes('🔥 General message received') ||
        msg.includes('status')
      );

      if (buttonResponse) {
        console.log('✅ Send button message processing detected');
      }

    } catch (error) {
      console.warn('⚠️  Error with send button:', error.message);
    }
  } else {
    console.warn('⚠️  Send Message button not found');
  }

  // ────── PHASE 4: Test API Response Flow ──────
  console.log('🔄 Phase 4: Testing API response flow...');

  // Monitor network requests to /api/copilotkit
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/copilotkit')) {
      apiRequests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers()
      });
      console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/copilotkit')) {
      console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
    }
  });

  // Send one more test message
  try {
    await copilotTextarea.clear();
    const testMessage = "Hello Renata";
    await copilotTextarea.fill(testMessage);
    await copilotTextarea.press('Enter');

    // Wait for API calls
    await page.waitForTimeout(5000);

    console.log(`📊 API Requests made: ${apiRequests.length}`);

  } catch (error) {
    console.warn('⚠️  Error during API test:', error.message);
  }

  // ────── PHASE 5: Comprehensive Status Report ──────
  console.log('📊 Phase 5: Generating comprehensive status report...');

  // Check for any CopilotKit-related errors
  const copilotErrors = jsErrors.filter(err =>
    err.includes('copilot') ||
    err.includes('CopilotKit') ||
    err.includes('license') ||
    err.includes('api key') ||
    err.includes('runtime')
  );

  // Count message processing logs
  const messageProcessingLogs = consoleMessages.filter(msg =>
    msg.includes('🔥 General message received') ||
    msg.includes('send_general_message') ||
    msg.includes('useCopilotAction')
  );

  // License check
  const licenseModal = await page.locator('text=GET LICENSE KEY').count();
  const licenseButton = await page.locator('button:has-text("GET LICENSE KEY")').count();

  console.log('🎯 COMPREHENSIVE TEST SUMMARY:');
  console.log('════════════════════════════════');
  console.log(`✅ CopilotTextarea present: ${textareaExists > 0}`);
  console.log(`✅ Send Message button present: ${sendButtonExists > 0}`);
  console.log(`🔍 License modal present: ${licenseModal > 0 || licenseButton > 0}`);
  console.log(`📊 Total console messages: ${consoleMessages.length}`);
  console.log(`🔥 Message processing logs: ${messageProcessingLogs.length}`);
  console.log(`🌐 API requests to /api/copilotkit: ${apiRequests.length}`);
  console.log(`❌ JavaScript errors: ${jsErrors.length}`);
  console.log(`🚨 CopilotKit-related errors: ${copilotErrors.length}`);

  if (copilotErrors.length > 0) {
    console.log('🚨 CopilotKit ERRORS FOUND:');
    copilotErrors.forEach(err => console.log(`   ❌ ${err}`));
  }

  if (messageProcessingLogs.length > 0) {
    console.log('🔥 MESSAGE PROCESSING LOGS:');
    messageProcessingLogs.forEach(log => console.log(`   📝 ${log}`));
  }

  // ────── FINAL ASSERTIONS ──────
  console.log('🎯 Running final assertions...');

  // Core functionality assertions
  expect(textareaExists).toBeGreaterThan(0); // CopilotTextarea must exist
  expect(sendButtonExists).toBeGreaterThan(0); // Send button must exist
  expect(licenseModal).toBe(0); // No license modal should block
  expect(licenseButton).toBe(0); // No license button should block
  expect(copilotErrors.length).toBe(0); // No CopilotKit errors

  // Message processing assertion
  expect(messageProcessingLogs.length).toBeGreaterThan(0); // At least one message should be processed

  console.log('🎉 Comprehensive CopilotKit message test completed successfully!');
});