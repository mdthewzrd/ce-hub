const { test, expect } = require('@playwright/test');

test('Send message functionality test', async ({ page }) => {
  console.log('🧪 Testing send message functionality...');

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');

  // Wait for CopilotTextarea to initialize
  await page.waitForTimeout(3000);

  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();
  await copilotTextarea.waitFor({ timeout: 10000 });
  console.log('✅ CopilotTextarea found');

  // Test typing and sending a message
  const testMessage = "Hello, this is a test message";

  // Type in the textarea
  await copilotTextarea.fill(testMessage);
  console.log('✅ Message typed in textarea');

  // Verify the display mode buttons are removed
  const dollarButton = await page.locator('button:has-text("$ Dollar")').count();
  const rMultipleButton = await page.locator('button:has-text("R Multiple")').count();
  const percentageButton = await page.locator('button:has-text("% Percentage")').count();

  console.log(`🔍 Display mode buttons check:`);
  console.log(`   $ Dollar button: ${dollarButton} (should be 0)`);
  console.log(`   R Multiple button: ${rMultipleButton} (should be 0)`);
  console.log(`   % Percentage button: ${percentageButton} (should be 0)`);

  if (dollarButton === 0 && rMultipleButton === 0 && percentageButton === 0) {
    console.log('✅ Display mode buttons successfully removed');
  } else {
    console.warn('⚠️  Some display mode buttons still exist');
  }

  // Test send button
  const sendButton = await page.locator('button:has-text("Send Message")');
  const sendButtonExists = await sendButton.count();

  if (sendButtonExists > 0) {
    console.log('✅ Send Message button found');

    // Click the send button
    await sendButton.click();
    console.log('✅ Send Message button clicked');

    // Wait a moment for any processing
    await page.waitForTimeout(1000);

    console.log('✅ Send functionality test completed');
  } else {
    console.warn('⚠️  Send Message button not found');
  }

  console.log('📊 Test Summary:');
  console.log(`   Display mode buttons removed: ${dollarButton === 0 && rMultipleButton === 0 && percentageButton === 0}`);
  console.log(`   Send button exists: ${sendButtonExists > 0}`);

  expect(dollarButton).toBe(0);
  expect(rMultipleButton).toBe(0);
  expect(percentageButton).toBe(0);
  expect(sendButtonExists).toBeGreaterThan(0);

  console.log('🎉 Send message test completed successfully!');
});