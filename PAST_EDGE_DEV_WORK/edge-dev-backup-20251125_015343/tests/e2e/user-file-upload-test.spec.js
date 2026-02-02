const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('User file drag & drop test - backside para b copy.py', async ({ page }) => {
  console.log('🚀 Testing actual user file upload with fixed DIV-based CopilotTextarea...');

  const userFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

  // Check if the user's file exists
  try {
    if (!fs.existsSync(userFilePath)) {
      console.warn('❌ User file not found at:', userFilePath);
      console.log('📝 Skipping test - file does not exist');
      return;
    }

    const fileStats = fs.statSync(userFilePath);
    console.log('✅ User file found:', userFilePath);
    console.log('📊 File size:', fileStats.size, 'bytes');
  } catch (error) {
    console.error('❌ Error checking file:', error.message);
    return;
  }

  // Capture console logs and errors
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

  // Wait for React to render and CopilotKit to initialize - be more patient
  console.log('⏳ Waiting for CopilotTextarea to initialize...');

  // Try multiple selectors and wait longer due to React Fast Refresh
  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();

  try {
    // Wait up to 15 seconds for CopilotTextarea to appear (React Fast Refresh takes time)
    await copilotTextarea.waitFor({ timeout: 15000 });
    console.log('✅ CopilotTextarea found after waiting');
  } catch (error) {
    console.error('❌ CopilotTextarea still not found after 15 seconds');

    // Debug: Let's see what elements are actually available
    const allElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const copilotRelated = [];
      elements.forEach(el => {
        if (el.className && el.className.toString().toLowerCase().includes('copilot')) {
          copilotRelated.push({
            tagName: el.tagName,
            className: el.className,
            hasDataAttr: el.hasAttribute('data-copilot-textarea')
          });
        }
      });
      return copilotRelated;
    });

    console.log('🔍 Available copilot-related elements:', allElements);
    throw new Error('CopilotTextarea element not found - check console for available elements');
  }

  const textareaExists = await copilotTextarea.count() > 0;
  console.log('🔍 CopilotTextarea found:', textareaExists);

  // Get element information
  const elementInfo = await page.evaluate(() => {
    const element = document.querySelector('[data-copilot-textarea]') ||
                   document.querySelector('.copilot-textarea');
    if (!element) return null;

    return {
      tagName: element.tagName,
      className: element.className,
      hasValueProperty: 'value' in element,
      hasTextContentProperty: 'textContent' in element
    };
  });

  console.log('📝 Element info:', elementInfo);

  // Read the user's file content
  const fileContent = fs.readFileSync(userFilePath, 'utf8');
  console.log('📖 File content loaded, length:', fileContent.length, 'characters');
  console.log('🔍 First 100 characters:', fileContent.substring(0, 100) + '...');

  // Simulate the drag & drop by directly calling the event handlers
  console.log('🎯 Simulating drag & drop...');

  const uploadResult = await page.evaluate(async (fileData) => {
    try {
      // Find the CopilotTextarea using robust selector
      const copilotTextarea = document.querySelector('[data-copilot-textarea]') ||
                              document.querySelector('.copilot-textarea');
      if (!copilotTextarea) {
        return { success: false, error: 'CopilotTextarea not found' };
      }

      console.log('🎯 Found CopilotTextarea element:', copilotTextarea.tagName);

      // Create a mock file
      const file = new File([fileData.content], fileData.name, { type: 'text/plain' });

      // Create a mock DataTransfer object
      const dt = new DataTransfer();
      dt.items.add(file);

      // Create drag events
      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        dataTransfer: dt
      });

      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        dataTransfer: dt
      });

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer: dt
      });

      // Find the drop zone (parent container with event handlers)
      const dropZone = copilotTextarea.closest('[data-drag-over], .copilot-textarea') ||
                      copilotTextarea.parentElement;

      if (!dropZone) {
        return { success: false, error: 'No drop zone found' };
      }

      console.log('🎯 Found drop zone');

      // Simulate the drag sequence
      console.log('🎯 Triggering dragenter event');
      dropZone.dispatchEvent(dragEnterEvent);

      console.log('🎯 Triggering dragover event');
      dropZone.dispatchEvent(dragOverEvent);

      console.log('🎯 Triggering drop event');
      dropZone.dispatchEvent(dropEvent);

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if content was loaded
      const finalContent = copilotTextarea.tagName.toLowerCase() === 'textarea'
        ? copilotTextarea.value
        : copilotTextarea.textContent || copilotTextarea.innerText;

      return {
        success: true,
        contentLength: finalContent.length,
        contentPreview: finalContent.substring(0, 200),
        elementType: copilotTextarea.tagName
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }, {
    name: 'backside para b copy.py',
    content: fileContent
  });

  console.log('📊 Upload result:', uploadResult);

  if (uploadResult.success) {
    console.log('✅ File successfully uploaded via drag & drop!');
    console.log('📝 Content length in textarea:', uploadResult.contentLength);
    console.log('🔍 Content preview:', uploadResult.contentPreview);
    console.log('🏷️  Element type:', uploadResult.elementType);

    // Verify that content was actually loaded
    expect(uploadResult.contentLength).toBeGreaterThan(50);
    expect(uploadResult.contentPreview).toContain('backside para b copy.py');

    // Additional verification - check if the content includes expected patterns
    const hasExpectedContent = uploadResult.contentPreview.includes('format and optimize') ||
                              uploadResult.contentPreview.includes('format_existing_scan_code');

    if (hasExpectedContent) {
      console.log('✅ Content includes expected formatting prompt');
    } else {
      console.warn('⚠️  Content may not have expected formatting');
    }

  } else {
    console.error('❌ File upload failed:', uploadResult.error);
    if (uploadResult.stack) {
      console.error('📋 Stack trace:', uploadResult.stack);
    }
    throw new Error(`Drag & drop failed: ${uploadResult.error}`);
  }

  // Final verification
  console.log('📊 Test Summary:');
  console.log(`   Console messages: ${consoleMessages.length}`);
  console.log(`   JavaScript errors: ${jsErrors.length}`);
  console.log(`   Upload successful: ${uploadResult.success}`);

  if (jsErrors.length > 0) {
    console.log('🚨 JavaScript Errors Found:');
    jsErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }

  console.log('🎉 Test completed successfully!');
});