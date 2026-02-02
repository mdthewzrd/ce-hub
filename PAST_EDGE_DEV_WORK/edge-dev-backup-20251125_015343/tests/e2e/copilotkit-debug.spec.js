const { test, expect } = require('@playwright/test');

test('Comprehensive CopilotKit debugging', async ({ page }) => {
  console.log('🔧 Starting comprehensive CopilotKit debug...');

  // Capture all console messages and errors
  const consoleMessages = [];
  const jsErrors = [];

  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`🖥️  ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    jsErrors.push(err.message);
    console.log(`❌ JavaScript Error: ${err.message}`);
  });

  // Navigate to the application
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');

  // Wait for React to render
  await page.waitForTimeout(3000);

  // Check if CopilotKit provider is mounted
  const copilotProvider = await page.evaluate(() => {
    // Look for CopilotKit provider in React dev tools
    return window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'React DevTools detected' : 'No React DevTools';
  });
  console.log(`🔍 React status: ${copilotProvider}`);

  // Check for CopilotKit related JavaScript objects
  const copilotObjects = await page.evaluate(() => {
    const objects = {};

    // Check for common CopilotKit globals
    if (typeof window.CopilotKit !== 'undefined') objects.CopilotKit = 'found';
    if (typeof window.__COPILOT__ !== 'undefined') objects.__COPILOT__ = 'found';

    // Check for React components
    const scripts = Array.from(document.scripts).map(s => s.src).filter(src => src.includes('copilot'));
    objects.copilotScripts = scripts.length;

    return objects;
  });
  console.log('🤖 CopilotKit objects:', copilotObjects);

  // Check for the API endpoint
  try {
    const apiResponse = await page.goto('http://localhost:5657/api/copilotkit');
    console.log(`🌐 API endpoint status: ${apiResponse.status()}`);

    if (apiResponse.status() !== 200) {
      const responseText = await apiResponse.text();
      console.log(`📄 API response: ${responseText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`❌ API endpoint error: ${error.message}`);
  }

  // Navigate back to main page
  await page.goto('http://localhost:5657');
  await page.waitForLoadState('networkidle');

  // Check DOM structure around Renata AI
  const renataStructure = await page.evaluate(() => {
    const renataElement = document.querySelector('h3:has-text("Renata AI"), h3[text*="Renata"], [data-testid*="renata"]');
    if (!renataElement) return 'Renata element not found';

    const parent = renataElement.closest('div');
    if (!parent) return 'No parent container found';

    return {
      parentClasses: parent.className,
      childrenCount: parent.children.length,
      innerHTML: parent.innerHTML.substring(0, 500)
    };
  });
  console.log('🏗️  Renata structure:', renataStructure);

  // Look for any textarea elements
  const allTextareas = await page.locator('textarea').all();
  console.log(`📝 Total textarea elements: ${allTextareas.length}`);

  for (let i = 0; i < allTextareas.length; i++) {
    const textarea = allTextareas[i];
    const attrs = await page.evaluate((el) => {
      const attributes = {};
      for (let attr of el.attributes) {
        attributes[attr.name] = attr.value;
      }
      return attributes;
    }, textarea);
    console.log(`  Textarea ${i + 1}:`, attrs);
  }

  // Check for any elements with 'copilot' in their attributes or classes
  const copilotElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const matches = [];

    elements.forEach(el => {
      const classNames = el.className ? el.className.toString() : '';
      const dataAttrs = Array.from(el.attributes).filter(attr => attr.name.startsWith('data-'));

      if (classNames.toLowerCase().includes('copilot') ||
          dataAttrs.some(attr => attr.name.includes('copilot') || attr.value.includes('copilot'))) {
        matches.push({
          tagName: el.tagName,
          className: classNames,
          dataAttrs: dataAttrs.map(attr => `${attr.name}="${attr.value}"`).join(', ')
        });
      }
    });

    return matches;
  });
  console.log(`🤖 Elements with 'copilot': ${copilotElements.length}`, copilotElements);

  // Summary
  console.log('📊 Debug Summary:');
  console.log(`   Console messages: ${consoleMessages.length}`);
  console.log(`   JavaScript errors: ${jsErrors.length}`);
  console.log(`   Textarea elements: ${allTextareas.length}`);
  console.log(`   Copilot elements: ${copilotElements.length}`);

  if (jsErrors.length > 0) {
    console.log('🚨 JavaScript Errors Found:');
    jsErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }

  // Take screenshot for visual debugging
  await page.screenshot({ path: 'test-results/copilotkit-debug.png', fullPage: true });
  console.log('📸 Screenshot saved: test-results/copilotkit-debug.png');
});