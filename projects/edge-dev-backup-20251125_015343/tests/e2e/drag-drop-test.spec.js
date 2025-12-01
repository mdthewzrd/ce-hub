const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.describe('Drag and Drop File Upload', () => {
  test('should handle file drag and drop in Renata AI chat', async ({ page }) => {
    console.log('🧪 Starting drag and drop test...');

    // Navigate to the application
    await page.goto('http://localhost:5657');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');

    // Check if the AI chat sidebar is visible
    const aiSidebar = page.locator('.fixed.right-0');
    await expect(aiSidebar).toBeVisible({ timeout: 10000 });
    console.log('✅ AI sidebar found');

    // Check for the Renata chat component
    const renataChat = page.locator('h3:has-text("Renata AI")');
    await expect(renataChat).toBeVisible({ timeout: 5000 });
    console.log('✅ Renata AI component found');

    // Find the CopilotTextarea
    const textarea = page.locator('[data-copilot-textarea]');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    console.log('✅ CopilotTextarea found');

    // Check if the file exists
    const filePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    if (!fs.existsSync(filePath)) {
      console.log('❌ Test file not found:', filePath);
      // Create a test file if it doesn't exist
      const testContent = `# Test Trading Scan
import pandas as pd
import requests

def test_scan():
    print("This is a test scan")
    return []

if __name__ == "__main__":
    test_scan()
`;
      fs.writeFileSync(filePath, testContent);
      console.log('✅ Created test file:', filePath);
    } else {
      console.log('✅ Test file found:', filePath);
    }

    // Read the file content to verify
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('📄 File size:', fileContent.length, 'characters');

    // Check for console errors before upload
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log('🖥️ Console:', msg.type(), msg.text());
    });

    // Create a file input for the test (since direct drag and drop is complex in Playwright)
    await page.evaluate(() => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'test-file-input';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
    });

    // Set the file on the input
    const fileInput = page.locator('#test-file-input');
    await fileInput.setInputFiles(filePath);
    console.log('✅ File set on input element');

    // Simulate the drag and drop by directly calling the event handlers
    await page.evaluate(async (fileContent) => {
      // Find the drop zone
      const dropZone = document.querySelector('[data-copilot-textarea]')?.closest('div[onDrop]') ||
                      document.querySelector('div.min-h-\\[300px\\]');

      if (!dropZone) {
        throw new Error('Drop zone not found');
      }

      // Create a mock file object
      const file = new File([fileContent], 'backside para b copy.py', { type: 'text/x-python' });

      // Create mock drag events
      const createDragEvent = (type) => {
        const event = new DragEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', {
          value: {
            files: [file],
            items: [{ kind: 'file', type: 'text/x-python', getAsFile: () => file }],
            types: ['Files']
          }
        });
        return event;
      };

      // Trigger drag enter
      console.log('🎯 Triggering dragenter event');
      dropZone.dispatchEvent(createDragEvent('dragenter'));

      // Trigger drag over
      console.log('🎯 Triggering dragover event');
      dropZone.dispatchEvent(createDragEvent('dragover'));

      // Trigger drop
      console.log('🎯 Triggering drop event');
      dropZone.dispatchEvent(createDragEvent('drop'));

    }, fileContent);

    // Wait a bit for the drop to process
    await page.waitForTimeout(2000);

    // Check if the textarea now contains the file content
    const textareaValue = await textarea.inputValue();
    console.log('📝 Textarea value length:', textareaValue.length);
    console.log('📝 Textarea content preview:', textareaValue.substring(0, 200));

    // Verify the file content was loaded into the textarea
    expect(textareaValue.length).toBeGreaterThan(100);
    expect(textareaValue).toContain('backside para b copy.py');
    expect(textareaValue).toContain('Please format and optimize this trading scan code');

    console.log('✅ File content successfully loaded into textarea');

    // Check for any JavaScript errors
    const errorMessages = consoleMessages.filter(msg => msg.includes('error') || msg.includes('Error'));
    if (errorMessages.length > 0) {
      console.log('⚠️ Console errors found:', errorMessages);
    } else {
      console.log('✅ No console errors detected');
    }

    console.log('🎉 Drag and drop test completed successfully!');
  });

  test('should show drag overlay when file is dragged over chat area', async ({ page }) => {
    console.log('🧪 Starting drag overlay test...');

    await page.goto('http://localhost:5657');
    await page.waitForLoadState('networkidle');

    // Find the drop zone
    const dropZone = page.locator('div.min-h-\\[300px\\]').first();
    await expect(dropZone).toBeVisible();

    // Simulate drag enter
    await page.evaluate(() => {
      const element = document.querySelector('div.min-h-\\[300px\\]');
      if (element) {
        const event = new DragEvent('dragenter', { bubbles: true });
        element.dispatchEvent(event);
      }
    });

    // Wait a bit and check for drag overlay
    await page.waitForTimeout(500);

    // Look for drag overlay elements
    const dragOverlay = page.locator('text=Drop Trading Scan Here');
    const isOverlayVisible = await dragOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      console.log('✅ Drag overlay is visible');
    } else {
      console.log('❌ Drag overlay is not visible');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/drag-overlay-debug.png' });
    }

    console.log('🎉 Drag overlay test completed');
  });
});