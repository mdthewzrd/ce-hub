const { test, expect } = require('@playwright/test');

test('Check for CopilotKit JavaScript Errors', async ({ page }) => {
  console.log('🔍 Checking for JavaScript errors that might block CopilotTextarea...');

  const jsErrors = [];
  const consoleMessages = [];

  // Capture all console messages and errors
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push(`${type}: ${text}`);

    if (type === 'error') {
      console.log(`❌ CONSOLE ERROR: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️ CONSOLE WARNING: ${text}`);
    }
  });

  page.on('pageerror', err => {
    jsErrors.push(err.message);
    console.log(`🚨 PAGE ERROR: ${err.message}`);
  });

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('✅ Page loaded, analyzing console output...');

  // Check for specific CopilotKit-related errors
  const copilotErrors = consoleMessages.filter(msg =>
    msg.toLowerCase().includes('copilot') ||
    msg.toLowerCase().includes('react') ||
    msg.toLowerCase().includes('error') ||
    msg.toLowerCase().includes('warning')
  );

  console.log('\n📊 ERROR ANALYSIS:');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`JavaScript errors: ${jsErrors.length}`);
  console.log(`CopilotKit/React related messages: ${copilotErrors.length}`);

  if (jsErrors.length > 0) {
    console.log('\n🚨 JavaScript Errors Found:');
    jsErrors.forEach(error => console.log(`   ${error}`));
  }

  if (copilotErrors.length > 0) {
    console.log('\n⚠️ CopilotKit/React Related Messages:');
    copilotErrors.forEach(msg => console.log(`   ${msg}`));
  }

  // Check if CopilotTextarea element exists and is properly configured
  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();
  const textareaCount = await copilotTextarea.count();

  console.log(`\n📝 CopilotTextarea Analysis:`);
  console.log(`   Elements found: ${textareaCount}`);

  if (textareaCount > 0) {
    // Check if textarea is actually interactive
    try {
      await copilotTextarea.click();
      console.log('   ✅ Textarea is clickable');

      await copilotTextarea.fill('test');
      console.log('   ✅ Textarea accepts input');

      await copilotTextarea.clear();
      console.log('   ✅ Textarea can be cleared');

    } catch (error) {
      console.log(`   ❌ Textarea interaction error: ${error.message}`);
    }
  }

  // Return useful information for debugging
  console.log('\n💡 Next steps based on findings:');
  if (jsErrors.length > 0) {
    console.log('   - Fix JavaScript errors first');
  } else if (copilotErrors.length > 0) {
    console.log('   - Investigate CopilotKit configuration issues');
  } else {
    console.log('   - Look at CopilotTextarea event binding or props');
  }
});