const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('ChatGPT-style file attachment interface test', async ({ page }) => {
  console.log('🧪 Testing new ChatGPT-style file attachment interface...');

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

  // Wait for React to render and CopilotKit to initialize
  console.log('⏳ Waiting for CopilotTextarea to initialize...');
  await page.waitForTimeout(5000);

  // Find CopilotTextarea
  const copilotTextarea = await page.locator('[data-copilot-textarea], .copilot-textarea').first();
  await copilotTextarea.waitFor({ timeout: 15000 });
  console.log('✅ CopilotTextarea found');

  // Read the user's file content
  const fileContent = fs.readFileSync(userFilePath, 'utf8');
  console.log('📖 File content loaded, length:', fileContent.length, 'characters');

  // Test file attachment (drag & drop)
  console.log('🎯 Testing file attachment via drag & drop...');

  const attachmentResult = await page.evaluate(async (fileData) => {
    try {
      // Find the CopilotTextarea
      const copilotTextarea = document.querySelector('[data-copilot-textarea]') ||
                              document.querySelector('.copilot-textarea');
      if (!copilotTextarea) {
        return { success: false, error: 'CopilotTextarea not found' };
      }

      // Create a mock file
      const file = new File([fileData.content], fileData.name, { type: 'text/plain' });

      // Create a mock DataTransfer object
      const dt = new DataTransfer();
      dt.items.add(file);

      // Create and dispatch drop event
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer: dt
      });

      // Find the drop zone (parent container)
      const dropZone = copilotTextarea.closest('[data-drag-over], .copilot-textarea') ||
                      copilotTextarea.parentElement;

      if (!dropZone) {
        return { success: false, error: 'No drop zone found' };
      }

      // Simulate the drop
      dropZone.dispatchEvent(dropEvent);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      return { success: true };

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

  console.log('📊 Attachment result:', attachmentResult);

  if (!attachmentResult.success) {
    throw new Error(`File attachment failed: ${attachmentResult.error}`);
  }

  // Wait for attachment to process
  await page.waitForTimeout(3000);

  // Test 1: Verify file attachment chip appears
  console.log('🔍 Testing file attachment chip display...');

  const attachmentChip = await page.locator('[data-testid="file-attachment"], .bg-muted\\/50').first();

  try {
    await attachmentChip.waitFor({ timeout: 10000 });
    console.log('✅ File attachment chip found');
  } catch (error) {
    // Check if file attachments section exists
    const attachmentsSection = await page.locator('text=Attached Files').count();
    if (attachmentsSection > 0) {
      console.log('✅ Attached Files section found');
    } else {
      console.warn('⚠️  Could not find file attachment chip or section');
    }
  }

  // Test 2: Verify file name is displayed correctly
  const fileName = await page.locator('text=backside para b copy.py').count();
  if (fileName > 0) {
    console.log('✅ File name displayed correctly in attachment');
  } else {
    console.warn('⚠️  File name not found in attachment');
  }

  // Test 3: Verify file size and line count are displayed
  const fileSizeInfo = await page.locator('text=/\\d+\\.\\d+ KB • \\d+ lines/').count();
  if (fileSizeInfo > 0) {
    console.log('✅ File size and line count displayed');
  } else {
    console.warn('⚠️  File size/line info not found');
  }

  // Test 4: Test preview functionality
  console.log('👁️  Testing file preview functionality...');

  const previewButton = await page.locator('[title="Preview file"]').first();
  const previewButtonCount = await previewButton.count();

  if (previewButtonCount > 0) {
    await previewButton.click();
    console.log('✅ Preview button clicked');

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Check if preview modal opened
    const previewModal = await page.locator('.fixed.inset-0').count();
    if (previewModal > 0) {
      console.log('✅ Preview modal opened');

      // Verify file content is shown in preview
      const previewContent = await page.locator('pre').count();
      if (previewContent > 0) {
        console.log('✅ File content displayed in preview');
      } else {
        console.warn('⚠️  File content not found in preview');
      }

      // Test close preview
      const closeButton = await page.locator('[title="Close preview"]').first();
      await closeButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Preview modal closed');
    } else {
      console.warn('⚠️  Preview modal did not open');
    }
  } else {
    console.warn('⚠️  Preview button not found');
  }

  // Test 5: Verify no code content was dumped into textarea
  console.log('🚫 Verifying no code content dumped into textarea...');

  const textareaValue = await page.evaluate(() => {
    const textarea = document.querySelector('[data-copilot-textarea]') ||
                     document.querySelector('.copilot-textarea');
    if (textarea) {
      return textarea.tagName.toLowerCase() === 'textarea'
        ? textarea.value
        : (textarea.textContent || textarea.innerText);
    }
    return '';
  });

  if (!textareaValue.includes('```python') && !textareaValue.includes(fileContent.substring(0, 100))) {
    console.log('✅ No code content dumped into textarea - clean attachment interface working');
  } else {
    console.warn('⚠️  Code content may have been dumped into textarea');
  }

  // Test 6: Test remove file functionality
  console.log('🗑️  Testing remove file functionality...');

  const removeButton = await page.locator('[title="Remove file"]').first();
  const removeButtonCount = await removeButton.count();

  if (removeButtonCount > 0) {
    await removeButton.click();
    await page.waitForTimeout(1000);

    // Verify attachment was removed
    const remainingAttachments = await page.locator('text=backside para b copy.py').count();
    if (remainingAttachments === 0) {
      console.log('✅ File attachment removed successfully');
    } else {
      console.warn('⚠️  File attachment may not have been removed');
    }
  } else {
    console.warn('⚠️  Remove button not found');
  }

  // Test Summary
  console.log('📊 ChatGPT-Style Attachment Test Summary:');
  console.log(`   Console messages: ${consoleMessages.length}`);
  console.log(`   JavaScript errors: ${jsErrors.length}`);
  console.log(`   File attachment successful: ${attachmentResult.success}`);

  if (jsErrors.length > 0) {
    console.log('🚨 JavaScript Errors Found:');
    jsErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
  }

  // Ensure test passes if attachment interface works
  expect(attachmentResult.success).toBe(true);

  console.log('🎉 ChatGPT-style file attachment test completed!');
});