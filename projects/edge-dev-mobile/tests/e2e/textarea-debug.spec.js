const { test, expect } = require('@playwright/test');

test('Debug textarea elements in Renata chat', async ({ page }) => {
  console.log('🔍 Starting textarea debug test...');

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');

  // Wait for Renata AI component
  const renataChat = page.locator('h3:has-text("Renata AI")');
  await expect(renataChat).toBeVisible({ timeout: 10000 });
  console.log('✅ Renata AI component found');

  // Log all textarea elements on the page
  const textareas = await page.locator('textarea').all();
  console.log(`📝 Found ${textareas.length} textarea elements`);

  for (let i = 0; i < textareas.length; i++) {
    const textarea = textareas[i];
    const id = await textarea.getAttribute('id').catch(() => 'none');
    const className = await textarea.getAttribute('class').catch(() => 'none');
    const placeholder = await textarea.getAttribute('placeholder').catch(() => 'none');
    const dataAttributes = await page.evaluate((element) => {
      const attrs = {};
      for (let attr of element.attributes) {
        if (attr.name.startsWith('data-')) {
          attrs[attr.name] = attr.value;
        }
      }
      return attrs;
    }, textarea);

    console.log(`  Textarea ${i + 1}:`);
    console.log(`    ID: ${id}`);
    console.log(`    Class: ${className}`);
    console.log(`    Placeholder: ${placeholder}`);
    console.log(`    Data attributes:`, dataAttributes);
  }

  // Check for any elements with data-copilot attributes
  const copilotElements = await page.locator('[data-copilot]').all();
  console.log(`🤖 Found ${copilotElements.length} elements with data-copilot attributes`);

  // Check for CopilotTextarea specifically
  const copilotTextareas = await page.locator('[data-copilot-textarea]').all();
  console.log(`📮 Found ${copilotTextareas.length} CopilotTextarea elements`);

  // Check console for any React/CopilotKit errors
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  await page.waitForTimeout(2000);

  console.log('🖥️ Console logs:');
  logs.forEach(log => console.log('  ', log));

  // Take a screenshot of the current state
  await page.screenshot({ path: 'test-results/textarea-debug.png', fullPage: true });
  console.log('📸 Screenshot saved: test-results/textarea-debug.png');
});