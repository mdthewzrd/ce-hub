const { test, expect } = require('@playwright/test');

test('Manual Textarea Message Functionality Test', async ({ page }) => {
  console.log('🧪 Testing manual textarea message functionality...');

  // Capture console logs for debugging
  const consoleMessages = [];
  const jsErrors = [];
  const actionHandlerLogs = [];
  const manualSubmissionLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`${msg.type()}: ${text}`);

    // Track manual submission flow
    if (text.includes('📤 Manual message sending triggered')) {
      manualSubmissionLogs.push(text);
      console.log(`✅ MANUAL SUBMISSION: ${text}`);
    }

    // Track action handler execution
    if (text.includes('🔥 General message received') ||
        text.includes('🎯 Action handler triggered') ||
        text.includes('📝 Message content')) {
      actionHandlerLogs.push(text);
      console.log(`🎯 ACTION HANDLER: ${text}`);
    }
  });

  page.on('pageerror', err => {
    jsErrors.push(err.message);
    console.log(`❌ PAGE ERROR: ${err.message}`);
  });

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ Page loaded');

  // ────── Test 1: Verify Regular Textarea Exists ──────
  console.log('\n📝 Test 1: Verifying regular textarea exists...');

  // Look for regular textarea (not CopilotTextarea)
  const textarea = await page.locator('textarea').first();
  const textareaExists = await textarea.count();

  expect(textareaExists).toBeGreaterThan(0);
  console.log('✅ Regular textarea found');

  // ────── Test 2: Test Manual Message Sending via Enter ──────
  console.log('\n💬 Test 2: Testing manual message sending via Enter...');

  // Clear previous logs
  manualSubmissionLogs.length = 0;
  actionHandlerLogs.length = 0;

  const testMessage1 = "hello world test";
  await textarea.fill(testMessage1);
  console.log(`✅ Typed message: "${testMessage1}"`);

  await textarea.press('Enter');
  console.log('✅ Pressed Enter');

  // Wait for processing
  await page.waitForTimeout(3000);

  console.log('\n📊 MANUAL SUBMISSION ANALYSIS - Test 2:');
  console.log(`📤 Manual Submission Logs: ${manualSubmissionLogs.length}`);
  manualSubmissionLogs.forEach(log => console.log(`   ${log}`));

  console.log(`🎯 Action Handler Logs: ${actionHandlerLogs.length}`);
  actionHandlerLogs.forEach(log => console.log(`   ${log}`));

  // ────── Test 3: Test Manual Message via Send Button ──────
  console.log('\n🔘 Test 3: Testing manual message via send button...');

  // Clear logs
  manualSubmissionLogs.length = 0;
  actionHandlerLogs.length = 0;

  const testMessage2 = "status check";
  await textarea.clear();
  await textarea.fill(testMessage2);
  console.log(`✅ Typed message: "${testMessage2}"`);

  // Look for the send button that appears when there's text
  const sendButton = await page.locator('button:has-text(""), button[title="Send message (Enter)"]').first();
  const sendButtonExists = await sendButton.count();

  if (sendButtonExists > 0) {
    await sendButton.click();
    console.log('✅ Send button clicked');

    // Wait for processing
    await page.waitForTimeout(3000);

    console.log('\n📊 MANUAL SUBMISSION ANALYSIS - Test 3:');
    console.log(`📤 Manual Submission Logs: ${manualSubmissionLogs.length}`);
    manualSubmissionLogs.forEach(log => console.log(`   ${log}`));

    console.log(`🎯 Action Handler Logs: ${actionHandlerLogs.length}`);
    actionHandlerLogs.forEach(log => console.log(`   ${log}`));
  } else {
    console.log('⚠️  Send button not visible (only appears when textarea has content)');
  }

  // ────── Final Analysis ──────
  console.log('\n📋 FINAL MANUAL TEXTAREA DIAGNOSIS:');
  console.log('══════════════════════════════════════');

  const totalManualSubmissions = manualSubmissionLogs.length;
  const totalActionHandlers = actionHandlerLogs.length;

  console.log(`📤 Total Manual Submission Events: ${totalManualSubmissions}`);
  console.log(`🎯 Total Action Handler Events: ${totalActionHandlers}`);
  console.log(`❌ JavaScript Errors: ${jsErrors.length}`);
  console.log(`📝 Total Console Messages: ${consoleMessages.length}`);

  if (totalManualSubmissions > 0 && totalActionHandlers > 0) {
    console.log('🎉 SUCCESS: Manual textarea and action handlers are working correctly!');
    console.log('✅ The onSubmit triggering issue has been resolved');
  } else if (totalManualSubmissions === 0) {
    console.log('🔍 ISSUE: Manual submission handlers are not triggering');
  } else if (totalActionHandlers === 0) {
    console.log('🔍 ISSUE: Manual submissions work but action handlers are not called');
  }

  // Check for any JavaScript errors
  if (jsErrors.length > 0) {
    console.log('\n🚨 JavaScript errors found:');
    jsErrors.forEach(error => console.log(`   ❌ ${error}`));
  }

  // Final assertions
  expect(textareaExists).toBeGreaterThan(0); // Regular textarea must exist
  expect(totalManualSubmissions).toBeGreaterThan(0); // Manual submissions should work
  expect(totalActionHandlers).toBeGreaterThan(0); // Action handlers should trigger
  expect(jsErrors.length).toBe(0); // No JavaScript errors

  console.log('\n🎉 Manual textarea message functionality test completed successfully!');
});