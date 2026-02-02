const { test, expect } = require('@playwright/test');

test('Debug CopilotKit Action Handler Pipeline', async ({ page }) => {
  console.log('🔬 Debugging CopilotKit action handler pipeline...');

  // Capture all console logs with detailed filtering
  const consoleMessages = [];
  const submissionLogs = [];
  const actionHandlerLogs = [];
  const aiProcessingLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`${msg.type()}: ${text}`);

    // Track submission flow
    if (text.includes('📤 CopilotTextarea onSubmit triggered')) {
      submissionLogs.push(text);
      console.log(`✅ SUBMISSION: ${text}`);
    }

    // Track action handler execution
    if (text.includes('🔥 General message received') ||
        text.includes('🎯 Action handler triggered') ||
        text.includes('📝 Message content')) {
      actionHandlerLogs.push(text);
      console.log(`🎯 ACTION HANDLER: ${text}`);
    }

    // Track AI processing
    if (text.includes('⚙️ CopilotKit will now process') ||
        text.includes('API') ||
        text.includes('copilot')) {
      aiProcessingLogs.push(text);
      console.log(`🤖 AI PROCESSING: ${text}`);
    }
  });

  // Navigate and wait for full load
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  console.log('✅ Page loaded and stabilized');

  // Locate CopilotTextarea
  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();
  expect(await copilotTextarea.count()).toBeGreaterThan(0);
  console.log('✅ CopilotTextarea located');

  // ────── Test 1: Simple Message via Enter Key ──────
  console.log('\n🧪 Test 1: Simple message via Enter key');

  await copilotTextarea.clear();
  const testMessage1 = "debug test message";
  await copilotTextarea.fill(testMessage1);
  console.log(`✅ Typed: "${testMessage1}"`);

  // Clear previous logs to focus on this submission
  submissionLogs.length = 0;
  actionHandlerLogs.length = 0;
  aiProcessingLogs.length = 0;

  await copilotTextarea.press('Enter');
  console.log('✅ Pressed Enter');

  // Wait for processing
  await page.waitForTimeout(8000);

  console.log('\n📊 PIPELINE ANALYSIS - Test 1:');
  console.log(`📤 Submission Logs: ${submissionLogs.length}`);
  submissionLogs.forEach(log => console.log(`   ${log}`));

  console.log(`🎯 Action Handler Logs: ${actionHandlerLogs.length}`);
  actionHandlerLogs.forEach(log => console.log(`   ${log}`));

  console.log(`🤖 AI Processing Logs: ${aiProcessingLogs.length}`);
  aiProcessingLogs.forEach(log => console.log(`   ${log}`));

  // ────── Test 2: Message via Send Button ──────
  console.log('\n🧪 Test 2: Message via Send button');

  await copilotTextarea.clear();
  const testMessage2 = "help";
  await copilotTextarea.fill(testMessage2);

  // Clear logs again
  submissionLogs.length = 0;
  actionHandlerLogs.length = 0;
  aiProcessingLogs.length = 0;

  const sendButton = await page.locator('button:has-text("Send Message")');
  if (await sendButton.count() > 0) {
    await sendButton.click();
    console.log('✅ Send button clicked');

    // Wait for processing
    await page.waitForTimeout(8000);

    console.log('\n📊 PIPELINE ANALYSIS - Test 2:');
    console.log(`📤 Submission Logs: ${submissionLogs.length}`);
    submissionLogs.forEach(log => console.log(`   ${log}`));

    console.log(`🎯 Action Handler Logs: ${actionHandlerLogs.length}`);
    actionHandlerLogs.forEach(log => console.log(`   ${log}`));

    console.log(`🤖 AI Processing Logs: ${aiProcessingLogs.length}`);
    aiProcessingLogs.forEach(log => console.log(`   ${log}`));
  }

  // ────── Final Analysis ──────
  console.log('\n📋 FINAL PIPELINE DIAGNOSIS:');
  console.log('═══════════════════════════════');

  // Count total logs across all tests
  const totalSubmissions = submissionLogs.length;
  const totalActionHandler = actionHandlerLogs.length;
  const totalAiProcessing = aiProcessingLogs.length;

  console.log(`📤 Total Submission Events: ${totalSubmissions}`);
  console.log(`🎯 Total Action Handler Events: ${totalActionHandler}`);
  console.log(`🤖 Total AI Processing Events: ${totalAiProcessing}`);

  if (totalSubmissions > 0 && totalActionHandler === 0) {
    console.log('🔍 DIAGNOSIS: Messages are submitted but action handlers are not triggered');
    console.log('   - CopilotTextarea onSubmit is working');
    console.log('   - AI is not routing to action handlers');
    console.log('   - Issue is in AI decision-making or configuration');
  } else if (totalSubmissions === 0) {
    console.log('🔍 DIAGNOSIS: Messages are not being submitted at all');
    console.log('   - CopilotTextarea onSubmit is not triggering');
    console.log('   - Issue is in CopilotTextarea configuration');
  } else if (totalActionHandler > 0) {
    console.log('🎉 SUCCESS: Action handlers are being triggered correctly!');
  }

  // Store logs for further investigation
  console.log(`\n📝 Total console messages captured: ${consoleMessages.length}`);

  // For now, let's not fail the test but gather information
  // expect(totalActionHandler).toBeGreaterThan(0);
});